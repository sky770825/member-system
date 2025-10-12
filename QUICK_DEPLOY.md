# 🚀 快速部署指南

## 概述

本系統是一個**可配置的公版會員積分系統**，可快速套用到不同產業：
- 🍽️ 餐飲業
- 💅 美容美髮
- 🛍️ 零售商店
- 💪 健身房
- ☕ 咖啡廳
- 🏨 飯店旅館
- 🎓 教育機構
- ...等更多產業

---

## ⚡ 5 分鐘快速部署

### 步驟 1：選擇產業模板

從 `templates/` 資料夾選擇最接近的產業模板：

```bash
# 餐飲業
cp templates/restaurant-config.js config.js

# 美容業
cp templates/beauty-config.js config.js

# 健身房
cp templates/fitness-config.js config.js

# 或使用通用模板自行配置
cp config.template.js config.js
```

### 步驟 2：修改配置文件

編輯 `config.js`，修改以下關鍵設定：

```javascript
const CONFIG = {
  system: {
    name: '您的系統名稱',           // 改為您的品牌名稱
  },
  
  brand: {
    companyName: '您的公司名稱',
    primaryColor: '#FF6B6B',        // 改為您的品牌色
  },
  
  points: {
    name: '點數名稱',              // 例如：美食點數、美麗積分
    initialPoints: 100,            // 註冊贈送數量
  },
  
  api: {
    googleAppsScript: 'YOUR_URL',  // 填入您的 Apps Script URL
  },
  
  liff: {
    register: 'YOUR_LIFF_ID',      // 填入您的 LIFF ID
    // ...
  }
};
```

### 步驟 3：自訂品牌樣式

編輯 `assets/style.css`，或使用自動產生工具：

```bash
# 運行品牌自訂工具（未來開發）
node tools/customize-brand.js
```

### 步驟 4：更新 Google Apps Script

1. 複製 `google-apps-script.js` 到 Google Apps Script
2. 修改 `SHEET_ID`
3. 部署為 Web App
4. 複製部署 URL 到 `config.js`

### 步驟 5：部署到 GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/您的用戶名/倉庫名.git
git push -u origin main
```

啟用 GitHub Pages 後，更新 LINE LIFF Endpoint URLs。

---

## 📋 完整配置清單

### 必填項目
- [ ] 系統名稱
- [ ] 公司名稱
- [ ] 品牌主色調
- [ ] 點數名稱和單位
- [ ] Google Apps Script URL
- [ ] Google Sheets ID
- [ ] LINE LIFF IDs（5 個）
- [ ] 註冊表單欄位

### 選填項目
- [ ] Logo 圖片
- [ ] Favicon
- [ ] 會員等級設定
- [ ] 兌換商品列表
- [ ] 自訂文字內容
- [ ] 功能開關

---

## 🎨 品牌自訂指南

### 1. 顏色主題

編輯 `config.js` 中的顏色設定：

```javascript
brand: {
  primaryColor: '#06C755',    // 主色調
  secondaryColor: '#6c757d',  // 次要顏色
  accentColor: '#FFD700',     // 強調色
}
```

系統會自動套用到：
- 按鈕
- 標題
- 進度條
- 圖示

### 2. Logo 和圖片

將您的檔案放入 `assets/` 資料夾：

```
assets/
  ├── logo.png          （建議尺寸：500x500）
  ├── favicon.ico       （建議尺寸：32x32）
  ├── banner.jpg        （選用）
  └── og-image.png      （社群分享圖片）
```

### 3. 文字內容

在 `config.js` 修改所有顯示文字：

```javascript
text: {
  welcomeMessage: '歡迎來到...',
  registerSuccess: '註冊成功訊息',
  features: [
    { icon: '✨', title: '特色 1', desc: '說明' },
    // ...
  ]
}
```

---

## 🏭 產業特定功能

### 餐飲業
- ✅ 消費折抵（每 $1 = X 點）
- ✅ 訂位系統
- ✅ 菜單瀏覽
- ✅ QR Code 掃碼點餐

### 美容美髮
- ✅ 線上預約
- ✅ 服務記錄
- ✅ 膚質管理
- ✅ 產品推薦

### 健身房
- ✅ 課程預約
- ✅ 打卡簽到
- ✅ 運動記錄
- ✅ 目標追蹤

### 零售業
- ✅ 商品目錄
- ✅ 訂單追蹤
- ✅ 庫存通知
- ✅ 會員專屬價

---

## 📦 功能模組

系統採用模組化設計，可自由啟用/關閉功能：

```javascript
features: {
  register: true,        // 會員註冊
  transfer: true,        // 轉點功能
  exchange: false,       // 點數兌換
  checkin: false,        // 每日簽到
  invite: false,         // 邀請好友
  qrcode: false,         // QR Code
  location: false,       // 地理位置
}
```

---

## 🔧 進階自訂

### 自訂表單欄位

```javascript
formFields: {
  register: [
    { name: 'customField', label: '自訂欄位', type: 'text', required: false },
  ]
}
```

### 自訂會員等級

```javascript
memberLevels: {
  levels: [
    { id: 'vip', name: 'VIP', minPoints: 10000, icon: '👑', discount: 0.2 },
  ]
}
```

### 自訂兌換商品

```javascript
exchangeItems: [
  { id: 'item1', name: '商品名稱', points: 100, icon: '🎁', stock: 50 },
]
```

---

## 📞 技術支援

遇到問題？查看：
1. [常見問題 FAQ](./FAQ.md)
2. [部署指南](./部署指南.md)
3. [API 文檔](./API_DOCS.md)
4. [故障排除](./TROUBLESHOOTING.md)

---

## 🎯 範例專案

查看不同產業的實際部署案例：

1. **餐廳範例**：https://example-restaurant.github.io/
2. **美容院範例**：https://example-beauty.github.io/
3. **健身房範例**：https://example-fitness.github.io/

---

## 📄 授權

MIT License - 可自由使用於商業專案

---

**開始使用您的專屬會員系統！** 🚀

