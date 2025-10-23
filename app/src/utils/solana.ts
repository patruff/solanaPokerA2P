import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Solana configuration
export const SOLANA_NETWORK = 'devnet'; // Change to 'mainnet-beta' for production
export const SOLANA_RPC_ENDPOINT = clusterApiUrl(SOLANA_NETWORK);

// Your deployed program ID (update this after deploying)
export const POKER_PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');

// USDC Token Configuration
export const USDC_DECIMALS = 6; // USDC has 6 decimal places

// USDC Mint addresses
export const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
export const USDC_MINT_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// Get the correct USDC mint based on network
export const USDC_MINT = SOLANA_NETWORK === 'mainnet-beta' ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;

// Game constants
export const MAX_BUY_IN_USDC = 5_000_000; // $5 in USDC (5 * 10^6)
export const MIN_BUY_IN_USDC = 500_000; // $0.50 in USDC (0.5 * 10^6)
export const SMALL_BLIND_USDC = 25_000; // $0.025 in USDC
export const BIG_BLIND_USDC = 50_000; // $0.05 in USDC

// Create connection
export const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

// Token Program ID
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

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

// Convert USDC to micro-USDC (with 6 decimals)
export function usdcToMicroUsdc(usdc: number): number {
  return Math.floor(usdc * 1_000_000);
}

// Convert micro-USDC to USDC
export function microUsdcToUsdc(microUsdc: number): number {
  return microUsdc / 1_000_000;
}

// Format USDC amount for display
export function formatUsdc(microUsdc: number): string {
  const usdc = microUsdcToUsdc(microUsdc);
  return `$${usdc.toFixed(2)}`;
}
