#!/usr/bin/env ts-node
/**
 * Full Poker Game Test with Bots
 *
 * This script:
 * 1. Creates 4 bot players
 * 2. Plays a complete poker game
 * 3. Records all transactions on Solana
 * 4. Saves transaction signatures for analysis
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from '@solana/web3.js';
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as borsh from 'borsh';
import * as fs from 'fs';

// Configuration
const USDC_DEVNET_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || 'YOUR_PROGRAM_ID_HERE');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Game state
interface GameLog {
  gameStateAddress: string;
  potPDA: string;
  transactions: Array<{
    signature: string;
    instruction: string;
    timestamp: number;
    details: any;
  }>;
  players: Array<{
    name: string;
    address: string;
    initialBalance: number;
  }>;
}

const gameLog: GameLog = {
  gameStateAddress: '',
  potPDA: '',
  transactions: [],
  players: [],
};

// Helper function to log transactions
function logTransaction(signature: string, instruction: string, details: any) {
  gameLog.transactions.push({
    signature,
    instruction,
    timestamp: Date.now(),
    details,
  });
  console.log(`\n✅ ${instruction}`);
  console.log(`   Signature: ${signature}`);
  console.log(`   Details:`, details);
}

// Bot decision making - simple AI
function makeBotDecision(
  botName: string,
  currentBet: number,
  botChips: number,
  gameStage: string
): 'fold' | 'call' | 'raise' {
  const random = Math.random();

  // Pre-flop: more conservative
  if (gameStage === 'PreFlop') {
    if (random < 0.2) return 'fold';
    if (random < 0.7) return 'call';
    return 'raise';
  }

  // Post-flop: more aggressive
  if (random < 0.15) return 'fold';
  if (random < 0.6) return 'call';
  return 'raise';
}

async function main() {
  console.log('🎰 STARTING FULL POKER GAME TEST');
  console.log('=' .repeat(60));

  // Step 1: Create bot wallets
  console.log('\n📝 Step 1: Creating bot wallets...');

  const authority = Keypair.generate();
  const bots = [
    { keypair: Keypair.generate(), name: 'Alice' },
    { keypair: Keypair.generate(), name: 'Bob' },
    { keypair: Keypair.generate(), name: 'Charlie' },
    { keypair: Keypair.generate(), name: 'Diana' },
  ];

  // Airdrop SOL to all
  console.log('\n💰 Airdropping SOL for transaction fees...');
  for (const bot of [{ keypair: authority, name: 'Authority' }, ...bots]) {
    const sig = await connection.requestAirdrop(bot.keypair.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
    console.log(`   ✓ ${bot.name}: ${bot.keypair.publicKey.toBase58()}`);

    if (bot.name !== 'Authority') {
      gameLog.players.push({
        name: bot.name,
        address: bot.keypair.publicKey.toBase58(),
        initialBalance: 5_000_000, // $5 USDC
      });
    }
  }

  // Step 2: Get USDC for all bots
  console.log('\n💵 Setting up USDC accounts...');
  console.log('   NOTE: You need to manually send test USDC to these addresses:');

  const token = new Token(connection, USDC_DEVNET_MINT, TOKEN_PROGRAM_ID, authority.keypair);
  const botUSDCAccounts = [];

  for (const bot of bots) {
    const tokenAccount = await token.getOrCreateAssociatedAccountInfo(bot.keypair.publicKey);
    botUSDCAccounts.push(tokenAccount.address);
    console.log(`   ${bot.name}: ${tokenAccount.address.toBase58()}`);
  }

  console.log('\n⚠️  PAUSE: Send 5 USDC to each address above from https://spl-token-faucet.com/');
  console.log('   Press Enter when ready...');
  await new Promise(resolve => process.stdin.once('data', resolve));

  // Step 3: Initialize game
  console.log('\n🎮 Step 3: Initializing poker game...');

  const gameStateKeypair = Keypair.generate();
  gameLog.gameStateAddress = gameStateKeypair.publicKey.toBase58();

  // Derive pot PDA
  const [potPDA, potBump] = await PublicKey.findProgramAddress(
    [Buffer.from('poker_pot'), gameStateKeypair.publicKey.toBuffer()],
    PROGRAM_ID
  );
  gameLog.potPDA = potPDA.toBase58();

  console.log(`   Game State: ${gameLog.gameStateAddress}`);
  console.log(`   Pot PDA: ${gameLog.potPDA}`);

  // Create pot token account
  const potTokenAccount = await token.createAccount(potPDA);

  // Initialize game instruction (simplified - adjust based on your actual instruction format)
  const initGameIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: USDC_DEVNET_MINT, isSigner: false, isWritable: false },
      { pubkey: potTokenAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([0, 4]), // 0 = InitializeGame, 4 = max_players
  };

  const initTx = new Transaction().add(initGameIx);
  const initSig = await sendAndConfirmTransaction(connection, initTx, [authority.keypair, gameStateKeypair]);

  logTransaction(initSig, 'InitializeGame', { maxPlayers: 4 });

  // Step 4: All bots buy in
  console.log('\n💰 Step 4: Bots buying in...');

  const buyInAmount = 5_000_000; // $5 USDC

  for (let i = 0; i < bots.length; i++) {
    const bot = bots[i];
    const buyInIx = {
      programId: PROGRAM_ID,
      keys: [
        { pubkey: bot.keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
        { pubkey: botUSDCAccounts[i], isSigner: false, isWritable: true },
        { pubkey: potTokenAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data: Buffer.concat([
        Buffer.from([1]), // 1 = BuyIn instruction
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(buyInAmount)]).buffer)),
      ]),
    };

    const buyInTx = new Transaction().add(buyInIx);
    const buyInSig = await sendAndConfirmTransaction(connection, buyInTx, [bot.keypair]);

    logTransaction(buyInSig, `BuyIn - ${bot.name}`, {
      player: bot.name,
      amount: `$${buyInAmount / 1_000_000} USDC`,
    });
  }

  // Step 5: Start round (automatic blinds!)
  console.log('\n🃏 Step 5: Starting round 1...');

  const startRoundIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: botUSDCAccounts[0], isSigner: false, isWritable: true }, // Small blind
      { pubkey: botUSDCAccounts[1], isSigner: false, isWritable: true }, // Big blind
      { pubkey: potTokenAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([2]), // 2 = StartRound
  };

  const startRoundTx = new Transaction().add(startRoundIx);
  const startRoundSig = await sendAndConfirmTransaction(connection, startRoundTx, [authority.keypair]);

  logTransaction(startRoundSig, 'StartRound', {
    smallBlind: `${bots[0].name} posted $0.025`,
    bigBlind: `${bots[1].name} posted $0.05`,
    currentBet: '$0.05',
  });

  // Step 6: Betting round simulation
  console.log('\n💵 Step 6: Pre-Flop betting...');

  let currentBet = 50_000; // Big blind amount
  let activePlayers = [...bots];

  // Player 3 (Charlie) - First to act after big blind
  const charlieDecision = makeBotDecision('Charlie', currentBet, 5_000_000, 'PreFlop');
  console.log(`   ${bots[2].name} decides to: ${charlieDecision.toUpperCase()}`);

  if (charlieDecision === 'raise') {
    const raiseAmount = 100_000; // $0.10 raise
    const raiseIx = {
      programId: PROGRAM_ID,
      keys: [
        { pubkey: bots[2].keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
        { pubkey: botUSDCAccounts[2], isSigner: false, isWritable: true },
        { pubkey: potTokenAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data: Buffer.concat([
        Buffer.from([5]), // 5 = Raise
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(raiseAmount)]).buffer)),
      ]),
    };

    const raiseTx = new Transaction().add(raiseIx);
    const raiseSig = await sendAndConfirmTransaction(connection, raiseTx, [bots[2].keypair]);

    currentBet += raiseAmount;

    logTransaction(raiseSig, `Raise - ${bots[2].name}`, {
      player: bots[2].name,
      raiseAmount: `$${raiseAmount / 1_000_000} USDC`,
      newBet: `$${currentBet / 1_000_000} USDC`,
    });
  }

  // Player 4 (Diana) - Calls
  console.log(`   ${bots[3].name} decides to: CALL`);
  const dianaCallIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: bots[3].keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: botUSDCAccounts[3], isSigner: false, isWritable: true },
      { pubkey: potTokenAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([4]), // 4 = Call
  };

  const dianaCallTx = new Transaction().add(dianaCallIx);
  const dianaCallSig = await sendAndConfirmTransaction(connection, dianaCallTx, [bots[3].keypair]);

  logTransaction(dianaCallSig, `Call - ${bots[3].name}`, {
    player: bots[3].name,
    callAmount: `$${currentBet / 1_000_000} USDC`,
  });

  // Players 1 & 2 fold
  console.log(`   ${bots[0].name} decides to: FOLD`);
  const aliceFoldIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: bots[0].keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
    ],
    data: Buffer.from([3]), // 3 = Fold
  };

  const aliceFoldTx = new Transaction().add(aliceFoldIx);
  const aliceFoldSig = await sendAndConfirmTransaction(connection, aliceFoldTx, [bots[0].keypair]);

  logTransaction(aliceFoldSig, `Fold - ${bots[0].name}`, { player: bots[0].name });

  console.log(`   ${bots[1].name} decides to: FOLD`);
  const bobFoldIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: bots[1].keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
    ],
    data: Buffer.from([3]), // 3 = Fold
  };

  const bobFoldTx = new Transaction().add(bobFoldIx);
  const bobFoldSig = await sendAndConfirmTransaction(connection, bobFoldTx, [bots[1].keypair]);

  logTransaction(bobFoldSig, `Fold - ${bots[1].name}`, { player: bots[1].name });

  // Step 7: End round - Charlie wins (only 2 active players left)
  console.log('\n🏆 Step 7: Ending round - Charlie wins!');

  const endRoundIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: gameStateKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: potTokenAccount, isSigner: false, isWritable: true },
      { pubkey: botUSDCAccounts[2], isSigner: false, isWritable: true }, // Charlie's USDC account
      { pubkey: potPDA, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([6, 2]), // 6 = EndRound, 2 = winner index (Charlie)
  };

  const endRoundTx = new Transaction().add(endRoundIx);
  const endRoundSig = await sendAndConfirmTransaction(connection, endRoundTx, [authority.keypair]);

  const potAmount = 0.025 + 0.05 + 0.15 + 0.15; // Blinds + raises + calls

  logTransaction(endRoundSig, 'EndRound', {
    winner: bots[2].name,
    potWon: `$${potAmount.toFixed(3)} USDC`,
    newBalance: `$${(5 + potAmount).toFixed(2)} USDC`,
  });

  // Step 8: Save game log
  console.log('\n📊 Step 8: Saving game log...');

  const logFilename = `game-log-${Date.now()}.json`;
  fs.writeFileSync(logFilename, JSON.stringify(gameLog, null, 2));

  console.log(`   ✓ Game log saved to: ${logFilename}`);

  // Step 9: Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 GAME COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\nGame State: ${gameLog.gameStateAddress}`);
  console.log(`Pot PDA: ${gameLog.potPDA}`);
  console.log(`Total Transactions: ${gameLog.transactions.length}`);
  console.log(`\nPlayers:`);
  gameLog.players.forEach(p => console.log(`  - ${p.name}: ${p.address}`));

  console.log(`\n📊 To analyze this game from the blockchain, run:`);
  console.log(`   ts-node analyze-game.ts ${gameLog.gameStateAddress}`);

  console.log(`\n🔍 View transactions on Solana Explorer:`);
  gameLog.transactions.forEach(tx => {
    console.log(`   https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
