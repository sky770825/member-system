/**
 * 統一快取管理器
 * 提升頁面載入速度，減少 API 請求
 */

const CacheManager = {
  // 預設快取時間（毫秒）
  DEFAULT_TTL: 5 * 60 * 1000, // 5 分鐘
  
  // 快取鍵名前綴
  PREFIX: 'charity_system_',
  
  /**
   * 設定快取
   * @param {string} key - 快取鍵名
   * @param {any} data - 要快取的數據
   * @param {number} ttl - 有效期（毫秒），預設5分鐘
   */
  set(key, data, ttl = this.DEFAULT_TTL) {
    const cacheKey = this.PREFIX + key;
    const item = {
      data: data,
      expiry: Date.now() + ttl,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(item));
      console.log(`✅ 快取已儲存: ${key} (有效期: ${ttl/1000}秒)`);
      return true;
    } catch (e) {
      console.warn('❌ 快取儲存失敗:', e);
      // 如果 localStorage 已滿，清除舊快取
      if (e.name === 'QuotaExceededError') {
        this.clearExpired();
        try {
          localStorage.setItem(cacheKey, JSON.stringify(item));
          return true;
        } catch (e2) {
          return false;
        }
      }
      return false;
    }
  },
  
  /**
   * 取得快取
   * @param {string} key - 快取鍵名
   * @returns {any} 快取的數據，如果過期或不存在則返回 null
   */
  get(key) {
    const cacheKey = this.PREFIX + key;
    
    try {
      const item = localStorage.getItem(cacheKey);
      if (!item) {
        return null;
      }
      
      const parsed = JSON.parse(item);
      
      // 檢查是否過期
      if (Date.now() > parsed.expiry) {
        console.log(`⏰ 快取已過期: ${key}`);
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      const age = Math.round((Date.now() - parsed.timestamp) / 1000);
      console.log(`✅ 使用快取: ${key} (${age}秒前)`);
      return parsed.data;
      
    } catch (e) {
      console.warn('❌ 讀取快取失敗:', e);
      return null;
    }
  },
  
  /**
   * 刪除指定快取
   * @param {string} key - 快取鍵名
   */
  remove(key) {
    const cacheKey = this.PREFIX + key;
    try {
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ 快取已刪除: ${key}`);
    } catch (e) {
      console.warn('刪除快取失敗:', e);
    }
  },
  
  /**
   * 清除所有快取
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      let count = 0;
      
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
          count++;
        }
      });
      
      console.log(`🗑️ 已清除 ${count} 個快取`);
      return count;
    } catch (e) {
      console.warn('清除快取失敗:', e);
      return 0;
    }
  },
  
  /**
   * 清除過期的快取
   */
  clearExpired() {
    try {
      const keys = Object.keys(localStorage);
      let count = 0;
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (now > item.expiry) {
              localStorage.removeItem(key);
              count++;
            }
          } catch (e) {
            // 無效的快取項目，直接刪除
            localStorage.removeItem(key);
            count++;
          }
        }
      });
      
      console.log(`🗑️ 已清除 ${count} 個過期快取`);
      return count;
    } catch (e) {
      console.warn('清除過期快取失敗:', e);
      return 0;
    }
  },
  
  /**
   * 取得快取統計資訊
   */
  getStats() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith(this.PREFIX));
      
      let totalSize = 0;
      let validCount = 0;
      let expiredCount = 0;
      const now = Date.now();
      
      cacheKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          totalSize += value.length;
          
          const item = JSON.parse(value);
          if (now > item.expiry) {
            expiredCount++;
          } else {
            validCount++;
          }
        } catch (e) {
          expiredCount++;
        }
      });
      
      return {
        total: cacheKeys.length,
        valid: validCount,
        expired: expiredCount,
        size: totalSize,
        sizeKB: (totalSize / 1024).toFixed(2)
      };
    } catch (e) {
      return null;
    }
  },
  
  /**
   * 批量設定快取
   * @param {object} items - { key1: data1, key2: data2, ... }
   * @param {number} ttl - 有效期
   */
  setMultiple(items, ttl = this.DEFAULT_TTL) {
    let successCount = 0;
    
    for (const [key, data] of Object.entries(items)) {
      if (this.set(key, data, ttl)) {
        successCount++;
      }
    }
    
    console.log(`✅ 批量快取: ${successCount}/${Object.keys(items).length} 成功`);
    return successCount;
  },
  
  /**
   * 取得或設定快取（先嘗試取得，沒有則執行 fetcher 並快取結果）
   * @param {string} key - 快取鍵名
   * @param {Function} fetcher - 非同步函數，用於取得數據
   * @param {number} ttl - 有效期
   * @returns {Promise<any>} 數據
   */
  async getOrFetch(key, fetcher, ttl = this.DEFAULT_TTL) {
    // 先嘗試從快取取得
    const cached = this.get(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }
    
    // 快取不存在或已過期，執行 fetcher
    console.log(`🔄 快取未命中，載入新數據: ${key}`);
    const data = await fetcher();
    
    // 儲存到快取
    this.set(key, data, ttl);
    
    return { data: data, fromCache: false };
  },
  
  /**
   * 預載入（提前載入可能需要的數據）
   * @param {string} key - 快取鍵名
   * @param {Function} fetcher - 非同步函數
   * @param {number} ttl - 有效期
   */
  async preload(key, fetcher, ttl = this.DEFAULT_TTL) {
    // 如果快取已存在且未過期，不做任何事
    if (this.get(key) !== null) {
      return;
    }
    
    // 背景載入數據
    try {
      const data = await fetcher();
      this.set(key, data, ttl);
      console.log(`📦 預載入完成: ${key}`);
    } catch (e) {
      console.warn('預載入失敗:', key, e);
    }
  }
};

// 導出給全域使用
if (typeof window !== 'undefined') {
  window.CacheManager = CacheManager;
  
  // 頁面載入時清除過期快取
  window.addEventListener('load', () => {
    CacheManager.clearExpired();
  });
}

// 兼容舊的快取函數（向後兼容）
function setCache(key, data, ttl = 5 * 60 * 1000) {
  return CacheManager.set(key, data, ttl);
}

function getCache(key) {
  return CacheManager.get(key);
}

