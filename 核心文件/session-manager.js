/**
 * Session 管理器
 * 提供安全的 Session 儲存、驗證和過期管理
 * @version 1.0.0
 * @date 2025-10-17
 */

const SessionManager = {
  // ==================== 設定 ====================
  config: {
    storageType: 'localStorage',  // 'localStorage' 或 'sessionStorage'
    expiryHours: 24,               // Session 過期時間（小時）
    autoRefresh: true,             // 是否自動刷新過期時間
    encryptionEnabled: false,      // 是否啟用加密（需要 crypto-js）
    encryptionKey: 'your-secret-key'
  },

  /**
   * ==================== 儲存 Session ====================
   */
  
  /**
   * 設置 Session
   * @param {string} token - Session Token
   * @param {object} user - 用戶資料
   * @param {string} loginType - 登入類型（'password', 'line'）
   * @returns {boolean} 是否成功
   */
  set: function(token, user, loginType = 'password') {
    try {
      const session = {
        token: token,
        user: user,
        loginType: loginType,
        createdAt: Date.now(),
        expiresAt: Date.now() + (this.config.expiryHours * 60 * 60 * 1000),
        lastActivity: Date.now()
      };

      const sessionData = this.config.encryptionEnabled 
        ? this._encrypt(JSON.stringify(session))
        : JSON.stringify(session);

      this._getStorage().setItem('session', sessionData);
      
      // 同時保存舊格式（向下兼容）
      this._getStorage().setItem('sessionToken', token);
      this._getStorage().setItem('user', JSON.stringify(user));
      this._getStorage().setItem('loginType', loginType);

      if (this.config.autoRefresh) {
        this._startAutoRefresh();
      }

      return true;
    } catch (error) {
      console.error('[SessionManager] 設置 Session 失敗:', error);
      return false;
    }
  },

  /**
   * ==================== 獲取 Session ====================
   */
  
  /**
   * 獲取 Session
   * @returns {object|null} Session 物件或 null
   */
  get: function() {
    try {
      const sessionData = this._getStorage().getItem('session');
      if (!sessionData) {
        // 嘗試從舊格式讀取
        return this._getLegacySession();
      }

      const session = this.config.encryptionEnabled
        ? JSON.parse(this._decrypt(sessionData))
        : JSON.parse(sessionData);

      // 檢查是否過期
      if (Date.now() > session.expiresAt) {
        console.warn('[SessionManager] Session 已過期');
        this.clear();
        return null;
      }

      // 自動刷新活動時間
      if (this.config.autoRefresh) {
        this._updateActivity();
      }

      return session;
    } catch (error) {
      console.error('[SessionManager] 獲取 Session 失敗:', error);
      return null;
    }
  },

  /**
   * 獲取 Session Token
   * @returns {string|null} Token 或 null
   */
  getToken: function() {
    const session = this.get();
    return session ? session.token : null;
  },

  /**
   * 獲取用戶資料
   * @returns {object|null} 用戶物件或 null
   */
  getUser: function() {
    const session = this.get();
    return session ? session.user : null;
  },

  /**
   * 獲取登入類型
   * @returns {string|null} 登入類型或 null
   */
  getLoginType: function() {
    const session = this.get();
    return session ? session.loginType : null;
  },

  /**
   * ==================== 驗證 Session ====================
   */
  
  /**
   * 檢查 Session 是否有效
   * @returns {boolean} 是否有效
   */
  isValid: function() {
    const session = this.get();
    return session !== null;
  },

  /**
   * 檢查是否已登入
   * @returns {boolean} 是否已登入
   */
  isLoggedIn: function() {
    return this.isValid();
  },

  /**
   * 獲取剩餘時間（毫秒）
   * @returns {number} 剩餘時間
   */
  getTimeRemaining: function() {
    const session = this.get();
    if (!session) return 0;
    return Math.max(0, session.expiresAt - Date.now());
  },

  /**
   * 獲取剩餘時間（格式化）
   * @returns {string} 格式化的剩餘時間
   */
  getTimeRemainingFormatted: function() {
    const ms = this.getTimeRemaining();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} 小時 ${minutes} 分鐘`;
  },

  /**
   * ==================== 更新 Session ====================
   */
  
  /**
   * 更新用戶資料
   * @param {object} userData - 要更新的用戶資料
   * @returns {boolean} 是否成功
   */
  updateUser: function(userData) {
    const session = this.get();
    if (!session) return false;

    session.user = { ...session.user, ...userData };
    session.lastActivity = Date.now();

    const sessionData = this.config.encryptionEnabled
      ? this._encrypt(JSON.stringify(session))
      : JSON.stringify(session);

    this._getStorage().setItem('session', sessionData);
    this._getStorage().setItem('user', JSON.stringify(session.user));

    return true;
  },

  /**
   * 刷新 Session（延長過期時間）
   * @returns {boolean} 是否成功
   */
  refresh: function() {
    const session = this.get();
    if (!session) return false;

    session.expiresAt = Date.now() + (this.config.expiryHours * 60 * 60 * 1000);
    session.lastActivity = Date.now();

    const sessionData = this.config.encryptionEnabled
      ? this._encrypt(JSON.stringify(session))
      : JSON.stringify(session);

    this._getStorage().setItem('session', sessionData);

    return true;
  },

  /**
   * ==================== 清除 Session ====================
   */
  
  /**
   * 清除 Session
   */
  clear: function() {
    const storage = this._getStorage();
    storage.removeItem('session');
    storage.removeItem('sessionToken');
    storage.removeItem('user');
    storage.removeItem('loginType');
    
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  },

  /**
   * 登出
   * @param {string} redirectUrl - 登出後跳轉的 URL
   */
  logout: function(redirectUrl = 'login.html') {
    this.clear();
    
    // 如果是 LINE 登入，也要登出 LIFF
    if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
      liff.logout();
    }
    
    window.location.href = redirectUrl;
  },

  /**
   * ==================== 內部方法 ====================
   */
  
  /**
   * 獲取儲存物件
   * @private
   */
  _getStorage: function() {
    return this.config.storageType === 'sessionStorage' 
      ? sessionStorage 
      : localStorage;
  },

  /**
   * 從舊格式讀取 Session（向下兼容）
   * @private
   */
  _getLegacySession: function() {
    try {
      const token = this._getStorage().getItem('sessionToken');
      const userStr = this._getStorage().getItem('user');
      const loginType = this._getStorage().getItem('loginType');

      if (!token || !userStr) return null;

      const user = JSON.parse(userStr);
      
      // 轉換為新格式並保存
      this.set(token, user, loginType || 'password');

      return this.get();
    } catch (error) {
      console.error('[SessionManager] 讀取舊格式失敗:', error);
      return null;
    }
  },

  /**
   * 更新活動時間
   * @private
   */
  _updateActivity: function() {
    const sessionData = this._getStorage().getItem('session');
    if (!sessionData) return;

    try {
      const session = this.config.encryptionEnabled
        ? JSON.parse(this._decrypt(sessionData))
        : JSON.parse(sessionData);

      session.lastActivity = Date.now();

      const updatedData = this.config.encryptionEnabled
        ? this._encrypt(JSON.stringify(session))
        : JSON.stringify(session);

      this._getStorage().setItem('session', updatedData);
    } catch (error) {
      console.error('[SessionManager] 更新活動時間失敗:', error);
    }
  },

  /**
   * 啟動自動刷新計時器
   * @private
   */
  _startAutoRefresh: function() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
    }

    // 每 5 分鐘檢查一次
    this._refreshTimer = setInterval(() => {
      const remaining = this.getTimeRemaining();
      
      // 如果剩餘時間少於 1 小時，自動刷新
      if (remaining > 0 && remaining < 60 * 60 * 1000) {
        console.log('[SessionManager] 自動刷新 Session');
        this.refresh();
      }
      
      // 如果已過期，清除並跳轉
      if (remaining === 0) {
        console.warn('[SessionManager] Session 已過期，自動登出');
        this.logout();
      }
    }, 5 * 60 * 1000); // 5 分鐘
  },

  /**
   * 加密數據（需要 crypto-js）
   * @private
   */
  _encrypt: function(data) {
    if (typeof CryptoJS === 'undefined') {
      console.warn('[SessionManager] CryptoJS 未載入，無法加密');
      return data;
    }
    return CryptoJS.AES.encrypt(data, this.config.encryptionKey).toString();
  },

  /**
   * 解密數據（需要 crypto-js）
   * @private
   */
  _decrypt: function(encrypted) {
    if (typeof CryptoJS === 'undefined') {
      console.warn('[SessionManager] CryptoJS 未載入，無法解密');
      return encrypted;
    }
    const bytes = CryptoJS.AES.decrypt(encrypted, this.config.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  },

  /**
   * ==================== 工具方法 ====================
   */
  
  /**
   * 配置 Session 管理器
   * @param {object} options - 配置選項
   */
  configure: function(options) {
    this.config = { ...this.config, ...options };
  },

  /**
   * 獲取 Session 資訊（用於除錯）
   * @returns {object} Session 資訊
   */
  getInfo: function() {
    const session = this.get();
    if (!session) return null;

    return {
      loginType: session.loginType,
      createdAt: new Date(session.createdAt).toLocaleString('zh-TW'),
      expiresAt: new Date(session.expiresAt).toLocaleString('zh-TW'),
      lastActivity: new Date(session.lastActivity).toLocaleString('zh-TW'),
      timeRemaining: this.getTimeRemainingFormatted(),
      user: {
        name: session.user.name,
        phone: session.user.phone,
        points: session.user.points
      }
    };
  }
};

// 初始化自動刷新
if (SessionManager.config.autoRefresh && SessionManager.isValid()) {
  SessionManager._startAutoRefresh();
}

// 導出（支援模組化）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionManager;
}

