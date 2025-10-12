/**
 * 會員註冊系統 - 設定檔案範本
 * 
 * 使用說明：
 * 1. 複製此檔案並重新命名為 config.js
 * 2. 填入您的實際設定值
 * 3. 在 HTML 檔案中引入此設定檔
 */

const CONFIG = {
  // ==================== LINE LIFF 設定 ====================
  LIFF: {
    // 註冊頁面的 LIFF ID
    REGISTER: 'YOUR_LIFF_ID_FOR_REGISTER',
    
    // 會員中心的 LIFF ID
    PROFILE: 'YOUR_LIFF_ID_FOR_PROFILE',
    
    // 轉點頁面的 LIFF ID
    TRANSFER: 'YOUR_LIFF_ID_FOR_TRANSFER',
  },

  // ==================== API 端點設定 ====================
  API: {
    // Google Apps Script Web App URL
    BASE_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
    
    // API 端點
    ENDPOINTS: {
      CHECK: '?action=check',              // 檢查會員是否存在
      PROFILE: '?action=profile',          // 取得會員資料
      CHECK_USER: '?action=check-user',    // 透過手機號碼檢查會員
      REGISTER: '?action=register',        // 註冊新會員
      TRANSFER: '?action=transfer',        // 轉點
      TRANSACTIONS: '?action=transactions', // 取得交易記錄
      UPDATE_PROFILE: '?action=update-profile', // 更新會員資料
    }
  },

  // ==================== 前端網址設定 ====================
  FRONTEND: {
    // 您的網站域名
    DOMAIN: 'https://YOUR_USERNAME.github.io/YOUR_REPO',
    
    // 各頁面路徑
    PAGES: {
      INDEX: '/index.html',
      REGISTER: '/register.html',
      PROFILE: '/profile.html',
      TRANSFER: '/transfer.html',
    }
  },

  // ==================== 系統設定 ====================
  SYSTEM: {
    // 新會員註冊贈送點數
    INITIAL_POINTS: 100,
    
    // 最小轉點數量
    MIN_TRANSFER_POINTS: 1,
    
    // 最大轉點數量（0 表示不限制）
    MAX_TRANSFER_POINTS: 0,
    
    // 是否啟用除錯模式
    DEBUG_MODE: false,
  },

  // ==================== UI 設定 ====================
  UI: {
    // 訊息顯示時間（毫秒）
    MESSAGE_DISPLAY_TIME: 5000,
    
    // 成功後跳轉延遲（毫秒）
    REDIRECT_DELAY: 2000,
    
    // 載入動畫最短顯示時間（毫秒）
    MIN_LOADING_TIME: 500,
  }
};

// ==================== 工具函數 ====================

/**
 * 取得完整的 API URL
 */
CONFIG.getApiUrl = function(endpoint, params = {}) {
  let url = this.API.BASE_URL + endpoint;
  
  // 加入查詢參數
  const queryParams = new URLSearchParams(params).toString();
  if (queryParams) {
    url += (url.includes('?') ? '&' : '?') + queryParams;
  }
  
  return url;
};

/**
 * 取得完整的頁面 URL
 */
CONFIG.getPageUrl = function(page) {
  return this.FRONTEND.DOMAIN + page;
};

/**
 * 記錄除錯訊息
 */
CONFIG.log = function(message, data = null) {
  if (this.SYSTEM.DEBUG_MODE) {
    console.log(`[會員系統] ${message}`, data || '');
  }
};

/**
 * 記錄錯誤訊息
 */
CONFIG.error = function(message, error = null) {
  console.error(`[會員系統錯誤] ${message}`, error || '');
};

// 匯出設定（如果在 Node.js 環境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

