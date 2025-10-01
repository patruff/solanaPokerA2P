import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameState, Player, Card } from '../types';
import { generateDeck, shuffleDeck, dealCards } from '../utils/poker';

interface GameContextType {
  gameState: GameState | null;
  localCards: Card[];
  communityCards: Card[];
  initializeGame: (players: Player[]) => void;
  startNewRound: () => void;
  placeBet: (playerId: string, amount: number) => void;
  fold: (playerId: string) => void;
  call: (playerId: string) => void;
  raise: (playerId: string, amount: number) => void;
  endRound: (winnerId: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localCards, setLocalCards] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);

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

    // Set local cards for current player (first player for now)
    setLocalCards(hands[0]);
    
    // Deal community cards (but keep them hidden initially)
    const communityStart = gameState.players.length * 2;
    const newCommunityCards = newDeck.slice(communityStart, communityStart + 5);
    setCommunityCards([]);
    
    setDeck(newDeck);
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

    const callAmount = gameState.currentBet - player.currentBet;
    placeBet(playerId, callAmount);

    setGameState(prev => prev ? {
      ...prev,
      currentPlayerTurn: (prev.currentPlayerTurn + 1) % prev.players.length,
    } : null);
  };

  const raise = (playerId: string, amount: number) => {
    if (!gameState) return;

    const player = gameState.players.find(p => p.pubkey === playerId);
    if (!player) return;

    const totalAmount = gameState.currentBet - player.currentBet + amount;
    placeBet(playerId, totalAmount);

    setGameState(prev => prev ? {
      ...prev,
      currentBet: prev.currentBet + amount,
      currentPlayerTurn: (prev.currentPlayerTurn + 1) % prev.players.length,
    } : null);
  };

  const endRound = (winnerId: string) => {
    if (!gameState) return;

    const updatedPlayers = gameState.players.map(player => {
      if (player.pubkey === winnerId) {
        return {
          ...player,
          chips: player.chips + gameState.potTotal,
        };
      }
      return {
        ...player,
        currentBet: 0,
        hasFolded: false,
      };
    });

    setGameState({
      ...gameState,
      players: updatedPlayers,
      potTotal: 0,
      currentBet: 0,
      gameStage: 'Waiting' as any,
      dealerIndex: (gameState.dealerIndex + 1) % gameState.players.length,
    });

    setLocalCards([]);
    setCommunityCards([]);
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        localCards,
        communityCards,
        initializeGame,
        startNewRound,
        placeBet,
        fold,
        call,
        raise,
        endRound,
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
