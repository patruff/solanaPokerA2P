# Testing Guide for Solana Poker DApp

This guide will help you test the poker game with your Phantom test wallets before your siblings play.

## Setup Test Environment

### 1. Create Multiple Phantom Wallet Accounts

In the Phantom browser extension:

1. Click the menu (three lines)
2. Click "Add / Connect Wallet"
3. Click "Create a new wallet"
4. Save the recovery phrase securely
5. Name it (e.g., "Pat Test", "Test Player 2", etc.)
6. Repeat to create 4-5 test wallets

### 2. Switch to Devnet

In each Phantom wallet:

1. Click Settings (gear icon)
2. Click "Change Network"
3. Select "Devnet"

### 3. Fund Your Test Wallets

For each wallet, get the address and request an airdrop:

**Method 1: Using Phantom**
1. Click "Receive" in Phantom
2. Copy your wallet address
3. Go to https://solfaucet.com
4. Paste your address and request SOL

**Method 2: Using Solana CLI**
```bash
# Replace ADDRESS with your Phantom wallet address
solana airdrop 2 ADDRESS --url devnet
```

### 4. Verify Balances

Check each wallet has SOL:
```bash
solana balance ADDRESS --url devnet
```

## Test Scenarios

### Test 1: Solo Play with Bot

**Objective**: Test basic game mechanics

1. Open the app in your browser
2. Sign in with your Google account
3. Connect your first Phantom wallet
4. Check "Test Mode (Add Bot Opponent)"
5. Click "Join Game"
6. Click "Start New Round"
7. Test each action:
   - Fold
   - Call
   - Raise (try different amounts)
8. Advance through game stages
9. End the round
10. Verify SOL transfers

**Expected Results**:
- Cards are dealt correctly
- Bot makes decisions
- Pot updates correctly
- Winner receives SOL

### Test 2: Multi-Wallet Testing

**Objective**: Test multiple players

1. Open the app in Browser 1
2. Sign in with Google Account 1
3. Connect Phantom Wallet 1
4. Join game

5. Open the app in Browser 2 (or incognito)
6. Sign in with Google Account 2
7. Connect Phantom Wallet 2
8. Join game

9. In Browser 1, start a new round
10. Take turns making bets
11. Test all betting scenarios
12. Complete the round

**Expected Results**:
- Both players see the same game state
- Bets are synchronized
- Pot accumulates correctly
- Winner receives correct amount

### Test 3: Spectator Mode

**Objective**: Test spectator functionality

1. Fill all 4 player seats
2. Try to join with a 5th wallet
3. Should join as spectator
4. Test spectator contribution to pot

**Expected Results**:
- 5th player becomes spectator
- Spectator can contribute SOL
- Pot increases with contribution

### Test 4: Transaction Testing

**Objective**: Verify blockchain transactions

1. Start a game
2. Place bets
3. Check transactions in Phantom
4. Verify on Solana Explorer:
   - Go to https://explorer.solana.com/?cluster=devnet
   - Search for your wallet address
   - View transaction history

**Expected Results**:
- All bets show as transactions
- Pot transfers are recorded
- Winner receives correct payout

## Testing Checklist

### Pre-Game
- [ ] Firebase authentication works
- [ ] Phantom wallet connects
- [ ] Multiple wallets can be used
- [ ] Test mode bot appears

### During Game
- [ ] Cards are dealt
- [ ] Community cards appear at right stages
- [ ] Pot updates correctly
- [ ] Current bet displays correctly
- [ ] Player chips update
- [ ] Fold removes player from round
- [ ] Call matches current bet
- [ ] Raise increases bet
- [ ] Bot makes reasonable decisions

### End Game
- [ ] Winner is determined
- [ ] Pot transfers to winner
- [ ] Game resets for next round
- [ ] Balances are correct

### Edge Cases
- [ ] What happens if player runs out of SOL?
- [ ] What if all players fold except one?
- [ ] What if network is slow?
- [ ] What if wallet disconnects mid-game?

## Common Issues and Solutions

### Issue: Wallet won't connect
**Solution**: 
- Refresh the page
- Make sure Phantom is unlocked
- Check you're on Devnet
- Try disconnecting and reconnecting

### Issue: Transaction fails
**Solution**:
- Check wallet has enough SOL
- Verify you're on Devnet
- Check Solana network status
- Try with smaller bet amount

### Issue: Game state not updating
**Solution**:
- Refresh the page
- Check browser console for errors
- Verify program is deployed correctly
- Check network connection

### Issue: Bot not responding
**Solution**:
- Check browser console for errors
- Verify bot logic in poker.ts
- Try restarting the round

## Performance Testing

### Load Testing
1. Open multiple browser tabs
2. Connect different wallets
3. Play simultaneously
4. Monitor performance

### Network Testing
1. Test on slow connection
2. Test with network interruptions
3. Verify transaction retry logic

## Security Testing

### Test Attack Scenarios
1. Try to bet more than you have
2. Try to act out of turn
3. Try to see other players' cards
4. Try to manipulate pot amount

**Expected Results**: All should fail gracefully

## Data to Record

Keep track of:
- Transaction IDs
- Wallet addresses used
- Any errors encountered
- Performance issues
- User experience feedback

## Before Inviting Siblings

Complete this checklist:

- [ ] All test scenarios pass
- [ ] No critical bugs found
- [ ] Transactions work reliably
- [ ] UI is intuitive
- [ ] Instructions are clear
- [ ] Firebase auth is stable
- [ ] Wallet connection is smooth
- [ ] Game flow makes sense
- [ ] Pot calculations are correct
- [ ] Winner determination works

## Inviting Your Siblings

Once testing is complete:

1. Send them the URL: www.patgpt.us
2. Provide instructions:
   - Install Phantom wallet
   - Switch to Devnet
   - Get test SOL from faucet
   - Sign in with Google
   - Connect wallet
   - Join game

3. Have a test game together
4. Gather feedback
5. Make improvements

## Advanced Testing

### Testing with Real SOL (Mainnet)

⚠️ **Only after thorough testing on Devnet!**

1. Switch to mainnet in Solana config
2. Deploy program to mainnet
3. Update frontend config
4. Test with small amounts first
5. Gradually increase stakes

### Testing AI Agent Integration

1. Create a separate wallet for AI
2. Fund it with test SOL
3. Implement AI decision logic
4. Test spectator contributions
5. Monitor AI behavior

## Monitoring and Logging

### What to Monitor
- Transaction success rate
- Average transaction time
- Error frequency
- User session duration
- Wallet connection issues

### Logging
Check browser console for:
- Error messages
- Transaction logs
- State updates
- Network requests

## Feedback Collection

After testing, document:
- What worked well
- What needs improvement
- Bugs found
- Feature requests
- User experience issues

---

**Happy Testing! 🎮**

Remember: Test thoroughly on Devnet before using real SOL!
