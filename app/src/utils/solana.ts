import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Solana configuration
export const SOLANA_NETWORK = 'devnet'; // Change to 'mainnet-beta' for production
export const SOLANA_RPC_ENDPOINT = clusterApiUrl(SOLANA_NETWORK);

// Your deployed program ID (you'll need to update this after deploying)
export const POKER_PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');

// Create connection
export const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

// Lamports per SOL
export const LAMPORTS_PER_SOL = 1000000000;

// Convert SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

// Convert lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}
