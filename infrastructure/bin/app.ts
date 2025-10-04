#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SolanaPokerStack } from './lib/solana-poker-stack';

const app = new cdk.App();

// Get configuration from context or environment variables
const domainName = app.node.tryGetContext('domainName') || 'www.patgpt.us';
const hostedZoneName = app.node.tryGetContext('hostedZoneName') || 'patgpt.us';
const googleClientId = app.node.tryGetContext('googleClientId') || process.env.GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.warn('WARNING: Google Client ID not provided. Set it via context or GOOGLE_CLIENT_ID environment variable.');
}

new SolanaPokerStack(app, 'SolanaPokerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  domainName,
  hostedZoneName,
  googleClientId,
  description: 'Infrastructure for Solana Poker DApp with S3, CloudFront, Cognito, and Google Authentication',
});

app.synth();
