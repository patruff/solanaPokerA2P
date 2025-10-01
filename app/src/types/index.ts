export interface Player {
  pubkey: string;
  name: string;
  chips: number;
  currentBet: number;
  isActive: boolean;
  hasFolded: boolean;
  cards?: Card[];
}

export interface Spectator {
  pubkey: string;
  name: string;
  totalContributed: number;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
}

export interface GameState {
  authority: string;
  maxPlayers: number;
  currentPlayers: number;
  players: Player[];
  currentBet: number;
  potTotal: number;
  gameStage: GameStage;
  currentPlayerTurn: number;
  dealerIndex: number;
  spectator?: Spectator;
  communityCards?: Card[];
}

export enum GameStage {
  Waiting = 'Waiting',
  PreFlop = 'PreFlop',
  Flop = 'Flop',
  Turn = 'Turn',
  River = 'River',
  Showdown = 'Showdown',
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  walletAddress?: string;
}
