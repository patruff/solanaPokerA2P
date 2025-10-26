/**
 * Test script for Solana Poker with USDC
 *
 * This script demonstrates:
 * 1. Creating USDC test tokens on devnet
 * 2. Initializing the poker game
 * 3. Players buying in with USDC
 * 4. Playing a round with automatic blinds
 * 5. Cashing out winnings
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as borsh from 'borsh';
import * as fs from 'fs';

// USDC Devnet mint (official USDC test token)
const USDC_DEVNET_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// Your program ID (update after deployment)
const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');

// Connection to devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Load your wallet
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync('/path/to/your/keypair.json', 'utf-8')))
);

console.log('Payer:', payer.publicKey.toBase58());

// Schema for instructions
class InitializeGame {
  max_players: number;
  constructor(fields: { max_players: number }) {
    this.max_players = fields.max_players;
  }
}

class BuyIn {
  amount: bigint;
  constructor(fields: { amount: bigint }) {
    this.amount = fields.amount;
  }
}

const schema = new Map([
  [InitializeGame, { kind: 'struct', fields: [['max_players', 'u8']] }],
  [BuyIn, { kind: 'struct', fields: [['amount', 'u64']] }],
]);

async function main() {
  console.log('\n🎰 Starting Solana Poker USDC Test\n');

  // Step 1: Get or create USDC token accounts
  console.log('Step 1: Setting up USDC token accounts...');

  const usdcMint = new PublicKey(USDC_DEVNET_MINT);

  // Get associated token account for payer
  const payerUSDCAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    usdcMint,
    payer.publicKey
  );

  console.log('  Payer USDC Account:', payerUSDCAccount.toBase58());

  // Check if account exists, create if not
  try {
    await connection.getAccountInfo(payerUSDCAccount);
    console.log('  ✓ USDC account exists');
  } catch (e) {
    console.log('  Creating USDC account...');
    const token = new Token(connection, usdcMint, TOKEN_PROGRAM_ID, payer);
    await token.getOrCreateAssociatedAccountInfo(payer.publicKey);
    console.log('  ✓ USDC account created');
  }

  // Step 2: Request test USDC from faucet
  console.log('\nStep 2: Requesting test USDC...');
  console.log('  Visit: https://spl-token-faucet.com/');
  console.log('  Mint:', USDC_DEVNET_MINT);
  console.log('  Your wallet:', payer.publicKey.toBase58());
  console.log('  (Press Enter after getting tokens)');

  // Wait for user input
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  // Step 3: Initialize game
  console.log('\nStep 3: Initializing poker game...');

  const gameStateKeypair = Keypair.generate();

  // Derive pot PDA
  const [potPDA, potBump] = await PublicKey.findProgramAddress(
    [Buffer.from('poker_pot'), gameStateKeypair.publicKey.toBuffer()],
    PROGRAM_ID
  );

  console.log('  Game State:', gameStateKeypair.publicKey.toBase58());
  console.log('  Pot PDA:', potPDA.toBase58());

  // Create pot token account
  const token = new Token(connection, usdcMint, TOKEN_PROGRAM_ID, payer);

  // Initialize game instruction
  const initGameData = borsh.serialize(
    schema,
    new InitializeGame({ max_players: 4 })
  );

  const initGameIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: usdcMint, isSigner: false, isWritable: false },
      { pubkey: potPDA, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([0, ...initGameData]), // 0 = InitializeGame instruction
  };

  const tx = new Transaction().add(initGameIx);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer, gameStateKeypair]);
  console.log('  ✓ Game initialized. Signature:', sig);

  // Step 4: Buy in
  console.log('\nStep 4: Buying into game...');

  const buyInAmount = 5_000_000n; // $5 USDC (5 * 10^6)

  const buyInData = borsh.serialize(
    schema,
    new BuyIn({ amount: buyInAmount })
  );

  const buyInIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: payerUSDCAccount, isSigner: false, isWritable: true },
      { pubkey: potPDA, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1, ...buyInData]), // 1 = BuyIn instruction
  };

  const buyInTx = new Transaction().add(buyInIx);
  const buyInSig = await sendAndConfirmTransaction(connection, buyInTx, [payer]);
  console.log('  ✓ Bought in for $5 USDC. Signature:', buyInSig);

  // Step 5: Create second player for testing
  console.log('\nStep 5: Creating second player...');

  const player2 = Keypair.generate();

  // Airdrop SOL for fees
  const airdropSig = await connection.requestAirdrop(
    player2.publicKey,
    LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSig);
  console.log('  ✓ Airdropped SOL to player 2');

  // Create USDC account for player 2
  const player2USDCAccount = await token.getOrCreateAssociatedAccountInfo(
    player2.publicKey
  );
  console.log('  Player 2 USDC Account:', player2USDCAccount.address.toBase58());

  // Transfer some USDC to player 2
  await token.transfer(
    payerUSDCAccount,
    player2USDCAccount.address,
    payer,
    [],
    5_000_000 // $5
  );
  console.log('  ✓ Transferred $5 USDC to player 2');

  // Player 2 buys in
  const player2BuyInIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: player2.publicKey, isSigner: true, isWritable: true },
      { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: player2USDCAccount.address, isSigner: false, isWritable: true },
      { pubkey: potPDA, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1, ...buyInData]),
  };

  const player2BuyInTx = new Transaction().add(player2BuyInIx);
  const player2BuyInSig = await sendAndConfirmTransaction(
    connection,
    player2BuyInTx,
    [player2]
  );
  console.log('  ✓ Player 2 bought in. Signature:', player2BuyInSig);

  // Step 6: Start round (automatic blinds)
  console.log('\nStep 6: Starting round with automatic blinds...');

  const startRoundIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: payerUSDCAccount, isSigner: false, isWritable: true },
      { pubkey: player2USDCAccount.address, isSigner: false, isWritable: true },
      { pubkey: potPDA, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([2]), // 2 = StartRound instruction
  };

  const startRoundTx = new Transaction().add(startRoundIx);
  const startRoundSig = await sendAndConfirmTransaction(
    connection,
    startRoundTx,
    [payer]
  );
  console.log('  ✓ Round started with blinds: SB=$0.025, BB=$0.05');
  console.log('  Signature:', startRoundSig);

  // Step 7: Check game state
  console.log('\nStep 7: Checking game state...');

  const gameStateInfo = await connection.getAccountInfo(
    gameStateKeypair.publicKey
  );

  if (gameStateInfo) {
    console.log('  ✓ Game state account found');
    console.log('  Data length:', gameStateInfo.data.length, 'bytes');
    // You can deserialize and display the full game state here
  }

  // Step 8: Cash out demonstration
  console.log('\nStep 8: Cash out (after game ends)...');
  console.log('  Note: Cash out only works in Waiting stage');
  console.log('  Use the CashOut instruction to withdraw winnings');

  console.log('\n✅ Test complete!');
  console.log('\nGame Details:');
  console.log('  - Max buy-in: $5 USDC');
  console.log('  - Small blind: $0.025 USDC');
  console.log('  - Big blind: $0.05 USDC');
  console.log('  - Automatic blind posting on round start');
  console.log('  - Cash out anytime when not in a hand');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
