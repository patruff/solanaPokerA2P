# 🚀 Quick Start: Solana Poker with USDC

## What You Got

A fully functional poker game on Solana that uses **real USDC** for buy-ins and payouts!

### Key Features ✨

- 💰 **USDC Payments**: Buy in with USDC, cash out winnings in USDC
- 🎯 **$5 Max Buy-in**: Capped at $5 USD to keep it fun and low-risk
- 🎲 **Automatic Blinds**: Small blind ($0.025) and big blind ($0.05) posted automatically
- 💸 **Cash Out Anytime**: Withdraw your chips to USDC when not in a hand
- 🔒 **Secure**: All funds held in PDA (Program Derived Address) - can't be stolen

## 5-Minute Deployment

### Step 1: Switch to Devnet

```bash
solana config set --url devnet
```

### Step 2: Fund Your Wallet

```bash
# Request test SOL for transaction fees
solana airdrop 2

# Check balance
solana balance
```

### Step 3: Deploy the Program

```bash
cd /home/user/solanaPokerA2P
./scripts/deploy-usdc-poker.sh
```

This will:
1. ✅ Build the Rust program
2. ✅ Deploy to Solana devnet
3. ✅ Give you a **Program ID**
4. ✅ Update your config files

**Save the Program ID!** You'll need it.

### Step 4: Get Test USDC

1. Go to: https://spl-token-faucet.com/
2. Enter your wallet address: `FUrDcTgNyfnAwxLCmrF3YDTHcXnhXLrTAqpiLw94jdHT`
3. Select USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
4. Click "Request Tokens"
5. You'll get 100 test USDC (not real money!)

### Step 5: Test the Game

```bash
cd scripts
npm install
ts-node test-poker-usdc.ts
```

This test demonstrates:
- ✅ Initializing the game
- ✅ Two players buying in with USDC
- ✅ Starting a round (automatic blinds)
- ✅ Placing bets
- ✅ Ending the round
- ✅ Cashing out

## Game Rules

### Buy-In
- **Minimum**: $0.50 USDC (10x the big blind)
- **Maximum**: $5.00 USDC (enforced by smart contract)
- **Top-up**: Players can add more chips anytime (within limits)

### Blinds (Automatic)
When you start a round:
- **Small Blind**: $0.025 USDC (automatically deducted)
- **Big Blind**: $0.05 USDC (automatically deducted)
- **Posted by**: Players left of dealer (rotates each round)

### Actions
- **Fold**: Give up this hand (free)
- **Call**: Match the current bet
- **Raise**: Increase the bet (minimum = 1x big blind = $0.05)

### Cash Out
- **When**: Only when game is in "Waiting" stage (not during a hand)
- **How**: All your chips convert to USDC and transfer to your wallet
- **Effect**: You leave the game

## Smart Contract Instructions

Your Rust program has these instructions:

1. **InitializeGame**: Create a new game (authority only)
2. **BuyIn**: Join game with USDC ($0.50 - $5.00)
3. **StartRound**: Begin new round, post blinds (authority only)
4. **Fold**: Fold your hand
5. **Call**: Match current bet
6. **Raise**: Increase the bet
7. **EndRound**: Declare winner, distribute pot (authority only)
8. **CashOut**: Convert chips to USDC and leave game

## File Structure

```
solanaPokerA2P/
├── program/
│   ├── src/lib.rs                   ← Smart contract (USDC integrated!)
│   └── Cargo.toml                   ← Updated with SPL token deps
│
├── scripts/
│   ├── deploy-usdc-poker.sh         ← Deployment script
│   └── test-poker-usdc.ts           ← Integration test
│
├── app/
│   └── src/utils/solana.ts          ← USDC config & helpers
│
├── USDC_POKER_GUIDE.md              ← Comprehensive guide
└── QUICKSTART_USDC.md               ← This file!
```

## Testing Checklist

- [ ] Deployed program to devnet
- [ ] Got Program ID
- [ ] Requested test USDC from faucet
- [ ] Ran `test-poker-usdc.ts` successfully
- [ ] Saw USDC tokens transfer in/out
- [ ] Verified transactions on Solana Explorer

## View Your Transactions

After deployment, visit:
```
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
```

Replace `YOUR_PROGRAM_ID` with the ID from deployment.

## Common Issues

### "Program ID not found"
→ Make sure you ran `./scripts/deploy-usdc-poker.sh`

### "Insufficient USDC balance"
→ Visit https://spl-token-faucet.com/ and request test tokens

### "Invalid buy-in amount"
→ Amount must be between $0.50 and $5.00 USDC

### "Can only cash out when not in a hand"
→ Wait until round ends (game stage = "Waiting")

## Cost Breakdown

### Devnet (Testing) 💸
- **Deploy**: FREE (test SOL from airdrop)
- **Play**: FREE (test USDC from faucet)
- **Total**: $0.00

### Mainnet (Real Money) 💰
- **Deploy**: ~2-5 SOL (~$200-500)
- **Each bet**: ~$0.0001 SOL transaction fee
- **Stakes**: Whatever USDC you buy in with (max $5)

## Next Steps

### 1. Test Thoroughly
- Play multiple rounds
- Try all actions (fold, call, raise)
- Test cash-out
- Invite friends to test multi-player

### 2. Customize
- Change blinds in `program/src/lib.rs` (lines 22-23)
- Adjust max buy-in (line 21)
- Add new features

### 3. Go to Mainnet (⚠️ Real Money!)
1. Switch to mainnet: `solana config set --url mainnet-beta`
2. Fund wallet with real SOL
3. Get real USDC
4. Deploy program
5. Start with small stakes!

## Security Notes

✅ **Safe**:
- USDC held in PDA (Program Derived Address)
- Only the smart contract can move funds
- All transactions on-chain and verifiable

⚠️ **Trust Required**:
- Game authority determines winner
- Card dealing happens off-chain
- Not fully trustless (yet!)

See `USDC_POKER_GUIDE.md` for security details and future improvements.

## Support

- **Full Guide**: See `USDC_POKER_GUIDE.md`
- **Issues**: https://github.com/patruff/solanaPokerA2P/issues
- **Solana Docs**: https://docs.solana.com

---

## TL;DR

```bash
# 1. Deploy
cd /home/user/solanaPokerA2P
./scripts/deploy-usdc-poker.sh

# 2. Get test USDC
# Visit: https://spl-token-faucet.com/
# Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# 3. Test
cd scripts
npm install
ts-node test-poker-usdc.ts

# 4. Play!
```

**Game Settings**:
- Max buy-in: $5 USDC
- Small blind: $0.025
- Big blind: $0.05
- Auto-blinds: Yes
- Cash out: Anytime (when not in hand)

---

**Happy playing! May the blockchain be with you! 🎰💰**
