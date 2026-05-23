## v1.0.23 — 測試、部署檢查、AI 第三版、正式大廳與教學第三章

- 新增四座位視角模擬：一台裝置可切換 N/E/S/W / 觀戰視角。
- 新增 Firebase 部署檢查器：協助確認 Auth、Database、私人手牌與 action queue 路徑。
- 升級出牌 AI 第三版：莊家計畫、防守首攻、夢家可見防守、最小贏張與保留進手。
- 大廳新增準備、鎖座、清空座位、轉讓房主與 AI 補位開關。
- 新增新手教學第三章：王牌、無王、將吃與夢家。

# v1.0.22 更新重點

- Firebase rules 正式強化：`database.rules.json` 已改成正式防作弊部署取向，分流公開房間資料、每席私人手牌、action queue、撤銷快照與房主 / 仲裁者權限。
- 房主 / 仲裁者轉移再強化：房主離線需超過安全等待時間才會交易式轉移，並寫入 hostTransferLog，降低短暫網路抖動造成雙房主風險。
- Chicago 賽制可選 4 / 8 / 12 / 16 副，分數區與賽後報告會列出每副合約、結果、分數、累計分、勝方與分差。
- 新手教學任務第二章：合約與成局，練習合約目標、王牌 / 無王、成局線與最後計分。
- 手機橫向與底部安全區細修：橫向模式重新配置左右區塊，並避開 iOS / Android 底部工具列。

# 合約橋牌版本紀錄

## v1.0.22-rules-arbiter-chicago-tutorial-mobile

- Firebase rules 正式強化，主規則檔改為座位私人手牌、action 提交、房主 / 仲裁者處理、roomUndo 快照的正式權限範例。
- 房主 / 仲裁者轉移再強化：原房主離線需超過安全等待時間才由下一位在線真人以 transaction 接手，並寫入 `meta.hostTransferLog`。
- Chicago 計分模式可選 4 / 8 / 12 / 16 副，身價依四副循環，賽後總結列出每副合約、結果、分數與累計分。
- 新增新手教學任務第二章：合約與成局。
- 手機橫向模式與底部安全區細修，降低手牌、結果視窗與紀錄抽屜被瀏覽器工具列遮住的機率。
- Service Worker 快取版本更新為 `contract-bridge-v1-0-22-rules-arbiter-chicago-tutorial-mobile`。

## v1.0.20-host-failover-chicago-mobile-diagnostics
- 新增房主離線自動轉移，仍在線的真人座位可接任房主 / 仲裁者，讓 action queue 不會因原房主離線而卡住。
- action queue 加入 transaction 處理鎖、clientActionId 與 processedActions，避免重連或連點造成同一叫牌 / 出牌重複處理。
- Chicago 四副制新增完整賽後總結，包含四副明細、總分、勝方與分差。
- 房主工具新增撤銷整墩、撤銷到叫牌結束，並保留重打本副與撤銷上一動作。
- 手機版牌桌改成更適合手機操作的布局：手牌固定底部、牌桌縮放、叫牌與操作更容易點。
- 錯誤回報新增 JSON 快照下載與 Firebase 診斷資訊。
- Service Worker 快取版本更新為 `contract-bridge-v1-0-20-host-failover-chicago-mobile-diagnostics`。

## v1.0.19-secure-actions-chicago-undo-report

- 多人牌局正式拆分公開狀態與私人手牌：公開 `rooms/{code}/game` 不再保存四家 `hands` / `initialHands`，改由 `roomPrivateHands/{code}/{seat}` 保存目前手牌與原始手牌。
- `updateRoom()` 在多人寫入 `game` 時會自動拆成 public game + private hand payload；玩家畫面只 hydrate 自己、公開夢家與結束後公開的手牌。
- 新增動作提交 / 合法性驗證第一版：玩家送出 intent 到 `rooms/{code}/actions`，房主端檢查 UID、actorSeat、目前輪到者、叫品合法性與跟牌規則後才更新牌局。
- 新增 `actionAudit`，被拒絕的不合法動作會留下原因，方便除錯。
- 新增 Chicago 四副制與總分表，房間設定可選單副練習或 Chicago 四副制。
- 房主新增「撤銷上一動作」與「重打本副」。撤銷快照寫到 `roomUndo/{code}`，避免把完整手牌放在公開房間節點。
- 新增詳細錯誤回報，包含目前公開狀態、健康檢查、最近 log、action audit、match 分數與版本資訊。
- 更新 `database.rules.json` 與 `database.rules.secure.example.json`，加入 `roomPrivateHands` 與 `roomUndo` 路徑。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-19-secure-actions-chicago-undo-report`。

## v1.0.18-secure-ai-replay-drawer

- 新增防作弊資料拆分設計文件 `ANTI_CHEAT_FIREBASE_DESIGN.md`，並更新 `database.rules.secure.example.json`。
- 牌局健康檢查新增防作弊拆分提醒：公開資料、私人手牌、夢家公開與部署注意事項。
- AI 叫牌升級為自然制第一版：五張高花、1NT 15–17、強 2♣、弱二、阻擊、支持同伴、競叫、Double。
- 教練建議與 AI 思路紀錄改用自然制理由，玩家能看到建議叫品背後的 HCP / 牌型 / 配合邏輯。
- 牌局回放升級為逐步回放，支援上一步、下一步、自動播放、桌面目前最大牌與當時剩餘手牌。
- 手機版右側紀錄區改成分頁抽屜：工具、叫牌、檢討、出牌、紀錄。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-18-secure-ai-replay-drawer`。

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

## v1.0.5-ai-human-delay
- AI 叫牌與出牌改為等待 2 秒後才執行，讓電腦玩家節奏更像真人。
- 真人玩家操作不延遲；只有座位類型為電腦時才套用等待。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-5-ai-human-delay`。

## v1.0.4-red-suits-on-table
- 修正牌桌座位區的小牌顯示，紅心與方塊現在會以紅色呈現。
- 保留黑桃與梅花為黑色，包含牌桌可見手牌與夢家小牌。
- 更新 Service Worker 快取版本為 `contract-bridge-v1-0-4-red-suits-on-table`。

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

## v1.0.24-debug-bidding-replay-stats-mobile

- 新增實戰測試紀錄器，能下載 `debug-report.json`，包含最近進房、開局、叫牌、出牌、結算與同步事件。
- 新增叫牌制度選項：新手自然制、SAYC 風格、簡化模式、教學模式；簡化模式不使用 Double / Redouble。
- 回放升級：可逐墩跳轉、調整播放速度，並在每一步顯示當時合法牌與教練建議。
- 本機統計升級為牌局歷史與個人統計，可追蹤成約率、常見合約、Chicago / 單副模式、滿貫與最高分差。
- 手機操作細修：手機預設開啟出牌前確認，叫牌按鈕加大，手牌滑動與底部安全區更穩。
