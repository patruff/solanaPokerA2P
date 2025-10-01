use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

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
        PokerInstruction::JoinGame { player_name } => {
            msg!("Instruction: JoinGame");
            join_game(program_id, accounts, player_name)
        }
        PokerInstruction::PlaceBet { amount } => {
            msg!("Instruction: PlaceBet");
            place_bet(program_id, accounts, amount)
        }
        PokerInstruction::DealCards => {
            msg!("Instruction: DealCards");
            deal_cards(program_id, accounts)
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
        PokerInstruction::SpectatorContribute { amount } => {
            msg!("Instruction: SpectatorContribute");
            spectator_contribute(program_id, accounts, amount)
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
    /// 2. `[]` System program
    InitializeGame { max_players: u8 },

    /// Join an existing game
    /// Accounts expected:
    /// 0. `[writable, signer]` Player account
    /// 1. `[writable]` Game state account
    JoinGame { player_name: String },

    /// Place a bet
    /// Accounts expected:
    /// 0. `[writable, signer]` Player account
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Pot account (PDA)
    /// 3. `[]` System program
    PlaceBet { amount: u64 },

    /// Deal cards (authority only)
    /// Accounts expected:
    /// 0. `[signer]` Game authority
    /// 1. `[writable]` Game state account
    DealCards,

    /// Fold current hand
    /// Accounts expected:
    /// 0. `[writable, signer]` Player account
    /// 1. `[writable]` Game state account
    Fold,

    /// Call current bet
    /// Accounts expected:
    /// 0. `[writable, signer]` Player account
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Pot account (PDA)
    /// 3. `[]` System program
    Call,

    /// Raise bet
    /// Accounts expected:
    /// 0. `[writable, signer]` Player account
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Pot account (PDA)
    /// 3. `[]` System program
    Raise { amount: u64 },

    /// End round and distribute pot
    /// Accounts expected:
    /// 0. `[signer]` Game authority
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Pot account (PDA)
    /// 3. `[writable]` Winner account
    /// 4. `[]` System program
    EndRound { winner_index: u8 },

    /// Spectator contributes to pot
    /// Accounts expected:
    /// 0. `[writable, signer]` Spectator account
    /// 1. `[writable]` Game state account
    /// 2. `[writable]` Pot account (PDA)
    /// 3. `[]` System program
    SpectatorContribute { amount: u64 },
}

// Game state structure
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GameState {
    pub authority: Pubkey,
    pub max_players: u8,
    pub current_players: u8,
    pub players: Vec<Player>,
    pub current_bet: u64,
    pub pot_total: u64,
    pub game_stage: GameStage,
    pub current_player_turn: u8,
    pub dealer_index: u8,
    pub spectator: Option<Spectator>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Player {
    pub pubkey: Pubkey,
    pub name: String,
    pub chips: u64,
    pub current_bet: u64,
    pub is_active: bool,
    pub has_folded: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Spectator {
    pub pubkey: Pubkey,
    pub name: String,
    pub total_contributed: u64,
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

    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let game_state = GameState {
        authority: *authority.key,
        max_players,
        current_players: 0,
        players: Vec::new(),
        current_bet: 0,
        pot_total: 0,
        game_stage: GameStage::Waiting,
        current_player_turn: 0,
        dealer_index: 0,
        spectator: None,
    };

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    msg!("Game initialized with max {} players", max_players);
    Ok(())
}

// Join game
fn join_game(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    player_name: String,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player_account = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;

    if !player_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    // Check if game is full
    if game_state.current_players >= game_state.max_players {
        // Try to join as spectator
        if game_state.spectator.is_none() {
            game_state.spectator = Some(Spectator {
                pubkey: *player_account.key,
                name: player_name.clone(),
                total_contributed: 0,
            });
            msg!("Player {} joined as spectator", player_name);
        } else {
            msg!("Game is full and spectator seat is taken");
            return Err(ProgramError::Custom(1)); // Game full error
        }
    } else {
        // Check if player already joined
        if game_state.players.iter().any(|p| p.pubkey == *player_account.key) {
            msg!("Player already in game");
            return Err(ProgramError::Custom(2)); // Already joined error
        }

        let new_player = Player {
            pubkey: *player_account.key,
            name: player_name.clone(),
            chips: 0,
            current_bet: 0,
            is_active: true,
            has_folded: false,
        };

        game_state.players.push(new_player);
        game_state.current_players += 1;

        msg!("Player {} joined the game", player_name);
    }

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// Place bet
fn place_bet(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player_account = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let pot_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !player_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    // Find player
    let player_index = game_state
        .players
        .iter()
        .position(|p| p.pubkey == *player_account.key)
        .ok_or(ProgramError::Custom(3))?; // Player not found

    // Transfer SOL to pot
    invoke(
        &system_instruction::transfer(player_account.key, pot_account.key, amount),
        &[player_account.clone(), pot_account.clone(), system_program.clone()],
    )?;

    game_state.players[player_index].current_bet += amount;
    game_state.pot_total += amount;

    msg!("Player {} bet {} lamports", game_state.players[player_index].name, amount);

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// Deal cards (simplified - actual card dealing would be more complex)
fn deal_cards(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let authority = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;

    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    if game_state.authority != *authority.key {
        return Err(ProgramError::Custom(4)); // Not authorized
    }

    game_state.game_stage = GameStage::PreFlop;
    msg!("Cards dealt, game stage: PreFlop");

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
    msg!("Player {} folded", game_state.players[player_index].name);

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
    let pot_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

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

    if call_amount > 0 {
        invoke(
            &system_instruction::transfer(player_account.key, pot_account.key, call_amount),
            &[player_account.clone(), pot_account.clone(), system_program.clone()],
        )?;

        game_state.players[player_index].current_bet += call_amount;
        game_state.pot_total += call_amount;
    }

    msg!("Player {} called with {} lamports", game_state.players[player_index].name, call_amount);

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// Raise
fn raise(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let player_account = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let pot_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !player_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    let player_index = game_state
        .players
        .iter()
        .position(|p| p.pubkey == *player_account.key)
        .ok_or(ProgramError::Custom(3))?;

    let total_amount = game_state.current_bet - game_state.players[player_index].current_bet + amount;

    invoke(
        &system_instruction::transfer(player_account.key, pot_account.key, total_amount),
        &[player_account.clone(), pot_account.clone(), system_program.clone()],
    )?;

    game_state.players[player_index].current_bet += total_amount;
    game_state.current_bet += amount;
    game_state.pot_total += total_amount;

    msg!("Player {} raised by {} lamports", game_state.players[player_index].name, amount);

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// End round and distribute pot
fn end_round(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    winner_index: u8,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let authority = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let pot_account = next_account_info(accounts_iter)?;
    let winner_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    if game_state.authority != *authority.key {
        return Err(ProgramError::Custom(4));
    }

    let winner = &game_state.players[winner_index as usize];
    if winner.pubkey != *winner_account.key {
        return Err(ProgramError::Custom(5)); // Winner mismatch
    }

    let pot_balance = pot_account.lamports();
    
    // Transfer pot to winner
    **pot_account.try_borrow_mut_lamports()? -= pot_balance;
    **winner_account.try_borrow_mut_lamports()? += pot_balance;

    msg!("Player {} won {} lamports", winner.name, pot_balance);

    // Reset game state for next round
    for player in &mut game_state.players {
        player.current_bet = 0;
        player.has_folded = false;
    }
    game_state.current_bet = 0;
    game_state.pot_total = 0;
    game_state.game_stage = GameStage::Waiting;

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}

// Spectator contribute to pot
fn spectator_contribute(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let spectator_account = next_account_info(accounts_iter)?;
    let game_state_account = next_account_info(accounts_iter)?;
    let pot_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !spectator_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut game_state = GameState::try_from_slice(&game_state_account.data.borrow())?;

    // Verify spectator
    if let Some(ref mut spectator) = game_state.spectator {
        if spectator.pubkey != *spectator_account.key {
            return Err(ProgramError::Custom(6)); // Not the spectator
        }

        // Transfer SOL to pot
        invoke(
            &system_instruction::transfer(spectator_account.key, pot_account.key, amount),
            &[spectator_account.clone(), pot_account.clone(), system_program.clone()],
        )?;

        spectator.total_contributed += amount;
        game_state.pot_total += amount;

        msg!("Spectator {} contributed {} lamports to pot", spectator.name, amount);
    } else {
        return Err(ProgramError::Custom(7)); // No spectator
    }

    game_state.serialize(&mut &mut game_state_account.data.borrow_mut()[..])?;

    Ok(())
}
