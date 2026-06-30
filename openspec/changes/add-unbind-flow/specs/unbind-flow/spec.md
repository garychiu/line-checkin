## ADDED Requirements

### Requirement: 偵測解除綁定意圖並先檢查綁定狀態
當 LINE Bot 收到使用者傳送的文字訊息，且訊息包含 `解除綁定`、`取消綁定` 或 `unbind`（大小寫不分）時，系統 SHALL 先查詢該 LINE ID 的綁定狀態，再依結果推送對應訊息。

#### Scenario: 使用者輸入解除意圖且已綁定
- **WHEN** 使用者傳送含解除意圖的訊息，且該 LINE ID 在 `checkins` 表有記錄
- **THEN** Bot 推送含「確認解除」與「取消」Postback 按鈕的 Flex Message

#### Scenario: 使用者輸入解除意圖但尚未綁定
- **WHEN** 使用者傳送含解除意圖的訊息，但該 LINE ID 在 `checkins` 表無記錄
- **THEN** Bot 推送「⚠️ 尚未綁定任何裝置」純文字訊息，不推送確認按鈕

#### Scenario: 使用者輸入不相關訊息
- **WHEN** 使用者傳送不含解除或查詢意圖的一般訊息
- **THEN** Bot 不作任何回應

### Requirement: 偵測綁定狀態查詢意圖並回傳綁定狀態
當 LINE Bot 收到使用者傳送的文字訊息，且訊息包含 `查詢綁定`、`綁定狀態` 或 `status`（大小寫不分）時，系統 SHALL 查詢該 LINE ID 的綁定狀態並推送結果訊息。

#### Scenario: 查詢時已綁定
- **WHEN** 使用者傳送含查詢意圖的訊息，且該 LINE ID 在 `checkins` 表有記錄
- **THEN** Bot 推送「✅ 已綁定」訊息，包含綁定的 email 與機台 SN

#### Scenario: 查詢時尚未綁定
- **WHEN** 使用者傳送含查詢意圖的訊息，但該 LINE ID 在 `checkins` 表無記錄
- **THEN** Bot 推送「⚠️ 尚未綁定任何裝置」純文字訊息

### Requirement: 確認解除綁定後刪除記錄並回傳結果
當使用者按下確認按鈕（Postback data: `action=unbind_confirm`），系統 SHALL 先查詢該 LINE ID 的綁定記錄，再執行刪除，並推送包含原綁定資訊的結果訊息。

#### Scenario: 確認解除且有綁定記錄
- **WHEN** 使用者按下「確認解除」按鈕，且該 LINE ID 在 `checkins` 表有記錄
- **THEN** 系統刪除該記錄，並推送「✅ 綁定已解除」成功訊息，訊息內容包含原綁定的 email 與機台 SN

#### Scenario: 確認解除但無綁定記錄
- **WHEN** 使用者按下「確認解除」按鈕，但該 LINE ID 在 `checkins` 表無記錄
- **THEN** 系統推送「⚠️ 查無綁定記錄」訊息，不做任何刪除操作

### Requirement: 取消解除綁定時回傳取消訊息
當使用者按下取消按鈕（Postback data: `action=unbind_cancel`），系統 SHALL 推送「已取消操作」訊息到聊天室，不做任何資料庫操作。

#### Scenario: 使用者按下取消按鈕
- **WHEN** 使用者按下「取消」按鈕
- **THEN** Bot 推送「已取消操作」純文字訊息，checkins 表不變
