#!/bin/bash

# Solana Poker DApp - Deployment Script
# This script builds the React app and deploys it to AWS

set -e

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo -e "${RED}❌ AWS CDK is not installed. Please install it first.${NC}"
    exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}📦 Installing infrastructure dependencies...${NC}"
cd "$PROJECT_ROOT/infrastructure"
npm install

echo -e "${BLUE}🏗️  Building CDK infrastructure...${NC}"
npm run build

echo -e "${BLUE}☁️  Deploying infrastructure to AWS...${NC}"
npm run deploy

# Get outputs from CDK
echo -e "${BLUE}📝 Retrieving deployment outputs...${NC}"
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name SolanaPokerStack --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text)
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name SolanaPokerStack --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name SolanaPokerStack --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name SolanaPokerStack --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
IDENTITY_POOL_ID=$(aws cloudformation describe-stacks --stack-name SolanaPokerStack --query "Stacks[0].Outputs[?OutputKey=='IdentityPoolId'].OutputValue" --output text)
REGION=$(aws cloudformation describe-stacks --stack-name SolanaPokerStack --query "Stacks[0].Outputs[?OutputKey=='Region'].OutputValue" --output text)

echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}"
echo ""
echo "Deployment Details:"
echo "  Bucket: $BUCKET_NAME"
echo "  Distribution ID: $DISTRIBUTION_ID"
echo "  User Pool ID: $USER_POOL_ID"
echo "  User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "  Identity Pool ID: $IDENTITY_POOL_ID"
echo "  Region: $REGION"
echo ""

# Create .env file for React app
echo -e "${BLUE}📝 Creating environment configuration for React app...${NC}"
cat > "$PROJECT_ROOT/app/.env.production" << EOF
REACT_APP_AWS_REGION=$REGION
REACT_APP_USER_POOL_ID=$USER_POOL_ID
REACT_APP_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
REACT_APP_IDENTITY_POOL_ID=$IDENTITY_POOL_ID
EOF

echo -e "${GREEN}✅ Environment configuration created${NC}"

# Build React app
echo -e "${BLUE}🔨 Building React application...${NC}"
cd "$PROJECT_ROOT/app"
npm install
npm run build

# Deploy to S3
echo -e "${BLUE}📤 Uploading build to S3...${NC}"
aws s3 sync build/ "s3://$BUCKET_NAME" --delete

# Invalidate CloudFront cache
echo -e "${BLUE}🔄 Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Your application is now live at:"
echo "  https://www.patgpt.us"
echo ""
echo "Next steps:"
echo "  1. Configure Google OAuth credentials in AWS Secrets Manager"
echo "  2. Update Google OAuth callback URLs to include your domain"
echo "  3. Test the authentication flow"
