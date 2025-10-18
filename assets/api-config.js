/**
 * API 配置文件
 * 統一管理所有 API 相關設定
 * @version 1.1.0
 * @date 2025-10-18
 */

const API_CONFIG = {
  // ==================== API URL ====================
  baseURL: 'https://script.google.com/macros/s/AKfycbyeE3heWVv3Uuv_7kR46G1R6KyL3sAunWtUv83LolGyVj_3wmobzo_daTIjA58T1Hrd/exec',
  
  // ==================== 請求設定 ====================
  timeout: 30000,              // 請求超時時間（毫秒）
  retryCount: 3,               // 失敗重試次數
  retryDelay: 1000,            // 重試延遲（毫秒）
  
  // ==================== 環境設定 ====================
  environment: 'production',   // 環境：development, production
  debug: false,                // 是否開啟除錯模式
  
  // ==================== LIFF 設定 ====================
  liff: {
    channelId: '2008231108',
    liffIds: {
      register: '2008231108-2PDbO5qk',
      profile: '2008231108-2PDbO5qk',
      transfer: '2008231108-2PDbO5qk',
      edit: '2008231108-2PDbO5qk',
      history: '2008231108-2PDbO5qk'
    }
  }
};

/**
 * API 請求工具
 */
const APIClient = {
  /**
   * 發送 GET 請求
   * @param {string} action - API 動作
   * @param {object} params - 請求參數
   * @returns {Promise} API 回應
   */
  get: async function(action, params = {}) {
    const queryParams = new URLSearchParams({
      action: action,
      ...params
    });
    
    const url = `${API_CONFIG.baseURL}?${queryParams.toString()}`;
    
    return this.fetchWithRetry(url, {
      method: 'GET',
      redirect: 'follow'
    });
  },

  /**
   * 發送 POST 請求（用於敏感數據）
   * @param {string} action - API 動作
   * @param {object} data - 請求數據
   * @returns {Promise} API 回應
   */
  post: async function(action, data = {}) {
    return this.fetchWithRetry(API_CONFIG.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: action,
        ...data
      })
    });
  },

  /**
   * 帶重試機制的 fetch
   * @param {string} url - 請求 URL
   * @param {object} options - fetch 選項
   * @param {number} retries - 重試次數
   * @returns {Promise} 回應
   */
  fetchWithRetry: async function(url, options = {}, retries = API_CONFIG.retryCount) {
    // 添加超時控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    options.signal = controller.signal;

    for (let i = 0; i < retries; i++) {
      try {
        if (API_CONFIG.debug) {
          console.log(`[API] 請求 (嘗試 ${i + 1}/${retries}):`, url, options);
        }

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        if (API_CONFIG.debug) {
          console.log('[API] 回應:', response.status, response.statusText);
        }

        // 如果成功，直接返回
        if (response.ok) {
          const data = await response.json();
          
          if (API_CONFIG.debug) {
            console.log('[API] 數據:', data);
          }
          
          return data;
        }

        // 如果是伺服器錯誤（5xx），且還有重試機會，則重試
        if (response.status >= 500 && i < retries - 1) {
          console.warn(`[API] 伺服器錯誤 (${response.status})，${API_CONFIG.retryDelay}ms 後重試...`);
          await this.delay(API_CONFIG.retryDelay * (i + 1));
          continue;
        }

        // 客戶端錯誤（4xx）不重試，直接拋出
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);

      } catch (error) {
        clearTimeout(timeoutId);

        // 如果是最後一次嘗試，拋出錯誤
        if (i === retries - 1) {
          console.error('[API] 請求失敗:', error);
          throw error;
        }

        // 網路錯誤，重試
        console.warn(`[API] 請求失敗，${API_CONFIG.retryDelay}ms 後重試...`, error.message);
        await this.delay(API_CONFIG.retryDelay * (i + 1));
      }
    }
  },

  /**
   * 延遲函數
   * @param {number} ms - 延遲時間（毫秒）
   * @returns {Promise}
   */
  delay: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 批量請求
   * @param {Array} requests - 請求數組 [{ action, data, method }]
   * @returns {Promise<Array>} 回應數組
   */
  batch: async function(requests) {
    return Promise.all(
      requests.map(req => 
        req.method === 'POST' 
          ? this.post(req.action, req.data)
          : this.get(req.action, req.data)
      )
    );
  }
};

/**
 * 常用 API 方法封裝
 */
const API = {
  // ==================== 會員相關 ====================
  
  /**
   * 帳號密碼註冊
   */
  registerWithPassword: (data) => 
    APIClient.post('register-password', data),

  /**
   * LINE 註冊
   */
  register: (data) => 
    APIClient.get('register', data),

  /**
   * 帳號密碼登入
   */
  login: (username, password) => 
    APIClient.post('login', { username, password }),

  /**
   * 檢查會員是否存在
   */
  checkMember: (lineUserId) => 
    APIClient.get('check', { lineUserId }),

  /**
   * 獲取會員資料
   */
  getMember: (lineUserId) => 
    APIClient.get('get-member', { lineUserId }),

  /**
   * 更新會員資料
   */
  updateProfile: (data) => 
    APIClient.post('update-profile', data),

  // ==================== 點數相關 ====================
  
  /**
   * 轉點給好友
   */
  transfer: (data) => 
    APIClient.post('transfer', data),

  /**
   * 提領點數
   */
  withdraw: (data) => 
    APIClient.post('withdraw', data),

  /**
   * 查詢提領記錄
   */
  getWithdrawalHistory: (lineUserId) => 
    APIClient.get('withdrawal-history', { lineUserId }),

  /**
   * 查詢交易記錄
   */
  getHistory: (lineUserId) => 
    APIClient.get('history', { lineUserId }),

  // ==================== 推薦相關 ====================
  
  /**
   * 驗證推薦碼
   */
  verifyReferral: (referralCode) => 
    APIClient.get('verify-referral', { referralCode }),

  /**
   * 獲取推薦統計
   */
  getReferralStats: (lineUserId) => 
    APIClient.get('referral-stats', { lineUserId }),

  // ==================== 商城相關 ====================
  
  /**
   * 獲取商品列表
   */
  getMallProducts: () => 
    APIClient.get('mall-products'),

  /**
   * 獲取商品詳情
   */
  getProductDetail: (productId) => 
    APIClient.get('mall-product-detail', { productId }),

  /**
   * 購買商品
   */
  purchaseProduct: (data) => 
    APIClient.post('mall-purchase', data),

  /**
   * 查詢訂單記錄
   */
  getOrders: (lineUserId) => 
    APIClient.get('mall-orders', { lineUserId }),

  // ==================== 管理員相關 ====================
  
  /**
   * 管理員登入
   */
  adminLogin: (password) => 
    APIClient.post('admin-login', { password }),

  /**
   * 獲取所有會員
   */
  getAllMembers: () => 
    APIClient.get('get-all-members'),

  /**
   * 調整會員點數
   */
  adjustPoints: (data) => 
    APIClient.post('adjust-points', data),

  /**
   * 系統健康檢查
   */
  healthCheck: () => 
    APIClient.get('health-check')
};

// 方便直接使用的 API_URL（向下兼容）
const API_URL = API_CONFIG.baseURL;

// 導出（支援模組化）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, APIClient, API, API_URL };
}

