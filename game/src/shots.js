// AURORA CLASH — the screenshot scenes behind ?shot=title|table|win|loss.
// Each one plays the real duel forward from a fresh world for a fixed seed,
// steered by a scripted player, so the frame is what a short game really
// looks like and the same seed always gives the same frame.
import { SCREEN_OVER, SCREEN_PLAY } from './render.js';
import { createGameWithSeed } from './state.js';

const STEP = 1 / 60;

/** Run the game forward until `stop` says the frame is ready (or it stalls). */
function advance(game, stop, maxSteps = 60 * 120) {
  for (let step = 0; step < maxSteps; step += 1) {
    game.update(STEP);
    if (stop(game.state)) return true;
  }
  return false;
}

/** Play one round with the player's card at `index`, then wait for the next choice. */
function playRound(game, index) {
  game.playCard(index);
  return advance(game, (state) => state.screen === SCREEN_OVER
    || (state.phase === 'choose' && state.screen === SCREEN_PLAY));
}

/** The strongest card in the hand (for the win scene's player). */
function strongestIndex(state) {
  let best = 0;
  state.duel.playerHand.forEach((card, index) => {
    if (card.value > state.duel.playerHand[best].value) best = index;
  });
  return best;
}

/** The weakest card in the hand (for the loss scene's player). */
function weakestIndex(state) {
  let worst = 0;
  state.duel.playerHand.forEach((card, index) => {
    if (card.value < state.duel.playerHand[worst].value) worst = index;
  });
  return worst;
}

/** Drive a whole duel with the given player strategy; returns the final winner. */
function playWholeDuel(seed, pick) {
  const game = createGameWithSeed(seed);
  game.startDuel();
  advance(game, (state) => state.phase === 'choose' && state.screen === SCREEN_PLAY);
  while (game.state.screen === SCREEN_PLAY) {
    const index = pick(game.state);
    if (!playRound(game, index)) break;
    if (game.state.screen === SCREEN_OVER) break;
  }
  return game;
}

/**
 * Set the game to the named scene (title, table, win or loss) and return the
 * screen to draw over it. The table scene stops mid-duel with both cards
 * revealed on the table; win and loss scenes play a whole duel to its end.
 */
export function stageShot(name, seed) {
  if (name === 'table') {
    const game = createGameWithSeed(seed);
    game.startDuel();
    advance(game, (state) => state.phase === 'choose' && state.screen === SCREEN_PLAY);
    // Three full rounds, then a fourth played out to the revealed result.
    playRound(game, 2);
    playRound(game, 0);
    playRound(game, 1);
    game.playCard(2);
    advance(game, (state) => state.phase === 'result');
    return { game, screen: SCREEN_PLAY };
  }
  if (name === 'win' || name === 'loss') {
    const wanted = name === 'win' ? 'player' : 'opponent';
    const pick = name === 'win' ? strongestIndex : weakestIndex;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const game = playWholeDuel(seed + attempt * 7919, pick);
      if (game.state.screen === SCREEN_OVER && game.state.duel.winner === wanted) {
        return { game, screen: SCREEN_OVER };
      }
    }
    // No seed in the sweep ended the way the scene needs: fall back to the
    // first duel played out, so the shot still shows a real end screen.
    const fallback = playWholeDuel(seed, pick);
    return { game: fallback, screen: SCREEN_OVER };
  }
  const game = createGameWithSeed(seed);
  return { game, screen: 'title' };
}
