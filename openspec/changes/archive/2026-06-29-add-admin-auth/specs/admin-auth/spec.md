## ADDED Requirements

### Requirement: API Key 驗證 admin 端點
系統 SHALL 要求所有 `/admin/*` 請求提供有效的 API Key。Key 透過 HTTP Header `X-Admin-Key` 或 Query String `?key=` 傳遞。Key 的正確值由環境變數 `ADMIN_API_KEY` 決定。

#### Scenario: 有效 Key 透過 Header 存取
- **WHEN** 請求 `/admin/all` 並帶有 Header `X-Admin-Key: <正確Key>`
- **THEN** 系統回傳 `200` 及簽到資料

#### Scenario: 有效 Key 透過 Query String 存取
- **WHEN** 請求 `/admin/all?key=<正確Key>`
- **THEN** 系統回傳 `200` 及簽到資料

#### Scenario: 無 Key 的請求被拒絕
- **WHEN** 請求 `/admin/all` 未提供任何 Key
- **THEN** 系統回傳 `401` 及 `{ "error": "Unauthorized" }`

#### Scenario: 錯誤 Key 的請求被拒絕
- **WHEN** 請求 `/admin/all` 帶有錯誤的 Key
- **THEN** 系統回傳 `401` 及 `{ "error": "Unauthorized" }`

### Requirement: 未設定 ADMIN_API_KEY 時拒絕所有請求
若環境變數 `ADMIN_API_KEY` 未設定或為空字串，系統 SHALL 拒絕所有 `/admin/*` 請求，回傳 `401`。

#### Scenario: 環境變數未設定時 fail closed
- **WHEN** `ADMIN_API_KEY` 環境變數未設定，且請求 `/admin/all`
- **THEN** 系統回傳 `401` 及 `{ "error": "Unauthorized" }`
