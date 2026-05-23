# v1.0.22 更新重點

- Firebase rules 正式強化：`database.rules.json` 已改成正式防作弊部署取向，分流公開房間資料、每席私人手牌、action queue、撤銷快照與房主 / 仲裁者權限。
- 房主 / 仲裁者轉移再強化：房主離線需超過安全等待時間才會交易式轉移，並寫入 hostTransferLog，降低短暫網路抖動造成雙房主風險。
- Chicago 賽制可選 4 / 8 / 12 / 16 副，分數區與賽後報告會列出每副合約、結果、分數、累計分、勝方與分差。
- 新手教學任務第二章：合約與成局，練習合約目標、王牌 / 無王、成局線與最後計分。
- 手機橫向與底部安全區細修：橫向模式重新配置左右區塊，並避開 iOS / Android 底部工具列。

# v1.0.20 防作弊資料拆分與 action 仲裁

本版已把多人真人局從「公開整份房間狀態」改成「公開牌局狀態 + 各座位私人手牌」。仍保留純前端房主仲裁，因此可防止一般非房主玩家讀取公開房間節點偷看手牌，但競賽級防作弊仍需要可信伺服器或 Cloud Functions。

## 建議資料路徑

```text
rooms/{code}
  meta, lobby, game, actions, actionAudit, match
roomPrivateHands/{code}/{seat}
  current: 該座位目前手牌
  initial: 該座位原始手牌
roomUndo/{code}
  publicGame + privateHands snapshot：房主撤銷上一動作用
```

## 公開資料

- 房號、房主、座位、在線狀態
- 模式、身價、牌號、合約、莊家、夢家狀態
- 完整叫牌紀錄
- 桌面目前出的牌、已完成的墩、墩數、分數
- 牌局結束後的回放與完整牌譜

## 私人資料

- 每個真人座位只能讀取自己的 `privateHands/{seat}`
- 標準模式中，夢家牌只在首攻翻開後放到公開 reveal
- 閉手變體中，同伴牌全程不公開，直到牌局結束或回放設定允許
- 觀戰者不讀取任何未公開手牌

## 本版已做

- UI 層只顯示授權手牌：自己、首攻後的夢家、結束後回放。
- 牌局健康檢查會顯示防作弊資料拆分設計提醒。
- `database.rules.secure.example.json` 提供 split path、action 提交、房主處理 action 與房主轉移的規則範例。
- `initialHands` 保留牌譜 / 回放用途，牌局結束後才應對所有玩家公開。

## 部署提醒

目前主程式仍保留相容舊版的 `rooms/{room}/game` 結構，方便既有 GitHub Pages 直接使用。若要達到真正防止開發者工具偷看手牌，下一步要把多人訂閱改成：

1. 訂閱 `rooms/{room}/public`
2. 真人玩家只額外訂閱自己的 `rooms/{room}/privateHands/{seat}`
3. 房主 / 裁判流程用 Cloud Function 或受限 host 權限處理動作驗證
4. 部署 `database.rules.secure.example.json` 並停用父節點公開讀取



## v1.0.20 新增仲裁保護

- 每個真人 action 都帶 `clientActionId`，用來辨識同一裝置的重試 / 連點。
- 房主處理 action 前會用 Realtime Database transaction 將 action 標記為 `processing`，避免兩個仲裁者同時處理。
- 牌局會保存最近一批 `processedActions` 指紋，若同一 action 又出現會寫入 actionAudit 並忽略。
- 原房主離線時，仍在線的真人玩家會自動接任 `meta.hostUid`，牌局可繼續驗證與推進。

限制：純前端仲裁仍然信任目前房主瀏覽器；若要競賽級防作弊，仍建議將 action 驗證移到 Cloud Functions 或可信伺服器。

## v1.0.22 規則強化

- `database.rules.json` 已改成正式強化版，不再只是寬鬆測試版。
- `rooms/{code}/actions` 只允許座位本人提交自己的叫牌 / 出牌意圖；房主 / 仲裁者可 claim、驗證、移除與寫入 audit。
- `roomPrivateHands/{code}/{seat}` 只允許該座位本人讀取；房主 / 仲裁者為了發牌、撤銷與驗證可讀寫；觀戰者不能讀取未公開手牌。
- `roomUndo/{code}` 只允許房主 / 仲裁者讀寫，避免撤銷快照被一般玩家讀取。
- `meta.hostUid` / `meta.arbiterUid` 由交易式房主轉移流程寫入，UI 會顯示房主與仲裁者並保留 `hostTransferLog`。

仍需注意：這是純前端仲裁的最強化版本之一，房主瀏覽器仍被信任；若要競賽級防作弊，請將 action 驗證移到 Cloud Functions 或自有伺服器。
