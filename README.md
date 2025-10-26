# 🎰 Solana Poker - Play Poker with USDC on Blockchain

A fully on-chain poker game built on Solana where players bet real USDC tokens. Play with friends, family, or anyone with a Solana wallet!

## What Is This?

This is a **Texas Hold'em poker game** that runs entirely on the Solana blockchain. Instead of casino chips, you play with **USDC** (a stablecoin = $1 USD). Your bets and winnings are real cryptocurrency that you can cash out anytime.

### Key Features

- 🎲 **Real Money**: Play with actual USDC tokens
- 💰 **Low Stakes**: Max buy-in capped at $5 USD
- ⚡ **Fast**: Powered by Solana (transactions confirm in ~400ms)
- 🔒 **Secure**: Your funds are held in a smart contract, not by a house
- 🎯 **Fair**: All game rules enforced by blockchain code
- 💸 **Cash Out Anytime**: Withdraw your chips to USDC when not in a hand

## Quick Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     How It Works                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Players buy in with USDC ($0.50 - $5.00)                │
│  2. Blinds post automatically ($0.025 / $0.05)              │
│  3. Cards dealt off-chain (in browser)                      │
│  4. Players bet using blockchain transactions               │
│  5. Winner takes the pot (stored on-chain)                  │
│  6. Cash out winnings to USDC anytime                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 What Players Need

### Essential Requirements

| Item | What | Where to Get It |
|------|------|-----------------|
| **Solana Wallet** | Phantom, Solflare, or similar | [phantom.app](https://phantom.app) |
| **USDC Tokens** | For buy-in ($0.50 - $5.00) | [Devnet Faucet](https://spl-token-faucet.com/) or buy on exchange |
| **SOL** | Small amount for transaction fees (~$0.10 worth) | [Coinbase](https://coinbase.com) or devnet airdrop |
| **Web Browser** | Chrome, Firefox, Brave | You probably have this! |

### 5-Minute Player Setup

**Step 1: Install Phantom Wallet** (2 minutes)
1. Go to [phantom.app](https://phantom.app)
2. Install browser extension
3. Create new wallet
4. **Write down your recovery phrase!** (Keep it safe)

**Step 2: Switch to Devnet** (for testing) (30 seconds)
1. Open Phantom
2. Click Settings → Change Network
3. Select "Devnet"

**Step 3: Get Test USDC** (2 minutes)
1. Go to [spl-token-faucet.com](https://spl-token-faucet.com/)
2. Enter your wallet address (from Phantom)
3. Select USDC (mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`)
4. Click "Request Tokens"
5. You'll receive 100 test USDC (free for testing!)

**Step 4: Join the Game** (30 seconds)
1. Get the game URL from the host
2. Connect your Phantom wallet
3. Buy in with USDC ($0.50 - $5.00)
4. Start playing!

---

## 🎮 How a Game Works (End-to-End)

### Before the Game Starts

**Game Host** (person who deployed the contract):
1. Deploys the smart contract to Solana
2. Initializes a game (sets max 4 players)
3. Shares the game state address with players
4. Becomes the "authority" (dealer/admin)

**Players**:
1. Connect their Phantom wallets
2. Buy in with USDC (any amount from $0.50 to $5.00)
3. Wait for other players to join

---

### Round-by-Round Gameplay

#### **🃏 Phase 1: Pre-Flop (Before Community Cards)**

**What Happens Automatically:**
```
1. Host clicks "Start Round"
2. Smart contract automatically:
   - Deducts $0.025 from small blind player
   - Deducts $0.05 from big blind player
   - Sets current bet to $0.05
   - Starts the action
```

**Players Act:**
- **Player 1** (left of big blind):
  - Fold 👎 (give up)
  - Call 💵 (pay $0.05)
  - Raise 📈 (pay $0.05 + more, minimum $0.05 raise)

- **Next Players**: Same options (fold, call, or raise)

- **Action continues** until all active players have matched the current bet

**Example:**
```
Pot: $0.075 (blinds)
Player 1: Raises to $0.15 → Pot: $0.225
Player 2: Calls $0.15 → Pot: $0.375
Player 3: Folds → Out of this hand
Player 4: Calls $0.15 → Pot: $0.525
```

---

#### **🃏 Phase 2: Flop (3 Community Cards)**

**What Happens:**
```
1. Host advances to "Flop" stage
2. Three community cards displayed on screen
3. Betting round starts (current bet resets to $0)
```

**Players Act:**
- Check ✅ (if bet is $0)
- Bet 💵 (start betting)
- Call 💵 (match current bet)
- Raise 📈 (increase bet)
- Fold 👎 (give up)

**Example:**
```
Community: [A♠] [K♥] [7♣]
Player 1: Checks
Player 2: Bets $0.20 → Pot: $0.725
Player 4: Calls $0.20 → Pot: $0.925
```

---

#### **🃏 Phase 3: Turn (4th Community Card)**

Same as Flop, but with one more card revealed.

```
Community: [A♠] [K♥] [7♣] [2♦]
Betting round continues...
```

---

#### **🃏 Phase 4: River (5th Community Card)**

Final betting round with all community cards revealed.

```
Community: [A♠] [K♥] [7♣] [2♦] [9♠]
Final bets placed...
```

---

#### **🏆 Phase 5: Showdown (Determine Winner)**

**What Happens:**
```
1. All active players reveal their cards
2. Host determines the winner (best poker hand)
3. Host clicks "End Round" and selects winner
4. Smart contract:
   - Transfers entire pot to winner's chips
   - Resets for next round
   - Rotates dealer button
```

**Example:**
```
Player 1: Two Pair (Aces and Kings)
Player 2: Three of a Kind (Sevens)
Player 4: One Pair (Aces)

Winner: Player 2 (Three of a Kind beats Two Pair)
Pot: $0.925 → Player 2's chips

New Chip Counts:
- Player 1: $4.15 USDC
- Player 2: $3.92 USDC ✨ (+$0.925 from pot)
- Player 4: $2.80 USDC
```

---

### After the Game

**Cashing Out:**
```
1. Player clicks "Cash Out" (only when not in a hand)
2. Smart contract:
   - Transfers all chips to player's USDC account
   - Removes player from game
3. Player receives USDC in their Phantom wallet
4. Player can spend/save/transfer USDC like any crypto
```

**Example:**
```
Player 2 has $3.92 in chips
Player 2 clicks "Cash Out"
→ 3.92 USDC appears in Phantom wallet
→ Player 2 leaves the game
→ Can withdraw to bank or keep in wallet
```

---

## 🎯 Game Rules Summary

### Betting Structure

| Setting | Value | Description |
|---------|-------|-------------|
| Small Blind | $0.025 USDC | Posted automatically by player left of dealer |
| Big Blind | $0.05 USDC | Posted automatically by player left of small blind |
| Minimum Bet | $0.05 USDC | Same as big blind |
| Minimum Raise | $0.05 USDC | Must raise by at least 1x big blind |

### Buy-In & Cash-Out

| Action | Minimum | Maximum | When |
|--------|---------|---------|------|
| Buy-In | $0.50 USDC | $5.00 USDC | Anytime before/between rounds |
| Top-Up | $0.50 USDC | Up to $5.00 total | Between rounds |
| Cash-Out | All chips | All chips | Only when game is "Waiting" (not in a hand) |

### Standard Poker Hand Rankings

From best to worst:
1. 🏆 **Royal Flush** - A♠ K♠ Q♠ J♠ 10♠
2. 💎 **Straight Flush** - 9♥ 8♥ 7♥ 6♥ 5♥
3. 🎰 **Four of a Kind** - K♠ K♥ K♦ K♣ 3♠
4. 🏠 **Full House** - A♠ A♥ A♦ 9♠ 9♥
5. ♦️ **Flush** - K♦ J♦ 8♦ 4♦ 2♦
6. ➡️ **Straight** - 8♠ 7♥ 6♣ 5♦ 4♠
7. 🎯 **Three of a Kind** - Q♠ Q♥ Q♦ 7♠ 2♣
8. 🎲 **Two Pair** - J♠ J♥ 5♣ 5♦ K♠
9. 👥 **One Pair** - 10♠ 10♥ 8♣ 6♦ 3♠
10. 🃏 **High Card** - A♠ K♥ 9♣ 5♦ 2♠

---

## 🏗️ Architecture Overview

### System Components

```
┌──────────────────────────────────────────────────────────┐
│                   PLAYERS (Web Browsers)                  │
│                                                           │
│  [Phantom Wallet] ←→ [React Frontend] ←→ [Game UI]      │
└─────────────────────────┬────────────────────────────────┘
                          │
                          │ Blockchain Transactions
                          │
┌─────────────────────────▼────────────────────────────────┐
│              SOLANA BLOCKCHAIN (Devnet/Mainnet)          │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │       Smart Contract (Rust Program)              │    │
│  │  - Validate buy-ins ($0.50 - $5.00)             │    │
│  │  - Post blinds automatically                     │    │
│  │  - Track bets and pot                            │    │
│  │  - Distribute winnings                           │    │
│  │  - Process cash-outs                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │    Pot (Program Derived Address - PDA)          │    │
│  │  - Holds all USDC during game                    │    │
│  │  - Only smart contract can move funds            │    │
│  │  - Secure, can't be stolen                       │    │
│  └─────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

### What's On-Chain vs Off-Chain

**On-Chain (Blockchain):**
- ✅ Buy-ins (USDC transfers)
- ✅ Bets and raises
- ✅ Pot accumulation
- ✅ Winner payouts
- ✅ Cash-outs
- ✅ Game state (who's in, chip counts)

**Off-Chain (In Browser):**
- 🎴 Card dealing (random shuffle)
- 🎴 Card display (players see their cards)
- 🎴 Hand evaluation (determine winner)
- 💬 Chat (if implemented)
- 🎨 UI animations

---

## 💻 For Developers

### Tech Stack

- **Smart Contract**: Rust + Solana Program
- **Frontend**: React + TypeScript
- **Wallet Integration**: Solana Wallet Adapter (Phantom)
- **Token**: USDC (SPL Token)
- **Network**: Solana Devnet (testing) / Mainnet (production)

### Repository Structure

```
solanaPokerA2P/
├── program/                    # Rust smart contract
│   ├── src/lib.rs             # Main program logic
│   └── Cargo.toml             # Rust dependencies
│
├── app/                       # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── contexts/         # State management
│   │   └── utils/            # Helpers & config
│   └── package.json
│
├── scripts/                   # Deployment & testing
│   ├── deploy-usdc-poker.sh  # Deploy to Solana
│   └── test-poker-usdc.ts    # Integration tests
│
├── README.md                  # This file
├── QUICKSTART_USDC.md        # Quick deployment guide
└── USDC_POKER_GUIDE.md       # Detailed documentation
```

### Quick Deploy

```bash
# 1. Setup
solana config set --url devnet
solana airdrop 2

# 2. Deploy
./scripts/deploy-usdc-poker.sh

# 3. Test
cd scripts && npm install && ts-node test-poker-usdc.ts

# 4. Run Frontend
cd app && npm install && npm start
```

See **[QUICKSTART_USDC.md](QUICKSTART_USDC.md)** for detailed deployment instructions.

---

## 🔐 Security & Trust

### What's Secure ✅

- **USDC in PDA**: All funds held in Program Derived Address (only smart contract can access)
- **SPL Token Standard**: Uses Solana's audited token program
- **Transaction Signatures**: All actions require wallet signature
- **Buy-In Limits**: Smart contract enforces $5 max (can't lose more)
- **Immutable Code**: Smart contract rules can't be changed

### What Requires Trust ⚠️

- **Winner Determination**: Game host declares winner (not automatic)
- **Card Dealing**: Cards shuffled in browser (not verifiably random)
- **No Disputes**: If someone cheats, there's no on-chain proof

### Future Improvements 🔮

- [ ] **Verifiable Random Function (VRF)**: Provably fair card shuffling
- [ ] **On-Chain Hand Evaluation**: Automatic winner determination
- [ ] **Time Limits**: Auto-fold players who take too long
- [ ] **Tournament Mode**: Multi-table tournaments
- [ ] **Dispute Resolution**: On-chain hand history

See **[USDC_POKER_GUIDE.md](USDC_POKER_GUIDE.md)** for full security analysis.

---

## 💰 Costs & Economics

### Devnet (Testing) - FREE

| Action | Cost |
|--------|------|
| Deploy Smart Contract | FREE (test SOL from airdrop) |
| Buy-In | FREE (test USDC from faucet) |
| Place Bet | FREE (test SOL for fees) |
| Cash Out | FREE |
| **Total to Test** | **$0.00** |

### Mainnet (Real Money)

| Action | SOL Fee | USDC Amount |
|--------|---------|-------------|
| Deploy Smart Contract | ~2-5 SOL (~$200-500) | - |
| Buy-In | ~$0.0001 | $0.50 - $5.00 |
| Place Bet | ~$0.0001 | Your bet amount |
| Cash Out | ~$0.0001 | Your chip balance |

**Note**: SOL fees are transaction costs (like gas). USDC is your actual poker stake.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **README.md** (this file) | Overview, player guide, game flow |
| **[QUICKSTART_USDC.md](QUICKSTART_USDC.md)** | 5-minute deployment guide |
| **[USDC_POKER_GUIDE.md](USDC_POKER_GUIDE.md)** | Complete technical documentation |
| **[scripts/test-poker-usdc.ts](scripts/test-poker-usdc.ts)** | Integration test examples |

---

## ❓ FAQ

### For Players

**Q: Is this real money?**
A: On **Devnet** (testing) - No, it's fake tokens. On **Mainnet** (production) - Yes, real USDC.

**Q: Can I lose money?**
A: On Mainnet, yes. Max loss is your buy-in (capped at $5 USD).

**Q: Do I need cryptocurrency experience?**
A: No! Just install Phantom wallet and follow the setup steps.

**Q: What if I get disconnected?**
A: Your chips are safe on the blockchain. Reconnect and resume playing.

**Q: Can the house steal my money?**
A: No. Funds are held in a PDA (Program Derived Address) that only the smart contract can access.

### For Developers

**Q: Can I modify the blinds?**
A: Yes, change `SMALL_BLIND` and `BIG_BLIND` in `program/src/lib.rs`

**Q: Can I increase the max buy-in?**
A: Yes, change `MAX_BUY_IN` in `program/src/lib.rs` and redeploy.

**Q: Is this production-ready?**
A: For friends/family on Devnet - Yes. For public Mainnet - Test thoroughly first!

**Q: How do I add more players?**
A: Increase `max_players` when initializing the game (currently capped at 4).

---

## 🚀 Getting Started

### As a Player
1. Read **[What Players Need](#-what-players-need)** (3 minutes)
2. Follow **[5-Minute Player Setup](#5-minute-player-setup)**
3. Get the game URL from your host
4. Buy in and start playing!

### As a Developer/Host
1. Read **[QUICKSTART_USDC.md](QUICKSTART_USDC.md)** (5 minutes)
2. Deploy to Devnet (10 minutes)
3. Test with `scripts/test-poker-usdc.ts` (5 minutes)
4. Invite players to join!

---

## 🤝 Contributing

This is a learning project! Contributions welcome:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

**Ideas for contributions:**
- Improve UI/UX
- Add chat functionality
- Implement hand history
- Add tournament mode
- Improve bot AI

---

## 📄 License

MIT License - See LICENSE file

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/patruff/solanaPokerA2P/issues)
- **Solana Docs**: [docs.solana.com](https://docs.solana.com)
- **USDC Info**: [circle.com/usdc](https://www.circle.com/en/usdc)

---

## ⚠️ Disclaimer

This software is provided "as is" for educational purposes. Gambling may be illegal in your jurisdiction. Use responsibly. Never bet more than you can afford to lose. The developers are not responsible for any losses incurred while using this software.

---

**Built with ❤️ on Solana**

Play responsibly. May the flop be with you! 🎰♠️♥️♣️♦️
