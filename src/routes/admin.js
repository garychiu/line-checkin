const express = require("express");
const router = express.Router();
const {
  getAllCheckins,
  getCheckinsBySn,
  getCheckinsByLineId,
} = require("../services/db");

// 簡易 admin 查詢 API（建議加驗證）
router.get("/all", (req, res) => {
  res.json(getAllCheckins());
});

router.get("/sn/:sn", (req, res) => {
  res.json(getCheckinsBySn(req.params.sn));
});

router.get("/user/:lineId", (req, res) => {
  res.json(getCheckinsByLineId(req.params.lineId));
});

module.exports = router;
