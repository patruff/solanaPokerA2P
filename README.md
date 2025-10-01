# Solana Poker DApp

A decentralized poker game built on Solana blockchain with real SOL transactions.

## Features

- 🎮 **Full Poker Game**: Texas Hold'em style poker with betting, raising, folding
- 💰 **Real SOL Transactions**: All bets and winnings are actual Solana transactions
- 👥 **Multi-Player Support**: Up to 4 players + 1 spectator seat
- 🤖 **Test Bot**: Practice against an AI opponent
- 🔐 **Phantom Wallet Integration**: Secure wallet connection
- 🔑 **Google Authentication**: Easy login with Gmail
- 🎯 **Spectator Mode**: AI agents or viewers can contribute to the pot
- 📱 **Responsive Design**: Works on desktop and mobile

## Project Structure

```
solana-poker-dapp/
├── program/              # Solana smart contract (Rust)
│   ├── src/
│   │   └── lib.rs       # Main program logic
│   ├── Cargo.toml       # Rust dependencies
│   └── client.ts        # TypeScript SDK for interacting with program
├── app/                 # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts (Auth, Game)
│   │   ├── utils/       # Utility functions
│   │   ├── types/       # TypeScript types
│   │   ├── App.tsx      # Main app component
│   │   └── index.tsx    # Entry point
│   ├── public/          # Static assets
│   └── package.json     # Frontend dependencies
└── README.md           # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **Rust** (latest stable version)
- **Solana CLI** (v1.17 or higher)
- **Anchor Framework** (optional, for easier development)
- **Phantom Wallet** browser extension

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd solana-poker-dapp
```

### 2. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

Verify installation:
```bash
solana --version
```

### 3. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 4. Configure Solana for Devnet

```bash
solana config set --url devnet
```

### 5. Create Test Wallets

Create a wallet for yourself (the house):
```bash
solana-keygen new --outfile ~/.config/solana/house-keypair.json
```

Create a wallet for testing (bot opponent):
```bash
solana-keygen new --outfile ~/.config/solana/bot-keypair.json
```

Get your wallet addresses:
```bash
solana-keygen pubkey ~/.config/solana/house-keypair.json
solana-keygen pubkey ~/.config/solana/bot-keypair.json
```

### 6. Fund Your Test Wallets

Request airdrop for testing (2 SOL each):
```bash
solana airdrop 2 $(solana-keygen pubkey ~/.config/solana/house-keypair.json)
solana airdrop 2 $(solana-keygen pubkey ~/.config/solana/bot-keypair.json)
```

Check balance:
```bash
solana balance
```

## Building and Deploying the Smart Contract

### 1. Build the Program

```bash
cd program
cargo build-bpf
```

### 2. Deploy to Devnet

```bash
solana program deploy target/deploy/solana_poker.so
```

This will output a Program ID. **Save this ID!** You'll need it for the frontend.

### 3. Update Frontend Configuration

Edit `app/src/utils/solana.ts` and replace `YOUR_PROGRAM_ID_HERE` with your deployed program ID:

```typescript
export const POKER_PROGRAM_ID = new PublicKey('YOUR_ACTUAL_PROGRAM_ID');
```

## Setting Up Firebase Authentication

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Follow the setup wizard
4. Enable Google Authentication in Authentication > Sign-in method

### 2. Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps"
3. Click the web icon (</>)
4. Copy the configuration object

### 3. Update Firebase Config

Edit `app/src/utils/firebase.ts` and replace the placeholder values:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

## Running the Frontend

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

This creates a `build/` folder with optimized production files.

## Deploying to S3 (Your Website)

### 1. Build the App

```bash
cd app
npm run build
```

### 2. Configure S3 Bucket

Make sure your S3 bucket is configured for static website hosting:

1. Go to AWS S3 Console
2. Select your bucket
3. Go to Properties > Static website hosting
4. Enable it and set `index.html` as the index document

### 3. Upload to S3

```bash
aws s3 sync build/ s3://your-bucket-name --delete
```

Or use the AWS Console to upload the contents of the `build/` folder.

### 4. Configure CORS (if needed)

Add this CORS configuration to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## Testing the Game

### Solo Testing with Bot

1. Sign in with your Google account
2. Connect your Phantom wallet
3. Check "Test Mode (Add Bot Opponent)"
4. Click "Join Game"
5. Start playing against the bot

### Testing with Multiple Wallets

1. Open the app in different browsers or incognito windows
2. Use different Google accounts
3. Connect different Phantom wallets
4. Each player joins the game
5. Play poker together!

### Using Phantom Test Wallets

1. Create multiple Phantom wallet accounts
2. Switch between them in the Phantom extension
3. Fund each with test SOL from the faucet
4. Use each wallet to join as a different player

## Game Flow

1. **Login**: Players sign in with Google
2. **Connect Wallet**: Players connect their Phantom wallet
3. **Join Game**: Players join the poker table
4. **Start Round**: Authority (first player) starts a new round
5. **Betting**: Players can fold, call, or raise
6. **Stages**: Game progresses through PreFlop, Flop, Turn, River
7. **Showdown**: Winner is determined and receives the pot
8. **Next Round**: Start a new round

## Spectator/AI Agent Integration

The spectator seat is designed to support AI agents:

1. AI agent connects with its own Phantom wallet
2. Joins as spectator (when player seats are full)
3. Can contribute SOL to the pot using `spectatorContribute` instruction
4. Future: AI can analyze game and make strategic contributions

## Smart Contract Instructions

The Solana program supports these instructions:

- `InitializeGame`: Create a new game instance
- `JoinGame`: Player joins the game
- `PlaceBet`: Place a bet
- `DealCards`: Deal cards (authority only)
- `Fold`: Fold current hand
- `Call`: Call current bet
- `Raise`: Raise the bet
- `EndRound`: End round and distribute pot
- `SpectatorContribute`: Spectator adds to pot

## Security Considerations

⚠️ **Important**: This is a development/testing version. For production:

1. Implement proper hand evaluation on-chain or with verifiable randomness
2. Add access controls and anti-cheating measures
3. Use a proper random number generator (Chainlink VRF or similar)
4. Audit the smart contract
5. Implement proper error handling
6. Add rate limiting and spam protection
7. Secure Firebase rules
8. Use environment variables for sensitive data

## Troubleshooting

### "Insufficient funds" error
- Make sure your wallet has enough SOL
- Request airdrop: `solana airdrop 2`

### "Program not found" error
- Verify the program ID in `solana.ts` matches your deployed program
- Make sure you're on the correct network (devnet)

### Wallet not connecting
- Make sure Phantom is installed and unlocked
- Check that you're on the correct network in Phantom
- Try refreshing the page

### Firebase authentication not working
- Verify Firebase configuration is correct
- Check that Google auth is enabled in Firebase Console
- Make sure your domain is authorized in Firebase

## Future Enhancements

- [ ] Implement proper poker hand evaluation
- [ ] Add verifiable randomness for card dealing
- [ ] Support for multiple simultaneous games
- [ ] Tournament mode
- [ ] Leaderboard and statistics
- [ ] Chat functionality
- [ ] Mobile app (React Native)
- [ ] Integration with AI agents (GPT-4, Claude, etc.)
- [ ] NFT playing cards
- [ ] Staking and rewards

## Players

This game is designed for:
- **Pat** (you) - House/Authority
- **Joe** (older brother)
- **Phil** (younger brother)
- **Sarah** (sister)
- **Spectator** - AI agent or viewer

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this for your own projects!

## Support

For questions or issues:
- Check the troubleshooting section
- Review Solana documentation: https://docs.solana.com
- Check Phantom wallet docs: https://docs.phantom.app

---

**Have fun playing poker on the blockchain! 🎰♠️♥️♣️♦️**
