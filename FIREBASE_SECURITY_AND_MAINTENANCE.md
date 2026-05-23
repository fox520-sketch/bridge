# Firebase 安全與維護

## 目前相容模式

`database.rules.json` 保留舊版相容設定，可直接支援目前 GitHub Pages 單頁版本。這個模式方便測試，但真人競賽時仍建議不要把完整手牌長期放在公開節點。

## v1.0.18 防作弊拆分設計

詳見 `ANTI_CHEAT_FIREBASE_DESIGN.md`。重點是把資料拆成：

- `rooms/{room}/public`：公開牌局狀態、座位、叫牌、桌面牌、已完成墩。
- `rooms/{room}/privateHands/{seat}`：該座位私人手牌。
- `rooms/{room}/reveal/{seat}`：標準模式夢家首攻後公開，或牌局結束公開。
- `rooms/{room}/audit`：房主 / 裁判流程驗證用。

`database.rules.secure.example.json` 是未來切換到 public/private 路徑時的範例規則。切換前請先在測試專案驗證多人開房、重連、觀戰、AI 代打與回放。

## 建議維護

1. 開啟 Anonymous Auth。
2. Realtime Database 放在與玩家接近的區域。
3. GitHub Pages 網域加入 Firebase 授權網域。
4. 上線真人局前，優先測試手機瀏覽器重連、QR 加入房間與 Service Worker 快取更新。
5. 定期清除超過 `expiresAt` 的舊房間。
