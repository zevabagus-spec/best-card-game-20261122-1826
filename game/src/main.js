// AURORA CLASH — boot and the one loop: input is read every frame, the duel
// advances in fixed 1/60 s steps, and the renderer paints what is there.
//
// ?seed=N fixes the deal. ?shot=title|table|win|loss (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, CANVAS_HEIGHT, CANVAS_WIDTH, CARD_HEIGHT, CARD_WIDTH, STEP } from './config.js';
import { createRandom } from './random.js';
import { ACTION_CONFIRM, ACTION_HELP, ACTION_MUTE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createGame } from './state.js';
import { setMuted, sfx } from './audio.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const { game, screen } = stageShot(name, seed);
  game.state.best = readBest();
  let painted = 0;
  function paint() {
    renderer.draw(game.state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const game = createGame(createRandom(seed));
  const input = createInput(canvas);
  let best = readBest();
  game.state.best = best;
  let accumulator = 0;
  let last = performance.now();
  let muted = false;

  // The player's hand, as the renderer lays it out, for click hit-testing.
  function handHit(point) {
    const duel = game.state.duel;
    const spots = renderer.handPositions(duel.playerHand.length, 640, 612, 128);
    for (let index = spots.length - 1; index >= 0; index -= 1) {
      const spot = spots[index];
      const lift = game.state.selected === index ? 30 : 0;
      if (
        point.x >= spot.x - CARD_WIDTH / 2 && point.x <= spot.x + CARD_WIDTH / 2
        && point.y >= spot.y - lift && point.y <= spot.y + CARD_HEIGHT
      ) return index;
    }
    return null;
  }

  function announce(message) {
    status.textContent = message;
  }

  function handleClick(point) {
    const state = game.state;
    if (state.screen === SCREEN_TITLE) {
      game.startDuel();
      announce('Playing. Pick a card, 1 to 5, then Enter — or click a card twice.');
      return;
    }
    if (state.screen === SCREEN_OVER) {
      if (state.duel.playerScore > best) {
        best = state.duel.playerScore;
        saveBest(best);
        state.best = best;
      }
      game.startDuel();
      return;
    }
    if (state.phase !== 'choose') return;
    const index = handHit(point);
    if (index === null) return;
    if (state.selected === index) {
      game.playCard(index);
      sfx.select();
    } else {
      state.selected = index;
      sfx.select();
    }
  }

  function handleActions() {
    const state = game.state;
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      muted = !muted;
      setMuted(muted);
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_HELP) {
      state.help = !state.help;
      return;
    }
    if (state.help) return;
    if (actions & ACTION_RESTART && state.screen !== SCREEN_TITLE) {
      game.startDuel();
      announce('A fresh duel. Pick a card.');
      return;
    }
    if (state.screen === SCREEN_TITLE) {
      if (actions & ACTION_CONFIRM) {
        game.startDuel();
        announce('Playing. Pick a card, 1 to 5, then Enter — or click a card twice.');
      }
      return;
    }
    if (state.screen === SCREEN_OVER) {
      if (actions & (ACTION_CONFIRM | ACTION_RESTART)) {
        if (state.duel.playerScore > best) {
          best = state.duel.playerScore;
          saveBest(best);
          state.best = best;
        }
        game.startDuel();
      }
      return;
    }
    // In play: number keys pick a card, Enter plays the selection (or the
    // middle card when nothing is picked yet).
    for (const key of input.takeNumberKeys()) {
      const index = key - 1;
      if (index >= 0 && index < state.duel.playerHand.length) {
        state.selected = index;
        sfx.select();
      }
    }
    if (actions & ACTION_CONFIRM && state.phase === 'choose') {
      const index = state.selected ?? 2;
      if (index < state.duel.playerHand.length) game.playCard(index);
    }
  }

  function handleHover(point) {
    const state = game.state;
    if (state.screen !== SCREEN_PLAY || state.phase !== 'choose') {
      state.hover = null;
      return;
    }
    state.hover = handHit(point);
  }

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    handleHover({
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    });
  });

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const click = input.takeClick();
    if (click !== null) handleClick(click);
    handleActions();
    while (accumulator >= STEP) {
      game.update(STEP);
      accumulator -= STEP;
    }
    if (game.state.screen === SCREEN_OVER && game.state.duel.playerScore > best) {
      best = game.state.duel.playerScore;
      saveBest(best);
      game.state.best = best;
    }
    renderer.draw(game.state);
  }

  // Leaving the tab pauses nothing — a duel is turn-based — but the help
  // overlay closes, so a returning player sees the table, not the help.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) game.state.help = false;
  });

  announce('Aurora Clash. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
