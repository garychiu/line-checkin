const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const os = require("os");

const HERMES_TOKEN_PATH = path.join(
  os.homedir(),
  ".hermes",
  "google_token.json",
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

/**
 * 產生 Google OAuth URL
 * state 內嵌 lineId + sn，callback 時還原
 */
function generateAuthUrl({ lineId, sn }) {
  const state = Buffer.from(
    JSON.stringify({ lineId, sn, nonce: uuidv4() }),
  ).toString("base64url");

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    state,
    prompt: "select_account consent",
  });
}

/**
 * 用 code 換 tokens，取得 email，並將 token 存入 ~/.hermes/google_token.json
 */
async function getEmailFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  // 存入 Hermes google_token.json（供 google_api.py 使用）
  if (tokens.refresh_token) {
    const tokenData = {
      token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_uri: "https://oauth2.googleapis.com/token",
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      scopes: tokens.scope ? tokens.scope.split(" ") : [],
      universe_domain: "googleapis.com",
      account: data.email,
      expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      type: "authorized_user",
    };

    if (process.env.IS_SUPPORT_HERMES) {
      fs.writeFileSync(HERMES_TOKEN_PATH, JSON.stringify(tokenData, null, 2));
      const HERMES_USER_TOKEN_PATH = path.join(
        os.homedir(),
        ".hermes",
        `google_token_${data.email}.json`,
      );
      fs.writeFileSync(
        HERMES_USER_TOKEN_PATH,
        JSON.stringify(tokenData, null, 2),
      );
    }

    console.log(`✅ Token 已存入 ${HERMES_TOKEN_PATH}`);
  } else {
    console.warn("⚠️  未取得 refresh_token，token 未更新");
  }

  return {
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

/**
 * 解析 state 取回 lineId + sn
 */
function parseState(stateStr) {
  try {
    return JSON.parse(Buffer.from(stateStr, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

module.exports = { generateAuthUrl, getEmailFromCode, parseState };
