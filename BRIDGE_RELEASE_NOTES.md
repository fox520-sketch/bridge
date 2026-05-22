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

- 一墩四張牌出完後，牌桌會保留最後一墩 3 秒再自動收牌，方便看清最後一位玩家出了哪張牌。
- 暫停收牌期間會顯示「本墩完成」狀態，避免真人或 AI 立即進入下一墩。
- 保留 v1.0.5 的 AI 叫牌 / 出牌 3 秒真人模擬延遲。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-6-trick-clear-delay`。

# Bridge Firebase Game Release Notes

## v1.0.5-ai-human-delay
- AI 叫牌與出牌改為等待 3 秒後才執行，讓電腦玩家節奏更像真人。
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
