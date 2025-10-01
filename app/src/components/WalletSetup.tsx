import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Player } from '../types';
import './WalletSetup.css';

export default function WalletSetup({ onComplete }: { onComplete: () => void }) {
  const { publicKey, connected } = useWallet();
  const { user, updateWalletAddress } = useAuth();
  const { initializeGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [isSpectator, setIsSpectator] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      updateWalletAddress(publicKey.toString());
    }
  }, [connected, publicKey, updateWalletAddress]);

  const handleJoinGame = () => {
    if (!connected || !publicKey || !user) {
      alert('Please connect your wallet first');
      return;
    }

    const name = playerName || user.displayName || 'Player';

    // For testing: Initialize game with predefined players
    const players: Player[] = [
      {
        pubkey: publicKey.toString(),
        name: name,
        chips: 1000,
        currentBet: 0,
        isActive: true,
        hasFolded: false,
      },
    ];

    // Add test bot if in test mode
    if (isSpectator) {
      players.push({
        pubkey: 'BOT_' + Date.now(),
        name: 'Test Bot',
        chips: 1000,
        currentBet: 0,
        isActive: true,
        hasFolded: false,
      });
    }

    initializeGame(players);
    onComplete();
  };

  return (
    <div className="wallet-setup-container">
      <div className="wallet-setup-card">
        <h2>Connect Your Wallet</h2>
        <p className="welcome-text">Welcome, {user?.displayName}!</p>

        <div className="wallet-section">
          <WalletMultiButton />
          
          {connected && publicKey && (
            <div className="wallet-info">
              <p className="success-text">✓ Wallet Connected</p>
              <p className="wallet-address">{publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</p>
            </div>
          )}
        </div>

        <div className="player-setup">
          <label htmlFor="playerName">Player Name (optional)</label>
          <input
            id="playerName"
            type="text"
            placeholder={user?.displayName || 'Enter your name'}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="name-input"
          />

          <div className="test-mode">
            <label>
              <input
                type="checkbox"
                checked={isSpectator}
                onChange={(e) => setIsSpectator(e.target.checked)}
              />
              <span>Test Mode (Add Bot Opponent)</span>
            </label>
          </div>

          <button
            className="join-game-btn"
            onClick={handleJoinGame}
            disabled={!connected}
          >
            {connected ? 'Join Game' : 'Connect Wallet First'}
          </button>
        </div>

        <div className="info-box">
          <h3>Getting Started</h3>
          <ul>
            <li>Connect your Phantom wallet</li>
            <li>Make sure you're on Solana Devnet</li>
            <li>You'll need some test SOL (get from faucet)</li>
            <li>Enable test mode to play against a bot</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
