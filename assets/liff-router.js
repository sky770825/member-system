/**
 * LIFF 智能路由工具
 * 自動判斷環境並使用正確的跳轉方式
 * @version 1.0.0
 * @date 2025-10-18
 */

const LIFFRouter = {
  // LIFF 配置
  LIFF_ID: '2008231108-2PDbO5qk',
  LIFF_BASE_URL: 'https://liff.line.me/2008231108-2PDbO5qk/',
  WEB_BASE_URL: 'https://sky770825.github.io/member-system/',
  
  /**
   * 智能跳轉 - 自動判斷環境
   * @param {string} page - 頁面名稱（例如：'profile.html'）
   * @param {boolean} closeLIFF - 是否關閉 LIFF 窗口（預設 false）
   */
  goto: function(page, closeLIFF = false) {
    const isInLIFF = this.isInLIFF();
    
    if (isInLIFF) {
      // 在 LIFF 環境中
      if (closeLIFF && typeof liff !== 'undefined') {
        // 關閉 LIFF 窗口
        liff.closeWindow();
      } else {
        // 保持在 LIFF 環境中跳轉
        window.location.href = page;
      }
    } else {
      // 在普通網頁環境中
      window.location.href = page;
    }
  },
  
  /**
   * 跳轉到會員中心
   */
  goToProfile: function() {
    this.goto('profile.html');
  },
  
  /**
   * 跳轉到註冊頁面
   */
  goToRegister: function() {
    this.goto('register.html');
  },
  
  /**
   * 跳轉到首頁
   */
  goToIndex: function() {
    this.goto('index.html');
  },
  
  /**
   * 跳轉到商城
   */
  goToMall: function() {
    this.goto('mall.html');
  },
  
  /**
   * 返回上一頁
   */
  goBack: function() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.goToIndex();
    }
  },
  
  /**
   * 檢查是否在 LIFF 環境中
   * @returns {boolean}
   */
  isInLIFF: function() {
    // 方法 1：檢查 URL
    if (window.location.href.includes('liff.line.me')) {
      return true;
    }
    
    // 方法 2：檢查 liff 物件
    if (typeof liff !== 'undefined' && liff.isInClient && liff.isInClient()) {
      return true;
    }
    
    // 方法 3：檢查 User Agent
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('line/')) {
      return true;
    }
    
    return false;
  },
  
  /**
   * 獲取當前完整 URL
   * @param {string} page - 頁面名稱
   * @returns {string} 完整 URL
   */
  getFullURL: function(page) {
    if (this.isInLIFF()) {
      return this.LIFF_BASE_URL + page;
    } else {
      return this.WEB_BASE_URL + page;
    }
  },
  
  /**
   * 生成分享連結（總是返回 LIFF URL）
   * @param {string} page - 頁面名稱
   * @returns {string} LIFF URL
   */
  getShareURL: function(page) {
    return this.LIFF_BASE_URL + page;
  }
};

// 全局別名（向下兼容）
const goToProfile = () => LIFFRouter.goToProfile();
const goToRegister = () => LIFFRouter.goToRegister();
const goToMall = () => LIFFRouter.goToMall();

// 導出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LIFFRouter;
}

