## 1. Middleware 實作

- [x] 1.1 建立 `src/middleware/adminAuth.js`：讀取 `process.env.ADMIN_API_KEY`，從 `X-Admin-Key` header 或 `?key=` query string 取得 Key，比對後通過或回傳 `401 { "error": "Unauthorized" }`
- [x] 1.2 `ADMIN_API_KEY` 未設定或為空字串時，一律回傳 `401`（fail closed）

## 2. 套用 Middleware

- [x] 2.1 在 `src/index.js` 中，於 `app.use("/admin", ...)` 之前加入 `app.use("/admin", adminAuth)`

## 3. 環境變數設定

- [x] 3.1 在 `.env.example` 新增 `ADMIN_API_KEY=your-secret-key-here`
- [x] 3.2 在 `.env` 設定實際的 `ADMIN_API_KEY` 值（本地開發用）
