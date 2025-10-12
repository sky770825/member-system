# 🧪 API 測試指南

## 📡 API 基本資訊

**API URL:** 
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec
```

**狀態:** ✅ 已部署並正常運行

---

## 🔍 API 測試 URL

### 1. 檢查 API 狀態
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec
```
**預期回應:** `{"success":false,"message":"未知的操作"}`
**說明:** 這表示 API 正常運行，只是缺少 action 參數

---

### 2. 取得系統統計 (管理員)
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=admin-stats
```
**預期回應:**
```json
{
  "success": true,
  "stats": {
    "totalMembers": 10,
    "totalPoints": 5000,
    "totalTransactions": 25,
    "todayNewMembers": 2
  }
}
```

---

### 3. 取得所有會員列表 (管理員)
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=admin-members
```
**預期回應:**
```json
{
  "success": true,
  "members": [
    {
      "lineUserId": "U1234567890abcdef",
      "name": "張三",
      "phone": "0912345678",
      "points": 500,
      "memberLevel": "SILVER",
      "referralCode": "ABC123",
      "referredBy": "",
      "referralCount": 3,
      "status": "active"
    }
  ]
}
```

---

### 4. 檢查會員是否存在
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=check&lineUserId=U1234567890abcdef
```
**預期回應:**
```json
{
  "success": true,
  "exists": true,
  "member": {
    "name": "張三",
    "points": 500
  }
}
```

---

### 5. 透過手機號碼檢查會員
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=check-user&phone=0912345678
```
**預期回應:**
```json
{
  "success": true,
  "exists": true,
  "lineUserId": "U1234567890abcdef",
  "name": "張三",
  "points": 500
}
```

---

### 6. 取得會員資料
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=profile&lineUserId=U1234567890abcdef
```
**預期回應:**
```json
{
  "success": true,
  "member": {
    "lineUserId": "U1234567890abcdef",
    "name": "張三",
    "phone": "0912345678",
    "email": "test@example.com",
    "points": 500,
    "memberLevel": "SILVER",
    "referralCode": "ABC123"
  }
}
```

---

### 7. 取得交易記錄
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=transactions&lineUserId=U1234567890abcdef&limit=20
```
**預期回應:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "TXN001",
      "type": "EARN",
      "points": 100,
      "message": "註冊獎勵",
      "createdAt": "2025-01-15 10:30:00"
    }
  ]
}
```

---

### 8. 驗證推薦碼
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=verify-referral&referralCode=ABC123
```
**預期回應:**
```json
{
  "success": true,
  "valid": true,
  "referrer": {
    "name": "張三",
    "referralCode": "ABC123"
  }
}
```

---

### 9. 取得推薦統計
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=referral-stats
```
**預期回應:**
```json
{
  "success": true,
  "stats": {
    "totalReferrals": 15,
    "activeReferrers": 5,
    "topReferrers": [
      {
        "name": "張三",
        "referralCount": 10,
        "totalRewards": 500
      }
    ]
  }
}
```

---

## 🔧 需要 POST 的操作

以下操作需要使用 POST 方法（在前端 HTML 中使用 `fetch` 呼叫）：

### 10. 註冊新會員
```javascript
fetch('API_URL?action=register', {
  method: 'GET',  // 為了避免 CORS，使用 GET
  // 或使用 POST:
  // method: 'POST',
  // body: JSON.stringify({...})
});
```

**參數:**
- `lineUserId`: LINE 使用者 ID
- `name`: 姓名
- `phone`: 手機號碼
- `email`: 電子郵件 (選填)
- `birthday`: 生日 (選填)
- `referralCode`: 推薦碼 (選填)

---

### 11. 轉點
```javascript
fetch('API_URL?action=transfer', {
  method: 'GET',
  // 參數: senderUserId, receiverUserId, points, message
});
```

---

### 12. 調整點數 (管理員)
```
https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=adjust-points&lineUserId=U1234567890abcdef&points=100&reason=測試調整
```

---

## 🧪 測試步驟

### 方法 1: 瀏覽器直接測試
1. 複製上面的測試 URL
2. 貼到瀏覽器網址列
3. 按 Enter 查看回應

### 方法 2: 使用 Postman
1. 開啟 Postman
2. 選擇 GET 方法
3. 貼上測試 URL
4. 點擊 Send

### 方法 3: 使用 curl (終端機)
```bash
curl "https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=admin-stats"
```

### 方法 4: 使用 JavaScript Console
```javascript
fetch('https://script.google.com/macros/s/AKfycbwEGrFXmC6rlRuDvhkTpL37PYrNCzzF5YPWI1AkDf9zijfL_HCbMDqPx6ya5XOTZjIF/exec?action=admin-stats')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 📋 API 參數對照表

| Action | 必要參數 | 選填參數 | 方法 |
|--------|----------|----------|------|
| check | lineUserId | - | GET |
| profile | lineUserId | - | GET |
| check-user | phone | - | GET |
| register | lineUserId, name, phone | email, birthday, referralCode | GET/POST |
| update-profile | lineUserId | email, birthday | GET/POST |
| transactions | lineUserId | limit | GET |
| transfer | senderUserId, receiverUserId, points | message | GET/POST |
| verify-referral | referralCode | - | GET |
| referral-stats | - | - | GET |
| admin-stats | - | - | GET |
| admin-members | - | - | GET |
| adjust-points | lineUserId, points | reason | GET/POST |

---

## ✅ 測試檢查清單

- [ ] API 基本連線測試（無參數）
- [ ] 取得系統統計
- [ ] 取得會員列表
- [ ] 檢查會員是否存在
- [ ] 透過手機查詢會員
- [ ] 取得會員資料
- [ ] 取得交易記錄
- [ ] 驗證推薦碼
- [ ] 取得推薦統計
- [ ] 註冊新會員（前端測試）
- [ ] 轉點功能（前端測試）
- [ ] 調整點數（管理員）

---

## 🔍 常見回應

### 成功回應
```json
{
  "success": true,
  "data": {...}
}
```

### 錯誤回應
```json
{
  "success": false,
  "message": "錯誤訊息"
}
```

### CORS 回應
所有回應都包含 CORS 標頭，允許跨域請求：
```
Access-Control-Allow-Origin: *
Content-Type: application/json
```

---

## 🚨 故障排除

### 問題 1: 回應 "未知的操作"
**原因:** 缺少或錯誤的 action 參數
**解決:** 檢查 URL 中的 `action=` 參數

### 問題 2: 回應空白或錯誤
**原因:** Google Sheets 權限或 SHEET_ID 錯誤
**解決:** 
1. 檢查 `SHEET_ID` 是否正確
2. 確認 Google Sheets 權限已授權

### 問題 3: 資料未更新
**原因:** Sheets 可能需要時間同步
**解決:** 等待幾秒後重新測試

---

## 📝 註記

1. ✅ API 已部署到生產環境
2. ✅ 支援 CORS 跨域請求
3. ✅ 所有 GET 請求可直接在瀏覽器測試
4. ⚠️ 敏感操作建議加入身份驗證
5. 📊 建議監控 API 使用量

---

**🎉 API 測試完成後，即可正式使用！**

