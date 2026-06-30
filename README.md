# LINE Bot + Google OAuth Check-in 系統

## 環境變數設定（.env）

```
PORT=3100

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=你的_channel_access_token
LINE_CHANNEL_SECRET=你的_channel_secret

# Google OAuth 2.0
GOOGLE_CLIENT_ID=你的_google_client_id
GOOGLE_CLIENT_SECRET=你的_google_client_secret
GOOGLE_REDIRECT_URI=https://xxxx.ngrok-free.app/auth/google/callback

# LIFF ID（申請後填入）
LIFF_ID=你的_liff_id
```

---

## 設定步驟

### 1. LINE Developer Console

1. 前往 https://developers.line.biz/
2. 建立 Provider → 建立 **Messaging API** Channel
3. 取得 `Channel Secret` 和 `Channel Access Token`
4. 在 **LIFF** 分頁新增 LIFF App：
   - Endpoint URL：`https://xxxx.ngrok-free.app`（後續填 ngrok 網址）
   - Scope：勾選 `profile`
   - 記下 LIFF ID

### 2. Google Cloud Console

1. 前往 https://console.cloud.google.com/
2. 建立專案 → APIs & Services → **OAuth consent screen**
   - User Type：External
   - 填入 App 名稱、Email
3. **Credentials** → 建立 **OAuth 2.0 Client ID**
   - Application type：Web application
   - Authorized redirect URIs 加入：`https://xxxx.ngrok-free.app/auth/google/callback`
4. 取得 Client ID & Secret

### 3. ngrok 設定

```bash
# 安裝 ngrok（若未安裝）
brew install ngrok

# 啟動（每次重啟網址會換，記得更新 LINE + Google 設定）
ngrok http 3100
```

### 4. 啟動服務

```bash
cd line-checkin
cp .env.example .env   # 填入實際值
node src/index.js
```

### 5. 更新 LIFF HTML 的 LIFF ID

編輯 `public/index.html`，將 `__LIFF_ID__` 替換為實際 LIFF ID

### 6. QR Code 產生

每個地點產生一個 QR Code，URL 格式：

```
https://liff.line.me/YOUR_LIFF_ID?loc=地點名稱
```

例如：

- 台北總部：`https://liff.line.me/2006xxxxx-xxxxxxxx?loc=taipei_hq`
- 高雄分部：`https://liff.line.me/2006xxxxx-xxxxxxxx?loc=kaohsiung_branch`

---

## API 端點

| 端點                        | 說明                       |
| --------------------------- | -------------------------- |
| `POST /liff/start`          | LIFF 取得 Google OAuth URL |
| `GET /auth/google/callback` | Google OAuth 回調          |
| `POST /webhook`             | LINE Bot Webhook           |
| `GET /admin/all`            | 查詢所有簽到記錄           |
| `GET /admin/location/:loc`  | 依地點查詢                 |
| `GET /admin/user/:lineId`   | 依 LINE ID 查詢            |
