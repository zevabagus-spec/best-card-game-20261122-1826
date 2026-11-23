// AURORA CLASH — every number that tunes the duel, in one place.
// Four elements in a cycle: Ember beats Gale, Gale beats Stone, Stone beats Tide,
// Tide beats Ember. A card's power is its value; an element advantage adds 3.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;

export const START_HP = 20;
export const MAX_ROUNDS = 7;
export const HAND_SIZE = 5;
export const MAX_VALUE = 8;
export const ADVANTAGE_BONUS = 3;
export const SURGE_BONUS = 2;
export const TWIN_BONUS = 1;
export const TRUCE_HEAL = 1;
export const SUDDEN_DEATH_ROUNDS = 3;

export const ELEMENTS = {
  ember: { name: 'Ember', color: '#e2483d', dark: '#8f1f18', beats: 'gale', glyph: 'flame' },
  tide: { name: 'Tide', color: '#2f7fe0', dark: '#174a8f', beats: 'ember', glyph: 'wave' },
  gale: { name: 'Gale', color: '#1fae8a', dark: '#0d6b52', beats: 'stone', glyph: 'wind' },
  stone: { name: 'Stone', color: '#c98a2e', dark: '#7a5312', beats: 'tide', glyph: 'peak' },
};
export const ELEMENT_ORDER = ['ember', 'tide', 'gale', 'stone'];

export const PLAYER_NAME = 'YOU · THE WARDEN';
export const OPPONENT_NAME = 'ROOK · STORM HERALD';

export const CARD_WIDTH = 116;
export const CARD_HEIGHT = 160;
export const CARD_RADIUS = 12;

// The duel's own names for the scoreboard: damage dealt plus five per trick won.
export const SCORE_PER_TRICK = 5;

export const BEST_KEY = 'aurora-clash-best';
export const STEP = 1 / 60;
