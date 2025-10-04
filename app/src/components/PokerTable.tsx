import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { getCardDisplay, makeBotDecision, calculateBotRaise, evaluateHand } from '../utils/poker';
import './PokerTable.css';

export default function PokerTable() {
  const { gameState, localCards, communityCards, currentPlayerPubkey, startNewRound, fold, call, raise, endRound } = useGame();
  const { user, signOut } = useAuth();
  const { publicKey } = useWallet();
  const [raiseAmount, setRaiseAmount] = useState(100);
  const [showCommunityCards, setShowCommunityCards] = useState(0);
  const [message, setMessage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  // Use fake wallet or real wallet
  const playerPubkey = publicKey?.toString() || currentPlayerPubkey;

  // Function to create fireworks
  const createFireworks = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700', '#ff69b4'];
    const container = document.createElement('div');
    container.className = 'fireworks-container';
    document.body.appendChild(container);

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * (window.innerHeight * 0.6);

        for (let j = 0; j < 30; j++) {
          const firework = document.createElement('div');
          firework.className = 'firework';
          firework.style.left = x + 'px';
          firework.style.top = y + 'px';
          firework.style.background = colors[Math.floor(Math.random() * colors.length)];

          const angle = (Math.PI * 2 * j) / 30;
          const velocity = 50 + Math.random() * 100;
          firework.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
          firework.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');

          container.appendChild(firework);
        }
      }, i * 300);
    }

    setTimeout(() => {
      container.remove();
    }, 2000);
  };

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

  // Bot turn automation - trigger when it's bot's turn
  useEffect(() => {
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerTurn];
    if (!currentPlayer || !currentPlayer.pubkey.startsWith('BOT_')) return;
    if (currentPlayer.hasFolded) return;
    if (gameState.gameStage === 'Waiting') return;

    // Trigger bot turn after a delay
    const timer = setTimeout(() => {
      handleBotTurn();
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentPlayerTurn, gameState?.players, gameState?.gameStage]);

  // Auto-evaluate winner at showdown (but don't end round yet)
  useEffect(() => {
    if (!gameState) return;
    if (gameState.gameStage !== 'Showdown') return;

    const timer = setTimeout(() => {
      // Just evaluate and show winner, don't end the round
      const activePlayers = gameState.players.filter(p => !p.hasFolded);

      if (activePlayers.length === 1) {
        const winMessage = `${activePlayers[0].name} wins ${gameState.potTotal} chips!`;
        setMessage(winMessage + ' Click "Start New Round" to continue.');
        setCelebrationMessage(winMessage);
        setShowCelebration(true);
        createFireworks();

        setTimeout(() => setShowCelebration(false), 3000);
      } else if (activePlayers.length > 1) {
        const playerHands = activePlayers.map(player => {
          const allCards = [...(player.cards || []), ...communityCards];
          const handEval = evaluateHand(allCards);
          return { player, evaluation: handEval };
        });

        playerHands.sort((a, b) => b.evaluation.rank - a.evaluation.rank);
        const winner = playerHands[0];

        const winMessage = `${winner.player.name} wins ${gameState.potTotal} chips with ${winner.evaluation.name}!`;
        setMessage(winMessage + ' Click "Start New Round" to continue.');
        setCelebrationMessage(winMessage);
        setShowCelebration(true);
        createFireworks();

        setTimeout(() => setShowCelebration(false), 3000);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.gameStage]);

  // Auto-end round if only one player left (someone folded) - but NOT at Showdown
  useEffect(() => {
    if (!gameState) return;
    if (gameState.gameStage === 'Waiting' || gameState.gameStage === 'Showdown') return;

    const activePlayers = gameState.players.filter(p => !p.hasFolded);
    if (activePlayers.length === 1) {
      const timer = setTimeout(() => {
        handleEndRound();
      }, 1500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.players]);

  const handleStartRound = () => {
    // If we're at showdown, end the round first to distribute chips
    if (gameState?.gameStage === 'Showdown') {
      handleEndRound();
    }
    startNewRound();
    setMessage('New round started! Place your bets.');
  };

  const handleFold = () => {
    if (!playerPubkey || !gameState) return;
    fold(playerPubkey);
    setMessage('You folded.');
  };

  const handleCall = () => {
    if (!playerPubkey || !gameState) return;
    const player = gameState.players.find(p => p.pubkey === playerPubkey);
    if (!player) return;

    const callAmount = gameState.currentBet - player.currentBet;
    call(playerPubkey);
    setMessage(`You called with ${callAmount} lamports.`);
  };

  const handleRaise = () => {
    if (!playerPubkey || !gameState) return;
    const player = gameState.players.find(p => p.pubkey === playerPubkey);
    if (!player) return;

    const callAmount = gameState.currentBet - player.currentBet;
    const totalNeeded = callAmount + raiseAmount;

    if (totalNeeded >= player.chips) {
      // All-in
      raise(playerPubkey, raiseAmount);
      setMessage(`You went ALL-IN with ${player.chips} lamports!`);
    } else {
      raise(playerPubkey, raiseAmount);
      setMessage(`You raised by ${raiseAmount} lamports.`);
    }
  };

  const handleAllIn = () => {
    if (!playerPubkey || !gameState) return;
    const player = gameState.players.find(p => p.pubkey === playerPubkey);
    if (!player) return;

    const totalChips = player.chips;

    // How much to call the current bet
    const callAmount = Math.max(0, gameState.currentBet - player.currentBet);

    // If we can raise after calling, do it. Otherwise just call.
    if (player.chips > callAmount) {
      // We can raise - raise by (all chips - call amount)
      const raiseAmount = player.chips - callAmount;
      raise(playerPubkey, raiseAmount);
      setMessage(`You went ALL-IN with ${totalChips} lamports!`);
    } else {
      // Just call with all available chips
      call(playerPubkey);
      setMessage(`You went ALL-IN with ${totalChips} lamports!`);
    }
  };

  const handleBotTurn = () => {
    if (!gameState) return;

    const bot = gameState.players[gameState.currentPlayerTurn];
    if (!bot || !bot.pubkey.startsWith('BOT_') || bot.hasFolded) return;

    const botCards = bot.cards || [];
    const visibleCommunity = communityCards.slice(0, showCommunityCards);
    const decision = makeBotDecision(botCards, visibleCommunity, gameState.currentBet, bot.chips, gameState.potTotal);

    console.log('Bot decision:', decision, 'Cards:', botCards, 'Community:', visibleCommunity, 'Current bet:', gameState.currentBet, 'Bot chips:', bot.chips);

    if (decision === 'fold') {
      fold(bot.pubkey);
      setMessage('Bot folded.');
    } else if (decision === 'call') {
      call(bot.pubkey);
      const callAmount = gameState.currentBet - bot.currentBet;
      setMessage(`Bot called with ${callAmount} lamports.`);
    } else if (decision === 'raise') {
      const allCards = [...botCards, ...visibleCommunity];
      const handStrength = evaluateHand(allCards);
      const raiseAmt = calculateBotRaise(gameState.potTotal, bot.chips, handStrength.rank);
      raise(bot.pubkey, raiseAmt);
      setMessage(`Bot raised by ${raiseAmt} lamports.`);
    }
  };

  const handleEndRound = () => {
    if (!gameState) return;

    const activePlayers = gameState.players.filter(p => !p.hasFolded);

    if (activePlayers.length === 1) {
      // Only one player left - they win by default
      endRound(activePlayers[0].pubkey);
      setMessage(`${activePlayers[0].name} wins ${gameState.potTotal} chips!`);
    } else if (activePlayers.length > 1) {
      // Evaluate hands and determine winner
      const playerHands = activePlayers.map(player => {
        const allCards = [...(player.cards || []), ...communityCards];
        const handEval = evaluateHand(allCards);
        return {
          player,
          evaluation: handEval,
        };
      });

      // Sort by hand rank (highest first)
      playerHands.sort((a, b) => b.evaluation.rank - a.evaluation.rank);
      const winner = playerHands[0];

      endRound(winner.player.pubkey);
      setMessage(
        `${winner.player.name} wins ${gameState.potTotal} chips with ${winner.evaluation.name}!`
      );
    }
  };


  if (!gameState) {
    return (
      <div className="poker-table-container">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.pubkey === playerPubkey);

  return (
    <div className="poker-table-container">
      <div className="header">
        <div className="user-info">
          <span>Welcome, {user?.name || 'Player'}</span>
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
                  player.pubkey === playerPubkey ? 'current-user' : ''
                }`}
              >
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-chips">{player.chips} chips</div>
                  {player.currentBet > 0 && (
                    <div className="player-bet">Bet: {player.currentBet}</div>
                  )}
                  {player.hasFolded && <div className="folded-badge">FOLDED</div>}
                  {/* Show bot cards at showdown */}
                  {gameState.gameStage === 'Showdown' && player.pubkey.startsWith('BOT_') && player.cards && (
                    <div className="bot-cards">
                      {player.cards.map((card, idx) => (
                        <div key={idx} className={`card small ${card.suit}`}>
                          {getCardDisplay(card)}
                        </div>
                      ))}
                    </div>
                  )}
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
          {gameState.gameStage === 'Waiting' || gameState.gameStage === 'Showdown' ? (
            <button className="control-btn start-btn" onClick={handleStartRound}>
              {currentPlayer?.chips === 0 ? 'Retry' : 'Start New Round'}
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
                <button className="control-btn allin-btn" onClick={handleAllIn}>
                  ALL IN ({currentPlayer?.chips || 0})
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

        {/* Celebration Message */}
        {showCelebration && (
          <div className="celebration-message">
            🎉 {celebrationMessage} 🎉
          </div>
        )}
      </div>
    </div>
  );
}
