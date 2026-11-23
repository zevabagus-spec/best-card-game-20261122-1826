// AURORA CLASH — the duel itself: screens, rounds, animation timing, and the
// state the renderer paints. The rules live in rules.js and the AI in ai.js;
// this file only runs the duel forward, one round at a time.
import {
  HAND_SIZE,
  MAX_ROUNDS,
  SCORE_PER_TRICK,
  START_HP,
  SUDDEN_DEATH_ROUNDS,
} from './config.js';
import { createRandom } from './random.js';
import { createDrawPile, discardCard, drawUpTo } from './deck.js';
import { chooseCard } from './ai.js';
import { createMemory, duelWinner, resolveRound } from './rules.js';
import { sfx } from './audio.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const REVEAL_SECONDS = 0.9;
const RESULT_SECONDS = 1.7;

export function createDuel(random) {
  const pile = createDrawPile(random);
  const duel = {
    playerHp: START_HP,
    opponentHp: START_HP,
    round: 1,
    suddenDeath: false,
    suddenDeathRounds: 0,
    playerTricks: 0,
    opponentTricks: 0,
    playerDamage: 0,
    opponentDamage: 0,
    playerScore: 0,
    playerHand: drawUpTo(pile, random, HAND_SIZE),
    opponentHand: drawUpTo(pile, random, HAND_SIZE),
    pile,
    memory: createMemory(),
    log: 'Round 1 — pick a card, any card. Rook is watching.',
    result: null,
    winner: null,
    over: false,
  };
  return duel;
}

function scoreOf(duel) {
  return duel.playerDamage + duel.playerTricks * SCORE_PER_TRICK;
}

export function createGame(random) {
  const state = {
    screen: SCREEN_TITLE,
    time: 0,
    duel: createDuel(random),
    selected: null,
    hover: null,
    played: { player: null, opponent: null, faceUp: false, flip: 0 },
    phase: 'choose',
    phaseTime: 0,
    floaters: [],
    shake: 0,
    confetti: [],
    help: false,
    best: 0,
    random,
  };

  function addFloater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 1 });
  }

  function burstConfetti() {
    const colors = ['#e8b64c', '#37e0a0', '#7a5cff', '#ff6b5e', '#2f7fe0'];
    for (let index = 0; index < 140; index += 1) {
      state.confetti.push({
        x: 640 + (random() - 0.5) * 700,
        y: 120 + random() * 160,
        vx: (random() - 0.5) * 120,
        vy: 40 + random() * 120,
        rotation: random() * Math.PI * 2,
        size: 8 + random() * 10,
        color: colors[index % colors.length],
        life: 1,
      });
    }
  }

  function finishDuel() {
    const duel = state.duel;
    duel.winner = duelWinner(
      duel.playerHp, duel.opponentHp,
      duel.playerTricks, duel.opponentTricks,
      duel.playerDamage, duel.opponentDamage,
    );
    duel.playerScore = scoreOf(duel);
    duel.over = true;
    state.screen = SCREEN_OVER;
    state.phase = 'over';
    if (duel.winner === 'player') {
      burstConfetti();
      sfx.win();
    } else {
      sfx.lose();
    }
  }

  function startDuel() {
    state.duel = createDuel(state.random);
    state.selected = null;
    state.played = { player: null, opponent: null, faceUp: false, flip: 0 };
    state.phase = 'choose';
    state.phaseTime = 0;
    state.floaters = [];
    state.confetti = [];
    state.shake = 0;
    state.screen = SCREEN_PLAY;
    sfx.deal();
  }

  /** The player commits a card: Rook answers, the cards are revealed, the round resolves. */
  function playCard(index) {
    const duel = state.duel;
    if (state.screen !== SCREEN_PLAY || state.phase !== 'choose') return;
    if (index < 0 || index >= duel.playerHand.length) return;
    const playerCard = duel.playerHand[index];
    const opponentCard = chooseCard({
      hand: duel.opponentHand,
      playerLastCard: duel.memory.playerPrevious,
      round: duel.round,
      playerHp: duel.playerHp,
      random: state.random,
    });
    duel.playerHand.splice(index, 1);
    const opponentIndex = duel.opponentHand.indexOf(opponentCard);
    if (opponentIndex >= 0) duel.opponentHand.splice(opponentIndex, 1);
    state.played = { player: playerCard, opponent: opponentCard, faceUp: false, flip: 0 };
    state.phase = 'reveal';
    state.phaseTime = 0;
    state.selected = null;
    sfx.flip();
  }

  function resolvePlayedRound() {
    const duel = state.duel;
    const result = resolveRound(state.played.player, state.played.opponent, duel.memory);
    duel.result = result;
    if (result.winner === 'truce') {
      duel.playerHp = Math.min(START_HP, duel.playerHp + result.heal);
      duel.opponentHp = Math.min(START_HP, duel.opponentHp + result.heal);
      sfx.heal();
      addFloater(640, 260, `+${result.heal} ♥  +${result.heal} ♥`, '#7ce0b8');
    } else if (result.winner === 'player') {
      duel.opponentHp = Math.max(0, duel.opponentHp - result.damage);
      duel.playerTricks += 1;
      duel.playerDamage += result.damage;
      state.shake = 10;
      sfx.hit();
      addFloater(640, 260, `-${result.damage}`, '#ff6b5e');
    } else {
      duel.playerHp = Math.max(0, duel.playerHp - result.damage);
      duel.opponentTricks += 1;
      duel.opponentDamage += result.damage;
      state.shake = 10;
      sfx.hit();
      addFloater(640, 260, `-${result.damage}`, '#ff6b5e');
    }
    duel.playerScore = scoreOf(duel);
    duel.log = result.text;
    discardCard(duel.pile, state.played.player);
    discardCard(duel.pile, state.played.opponent);
  }

  function nextRound() {
    const duel = state.duel;
    state.played = { player: null, opponent: null, faceUp: false, flip: 0 };
    state.phase = 'choose';
    state.phaseTime = 0;
    duel.playerHand.push(...drawUpTo(duel.pile, state.random, HAND_SIZE - duel.playerHand.length));
    duel.opponentHand.push(...drawUpTo(duel.pile, state.random, HAND_SIZE - duel.opponentHand.length));
    if (duel.playerHp <= 0 || duel.opponentHp <= 0) {
      finishDuel();
      return;
    }
    if (duel.round >= MAX_ROUNDS) {
      if (!duel.suddenDeath) {
        const winner = duelWinner(
          duel.playerHp, duel.opponentHp,
          duel.playerTricks, duel.opponentTricks,
          duel.playerDamage, duel.opponentDamage,
        );
        if (winner !== 'draw') {
          finishDuel();
          return;
        }
        duel.suddenDeath = true;
        duel.log = 'Dead even after 7 rounds — sudden death! First blood wins.';
      } else {
        duel.suddenDeathRounds += 1;
        if (duel.suddenDeathRounds >= SUDDEN_DEATH_ROUNDS) {
          finishDuel();
          return;
        }
      }
    } else {
      duel.round += 1;
    }
    duel.log = duel.suddenDeath
      ? `Sudden death, round ${duel.suddenDeathRounds + 1} — first blood wins.`
      : `Round ${duel.round} — pick a card.`;
  }

  /** Advance the duel's clocks: flip, result pause, floaters, shake, confetti. */
  function update(seconds) {
    state.time += seconds;
    state.shake = Math.max(0, state.shake - seconds * 30);
    for (const floater of state.floaters) floater.life -= seconds * 0.7;
    state.floaters = state.floaters.filter((floater) => floater.life > 0);
    for (const piece of state.confetti) {
      piece.x += piece.vx * seconds;
      piece.y += piece.vy * seconds;
      piece.vy += 60 * seconds;
      piece.rotation += seconds * 3;
      piece.life -= seconds * 0.35;
    }
    state.confetti = state.confetti.filter((piece) => piece.life > 0 && piece.y < 860);
    if (state.screen !== SCREEN_PLAY) return;
    state.phaseTime += seconds;
    if (state.phase === 'reveal') {
      state.played.flip = Math.min(1, state.phaseTime / REVEAL_SECONDS);
      if (state.phaseTime >= REVEAL_SECONDS) {
        state.played.faceUp = true;
        state.phase = 'result';
        state.phaseTime = 0;
        resolvePlayedRound();
      }
    } else if (state.phase === 'result' && state.phaseTime >= RESULT_SECONDS) {
      nextRound();
    }
  }

  return { state, startDuel, playCard, update, finishDuel };
}

/** A fresh game with its own seeded random source. */
export function createGameWithSeed(seed) {
  return createGame(createRandom(seed));
}
