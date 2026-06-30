## Why

使用者掃 QR Code 後，LIFF 頁面直接進入 Google OAuth 流程，但若該 LINE 帳號已綁定過 Gmail，重複操作會讓使用者困惑，也造成不必要的 OAuth 請求。加入事前查詢，已綁定的使用者直接看到確認頁面即可。

## What Changes

- 新增 `GET /liff/check?lineId=<lineId>` API，查詢該 LINE ID 是否已有綁定記錄，回傳 email 與 sn
- 更新 `public/index.html`：LIFF 取得 LINE profile 後，先呼叫 `/liff/check`；若已綁定則顯示「已綁定」頁面（含 email、sn），不顯示 Google 登入按鈕；若未綁定則顯示原有綁定流程

## Capabilities

### New Capabilities

- `binding-check`: LIFF 初始化時查詢綁定狀態並依結果渲染不同 UI 的能力

### Modified Capabilities

（無——`admin-auth` 保護邏輯不變；`checkins` 資料表結構不變）

## Non-goals

- 不提供「解除綁定」功能
- 不修改已綁定後的 re-bind 行為（`ON CONFLICT DO UPDATE` 邏輯維持不變，若未來要重新綁定仍可透過正常 OAuth 流程覆蓋）
- 不影響 `checkins` 表的 `line_id UNIQUE` 約束

## Impact

- 新增 `src/routes/liff.js`：新增 `GET /check` 路由
- 新增 `src/services/db.js`：新增 `getCheckinByLineId` 查詢函式（回傳單筆）
- 修改 `public/index.html`：`init()` 函式加入綁定狀態查詢與條件渲染邏輯
