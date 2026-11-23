# best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/zevabagus-spec/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/zevabagus-spec/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

AURORA CLASH — a duel of the four elements. You, the Warden, face Rook, the Storm Herald, across a felt table: 7 rounds, one card each, both sides at 20 life. A card's power is its value; an element advantage is +3, winning twice in a row with the same element is a Surge (+2 damage), repeating a value is a Twin (+1 power), and identical cards are a Truce that heals both sides. Rook counters the element you played last round, saves his big cards early, and finishes you off when your life runs low — so every hand is a decision about when to spend your 8s and when to bait his counter. The game runs offline in a desktop browser from static files, with keyboard and mouse play, synthesized sound, and a title screen, a table, and win and loss screens.

## The approach

The duel is a simultaneous-reveal trick game, not a clone of any commercial card game: the four-element cycle (Ember beats Gale, Gale beats Stone, Stone beats Tide, Tide beats Ember) makes every card's value depend on what the opponent just played, and the Surge/Twin/Truce rules reward remembering the last two rounds, not just the current hand. The opponent is a readable heuristic — counter the last element, conserve early, finish late, bluff one round in seven — so a player can read Rook's plan and play around it. The source is split by job: `config.js` tunes the duel, `deck.js` deals, `rules.js` resolves rounds, `ai.js` plays Rook, `state.js` runs the duel, `render.js` paints everything, `audio.js` synthesizes the sound, and `shots.js` stages the screenshots by playing real duels forward from a fixed seed.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Click a card, or press 1–5 then Enter, to play it. R restarts, M mutes, H shows the rules.

---

<sub>Entered on [make.fun](https://make.fun/?ref=pkrtjm47&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
