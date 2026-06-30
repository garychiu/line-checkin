## Why

目前使用者一旦完成機台綁定就無法自行解除，需要管理員手動操作資料庫。加入 LINE Bot 解除綁定流程，讓使用者透過聊天室自助完成解除，並透過確認步驟防止誤觸。

## What Changes

- `src/routes/webhook.js`：新增 `message` 事件處理（偵測解除綁定意圖），新增 `postback` 事件處理（處理確認/取消動作）
- `src/services/line.js`：新增推送「確認解除綁定」Flex Message 的函式、新增推送結果訊息的函式
- `src/services/db.js`：新增 `deleteCheckin(lineId)` 函式，從 `checkins` 表刪除該 LINE ID 的記錄

## Capabilities

### New Capabilities

- `unbind-flow`: 使用者透過 LINE Bot 觸發、確認、並完成解除綁定的完整對話流程

### Modified Capabilities

（無——`binding-check` 的查詢 spec 行為不變；`checkins` 表結構不變，只新增刪除操作）

## Non-goals

- 不做重新綁定流程（解除後若要重新綁定，使用者掃 QR Code 重走原有 LIFF 流程即可）
- 不記錄解除綁定的歷史 log
- 不影響 `checkins` 表的 `line_id UNIQUE` 約束（刪除整筆，UNIQUE 自然釋放）
- 不在 LIFF 頁面加入解除綁定入口（僅透過 LINE Bot 訊息觸發）

## Impact

- `src/routes/webhook.js`：擴充 `handleEvent`，加入 `message` 與 `postback` 事件分支
- `src/services/line.js`：新增 `pushUnbindConfirm` 與 `pushUnbindResult` 函式
- `src/services/db.js`：新增 `deleteCheckin(lineId)` 函式
- Postback data 格式：`action=unbind_confirm` / `action=unbind_cancel`
