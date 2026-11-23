// AURORA CLASH — the duel's rules, pure functions over plain data.
// A round: both sides play one card face up. Power is value plus the Twin
// bonus; an element advantage adds 3 power to the favoured card. The higher
// power wins the trick and deals damage equal to the power gap (at least 1),
// plus the Surge bonus when the winner repeats the element it won with last
// round. Identical element and value is a Truce: no damage, both heal 1.
// A round is resolved by resolveRound(playerCard, opponentCard, memory) where
// memory carries each side's previous card and previous winning element.
import {
  ADVANTAGE_BONUS,
  ELEMENTS,
  SURGE_BONUS,
  TRUCE_HEAL,
  TWIN_BONUS,
} from './config.js';

/** True when element `a` beats element `b` on the four-element cycle. */
export function elementBeats(a, b) {
  return ELEMENTS[a].beats === b;
}

/** The power a card fights with this round, before any advantage is added. */
export function cardPower(card, previousCard) {
  if (card === null) return 0;
  let power = card.value;
  if (previousCard !== null && previousCard.value === card.value) power += TWIN_BONUS;
  return power;
}

export function createMemory() {
  return {
    playerPrevious: null,
    opponentPrevious: null,
    playerWinningElement: null,
    opponentWinningElement: null,
  };
}

/**
 * Resolve one round. Returns { winner: 'player' | 'opponent' | 'truce',
 * damage, playerPower, opponentPower, advantage: 'player' | 'opponent' | null,
 * surge: boolean, twin: boolean, text } and updates the memory in place.
 */
export function resolveRound(playerCard, opponentCard, memory) {
  const playerPowerBase = cardPower(playerCard, memory.playerPrevious);
  const opponentPowerBase = cardPower(opponentCard, memory.opponentPrevious);
  const twin = playerCard.value === (memory.playerPrevious?.value ?? -1)
    || opponentCard.value === (memory.opponentPrevious?.value ?? -1);

  let playerPower = playerPowerBase;
  let opponentPower = opponentPowerBase;
  let advantage = null;
  if (elementBeats(playerCard.element, opponentCard.element)) {
    playerPower += ADVANTAGE_BONUS;
    advantage = 'player';
  } else if (elementBeats(opponentCard.element, playerCard.element)) {
    opponentPower += ADVANTAGE_BONUS;
    advantage = 'opponent';
  }

  // The same card on both sides is a Truce: nobody is hurt, both catch breath.
  if (playerCard.element === opponentCard.element && playerCard.value === opponentCard.value) {
    memory.playerPrevious = playerCard;
    memory.opponentPrevious = opponentCard;
    return {
      winner: 'truce', damage: 0, heal: TRUCE_HEAL,
      playerPower, opponentPower, advantage, surge: false, twin,
      text: `Truce! Both played ${ELEMENTS[playerCard.element].name} ${playerCard.value} — both heal ${TRUCE_HEAL}.`,
    };
  }

  const playerWins = playerPower > opponentPower;
  const winner = playerWins ? 'player' : 'opponent';
  const winningElement = playerWins ? playerCard.element : opponentCard.element;
  const surge = (playerWins && memory.playerWinningElement === winningElement)
    || (!playerWins && memory.opponentWinningElement === winningElement);
  let damage = Math.abs(playerPower - opponentPower);
  if (damage < 1) damage = 1;
  if (surge) damage += SURGE_BONUS;

  if (playerWins) memory.playerWinningElement = winningElement;
  else memory.opponentWinningElement = winningElement;
  memory.playerPrevious = playerCard;
  memory.opponentPrevious = opponentCard;

  const winnerName = playerWins ? 'You win' : 'Rook wins';
  const surgeText = surge ? ` Surge! ${ELEMENTS[winningElement].name} strikes twice (+${SURGE_BONUS}).` : '';
  const advantageText = advantage === null
    ? ''
    : ` ${ELEMENTS[(advantage === 'player' ? playerCard : opponentCard).element].name} has the edge (+${ADVANTAGE_BONUS}).`;
  return {
    winner, damage, heal: 0,
    playerPower, opponentPower, advantage, surge, twin,
    text: `${winnerName} the trick — ${playerPower} vs ${opponentPower}, ${damage} damage.${advantageText}${surgeText}`,
  };
}

/** Who wins the duel at the end of the rounds, from the totals alone. */
export function duelWinner(playerHp, opponentHp, playerTricks, opponentTricks, playerDamage, opponentDamage) {
  if (playerHp !== opponentHp) return playerHp > opponentHp ? 'player' : 'opponent';
  if (playerTricks !== opponentTricks) return playerTricks > opponentTricks ? 'player' : 'opponent';
  if (playerDamage !== opponentDamage) return playerDamage > opponentDamage ? 'player' : 'opponent';
  return 'draw';
}
