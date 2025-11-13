# 🧪 Testing Guide: Bot Game & Blockchain Analysis

## Overview

This guide shows you how to:
1. ✅ Run a complete poker game with AI bots on Solana devnet
2. ✅ Analyze the game by reading the blockchain
3. ✅ Verify everything on Solana Explorer

**Why this matters**: This proves the game works end-to-end on-chain and demonstrates full blockchain transparency!

## Prerequisites

```bash
# 1. Switch to devnet
solana config set --url devnet

# 2. Fund your wallet with test SOL
solana airdrop 2

# 3. Get test USDC
# Visit: https://spl-token-faucet.com/
# Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
# Wallet: FUrDcTgNyfnAwxLCmrF3YDTHcXnhXLrTAqpiLw94jdHT

# 4. Deploy the program (if not done already)
./scripts/deploy-usdc-poker.sh

# 5. Install dependencies
cd scripts
npm install
```

## Quick Start (TL;DR)

```bash
# Run bot game
cd scripts
ts-node play-full-game.ts

# Analyze results (use game address from output above)
ts-node analyze-game.ts <GAME_STATE_ADDRESS>

# Example:
# ts-node analyze-game.ts 7xKjQqR9mPq3nYxZ8vT4wH5cF2aL6sD9pM1eB3nK4vR
```

---

## Part 1: Run a Bot Poker Game

### What It Does

The `play-full-game.ts` script:
- Creates 4 AI bots: **Alice**, **Bob**, **Charlie**, and **Diana**
- Plays a complete poker game on Solana devnet
- Each bot buys in with USDC (between $1-$5)
- Bots play through Pre-Flop and Flop betting rounds
- All actions are real blockchain transactions
- Logs every transaction signature

### How to Run

```bash
cd scripts
ts-node play-full-game.ts
```

### Expected Output

```
🎰 SOLANA POKER - FULL GAME SIMULATION
======================================

🎮 Initializing game...
✅ Game initialized!
   Game State: 7xKjQqR9mPq3nYxZ8vT4wH5cF2aL6sD9pM1eB3nK4vR
   Pot PDA: 9mPqR3xKjQ2nYxZ8vT4wH5cF2aL6sD9pM1eB3nK4vR
   🔗 https://explorer.solana.com/tx/abc123...?cluster=devnet

👥 Players buying in...
✅ Alice bought in for $2.50
✅ Bob bought in for $1.75
✅ Charlie bought in for $3.00
✅ Diana bought in for $1.50

🎲 Starting round (blinds posted automatically)...
✅ Round started!
   Small Blind: Alice ($0.025)
   Big Blind: Bob ($0.05)

🎯 PRE-FLOP BETTING
-------------------
Charlie: Raises to $0.15 → Pot: $0.225
Diana: Calls $0.15 → Pot: $0.375
Alice: Folds
Bob: Calls $0.10 → Pot: $0.475

🎯 FLOP BETTING
--------------
Bob: Checks
Charlie: Raises $0.20 → Pot: $0.675
Diana: Folds
Bob: Calls $0.20 → Pot: $0.875

🏆 Ending round...
✅ Winner: Charlie
   Pot won: $0.875 USDC

💾 Game log saved: game-log-1234567890.json

🎉 GAME COMPLETE!
📊 View all transactions on Solana Explorer
📄 Analyze with: ts-node analyze-game.ts 7xKjQqR9mPq3nYxZ8vT4wH5cF2aL6sD9pM1eB3nK4vR
```

### What Just Happened?

Every action you saw (buy-in, raise, call, fold) was a **real transaction** on Solana blockchain!

- ✅ USDC was transferred from bot wallets to the pot
- ✅ Blinds were automatically deducted on-chain
- ✅ All bets were tracked in the smart contract
- ✅ Winner received USDC to their chips
- ✅ Everything is verifiable and permanent

---

## Part 2: Analyze the Game from Blockchain

### What It Does

The `analyze-game.ts` script:
- Reads **all transactions** from the Solana blockchain
- Parses instruction data to reconstruct events
- Identifies players, bets, and actions
- Generates a human-readable timeline
- Shows exactly what happened, when, and who did it

### How to Run

```bash
# Use the Game State address from play-full-game.ts output
ts-node analyze-game.ts <GAME_STATE_ADDRESS>

# Example:
ts-node analyze-game.ts 7xKjQqR9mPq3nYxZ8vT4wH5cF2aL6sD9pM1eB3nK4vR
```

### Expected Output

```
🔍 Analyzing game at: 7xKjQqR9mPq3nYxZ8vT4wH5cF2aL6sD9pM1eB3nK4vR
======================================================================

📡 Fetching transactions from blockchain...
   Found 15 transactions

🔬 Parsing transactions...

======================================================================
🎰 POKER GAME ANALYSIS (FROM BLOCKCHAIN)
======================================================================

📊 GAME INFORMATION
----------------------------------------------------------------------
Game State Address: 7xKjQqR9mPq3nYxZ8vT4wH5cF2aL6sD9pM1eB3nK4vR
Pot PDA: 9mPqR3xKjQ2nYxZ8vT4wH5cF2aL6sD9pM1eB3nK4vR
Total Rounds: 1
Total Pot: $8.75 USDC
Duration: 45 seconds
Total Transactions: 15

👥 PLAYERS
----------------------------------------------------------------------

Alice:
  Address: FUrDcTgN...jdHT
  Total Buy-In: $2.50 USDC
  Actions Taken: 1
  Final Status: Folded

Bob:
  Address: GXsPdUhO...kEiU
  Total Buy-In: $1.75 USDC
  Actions Taken: 2
  Final Status: Active

Charlie:
  Address: HYtQeVjP...lFjV
  Total Buy-In: $3.00 USDC
  Actions Taken: 2
  Final Status: Active
  🏆 WINNER! Won $8.75 USDC

Diana:
  Address: IZuRfWkQ...mGkW
  Total Buy-In: $1.50 USDC
  Actions Taken: 2
  Final Status: Folded

⏱️  GAME TIMELINE (All events from blockchain)
----------------------------------------------------------------------

1. [2:30:15 PM] InitializeGame
   Signature: abc123def456...
   Max Players: 4
   🔗 View: https://explorer.solana.com/tx/abc123...?cluster=devnet

2. [2:30:18 PM] BuyIn
   Signature: def456ghi789...
   Alice bought in for $2.50 USDC
   🔗 View: https://explorer.solana.com/tx/def456...?cluster=devnet

3. [2:30:20 PM] BuyIn
   Signature: ghi789jkl012...
   Bob bought in for $1.75 USDC
   🔗 View: https://explorer.solana.com/tx/ghi789...?cluster=devnet

4. [2:30:22 PM] BuyIn
   Signature: jkl012mno345...
   Charlie bought in for $3.00 USDC
   🔗 View: https://explorer.solana.com/tx/jkl012...?cluster=devnet

5. [2:30:24 PM] BuyIn
   Signature: mno345pqr678...
   Diana bought in for $1.50 USDC
   🔗 View: https://explorer.solana.com/tx/mno345...?cluster=devnet

6. [2:30:30 PM] StartRound
   Signature: pqr678stu901...
   Blinds posted automatically
   Small Blind: $0.025 USDC
   Big Blind: $0.05 USDC
   🔗 View: https://explorer.solana.com/tx/pqr678...?cluster=devnet

7. [2:30:35 PM] Raise
   Signature: stu901vwx234...
   Charlie raised $0.15 USDC
   🔗 View: https://explorer.solana.com/tx/stu901...?cluster=devnet

8. [2:30:38 PM] Call
   Signature: vwx234yza567...
   Diana called
   🔗 View: https://explorer.solana.com/tx/vwx234...?cluster=devnet

9. [2:30:40 PM] Fold
   Signature: yza567bcd890...
   Alice folded
   🔗 View: https://explorer.solana.com/tx/yza567...?cluster=devnet

10. [2:30:42 PM] Call
    Signature: bcd890efg123...
    Bob called
    🔗 View: https://explorer.solana.com/tx/bcd890...?cluster=devnet

11. [2:30:50 PM] Raise
    Signature: efg123hij456...
    Charlie raised $0.20 USDC
    🔗 View: https://explorer.solana.com/tx/efg123...?cluster=devnet

12. [2:30:52 PM] Fold
    Signature: hij456klm789...
    Diana folded
    🔗 View: https://explorer.solana.com/tx/hij456...?cluster=devnet

13. [2:30:54 PM] Call
    Signature: klm789nop012...
    Bob called
    🔗 View: https://explorer.solana.com/tx/klm789...?cluster=devnet

14. [2:31:00 PM] EndRound
    Signature: nop012qrs345...
    Winner: Charlie
    Pot: $8.75 USDC
    🔗 View: https://explorer.solana.com/tx/nop012...?cluster=devnet


======================================================================
📈 GAME SUMMARY
======================================================================

🏆 Winner: Charlie
   Profit: $5.75 USDC

📊 Statistics:
   Players who folded: 2/4
   Total actions: 7
   Average pot per round: $8.75 USDC

======================================================================
✅ ANALYSIS COMPLETE - All data verified from Solana blockchain!
======================================================================

💾 Reports saved:
   📄 game-analysis-1234567890.txt
   📊 game-analysis-1234567890.json
```

### Output Files

The analyzer creates two files:

1. **game-analysis-{timestamp}.txt**
   - Human-readable report (like above)
   - Perfect for sharing or reviewing

2. **game-analysis-{timestamp}.json**
   - Machine-readable data
   - Useful for further processing or visualization

---

## Part 3: Verify on Solana Explorer

Every transaction link in the analysis opens Solana Explorer where you can see:

### Example Transaction View

1. Click any 🔗 link from the analysis
2. You'll see on Solana Explorer:
   - **Transaction status**: ✅ Success
   - **Block time**: Exact timestamp
   - **Fee**: ~0.000005 SOL
   - **Accounts involved**: Player, game state, pot PDA
   - **Token transfers**: Exact USDC amounts moved
   - **Instruction data**: The poker action taken

### What to Verify

✅ **USDC Transfers**: See actual token movements
✅ **Instruction Type**: Confirm it's BuyIn, Raise, Fold, etc.
✅ **Accounts**: Verify player addresses match
✅ **Timestamps**: Check sequence of events
✅ **Success Status**: All transactions succeeded

---

## Bot AI Logic

The bots make decisions based on poker strategy:

### Pre-Flop
- 20% chance to fold
- 50% chance to call
- 30% chance to raise

### Post-Flop (Flop, Turn, River)
- 30% chance to fold
- 50% chance to call
- 20% chance to raise

This creates realistic poker gameplay with varied actions!

---

## Troubleshooting

### "Insufficient USDC balance"

**Solution**: Get more test USDC from https://spl-token-faucet.com/

```bash
# Check your USDC balance
spl-token balance 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

### "Program not found"

**Solution**: Deploy the program first

```bash
./scripts/deploy-usdc-poker.sh
```

### "Transaction simulation failed"

**Solution**: Check you have enough SOL for transaction fees

```bash
solana balance
# If low, request more
solana airdrop 2
```

### "Game state not found"

**Solution**: Make sure you're using the correct game state address from the bot game output

### Analyzer shows "Found 0 transactions"

**Possible causes**:
1. Wrong game state address
2. Wrong network (make sure both scripts use devnet)
3. Game was just created (wait a few seconds for blockchain to index)

---

## Advanced Usage

### Run Multiple Games

```bash
# Run 3 different games
for i in {1..3}; do
  ts-node play-full-game.ts
  sleep 5
done
```

### Analyze All Games

```bash
# Save game addresses, then analyze each
ts-node analyze-game.ts GAME1_ADDRESS
ts-node analyze-game.ts GAME2_ADDRESS
ts-node analyze-game.ts GAME3_ADDRESS
```

### Custom Bot Strategies

Edit `play-full-game.ts` to adjust bot behavior:

```typescript
// Make bots more aggressive (around line 50)
function makeBotDecision(...) {
  if (gameStage === 'PreFlop') {
    if (random < 0.1) return 'fold';  // Less folding
    if (random < 0.4) return 'call';  // Less calling
    return 'raise';                    // More raising!
  }
  // ...
}
```

---

## What This Proves

✅ **Full On-Chain Gameplay**: Every poker action is a blockchain transaction
✅ **USDC Integration**: Real token transfers in/out
✅ **Automatic Blinds**: Smart contract handles blind posting
✅ **Multi-Player**: 4 players can play simultaneously
✅ **Verifiable**: Anyone can read the blockchain and see what happened
✅ **Transparent**: Complete game history is public and permanent

---

## Next Steps

### 1. Play with Friends

Share your game state address with friends who have:
- Solana wallet (Phantom, Solflare, etc.)
- Test USDC from faucet
- Access to your frontend app

### 2. Customize the Game

**Change blinds** (`program/src/lib.rs`):
```rust
const SMALL_BLIND: u64 = 50_000;  // $0.05
const BIG_BLIND: u64 = 100_000;   // $0.10
```

**Change max buy-in** (`program/src/lib.rs`):
```rust
const MAX_BUY_IN: u64 = 10_000_000;  // $10
```

Then redeploy:
```bash
./scripts/deploy-usdc-poker.sh
```

### 3. Go to Mainnet (⚠️ REAL MONEY!)

**Only after thorough testing on devnet!**

1. Switch network: `solana config set --url mainnet-beta`
2. Fund wallet with real SOL (for fees)
3. Get real USDC
4. Update `USDC_MINT` to mainnet address in code
5. Deploy program
6. **Start with small stakes!**

---

## Cost Breakdown

### Devnet (Testing)
- **Total cost**: $0.00 (all test tokens)
- **SOL needed**: Free from airdrop
- **USDC needed**: Free from faucet

### Mainnet (Production)
- **Program deployment**: ~2-5 SOL (~$200-500 one-time)
- **Transaction fees**: ~$0.0001 SOL per action
- **Stakes**: Your actual USDC buy-in (max $5 as configured)

---

## Support

- **Issues**: https://github.com/patruff/solanaPokerA2P/issues
- **Full Guide**: See `README.md`
- **USDC Guide**: See `USDC_POKER_GUIDE.md`
- **Quick Start**: See `QUICKSTART_USDC.md`
- **Solana Docs**: https://docs.solana.com/

---

## Example: Complete Test Session

```bash
# 1. Setup (one-time)
solana config set --url devnet
solana airdrop 2
# Visit https://spl-token-faucet.com/ and get USDC
./scripts/deploy-usdc-poker.sh

# 2. Run bot game
cd scripts
npm install
ts-node play-full-game.ts

# Output shows:
# Game State: 7xKjQqR9mPq3nYxZ8vT4wH5cF2aL6sD9pM1eB3nK4vR

# 3. Analyze the game
ts-node analyze-game.ts 7xKjQqR9mPq3nYxZ8vT4wH5cF2aL6sD9pM1eB3nK4vR

# 4. Check the reports
cat game-analysis-*.txt

# 5. Verify on blockchain
# Open any 🔗 link from the analysis in your browser
```

**That's it! You've just proven your poker game works on Solana blockchain! 🎰**

---

## Fun Facts

🎯 Every fold, call, and raise is immutably stored on Solana
💰 The pot is held in a PDA - even you (the developer) can't steal it
🔒 Smart contract enforces all rules - no one can cheat
⚡ Solana's speed means actions confirm in seconds
📊 The blockchain is the ultimate dealer - 100% transparent

**May the blockchain be with you! ♠️♥️♣️♦️**
