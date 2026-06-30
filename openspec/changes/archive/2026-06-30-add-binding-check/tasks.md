## 1. 後端：DB 查詢函式

- [x] 1.1 在 `src/services/db.js` 新增 `getCheckinByLineId(lineId)` 函式，查詢單筆記錄並回傳 `{ line_id, email, sn, display_name, checked_at }` 或 `undefined`

## 2. 後端：查詢 API

- [x] 2.1 在 `src/routes/liff.js` 新增 `GET /check` 路由：從 query string 取得 `lineId`，缺少時回傳 `400`，呼叫 `getCheckinByLineId`，已綁定回傳 `{ bound: true, email, sn }`，未綁定回傳 `{ bound: false }`

## 3. 前端：LIFF 頁面更新

- [x] 3.1 在 `public/index.html` 的 `init()` 函式中，取得 LINE profile 後呼叫 `fetch(/liff/check?lineId=...)`
- [x] 3.2 已綁定（`bound: true`）時，渲染「已綁定確認畫面」：顯示綁定的 email 與 sn，隱藏 Google 登入按鈕
- [x] 3.3 未綁定（`bound: false`）或 API 呼叫失敗時，顯示原有綁定流程（現有邏輯不變）
