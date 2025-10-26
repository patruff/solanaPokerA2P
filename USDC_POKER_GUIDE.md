# Solana Poker with USDC Integration

## Overview

This is a fully functional poker game on Solana blockchain using **USDC** for real money gameplay. Players buy in with USDC (max $5), play poker with automatic blinds, and cash out their winnings in USDC.

## Key Features

### 💰 USDC Integration
- **Real money**: Play with actual USDC tokens on Solana
- **Buy-in cap**: Maximum $5 USD buy-in per player
- **Cash out**: Withdraw your winnings to USDC anytime (when not in a hand)

### 🎰 Poker Features
- **Automatic blinds**: Small blind ($0.025) and big blind ($0.05) posted automatically
- **Standard poker actions**: Fold, Call, Raise
- **Multi-player**: Up to 4 players per table
- **Provably fair**: All transactions on Solana blockchain

### 🔒 Security
- **SPL Token standard**: Uses official Solana token program
- **PDA-secured pot**: Pot held in Program Derived Address
- **Smart contract enforced**: All rules enforced by Solana program

## Technical Details

### Constants

```rust
MAX_BUY_IN: $5.00 USDC (5,000,000 micro-USDC)
SMALL_BLIND: $0.025 USDC (25,000 micro-USDC)
BIG_BLIND: $0.05 USDC (50,000 micro-USDC)
MIN_BUY_IN: $0.50 USDC (10x big blind)
```

### USDC Devnet Mint
```
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

## Quick Start

### 1. Prerequisites

```bash
# Solana CLI
solana --version  # Should be 1.17+

# Rust
rustc --version

# Node.js
node --version  # Should be 16+

# Set to devnet
solana config set --url devnet

# Create/fund wallet
solana-keygen new
solana airdrop 2
```

### 2. Deploy the Program

```bash
# Clone and navigate
cd solanaPokerA2P

# Deploy (builds and deploys automatically)
./scripts/deploy-usdc-poker.sh
```

This will output your **Program ID**. Save it!

### 3. Get Test USDC

1. Go to https://spl-token-faucet.com/
2. Enter your wallet address
3. Select USDC (mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`)
4. Request tokens (you'll get test USDC)

### 4. Test the Game

```bash
cd scripts
npm install
ts-node test-poker-usdc.ts
```

## Game Flow

### 1. Initialize Game

The game authority (house) initializes the game:

```typescript
await initializeGame({
  maxPlayers: 4,
  usdcMint: USDC_MINT_ADDRESS,
});
```

### 2. Buy In

Players buy in with USDC (between $0.50 and $5.00):

```typescript
await buyIn({
  amount: 5_000_000, // $5 USDC
});
```

**Validation**:
- Amount must be ≤ $5 USDC
- Amount must be ≥ 10x big blind ($0.50)
- Players can top up their stack anytime

### 3. Start Round

Authority starts the round, blinds are posted automatically:

```typescript
await startRound();
```

**Automatic blind posting**:
- Small blind (SB): Player left of dealer posts $0.025
- Big blind (BB): Player left of SB posts $0.05
- Action starts with player left of BB

### 4. Play Poker

Players take actions:

```typescript
// Fold
await fold();

// Call current bet
await call();

// Raise
await raise({
  amount: 100_000, // $0.10 minimum (must be >= big blind)
});
```

**Betting rules**:
- Minimum raise: 1x big blind ($0.05)
- All bets tracked in player chips
- Pot accumulates all bets

### 5. End Round

Authority declares winner after showdown:

```typescript
await endRound({
  winnerIndex: 0, // Index of winning player
});
```

**Winner receives**:
- Entire pot transferred to winner's chips
- Can continue playing or cash out

### 6. Cash Out

Players can cash out chips to USDC:

```typescript
await cashOut();
```

**Requirements**:
- Can only cash out during "Waiting" stage (not in a hand)
- Transfers all chips to player's USDC account
- Player removed from game

## Smart Contract Instructions

### InitializeGame
- **Authority**: Game creator
- **Parameters**: `max_players` (1-4)
- **Effect**: Creates game, sets up pot PDA

### BuyIn
- **Player**: Anyone
- **Parameters**: `amount` (in USDC micro-units)
- **Validation**:
  - $0.50 ≤ amount ≤ $5.00
  - Game not full
- **Effect**: Transfers USDC to pot, adds chips to player

### StartRound
- **Authority**: Game creator only
- **Effect**:
  - Posts blinds automatically
  - Sets current bet to BB
  - Advances to PreFlop stage
  - Sets first action to player left of BB

### Fold
- **Player**: Current player
- **Effect**: Player folds, advances turn

### Call
- **Player**: Current player
- **Effect**: Matches current bet, advances turn

### Raise
- **Player**: Current player
- **Parameters**: `raise_amount` (≥ BB)
- **Effect**: Calls + raises, advances turn

### EndRound
- **Authority**: Game creator only
- **Parameters**: `winner_index`
- **Effect**:
  - Transfers pot to winner's chips
  - Resets for next round
  - Rotates dealer button

### CashOut
- **Player**: Any player
- **Validation**: Game stage must be "Waiting"
- **Effect**:
  - Transfers chips to USDC
  - Removes player from game

## Architecture

```
┌─────────────────────────────────────────┐
│           Players (Wallets)             │
│  FUrDcTgNyfnAwxLCmrF3YDTHcXnhXLrTAqp... │
└──────────────┬──────────────────────────┘
               │ USDC
               ↓
┌─────────────────────────────────────────┐
│         Player USDC Accounts            │
│      (Associated Token Accounts)        │
└──────────────┬──────────────────────────┘
               │ Buy-in/Cash-out
               ↓
┌─────────────────────────────────────────┐
│       Pot USDC Account (PDA)            │
│    Program Derived Address (Secure)     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│        Poker Program (Rust)             │
│  - Game State Management                │
│  - Automatic Blinds                     │
│  - Bet Validation                       │
│  - Pot Distribution                     │
└─────────────────────────────────────────┘
```

## Testing

### Unit Tests

```bash
cd program
cargo test
```

### Integration Test

```bash
cd scripts
npm install
ts-node test-poker-usdc.ts
```

This test:
1. ✅ Gets test USDC
2. ✅ Initializes game
3. ✅ Two players buy in
4. ✅ Starts round with automatic blinds
5. ✅ Verifies game state
6. ✅ Shows cash-out flow

### Frontend Test

```bash
cd app
npm install
npm start
```

## Mainnet Deployment

⚠️ **WARNING**: This is for REAL money. Test thoroughly on devnet first!

### Steps:

1. **Switch to mainnet**
```bash
solana config set --url mainnet-beta
```

2. **Fund wallet with real SOL**
```bash
# You'll need ~3-5 SOL for deployment
solana balance
```

3. **Use mainnet USDC**
```
Mainnet USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

4. **Deploy**
```bash
cd program
cargo build-bpf
solana program deploy target/deploy/solana_poker.so
```

5. **Update program ID** in `app/src/utils/solana.ts`

6. **Test with small amounts first!**

## Security Considerations

### ✅ Implemented

- ✅ SPL Token standard (audited by Solana)
- ✅ PDA-secured pot (no one can steal)
- ✅ Buy-in validation (max $5 cap)
- ✅ Signer verification on all instructions
- ✅ Game stage validation
- ✅ Insufficient funds checks

### ⚠️ Limitations

- ⚠️ Authority determines winner (not fully trustless)
- ⚠️ No on-chain hand evaluation
- ⚠️ Card dealing happens off-chain
- ⚠️ Requires trust in game authority

### 🔮 Future Improvements

1. **Verifiable Random Function (VRF)**
   - Use Chainlink VRF for provable card shuffling
   - Fully trustless card dealing

2. **On-chain Hand Evaluation**
   - Implement poker hand ranking on-chain
   - Automatic winner determination
   - Remove authority requirement

3. **Multi-table Support**
   - Tournament mode
   - Multiple concurrent games
   - Rake/fee system

4. **Time limits**
   - Auto-fold on timeout
   - Prevent stalling

## Costs (Devnet = Free, Mainnet estimates)

| Action | Devnet | Mainnet Est. |
|--------|--------|--------------|
| Deploy Program | Free | ~2-5 SOL |
| Initialize Game | Free | ~0.001 SOL |
| Buy In | Free | ~0.0001 SOL |
| Place Bet | Free | ~0.0001 SOL |
| End Round | Free | ~0.0001 SOL |
| Cash Out | Free | ~0.0001 SOL |

**Note**: Mainnet costs are transaction fees only. USDC amounts are the actual poker stakes.

## FAQ

### Q: Is this real money?
**A**: On devnet, no (test tokens). On mainnet, yes (real USDC).

### Q: Can I lose money?
**A**: On mainnet, yes. On devnet, it's all test tokens (no real value).

### Q: Is it provably fair?
**A**: Partially. All transactions are on-chain and verifiable, but card dealing and winner determination currently require trust in the game authority. See "Future Improvements" for full trustlessness.

### Q: What's the max I can lose?
**A**: $5 USD (the buy-in cap).

### Q: Can I play with friends?
**A**: Yes! Share the game state address and your friends can join.

### Q: Do I need a Phantom wallet?
**A**: Yes, or any Solana wallet that supports USDC.

### Q: Where do I get USDC?
**A**:
- **Devnet**: https://spl-token-faucet.com/ (free test tokens)
- **Mainnet**: Buy on exchanges (Coinbase, Binance, etc.) and transfer to Solana

## Support

- **Issues**: https://github.com/patruff/solanaPokerA2P/issues
- **Docs**: See this file
- **Solana Docs**: https://docs.solana.com/

## License

MIT License - See LICENSE file

---

**Happy poker playing! 🎰💰**

May the flop be with you! ♠️♥️♣️♦️
