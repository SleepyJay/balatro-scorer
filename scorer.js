// State for each hand panel
const state = {
  1: { jokers: [], handChips: 5, handMult: 1, cards: [] },
  2: { jokers: [], handChips: 5, handMult: 1, cards: [] },
};

let idCounter = 0;
const uid = () => `id-${++idCounter}`;

// ── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  [1, 2].forEach(n => {
    document.getElementById(`panel-${n}`).innerHTML = buildPanelHTML(n);
    calculate(n);
  });
});

// ── Panel HTML ────────────────────────────────────────────────────────────────

function buildPanelHTML(n) {
  const jokerOpts = JOKERS.map(j =>
    `<option value="${j.name}">${j.name}</option>`
  ).join('');

  const handOpts = HAND_TYPES.map((h, i) =>
    `<option value="${h.name}" ${i === 0 ? 'selected' : ''}>${h.name}</option>`
  ).join('');

  return `
    <h2 class="panel-title">Hand ${n}</h2>

    <section class="card-section">
      <div class="section-header">
        <h3><span class="suit red">♥</span> Jokers</h3>
        <select class="joker-picker" onchange="addJoker(${n}, this)">
          <option value="">+ Add Joker</option>
          ${jokerOpts}
        </select>
      </div>
      <div class="item-list" id="jokers-${n}">
        <p class="empty-hint">No jokers added</p>
      </div>
    </section>

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
      </div>

      <div class="subsection-header">
        <span>Scored Cards</span>
        <button class="add-btn" onclick="addCard(${n})">+ Card</button>
      </div>
      <div class="item-list" id="cards-${n}">
        <p class="empty-hint">No cards added</p>
      </div>
    </section>

    <div class="score-display" id="score-display-${n}">
      <div class="formula" id="formula-${n}"></div>
      <div class="score-value" id="score-value-${n}">0</div>
    </div>
  `;
}

// ── Jokers ────────────────────────────────────────────────────────────────────

function addJoker(n, sel) {
  const name = sel.value;
  if (!name) return;
  const data = JOKERS.find(j => j.name === name);
  if (!data) return;

  state[n].jokers.push({ id: uid(), ...data });
  sel.value = '';
  renderJokers(n);
  calculate(n);
}

function removeJoker(n, id) {
  state[n].jokers = state[n].jokers.filter(j => j.id !== id);
  renderJokers(n);
  calculate(n);
}

function updateJoker(n, id, field, val) {
  const j = state[n].jokers.find(j => j.id === id);
  if (j) { j[field] = parseFloat(val) || 0; calculate(n); }
}

function renderJokers(n) {
  const el = document.getElementById(`jokers-${n}`);
  if (!state[n].jokers.length) {
    el.innerHTML = '<p class="empty-hint">No jokers added</p>';
    return;
  }
  el.innerHTML = state[n].jokers.map(j => `
    <div class="item-row" id="${j.id}">
      <div class="item-name">${j.name}</div>
      <div class="item-stats">
        <div class="stat-cell">
          <label>Chips</label>
          <input type="number" class="mini-input chip-color" value="${j.chips}" min="0"
                 oninput="updateJoker(${n}, '${j.id}', 'chips', this.value)">
        </div>
        <div class="stat-cell">
          <label>+Mult</label>
          <input type="number" class="mini-input mult-color" value="${j.aMult}" min="0"
                 oninput="updateJoker(${n}, '${j.id}', 'aMult', this.value)">
        </div>
        <div class="stat-cell">
          <label>×Mult</label>
          <input type="number" class="mini-input xmult-color" value="${j.xMult}" min="0" step="0.01"
                 oninput="updateJoker(${n}, '${j.id}', 'xMult', this.value)">
        </div>
      </div>
      <div class="item-desc">${j.description}</div>
      <button class="remove-btn" onclick="removeJoker(${n}, '${j.id}')">✕</button>
    </div>
  `).join('');
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function addCard(n) {
  state[n].cards.push({ id: uid(), rank: 'A', suit: '♠', chips: 11, aMult: 0, xMult: 1 });
  renderCards(n);
  calculate(n);
}

function removeCard(n, id) {
  state[n].cards = state[n].cards.filter(c => c.id !== id);
  renderCards(n);
  calculate(n);
}

function updateCard(n, id, field, val) {
  const c = state[n].cards.find(c => c.id === id);
  if (c) { c[field] = parseFloat(val) || 0; calculate(n); }
}

function onCardRankChange(n, id, sel) {
  const data = CARD_RANKS.find(r => r.rank === sel.value);
  const c = state[n].cards.find(c => c.id === id);
  if (!c || !data) return;
  c.rank = data.rank;
  c.chips = data.chips;
  const row = document.getElementById(id);
  if (row) row.querySelector('.chip-input').value = data.chips;
  calculate(n);
}

function onCardSuitChange(n, id, sel) {
  const c = state[n].cards.find(c => c.id === id);
  if (c) { c.suit = sel.value; }
  sel.className = `suit-select ${isRedSuit(sel.value) ? 'red' : ''}`;
  calculate(n);
}

function isRedSuit(suit) { return suit === '♥' || suit === '♦'; }

function renderCards(n) {
  const el = document.getElementById(`cards-${n}`);
  if (!state[n].cards.length) {
    el.innerHTML = '<p class="empty-hint">No cards added</p>';
    return;
  }
  el.innerHTML = state[n].cards.map(c => `
    <div class="item-row card-row" id="${c.id}">
      <div class="card-selects">
        <select class="rank-select"
                onchange="onCardRankChange(${n}, '${c.id}', this)">
          ${CARD_RANKS.map(r =>
            `<option value="${r.rank}" ${r.rank === c.rank ? 'selected' : ''}>${r.rank}</option>`
          ).join('')}
        </select>
        <select class="suit-select ${isRedSuit(c.suit) ? 'red' : ''}"
                onchange="onCardSuitChange(${n}, '${c.id}', this)">
          ${SUITS.map(s =>
            `<option value="${s}" ${s === c.suit ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
      <div class="item-stats">
        <div class="stat-cell">
          <label>Chips</label>
          <input type="number" class="mini-input chip-input chip-color" value="${c.chips}" min="0"
                 oninput="updateCard(${n}, '${c.id}', 'chips', this.value)">
        </div>
        <div class="stat-cell">
          <label>+Mult</label>
          <input type="number" class="mini-input mult-color" value="${c.aMult}" min="0"
                 oninput="updateCard(${n}, '${c.id}', 'aMult', this.value)">
        </div>
        <div class="stat-cell">
          <label>×Mult</label>
          <input type="number" class="mini-input xmult-color" value="${c.xMult}" min="0" step="0.01"
                 oninput="updateCard(${n}, '${c.id}', 'xMult', this.value)">
        </div>
      </div>
      <button class="remove-btn" onclick="removeCard(${n}, '${c.id}')">✕</button>
    </div>
  `).join('');
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

// Formula: Score = (handChips + cardChips + jokerChips)
//                × (handMult + cardAMult + jokerAMult)
//                × jokerXMult1 × jokerXMult2 × ...
//
// All xMult values are multiplied together (order-independent for pure multipliers).

function calculate(n) {
  const s = state[n];

  let chips = parseFloat(document.getElementById(`hand-chips-${n}`).value) || 0;
  let mult  = parseFloat(document.getElementById(`hand-mult-${n}`).value)  || 0;
  let xMult = 1;

  for (const c of s.cards)  { chips += c.chips || 0; mult += c.aMult || 0; xMult *= (c.xMult || 1); }
  for (const j of s.jokers) { chips += j.chips || 0; mult += j.aMult || 0; xMult *= (j.xMult || 1); }

  const score = Math.floor(chips * mult * xMult);

  // Formula display
  let formula = `<span class="chip-color">${chips} chips</span>`
              + `<span class="op">×</span>`
              + `<span class="mult-color">${mult} mult</span>`;
  if (xMult !== 1) {
    formula += `<span class="op">×</span>`
             + `<span class="xmult-color">×${fmtNum(xMult)}</span>`;
  }
  formula += `<span class="op">=</span>`;

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
