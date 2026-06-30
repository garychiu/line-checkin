const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient(config);

/**
 * 推播 check-in 成功訊息給使用者（含行事曆）
 */
async function pushCheckinSuccess({
  lineId,
  displayName,
  email,
  sn,
  events = [],
}) {
  // 行事曆列表 rows
  const eventRows = events.slice(0, 5).map((e) => ({
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    contents: [
      {
        type: "text",
        text: formatDateTime(e.start),
        flex: 3,
        size: "xs",
        color: "#888888",
        wrap: true,
      },
      {
        type: "text",
        text: e.summary,
        flex: 5,
        size: "xs",
        wrap: true,
      },
    ],
  }));

  const message = {
    type: "flex",
    altText: `✅ 綁定成功！機台SN：${sn}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "✅ 綁定成功",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
          },
        ],
        backgroundColor: "#06C755",
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "📍 SN",
                flex: 2,
                color: "#888888",
                size: "sm",
              },
              { type: "text", text: sn, flex: 5, weight: "bold" },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "📧 Email",
                flex: 2,
                color: "#888888",
                size: "sm",
              },
              { type: "text", text: email, flex: 5, size: "sm", wrap: true },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "👤 名稱",
                flex: 2,
                color: "#888888",
                size: "sm",
              },
              { type: "text", text: displayName || "未知", flex: 5 },
            ],
          },
          // 行事曆區塊
          ...(eventRows.length > 0
            ? [
                { type: "separator", margin: "md" },
                {
                  type: "text",
                  text: `📅 近期行程（${eventRows.length} 筆）`,
                  size: "sm",
                  weight: "bold",
                  margin: "md",
                },
                ...eventRows,
              ]
            : []),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: new Date().toLocaleString("zh-TW", {
              timeZone: "Asia/Taipei",
            }),
            size: "xs",
            color: "#aaaaaa",
            align: "center",
          },
        ],
      },
    },
  };

  await client.pushMessage({ to: lineId, messages: [message] });
}

function formatDateTime(isoStr) {
  if (!isoStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    const d = new Date(isoStr);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()} 全天`;
  }
  return new Date(isoStr).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 推播 LIFF 簽到按鈕（加好友後引導使用者）
 */
async function pushLiffButton(lineId) {
  await client.pushMessage(lineId, {
    type: 'flex',
    altText: '歡迎！點此開始簽到 ✅',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: '👋 歡迎加入！', weight: 'bold', size: 'xl' },
          { type: 'text', text: '點下方按鈕開始簽到', color: '#888888', size: 'sm' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#06C755',
            action: {
              type: 'uri',
              label: '📍 開始簽到',
              uri: `https://liff.line.me/2010479248-nbU9s0PP`,
            },
          },
        ],
      },
    },
  });
}

/**
 * 推播解除綁定確認 Flex Message（含確認/取消 Postback 按鈕）
 */
async function pushUnbindConfirm(lineId) {
  await client.pushMessage({
    to: lineId,
    messages: [{
      type: 'flex',
      altText: '確認解除機台綁定？',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'text',
            text: '⚠️ 解除綁定確認',
            weight: 'bold',
            size: 'lg',
            color: '#ffffff',
          }],
          backgroundColor: '#e53e3e',
          paddingAll: '16px',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'text',
            text: '確定要解除目前的機台綁定嗎？',
            wrap: true,
            color: '#333333',
          }],
        },
        footer: {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#e53e3e',
              action: {
                type: 'postback',
                label: '確認解除',
                data: 'action=unbind_confirm',
              },
            },
            {
              type: 'button',
              style: 'secondary',
              action: {
                type: 'postback',
                label: '取消',
                data: 'action=unbind_cancel',
              },
            },
          ],
        },
      },
    }],
  });
}

/**
 * 推播解除綁定結果訊息
 */
async function pushUnbindResult(lineId, { success, email, sn }) {
  if (success) {
    await client.pushMessage({
      to: lineId,
      messages: [{
        type: 'flex',
        altText: '✅ 綁定已解除',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [{
              type: 'text',
              text: '✅ 綁定已解除',
              weight: 'bold',
              size: 'lg',
              color: '#ffffff',
            }],
            backgroundColor: '#06C755',
            paddingAll: '16px',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '📍 SN', flex: 2, color: '#888888', size: 'sm' },
                  { type: 'text', text: sn || '—', flex: 5, weight: 'bold' },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '📧 Email', flex: 2, color: '#888888', size: 'sm' },
                  { type: 'text', text: email || '—', flex: 5, size: 'sm', wrap: true },
                ],
              },
            ],
          },
        },
      }],
    });
  } else {
    await client.pushMessage({
      to: lineId,
      messages: [{ type: 'text', text: '⚠️ 查無綁定記錄，無需解除。' }],
    });
  }
}

/**
 * 推播綁定狀態訊息（供查詢意圖與未綁定解除意圖共用）
 */
async function pushBindingStatus(lineId, record) {
  if (record) {
    await client.pushMessage({
      to: lineId,
      messages: [{
        type: 'flex',
        altText: `✅ 已綁定機台 ${record.sn}`,
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [{
              type: 'text',
              text: '✅ 目前綁定狀態',
              weight: 'bold',
              size: 'lg',
              color: '#ffffff',
            }],
            backgroundColor: '#06C755',
            paddingAll: '16px',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '📍 SN', flex: 2, color: '#888888', size: 'sm' },
                  { type: 'text', text: record.sn, flex: 5, weight: 'bold' },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '📧 Email', flex: 2, color: '#888888', size: 'sm' },
                  { type: 'text', text: record.email, flex: 5, size: 'sm', wrap: true },
                ],
              },
            ],
          },
        },
      }],
    });
  } else {
    await client.pushMessage({
      to: lineId,
      messages: [{ type: 'text', text: '⚠️ 尚未綁定任何裝置。' }],
    });
  }
}

module.exports = { client, pushCheckinSuccess, pushLiffButton, pushUnbindConfirm, pushUnbindResult, pushBindingStatus, lineConfig: config };
