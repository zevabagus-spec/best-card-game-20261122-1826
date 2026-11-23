// AURORA CLASH — every pixel the player sees: the felt table, the cards, the
// life bars, the title and the win/loss overlays. All drawing is plain canvas
// 2D; the art is shapes and gradients, so the game needs no image files.
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CARD_HEIGHT,
  CARD_RADIUS,
  CARD_WIDTH,
  ELEMENTS,
  MAX_ROUNDS,
  OPPONENT_NAME,
  PLAYER_NAME,
  START_HP,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const GOLD = '#e8b64c';
const CREAM = '#f7f0dd';
const INK = '#1c2433';
const MUTED = '#8b93a5';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function fitFont(ctx, text, maxWidth, startSize, weight = 'bold') {
  let size = startSize;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  }
  return size;
}

/** The four element glyphs, drawn as shapes so a suit is told by shape and colour, never by text alone. */
export function drawGlyph(ctx, glyph, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size;
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.42);
    ctx.bezierCurveTo(x - s * 0.42, y + s * 0.1, x - s * 0.2, y - s * 0.32, x, y - s * 0.5);
    ctx.bezierCurveTo(x + s * 0.2, y - s * 0.32, x + s * 0.42, y + s * 0.1, x, y + s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.2, y + s * 0.12, x - s * 0.08, y - s * 0.12, x, y - s * 0.22);
    ctx.bezierCurveTo(x + s * 0.08, y - s * 0.12, x + s * 0.2, y + s * 0.12, x, y + s * 0.3);
    ctx.closePath();
    ctx.fillStyle = '#ffd97a';
    ctx.fill();
  } else if (glyph === 'wave') {
    ctx.beginPath();
    for (let step = 0; step <= 24; step += 1) {
      const px = x - s * 0.5 + (step / 24) * s;
      const py = y + Math.sin((step / 24) * Math.PI * 2) * s * 0.18;
      if (step === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(x + s * 0.5, y + s * 0.28);
    ctx.lineTo(x - s * 0.5, y + s * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    for (let step = 0; step <= 24; step += 1) {
      const px = x - s * 0.5 + (step / 24) * s;
      const py = y + s * 0.22 + Math.sin((step / 24) * Math.PI * 2 + 1.2) * s * 0.14;
      if (step === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(x + s * 0.5, y + s * 0.42);
    ctx.lineTo(x - s * 0.5, y + s * 0.42);
    ctx.closePath();
    ctx.fill();
  } else if (glyph === 'wind') {
    for (let row = 0; row < 3; row += 1) {
      const ry = y - s * 0.28 + row * s * 0.28;
      const len = s * (0.9 - row * 0.18);
      ctx.beginPath();
      ctx.moveTo(x - len / 2, ry);
      ctx.quadraticCurveTo(x, ry - s * 0.16, x + len / 2, ry);
      ctx.stroke();
    }
  } else {
    // peak: two mountains, the taller one first.
    ctx.beginPath();
    ctx.moveTo(x - s * 0.5, y + s * 0.35);
    ctx.lineTo(x - s * 0.12, y - s * 0.4);
    ctx.lineTo(x + s * 0.22, y + s * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.05, y + s * 0.35);
    ctx.lineTo(x + s * 0.22, y - s * 0.12);
    ctx.lineTo(x + s * 0.5, y + s * 0.35);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCardFace(ctx, card, x, y, width, height, lift = 0) {
  const element = ELEMENTS[card.element];
  const top = y - lift;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  roundRect(ctx, x, top, width, height, CARD_RADIUS);
  ctx.fillStyle = '#fdf8ea';
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, top, width, height, CARD_RADIUS);
  ctx.clip();
  ctx.fillStyle = element.color;
  ctx.fillRect(x, top, width, 34);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(element.name.toUpperCase(), x + 10, top + 18);
  ctx.textAlign = 'right';
  ctx.fillText(String(card.value), x + width - 10, top + 18);
  // Big value, the number a thumbnail reader sees first.
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  fitFont(ctx, String(card.value), width - 24, 64);
  ctx.fillText(String(card.value), x + width / 2, top + height * 0.46);
  drawGlyph(ctx, element.glyph, x + width / 2, top + height * 0.74, 46, element.color);
  ctx.fillStyle = MUTED;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(element.name, x + width / 2, top + height - 14);
  ctx.strokeStyle = element.color;
  ctx.lineWidth = 3;
  roundRect(ctx, x + 1.5, top + 1.5, width - 3, height - 3, CARD_RADIUS - 1);
  ctx.stroke();
  ctx.restore();
}

function drawCardBack(ctx, x, y, width, height, lift = 0) {
  const top = y - lift;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  roundRect(ctx, x, top, width, height, CARD_RADIUS);
  const gradient = ctx.createLinearGradient(x, top, x + width, top + height);
  gradient.addColorStop(0, '#3b2a6e');
  gradient.addColorStop(1, '#1d1440');
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, top, width, height, CARD_RADIUS);
  ctx.clip();
  ctx.strokeStyle = 'rgba(232,182,76,0.85)';
  ctx.lineWidth = 2;
  for (let ring = 0; ring < 3; ring += 1) {
    ctx.beginPath();
    ctx.arc(x + width / 2, top + height / 2, 18 + ring * 14, ring * 1.1, ring * 1.1 + Math.PI * 1.4);
    ctx.stroke();
  }
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(x + width / 2, top + height / 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(247,240,221,0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, x + 6, top + 6, width - 12, height - 12, CARD_RADIUS - 5);
  ctx.stroke();
  ctx.restore();
}

/** A card drawn with a horizontal squash for the flip reveal; `flip` runs 0 (back) to 1 (face). */
function drawFlippingCard(ctx, card, x, y, width, height, flip) {
  const scale = Math.abs(flip * 2 - 1);
  const centreX = x + width / 2;
  ctx.save();
  ctx.translate(centreX, 0);
  ctx.scale(Math.max(0.08, scale), 1);
  ctx.translate(-centreX, 0);
  if (flip < 0.5) drawCardBack(ctx, x, y, width, height);
  else drawCardFace(ctx, card, x, y, width, height);
  ctx.restore();
}

function drawHpBar(ctx, x, y, width, hp, maxHp, label, align = 'left') {
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(label, x, y);
  const barX = align === 'left' ? x : x - width;
  const barY = y + 16;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, barX, barY, width, 16, 8);
  ctx.fill();
  const ratio = Math.max(0, hp / maxHp);
  const fill = ctx.createLinearGradient(barX, barY, barX + width, barY);
  fill.addColorStop(0, '#ff6b5e');
  fill.addColorStop(1, '#ffb03a');
  ctx.fillStyle = fill;
  if (ratio > 0) {
    roundRect(ctx, barX, barY, Math.max(12, width * ratio), 16, 8);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = align === 'left' ? 'right' : 'left';
  ctx.fillText(`${hp} ♥`, align === 'left' ? barX + width + 52 : barX - 12, barY + 8);
  ctx.restore();
}

function drawTable(ctx) {
  const gradient = ctx.createRadialGradient(640, 400, 80, 640, 400, 760);
  gradient.addColorStop(0, '#1d5c4a');
  gradient.addColorStop(0.6, '#123f33');
  gradient.addColorStop(1, '#0a241d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.save();
  ctx.strokeStyle = 'rgba(232,182,76,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(640, 400, 560, 330, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,182,76,0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(640, 400, 480, 275, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function handPositions(count, centreX, y, spacing) {
  const positions = [];
  const total = (count - 1) * spacing;
  for (let index = 0; index < count; index += 1) {
    positions.push({ x: centreX - total / 2 + index * spacing, y, tilt: (index - (count - 1) / 2) * 0.045 });
  }
  return positions;
}

function drawFloaters(ctx, floaters) {
  for (const floater of floaters) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, floater.life));
    ctx.fillStyle = floater.color;
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText(floater.text, floater.x, floater.y - (1 - floater.life) * 46);
    ctx.restore();
  }
}

function drawConfetti(ctx, confetti) {
  for (const piece of confetti) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, piece.life));
    ctx.fillStyle = piece.color;
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);
    ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
    ctx.restore();
  }
}

function drawTitleScreen(ctx, state) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#0b1030');
  gradient.addColorStop(0.55, '#1d2a5e');
  gradient.addColorStop(1, '#0a241d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Aurora ribbons and stars, drawn, not loaded.
  ctx.save();
  for (const [hue, alpha, yBase] of [['#37e0a0', 0.08, 180], ['#7a5cff', 0.07, 300], ['#2f7fe0', 0.06, 420]]) {
    ctx.fillStyle = hue;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(0, yBase);
    for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
      ctx.lineTo(x, yBase + Math.sin(x / 160) * 26);
    }
    ctx.lineTo(CANVAS_WIDTH, yBase + 48);
    ctx.lineTo(0, yBase + 48);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#ffffff';
  for (let index = 0; index < 70; index += 1) {
    const x = (index * 173) % CANVAS_WIDTH;
    const y = (index * 97) % 480;
    ctx.globalAlpha = 0.25 + ((index * 37) % 10) / 16;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titleGradient = ctx.createLinearGradient(300, 0, 980, 0);
  titleGradient.addColorStop(0, '#ffd97a');
  titleGradient.addColorStop(0.5, '#e8b64c');
  titleGradient.addColorStop(1, '#7ce0b8');
  ctx.fillStyle = titleGradient;
  fitFont(ctx, 'AURORA CLASH', 980, 96);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 18;
  ctx.fillText('AURORA CLASH', 640, 150);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = CREAM;
  ctx.font = '600 26px system-ui, sans-serif';
  ctx.fillText('A duel of the four elements — you against Rook, the Storm Herald', 640, 218);
  ctx.restore();

  // The element cycle, shown as glyphs with arrows: Ember > Gale > Stone > Tide > Ember.
  ctx.save();
  const cycleY = 300;
  const cycleX = [400, 560, 720, 880];
  const order = ['ember', 'gale', 'stone', 'tide'];
  order.forEach((key, index) => {
    const element = ELEMENTS[key];
    const x = cycleX[index];
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, x - 62, cycleY - 52, 124, 104, 14);
    ctx.fill();
    drawGlyph(ctx, element.glyph, x, cycleY - 14, 44, element.color);
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(element.name, x, cycleY + 34);
    if (index < 3) {
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('›', x + 78, cycleY - 6);
    }
  });
  ctx.fillStyle = CREAM;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText('Each element beats the next — an advantage is +3 power. Same element twice in a row: Surge, +2 damage.', 640, cycleY + 84);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = CREAM;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Play 1 card each round for 7 rounds. Higher power wins the trick and deals the difference in damage.', 640, 452);
  ctx.fillText('First to 0 life loses. Click a card, or press 1–5 then Enter. R restarts · M mutes · H help.', 640, 482);
  ctx.restore();

  const pulse = 0.75 + Math.sin(state.time * 3) * 0.25;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('— PRESS SPACE OR CLICK TO BEGIN —', 640, 566);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = MUTED;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(state.best > 0 ? `Best score: ${state.best}` : 'No duel fought yet — your best score will live here.', 640, 640);
  ctx.fillText('An original game: its own rules, art, sounds and names.', 640, 668);
  ctx.restore();
}

function drawOverScreen(ctx, state) {
  const duel = state.duel;
  const won = duel.winner === 'player';
  const draw = duel.winner === 'draw';
  ctx.save();
  ctx.fillStyle = won ? 'rgba(20,40,16,0.82)' : 'rgba(40,10,10,0.82)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
  if (won) drawConfetti(ctx, state.confetti);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = won ? GOLD : '#ff6b5e';
  fitFont(ctx, draw ? 'A DRAW — SUDDEN DEATH SPENT' : won ? 'VICTORY!' : 'DEFEAT', 900, 92);
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 20;
  ctx.fillText(draw ? 'A DRAW — SUDDEN DEATH SPENT' : won ? 'VICTORY!' : 'DEFEAT', 640, 210);
  ctx.restore();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = CREAM;
  ctx.font = '600 24px system-ui, sans-serif';
  ctx.fillText(
    draw ? 'Neither side could land the final blow.'
      : won ? 'Rook bows. The aurora is yours.'
      : 'Rook takes the aurora — this time.',
    640, 300,
  );
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`Rounds played: ${duel.round}  ·  Tricks — you ${duel.playerTricks}, Rook ${duel.opponentTricks}`, 640, 360);
  ctx.fillText(`Damage dealt: ${duel.playerDamage}  ·  Damage taken: ${duel.opponentDamage}`, 640, 394);
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillStyle = GOLD;
  ctx.fillText(`SCORE  ${duel.playerScore}`, 640, 452);
  ctx.fillStyle = MUTED;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(state.best > 0 ? `Best score: ${state.best}` : '', 640, 500);
  ctx.restore();
  const pulse = 0.75 + Math.sin(state.time * 3) * 0.25;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Press R or click to duel again', 640, 580);
  ctx.restore();
}

function drawHelpOverlay(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(5,10,20,0.88)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#0f1c2e';
  roundRect(ctx, 340, 130, 600, 540, 18);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  roundRect(ctx, 340, 130, 600, 540, 18);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('HOW TO DUEL', 640, 178);
  ctx.fillStyle = CREAM;
  ctx.font = '18px system-ui, sans-serif';
  const lines = [
    'Each round, you and Rook play one card.',
    'Power = value. Element advantage: +3 power.',
    'Higher power wins the trick and deals the',
    'difference in damage (at least 1).',
    '',
    'Surge: win twice in a row with the same',
    'element and the second hit deals +2.',
    'Twin: repeat the value you played last',
    'round and that card fights at +1 power.',
    'Truce: identical cards heal both sides 1.',
    '',
    '7 rounds, or until one side reaches 0 life.',
    'Higher life wins; tricks break the tie.',
    '',
    'Keys: 1–5 pick a card · Enter plays it',
    'R restart · M mute · H close this help',
  ];
  lines.forEach((line, index) => ctx.fillText(line, 640, 222 + index * 30));
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawPlayScreen(state) {
    const duel = state.duel;
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    drawTable(ctx);

    // Opponent's name, life and face-down hand across the top.
    drawHpBar(ctx, 40, 26, 300, duel.opponentHp, START_HP, OPPONENT_NAME, 'left');
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(`ROUND ${Math.min(duel.round, MAX_ROUNDS)} / ${MAX_ROUNDS}${duel.suddenDeath ? ' · SUDDEN DEATH' : ''}`, 1240, 34);
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillStyle = MUTED;
    ctx.fillText(`Tricks  you ${duel.playerTricks} — ${duel.opponentTricks}  Rook`, 1240, 58);
    ctx.restore();

    const opponentSpots = handPositions(duel.opponentHand.length, 640, 92, 96);
    duel.opponentHand.forEach((card, index) => {
      const spot = opponentSpots[index];
      drawCardBack(ctx, spot.x - CARD_WIDTH / 2, spot.y, CARD_WIDTH * 0.82, CARD_HEIGHT * 0.82);
    });

    // The play zone: the two cards just played, Rook's flipping face-up.
    const zoneY = 300;
    if (state.played.opponent !== null) {
      if (state.played.faceUp) drawCardFace(ctx, state.played.opponent, 640 - 190, zoneY, CARD_WIDTH, CARD_HEIGHT);
      else drawFlippingCard(ctx, state.played.opponent, 640 - 190, zoneY, CARD_WIDTH, CARD_HEIGHT, state.played.flip);
    }
    if (state.played.player !== null) {
      drawCardFace(ctx, state.played.player, 640 + 190 - CARD_WIDTH, zoneY, CARD_WIDTH, CARD_HEIGHT);
    }
    if (state.played.player !== null && state.played.opponent !== null && state.played.faceUp) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 10;
      ctx.fillText('VS', 640, zoneY + CARD_HEIGHT / 2 + 14);
      ctx.restore();
    }

    // The round's running commentary, one line under the play zone.
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(247,240,221,0.92)';
    ctx.font = '17px system-ui, sans-serif';
    fitFont(ctx, duel.log, 900, 17, '400');
    ctx.fillText(duel.log, 640, 500);
    ctx.restore();

    // Your name, life and score across the bottom, above your hand.
    drawHpBar(ctx, 40, 548, 300, duel.playerHp, START_HP, PLAYER_NAME, 'left');
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`SCORE ${duel.playerScore}`, 1240, 556);
    ctx.fillStyle = MUTED;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('1–5 select · Enter plays · H help · M mute', 1240, 580);
    ctx.restore();

    // Your hand, fanned and lifted on selection; the hovered card lifts a little too.
    const spots = handPositions(duel.playerHand.length, 640, 612, 128);
    duel.playerHand.forEach((card, index) => {
      const spot = spots[index];
      const selected = state.selected === index;
      const lift = selected ? 30 : (state.hover === index ? 12 : 0);
      ctx.save();
      ctx.translate(spot.x, spot.y + CARD_HEIGHT / 2);
      ctx.rotate(spot.tilt);
      ctx.translate(-spot.x, -(spot.y + CARD_HEIGHT / 2));
      drawCardFace(ctx, card, spot.x - CARD_WIDTH / 2, spot.y, CARD_WIDTH, CARD_HEIGHT, lift);
      if (selected) {
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 4;
        roundRect(ctx, spot.x - CARD_WIDTH / 2 - 2, spot.y - lift - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4, CARD_RADIUS + 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    drawFloaters(ctx, state.floaters);
    ctx.restore();
  }

  function draw(state) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (state.screen === SCREEN_TITLE) drawTitleScreen(ctx, state);
    else if (state.screen === SCREEN_PLAY) drawPlayScreen(state);
    else if (state.screen === SCREEN_OVER) {
      drawPlayScreen(state);
      drawOverScreen(ctx, state);
    }
    if (state.help) drawHelpOverlay(ctx);
  }

  return { draw, handPositions, drawGlyph };
}
