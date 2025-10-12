# 會員註冊系統

這是一個整合 LINE LIFF 的會員點數管理系統，提供會員註冊、點數查詢、點數轉移等功能。

## 🌟 功能特色

- ✨ **會員註冊** - 新會員註冊即贈送 100 點
- 👤 **會員中心** - 查看個人資料和點數餘額
- 💸 **點數轉移** - 將點數轉給其他會員
- 📱 **LINE 整合** - 透過 LINE LIFF SDK 快速登入
- 🎨 **現代化 UI** - 響應式設計，支援各種裝置

## 📁 專案結構

```
會員註冊系統/
├── index.html          # 首頁
├── register.html       # 註冊頁面
├── profile.html        # 會員中心
├── transfer.html       # 轉點頁面
├── assets/
│   └── style.css      # 樣式表
└── README.md          # 說明文件
```

## 📚 完整文件

- **[快速配置指南](./快速配置指南.md)** - 5 分鐘快速設定所有參數
- **[部署指南](./部署指南.md)** - 詳細的部署步驟和平台選擇
- **[使用說明](./使用說明.md)** - 功能說明和完整 API 文件
- **[系統架構說明](./系統架構說明.md)** - 系統架構和資料流程
- **[Google Apps Script](./google-apps-script.js)** - 後端 API 程式碼
- **[N8N Workflow](./n8n-workflow.json)** - N8N 整合範本（選用）
- **[設定檔範本](./config.template.js)** - JavaScript 設定檔範本

## 🚀 快速開始

**⚡ 最快 5 分鐘部署！請參考 [快速配置指南](./快速配置指南.md)**

### 1. 設定 LINE LIFF

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立一個新的 LIFF 應用程式
3. 記下您的 LIFF ID

### 2. 設定 Google Sheets 與 Apps Script

**推薦使用 Google Apps Script 作為後端（免費且簡單）：**

1. 建立一個新的 [Google Sheets](https://sheets.google.com/)
2. 在 Google Sheets 中開啟 **擴充功能 → Apps Script**
3. 複製 [google-apps-script.js](./google-apps-script.js) 的所有內容
4. 修改第一行的 `SHEET_ID` 為您的 Google Sheet ID
5. 部署為 **網頁應用程式**（執行身分：我，存取權：所有人）
6. 複製部署的 **Web App URL**

**詳細步驟請參考 [部署指南](./部署指南.md)**

### 2.1 使用 N8N Webhook（選用，進階功能）

如需使用 N8N 作為中間層，請參考 [n8n-workflow.json](./n8n-workflow.json) 範本。

API 端點：
- `GET /exec?action=profile` - 取得會員資料
- `GET /exec?action=check` - 檢查會員是否已註冊
- `POST /exec?action=register` - 註冊新會員
- `GET /exec?action=check-user` - 透過手機號碼檢查會員
- `POST /exec?action=transfer` - 轉點
- `GET /exec?action=transactions` - 取得交易記錄

**完整 API 文件請參考 [使用說明](./使用說明.md)**

### 3. 更新前端設定

**快速方法：使用「搜尋取代」功能**

詳細步驟請參考 [快速配置指南](./快速配置指南.md)

需要替換的內容：
- `YOUR_LIFF_ID` → 您的 LIFF ID
- `YOUR_DEPLOYMENT_ID` → 您的 Apps Script 部署 ID
- `YOUR_USERNAME.github.io/YOUR_REPO` → 您的網站網址

#### 範例：

**register.html (第 63 行):**
```javascript
await liff.init({ liffId: "2000000001-AbCd1234" }); // 您的註冊頁面 LIFF ID
```

**所有 HTML 檔案中的 API URL:**
```javascript
const res = await fetch('https://script.google.com/macros/s/AKfycbz.../exec?action=register', {
  // ...
});
```

### 4. 部署前端

**推薦使用 GitHub Pages（免費、簡單）：**

1. 建立 GitHub Repository
2. 上傳所有檔案（index.html, register.html, profile.html, transfer.html, assets/）
3. 在 Repository 設定中啟用 GitHub Pages
4. 等待 1-2 分鐘完成部署
5. 您的網站網址：`https://YOUR_USERNAME.github.io/YOUR_REPO/`

**其他選擇：**
- **Vercel** - 快速全球 CDN，自動 HTTPS
- **Netlify** - 簡單部署，免費 SSL
- **Zeabur** - 支援自訂網域（付費）

**詳細部署步驟請參考 [部署指南](./部署指南.md)**

### 5. 設定 LIFF Endpoint URL

在 LINE Developers Console 中，將 LIFF 的 Endpoint URL 設定為：

- 註冊頁面：`https://YOUR_DOMAIN/register.html`
- 會員中心：`https://YOUR_DOMAIN/profile.html`
- 轉點頁面：`https://YOUR_DOMAIN/transfer.html`

## 🎨 自訂樣式

所有樣式都在 `assets/style.css` 中，您可以修改以下變數來自訂外觀：

```css
:root {
  --primary-color: #06C755;      /* 主要顏色 */
  --secondary-color: #00B900;     /* 次要顏色 */
  --text-primary: #333333;        /* 主要文字顏色 */
  --bg-primary: #FFFFFF;          /* 主要背景色 */
  /* ... 更多變數 */
}
```

## 📱 頁面說明

### 首頁 (index.html)
- 系統介紹和功能說明
- 快速連結到各個頁面

### 註冊頁面 (register.html)
- 新會員註冊表單
- 自動取得 LINE 使用者資料
- 手機號碼格式驗證
- 註冊成功贈送 100 點

### 會員中心 (profile.html)
- 顯示會員資料和頭像
- 當前點數顯示
- 轉點、查詢記錄、編輯資料等功能

### 轉點頁面 (transfer.html)
- 輸入收款人手機號碼
- 自動驗證收款人是否存在
- 快速選擇轉點金額
- 轉點確認視窗

## 🔧 技術堆疊

- **前端框架：** 純 HTML/CSS/JavaScript
- **LINE SDK：** LIFF SDK v2
- **後端：** N8N Webhook
- **樣式：** CSS3 with Custom Properties
- **動畫：** CSS Animations

## 🎯 資料庫結構建議

建議在 N8N 或您的資料庫中使用以下結構：

### Members 表
```sql
{
  lineUserId: String (Primary Key),
  name: String,
  phone: String (Unique),
  email: String,
  birthday: Date,
  lineName: String,
  linePicture: String,
  points: Number (預設 100),
  createdAt: Date,
  updatedAt: Date
}
```

### Transactions 表
```sql
{
  id: String (Primary Key),
  type: String, // 'register', 'transfer_in', 'transfer_out'
  senderUserId: String,
  receiverUserId: String,
  points: Number,
  message: String,
  createdAt: Date
}
```

## 📝 API 範例

### 註冊 API
```javascript
// POST https://YOUR_N8N_URL/webhook/register
{
  "lineUserId": "U1234567890",
  "name": "王小明",
  "phone": "0912-345-678",
  "email": "example@email.com",
  "birthday": "1990-01-01",
  "lineName": "Wang Ming",
  "linePicture": "https://..."
}

// Response
{
  "success": true,
  "message": "註冊成功",
  "points": 100
}
```

### 查詢會員 API
```javascript
// GET https://YOUR_N8N_URL/webhook/profile?lineUserId=U1234567890

// Response
{
  "name": "王小明",
  "phone": "0912-345-678",
  "email": "example@email.com",
  "points": 150
}
```

### 轉點 API
```javascript
// POST https://YOUR_N8N_URL/webhook/transfer
{
  "senderUserId": "U1234567890",
  "receiverPhone": "0912-345-678",
  "receiverUserId": "U0987654321",
  "points": 50,
  "message": "謝謝你！"
}

// Response
{
  "success": true,
  "message": "轉點成功",
  "remainingPoints": 100
}
```

## 🐛 常見問題

### Q: LIFF SDK 無法初始化
**A:** 請確認：
1. LIFF ID 是否正確
2. Endpoint URL 已正確設定在 LINE Developers Console
3. 網址使用 HTTPS

### Q: 系統錯誤，請稍後再試
**A:** 請檢查：
1. Apps Script 的部署 URL 是否正確
2. 「具有應用程式存取權的使用者」是否設為「所有人」
3. 查看 Apps Script 的執行紀錄是否有錯誤

### Q: 找不到會員資料
**A:** 請檢查：
1. Google Sheet ID 是否正確
2. 工作表名稱是否為 "Members" 和 "Transactions"
3. 檢查 Apps Script 執行紀錄

### Q: 手機號碼格式錯誤
**A:** 系統會自動格式化為 `0912-345-678` 格式，請確保輸入 10 位數字。

### Q: 轉點失敗
**A:** 檢查：
- 點數是否足夠
- 收款人是否存在
- 是否轉點給自己
- 網路連線是否正常

**更多問題請參考 [快速配置指南 - 常見錯誤排查](./快速配置指南.md#常見錯誤排查)**

## 📊 系統架構

本系統採用以下架構：
- **前端**: 靜態 HTML/CSS/JavaScript + LINE LIFF SDK
- **後端**: Google Apps Script (可選用 N8N)
- **資料庫**: Google Sheets
- **認證**: LINE LIFF 自動登入

詳細架構圖請參考 [系統架構說明](./系統架構說明.md)

## 🎯 部署方案比較

| 方案 | 成本 | 難度 | 適用 |
|------|------|------|------|
| **方案 A**: GitHub Pages + Apps Script + Sheets | 免費 | ⭐ 簡單 | < 1000 會員 |
| **方案 B**: Vercel + N8N + Sheets | $10/月 | ⭐⭐ 中等 | 1000-10000 會員 |
| **方案 C**: VPS + PostgreSQL | $50/月 | ⭐⭐⭐ 進階 | > 10000 會員 |

**推薦新手使用方案 A，完全免費且功能完整！**

## 📈 擴充功能

系統已預留擴充介面，可以輕鬆新增：

- ✅ 點數記錄查詢
- ✅ 會員資料編輯
- ✅ 點數排行榜
- ✅ 統計報表
- ✅ LINE 推播通知
- ✅ 金流整合（購買點數）
- ✅ 商品兌換系統

請參考 [使用說明 - 擴充功能](./使用說明.md#擴充功能) 章節。

## 📄 授權

MIT License - 可自由使用和修改

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📞 技術支援

如有問題，請參考以下文件：
1. [快速配置指南](./快速配置指南.md) - 設定問題
2. [部署指南](./部署指南.md) - 部署問題
3. [使用說明](./使用說明.md) - 功能和 API 問題
4. [系統架構說明](./系統架構說明.md) - 架構相關問題

---

**祝您使用愉快！** 🎉

Made with ❤️ by [Your Name]
