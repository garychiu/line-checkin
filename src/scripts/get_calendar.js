#!/usr/bin/env node
/**
 * get_calendar.js
 * 透過 gws CLI (google_api.py) 取得近期行事曆事件
 * 回傳 JSON 陣列到 stdout
 *
 * 用法：node get_calendar.js [maxResults]
 */

const { execFile } = require('child_process');
const path = require('path');
const os = require('os');

const GAPI = path.join(
  os.homedir(),
  '.hermes/skills/productivity/google-workspace/scripts/google_api.py'
);

const maxResults = process.argv[2] || '10';

function getCalendarEvents() {
  return new Promise((resolve, reject) => {
    execFile('arch', ['-arm64', 'python3', GAPI, 'calendar', 'list'], (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      try {
        // gws 可能輸出 warning 行（Using keyring...），過濾掉非 JSON 部分
        const jsonStart = stdout.indexOf('[');
        if (jsonStart === -1) return reject(new Error('No JSON output from gws'));
        const events = JSON.parse(stdout.slice(jsonStart));
        // 只取前 maxResults 筆
        resolve(events.slice(0, parseInt(maxResults)));
      } catch (e) {
        reject(new Error('Failed to parse gws output: ' + e.message));
      }
    });
  });
}

// 直接執行時印出結果
if (require.main === module) {
  getCalendarEvents()
    .then(events => console.log(JSON.stringify(events, null, 2)))
    .catch(err => {
      console.error(err.message);
      process.exit(1);
    });
}

module.exports = { getCalendarEvents };
