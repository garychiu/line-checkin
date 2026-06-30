const express = require("express");
const router = express.Router();
const { getEmailFromCode, parseState } = require("../services/google");
const { saveCheckin } = require("../services/db");
const { pushCheckinSuccess } = require("../services/line");
const { getCalendarEvents } = require("../scripts/get_calendar");

/**
 * Google OAuth 2.0 Callback
 * GET /auth/google/callback?code=xxx&state=xxx
 */
router.get("/google/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.send(`<h2>❌ 登入取消：${error}</h2>`);
  }

  if (!code || !state) {
    return res.status(400).send("<h2>❌ 無效的請求</h2>");
  }

  // 解析 state
  const stateData = parseState(state);
  if (!stateData || !stateData.lineId || !stateData.sn) {
    return res.status(400).send("<h2>❌ State 解析失敗</h2>");
  }

  const { lineId, sn } = stateData;

  try {
    // 取得 Google email
    const { email, name } = await getEmailFromCode(code);

    // 透過 gws CLI 取得行事曆
    let events = [];
    try {
      events = await getCalendarEvents();
    } catch (calErr) {
      console.error("Calendar fetch error:", calErr.message);
    }

    // 儲存到 DB
    saveCheckin({ lineId, displayName: name, email, sn });

    // LINE 推播確認訊息
    try {
      await pushCheckinSuccess({
        lineId,
        displayName: name,
        email,
        sn,
        events,
      });
      console.log("✅ LINE 推播成功 lineId:", lineId);
    } catch (lineErr) {
      console.error(
        "❌ LINE 推播失敗:",
        lineErr.message,
        lineErr.statusCode,
        lineErr.originalError?.response?.data,
      );
    }

    // 格式化行事曆 HTML
    const eventsHtml =
      events.length === 0
        ? '<p style="color:#aaa; text-align:center;">近期沒有行程</p>'
        : events
            .map((e) => {
              const start = formatDateTime(e.start);
              return `
            <div style="border-left:3px solid #06C755; padding:8px 12px; margin-bottom:10px; background:#f9f9f9; border-radius:0 8px 8px 0;">
              <div style="font-weight:bold; font-size:14px; margin-bottom:4px;">${e.summary}</div>
              <div style="font-size:12px; color:#888;">🕐 ${start}</div>
              ${e.location ? `<div style="font-size:12px; color:#888;">📍 ${e.location}</div>` : ""}
            </div>
          `;
            })
            .join("");

    // 簽到成功 → 跳回 LINE app
    res.send(`
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>簽到成功</title>
        <script>
          // 自動跳回 LINE app
          window.location.href = 'https://line.me/R/';
        </script>
      </head>
      <body>
        <p style="font-family:sans-serif; text-align:center; margin-top:40px; color:#06C755;">
          ✅ 簽到成功！<br><br>
          <a href="https://line.me/R/" style="color:#06C755;">點此回到 LINE</a>
        </p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send(`<h2>❌ 錯誤：${err.message}</h2>`);
  }
});

function formatDateTime(isoStr) {
  if (!isoStr) return "";
  // 全天事件（只有日期 YYYY-MM-DD）
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    const d = new Date(isoStr);
    return `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()} (全天)`;
  }
  return new Date(isoStr).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

module.exports = router;
