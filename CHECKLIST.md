# Setup Checklist

Use this checklist to track your progress setting up the Solana Poker DApp.

## Phase 1: Environment Setup

### Prerequisites Installation
- [ ] Node.js installed (v16+) - `node --version`
- [ ] Rust installed - `rustc --version`
- [ ] Solana CLI installed - `solana --version`
  - [ ] Tried Homebrew: `brew install solana`
  - [ ] OR tried direct install: `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`
  - [ ] If SSL errors, checked `SOLANA_INSTALL.md` for alternatives
- [ ] Phantom wallet browser extension installed
- [ ] AWS CLI installed (for S3 deployment) - `aws --version`


### Solana Configuration
- [ ] Solana configured for devnet - `solana config set --url devnet`
- [ ] Created main wallet - `solana-keygen new`
- [ ] Funded wallet with test SOL - `solana airdrop 2`
- [ ] Verified balance - `solana balance`
- [ ] Created test bot wallet (optional) - `solana-keygen new --outfile bot-keypair.json`
- [ ] Funded bot wallet (optional) - `solana airdrop 2 <bot-address>`

### Phantom Wallet Setup
- [ ] Created primary Phantom wallet
- [ ] Switched to Devnet in Phantom
- [ ] Funded Phantom wallet with test SOL
- [ ] Created additional test wallets (for multi-player testing)
- [ ] Saved all recovery phrases securely

## Phase 2: Smart Contract Deployment

### Build and Deploy
- [ ] Navigated to program directory - `cd program`
- [ ] Built the program - `cargo build-bpf`
- [ ] Build completed successfully
- [ ] Deployed to devnet - `solana program deploy target/deploy/solana_poker.so`
- [ ] Saved Program ID from deployment output
- [ ] Verified deployment on Solana Explorer

### Configuration Update
- [ ] Updated `app/src/utils/solana.ts` with Program ID
- [ ] Verified Program ID is correct

## Phase 3: Firebase Setup

### Firebase Project
- [ ] Created Firebase project at console.firebase.google.com
- [ ] Named project appropriately
- [ ] Enabled Google Authentication in Firebase Console
- [ ] Added authorized domain (localhost for testing)
- [ ] Got Firebase configuration object

### Frontend Configuration
- [ ] Updated `app/src/utils/firebase.ts` with:
  - [ ] apiKey
  - [ ] authDomain
  - [ ] projectId
  - [ ] storageBucket
  - [ ] messagingSenderId
  - [ ] appId

## Phase 4: Frontend Setup

### Installation
- [ ] Navigated to app directory - `cd app`
- [ ] Installed dependencies - `npm install`
- [ ] No errors during installation
- [ ] Created `.env` file from `.env.example` (optional)

### Local Testing
- [ ] Started dev server - `npm start`
- [ ] App opened at http://localhost:3000
- [ ] No console errors
- [ ] Login page displays correctly

## Phase 5: Solo Testing

### Basic Functionality
- [ ] Signed in with Google account
- [ ] Google authentication worked
- [ ] Connected Phantom wallet
- [ ] Wallet connection successful
- [ ] Enabled "Test Mode" (bot opponent)
- [ ] Joined game successfully
- [ ] Game table displays correctly

### Game Testing
- [ ] Started new round
- [ ] Cards dealt correctly
- [ ] Placed a bet
- [ ] Transaction appeared in Phantom
- [ ] Approved transaction
- [ ] Pot updated correctly
- [ ] Tested "Fold" action
- [ ] Tested "Call" action
- [ ] Tested "Raise" action
- [ ] Bot responded appropriately
- [ ] Advanced through game stages
- [ ] Ended round successfully
- [ ] Winner received pot
- [ ] Balance updated correctly

### Transaction Verification
- [ ] Checked transaction in Phantom history
- [ ] Verified transaction on Solana Explorer (devnet)
- [ ] Confirmed SOL transfers are correct

## Phase 6: Multi-Wallet Testing

### Setup Multiple Wallets
- [ ] Created 2nd Phantom wallet
- [ ] Funded 2nd wallet with test SOL
- [ ] Created 3rd Phantom wallet (optional)
- [ ] Funded 3rd wallet with test SOL (optional)

### Multi-Player Testing
- [ ] Opened app in Browser 1
- [ ] Connected Wallet 1
- [ ] Joined game as Player 1
- [ ] Opened app in Browser 2 (or incognito)
- [ ] Connected Wallet 2
- [ ] Joined game as Player 2
- [ ] Both players visible at table
- [ ] Started round from Player 1
- [ ] Both players can see game state
- [ ] Took turns betting
- [ ] Pot synchronized correctly
- [ ] Completed round
- [ ] Winner received correct payout

## Phase 7: Production Build

### Build for Production
- [ ] Ran production build - `npm run build`
- [ ] Build completed successfully
- [ ] No build errors
- [ ] Build folder created
- [ ] Tested build locally (optional) - `npx serve -s build`

## Phase 8: S3 Deployment (Optional)

### S3 Configuration
- [ ] S3 bucket exists (www.patgpt.us or similar)
- [ ] Static website hosting enabled
- [ ] Index document set to `index.html`
- [ ] Bucket policy allows public read
- [ ] CORS configured (if needed)

### Deployment
- [ ] Uploaded build files to S3 - `aws s3 sync build/ s3://bucket-name --delete`
- [ ] Verified files uploaded
- [ ] Tested website URL
- [ ] Website loads correctly
- [ ] All functionality works on production

### Domain Configuration (if using custom domain)
- [ ] DNS configured to point to S3
- [ ] SSL certificate configured (CloudFront)
- [ ] HTTPS working

## Phase 9: Sibling Setup

### Documentation
- [ ] Sent PLAYER_SETUP.md to Joe
- [ ] Sent PLAYER_SETUP.md to Phil
- [ ] Sent PLAYER_SETUP.md to Sarah
- [ ] Provided website URL

### Support
- [ ] Joe installed Phantom
- [ ] Joe funded wallet
- [ ] Joe joined game successfully
- [ ] Phil installed Phantom
- [ ] Phil funded wallet
- [ ] Phil joined game successfully
- [ ] Sarah installed Phantom
- [ ] Sarah funded wallet
- [ ] Sarah joined game successfully

### First Family Game
- [ ] All 4 players connected
- [ ] Played test round together
- [ ] Everyone understood controls
- [ ] No major issues
- [ ] Collected feedback

## Phase 10: Optimization (Optional)

### Performance
- [ ] Monitored transaction times
- [ ] Checked for UI lag
- [ ] Optimized slow components
- [ ] Tested on mobile devices

### Features
- [ ] Added requested features
- [ ] Fixed reported bugs
- [ ] Improved UI/UX based on feedback
- [ ] Updated documentation

## Phase 11: Mainnet Migration (Future)

### Preparation
- [ ] Thoroughly tested on devnet
- [ ] All bugs fixed
- [ ] Security review completed
- [ ] Decided on initial stakes

### Mainnet Deployment
- [ ] Switched to mainnet - `solana config set --url mainnet-beta`
- [ ] Funded mainnet wallet with real SOL
- [ ] Deployed program to mainnet
- [ ] Updated frontend with mainnet Program ID
- [ ] Updated frontend to use mainnet RPC
- [ ] Rebuilt and redeployed frontend
- [ ] Tested with small amounts first

### Player Migration
- [ ] Instructed players to switch to mainnet
- [ ] Players funded mainnet wallets
- [ ] Played test game with small stakes
- [ ] Verified everything works
- [ ] Gradually increased stakes

## Troubleshooting Checklist

If something doesn't work, check:

- [ ] Solana network is correct (devnet vs mainnet)
- [ ] Phantom is on correct network
- [ ] Wallet has sufficient SOL
- [ ] Program ID is correct in frontend
- [ ] Firebase config is correct
- [ ] No console errors in browser
- [ ] Transactions are confirming
- [ ] RPC endpoint is responding

## Maintenance Checklist

Regular maintenance:

- [ ] Monitor transaction success rate
- [ ] Check for Solana network issues
- [ ] Update dependencies periodically
- [ ] Backup wallet keypairs
- [ ] Review Firebase usage
- [ ] Check S3 costs
- [ ] Gather player feedback

## Notes

Use this space to track issues, ideas, or important information:

```
Date: ___________
Issue/Note: _________________________________________________
Resolution: _________________________________________________

Date: ___________
Issue/Note: _________________________________________________
Resolution: _________________________________________________

Date: ___________
Issue/Note: _________________________________________________
Resolution: _________________________________________________
```

---

**Progress Tracking**

- Phase 1: ☐ Not Started | ☐ In Progress | ☐ Complete
- Phase 2: ☐ Not Started | ☐ In Progress | ☐ Complete
- Phase 3: ☐ Not Started | ☐ In Progress | ☐ Complete
- Phase 4: ☐ Not Started | ☐ In Progress | ☐ Complete
- Phase 5: ☐ Not Started | ☐ In Progress | ☐ Complete
- Phase 6: ☐ Not Started | ☐ In Progress | ☐ Complete
- Phase 7: ☐ Not Started | ☐ In Progress | ☐ Complete
- Phase 8: ☐ Not Started | ☐ In Progress | ☐ Complete
- Phase 9: ☐ Not Started | ☐ In Progress | ☐ Complete
- Phase 10: ☐ Not Started | ☐ In Progress | ☐ Complete
- Phase 11: ☐ Not Started | ☐ In Progress | ☐ Complete

**Overall Progress: ____%**

---

Good luck! 🎰🚀
