# Firebase 安全與維護

本專案沿用原壓縮檔的 Firebase 專案設定，使用 Anonymous Auth + Realtime Database。

## 休閒對戰架構

目前牌局由房主瀏覽器處理 actions 並寫回 game state。這適合朋友休閒對戰與公開測試，但所有玩家仍能在瀏覽器開發者工具看到同步資料。若需要正式防作弊，請把發牌、行動驗證與計分移到 Cloud Functions 或自架伺服器。

## 建議

- 部署 `database.rules.json`。
- 啟用 Anonymous Auth。
- 將 GitHub Pages 網域加入 Firebase 授權網域。
- 定期清理過期房間。
