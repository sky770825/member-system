# 🐛 轉點功能調試指南

## 問題：收款人點數沒有增加

---

## 📋 檢查清單

### 1. 檢查 Google Sheets 資料

開啟您的 Google Sheets：
https://docs.google.com/spreadsheets/d/1EdLfJQzYroQ9WMqVEqcDuMpGwiTPj8gxLaMnGp3umDw/edit

#### Members 表檢查：
- [ ] 確認欄位順序正確（第 8 欄是 points）
- [ ] 檢查發送者的點數是否有減少
- [ ] 檢查接收者的點數是否有增加
- [ ] 記錄雙方的 lineUserId

#### Transactions 表檢查：
- [ ] 是否有兩筆交易記錄（transfer_out 和 transfer_in）
- [ ] 檢查 senderUserId 和 receiverUserId 是否正確
- [ ] 檢查點數正負號是否正確

---

## 🔍 常見問題

### 問題 1：欄位順序錯誤

**症狀**：點數沒有變化，或更新到錯誤的欄位

**檢查方法**：
```
Google Sheets 的欄位順序必須是：
A: lineUserId
B: name
C: phone
D: email
E: birthday
F: lineName
G: linePicture
H: points ← 第 8 欄（重要！）
I: createdAt
J: updatedAt
```

**解決方法**：
如果欄位順序不對，請按照上面的順序重新排列。

---

### 問題 2：收款人 lineUserId 錯誤

**症狀**：顯示「轉點成功」但接收者點數沒變

**檢查方法**：
1. 在前端開啟 Console（F12）
2. 查看轉點時的 console.log
3. 檢查 `receiverUserId` 是否正確

**測試步驟**：
```javascript
// 在 transfer.html 的 confirmTransfer 函數中加入：
console.log('轉點資料:', transferData);
console.log('發送者 ID:', transferData.senderUserId);
console.log('接收者 ID:', transferData.receiverUserId);
console.log('點數:', transferData.points);
```

---

### 問題 3：API 沒有正確執行

**症狀**：沒有錯誤訊息，但資料沒更新

**檢查方法**：
1. 前往 [Apps Script 執行記錄](https://script.google.com/)
2. 點選左側「執行作業」圖示
3. 查看最近的執行記錄
4. 檢查是否有錯誤

---

## 🛠️ 調試版本代碼

### 方法 1：在 Google Apps Script 加入詳細 Log

在 `transferPoints` 函數開頭加入：

```javascript
function transferPoints(data) {
  try {
    Logger.log('===== 開始轉點 =====');
    Logger.log('傳入參數:', JSON.stringify(data));
    
    const sheet = getSheet(MEMBERS_SHEET);
    const allData = sheet.getDataRange().getValues();
    
    Logger.log('總會員數:', allData.length - 1);
    
    let senderRow = -1;
    let receiverRow = -1;
    let senderName = '';
    let receiverName = '';
    let senderPoints = 0;
    let receiverPoints = 0;
    
    // 找到發送者和接收者
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.senderUserId) {
        senderRow = i + 1;
        senderName = allData[i][1];
        senderPoints = Number(allData[i][7]);
        Logger.log('找到發送者:', { row: senderRow, name: senderName, points: senderPoints });
      }
      if (allData[i][0] === data.receiverUserId) {
        receiverRow = i + 1;
        receiverName = allData[i][1];
        receiverPoints = Number(allData[i][7]);
        Logger.log('找到接收者:', { row: receiverRow, name: receiverName, points: receiverPoints });
      }
    }
    
    // 驗證
    if (senderRow === -1) {
      Logger.log('錯誤: 找不到發送者');
      return { success: false, message: '找不到發送者資料' };
    }
    if (receiverRow === -1) {
      Logger.log('錯誤: 找不到接收者');
      return { success: false, message: '找不到接收者資料' };
    }
    
    // 扣除發送者點數
    const newSenderPoints = senderPoints - data.points;
    Logger.log('更新發送者點數:', { old: senderPoints, new: newSenderPoints, row: senderRow });
    sheet.getRange(senderRow, 8).setValue(newSenderPoints);
    sheet.getRange(senderRow, 10).setValue(new Date().toISOString());
    
    // 增加接收者點數
    const newReceiverPoints = receiverPoints + data.points;
    Logger.log('更新接收者點數:', { old: receiverPoints, new: newReceiverPoints, row: receiverRow });
    sheet.getRange(receiverRow, 8).setValue(newReceiverPoints);
    sheet.getRange(receiverRow, 10).setValue(new Date().toISOString());
    
    Logger.log('===== 轉點完成 =====');
    
    // ... 其餘代碼保持不變
  } catch (error) {
    Logger.log('轉點錯誤:', error.toString());
    return {
      success: false,
      message: '轉點失敗：' + error.toString()
    };
  }
}
```

### 方法 2：測試腳本

在 Apps Script 中創建測試函數：

```javascript
function testTransfer() {
  // 替換成您的測試用戶 ID
  const result = transferPoints({
    senderUserId: '發送者的lineUserId',
    receiverUserId: '接收者的lineUserId',
    points: 10,
    message: '測試轉點'
  });
  
  Logger.log('測試結果:', JSON.stringify(result));
}
```

---

## 🧪 實際測試步驟

### 步驟 1：準備測試帳號

1. 註冊兩個測試帳號（A 和 B）
2. 記錄雙方的：
   - LINE 顯示名稱
   - 手機號碼
   - lineUserId（從 Google Sheets 查看）
   - 初始點數

### 步驟 2：執行轉點

1. 用帳號 A 開啟轉點頁面
2. 輸入帳號 B 的手機號碼
3. 轉 50 點
4. 開啟 Chrome DevTools（F12）
5. 查看 Console 輸出

### 步驟 3：驗證結果

立即檢查 Google Sheets：

| 項目 | 預期結果 | 實際結果 |
|-----|---------|---------|
| A 的點數 | 原始 - 50 | ___ |
| B 的點數 | 原始 + 50 | ___ |
| Transactions 表 | 2 筆記錄 | ___ |
| transfer_out 點數 | -50 | ___ |
| transfer_in 點數 | +50 | ___ |

### 步驟 4：檢查 Log

前往 Apps Script → 執行作業，查看：
```
===== 開始轉點 =====
傳入參數: {...}
找到發送者: {...}
找到接收者: {...}
更新發送者點數: {...}
更新接收者點數: {...}
===== 轉點完成 =====
```

---

## 🚨 緊急修正

如果發現點數確實沒有更新，但沒有錯誤訊息，可能是：

### 可能原因 1：Sheet 權限問題

**解決方法**：
1. 重新部署 Google Apps Script
2. 確認部署設定為「所有人」可存取
3. 確認 Apps Script 有權限編輯 Sheet

### 可能原因 2：資料類型問題

**解決方法**：
在 Apps Script 中，確保點數是數字：
```javascript
// 修改前
senderPoints = allData[i][7];

// 修改後
senderPoints = Number(allData[i][7]) || 0;
```

---

## 📊 完整調試輸出範例

### 正常情況：

```
Console (前端):
轉點資料: {senderUserId: "Uabcd...", receiverUserId: "Uxyz...", points: 50}
API 回應: {success: true, message: "轉點成功"}

Logger (後端):
===== 開始轉點 =====
傳入參數: {"senderUserId":"Uabcd...","receiverUserId":"Uxyz...","points":50}
找到發送者: {row: 2, name: "測試A", points: 150}
找到接收者: {row: 3, name: "測試B", points: 100}
更新發送者點數: {old: 150, new: 100, row: 2}
更新接收者點數: {old: 100, new: 150, row: 3}
===== 轉點完成 =====
```

### 異常情況：

```
Logger:
===== 開始轉點 =====
傳入參數: {"senderUserId":"Uabcd...","receiverUserId":"Uwrong...","points":50}
找到發送者: {row: 2, name: "測試A", points: 150}
錯誤: 找不到接收者
```

---

## 🔧 修正建議

根據您的測試結果，我可以提供針對性的修正方案。

請執行上述測試步驟，並回報：
1. Google Sheets 中的實際變化
2. Console 輸出
3. Logger 輸出（如果有加入 Log）
4. 任何錯誤訊息

---

**需要協助嗎？**

提供以下資訊可以幫助我更快找到問題：
- 📸 Google Sheets 的截圖（Members 和 Transactions 表）
- 📸 Console 的截圖（F12 → Console）
- 📄 完整的錯誤訊息

