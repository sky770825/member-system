/**
 * 健身房會員系統配置範例
 */

const CONFIG = {
  system: {
    name: '健力健身會員系統',
    shortName: '健力會員',
    industry: 'fitness',
  },

  brand: {
    companyName: '健力健身中心 Fitness Club',
    primaryColor: '#FF9800',          // 活力橙
    secondaryColor: '#FFC107',
    accentColor: '#FF5722',
  },

  points: {
    name: '健康點數',
    unit: '點',
    icon: '💪',
    initialPoints: 50,
    expiryDays: 90,                   // 鼓勵持續運動
  },

  memberLevels: {
    enabled: true,
    levels: [
      { id: 'starter', name: '新手', minPoints: 0, icon: '🏃', discount: 0 },
      { id: 'bronze', name: '銅牌', minPoints: 300, icon: '🥉', discount: 0.05 },
      { id: 'silver', name: '銀牌', minPoints: 1000, icon: '🥈', discount: 0.1 },
      { id: 'gold', name: '金牌', minPoints: 3000, icon: '🥇', discount: 0.15 },
      { id: 'champion', name: '冠軍', minPoints: 10000, icon: '🏆', discount: 0.2 },
    ]
  },

  features: {
    register: true,
    transfer: false,
    exchange: true,
    checkin: true,                    // 到場簽到得點數
    classBooking: true,               // 課程預約
    workoutTracking: true,            // 運動記錄
    challenge: true,                  // 運動挑戰
  },

  formFields: {
    register: [
      { name: 'name', label: '姓名', type: 'text', required: true },
      { name: 'phone', label: '手機號碼', type: 'tel', required: true },
      { name: 'email', label: '電子郵件', type: 'email', required: true },
      { name: 'birthday', label: '生日', type: 'date', required: true },
      { name: 'gender', label: '性別', type: 'select', options: ['男', '女', '其他'], required: false },
      { name: 'fitnessGoal', label: '健身目標', type: 'select', 
        options: ['增肌', '減脂', '維持體態', '提升體能', '康復訓練'], required: false },
      { name: 'emergencyContact', label: '緊急聯絡人', type: 'text', required: false },
      { name: 'emergencyPhone', label: '緊急聯絡電話', type: 'tel', required: false },
    ]
  },

  text: {
    welcomeMessage: '開始您的健身之旅',
    registerSuccess: '🎉 註冊成功！獲得 50 健康點數',
    features: [
      { icon: '🏋️', title: '專業器材', desc: '頂級健身設備' },
      { icon: '💪', title: '打卡獎勵', desc: '每次來訪累積點數' },
      { icon: '📅', title: '課程預約', desc: '多種團體課程任選' },
      { icon: '🎯', title: '目標追蹤', desc: '記錄您的健身進度' },
    ]
  },

  exchangeItems: [
    { id: 'protein', name: '乳清蛋白', points: 300, icon: '🥤' },
    { id: 'towel', name: '運動毛巾', points: 100, icon: '🧺' },
    { id: 'class', name: '團體課程券', points: 150, icon: '🎫' },
    { id: 'pt', name: '私人教練課程', points: 500, icon: '🏋️' },
    { id: 'massage', name: '運動按摩', points: 400, icon: '💆' },
  ],

  // 健身房特有：簽到獎勵
  checkinRewards: {
    daily: 10,                        // 每日簽到得 10 點
    weekly: 50,                       // 連續 7 天額外 50 點
    monthly: 200,                     // 連續 30 天額外 200 點
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG };
}

