const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../data/checkin.db");
const SCHEMA_PATH = path.join(__dirname, "../db/schema.sql");

// 確保 data 目錄存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// 初始化 schema
const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
db.exec(schema);

// 儲存 check-in 記錄
function saveCheckin({ lineId, displayName, email, sn }) {
  const stmt = db.prepare(`
    INSERT INTO checkins (line_id, display_name, email, sn)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(line_id) DO UPDATE SET
      display_name = excluded.display_name,
      email = excluded.email,
      sn = excluded.sn,
      checked_at = CURRENT_TIMESTAMP
  `);
  return stmt.run(lineId, displayName || "", email, sn || "");
}

// 查詢某 lineId 的單筆記錄（供 LIFF 綁定狀態查詢）
function getCheckinByLineId(lineId) {
  return db
    .prepare("SELECT * FROM checkins WHERE line_id = ?")
    .get(lineId);
}

// 查詢某 lineId 的所有 check-in
function getCheckinsByLineId(lineId) {
  return db
    .prepare(
      "SELECT * FROM checkins WHERE line_id = ? ORDER BY checked_at DESC",
    )
    .all(lineId);
}

// 查詢某地點的所有 check-in
function getCheckinsBySn(sn) {
  return db
    .prepare(
      "SELECT * FROM checkins WHERE sn = ? ORDER BY checked_at DESC",
    )
    .all(sn);
}

// 查詢全部
function getAllCheckins() {
  return db.prepare("SELECT * FROM checkins ORDER BY checked_at DESC").all();
}

// 刪除某 lineId 的綁定記錄，回傳 { record, changes }
function deleteCheckin(lineId) {
  const record = getCheckinByLineId(lineId);
  const { changes } = db
    .prepare("DELETE FROM checkins WHERE line_id = ?")
    .run(lineId);
  return { record, changes };
}

module.exports = {
  saveCheckin,
  getCheckinByLineId,
  getCheckinsByLineId,
  getCheckinsBySn,
  getAllCheckins,
  deleteCheckin,
};
