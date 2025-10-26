import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Player } from '../types';
import './WalletSetup.css';

export default function WalletSetup({ onComplete }: { onComplete: () => void }) {
  const { publicKey, connected } = useWallet();
  const { user, signIn } = useAuth();
  const { initializeGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [useTestMode, setUseTestMode] = useState(true);
  const [addBotOpponent, setAddBotOpponent] = useState(true);

  useEffect(() => {
    // Auto sign-in when component mounts
    if (!user) {
      signIn('Player');
    }
  }, [user, signIn]);

  const handleJoinGame = () => {
    const name = playerName || user?.name || 'Player';

    // Use fake wallet if in test mode
    const walletAddress = useTestMode
      ? `FAKE_WALLET_${Math.random().toString(36).substring(7)}`
      : publicKey?.toString();

    if (!useTestMode && (!connected || !publicKey)) {
      alert('Please connect your wallet first or enable test mode');
      return;
    }

    // For testing: Initialize game with predefined players
    const players: Player[] = [
      {
        pubkey: walletAddress!,
        name: name,
        chips: 1000,
        currentBet: 0,
        isActive: true,
        hasFolded: false,
      },
    ];

    // Add test bot if enabled
    if (addBotOpponent) {
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
        <h2>🎰 Poker Game Setup</h2>
        <p className="welcome-text">Welcome, {user?.name || 'Player'}!</p>

        <div className="player-setup">
          <label htmlFor="playerName">Your Name</label>
          <input
            id="playerName"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="name-input"
          />

          <div className="test-mode">
            <label>
              <input
                type="checkbox"
                checked={useTestMode}
                onChange={(e) => setUseTestMode(e.target.checked)}
              />
              <span>🎮 Test Mode (No Wallet Required)</span>
            </label>
          </div>

          <div className="test-mode">
            <label>
              <input
                type="checkbox"
                checked={addBotOpponent}
                onChange={(e) => setAddBotOpponent(e.target.checked)}
              />
              <span>🤖 Add Bot Opponent</span>
            </label>
          </div>

          {!useTestMode && (
            <div className="wallet-section">
              <WalletMultiButton />
              {connected && publicKey && (
                <div className="wallet-info">
                  <p className="success-text">✓ Wallet Connected</p>
                  <p className="wallet-address">{publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</p>
                </div>
              )}
            </div>
          )}

          <button
            className="join-game-btn"
            onClick={handleJoinGame}
          >
            Start Game 🃏
          </button>
        </div>

        <div className="info-box">
          <h3>ℹ️ How to Play</h3>
          <ul>
            <li>✅ Test Mode: Play instantly without a wallet</li>
            <li>🤖 Bot Opponent: Practice against AI</li>
            <li>💰 Start with 1000 chips</li>
            <li>🎯 Test the poker mechanics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
