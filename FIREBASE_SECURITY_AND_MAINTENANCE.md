# v1.0.22 更新重點

- Firebase rules 正式強化：`database.rules.json` 已改成正式防作弊部署取向，分流公開房間資料、每席私人手牌、action queue、撤銷快照與房主 / 仲裁者權限。
- 房主 / 仲裁者轉移再強化：房主離線需超過安全等待時間才會交易式轉移，並寫入 hostTransferLog，降低短暫網路抖動造成雙房主風險。
- Chicago 賽制可選 4 / 8 / 12 / 16 副，分數區與賽後報告會列出每副合約、結果、分數、累計分、勝方與分差。
- 新手教學任務第二章：合約與成局，練習合約目標、王牌 / 無王、成局線與最後計分。
- 手機橫向與底部安全區細修：橫向模式重新配置左右區塊，並避開 iOS / Android 底部工具列。

# Firebase 安全與維護

## 目前相容模式

`database.rules.json` 是一般測試用規則，可支援 GitHub Pages 單頁版本與新版 `roomPrivateHands` / `roomUndo` 路徑。這個模式方便部署與測試，但讀取限制較寬鬆。

## v1.0.20 防作弊拆分與房主仲裁強化

詳見 `ANTI_CHEAT_FIREBASE_DESIGN.md`。目前資料路徑為：

- `rooms/{code}`：公開房間、座位、叫牌、合約、桌面牌、出牌紀錄、總分、actions、actionAudit。
- `roomPrivateHands/{code}/{seat}`：該座位目前手牌與原始手牌。
- `roomUndo/{code}`：房主撤銷上一動作用的私有快照。

多人牌局寫入 `game` 時，前端會自動拆成公開 game 與 private hand payload。玩家送出叫牌 / 出牌 intent 後，由房主端驗證 UID、座位、輪到者、合法叫牌與跟牌規則，再更新公開狀態。v1.0.20 起，每個 action 會帶 clientActionId，房主端會以 transaction 標記 processing 並在 game.processedActions 中記錄已處理動作，降低重複處理風險。

若要限制非房主讀取其他座位手牌，請部署 `database.rules.secure.example.json`。限制：純前端仍信任房主裝置；公開競賽級防作弊需要 Cloud Functions 或可信後端。

## 建議維護

1. 開啟 Anonymous Auth。
2. Realtime Database 放在與玩家接近的區域。
3. GitHub Pages 網域加入 Firebase 授權網域。
4. 上線真人局前，優先測試手機瀏覽器重連、QR 加入房間與 Service Worker 快取更新。
5. 部署新版時同步更新 `database.rules.json`，否則 `roomPrivateHands` / `roomUndo` 寫入可能失敗。
6. 定期清除超過 `expiresAt` 的舊房間、`roomPrivateHands` 與 `roomUndo`。


## v1.0.20 房主轉移與診斷

- 若 `meta.hostUid` 對應的座位離線或不在座位中，仍在線的真人座位會自動接任房主 / 仲裁者。
- 房主轉移會寫入 `meta.hostTransferredAt` 與 `meta.hostTransferReason`。
- 錯誤回報 JSON 會包含 Firebase 診斷：目前是否為房主、房主座位是否在線、待處理 actions 數量、拒絕動作數、房間 schema 與版本。
- 若要使用 `database.rules.secure.example.json`，請確認 rules 允許房主 claim / remove `actions/{id}`，也允許新房主在原房主離線時更新 `meta.hostUid`。

## v1.0.22 正式強化 rules 部署提醒

- 本版 `database.rules.json` 已等同正式強化版，部署前請先在測試資料庫測試建立房間、加入房間、叫牌、出牌、房主撤銷與重連。
- 若升級後出現「私人手牌同步失敗」，通常是 Firebase rules 尚未更新，或玩家匿名登入 UID 與座位 UID 不一致；請先複製錯誤回報 JSON 檢查 `firebase` 與 `seats` 欄位。
- 房主 / 仲裁者轉移不會因短暫抖動立刻發生；原房主離線超過安全等待時間後，下一位在線真人才會嘗試 transaction 接手。
- Chicago 8 / 12 / 16 副會重複四副身價循環，請確認房間設定與賽後報告的副數一致。
