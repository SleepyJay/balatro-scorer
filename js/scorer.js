// Jokers are shared across both hands
const jokers = [];

const state = {
  1: { handChips: 5, handMult: 1, cards: [] },
  2: { handChips: 5, handMult: 1, cards: [] },
};

let idCounter = 0;
const uid = () => `id-${++idCounter}`;
const blankCard = () => ({ id: uid(), rank: '', suit: '', chips: 0, aMult: 0, xMult: 1, times: 1 });

// ── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  [1, 2].forEach(n => { state[n].cards = Array.from({length: 6}, blankCard); });
  document.getElementById('joker-panel').innerHTML = buildJokerPanelHTML();
  [1, 2].forEach(n => {
    document.getElementById(`panel-${n}`).innerHTML = buildPanelHTML(n);
    renderCards(n);
  });
  [1, 2].forEach(n => calculate(n));
});

// ── Panel HTML ────────────────────────────────────────────────────────────────

function buildJokerPanelHTML() {
  const jokerOpts = JOKERS.map(j =>
    `<option value="${j.name}">${j.name}</option>`
  ).join('');

  return `
    <section class="card-section joker-section-global">
      <div class="section-header">
        <h3><span class="suit red">♥</span> Jokers </h3>
        <select class="joker-picker" onchange="addJoker(this)">
          <option value="">+ Add Joker</option>
          ${jokerOpts}
        </select>
      </div>
      <div class="item-list" id="jokers-list">
        <p class="empty-hint">No jokers added</p>
      </div>
    </section>
  `;
}

function buildPanelHTML(n) {
  const handOpts = HAND_TYPES.map((h, i) =>
    `<option value="${h.name}" ${i === 0 ? 'selected' : ''}>${h.name}</option>`
  ).join('');

  return `
    <h2 class="panel-title">Hand ${n}</h2>

    <section class="card-section">
      <div class="section-header">
        <h3><span class="suit">♠</span> Hand</h3>
      </div>
      <div class="hand-type-row">
        <label>Type</label>
        <select class="hand-type-select" onchange="onHandTypeChange(${n}, this)">
          ${handOpts}
        </select>
      </div>
      <div class="base-row">
        <div class="stat-cell">
          <label>Base Chips</label>
          <input type="number" id="hand-chips-${n}" class="stat-input chip-color"
                 value="5" min="0" oninput="calculate(${n})">
        </div>
        <span class="big-op">×</span>
        <div class="stat-cell">
          <label>Base Mult</label>
          <input type="number" id="hand-mult-${n}" class="stat-input mult-color"
                 value="1" min="0" oninput="calculate(${n})">
        </div>
        <div class="stat-cell-up">
          <label>Plasma Deck</label>
          <input type="checkbox" value="plasma" id="plasma-deck" oninput="calculate(${n})">
        </div>
        <div class="hand-action-btns">
          <button class="action-btn" onclick="clearHand(${n})">Clear</button>
          <button class="action-btn" onclick="dupHand(${n})">Dup</button>
        </div>
      </div>
     
      <div class="subsection-header"><span>Scored Cards</span></div>
      <div class="item-list" id="cards-${n}"></div>
    </section>

    <div class="score-display" id="score-display-${n}">
      <div class="formula" id="formula-${n}"></div>
      <div class="score-value" id="score-value-${n}">0</div>
    </div>
  `;
}

// ── Jokers ────────────────────────────────────────────────────────────────────

function addJoker(sel) {
  const name = sel.value;
  if (!name) return;
  const data = JOKERS.find(j => j.name === name);
  if (!data) return;

  jokers.push({ id: uid(), ...data, hand1: true, hand2: true });
  sel.value = '';
  renderJokers();
  [1, 2].forEach(n => calculate(n));
}

function removeJoker(id) {
  jokers.splice(jokers.findIndex(j => j.id === id), 1);
  renderJokers();
  [1, 2].forEach(n => calculate(n));
}

function updateJoker(id, field, val) {
  const j = jokers.find(j => j.id === id);
  if (j) { j[field] = parseFloat(val) || 0; [1, 2].forEach(n => calculate(n)); }
}

function toggleJokerHand(id, hand, checked) {
  const j = jokers.find(j => j.id === id);
  if (j) { j[hand] = checked; [1, 2].forEach(n => calculate(n)); }
}

function renderJokers() {
  const el = document.getElementById('jokers-list');
  if (!jokers.length) {
    el.innerHTML = '<p class="empty-hint">No jokers added</p>';
    return;
  }
  el.innerHTML = jokers.map(j => `
    <div class="joker-row" id="${j.id}">
      <span class="joker-name">${j.name}</span>
      <span class="point-stat"><span class="lbl">Chips</span><input type="number" class="mini-input chip-color" value="${j.chips}" min="0" step="${j.chipsStep}" oninput="updateJoker('${j.id}', 'chips', this.value)"></span>
      <span class="point-stat"><span class="lbl">+Mult</span><input type="number" class="mini-input mult-color" value="${j.aMult}" min="0" step="${j.aMultStep}" oninput="updateJoker('${j.id}', 'aMult', this.value)"></span>
      <span class="point-stat"><span class="lbl">×Mult</span><input type="number" class="mini-input xmult-color" value="${j.xMult}" min="0" step="${j.xMultStep}" oninput="updateJoker('${j.id}', 'xMult', this.value)"></span>
      <span class="joker-name"><span class="lbl-descr">${j.description}</span></span>
      <span class="joker-row-end">
        <span class="hand-checks">
          <label class="hand-check-lbl"><input type="checkbox" ${j.hand1 ? 'checked' : ''} onchange="toggleJokerHand('${j.id}', 'hand1', this.checked)"> H1</label>
          <label class="hand-check-lbl"><input type="checkbox" ${j.hand2 ? 'checked' : ''} onchange="toggleJokerHand('${j.id}', 'hand2', this.checked)"> H2</label>
        </span>
        <button class="remove-btn" onclick="removeJoker('${j.id}')">✕</button>
      </span>
    </div>
  `).join('');
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function clearCard(n, id) {
  const c = state[n].cards.find(c => c.id === id);
  if (!c) return;
  Object.assign(c, { rank: '', suit: '', chips: 0, aMult: 0, xMult: 1, times: 1 });
  renderCards(n);
  calculate(n);
}

function updateCard(n, id, field, val) {
  const c = state[n].cards.find(c => c.id === id);
  if (c) { c[field] = parseFloat(val) || 0; calculate(n); }
}

function onCardRankChange(n, id, sel) {
  const c = state[n].cards.find(c => c.id === id);
  if (!c) return;
  c.rank = sel.value;
  if (sel.value) {
    const data = CARD_RANKS.find(r => r.rank === sel.value);
    if (data) {
      c.chips = data.chips;
      const row = document.getElementById(id);
      if (row) row.querySelector('.chip-input').value = data.chips;
    }
  }
  calculate(n);
}

function onCardSuitChange(n, id, sel) {
  const c = state[n].cards.find(c => c.id === id);
  if (c) { c.suit = sel.value; }
  sel.className = `suit-select ${isRedSuit(sel.value) ? 'red' : ''}`;
  calculate(n);
}

function isRedSuit(suit) { return suit === '♥' || suit === '♦'; }

function initAdditiveChipInputs(n) {
  const step = 10;
  document.querySelectorAll(`#cards-${n} .chip-input`).forEach(input => {
    let prev = null;
    const save = () => { prev = parseFloat(input.value) || 0; };
    input.addEventListener('mousedown', save);
    input.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') save(); });
    input.addEventListener('change', () => {
      if (prev === null) return;
      const dir = (parseFloat(input.value) || 0) > prev ? 1 : -1;
      input.value = prev + dir * step;
      input.dispatchEvent(new Event('input'));
      prev = null;
    });
  });
}

function renderCards(n) {
  let i = 1;
  document.getElementById(`cards-${n}`).innerHTML = state[n].cards.map(c => `
    <div class="card-row" id="${c.id}">
      <div style="display: none">${i++}</div>
      ${i <= 6 ? `
      <select class="rank-select" onchange="onCardRankChange(${n}, '${c.id}', this)">
        <option value="">—</option>
        ${CARD_RANKS.map(r => `<option value="${r.rank}" ${r.rank === c.rank ? 'selected' : ''}>${r.rank}</option>`).join('')}
      </select>
      <select class="suit-select ${isRedSuit(c.suit) ? 'red' : ''}" onchange="onCardSuitChange(${n}, '${c.id}', this)">
        <option value="">—</option>
        ${SUITS.map(s => `<option value="${s}" ${s === c.suit ? 'selected' : ''}>${s}</option>`).join('')}
      </select>`
      : "Unplayed cards"}
      <div class="card-stat"><span class="lbl">Chips</span><input type="number" class="mini-input chip-input chip-color no-spinner" value="${c.chips}" min="0" oninput="updateCard(${n}, '${c.id}', 'chips', this.value)"></div>
      <div class="card-stat"><span class="lbl">+Mult</span><input type="number" class="mini-input mult-color" value="${c.aMult}" min="0" oninput="updateCard(${n}, '${c.id}', 'aMult', this.value)"></div>
      <div class="card-stat"><span class="lbl">×Mult</span><input type="number" class="mini-input xmult-color" value="${c.xMult}" min="0" step=".5" oninput="updateCard(${n}, '${c.id}', 'xMult', this.value)"></div>
      <div class="card-stat"><span class="lbl">Hits</span><input type="number" class="mini-input" value="${c.times}" min="1" step="1" oninput="updateCard(${n}, '${c.id}', 'times', this.value)"></div>
      <button class="remove-btn" title="Clear card" onclick="clearCard(${n}, '${c.id}')">✕</button>
    </div>
  `).join('');
  initAdditiveChipInputs(n);
}

// ── Hand actions ──────────────────────────────────────────────────────────────

function clearHand(n) {
  const first = HAND_TYPES[0];
  document.querySelector(`#panel-${n} .hand-type-select`).value = first.name;
  document.getElementById(`hand-chips-${n}`).value = first.chips;
  document.getElementById(`hand-mult-${n}`).value  = first.mult;
  document.getElementById('plasma-deck').checked = false;
  state[n].cards = Array.from({length: 6}, blankCard);
  renderCards(n);
  calculate(n);
}

function dupHand(n) {
  const dest = n === 1 ? 2 : 1;
  const srcType = document.querySelector(`#panel-${n} .hand-type-select`).value;
  document.querySelector(`#panel-${dest} .hand-type-select`).value = srcType;
  document.getElementById(`hand-chips-${dest}`).value = document.getElementById(`hand-chips-${n}`).value;
  document.getElementById(`hand-mult-${dest}`).value  = document.getElementById(`hand-mult-${n}`).value;
  document.getElementById('plasma-deck').checked = document.getElementById('plasma-deck').checked;
  state[dest].cards = state[n].cards.map(c => ({ ...c, id: uid() }));
  renderCards(dest);
  calculate(dest);
}

// ── Hand type ─────────────────────────────────────────────────────────────────

function onHandTypeChange(n, sel) {
  const data = HAND_TYPES.find(h => h.name === sel.value);
  if (!data) return;
  document.getElementById(`hand-chips-${n}`).value = data.chips;
  document.getElementById(`hand-mult-${n}`).value  = data.mult;
  calculate(n);
}

// ── Scoring ───────────────────────────────────────────────────────────────────

// Formula: Score = chips × mult
// Cards and jokers are applied sequentially to running chips/mult totals.
// Each card hit: chips += card.chips; mult = (mult + card.aMult) × card.xMult
// Jokers follow cards in order: mult = (mult + joker.aMult) × joker.xMult

function calculate(n) {
  const s = state[n];

  let chips = parseFloat(document.getElementById(`hand-chips-${n}`).value) || 0;
  let mult  = parseFloat(document.getElementById(`hand-mult-${n}`).value)  || 0;
  const plasma = document.getElementById('plasma-deck');

  // Cards: each hit applies +chips, +aMult, ×xMult sequentially to running totals
  for (const c of s.cards) {
    chips += (c.chips || 0) * (c.times || 1);
    for (let i = 0; i < (c.times || 1); i++) {
      mult += c.aMult || 0;
      mult *= c.xMult || 1;
    }
  }

  // Jokers: applied sequentially after cards
  for (const j of jokers.filter(j => j[`hand${n}`])) {
    chips += j.chips || 0;
    mult  += j.aMult || 0;
    mult  *= j.xMult || 1;
  }

  if (plasma.checked) {
    chips = (chips + mult) / 2;
    mult  = chips;
  }

  const score = Math.floor(chips * mult);

  const formula = `<span class="chip-color">${fmtNum(chips)} chips</span>`
                + `<span class="op">×</span>`
                + `<span class="mult-color">${fmtNum(mult)} mult</span>`
                + `<span class="op">=</span>`;

  document.getElementById(`formula-${n}`).innerHTML = formula;
  document.getElementById(`score-value-${n}`).textContent = score.toLocaleString();

  updateWinner();
}

function fmtNum(n) {
  return parseFloat(n.toFixed(4)).toString();
}

function updateWinner() {
  const s1 = getScore(1);
  const s2 = getScore(2);
  setWinner('score-display-1', s1 > s2, s1 < s2);
  setWinner('score-display-2', s2 > s1, s2 < s1);
}

function getScore(n) {
  return parseInt(document.getElementById(`score-value-${n}`).textContent.replace(/,/g, ''), 10) || 0;
}

function setWinner(id, isWin, isLose) {
  const el = document.getElementById(id);
  el.classList.toggle('winner', isWin);
  el.classList.toggle('loser',  isLose);
}
