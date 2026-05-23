# v1.0.19 防作弊資料拆分實作

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
- `database.rules.secure.example.json` 提供 future split path 的規則範例。
- `initialHands` 保留牌譜 / 回放用途，牌局結束後才應對所有玩家公開。

## 部署提醒

目前主程式仍保留相容舊版的 `rooms/{room}/game` 結構，方便既有 GitHub Pages 直接使用。若要達到真正防止開發者工具偷看手牌，下一步要把多人訂閱改成：

1. 訂閱 `rooms/{room}/public`
2. 真人玩家只額外訂閱自己的 `rooms/{room}/privateHands/{seat}`
3. 房主 / 裁判流程用 Cloud Function 或受限 host 權限處理動作驗證
4. 部署 `database.rules.secure.example.json` 並停用父節點公開讀取

