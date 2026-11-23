// AURORA CLASH — the deck: 32 cards, four elements times values 1 to 8.
// A card is { element, value, id }. The deck is a plain array; drawing from an
// empty deck reshuffles the discard pile so a duel can never stall.
import { ELEMENT_ORDER, MAX_VALUE } from './config.js';
import { shuffleInPlace } from './random.js';

export function buildDeck() {
  const deck = [];
  for (const element of ELEMENT_ORDER) {
    for (let value = 1; value <= MAX_VALUE; value += 1) {
      deck.push({ element, value, id: `${element}-${value}` });
    }
  }
  return deck;
}

export function createDrawPile(random) {
  return { cards: shuffleInPlace(buildDeck(), random), discard: [] };
}

/** Draw one card, reshuffling the discard pile when the pile runs dry. */
export function drawCard(pile, random) {
  if (pile.cards.length === 0) {
    if (pile.discard.length === 0) return null;
    pile.cards = shuffleInPlace(pile.discard.splice(0), random);
  }
  return pile.cards.pop() ?? null;
}

/** Draw up to `count` cards, skipping the draw entirely when nothing is left. */
export function drawUpTo(pile, random, count) {
  const drawn = [];
  for (let index = 0; index < count; index += 1) {
    const card = drawCard(pile, random);
    if (card === null) break;
    drawn.push(card);
  }
  return drawn;
}

export function discardCard(pile, card) {
  pile.discard.push(card);
}
