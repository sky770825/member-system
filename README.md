# 🎯 通用會員積分系統 (Universal Membership System)

> 一套可快速部署到各種產業的會員積分管理系統  
> 採用 LINE LIFF + Google Apps Script，零伺服器成本

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## ✨ 特色

### 🎨 高度可配置
- ✅ 一個配置文件完成所有設定
- ✅ 支援品牌顏色、Logo 自訂
- ✅ 彈性的表單欄位設計
- ✅ 模組化功能開關

### 🏭 多產業適用
- 🍽️ **餐飲業**：消費回饋、訂位系統
- 💅 **美容美髮**：預約管理、療程記錄
- 🛍️ **零售業**：商品兌換、會員優惠
- 💪 **健身房**：打卡簽到、課程預約
- ☕ **咖啡廳**：集點換贈品
- 🏨 **旅館飯店**：住宿積分、會員升等
- ...更多產業持續新增

### 💰 零伺服器成本
- 使用 Google Sheets 作為資料庫（免費）
- 使用 Google Apps Script 作為後端（免費）
- 使用 GitHub Pages 作為前端（免費）
- 整合 LINE LIFF 快速登入

### 🚀 快速部署
- 5 分鐘完成基礎配置
- 提供多種產業模板
- 詳細的部署文件

---

## 📦 功能清單

### 核心功能
- ✅ 會員註冊/登入（LINE LIFF）
- ✅ 點數管理
- ✅ 點數轉讓
- ✅ 交易記錄
- ✅ 會員等級
- ✅ 個人資料編輯

### 擴充功能
- 🔲 點數兌換商品
- 🔲 每日簽到
- 🔲 邀請好友獎勵
- 🔲 QR Code 掃碼
- 🔲 生日禮遇
- 🔲 推播通知
- 🔲 數據統計儀表板
- 🔲 管理後台

---

## 🎯 適用場景

| 產業 | 點數名稱 | 主要功能 | 範例配置 |
|-----|---------|---------|---------|
| 🍽️ 餐飲 | 美食點數 | 消費回饋、訂位 | [查看](./templates/restaurant-config.js) |
| 💅 美容 | 美麗積分 | 預約管理、療程記錄 | [查看](./templates/beauty-config.js) |
| 💪 健身 | 健康點數 | 打卡簽到、課程預約 | [查看](./templates/fitness-config.js) |
| 🛍️ 零售 | 購物金 | 商品兌換、會員價 | [查看](./templates/retail-config.js) |
| ☕ 咖啡 | 咖啡豆 | 集點換飲品 | [查看](./templates/coffee-config.js) |

---

## 🚀 快速開始

### 前置需求
- GitHub 帳號
- Google 帳號
- LINE Developers 帳號

### 步驟 1：Clone 專案
```bash
git clone https://github.com/sky770825/member-system.git
cd member-system
```

### 步驟 2：選擇產業模板
```bash
# 餐飲業
cp templates/restaurant-config.js config.js

# 美容業
cp templates/beauty-config.js config.js

# 健身房
cp templates/fitness-config.js config.js

# 自訂配置
cp config.template.js config.js
```

### 步驟 3：編輯配置
編輯 `config.js`，填入您的：
- 公司名稱
- 品牌顏色
- Google Apps Script URL
- LINE LIFF IDs

### 步驟 4：部署
詳細步驟請參考 [快速部署指南](./QUICK_DEPLOY.md)

---

## 📚 文件

- 📖 [快速部署指南](./QUICK_DEPLOY.md) - 5 分鐘完成部署
- 🔧 [完整部署指南](./部署指南.md) - 詳細步驟說明
- ⚙️ [配置文件說明](./CONFIG_GUIDE.md) - 所有配置選項
- 🎨 [品牌自訂指南](./BRANDING_GUIDE.md) - 客製化外觀
- 🔌 [API 文檔](./API_DOCS.md) - 後端 API 說明
- ❓ [常見問題](./FAQ.md) - 常見問題解答
- 🐛 [故障排除](./TROUBLESHOOTING.md) - 問題診斷

---

## 🎨 範例展示

### 餐廳會員系統
![餐廳範例](./docs/screenshots/restaurant-demo.png)
[線上預覽](https://example-restaurant.github.io/) | [配置檔案](./templates/restaurant-config.js)

### 美容院會員系統
![美容範例](./docs/screenshots/beauty-demo.png)
[線上預覽](https://example-beauty.github.io/) | [配置檔案](./templates/beauty-config.js)

### 健身房會員系統
![健身範例](./docs/screenshots/fitness-demo.png)
[線上預覽](https://example-fitness.github.io/) | [配置檔案](./templates/fitness-config.js)

---

## 🏗️ 系統架構

```
前端 (GitHub Pages)
    ↓ HTTPS
LINE LIFF SDK
    ↓ LINE Login
會員系統 (HTML/CSS/JS)
    ↓ Fetch API
Google Apps Script (後端)
    ↓ Apps Script API
Google Sheets (資料庫)
```

### 技術棧
- **前端**：HTML5, CSS3, Vanilla JavaScript
- **後端**：Google Apps Script
- **資料庫**：Google Sheets
- **認證**：LINE LIFF SDK
- **部署**：GitHub Pages

---

## 📊 資料結構

### Members 工作表
| 欄位 | 說明 | 類型 |
|-----|------|-----|
| lineUserId | LINE 用戶 ID | String |
| name | 姓名 | String |
| phone | 手機號碼 | String |
| email | 電子郵件 | String |
| birthday | 生日 | Date |
| points | 目前點數 | Number |
| level | 會員等級 | String |
| createdAt | 註冊時間 | DateTime |
| updatedAt | 更新時間 | DateTime |

### Transactions 工作表
| 欄位 | 說明 | 類型 |
|-----|------|-----|
| id | 交易 ID | String |
| type | 交易類型 | String |
| senderUserId | 發送者 ID | String |
| receiverUserId | 接收者 ID | String |
| points | 點數變動 | Number |
| message | 備註 | String |
| createdAt | 交易時間 | DateTime |

---

## 🔧 進階客製化

### 自訂表單欄位
```javascript
formFields: {
  register: [
    { name: 'customField', label: '自訂欄位', type: 'text', required: false },
    { name: 'preference', label: '偏好', type: 'select', options: ['選項1', '選項2'] },
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
  { id: 'item1', name: '商品', points: 100, icon: '🎁', stock: 50 },
]
```

---

## 💡 使用案例

### 🍽️ 案例 1：餐廳集點系統
**需求**：消費送點數，點數換免費餐點
- 每消費 $100 = 10 點
- 100 點換飲料
- 500 點換主餐

### 💅 案例 2：美容院會員卡
**需求**：儲值送點數，不同等級享折扣
- 儲值 $10,000 送 1,000 點
- 金卡會員享 9 折
- 生日月額外 8 折

### 💪 案例 3：健身房打卡系統
**需求**：到場打卡累積點數，兌換教練課
- 每次到場 = 10 點
- 連續 7 天額外 50 點
- 500 點換私人教練課

---

## 🤝 貢獻

歡迎貢獻代碼、回報問題或提出建議！

1. Fork 這個專案
2. 創建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟一個 Pull Request

---

## 📝 待辦事項

- [ ] 管理後台開發
- [ ] 數據分析儀表板
- [ ] 推播通知系統
- [ ] QR Code 掃碼功能
- [ ] 多語言支援
- [ ] 深色模式
- [ ] 產業模板擴充（更多產業）
- [ ] 自動化部署腳本
- [ ] 單元測試

---

## 📄 授權

MIT License - 可自由使用於商業專案

Copyright (c) 2025 

---

## 📞 聯絡我們

- 問題回報：[GitHub Issues](https://github.com/sky770825/member-system/issues)
- 功能建議：[GitHub Discussions](https://github.com/sky770825/member-system/discussions)
- Email：your-email@example.com

---

## 🌟 感謝

感謝所有貢獻者讓這個專案更好！

如果這個專案對您有幫助，請給個 ⭐️ Star！

---

**立即開始打造您的專屬會員系統！** 🚀
