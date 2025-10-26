use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};
use spl_token::state::Account as TokenAccount;

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Constants
const USDC_DECIMALS: u8 = 6; // USDC has 6 decimals
const MAX_BUY_IN: u64 = 5_000_000; // $5 in USDC (5 * 10^6)
const SMALL_BLIND: u64 = 25_000; // $0.025 USDC
const BIG_BLIND: u64 = 50_000; // $0.05 USDC
const POT_SEED: &[u8] = b"poker_pot";

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = PokerInstruction::try_from_slice(instruction_data)?;

    match instruction {
        PokerInstruction::InitializeGame { max_players } => {
            msg!("Instruction: InitializeGame");
            initialize_game(program_id, accounts, max_players)
        }
        PokerInstruction::BuyIn { amount } => {
            msg!("Instruction: BuyIn");
            buy_in(program_id, accounts, amount)
        }
        PokerInstruction::StartRound => {
            msg!("Instruction: StartRound");
            start_round(program_id, accounts)
        }
        PokerInstruction::Fold => {
            msg!("Instruction: Fold");
            fold(program_id, accounts)
        }
        PokerInstruction::Call => {
            msg!("Instruction: Call");
            call(program_id, accounts)
        }
        PokerInstruction::Raise { amount } => {
            msg!("Instruction: Raise");
            raise(program_id, accounts, amount)
        }
        PokerInstruction::EndRound { winner_index } => {
            msg!("Instruction: EndRound");
            end_round(program_id, accounts, winner_index)
        }
        PokerInstruction::CashOut => {
            msg!("Instruction: CashOut");
            cash_out(program_id, accounts)
        }
    }
}

// Instruction enum
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum PokerInstruction {
    /// Initialize a new poker game
    /// Accounts expected:
    /// 0. `[writable, signer]` Game authority (house)
    /// 1. `[writable]` Game state account
    /// 2. `[]` USDC mint
    /// 3. `[writable]` Pot token account (PDA)
    /// 4. `[]` Token program
    /// 5. `[]` System program
    /// 6. `[]` Rent sysvar
    InitializeGame { max_players: u8 },

    /// Buy into the game with USDC (max $5)
    /// Accounts expected:
    /// 0. `[writable, signer]` Player account
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Player's USDC token account
    /// 3. `[writable]` Pot USDC token account (PDA)
    /// 4. `[]` Token program
    BuyIn { amount: u64 },

    /// Start a new round (posts blinds automatically)
    /// Accounts expected:
    /// 0. `[writable, signer]` Dealer/authority
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Small blind player USDC account
    /// 3. `[writable]` Big blind player USDC account
    /// 4. `[writable]` Pot USDC token account
    /// 5. `[]` Token program
    StartRound,

    /// Fold current hand
    /// Accounts expected:
    /// 0. `[writable, signer]` Player account
    /// 1. `[writable]` Game state account
    Fold,

    /// Call current bet
    /// Accounts expected:
    /// 0. `[writable, signer]` Player account
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Player's USDC token account
    /// 3. `[writable]` Pot USDC token account
    /// 4. `[]` Token program
    Call,

    /// Raise bet
    /// Accounts expected:
    /// 0. `[writable, signer]` Player account
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Player's USDC token account
    /// 3. `[writable]` Pot USDC token account
    /// 4. `[]` Token program
    Raise { amount: u64 },

    /// End round and distribute pot to winner
    /// Accounts expected:
    /// 0. `[signer]` Game authority
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Pot USDC token account (PDA)
    /// 3. `[writable]` Winner's USDC token account
    /// 4. `[]` Pot PDA authority
    /// 5. `[]` Token program
    EndRound { winner_index: u8 },

    /// Cash out chips to USDC
    /// Accounts expected:
    /// 0. `[writable, signer]` Player account
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Pot USDC token account (PDA)
    /// 3. `[writable]` Player's USDC token account
    /// 4. `[]` Pot PDA authority
    /// 5. `[]` Token program
    CashOut,
}

// Game state structure
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GameState {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub pot_token_account: Pubkey,
    pub pot_bump: u8,
    pub max_players: u8,
    pub current_players: u8,
    pub players: Vec<Player>,
    pub current_bet: u64,
    pub pot_total: u64,
    pub game_stage: GameStage,
    pub current_player_turn: u8,
    pub dealer_index: u8,
    pub small_blind: u64,
    pub big_blind: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Player {
    pub pubkey: Pubkey,
    pub name: String,
    pub chips: u64, // In USDC micro-units (6 decimals)
    pub current_bet: u64,
    pub is_active: bool,
    pub has_folded: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub enum GameStage {
    Waiting,
    PreFlop,
    Flop,
    Turn,
    River,
    Showdown,
}

// Initialize game
fn initialize_game(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    max_players: u8,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let authority = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let usdc_mint = next_account_info(accounts_iter)?;
    let pot_token_account = next_account_info(accounts_iter)?;
    let _token_program = next_account_info(accounts_iter)?;
    let _system_program = next_account_info(accounts_iter)?;
    let _rent = next_account_info(accounts_iter)?;

    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Derive pot PDA
    let (pot_pda, pot_bump) = Pubkey::find_program_address(
        &[POT_SEED, game_state_account.key.as_ref()],
        program_id,
    );

    if pot_pda != *pot_token_account.key {
        msg!("Invalid pot token account");
        return Err(ProgramError::InvalidAccountData);
    }

    let game_state = GameState {
        authority: *authority.key,
        usdc_mint: *usdc_mint.key,
        pot_token_account: *pot_token_account.key,
        pot_bump,
        max_players,
        current_players: 0,
        players: Vec::new(),
        current_bet: 0,
        pot_total: 0,
        game_stage: GameStage::Waiting,
        current_player_turn: 0,
        dealer_index: 0,
        small_blind: SMALL_BLIND,
        big_blind: BIG_BLIND,
    };

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    msg!(
        "Game initialized with max {} players, blinds: {}/{} USDC",
        max_players,
        SMALL_BLIND as f64 / 1_000_000.0,
        BIG_BLIND as f64 / 1_000_000.0
    );
    Ok(())
}

// Buy in to game
fn buy_in(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player_account = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let player_token_account = next_account_info(accounts_iter)?;
    let pot_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !player_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Validate buy-in amount (max $5)
    if amount > MAX_BUY_IN {
        msg!("Buy-in exceeds maximum of $5 USDC");
        return Err(ProgramError::InvalidArgument);
    }

    if amount < BIG_BLIND * 10 {
        msg!("Buy-in must be at least 10x the big blind");
        return Err(ProgramError::InvalidArgument);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    // Check if game is full
    if game_state.current_players >= game_state.max_players {
        msg!("Game is full");
        return Err(ProgramError::Custom(1));
    }

    // Check if player already joined
    let player_index = game_state
        .players
        .iter()
        .position(|p| p.pubkey == *player_account.key);

    if let Some(idx) = player_index {
        // Player exists, add to their chips
        game_state.players[idx].chips += amount;
        msg!("Player topped up {} USDC. New balance: {} USDC",
            amount as f64 / 1_000_000.0,
            game_state.players[idx].chips as f64 / 1_000_000.0
        );
    } else {
        // New player
        let player_name = format!("Player_{}", game_state.current_players + 1);
        let new_player = Player {
            pubkey: *player_account.key,
            name: player_name.clone(),
            chips: amount,
            current_bet: 0,
            is_active: true,
            has_folded: false,
        };

        game_state.players.push(new_player);
        game_state.current_players += 1;

        msg!("Player {} bought in for {} USDC", player_name, amount as f64 / 1_000_000.0);
    }

    // Transfer USDC from player to pot
    let transfer_ix = spl_token::instruction::transfer(
        token_program.key,
        player_token_account.key,
        pot_token_account.key,
        player_account.key,
        &[],
        amount,
    )?;

    invoke(
        &transfer_ix,
        &[
            player_token_account.clone(),
            pot_token_account.clone(),
            player_account.clone(),
            token_program.clone(),
        ],
    )?;

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// Start round with automatic blinds
fn start_round(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let authority = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let small_blind_token_account = next_account_info(accounts_iter)?;
    let big_blind_token_account = next_account_info(accounts_iter)?;
    let pot_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    if game_state.authority != *authority.key {
        return Err(ProgramError::Custom(4)); // Not authorized
    }

    if game_state.current_players < 2 {
        msg!("Need at least 2 players to start");
        return Err(ProgramError::Custom(8));
    }

    // Calculate blind positions (relative to dealer)
    let small_blind_idx = (game_state.dealer_index + 1) % game_state.current_players;
    let big_blind_idx = (game_state.dealer_index + 2) % game_state.current_players;

    let small_blind_player = &mut game_state.players[small_blind_idx as usize];
    let big_blind_player = &mut game_state.players[big_blind_idx as usize];

    // Post small blind
    if small_blind_player.chips < game_state.small_blind {
        msg!("Small blind player doesn't have enough chips");
        return Err(ProgramError::InsufficientFunds);
    }

    // Post big blind
    if big_blind_player.chips < game_state.big_blind {
        msg!("Big blind player doesn't have enough chips");
        return Err(ProgramError::InsufficientFunds);
    }

    // Update player states
    small_blind_player.chips -= game_state.small_blind;
    small_blind_player.current_bet = game_state.small_blind;

    big_blind_player.chips -= game_state.big_blind;
    big_blind_player.current_bet = game_state.big_blind;

    game_state.current_bet = game_state.big_blind;
    game_state.pot_total = game_state.small_blind + game_state.big_blind;
    game_state.game_stage = GameStage::PreFlop;
    game_state.current_player_turn = (big_blind_idx + 1) % game_state.current_players;

    // Reset folded status
    for player in &mut game_state.players {
        player.has_folded = false;
    }

    msg!(
        "Round started. Blinds posted: SB={} USDC, BB={} USDC",
        game_state.small_blind as f64 / 1_000_000.0,
        game_state.big_blind as f64 / 1_000_000.0
    );

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// Fold
fn fold(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player_account = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;

    if !player_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    let player_index = game_state
        .players
        .iter()
        .position(|p| p.pubkey == *player_account.key)
        .ok_or(ProgramError::Custom(3))?;

    game_state.players[player_index].has_folded = true;
    game_state.players[player_index].is_active = false;

    msg!("Player {} folded", game_state.players[player_index].name);

    // Advance to next player
    game_state.current_player_turn = (game_state.current_player_turn + 1) % game_state.current_players;

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// Call
fn call(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player_account = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let player_token_account = next_account_info(accounts_iter)?;
    let pot_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !player_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    let player_index = game_state
        .players
        .iter()
        .position(|p| p.pubkey == *player_account.key)
        .ok_or(ProgramError::Custom(3))?;

    let call_amount = game_state.current_bet - game_state.players[player_index].current_bet;

    if call_amount > game_state.players[player_index].chips {
        msg!("Insufficient chips to call");
        return Err(ProgramError::InsufficientFunds);
    }

    if call_amount > 0 {
        // Deduct from player chips
        game_state.players[player_index].chips -= call_amount;
        game_state.players[player_index].current_bet += call_amount;
        game_state.pot_total += call_amount;

        msg!(
            "Player {} called with {} USDC",
            game_state.players[player_index].name,
            call_amount as f64 / 1_000_000.0
        );
    }

    // Advance to next player
    game_state.current_player_turn = (game_state.current_player_turn + 1) % game_state.current_players;

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// Raise
fn raise(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    raise_amount: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player_account = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let player_token_account = next_account_info(accounts_iter)?;
    let pot_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !player_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    let player_index = game_state
        .players
        .iter()
        .position(|p| p.pubkey == *player_account.key)
        .ok_or(ProgramError::Custom(3))?;

    let call_amount = game_state.current_bet - game_state.players[player_index].current_bet;
    let total_amount = call_amount + raise_amount;

    if total_amount > game_state.players[player_index].chips {
        msg!("Insufficient chips to raise");
        return Err(ProgramError::InsufficientFunds);
    }

    // Minimum raise is the big blind
    if raise_amount < game_state.big_blind {
        msg!("Raise amount must be at least the big blind");
        return Err(ProgramError::InvalidArgument);
    }

    // Deduct from player chips
    game_state.players[player_index].chips -= total_amount;
    game_state.players[player_index].current_bet += total_amount;
    game_state.current_bet += raise_amount;
    game_state.pot_total += total_amount;

    msg!(
        "Player {} raised by {} USDC (total bet: {} USDC)",
        game_state.players[player_index].name,
        raise_amount as f64 / 1_000_000.0,
        game_state.current_bet as f64 / 1_000_000.0
    );

    // Advance to next player
    game_state.current_player_turn = (game_state.current_player_turn + 1) % game_state.current_players;

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// End round and distribute pot
fn end_round(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    winner_index: u8,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let authority = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let pot_token_account = next_account_info(accounts_iter)?;
    let winner_token_account = next_account_info(accounts_iter)?;
    let pot_pda = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    if game_state.authority != *authority.key {
        return Err(ProgramError::Custom(4));
    }

    let winner = &mut game_state.players[winner_index as usize];

    // Get pot balance
    let pot_account_data = TokenAccount::unpack(&pot_token_account.data.borrow())?;
    let pot_balance = pot_account_data.amount;

    if pot_balance > 0 {
        // Transfer pot to winner using PDA signature
        let game_state_key = game_state_account.key;
        let seeds = &[
            POT_SEED,
            game_state_key.as_ref(),
            &[game_state.pot_bump],
        ];

        let transfer_ix = spl_token::instruction::transfer(
            token_program.key,
            pot_token_account.key,
            winner_token_account.key,
            pot_pda.key,
            &[],
            pot_balance,
        )?;

        invoke_signed(
            &transfer_ix,
            &[
                pot_token_account.clone(),
                winner_token_account.clone(),
                pot_pda.clone(),
                token_program.clone(),
            ],
            &[seeds],
        )?;

        // Credit winner's chips
        winner.chips += pot_balance;

        msg!(
            "Player {} won {} USDC. New balance: {} USDC",
            winner.name,
            pot_balance as f64 / 1_000_000.0,
            winner.chips as f64 / 1_000_000.0
        );
    }

    // Reset game state for next round
    for player in &mut game_state.players {
        player.current_bet = 0;
        player.has_folded = false;
        player.is_active = true;
    }
    game_state.current_bet = 0;
    game_state.pot_total = 0;
    game_state.game_stage = GameStage::Waiting;
    game_state.dealer_index = (game_state.dealer_index + 1) % game_state.current_players;

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// Cash out chips to USDC
fn cash_out(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player_account = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let pot_token_account = next_account_info(accounts_iter)?;
    let player_token_account = next_account_info(accounts_iter)?;
    let pot_pda = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !player_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    // Can only cash out during waiting stage
    if game_state.game_stage != GameStage::Waiting {
        msg!("Can only cash out when not in a hand");
        return Err(ProgramError::Custom(9));
    }

    let player_index = game_state
        .players
        .iter()
        .position(|p| p.pubkey == *player_account.key)
        .ok_or(ProgramError::Custom(3))?;

    let cash_out_amount = game_state.players[player_index].chips;

    if cash_out_amount == 0 {
        msg!("No chips to cash out");
        return Err(ProgramError::InsufficientFunds);
    }

    // Transfer USDC from pot to player using PDA signature
    let game_state_key = game_state_account.key;
    let seeds = &[
        POT_SEED,
        game_state_key.as_ref(),
        &[game_state.pot_bump],
    ];

    let transfer_ix = spl_token::instruction::transfer(
        token_program.key,
        pot_token_account.key,
        player_token_account.key,
        pot_pda.key,
        &[],
        cash_out_amount,
    )?;

    invoke_signed(
        &transfer_ix,
        &[
            pot_token_account.clone(),
            player_token_account.clone(),
            pot_pda.clone(),
            token_program.clone(),
        ],
        &[seeds],
    )?;

    msg!(
        "Player {} cashed out {} USDC",
        game_state.players[player_index].name,
        cash_out_amount as f64 / 1_000_000.0
    );

    // Remove player from game
    game_state.players.remove(player_index);
    game_state.current_players -= 1;

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}
