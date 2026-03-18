# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A UI-based scorer for the video game Balatro (a poker roguelike). The goal is to replace a previous Python script and spreadsheet with a better interactive UI for scoring hands.

## Running

Open `index.html` directly in a browser — no build step, no server required.

## Architecture

Pure HTML/CSS/JS, split across four files:

- `index.html` — shell with two `#panel-N` mount points
- `styles.css` — retro casino theme (dark green felt, gold accents, Cinzel/Oswald fonts via Google Fonts)
- `data.js` — game data: `HAND_TYPES`, `CARD_RANKS`, `SUITS`, `JOKERS` (chips/aMult/xMult/description per joker)
- `scorer.js` — all logic: state management, DOM rendering, scoring formula

## Scoring Formula

```
Score = chips × mult
```

Cards and jokers are applied sequentially to running totals. Each card hit (controlled by the "Hits" field): `chips += card.chips`, then `mult = (mult + card.aMult) × card.xMult`. Jokers follow in order with the same pattern. This correctly handles retriggers — e.g. +4 aMult / ×2 xMult hit 3 times: (0+4)×2=8, (8+4)×2=24, (24+4)×2=56.

## UI Structure

Each hand panel (1 and 2, side-by-side for comparison) contains:
1. **Jokers section** — dropdown adds a joker row with editable chips/+Mult/×Mult fields (auto-filled from `data.js`)
2. **Hand section** — hand type dropdown (auto-fills base chips/mult), plus scored card rows (rank+suit dropdown auto-fills chip value)
3. **Score display** — shows formula breakdown and final score; winner gets a green glow, loser dims

State lives in a plain `state` object keyed by panel number (`state[1]`, `state[2]`). All rendering is done by `renderJokers(n)` and `renderCards(n)`, which rebuild inner HTML from state. `calculate(n)` reads current DOM input values, computes the score, and calls `updateWinner()` to apply winner/loser CSS classes.
