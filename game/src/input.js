// AURORA CLASH — input: mouse clicks on cards and buttons, and the keyboard.
// Actions are queued as small bit flags and drained once per frame, so a
// fast double-click can never play two cards in one round.
export const ACTION_CONFIRM = 1 << 0;
export const ACTION_CANCEL = 1 << 1;
export const ACTION_RESTART = 1 << 2;
export const ACTION_MUTE = 1 << 3;
export const ACTION_HELP = 1 << 4;

export function createInput(canvas) {
  let queued = 0;
  let click = null;
  const numberKeys = [];

  function press(action) {
    queued |= action;
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'enter') { press(ACTION_CONFIRM); event.preventDefault(); }
    else if (key === 'escape') press(ACTION_CANCEL);
    else if (key === 'r') press(ACTION_RESTART);
    else if (key === 'm') press(ACTION_MUTE);
    else if (key === 'h') press(ACTION_HELP);
    else if (key >= '1' && key <= '9') numberKeys.push(Number(key));
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    click = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    takeActions() {
      const actions = queued;
      queued = 0;
      return actions;
    },
    takeNumberKeys() {
      const keys = numberKeys.splice(0);
      return keys;
    },
    takeClick() {
      const point = click;
      click = null;
      return point;
    },
  };
}
