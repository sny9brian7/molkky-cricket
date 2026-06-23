/* ============================================================
   MOLKKY CRICKET - ゲームロジック
   ※このファイルのルール・計算ロジックは元アプリと同一です。
     UIの見た目はCSS/HTML側で変更していますが、勝敗判定・得点計算・
     オープン/クローズ判定・連続ミス失格などの挙動は変更していません。
   ============================================================ */

/* ---- サウンド ----
   実際の音声ファイルは下記 SOUND_DIR のフォルダから読み込む。
   フォルダ名を変えたり場所を移したりした場合は、SOUND_DIR と
   SOUND_FILES の値だけ書き換えればよい(他のコードは触らなくてよい)。 */
const SOUND_DIR = '音声';
const SOUND_FILES = {
  mark: 'SINGLE HIT.mp3',   // スキットル1本へのSINGLE/DOUBLE/TRIPLEヒット
  multi: 'MULTI HIT.mp3',   // 複数本まとめてのMULTI HIT
  open: 'OPEN.mp3',         // スキットルをオープンした時
  close: 'CLOSE.mp3',       // スキットルをクローズ(盤面除外)した時
  miss: 'MISS.mp3'          // MISS / 0マーク
};

/* 音の種類ごとの相対音量。CLOSEだけ他より大きく鳴らしたい場合はここを上げる */
const SOUND_VOLUME_MULTIPLIER = {
  mark: 1,
  multi: 1,
  open: 1,
  close: 1.8,
  miss: 1
};

let soundEnabled = true;
let soundVolume = 0.7;

function soundPath(filename) {
  return SOUND_DIR.split('/').map(encodeURIComponent).join('/') + '/' + encodeURIComponent(filename);
}

const sounds = {};
Object.keys(SOUND_FILES).forEach((key) => {
  sounds[key] = new Audio(soundPath(SOUND_FILES[key]));
});

function playSE(type) {
  if (!soundEnabled) return;
  const audio = sounds[type];
  if (!audio) return;
  audio.currentTime = 0;
  audio.volume = Math.min(1, soundVolume * (SOUND_VOLUME_MULTIPLIER[type] || 1));
  audio.play().catch(() => {});
}

/* DOUBLE/TRIPLEのように1投で複数マークが入った時は、その数だけmark音を鳴らす */
function playMarkRepeated(count) {
  if (!soundEnabled) return;
  const n = Math.max(1, count || 1);
  for (let i = 0; i < n; i++) {
    setTimeout(() => playSE('mark'), i * 420);
  }
}

function handleSoundToggle() {
  const isOn = document.querySelector("input[name='soundSwitch']:checked").value === 'on';
  soundEnabled = isOn;
  document.getElementById("soundVolumeWrapper").classList.toggle("hidden", !isOn);
  localStorage.setItem('molkky_sound_enabled', isOn ? '1' : '0');
}

/* スライダーの塗り済み部分(--range-fill)をCSS側に伝える */
function syncRangeFill(el) {
  if (!el) return;
  const min = parseFloat(el.min) || 0;
  const max = parseFloat(el.max) || 100;
  const val = parseFloat(el.value);
  const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
  el.style.setProperty('--range-fill', `${pct}%`);
}

function updateSoundVolume() {
  const input = document.getElementById("soundVolumeInput");
  const val = parseInt(input.value);
  soundVolume = val / 100;
  document.getElementById("soundVolumeLabel").innerText = `音量: ${val}%`;
  localStorage.setItem('molkky_sound_volume', String(val));
  syncRangeFill(input);
}

function restoreSoundFromStorage() {
  const savedEnabled = localStorage.getItem('molkky_sound_enabled');
  const savedVolume = localStorage.getItem('molkky_sound_volume');

  soundEnabled = savedEnabled === null ? true : savedEnabled === '1';
  soundVolume = savedVolume === null ? 0.7 : parseInt(savedVolume) / 100;

  document.getElementById('lblSoundOn').classList.toggle('active', soundEnabled);
  document.getElementById('lblSoundOff').classList.toggle('active', !soundEnabled);
  document.querySelector(`input[name='soundSwitch'][value='${soundEnabled ? 'on' : 'off'}']`).checked = true;
  document.getElementById('soundVolumeWrapper').classList.toggle('hidden', !soundEnabled);

  const volPercent = Math.round(soundVolume * 100);
  const volInput = document.getElementById('soundVolumeInput');
  volInput.value = volPercent;
  document.getElementById('soundVolumeLabel').innerText = `音量: ${volPercent}%`;
  syncRangeFill(volInput);
}

/* ---- テーマ切り替え ---- */
let currentStyleSelected = 'pastel';
let currentColorSelected = 'light';

function selectStyleConfig(styleName) {
  currentStyleSelected = styleName;
  document.getElementById('style-opt-pastel').classList.toggle('active', styleName === 'pastel');
  document.getElementById('style-opt-neon').classList.toggle('active', styleName === 'neon');
  applyCombinedTheme();
}

function selectColorConfig(colorName) {
  currentColorSelected = colorName;
  document.getElementById('color-opt-light').classList.toggle('active', colorName === 'light');
  document.getElementById('color-opt-dark').classList.toggle('active', colorName === 'dark');
  applyCombinedTheme();
}

function applyCombinedTheme() {
  const combinedKey = `${currentStyleSelected}-${currentColorSelected}`;
  const themeMap = {
    'pastel-light': '',
    'pastel-dark': 'pastel-dark',
    'neon-light': 'neon-light',
    'neon-dark': 'neon-dark'
  };
  const actualTheme = themeMap[combinedKey];
  if (!actualTheme) {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', actualTheme);
  }
  localStorage.setItem('molkky_theme_style', currentStyleSelected);
  localStorage.setItem('molkky_theme_color', currentColorSelected);
}

function restoreThemeFromStorage() {
  const savedStyle = localStorage.getItem('molkky_theme_style');
  const savedColor = localStorage.getItem('molkky_theme_color');
  /* 以前のPRO/EDGE選択が残っていた場合はPASTELにフォールバックする */
  currentStyleSelected = (savedStyle === 'pastel' || savedStyle === 'neon') ? savedStyle : 'pastel';
  if (savedColor) currentColorSelected = savedColor;
  document.getElementById('style-opt-pastel').classList.toggle('active', currentStyleSelected === 'pastel');
  document.getElementById('style-opt-neon').classList.toggle('active', currentStyleSelected === 'neon');
  document.getElementById('color-opt-light').classList.toggle('active', currentColorSelected === 'light');
  document.getElementById('color-opt-dark').classList.toggle('active', currentColorSelected === 'dark');
  applyCombinedTheme();
}

/* ---- セットアップ画面: スキットル設定UI生成 ---- */
const nums = [6, 7, 8, 9, 10, 11, 12];
let activeCount = 2;

function buildSkittleSetupUI() {
  const grid = document.getElementById("skittleMarkSetup");
  grid.innerHTML = "";
  nums.forEach(n => {
    const cell = document.createElement("div");
    cell.className = "sk-num-cell";
    cell.innerHTML = `
      <div class="sk-num-label">${n}</div>
      <div class="sk-radio-group">
        <label class="sk-radio-opt" id="label_sk_${n}_2">
          <input type="radio" name="sk_${n}" value="2" checked onchange="syncHandicapMarkMax(${n})"> 2
        </label>
        <label class="sk-radio-opt" id="label_sk_${n}_3">
          <input type="radio" name="sk_${n}" value="3" onchange="syncHandicapMarkMax(${n})"> 3
        </label>
      </div>
    `;
    grid.appendChild(cell);
  });
  renderHandicapMarksContainer();
}

function renderHandicapMarksContainer() {
  const handicapMarksContainer = document.getElementById("handicapMarksContainer");
  handicapMarksContainer.innerHTML = "";

  let gridStyle = `grid-template-columns: 50px repeat(${activeCount}, 1fr); gap: 10px 6px;`;
  if (activeCount > 2) gridStyle = `grid-template-columns: 40px repeat(${activeCount}, 1fr); gap: 10px 4px; font-size:12px;`;

  nums.forEach(n => {
    const row = document.createElement("div");
    row.className = "handicap-inputs";
    row.style = gridStyle;

    let inner = `<div class="sk-label" style="font-size:14px; font-weight:900; align-self:center;">[${n}]</div>`;

    inner += `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <span id="valLblMarkA_${n}" style="font-size:10px; font-weight:bold; color:var(--txt2);">A: 0</span>
        <input type="range" id="handicapMarkA_${n}" value="0" min="0" max="2" step="1" style="width:100%; margin:4px 0;" oninput="document.getElementById('valLblMarkA_${n}').innerText='A: '+this.value">
      </div>`;

    inner += `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <span id="valLblMarkB_${n}" style="font-size:10px; font-weight:bold; color:var(--txt2);">B: 0</span>
        <input type="range" id="handicapMarkB_${n}" value="0" min="0" max="2" step="1" style="width:100%; margin:4px 0;" oninput="document.getElementById('valLblMarkB_${n}').innerText='B: '+this.value">
      </div>`;

    if (activeCount >= 3) {
      inner += `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <span id="valLblMarkC_${n}" style="font-size:10px; font-weight:bold; color:var(--txt2);">C: 0</span>
          <input type="range" id="handicapMarkC_${n}" value="0" min="0" max="2" step="1" style="width:100%; margin:4px 0;" oninput="document.getElementById('valLblMarkC_${n}').innerText='C: '+this.value">
        </div>`;
    }
    if (activeCount === 4) {
      inner += `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <span id="valLblMarkD_${n}" style="font-size:10px; font-weight:bold; color:var(--txt2);">D: 0</span>
          <input type="range" id="handicapMarkD_${n}" value="0" min="0" max="2" step="1" style="width:100%; margin:4px 0;" oninput="document.getElementById('valLblMarkD_${n}').innerText='D: '+this.value">
        </div>`;
    }

    row.innerHTML = inner;
    handicapMarksContainer.appendChild(row);
  });

  nums.forEach(n => syncHandicapMarkMax(n));
}

function syncHandicapMarkMax(num) {
  const checkedRadio = document.querySelector(`input[name='sk_${num}']:checked`);
  const maxVal = checkedRadio ? parseInt(checkedRadio.value) : 2;
  ['A', 'B', 'C', 'D'].forEach(p => {
    const el = document.getElementById(`handicapMark${p}_${num}`);
    if (el) {
      el.max = maxVal;
      if (parseInt(el.value) > maxVal) {
        el.value = maxVal;
        const lbl = document.getElementById(`valLblMark${p}_${num}`);
        if (lbl) lbl.innerText = `${p}: ${maxVal}`;
      }
    }
  });
}

function handlePlayerCountChange() {
  if (gameMode === 'normal') {
    activeCount = 2;
  } else {
    activeCount = parseInt(document.querySelector("input[name='playerCount']:checked").value);
  }

  document.getElementById("playerCWrapper").classList.toggle("hidden", activeCount < 3);
  document.getElementById("playerDWrapper").classList.toggle("hidden", activeCount < 4);

  document.getElementById("handicapScoreCWrap").classList.toggle("hidden", activeCount < 3);
  document.getElementById("handicapScoreDWrap").classList.toggle("hidden", activeCount < 4);

  const hGrid = document.getElementById("handicapScoresGrid");
  if (activeCount === 2) hGrid.style.gridTemplateColumns = "1fr 1fr";
  else if (activeCount === 3) hGrid.style.gridTemplateColumns = "1fr 1fr 1fr";
  else hGrid.style.gridTemplateColumns = "1fr 1fr 1fr 1fr";

  renderHandicapMarksContainer();
  syncSwapperButtonsVisibility();

  ["btnCount2", "btnCount3", "btnCount4"].forEach(id => {
    const chip = document.getElementById(id);
    if (chip) {
      const radio = chip.querySelector("input");
      chip.classList.toggle("active", radio && radio.checked);
    }
  });
}

function syncSwapperButtonsVisibility() {
  document.getElementById("swapABBtn").classList.toggle("hidden", false);
  document.getElementById("swapBCBtn").classList.toggle("hidden", activeCount < 3);
  document.getElementById("swapCDBtn").classList.toggle("hidden", activeCount < 4);
}

function handleHandicapToggle() {
  if (gameMode === 'normal') {
    document.getElementById("handicapConfigArea").classList.add("hidden");
    return;
  }
  const isEnabled = document.querySelector("input[name='handicapSwitch']:checked").value === 'on';
  document.getElementById("handicapConfigArea").classList.toggle("hidden", !isEnabled);

  document.getElementById("lblHandicapOff").classList.toggle("active", !isEnabled);
  document.getElementById("lblHandicapOn").classList.toggle("active", isEnabled);
}

function handleBurstToggle() {
  if (gameMode === 'normal') {
    document.getElementById("burstConfigArea").classList.add("hidden");
    return;
  }
  const isEnabled = document.querySelector("input[name='burstSwitch']:checked").value === 'on';
  document.getElementById("burstCountWrapper").classList.toggle("hidden", !isEnabled);
  document.getElementById("lblBurstOff").classList.toggle("active", !isEnabled);
  document.getElementById("lblBurstOn").classList.toggle("active", isEnabled);
}

function updateBurstSliderLabel() {
  const input = document.getElementById("burstCountInput");
  document.getElementById("burstSliderLabel").innerText = `失格となる連続ミス本数: ${input.value}回`;
  syncRangeFill(input);
}

function updateMatchTargetSliderLabel() {
  const input = document.getElementById("matchTargetInput");
  document.getElementById("matchTargetSliderLabel").innerText = `試合の勝利条件: ${input.value}セット先取`;
  syncRangeFill(input);
}

function syncCheckboxChips() {
  const cDb = document.getElementById("chkDouble");
  const cTr = document.getElementById("chkTriple");
  document.getElementById("lblChkDouble").classList.toggle("active", cDb && cDb.checked);
  document.getElementById("lblChkTriple").classList.toggle("active", cTr && cTr.checked);
}

function syncThrowChips() {
  const chosen = document.querySelector("input[name='throwCount']:checked").value;
  ["btnThrow1", "btnThrow2", "btnThrow3"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const rad = el.querySelector("input");
      el.classList.toggle("active", rad && rad.checked);
    }
  });
}

function setAllOpenMarksBulk(value) {
  nums.forEach(n => {
    const radio = document.querySelector(`input[name='sk_${n}'][value='${value}']`);
    if (radio) { radio.checked = true; syncHandicapMarkMax(n); }
  });
  nums.forEach(n => {
    ["2", "3"].forEach(v => {
      const lbl = document.getElementById(`label_sk_${n}_${v}`);
      if (lbl) {
        const rad = lbl.querySelector("input");
        lbl.classList.toggle("active", rad && rad.checked);
      }
    });
  });
}

function swapPlayersData(idx1, idx2) {
  const keys = ['A', 'B', 'C', 'D'];
  const k1 = keys[idx1];
  const k2 = keys[idx2];

  const card = document.getElementById("setupCardContainer");
  card.classList.add("shuffle-animate");
  setTimeout(() => card.classList.remove("shuffle-animate"), 200);

  const nameInput1 = document.getElementById(`player${k1}Input`);
  const nameInput2 = document.getElementById(`player${k2}Input`);
  const tempName = nameInput1.value;
  nameInput1.value = nameInput2.value;
  nameInput2.value = tempName;

  const scoreInput1 = document.getElementById(`handicapScore${k1}`);
  const scoreInput2 = document.getElementById(`handicapScore${k2}`);
  if (scoreInput1 && scoreInput2) {
    const tempScore = scoreInput1.value;
    scoreInput1.value = scoreInput2.value;
    scoreInput2.value = tempScore;
  }

  nums.forEach(n => {
    const mark1 = document.getElementById(`handicapMark${k1}_${n}`);
    const mark2 = document.getElementById(`handicapMark${k2}_${n}`);
    if (mark1 && mark2) {
      const tempMark = mark1.value;
      mark1.value = mark2.value;
      mark2.value = tempMark;

      const lbl1 = document.getElementById(`valLblMark${k1}_${n}`);
      const lbl2 = document.getElementById(`valLblMark${k2}_${n}`);
      if (lbl1) lbl1.innerText = `${k1}: ${mark1.value}`;
      if (lbl2) lbl2.innerText = `${k2}: ${mark2.value}`;
    }
  });
}

/* ---- ゲーム状態 ---- */
let gameMode = 'normal';
let targetSetsNeeded = 1;
let matchHistory = [];
let throwRecords = {};
let playerRotationOrder = [0, 1, 2, 3];

function initThrowRecordsData() {
  throwRecords = {};
  for (let t = 1; t <= 12; t++) {
    throwRecords[t] = {};
    for (let p = 0; p < 4; p++) {
      throwRecords[t][p] = {
        1: { markStr: '-', gain: 0, total: 0 },
        2: { markStr: '-', gain: 0, total: 0 },
        3: { markStr: '-', gain: 0, total: 0 }
      };
    }
  }
}

let cfg = {
  doubleEnabled: true,
  tripleEnabled: false,
  throwsPerTurn: 2,
  openMarks: {},
  burstEnabled: false,
  burstLimit: 3,
  handicapData: { scores: {}, marks: {} }
};

let players = [
  { id: 0, key: 'A', name: "", score: 0, marks: {}, totalMarks: 0, throws: 0, currentMiss: 0, maxMiss: 0, setsWon: 0, isDisqualified: false, colorClass: 'pA-color', activeClass: 'active-turn-a', scoreClass: 'score-a' },
  { id: 1, key: 'B', name: "", score: 0, marks: {}, totalMarks: 0, throws: 0, currentMiss: 0, maxMiss: 0, setsWon: 0, isDisqualified: false, colorClass: 'pB-color', activeClass: 'active-turn-b', scoreClass: 'score-b' },
  { id: 2, key: 'C', name: "", score: 0, marks: {}, totalMarks: 0, throws: 0, currentMiss: 0, maxMiss: 0, setsWon: 0, isDisqualified: false, colorClass: 'pC-color', activeClass: 'active-turn-c', scoreClass: 'score-c' },
  { id: 3, key: 'D', name: "", score: 0, marks: {}, totalMarks: 0, throws: 0, currentMiss: 0, maxMiss: 0, setsWon: 0, isDisqualified: false, colorClass: 'pD-color', activeClass: 'active-turn-d', scoreClass: 'score-d' }
];

let turn = 1;
let currentPlayerIndex = 0;
let throwNum = 1;

let selectedSingle = null;
let selectedMarkType = null;
let selectedMulti = [];
let pendingAction = null;

let history = [];
let statHistory = [];
let statFreezeIndex = null;

/* ---- 画面遷移 ---- */
function switchScreen(screenId) {
  ["topMenuScreen", "setupScreen", "gameScreen", "ruleScreen", "themeConfigScreen", "historyScreen"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", id !== screenId);
  });
}

function openSetup(mode) {
  gameMode = mode;

  const setupCard = document.getElementById("setupCardContainer");
  setupCard.classList.toggle("mode-normal", mode === 'normal');
  setupCard.classList.toggle("mode-custom", mode === 'custom');

  const customOnlyElements = [
    document.getElementById("customPlayerCountArea"),
    document.getElementById("matchFormatArea"),
    document.getElementById("burstConfigArea"),
    document.getElementById("handicapToggleArea"),
    document.getElementById("bonusMarksArea"),
    document.getElementById("throwsPerTurnArea"),
    document.getElementById("openMarksConfigArea")
  ];

  if (mode === 'normal') {
    document.getElementById("setupMainTitle").innerText = "ノーマル対戦";
    document.getElementById("setupSubTitle").innerText = "NORMAL MATCH SETUP";

    customOnlyElements.forEach(el => { if (el) el.classList.add("hidden"); });
    document.getElementById("handicapConfigArea").classList.add("hidden");

    document.getElementById("btnCount2").querySelector("input").checked = true;
  } else {
    document.getElementById("setupMainTitle").innerText = "カスタム対戦";
    document.getElementById("setupSubTitle").innerText = "CUSTOM MATCH SETUP";

    customOnlyElements.forEach(el => { if (el) el.classList.remove("hidden"); });
    handleHandicapToggle();
    handleBurstToggle();
    updateMatchTargetSliderLabel();
  }

  handlePlayerCountChange();
  syncCheckboxChips();
  syncThrowChips();
  setAllOpenMarksBulk(2);

  switchScreen("setupScreen");
}

function backToTopMenu() { switchScreen("topMenuScreen"); }
function backToTopMenuFromWinner() { document.getElementById("winnerModal").classList.add("hidden"); backToTopMenu(); }

/* ---- ゲーム初期化 ---- */
function startGame() {
  players[0].name = document.getElementById("playerAInput").value.trim() || "PLAYER A";
  players[1].name = document.getElementById("playerBInput").value.trim() || "PLAYER B";
  players[2].name = document.getElementById("playerCInput").value.trim() || "PLAYER C";
  players[3].name = document.getElementById("playerDInput").value.trim() || "PLAYER D";

  cfg.handicapData.scores = {};
  cfg.handicapData.marks = {};

  if (gameMode === 'normal') {
    activeCount = 2;
    cfg.doubleEnabled = true;
    cfg.tripleEnabled = false;
    cfg.throwsPerTurn = 2;
    cfg.burstEnabled = false;
    targetSetsNeeded = 1;
    nums.forEach(n => { cfg.openMarks[n] = 2; });
  } else {
    activeCount = parseInt(document.querySelector("input[name='playerCount']:checked").value);
    cfg.doubleEnabled = document.getElementById("chkDouble").checked;
    cfg.tripleEnabled = document.getElementById("chkTriple").checked;
    cfg.throwsPerTurn = parseInt(document.querySelector("input[name='throwCount']:checked").value);

    cfg.burstEnabled = document.querySelector("input[name='burstSwitch']:checked").value === 'on';
    cfg.burstLimit = parseInt(document.getElementById("burstCountInput").value) || 3;

    const targetVal = parseInt(document.getElementById("matchTargetInput").value);
    targetSetsNeeded = (isNaN(targetVal) || targetVal < 1) ? 1 : targetVal;

    nums.forEach(n => {
      cfg.openMarks[n] = parseInt(document.querySelector(`input[name='sk_${n}']:checked`).value);
    });

    const isHandicapOn = (document.querySelector("input[name='handicapSwitch']:checked").value === 'on');
    if (isHandicapOn) {
      ['A', 'B', 'C', 'D'].forEach(k => {
        const scoreInput = document.getElementById(`handicapScore${k}`);
        cfg.handicapData.scores[k] = scoreInput ? (parseInt(scoreInput.value) || 0) : 0;

        cfg.handicapData.marks[k] = {};
        nums.forEach(n => {
          const markInput = document.getElementById(`handicapMark${k}_${n}`);
          cfg.handicapData.marks[k][n] = markInput ? (parseInt(markInput.value) || 0) : 0;
        });
      });
    }
  }

  matchHistory = [];
  playerRotationOrder = [];
  for (let i = 0; i < activeCount; i++) playerRotationOrder.push(i);

  players.forEach(p => p.setsWon = 0);

  initNewSet(playerRotationOrder);

  buildScoreboardUI();
  buildIntegratedBoardUI();
  updateUI();

  switchScreen("gameScreen");

  document.getElementById("btnDouble").style.display = cfg.doubleEnabled ? "" : "none";
  document.getElementById("btnTriple").style.display = cfg.tripleEnabled ? "" : "none";

  const rowContainer = document.querySelector(".block-buttons-row");
  if (!cfg.doubleEnabled && !cfg.tripleEnabled) rowContainer.style.gridTemplateColumns = "1fr";
  else if (cfg.doubleEnabled && cfg.tripleEnabled) rowContainer.style.gridTemplateColumns = "1fr 1fr 1fr";
  else rowContainer.style.gridTemplateColumns = "1fr 1fr";
}

function initNewSet(order) {
  turn = 1;
  playerRotationOrder = [...order];
  currentPlayerIndex = 0;
  throwNum = 1;

  history = [];
  statHistory = [];
  statFreezeIndex = null;
  initThrowRecordsData();

  players.forEach(p => {
    p.score = 0; p.totalMarks = 0; p.throws = 0; p.currentMiss = 0; p.maxMiss = 0; p.isDisqualified = false;
    nums.forEach(n => p.marks[n] = 0);
  });

  if (gameMode === 'custom' && Object.keys(cfg.handicapData.scores).length > 0) {
    for (let i = 0; i < activeCount; i++) {
      const p = players[playerRotationOrder[i]];
      p.score = cfg.handicapData.scores[p.key] || 0;
      nums.forEach(n => {
        const initMark = cfg.handicapData.marks[p.key] ? (cfg.handicapData.marks[p.key][n] || 0) : 0;
        const boundedMark = Math.min(cfg.openMarks[n], initMark);
        p.marks[n] = boundedMark;
        p.totalMarks += boundedMark;
      });
    }
  }

  resetSelections();
}

function buildScoreboardUI() {
  const container = document.getElementById("gameScoreboard");
  container.innerHTML = "";
  container.style.gridTemplateColumns = "1fr 1fr";

  playerRotationOrder.forEach(pIdx => {
    const p = players[pIdx];
    const box = document.createElement("div");
    box.className = `score-box ${p.scoreClass}`;
    box.id = `scoreBox_${p.id}`;

    box.innerHTML = `
      <div class="score-main-content">
        <div class="score-name" id="scoreName_${p.id}">${p.name}</div>
        <div class="score-value" id="scoreVal_${p.id}">0</div>
        <div class="dot-container" id="scoreDots_${p.id}"></div>
      </div>
      <div class="burst-indicator-lane" id="burstLane_${p.id}"></div>
    `;
    container.appendChild(box);
  });
}

/* ---- ボードUI生成 ---- */
function buildIntegratedBoardUI() {
  const board = document.getElementById("integratedBoard");
  board.innerHTML = "";

  nums.forEach(num => {
    const row = document.createElement("div");
    row.className = "skittle-row-btn";
    row.id = `skRow_${num}`;
    row.onclick = () => handleSkittleRowClick(num);

    if (activeCount === 2) {
      row.style.gridTemplateColumns = "60px 1fr 60px";
      row.innerHTML = `
        <div class="mini-mark side-lane" id="skMark_${playerRotationOrder[0]}_${num}">―</div>
        <div class="center-num-btn" id="skCenter_${num}">${num}</div>
        <div class="mini-mark side-lane" id="skMark_${playerRotationOrder[1]}_${num}">―</div>
      `;
    } else if (activeCount === 3) {
      row.style.gridTemplateColumns = "50px 50px 1fr 50px";
      row.innerHTML = `
        <div class="mini-mark side-lane" id="skMark_${playerRotationOrder[0]}_${num}">―</div>
        <div class="mini-mark side-lane" id="skMark_${playerRotationOrder[1]}_${num}">―</div>
        <div class="center-num-btn" id="skCenter_${num}">${num}</div>
        <div class="mini-mark side-lane" id="skMark_${playerRotationOrder[2]}_${num}">―</div>
      `;
    } else if (activeCount === 4) {
      row.style.gridTemplateColumns = "45px 45px 1fr 45px 45px";
      row.innerHTML = `
        <div class="mini-mark side-lane" id="skMark_${playerRotationOrder[0]}_${num}">―</div>
        <div class="mini-mark side-lane" id="skMark_${playerRotationOrder[1]}_${num}">―</div>
        <div class="center-num-btn" id="skCenter_${num}">${num}</div>
        <div class="mini-mark side-lane" id="skMark_${playerRotationOrder[2]}_${num}">―</div>
        <div class="mini-mark side-lane" id="skMark_${playerRotationOrder[3]}_${num}">―</div>
      `;
    }

    board.appendChild(row);
  });
}

function handleSkittleRowClick(num) {
  if (selectedMulti.includes(num)) {
    selectedMulti = selectedMulti.filter(x => x !== num);
    if (selectedSingle === num) {
      selectedSingle = selectedMulti.length > 0 ? selectedMulti[selectedMulti.length - 1] : null;
    }
  } else {
    selectedMulti.push(num);
    selectedSingle = num;
  }
  syncBoardSelectionUI();
}

function syncBoardSelectionUI() {
  nums.forEach(num => {
    const row = document.getElementById(`skRow_${num}`);
    if (row) row.classList.toggle("selected", selectedMulti.includes(num));
  });
}

function selectMarkType(type) {
  const activePlayer = players[playerRotationOrder[currentPlayerIndex]];

  if (selectedMulti.length > 1) {
    showToast("単独ヒット(SINGLE)はスキットルを1本だけ選んでください。複数本まとめる場合はMULTI確定を押してください。");
    return;
  }
  if (selectedSingle === null || selectedMulti.length === 0) {
    showToast("先にボード上でスキットル番号を1本タップして選択してください。");
    return;
  }

  selectedMarkType = type;
  const markVal = markTypeValue(type);
  openConfirm(
    `${activePlayer.name}\n\nSINGLE HIT\n\n対象: ${selectedSingle}番\n${markTypeLabel(type)}（${markVal} MARK${markVal > 1 ? 'S' : ''}）\n\nで確定しますか?`,
    () => processSingle(selectedSingle, type)
  );
}

/* ---- モーダル / トースト ---- */
function openConfirm(text, callback) {
  pendingAction = callback;
  document.getElementById("confirmText").innerText = text;
  document.getElementById("confirmModal").classList.remove("hidden");

  const confirmBtn = document.querySelector("#confirmModal .primary");
  if (confirmBtn) {
    confirmBtn.classList.toggle("mode-custom", gameMode === 'custom');
    confirmBtn.classList.toggle("mode-normal", gameMode !== 'custom');
  }
}
function closeConfirm() {
  document.getElementById("confirmModal").classList.add("hidden");
  resetSelections();
}
function executePending() { document.getElementById("confirmModal").classList.add("hidden"); if (pendingAction) pendingAction(); }

function showInfoModal(title, bodyHtml) {
  document.getElementById('infoModalTitle').innerText = title;
  document.getElementById('infoModalBody').innerHTML = bodyHtml;
  document.getElementById('infoModal').classList.remove('hidden');
}
function closeInfoModal() { document.getElementById('infoModal').classList.add('hidden'); }

let toastTimer = null;
function showToast(message) {
  const el = document.getElementById("toastBanner");
  if (!el) { alert(message); return; }
  el.innerText = message;
  el.classList.remove("hidden");
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove("show"); }, 2400);
}

/* ---- 入力処理(MULTI / MISS) ---- */
function confirmMulti() {
  const activePlayer = players[playerRotationOrder[currentPlayerIndex]];
  if (selectedMulti.length === 0) {
    showToast("ボード上で当てたスキットルを2本以上タップして選択してください。");
    return;
  }
  if (selectedMulti.length === 1) {
    showToast("複数本ヒット(MULTI HIT)はスキットルを2本以上選択してください。1本のみ的中の場合はSINGLE側の各マーク数ボタンを押してください。");
    return;
  }

  openConfirm(
    `${activePlayer.name}\n\nMULTI HIT\n\n選択数: ${selectedMulti.length}本 (${selectedMulti.sort((a, b) => a - b).join(", ")})\n\nで確定しますか?`,
    () => processMulti([...selectedMulti])
  );
}

function quickMiss() {
  const pIdx = playerRotationOrder[currentPlayerIndex];
  const activePlayer = players[pIdx];
  openConfirm(
    `${activePlayer.name}\n\nMISS / 0 MARKS\n\nで確定しますか?`,
    () => {
      saveHistory();
      activePlayer.throws++; activePlayer.currentMiss++;
      if (activePlayer.currentMiss > activePlayer.maxMiss) activePlayer.maxMiss = activePlayer.currentMiss;

      throwRecords[turn][pIdx][throwNum] = { markStr: 'M', gain: 0, total: activePlayer.score };
      playSE('miss');
      recordStatSnapshot();

      if (cfg.burstEnabled && activePlayer.currentMiss >= cfg.burstLimit) {
        activePlayer.isDisqualified = true;

        if (activeCount === 2) {
          triggerTurnEndAnimation(() => {
            let opponentIdx = playerRotationOrder.find(idx => idx !== pIdx);
            resolveSetEnd(opponentIdx, "相手の連続ミス失格によるセット終了");
          });
          return;
        }
      }

      nextThrow();
    }
  );
}

/* ---- クリケットルール判定ヘルパー ---- */
function markTypeValue(type) { return type === "double" ? 2 : type === "triple" ? 3 : 1; }
function markTypeLabel(type) { return type.toUpperCase(); }
function openThreshold(num) { return cfg.openMarks[num] || 2; }
function isOpen(playerObj, num) { return playerObj.marks[num] >= openThreshold(num); }

function isClosedGlobally(num) {
  let activeSurvivalCount = 0;
  for (let i = 0; i < activeCount; i++) {
    let p = players[playerRotationOrder[i]];
    if (p.isDisqualified) continue;
    activeSurvivalCount++;
    if (!isOpen(p, num)) return false;
  }
  return activeSurvivalCount > 0;
}

function hasUnopenedOpponent(myIdx, num) {
  for (let i = 0; i < activeCount; i++) {
    let pIdx = playerRotationOrder[i];
    if (pIdx === myIdx) continue;
    let p = players[pIdx];
    if (p.isDisqualified) continue;
    if (!isOpen(p, num)) return true;
  }
  return false;
}

function isSpecialRule() {
  return turn === 1 && currentPlayerIndex === 0;
}

/* ---- SINGLE HIT処理 ---- */
function processSingle(num, type) {
  saveHistory();

  const pIdx = playerRotationOrder[currentPlayerIndex];
  const p = players[pIdx];
  const value = markTypeValue(type);
  const req = openThreshold(num);

  p.throws++;
  let seType = 'mark';
  let scoreGain = 0;
  let markDisplayStr = (type === 'single') ? '/' : (type === 'double' ? 'X' : '⊗');

  p.currentMiss = 0;

  if (isSpecialRule()) {
    p.score += value;
    throwRecords[turn][pIdx][throwNum] = { markStr: markDisplayStr, gain: value, total: p.score };
    playMarkRepeated(value); recordStatSnapshot(); nextThrow(); return;
  }

  p.totalMarks += value;

  if (isClosedGlobally(num)) {
    throwRecords[turn][pIdx][throwNum] = { markStr: markDisplayStr, gain: 0, total: p.score };
    playMarkRepeated(value); recordStatSnapshot(); nextThrow(); return;
  }

  let remain = value;

  if (!isOpen(p, num)) {
    const need = req - p.marks[num];
    if (remain >= need) {
      p.marks[num] = req; remain -= need; seType = 'open';
      if (remain > 0 && hasUnopenedOpponent(pIdx, num)) {
        scoreGain = num * remain;
      }
    } else {
      p.marks[num] += remain;
    }
  } else {
    if (hasUnopenedOpponent(pIdx, num)) scoreGain = num * remain;
  }

  if (isClosedGlobally(num)) seType = 'close';

  p.score += scoreGain;
  throwRecords[turn][pIdx][throwNum] = { markStr: markDisplayStr, gain: scoreGain, total: p.score };

  playMarkRepeated(value);
  if (seType === 'open' || seType === 'close') playSE(seType);
  recordStatSnapshot(); nextThrow();
}

/* ---- MULTI HIT処理 ---- */
function processMulti(list) {
  saveHistory();

  const pIdx = playerRotationOrder[currentPlayerIndex];
  const p = players[pIdx];
  p.throws++;

  p.currentMiss = 0;

  if (isSpecialRule()) {
    p.score += list.length;
    throwRecords[turn][pIdx][throwNum] = { markStr: `M${list.length}`, gain: list.length, total: p.score };
    playSE('multi'); recordStatSnapshot(); nextThrow(); return;
  }

  p.totalMarks += list.length;
  let scoreGain = 0;
  let openedAny = false;

  list.forEach(num => {
    if (isClosedGlobally(num)) return;
    if (isOpen(p, num)) {
      if (hasUnopenedOpponent(pIdx, num)) scoreGain += 1;
      return;
    }

    p.marks[num] += 1;
    if (isOpen(p, num)) {
      p.marks[num] = openThreshold(num); openedAny = true;
    }
  });

  p.score += scoreGain;
  throwRecords[turn][pIdx][throwNum] = { markStr: `M${list.length}`, gain: scoreGain, total: p.score };

  playSE('multi');
  if (openedAny) {
    let closedAny = list.some(num => isClosedGlobally(num));
    playSE(closedAny ? 'close' : 'open');
  }

  recordStatSnapshot(); nextThrow();
}

/* ---- ターン進行 ---- */
function nextThrow() {
  if (checkColdWinSilent()) {
    triggerTurnEndAnimation(() => { checkColdWin(); });
    return;
  }

  let allDQ = playerRotationOrder.every(idx => players[idx].isDisqualified);
  if (allDQ) {
    triggerTurnEndAnimation(() => { resolveSetEnd(null, "全員失格によるサスペンス終了"); });
    return;
  }

  if (throwNum >= cfg.throwsPerTurn) {
    triggerTurnEndAnimation(() => {
      throwNum = 1;

      let loopCount = 0;
      do {
        if (currentPlayerIndex >= activeCount - 1) {
          currentPlayerIndex = 0; turn++;
          if (turn > 12) { finishGame(); return; }
        } else {
          currentPlayerIndex++;
        }
        loopCount++;
      } while (players[playerRotationOrder[currentPlayerIndex]].isDisqualified && loopCount < activeCount + 2);

      if (players[playerRotationOrder[currentPlayerIndex]].isDisqualified) {
        finishGame(); return;
      }

      resetSelections(); updateUI();
    });
  } else {
    throwNum++;
    if (players[playerRotationOrder[currentPlayerIndex]].isDisqualified) {
      throwNum = cfg.throwsPerTurn;
      nextThrow();
    } else {
      resetSelections(); updateUI();
    }
  }
}

function triggerTurnEndAnimation(callback) {
  const overlay = document.getElementById("turnEndOverlay");
  const nameEl = document.getElementById("howanPlayerName");
  const rowEl = document.getElementById("howanSymbolsRow");

  const pIdx = playerRotationOrder[currentPlayerIndex];
  const activePlayer = players[pIdx];
  const pColorClass = activePlayer.colorClass;

  nameEl.innerText = `${activePlayer.name} TURN END`;
  rowEl.innerHTML = "";

  for (let th = 1; th <= cfg.throwsPerTurn; th++) {
    let r = throwRecords[turn][pIdx][th];
    if (!r) continue;

    let displayHTML = "";
    let mStr = r.markStr;

    if (mStr === '/') {
      displayHTML = `<span class="c-mark-css slash ${pColorClass}"></span>`;
    } else if (mStr === 'X') {
      displayHTML = `<span class="c-mark-css cross ${pColorClass}"></span>`;
    } else if (mStr === '⊗') {
      displayHTML = `<span class="c-mark-css circlecross ${pColorClass}"><span class="c-mark-css circlecross-circle"></span></span>`;
    } else if (mStr.startsWith('M') && mStr !== 'M') {
      displayHTML = `<span class="m-multi-circle ${pColorClass}">${mStr.replace('M', '')}</span>`;
    } else if (mStr === 'M' || mStr === '-') {
      displayHTML = `<span class="miss-color">-</span>`;
    }
    rowEl.innerHTML += displayHTML;
  }

  overlay.classList.remove("hidden");
  setTimeout(() => { overlay.classList.add("hidden"); callback(); }, 1600);
}

function checkColdWinSilent() {
  const pIdx = playerRotationOrder[currentPlayerIndex];
  const p = players[pIdx];
  if (p.isDisqualified) return false;
  if (!nums.every(n => isOpen(p, n))) return false;

  for (let i = 0; i < activeCount; i++) {
    let targetP = players[playerRotationOrder[i]];
    if (targetP.isDisqualified) continue;
    if (targetP.score > p.score) return false;
  }
  return true;
}

function resetSelections() {
  selectedSingle = null; selectedMulti = []; selectedMarkType = null;
  syncBoardSelectionUI();
}

/* ---- 画面描画 ---- */
function getMarkStatusMulti(pObj, num) {
  const req = openThreshold(num);
  const suffix = pObj.key.toLowerCase();
  const mine = pObj.marks[num] || 0;

  if (pObj.isDisqualified) return ["―", "flat"];
  if (isClosedGlobally(num)) return ["CLOSED", "closed has-circlecross"];
  if (isOpen(pObj, num)) return ["OPEN", `open-${suffix} has-cross`];
  if (mine > 0) return [`${mine}/${req}`, `${mine === 2 ? 'two' : 'one'}-${suffix} has-slash`];
  return ["―", "flat"];
}

function updateDotsUI() {
  playerRotationOrder.forEach(pIdx => {
    const p = players[pIdx];
    const dotContainer = document.getElementById(`scoreDots_${p.id}`);
    if (!dotContainer) return;

    if (gameMode !== 'custom' || targetSetsNeeded <= 1) { dotContainer.innerHTML = ""; return; }

    let html = "";
    for (let i = 1; i <= targetSetsNeeded; i++) {
      html += `<div class="set-dot ${p.setsWon >= i ? 'active' : ''}"></div>`;
    }
    dotContainer.innerHTML = html;
  });
}

function updateUI() {
  document.getElementById("turnText").innerText = turn;
  const pName = document.getElementById("playerText");
  const tText = document.getElementById("throwText");

  const activePlayer = players[playerRotationOrder[currentPlayerIndex]];
  pName.innerText = activePlayer.isDisqualified ? "---" : activePlayer.name;
  tText.innerText = `${throwNum}/${cfg.throwsPerTurn}`;

  pName.className = tText.className = activePlayer.colorClass;

  playerRotationOrder.forEach(pIdx => {
    const p = players[pIdx];
    const sVal = document.getElementById(`scoreVal_${p.id}`);

    if (sVal) sVal.innerText = p.isDisqualified ? "失格" : p.score;

    const sName = document.getElementById(`scoreName_${p.id}`);
    if (sName) sName.innerHTML = p.isDisqualified ? `<span class="dq-tag">DQ</span>${p.name}` : p.name;

    const box = document.getElementById(`scoreBox_${p.id}`);
    if (box) {
      if (p.isDisqualified) {
        box.className = `score-box disqualified-score`;
      } else {
        const isCurrent = (p.id === activePlayer.id);
        box.className = `score-box ${p.scoreClass} ${isCurrent ? p.activeClass : 'inactive-turn'}`;
      }
    }

    const lane = document.getElementById(`burstLane_${p.id}`);
    if (lane) {
      if (cfg.burstEnabled && !p.isDisqualified) {
        lane.style.display = "flex";
        let laneHTML = "";
        for (let b = 1; b <= cfg.burstLimit; b++) {
          let isMissed = (p.currentMiss >= b);
          laneHTML += `<div class="burst-dot ${isMissed ? 'hit-miss' : ''}">●</div>`;
        }
        lane.innerHTML = laneHTML;
      } else {
        lane.innerHTML = "";
        lane.style.display = "none";
      }
    }
  });

  const pBox = document.getElementById("statusBoxPlayer");
  if (pBox) {
    if (activePlayer.isDisqualified) pBox.classList.add("disqualified-box");
    else pBox.classList.remove("disqualified-box");
  }

  updateDotsUI();
  document.getElementById("specialNotice").classList.toggle("hidden", !isSpecialRule());

  nums.forEach(num => {
    playerRotationOrder.forEach(pIdx => {
      const p = players[pIdx];
      const mData = getMarkStatusMulti(p, num);
      const markEl = document.getElementById(`skMark_${p.id}_${num}`);
      if (markEl) {
        markEl.innerText = mData[0];
        markEl.className = `mini-mark side-lane ${mData[1]}`;
      }
    });

    const centerEl = document.getElementById(`skCenter_${num}`);
    if (centerEl) {
      centerEl.className = `center-num-btn ${isClosedGlobally(num) ? 'closed-num' : ''}`;
    }
  });

  syncBoardSelectionUI();
}

/* ---- 勝敗判定 / セット管理 ---- */
function checkColdWin() {
  const pIdx = playerRotationOrder[currentPlayerIndex];
  const p = players[pIdx];
  if (p.isDisqualified) return false;

  if (nums.every(n => isOpen(p, n))) {
    let scoreWin = true;
    for (let i = 0; i < activeCount; i++) {
      let targetP = players[playerRotationOrder[i]];
      if (targetP.isDisqualified) continue;
      if (targetP.score > p.score) scoreWin = false;
    }
    if (scoreWin) {
      resolveSetEnd(pIdx, "点数キープのまま全オープン達成");
      return true;
    }
  }
  return false;
}

function finishGame() {
  let maxScore = -9999;
  let candidates = [];

  for (let i = 0; i < activeCount; i++) {
    let pIdx = playerRotationOrder[i];
    if (players[pIdx].isDisqualified) continue;

    if (players[pIdx].score > maxScore) {
      maxScore = players[pIdx].score;
      candidates = [pIdx];
    } else if (players[pIdx].score === maxScore) {
      candidates.push(pIdx);
    }
  }

  if (candidates.length === 1) {
    resolveSetEnd(candidates[0], "12ターン終了時最高得点");
  } else if (candidates.length > 1) {
    let maxKeep = -1;
    let finalWinnerIdx = candidates[0];
    let absoluteDraw = true;

    candidates.forEach(pIdx => {
      let keepCount = countOpenKeep(players[pIdx]);
      if (keepCount > maxKeep) {
        maxKeep = keepCount;
        finalWinnerIdx = pIdx;
        absoluteDraw = false;
      } else if (keepCount === maxKeep) {
        absoluteDraw = true;
      }
    });

    if (!absoluteDraw) {
      resolveSetEnd(finalWinnerIdx, "同点タイブレーク：残存オープン数優勢");
    } else {
      resolveSetEnd(null, "スコア・残存オープン数ともに完全同点につき引き分け");
    }
  } else {
    resolveSetEnd(null, "生存プレイヤー不在（全員バースト失格）");
  }
}

function countOpenKeep(playerObj) {
  return nums.filter(n => isOpen(playerObj, n) && !isClosedGlobally(n)).length;
}

function resolveSetEnd(winnerIdx, reason) {
  let setNum = matchHistory.length + 1;
  let logText = "";

  if (winnerIdx === null) {
    let scoresStr = playerRotationOrder.map(pIdx => `${players[pIdx].name}:${players[pIdx].isDisqualified ? '失格' : players[pIdx].score}`).join(" / ");
    logText = `第${setNum}セット: 引き分け (${scoresStr})`;
  } else {
    players[winnerIdx].setsWon++;
    let scoresStr = playerRotationOrder.map(pIdx => `${players[pIdx].name}:${players[pIdx].isDisqualified ? '失格' : players[pIdx].score}`).join(" / ");
    logText = `第${setNum}セット: ${players[winnerIdx].name} 勝利 (${scoresStr})`;
  }
  matchHistory.push(logText);

  let matchOver = false;
  for (let i = 0; i < activeCount; i++) {
    if (players[playerRotationOrder[i]].setsWon >= targetSetsNeeded) {
      matchOver = true;
    }
  }

  if (gameMode === 'custom' && targetSetsNeeded > 1 && !matchOver) {
    showNextSetModal(winnerIdx);
  } else {
    showFinalMatchWinner(winnerIdx);
  }
}

function showNextSetModal(winnerIdx) {
  const modal = document.getElementById("nextSetModal");
  const winTxt = document.getElementById("nextSetWinnerText");

  if (winnerIdx === null) {
    winTxt.innerHTML = `<span class="winner-eyebrow">SET DRAW</span><span class="winner-name">引き分け</span>`; winTxt.style.color = "var(--txt2)";
  } else {
    winTxt.innerHTML = `<span class="winner-eyebrow">SET WIN</span><span class="winner-name">${players[winnerIdx].name}</span>`;
    if (winnerIdx === 0) winTxt.style.color = "var(--ca)";
    else if (winnerIdx === 1) winTxt.style.color = "var(--cb)";
    else if (winnerIdx === 2) winTxt.style.color = "var(--cc)";
    else winTxt.style.color = "var(--cd)";
  }

  document.getElementById("nextSetScoreText").innerText = playerRotationOrder.map(pIdx => players[pIdx].isDisqualified ? '失格' : players[pIdx].score).join("  -  ");
  document.getElementById("setResultTableArea").innerHTML = createStatsHTML();

  buildOrderConfigUI();

  modal.classList.remove("hidden");
  modal.querySelector('.confirm-box').scrollTop = 0;
}

function buildOrderConfigUI() {
  const container = document.getElementById("orderConfigContainer");
  container.innerHTML = "";

  for (let i = 0; i < activeCount; i++) {
    const row = document.createElement("div");
    row.className = "order-config-row";

    let options = "";
    for (let j = 1; j <= activeCount; j++) {
      options += `<option value="${j}" ${j === (i + 1) ? 'selected' : ''}>${j}番目</option>`;
    }

    row.innerHTML = `
      <span class="order-config-name">${players[i].name}</span>
      <select id="nextOrderSelect_${i}" class="order-config-select">
        ${options}
      </select>
    `;
    container.appendChild(row);
  }
}

function validateAndExecuteNextSet() {
  let chosenOrders = [];
  let uniqueCheck = new Set();

  for (let i = 0; i < activeCount; i++) {
    let val = parseInt(document.getElementById(`nextOrderSelect_${i}`).value);
    chosenOrders.push({ id: i, order: val });
    uniqueCheck.add(val);
  }

  if (uniqueCheck.size !== activeCount) {
    showToast("エラー: 投げ順（番目）に重複があります。全員個別に異なる投げ順を設定してください。");
    return;
  }

  chosenOrders.sort((a, b) => a.order - b.order);
  let nextOrderArray = chosenOrders.map(item => item.id);

  document.getElementById("nextSetModal").classList.add("hidden");
  initNewSet(nextOrderArray);
  buildScoreboardUI();
  buildIntegratedBoardUI();
  updateUI();
}

function showFinalMatchWinner(lastSetWinnerIdx) {
  const titleEl = document.getElementById("winnerText");
  const modal = document.getElementById("winnerModal");
  let winnerNameForHistory = null;

  if (gameMode === 'custom' && targetSetsNeeded > 1) {
    let maxSets = -1;
    let winners = [];
    for (let i = 0; i < activeCount; i++) {
      let pIdx = playerRotationOrder[i];
      if (players[pIdx].setsWon > maxSets) {
        maxSets = players[pIdx].setsWon;
        winners = [pIdx];
      } else if (players[pIdx].setsWon === maxSets) {
        winners.push(pIdx);
      }
    }

    if (winners.length === 1) {
      winnerNameForHistory = players[winners[0]].name;
      titleEl.innerHTML = `<span class="winner-eyebrow">MATCH WINNER</span><span class="winner-name">${players[winners[0]].name}</span>`;
    } else {
      titleEl.innerHTML = `<span class="winner-eyebrow">MATCH DRAW</span><span class="winner-name" style="font-size:18px;">セット完全引き分け</span>`;
    }
    document.getElementById("modalUndoBtn").classList.add("hidden");
  } else {
    winnerNameForHistory = lastSetWinnerIdx === null ? null : players[lastSetWinnerIdx].name;
    titleEl.innerHTML = (lastSetWinnerIdx === null)
      ? `<span class="winner-eyebrow">DRAW</span>`
      : `<span class="winner-eyebrow">WINNER</span><span class="winner-name">${players[lastSetWinnerIdx].name}</span>`;
    document.getElementById("modalUndoBtn").classList.remove("hidden");
  }

  document.getElementById("statsArea").innerHTML = createStatsHTML();
  modal.classList.remove("hidden"); modal.querySelector('.confirm-box').scrollTop = 0;

  saveMatchToHistory(winnerNameForHistory);
}

/* ---- 統計 / 履歴テーブル ----
   スタッツ(平均マーク数/ターンなど)は「いずれかのプレイヤーが7本中6本を
   オープン or クローズ済みにした時点」までの投擲のみを集計対象とする
   （DartsLive風：残り1本の終盤チェイス局面を除外して精度を上げる）。
   ちょうど6本の状態を経由せず一気に7本へ達した場合（マルチヒットで試合が
   終了する場合など）は、その「6本」の瞬間が存在しないため凍結せず、
   常に全投擲を集計対象とする。そのため判定は >=6 ではなく ===6 とする。 */
function recordStatSnapshot() {
  statHistory.push(JSON.parse(JSON.stringify(players)));
  let isFrozenCandidate = playerRotationOrder.some(pIdx => {
    return nums.filter(n => isOpen(players[pIdx], n)).length === 6;
  });
  if (isFrozenCandidate && statFreezeIndex === null) {
    statFreezeIndex = statHistory.length - 1;
  }
}

function getStatsPlayers() {
  return (statFreezeIndex !== null && statHistory[statFreezeIndex]) ? statHistory[statFreezeIndex] : players;
}

function generateScoreTableHTML() {
  const maxThrow = cfg.throwsPerTurn;
  let headerCols = `<th class="turn-col">T</th>`;

  playerRotationOrder.forEach(pIdx => {
    const p = players[pIdx];
    let pColor = `var(--ca)`;
    if (pIdx === 1) pColor = `var(--cb)`;
    if (pIdx === 2) pColor = `var(--cc)`;
    if (pIdx === 3) pColor = `var(--cd)`;

    for (let i = 1; i <= maxThrow; i++) {
      headerCols += `<th style="color:${pColor}; min-width:45px;">${p.name.substring(0, 3)} ${i}</th>`;
    }
  });

  let tableRows = "";
  for (let t = 1; t <= 12; t++) {
    let rowCells = `<td class="turn-col">${t}</td>`;
    playerRotationOrder.forEach(pIdx => {
      for (let th = 1; th <= maxThrow; th++) {
        let rec = throwRecords[t] && throwRecords[t][pIdx] ? throwRecords[t][pIdx][th] : null;
        rowCells += createCellMarkup(rec, pIdx);
      }
    });
    tableRows += `<tr>${rowCells}</tr>`;
  }

  return `<div class="history-table-wrapper"><table class="history-table"><thead><tr>${headerCols}</tr></thead><tbody>${tableRows}</tbody></table></div>`;
}

function createCellMarkup(rec, playerIdx) {
  if (!rec || rec.markStr === '-') return `<td><div class="history-cell-box"><span style="color:var(--txt2); opacity:0.2;">-</span></div></td>`;

  const activePlayer = players[playerIdx];
  const pColorClass = activePlayer.colorClass;
  let displayHTML = "";
  let mStr = rec.markStr;

  if (mStr === '/') displayHTML = `<span class="c-mark-css slash ${pColorClass}"></span>`;
  else if (mStr === 'X') displayHTML = `<span class="c-mark-css cross ${pColorClass}"></span>`;
  else if (mStr === '⊗') displayHTML = `<span class="c-mark-css circlecross ${pColorClass}"><span class="c-mark-css circlecross-circle"></span></span>`;
  else if (mStr.startsWith('M') && mStr !== 'M') displayHTML = `<span class="m-multi-circle ${pColorClass}">${mStr.replace('M', '')}</span>`;
  else if (mStr === 'M') displayHTML = `<span class="miss-color">-</span>`;

  let scoreText = rec.gain + "/" + (rec.total === "失格" ? "失格" : rec.total);
  if (typeof rec.total === "string" && rec.total.includes("失格")) scoreText = "失格";

  return `<td><div class="history-cell-box">${displayHTML}<span class="cell-score">${scoreText}</span></div></td>`;
}

function createStatsHTML() {
  const s = getStatsPlayers(), tp = cfg.throwsPerTurn;

  let historySection = "";
  if (matchHistory.length > 0) {
    historySection = `<div class="stats-sub-title">対戦履歴</div>`;
    matchHistory.forEach(logLine => { historySection += `<div class="small stats-history-line">${logLine}</div>`; });
  }

  let statLinesHTML = "";
  playerRotationOrder.forEach(pIdx => {
    const p = s[pIdx];
    const avg = p.throws === 0 ? 0 : (p.totalMarks / (p.throws / tp)).toFixed(2);
    statLinesHTML += `
      <div class="stat-line">
        <strong>${p.name}</strong> ${p.isDisqualified ? '<span class="dq-badge">[失格]</span>' : ''}<br>
        ${(gameMode === 'custom' && targetSetsNeeded > 1) ? `獲得セット数: <strong>${p.setsWon}</strong><br>` : ''}
        平均マーク数 / ターン: <strong>${avg}</strong><br>
        最大連続MISS: <strong>${p.maxMiss}</strong>
      </div>
    `;
  });

  return `
    <div class="stats">
      <div class="stats-sub-title">SCORE HISTORY (スコア推移)</div>
      ${generateScoreTableHTML()}

      <div class="stats-sub-title" style="margin-top:16px;">MATCH STATS (スタッツ)</div>
      ${statLinesHTML}
      ${historySection}
    </div>
  `;
}

/* ---- 対戦履歴の永続保存（localStorage） ----
   matchHistory（セット単位のログ、メモリ内のみ）とは別物。
   こちらは試合(マッチ)が終了するたびに1件保存し、アプリを閉じても残る。
   結果画面と同じスコア表・スタッツを後から見られるよう、throwRecordsや
   フリーズ済みスタッツのスナップショットも一緒に保存する。 */
const MATCH_LOG_KEY = 'molkky_match_log';
const MATCH_LOG_MAX = 50;

/* 履歴の削除は誤操作防止のための簡易パスワードのみ（本格的な認証ではない）。
   変更したい場合はこの定数を書き換える。 */
const HISTORY_ADMIN_PASSWORD = '0000';

function checkAdminPassword() {
  const input = prompt("管理者パスワードを入力してください(削除の確認用)");
  if (input === null) return false;
  if (input !== HISTORY_ADMIN_PASSWORD) { showToast("パスワードが違います。"); return false; }
  return true;
}

function loadMatchLog() {
  try {
    const raw = localStorage.getItem(MATCH_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveMatchToHistory(winnerName) {
  const log = loadMatchLog();

  const record = {
    ts: Date.now(),
    mode: gameMode,
    targetSetsNeeded: targetSetsNeeded,
    throwsPerTurn: cfg.throwsPerTurn,
    winnerName: winnerName,
    playerRotationOrder: [...playerRotationOrder],
    matchHistory: [...matchHistory],
    players: players.map(p => ({
      key: p.key,
      name: p.name,
      score: p.score,
      setsWon: p.setsWon,
      isDisqualified: p.isDisqualified,
      colorClass: p.colorClass
    })),
    statsSnapshot: getStatsPlayers().map(p => ({
      name: p.name,
      totalMarks: p.totalMarks,
      throws: p.throws,
      maxMiss: p.maxMiss,
      setsWon: p.setsWon,
      isDisqualified: p.isDisqualified
    })),
    throwRecords: JSON.parse(JSON.stringify(throwRecords))
  };

  log.unshift(record);
  if (log.length > MATCH_LOG_MAX) log.length = MATCH_LOG_MAX;

  localStorage.setItem(MATCH_LOG_KEY, JSON.stringify(log));
  renderHistoryList();
}

function formatHistoryDate(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderHistoryList() {
  const container = document.getElementById("historyListContainer");
  if (!container) return;

  const log = loadMatchLog();

  if (log.length === 0) {
    container.innerHTML = `<div class="small history-empty">まだ対戦履歴がありません。試合を1試合終えると、ここに記録が残ります。</div>`;
    return;
  }

  container.innerHTML = log.map((record, idx) => {
    const playersLine = record.playerRotationOrder.map(pIdx => {
      const p = record.players[pIdx];
      return `<span class="${p.name === record.winnerName ? 'history-player-win' : ''}">${p.name}: ${p.isDisqualified ? '失格' : p.score}</span>`;
    }).join(' / ');

    const resultLabel = record.winnerName
      ? `${record.winnerName} 勝利`
      : '引き分け';

    const modeLabel = record.mode === 'custom'
      ? (record.targetSetsNeeded > 1 ? `カスタム (${record.targetSetsNeeded}セット先取)` : 'カスタム')
      : 'ノーマル';

    return `
      <div class="history-card" onclick="viewHistoryDetail(${idx})">
        <div class="history-card-top">
          <span class="history-date">${formatHistoryDate(record.ts)}</span>
          <span class="history-mode-tag">${modeLabel}</span>
          <button type="button" class="history-delete-btn" onclick="event.stopPropagation(); deleteHistoryEntry(${idx})">✕</button>
        </div>
        <div class="history-result">${resultLabel}</div>
        <div class="history-players">${playersLine}</div>
      </div>
    `;
  }).join('');
}

function deleteHistoryEntry(idx) {
  if (!checkAdminPassword()) return;
  openConfirm("この履歴を削除しますか?", () => {
    const log = loadMatchLog();
    log.splice(idx, 1);
    localStorage.setItem(MATCH_LOG_KEY, JSON.stringify(log));
    renderHistoryList();
  });
}

function confirmClearHistory() {
  if (!checkAdminPassword()) return;
  openConfirm("対戦履歴をすべて削除しますか?\nこの操作は取り消せません。", () => {
    localStorage.removeItem(MATCH_LOG_KEY);
    renderHistoryList();
  });
}

/* ---- 対戦履歴の詳細（結果画面と同じスコア表・スタッツ） ---- */
function buildHistoryCellMarkup(rec, pColorClass) {
  if (!rec || rec.markStr === '-') return `<td><div class="history-cell-box"><span style="color:var(--txt2); opacity:0.2;">-</span></div></td>`;

  let displayHTML = "";
  let mStr = rec.markStr;

  if (mStr === '/') displayHTML = `<span class="c-mark-css slash ${pColorClass}"></span>`;
  else if (mStr === 'X') displayHTML = `<span class="c-mark-css cross ${pColorClass}"></span>`;
  else if (mStr === '⊗') displayHTML = `<span class="c-mark-css circlecross ${pColorClass}"><span class="c-mark-css circlecross-circle"></span></span>`;
  else if (mStr.startsWith('M') && mStr !== 'M') displayHTML = `<span class="m-multi-circle ${pColorClass}">${mStr.replace('M', '')}</span>`;
  else if (mStr === 'M') displayHTML = `<span class="miss-color">-</span>`;

  let scoreText = rec.gain + "/" + (rec.total === "失格" ? "失格" : rec.total);
  if (typeof rec.total === "string" && rec.total.includes("失格")) scoreText = "失格";

  return `<td><div class="history-cell-box">${displayHTML}<span class="cell-score">${scoreText}</span></div></td>`;
}

function buildHistoryScoreTableHTML(record) {
  const maxThrow = record.throwsPerTurn;
  let headerCols = `<th class="turn-col">T</th>`;

  record.playerRotationOrder.forEach(pIdx => {
    const p = record.players[pIdx];
    let pColor = `var(--ca)`;
    if (pIdx === 1) pColor = `var(--cb)`;
    if (pIdx === 2) pColor = `var(--cc)`;
    if (pIdx === 3) pColor = `var(--cd)`;
    for (let i = 1; i <= maxThrow; i++) {
      headerCols += `<th style="color:${pColor}; min-width:45px;">${p.name.substring(0, 3)} ${i}</th>`;
    }
  });

  let tableRows = "";
  for (let t = 1; t <= 12; t++) {
    let rowCells = `<td class="turn-col">${t}</td>`;
    record.playerRotationOrder.forEach(pIdx => {
      for (let th = 1; th <= maxThrow; th++) {
        let rec = record.throwRecords[t] && record.throwRecords[t][pIdx] ? record.throwRecords[t][pIdx][th] : null;
        rowCells += buildHistoryCellMarkup(rec, record.players[pIdx].colorClass);
      }
    });
    tableRows += `<tr>${rowCells}</tr>`;
  }

  return `<div class="history-table-wrapper"><table class="history-table"><thead><tr>${headerCols}</tr></thead><tbody>${tableRows}</tbody></table></div>`;
}

function buildHistoryStatsHTML(record) {
  let statLinesHTML = "";
  record.playerRotationOrder.forEach(pIdx => {
    const p = record.statsSnapshot[pIdx];
    const avg = p.throws === 0 ? 0 : (p.totalMarks / (p.throws / record.throwsPerTurn)).toFixed(2);
    statLinesHTML += `
      <div class="stat-line">
        <strong>${p.name}</strong> ${p.isDisqualified ? '<span class="dq-badge">[失格]</span>' : ''}<br>
        ${(record.mode === 'custom' && record.targetSetsNeeded > 1) ? `獲得セット数: <strong>${p.setsWon}</strong><br>` : ''}
        平均マーク数 / ターン: <strong>${avg}</strong><br>
        最大連続MISS: <strong>${p.maxMiss}</strong>
      </div>
    `;
  });

  let historySection = "";
  if (record.matchHistory && record.matchHistory.length > 0) {
    historySection = `<div class="stats-sub-title">対戦履歴</div>`;
    record.matchHistory.forEach(line => { historySection += `<div class="small stats-history-line">${line}</div>`; });
  }

  return `
    <div class="stats">
      <div class="stats-sub-title">SCORE HISTORY (スコア推移)</div>
      ${buildHistoryScoreTableHTML(record)}

      <div class="stats-sub-title" style="margin-top:16px;">MATCH STATS (スタッツ)</div>
      ${statLinesHTML}
      ${historySection}
    </div>
  `;
}

function viewHistoryDetail(idx) {
  const log = loadMatchLog();
  const record = log[idx];
  if (!record) return;

  const modeLabel = record.mode === 'custom'
    ? (record.targetSetsNeeded > 1 ? `カスタム (${record.targetSetsNeeded}セット先取)` : 'カスタム')
    : 'ノーマル';

  document.getElementById("historyDetailTitle").innerHTML = record.winnerName
    ? `<span class="winner-eyebrow">WINNER</span><span class="winner-name" style="font-size:24px;">${record.winnerName}</span>`
    : `<span class="winner-eyebrow">DRAW</span>`;
  document.getElementById("historyDetailMeta").innerText = `${formatHistoryDate(record.ts)} ・ ${modeLabel}`;
  document.getElementById("historyDetailStats").innerHTML = buildHistoryStatsHTML(record);
  document.getElementById("historyDetailModal").classList.remove("hidden");
}

function closeHistoryDetail() {
  document.getElementById("historyDetailModal").classList.add("hidden");
}

/* ---- UNDO / 履歴管理 ---- */
function saveHistory() {
  let clonedRecords = JSON.parse(JSON.stringify(throwRecords));
  if (clonedRecords[turn] && clonedRecords[turn][playerRotationOrder[currentPlayerIndex]]) {
    let currentRec = clonedRecords[turn][playerRotationOrder[currentPlayerIndex]][throwNum];
    if (currentRec && players[playerRotationOrder[currentPlayerIndex]].isDisqualified) {
      currentRec.total = "失格";
    }
  }
  history.push(JSON.stringify({ players, turn, currentPlayerIndex, playerRotationOrder, throwNum, throwRecords: clonedRecords }));
}
function undoFromWinner() { document.getElementById("winnerModal").classList.add("hidden"); undo(); }

function undo() {
  if (history.length === 0) { showToast("戻せる履歴がありません。"); return; }
  const prev = JSON.parse(history.pop());
  players = prev.players; turn = prev.turn; currentPlayerIndex = prev.currentPlayerIndex;
  if (prev.playerRotationOrder !== undefined) playerRotationOrder = prev.playerRotationOrder;
  throwNum = prev.throwNum; if (prev.throwRecords) throwRecords = prev.throwRecords;
  resetSelections(); updateUI();
}

function confirmUndo() { openConfirm("1手前に戻しますか?", () => undo()); }
function confirmReset() {
  openConfirm("ゲームを終了してメインメニューへ戻りますか?", () => {
    document.getElementById("winnerModal").classList.add("hidden");
    document.getElementById("nextSetModal").classList.add("hidden");
    resetSelections(); backToTopMenu();
  });
}

/* ---- 初期化 ---- */
document.addEventListener('DOMContentLoaded', () => {
  buildSkittleSetupUI();
  restoreThemeFromStorage();
  restoreSoundFromStorage();
  renderHistoryList();
  document.querySelectorAll('input[type="range"]').forEach(syncRangeFill);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
