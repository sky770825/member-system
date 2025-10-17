/**
 * 認證工具 - 支援 LINE 和帳號密碼雙登入
 */

const AUTH = {
  // 配置
  LIFF_ID: "2008231108-2PDbO5qk",
  API_URL: 'https://script.google.com/macros/s/AKfycbwDt0-rOSmo5wJzTRmu0gPq944hQTA5TtAzIyzmSxpLQm-nFKhwZWiaALnQP1zMYdOB/exec',
  
  // 初始化認證（自動檢測登入方式）
  async init(options = {}) {
    const redirectToLogin = options.redirectToLogin !== false; // 預設 true
    
    try {
      // 先檢查密碼登入的 Session
      const sessionToken = localStorage.getItem('sessionToken');
      const user = localStorage.getItem('user');
      
      if (sessionToken && user) {
        console.log('✅ 使用密碼登入 Session');
        return {
          success: true,
          loginType: 'password',
          user: JSON.parse(user)
        };
      }
      
      // 檢查 LINE 登入
      if (typeof liff !== 'undefined') {
        await liff.init({ liffId: this.LIFF_ID });
        
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          console.log('✅ 使用 LINE 登入');
          return {
            success: true,
            loginType: 'line',
            user: {
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl
            },
            profile: profile
          };
        } else if (redirectToLogin) {
          // LINE 環境但未登入
          liff.login({ redirectUri: window.location.href });
          return { success: false, reason: 'redirecting' };
        }
      }
      
      // 都沒有登入
      if (redirectToLogin) {
        this.redirectToLogin();
      }
      
      return { success: false, reason: 'not_logged_in' };
      
    } catch (error) {
      console.error('認證初始化錯誤:', error);
      
      if (redirectToLogin) {
        this.redirectToLogin();
      }
      
      return { success: false, reason: 'error', error: error };
    }
  },
  
  // 取得當前用戶資料
  async getCurrentUser() {
    const initResult = await this.init({ redirectToLogin: false });
    
    if (!initResult.success) {
      return null;
    }
    
    if (initResult.loginType === 'password') {
      return initResult.user;
    } else {
      // LINE 登入，需要從 API 獲取完整資料
      const res = await fetch(`${this.API_URL}?action=profile&lineUserId=${initResult.user.userId}`);
      const data = await res.json();
      
      if (data.success) {
        return {
          userId: initResult.user.userId,
          name: data.name,
          phone: data.phone,
          email: data.email,
          points: data.points,
          memberLevel: data.memberLevel,
          referralCode: data.referralCode,
          pictureUrl: initResult.user.pictureUrl,
          displayName: initResult.user.displayName,
          loginType: 'line'
        };
      }
      
      return null;
    }
  },
  
  // 取得用戶ID
  async getUserId() {
    const initResult = await this.init({ redirectToLogin: false });
    
    if (!initResult.success) {
      return null;
    }
    
    return initResult.user.userId;
  },
  
  // 登出
  logout() {
    // 清除 Session
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginType');
    
    // 如果是 LINE 環境，也登出 LINE
    if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
      liff.logout();
    }
    
    // 跳轉到登入頁面
    this.redirectToLogin();
  },
  
  // 跳轉到登入頁面
  redirectToLogin() {
    window.location.href = 'login.html';
  },
  
  // 檢查是否已登入
  async isLoggedIn() {
    const initResult = await this.init({ redirectToLogin: false });
    return initResult.success;
  },
  
  // 更新 Session 中的用戶資料
  updateSessionUser(userData) {
    const currentUser = localStorage.getItem('user');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }
};

// 導出給全域使用
if (typeof window !== 'undefined') {
  window.AUTH = AUTH;
}

