// ==================== 狀態中文化對照表 ====================

// 🔄 處理狀態對照
const STATUS_MAP = {
  // 英文 → 中文
  'pending': '待處理',
  'processing': '處理中',
  'completed': '已完成',
  'rejected': '已拒絕',
  'cancelled': '已取消',
  'shipped': '已出貨',
  
  // 中文 → 英文（供查詢使用）
  '待處理': 'pending',
  '處理中': 'processing',
  '已完成': 'completed',
  '已拒絕': 'rejected',
  '已取消': 'cancelled',
  '已出貨': 'shipped'
};

// 💰 交易類型對照
const TRANSACTION_TYPE_MAP = {
  // 英文 → 中文
  'register': '註冊贈點',
  'transfer_in': '轉入點數',
  'transfer_out': '轉出點數',
  'purchase': '購買點數',
  'withdraw': '提領兌現',
  'mall_purchase': '商城購買',
  'mall_sale': '商品售出',
  'referral_purchase_reward': '推薦購買獎勵',
  'referral_withdraw_reward': '推薦提領獎勵',
  'referral_bonus': '推薦註冊獎勵',
  'referral_reward': '推薦獎勵',
  'admin_add': '管理員加點',
  'admin_deduct': '管理員扣點',
  
  // 中文 → 英文
  '註冊贈點': 'register',
  '轉入點數': 'transfer_in',
  '轉出點數': 'transfer_out',
  '購買點數': 'purchase',
  '提領兌現': 'withdraw',
  '商城購買': 'mall_purchase',
  '商品售出': 'mall_sale',
  '推薦購買獎勵': 'referral_purchase_reward',
  '推薦提領獎勵': 'referral_withdraw_reward',
  '推薦註冊獎勵': 'referral_bonus',
  '推薦獎勵': 'referral_reward',
  '管理員加點': 'admin_add',
  '管理員扣點': 'admin_deduct'
};

// 💳 付款方式對照
const PAYMENT_METHOD_MAP = {
  // 英文 → 中文
  'cash': '現金',
  'credit_card': '信用卡',
  'bank_transfer': '銀行轉帳',
  'line_pay': 'LINE Pay',
  'other': '其他',
  
  // 中文 → 英文
  '現金': 'cash',
  '信用卡': 'credit_card',
  '銀行轉帳': 'bank_transfer',
  'LINE Pay': 'line_pay',
  '其他': 'other'
};

// 👤 帳號狀態對照
const ACCOUNT_STATUS_MAP = {
  // 英文 → 中文
  'active': '啟用',
  'inactive': '停用',
  'suspended': '暫停',
  'blocked': '封鎖',
  
  // 中文 → 英文
  '啟用': 'active',
  '停用': 'inactive',
  '暫停': 'suspended',
  '封鎖': 'blocked'
};

// 🏆 會員等級對照
const MEMBER_LEVEL_MAP = {
  // 英文 → 中文
  'BRONZE': '銅級會員',
  'SILVER': '銀級會員',
  'GOLD': '金級會員',
  'PLATINUM': '白金會員',
  
  // 中文 → 英文
  '銅級會員': 'BRONZE',
  '銀級會員': 'SILVER',
  '金級會員': 'GOLD',
  '白金會員': 'PLATINUM'
};

// 🎯 下拉選單選項（中文版）
const DROPDOWN_OPTIONS = {
  status: ['待處理', '處理中', '已完成', '已拒絕', '已取消', '已出貨'],
  transactionType: ['註冊贈點', '轉入點數', '轉出點數', '購買點數', '提領兌現', '商城購買', '商品售出', '推薦購買獎勵', '推薦提領獎勵', '推薦註冊獎勵', '管理員加點', '管理員扣點'],
  paymentMethod: ['現金', '信用卡', '銀行轉帳', 'LINE Pay', '其他'],
  accountStatus: ['啟用', '停用', '暫停', '封鎖'],
  memberLevel: ['銅級會員', '銀級會員', '金級會員', '白金會員']
};

