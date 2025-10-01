import { Card } from '../types';

// Generate a standard 52-card deck
export function generateDeck(): Card[] {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Card['rank'][] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  
  return deck;
}

// Shuffle deck using Fisher-Yates algorithm
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards to players
export function dealCards(deck: Card[], numPlayers: number, cardsPerPlayer: number = 2): Card[][] {
  const hands: Card[][] = Array(numPlayers).fill(null).map(() => []);
  let deckIndex = 0;
  
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let j = 0; j < numPlayers; j++) {
      hands[j].push(deck[deckIndex++]);
    }
  }
  
  return hands;
}

// Get card display string
export function getCardDisplay(card: Card): string {
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  
  return `${card.rank}${suitSymbols[card.suit]}`;
}

// Simple poker hand evaluation (simplified version)
export function evaluateHand(cards: Card[]): { rank: number; name: string } {
  // This is a simplified version - you'd want a more robust poker hand evaluator
  // For now, just return a basic evaluation
  
  if (cards.length < 5) {
    return { rank: 0, name: 'Incomplete Hand' };
  }
  
  // Check for pairs, three of a kind, etc.
  const rankCounts = new Map<string, number>();
  cards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });
  
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
  
  if (counts[0] === 4) return { rank: 7, name: 'Four of a Kind' };
  if (counts[0] === 3 && counts[1] === 2) return { rank: 6, name: 'Full House' };
  if (counts[0] === 3) return { rank: 3, name: 'Three of a Kind' };
  if (counts[0] === 2 && counts[1] === 2) return { rank: 2, name: 'Two Pair' };
  if (counts[0] === 2) return { rank: 1, name: 'Pair' };
  
  return { rank: 0, name: 'High Card' };
}

// Bot decision making (simple AI)
export function makeBotDecision(
  botCards: Card[],
  communityCards: Card[],
  currentBet: number,
  botChips: number,
  potTotal: number
): 'fold' | 'call' | 'raise' {
  // Simple bot logic based on hand strength
  const allCards = [...botCards, ...communityCards];
  const handStrength = evaluateHand(allCards);
  
  // Random factor for unpredictability
  const randomFactor = Math.random();
  
  // If hand is strong, likely to raise
  if (handStrength.rank >= 3 && randomFactor > 0.3) {
    return 'raise';
  }
  
  // If hand is decent, likely to call
  if (handStrength.rank >= 1 && randomFactor > 0.4) {
    return 'call';
  }
  
  // If current bet is low relative to pot, might call anyway
  if (currentBet < potTotal * 0.2 && randomFactor > 0.5) {
    return 'call';
  }
  
  // Otherwise fold
  return 'fold';
}

// Calculate bot raise amount
export function calculateBotRaise(
  potTotal: number,
  botChips: number,
  handStrength: number
): number {
  // Raise between 25% to 75% of pot based on hand strength
  const minRaise = Math.floor(potTotal * 0.25);
  const maxRaise = Math.floor(potTotal * 0.75);
  const raiseAmount = minRaise + Math.floor((maxRaise - minRaise) * (handStrength / 10));
  
  // Don't raise more than bot has
  return Math.min(raiseAmount, botChips);
}
