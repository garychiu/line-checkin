## Context

目前 `src/routes/admin.js` 的三個端點（`/admin/all`、`/admin/sn/:sn`、`/admin/user/:lineId`）沒有任何保護。這是一個小型內部系統，使用 Express v4 + dotenv，部署在 ngrok 後端。不需要完整的身份認證系統，只需防止隨意存取。

## Goals / Non-Goals

**Goals:**
- 所有 `/admin/*` 請求必須驗證 API Key
- Key 從環境變數讀取，不寫死在程式碼中
- 支援 Header（`X-Admin-Key`）與 Query String（`?key=`）兩種傳遞方式，方便 curl 測試

**Non-Goals:**
- 多帳號 / 角色權限管理
- Key 輪換機制
- 速率限制（rate limiting）

## Decisions

### 決策 1：API Key 而非 JWT / Session

**選擇：** 靜態 API Key（環境變數）

**理由：** 這是內部工具，只有管理員使用。JWT 需要 token 簽發端點與 refresh 流程；session 需要 cookie store。API Key 對這個規模的系統是最簡單且足夠的方案。

**替代方案：** HTTP Basic Auth — 同樣簡單，但在 ngrok URL 上瀏覽器行為較不一致；API Key 透過 curl 測試更友好。

---

### 決策 2：Middleware 集中在 `src/middleware/adminAuth.js`

**選擇：** 獨立 middleware 檔案，在 `src/index.js` 套用到 `/admin` 路由

**理由：** 與現有 route 結構一致（routes/ 只負責路由邏輯）；未來若要升級驗證方式只需修改一個檔案。

**替代方案：** 直接寫在 `admin.js` 每個路由的 handler 內 — 會造成重複程式碼。

---

### 決策 3：支援 Header + Query String

**選擇：** 同時接受 `X-Admin-Key` header 與 `?key=` query string

**理由：** Header 是標準做法；Query String 方便在瀏覽器直接測試或 ngrok URL 分享。兩者都接受不降低安全性（網址已是 HTTPS over ngrok）。

## Risks / Trade-offs

- **Key 外洩風險** → Key 存在 `.env`，不進 git（`.gitignore` 已排除）；部署時透過環境變數注入
- **Query String 會出現在 server log** → 可接受，這是內部工具，log 不對外
- **`ADMIN_API_KEY` 未設定時行為** → Middleware 應拒絕所有請求（fail closed），而非允許通過

## Migration Plan

1. 新增 `src/middleware/adminAuth.js`
2. 在 `src/index.js` 將 middleware 套用到 `/admin` 路由前
3. `.env.example` 加入 `ADMIN_API_KEY=your-secret-key-here`
4. 在 `.env` 設定實際的 Key 值後重啟服務
5. Rollback：移除 middleware 套用那一行即可還原

## Open Questions

（無）
