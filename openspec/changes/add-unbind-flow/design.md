## Context

`src/routes/webhook.js` 目前只處理 `follow` 事件。LINE Bot SDK 支援兩種觸發解除流程所需的事件類型：`message`（使用者輸入文字）與 `postback`（使用者按下按鈕）。Postback 是 LINE Flex Message 按鈕的標準互動機制，不需要額外 session 狀態，data 字串直接攜帶操作意圖。

## Goals / Non-Goals

**Goals:**
- 偵測解除綁定意圖的訊息 → 推送確認 Flex Message
- Postback 確認 → 刪除 DB 記錄 → 推送結果
- Postback 取消 → 推送「已取消」訊息
- 無 DB 記錄時給出友善提示

**Non-Goals:**
- 多步驟確認或 session 狀態管理
- 解除綁定歷史記錄

## Decisions

### 決策 1：用 Postback 按鈕而非 Quick Reply

**選擇：** Flex Message + Postback action 按鈕（確認 / 取消）

**理由：** Postback 不在聊天泡泡中顯示按鈕文字為使用者輸入；`data` 欄位可直接帶 `action=unbind_confirm` / `action=unbind_cancel`，不需要額外解析。Quick Reply 會在輸入框上方出現，適合選擇題，不適合危險操作確認。

**替代方案：** 再次要求使用者輸入「確認」文字 → 體驗差，容易誤觸，排除。

---

### 決策 2：意圖偵測用關鍵字比對（不使用 NLP）

**選擇：** 檢查訊息文字是否包含 `解除綁定`、`取消綁定`、`unbind`（大小寫不分）

**理由：** 系統規模小，關鍵字已足夠；無外部依賴；容易擴充。

---

### 決策 3：Postback data 格式用 query string

**選擇：** `action=unbind_confirm` / `action=unbind_cancel`

**理由：** 未來若需要攜帶更多參數（如 sn），直接加 `&sn=xxx` 即可；`URLSearchParams` 解析簡單。

---

### 決策 4：解除後不推送 LIFF 重新綁定按鈕

**選擇：** 解除成功後只推送純文字確認訊息

**理由：** 解除是明確意圖，立刻引導重新綁定可能造成困惑；需要重新綁定的使用者自然會去掃 QR Code。

## Risks / Trade-offs

- **重複觸發問題** → 使用者在確認 Flex Message 出現後又傳一次「解除綁定」，會再推一則確認訊息。可接受：兩次確認都需要使用者主動按下，不會誤刪。
- **Postback 延遲** → 極少數情況 LINE 伺服器延遲，使用者按兩次確認 → `deleteCheckin` 第二次刪到 0 筆，回傳「無綁定記錄」。可接受：冪等行為。

## Migration Plan

1. 新增 `deleteCheckin` 到 `src/services/db.js`
2. 新增 `pushUnbindConfirm` 與 `pushUnbindResult` 到 `src/services/line.js`
3. 擴充 `webhook.js` 的 `handleEvent`，加入 `message` 與 `postback` 分支
4. 重啟服務即生效；Rollback：移除三個新增的 event 分支

## Open Questions

（無）
