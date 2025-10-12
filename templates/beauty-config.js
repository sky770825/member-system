/**
 * 美容美髮會員系統配置範例
 */

const CONFIG = {
  system: {
    name: '美麗殿堂會員系統',
    shortName: '美麗會員',
    industry: 'beauty',
  },

  brand: {
    companyName: '美麗殿堂 Beauty Salon',
    primaryColor: '#FF69B4',          // 粉紅色
    secondaryColor: '#DDA0DD',
    accentColor: '#FFB6C1',
  },

  points: {
    name: '美麗積分',
    unit: '點',
    icon: '💅',
    initialPoints: 200,
    expiryDays: 365,
  },

  memberLevels: {
    enabled: true,
    levels: [
      { id: 'member', name: '會員', minPoints: 0, icon: '💄', discount: 0 },
      { id: 'silver', name: '銀卡', minPoints: 1000, icon: '🥈', discount: 0.08 },
      { id: 'gold', name: '金卡', minPoints: 3000, icon: '🥇', discount: 0.12 },
      { id: 'diamond', name: '鑽石卡', minPoints: 10000, icon: '💎', discount: 0.2 },
    ]
  },

  features: {
    register: true,
    transfer: false,                  // 美容業通常不允許轉點
    exchange: true,
    checkin: true,
    appointment: true,                // 預約功能
    serviceHistory: true,             // 服務記錄
  },

  formFields: {
    register: [
      { name: 'name', label: '姓名', type: 'text', required: true },
      { name: 'phone', label: '手機號碼', type: 'tel', required: true },
      { name: 'email', label: '電子郵件', type: 'email', required: true },
      { name: 'birthday', label: '生日', type: 'date', required: true },
      { name: 'gender', label: '性別', type: 'select', options: ['女', '男', '其他'], required: false },
      { name: 'skinType', label: '膚質類型', type: 'select', 
        options: ['一般', '乾性', '油性', '混合性', '敏感性'], required: false },
    ]
  },

  text: {
    welcomeMessage: '歡迎加入美麗殿堂',
    registerSuccess: '🎉 註冊成功！贈送 200 美麗積分',
    features: [
      { icon: '💆', title: '頂級服務', desc: '專業美容美髮服務' },
      { icon: '💎', title: '積分回饋', desc: '消費累積美麗積分' },
      { icon: '🎁', title: '生日禮遇', desc: '生日月享特別優惠' },
      { icon: '📅', title: '線上預約', desc: '隨時預約服務時段' },
    ]
  },

  exchangeItems: [
    { id: 'shampoo', name: '洗髮精', points: 200, icon: '🧴' },
    { id: 'facial', name: '臉部保養療程', points: 500, icon: '💆' },
    { id: 'manicure', name: '美甲服務', points: 300, icon: '💅' },
    { id: 'haircut', name: '剪髮服務', points: 400, icon: '✂️' },
    { id: 'spa', name: 'SPA 療程', points: 1000, icon: '🧖' },
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG };
}

