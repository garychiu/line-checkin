const express = require('express');
const router = express.Router();
const { validateSignature } = require('@line/bot-sdk');
const { client: lineClient, lineConfig, pushLiffButton, pushUnbindConfirm, pushUnbindResult, pushBindingStatus } = require('../services/line');
const { getCheckinByLineId, deleteCheckin } = require('../services/db');

const UNBIND_KEYWORDS = ['解除綁定', '取消綁定', 'unbind'];
const STATUS_KEYWORDS = ['查詢綁定', '綁定狀態', 'status'];

// LINE Webhook 需要 raw body 來驗證簽名
router.post('/', express.raw({ type: '*/*' }), (req, res) => {
  const signature = req.headers['x-line-signature'];

  // 沒有簽名（非 LINE 請求，如 Verify ping）→ 直接回 200
  if (!signature) {
    return res.status(200).json({ status: 'ok' });
  }

  const body = req.body;

  // 驗證簽名
  if (!validateSignature(body, lineConfig.channelSecret, signature)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // 解析 body
  let events;
  try {
    events = JSON.parse(body.toString()).events || [];
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // 先回 200，再非同步處理
  res.status(200).json({ status: 'ok' });

  Promise.all(events.map(handleEvent)).catch(err => {
    console.error('Event handling error:', err);
  });
});

async function handleEvent(event) {
  console.log('LINE event:', event.type, event?.source?.userId);

  const lineId = event.source?.userId;
  if (!lineId) return;

  if (event.type === 'follow') {
    await pushLiffButton(lineId);
    return;
  }

  if (event.type === 'message' && event.message?.type === 'text') {
    const text = event.message.text.toLowerCase();

    if (UNBIND_KEYWORDS.some(k => text.includes(k.toLowerCase()))) {
      const record = getCheckinByLineId(lineId);
      if (record) {
        await pushUnbindConfirm(lineId);
      } else {
        await pushBindingStatus(lineId, null);
      }
      return;
    }

    if (STATUS_KEYWORDS.some(k => text.includes(k.toLowerCase()))) {
      const record = getCheckinByLineId(lineId);
      await pushBindingStatus(lineId, record || null);
      return;
    }
  }

  if (event.type === 'postback') {
    const params = new URLSearchParams(event.postback?.data || '');
    const action = params.get('action');

    if (action === 'unbind_confirm') {
      const { record, changes } = deleteCheckin(lineId);
      await pushUnbindResult(lineId, {
        success: changes > 0,
        email: record?.email,
        sn: record?.sn,
      });
      return;
    }

    if (action === 'unbind_cancel') {
      await lineClient.pushMessage({
        to: lineId,
        messages: [{ type: 'text', text: '已取消操作。' }],
      });
      return;
    }
  }
}

module.exports = router;
