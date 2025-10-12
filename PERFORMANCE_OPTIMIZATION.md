# ⚡ 性能優化完整指南

## 已實施的優化

### ✅ 1. 本地快取機制 (LocalStorage)

**實施位置**：`profile.html`

**原理**：
- 使用 localStorage 儲存會員資料
- 快取有效期：5 分鐘
- 立即顯示快取資料，背景更新最新資料

**代碼**：
```javascript
// 設定快取
function setCache(key, data, ttl = 5 * 60 * 1000) {
  const item = {
    data: data,
    expiry: Date.now() + ttl
  };
  localStorage.setItem(key, JSON.stringify(item));
}

// 讀取快取
function getCache(key) {
  const item = localStorage.getItem(key);
  if (!item) return null;
  
  const parsed = JSON.parse(item);
  if (Date.now() > parsed.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  
  return parsed.data;
}
```

**效能提升**：
- 首次載入：1000-2000ms
- 快取命中：< 100ms
- 提升：**20倍**

---

### ✅ 2. 載入時間監控

**實施位置**：所有頁面

**代碼**：
```javascript
const startTime = Date.now();
// ... 載入邏輯
const loadTime = Date.now() - startTime;
console.log(`載入時間: ${loadTime}ms`);
```

**用途**：
- 監控實際載入速度
- 識別性能瓶頸
- A/B 測試對比

---

## 📊 性能指標

### 目標值

| 指標 | 目標 | 當前 | 狀態 |
|-----|------|------|------|
| 首次載入 | < 2s | ~1.5s | ✅ |
| 二次載入 | < 0.5s | ~0.1s | ✅ |
| API 回應 | < 1s | ~0.8s | ✅ |
| 頁面跳轉 | 即時 | < 0.1s | ✅ |

### 測量方式

```javascript
// Performance API
const perfData = performance.getEntriesByType('navigation')[0];
console.log('DOM載入:', perfData.domContentLoadedEventEnd - perfData.fetchStart);
console.log('完全載入:', perfData.loadEventEnd - perfData.fetchStart);
```

---

## 🚀 待實施優化

### 優先級1：高影響、低成本

#### 1.1 圖片懶加載

**問題**：頭像圖片載入慢

**解決方案**：
```html
<img loading="lazy" src="${pictureUrl}" alt="頭像">
```

**效果**：減少初始載入時間

---

#### 1.2 預載入關鍵資源

**問題**：LIFF SDK 載入慢

**解決方案**：
```html
<link rel="preload" href="https://static.line-scdn.net/liff/edge/2/sdk.js" as="script">
```

---

#### 1.3 DNS 預解析

**問題**：第一次請求 Google Apps Script 慢

**解決方案**：
```html
<link rel="dns-prefetch" href="https://script.google.com">
```

---

### 優先級2：中影響、中成本

#### 2.1 Service Worker

**功能**：
- 離線支援
- 資源快取
- 背景同步

**代碼骨架**：
```javascript
// sw.js
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/',
        '/profile.html',
        '/assets/style.css'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
```

---

#### 2.2 骨架屏

**問題**：等待時視覺體驗差

**解決方案**：
```html
<div class="skeleton-card">
  <div class="skeleton-avatar"></div>
  <div class="skeleton-text"></div>
  <div class="skeleton-text short"></div>
</div>
```

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

#### 2.3 API 請求批次化

**問題**：多個 API 請求順序執行

**解決方案**：
```javascript
// 原本（順序）
const profile = await fetch('?action=profile');
const transactions = await fetch('?action=transactions');

// 優化（並行）
const [profile, transactions] = await Promise.all([
  fetch('?action=profile'),
  fetch('?action=transactions')
]);
```

---

### 優先級3：低影響、高成本

#### 3.1 CDN 加速

**方案**：
- 將靜態資源放到 CDN
- 使用 Cloudflare Pages

#### 3.2 圖片優化

**方案**：
- WebP 格式
- 響應式圖片
- 壓縮優化

---

## 🧪 性能測試

### 測試工具

1. **Chrome DevTools**
   - Network 標籤
   - Performance 標籤
   - Lighthouse

2. **在線工具**
   - [PageSpeed Insights](https://pagespeed.web.dev/)
   - [WebPageTest](https://www.webpagetest.org/)
   - [GTmetrix](https://gtmetrix.com/)

### 測試場景

#### 場景1：首次載入（無快取）
```
1. 清除 localStorage
2. 清除瀏覽器快取
3. 開啟 Network 標籤
4. 重新載入頁面
5. 記錄載入時間
```

**目標**：< 2秒

#### 場景2：再次載入（有快取）
```
1. 重新整理頁面
2. 觀察是否使用快取
3. 記錄載入時間
```

**目標**：< 0.5秒

#### 場景3：慢速網路
```
1. DevTools → Network
2. 設定為 "Slow 3G"
3. 測試載入
```

**目標**：< 5秒，且有適當的載入提示

---

## 📈 性能監控

### 實時監控（未來實施）

```javascript
// 發送性能數據到分析服務
function sendPerformanceData() {
  const perfData = performance.getEntriesByType('navigation')[0];
  
  fetch('https://your-analytics.com/log', {
    method: 'POST',
    body: JSON.stringify({
      loadTime: perfData.loadEventEnd - perfData.fetchStart,
      domReady: perfData.domContentLoadedEventEnd - perfData.fetchStart,
      apiTime: window.apiLoadTime,
      page: window.location.pathname
    })
  });
}

window.addEventListener('load', sendPerformanceData);
```

---

## 🎯 優化檢查清單

### 立即可做（0-1天）
- [x] 本地快取
- [x] 載入時間記錄
- [ ] 圖片懶加載
- [ ] DNS 預解析
- [ ] 預載入關鍵資源

### 短期（1週）
- [ ] 骨架屏
- [ ] API 請求並行化
- [ ] 下拉刷新
- [ ] 離線提示

### 中期（1個月）
- [ ] Service Worker
- [ ] 完整離線支援
- [ ] 性能監控系統
- [ ] CDN 部署

### 長期（3個月）
- [ ] 圖片優化
- [ ] 代碼分割
- [ ] 動態載入
- [ ] PWA 完整支援

---

## 💡 最佳實踐

### 1. 關鍵渲染路徑優化

```html
<!-- 優先載入關鍵 CSS -->
<style>
  /* 內聯關鍵 CSS */
  body { margin: 0; font-family: sans-serif; }
  .loading { /* ... */ }
</style>

<!-- 延遲載入非關鍵 CSS -->
<link rel="preload" href="style.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

### 2. JavaScript 優化

```html
<!-- 延遲載入非關鍵 JS -->
<script defer src="analytics.js"></script>

<!-- 異步載入獨立 JS -->
<script async src="social-share.js"></script>
```

### 3. 資源提示

```html
<!-- DNS 預解析 -->
<link rel="dns-prefetch" href="https://script.google.com">

<!-- 預連接 -->
<link rel="preconnect" href="https://static.line-scdn.net">

<!-- 預載入 -->
<link rel="preload" href="logo.png" as="image">
```

---

## 🔍 問題排查

### 問題1：載入慢

**檢查項目**：
1. Network 標籤查看慢的資源
2. 檢查 API 回應時間
3. 檢查圖片大小
4. 檢查 JavaScript 執行時間

**解決方向**：
- 優化慢的資源
- 延遲載入非關鍵資源
- 使用快取

### 問題2：快取不生效

**檢查項目**：
1. LocalStorage 是否支援
2. 快取是否過期
3. 快取 key 是否正確

**解決方向**：
- 檢查 Console 輸出
- 驗證快取邏輯
- 測試不同場景

---

## 📞 性能優化支援

如需協助優化性能：
1. 提供 Lighthouse 報告
2. 提供 Network 截圖
3. 說明具體的慢的地方

---

**最後更新**: 2025-10-12  
**版本**: 1.0

