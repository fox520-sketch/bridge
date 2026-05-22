# 合約橋牌｜標準夢家・閉手變體・Firebase 多人房間

這個版本由原本的「拿破崙與秘書」網頁遊戲改成 4 人合約橋牌。保留原專案的靜態網站部署方式、PWA、Firebase 開房間、QR 邀請、觀戰、電腦補位、分享、統計、備份與維護工具。

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

> 注意：這是休閒對戰架構，牌局主持端在房主瀏覽器。若要正式防作弊，建議改為 Cloud Functions 或自架伺服器管理牌局狀態。

## 單人離線

點「單人離線開始」即可用南家玩家 + 3 位電腦開局。不需要 Firebase。

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
- 身價：可固定或依牌號循環
- 部分合約、成局、滿貫、超墩、倒約、Double / Redouble 計分

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
