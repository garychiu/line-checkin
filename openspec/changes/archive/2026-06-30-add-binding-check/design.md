## Context

LIFF 頁面（`public/index.html`）目前取得 LINE profile 後直接顯示綁定按鈕，不管該帳號是否已綁定。後端已有 `getCheckinsByLineId`（回傳陣列），但沒有專門給 LIFF 前端查詢的公開端點。`checkins` 表以 `line_id` 為 UNIQUE key，天然支援「一個 LINE 帳號只有一筆記錄」的查詢。

## Goals / Non-Goals

**Goals:**
- LIFF 頁面初始化時查詢綁定狀態，已綁定則顯示確認畫面（email + sn），跳過 OAuth
- 後端提供輕量查詢端點，不需要 admin-auth（使用者自己的 lineId 查自己的記錄）

**Non-Goals:**
- 解除綁定
- 強制重新綁定（覆蓋邏輯維持現有 `ON CONFLICT DO UPDATE`）
- 任何 admin-auth 的修改

## Decisions

### 決策 1：新增 `GET /liff/check?lineId=<lineId>` 端點，不加 auth

**選擇：** 開放端點，僅以 `lineId` 查詢，回傳 `{ bound: true, email, sn }` 或 `{ bound: false }`

**理由：** `lineId` 本身不是秘密（LIFF SDK 提供），且只能查到該使用者自己的資料，不暴露其他人的記錄。加 auth 會讓 LIFF 前端需要管理 Key，不適合。

**替代方案：** 複用 `/admin/user/:lineId`（需要 admin-auth）→ LIFF 前端無法安全持有 admin key，排除。

---

### 決策 2：查詢放在 LIFF 頁面的 `init()` 流程中，取得 profile 之後立即呼叫

**選擇：** `liff.getProfile()` → `fetch /liff/check?lineId=...` → 依結果分叉渲染

**理由：** 單一初始化流程，不需要額外的使用者互動；失敗時（網路錯誤等）fallback 到顯示綁定按鈕，不阻斷流程。

---

### 決策 3：新增 `getCheckinByLineId`（單筆）到 `src/services/db.js`

**選擇：** 複用既有 DB 連線，新增回傳單筆的函式

**理由：** 現有 `getCheckinsByLineId` 回傳陣列（for admin），LIFF check 只需要一筆；語義清晰，不混用。

## Risks / Trade-offs

- **`lineId` 可偽造** → 攻擊者可查詢任意 LINE ID 的 email。可接受：email 本身不算高度敏感，且此端點僅回傳是否綁定與 email，無其他個資。
- **網路失敗時的行為** → check 失敗時 fallback 顯示綁定按鈕，使用者仍可正常操作；DB 的 `ON CONFLICT DO UPDATE` 保證冪等性。

## Migration Plan

1. 新增 `getCheckinByLineId` 到 `src/services/db.js`
2. 新增 `GET /check` 到 `src/routes/liff.js`
3. 更新 `public/index.html` 的 `init()` 邏輯
4. 重啟服務即生效，無 DB migration 需求

## Open Questions

（無）
