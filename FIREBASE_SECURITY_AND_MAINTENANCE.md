# Firebase 安全與維護

## 目前相容模式

`database.rules.json` 是一般測試用規則，可支援 GitHub Pages 單頁版本與新版 `roomPrivateHands` / `roomUndo` 路徑。這個模式方便部署與測試，但讀取限制較寬鬆。

## v1.0.19 防作弊拆分實作

詳見 `ANTI_CHEAT_FIREBASE_DESIGN.md`。目前資料路徑為：

- `rooms/{code}`：公開房間、座位、叫牌、合約、桌面牌、出牌紀錄、總分、actions、actionAudit。
- `roomPrivateHands/{code}/{seat}`：該座位目前手牌與原始手牌。
- `roomUndo/{code}`：房主撤銷上一動作用的私有快照。

多人牌局寫入 `game` 時，前端會自動拆成公開 game 與 private hand payload。玩家送出叫牌 / 出牌 intent 後，由房主端驗證 UID、座位、輪到者、合法叫牌與跟牌規則，再更新公開狀態。

若要限制非房主讀取其他座位手牌，請部署 `database.rules.secure.example.json`。限制：純前端仍信任房主裝置；公開競賽級防作弊需要 Cloud Functions 或可信後端。

## 建議維護

1. 開啟 Anonymous Auth。
2. Realtime Database 放在與玩家接近的區域。
3. GitHub Pages 網域加入 Firebase 授權網域。
4. 上線真人局前，優先測試手機瀏覽器重連、QR 加入房間與 Service Worker 快取更新。
5. 部署新版時同步更新 `database.rules.json`，否則 `roomPrivateHands` / `roomUndo` 寫入可能失敗。
6. 定期清除超過 `expiresAt` 的舊房間、`roomPrivateHands` 與 `roomUndo`。
