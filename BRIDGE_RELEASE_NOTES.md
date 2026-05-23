# 合約橋牌版本紀錄

## v1.0.17-mobile-safety-seat-tools

- 新增手機快速跳轉列，可一鍵跳到牌桌、操作、手牌與紀錄。
- 新增「出牌前確認」開關，選牌後需按確認才送出，降低手機誤觸。
- 新增手牌排序切換：花色排序、牌點排序、紅黑交錯。
- 牌桌座位新增發牌、有身價、首攻與本方墩數標示。
- 房主新增「立即處理等待」，可強制清桌或立即執行 AI 動作。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-17-mobile-safety-seat-tools`。

## v1.0.16-review-health-export

- 新增「牌局檢討」卡：即時顯示合約、合約方目標、目前已得墩數、剩餘墩數、是否已達標或是否已無法成約。
- 新增「牌局健康檢查」卡：檢查座位、52 張牌唯一性、階段、輪到者與房間代碼，方便多人同步除錯。
- 新增「下載 TXT」與結果視窗「下載牌譜」按鈕，可直接下載完整牌譜。
- 新增「複製檢討」按鈕，可快速分享本副牌檢討摘要。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-16-review-health-export`。

## v1.0.15-wait-countdown-offline-control

- 新增等待狀態卡：顯示目前行動者、真人 / AI / 離線狀態、AI 思考或收牌倒數。
- 遊戲畫面每秒刷新局勢摘要、房間玩家狀態、桌面目前最大牌與收牌倒數。
- 房主新增「接管目前輪到者」，方便只處理卡住的離線座位。
- 清理右側牌局紀錄重複摘要。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-15-wait-countdown-offline-control`。

# Bridge Firebase Game Release Notes

## v1.0.14-turn-alert-ingame-coach

- 新增「輪到你」醒目提示列，玩家輪到叫牌或出牌時會收到音效/震動提醒，並可一鍵跳到操作區。
- 新增教練建議卡：依目前手牌、叫牌與出牌局面提供建議叫品或建議出牌，支援一鍵套用。
- 房主/單人局可在牌局中調整本局節奏，AI 叫牌、AI 出牌與清桌等待會跟著更新。
- 牌局中新增複製邀請連結入口，方便中途邀請玩家或觀戰者。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-14-turn-alert-ingame-coach`。

# v1.0.13-pacing-progress-turn-title

- 新增「遊戲節奏」設定，可在單人離線與多人房間選擇 0.8 秒、1.2 秒、2 秒、3 秒或 5 秒。
- 節奏會同時控制 AI 叫牌、AI 出牌與一墩完成後清桌等待時間。
- 新增牌局左側「局勢摘要」，顯示目前輪到誰、52 張牌進度、合約方目前還差幾墩，以及剩餘墩數。
- 瀏覽器標題會在輪到你叫牌或出牌時顯示提示，手機切換視窗後更容易注意。
- 更新 Service Worker 快取版本。

# v1.0.12-two-second-pacing

- AI 叫牌等待時間由 3 秒改為 2 秒。
- AI 出牌等待時間由 3 秒改為 2 秒。
- 一墩四張牌出完後，桌面清桌等待時間由 3 秒改為 2 秒。
- 更新 Service Worker 快取版本。

# v1.0.11-global-red-suits

- 全域修正 UI 中的花色顏色：凡是顯示 ♥ 或 ♦ 都套用紅色。
- 套用範圍包含牌桌、手牌、叫牌按鈕、叫牌紀錄、每墩紀錄、提示、紀錄、結果視窗與回放。
- ♠ 與 ♣ 維持黑色，並更新 Service Worker 快取版本。

# v1.0.10-current-winning-card

- 新增桌面「目前最大牌」高亮。
- 每墩進行中，依首攻花色與王牌即時計算暫時贏家的牌。
- 該牌會放大、金色框線並顯示「目前最大」。
- 桌面中央狀態列顯示目前最大牌的座位與牌面。

# v1.0.9-mobile-result-scroll

- 修正手機版結果視窗過高時底部被 Android / iOS 導航列截掉。
- 結果彈窗改為受視窗高度限制，內容可垂直捲動。
- 手機版結果按鈕列加上底部安全區域與 sticky 固定，方便點擊「繼續／再玩一副」。
- 更新 Service Worker 快取版本。

# v1.0.8-ai-notes-hand-record

- 新增手牌牌力摘要。
- 啟用 AI 思路紀錄。
- 新增完整牌譜複製工具。
- 結果畫面顯示計分明細。

## v1.0.7-records-presence-reconnect

- 新增叫牌紀錄表，固定以 W / N / E / S 欄位顯示完整叫牌流程。
- 新增每墩出牌紀錄，會顯示每墩首攻、四家出牌、目前進行中墩與贏墩者。
- 強化合法出牌高亮與非法牌變灰，降低新手誤點。
- 新增房間玩家在線 / 離線狀態、最後同步時間，以及房主只接管離線真人座位。
- 加入本機 clientId 與房間網址保留，重新整理或斷線重開同一房間連結時會自動恢復原座位。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-7-records-presence-reconnect`。

## v1.0.6-trick-clear-delay

- 一墩四張牌出完後，牌桌會保留最後一墩 2 秒再自動收牌，方便看清最後一位玩家出了哪張牌。
- 暫停收牌期間會顯示「本墩完成」狀態，避免真人或 AI 立即進入下一墩。
- 保留 v1.0.5 的 AI 叫牌 / 出牌 2 秒真人模擬延遲。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-6-trick-clear-delay`。

# Bridge Firebase Game Release Notes

## v1.0.5-ai-human-delay
- AI 叫牌與出牌改為等待 2 秒後才執行，讓電腦玩家節奏更像真人。
- 真人玩家操作不延遲；只有座位類型為電腦時才套用等待。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-5-ai-human-delay`。

## v1.0.4-red-suits-on-table
- 修正牌桌座位區的小牌顯示，紅心與方塊現在會以紅色呈現。
- 保留黑桃與梅花為黑色，包含牌桌可見手牌與夢家小牌。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-4-red-suits-on-table`。

# Bridge Release Notes

## v1.0.3 - Firebase 陣列同步修正

- 修正 Firebase Realtime Database 在空陣列（例如尚未有人叫牌的 `auction`）同步後可能變成缺漏值，導致叫牌按鈕產生失敗。
- 新增房間資料正規化：叫牌紀錄、目前墩、墩史、手牌與記錄都會在渲染與處理動作前轉回陣列。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-3-firebase-array-normalize`。

## v1.0.2：叫牌控制修正

- 在手牌區新增「叫牌操作」面板，輪到你叫牌時會直接顯示 Pass、Double、Redouble 與 1–7 階叫價按鈕。
- 左側操作區也使用同一套叫牌控制，避免多人房間中左側面板未渲染時無法叫牌。
- 叫牌面板會顯示目前最高叫品、輪到哪一家，以及你所在座位，方便多人房間確認操作權。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-2-bidding-controls`。

## v1.0.1：QR Code 邀請修正

- 掃描 `?room=房號` 的邀請連結後，會自動連線 Firebase 並加入房間，不再只把房號填入輸入框。
- 邀請連結同時支援 `room`、`r`、`code` 參數，並支援 query 與 hash 形式。
- Service Worker 快取版本已更新，部署後請重新整理一次讓新版本生效。

## v1.0.0：橋牌 Firebase 版

- 改為 4 人合約橋牌。
- 新增標準夢家亮牌模式。
- 新增閉手四人暗牌變體模式。
- 保留 Firebase 開房間、觀戰、QR 邀請、電腦補位、PWA、統計、分享、備份、診斷與回放。
- 舊拿破崙規則與 5 人座位邏輯已移除。
