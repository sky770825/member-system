# CORS 錯誤完整解決指南

## 🚨 錯誤症狀

您可能看到以下錯誤訊息：

```
Access to fetch at 'https://script.google.com/macros/s/AKfycbz.../exec?action=register' 
from origin 'https://sky770825.github.io' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

或者：

```
Failed to load resource: net::ERR_FAILED
註冊錯誤: TypeError: Failed to fetch
```

---

## 🔍 問題原因

### 什麼是 CORS？

CORS (Cross-Origin Resource Sharing，跨源資源共享) 是瀏覽器的安全機制，防止網頁從不同的域名載入資源。

### 為什麼會發生？

1. **前端域名**：`https://sky770825.github.io`
2. **後端域名**：`https://script.google.com`
3. **不同域名** = 需要 CORS 支持

當前端使用 `POST` 請求並設定 `Content-Type: application/json` 時，瀏覽器會先發送一個「預檢請求」(OPTIONS)，檢查伺服器是否允許跨域請求。

### 預檢請求流程

```
瀏覽器 → [OPTIONS] → Google Apps Script
       ← [CORS Headers] ←
       
瀏覽器 → [POST] → Google Apps Script (只有預檢通過才會發送)
       ← [Response] ←
```

---

## ✅ 解決方案（分步驟）

### 第 1 步：更新 Google Apps Script 代碼

1. 開啟 [Google Apps Script](https://script.google.com/)
2. 找到您的專案
3. **完整替換** `google-apps-script.js` 的內容（使用專案中提供的最新版本）

**關鍵更改：**
- ✅ 添加了 `doOptions()` 函數處理預檢請求
- ✅ 添加了 `createCorsResponse()` 函數統一處理回應
- ✅ 更新了 `doGet()` 和 `doPost()` 使用新的回應函數

### 第 2 步：重新部署 Web App（最重要！）

這是**最關鍵**的步驟，很多人會忘記：

1. 在 Apps Script 編輯器中，點選上方的「**部署**」按鈕
2. 選擇「**管理部署作業**」
3. 找到您現有的部署項目
4. 點選右側的「**鉛筆圖示**」（編輯）
5. 在「**版本**」下拉選單中，選擇「**新版本**」（重要！）
6. 確認「**執行身分**」為「**我**」
7. 確認「**具有應用程式存取權的使用者**」為「**所有人**」
8. 點選「**部署**」

**⚠️ 注意事項：**
- 每次修改程式碼後都必須創建「新版本」
- 不要只是儲存，一定要重新部署
- 部署 URL 不會改變，但內容會更新

### 第 3 步：等待生效

- Google Apps Script 的部署需要 **1-5 分鐘**才會完全生效
- 建議等待 5 分鐘後再測試

### 第 4 步：清除快取

在測試前，請清除瀏覽器快取：

**Chrome / Edge：**
1. 按 `Ctrl + Shift + Delete`（Windows）或 `Cmd + Shift + Delete`（Mac）
2. 選擇「**Cookie 和其他網站資料**」和「**快取的圖片和檔案**」
3. 點選「**清除資料**」

**或使用無痕模式測試：**
- Chrome: `Ctrl + Shift + N`
- Edge: `Ctrl + Shift + P`
- Safari: `Cmd + Shift + N`

### 第 5 步：驗證部署

使用以下方法測試 API 是否正常：

#### 方法 1：使用瀏覽器直接測試（GET 請求）

在瀏覽器網址列輸入：
```
https://script.google.com/macros/s/[您的DEPLOYMENT_ID]/exec?action=check&lineUserId=TEST123
```

**預期結果：**
```json
{"registered": false}
```

#### 方法 2：使用 cURL 測試（推薦）

```bash
# 測試 GET 請求
curl "https://script.google.com/macros/s/[您的ID]/exec?action=check&lineUserId=TEST123"

# 測試 POST 請求
curl -X POST \
  "https://script.google.com/macros/s/[您的ID]/exec?action=register" \
  -H "Content-Type: application/json" \
  -d '{
    "lineUserId": "TEST123",
    "name": "測試用戶",
    "phone": "0912-345-678",
    "email": "test@example.com"
  }'
```

#### 方法 3：使用 Postman / Insomnia

1. 創建 POST 請求
2. URL: `https://script.google.com/macros/s/[您的ID]/exec?action=register`
3. Headers: `Content-Type: application/json`
4. Body: JSON 格式的會員資料

---

## 🔧 替代解決方案

如果上述方法仍然無法解決，可以嘗試以下替代方案：

### 方案 A：改用 GET 請求傳遞資料

修改 `register.html` 的請求方式：

```javascript
// 原本的 POST 請求
const res = await fetch('https://script.google.com/macros/s/.../exec?action=register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

// 改為 GET 請求（不會觸發預檢）
const params = new URLSearchParams(formData);
const res = await fetch(`https://script.google.com/macros/s/.../exec?action=register&${params}`);
```

**缺點：** 資料會出現在 URL 中，不適合敏感資訊。

### 方案 B：使用表單提交

```javascript
const formDataObj = new FormData();
formDataObj.append('lineUserId', lineUserId);
formDataObj.append('name', name);
// ... 其他欄位

const res = await fetch('https://script.google.com/macros/s/.../exec?action=register', {
  method: 'POST',
  body: formDataObj  // 使用 FormData，不設定 Content-Type
});
```

**優點：** 不會觸發 CORS 預檢請求。

### 方案 C：使用代理伺服器（進階）

如果您有自己的後端伺服器或使用 N8N：

```
前端 → 您的伺服器/N8N → Google Apps Script
```

這樣前端只需要與同域名的伺服器通訊，不會有 CORS 問題。

---

## 🔍 除錯技巧

### 1. 檢查網路請求

**Chrome DevTools：**
1. 按 `F12` 開啟開發者工具
2. 切換到「**Network**」（網路）標籤
3. 勾選「**Preserve log**」（保留記錄）
4. 執行註冊操作
5. 查找 `exec` 請求

**檢查項目：**
- **狀態碼**：應該是 200
- **Request Headers**：檢查 `Origin`
- **Response Headers**：查看是否有 `Access-Control-Allow-Origin`

### 2. 查看 Console 錯誤

在 Chrome DevTools 的「**Console**」標籤中：
- 查看完整的錯誤訊息
- 檢查是否有其他 JavaScript 錯誤

### 3. 檢查 Apps Script 執行記錄

1. 前往 [Apps Script 編輯器](https://script.google.com/)
2. 點選左側的「**執行作業**」（時鐘圖示）
3. 查看最近的執行記錄
4. 檢查是否有錯誤訊息

---

## 📋 完整檢查清單

部署前請確認：

- [ ] 已更新 `google-apps-script.js` 到最新版本
- [ ] 已將正確的 `SHEET_ID` 填入程式碼
- [ ] 已創建「新版本」並重新部署
- [ ] 部署設定為「所有人」可存取
- [ ] 已等待 5 分鐘讓部署生效
- [ ] 已清除瀏覽器快取
- [ ] 所有 HTML 檔案中的 Apps Script URL 都已更新
- [ ] 所有 HTML 檔案中的 LIFF ID 都已更新
- [ ] GitHub Pages 已成功部署
- [ ] LIFF Endpoint URL 已更新為 GitHub Pages 網址

---

## ❓ 常見疑問

### Q: 為什麼 GET 請求沒問題，POST 就有 CORS 錯誤？

A: 因為使用 `Content-Type: application/json` 的 POST 請求屬於「非簡單請求」，會觸發 CORS 預檢。而 GET 請求屬於「簡單請求」，不需要預檢。

### Q: 我已經重新部署了，為什麼還是不行？

A: 
1. 確認是否創建了「新版本」（不是只點「儲存」）
2. 等待 5-10 分鐘
3. 清除快取或使用無痕模式測試
4. 檢查是否使用正確的部署 URL

### Q: 可以完全關閉 CORS 檢查嗎？

A: 不建議。CORS 是瀏覽器的安全機制，應該正確配置而不是關閉。正確的做法是讓伺服器返回適當的 CORS 標頭。

### Q: 為什麼 Apps Script 不自動處理 CORS？

A: Google Apps Script 在正確部署後會自動添加 CORS 標頭，但需要：
- 部署為「Web App」
- 設定為「所有人」可存取
- 使用最新版本的部署

---

## 🆘 仍然無法解決？

如果您已經嘗試了所有方法仍然無法解決，請提供以下資訊：

1. **完整的錯誤訊息**（從 Chrome DevTools Console 複製）
2. **Network 標籤的截圖**（顯示請求詳情）
3. **Apps Script 執行記錄的截圖**
4. **部署設定的截圖**
5. **使用的 Apps Script URL**（可以遮蔽部分 ID）

提供這些資訊可以幫助快速診斷問題。

---

## 📚 延伸閱讀

- [MDN - CORS 詳解](https://developer.mozilla.org/zh-TW/docs/Web/HTTP/CORS)
- [Google Apps Script - Web Apps](https://developers.google.com/apps-script/guides/web)
- [了解 CORS 預檢請求](https://developer.mozilla.org/zh-TW/docs/Glossary/Preflight_request)

---

**祝您順利解決 CORS 問題！** 🎉

如有其他問題，歡迎隨時詢問。

