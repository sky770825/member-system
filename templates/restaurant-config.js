/**
 * 餐廳會員系統配置範例
 * 快速部署：複製此檔案為 config.js 並修改相關設定
 */

const CONFIG = {
  system: {
    name: '美味餐廳會員系統',
    shortName: '美味會員',
    version: '1.0.0',
    industry: 'restaurant',
  },

  brand: {
    companyName: '美味餐廳',
    logo: './assets/restaurant-logo.png',
    primaryColor: '#FF6B6B',          // 美食紅
    secondaryColor: '#FFA07A',
    accentColor: '#FFD700',
  },

  points: {
    name: '美食點數',
    unit: '點',
    icon: '🍽️',
    initialPoints: 100,
    expiryDays: 180,                  // 半年有效期
    minTransfer: 10,
    maxTransfer: 5000,
  },

  memberLevels: {
    enabled: true,
    levels: [
      { id: 'regular', name: '一般會員', minPoints: 0, icon: '🍴', discount: 0 },
      { id: 'silver', name: '銀級饕客', minPoints: 500, icon: '🥈', discount: 0.05 },
      { id: 'gold', name: '金級饕客', minPoints: 1500, icon: '🥇', discount: 0.1 },
      { id: 'vip', name: 'VIP 美食家', minPoints: 5000, icon: '👑', discount: 0.15 },
    ]
  },

  features: {
    register: true,
    transfer: true,
    exchange: true,                   // 點數兌換餐點
    checkin: true,                    // 到店簽到
    invite: true,                     // 邀請好友用餐
    qrcode: true,                     // 掃碼點餐
    location: true,                   // 分店定位
  },

  formFields: {
    register: [
      { name: 'name', label: '姓名', type: 'text', required: true },
      { name: 'phone', label: '手機號碼', type: 'tel', required: true },
      { name: 'email', label: '電子郵件', type: 'email', required: false },
      { name: 'birthday', label: '生日', type: 'date', required: true },
      { name: 'preferences', label: '飲食偏好', type: 'select', 
        options: ['無特殊需求', '素食', '清真', '低鈉', '無麩質'], required: false },
    ]
  },

  text: {
    welcomeMessage: '歡迎來到美味餐廳',
    registerSuccess: '🎉 註冊成功！立即獲得 100 點美食點數',
    features: [
      { icon: '🎁', title: '註冊好禮', desc: '新會員送 100 點美食點數' },
      { icon: '🍽️', title: '消費回饋', desc: '每消費 $100 得 10 點' },
      { icon: '🎂', title: '生日優惠', desc: '生日當月送 200 點' },
      { icon: '👥', title: '好友分享', desc: '邀請好友雙方各得 50 點' },
    ]
  },

  industrySpecific: {
    pointsPerDollar: 0.1,             // 消費 $100 = 10 點
    bookingEnabled: true,
    menuEnabled: true,
    tableNumber: true,
    deliveryTracking: true,
  },

  // 餐廳特有：兌換商品
  exchangeItems: [
    { id: 'drink', name: '飲料兌換券', points: 50, icon: '🥤' },
    { id: 'dessert', name: '甜點兌換券', points: 100, icon: '🍰' },
    { id: 'appetizer', name: '開胃菜兌換券', points: 150, icon: '🥗' },
    { id: 'main', name: '主餐折抵券', points: 300, icon: '🍝' },
    { id: 'set', name: '雙人套餐券', points: 800, icon: '🍱' },
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG };
}

