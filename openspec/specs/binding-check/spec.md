## Purpose

LIFF 頁面初始化時查詢使用者的綁定狀態，已綁定則顯示確認畫面，避免重複觸發 Google OAuth 流程。

## Requirements

### Requirement: 後端提供綁定狀態查詢 API
系統 SHALL 提供 `GET /liff/check?lineId=<lineId>` 端點，查詢該 LINE ID 是否已有綁定記錄。已綁定時回傳 `{ bound: true, email, sn }`，未綁定時回傳 `{ bound: false }`。此端點不需要 auth。

#### Scenario: 查詢已綁定的 LINE ID
- **WHEN** 請求 `GET /liff/check?lineId=<已綁定的lineId>`
- **THEN** 系統回傳 `200 { bound: true, email: "<email>", sn: "<sn>" }`

#### Scenario: 查詢未綁定的 LINE ID
- **WHEN** 請求 `GET /liff/check?lineId=<未綁定的lineId>`
- **THEN** 系統回傳 `200 { bound: false }`

#### Scenario: 缺少 lineId 參數
- **WHEN** 請求 `GET /liff/check` 未提供 `lineId`
- **THEN** 系統回傳 `400 { "error": "Missing lineId" }`

### Requirement: LIFF 頁面依綁定狀態顯示不同畫面
LIFF 頁面 SHALL 在取得 LINE profile 後，呼叫綁定狀態查詢 API。已綁定時顯示「已綁定確認畫面」（包含已綁定的 email 與機台 SN），不顯示 Google 登入按鈕。未綁定時顯示原有綁定流程。

#### Scenario: 已綁定帳號進入 LIFF 頁面
- **WHEN** 已綁定的 LINE 使用者掃 QR Code 進入 LIFF 頁面
- **THEN** 頁面顯示「此帳號已綁定」確認畫面，包含已綁定的 email 與 sn，不顯示 Google 登入按鈕

#### Scenario: 未綁定帳號進入 LIFF 頁面
- **WHEN** 未綁定的 LINE 使用者掃 QR Code 進入 LIFF 頁面
- **THEN** 頁面顯示原有綁定流程（Google 登入按鈕）

#### Scenario: 查詢 API 失敗時 fallback
- **WHEN** `/liff/check` 呼叫失敗（網路錯誤等）
- **THEN** 頁面 fallback 顯示原有綁定流程，不阻斷使用者操作
