import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { getCardDisplay, makeBotDecision, calculateBotRaise, evaluateHand } from '../utils/poker';
import { Card } from '../types';
import './PokerTable.css';

export default function PokerTable() {
  const { gameState, localCards, communityCards, startNewRound, fold, call, raise, endRound } = useGame();
  const { user, signOut } = useAuth();
  const { publicKey } = useWallet();
  const [raiseAmount, setRaiseAmount] = useState(100);
  const [showCommunityCards, setShowCommunityCards] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (gameState?.gameStage === 'PreFlop') {
      setShowCommunityCards(0);
    } else if (gameState?.gameStage === 'Flop') {
      setShowCommunityCards(3);
    } else if (gameState?.gameStage === 'Turn') {
      setShowCommunityCards(4);
    } else if (gameState?.gameStage === 'River') {
      setShowCommunityCards(5);
    }
  }, [gameState?.gameStage]);

  const handleStartRound = () => {
    startNewRound();
    setMessage('New round started! Place your bets.');
  };

  const handleFold = () => {
    if (!publicKey) return;
    fold(publicKey.toString());
    setMessage('You folded.');
    
    // Bot's turn
    setTimeout(() => handleBotTurn(), 1000);
  };

  const handleCall = () => {
    if (!publicKey || !gameState) return;
    const player = gameState.players.find(p => p.pubkey === publicKey.toString());
    if (!player) return;
    
    const callAmount = gameState.currentBet - player.currentBet;
    call(publicKey.toString());
    setMessage(`You called with ${callAmount} lamports.`);
    
    // Bot's turn
    setTimeout(() => handleBotTurn(), 1000);
  };

  const handleRaise = () => {
    if (!publicKey) return;
    raise(publicKey.toString(), raiseAmount);
    setMessage(`You raised by ${raiseAmount} lamports.`);
    
    // Bot's turn
    setTimeout(() => handleBotTurn(), 1000);
  };

  const handleBotTurn = () => {
    if (!gameState) return;
    
    const bot = gameState.players.find(p => p.pubkey.startsWith('BOT_'));
    if (!bot || bot.hasFolded) return;

    const botCards = bot.cards || [];
    const visibleCommunity = communityCards.slice(0, showCommunityCards);
    const decision = makeBotDecision(botCards, visibleCommunity, gameState.currentBet, bot.chips, gameState.potTotal);

    setTimeout(() => {
      if (decision === 'fold') {
        fold(bot.pubkey);
        setMessage('Bot folded.');
      } else if (decision === 'call') {
        call(bot.pubkey);
        setMessage('Bot called.');
      } else if (decision === 'raise') {
        const allCards = [...botCards, ...visibleCommunity];
        const handStrength = evaluateHand(allCards);
        const raiseAmt = calculateBotRaise(gameState.potTotal, bot.chips, handStrength.rank);
        raise(bot.pubkey, raiseAmt);
        setMessage(`Bot raised by ${raiseAmt} lamports.`);
      }
    }, 500);
  };

  const handleEndRound = () => {
    if (!gameState || !publicKey) return;
    
    // Simple winner determination (in real game, this would be based on hand evaluation)
    const activePlayers = gameState.players.filter(p => !p.hasFolded);
    if (activePlayers.length === 1) {
      endRound(activePlayers[0].pubkey);
      setMessage(`${activePlayers[0].name} wins the pot!`);
    } else {
      // For now, just pick the first active player
      endRound(activePlayers[0].pubkey);
      setMessage(`${activePlayers[0].name} wins the pot!`);
    }
  };

  const advanceStage = () => {
    if (!gameState) return;
    
    const stages = ['PreFlop', 'Flop', 'Turn', 'River', 'Showdown'];
    const currentIndex = stages.indexOf(gameState.gameStage as string);
    if (currentIndex < stages.length - 1) {
      // This would normally be handled by the smart contract
      setMessage(`Advancing to ${stages[currentIndex + 1]}`);
    }
  };

  if (!gameState) {
    return (
      <div className="poker-table-container">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.pubkey === publicKey?.toString());

  return (
    <div className="poker-table-container">
      <div className="header">
        <div className="user-info">
          <span>Welcome, {user?.displayName}</span>
          <button className="signout-btn" onClick={signOut}>Sign Out</button>
        </div>
      </div>

      <div className="poker-table">
        <div className="table-felt">
          {/* Community Cards */}
          <div className="community-cards">
            <h3>Community Cards</h3>
            <div className="cards-display">
              {communityCards.slice(0, showCommunityCards).map((card, index) => (
                <div key={index} className={`card ${card.suit}`}>
                  {getCardDisplay(card)}
                </div>
              ))}
              {showCommunityCards === 0 && (
                <div className="no-cards">No cards dealt yet</div>
              )}
            </div>
          </div>

          {/* Pot */}
          <div className="pot-display">
            <div className="pot-amount">
              <span className="pot-label">POT</span>
              <span className="pot-value">{gameState.potTotal} lamports</span>
            </div>
            <div className="game-stage">{gameState.gameStage}</div>
          </div>

          {/* Players */}
          <div className="players-container">
            {gameState.players.map((player, index) => (
              <div
                key={player.pubkey}
                className={`player-seat ${player.hasFolded ? 'folded' : ''} ${
                  player.pubkey === publicKey?.toString() ? 'current-user' : ''
                }`}
              >
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-chips">{player.chips} chips</div>
                  {player.currentBet > 0 && (
                    <div className="player-bet">Bet: {player.currentBet}</div>
                  )}
                  {player.hasFolded && <div className="folded-badge">FOLDED</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player's Hand */}
        {currentPlayer && (
          <div className="player-hand">
            <h3>Your Hand</h3>
            <div className="cards-display">
              {localCards.map((card, index) => (
                <div key={index} className={`card ${card.suit}`}>
                  {getCardDisplay(card)}
                </div>
              ))}
              {localCards.length === 0 && (
                <div className="no-cards">Waiting for cards...</div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="game-controls">
          {gameState.gameStage === 'Waiting' ? (
            <button className="control-btn start-btn" onClick={handleStartRound}>
              Start New Round
            </button>
          ) : (
            <>
              <div className="action-buttons">
                <button className="control-btn fold-btn" onClick={handleFold}>
                  Fold
                </button>
                <button className="control-btn call-btn" onClick={handleCall}>
                  Call ({gameState.currentBet - (currentPlayer?.currentBet || 0)})
                </button>
                <div className="raise-group">
                  <input
                    type="number"
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(Number(e.target.value))}
                    min="1"
                    className="raise-input"
                  />
                  <button className="control-btn raise-btn" onClick={handleRaise}>
                    Raise
                  </button>
                </div>
              </div>
              <div className="stage-controls">
                <button className="control-btn" onClick={advanceStage}>
                  Next Stage
                </button>
                <button className="control-btn end-btn" onClick={handleEndRound}>
                  End Round
                </button>
              </div>
            </>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className="message-display">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
