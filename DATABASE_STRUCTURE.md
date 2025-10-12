# 🗄️ 完整資料庫架構建議

## 目前架構（基礎版）

### 現有工作表：
1. **Members** - 會員資料
2. **Transactions** - 交易記錄

---

## 🚀 建議擴充架構（進階版）

### 核心工作表（必要）

#### 1. Members（會員資料）✅ 已有
```
欄位：
- lineUserId
- name
- phone
- email
- birthday
- lineName
- linePicture
- points (當前點數)
- memberLevel (會員等級)
- totalEarned (累計獲得點數)
- totalSpent (累計消費點數)
- referralCode (推薦碼)
- referredBy (被誰推薦)
- status (active/inactive/suspended)
- lastLoginAt (最後登入)
- createdAt
- updatedAt
```

**建議新增欄位**：
- `memberLevel` - 銅/銀/金/白金
- `totalEarned` - 累計獲得（統計用）
- `totalSpent` - 累計消費（統計用）
- `referralCode` - 自己的推薦碼
- `referredBy` - 被誰推薦（邀請功能）
- `status` - 帳號狀態
- `lastLoginAt` - 最後登入時間

---

#### 2. Transactions（交易記錄）✅ 已有
```
保持現有欄位，建議新增：
- balanceAfter (交易後餘額)
- relatedTransactionId (關聯交易ID，用於配對轉入/轉出)
- status (pending/completed/failed/cancelled)
- ipAddress (安全記錄)
```

---

### 營運管理工作表（建議新增）

#### 3. PointsExpiry（點數到期記錄）⭐ 推薦
```
欄位：
- id
- lineUserId
- points (到期點數)
- earnedAt (獲得時間)
- expiryAt (到期時間)
- status (active/expired/used)
- createdAt
```

**用途**：
- 追蹤點數有效期
- 自動提醒即將到期
- 到期自動扣除

---

#### 4. MemberLevels（會員等級設定）⭐ 推薦
```
欄位：
- id
- levelName (等級名稱)
- levelCode (bronze/silver/gold/platinum)
- minPoints (最低點數門檻)
- benefits (福利說明)
- discount (折扣比例)
- icon (圖示)
- color (顏色代碼)
- isActive
- createdAt
```

**用途**：
- 動態調整等級門檻
- 不用改程式碼

**預設資料**：
```
銅級 | bronze | 0 | 0% | 🥉
銀級 | silver | 500 | 5% | 🥈
金級 | gold | 1000 | 10% | 🥇
白金 | platinum | 5000 | 15% | 💎
```

---

#### 5. Activities（活動/任務記錄）⭐⭐ 強烈推薦
```
欄位：
- id
- lineUserId
- activityType (checkin/share/review/purchase/birthday)
- points (獲得點數)
- metadata (JSON 格式的額外資訊)
- completedAt
- createdAt
```

**用途**：
- 簽到記錄
- 分享記錄
- 完成任務記錄
- 生日禮贈送記錄

---

#### 6. ExchangeItems（兌換商品清單）⭐
```
欄位：
- id
- name (商品名稱)
- description (說明)
- points (所需點數)
- category (分類)
- stock (庫存數量)
- imageUrl (圖片)
- isActive (是否啟用)
- displayOrder (顯示順序)
- validFrom (有效期開始)
- validTo (有效期結束)
- createdAt
- updatedAt
```

**用途**：
- 動態管理兌換商品
- 庫存管理
- 上下架控制

---

#### 7. ExchangeOrders（兌換訂單）⭐
```
欄位：
- id
- lineUserId
- memberName
- itemId
- itemName
- points (使用點數)
- quantity (數量)
- status (pending/confirmed/shipped/completed/cancelled)
- shippingAddress (配送地址)
- trackingNumber (物流編號)
- notes (備註)
- orderedAt
- completedAt
- createdAt
```

**用途**：
- 追蹤兌換訂單
- 物流管理
- 訂單狀態更新

---

### 分析統計工作表（進階）

#### 8. DailyStats（每日統計）⭐⭐
```
欄位：
- date (日期)
- newMembers (新增會員數)
- activeMembers (活躍會員數)
- totalTransactions (交易筆數)
- pointsIssued (發出點數)
- pointsRedeemed (消費點數)
- revenue (營收，如果有)
- topActivity (最熱門活動)
- createdAt
```

**用途**：
- 每日營運數據
- 趨勢分析
- 報表製作

**自動更新**：
- 每晚 12 點自動統計
- 或使用 Apps Script 觸發器

---

#### 9. Notifications（通知記錄）⭐
```
欄位：
- id
- lineUserId
- type (welcome/transfer/expiry/birthday/promotion)
- title (標題)
- message (內容)
- status (pending/sent/failed)
- sentAt
- readAt
- createdAt
```

**用途**：
- 追蹤發送的通知
- 避免重複發送
- 開信率統計

---

#### 10. Promotions（促銷活動）⭐⭐
```
欄位：
- id
- name (活動名稱)
- description (活動說明)
- type (bonus/discount/gift)
- targetLevel (目標會員等級)
- bonusPoints (贈送點數)
- discountRate (折扣率)
- conditions (參與條件)
- startDate
- endDate
- isActive
- createdAt
```

**用途**：
- 促銷活動管理
- A/B 測試
- 特定等級優惠

---

#### 11. Referrals（推薦記錄）⭐
```
欄位：
- id
- referrerId (推薦人ID)
- referrerName
- refereeId (被推薦人ID)
- refereeName
- status (pending/completed/rewarded)
- referrerReward (推薦人獎勵)
- refereeReward (被推薦人獎勵)
- completedAt
- createdAt
```

**用途**：
- 推薦好友功能
- 雙方獎勵追蹤
- 病毒行銷分析

---

#### 12. SystemLogs（系統日誌）⭐
```
欄位：
- id
- level (info/warning/error/critical)
- category (api/auth/payment/etc)
- message (訊息)
- details (詳細資訊 JSON)
- userId (相關用戶)
- ipAddress
- userAgent
- createdAt
```

**用途**：
- 錯誤追蹤
- 安全監控
- 系統診斷

---

#### 13. Settings（系統設定）⭐
```
欄位：
- key (設定鍵)
- value (設定值)
- type (string/number/boolean/json)
- description (說明)
- category (general/points/notifications/etc)
- updatedBy
- updatedAt
```

**範例資料**：
```
initialPoints | 100 | number | 註冊贈送點數
pointsExpiryDays | 365 | number | 點數有效天數
minTransferPoints | 1 | number | 最小轉點數量
maintenanceMode | false | boolean | 維護模式
```

**用途**：
- 動態調整系統參數
- 不用重新部署

---

## 📊 推薦實施順序

### 階段 1：立即新增（基礎完善）

1. **Members 新增欄位**
   - memberLevel
   - totalEarned
   - totalSpent
   - status

2. **Transactions 新增欄位**
   - balanceAfter
   - status

3. **新增 Settings 工作表**
   - 便於調整參數

### 階段 2：短期新增（功能擴充）

4. **MemberLevels**
   - 會員等級系統

5. **Activities**
   - 簽到、任務記錄

6. **DailyStats**
   - 每日統計

### 階段 3：中期新增（商業功能）

7. **ExchangeItems + ExchangeOrders**
   - 兌換商店

8. **Promotions**
   - 促銷活動

9. **Referrals**
   - 推薦好友

### 階段 4：長期新增（進階功能）

10. **PointsExpiry**
    - 點數到期管理

11. **Notifications**
    - 通知記錄

12. **SystemLogs**
    - 系統日誌

---

## 🎯 不同產業的建議

### 餐飲業額外需要：

#### Orders（訂單記錄）
```
- orderId
- lineUserId
- tableNumber (桌號)
- items (餐點 JSON)
- totalAmount (金額)
- pointsEarned (獲得點數)
- orderStatus
- orderedAt
```

#### MenuItems（菜單）
```
- itemId
- name
- category
- price
- points (可用點數折抵)
- isAvailable
```

---

### 美容業額外需要：

#### Appointments（預約記錄）
```
- appointmentId
- lineUserId
- serviceType
- stylist (服務人員)
- appointmentDate
- status
- notes
```

#### Services（服務項目）
```
- serviceId
- name
- duration (分鐘)
- price
- pointsEarned
```

#### CustomerRecords（顧客記錄）
```
- recordId
- lineUserId
- serviceDate
- services (服務內容)
- skinType (膚質)
- preferences (偏好)
- nextVisit (建議回訪日)
```

---

### 健身房額外需要：

#### CheckIns（打卡記錄）
```
- checkinId
- lineUserId
- checkinTime
- checkoutTime
- duration
- pointsEarned
```

#### ClassBookings（課程預約）
```
- bookingId
- lineUserId
- className
- instructor
- classDate
- status
```

#### WorkoutLogs（運動記錄）
```
- logId
- lineUserId
- exerciseType
- duration
- calories
- date
```

---

## 💡 實施建議

### 方案 A：最小可行（MVP）

**只新增必要的**：
1. Members 新增欄位（memberLevel, totalEarned, totalSpent）
2. Settings 工作表
3. DailyStats 工作表

**優點**：快速實施
**缺點**：功能有限

---

### 方案 B：標準版（推薦）⭐

**新增核心功能**：
1. Members 擴充欄位
2. Transactions 擴充欄位
3. MemberLevels
4. Activities
5. Settings
6. DailyStats

**優點**：功能完整，適合大多數情況
**缺點**：需要一些時間設定

---

### 方案 C：完整版

**所有工作表都建立**

**優點**：功能最完整
**缺點**：初期可能過於複雜

---

## 🛠️ 實施步驟

### 步驟 1：規劃
- 確定需要哪些工作表
- 設計欄位結構

### 步驟 2：創建工作表
- 在 Google Sheets 手動創建
- 或用 Apps Script 自動創建

### 步驟 3：更新程式碼
- 修改 google-apps-script.js
- 新增對應的函數

### 步驟 4：測試
- 測試新功能
- 確認資料正確

---

## 📋 我的建議

根據您目前的狀況，我建議：

### 立即實施（今天）：
1. ✅ **Members 新增欄位**
   - memberLevel
   - totalEarned  
   - totalSpent
   - lastLoginAt

2. ✅ **新增 Settings 工作表**
   - 方便調整參數

3. ✅ **新增 DailyStats 工作表**
   - 每日統計數據

### 下週實施：
4. ✅ **MemberLevels 工作表**
   - 會員等級系統

5. ✅ **Activities 工作表**
   - 活動記錄（為未來簽到功能做準備）

---

## 🚀 要我幫您實施嗎？

我可以：
1. 📝 更新 Google Apps Script 代碼
2. 📊 提供建立工作表的 SQL/腳本
3. 🎨 更新前端顯示會員等級
4. 📈 建立每日統計自動化

您想從哪一個開始？或者想要我一次幫您實施「標準版」？

---

**讓我知道您的想法，我立即幫您實施！** 💪

