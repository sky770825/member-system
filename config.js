/**
 * 會員系統配置文件
 * 複製此檔案並修改為您的產業配置
 */

const CONFIG = {
  // ==================== 基本資訊 ====================
  system: {
    name: '會員積分系統',              // 系統名稱
    shortName: '積分系統',             // 短名稱
    version: '1.0.0',
    industry: 'general',               // 產業類型: general, restaurant, beauty, retail, fitness, etc.
  },

  // ==================== 品牌設定 ====================
  brand: {
    companyName: '您的公司名稱',
    logo: './assets/logo.png',         // Logo 路徑
    favicon: './assets/favicon.ico',
    primaryColor: '#06C755',           // 主色調
    secondaryColor: '#6c757d',
    accentColor: '#FFD700',            // 強調色
  },

  // ==================== 點數系統 ====================
  points: {
    name: '點數',                      // 點數名稱: 點數、積分、里程、金幣等
    unit: '點',                        // 單位
    icon: '💰',                        // 圖示
    initialPoints: 100,                // 註冊贈送點數
    expiryDays: 365,                   // 點數有效期（0 = 永久有效）
    minTransfer: 1,                    // 最小轉點數量
    maxTransfer: 10000,                // 最大轉點數量
    allowNegative: false,              // 是否允許負點數
  },

  // ==================== 會員等級 ====================
  memberLevels: {
    enabled: true,                     // 是否啟用會員等級
    levels: [
      { id: 'bronze', name: '銅級會員', minPoints: 0, icon: '🥉', discount: 0 },
      { id: 'silver', name: '銀級會員', minPoints: 500, icon: '🥈', discount: 0.05 },
      { id: 'gold', name: '金級會員', minPoints: 1000, icon: '🥇', discount: 0.1 },
      { id: 'platinum', name: '白金會員', minPoints: 5000, icon: '💎', discount: 0.15 },
    ]
  },

  // ==================== 功能開關 ====================
  features: {
    register: true,                    // 註冊功能
    transfer: true,                    // 轉點功能
    exchange: false,                   // 點數兌換商品
    checkin: false,                    // 每日簽到
    invite: false,                     // 邀請好友
    membership: false,                 // 付費會員
    qrcode: false,                     // QR Code 掃碼
    location: false,                   // 地理位置簽到
    notification: true,                // 通知功能
  },

  // ==================== 表單欄位 ====================
  formFields: {
    register: [
      { name: 'name', label: '姓名', type: 'text', required: true },
      { name: 'phone', label: '手機號碼', type: 'tel', required: true, pattern: '[0-9]{4}-[0-9]{3}-[0-9]{3}' },
      { name: 'email', label: '電子郵件', type: 'email', required: false },
      { name: 'birthday', label: '生日', type: 'date', required: false },
      // 可自訂更多欄位
      // { name: 'address', label: '地址', type: 'text', required: false },
      // { name: 'gender', label: '性別', type: 'select', options: ['男', '女', '其他'], required: false },
    ],
    profile: [
      { name: 'email', label: '電子郵件', type: 'email', editable: true },
      { name: 'birthday', label: '生日', type: 'date', editable: true },
    ]
  },

  // ==================== API 設定 ====================
  api: {
    googleAppsScript: 'YOUR_APPS_SCRIPT_URL',
    timeout: 30000,                    // API 請求超時（毫秒）
    retryCount: 3,                     // 失敗重試次數
  },

  // ==================== LINE LIFF 設定 ====================
  liff: {
    register: 'YOUR_LIFF_ID_REGISTER',
    profile: 'YOUR_LIFF_ID_PROFILE',
    transfer: 'YOUR_LIFF_ID_TRANSFER',
    edit: 'YOUR_LIFF_ID_EDIT',
    history: 'YOUR_LIFF_ID_HISTORY',
  },

  // ==================== 文字內容 ====================
  text: {
    welcomeMessage: '歡迎使用我們的會員系統',
    registerSuccess: '🎉 註冊成功！已贈送 {points} {unit}',
    registerButton: '立即註冊',
    features: [
      { icon: '✨', title: '註冊送好禮', desc: '新會員註冊即贈送點數' },
      { icon: '💰', title: '點數管理', desc: '輕鬆查看和管理您的點數' },
      { icon: '💸', title: '轉點功能', desc: '可以將點數轉給好友使用' },
      { icon: '📱', title: 'LINE 整合', desc: '透過 LINE LIFF 快速登入' },
    ]
  },

  // ==================== 產業特定設定 ====================
  industrySpecific: {
    // 餐飲業
    restaurant: {
      pointsPerDollar: 1,              // 每消費 1 元 = 1 點
      bookingEnabled: true,            // 訂位功能
      menuEnabled: true,               // 菜單功能
    },
    // 美容業
    beauty: {
      appointmentEnabled: true,        // 預約功能
      serviceHistory: true,            // 服務記錄
    },
    // 零售業
    retail: {
      productCatalog: true,            // 商品目錄
      orderTracking: true,             // 訂單追蹤
    },
    // 健身房
    fitness: {
      classBooking: true,              // 課程預約
      workoutTracking: true,           // 運動記錄
    }
  },

  // ==================== 通知設定 ====================
  notifications: {
    welcome: {
      enabled: true,
      message: '歡迎加入！您已獲得 {points} {unit}'
    },
    pointsReceived: {
      enabled: true,
      message: '您收到 {sender} 轉入的 {points} {unit}'
    },
    pointsExpiring: {
      enabled: true,
      message: '您有 {points} {unit} 即將於 {date} 到期'
    },
    birthday: {
      enabled: true,
      message: '生日快樂！送您 {points} {unit}'
    }
  }
};

// 產業預設模板
const INDUSTRY_TEMPLATES = {
  restaurant: {
    name: '餐廳會員系統',
    points: { name: '美食點數', icon: '🍽️' },
    primaryColor: '#FF6B6B',
  },
  beauty: {
    name: '美容會員系統',
    points: { name: '美麗積分', icon: '💅' },
    primaryColor: '#FF69B4',
  },
  retail: {
    name: '零售會員系統',
    points: { name: '購物金', icon: '🛍️' },
    primaryColor: '#4CAF50',
  },
  fitness: {
    name: '健身會員系統',
    points: { name: '健康點數', icon: '💪' },
    primaryColor: '#FF9800',
  },
  coffee: {
    name: '咖啡廳會員系統',
    points: { name: '咖啡豆', icon: '☕' },
    primaryColor: '#8D6E63',
  }
};

// 匯出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, INDUSTRY_TEMPLATES };
}

