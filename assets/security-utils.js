/**
 * 安全工具庫 - Security Utils
 * 提供輸入清理、XSS 防護、驗證等功能
 * @version 1.0.0
 * @date 2025-10-17
 */

const SecurityUtils = {
  /**
   * ==================== 輸入清理 ====================
   */
  sanitize: {
    /**
     * 清理 HTML，防止 XSS 攻擊
     * @param {string} str - 要清理的字串
     * @returns {string} 清理後的字串
     */
    html: function(str) {
      if (!str) return '';
      const temp = document.createElement('div');
      temp.textContent = str;
      return temp.innerHTML;
    },

    /**
     * 清理並設置 HTML 內容（安全方式）
     * @param {HTMLElement} element - 目標元素
     * @param {string} html - HTML 內容
     * @param {object} safeValues - 需要插入的安全值（會被清理）
     */
    setHTML: function(element, html, safeValues = {}) {
      let cleanHTML = html;
      
      // 替換所有變數為清理後的值
      for (const [key, value] of Object.entries(safeValues)) {
        const cleanValue = this.html(String(value));
        cleanHTML = cleanHTML.replace(new RegExp(`{{${key}}}`, 'g'), cleanValue);
      }
      
      element.innerHTML = cleanHTML;
    },

    /**
     * 清理手機號碼（只保留數字和連字符）
     * @param {string} phone - 手機號碼
     * @returns {string} 清理後的手機號碼
     */
    phone: function(phone) {
      if (!phone) return '';
      return phone.replace(/[^\d-]/g, '');
    },

    /**
     * 清理數字輸入
     * @param {string} str - 輸入字串
     * @returns {string} 只保留數字
     */
    number: function(str) {
      if (!str) return '';
      return str.replace(/\D/g, '');
    },

    /**
     * 移除前後空白
     * @param {string} str - 輸入字串
     * @returns {string} 清理後的字串
     */
    trim: function(str) {
      if (!str) return '';
      return str.trim();
    },

    /**
     * 清理 Email
     * @param {string} email - Email 地址
     * @returns {string} 清理後的 Email
     */
    email: function(email) {
      if (!email) return '';
      return email.toLowerCase().trim();
    }
  },

  /**
   * ==================== 輸入驗證 ====================
   */
  validate: {
    /**
     * 驗證手機號碼（台灣格式）
     * @param {string} phone - 手機號碼
     * @returns {object} { valid: boolean, message: string }
     */
    phone: function(phone) {
      if (!phone) {
        return { valid: false, message: '請輸入手機號碼' };
      }

      // 台灣手機號碼格式：0912-345-678
      const regex = /^09[0-9]{2}-[0-9]{3}-[0-9]{3}$/;
      if (!regex.test(phone)) {
        return { valid: false, message: '請輸入正確的手機號碼格式（例：0912-345-678）' };
      }

      // 檢查有效的開頭號碼
      const validPrefixes = ['090', '091', '092', '093', '095', '096', '097', '098', '099'];
      const prefix = phone.substring(0, 3);
      
      if (!validPrefixes.includes(prefix)) {
        return { valid: false, message: '手機號碼開頭不正確' };
      }

      return { valid: true, message: '' };
    },

    /**
     * 驗證 Email
     * @param {string} email - Email 地址
     * @returns {object} { valid: boolean, message: string }
     */
    email: function(email) {
      if (!email) {
        return { valid: false, message: '請輸入 Email' };
      }

      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!regex.test(email)) {
        return { valid: false, message: '請輸入正確的 Email 格式' };
      }

      // 檢查常見的拼字錯誤
      const commonTypos = {
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'hotmial.com': 'hotmail.com'
      };

      const domain = email.split('@')[1];
      if (commonTypos[domain]) {
        return { 
          valid: false, 
          message: `您是否要輸入 ${commonTypos[domain]}？` 
        };
      }

      return { valid: true, message: '' };
    },

    /**
     * 驗證密碼強度
     * @param {string} password - 密碼
     * @param {object} options - 選項 { minLength: 6, requireUppercase: false, requireNumber: false }
     * @returns {object} { valid: boolean, strength: string, errors: array }
     */
    password: function(password, options = {}) {
      const defaults = {
        minLength: 6,
        requireUppercase: false,
        requireLowercase: false,
        requireNumber: false,
        requireSpecial: false
      };
      const opts = { ...defaults, ...options };
      const errors = [];

      if (!password) {
        return { valid: false, strength: 'none', errors: ['請輸入密碼'] };
      }

      // 檢查長度
      if (password.length < opts.minLength) {
        errors.push(`密碼至少需要 ${opts.minLength} 個字元`);
      }

      // 檢查必要條件
      if (opts.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('至少包含一個大寫字母');
      }
      if (opts.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('至少包含一個小寫字母');
      }
      if (opts.requireNumber && !/[0-9]/.test(password)) {
        errors.push('至少包含一個數字');
      }
      if (opts.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
        errors.push('至少包含一個特殊字元');
      }

      // 檢查常見弱密碼
      const weakPasswords = [
        'password', '12345678', 'qwerty123', 'abc12345', 
        '11111111', '00000000', 'password123', '1qaz2wsx'
      ];
      if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
        errors.push('此密碼太常見，請使用更強的密碼');
      }

      // 計算強度
      let strength = 0;
      if (password.length >= 6) strength++;
      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;

      let strengthLevel = 'weak';
      if (strength >= 5) strengthLevel = 'strong';
      else if (strength >= 3) strengthLevel = 'medium';

      return {
        valid: errors.length === 0,
        strength: strengthLevel,
        errors: errors
      };
    },

    /**
     * 驗證帳號（用戶名）
     * @param {string} username - 用戶名
     * @returns {object} { valid: boolean, message: string }
     */
    username: function(username) {
      if (!username) {
        return { valid: false, message: '請輸入帳號' };
      }

      if (username.length < 4) {
        return { valid: false, message: '帳號至少需要 4 個字元' };
      }

      if (username.length > 20) {
        return { valid: false, message: '帳號最多 20 個字元' };
      }

      // 只允許英文、數字、底線
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, message: '帳號只能包含英文、數字和底線' };
      }

      // 不能以數字開頭
      if (/^[0-9]/.test(username)) {
        return { valid: false, message: '帳號不能以數字開頭' };
      }

      return { valid: true, message: '' };
    }
  },

  /**
   * ==================== 格式化 ====================
   */
  format: {
    /**
     * 格式化手機號碼
     * @param {string} phone - 手機號碼
     * @returns {string} 格式化後的手機號碼（0912-345-678）
     */
    phone: function(phone) {
      if (!phone) return '';
      const digits = phone.replace(/\D/g, '');
      if (digits.length !== 10) return phone;
      return digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3');
    },

    /**
     * 格式化日期
     * @param {string|Date} date - 日期
     * @returns {string} 格式化後的日期
     */
    date: function(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('zh-TW');
    },

    /**
     * 格式化金額
     * @param {number} amount - 金額
     * @returns {string} 格式化後的金額
     */
    currency: function(amount) {
      if (typeof amount !== 'number') return amount;
      return `NT$ ${amount.toLocaleString()}`;
    },

    /**
     * 格式化點數
     * @param {number} points - 點數
     * @returns {string} 格式化後的點數
     */
    points: function(points) {
      if (typeof points !== 'number') return points;
      return `${points.toLocaleString()} 點`;
    },

    /**
     * 隱藏手機號碼部分數字
     * @param {string} phone - 手機號碼
     * @returns {string} 隱藏後的手機號碼（0912-***-678）
     */
    maskPhone: function(phone) {
      if (!phone) return '';
      return phone.replace(/(\d{4})-(\d{3})-(\d{3})/, '$1-***-$3');
    },

    /**
     * 隱藏 Email 部分字元
     * @param {string} email - Email
     * @returns {string} 隱藏後的 Email
     */
    maskEmail: function(email) {
      if (!email) return '';
      const [name, domain] = email.split('@');
      if (name.length <= 2) return email;
      return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
    },

    /**
     * 隱藏銀行帳號
     * @param {string} account - 銀行帳號
     * @returns {string} 隱藏後的帳號（顯示後4碼）
     */
    maskBankAccount: function(account) {
      if (!account) return '';
      if (account.length <= 4) return account;
      return '****' + account.slice(-4);
    }
  },

  /**
   * ==================== 錯誤處理 ====================
   */
  handleError: function(error, context = '') {
    console.error(`${context} 錯誤:`, error);

    // 網路錯誤
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return '網路連線失敗，請檢查您的網路連線';
    }

    // 超時錯誤
    if (error.name === 'AbortError') {
      return '請求超時，請稍後再試';
    }

    // HTTP 錯誤
    if (error.response) {
      switch (error.response.status) {
        case 400:
          return '請求格式錯誤，請確認輸入的資料';
        case 401:
          return '登入已過期，請重新登入';
        case 403:
          return '沒有權限執行此操作';
        case 404:
          return '找不到相關資料';
        case 429:
          return '操作太頻繁，請稍後再試';
        case 500:
        case 502:
        case 503:
          return '伺服器錯誤，請稍後再試';
        default:
          return '系統錯誤，請聯繫客服';
      }
    }

    return error.message || '未知錯誤';
  },

  /**
   * ==================== 防抖動 ====================
   */
  debounce: function(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * ==================== 節流 ====================
   */
  throttle: function(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// 導出（支援模組化）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUtils;
}

