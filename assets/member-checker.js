/**
 * 會員檢查工具
 * 用於檢查會員是否存在，不存在則跳轉到首頁註冊
 */

const MemberChecker = {
  /**
   * 檢查會員資料是否存在
   * @param {object} apiResponse - API 返回的會員資料
   * @param {boolean} showAlert - 是否顯示提示訊息
   * @returns {boolean} 是否為有效會員
   */
  checkMemberExists(apiResponse, showAlert = true) {
    // 檢查 API 回應格式
    if (!apiResponse) {
      this.redirectToHome(showAlert, '無法載入會員資料');
      return false;
    }
    
    // 檢查是否成功
    if (apiResponse.success === false) {
      this.redirectToHome(showAlert, '找不到會員資料');
      return false;
    }
    
    // 檢查資料完整性
    if (!apiResponse.data && !apiResponse.name) {
      this.redirectToHome(showAlert, '會員資料不完整');
      return false;
    }
    
    return true;
  },
  
  /**
   * 跳轉到首頁註冊
   * @param {boolean} showAlert - 是否顯示提示
   * @param {string} reason - 跳轉原因
   */
  redirectToHome(showAlert = true, reason = '會員不存在') {
    console.log(`❌ ${reason}，跳轉到首頁`);
    
    if (showAlert) {
      alert('您還不是會員，請先註冊！\n\n將為您跳轉到註冊頁面...');
    }
    
    // 跳轉到首頁
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 100);
  },
  
  /**
   * 檢查並取得會員資料（包含自動跳轉）
   * @param {string} lineUserId - LINE User ID
   * @param {string} apiUrl - API URL
   * @returns {object|null} 會員資料或 null
   */
  async fetchAndCheckMember(lineUserId, apiUrl) {
    try {
      const res = await fetch(`${apiUrl}?action=profile&lineUserId=${lineUserId}`);
      const data = await res.json();
      
      // 檢查會員是否存在
      if (!this.checkMemberExists(data)) {
        return null;
      }
      
      return data;
      
    } catch (error) {
      console.error('取得會員資料失敗:', error);
      this.redirectToHome(true, '系統錯誤');
      return null;
    }
  }
};

// 導出供其他頁面使用
window.MemberChecker = MemberChecker;

