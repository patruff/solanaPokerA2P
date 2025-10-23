#!/bin/bash

# Deploy Solana Poker with USDC Integration
# This script builds and deploys the poker program to Solana devnet

set -e

echo "🎰 Deploying Solana Poker with USDC Integration"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on correct network
CURRENT_CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
echo -e "${YELLOW}Current cluster: $CURRENT_CLUSTER${NC}"

if [[ "$CURRENT_CLUSTER" != *"devnet"* ]]; then
  echo -e "${RED}WARNING: Not on devnet! Current: $CURRENT_CLUSTER${NC}"
  echo "Switch to devnet with: solana config set --url devnet"
  exit 1
fi

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo "Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
  echo -e "${RED}Insufficient balance. Need at least 2 SOL for deployment${NC}"
  echo "Request airdrop with: solana airdrop 2"
  exit 1
fi

# Step 1: Build the program
echo ""
echo "Step 1: Building Rust program..."
cd program

echo "Cleaning previous builds..."
cargo clean

echo "Building BPF program..."
cargo build-bpf

if [ ! -f "target/deploy/solana_poker.so" ]; then
  echo -e "${RED}Build failed! .so file not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Step 2: Deploy
echo ""
echo "Step 2: Deploying to devnet..."

DEPLOY_OUTPUT=$(solana program deploy target/deploy/solana_poker.so)
echo "$DEPLOY_OUTPUT"

PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep "Program Id:" | awk '{print $3}')

if [ -z "$PROGRAM_ID" ]; then
  echo -e "${RED}Deployment failed! Could not extract Program ID${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Deployment successful${NC}"
echo ""
echo "================================================"
echo "Program ID: $PROGRAM_ID"
echo "================================================"

# Save program ID to file
echo "$PROGRAM_ID" > program-id.txt
echo "Saved Program ID to program/program-id.txt"

# Step 3: Verify deployment
echo ""
echo "Step 3: Verifying deployment..."

PROGRAM_INFO=$(solana program show $PROGRAM_ID)
echo "$PROGRAM_INFO"

# Step 4: Update configuration files
echo ""
echo "Step 4: Updating configuration..."

cd ..

# Update app/src/utils/solana.ts
SOLANA_CONFIG_FILE="app/src/utils/solana.ts"

if [ -f "$SOLANA_CONFIG_FILE" ]; then
  # Backup original
  cp "$SOLANA_CONFIG_FILE" "${SOLANA_CONFIG_FILE}.bak"

  # Update PROGRAM_ID
  sed -i.tmp "s/export const POKER_PROGRAM_ID = new PublicKey('.*');/export const POKER_PROGRAM_ID = new PublicKey('$PROGRAM_ID');/" "$SOLANA_CONFIG_FILE"
  rm "${SOLANA_CONFIG_FILE}.tmp"

  echo -e "${GREEN}✓ Updated $SOLANA_CONFIG_FILE${NC}"
else
  echo -e "${YELLOW}⚠ $SOLANA_CONFIG_FILE not found, skipping update${NC}"
fi

# Step 5: Instructions for next steps
echo ""
echo "================================================"
echo "🎉 Deployment Complete!"
echo "================================================"
echo ""
echo "Program ID: $PROGRAM_ID"
echo "Network: Solana Devnet"
echo ""
echo "USDC Configuration:"
echo "  - USDC Devnet Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
echo "  - Max Buy-in: \$5 USDC"
echo "  - Small Blind: \$0.025 USDC"
echo "  - Big Blind: \$0.05 USDC"
echo ""
echo "Next Steps:"
echo ""
echo "1. Get test USDC tokens:"
echo "   Visit: https://spl-token-faucet.com/"
echo "   Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
echo ""
echo "2. Test the program:"
echo "   cd scripts"
echo "   npm install"
echo "   ts-node test-poker-usdc.ts"
echo ""
echo "3. Start the frontend:"
echo "   cd app"
echo "   npm install"
echo "   npm start"
echo ""
echo "4. View on Solana Explorer:"
echo "   https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "================================================"
echo ""
echo -e "${GREEN}Ready to play poker with USDC! 🎰💰${NC}"
