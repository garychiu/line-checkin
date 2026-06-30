const express = require("express");
const router = express.Router();
const { generateAuthUrl } = require("../services/google");
const { getCheckinByLineId } = require("../services/db");

/**
 * LIFF 頁面載入後呼叫此 API
 * POST /liff/start
 * Body: { lineId, displayName, sn }
 * 回傳 Google OAuth URL
 */
router.post("/start", (req, res) => {
  const { lineId, displayName, sn } = req.body;

  if (!lineId || !sn) {
    return res.status(400).json({ error: "Missing lineId or sn" });
  }

  const authUrl = generateAuthUrl({ lineId, sn });
  res.json({ authUrl });
});

/**
 * 查詢 LINE ID 的綁定狀態
 * GET /liff/check?lineId=xxx
 */
router.get("/check", (req, res) => {
  const { lineId } = req.query;

  if (!lineId) {
    return res.status(400).json({ error: "Missing lineId" });
  }

  const record = getCheckinByLineId(lineId);

  if (record) {
    return res.json({ bound: true, email: record.email, sn: record.sn });
  }

  res.json({ bound: false });
});

/**
 * 查詢 LINE ID 的綁定狀態
 * GET /liff/check?lineId=xxx
 */
router.get("/id", (req, res) => {
  res.json({ liftId: process.env.LIFF_ID });
});

module.exports = router;
