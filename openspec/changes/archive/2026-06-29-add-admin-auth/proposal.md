## Why

`/admin/*` 端點目前完全開放，任何知道網址的人都能查詢全部簽到記錄（含 LINE ID、姓名、Email）。這是一個小型內部系統，需要最低限度的保護以防止未授權的資料存取。

## What Changes

- 所有 `/admin/*` 路由加入 API Key 驗證中介層（middleware）
- API Key 透過環境變數 `ADMIN_API_KEY` 設定
- 未提供或 Key 錯誤時回傳 `401 Unauthorized`
- 請求方式：HTTP Header `X-Admin-Key: <key>` 或 Query String `?key=<key>`

## Capabilities

### New Capabilities

- `admin-auth`: 保護 `/admin/*` 路由的 API Key 驗證機制，含 middleware 實作與環境變數設定

### Modified Capabilities

（無——現有端點的 URL 與回應格式不變，只加入驗證層）

## Non-goals

- 不實作多帳號或角色權限（單一 API Key 即可）
- 不做登入介面或 session 管理
- 不修改 `checkins` 資料表 UNIQUE 限制，此變更與 admin-auth 無關

## Impact

- `src/routes/admin.js`：套用新 middleware
- `.env` / `.env.example`：新增 `ADMIN_API_KEY` 變數
- 新增 `src/middleware/adminAuth.js`
