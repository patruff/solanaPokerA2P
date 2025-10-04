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
  const rankCounts = new Map<string, Card[]>();
  cards.forEach(card => {
    const existing = rankCounts.get(card.rank) || [];
    rankCounts.set(card.rank, [...existing, card]);
  });

  const counts = Array.from(rankCounts.entries())
    .map(([rank, cards]) => ({ rank, count: cards.length, cards }))
    .sort((a, b) => b.count - a.count);

  // Get friendly rank names
  const getRankName = (rank: string) => {
    const names: Record<string, string> = {
      'A': 'Aces', 'K': 'Kings', 'Q': 'Queens', 'J': 'Jacks',
      '10': 'Tens', '9': 'Nines', '8': 'Eights', '7': 'Sevens',
      '6': 'Sixes', '5': 'Fives', '4': 'Fours', '3': 'Threes', '2': 'Twos'
    };
    return names[rank] || rank;
  };

  if (counts[0].count === 4) {
    return { rank: 7, name: `Four of a Kind (${getRankName(counts[0].rank)})` };
  }
  if (counts[0].count === 3 && counts[1].count === 2) {
    return { rank: 6, name: `Full House (${getRankName(counts[0].rank)} over ${getRankName(counts[1].rank)})` };
  }
  if (counts[0].count === 3) {
    return { rank: 3, name: `Three of a Kind (${getRankName(counts[0].rank)})` };
  }
  if (counts[0].count === 2 && counts[1].count === 2) {
    return { rank: 2, name: `Two Pair (${getRankName(counts[0].rank)} and ${getRankName(counts[1].rank)})` };
  }
  if (counts[0].count === 2) {
    return { rank: 1, name: `Pair of ${getRankName(counts[0].rank)}` };
  }

  // For high card, find the highest card
  const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const highestCard = cards.reduce((highest, card) => {
    return rankOrder.indexOf(card.rank) > rankOrder.indexOf(highest.rank) ? card : highest;
  });

  return { rank: 0, name: `High Card (${getRankName(highestCard.rank)})` };
}

// Bot decision making (simple AI)
export function makeBotDecision(
  botCards: Card[],
  communityCards: Card[],
  currentBet: number,
  botChips: number,
  potTotal: number
): 'fold' | 'call' | 'raise' {
  // Random factor for unpredictability
  const randomFactor = Math.random();

  // PreFlop logic (only hole cards available)
  if (communityCards.length === 0) {
    // Check for pairs - always play
    if (botCards.length >= 2 && botCards[0].rank === botCards[1].rank) {
      return randomFactor > 0.4 ? 'raise' : 'call';
    }
    // Check for high cards (J, Q, K, A) - always play
    const highCards = botCards.filter(c => ['J', 'Q', 'K', 'A'].includes(c.rank));
    if (highCards.length >= 1) {
      return randomFactor > 0.6 ? 'raise' : 'call';
    }
    // Medium cards - usually call, rarely fold
    return randomFactor > 0.85 ? 'fold' : 'call';
  }

  // Post-flop logic
  const allCards = [...botCards, ...communityCards];
  const handStrength = evaluateHand(allCards);

  console.log('Bot post-flop decision:', {
    handStrength,
    currentBet,
    potTotal,
    botChips,
    randomFactor,
    allCards,
  });

  // If hand is strong, likely to raise
  if (handStrength.rank >= 3 && randomFactor > 0.3) {
    return 'raise';
  }

  // If hand is decent, likely to call
  if (handStrength.rank >= 1 && randomFactor > 0.4) {
    return 'call';
  }

  // If current bet is low relative to pot or chips, call anyway
  if (currentBet === 0 || currentBet < botChips * 0.1) {
    return randomFactor > 0.8 ? 'fold' : 'call';
  }

  // If current bet is low relative to pot, might call
  if (currentBet < potTotal * 0.3 && randomFactor > 0.4) {
    return 'call';
  }

  // Otherwise fold (but less frequently)
  return randomFactor > 0.6 ? 'fold' : 'call';
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
