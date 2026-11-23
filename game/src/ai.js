// AURORA CLASH — Rook, the opponent. A readable heuristic, not a black box:
// it counters the element you played last round when it can, saves its big
// cards early, and finishes you off when your life is low. A player who
// watches what Rook does can read the counter coming and play around it.
import { ELEMENTS, MAX_VALUE } from './config.js';
import { cardPower, elementBeats } from './rules.js';

/** The smallest card in `hand` whose element beats `element`, or null. */
function cheapestCounter(hand, element) {
  let best = null;
  for (const card of hand) {
    if (!elementBeats(card.element, element)) continue;
    if (best === null || card.value < best.value) best = card;
  }
  return best;
}

function lowestCard(hand) {
  let best = hand[0];
  for (const card of hand) if (card.value < best.value) best = card;
  return best;
}

function highestCard(hand) {
  let best = hand[0];
  for (const card of hand) if (card.value > best.value) best = card;
  return best;
}

/**
 * Pick Rook's card. `context` holds the hand, the player's last card, the
 * round number, both life totals and a seeded random for the odd bluff.
 */
export function chooseCard(context) {
  const { hand, playerLastCard, round, playerHp, random } = context;
  if (hand.length === 0) return null;
  if (hand.length === 1) return hand[0];

  // A one-in-seven bluff: play a random card so the pattern never goes stale.
  if (random() < 0.14) return hand[Math.floor(random() * hand.length)];

  // Finish the duel when the Warden is nearly down.
  if (playerHp <= 6) {
    const big = hand.filter((card) => card.value >= MAX_VALUE - 2);
    if (big.length > 0) return highestCard(big);
  }

  // Counter the element you played last round, cheapest card that does it.
  if (playerLastCard !== null) {
    const counter = cheapestCounter(hand, playerLastCard.element);
    if (counter !== null && counter.value >= 4) return counter;
    if (counter !== null && round >= 4) return counter;
  }

  // Early rounds are for scouting: spend the small cards, keep the big ones.
  if (round <= 2) return lowestCard(hand);

  // Otherwise play the strongest card that is not the hand's ace, keeping the
  // best card in reserve for the last rounds.
  const sorted = [...hand].sort((a, b) => cardPower(b, null) - cardPower(a, null));
  return sorted.length > 1 ? sorted[1] : sorted[0];
}
