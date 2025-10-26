#!/bin/bash

# Quick deployment script for updating the React app only
# Use this after the infrastructure is already deployed

set -e

echo "🚀 Quick deployment - updating React app only..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Get outputs from CDK
echo -e "${BLUE}📝 Retrieving deployment configuration...${NC}"
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name SolanaPokerStack --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text)
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name SolanaPokerStack --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)

if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${RED}❌ Could not find deployment. Please run full deployment first.${NC}"
    exit 1
fi

# Build React app
echo -e "${BLUE}🔨 Building React application...${NC}"
cd "$PROJECT_ROOT/app"
npm run build

# Deploy to S3
echo -e "${BLUE}📤 Uploading build to S3...${NC}"
aws s3 sync build/ "s3://$BUCKET_NAME" --delete

# Invalidate CloudFront cache
echo -e "${BLUE}🔄 Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"

echo ""
echo -e "${GREEN}✅ Quick deployment completed!${NC}"
echo "Your updates are now live at: https://www.patgpt.us"
