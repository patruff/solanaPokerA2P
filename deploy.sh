#!/bin/bash

# Solana Poker DApp Deployment Script
# This script helps deploy the smart contract and build the frontend

set -e

echo "🎰 Solana Poker DApp Deployment Script"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI is not installed${NC}"
    echo "Install it from: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: Rust is not installed${NC}"
    echo "Install it from: https://rustup.rs/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Install it from: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites are installed${NC}"
echo ""

# Get current Solana config
echo "Current Solana Configuration:"
solana config get
echo ""

# Ask user to confirm network
read -p "Are you deploying to the correct network? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please configure Solana network first:"
    echo "  solana config set --url devnet    (for testing)"
    echo "  solana config set --url mainnet-beta    (for production)"
    exit 1
fi

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo "Wallet balance: $BALANCE SOL"
if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo -e "${YELLOW}Warning: Low balance. You may need more SOL for deployment.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Step 1: Building Solana Program"
echo "================================"
cd program
echo "Running cargo build-bpf..."
cargo build-bpf

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to build Solana program${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Program built successfully${NC}"
echo ""

# Ask if user wants to deploy
read -p "Deploy the program to Solana? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploying program..."
    DEPLOY_OUTPUT=$(solana program deploy target/deploy/solana_poker.so)
    echo "$DEPLOY_OUTPUT"
    
    # Extract program ID
    PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP 'Program Id: \K[A-Za-z0-9]+')
    
    if [ -z "$PROGRAM_ID" ]; then
        echo -e "${RED}Error: Could not extract Program ID${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}✓ Program deployed successfully${NC}"
    echo -e "${YELLOW}Program ID: $PROGRAM_ID${NC}"
    echo ""
    echo "IMPORTANT: Update app/src/utils/solana.ts with this Program ID:"
    echo "export const POKER_PROGRAM_ID = new PublicKey('$PROGRAM_ID');"
    echo ""
    
    # Ask if user wants to auto-update
    read -p "Automatically update the frontend config? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd ../app/src/utils
        sed -i.bak "s/YOUR_PROGRAM_ID_HERE/$PROGRAM_ID/" solana.ts
        echo -e "${GREEN}✓ Frontend config updated${NC}"
        cd ../../..
    fi
fi

cd ..

echo ""
echo "Step 2: Building Frontend"
echo "========================="
cd app

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Building React app..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to build frontend${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Ask about S3 deployment
read -p "Deploy to S3? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your S3 bucket name: " BUCKET_NAME
    
    if [ -z "$BUCKET_NAME" ]; then
        echo -e "${RED}Error: Bucket name cannot be empty${NC}"
        exit 1
    fi
    
    echo "Deploying to S3 bucket: $BUCKET_NAME"
    aws s3 sync build/ s3://$BUCKET_NAME --delete
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Deployed to S3 successfully${NC}"
        echo ""
        echo "Your app should be live at:"
        echo "http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
    else
        echo -e "${RED}Error: S3 deployment failed${NC}"
        echo "Make sure AWS CLI is configured and you have access to the bucket"
    fi
fi

cd ..

echo ""
echo "======================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "======================================="
echo ""
echo "Next steps:"
echo "1. Update Firebase config in app/src/utils/firebase.ts"
echo "2. Test the app locally: cd app && npm start"
echo "3. Invite your siblings to play!"
echo ""
echo "For testing instructions, see TESTING.md"
echo ""
