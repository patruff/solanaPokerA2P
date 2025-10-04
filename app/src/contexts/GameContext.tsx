import React, { createContext, useContext, useState } from 'react';
import { GameState, Player, Card } from '../types';
import { generateDeck, shuffleDeck, dealCards } from '../utils/poker';

interface GameContextType {
  gameState: GameState | null;
  localCards: Card[];
  communityCards: Card[];
  currentPlayerPubkey: string | null;
  initializeGame: (players: Player[]) => void;
  startNewRound: () => void;
  placeBet: (playerId: string, amount: number) => void;
  fold: (playerId: string) => void;
  call: (playerId: string) => void;
  raise: (playerId: string, amount: number) => void;
  endRound: (winnerId: string) => void;
  advanceStage: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localCards, setLocalCards] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [currentPlayerPubkey, setCurrentPlayerPubkey] = useState<string | null>(null);

  // Helper to check if betting round is complete
  const isBettingRoundComplete = (state: GameState): boolean => {
    const activePlayers = state.players.filter(p => !p.hasFolded);
    if (activePlayers.length <= 1) return true;

    // Check if all active players have matched the current bet
    const allMatched = activePlayers.every(p => p.currentBet === state.currentBet);

    // If not all matched, round is not complete
    if (!allMatched) {
      console.log('Betting round NOT complete - bets not matched');
      return false;
    }

    // Special case: if currentBet is 0 and we're at the start of a round,
    // both players need to check (act) before advancing
    // Check if current player has cycled through all active players at least once
    const startingPosition = (state.dealerIndex + 1) % state.players.length;

    // For 2 players: after player1 acts, it's player2's turn (different from start)
    // After player2 acts, it's back to player1 (same as start) - round complete
    const hasCompletedFullRound = state.currentPlayerTurn === startingPosition;

    console.log('Checking betting round complete:', {
      allMatched,
      hasCompletedFullRound,
      currentPlayerTurn: state.currentPlayerTurn,
      startingPosition,
      currentBet: state.currentBet,
      gameStage: state.gameStage,
      playerBets: state.players.map(p => ({ name: p.name, bet: p.currentBet, folded: p.hasFolded })),
    });

    return allMatched && hasCompletedFullRound;
  };

  const initializeGame = (players: Player[]) => {
    const newGameState: GameState = {
      authority: players[0].pubkey, // First player is authority for testing
      maxPlayers: 4,
      currentPlayers: players.length,
      players: players,
      currentBet: 0,
      potTotal: 0,
      gameStage: 'Waiting' as any,
      currentPlayerTurn: 0,
      dealerIndex: 0,
      communityCards: [],
    };
    setGameState(newGameState);
    setCurrentPlayerPubkey(players[0].pubkey); // Set the current player's wallet address
  };

  const startNewRound = () => {
    if (!gameState) return;

    // Shuffle and deal cards
    const newDeck = shuffleDeck(generateDeck());
    const hands = dealCards(newDeck, gameState.players.length, 2);

    // Update players with their cards
    const updatedPlayers = gameState.players.map((player, index) => ({
      ...player,
      cards: hands[index],
      currentBet: 0,
      hasFolded: false,
      isActive: true,
    }));

    console.log('Dealt cards to players:', updatedPlayers.map(p => ({ name: p.name, cards: p.cards })));

    // Set local cards for current player (first player for now)
    setLocalCards(hands[0]);

    // Deal community cards (but keep them hidden initially)
    const communityStart = gameState.players.length * 2;
    const newCommunityCards = newDeck.slice(communityStart, communityStart + 5);
    setCommunityCards(newCommunityCards); // Set the full community cards

    setGameState({
      ...gameState,
      players: updatedPlayers,
      gameStage: 'PreFlop' as any,
      currentBet: 0,
      currentPlayerTurn: (gameState.dealerIndex + 1) % gameState.players.length,
      communityCards: newCommunityCards,
    });
  };

  const placeBet = (playerId: string, amount: number) => {
    if (!gameState) return;

    const updatedPlayers = gameState.players.map(player => {
      if (player.pubkey === playerId) {
        return {
          ...player,
          currentBet: player.currentBet + amount,
          chips: player.chips - amount,
        };
      }
      return player;
    });

    setGameState({
      ...gameState,
      players: updatedPlayers,
      potTotal: gameState.potTotal + amount,
      currentBet: Math.max(gameState.currentBet, amount),
    });
  };

  const advanceStageInternal = (state: GameState) => {
    const stages = ['PreFlop', 'Flop', 'Turn', 'River', 'Showdown'];
    const currentIndex = stages.indexOf(state.gameStage as string);

    if (currentIndex < stages.length - 1) {
      // Check if any player is all-in (has 0 chips)
      const hasAllIn = state.players.some(p => !p.hasFolded && p.chips === 0);

      // If someone is all-in, skip straight to Showdown
      const nextStage = hasAllIn ? 'Showdown' : stages[currentIndex + 1] as any;

      // Reset current bets for new betting round (except showdown)
      const updatedPlayers = nextStage !== 'Showdown' ? state.players.map(p => ({
        ...p,
        currentBet: 0,
      })) : state.players;

      setGameState({
        ...state,
        players: updatedPlayers,
        gameStage: nextStage,
        currentBet: 0,
        currentPlayerTurn: (state.dealerIndex + 1) % state.players.length,
      });
    }
  };

  const fold = (playerId: string) => {
    if (!gameState) return;

    const updatedPlayers = gameState.players.map(player => {
      if (player.pubkey === playerId) {
        return { ...player, hasFolded: true, isActive: false };
      }
      return player;
    });

    setGameState({
      ...gameState,
      players: updatedPlayers,
      currentPlayerTurn: (gameState.currentPlayerTurn + 1) % gameState.players.length,
    });
  };

  const call = (playerId: string) => {
    if (!gameState) return;

    const player = gameState.players.find(p => p.pubkey === playerId);
    if (!player) return;

    // Cap call amount at available chips (all-in)
    const requestedCallAmount = gameState.currentBet - player.currentBet;
    const callAmount = Math.min(requestedCallAmount, player.chips);

    const updatedPlayers = gameState.players.map(p => {
      if (p.pubkey === playerId) {
        return {
          ...p,
          currentBet: p.currentBet + callAmount,
          chips: p.chips - callAmount,
        };
      }
      return p;
    });

    const newState = {
      ...gameState,
      players: updatedPlayers,
      potTotal: gameState.potTotal + callAmount,
      currentPlayerTurn: (gameState.currentPlayerTurn + 1) % gameState.players.length,
    };

    setGameState(newState);

    // Check if betting round is complete and advance stage
    // Use setTimeout to ensure state has updated
    setTimeout(() => {
      if (isBettingRoundComplete(newState)) {
        advanceStageInternal(newState);
      }
    }, 100);
  };

  const raise = (playerId: string, amount: number) => {
    if (!gameState) return;

    const player = gameState.players.find(p => p.pubkey === playerId);
    if (!player) return;

    // Cap raise amount at available chips (all-in)
    const callAmount = Math.max(0, gameState.currentBet - player.currentBet);
    const requestedTotalAmount = callAmount + amount;
    const totalAmount = Math.min(requestedTotalAmount, player.chips);
    const actualRaiseAmount = Math.max(0, totalAmount - callAmount);

    const updatedPlayers = gameState.players.map(p => {
      if (p.pubkey === playerId) {
        return {
          ...p,
          currentBet: p.currentBet + totalAmount,
          chips: p.chips - totalAmount,
        };
      }
      return p;
    });

    const newState = {
      ...gameState,
      players: updatedPlayers,
      potTotal: gameState.potTotal + totalAmount,
      currentBet: gameState.currentBet + actualRaiseAmount,
      currentPlayerTurn: (gameState.currentPlayerTurn + 1) % gameState.players.length,
    };

    setGameState(newState);
  };

  const endRound = (winnerId: string) => {
    if (!gameState) return;

    const updatedPlayers = gameState.players.map(player => {
      if (player.pubkey === winnerId) {
        // Winner gets the pot
        const newChips = player.chips + gameState.potTotal;
        return {
          ...player,
          chips: newChips, // Keep the winnings, don't reset
          currentBet: 0,
          hasFolded: false,
        };
      }
      // Losers: reset to 1000 if they have 0 chips (busted)
      return {
        ...player,
        chips: player.chips > 0 ? player.chips : 1000,
        currentBet: 0,
        hasFolded: false,
      };
    });

    setGameState({
      ...gameState,
      players: updatedPlayers,
      potTotal: 0, // Reset pot to 0
      currentBet: 0,
      gameStage: 'Waiting' as any,
      dealerIndex: (gameState.dealerIndex + 1) % gameState.players.length,
    });

    setLocalCards([]);
    setCommunityCards([]);
  };

  const advanceStage = () => {
    if (!gameState) return;
    advanceStageInternal(gameState);
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        localCards,
        communityCards,
        currentPlayerPubkey,
        initializeGame,
        startNewRound,
        placeBet,
        fold,
        call,
        raise,
        endRound,
        advanceStage,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
