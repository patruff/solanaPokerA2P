# Quick Start Guide

Get your Solana Poker game running in 15 minutes!

## Prerequisites Check

```bash
# Check Node.js (need v16+)
node --version

# Check Rust
rustc --version

# Check Solana CLI
solana --version
```

Don't have them? See the main README for installation links.

## 5-Minute Setup

### 1. Configure Solana (1 min)

```bash
# Set to devnet
solana config set --url devnet

# Create a wallet
solana-keygen new

# Get some test SOL
solana airdrop 2
```

### 2. Deploy Smart Contract (3 min)

```bash
cd program

# Build
cargo build-bpf

# Deploy
solana program deploy target/deploy/solana_poker.so

# SAVE THE PROGRAM ID THAT'S PRINTED!
```

### 3. Configure Frontend (1 min)

```bash
cd ../app

# Install dependencies
npm install
```

Edit `app/src/utils/solana.ts`:
- Replace `YOUR_PROGRAM_ID_HERE` with your program ID from step 2

Edit `app/src/utils/firebase.ts`:
- Add your Firebase config (or use demo mode)

### 4. Run the App (30 seconds)

```bash
npm start
```

Open http://localhost:3000

## First Game

1. **Sign In**: Click "Sign in with Google"
2. **Connect Wallet**: Click the Phantom button and connect
3. **Test Mode**: Check "Test Mode (Add Bot Opponent)"
4. **Join**: Click "Join Game"
5. **Play**: Click "Start New Round" and play poker!

## Quick Test

```bash
# In one terminal - run the app
cd app && npm start

# In another terminal - check your balance
solana balance

# After playing, check again to see changes
solana balance
```

## Troubleshooting

**"Insufficient funds"**
```bash
solana airdrop 2
```

**"Program not found"**
- Check the program ID in `app/src/utils/solana.ts`
- Make sure you deployed to devnet

**Wallet won't connect**
- Install Phantom: https://phantom.app
- Switch Phantom to Devnet
- Refresh the page

## Next Steps

- Read TESTING.md for comprehensive testing
- Invite your siblings to play
- Check README.md for deployment to S3

## Need Help?

Common commands:

```bash
# Check Solana config
solana config get

# Check balance
solana balance

# View recent transactions
solana transaction-history

# Get more test SOL
solana airdrop 2
```

---

**You're ready to play! 🎰**
