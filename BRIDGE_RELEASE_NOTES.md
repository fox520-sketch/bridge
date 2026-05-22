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
