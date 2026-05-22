const BUILD = "bridge-v1.0.11-global-red-suits";
const ROOM_SCHEMA_VERSION = 55;
const SEATS = [
  { id: 0, key: "N", name: "北", team: "NS" },
  { id: 1, key: "E", name: "東", team: "EW" },
  { id: 2, key: "S", name: "南", team: "NS" },
  { id: 3, key: "W", name: "西", team: "EW" }
];
const SUITS = {
  C: { symbol: "♣", name: "梅花", order: 0, trick: 0, color: "black", score: 20 },
  D: { symbol: "♦", name: "方塊", order: 1, trick: 1, color: "red", score: 20 },
  H: { symbol: "♥", name: "紅心", order: 2, trick: 2, color: "red", score: 30 },
  S: { symbol: "♠", name: "黑桃", order: 3, trick: 3, color: "black", score: 30 },
  NT: { symbol: "NT", name: "無王", order: 4, trick: -1, color: "black", score: 30 }
};
const SUIT_ORDER = ["C", "D", "H", "S", "NT"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const HCP = { A: 4, K: 3, Q: 2, J: 1 };
const AI_ACTION_DELAY_MS = 3000;
const TRICK_CLEAR_DELAY_MS = 3000;
const PRESENCE_HEARTBEAT_MS = 10000;
const PRESENCE_OFFLINE_MS = 25000;
const STORAGE = {
  name: "bridge.playerName",
  theme: "bridge.theme",
  hints: "bridge.hints",
  sound: "bridge.sound",
  vibration: "bridge.vibration",
  touch: "bridge.touch",
  soundProfile: "bridge.soundProfile",
  logVisible: "bridge.logVisible",
  stats: "bridge.stats",
  lastRoom: "bridge.lastRoom",
  lastRoomAt: "bridge.lastRoomAt",
  clientId: "bridge.clientId",
  checklist: "bridge.releaseChecklist"
};
const firebaseConfig = {
  apiKey: "AIzaSyDbOGwdYNY4mFG8Sgy8w_QdJpziWVoNx10",
  authDomain: "napoleon-secretary-3.firebaseapp.com",
  databaseURL: "https://napoleon-secretary-3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "napoleon-secretary-3",
  storageBucket: "napoleon-secretary-3.firebasestorage.app",
  messagingSenderId: "189925612153",
  appId: "1:189925612153:web:a6db7ea4dc1e8945c152a8"
};

const $ = (id) => document.getElementById(id);
const appState = {
  firebase: null,
  uid: null,
  firebaseUid: null,
  localUid: `local-${Math.random().toString(36).slice(2, 10)}`,
  clientId: null,
  connected: false,
  roomCode: null,
  room: null,
  roomUnsub: null,
  offline: false,
  spectator: false,
  botTimer: null,
  trickPauseTimer: null,
  presenceTimer: null,
  presenceRefKey: null,
  lastPresenceWriteAt: 0,
  pendingInviteRoom: null,
  inviteAutoJoinAttempted: false,
  audioContext: null,
  lastResultKey: null,
  processingActions: false,
  updateWorker: null
};

function init() {
  appState.clientId = ensureClientId();
  appState.localUid = `local-${appState.clientId}`;
  appState.uid = appState.localUid;
  applyTheme(loadSetting(STORAGE.theme, "auto"));
  watchSystemTheme();
  $("playerName").value = localStorage.getItem(STORAGE.name) || randomGuestName();
  $("themeSelect").value = loadSetting(STORAGE.theme, "auto");
  setCheckbox("hintToggle", getBool(STORAGE.hints, true));
  setCheckbox("soundToggle", getBool(STORAGE.sound, false));
  setCheckbox("vibrationToggle", getBool(STORAGE.vibration, false));
  setCheckbox("touchComfortToggle", getBool(STORAGE.touch, false));
  $("soundProfile").value = loadSetting(STORAGE.soundProfile, "soft");
  applyPlayerHintsVisible(getBool(STORAGE.hints, true));
  applyTouchComfort();
  applyLogVisibility(getBool(STORAGE.logVisible, false));

  const roomFromUrl = getInviteRoomFromLocation();
  if (roomFromUrl) {
    appState.pendingInviteRoom = roomFromUrl;
    $("roomCode").value = roomFromUrl;
    $("connectStatus").textContent = `偵測到邀請房號 ${roomFromUrl}，正在自動連線並加入…`;
  } else {
    const last = localStorage.getItem(STORAGE.lastRoom);
    const at = Number(localStorage.getItem(STORAGE.lastRoomAt) || 0);
    if (last && Date.now() - at < 1000 * 60 * 60 * 12) $("roomCode").placeholder = `上次房號 ${last}`;
  }

  bindEvents();
  if (appState.pendingInviteRoom) setTimeout(autoJoinInviteRoom, 250);
  renderLocalStatsSummary();
  renderReleaseChecklist();
  $("versionFooter").textContent = `合約橋牌 ${BUILD}｜標準夢家／閉手變體｜Firebase 多人房間`;
  showOnboardingIfFirstVisit();
}

function bindEvents() {
  $("btnStartOffline").addEventListener("click", startOfflineGame);
  $("btnQuickBeginner").addEventListener("click", () => { setPlayerHintsVisible(true); $("offlineMode").value = "standard"; startOfflineGame(); });
  $("btnQuickStandard").addEventListener("click", () => { $("offlineMode").value = "standard"; startOfflineGame(); });
  $("btnQuickClosed").addEventListener("click", () => { $("offlineMode").value = "closed"; startOfflineGame(); });
  $("btnQuickMultiplayer").addEventListener("click", () => $("roomCode").scrollIntoView({ behavior: "smooth", block: "center" }));
  $("btnRunAiTest").addEventListener("click", runAiHealthCheck);
  $("btnRunDiagnostics").addEventListener("click", runDiagnostics);
  $("btnShowLocalStats").addEventListener("click", renderLocalStatsSummary);
  $("btnShareStats").addEventListener("click", shareLocalStats);
  $("btnShareAchievements").addEventListener("click", shareAchievements);
  $("btnExportLocalData").addEventListener("click", exportLocalData);
  $("btnImportLocalData").addEventListener("click", () => $("importDataDialog").showModal());
  $("btnPasteCurrentBackup").addEventListener("click", () => { $("importDataText").value = JSON.stringify(collectLocalData(), null, 2); });
  $("btnApplyImportData").addEventListener("click", restoreLocalDataFromDialog);
  $("closeImportData").addEventListener("click", () => $("importDataDialog").close());
  $("btnCopyErrorReport").addEventListener("click", copyErrorReport);
  $("btnCopySupportBundle").addEventListener("click", copySupportBundle);
  $("btnClearPwaCache").addEventListener("click", clearPwaCachesAndReload);
  $("btnResetLocalData").addEventListener("click", resetLocalData);
  $("btnConnect").addEventListener("click", connectFirebase);
  $("btnCreateRoom").addEventListener("click", createRoom);
  $("btnJoinRoom").addEventListener("click", () => joinRoomFromInput(false));
  $("btnJoinSpectator").addEventListener("click", () => joinRoomFromInput(true));
  $("btnLeave").addEventListener("click", leaveRoom);
  $("btnGameExit").addEventListener("click", leaveRoom);
  $("btnCopyLink").addEventListener("click", copyInviteLink);
  $("btnAddBot").addEventListener("click", hostAddBot);
  $("btnRemoveBot").addEventListener("click", hostRemoveBot);
  $("btnStartGame").addEventListener("click", hostStartGame);
  $("btnTakeOverOfflineLobby").addEventListener("click", hostTakeOverOfflinePlayers);
  $("btnTakeOverOfflineGame").addEventListener("click", hostTakeOverOfflinePlayers);
  $("btnExtendRoomLobby").addEventListener("click", hostExtendRoom);
  $("btnCopyRoomMaintenanceLobby").addEventListener("click", copyRoomMaintenanceSummary);
  $("btnCloseRoomLobby").addEventListener("click", hostCloseRoom);
  $("btnCloseRoomGame").addEventListener("click", hostCloseRoom);
  $("lobbyMode").addEventListener("change", hostUpdateSettingsFromLobby);
  $("lobbyVulnerability").addEventListener("change", hostUpdateSettingsFromLobby);
  $("difficulty").addEventListener("input", () => { $("difficultyLabel").textContent = $("difficulty").value; hostUpdateSettingsFromLobby(); });
  $("showAiThoughts").addEventListener("change", hostUpdateSettingsFromLobby);
  $("btnToggleLog").addEventListener("click", () => setLogVisible(!getBool(STORAGE.logVisible, false)));
  $("btnOnboarding").addEventListener("click", () => showOnboardingDialog(true));
  $("closeOnboarding").addEventListener("click", () => finishOnboarding(false));
  $("btnStartAfterGuide").addEventListener("click", () => finishOnboarding(false));
  $("btnEnableHintsFromGuide").addEventListener("click", () => { setPlayerHintsVisible(true); finishOnboarding(false); });
  $("btnOpenReleaseNotes").addEventListener("click", () => $("releaseNotesDialog").showModal());
  $("closeReleaseNotes").addEventListener("click", () => $("releaseNotesDialog").close());
  $("btnOpenTutorialFromRelease").addEventListener("click", () => { $("releaseNotesDialog").close(); $("tutorialDialog").showModal(); });
  $("btnOpenReleaseChecklist").addEventListener("click", () => { renderReleaseChecklist(); $("releaseChecklistDialog").showModal(); });
  $("closeReleaseChecklist").addEventListener("click", () => $("releaseChecklistDialog").close());
  $("btnChecklistDiagnostics").addEventListener("click", () => { runDiagnostics(); renderReleaseChecklist(); });
  $("btnCopyChecklistResult").addEventListener("click", copyReleaseChecklistResult);
  $("btnResetChecklist").addEventListener("click", resetReleaseChecklist);
  $("btnOpenTutorial").addEventListener("click", () => $("tutorialDialog").showModal());
  $("closeTutorial").addEventListener("click", () => $("tutorialDialog").close());
  $("btnTutorialEnableHints").addEventListener("click", () => { setPlayerHintsVisible(true); toast("已開啟玩家提示"); });
  $("btnTutorialOpenRules").addEventListener("click", () => { $("tutorialDialog").close(); $("rulesDialog").showModal(); });
  $("btnRules").addEventListener("click", () => $("rulesDialog").showModal());
  $("closeRules").addEventListener("click", () => $("rulesDialog").close());
  $("btnCopyPublicLink").addEventListener("click", copyPublicGameLink);
  $("btnCopyPublicIntro").addEventListener("click", copyPublicIntroText);
  $("btnOpenPublicStatus").addEventListener("click", openPublicStatusDialog);
  $("btnOpenPublicStatusTop").addEventListener("click", openPublicStatusDialog);
  $("closePublicStatus").addEventListener("click", () => $("publicStatusDialog").close());
  $("btnCopyPublicStatus").addEventListener("click", copyPublicStatusReport);
  $("btnCopyPublicLinkInDialog").addEventListener("click", copyPublicGameLink);
  $("btnClearPwaCachePublic").addEventListener("click", clearPwaCachesAndReload);
  $("btnOpenShareKit").addEventListener("click", openShareKitDialog);
  $("closeShareKit").addEventListener("click", () => $("shareKitDialog").close());
  document.querySelectorAll("[data-share-copy]").forEach((btn) => btn.addEventListener("click", () => copyShareKitText(btn.dataset.shareCopy)));
  $("themeSelect").addEventListener("change", (e) => applyTheme(e.target.value, true));
  $("hintToggle").addEventListener("change", (e) => setPlayerHintsVisible(e.target.checked));
  $("soundToggle").addEventListener("change", (e) => setSoundEnabled(e.target.checked));
  $("vibrationToggle").addEventListener("change", (e) => setVibrationEnabled(e.target.checked));
  $("touchComfortToggle").addEventListener("change", (e) => setTouchComfortEnabled(e.target.checked));
  $("soundProfile").addEventListener("change", (e) => { localStorage.setItem(STORAGE.soundProfile, e.target.value); toast("音效風格已更新"); });
  $("btnTestSound").addEventListener("click", () => { setSoundEnabled(true); playSfx("turn"); toast("音效測試"); });
  $("btnTestVibration").addEventListener("click", () => { setVibrationEnabled(true); vibrate([24, 35, 24]); toast("震動測試"); });
  $("resultClose").addEventListener("click", () => $("resultOverlay").classList.add("hidden"));
  $("resultReplay").addEventListener("click", () => openReplayDialog(currentGame()));
  $("resultNewDeal").addEventListener("click", () => { $("resultOverlay").classList.add("hidden"); hostStartGame(); });
  $("closeReplay").addEventListener("click", () => $("replayDialog").close());
  $("btnShareReplay").addEventListener("click", shareReplay);
  $("btnCopyHandRecordGame")?.addEventListener("click", copyCurrentHandRecord);
  $("resultCopyHandRecord")?.addEventListener("click", copyCurrentHandRecord);
  $("btnCopyHandRecordReplay")?.addEventListener("click", copyCurrentHandRecord);
  $("btnReloadUpdate").addEventListener("click", reloadForUpdate);
  $("btnDismissUpdate").addEventListener("click", () => $("updateBanner").classList.add("hidden"));
}

function setCheckbox(id, value) { const el = $(id); if (el) el.checked = Boolean(value); }
function loadSetting(key, fallback) { return localStorage.getItem(key) ?? fallback; }
function getBool(key, fallback) { const v = localStorage.getItem(key); return v == null ? fallback : v === "true"; }
function randomGuestName() { return `玩家${Math.floor(100 + Math.random() * 900)}`; }
function ensureClientId() {
  let id = localStorage.getItem(STORAGE.clientId);
  if (!id) {
    id = `client-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    localStorage.setItem(STORAGE.clientId, id);
  }
  return id;
}

function applyTheme(theme, persist = false) {
  if (persist) localStorage.setItem(STORAGE.theme, theme);
  const actual = theme === "auto" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "twilight" : "ocean") : theme;
  document.documentElement.dataset.theme = actual;
  const picker = $("themeSelect");
  if (picker) picker.value = theme;
}
function watchSystemTheme() {
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if (loadSetting(STORAGE.theme, "auto") === "auto") applyTheme("auto");
  });
}
function setPlayerHintsVisible(v) { localStorage.setItem(STORAGE.hints, String(v)); setCheckbox("hintToggle", v); applyPlayerHintsVisible(v); }
function applyPlayerHintsVisible(v) { $("playerTips")?.classList.toggle("hidden", !v); }
function setSoundEnabled(v) { localStorage.setItem(STORAGE.sound, String(v)); setCheckbox("soundToggle", v); if (v) playSfx("turn"); }
function setVibrationEnabled(v) { localStorage.setItem(STORAGE.vibration, String(v)); setCheckbox("vibrationToggle", v); if (v) vibrate(18); }
function setTouchComfortEnabled(v) { localStorage.setItem(STORAGE.touch, String(v)); setCheckbox("touchComfortToggle", v); applyTouchComfort(); }
function applyTouchComfort() { document.body.classList.toggle("touch-comfort", getBool(STORAGE.touch, false)); }
function setLogVisible(v) { localStorage.setItem(STORAGE.logVisible, String(v)); applyLogVisibility(v); }
function applyLogVisibility(v) {
  document.body.classList.toggle("log-visible", v);
  $("btnToggleLog").textContent = v ? "隱藏紀錄" : "顯示紀錄";
  $("logSummary").textContent = v ? "牌局紀錄已顯示。" : "牌局紀錄已隱藏。";
}
function showOnboardingIfFirstVisit() {
  if (!localStorage.getItem("bridge.seenOnboarding")) showOnboardingDialog(false);
}
function showOnboardingDialog(force) { if (force || !localStorage.getItem("bridge.seenOnboarding")) $("onboardingDialog").showModal(); }
function finishOnboarding() { localStorage.setItem("bridge.seenOnboarding", "1"); $("onboardingDialog").close(); }

async function connectFirebase() {
  setStatus("正在連線 Firebase…");
  try {
    if (!appState.firebase) {
      const [appMod, authMod, dbMod] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js")
      ]);
      const firebaseApp = appMod.initializeApp(firebaseConfig);
      appState.firebase = {
        app: firebaseApp,
        auth: authMod.getAuth(firebaseApp),
        db: dbMod.getDatabase(firebaseApp),
        ref: dbMod.ref,
        set: dbMod.set,
        update: dbMod.update,
        get: dbMod.get,
        onValue: dbMod.onValue,
        push: dbMod.push,
        remove: dbMod.remove,
        serverTimestamp: dbMod.serverTimestamp,
        onDisconnect: dbMod.onDisconnect,
        signInAnonymously: authMod.signInAnonymously
      };
    }
    const credential = await appState.firebase.signInAnonymously(appState.firebase.auth);
    appState.firebaseUid = credential.user.uid;
    appState.clientId ||= ensureClientId();
    appState.uid = appState.firebaseUid;
    appState.connected = true;
    $("btnCreateRoom").disabled = false;
    $("btnJoinRoom").disabled = false;
    $("btnJoinSpectator").disabled = false;
    setStatus(`Firebase 已連線：${appState.firebaseUid.slice(0, 8)}…`);
    playSfx("success");
    return true;
  } catch (error) {
    console.error(error);
    setStatus(`Firebase 連線失敗：${error.message}`);
    toast("Firebase 連線失敗");
    return false;
  }
}
function setStatus(text) { $("connectStatus").textContent = text; }

function normalizeRoomCode(raw) {
  return String(raw || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}
function getInviteRoomFromLocation() {
  const candidates = [];
  try {
    const params = new URLSearchParams(location.search);
    candidates.push(params.get("room"), params.get("r"), params.get("code"));
  } catch (error) {
    console.warn("無法讀取邀請網址參數", error);
  }
  try {
    const rawHash = String(location.hash || "").replace(/^#/, "");
    const hashQuery = rawHash.includes("?") ? rawHash.slice(rawHash.indexOf("?") + 1) : rawHash;
    if (hashQuery && hashQuery.includes("=")) {
      const params = new URLSearchParams(hashQuery);
      candidates.push(params.get("room"), params.get("r"), params.get("code"));
    }
  } catch (error) {
    console.warn("無法讀取邀請網址 hash 參數", error);
  }
  return normalizeRoomCode(candidates.find((value) => normalizeRoomCode(value)) || "");
}
async function autoJoinInviteRoom() {
  const code = normalizeRoomCode(appState.pendingInviteRoom);
  if (!code || appState.inviteAutoJoinAttempted || appState.room) return;
  appState.inviteAutoJoinAttempted = true;
  $("roomCode").value = code;
  setStatus(`正在透過邀請連結加入房間 ${code}…`);
  await joinRoomByCode(code, false, true);
}
function roomPath(code = appState.roomCode) { return `rooms/${code}`; }
function actionsPath(code = appState.roomCode) { return `rooms/${code}/actions`; }

async function createRoom() {
  if (!appState.connected && !(await connectFirebase())) return;
  savePlayerName();
  const code = await generateUniqueRoomCode();
  appState.roomCode = code;
  appState.offline = false;
  appState.spectator = false;
  const now = Date.now();
  const room = {
    meta: { code, hostUid: appState.uid, status: "lobby", createdAt: now, updatedAt: now, expiresAt: now + 24 * 60 * 60 * 1000, schemaVersion: ROOM_SCHEMA_VERSION, appBuild: BUILD },
    lobby: {
      dealer: 2,
      boardNo: 1,
      settings: defaultSettingsFromUI("lobby"),
      seats: {
        0: null,
        1: null,
        2: makeSeat(2, appState.uid, $("playerName").value, "human"),
        3: null
      }
    },
    actions: null,
    game: null
  };
  await appState.firebase.set(appState.firebase.ref(appState.firebase.db, roomPath(code)), room);
  localStorage.setItem(STORAGE.lastRoom, code);
  localStorage.setItem(STORAGE.lastRoomAt, String(now));
  updateRoomUrl(code);
  subscribeRoom(code);
  toast(`已建立房間 ${code}`);
}
async function generateUniqueRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let i = 0; i < 20; i++) {
    const code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const snap = await appState.firebase.get(appState.firebase.ref(appState.firebase.db, roomPath(code)));
    if (!snap.exists()) return code;
  }
  return `B${Date.now().toString(36).toUpperCase().slice(-5)}`;
}
function makeSeat(seat, uid, name, type = "human", clientId = null) {
  const now = Date.now();
  const isHuman = type === "human";
  return {
    seat,
    uid,
    clientId: isHuman ? (clientId || appState.clientId || uid) : null,
    name: String(name || randomGuestName()).slice(0, 12),
    type,
    joinedAt: now,
    lastSeen: now,
    online: true
  };
}
async function joinRoomFromInput(spectator = false) {
  const code = normalizeRoomCode($("roomCode").value);
  await joinRoomByCode(code, spectator, false);
}
async function joinRoomByCode(code, spectator = false, fromInvite = false) {
  code = normalizeRoomCode(code);
  if (!code) return toast(fromInvite ? "邀請連結沒有房號" : "請輸入房號");
  $("roomCode").value = code;
  if (!appState.connected && !(await connectFirebase())) {
    if (fromInvite) setStatus(`偵測到邀請房號 ${code}，但 Firebase 連線失敗，請稍後重試。`);
    return;
  }
  savePlayerName();
  const snap = await appState.firebase.get(appState.firebase.ref(appState.firebase.db, roomPath(code)));
  if (!snap.exists()) {
    setStatus(fromInvite ? `找不到邀請房間 ${code}，請確認房主還在房間內。` : "找不到房間");
    return toast("找不到房間");
  }
  const room = snap.val();
  if (room?.meta?.status === "closed") {
    setStatus(`房間 ${code} 已關閉`);
    return toast("房間已關閉");
  }
  appState.roomCode = code;
  appState.offline = false;
  appState.spectator = spectator;
  if (!spectator) {
    const existing = findSeatByUid(room, appState.uid, appState.clientId);
    if (existing != null) {
      const previous = room.lobby?.seats?.[existing] || {};
      await appState.firebase.update(appState.firebase.ref(appState.firebase.db, roomPath(code)), {
        [`lobby/seats/${existing}`]: {
          ...previous,
          seat: existing,
          uid: appState.uid,
          clientId: appState.clientId,
          name: String($("playerName").value || previous.name || randomGuestName()).slice(0, 12),
          type: "human",
          online: true,
          lastSeen: Date.now(),
          rejoinedAt: Date.now()
        },
        "meta/updatedAt": Date.now()
      });
      toast(`已恢復 ${seatName(existing)} 座位`);
    } else if (room?.meta?.status === "lobby") {
      const firstEmpty = firstEmptySeat(room);
      if (firstEmpty == null) {
        appState.spectator = true;
        toast("座位已滿，改以觀戰加入");
      } else {
        await appState.firebase.update(appState.firebase.ref(appState.firebase.db, roomPath(code)), {
          [`lobby/seats/${firstEmpty}`]: makeSeat(firstEmpty, appState.uid, $("playerName").value, "human"),
          "meta/updatedAt": Date.now()
        });
      }
    } else {
      appState.spectator = true;
      toast("牌局已開始，沒有原座位，改以觀戰加入");
    }
  }
  localStorage.setItem(STORAGE.lastRoom, code);
  localStorage.setItem(STORAGE.lastRoomAt, String(Date.now()));
  updateRoomUrl(code);
  subscribeRoom(code);
  toast(appState.spectator ? `以觀戰加入 ${code}` : `已加入房間 ${code}`);
}
function subscribeRoom(code) {
  if (appState.roomUnsub) appState.roomUnsub();
  const roomRef = appState.firebase.ref(appState.firebase.db, roomPath(code));
  appState.roomUnsub = appState.firebase.onValue(roomRef, (snap) => {
    const value = snap.val();
    if (!value) {
      toast("房間不存在或已刪除");
      leaveRoom(true);
      return;
    }
    appState.room = normalizeRoom(value);
    maintainPresence();
    renderAll();
    maybeProcessActions();
    maybeResolveTrickPause();
    maybeScheduleBot();
  }, (error) => {
    console.error(error);
    toast("房間同步失敗");
  });
}
function normalizeRoom(room) {
  room.lobby ||= { dealer: 2, boardNo: 1, settings: defaultSettingsFromUI("lobby"), seats: {} };
  room.lobby.seats ||= {};
  for (let i = 0; i < 4; i++) if (room.lobby.seats[i] === undefined) room.lobby.seats[i] = null;
  room.lobby.settings ||= defaultSettingsFromUI("lobby");
  if (room.game) normalizeGame(room.game);
  return room;
}
function listFromFirebase(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null);
  if (!value || typeof value !== "object") return [];
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key])
    .filter((item) => item !== undefined && item !== null);
}
function normalizeGame(game) {
  game.auction = listFromFirebase(game.auction);
  game.currentTrick = listFromFirebase(game.currentTrick);
  game.trickHistory = listFromFirebase(game.trickHistory);
  game.log = listFromFirebase(game.log);
  if (game.pendingTrick) game.pendingTrick.plays = listFromFirebase(game.pendingTrick.plays);
  const rawHands = game.hands || {};
  game.hands = [0, 1, 2, 3].map((seat) => listFromFirebase(rawHands[seat] ?? rawHands[String(seat)]));
  game.tricksWon ||= { NS: 0, EW: 0 };
  game.score ||= { NS: 0, EW: 0 };
  game.auction ||= [];
  game.currentTrick ||= [];
  game.trickHistory ||= [];
  game.log ||= [];
  return game;
}
function findSeatByUid(room, uid = appState.uid, clientId = appState.clientId) {
  const seats = room?.lobby?.seats || {};
  for (let i = 0; i < 4; i++) if (uid && seats[i]?.uid === uid) return i;
  for (let i = 0; i < 4; i++) if (clientId && seats[i]?.type === "human" && seats[i]?.clientId === clientId) return i;
  return null;
}
function firstEmptySeat(room) {
  const order = [2, 0, 1, 3];
  const seats = room?.lobby?.seats || {};
  return order.find((seat) => !seats[seat]) ?? null;
}
function savePlayerName() { localStorage.setItem(STORAGE.name, $("playerName").value || randomGuestName()); }

function maintainPresence() {
  if (appState.offline || appState.spectator || !appState.connected || !appState.room || !appState.roomCode) {
    stopPresenceHeartbeat();
    return;
  }
  const seat = findSeatByUid(appState.room, appState.uid, appState.clientId);
  const player = appState.room?.lobby?.seats?.[seat];
  if (seat == null || player?.type !== "human") {
    stopPresenceHeartbeat();
    return;
  }
  if (!appState.presenceTimer) {
    updateOwnPresence(true);
    appState.presenceTimer = setInterval(() => updateOwnPresence(false), PRESENCE_HEARTBEAT_MS);
  }
  registerPresenceDisconnect(seat);
}

function stopPresenceHeartbeat() {
  clearInterval(appState.presenceTimer);
  appState.presenceTimer = null;
  appState.presenceRefKey = null;
}

async function updateOwnPresence(force = false) {
  if (appState.offline || appState.spectator || !appState.connected || !appState.roomCode || !appState.room) return;
  const now = Date.now();
  if (!force && now - appState.lastPresenceWriteAt < PRESENCE_HEARTBEAT_MS - 500) return;
  const seat = findSeatByUid(appState.room, appState.uid, appState.clientId);
  if (seat == null) return;
  appState.lastPresenceWriteAt = now;
  try {
    await appState.firebase.update(appState.firebase.ref(appState.firebase.db, roomPath()), {
      [`lobby/seats/${seat}/uid`]: appState.uid,
      [`lobby/seats/${seat}/clientId`]: appState.clientId,
      [`lobby/seats/${seat}/name`]: String($("playerName").value || appState.room.lobby.seats[seat]?.name || randomGuestName()).slice(0, 12),
      [`lobby/seats/${seat}/online`]: true,
      [`lobby/seats/${seat}/lastSeen`]: now
    });
  } catch (error) {
    console.warn("presence update failed", error);
  }
}

function registerPresenceDisconnect(seat) {
  if (!appState.connected || appState.offline || appState.spectator || seat == null) return;
  const key = `${appState.roomCode}:${seat}`;
  if (appState.presenceRefKey === key) return;
  appState.presenceRefKey = key;
  try {
    const ref = appState.firebase.ref(appState.firebase.db, `${roomPath()}/lobby/seats/${seat}`);
    appState.firebase.onDisconnect(ref).update({ online: false, lastSeen: appState.firebase.serverTimestamp() });
  } catch (error) {
    console.warn("presence onDisconnect failed", error);
  }
}

async function markOwnSeatOffline() {
  if (appState.offline || appState.spectator || !appState.connected || !appState.room || !appState.roomCode) return;
  const seat = findSeatByUid(appState.room, appState.uid, appState.clientId);
  if (seat == null) return;
  try {
    await appState.firebase.update(appState.firebase.ref(appState.firebase.db, roomPath()), {
      [`lobby/seats/${seat}/online`]: false,
      [`lobby/seats/${seat}/lastSeen`]: Date.now()
    });
  } catch (error) {
    console.warn("mark offline failed", error);
  }
}

function defaultSettingsFromUI(scope = "offline") {
  if (scope === "lobby") {
    return {
      mode: $("lobbyMode")?.value || "standard",
      vulnerability: $("lobbyVulnerability")?.value || "cycle",
      difficulty: Number($("difficulty")?.value || 10),
      showAiThoughts: Boolean($("showAiThoughts")?.checked ?? true)
    };
  }
  return {
    mode: $("offlineMode")?.value || "standard",
    vulnerability: $("offlineVulnerability")?.value || "cycle",
    difficulty: Number($("offlineDifficulty")?.value || 10),
    showAiThoughts: true
  };
}
async function hostUpdateSettingsFromLobby() {
  const room = appState.room;
  if (!room || !isHost()) return;
  const settings = defaultSettingsFromUI("lobby");
  await updateRoom({ "lobby/settings": settings, "meta/updatedAt": Date.now() });
}
async function updateRoom(patch) {
  if (appState.offline) {
    for (const [path, value] of Object.entries(patch)) setDeep(appState.room, path, value);
    renderAll();
    maybeResolveTrickPause();
    maybeScheduleBot();
    return;
  }
  await appState.firebase.update(appState.firebase.ref(appState.firebase.db, roomPath()), patch);
}
function setDeep(obj, path, value) {
  const parts = path.split("/");
  let target = obj;
  while (parts.length > 1) {
    const p = parts.shift();
    if (!target[p] || typeof target[p] !== "object") target[p] = {};
    target = target[p];
  }
  target[parts[0]] = value;
}

function startOfflineGame() {
  savePlayerName();
  const settings = defaultSettingsFromUI("offline");
  appState.offline = true;
  appState.spectator = false;
  appState.connected = false;
  appState.roomCode = "OFFLINE";
  appState.uid = appState.localUid;
  appState.room = {
    meta: { code: "OFFLINE", hostUid: appState.uid, status: "lobby", createdAt: Date.now(), updatedAt: Date.now(), schemaVersion: ROOM_SCHEMA_VERSION, appBuild: BUILD },
    lobby: {
      dealer: 2,
      boardNo: 1,
      settings,
      seats: {
        0: makeSeat(0, "bot-north", "北方電腦", "bot"),
        1: makeSeat(1, "bot-east", "東方電腦", "bot"),
        2: makeSeat(2, appState.uid, $("playerName").value, "human"),
        3: makeSeat(3, "bot-west", "西方電腦", "bot")
      }
    },
    actions: null,
    game: null
  };
  hostStartGame();
}

async function hostAddBot() {
  if (!isHost()) return toast("只有房主可以補電腦");
  const empty = firstEmptySeat(appState.room);
  if (empty == null) return toast("座位已滿");
  await updateRoom({ [`lobby/seats/${empty}`]: makeSeat(empty, `bot-${empty}-${Date.now()}`, `${SEATS[empty].name}方電腦`, "bot"), "meta/updatedAt": Date.now() });
}
async function hostRemoveBot() {
  if (!isHost()) return toast("只有房主可以移除電腦");
  const seats = appState.room?.lobby?.seats || {};
  const botSeat = [3, 1, 0, 2].find((s) => seats[s]?.type === "bot");
  if (botSeat == null) return toast("沒有電腦可移除");
  await updateRoom({ [`lobby/seats/${botSeat}`]: null, "meta/updatedAt": Date.now() });
}
async function hostTakeOverOfflinePlayers() {
  if (!isHost()) return;
  const room = appState.room;
  const patch = { "meta/updatedAt": Date.now() };
  let count = 0;
  for (let seat = 0; seat < 4; seat++) {
    const player = room.lobby.seats[seat];
    if (player?.type === "human" && player.uid !== appState.uid && isPlayerOffline(player)) {
      patch[`lobby/seats/${seat}`] = makeSeat(seat, `bot-takeover-${seat}-${Date.now()}`, `${SEATS[seat].name}方代打`, "bot");
      count++;
    }
  }
  if (!count) return toast("沒有離線真人座位可接管");
  await updateRoom(patch);
  toast(`已接管 ${count} 個座位`);
}
async function hostExtendRoom() {
  if (!isHost()) return;
  await updateRoom({ "meta/expiresAt": Date.now() + 24 * 60 * 60 * 1000, "meta/updatedAt": Date.now() });
  toast("已延長 24 小時");
}
async function hostCloseRoom() {
  if (!isHost()) return;
  await updateRoom({ "meta/status": "closed", "meta/updatedAt": Date.now() });
  toast("房間已關閉");
}
function isHost() { return Boolean(appState.room?.meta?.hostUid && appState.room.meta.hostUid === appState.uid); }
function isMySeat(seat) { return findSeatByUid(appState.room, appState.uid) === Number(seat); }

async function hostStartGame() {
  if (!appState.room) return;
  if (!appState.offline && !isHost()) return toast("只有房主可以開始");
  const room = structuredCloneCompat(appState.room);
  for (let seat = 0; seat < 4; seat++) {
    if (!room.lobby.seats[seat]) room.lobby.seats[seat] = makeSeat(seat, `bot-${seat}-${Date.now()}`, `${SEATS[seat].name}方電腦`, "bot");
  }
  const game = createNewGame(room);
  const nextDealer = (game.dealer + 1) % 4;
  const patch = {
    "meta/status": "game",
    "meta/updatedAt": Date.now(),
    "lobby/seats": room.lobby.seats,
    "lobby/dealer": nextDealer,
    "lobby/boardNo": game.boardNo + 1,
    game,
    actions: null
  };
  await updateRoom(patch);
  $("resultOverlay").classList.add("hidden");
  playSfx("start");
}
function createNewGame(room) {
  const deck = shuffle(makeDeck());
  const hands = [[], [], [], []];
  deck.forEach((card, idx) => hands[idx % 4].push(card));
  hands.forEach(sortHand);
  const boardNo = Number(room.lobby.boardNo || 1);
  const settings = room.lobby.settings || defaultSettingsFromUI("offline");
  const vulnerability = resolveVulnerability(settings.vulnerability, boardNo);
  const dealer = Number(room.lobby.dealer ?? 2);
  return {
    id: `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    boardNo,
    mode: settings.mode || "standard",
    vulnerability,
    dealer,
    phase: "auction",
    currentPlayer: dealer,
    hands,
    auction: [],
    contract: null,
    declarer: null,
    dummy: null,
    openingLeader: null,
    dummyVisible: false,
    currentTrick: [],
    pendingTrick: null,
    trickHistory: [],
    tricksWon: { NS: 0, EW: 0 },
    score: { NS: 0, EW: 0 },
    result: null,
    log: [`第 ${boardNo} 副開始。${seatName(dealer)}發牌，身價：${vulnerabilityLabel(vulnerability)}，模式：${modeLabel(settings.mode)}。`],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}
function makeDeck() {
  const deck = [];
  for (const suit of ["C", "D", "H", "S"]) {
    for (let order = 0; order < RANKS.length; order++) {
      const rank = RANKS[order];
      deck.push({ id: `${suit}${rank}`, suit, rank, order, label: `${rank}${SUITS[suit].symbol}` });
    }
  }
  return deck;
}
function shuffle(cards) {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function sortHand(hand) {
  const suitWeight = { S: 0, H: 1, D: 2, C: 3 };
  hand.sort((a, b) => suitWeight[a.suit] - suitWeight[b.suit] || b.order - a.order);
  return hand;
}
function resolveVulnerability(setting, boardNo) {
  if (setting && setting !== "cycle") return setting;
  const cycle = ["none", "ns", "ew", "both", "ns", "ew", "both", "none", "ew", "both", "none", "ns", "both", "none", "ns", "ew"];
  return cycle[(boardNo - 1) % 16] || "none";
}

async function submitAction(action) {
  const game = currentGame();
  if (!game) return;
  playSfx("click");
  vibrate(10);
  const fullAction = { ...action, uid: appState.uid, actorSeat: findSeatByUid(appState.room, appState.uid), createdAt: Date.now() };
  if (appState.offline) {
    const next = structuredCloneCompat(game);
    const result = applyAction(next, fullAction, appState.room.lobby);
    if (!result.ok) return toast(result.message || "不能這樣操作");
    await updateRoom({ game: next, "meta/status": "game", "meta/updatedAt": Date.now() });
    return;
  }
  await appState.firebase.push(appState.firebase.ref(appState.firebase.db, actionsPath()), fullAction);
}
function maybeProcessActions() {
  if (appState.offline || !isHost() || appState.processingActions) return;
  const room = appState.room;
  const actionsObj = room?.actions || {};
  const entries = Object.entries(actionsObj).sort((a, b) => (a[1]?.createdAt || 0) - (b[1]?.createdAt || 0));
  if (!entries.length) return;
  processNextAction(entries[0][0], entries[0][1]);
}
async function processNextAction(actionId, action) {
  appState.processingActions = true;
  try {
    const next = structuredCloneCompat(appState.room.game);
    const result = applyAction(next, action, appState.room.lobby);
    const patch = { [`actions/${actionId}`]: null, "meta/updatedAt": Date.now() };
    if (result.ok) patch.game = next;
    await updateRoom(patch);
  } catch (error) {
    console.error(error);
    await updateRoom({ [`actions/${actionId}`]: null, "meta/updatedAt": Date.now() });
  } finally {
    appState.processingActions = false;
    setTimeout(maybeProcessActions, 50);
  }
}
function applyAction(game, action, lobby) {
  if (!game || game.phase === "scoring") return { ok: false, message: "本副已結束" };
  if (game.phase === "trickPause") return { ok: false, message: "上一墩收牌前請稍候" };
  const settings = lobby?.settings || {};
  if (action.type === "call") return applyCall(game, action, lobby);
  if (action.type === "play") return applyPlay(game, action, settings);
  return { ok: false, message: "未知操作" };
}
function applyCall(game, action) {
  normalizeGame(game);
  const seat = Number(action.seat);
  if (game.phase !== "auction") return { ok: false, message: "現在不是叫牌階段" };
  if (seat !== game.currentPlayer) return { ok: false, message: "還沒輪到你叫牌" };
  const call = normalizeCall(action.call);
  if (!isLegalCall(game, call, seat)) return { ok: false, message: "不合法的叫品" };
  game.auction.push({ ...call, seat, at: Date.now() });
  game.log.push(`${seatName(seat)}：${callText(call)}`);
  const end = auctionEndState(game);
  if (end.ended) {
    if (!end.contract) {
      game.phase = "scoring";
      game.result = { passedOut: true, summary: "四家 Pass，該副牌不打。", scoreDelta: { NS: 0, EW: 0 } };
      game.log.push("四家 Pass，本副牌不打。南北 0，東西 0。");
    } else {
      const contract = end.contract;
      game.contract = contract;
      game.declarer = determineDeclarer(game.auction, contract.seat, contract.suit);
      game.dummy = partnerOf(game.declarer);
      game.openingLeader = nextSeat(game.declarer);
      game.currentPlayer = game.openingLeader;
      game.phase = "openingLead";
      game.log.push(`合約成立：${contractText(contract)}，莊家 ${seatName(game.declarer)}，${game.mode === "standard" ? `夢家 ${seatName(game.dummy)}` : "閉手變體不設夢家明牌"}，${seatName(game.openingLeader)}首攻。`);
    }
  } else {
    game.currentPlayer = nextSeat(seat);
  }
  game.updatedAt = Date.now();
  return { ok: true };
}
function normalizeCall(call) {
  if (!call || typeof call !== "object") return { type: "pass" };
  if (call.type === "bid") return { type: "bid", level: Number(call.level), suit: call.suit };
  if (call.type === "double") return { type: "double" };
  if (call.type === "redouble") return { type: "redouble" };
  return { type: "pass" };
}
function highestBid(auction) {
  const calls = listFromFirebase(auction);
  for (let i = calls.length - 1; i >= 0; i--) if (calls[i]?.type === "bid") return calls[i];
  return null;
}
function currentDoubled(auction) {
  let state = 0;
  for (const call of listFromFirebase(auction)) {
    if (call.type === "bid") state = 0;
    if (call.type === "double") state = 1;
    if (call.type === "redouble") state = 2;
  }
  return state;
}
function isLegalCall(game, call, seat) {
  if (call.type === "pass") return true;
  const high = highestBid(game.auction);
  const doubled = currentDoubled(game.auction);
  if (call.type === "bid") {
    if (!call.level || call.level < 1 || call.level > 7 || !SUIT_ORDER.includes(call.suit)) return false;
    if (!high) return true;
    return bidRank(call) > bidRank(high);
  }
  if (call.type === "double") return Boolean(high && teamOf(high.seat) !== teamOf(seat) && doubled === 0);
  if (call.type === "redouble") return Boolean(high && teamOf(high.seat) === teamOf(seat) && doubled === 1);
  return false;
}
function bidRank(call) { return (Number(call.level) - 1) * 5 + SUITS[call.suit].order; }
function legalCalls(game, seat) {
  if (game) game.auction = listFromFirebase(game.auction);
  const calls = [{ type: "pass" }];
  if (isLegalCall(game, { type: "double" }, seat)) calls.push({ type: "double" });
  if (isLegalCall(game, { type: "redouble" }, seat)) calls.push({ type: "redouble" });
  for (let level = 1; level <= 7; level++) {
    for (const suit of SUIT_ORDER) {
      const bid = { type: "bid", level, suit };
      if (isLegalCall(game, bid, seat)) calls.push(bid);
    }
  }
  return calls;
}
function auctionEndState(game) {
  const auction = listFromFirebase(game.auction);
  game.auction = auction;
  if (auction.length >= 4 && auction.slice(-4).every((c) => c.type === "pass") && !highestBid(auction)) return { ended: true, contract: null };
  const high = highestBid(auction);
  if (!high) return { ended: false };
  const highIndex = auction.lastIndexOf(high);
  if (auction.length - highIndex >= 4 && auction.slice(-3).every((c) => c.type === "pass")) {
    return { ended: true, contract: { level: high.level, suit: high.suit, seat: high.seat, doubled: currentDoubled(auction) } };
  }
  return { ended: false };
}
function determineDeclarer(auction, contractSeat, suit) {
  const side = teamOf(contractSeat);
  const first = listFromFirebase(auction).find((call) => call.type === "bid" && call.suit === suit && teamOf(call.seat) === side);
  return first?.seat ?? contractSeat;
}

function applyPlay(game, action, settings) {
  normalizeGame(game);
  const seat = Number(action.seat);
  if (!["openingLead", "play"].includes(game.phase)) return { ok: false, message: "現在不能出牌" };
  if (seat !== game.currentPlayer) return { ok: false, message: "還沒輪到這一手出牌" };
  const hand = game.hands[seat] || [];
  const idx = hand.findIndex((c) => c.id === action.cardId);
  if (idx < 0) return { ok: false, message: "找不到這張牌" };
  const card = hand[idx];
  if (!isLegalCardPlay(game, seat, card)) return { ok: false, message: "必須跟首引花色" };
  hand.splice(idx, 1);
  game.currentTrick.push({ seat, card });
  game.log.push(`${seatName(seat)} 出 ${card.label}`);
  if (game.phase === "openingLead") {
    game.phase = "play";
    if (game.mode === "standard") {
      game.dummyVisible = true;
      game.log.push(`首攻完成，夢家 ${seatName(game.dummy)} 亮牌。`);
    } else {
      game.log.push("閉手變體：沒有夢家亮牌，四手繼續暗牌自行出牌。");
    }
  }
  if (game.currentTrick.length === 4) {
    const winner = trickWinner(game.currentTrick, game.contract?.suit);
    const team = teamOf(winner);
    const trickNo = game.trickHistory.length + 1;
    game.pendingTrick = {
      no: trickNo,
      plays: game.currentTrick.map((play) => ({ seat: play.seat, card: play.card })),
      winner,
      team,
      clearAt: Date.now() + TRICK_CLEAR_DELAY_MS
    };
    game.currentPlayer = winner;
    game.phase = "trickPause";
    game.log.push(`第 ${trickNo} 墩已完成，${seatName(winner)} 暫時領先。3 秒後收牌。`);
  } else {
    game.currentPlayer = nextSeat(seat);
  }
  game.updatedAt = Date.now();
  return { ok: true };
}
function finishPendingTrick(game, force = false) {
  normalizeGame(game);
  const pending = game.pendingTrick;
  if (!pending || game.phase !== "trickPause") return false;
  const now = Date.now();
  if (!force && Number(pending.clearAt || 0) > now) return false;
  const winner = Number(pending.winner);
  const team = pending.team || teamOf(winner);
  const plays = listFromFirebase(pending.plays);
  game.tricksWon[team] = (game.tricksWon[team] || 0) + 1;
  game.trickHistory.push({ no: pending.no || game.trickHistory.length + 1, plays, winner, team });
  game.log.push(`第 ${game.trickHistory.length} 墩由 ${seatName(winner)} 贏得，收牌。`);
  game.currentTrick = [];
  game.pendingTrick = null;
  game.currentPlayer = winner;
  if (game.trickHistory.length >= 13) finishScoring(game);
  else game.phase = "play";
  game.updatedAt = Date.now();
  return true;
}

function isLegalCardPlay(game, seat, card) {
  const trick = game.currentTrick || [];
  if (!trick.length) return true;
  const ledSuit = trick[0].card.suit;
  const hand = game.hands[seat] || [];
  const hasLed = hand.some((c) => c.suit === ledSuit);
  return !hasLed || card.suit === ledSuit;
}
function legalCardsForSeat(game, seat) {
  return (game.hands[seat] || []).filter((card) => isLegalCardPlay(game, seat, card));
}
function currentWinningPlay(plays, trumpSuit) {
  plays = listFromFirebase(plays).filter((play) => play && play.card);
  if (!plays.length) return null;
  const ledSuit = plays[0].card.suit;
  let best = plays[0];
  for (const play of plays.slice(1)) {
    if (beats(play.card, best.card, ledSuit, trumpSuit)) best = play;
  }
  return best;
}
function trickWinner(plays, trumpSuit) {
  return currentWinningPlay(plays, trumpSuit)?.seat;
}
function beats(card, best, ledSuit, trumpSuit) {
  if (trumpSuit && trumpSuit !== "NT") {
    if (card.suit === trumpSuit && best.suit !== trumpSuit) return true;
    if (card.suit !== trumpSuit && best.suit === trumpSuit) return false;
    if (card.suit === trumpSuit && best.suit === trumpSuit) return card.order > best.order;
  }
  if (card.suit === ledSuit && best.suit !== ledSuit) return true;
  if (card.suit !== ledSuit && best.suit === ledSuit) return false;
  if (card.suit === best.suit) return card.order > best.order;
  return false;
}
function finishScoring(game) {
  const result = scoreContract(game);
  game.phase = "scoring";
  game.result = result;
  game.score.NS += result.scoreDelta.NS;
  game.score.EW += result.scoreDelta.EW;
  game.log.push(result.summary);
}
function scoreContract(game) {
  if (!game.contract) return { passedOut: true, scoreDelta: { NS: 0, EW: 0 }, summary: "該副牌不打。" };
  const c = game.contract;
  const declaringTeam = teamOf(game.declarer);
  const defendingTeam = declaringTeam === "NS" ? "EW" : "NS";
  const tricks = game.tricksWon[declaringTeam] || 0;
  const target = 6 + c.level;
  const vul = isVulnerable(game.vulnerability, declaringTeam);
  const made = tricks >= target;
  let points = 0;
  let detail = [];
  if (made) {
    const contractPoints = contractBasePoints(c.level, c.suit) * (c.doubled === 2 ? 4 : c.doubled === 1 ? 2 : 1);
    points += contractPoints;
    detail.push(`合約分 ${contractPoints}`);
    if (c.doubled === 1) { points += 50; detail.push("賭倍獎分 50"); }
    if (c.doubled === 2) { points += 100; detail.push("再賭倍獎分 100"); }
    points += contractPoints >= 100 ? (vul ? 500 : 300) : 50;
    detail.push(contractPoints >= 100 ? `成局獎分 ${vul ? 500 : 300}` : "部分合約獎分 50");
    if (c.level === 6) { points += vul ? 750 : 500; detail.push(`小滿貫獎分 ${vul ? 750 : 500}`); }
    if (c.level === 7) { points += vul ? 1500 : 1000; detail.push(`大滿貫獎分 ${vul ? 1500 : 1000}`); }
    const over = tricks - target;
    if (over > 0) {
      const overPoints = overTrickPoints(over, c.suit, c.doubled, vul);
      points += overPoints;
      detail.push(`超 ${over} 墩 ${overPoints}`);
    }
  } else {
    const down = target - tricks;
    points = underTrickPenalty(down, c.doubled, vul);
    detail.push(`倒 ${down} 墩罰分 ${points}`);
  }
  const scoreDelta = { NS: 0, EW: 0 };
  if (made) scoreDelta[declaringTeam] = points;
  else scoreDelta[defendingTeam] = points;
  const signedForNS = scoreDelta.NS - scoreDelta.EW;
  const signText = signedForNS >= 0 ? `南北 +${signedForNS}` : `東西 +${Math.abs(signedForNS)}`;
  const summary = `${contractText(c, game.declarer)} ${made ? "成約" : "失敗"}，莊家方拿 ${tricks}/${target} 墩。${signText}。${detail.join("，")}。`;
  return { made, target, tricks, declaringTeam, defendingTeam, points, scoreDelta, summary, detail };
}
function contractBasePoints(level, suit) {
  if (suit === "NT") return 40 + (level - 1) * 30;
  return SUITS[suit].score * level;
}
function overTrickPoints(over, suit, doubled, vul) {
  if (doubled === 1) return over * (vul ? 200 : 100);
  if (doubled === 2) return over * (vul ? 400 : 200);
  return over * (suit === "NT" ? 30 : SUITS[suit].score);
}
function underTrickPenalty(down, doubled, vul) {
  if (!doubled) return down * (vul ? 100 : 50);
  let total = 0;
  for (let i = 1; i <= down; i++) {
    if (vul) total += i === 1 ? 200 : 300;
    else total += i === 1 ? 100 : i <= 3 ? 200 : 300;
  }
  return doubled === 2 ? total * 2 : total;
}
function isVulnerable(vul, team) { return vul === "both" || vul?.toUpperCase() === team; }

function maybeResolveTrickPause() {
  clearTimeout(appState.trickPauseTimer);
  appState.trickPauseTimer = null;
  const room = appState.room;
  const game = room?.game;
  if (!game || room?.meta?.status !== "game" || game.phase !== "trickPause" || !game.pendingTrick) return;
  if (!appState.offline && !isHost()) return;
  const delay = Math.max(0, Number(game.pendingTrick.clearAt || Date.now()) - Date.now());
  appState.trickPauseTimer = setTimeout(async () => {
    const latestRoom = appState.room;
    const current = structuredCloneCompat(currentGame());
    if (!latestRoom?.game || !current || current.phase !== "trickPause" || !current.pendingTrick) return;
    if (!finishPendingTrick(current, true)) return;
    await updateRoom({ game: current, "meta/status": "game", "meta/updatedAt": Date.now() });
  }, delay);
}

function maybeScheduleBot() {
  clearTimeout(appState.botTimer);
  appState.botTimer = null;
  const room = appState.room;
  const game = room?.game;
  if (!game || room?.meta?.status !== "game" || game.phase === "scoring" || game.phase === "trickPause") return;
  if (!appState.offline && !isHost()) return;
  const controller = controllingSeatForCurrentAction(game);
  const player = room.lobby.seats[controller];
  if (player?.type !== "bot") return;
  appState.botTimer = setTimeout(async () => {
    const latestRoom = appState.room;
    const current = structuredCloneCompat(currentGame());
    if (!latestRoom?.game || !current || current.phase === "scoring") return;
    const latestController = controllingSeatForCurrentAction(current);
    if (latestController !== controller) return;
    const latestPlayer = latestRoom.lobby?.seats?.[controller];
    if (latestPlayer?.type !== "bot") return;
    const action = chooseBotAction(current, controller, latestRoom.lobby);
    if (!action) return;
    appendAiThought(current, controller, action, latestRoom.lobby);
    applyAction(current, { ...action, uid: latestPlayer.uid, actorSeat: controller, createdAt: Date.now() }, latestRoom.lobby);
    await updateRoom({ game: current, "meta/status": "game", "meta/updatedAt": Date.now() });
  }, AI_ACTION_DELAY_MS);
}
function controllingSeatForCurrentAction(game) {
  if (game.phase === "trickPause") return null;
  if (game.phase === "play" && game.mode === "standard" && game.currentPlayer === game.dummy) return game.declarer;
  return game.currentPlayer;
}
function chooseBotAction(game, controller, lobby) {
  if (game.phase === "auction") return { type: "call", seat: game.currentPlayer, call: chooseBotCall(game, game.currentPlayer, lobby) };
  if (["openingLead", "play"].includes(game.phase)) {
    const seat = game.currentPlayer;
    const card = chooseBotCard(game, seat, lobby);
    if (card) return { type: "play", seat, cardId: card.id };
  }
  return null;
}

function appendAiThought(game, controller, action, lobby) {
  const settings = lobby?.settings || {};
  if (!settings.showAiThoughts) return;
  normalizeGame(game);
  const seat = Number(action.seat ?? controller);
  const hand = game.hands?.[seat] || [];
  const hcp = handHcp(hand);
  const shape = shapeText(hand);
  let line = `AI 思路｜${seatName(seat)}：牌力 ${hcp} HCP，牌型 ${shape}。`;
  if (action.type === "call") {
    const high = highestBid(game.auction);
    const highText = high ? `目前最高 ${callText(high)} by ${SEATS[high.seat].key}` : "尚未有人叫牌";
    line += ` ${highText}，選擇 ${callText(action.call)}。`;
  } else if (action.type === "play") {
    const card = hand.find((c) => c.id === action.cardId);
    const legal = legalCardsForSeat(game, seat);
    const led = game.currentTrick?.[0]?.card?.suit;
    const ledText = led ? `首引 ${SUITS[led].symbol}${SUITS[led].name}` : "本墩首攻";
    line += ` ${ledText}，合法牌 ${legal.length} 張，選擇 ${card ? card.label : action.cardId}。`;
  }
  game.log.push(line);
}
function chooseBotCall(game, seat, lobby) {
  const calls = legalCalls(game, seat);
  const hand = game.hands[seat] || [];
  const hcp = handHcp(hand);
  const shape = suitLengths(hand);
  const bestSuit = Object.entries(shape).sort((a, b) => b[1] - a[1] || suitHcp(hand, b[0]) - suitHcp(hand, a[0]))[0]?.[0] || "S";
  const high = highestBid(game.auction);
  const difficulty = Number(lobby?.settings?.difficulty || 10);
  const bid = (level, suit) => calls.find((c) => c.type === "bid" && c.level === level && c.suit === suit);
  if (!high) {
    if (isBalanced(hand) && hcp >= 15 && hcp <= 17 && bid(1, "NT")) return bid(1, "NT");
    if (hcp >= 12) return bid(1, bestSuit) || calls.find((c) => c.type === "bid") || { type: "pass" };
    if (difficulty > 14 && shape[bestSuit] >= 7 && hcp >= 6) return bid(3, bestSuit) || bid(2, bestSuit) || { type: "pass" };
    return { type: "pass" };
  }
  if (teamOf(high.seat) === teamOf(seat)) {
    if (hcp >= 12 && calls.some((c) => c.type === "bid")) {
      if (shape[high.suit] >= 3 && high.suit !== "NT") return calls.find((c) => c.type === "bid" && c.suit === high.suit && c.level <= Math.min(4, high.level + 1)) || { type: "pass" };
      if (isBalanced(hand)) return calls.find((c) => c.type === "bid" && c.suit === "NT" && c.level <= 3) || { type: "pass" };
    }
    return { type: "pass" };
  }
  if (hcp >= 16 && calls.some((c) => c.type === "double")) return { type: "double" };
  if (hcp >= 13 && shape[bestSuit] >= 5) return calls.find((c) => c.type === "bid" && c.suit === bestSuit && c.level <= 3) || { type: "pass" };
  return { type: "pass" };
}
function handHcp(hand) { return hand.reduce((sum, c) => sum + (HCP[c.rank] || 0), 0); }
function suitHcp(hand, suit) { return hand.filter((c) => c.suit === suit).reduce((sum, c) => sum + (HCP[c.rank] || 0), 0); }
function suitLengths(hand) { return { C: hand.filter((c) => c.suit === "C").length, D: hand.filter((c) => c.suit === "D").length, H: hand.filter((c) => c.suit === "H").length, S: hand.filter((c) => c.suit === "S").length }; }
function shapeText(hand) { const s = suitLengths(hand || []); return `♠${s.S}-♥${s.H}-♦${s.D}-♣${s.C}`; }
function isBalanced(hand) { const lens = Object.values(suitLengths(hand)).sort((a, b) => b - a); return lens[0] <= 5 && lens[2] >= 2; }
function chooseBotCard(game, seat, lobby) {
  const legal = legalCardsForSeat(game, seat);
  if (!legal.length) return null;
  const difficulty = Number(lobby?.settings?.difficulty || 10);
  if (!game.currentTrick.length) {
    const trump = game.contract?.suit;
    const nonTrump = legal.filter((c) => trump === "NT" || c.suit !== trump);
    const pool = nonTrump.length ? nonTrump : legal;
    return difficulty >= 14 ? lowestFromLongest(pool) : lowestCard(pool);
  }
  const currentWinner = trickWinner(game.currentTrick, game.contract?.suit);
  if (teamOf(currentWinner) === teamOf(seat)) return lowestCard(legal);
  const winners = legal.filter((card) => wouldCardWin(game.currentTrick, card, game.contract?.suit));
  if (winners.length) return lowestCard(winners);
  return lowestCard(legal);
}
function wouldCardWin(currentTrick, card, trump) {
  const plays = [...currentTrick, { seat: 99, card }];
  return trickWinner(plays, trump) === 99;
}
function lowestCard(cards) { return [...cards].sort((a, b) => a.order - b.order || SUITS[a.suit].order - SUITS[b.suit].order)[0]; }
function highestCard(cards) { return [...cards].sort((a, b) => b.order - a.order || SUITS[b.suit].order - SUITS[a.suit].order)[0]; }
function lowestFromLongest(cards) {
  const lens = suitLengths(cards);
  const suit = Object.entries(lens).sort((a, b) => b[1] - a[1])[0]?.[0];
  return lowestCard(cards.filter((c) => c.suit === suit));
}

function renderAll() {
  const room = appState.room;
  const status = room?.meta?.status;
  $("connectView").classList.toggle("hidden", Boolean(room) && status !== "closed");
  $("lobbyView").classList.toggle("hidden", !(room && status === "lobby"));
  $("gameView").classList.toggle("hidden", !(room && status === "game"));
  $("btnLeave").classList.toggle("hidden", !room);
  if (!room) return;
  if (status === "lobby") renderLobby(room);
  if (status === "game") renderGame(room);
  document.querySelectorAll(".host-only").forEach((el) => el.classList.toggle("hidden", !isHost()));
}
function renderLobby(room) {
  $("lobbyRoomCode").textContent = room.meta.code;
  const url = buildInviteLink(room.meta.code);
  $("lobbyShare").textContent = `邀請連結：${url}`;
  $("inviteQr").src = buildQrCodeUrl(url);
  $("inviteLinkText").textContent = url;
  $("lobbyRoomStatus").innerHTML = `${escapeHtml(modeLabel(room.lobby.settings.mode))}｜${escapeHtml(vulnerabilitySettingLabel(room.lobby.settings.vulnerability))}｜房主 ${isHost() ? "是你" : "不是你"}${appState.offline ? "" : renderPresenceStatusHtml(room)}`;
  const seats = $("lobbySeats");
  seats.innerHTML = "";
  for (let seat = 0; seat < 4; seat++) {
    const player = room.lobby.seats[seat];
    const item = document.createElement("div");
    item.className = "lobby-seat";
    const state = playerPresenceState(player);
    const mine = player && (player.uid === appState.uid || player.clientId === appState.clientId) ? "・你" : "";
    item.classList.add(state.className);
    item.innerHTML = `
      <div class="seat-badge">${SEATS[seat].key}</div>
      <div><b>${seatName(seat)}｜${teamOf(seat)}</b><div class="hint compact">${player ? `${escapeHtml(player.name)}（${player.type === "bot" ? "電腦" : "真人"}${mine}）` : "空位"}<br>${state.label}${state.detail ? `｜${state.detail}` : ""}</div></div>
      <span class="pill presence-pill ${state.className}">${player ? state.label : "等待"}</span>
    `;
    seats.appendChild(item);
  }
  $("lobbyMode").value = room.lobby.settings.mode || "standard";
  $("lobbyVulnerability").value = room.lobby.settings.vulnerability || "cycle";
  $("difficulty").value = room.lobby.settings.difficulty || 10;
  $("difficultyLabel").textContent = $("difficulty").value;
  $("showAiThoughts").checked = Boolean(room.lobby.settings.showAiThoughts ?? true);
  const filled = [0, 1, 2, 3].filter((s) => room.lobby.seats[s]).length;
  $("lobbyNotice").textContent = isHost() ? `目前 ${filled}/4 位；可補電腦後開始。` : "等待房主開始。";
}
function renderGame(room) {
  const game = normalizeGame(room.game);
  renderPhase(game);
  renderContract(game);
  renderScore(game);
  renderTable(room);
  renderHand(room);
  renderActions(room);
  renderRecords(game);
  renderGameRoomStatus(room);
  renderLog(game);
  renderTips(game, room);
  maybeShowResult(game);
}
function renderPhase(game) {
  const phaseMap = {
    auction: ["叫牌階段", `${seatName(game.currentPlayer)} 叫牌。`],
    openingLead: ["首攻", `${seatName(game.openingLeader)} 首攻；夢家要等首攻翻開後才亮牌。`],
    play: ["打牌階段", `${seatName(game.currentPlayer)} 出牌。`],
    trickPause: ["本墩完成", `最後一張牌已出，保留桌面 3 秒後由 ${seatName(game.currentPlayer)} 收牌。`],
    scoring: ["本副結束", game.result?.summary || "已結算。"]
  };
  const [title, help] = phaseMap[game.phase] || ["準備中", "等待同步。"];
  $("phaseTitle").textContent = title;
  $("phaseHelp").innerHTML = colorizeSuitsHtml(help);
}
function renderContract(game) {
  const lines = [];
  lines.push(["模式", modeLabel(game.mode)]);
  lines.push(["牌號 / 身價", `第 ${game.boardNo} 副｜${vulnerabilityLabel(game.vulnerability)}`]);
  if (game.contract) {
    lines.push(["合約", contractText(game.contract, game.declarer)]);
    lines.push(["莊家", seatName(game.declarer)]);
    lines.push([game.mode === "standard" ? "夢家" : "同伴", game.mode === "standard" ? `${seatName(game.dummy)}${game.dummyVisible ? "（已亮牌）" : "（未亮牌）"}` : `${seatName(game.dummy)}（不亮牌）`]);
    lines.push(["目標", `${6 + game.contract.level} 墩`]);
  } else {
    lines.push(["合約", "尚未成立"]);
  }
  lines.push(["目前墩數", `南北 ${game.tricksWon.NS || 0}｜東西 ${game.tricksWon.EW || 0}`]);
  $("contractInfo").innerHTML = lines.map(([k, v]) => `<div class="contract-row"><span>${escapeHtml(k)}</span><b>${colorizeSuitsHtml(v)}</b></div>`).join("");
  $("tableTrump").classList.toggle("hidden", !game.contract);
  $("tableTrump").innerHTML = game.contract ? colorizeSuitsHtml(contractText(game.contract, game.declarer)) : "";
  $("tableTeamHeads").classList.toggle("hidden", false);
  $("tableTeamHeads").textContent = `墩數：南北 ${game.tricksWon.NS || 0}｜東西 ${game.tricksWon.EW || 0}`;
}
function renderScore(game) {
  $("scoreList").innerHTML = `
    <div class="score-row"><span>南北 NS</span><b>${game.score?.NS || 0}</b></div>
    <div class="score-row"><span>東西 EW</span><b>${game.score?.EW || 0}</b></div>
  `;
}
function renderRecords(game) {
  const auctionEl = $("auctionRecord");
  const trickEl = $("trickRecord");
  if (auctionEl) auctionEl.innerHTML = auctionTableHtml(game);
  if (trickEl) trickEl.innerHTML = trickRecordHtml(game);
}
function auctionTableHtml(game) {
  const auction = listFromFirebase(game.auction);
  const cols = [3, 0, 1, 2];
  if (!auction.length) return `<p class="hint compact">尚未叫牌。</p>`;
  const rows = [];
  let row = ["", "", "", ""];
  for (const call of auction) {
    const pos = Math.max(0, cols.indexOf(Number(call.seat)));
    if (row[pos]) {
      rows.push(row);
      row = ["", "", "", ""];
    }
    row[pos] = callTextHtml(call);
    if (pos === 3) {
      rows.push(row);
      row = ["", "", "", ""];
    }
  }
  if (row.some(Boolean)) rows.push(row);
  return `
    <table class="record-table auction-table">
      <thead><tr>${cols.map((seat) => `<th>${SEATS[seat].key}<small>${SEATS[seat].name}</small></th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((cell) => `<td>${cell || ""}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
}
function trickRecordHtml(game) {
  const cols = [0, 1, 2, 3];
  const rows = [];
  for (const trick of listFromFirebase(game.trickHistory)) rows.push({ status: "done", ...trick });
  if (game.phase === "trickPause" && game.pendingTrick) rows.push({ status: "pending", ...game.pendingTrick });
  else if (game.currentTrick?.length) rows.push({ status: "live", no: game.trickHistory.length + 1, plays: game.currentTrick, winner: null, team: null });
  if (!rows.length) return `<p class="hint compact">尚未有出牌紀錄。</p>`;
  return `
    <table class="record-table trick-table">
      <thead><tr><th>墩</th><th>首攻</th>${cols.map((seat) => `<th>${SEATS[seat].key}</th>`).join("")}<th>贏家</th></tr></thead>
      <tbody>${rows.map((trick) => {
        const plays = listFromFirebase(trick.plays);
        const bySeat = Object.fromEntries(plays.map((p) => [p.seat, p.card]));
        const lead = plays[0]?.seat != null ? SEATS[plays[0].seat].key : "";
        const status = trick.status === "pending" ? "待收牌" : trick.status === "live" ? "進行中" : (trick.winner != null ? `${SEATS[trick.winner].key}・${trick.team}` : "");
        return `<tr class="${trick.status === "pending" ? "pending-row" : trick.status === "live" ? "live-row" : ""}"><td>${trick.no}</td><td>${lead}</td>${cols.map((seat) => `<td>${bySeat[seat] ? cardTextHtml(bySeat[seat]) : ""}</td>`).join("")}<td>${escapeHtml(status)}</td></tr>`;
      }).join("")}</tbody>
    </table>
  `;
}
function cardTextHtml(card) { return `<span class="card-text ${cardColor(card)}">${escapeHtml(card.rank)}${suitSymbolHtml(card.suit)}</span>`; }
function callTextHtml(call) {
  if (call?.type === "bid") return `<span class="call-text ${suitColorClass(call.suit)}">${escapeHtml(call.level)}${suitSymbolHtml(call.suit)}</span>`;
  return `<span class="call-text">${escapeHtml(callText(call))}</span>`;
}
function renderGameRoomStatus(room) {
  const el = $("gameRoomStatus");
  if (!el) return;
  el.classList.toggle("hidden", Boolean(appState.offline));
  if (!appState.offline) el.innerHTML = renderPresenceStatusHtml(room, true);
}
function renderPresenceStatusHtml(room, compact = false) {
  const rows = [0, 1, 2, 3].map((seat) => {
    const player = room?.lobby?.seats?.[seat];
    const state = playerPresenceState(player);
    const mine = player && (player.uid === appState.uid || player.clientId === appState.clientId) ? "・你" : "";
    return `<div class="presence-row ${state.className}"><b>${SEATS[seat].key} ${seatName(seat)}</b><span>${escapeHtml(player?.name || "空位")}${mine}</span><em>${state.label}${state.detail ? `｜${state.detail}` : ""}</em></div>`;
  }).join("");
  return `<div class="presence-card-title"><b>房間玩家狀態</b>${compact ? "" : `<span>斷線後重新開啟同一房間連結，會自動恢復原座位。</span>`}</div><div class="presence-list">${rows}</div>`;
}
function playerPresenceState(player) {
  if (!player) return { label: "空位", className: "empty", detail: "" };
  if (player.type === "bot") return { label: "AI", className: "bot", detail: "電腦代打" };
  const offline = isPlayerOffline(player);
  return { label: offline ? "離線" : "在線", className: offline ? "offline" : "online", detail: lastSeenText(player.lastSeen) };
}
function isPlayerOffline(player) {
  if (!player || player.type !== "human") return false;
  if (player.online === false) return true;
  const seen = Number(player.lastSeen || 0);
  return Boolean(seen && Date.now() - seen > PRESENCE_OFFLINE_MS);
}
function lastSeenText(value) {
  const seen = Number(value || 0);
  if (!seen) return "尚未同步";
  const sec = Math.max(0, Math.floor((Date.now() - seen) / 1000));
  if (sec < 8) return "剛剛";
  if (sec < 60) return `${sec} 秒前`;
  return `${Math.floor(sec / 60)} 分前`;
}
function presenceTagHtml(player) {
  const state = playerPresenceState(player);
  if (!player || player.type === "bot") return player?.type === "bot" ? `<span class="tag warn">AI</span>` : "";
  return `<span class="tag presence-tag ${state.className}">${state.label}</span>`;
}
function renderTable(room) {
  const game = room.game;
  const mySeat = findSeatByUid(room, appState.uid);
  for (let seat = 0; seat < 4; seat++) {
    const el = $(`seat${seat}`);
    const player = room.lobby.seats[seat];
    const classes = ["seat", `seat-${seat}`];
    if (game.currentPlayer === seat && game.phase !== "scoring") classes.push("current");
    if (game.declarer === seat) classes.push("declarer");
    if (game.mode === "standard" && game.dummy === seat) classes.push("dummy");
    el.className = classes.join(" ");
    const tags = [];
    if (seat === mySeat) tags.push(`<span class="tag ok">你</span>`);
    const presenceTag = presenceTagHtml(player);
    if (presenceTag) tags.push(presenceTag);
    if (game.declarer === seat) tags.push(`<span class="tag">莊家</span>`);
    if (game.mode === "standard" && game.dummy === seat) tags.push(`<span class="tag">夢家</span>`);
    const visible = isSeatHandVisible(game, seat, mySeat);
    const mini = visible ? `<div class="seat-mini-hand">${(game.hands[seat] || []).slice(0, 13).map((c) => miniCardHtml(c)).join("")}</div>` : `<div class="seat-mini-hand">${Array.from({ length: Math.min(13, game.hands[seat]?.length || 0) }, () => `<span class="mini-card">🂠</span>`).join("")}</div>`;
    el.innerHTML = `
      <div class="seat-head"><span class="seat-name">${seatName(seat)}</span><span>${SEATS[seat].key}</span></div>
      <div class="seat-meta">${escapeHtml(player?.name || "空位")}｜${teamOf(seat)}｜手牌 ${game.hands[seat]?.length || 0}</div>
      <div class="seat-tags">${tags.join("")}</div>${mini}
    `;
    const liveWinningPlay = currentWinningPlay(game.currentTrick || [], game.contract?.suit);
    const play = (game.currentTrick || []).find((p) => p.seat === seat);
    const playEl = $(`play${seat}`);
    const isWinningCard = Boolean(play && liveWinningPlay && play.seat === liveWinningPlay.seat && play.card?.id === liveWinningPlay.card?.id);
    playEl.innerHTML = play ? cardHtml(play.card, { small: false, winning: isWinningCard }) : "";
  }
  const liveWinner = currentWinningPlay(game.currentTrick || [], game.contract?.suit);
  $("trickArea").innerHTML = game.phase === "trickPause" && game.pendingTrick ? `<span class="pill winning-pill">本墩完成｜${seatName(game.pendingTrick.winner)} 贏，3 秒後清桌</span>` : (game.currentTrick?.length ? `<span class="pill winning-pill">本墩 ${game.currentTrick.length}/4｜目前最大：${seatName(liveWinner?.seat)} ${liveWinner?.card ? cardTextHtml(liveWinner.card) : ""}</span>` : `<span class="pill">等待出牌</span>`);
  $("kittyArea").innerHTML = game.phase === "auction" ? auctionSummaryHtml(game.auction) : "";
}
function isSeatHandVisible(game, seat, mySeat) {
  if (appState.spectator) return game.phase === "scoring" || (game.mode === "standard" && game.dummyVisible && seat === game.dummy);
  if (seat === mySeat) return true;
  if (game.phase === "scoring") return true;
  if (game.mode === "standard" && game.dummyVisible && seat === game.dummy) return true;
  return false;
}
function renderHand(room) {
  const game = room.game;
  const mySeat = findSeatByUid(room, appState.uid);
  const control = controllableSeatForViewer(game, mySeat);
  const seat = control?.seat ?? mySeat;
  const canAct = control?.canAct ?? false;
  const hand = seat == null ? [] : (game.hands[seat] || []);
  $("handTitle").textContent = seat == null ? "觀戰中" : (seat === mySeat ? "你的手牌" : `你正在指揮 ${seatName(seat)} 的夢家牌`);
  $("handHint").innerHTML = colorizeSuitsHtml(handHintText(game, seat, canAct));
  $("handCount").textContent = seat == null ? "觀戰" : `${hand.length} 張`;
  renderHandAnalysis(game, seat, canAct);

  const inlinePanel = $("handActionPanel");
  if (inlinePanel) {
    inlinePanel.innerHTML = "";
    inlinePanel.classList.toggle("hidden", game.phase !== "auction");
    if (game.phase === "auction") renderAuctionControls(inlinePanel, game, mySeat, { compact: true, showTitle: true });
  }

  const legalIds = canAct && ["openingLead", "play"].includes(game.phase) ? new Set(legalCardsForSeat(game, seat).map((c) => c.id)) : new Set();
  $("hand").innerHTML = hand.map((card) => {
    const playable = legalIds.has(card.id);
    const disabled = canAct && ["openingLead", "play"].includes(game.phase) && !playable;
    return cardHtml(card, { playable, disabled, cardId: card.id, seat });
  }).join("");
  document.querySelectorAll(".card-face.playable[data-card-id]").forEach((el) => {
    el.addEventListener("click", () => submitAction({ type: "play", seat: Number(el.dataset.seat), cardId: el.dataset.cardId }));
  });
}
function controllableSeatForViewer(game, mySeat) {
  if (mySeat == null || appState.spectator) return { seat: null, canAct: false };
  if (game.phase === "auction") return { seat: mySeat, canAct: game.currentPlayer === mySeat };
  if (["openingLead", "play"].includes(game.phase)) {
    if (game.currentPlayer === mySeat) return { seat: mySeat, canAct: true };
    if (game.mode === "standard" && game.currentPlayer === game.dummy && mySeat === game.declarer) return { seat: game.dummy, canAct: true };
    return { seat: mySeat, canAct: false };
  }
  return { seat: mySeat, canAct: false };
}
function handHintText(game, seat, canAct) {
  if (seat == null) return "你正在觀戰，可查看公開資訊與回放。";
  if (game.phase === "auction") return canAct ? "輪到你叫牌。可 Pass、叫價，符合條件時可 Double / Redouble。" : `等待 ${seatName(game.currentPlayer)} 叫牌。`;
  if (game.phase === "openingLead") return canAct ? "請選一張牌首攻。可出的牌會上移並高亮。" : `等待 ${seatName(game.currentPlayer)} 首攻。`;
  if (game.phase === "play") return canAct ? legalPlayHint(game, seat) : `等待 ${seatName(game.currentPlayer)} 出牌。`;
  if (game.phase === "trickPause") return "本墩四張牌已出完，桌面會保留 3 秒再收牌。";
  return "本副已結算。";
}
function legalPlayHint(game, seat) {
  const trick = game.currentTrick || [];
  if (!trick.length) return "你是本墩首攻，可自由選牌；可出的牌會上移並高亮。";
  const ledSuit = trick[0].card.suit;
  const hand = game.hands[seat] || [];
  const hasLed = hand.some((c) => c.suit === ledSuit);
  return hasLed
    ? `首引花色是 ${SUITS[ledSuit].symbol}${SUITS[ledSuit].name}，你必須跟牌；不能出的牌已變灰。`
    : `首引花色是 ${SUITS[ledSuit].symbol}${SUITS[ledSuit].name}，你沒有該花色，可墊牌或將吃；可出的牌已高亮。`;
}
function renderHandAnalysis(game, seat, canAct) {
  const el = $("handAnalysis");
  if (!el) return;
  if (seat == null) {
    el.innerHTML = `<span class="hand-chip"><b>觀戰中</b><small>公開資訊</small></span><span class="hand-chip"><b>回放</b><small>可賽後檢討</small></span>`;
    return;
  }
  const hand = game.hands?.[seat] || [];
  const hcp = handHcp(hand);
  const shape = suitLengths(hand);
  const legalCount = canAct && ["openingLead", "play"].includes(game.phase) ? legalCardsForSeat(game, seat).length : null;
  const role = game.declarer === seat ? "莊家" : game.dummy === seat && game.mode === "standard" ? "夢家" : game.contract ? (teamOf(seat) === teamOf(game.declarer) ? "莊家方" : "防家") : teamOf(seat);
  const chips = [
    [`${hcp} HCP`, "牌力"],
    [`♠${shape.S} ♥${shape.H} ♦${shape.D} ♣${shape.C}`, "牌型"],
    [role, "角色"],
  ];
  if (legalCount != null) chips.push([`${legalCount} 張`, "合法出牌"]);
  el.innerHTML = chips.map(([value, label]) => `<span class="hand-chip"><b>${colorizeSuitsHtml(value)}</b><small>${escapeHtml(label)}</small></span>`).join("");
}
function renderActions(room) {
  const game = room.game;
  const mySeat = findSeatByUid(room, appState.uid);
  const panel = $("actionPanel");
  panel.innerHTML = "";
  if (game.phase === "auction") {
    renderAuctionControls(panel, game, mySeat, { compact: false, showTitle: true });
    return;
  }
  if (["openingLead", "play"].includes(game.phase)) {
    const control = controllableSeatForViewer(game, mySeat);
    panel.append(actionNote(control.canAct ? "請直接點手牌出牌。" : `等待 ${seatName(game.currentPlayer)} 出牌。`));
    return;
  }
  if (game.phase === "trickPause") {
    panel.append(actionNote("本墩已出完，保留桌面 3 秒後自動收牌。"));
    return;
  }
  if (game.phase === "scoring") {
    const row = document.createElement("div");
    row.className = "button-row";
    const canNew = appState.offline || isHost();
    const next = button("再玩一副", "primary", hostStartGame);
    next.disabled = !canNew;
    row.append(next, button("打開回放", "ghost", () => openReplayDialog(game)));
    panel.appendChild(row);
  }
}

function renderAuctionControls(container, game, mySeat, options = {}) {
  if (!container) return;
  const wrap = document.createElement("div");
  wrap.className = `auction-controls${options.compact ? " compact-auction-controls" : ""}`;
  if (options.showTitle) {
    const title = document.createElement("div");
    title.className = "auction-control-title";
    title.innerHTML = `<b>叫牌操作</b><span>${colorizeSuitsHtml(auctionControlStatusText(game, mySeat))}</span>`;
    wrap.appendChild(title);
  }
  if (mySeat == null || appState.spectator) {
    wrap.append(actionNote("觀戰中，不能叫牌。"));
    container.appendChild(wrap);
    return;
  }
  if (game.currentPlayer !== mySeat) {
    wrap.append(actionNote(`等待 ${seatName(game.currentPlayer)} 叫牌。你目前是 ${seatName(mySeat)}。`));
    container.appendChild(wrap);
    return;
  }
  let legal = [];
  try {
    legal = legalCalls(game, mySeat);
  } catch (error) {
    console.error("legalCalls failed", error);
    wrap.append(actionNote("叫牌按鈕產生失敗，請重新整理頁面或請房主重新開局。"));
    container.appendChild(wrap);
    return;
  }
  const basic = document.createElement("div");
  basic.className = "button-row call-row";
  for (const call of legal.filter((c) => c.type !== "bid")) {
    const btn = button(callText(call), call.type === "pass" ? "primary" : "ghost", () => submitAction({ type: "call", seat: mySeat, call }));
    btn.innerHTML = callTextHtml(call);
    btn.title = `${seatName(mySeat)} 叫 ${callText(call)}`;
    basic.appendChild(btn);
  }
  wrap.appendChild(basic);

  const bidGrid = document.createElement("div");
  bidGrid.className = "action-grid bid-grid";
  for (let level = 1; level <= 7; level++) {
    for (const suit of SUIT_ORDER) {
      const call = { type: "bid", level, suit };
      const btn = button(`${level}${SUITS[suit].symbol}`, "ghost bid-button", () => submitAction({ type: "call", seat: mySeat, call }));
      btn.innerHTML = `${level}${suitSymbolHtml(suit)}`;
      const ok = legal.some((c) => c.type === "bid" && c.level === level && c.suit === suit);
      btn.disabled = !ok;
      btn.title = ok ? `${seatName(mySeat)} 叫 ${callText(call)}` : "此叫品目前不合法";
      bidGrid.appendChild(btn);
    }
  }
  wrap.appendChild(bidGrid);
  container.appendChild(wrap);
}

function auctionControlStatusText(game, mySeat) {
  const high = highestBid(game.auction || []);
  const turn = game.currentPlayer != null ? `${seatName(game.currentPlayer)}叫牌` : "等待同步";
  const mine = mySeat == null ? "觀戰" : `你是${seatName(mySeat)}`;
  return high ? `${turn}｜目前最高 ${callText(high)} by ${SEATS[high.seat].key}｜${mine}` : `${turn}｜尚未叫牌｜${mine}`;
}

function button(text, cls, fn) { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = text; b.addEventListener("click", fn); return b; }
function actionNote(text) { const p = document.createElement("p"); p.className = "action-note"; p.innerHTML = colorizeSuitsHtml(text); return p; }
function renderLog(game) {
  const entries = (game.log || []).slice(-80).reverse();
  $("log").innerHTML = entries.map((line, idx) => `<div class="log-entry"><small>#${entries.length - idx}</small>${colorizeSuitsHtml(line)}</div>`).join("");
}
function renderTips(game, room) {
  const tips = [];
  if (game.mode === "standard") tips.push("標準模式：夢家在首攻翻開後公開，且只有莊家可以指揮夢家出牌。夢家真人玩家不會在夢家輪次看到出牌按鈕。");
  else tips.push("閉手變體：沒有夢家亮牌，四個座位都只能看自己的牌，輪到誰就由該座位自行出牌。");
  if (game.phase === "auction") tips.push("叫牌目標是判斷我方能贏幾墩。1 階要 7 墩，4 階要 10 墩，7 階要 13 墩。NT 最高，其次 ♠、♥、♦、♣。");
  if (["openingLead", "play"].includes(game.phase)) tips.push("出牌時若手上有首引花色，就必須跟該花色。沒有時才可墊牌或用王牌將吃。");
  if (game.phase === "trickPause") tips.push("本墩四張牌會停留 3 秒，方便確認最後一位玩家出了哪張牌。")
  $("playerTips").innerHTML = tips.map((t) => `<p>${colorizeSuitsHtml(t)}</p>`).join("");
  applyPlayerHintsVisible(getBool(STORAGE.hints, true));
}
function maybeShowResult(game) {
  if (game.phase !== "scoring" || !game.result) return;
  const key = `${game.id}-${JSON.stringify(game.result.scoreDelta)}`;
  if (appState.lastResultKey === key) return;
  appState.lastResultKey = key;
  saveGameResult(game);
  const title = game.result.passedOut ? "四家 Pass" : (game.result.made ? "合約成約" : "合約失敗");
  $("resultTitle").textContent = title;
  $("resultSubtitle").innerHTML = colorizeSuitsHtml(game.result.summary);
  $("resultStats").innerHTML = [
    ["合約", game.contract ? contractText(game.contract, game.declarer) : "Passed out"],
    ["墩數", `NS ${game.tricksWon.NS || 0}｜EW ${game.tricksWon.EW || 0}`],
    ["分數變動", `NS +${game.result.scoreDelta.NS || 0}｜EW +${game.result.scoreDelta.EW || 0}`],
    ["模式", modeLabel(game.mode)],
    ["計分明細", (game.result.detail || []).join("｜") || "無"]
  ].map(([k, v]) => `<div class="result-stat ${k === "計分明細" ? "wide" : ""}"><span>${escapeHtml(k)}</span><b>${colorizeSuitsHtml(v)}</b></div>`).join("");
  $("resultNewDeal").disabled = !(appState.offline || isHost());
  $("resultOverlay").classList.remove("hidden");
  playSfx(game.result.made ? "success" : "fail");
}
function cardHtml(card, opts = {}) {
  const cls = ["card-face", cardColor(card), opts.small ? "small" : "", opts.playable ? "playable" : "", opts.disabled ? "disabled" : "", opts.winning ? "winning-card" : ""].filter(Boolean).join(" ");
  const data = opts.cardId ? ` data-card-id="${escapeHtml(opts.cardId)}" data-seat="${Number(opts.seat)}"` : "";
  const title = opts.winning ? `${card.label}｜目前最大` : card.label;
  return `<div class="${cls}"${data} title="${escapeHtml(title)}"><span class="rank">${escapeHtml(card.rank)}</span><span class="suit ${cardColor(card)}">${SUITS[card.suit].symbol}</span></div>`;
}
function miniCardHtml(card) { return `<span class="mini-card ${cardColor(card)}">${escapeHtml(card.rank)}${suitSymbolHtml(card.suit)}</span>`; }
function cardColor(card) { return SUITS[card.suit]?.color === "red" ? "red" : "black"; }

function currentGame() { return appState.room?.game || null; }
function seatName(seat) { return `${SEATS[seat]?.name || "?"}家`; }
function nextSeat(seat) { return (Number(seat) + 1) % 4; }
function partnerOf(seat) { return (Number(seat) + 2) % 4; }
function teamOf(seat) { return Number(seat) % 2 === 0 ? "NS" : "EW"; }
function modeLabel(mode) { return mode === "closed" ? "變體模式：四手暗牌" : "標準模式：夢家亮牌"; }
function vulnerabilityLabel(v) { return ({ none: "雙方無身價", ns: "南北有身價", ew: "東西有身價", both: "雙方有身價" })[String(v).toLowerCase()] || "雙方無身價"; }
function vulnerabilitySettingLabel(v) { return v === "cycle" ? "依牌號循環身價" : vulnerabilityLabel(v); }
function callText(call) {
  if (!call || call.type === "pass") return "Pass";
  if (call.type === "double") return "Double";
  if (call.type === "redouble") return "Redouble";
  return `${call.level}${SUITS[call.suit]?.symbol || call.suit}`;
}
function contractText(contract, declarer) {
  if (!contract) return "尚未叫牌";
  const dbl = contract.doubled === 2 ? "XX" : contract.doubled === 1 ? "X" : "";
  return `${contract.level}${SUITS[contract.suit].symbol}${dbl}${declarer != null ? ` by ${SEATS[declarer].key}` : ""}`;
}
function auctionSummary(auction = []) { return auction.length ? auction.slice(-8).map((c) => `${SEATS[c.seat].key}:${callText(c)}`).join("　") : "尚未叫牌"; }
function auctionSummaryHtml(auction = []) { return auction.length ? auction.slice(-8).map((c) => `${escapeHtml(SEATS[c.seat].key)}:${callTextHtml(c)}`).join("　") : "尚未叫牌"; }
function structuredCloneCompat(obj) { return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function suitColorClass(suit) { return SUITS[suit]?.color === "red" ? "red" : "black"; }
function suitSymbolHtml(suit) {
  const meta = SUITS[suit];
  if (!meta) return escapeHtml(suit || "");
  return `<span class="suit-symbol ${suitColorClass(suit)}">${escapeHtml(meta.symbol)}</span>`;
}
function colorizeSuitsHtml(value) {
  return escapeHtml(value).replace(/[♥♦♠♣]/g, (symbol) => `<span class="suit-symbol ${symbol === "♥" || symbol === "♦" ? "red" : "black"}">${symbol}</span>`);
}

async function leaveRoom(silent = false) {
  clearTimeout(appState.botTimer);
  clearTimeout(appState.trickPauseTimer);
  if (!silent) await markOwnSeatOffline();
  stopPresenceHeartbeat();
  if (appState.roomUnsub) appState.roomUnsub();
  appState.roomUnsub = null;
  appState.room = null;
  appState.roomCode = null;
  appState.offline = false;
  appState.spectator = false;
  appState.uid = appState.firebaseUid || appState.localUid;
  clearRoomUrlParam();
  $("connectView").classList.remove("hidden");
  $("lobbyView").classList.add("hidden");
  $("gameView").classList.add("hidden");
  $("btnLeave").classList.add("hidden");
  $("resultOverlay").classList.add("hidden");
  if (!silent) toast("已離開房間");
}
function updateRoomUrl(code = appState.roomCode) {
  if (!code || code === "OFFLINE") return;
  try {
    const url = new URL(location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("room", normalizeRoomCode(code));
    history.replaceState(null, "", url.toString());
  } catch (error) {
    console.warn("無法更新房間網址", error);
  }
}
function clearRoomUrlParam() {
  try {
    const url = new URL(location.href);
    if (url.searchParams.has("room") || url.searchParams.has("r") || url.searchParams.has("code")) {
      url.searchParams.delete("room");
      url.searchParams.delete("r");
      url.searchParams.delete("code");
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  } catch (error) {
    console.warn("無法清除房間網址", error);
  }
}
function buildInviteLink(code = appState.roomCode) {
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("room", normalizeRoomCode(code));
  return url.toString();
}
function buildQrCodeUrl(url) { return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(url)}`; }
async function copyInviteLink() { await copyText(buildInviteLink()); toast("已複製邀請連結"); }
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch { window.prompt("請手動複製", text); }
}

function saveGameResult(game) {
  const stats = loadStats();
  stats.games += 1;
  stats.modes[game.mode] = (stats.modes[game.mode] || 0) + 1;
  stats.nsScore += game.result?.scoreDelta?.NS || 0;
  stats.ewScore += game.result?.scoreDelta?.EW || 0;
  if (game.result?.made) stats.made += 1;
  else if (!game.result?.passedOut) stats.down += 1;
  stats.last = { at: Date.now(), summary: game.result?.summary, mode: game.mode };
  localStorage.setItem(STORAGE.stats, JSON.stringify(stats));
  renderLocalStatsSummary();
}
function loadStats() {
  try { return { games: 0, made: 0, down: 0, nsScore: 0, ewScore: 0, modes: {}, ...JSON.parse(localStorage.getItem(STORAGE.stats) || "{}") }; }
  catch { return { games: 0, made: 0, down: 0, nsScore: 0, ewScore: 0, modes: {} }; }
}
function renderLocalStatsSummary() {
  const s = loadStats();
  $("localStatsSummary").innerHTML = `已完成 <b>${s.games}</b> 副｜成約 ${s.made}｜倒約 ${s.down}｜NS 累計 ${s.nsScore}｜EW 累計 ${s.ewScore}`;
  $("achievementSummary").textContent = s.games >= 10 ? "成就：橋牌熟手，已完成 10 副以上。" : "成就：完成 10 副可解鎖橋牌熟手。";
}
async function shareLocalStats() { const s = loadStats(); await copyText(`我的合約橋牌戰績：完成 ${s.games} 副，成約 ${s.made}，倒約 ${s.down}，NS ${s.nsScore} / EW ${s.ewScore}`); toast("已複製戰績"); }
async function shareAchievements() { await copyText($("achievementSummary").textContent || "我正在玩合約橋牌網頁版！"); toast("已複製成就"); }
function collectLocalData() {
  return { build: BUILD, exportedAt: new Date().toISOString(), settings: Object.fromEntries(Object.values(STORAGE).map((key) => [key, localStorage.getItem(key)])) };
}
async function exportLocalData() { await copyText(JSON.stringify(collectLocalData(), null, 2)); toast("已複製本機資料 JSON"); }
function restoreLocalDataFromDialog() {
  try {
    const data = JSON.parse($("importDataText").value || "{}");
    for (const [key, value] of Object.entries(data.settings || {})) if (value != null) localStorage.setItem(key, value);
    toast("資料已還原，將重新整理");
    setTimeout(() => location.reload(), 500);
  } catch { toast("JSON 格式不正確"); }
}
async function copyErrorReport() {
  const report = { build: BUILD, userAgent: navigator.userAgent, room: appState.roomCode, connected: appState.connected, status: appState.room?.meta?.status, time: new Date().toISOString() };
  await copyText(JSON.stringify(report, null, 2));
  toast("已複製錯誤回報");
}
async function copySupportBundle() { await copyText(JSON.stringify({ report: collectLocalData(), room: appState.room, build: BUILD }, null, 2)); toast("已複製維護包"); }
function resetLocalData() { if (confirm("確定要重置本機資料？")) { Object.values(STORAGE).forEach((k) => localStorage.removeItem(k)); location.reload(); } }

function runDiagnostics() {
  const items = [
    ["版本", true, BUILD],
    ["Service Worker", "serviceWorker" in navigator, "serviceWorker" in navigator ? "支援" : "不支援"],
    ["Clipboard", Boolean(navigator.clipboard), Boolean(navigator.clipboard) ? "支援" : "不支援"],
    ["Firebase", appState.connected, appState.connected ? "已連線" : "尚未連線"],
    ["目前模式", true, appState.room?.game ? modeLabel(appState.room.game.mode) : "尚未開局"]
  ];
  $("diagnosticStatus").innerHTML = items.map(([k, ok, v]) => `${ok ? "✅" : "⚠️"} ${k}：${v}`).join("<br>");
  toast("系統測試完成");
}
async function runAiHealthCheck() {
  const rounds = Number($("aiTestRounds").value || 4);
  const status = $("aiTestStatus");
  let ok = 0;
  let failures = 0;
  for (let i = 0; i < rounds; i++) {
    try {
      const room = {
        lobby: {
          dealer: i % 4,
          boardNo: i + 1,
          settings: { mode: i % 2 ? "closed" : "standard", vulnerability: "cycle", difficulty: 12, showAiThoughts: false },
          seats: { 0: makeSeat(0, "b0", "AI-N", "bot"), 1: makeSeat(1, "b1", "AI-E", "bot"), 2: makeSeat(2, "b2", "AI-S", "bot"), 3: makeSeat(3, "b3", "AI-W", "bot") }
        }
      };
      const game = createNewGame(room);
      let guard = 0;
      while (game.phase !== "scoring" && guard++ < 300) {
        if (game.phase === "trickPause") {
          finishPendingTrick(game, true);
          continue;
        }
        const controller = controllingSeatForCurrentAction(game);
        const action = chooseBotAction(game, controller, room.lobby);
        if (!action) throw new Error("AI 沒有可執行動作");
        const res = applyAction(game, { ...action, uid: `b${controller}`, actorSeat: controller, createdAt: Date.now() }, room.lobby);
        if (!res.ok) throw new Error(res.message);
      }
      if (game.phase !== "scoring") throw new Error("未能結束");
      ok++;
    } catch (e) {
      console.error(e);
      failures++;
    }
  }
  status.textContent = `AI 測試完成：${ok}/${rounds} 局正常，失敗 ${failures}。`;
}

function renderReleaseChecklist() {
  const saved = JSON.parse(localStorage.getItem(STORAGE.checklist) || "{}");
  const items = ["單人標準模式可完成一副", "單人閉手變體可完成一副", "Firebase 可建立房間", "4 個真人或電腦可入座", "QR Code / 邀請連結可加入", "夢家在標準模式首攻後才亮牌", "閉手模式同伴牌不亮", "回放與統計正常", "PWA 快取更新正常"];
  $("releaseChecklistBody").innerHTML = items.map((text, idx) => `<label class="checklist-item"><input type="checkbox" data-checklist="${idx}" ${saved[idx] ? "checked" : ""}> ${escapeHtml(text)}</label>`).join("");
  document.querySelectorAll("[data-checklist]").forEach((el) => el.addEventListener("change", () => {
    const next = {};
    document.querySelectorAll("[data-checklist]").forEach((box) => { next[box.dataset.checklist] = box.checked; });
    localStorage.setItem(STORAGE.checklist, JSON.stringify(next));
  }));
}
async function copyReleaseChecklistResult() { await copyText($("releaseChecklistBody").innerText); toast("已複製測試清單"); }
function resetReleaseChecklist() { localStorage.removeItem(STORAGE.checklist); renderReleaseChecklist(); }
function openPublicStatusDialog() {
  const rows = [
    ["版本", BUILD],
    ["網址", location.href],
    ["Firebase", appState.connected ? "已連線" : "未連線"],
    ["PWA", "serviceWorker" in navigator ? "支援" : "不支援"],
    ["模式", "標準夢家＋閉手變體"]
  ];
  $("publicStatusBody").innerHTML = rows.map(([k, v]) => `<div class="status-item"><b>${escapeHtml(k)}</b><p>${escapeHtml(v)}</p></div>`).join("");
  $("publicStatusDialog").showModal();
}
async function copyPublicStatusReport() { await copyText($("publicStatusBody").innerText); toast("已複製狀態報告"); }
async function copyPublicGameLink() { await copyText(`${location.origin}${location.pathname}`); toast("已複製公開網址"); }
async function copyPublicIntroText() {
  await copyText(`合約橋牌網頁版：支援標準夢家亮牌、閉手四人暗牌變體、單人離線與 Firebase 4 人開房間。${location.origin}${location.pathname}`);
  toast("已複製介紹文");
}
function openShareKitDialog() {
  const url = `${location.origin}${location.pathname}`;
  $("shareKitShort").value = `一起玩合約橋牌：${url}`;
  $("shareKitLong").value = `合約橋牌網頁版\n・標準模式：首攻後夢家亮牌，莊家指揮夢家\n・變體模式：取消夢家，四手暗牌各自出牌\n・支援單人離線、Firebase 開房間、4 位真人、電腦補位與回放\n${url}`;
  $("shareKitFox").value = `<a href="${url}">合約橋牌｜標準夢家・閉手變體・多人房間</a>`;
  $("shareKitDialog").showModal();
}
async function copyShareKitText(kind) { await copyText($(`shareKit${kind === "short" ? "Short" : kind === "long" ? "Long" : "Fox"}`).value); toast("已複製分享素材"); }
async function copyRoomMaintenanceSummary() {
  const room = appState.room;
  await copyText(JSON.stringify({ code: room?.meta?.code, status: room?.meta?.status, seats: room?.lobby?.seats, settings: room?.lobby?.settings }, null, 2));
  toast("已複製房間維護摘要");
}

function handRecordText(game = currentGame(), room = appState.room) {
  if (!game) return "尚未有牌局。";
  normalizeGame(game);
  const lines = [];
  lines.push(`合約橋牌牌譜｜${BUILD}`);
  lines.push(`房間：${room?.meta?.code || (appState.offline ? "OFFLINE" : "未知")}`);
  lines.push(`第 ${game.boardNo} 副｜發牌：${SEATS[game.dealer]?.key || "?"} ${seatName(game.dealer)}｜身價：${vulnerabilityLabel(game.vulnerability)}｜模式：${modeLabel(game.mode)}`);
  lines.push(`合約：${game.contract ? contractText(game.contract, game.declarer) : "Passed out / 尚未成立"}`);
  if (game.contract) lines.push(`莊家：${SEATS[game.declarer].key} ${seatName(game.declarer)}｜${game.mode === "standard" ? "夢家" : "同伴"}：${SEATS[game.dummy].key} ${seatName(game.dummy)}｜目標：${6 + game.contract.level} 墩`);
  lines.push(`墩數：NS ${game.tricksWon?.NS || 0}｜EW ${game.tricksWon?.EW || 0}`);
  if (game.result?.summary) lines.push(`結果：${game.result.summary}`);
  lines.push("");
  lines.push("四家手牌：");
  for (const seat of [0, 1, 2, 3]) lines.push(`${SEATS[seat].key} ${seatName(seat)}：${handBySuitText(game.hands?.[seat] || [])}（${handHcp(game.hands?.[seat] || [])} HCP）`);
  lines.push("");
  lines.push("叫牌：");
  const auction = listFromFirebase(game.auction);
  lines.push(auction.length ? auction.map((c) => `${SEATS[c.seat]?.key || "?"}:${callText(c)}`).join("  ") : "尚未叫牌");
  lines.push("");
  lines.push("出牌：");
  const tricks = listFromFirebase(game.trickHistory);
  if (!tricks.length && game.currentTrick?.length) lines.push(`進行中：${game.currentTrick.map((p) => `${SEATS[p.seat].key} ${p.card.label}`).join("  ")}`);
  for (const trick of tricks) {
    const plays = listFromFirebase(trick.plays).map((p) => `${SEATS[p.seat].key} ${p.card.label}`).join("  ");
    lines.push(`${String(trick.no).padStart(2, "0")}. ${plays}  ｜贏家 ${SEATS[trick.winner]?.key || "?"} ${trick.team || ""}`);
  }
  return lines.join("\n");
}
function handBySuitText(hand) {
  const bySuit = { S: [], H: [], D: [], C: [] };
  for (const card of sortHand([...hand])) bySuit[card.suit]?.push(card.rank);
  return ["S", "H", "D", "C"].map((suit) => `${SUITS[suit].symbol}${bySuit[suit].join("") || "—"}`).join(" ");
}
async function copyCurrentHandRecord() {
  await copyText(handRecordText(currentGame(), appState.room));
  toast("已複製完整牌譜");
}
function openReplayDialog(game) {
  if (!game) return;
  normalizeGame(game);
  $("replaySummary").innerHTML = colorizeSuitsHtml(game.result?.summary || `${contractText(game.contract, game.declarer)}｜${modeLabel(game.mode)}`);
  const tricks = listFromFirebase(game.trickHistory);
  $("replayList").innerHTML = [
    `<div class="replay-item"><b>牌局資訊</b><div class="plays"><span>${modeLabel(game.mode)}</span><span>${vulnerabilityLabel(game.vulnerability)}</span><span>${colorizeSuitsHtml(game.contract ? contractText(game.contract, game.declarer) : "尚未成立")}</span></div></div>`,
    ...(tricks.length ? tricks.map((trick) => `
      <div class="replay-item">
        <b>第 ${trick.no} 墩：${seatName(trick.winner)} 贏得（${trick.team}）</b>
        <div class="plays">${listFromFirebase(trick.plays).map((p) => `<span>${seatName(p.seat)} ${cardTextHtml(p.card)}</span>`).join("｜")}</div>
      </div>
    `) : [`<div class="replay-item">沒有打牌紀錄。</div>`])
  ].join("");
  $("replayDialog").showModal();
}
async function shareReplay() { await copyText($("replaySummary").textContent + "\n" + $("replayList").innerText); toast("已複製回放摘要"); }

function playSfx(kind) {
  if (!getBool(STORAGE.sound, false)) return;
  try {
    appState.audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const ctx = appState.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const profile = loadSetting(STORAGE.soundProfile, "soft");
    const base = kind === "success" ? 660 : kind === "fail" ? 180 : kind === "start" ? 440 : 300;
    osc.frequency.value = profile === "arcade" ? base * 1.35 : profile === "classic" ? base : base * .8;
    gain.gain.value = .04;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .12);
    osc.stop(ctx.currentTime + .13);
  } catch {}
}
function vibrate(pattern) { if (getBool(STORAGE.vibration, false) && navigator.vibrate) navigator.vibrate(pattern); }
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.add("hidden"), 2200);
}
async function clearPwaCachesAndReload() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  toast("已清除快取，準備重新整理");
  setTimeout(() => location.reload(), 800);
}
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) showUpdateBanner(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdateBanner(worker);
        });
      });
    }).catch((error) => console.warn("Service worker registration failed", error));
  });
}
function showUpdateBanner(worker) { appState.updateWorker = worker; $("updateBanner").classList.remove("hidden"); }
function reloadForUpdate() { if (appState.updateWorker) appState.updateWorker.postMessage({ type: "SKIP_WAITING" }); else location.reload(); }

registerServiceWorker();
init();
