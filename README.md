# 合約橋牌 v1.0.23 更新

本版新增五項重點：

- 四人實機測試 / 座位視角模擬模式：可在一台裝置切換北、東、南、西或觀戰視角，方便檢查防作弊視角與 UI。
- Firebase 部署檢查器：可檢查 Auth、Realtime Database、私人手牌與 action queue 基礎路徑。
- 出牌 AI 第三版：加入莊家抽王 / 長門計畫、防家首攻、夢家可見時調整防守、保留進手與最小贏張等改良。
- 房間大廳正式化：玩家準備、鎖座、清空座位、手動轉讓房主、AI 補位開關。
- 新手教學任務第三章：王牌與夢家，說明王牌、無王、將吃、跟牌限制、夢家亮牌與閉手變體。

> 版本號：`bridge-v1.0.23-test-deploy-ai3-lobby-tutorial`

# v1.0.22 更新重點

- Firebase rules 正式強化：`database.rules.json` 已改成正式防作弊部署取向，分流公開房間資料、每席私人手牌、action queue、撤銷快照與房主 / 仲裁者權限。
- 房主 / 仲裁者轉移再強化：房主離線需超過安全等待時間才會交易式轉移，並寫入 hostTransferLog，降低短暫網路抖動造成雙房主風險。
- Chicago 賽制可選 4 / 8 / 12 / 16 副，分數區與賽後報告會列出每副合約、結果、分數、累計分、勝方與分差。
- 新手教學任務第二章：合約與成局，練習合約目標、王牌 / 無王、成局線與最後計分。
- 手機橫向與底部安全區細修：橫向模式重新配置左右區塊，並避開 iOS / Android 底部工具列。

# 合約橋牌｜標準夢家・閉手變體・Firebase 多人房間

這個版本由原本的「拿破崙與秘書」網頁遊戲改成 4 人合約橋牌。保留原專案的靜態網站部署方式、PWA、Firebase 開房間、QR 邀請、觀戰、電腦補位、分享、統計、備份與維護工具。

## 最新版本 v1.0.22-rules-arbiter-chicago-tutorial-mobile

- Firebase rules 正式強化：`database.rules.json` / `database.rules.secure.example.json` 都已更新，支援私人手牌、action queue、房主 / 仲裁者與撤銷快照的權限分流。
- 房主 / 仲裁者轉移再強化：短暫斷線不會立刻轉移；離線超過安全等待時間後，下一位在線真人以 transaction 接手，並留下 hostTransferLog。
- Chicago 支援 4 / 8 / 12 / 16 副，可顯示每副合約、結果、分數、累計分與整輪勝方。
- 新手教學任務第二章：合約與成局，帶玩家理解 6 + 階數、王牌 / 無王、部分合約、成局與結算。
- 手機橫向模式與底部安全區細修，降低手牌、紀錄抽屜、結果視窗被 Safari / Chrome 底部工具列遮住的機率。

## 遊戲模式

### 標準模式：夢家亮牌

這是正式合約橋牌的核心流程：

1. 四人叫牌，最後叫價後三家 Pass 成立合約。
2. 莊家左手邊防家首攻。
3. 首攻翻開後，夢家亮牌。
4. 莊家同時指揮自己與夢家兩手牌。
5. 防家各自出牌，13 墩後自動計分。

### 變體模式：取消夢家，四手暗牌各自出牌

這是依需求新增的休閒變體，不是正式合約橋牌：

1. 叫牌、合約、跟牌、王牌與計分沿用合約橋牌。
2. 首攻後不亮夢家。
3. 四位玩家都只看自己的牌。
4. 輪到誰就由該座位自行出牌，莊家不能指揮同伴。

## 多人模式

多人模式沿用 Firebase Realtime Database 與 Anonymous Auth。

流程：

1. 點「連線 Firebase」。
2. 房主點「建立新房」。
3. 朋友用房號、邀請連結或 QR Code 加入。
4. 四個座位為北、東、南、西；南北一隊，東西一隊。
5. 人數不足時房主可以補電腦。
6. 房主開始對戰。

> 注意：v1.0.22 將 `database.rules.json` 調整為正式防作弊部署取向。多人牌局使用 `rooms/{code}/game` 公開狀態 + `roomPrivateHands/{code}/{seat}` 私人手牌；一般玩家只能提交自己的 action、讀自己的私人手牌，房主 / 仲裁者負責驗證與推進。純前端仍信任房主裝置；競賽級防作弊仍建議 Cloud Functions 或可信伺服器。

## 單人離線

點「單人離線開始」即可用南家玩家 + 3 位電腦開局。不需要 Firebase。

## 體驗功能

- 可調整遊戲節奏：0.8 秒快速、1.2 秒偏快、2 秒標準、3 秒看清楚、5 秒教學慢速。
- 節奏會同時影響 AI 叫牌、AI 出牌與每墩清桌等待。
- 牌局中會顯示局勢摘要、目前輪到誰、52 張牌進度、合約方還差幾墩。
- 瀏覽器標題會提示輪到你叫牌或出牌。

## 已實作規則

- 52 張牌，每人 13 張
- 叫牌：Pass、1♣ 到 7NT、Double、Redouble
- 合約成立：最後叫價後連續三家 Pass
- 四家一開始都 Pass：該副不打
- 標準模式：首攻後夢家亮牌，由莊家指揮夢家
- 變體模式：夢家不亮牌，四手暗牌自行出牌
- 跟牌規則：能跟首引花色必須跟
- 王牌／無王判定
- 13 墩完成後自動計分
- 身價：可固定、依牌號循環，或 Chicago 四副制循環
- 部分合約、成局、滿貫、超墩、倒約、Double / Redouble 計分
- 單副練習與 Chicago 四副制總分

## 本機測試

```bash
python3 -m http.server 8080
```

開啟：

```text
http://localhost:8080
```

## 部署

可直接部署到 GitHub Pages。若使用多人模式，請確認：

- Firebase Anonymous Authentication 已啟用
- Realtime Database 已建立
- GitHub Pages 網域已加入 Firebase 授權網域
- `database.rules.json` 已部署或依安全需求調整

## 主要檔案

- `index.html`：畫面與對話框
- `style.css`：主題、牌桌、手機版面
- `app.js`：橋牌規則、AI、Firebase 多人同步與 UI
- `database.rules.json`：Realtime Database 規則
- `manifest.webmanifest` / `service-worker.js`：PWA


## v1.0.7：紀錄表、在線狀態與斷線恢復

- 新增叫牌紀錄表，固定以 W / N / E / S 欄位顯示完整叫牌流程。
- 新增每墩出牌紀錄，可查看每墩首攻、四家出牌與贏墩者。
- 強化合法出牌提示：輪到玩家出牌時，合法牌會高亮上移，不能出的牌會明顯變灰。
- 新增房間玩家在線 / 離線狀態與最後同步時間。
- 新增斷線恢復座位：房間網址會保留 `?room=房號`，重新整理或重新開啟同一連結會用本機 clientId 恢復原座位。

## v1.0.6：本墩清桌延遲

- 出完一墩四張牌後，牌桌停留 2 秒才清桌。
- 停留期間暫停下一個出牌動作，讓玩家看清楚最後一位出了哪張牌。
- 保留 AI 叫牌與出牌 2 秒延遲。

## v1.0.2：叫牌控制修正

- 在手牌區新增「叫牌操作」面板，輪到你叫牌時會直接顯示 Pass、Double、Redouble 與 1–7 階叫價按鈕。
- 左側操作區與手牌區同步顯示叫牌控制，方便桌機與手機操作。
- Service Worker 快取版本已更新，部署後請重新整理或清除網站快取。

## v1.0.1：QR Code 邀請修正

- 掃描 `?room=房號` 的邀請連結後，會自動連線 Firebase 並加入房間，不再只把房號填入輸入框。
- 邀請連結同時支援 `room`、`r`、`code` 參數，並支援 query 與 hash 形式。
- Service Worker 快取版本已更新，部署後請重新整理一次讓新版本生效。



## v1.0.13 更新

- 新增可調整遊戲節奏，單人與多人都可選 0.8 秒、1.2 秒、2 秒、3 秒或 5 秒。
- 節奏會同時控制 AI 叫牌、AI 出牌與清桌等待。
- 新增局勢摘要：目前輪到誰、牌局進度、合約方還差幾墩、剩餘墩數。
- 瀏覽器標題會提示輪到你叫牌或出牌。

## v1.0.10 更新

- 桌面上已出的牌會自動判斷目前暫時贏家的牌。
- 依首攻花色與王牌判斷「目前最大」牌，該牌會放大、高亮並標示「目前最大」。
- 牌桌中央同步顯示目前最大牌是哪一家出的哪張牌。

## v1.0.9 更新

- 修正手機版本局結果視窗底部被系統導航列截掉。
- 結果視窗在小螢幕會限制最大高度並可捲動。
- 結果按鈕區在手機上固定於彈窗底部，保留安全區域。

## v1.0.8 更新

- 新增手牌牌力摘要：HCP、四門牌型、角色與合法出牌數。
- AI 思路紀錄正式生效，可在房間設定中開關。
- 新增「複製完整牌譜」，包含牌號、身價、四家手牌、叫牌、出牌與結果，方便分享與除錯。
- 結果畫面新增計分明細。


## v1.0.12 更新

- AI 叫牌等待時間由 3 秒改為 2 秒。
- AI 出牌等待時間由 3 秒改為 2 秒。
- 一墩四張牌出完後，桌面清桌等待時間由 3 秒改為 2 秒。

## v1.0.11 更新

- 全域修正花色顏色，凡 UI 中出現紅心 ♥ 或方塊 ♦ 都會顯示紅色。
- 覆蓋牌桌、手牌、叫牌按鈕、叫牌紀錄、每墩紀錄、提示、紀錄、結果視窗與回放。
- 黑桃 ♠ 與梅花 ♣ 維持黑色。


## v1.0.24.3 start fallback hotfix

- Rebased from the stable v1.0.23 line.
- Fixed multiplayer Start Game failure diagnostics.
- If Firebase rules still do not allow `roomPrivateHands` writes, the host will fall back to a legacy public-hands compatibility mode and show a warning instead of silently failing.
- Added visible failure messages in the lobby when start fails.
- Updated cache version and cache-busting query strings.
