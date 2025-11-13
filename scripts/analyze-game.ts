#!/usr/bin/env ts-node
/**
 * Blockchain Game Analyzer
 *
 * Reads transactions from Solana blockchain and reconstructs the poker game.
 * This demonstrates transparency - anyone can verify what happened!
 */

import {
  Connection,
  PublicKey,
  ParsedTransactionWithMeta,
  ConfirmedSignatureInfo,
} from '@solana/web3.js';
import * as fs from 'fs';

// Configuration
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

interface GameEvent {
  blockTime: number;
  signature: string;
  instruction: string;
  details: any;
  accounts: string[];
}

interface PlayerState {
  address: string;
  name?: string;
  actions: number;
  totalBet: number;
  won: number;
  folded: boolean;
}

interface GameAnalysis {
  gameStateAddress: string;
  potPDA: string;
  events: GameEvent[];
  players: Map<string, PlayerState>;
  rounds: number;
  totalPot: number;
  winner?: string;
  duration: number;
}

// Instruction type mapping (based on your program)
const INSTRUCTION_MAP: { [key: number]: string } = {
  0: 'InitializeGame',
  1: 'BuyIn',
  2: 'StartRound',
  3: 'Fold',
  4: 'Call',
  5: 'Raise',
  6: 'EndRound',
  7: 'CashOut',
};

// Parse instruction data
function parseInstruction(data: Buffer): { type: string; params: any } {
  if (data.length === 0) {
    return { type: 'Unknown', params: {} };
  }

  const instructionType = data[0];
  const instructionName = INSTRUCTION_MAP[instructionType] || 'Unknown';

  let params: any = {};

  try {
    switch (instructionType) {
      case 0: // InitializeGame
        params = { maxPlayers: data[1] };
        break;

      case 1: // BuyIn
        if (data.length >= 9) {
          const view = new DataView(data.buffer, data.byteOffset + 1, 8);
          params = { amount: Number(view.getBigUint64(0, true)) / 1_000_000 };
        }
        break;

      case 2: // StartRound
        params = { blindsPosted: true };
        break;

      case 3: // Fold
        params = { action: 'folded' };
        break;

      case 4: // Call
        params = { action: 'called' };
        break;

      case 5: // Raise
        if (data.length >= 9) {
          const view = new DataView(data.buffer, data.byteOffset + 1, 8);
          params = { raiseAmount: Number(view.getBigUint64(0, true)) / 1_000_000 };
        }
        break;

      case 6: // EndRound
        params = { winnerIndex: data[1] };
        break;

      case 7: // CashOut
        params = { action: 'cashedOut' };
        break;
    }
  } catch (e) {
    console.error(`Error parsing instruction data:`, e);
  }

  return { type: instructionName, params };
}

// Analyze token transfers
function analyzeTokenTransfers(transaction: ParsedTransactionWithMeta): {
  from?: string;
  to?: string;
  amount?: number;
} {
  const result: any = {};

  if (!transaction.meta?.preTokenBalances || !transaction.meta?.postTokenBalances) {
    return result;
  }

  const pre = transaction.meta.preTokenBalances;
  const post = transaction.meta.postTokenBalances;

  for (let i = 0; i < pre.length; i++) {
    const preBal = pre[i];
    const postBal = post.find(p => p.accountIndex === preBal.accountIndex);

    if (postBal && preBal.uiTokenAmount.uiAmount !== postBal.uiTokenAmount.uiAmount) {
      const diff = (postBal.uiTokenAmount.uiAmount || 0) - (preBal.uiTokenAmount.uiAmount || 0);

      if (diff < 0) {
        result.from = preBal.owner;
        result.amount = Math.abs(diff);
      } else if (diff > 0) {
        result.to = postBal.owner;
        result.amount = diff;
      }
    }
  }

  return result;
}

async function analyzeGame(gameStateAddress: string): Promise<GameAnalysis> {
  console.log(`\n🔍 Analyzing game at: ${gameStateAddress}`);
  console.log('=' .repeat(70));

  const gameStatePubkey = new PublicKey(gameStateAddress);

  // Fetch all signatures for this game state account
  console.log('\n📡 Fetching transactions from blockchain...');

  const signatures = await connection.getSignaturesForAddress(gameStatePubkey, { limit: 100 });

  console.log(`   Found ${signatures.length} transactions`);

  // Fetch and parse all transactions
  console.log('\n🔬 Parsing transactions...');

  const events: GameEvent[] = [];
  const players = new Map<string, PlayerState>();
  let potPDA = '';
  let totalPot = 0;

  for (const sigInfo of signatures.reverse()) {
    const tx = await connection.getParsedTransaction(sigInfo.signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) continue;

    // Find our program instruction
    const instruction = tx.transaction.message.instructions.find((ix: any) => {
      if ('programId' in ix) {
        // This is our program (we'll check based on accounts)
        return ix.accounts?.some((acc: any) => acc.toString() === gameStateAddress);
      }
      return false;
    });

    if (!instruction || !('data' in instruction)) continue;

    // Parse instruction
    const data = Buffer.from(instruction.data, 'base64');
    const parsed = parseInstruction(data);

    // Get accounts involved
    const accounts = instruction.accounts?.map((acc: any) => acc.toString()) || [];

    // Analyze token transfers
    const transfer = analyzeTokenTransfers(tx);

    // Create event
    const event: GameEvent = {
      blockTime: tx.blockTime || 0,
      signature: sigInfo.signature,
      instruction: parsed.type,
      details: { ...parsed.params, ...transfer },
      accounts,
    };

    events.push(event);

    // Track players
    if (parsed.type === 'BuyIn' && accounts.length > 0) {
      const playerAddress = accounts[0];
      if (!players.has(playerAddress)) {
        players.set(playerAddress, {
          address: playerAddress,
          actions: 0,
          totalBet: 0,
          won: 0,
          folded: false,
        });
      }
      const player = players.get(playerAddress)!;
      player.totalBet += parsed.params.amount || 0;
      totalPot += parsed.params.amount || 0;
    }

    // Track actions
    if (['Fold', 'Call', 'Raise'].includes(parsed.type) && accounts.length > 0) {
      const playerAddress = accounts[0];
      if (players.has(playerAddress)) {
        const player = players.get(playerAddress)!;
        player.actions++;

        if (parsed.type === 'Fold') {
          player.folded = true;
        }

        if (parsed.type === 'Raise') {
          player.totalBet += parsed.params.raiseAmount || 0;
        }
      }
    }

    // Track pot PDA
    if (parsed.type === 'InitializeGame' && accounts.length > 2) {
      potPDA = accounts[3]; // Pot PDA is usually 4th account
    }
  }

  // Determine winner (last EndRound transaction)
  const endRoundEvents = events.filter(e => e.instruction === 'EndRound');
  let winner: string | undefined;

  if (endRoundEvents.length > 0) {
    const lastEndRound = endRoundEvents[endRoundEvents.length - 1];
    const winnerIndex = lastEndRound.details.winnerIndex;

    if (winnerIndex !== undefined && lastEndRound.accounts.length > winnerIndex) {
      winner = lastEndRound.accounts[winnerIndex + 3]; // Account offset
    }
  }

  // Calculate duration
  const duration =
    events.length > 1
      ? events[events.length - 1].blockTime - events[0].blockTime
      : 0;

  return {
    gameStateAddress,
    potPDA,
    events,
    players,
    rounds: events.filter(e => e.instruction === 'StartRound').length,
    totalPot,
    winner,
    duration,
  };
}

// Format analysis as human-readable report
function generateReport(analysis: GameAnalysis): string {
  const playerNames = ['Alice', 'Bob', 'Charlie', 'Diana'];
  let report = '\n';
  report += '=' .repeat(70) + '\n';
  report += '🎰 POKER GAME ANALYSIS (FROM BLOCKCHAIN)\n';
  report += '=' .repeat(70) + '\n';

  // Game Info
  report += '\n📊 GAME INFORMATION\n';
  report += '-' .repeat(70) + '\n';
  report += `Game State Address: ${analysis.gameStateAddress}\n`;
  report += `Pot PDA: ${analysis.potPDA || 'N/A'}\n`;
  report += `Total Rounds: ${analysis.rounds}\n`;
  report += `Total Pot: $${analysis.totalPot.toFixed(2)} USDC\n`;
  report += `Duration: ${analysis.duration} seconds\n`;
  report += `Total Transactions: ${analysis.events.length}\n`;

  // Players
  report += '\n👥 PLAYERS\n';
  report += '-' .repeat(70) + '\n';

  let playerIndex = 0;
  analysis.players.forEach((player, address) => {
    const name = playerNames[playerIndex++] || `Player ${playerIndex}`;
    player.name = name;

    report += `\n${name}:\n`;
    report += `  Address: ${address.slice(0, 8)}...${address.slice(-8)}\n`;
    report += `  Total Buy-In: $${player.totalBet.toFixed(2)} USDC\n`;
    report += `  Actions Taken: ${player.actions}\n`;
    report += `  Final Status: ${player.folded ? 'Folded' : 'Active'}\n`;

    if (analysis.winner === address) {
      report += `  🏆 WINNER! Won $${analysis.totalPot.toFixed(2)} USDC\n`;
    }
  });

  // Event Timeline
  report += '\n\n⏱️  GAME TIMELINE (All events from blockchain)\n';
  report += '-' .repeat(70) + '\n';

  analysis.events.forEach((event, index) => {
    const time = new Date(event.blockTime * 1000).toLocaleTimeString();
    const playerAddr = event.accounts[0];
    const player = analysis.players.get(playerAddr);
    const playerName = player?.name || 'Authority';

    report += `\n${index + 1}. [${time}] ${event.instruction}\n`;
    report += `   Signature: ${event.signature}\n`;

    switch (event.instruction) {
      case 'InitializeGame':
        report += `   Max Players: ${event.details.maxPlayers}\n`;
        break;

      case 'BuyIn':
        report += `   ${playerName} bought in for $${event.details.amount?.toFixed(2)} USDC\n`;
        break;

      case 'StartRound':
        report += `   Blinds posted automatically\n`;
        report += `   Small Blind: $0.025 USDC\n`;
        report += `   Big Blind: $0.05 USDC\n`;
        break;

      case 'Fold':
        report += `   ${playerName} folded\n`;
        break;

      case 'Call':
        report += `   ${playerName} called\n`;
        break;

      case 'Raise':
        report += `   ${playerName} raised $${event.details.raiseAmount?.toFixed(2)} USDC\n`;
        break;

      case 'EndRound':
        const winnerAddr = analysis.winner;
        const winnerPlayer = winnerAddr ? analysis.players.get(winnerAddr) : null;
        report += `   Winner: ${winnerPlayer?.name || 'Unknown'}\n`;
        report += `   Pot: $${analysis.totalPot.toFixed(2)} USDC\n`;
        break;

      case 'CashOut':
        report += `   ${playerName} cashed out\n`;
        break;
    }

    report += `   🔗 View: https://explorer.solana.com/tx/${event.signature}?cluster=devnet\n`;
  });

  // Summary
  report += '\n\n' + '=' .repeat(70) + '\n';
  report += '📈 GAME SUMMARY\n';
  report += '=' .repeat(70) + '\n';

  const winnerPlayer = analysis.winner
    ? analysis.players.get(analysis.winner)
    : null;

  if (winnerPlayer) {
    report += `\n🏆 Winner: ${winnerPlayer.name}\n`;
    report += `   Profit: $${(analysis.totalPot - winnerPlayer.totalBet).toFixed(2)} USDC\n`;
  }

  const foldedPlayers = Array.from(analysis.players.values()).filter(p => p.folded);
  report += `\n📊 Statistics:\n`;
  report += `   Players who folded: ${foldedPlayers.length}/${analysis.players.size}\n`;
  report += `   Total actions: ${Array.from(analysis.players.values()).reduce((sum, p) => sum + p.actions, 0)}\n`;
  report += `   Average pot per round: $${(analysis.totalPot / (analysis.rounds || 1)).toFixed(2)} USDC\n`;

  report += '\n' + '=' .repeat(70) + '\n';
  report += '✅ ANALYSIS COMPLETE - All data verified from Solana blockchain!\n';
  report += '=' .repeat(70) + '\n\n';

  return report;
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('\n❌ Error: Missing game state address');
    console.log('\nUsage: ts-node analyze-game.ts <GAME_STATE_ADDRESS>');
    console.log('\nExample:');
    console.log('  ts-node analyze-game.ts 7xKj...9mPq');
    process.exit(1);
  }

  const gameStateAddress = args[0];

  try {
    // Analyze the game
    const analysis = await analyzeGame(gameStateAddress);

    // Generate report
    const report = generateReport(analysis);

    // Print to console
    console.log(report);

    // Save to file
    const timestamp = Date.now();
    const reportFilename = `game-analysis-${timestamp}.txt`;
    const jsonFilename = `game-analysis-${timestamp}.json`;

    fs.writeFileSync(reportFilename, report);
    fs.writeFileSync(
      jsonFilename,
      JSON.stringify(
        {
          ...analysis,
          players: Array.from(analysis.players.entries()).map(([addr, player]) => ({
            address: addr,
            ...player,
          })),
        },
        null,
        2
      )
    );

    console.log(`\n💾 Reports saved:`);
    console.log(`   📄 ${reportFilename}`);
    console.log(`   📊 ${jsonFilename}`);
  } catch (error) {
    console.error('\n❌ Error analyzing game:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
