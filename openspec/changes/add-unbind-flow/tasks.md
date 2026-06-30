## 1. DB：新增刪除函式

- [x] 1.1 在 `src/services/db.js` 新增 `deleteCheckin(lineId)` 函式：先用 `getCheckinByLineId` 查出記錄（取得 email、sn），再執行 `DELETE FROM checkins WHERE line_id = ?`，回傳 `{ record, changes }` 供呼叫端使用原綁定資訊

## 2. LINE 推送訊息函式

- [x] 2.1 在 `src/services/line.js` 新增 `pushUnbindConfirm(lineId)` 函式，推送含「確認解除」（postback data: `action=unbind_confirm`）與「取消」（postback data: `action=unbind_cancel`）按鈕的 Flex Message
- [x] 2.2 在 `src/services/line.js` 新增 `pushUnbindResult(lineId, { success, email, sn })` 函式：`success=true` 推送「✅ 綁定已解除」Flex Message，內容包含原綁定的 email 與機台 SN；`success=false`（無記錄）推送「⚠️ 查無綁定記錄」純文字
- [x] 2.3 在 `src/services/line.js` 新增 `pushBindingStatus(lineId, record)` 函式：`record` 有值時推送「✅ 已綁定」Flex Message（含 email 與 SN）；`record` 為 null 時推送「⚠️ 尚未綁定任何裝置」純文字（此函式同時供解除意圖的未綁定情境與查詢意圖使用）

## 3. Webhook：事件處理

- [x] 3.1 在 `src/routes/webhook.js` 的 `handleEvent` 加入 `message` 事件分支，處理兩種意圖：
  - 解除意圖（`解除綁定`、`取消綁定`、`unbind`）：先呼叫 `getCheckinByLineId`；有記錄則 `pushUnbindConfirm`，無記錄則 `pushBindingStatus(lineId, null)`
  - 查詢意圖（`查詢綁定`、`綁定狀態`、`status`）：呼叫 `getCheckinByLineId`，結果傳入 `pushBindingStatus`
- [x] 3.2 在 `handleEvent` 加入 `postback` 事件分支：解析 `event.postback.data`（URLSearchParams），`action=unbind_confirm` 時呼叫 `deleteCheckin` 取得 `{ record, changes }`，再呼叫 `pushUnbindResult(lineId, { success: changes > 0, email: record?.email, sn: record?.sn })`；`action=unbind_cancel` 時推送「已取消操作」純文字訊息
