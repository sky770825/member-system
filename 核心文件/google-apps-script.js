/**
 * 會員註冊系統 - Google Apps Script
 * 用於 Google Sheets 作為資料庫
 * 
 * 工作表結構（標準版）：
 * - Members: lineUserId, name, phone, email, birthday, lineName, linePicture, points, memberLevel, totalEarned, totalSpent, referralCode, status, lastLoginAt, createdAt, updatedAt
 * - Transactions: id, type, senderUserId, receiverUserId, senderName, receiverName, points, message, balanceAfter, status, createdAt
 * - MemberLevels: id, levelCode, levelName, minPoints, discount, icon, color, isActive, createdAt
 * - Activities: id, lineUserId, activityType, points, metadata, completedAt, createdAt
 * - Settings: key, value, type, description, category, updatedBy, updatedAt
 * - DailyStats: date, newMembers, activeMembers, totalTransactions, pointsIssued, pointsRedeemed, createdAt
 */

// ==================== 設定區 ====================
const SHEET_ID = '1EdLfJQzYroQ9WMqVEqcDuMpGwiTPj8gxLaMnGp3umDw'; // 替換為您的 Google Sheet ID

// 🔧 工作表名稱設定（全中文版）✨
const MEMBERS_SHEET = '會員資料';           // 會員表
const TRANSACTIONS_SHEET = '交易記錄';      // 交易記錄表
const REFERRALS_SHEET = '推薦關係';         // 推薦關係表
const PURCHASES_SHEET = '購買記錄';         // 購買記錄表
const WITHDRAWALS_SHEET = '提領記錄';       // 提領記錄表
const PRODUCTS_SHEET = '商城商品';          // 商城商品表
const MALL_ORDERS_SHEET = '商城訂單';       // 商城訂單表 ⭐
const MEMBER_LEVELS_SHEET = '會員等級';     // 會員等級表
const ACTIVITIES_SHEET = '活動記錄';        // 活動記錄表
const SETTINGS_SHEET = '系統設定';          // 系統設定表
const DAILY_STATS_SHEET = '每日統計';       // 每日統計表

const INITIAL_POINTS = 0; // 新會員註冊贈送點數

// ==================== 狀態中文化對照表 ====================
// 🎯 所有狀態都使用中文，提升使用體驗

// 📋 處理狀態（用於訂單、提領等）
const STATUS_CH = {
  PENDING: '待處理',
  PROCESSING: '處理中',
  COMPLETED: '已完成',
  REJECTED: '已拒絕',
  CANCELLED: '已取消',
  SHIPPED: '已出貨'
};

// 👤 帳號狀態
const ACCOUNT_STATUS_CH = {
  ACTIVE: '啟用',
  INACTIVE: '停用',
  SUSPENDED: '暫停',
  BLOCKED: '封鎖'
};

// 💳 付款方式
const PAYMENT_METHOD_CH = {
  CASH: '現金',
  CREDIT_CARD: '信用卡',
  BANK_TRANSFER: '銀行轉帳',
  LINE_PAY: 'LINE Pay',
  OTHER: '其他'
};

// 會員等級定義（中文版）
const MEMBER_LEVELS = {
  BRONZE: { name: '銅級會員', minPoints: 0, discount: 0, icon: '🥉' },
  SILVER: { name: '銀級會員', minPoints: 500, discount: 0.05, icon: '🥈' },
  GOLD: { name: '金級會員', minPoints: 1000, discount: 0.1, icon: '🥇' },
  PLATINUM: { name: '白金會員', minPoints: 5000, discount: 0.15, icon: '💎' }
};

// ==================== 主要 API 處理函數 ====================

/**
 * Web App 主要進入點
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const lineUserId = e.parameter.lineUserId;
    const phone = e.parameter.phone;
    
    let result;
    
    switch(action) {
      case 'check':
        // 檢查會員是否已註冊
        result = checkMemberExists(lineUserId);
        break;
        
      case 'profile':
        // 取得會員資料
        result = getMemberProfile(lineUserId);
        break;
        
      case 'check-user':
        // 透過手機號碼檢查會員
        result = checkUserByPhone(phone);
        break;
        
      case 'transactions':
        // 取得交易記錄
        const limit = e.parameter.limit || 20;
        result = getTransactions(lineUserId, limit);
        break;
        
      case 'admin-stats':
        // 管理員：取得系統統計
        result = getAdminStats();
        break;
        
      case 'admin-members':
        // 管理員：取得所有會員列表
        result = getAllMembers();
        break;
        
      case 'adjust-points':
        // 管理員：調整點數（支援 GET 方式）
        result = adjustPoints({
          lineUserId: e.parameter.lineUserId,
          points: parseInt(e.parameter.points),
          reason: e.parameter.reason || '管理員調整'
        });
        break;
        
      case 'register':
        // 註冊新會員（支援 GET 方式以避免 CORS 問題）
        result = registerMember({
          lineUserId: e.parameter.lineUserId,
          name: e.parameter.name,
          phone: e.parameter.phone,
          email: e.parameter.email || '',
          birthday: e.parameter.birthday || '',
          lineName: e.parameter.lineName || '',
          linePicture: e.parameter.linePicture || '',
          referralCode: e.parameter.referralCode || ''  // 🔧 添加推薦碼參數
        });
        break;
        
      case 'transfer':
        // 轉點（支援 GET 方式以避免 CORS 問題）
        result = transferPoints({
          senderUserId: e.parameter.senderUserId,
          receiverUserId: e.parameter.receiverUserId,
          points: parseInt(e.parameter.points),
          message: e.parameter.message || ''
        });
        break;
        
      case 'update-profile':
        // 更新會員資料（支援 GET 方式以避免 CORS 問題）
        result = updateMemberProfile({
          lineUserId: e.parameter.lineUserId,
          email: e.parameter.email,
          birthday: e.parameter.birthday
        });
        break;
        
      case 'verify-referral':
        // 🎯 驗證推薦碼
        result = verifyReferralCode(e.parameter.referralCode);
        break;
        
      case 'referral-stats':
        // 🎯 取得推薦統計
        result = getReferralStats();
        break;
        
      case 'my-referrals':
        // 🎯 取得個人推薦記錄
        result = getMyReferrals(e.parameter.lineUserId);
        break;
        
      case 'purchase':
        // 🎯 購買點數（支援 GET 方式）
        result = purchasePoints(
          e.parameter.lineUserId,
          parseInt(e.parameter.points),
          {
            amount: parseFloat(e.parameter.amount) || parseInt(e.parameter.points),
            paymentMethod: e.parameter.paymentMethod || 'manual',
            paymentStatus: e.parameter.paymentStatus || 'paid',
            invoiceNumber: e.parameter.invoiceNumber || '',
            orderNumber: e.parameter.orderNumber || '',
            ipAddress: e.parameter.ipAddress || '',
            notes: e.parameter.notes || ''
          }
        );
        break;
        
      case 'withdraw':
        // 🎯 提領點數（支援 GET 方式）
        result = withdrawPoints(
          e.parameter.lineUserId,
          parseInt(e.parameter.points),
          {
            bankName: e.parameter.bankName || '',
            bankAccount: e.parameter.bankAccount || '',
            accountName: e.parameter.accountName || '',
            notes: e.parameter.notes || ''
          }
        );
        break;
        
      case 'purchase-history':
        // 💰 取得購買歷史
        result = getPurchaseHistory(
          e.parameter.lineUserId,
          parseInt(e.parameter.limit) || 20
        );
        break;
        
      case 'purchase-stats':
        // 📊 取得購買統計
        result = getPurchaseStats(e.parameter.lineUserId || null);
        break;
        
      case 'all-purchases':
        // 📊 取得所有購買記錄（管理員）
        result = getAllPurchases({
          status: e.parameter.status || '',
          paymentStatus: e.parameter.paymentStatus || ''
        });
        break;
        
      case 'login':
        // 🔐 帳號密碼登入
        result = loginWithPassword(
          e.parameter.username,
          e.parameter.password
        );
        break;
        
      case 'register-password':
        // 🔐 帳號密碼註冊
        result = registerWithPassword({
          name: e.parameter.name,
          phone: e.parameter.phone,
          email: e.parameter.email || '',
          birthday: e.parameter.birthday || '',
          username: e.parameter.username,
          password: e.parameter.password,
          referralCode: e.parameter.referralCode || ''
        });
        break;
        
      case 'withdrawal-history':
        // 💵 查詢提領記錄
        result = getWithdrawalHistory(lineUserId);
        break;
        
      case 'mall-products':
        // 🛒 獲取商城商品列表
        result = getMallProducts();
        break;
        
      case 'mall-product-detail':
        // 🛒 獲取商品詳情
        result = getMallProductDetail(e.parameter.productId);
        break;
        
      case 'mall-purchase':
        // 🛒 購買商城商品
        result = purchaseMallProduct(lineUserId, e.parameter.productId);
        break;
        
      case 'mall-orders':
        // 🛍️ 獲取我的訂單
        result = getMallOrders(lineUserId);
        break;
        
      case 'upload-product':
        // 🏪 上架商品
        result = uploadProduct(lineUserId, e.parameter);
        break;
        
      case 'update-product':
        // ✏️ 更新商品
        result = updateProduct(lineUserId, e.parameter);
        break;
        
      case 'my-product':
        // 📦 查詢我的商品
        result = getMyProduct(lineUserId);
        break;
        
      case 'version':
        // 🔧 檢查版本
        result = {
          success: true,
          version: '2.1.0',
          build: '2025-10-17-21:00',
          features: [
            '新推薦系統（購買/提領 20% 獎勵）',
            '時間戳修復',
            '累加式快速選擇',
            '自動刷新（5秒）',
            '即時通知'
          ],
          functions: {
            bindReferralRelation: typeof bindReferralRelation !== 'undefined',
            purchasePoints: typeof purchasePoints !== 'undefined',
            withdrawPoints: typeof withdrawPoints !== 'undefined',
            getReferrer: typeof getReferrer !== 'undefined',
            giveReferrerReward: typeof giveReferrerReward !== 'undefined'
          },
          totalLines: 2248
        };
        break;
        
      default:
        result = {
          success: false,
          message: '未知的操作'
        };
    }
    
    return createCorsResponse(result);
      
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    return createCorsResponse({
      success: false,
      message: '系統錯誤',
      error: error.toString()
    });
  }
}

/**
 * POST 請求處理
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = e.parameter.action || data.action;
    
    let result;
    
    switch(action) {
      case 'register':
        // 註冊新會員
        result = registerMember(data);
        break;
        
      case 'register-password':
        // 🔐 帳號密碼註冊（安全的 POST 方式）
        result = registerWithPassword({
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          birthday: data.birthday || '',
          username: data.username,
          password: data.password,
          referralCode: data.referralCode || ''
        });
        break;
        
      case 'login':
        // 🔐 帳號密碼登入（安全的 POST 方式）
        result = loginWithPassword(
          data.username,
          data.password
        );
        break;
        
      case 'withdraw':
        // 🔐 提領點數（安全的 POST 方式，保護銀行帳號）
        result = withdrawPoints(
          data.lineUserId,
          parseInt(data.points),
          {
            bankName: data.bankName || '',
            bankAccount: data.bankAccount || '',
            accountName: data.accountName || '',
            notes: data.notes || ''
          }
        );
        break;
        
      case 'transfer':
        // 轉點
        result = transferPoints(data);
        break;
        
      case 'update-profile':
        // 更新會員資料
        result = updateMemberProfile(data);
        break;
        
      case 'adjust-points':
        // 管理員調整點數
        result = adjustPoints(data);
        break;
        
      case 'add-password':
        // 🔐 為 LINE 用戶新增帳號密碼
        result = addPasswordToLineUser({
          lineUserId: data.lineUserId,
          username: data.username,
          password: data.password
        });
        break;
        
      default:
        result = {
          success: false,
          message: '未知的操作'
        };
    }
    
    return createCorsResponse(result);
      
  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    return createCorsResponse({
      success: false,
      message: '系統錯誤',
      error: error.toString()
    });
  }
}

/**
 * 處理 CORS 預檢請求（OPTIONS）
 * Google Apps Script 會自動處理 CORS，只需返回成功狀態
 */
function doOptions(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 建立 JSON 回應
 * Google Apps Script 在正確部署後會自動添加 CORS headers
 */
function createCorsResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== 會員相關函數 ====================

/**
 * 檢查會員是否存在
 */
function checkMemberExists(lineUserId) {
  const sheet = getSheet(MEMBERS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === lineUserId) {
      return {
        registered: true,
        member: {
          name: data[i][1],
          phone: data[i][2],
          points: data[i][7]
        }
      };
    }
  }
  
  return { registered: false };
}

/**
 * 取得會員資料
 */
function getMemberProfile(lineUserId) {
  const sheet = getSheet(MEMBERS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === lineUserId) {
      // 計算推薦人數
      const referralCount = countReferrals(data[i][11]); // 推薦碼
      
      return {
        success: true,
        lineUserId: data[i][0],
        name: data[i][1],
        phone: data[i][2],
        email: data[i][3],
        birthday: data[i][4],
        lineName: data[i][5],
        linePicture: data[i][6],
        points: data[i][7],
        memberLevel: data[i][8],
        totalEarned: data[i][9],          // 累計獲得
        totalSpent: data[i][10],          // 累計消費
        referralCode: data[i][11],        // 🎯 我的推薦碼
        referredBy: data[i][12],          // 🎯 被誰推薦（新增）
        referralCount: referralCount,     // 🎯 推薦人數
        status: data[i][13],              // 帳號狀態
        createdAt: data[i][15],
        updatedAt: data[i][16]
      };
    }
  }
  
  return {
    success: false,
    message: '找不到會員資料'
  };
}

/**
 * 透過手機號碼檢查會員
 */
function checkUserByPhone(phone) {
  const sheet = getSheet(MEMBERS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  // 移除手機號碼中的連字號
  const cleanPhone = phone.replace(/-/g, '');
  
  for (let i = 1; i < data.length; i++) {
    const memberPhone = String(data[i][2]).replace(/-/g, '');
    if (memberPhone === cleanPhone) {
      return {
        exists: true,
        name: data[i][1],
        lineUserId: data[i][0],
        phone: data[i][2]
      };
    }
  }
  
  return { exists: false };
}

/**
 * 註冊新會員
 */
function registerMember(data) {
  try {
    const sheet = getSheet(MEMBERS_SHEET);
    
    // 檢查是否已註冊
    const existingMember = checkMemberExists(data.lineUserId);
    if (existingMember.registered) {
      return {
        success: false,
        message: '此帳號已經註冊過了'
      };
    }
    
    // 檢查手機號碼是否重複
    const phoneCheck = checkUserByPhone(data.phone);
    if (phoneCheck.exists) {
      return {
        success: false,
        message: '此手機號碼已被使用'
      };
    }
    
    const now = new Date().toISOString();
    const initialPoints = getSetting('initialPoints', INITIAL_POINTS);
    const memberLevel = calculateMemberLevel(initialPoints);
    const referralCode = generateReferralCode(data.lineUserId, data.phone);
    
    // 新增會員資料（包含新欄位）
    sheet.appendRow([
      data.lineUserId,                    // LINE用戶ID
      data.name,                          // 姓名
      data.phone,                         // 手機號碼
      data.email || '',                   // 電子郵件
      data.birthday || '',                // 生日
      data.lineName || '',                // LINE顯示名稱
      data.linePicture || '',             // LINE頭像網址
      initialPoints,                      // 目前點數
      memberLevel,                        // 會員等級
      initialPoints,                      // 累計獲得
      0,                                  // 累計消費
      referralCode,                       // 推薦碼
      data.referralCode || '',            // 被誰推薦 🎯 新增
      ACCOUNT_STATUS_CH.ACTIVE,           // 帳號狀態（中文）
      now,                                // 最後登入
      now,                                // 註冊時間
      now                                 // 更新時間
    ]);
    
    // 記錄註冊交易
    addTransaction({
      type: 'register',
      receiverUserId: data.lineUserId,
      receiverName: data.name,
      points: initialPoints,
      message: '新會員註冊贈送',
      balanceAfter: initialPoints,
      status: STATUS_CH.COMPLETED
    });
    
    // 🎯 處理推薦綁定（不再贈送點數，只記錄關係）
    let referrerName = '';
    
    Logger.log('========== 推薦碼檢查 ==========');
    Logger.log('推薦碼參數: ' + JSON.stringify(data.referralCode));
    
    if (data.referralCode && data.referralCode.trim() !== '') {
      Logger.log('✅ 偵測到推薦碼: ' + data.referralCode.trim());
      
      const referralResult = bindReferralRelation(data.lineUserId, data.name, data.referralCode.trim());
      Logger.log('推薦綁定結果: ' + JSON.stringify(referralResult));
      
      if (referralResult.success) {
        referrerName = referralResult.referrerName;
        Logger.log(`✅ 推薦關係綁定成功：${referrerName} → ${data.name}`);
      } else {
        Logger.log('❌ 推薦關係綁定失敗: ' + referralResult.message);
      }
    } else {
      Logger.log('⚠️ 沒有推薦碼或推薦碼為空');
    }
    Logger.log('========== 推薦碼檢查結束 ==========');
    
    // 記錄註冊活動
    logActivity(data.lineUserId, 'register', initialPoints, {
      name: data.name,
      phone: data.phone,
      referralCode: referralCode,
      referredBy: data.referralCode || null
    });
    
    // 🔧 新版：不再贈送推薦獎勵，只綁定關係
    const successMessage = referrerName 
      ? `註冊成功！已綁定推薦人：${referrerName}` 
      : '註冊成功';
    
    return {
      success: true,
      message: successMessage,
      points: initialPoints,  // 只有初始點數
      memberLevel: memberLevel,
      referralCode: referralCode,
      referrerName: referrerName || null
    };
    
  } catch (error) {
    Logger.log('registerMember Error: ' + error.toString());
    return {
      success: false,
      message: '註冊失敗：' + error.toString()
    };
  }
}

/**
 * 更新會員資料
 */
function updateMemberProfile(data) {
  try {
    const sheet = getSheet(MEMBERS_SHEET);
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.lineUserId) {
        const row = i + 1;
        
        if (data.name) sheet.getRange(row, 2).setValue(data.name);
        if (data.phone) sheet.getRange(row, 3).setValue(data.phone);
        if (data.email !== undefined) sheet.getRange(row, 4).setValue(data.email);
        if (data.birthday !== undefined) sheet.getRange(row, 5).setValue(data.birthday);
        
        // 更新時間
        sheet.getRange(row, 10).setValue(new Date().toISOString());
        
        return {
          success: true,
          message: '更新成功'
        };
      }
    }
    
    return {
      success: false,
      message: '找不到會員資料'
    };
    
  } catch (error) {
    Logger.log('updateMemberProfile Error: ' + error.toString());
    return {
      success: false,
      message: '更新失敗：' + error.toString()
    };
  }
}

// ==================== 點數相關函數 ====================

/**
 * 轉點功能
 */
function transferPoints(data) {
  try {
    const sheet = getSheet(MEMBERS_SHEET);
    const allData = sheet.getDataRange().getValues();
    
    let senderRow = -1;
    let receiverRow = -1;
    let senderName = '';
    let receiverName = '';
    let senderPoints = 0;
    let receiverPoints = 0;
    
    // 找到發送者和接收者
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.senderUserId) {
        senderRow = i + 1;
        senderName = allData[i][1];
        senderPoints = Number(allData[i][7]);
      }
      if (allData[i][0] === data.receiverUserId) {
        receiverRow = i + 1;
        receiverName = allData[i][1];
        receiverPoints = Number(allData[i][7]);
      }
    }
    
    // 驗證
    if (senderRow === -1) {
      return { success: false, message: '找不到發送者資料' };
    }
    if (receiverRow === -1) {
      return { success: false, message: '找不到接收者資料' };
    }
    if (senderPoints < data.points) {
      return { success: false, message: '點數不足' };
    }
    if (data.points < 1) {
      return { success: false, message: '轉點數量必須大於 0' };
    }
    if (data.senderUserId === data.receiverUserId) {
      return { success: false, message: '不能轉點給自己' };
    }
    
    // 扣除發送者點數
    const newSenderPoints = senderPoints - data.points;
    sheet.getRange(senderRow, 8).setValue(newSenderPoints);
    sheet.getRange(senderRow, 10).setValue(new Date().toISOString());
    
    // 增加接收者點數
    const newReceiverPoints = receiverPoints + data.points;
    sheet.getRange(receiverRow, 8).setValue(newReceiverPoints);
    sheet.getRange(receiverRow, 10).setValue(new Date().toISOString());
    
    // 記錄交易 (發送者)
    addTransaction({
      type: 'transfer_out',
      senderUserId: data.senderUserId,
      senderName: senderName,
      receiverUserId: data.receiverUserId,
      receiverName: receiverName,
      points: -data.points,
      message: data.message || '',
      balanceAfter: newSenderPoints,
      status: STATUS_CH.COMPLETED
    });
    
    // 記錄交易 (接收者)
    addTransaction({
      type: 'transfer_in',
      senderUserId: data.senderUserId,
      senderName: senderName,
      receiverUserId: data.receiverUserId,
      receiverName: receiverName,
      points: data.points,
      message: data.message || '',
      balanceAfter: newReceiverPoints,
      status: STATUS_CH.COMPLETED
    });
    
    return {
      success: true,
      message: '轉點成功',
      remainingPoints: newSenderPoints,
      receiverNewPoints: newReceiverPoints
    };
    
  } catch (error) {
    Logger.log('transferPoints Error: ' + error.toString());
    return {
      success: false,
      message: '轉點失敗：' + error.toString()
    };
  }
}

/**
 * 管理員調整點數
 */
function adjustPoints(data) {
  try {
    const sheet = getSheet(MEMBERS_SHEET);
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.lineUserId) {
        const row = i + 1;
        const currentPoints = Number(allData[i][7]);
        const totalEarned = Number(allData[i][9]) || 0;
        const totalSpent = Number(allData[i][10]) || 0;
        const newPoints = currentPoints + data.points;
        
        if (newPoints < 0) {
          return {
            success: false,
            message: '調整後點數不能為負數'
          };
        }
        
        // 更新點數
        sheet.getRange(row, 8).setValue(newPoints);
        
        // 更新累計統計
        if (data.points > 0) {
          // 增加點數 = 累計獲得
          sheet.getRange(row, 10).setValue(totalEarned + data.points);
        } else {
          // 扣除點數 = 累計消費
          sheet.getRange(row, 11).setValue(totalSpent + Math.abs(data.points));
        }
        
        // 根據新點數更新會員等級
        const newLevel = calculateMemberLevel(newPoints);
        sheet.getRange(row, 9).setValue(newLevel);
        
        // 更新時間
        sheet.getRange(row, 16).setValue(new Date().toISOString()); // updatedAt
        
        // 記錄交易
        addTransaction({
          type: data.points > 0 ? 'admin_add' : 'admin_deduct',
          receiverUserId: data.lineUserId,
          receiverName: allData[i][1],
          points: data.points,
          message: data.reason || '管理員調整',
          balanceAfter: newPoints
        });
        
        // 記錄到活動表
        logActivity(data.lineUserId, data.points > 0 ? 'admin_add' : 'admin_deduct', data.points, {
          reason: data.reason,
          oldPoints: currentPoints,
          newPoints: newPoints,
          newLevel: newLevel
        });
        
        return {
          success: true,
          message: '調整成功',
          oldPoints: currentPoints,
          newPoints: newPoints,
          oldLevel: allData[i][8],
          newLevel: newLevel
        };
      }
    }
    
    return {
      success: false,
      message: '找不到會員資料'
    };
    
  } catch (error) {
    Logger.log('adjustPoints Error: ' + error.toString());
    return {
      success: false,
      message: '調整失敗：' + error.toString()
    };
  }
}

// ==================== 交易記錄函數 ====================

/**
 * 新增交易記錄
 */
function addTransaction(data) {
  try {
    const sheet = getSheet(TRANSACTIONS_SHEET);
    const id = Utilities.getUuid();
    const now = new Date().getTime(); // 🔧 改用時間戳（毫秒）
    
    sheet.appendRow([
      id,
      data.type,
      data.senderUserId || '',
      data.receiverUserId || '',
      data.senderName || '',
      data.receiverName || '',
      data.points,
      data.message || '',
      data.balanceAfter || 0,
      data.status || STATUS_CH.COMPLETED,
      now
    ]);
    
    return true;
  } catch (error) {
    Logger.log('addTransaction Error: ' + error.toString());
    return false;
  }
}

/**
 * 取得交易記錄
 */
function getTransactions(lineUserId, limit = 20) {
  try {
    const sheet = getSheet(TRANSACTIONS_SHEET);
    const data = sheet.getDataRange().getValues();
    const transactions = [];
    
    // 從最新的記錄開始讀取
    for (let i = data.length - 1; i > 0; i--) {
      const row = data[i];
      
      // 檢查是否與該使用者相關
      if (row[2] === lineUserId || row[3] === lineUserId) {
        // 確保 createdAt 是正確的時間戳（毫秒）
        let timestamp = row[10]; // 🔧 修正：createdAt 是第 10 個欄位（從 0 開始）
        if (timestamp instanceof Date) {
          timestamp = timestamp.getTime();
        } else if (typeof timestamp === 'string') {
          timestamp = new Date(timestamp).getTime();
        } else if (typeof timestamp === 'number') {
          // 已經是時間戳，直接使用
          timestamp = timestamp;
        }
        
        transactions.push({
          id: row[0],
          type: row[1],
          senderUserId: row[2],
          receiverUserId: row[3],
          senderName: row[4],
          receiverName: row[5],
          points: row[6],
          message: row[7],
          createdAt: timestamp
        });
        
        if (transactions.length >= limit) {
          break;
        }
      }
    }
    
    return {
      success: true,
      transactions: transactions,
      total: transactions.length
    };
    
  } catch (error) {
    Logger.log('getTransactions Error: ' + error.toString());
    return {
      success: false,
      message: '取得交易記錄失敗',
      transactions: []
    };
  }
}

// ==================== 管理員專用函數 ====================

/**
 * 取得所有會員列表（管理員）
 */
function getAllMembers() {
  try {
    const sheet = getSheet(MEMBERS_SHEET);
    const data = sheet.getDataRange().getValues();
    const members = [];
    
    for (let i = 1; i < data.length; i++) {
      // 計算推薦人數
      const referralCount = countReferrals(data[i][11]);
      
      members.push({
        lineUserId: data[i][0],
        name: data[i][1],
        phone: data[i][2],
        email: data[i][3],
        points: Number(data[i][7]),
        memberLevel: data[i][8] || MEMBER_LEVELS.BRONZE.name,
        totalEarned: Number(data[i][9]) || 0,
        totalSpent: Number(data[i][10]) || 0,
        referralCode: data[i][11],           // 我的推薦碼
        referredBy: data[i][12] || '',       // 被誰推薦 🎯
        referralCount: referralCount,        // 推薦人數 🎯
        status: data[i][13] || ACCOUNT_STATUS_CH.ACTIVE,
        lastLoginAt: data[i][14],
        createdAt: data[i][15]
      });
    }
    
    // 按註冊時間倒序排列
    members.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      success: true,
      members: members,
      total: members.length
    };
  } catch (error) {
    Logger.log('getAllMembers Error: ' + error.toString());
    return {
      success: false,
      message: '取得會員列表失敗',
      members: []
    };
  }
}

/**
 * 取得管理員統計資料
 */
function getAdminStats() {
  try {
    const membersSheet = getSheet(MEMBERS_SHEET);
    const transactionsSheet = getSheet(TRANSACTIONS_SHEET);
    
    const membersData = membersSheet.getDataRange().getValues();
    const transactionsData = transactionsSheet.getDataRange().getValues();
    
    // 計算總會員數
    const totalMembers = membersData.length - 1;
    
    // 計算總點數
    let totalPoints = 0;
    for (let i = 1; i < membersData.length; i++) {
      totalPoints += Number(membersData[i][7]) || 0;
    }
    
    // 計算總交易數
    const totalTransactions = transactionsData.length - 1;
    
    // 計算今日新增會員
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let todayNewMembers = 0;
    
    for (let i = 1; i < membersData.length; i++) {
      const createdDate = new Date(membersData[i][15]); // 註冊時間在第16欄（索引15）
      if (createdDate >= today) {
        todayNewMembers++;
      }
    }
    
    // 計算今日交易數
    let todayTransactions = 0;
    let todayPointsIssued = 0;
    let todayPointsRedeemed = 0;
    
    for (let i = 1; i < transactionsData.length; i++) {
      const transDate = new Date(transactionsData[i][10]); // createdAt
      if (transDate >= today) {
        todayTransactions++;
        const points = Number(transactionsData[i][6]);
        if (points > 0) {
          todayPointsIssued += points;
        } else {
          todayPointsRedeemed += Math.abs(points);
        }
      }
    }
    
    // 統計會員等級分佈
    let levelDistribution = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0
    };
    
    for (let i = 1; i < membersData.length; i++) {
      const level = membersData[i][8] || 'BRONZE';
      if (levelDistribution[level] !== undefined) {
        levelDistribution[level]++;
      }
    }
    
    return {
      success: true,
      stats: {
        totalMembers: totalMembers,
        totalPoints: totalPoints,
        totalTransactions: totalTransactions,
        todayNewMembers: todayNewMembers,
        todayTransactions: todayTransactions,
        todayPointsIssued: todayPointsIssued,
        todayPointsRedeemed: todayPointsRedeemed,
        averagePoints: totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0,
        levelDistribution: levelDistribution
      }
    };
  } catch (error) {
    Logger.log('getAdminStats Error: ' + error.toString());
    return {
      success: false,
      message: '取得統計資料失敗'
    };
  }
}

// ==================== 統計報表函數 ====================

/**
 * 取得系統統計資料
 */
function getStatistics() {
  try {
    const membersSheet = getSheet(MEMBERS_SHEET);
    const transactionsSheet = getSheet(TRANSACTIONS_SHEET);
    
    const membersData = membersSheet.getDataRange().getValues();
    const transactionsData = transactionsSheet.getDataRange().getValues();
    
    // 計算總會員數
    const totalMembers = membersData.length - 1;
    
    // 計算總點數
    let totalPoints = 0;
    for (let i = 1; i < membersData.length; i++) {
      totalPoints += Number(membersData[i][7]);
    }
    
    // 計算今日新增會員
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let todayNewMembers = 0;
    
    for (let i = 1; i < membersData.length; i++) {
      const createdDate = new Date(membersData[i][8]);
      if (createdDate >= today) {
        todayNewMembers++;
      }
    }
    
    // 計算今日交易數
    let todayTransactions = 0;
    for (let i = 1; i < transactionsData.length; i++) {
      const transDate = new Date(transactionsData[i][8]);
      if (transDate >= today) {
        todayTransactions++;
      }
    }
    
    return {
      success: true,
      statistics: {
        totalMembers: totalMembers,
        totalPoints: totalPoints,
        averagePoints: totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0,
        todayNewMembers: todayNewMembers,
        todayTransactions: todayTransactions,
        totalTransactions: transactionsData.length - 1
      }
    };
    
  } catch (error) {
    Logger.log('getStatistics Error: ' + error.toString());
    return {
      success: false,
      message: '取得統計資料失敗'
    };
  }
}

/**
 * 取得點數排行榜
 */
function getLeaderboard(limit = 10) {
  try {
    const sheet = getSheet(MEMBERS_SHEET);
    const data = sheet.getDataRange().getValues();
    const members = [];
    
    // 收集所有會員資料
    for (let i = 1; i < data.length; i++) {
      members.push({
        name: data[i][1],
        points: Number(data[i][7]),
        linePicture: data[i][6]
      });
    }
    
    // 按點數排序
    members.sort((a, b) => b.points - a.points);
    
    // 只返回前 N 名
    const topMembers = members.slice(0, limit);
    
    return {
      success: true,
      leaderboard: topMembers
    };
    
  } catch (error) {
    Logger.log('getLeaderboard Error: ' + error.toString());
    return {
      success: false,
      message: '取得排行榜失敗'
    };
  }
}

// ==================== 密碼加密與驗證 ====================

/**
 * SHA-256 密碼加密
 * @param {string} password - 原始密碼
 * @returns {string} 加密後的密碼
 */
function hashPassword(password) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  
  // 轉換為十六進制字符串
  let hashString = '';
  for (let i = 0; i < rawHash.length; i++) {
    const byte = rawHash[i];
    if (byte < 0) {
      hashString += ('0' + (byte + 256).toString(16)).slice(-2);
    } else {
      hashString += ('0' + byte.toString(16)).slice(-2);
    }
  }
  
  return hashString;
}

/**
 * 驗證密碼
 * @param {string} password - 輸入的密碼
 * @param {string} hash - 儲存的密碼雜湊
 * @returns {boolean} 是否匹配
 */
function verifyPassword(password, hash) {
  const inputHash = hashPassword(password);
  return inputHash === hash;
}

/**
 * 生成 Session Token
 * @param {string} userId - 用戶ID
 * @returns {string} Session Token
 */
function generateSessionToken(userId) {
  const timestamp = new Date().getTime();
  const randomStr = Utilities.getUuid();
  const tokenData = `${userId}:${timestamp}:${randomStr}`;
  return Utilities.base64Encode(tokenData);
}

// ==================== 帳號密碼登入系統 ====================

/**
 * 帳號密碼登入
 * @param {string} username - 帳號（手機號碼或 email）
 * @param {string} password - 密碼
 * @returns {object} 登入結果
 */
function loginWithPassword(username, password) {
  try {
    Logger.log('========== loginWithPassword 開始 ==========');
    Logger.log('帳號: ' + username);
    
    const sheet = getSheet(MEMBERS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // 查找會員（支援手機號碼或 email 登入）
    for (let i = 1; i < data.length; i++) {
      const phone = data[i][2]; // 手機號碼
      const email = data[i][3]; // email
      const storedUsername = data[i][17]; // username
      const passwordHash = data[i][18]; // passwordHash
      const status = data[i][13]; // status
      
      // 檢查帳號是否匹配（手機號碼、email 或 username）
      if (phone === username || email === username || storedUsername === username) {
        Logger.log('找到會員: ' + data[i][1]);
        
        // 檢查帳號狀態
        if (status !== ACCOUNT_STATUS_CH.ACTIVE && status !== '啟用') {
          Logger.log('帳號狀態異常: ' + status);
          return {
            success: false,
            message: '帳號已被停用，請聯繫客服'
          };
        }
        
        // 檢查密碼
        if (!passwordHash) {
          Logger.log('該帳號未設定密碼');
          return {
            success: false,
            message: '此帳號僅支援 LINE 登入，請使用 LINE 登入'
          };
        }
        
        // 驗證密碼
        if (!verifyPassword(password, passwordHash)) {
          Logger.log('密碼錯誤');
          return {
            success: false,
            message: '帳號或密碼錯誤'
          };
        }
        
        // 更新最後登入時間
        const row = i + 1;
        sheet.getRange(row, 15).setValue(new Date().getTime()); // lastLoginAt
        
        // 生成 Session Token
        const userId = data[i][0] || ('WEB-' + data[i][2]); // 如果沒有 LINE ID，用手機號碼
        const sessionToken = generateSessionToken(userId);
        
        Logger.log('登入成功，生成 Token');
        Logger.log('========== loginWithPassword 結束 ==========');
        
        return {
          success: true,
          message: '登入成功',
          sessionToken: sessionToken,
          user: {
            userId: userId,
            name: data[i][1],
            phone: data[i][2],
            email: data[i][3],
            points: data[i][7] || 0,
            memberLevel: data[i][8],
            referralCode: data[i][11],
            loginType: data[i][19] || 'password'
          }
        };
      }
    }
    
    Logger.log('找不到帳號');
    return {
      success: false,
      message: '帳號或密碼錯誤'
    };
    
  } catch (error) {
    Logger.log('loginWithPassword Error: ' + error.toString());
    return {
      success: false,
      message: '登入失敗：' + error.toString()
    };
  }
}

/**
 * 帳號密碼註冊
 * @param {object} data - 註冊資料
 * @returns {object} 註冊結果
 */
function registerWithPassword(data) {
  try {
    Logger.log('========== registerWithPassword 開始 ==========');
    Logger.log('註冊資料: ' + JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: data.email,
      username: data.username
    }));
    
    const sheet = getSheet(MEMBERS_SHEET);
    
    // 檢查手機號碼是否重複
    const phoneCheck = checkUserByPhone(data.phone);
    if (phoneCheck.exists) {
      return {
        success: false,
        message: '此手機號碼已被使用'
      };
    }
    
    // 檢查帳號是否重複
    const sheetData = sheet.getDataRange().getValues();
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][17] === data.username) {
        return {
          success: false,
          message: '此帳號已被使用'
        };
      }
      if (sheetData[i][3] === data.email && data.email) {
        return {
          success: false,
          message: '此 Email 已被使用'
        };
      }
    }
    
    const now = new Date().toISOString();
    const initialPoints = getSetting('initialPoints', INITIAL_POINTS);
    const memberLevel = calculateMemberLevel(initialPoints);
    const referralCode = generateReferralCode('WEB-' + data.phone, data.phone);
    const passwordHash = hashPassword(data.password);
    const userId = 'WEB-' + data.phone; // 網頁版用戶ID
    
    // 新增會員資料
    sheet.appendRow([
      userId,                           // LINE用戶ID (使用 WEB- 前綴)
      data.name,                        // 姓名
      data.phone,                       // 手機號碼
      data.email || '',                 // 電子郵件
      data.birthday || '',              // 生日
      '',                               // LINE顯示名稱（空）
      '',                               // LINE頭像網址（空）
      initialPoints,                    // 目前點數
      memberLevel,                      // 會員等級
      initialPoints,                    // 累計獲得
      0,                                // 累計消費
      referralCode,                     // 推薦碼
      data.referralCode || '',          // 被誰推薦
      ACCOUNT_STATUS_CH.ACTIVE,         // 帳號狀態（中文）
      now,                              // 最後登入
      now,                              // 註冊時間
      now,                              // 更新時間
      data.username,                    // 登入帳號 🔧 新增
      passwordHash,                     // 密碼雜湊 🔧 新增
      'password'                        // 登入類型 🔧 新增
    ]);
    
    Logger.log('✅ 會員資料已新增');
    
    // 記錄註冊交易
    addTransaction({
      type: 'register',
      receiverUserId: userId,
      receiverName: data.name,
      points: initialPoints,
      message: '新會員註冊贈送（網頁版）',
      balanceAfter: initialPoints,
      status: STATUS_CH.COMPLETED
    });
    
    // 處理推薦綁定
    if (data.referralCode && data.referralCode.trim() !== '') {
      const referralResult = bindReferralRelation(userId, data.name, data.referralCode.trim());
      Logger.log('推薦綁定結果: ' + JSON.stringify(referralResult));
    }
    
    // 記錄註冊活動
    logActivity(userId, 'register', initialPoints, {
      name: data.name,
      phone: data.phone,
      referralCode: referralCode,
      referredBy: data.referralCode || null,
      loginType: 'password'
    });
    
    // 生成 Session Token
    const sessionToken = generateSessionToken(userId);
    
    Logger.log('========== registerWithPassword 結束 ==========');
    
    return {
      success: true,
      message: '註冊成功',
      sessionToken: sessionToken,
      points: initialPoints,
      memberLevel: memberLevel,
      referralCode: referralCode,
      user: {
        userId: userId,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        points: initialPoints,
        memberLevel: memberLevel,
        referralCode: referralCode,
        loginType: 'password'
      }
    };
    
  } catch (error) {
    Logger.log('registerWithPassword Error: ' + error.toString());
    return {
      success: false,
      message: '註冊失敗：' + error.toString()
    };
  }
}

/**
 * 🔐 為 LINE 用戶新增帳號密碼登入
 * @param {object} data - { lineUserId, username, password }
 * @returns {object} 結果
 */
function addPasswordToLineUser(data) {
  try {
    Logger.log('========== addPasswordToLineUser 開始 ==========');
    Logger.log('LINE用戶ID: ' + data.lineUserId);
    Logger.log('設定帳號: ' + data.username);
    
    const sheet = getSheet(MEMBERS_SHEET);
    const allData = sheet.getDataRange().getValues();
    
    // 1. 檢查 LINE 用戶是否存在
    let userRow = -1;
    let currentLoginType = '';
    let currentUsername = '';
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.lineUserId) {
        userRow = i + 1;
        currentLoginType = allData[i][19] || 'line';
        currentUsername = allData[i][17] || '';
        break;
      }
    }
    
    if (userRow === -1) {
      Logger.log('❌ 找不到該用戶');
      return {
        success: false,
        message: '找不到該用戶'
      };
    }
    
    Logger.log('✅ 找到用戶，目前登入類型: ' + currentLoginType);
    
    // 2. 檢查該用戶是否已經有帳號密碼
    if (currentLoginType === 'both' || currentLoginType === 'password') {
      Logger.log('⚠️ 用戶已設定過帳號密碼');
      return {
        success: false,
        message: '您已經設定過帳號密碼了',
        username: currentUsername
      };
    }
    
    // 3. 檢查帳號是否已被其他人使用
    for (let i = 1; i < allData.length; i++) {
      if (i !== userRow - 1 && allData[i][17] === data.username) {
        Logger.log('❌ 帳號已被使用: ' + data.username);
        return {
          success: false,
          message: '此帳號已被使用，請選擇其他帳號'
        };
      }
    }
    
    Logger.log('✅ 帳號可用: ' + data.username);
    
    // 4. 密碼加密
    const passwordHash = hashPassword(data.password);
    Logger.log('✅ 密碼已加密');
    
    // 5. 更新用戶資料
    const now = new Date().toISOString();
    sheet.getRange(userRow, 18).setValue(data.username);      // 登入帳號 (欄位 17，索引從1開始所以是18)
    sheet.getRange(userRow, 19).setValue(passwordHash);       // 密碼雜湊 (欄位 18)
    sheet.getRange(userRow, 20).setValue('both');             // 登入類型 (欄位 19)
    sheet.getRange(userRow, 17).setValue(now);                // 更新時間 (欄位 16)
    
    Logger.log('✅ 資料庫已更新');
    
    // 6. 記錄活動
    try {
      logActivity(data.lineUserId, 'add_password', 0, {
        username: data.username,
        message: '設定帳號密碼登入'
      });
      Logger.log('✅ 活動已記錄');
    } catch (logError) {
      Logger.log('⚠️ 記錄活動失敗: ' + logError.toString());
    }
    
    Logger.log('========== addPasswordToLineUser 結束 ==========');
    
    return {
      success: true,
      message: '帳號密碼設定成功！您現在可以用兩種方式登入',
      username: data.username,
      loginType: 'both'
    };
    
  } catch (error) {
    Logger.log('addPasswordToLineUser Error: ' + error.toString());
    return {
      success: false,
      message: '設定失敗：' + error.toString()
    };
  }
}

// ==================== 工具函數 ====================

/**
 * 取得指定的工作表
 */
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  
  // 如果工作表不存在，則建立它
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }
  
  return sheet;
}

/**
 * 初始化工作表（新增標題列）
 */
function initializeSheet(sheet, sheetName) {
  if (sheetName === MEMBERS_SHEET) {
    sheet.appendRow([
      'LINE用戶ID',        // lineUserId (0)
      '姓名',              // name (1)
      '手機號碼',          // phone (2)
      '電子郵件',          // email (3)
      '生日',              // birthday (4)
      'LINE顯示名稱',      // lineName (5)
      'LINE頭像網址',      // linePicture (6)
      '目前點數',          // points (7)
      '會員等級',          // memberLevel (8)
      '累計獲得',          // totalEarned (9)
      '累計消費',          // totalSpent (10)
      '推薦碼',            // referralCode (11)
      '被誰推薦',          // referredBy (12)
      '帳號狀態',          // status (13)
      '最後登入',          // lastLoginAt (14)
      '註冊時間',          // createdAt (15)
      '更新時間',          // updatedAt (16)
      '登入帳號',          // username (17) 🔧 新增
      '密碼雜湊',          // passwordHash (18) 🔧 新增
      '登入類型'           // loginType (19) 🔧 新增: line/password/both
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 20);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    
  } else if (sheetName === TRANSACTIONS_SHEET) {
    sheet.appendRow([
      '交易ID',            // id
      '交易類型',          // type
      '發送者ID',          // senderUserId
      '接收者ID',          // receiverUserId
      '發送者姓名',        // senderName
      '接收者姓名',        // receiverName
      '點數變動',          // points
      '交易說明',          // message
      '交易後餘額',        // balanceAfter
      '交易狀態',          // status
      '交易時間'           // createdAt
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 11);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#34a853');
    headerRange.setFontColor('#ffffff');
    
  } else if (sheetName === MEMBER_LEVELS_SHEET) {
    sheet.appendRow([
      '等級ID',            // id
      '等級代碼',          // levelCode
      '等級名稱',          // levelName
      '最低點數',          // minPoints
      '折扣比例',          // discount
      '圖示',              // icon
      '顏色代碼',          // color
      '是否啟用',          // isActive
      '建立時間'           // createdAt
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 9);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#FF9800');
    headerRange.setFontColor('#ffffff');
    
    // 插入預設等級資料
    const now = new Date().toISOString();
    sheet.appendRow(['1', 'BRONZE', '銅級會員', 0, 0, '🥉', '#CD7F32', '啟用', now]);
    sheet.appendRow(['2', 'SILVER', '銀級會員', 500, 0.05, '🥈', '#C0C0C0', '啟用', now]);
    sheet.appendRow(['3', 'GOLD', '金級會員', 1000, 0.1, '🥇', '#FFD700', '啟用', now]);
    sheet.appendRow(['4', 'PLATINUM', '白金會員', 5000, 0.15, '💎', '#E5E4E2', '啟用', now]);
    
  } else if (sheetName === ACTIVITIES_SHEET) {
    sheet.appendRow([
      '活動ID',            // id
      '會員ID',            // lineUserId
      '活動類型',          // activityType
      '點數變動',          // points
      '額外資料',          // metadata
      '完成時間',          // completedAt
      '記錄時間'           // createdAt
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#9C27B0');
    headerRange.setFontColor('#ffffff');
    
  } else if (sheetName === PURCHASES_SHEET) {
    // 💰 購買記錄表（超詳細）
    sheet.appendRow([
      '購買ID',            // id
      '訂單編號',          // orderNumber
      '會員ID',            // lineUserId
      '會員姓名',          // memberName
      '購買點數',          // points
      '購買金額',          // amount
      '單價',              // unitPrice
      '付款方式',          // paymentMethod
      '付款狀態',          // paymentStatus
      '發票號碼',          // invoiceNumber
      '推薦人ID',          // referrerUserId
      '推薦人姓名',        // referrerName
      '推薦獎勵',          // referrerReward
      '購買前點數',        // pointsBefore
      '購買後點數',        // pointsAfter
      '交易IP',            // ipAddress
      '購買時間',          // purchaseTime
      '完成時間',          // completedTime
      '備註',              // notes
      '狀態'               // status
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 20);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#FF9800');
    headerRange.setFontColor('#ffffff');
    
  } else if (sheetName === SETTINGS_SHEET) {
    sheet.appendRow([
      '設定鍵值',          // key
      '設定值',            // value
      '資料類型',          // type
      '說明',              // description
      '分類',              // category
      '更新者',            // updatedBy
      '更新時間'           // updatedAt
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#607D8B');
    headerRange.setFontColor('#ffffff');
    
    // 插入預設設定
    const now = new Date().toISOString();
    sheet.appendRow(['initialPoints', '100', 'number', '註冊贈送點數', 'points', 'system', now]);
    sheet.appendRow(['referralReward', '50', 'number', '推薦獎勵點數', 'points', 'system', now]);
    sheet.appendRow(['pointsExpiryDays', '365', 'number', '點數有效天數（0=永久）', 'points', 'system', now]);
    sheet.appendRow(['minTransferPoints', '1', 'number', '最小轉點數量', 'points', 'system', now]);
    sheet.appendRow(['maxTransferPoints', '10000', 'number', '最大轉點數量', 'points', 'system', now]);
    sheet.appendRow(['maintenanceMode', 'false', 'boolean', '維護模式', 'general', 'system', now]);
    
  } else if (sheetName === DAILY_STATS_SHEET) {
    sheet.appendRow([
      '統計日期',          // date
      '新增會員',          // newMembers
      '活躍會員',          // activeMembers
      '交易筆數',          // totalTransactions
      '發出點數',          // pointsIssued
      '消費點數',          // pointsRedeemed
      '記錄時間'           // createdAt
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#00BCD4');
    headerRange.setFontColor('#ffffff');
    
  } else if (sheetName === REFERRALS_SHEET) {
    // 🎯 推薦關係表（超詳細記錄）
    sheet.appendRow([
      '推薦ID',            // id
      '推薦碼',            // referralCode
      '推薦人ID',          // referrerUserId
      '推薦人姓名',        // referrerName
      '推薦人點數(前)',    // referrerPointsBefore
      '推薦人點數(後)',    // referrerPointsAfter
      '推薦人獲得',        // referrerReward
      '新會員ID',          // newMemberUserId
      '新會員姓名',        // newMemberName
      '新會員獲得',        // newMemberReward
      '總獎勵點數',        // totalReward
      '推薦時間',          // createdAt
      '狀態'               // status
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 13);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#E91E63');
    headerRange.setFontColor('#ffffff');
    
  } else if (sheetName === WITHDRAWALS_SHEET) {
    // 💵 提領記錄表（超詳細）
    sheet.appendRow([
      '提領ID',            // id
      '訂單編號',          // orderNumber
      '會員ID',            // lineUserId
      '會員姓名',          // memberName
      '提領點數',          // points
      '換算金額',          // amountBeforeFee (0.7換算)
      '手續費',            // fee (15元)
      '實際到帳',          // amount (扣除手續費後)
      '換算比例',          // exchangeRate
      '銀行名稱',          // bankName
      '銀行代碼',          // bankCode
      '帳號',              // bankAccount
      '戶名',              // accountName
      '推薦人ID',          // referrerUserId
      '推薦人姓名',        // referrerName
      '推薦獎勵',          // referrerReward (20%)
      '提領前點數',        // pointsBefore
      '提領後點數',        // pointsAfter
      '申請時間',          // requestTime
      '完成時間',          // completedTime
      '處理狀態',          // status: pending/processing/completed/rejected
      '備註'               // notes
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 22);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#F44336');
    headerRange.setFontColor('#ffffff');
    
  } else if (sheetName === PRODUCTS_SHEET) {
    // 🛒 商城商品表
    sheet.appendRow([
      '商品ID',            // id
      '商品代碼',          // productCode (例如: H3X9V7)
      '商品名稱',          // productName
      '商品描述',          // description
      '商品圖片',          // imageUrl
      '所需點數',          // points
      '原價',              // originalPrice
      '折扣',              // discount
      '商品類型',          // category
      '庫存數量',          // stock (-1=無限)
      '已售出',            // soldCount
      '是否上架',          // isActive
      '排序',              // sortOrder
      '標籤',              // tags
      '建立時間',          // createdAt
      '更新時間'           // updatedAt
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 16);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4CAF50');
    headerRange.setFontColor('#ffffff');
    
    // 新增範例商品：拍新聞
    const now = new Date().toISOString();
    sheet.appendRow([
      now,                                            // 商品ID
      'H3X9V7',                                       // 商品代碼
      '拍新聞',                                       // 商品名稱
      '獲得拍新聞虛擬商品序號',                     // 商品描述
      'https://i.postimg.cc/3R5j7t6k/Pi-News-GIF2.gif', // 商品圖片
      3600,                                           // 所需點數
      3600,                                           // 原價
      0,                                              // 折扣
      'virtual',                                      // 商品類型
      -1,                                             // 庫存數量 (-1=無限)
      0,                                              // 已售出
      true,                                           // 是否上架
      1,                                              // 排序
      '虛擬商品,序號',                               // 標籤
      now,                                            // 建立時間
      now                                             // 更新時間
    ]);
    
  } else if (sheetName === MALL_ORDERS_SHEET) {
    // 🛍️ 商城訂單表
    sheet.appendRow([
      '訂單ID',            // id
      '訂單編號',          // orderNumber
      '會員ID',            // lineUserId
      '會員姓名',          // memberName
      '商品ID',            // productId
      '商品代碼',          // productCode
      '商品名稱',          // productName
      '商品圖片',          // productImage
      '購買點數',          // points
      '購買前點數',        // pointsBefore
      '購買後點數',        // pointsAfter
      '序號/代碼',         // serialCode (商品代碼，購買後顯示)
      '訂單狀態',          // status (pending/completed/cancelled)
      '付款時間',          // paidAt
      '完成時間',          // completedAt
      '備註',              // notes
      '建立時間'           // createdAt
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 17);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#FF9800');
    headerRange.setFontColor('#ffffff');
  }
}

/**
 * 測試用：建立範例資料
 */
function createSampleData() {
  const membersSheet = getSheet(MEMBERS_SHEET);
  const now = new Date().toISOString();
  
  // 建立測試會員
  const testMembers = [
    ['U001', '王小明', '0912-345-678', 'wang@example.com', '1990-01-01', 'Wang Ming', '', 150, now, now],
    ['U002', '李小華', '0923-456-789', 'lee@example.com', '1992-05-15', 'Lee Hua', '', 200, now, now],
    ['U003', '陳大文', '0934-567-890', 'chen@example.com', '1988-10-20', 'Chen Wen', '', 180, now, now]
  ];
  
  testMembers.forEach(member => {
    membersSheet.appendRow(member);
  });
  
  Logger.log('範例資料建立完成');
}

/**
 * 測試用：清除所有資料（保留標題列）
 */
function clearAllData() {
  const membersSheet = getSheet(MEMBERS_SHEET);
  const transactionsSheet = getSheet(TRANSACTIONS_SHEET);
  
  // 清除 Members 資料（保留第一列標題）
  if (membersSheet.getLastRow() > 1) {
    membersSheet.deleteRows(2, membersSheet.getLastRow() - 1);
  }
  
  // 清除 Transactions 資料（保留第一列標題）
  if (transactionsSheet.getLastRow() > 1) {
    transactionsSheet.deleteRows(2, transactionsSheet.getLastRow() - 1);
  }
  
  Logger.log('所有資料已清除');
}

// ==================== 新增功能函數 ====================

/**
 * 根據點數計算會員等級
 */
function calculateMemberLevel(points) {
  if (points >= 5000) return MEMBER_LEVELS.PLATINUM.name;  // 返回「白金會員」
  if (points >= 1000) return MEMBER_LEVELS.GOLD.name;      // 返回「金級會員」
  if (points >= 500) return MEMBER_LEVELS.SILVER.name;     // 返回「銀級會員」
  return MEMBER_LEVELS.BRONZE.name;                        // 返回「銅級會員」
}

/**
 * 生成推薦碼
 * 方案：固定6位字母數字混合（隱藏會員數量）
 * 例如：A3K8M2, B7N5P9, C2Q4R8
 * 優點：
 * - 固定6位，簡潔好記
 * - 看起來隨機，無法推測會員數
 * - 字母數字交錯，易讀不混淆
 * - 專業感強
 */
function generateReferralCode(lineUserId, phone = '') {
  const sheet = getSheet(MEMBERS_SHEET);
  const memberCount = sheet.getLastRow(); // 會員編號
  
  // 使用會員編號 + 時間戳生成偽隨機種子
  const seed = memberCount + new Date().getTime();
  
  // 字母表（排除容易混淆的 O, I, L）
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const numbers = '23456789'; // 排除 0, 1
  
  // 生成固定6位混合碼（字母-數字交錯）
  let code = '';
  let random = seed;
  
  for (let i = 0; i < 6; i++) {
    // 線性同餘生成器
    random = (random * 9301 + 49297) % 233280;
    
    if (i % 2 === 0) {
      // 偶數位置：字母（第 0, 2, 4 位）
      code += letters[random % letters.length];
    } else {
      // 奇數位置：數字（第 1, 3, 5 位）
      code += numbers[random % numbers.length];
    }
  }
  
  // 確保返回固定6位
  return code.substring(0, 6);
}

/**
 * 記錄活動
 */
function logActivity(lineUserId, activityType, points = 0, metadata = {}) {
  try {
    const sheet = getSheet(ACTIVITIES_SHEET);
    const id = Utilities.getUuid();
    const now = new Date().toISOString();
    
    sheet.appendRow([
      id,
      lineUserId,
      activityType,
      points,
      JSON.stringify(metadata),
      now,
      now
    ]);
    
    return true;
  } catch (error) {
    Logger.log('logActivity Error: ' + error.toString());
    return false;
  }
}

/**
 * 取得設定值
 */
function getSetting(key, defaultValue = null) {
  try {
    const sheet = getSheet(SETTINGS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        const value = data[i][1];
        const type = data[i][2];
        
        // 根據類型轉換
        if (type === 'number') return Number(value);
        if (type === 'boolean') return value === 'true';
        if (type === 'json') return JSON.parse(value);
        return value;
      }
    }
    
    return defaultValue;
  } catch (error) {
    Logger.log('getSetting Error: ' + error.toString());
    return defaultValue;
  }
}

/**
 * 更新設定值
 */
function updateSetting(key, value, updatedBy = 'system') {
  try {
    const sheet = getSheet(SETTINGS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        const row = i + 1;
        sheet.getRange(row, 2).setValue(value);
        sheet.getRange(row, 6).setValue(updatedBy);
        sheet.getRange(row, 7).setValue(new Date().toISOString());
        return { success: true };
      }
    }
    
    return { success: false, message: '找不到設定項目' };
  } catch (error) {
    Logger.log('updateSetting Error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * 每日統計（可用觸發器每日執行）
 */
function runDailyStats() {
  try {
    const membersSheet = getSheet(MEMBERS_SHEET);
    const transactionsSheet = getSheet(TRANSACTIONS_SHEET);
    const statsSheet = getSheet(DAILY_STATS_SHEET);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    const membersData = membersSheet.getDataRange().getValues();
    const transactionsData = transactionsSheet.getDataRange().getValues();
    
    let newMembers = 0;
    let activeMembers = 0;
    let totalTransactions = 0;
    let pointsIssued = 0;
    let pointsRedeemed = 0;
    
    // 統計新會員
    for (let i = 1; i < membersData.length; i++) {
      const createdDate = new Date(membersData[i][14]); // createdAt
      if (createdDate >= today && createdDate < new Date(today.getTime() + 86400000)) {
        newMembers++;
      }
    }
    
    // 統計交易
    for (let i = 1; i < transactionsData.length; i++) {
      const transDate = new Date(transactionsData[i][10]); // createdAt (新的索引)
      if (transDate >= today && transDate < new Date(today.getTime() + 86400000)) {
        totalTransactions++;
        const points = Number(transactionsData[i][6]);
        if (points > 0) {
          pointsIssued += points;
        } else {
          pointsRedeemed += Math.abs(points);
        }
      }
    }
    
    // 記錄統計
    statsSheet.appendRow([
      todayStr,
      newMembers,
      activeMembers,
      totalTransactions,
      pointsIssued,
      pointsRedeemed,
      new Date().toISOString()
    ]);
    
    Logger.log('每日統計完成');
    return { success: true };
  } catch (error) {
    Logger.log('runDailyStats Error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// ==================== 🎁 推薦系統函數 ====================

/**
 * 驗證推薦碼並返回推薦人資訊
 */
function verifyReferralCode(referralCode) {
  try {
    if (!referralCode || referralCode.trim() === '') {
      return {
        success: false,
        message: '推薦碼不能為空'
      };
    }
    
    const sheet = getSheet(MEMBERS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // 查找推薦人
    for (let i = 1; i < data.length; i++) {
      if (data[i][11] === referralCode.trim()) { // referralCode 在第12欄（index 11）
        return {
          success: true,
          referrer: {
            lineUserId: data[i][0],
            name: data[i][1],
            referralCode: data[i][11]
          }
        };
      }
    }
    
    return {
      success: false,
      message: '推薦碼無效'
    };
  } catch (error) {
    Logger.log('verifyReferralCode Error: ' + error.toString());
    return {
      success: false,
      message: '驗證失敗：' + error.toString()
    };
  }
}

/**
 * 綁定推薦關係（不贈送點數）
 * @param {string} newMemberUserId - 新會員 LINE User ID
 * @param {string} newMemberName - 新會員姓名
 * @param {string} referralCode - 推薦碼
 * @returns {object} 處理結果
 */
function bindReferralRelation(newMemberUserId, newMemberName, referralCode) {
  try {
    Logger.log('---------- bindReferralRelation 開始 ----------');
    Logger.log('新會員ID: ' + newMemberUserId);
    Logger.log('新會員姓名: ' + newMemberName);
    Logger.log('推薦碼: ' + referralCode);
    
    // 驗證推薦碼
    const verifyResult = verifyReferralCode(referralCode);
    Logger.log('推薦碼驗證結果: ' + JSON.stringify(verifyResult));
    
    if (!verifyResult.success) {
      Logger.log('❌ 推薦碼驗證失敗');
      return {
        success: false,
        message: '推薦碼無效'
      };
    }
    
    const referrer = verifyResult.referrer;
    Logger.log('✅ 找到推薦人: ' + referrer.name + ' (ID: ' + referrer.lineUserId + ')');
    
    // 🎯 只記錄推薦關係，不贈送點數
    const relationData = {
      referralCode: referralCode,
      referrerUserId: referrer.lineUserId,
      referrerName: referrer.name,
      newMemberUserId: newMemberUserId,
      newMemberName: newMemberName,
      referrerPointsBefore: referrer.points || 0,
      referrerPointsAfter: referrer.points || 0,  // 點數不變
      referrerReward: 0,  // 不贈送
      newMemberReward: 0,  // 不贈送
      totalReward: 0  // 不贈送
    };
    
    Logger.log('準備調用 recordReferralRelation，參數: ' + JSON.stringify(relationData));
    
    const recordResult = recordReferralRelation(relationData);
    
    Logger.log('recordReferralRelation 返回結果: ' + recordResult);
    
    Logger.log(`✅ 推薦關係綁定完成：${referrer.name} → ${newMemberName}（不贈送點數）`);
    
    return {
      success: true,
      referrerName: referrer.name,
      message: '推薦關係綁定成功'
    };
    
  } catch (error) {
    Logger.log('bindReferralRelation Error: ' + error.toString());
    return {
      success: false,
      message: '綁定推薦關係失敗：' + error.toString()
    };
  }
}

/**
 * 處理推薦獎勵（舊版，保留以防需要）
 * @param {string} newMemberUserId - 新會員 LINE User ID
 * @param {string} newMemberName - 新會員姓名
 * @param {string} referralCode - 推薦碼
 * @returns {object} 處理結果
 */
function processReferralReward(newMemberUserId, newMemberName, referralCode) {
  try {
    Logger.log('---------- processReferralReward 開始 ----------');
    Logger.log('新會員ID: ' + newMemberUserId);
    Logger.log('新會員姓名: ' + newMemberName);
    Logger.log('推薦碼: ' + referralCode);
    
    // 驗證推薦碼
    const verifyResult = verifyReferralCode(referralCode);
    Logger.log('推薦碼驗證結果: ' + JSON.stringify(verifyResult));
    
    if (!verifyResult.success) {
      Logger.log('❌ 推薦碼驗證失敗');
      return {
        success: false,
        message: '推薦碼無效'
      };
    }
    
    const referrer = verifyResult.referrer;
    const REFERRAL_REWARD = 50; // 推薦獎勵點數
    
    Logger.log('✅ 找到推薦人: ' + referrer.name + ' (ID: ' + referrer.lineUserId + ')');
    
    const sheet = getSheet(MEMBERS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // 找到推薦人並增加點數
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === referrer.lineUserId) {
        const row = i + 1;
        const currentPoints = Number(data[i][7]) || 0;  // 目前點數（第8欄，索引7）
        const totalEarned = Number(data[i][9]) || 0;    // 累計獲得（第10欄，索引9）
        const newPoints = currentPoints + REFERRAL_REWARD;
        const newTotalEarned = totalEarned + REFERRAL_REWARD;
        
        Logger.log(`推薦人 ${referrer.name}: 點數 ${currentPoints} → ${newPoints}`);
        
        // 更新推薦人點數
        sheet.getRange(row, 8).setValue(newPoints);           // 目前點數（第8欄）
        sheet.getRange(row, 10).setValue(newTotalEarned);     // 累計獲得（第10欄）
        sheet.getRange(row, 17).setValue(new Date().toISOString()); // 更新時間（第17欄）
        
        // 記錄推薦人獲得獎勵的交易
        addTransaction({
          type: 'referral_reward',
          receiverUserId: referrer.lineUserId,
          receiverName: referrer.name,
          points: REFERRAL_REWARD,
          message: `推薦好友「${newMemberName}」註冊獎勵`,
          balanceAfter: newPoints,
          status: 'completed'
        });
        
        // 記錄新會員獲得獎勵的交易
        addTransaction({
          type: 'referral_bonus',
          receiverUserId: newMemberUserId,
          receiverName: newMemberName,
          points: REFERRAL_REWARD,
          message: `透過「${referrer.name}」推薦註冊獎勵`,
          balanceAfter: 100 + REFERRAL_REWARD, // 初始點數 + 推薦獎勵
          status: 'completed'
        });
        
        // 🎯 記錄到 Referrals 推薦關係表（超詳細記錄）
        recordReferralRelation({
          referralCode: referralCode,
          referrerUserId: referrer.lineUserId,
          referrerName: referrer.name,
          newMemberUserId: newMemberUserId,
          newMemberName: newMemberName,
          referrerPointsBefore: currentPoints,
          referrerPointsAfter: newPoints,
          referrerReward: REFERRAL_REWARD,
          newMemberReward: REFERRAL_REWARD,
          totalReward: REFERRAL_REWARD * 2
        });
        
        Logger.log(`✅ 推薦獎勵完成：推薦人 ${referrer.name} 和新會員 ${newMemberName} 各獲得 ${REFERRAL_REWARD} 點`);
        
        return {
          success: true,
          referrerName: referrer.name,
          referrerBonus: REFERRAL_REWARD,
          newMemberBonus: REFERRAL_REWARD
        };
      }
    }
    
    return {
      success: false,
      message: '找不到推薦人'
    };
    
  } catch (error) {
    Logger.log('processReferralReward Error: ' + error.toString());
    return {
      success: false,
      message: '處理推薦獎勵失敗：' + error.toString()
    };
  }
}

/**
 * 記錄推薦關係到 Referrals 表（超詳細）
 * @param {object} data - 推薦資料
 */
function recordReferralRelation(data) {
  try {
    Logger.log('========== recordReferralRelation 開始 ==========');
    Logger.log('傳入參數類型: ' + typeof data);
    Logger.log('推薦資料: ' + JSON.stringify(data));
    
    // 🔧 安全檢查
    if (!data) {
      Logger.log('❌ data 參數為 null 或 undefined');
      return false;
    }
    
    if (!data.referralCode) {
      Logger.log('❌ data.referralCode 不存在');
      Logger.log('data 內容: ' + Object.keys(data).join(', '));
      return false;
    }
    
    const sheet = getSheet(REFERRALS_SHEET);
    Logger.log('✅ 成功獲取 Referrals 工作表');
    
    const id = Utilities.getUuid();
    const now = new Date().toISOString();
    
    const rowData = [
      id,                              // 推薦ID
      data.referralCode || '',         // 推薦碼
      data.referrerUserId || '',       // 推薦人ID
      data.referrerName || '',         // 推薦人姓名
      data.referrerPointsBefore || 0,  // 推薦人點數(前)
      data.referrerPointsAfter || 0,   // 推薦人點數(後)
      data.referrerReward || 0,        // 推薦人獲得
      data.newMemberUserId || '',      // 新會員ID
      data.newMemberName || '',        // 新會員姓名
      data.newMemberReward || 0,       // 新會員獲得
      data.totalReward || 0,           // 總獎勵點數
      now,                             // 推薦時間
      'completed'                      // 狀態
    ];
    
    Logger.log('準備寫入資料: ' + JSON.stringify(rowData));
    
    sheet.appendRow(rowData);
    
    Logger.log(`✅✅✅ Referrals 表記錄完成：${data.referrerName} → ${data.newMemberName}`);
    Logger.log('========== recordReferralRelation 結束 ==========');
    return true;
  } catch (error) {
    Logger.log('❌❌❌ recordReferralRelation Error: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    Logger.log('data 參數: ' + JSON.stringify(data));
    return false;
  }
}

/**
 * 計算某推薦碼的推薦人數
 * @param {string} referralCode - 推薦碼
 * @returns {number} 推薦人數
 */
function countReferrals(referralCode) {
  try {
    if (!referralCode) return 0;
    
    const activitiesSheet = getSheet(ACTIVITIES_SHEET);
    const data = activitiesSheet.getDataRange().getValues();
    
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === 'register') { // activityType
        const metadata = data[i][3]; // metadata
        if (typeof metadata === 'string') {
          try {
            const metaObj = JSON.parse(metadata);
            if (metaObj.referredBy === referralCode) {
              count++;
            }
          } catch (e) {
            // 忽略 JSON 解析錯誤
          }
        }
      }
    }
    
    return count;
  } catch (error) {
    Logger.log('countReferrals Error: ' + error.toString());
    return 0;
  }
}

/**
 * 取得推薦系統完整統計
 * @returns {object} 推薦統計資料
 */
function getReferralStats() {
  try {
    const membersSheet = getSheet(MEMBERS_SHEET);
    const transactionsSheet = getSheet(TRANSACTIONS_SHEET);
    const activitiesSheet = getSheet(ACTIVITIES_SHEET);
    
    const membersData = membersSheet.getDataRange().getValues();
    const transactionsData = transactionsSheet.getDataRange().getValues();
    const activitiesData = activitiesSheet.getDataRange().getValues();
    
    // 計算總推薦人數（有 referredBy 的註冊活動）
    let totalReferrals = 0;
    const referralMap = {}; // { referralCode: { count, name, earned } }
    
    for (let i = 1; i < activitiesData.length; i++) {
      if (activitiesData[i][1] === 'register') { // activityType
        const metadata = activitiesData[i][3]; // metadata
        if (typeof metadata === 'string') {
          try {
            const metaObj = JSON.parse(metadata);
            if (metaObj.referredBy) {
              totalReferrals++;
              const refCode = metaObj.referredBy;
              if (!referralMap[refCode]) {
                referralMap[refCode] = { count: 0, earned: 0 };
              }
              referralMap[refCode].count++;
            }
          } catch (e) {
            // 忽略解析錯誤
          }
        }
      }
    }
    
    // 計算推薦獎勵總點數
    let totalRewards = 0;
    for (let i = 1; i < transactionsData.length; i++) {
      const type = transactionsData[i][1];
      if (type === 'referral_reward' || type === 'referral_bonus') {
        totalRewards += Number(transactionsData[i][6]) || 0; // points
      }
    }
    
    // 建立推薦排行榜
    const leaderboard = [];
    for (let i = 1; i < membersData.length; i++) {
      const referralCode = membersData[i][11]; // referralCode
      if (referralCode && referralMap[referralCode]) {
        // 計算該推薦人獲得的獎勵點數
        let earned = 0;
        for (let j = 1; j < transactionsData.length; j++) {
          if (transactionsData[j][1] === 'referral_reward' && 
              transactionsData[j][3] === membersData[i][0]) { // receiverUserId
            earned += Number(transactionsData[j][6]) || 0;
          }
        }
        
        leaderboard.push({
          lineUserId: membersData[i][0],
          name: membersData[i][1],
          referralCode: referralCode,
          count: referralMap[referralCode].count,
          earned: earned
        });
      }
    }
    
    // 排序：推薦人數降序
    leaderboard.sort((a, b) => b.count - a.count);
    
    // 取前 10 名
    const top10 = leaderboard.slice(0, 10);
    
    // 活躍推薦人數（至少推薦1人）
    const activeReferrers = leaderboard.length;
    
    // 平均推薦數
    const avgReferrals = activeReferrers > 0 ? (totalReferrals / activeReferrers).toFixed(1) : 0;
    
    // 最近推薦記錄（最近20筆）
    const recentReferrals = [];
    for (let i = 1; i < transactionsData.length; i++) {
      if (transactionsData[i][1] === 'referral_bonus') {
        const receiverUserId = transactionsData[i][3]; // 新會員
        const receiverName = transactionsData[i][5]; // 新會員姓名
        const message = transactionsData[i][7]; // 訊息中包含推薦人資訊
        const createdAt = transactionsData[i][10];
        
        // 從訊息中提取推薦人和推薦碼
        // 格式：透過「XXX」推薦註冊獎勵
        const match = message.match(/透過「(.+?)」推薦/);
        if (match) {
          const referrerName = match[1];
          
          // 找到推薦人的推薦碼
          let referralCode = '';
          for (let j = 1; j < membersData.length; j++) {
            if (membersData[j][1] === referrerName) {
              referralCode = membersData[j][11];
              break;
            }
          }
          
          recentReferrals.push({
            referrerName: referrerName,
            referralCode: referralCode || 'N/A',
            newMemberName: receiverName,
            rewardPoints: 50,
            createdAt: createdAt
          });
        }
      }
    }
    
    // 按時間降序排序，取最近20筆
    recentReferrals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recent20 = recentReferrals.slice(0, 20);
    
    return {
      success: true,
      totalReferrals: totalReferrals,
      activeReferrers: activeReferrers,
      totalRewards: totalRewards,
      avgReferrals: parseFloat(avgReferrals),
      leaderboard: top10,
      recentReferrals: recent20
    };
    
  } catch (error) {
    Logger.log('getReferralStats Error: ' + error.toString());
    return {
      success: false,
      message: '獲取推薦統計失敗：' + error.toString()
    };
  }
}

/**
 * 取得個人推薦記錄
 * @param {string} lineUserId - LINE 使用者 ID
 * @returns {object} 個人推薦記錄
 */
function getMyReferrals(lineUserId) {
  try {
    if (!lineUserId) {
      return {
        success: false,
        message: '缺少使用者 ID'
      };
    }
    
    const membersSheet = getSheet(MEMBERS_SHEET);
    const transactionsSheet = getSheet(TRANSACTIONS_SHEET);
    const activitiesSheet = getSheet(ACTIVITIES_SHEET);
    
    const membersData = membersSheet.getDataRange().getValues();
    const transactionsData = transactionsSheet.getDataRange().getValues();
    const activitiesData = activitiesSheet.getDataRange().getValues();
    
    // 找到會員資料
    let memberInfo = null;
    let memberReferralCode = '';
    
    for (let i = 1; i < membersData.length; i++) {
      if (membersData[i][0] === lineUserId) {
        memberInfo = {
          name: membersData[i][1],
          referralCode: membersData[i][11] || '',
          points: membersData[i][7] || 0
        };
        memberReferralCode = membersData[i][11] || '';
        break;
      }
    }
    
    if (!memberInfo) {
      return {
        success: false,
        message: '會員不存在'
      };
    }
    
    // 計算推薦統計
    let totalReferrals = 0;
    let totalEarned = 0;
    const referralDetails = [];
    
    // 從 Activities 表找出所有被推薦的會員
    for (let i = 1; i < activitiesData.length; i++) {
      if (activitiesData[i][1] === 'register') { // activityType
        const metadata = activitiesData[i][3];
        if (typeof metadata === 'string') {
          try {
            const metaObj = JSON.parse(metadata);
            if (metaObj.referredBy === memberReferralCode) {
              const referredUserId = activitiesData[i][0];
              const referredAt = activitiesData[i][5];
              
              // 找到被推薦人的名稱
              let referredName = '未知';
              for (let j = 1; j < membersData.length; j++) {
                if (membersData[j][0] === referredUserId) {
                  referredName = membersData[j][1];
                  break;
                }
              }
              
              // 🔧 新版：找到對應的推薦獎勵交易（購買+提領獎勵）
              let rewardPoints = 0;
              for (let k = 1; k < transactionsData.length; k++) {
                const txType = transactionsData[k][1];
                const txReceiver = transactionsData[k][3];
                const txMessage = transactionsData[k][7];
                
                // 檢查購買獎勵和提領獎勵
                if ((txType === 'referral_purchase_reward' || txType === 'referral_withdraw_reward') && 
                    txReceiver === lineUserId &&
                    txMessage.includes(referredName)) {
                  rewardPoints += Number(transactionsData[k][6]) || 0;
                }
              }
              
              totalReferrals++;
              totalEarned += rewardPoints;
              
              referralDetails.push({
                name: referredName,
                userId: referredUserId,
                reward: rewardPoints,
                date: referredAt
              });
            }
          } catch (e) {
            // 忽略解析錯誤
          }
        }
      }
    }
    
    // 按日期排序（最新的在前）
    referralDetails.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    return {
      success: true,
      memberInfo: memberInfo,
      totalReferrals: totalReferrals,
      totalEarned: totalEarned,
      referralDetails: referralDetails
    };
    
  } catch (error) {
    Logger.log('getMyReferrals Error: ' + error.toString());
    return {
      success: false,
      message: '獲取推薦記錄失敗：' + error.toString()
    };
  }
}

// ==================== 工作表初始化函數 ====================

/**
 * 初始化所有新工作表（一次性執行）
 */
function initializeAllSheets() {
  try {
    // 初始化所有工作表
    getSheet(MEMBERS_SHEET);
    getSheet(TRANSACTIONS_SHEET);
    getSheet(REFERRALS_SHEET);        // 🎯 推薦關係表
    getSheet(PURCHASES_SHEET);        // 💰 購買記錄表
    getSheet(WITHDRAWALS_SHEET);      // 💵 提領記錄表
    getSheet(PRODUCTS_SHEET);         // 🛒 商城商品表
    getSheet(MALL_ORDERS_SHEET);      // 🛍️ 商城訂單表
    getSheet(MEMBER_LEVELS_SHEET);
    getSheet(ACTIVITIES_SHEET);
    getSheet(SETTINGS_SHEET);
    getSheet(DAILY_STATS_SHEET);
    
    Logger.log('所有工作表初始化完成（含 Referrals、Purchases、Withdrawals、Products、MallOrders 表）！');
    return { success: true, message: '所有工作表已創建' };
  } catch (error) {
    Logger.log('initializeAllSheets Error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * 遷移現有會員資料（升級時使用）
 * 為舊資料補上新欄位
 */
function migrateExistingMembers() {
  try {
    const sheet = getSheet(MEMBERS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    Logger.log('開始遷移 ' + (data.length - 1) + ' 位會員...');
    
    for (let i = 1; i < data.length; i++) {
      const row = i + 1;
      const lineUserId = data[i][0];
      const points = Number(data[i][7]) || 0;
      
      // 如果沒有 memberLevel (第9欄)，補上
      if (!data[i][8]) {
        const level = calculateMemberLevel(points);
        sheet.getRange(row, 9).setValue(level);
        Logger.log(`會員 ${data[i][1]}: 設定等級為 ${level}`);
      }
      
      // 如果沒有 totalEarned (第10欄)，補上
      if (!data[i][9]) {
        sheet.getRange(row, 10).setValue(points);
      }
      
      // 如果沒有 totalSpent (第11欄)，補上
      if (!data[i][10]) {
        sheet.getRange(row, 11).setValue(0);
      }
      
      // 如果沒有 referralCode (第12欄)，補上
      if (!data[i][11]) {
        const phone = data[i][2]; // 手機號碼在第3欄（index 2）
        const code = generateReferralCode(lineUserId, phone);
        sheet.getRange(row, 12).setValue(code);
        Logger.log(`會員 ${data[i][1]}: 生成推薦碼 ${code}`);
      }
      
      // 🎯 如果沒有 referredBy (第13欄)，補上空值
      if (!data[i][12]) {
        sheet.getRange(row, 13).setValue('');
      }
      
      // 如果沒有 status (第14欄)，補上
      if (!data[i][13]) {
        sheet.getRange(row, 14).setValue(ACCOUNT_STATUS_CH.ACTIVE);
      }
      
      // 如果沒有 lastLoginAt (第15欄)，補上
      if (!data[i][14]) {
        sheet.getRange(row, 15).setValue(data[i][15] || data[i][8]); // 使用 createdAt
      }
    }
    
    Logger.log('遷移完成！所有會員資料已更新');
    return { success: true, message: '遷移完成' };
  } catch (error) {
    Logger.log('migrateExistingMembers Error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// ==================== 新推薦獎勵系統 ====================

/**
 * 獲取會員的推薦人
 * @param {string} lineUserId - 會員 LINE User ID
 * @returns {object|null} 推薦人資料或 null
 */
function getReferrer(lineUserId) {
  try {
    const sheet = getSheet(REFERRALS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // 從 Referrals 表中查找該會員的推薦人
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][7] === lineUserId) { // newMemberUserId
        return {
          lineUserId: data[i][2],  // referrerUserId
          name: data[i][3],         // referrerName
          referralCode: data[i][1]  // referralCode
        };
      }
    }
    
    return null; // 沒有推薦人
  } catch (error) {
    Logger.log('getReferrer Error: ' + error.toString());
    return null;
  }
}

/**
 * 給推薦人獎勵（20%）
 * @param {string} memberId - 被推薦人的 LINE User ID
 * @param {string} memberName - 被推薦人姓名
 * @param {number} amount - 交易金額
 * @param {string} type - 交易類型（purchase=購買, withdraw=提領）
 * @returns {object} 處理結果
 */
function giveReferrerReward(memberId, memberName, amount, type) {
  try {
    Logger.log('---------- giveReferrerReward 開始 ----------');
    Logger.log(`會員: ${memberName} (${memberId})`);
    Logger.log(`金額: ${amount}, 類型: ${type}`);
    
    // 獲取推薦人
    const referrer = getReferrer(memberId);
    
    if (!referrer) {
      Logger.log('⚠️ 該會員沒有推薦人');
      return {
        success: false,
        message: '沒有推薦人'
      };
    }
    
    Logger.log(`✅ 找到推薦人: ${referrer.name} (${referrer.lineUserId})`);
    
    // 計算 20% 獎勵
    const reward = Math.floor(amount * 0.2);
    Logger.log(`計算獎勵: ${amount} × 20% = ${reward} 點`);
    
    if (reward <= 0) {
      Logger.log('⚠️ 獎勵點數為 0，不處理');
      return {
        success: false,
        message: '獎勵點數為 0'
      };
    }
    
    // 增加推薦人點數
    const sheet = getSheet(MEMBERS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === referrer.lineUserId) {
        const row = i + 1;
        const currentPoints = Number(data[i][7]) || 0;
        const totalEarned = Number(data[i][9]) || 0;
        const newPoints = currentPoints + reward;
        const newTotalEarned = totalEarned + reward;
        
        // 更新推薦人點數
        sheet.getRange(row, 8).setValue(newPoints);       // 目前點數
        sheet.getRange(row, 10).setValue(newTotalEarned); // 累計獲得
        sheet.getRange(row, 17).setValue(new Date().toISOString()); // 更新時間
        
        Logger.log(`✅ 推薦人點數更新: ${currentPoints} → ${newPoints}`);
        
        // 記錄交易
        const transactionType = type === 'purchase' ? 'referral_purchase_reward' : 'referral_withdraw_reward';
        const message = type === 'purchase' 
          ? `推薦好友「${memberName}」購買點數獎勵（${amount}點×20%）`
          : `推薦好友「${memberName}」提領獎勵（${amount}點×20%）`;
        
        addTransaction({
          type: transactionType,
          receiverUserId: referrer.lineUserId,
          receiverName: referrer.name,
          senderName: memberName,
          points: reward,
          message: message,
          balanceAfter: newPoints,
          status: 'completed'
        });
        
        Logger.log(`✅ 推薦獎勵完成: ${referrer.name} 獲得 ${reward} 點`);
        Logger.log('---------- giveReferrerReward 結束 ----------');
        
        return {
          success: true,
          referrerId: referrer.lineUserId,  // 🔧 添加推薦人ID
          referrerName: referrer.name,
          reward: reward,
          message: `推薦人 ${referrer.name} 獲得 ${reward} 點獎勵`
        };
      }
    }
    
    Logger.log('❌ 找不到推薦人資料');
    return {
      success: false,
      message: '找不到推薦人資料'
    };
    
  } catch (error) {
    Logger.log('giveReferrerReward Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 記錄購買到 Purchases 表
 * @param {object} data - 購買資料
 * @returns {string} 購買ID
 */
function recordPurchase(data) {
  try {
    Logger.log('========== recordPurchase 開始 ==========');
    
    const sheet = getSheet(PURCHASES_SHEET);
    const purchaseId = 'PUR-' + new Date().getTime();
    const orderNumber = data.orderNumber || 'ORD-' + new Date().getTime();
    const now = new Date().getTime();
    
    const rowData = [
      purchaseId,                    // 購買ID
      orderNumber,                   // 訂單編號
      data.lineUserId || '',         // 會員ID
      data.memberName || '',         // 會員姓名
      data.points || 0,              // 購買點數
      data.amount || 0,              // 購買金額
      data.unitPrice || 1.0,         // 單價
      data.paymentMethod || 'manual',// 付款方式
      data.paymentStatus || 'paid',  // 付款狀態
      data.invoiceNumber || '',      // 發票號碼
      data.referrerUserId || '',     // 推薦人ID
      data.referrerName || '',       // 推薦人姓名
      data.referrerReward || 0,      // 推薦獎勵
      data.pointsBefore || 0,        // 購買前點數
      data.pointsAfter || 0,         // 購買後點數
      data.ipAddress || '',          // 交易IP
      now,                           // 購買時間
      now,                           // 完成時間
      data.notes || '',              // 備註
      data.status || ACCOUNT_STATUS_CH.ACTIVE  // 狀態（中文）
    ];
    
    Logger.log('準備寫入 Purchases 表: ' + JSON.stringify(rowData));
    
    sheet.appendRow(rowData);
    
    Logger.log(`✅ Purchases 表記錄完成：${data.memberName} 購買 ${data.points} 點`);
    Logger.log('========== recordPurchase 結束 ==========');
    
    return purchaseId;
    
  } catch (error) {
    Logger.log('recordPurchase Error: ' + error.toString());
    return 'PUR-ERROR-' + new Date().getTime();
  }
}

/**
 * 購買點數（給推薦人 20% 獎勵）
 * @param {string} lineUserId - LINE User ID
 * @param {number} points - 購買點數
 * @param {object} options - 購買選項（金額、付款方式等）
 * @returns {object} 處理結果
 */
function purchasePoints(lineUserId, points, options = {}) {
  try {
    Logger.log('========== purchasePoints 開始 ==========');
    Logger.log(`會員ID: ${lineUserId}, 購買點數: ${points}`);
    Logger.log(`選項: ${JSON.stringify(options)}`);
    
    const sheet = getSheet(MEMBERS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === lineUserId) {
        const row = i + 1;
        const memberName = data[i][1];
        const currentPoints = Number(data[i][7]) || 0;
        const totalEarned = Number(data[i][9]) || 0;
        const newPoints = currentPoints + points;
        const newTotalEarned = totalEarned + points;
        
        // 計算金額（默認 1:1）
        const amount = options.amount || points;
        const unitPrice = amount / points;
        
        // 更新會員點數
        sheet.getRange(row, 8).setValue(newPoints);
        sheet.getRange(row, 10).setValue(newTotalEarned);
        sheet.getRange(row, 17).setValue(new Date().toISOString());
        
        Logger.log(`✅ 會員點數更新: ${currentPoints} → ${newPoints}`);
        
        // 給推薦人 20% 獎勵（先處理，獲取推薦人資訊）
        const referrerReward = giveReferrerReward(lineUserId, memberName, points, 'purchase');
        Logger.log('推薦人獎勵結果: ' + JSON.stringify(referrerReward));
        
        // 🔧 記錄到 Purchases 表（超詳細）
        const purchaseId = recordPurchase({
          lineUserId: lineUserId,
          memberName: memberName,
          points: points,
          amount: amount,
          unitPrice: unitPrice,
          paymentMethod: options.paymentMethod || 'manual',
          paymentStatus: options.paymentStatus || 'paid',
          invoiceNumber: options.invoiceNumber || '',
          referrerUserId: referrerReward.success ? referrerReward.referrerId : '',
          referrerName: referrerReward.success ? referrerReward.referrerName : '',
          referrerReward: referrerReward.success ? referrerReward.reward : 0,
          pointsBefore: currentPoints,
          pointsAfter: newPoints,
          ipAddress: options.ipAddress || '',
          notes: options.notes || ''
        });
        
        Logger.log('購買記錄ID: ' + purchaseId);
        
        // 記錄交易（簡要版，用於點數記錄）
        addTransaction({
          type: 'purchase',
          receiverUserId: lineUserId,
          receiverName: memberName,
          points: points,
          message: `購買公益點數（訂單：${purchaseId}）`,
          balanceAfter: newPoints,
          status: 'completed'
        });
        
        Logger.log('========== purchasePoints 結束 ==========');
        
        return {
          success: true,
          purchaseId: purchaseId,
          points: newPoints,
          purchased: points,
          amount: amount,
          referrerReward: referrerReward,
          message: `成功購買 ${points} 點`
        };
      }
    }
    
    return {
      success: false,
      message: '找不到會員資料'
    };
    
  } catch (error) {
    Logger.log('purchasePoints Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 提領點數（給推薦人 20% 獎勵）
 * @param {string} lineUserId - LINE User ID
 * @param {number} points - 提領點數
 * @param {object} options - 提領選項（銀行資訊等）
 * @returns {object} 處理結果
 */
function withdrawPoints(lineUserId, points, options = {}) {
  try {
    Logger.log('========== withdrawPoints 開始 ==========');
    Logger.log(`會員ID: ${lineUserId}, 提領點數: ${points}`);
    Logger.log(`銀行資訊: ${JSON.stringify(options)}`);
    
    const sheet = getSheet(MEMBERS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === lineUserId) {
        const row = i + 1;
        const memberName = data[i][1];
        const currentPoints = Number(data[i][7]) || 0;
        
        // 檢查點數是否足夠
        if (currentPoints < points) {
          Logger.log(`❌ 點數不足: ${currentPoints} < ${points}`);
          return {
            success: false,
            message: '點數不足'
          };
        }
        
        // 檢查最低提領金額
        if (points < 100) {
          return {
            success: false,
            message: '最少提領 100 點'
          };
        }
        
        const newPoints = currentPoints - points;
        const withdrawAmountBeforeFee = Math.floor(points * 0.7); // 0.7 換算（10,000點 → 7,000元）
        const withdrawFee = 15; // 手續費 15 元
        const withdrawAmount = withdrawAmountBeforeFee - withdrawFee; // 扣除手續費後的實際金額
        
        // 更新會員點數
        sheet.getRange(row, 8).setValue(newPoints);
        sheet.getRange(row, 17).setValue(new Date().toISOString());
        
        Logger.log(`✅ 會員點數更新: ${currentPoints} → ${newPoints}`);
        Logger.log(`💵 提領金額: ${points} 點 → NT$ ${withdrawAmountBeforeFee} - 手續費 ${withdrawFee} = NT$ ${withdrawAmount}`);
        
        // 建立提領訊息（包含銀行資訊）
        let withdrawMessage = `提領兌現 ${points.toLocaleString()} 點 → NT$ ${withdrawAmount.toLocaleString()}`;
        if (options.bankName && options.bankAccount) {
          const lastFour = options.bankAccount.slice(-4);
          withdrawMessage += ` → ${options.bankName} (****${lastFour})`;
        }
        
        // 記錄交易
        addTransaction({
          type: 'withdraw',
          senderUserId: lineUserId,
          senderName: memberName,
          points: -points,
          message: withdrawMessage,
          balanceAfter: newPoints,
          status: STATUS_CH.PENDING  // 🔧 待處理狀態，匯款後改為已完成
        });
        
        // 給推薦人 20% 獎勵（基於點數）
        const referrerReward = giveReferrerReward(lineUserId, memberName, points, 'withdraw');
        Logger.log('推薦人獎勵結果: ' + JSON.stringify(referrerReward));
        
        // 🔧 記錄詳細提領資料到 Withdrawals 工作表
        const withdrawalRecord = recordWithdrawal({
          lineUserId: lineUserId,
          memberName: memberName,
          points: points,
          amount: withdrawAmount,
          amountBeforeFee: withdrawAmountBeforeFee,
          fee: withdrawFee,
          exchangeRate: 0.7,
          bankInfo: options,
          referrerReward: referrerReward,
          pointsBefore: currentPoints,
          pointsAfter: newPoints
        });
        Logger.log('提領記錄結果: ' + JSON.stringify(withdrawalRecord));
        
        Logger.log('========== withdrawPoints 結束 ==========');
        
        return {
          success: true,
          points: newPoints,
          withdrawn: points,
          amount: withdrawAmount, // 🔧 扣除手續費後的實際金額
          amountBeforeFee: withdrawAmountBeforeFee, // 換算後金額（扣手續費前）
          fee: withdrawFee,
          exchangeRate: 0.7,
          bankInfo: {
            bankName: options.bankName,
            bankAccount: options.bankAccount,
            accountName: options.accountName
          },
          referrerReward: referrerReward,
          message: `成功提領 ${points} 點（NT$ ${withdrawAmount.toLocaleString()}，已扣除手續費 ${withdrawFee} 元），預計 1-3 個工作天匯款`
        };
      }
    }
    
    return {
      success: false,
      message: '找不到會員資料'
    };
    
  } catch (error) {
    Logger.log('withdrawPoints Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 記錄詳細提領資料到 Withdrawals 工作表
 * @param {object} data - 提領資料
 * @returns {object} 記錄結果
 */
function recordWithdrawal(data) {
  try {
    Logger.log('========== recordWithdrawal 開始 ==========');
    Logger.log('提領資料: ' + JSON.stringify(data));
    
    const sheet = getSheet(WITHDRAWALS_SHEET);
    const now = new Date();
    const orderNumber = 'WD' + now.getTime(); // 訂單編號：WD + 時間戳
    
    const withdrawalRow = [
      now.getTime(),                           // 提領ID (timestamp)
      orderNumber,                             // 訂單編號
      data.lineUserId || '',                   // 會員ID
      data.memberName || '',                   // 會員姓名
      data.points || 0,                        // 提領點數
      data.amountBeforeFee || 0,               // 換算金額 (0.7換算)
      data.fee || 0,                           // 手續費 (15元)
      data.amount || 0,                        // 實際到帳 (扣除手續費後)
      data.exchangeRate || 0.7,                // 換算比例
      data.bankInfo?.bankName || '',           // 銀行名稱
      data.bankInfo?.bankCode || '',           // 銀行代碼
      data.bankInfo?.bankAccount || '',        // 帳號
      data.bankInfo?.accountName || '',        // 戶名
      data.referrerReward?.referrerUserId || '', // 推薦人ID
      data.referrerReward?.referrerName || '',   // 推薦人姓名
      data.referrerReward?.rewardPoints || 0,    // 推薦獎勵 (20%)
      data.pointsBefore || 0,                  // 提領前點數
      data.pointsAfter || 0,                   // 提領後點數
      now.toISOString(),                       // 申請時間
      '',                                      // 完成時間（待處理）
      'pending',                               // 處理狀態
      ''                                       // 備註
    ];
    
    sheet.appendRow(withdrawalRow);
    Logger.log('✅ 提領記錄已新增');
    Logger.log('========== recordWithdrawal 結束 ==========');
    
    return {
      success: true,
      orderNumber: orderNumber,
      message: '提領記錄已建立'
    };
    
  } catch (error) {
    Logger.log('❌ recordWithdrawal Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// ==================== 購買記錄查詢功能 ====================

/**
 * 取得會員的購買歷史
 * @param {string} lineUserId - LINE User ID
 * @param {number} limit - 限制筆數
 * @returns {object} 購買歷史
 */
function getPurchaseHistory(lineUserId, limit = 20) {
  try {
    const sheet = getSheet(PURCHASES_SHEET);
    const data = sheet.getDataRange().getValues();
    const purchases = [];
    
    // 從最新的記錄開始讀取
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][2] === lineUserId) { // lineUserId 在第 3 欄
        purchases.push({
          purchaseId: data[i][0],
          orderNumber: data[i][1],
          points: data[i][4],
          amount: data[i][5],
          unitPrice: data[i][6],
          paymentMethod: data[i][7],
          paymentStatus: data[i][8],
          invoiceNumber: data[i][9],
          referrerName: data[i][11],
          referrerReward: data[i][12],
          pointsBefore: data[i][13],
          pointsAfter: data[i][14],
          purchaseTime: data[i][16],
          completedTime: data[i][17],
          notes: data[i][18],
          status: data[i][19]
        });
        
        if (purchases.length >= limit) {
          break;
        }
      }
    }
    
    return {
      success: true,
      purchases: purchases,
      total: purchases.length
    };
    
  } catch (error) {
    Logger.log('getPurchaseHistory Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 取得購買統計
 * @param {string} lineUserId - LINE User ID（可選，不提供則返回全站統計）
 * @returns {object} 購買統計
 */
function getPurchaseStats(lineUserId = null) {
  try {
    const sheet = getSheet(PURCHASES_SHEET);
    const data = sheet.getDataRange().getValues();
    
    let totalPurchases = 0;
    let totalAmount = 0;
    let totalPoints = 0;
    const paymentMethods = {};
    
    for (let i = 1; i < data.length; i++) {
      // 如果指定了 lineUserId，只統計該會員
      if (lineUserId && data[i][2] !== lineUserId) {
        continue;
      }
      
      // 只統計已完成的購買
      if (data[i][8] === 'paid' && (data[i][19] === ACCOUNT_STATUS_CH.ACTIVE || data[i][19] === '啟用')) {
        totalPurchases++;
        totalAmount += Number(data[i][5]) || 0;
        totalPoints += Number(data[i][4]) || 0;
        
        const method = data[i][7] || 'manual';
        paymentMethods[method] = (paymentMethods[method] || 0) + 1;
      }
    }
    
    return {
      success: true,
      stats: {
        totalPurchases: totalPurchases,
        totalAmount: totalAmount,
        totalPoints: totalPoints,
        averageAmount: totalPurchases > 0 ? Math.round(totalAmount / totalPurchases) : 0,
        averagePoints: totalPurchases > 0 ? Math.round(totalPoints / totalPurchases) : 0,
        paymentMethods: paymentMethods
      }
    };
    
  } catch (error) {
    Logger.log('getPurchaseStats Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 取得所有購買記錄（管理員用）
 * @param {object} filter - 篩選條件
 * @returns {object} 購買記錄列表
 */
function getAllPurchases(filter = {}) {
  try {
    const sheet = getSheet(PURCHASES_SHEET);
    const data = sheet.getDataRange().getValues();
    const purchases = [];
    
    for (let i = 1; i < data.length; i++) {
      // 篩選條件
      if (filter.status && data[i][19] !== filter.status) continue;
      if (filter.paymentStatus && data[i][8] !== filter.paymentStatus) continue;
      
      purchases.push({
        purchaseId: data[i][0],
        orderNumber: data[i][1],
        lineUserId: data[i][2],
        memberName: data[i][3],
        points: data[i][4],
        amount: data[i][5],
        unitPrice: data[i][6],
        paymentMethod: data[i][7],
        paymentStatus: data[i][8],
        invoiceNumber: data[i][9],
        referrerUserId: data[i][10],
        referrerName: data[i][11],
        referrerReward: data[i][12],
        pointsBefore: data[i][13],
        pointsAfter: data[i][14],
        ipAddress: data[i][15],
        purchaseTime: data[i][16],
        completedTime: data[i][17],
        notes: data[i][18],
        status: data[i][19]
      });
    }
    
    // 按購買時間降序排列
    purchases.sort((a, b) => b.purchaseTime - a.purchaseTime);
    
    return {
      success: true,
      purchases: purchases,
      total: purchases.length
    };
    
  } catch (error) {
    Logger.log('getAllPurchases Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// ==================== 提領記錄查詢功能 ====================

/**
 * 取得會員的提領歷史
 * @param {string} lineUserId - LINE User ID
 * @param {number} limit - 限制筆數
 * @returns {object} 提領歷史
 */
function getWithdrawalHistory(lineUserId, limit = 50) {
  try {
    Logger.log('========== getWithdrawalHistory 開始 ==========');
    Logger.log('查詢會員: ' + lineUserId);
    
    const sheet = getSheet(WITHDRAWALS_SHEET);
    const data = sheet.getDataRange().getValues();
    const withdrawals = [];
    
    if (data.length <= 1) {
      Logger.log('沒有提領記錄');
      return {
        success: true,
        withdrawals: [],
        total: 0
      };
    }
    
    // 從最新的記錄開始讀取
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][2] === lineUserId) { // lineUserId 在第 3 欄 (index 2)
        withdrawals.push({
          withdrawalId: data[i][0],           // 提領ID
          orderNumber: data[i][1],            // 訂單編號
          memberName: data[i][3],             // 會員姓名
          points: Number(data[i][4]) || 0,    // 提領點數
          amountBeforeFee: Number(data[i][5]) || 0, // 換算金額
          fee: Number(data[i][6]) || 0,       // 手續費
          amount: Number(data[i][7]) || 0,    // 實際到帳
          exchangeRate: Number(data[i][8]) || 0.7, // 換算比例
          bankName: data[i][9],               // 銀行名稱
          bankCode: data[i][10],              // 銀行代碼
          bankAccount: data[i][11],           // 帳號
          accountName: data[i][12],           // 戶名
          referrerUserId: data[i][13],        // 推薦人ID
          referrerName: data[i][14],          // 推薦人姓名
          referrerReward: Number(data[i][15]) || 0, // 推薦獎勵
          pointsBefore: Number(data[i][16]) || 0,   // 提領前點數
          pointsAfter: Number(data[i][17]) || 0,    // 提領後點數
          requestTime: data[i][18],           // 申請時間
          completedTime: data[i][19],         // 完成時間
          status: data[i][20] || STATUS_CH.PENDING,   // 處理狀態
          notes: data[i][21]                  // 備註
        });
        
        if (withdrawals.length >= limit) {
          break;
        }
      }
    }
    
    Logger.log(`找到 ${withdrawals.length} 筆提領記錄`);
    Logger.log('========== getWithdrawalHistory 結束 ==========');
    
    return {
      success: true,
      withdrawals: withdrawals,
      total: withdrawals.length
    };
    
  } catch (error) {
    Logger.log('getWithdrawalHistory Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 取得所有提領記錄（管理員用）
 * @param {object} filter - 篩選條件 {status: 'pending/processing/completed/rejected'}
 * @returns {object} 提領記錄列表
 */
function getAllWithdrawals(filter = {}) {
  try {
    const sheet = getSheet(WITHDRAWALS_SHEET);
    const data = sheet.getDataRange().getValues();
    const withdrawals = [];
    
    for (let i = 1; i < data.length; i++) {
      // 篩選條件
      if (filter.status && data[i][20] !== filter.status) continue;
      
      withdrawals.push({
        withdrawalId: data[i][0],
        orderNumber: data[i][1],
        lineUserId: data[i][2],
        memberName: data[i][3],
        points: Number(data[i][4]) || 0,
        amountBeforeFee: Number(data[i][5]) || 0,
        fee: Number(data[i][6]) || 0,
        amount: Number(data[i][7]) || 0,
        exchangeRate: Number(data[i][8]) || 0.7,
        bankName: data[i][9],
        bankCode: data[i][10],
        bankAccount: data[i][11],
        accountName: data[i][12],
        referrerUserId: data[i][13],
        referrerName: data[i][14],
        referrerReward: Number(data[i][15]) || 0,
        pointsBefore: Number(data[i][16]) || 0,
        pointsAfter: Number(data[i][17]) || 0,
        requestTime: data[i][18],
        completedTime: data[i][19],
        status: data[i][20] || 'pending',
        notes: data[i][21]
      });
    }
    
    // 按申請時間降序排列
    withdrawals.sort((a, b) => {
      const timeA = new Date(a.requestTime).getTime();
      const timeB = new Date(b.requestTime).getTime();
      return timeB - timeA;
    });
    
    return {
      success: true,
      withdrawals: withdrawals,
      total: withdrawals.length
    };
    
  } catch (error) {
    Logger.log('getAllWithdrawals Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 更新提領狀態（管理員用）
 * @param {string} orderNumber - 訂單編號
 * @param {string} status - 新狀態 (processing/completed/rejected)
 * @param {string} notes - 備註
 * @returns {object} 更新結果
 */
function updateWithdrawalStatus(orderNumber, status, notes = '') {
  try {
    const sheet = getSheet(WITHDRAWALS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === orderNumber) { // 訂單編號在第 2 欄
        const row = i + 1;
        
        // 更新狀態
        sheet.getRange(row, 21).setValue(status); // 狀態在第 21 欄
        
        // 如果是完成，記錄完成時間
        if (status === STATUS_CH.COMPLETED || status === '已完成') {
          sheet.getRange(row, 20).setValue(new Date().toISOString()); // 完成時間在第 20 欄
        }
        
        // 更新備註
        if (notes) {
          const currentNotes = data[i][21] || '';
          const newNotes = currentNotes ? `${currentNotes}\n${new Date().toLocaleString()}: ${notes}` : notes;
          sheet.getRange(row, 22).setValue(newNotes); // 備註在第 22 欄
        }
        
        Logger.log(`提領狀態已更新: ${orderNumber} → ${status}`);
        
        return {
          success: true,
          message: '狀態更新成功'
        };
      }
    }
    
    return {
      success: false,
      message: '找不到該提領記錄'
    };
    
  } catch (error) {
    Logger.log('updateWithdrawalStatus Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// ==================== 商城功能 ====================

/**
 * 通過推薦碼查找會員資訊
 * @param {string} referralCode - 推薦碼
 * @returns {object} 會員資訊
 */
function getMemberByReferralCode(referralCode) {
  if (!referralCode) return null;
  
  try {
    const membersSheet = getSheet(MEMBERS_SHEET);
    const membersData = membersSheet.getDataRange().getValues();
    
    // 從第二行開始查找（第一行是標題）
    for (let i = 1; i < membersData.length; i++) {
      const memberReferralCode = membersData[i][11]; // L欄：推薦碼
      
      if (memberReferralCode === referralCode) {
        return {
          lineUserId: membersData[i][0],      // A欄：LINE User ID
          name: membersData[i][1],            // B欄：姓名
          phone: membersData[i][2],           // C欄：電話
          email: membersData[i][3] || '',     // D欄：Email
          referralCode: memberReferralCode    // L欄：推薦碼
        };
      }
    }
    
    return null;
  } catch (error) {
    Logger.log('getMemberByReferralCode Error: ' + error.toString());
    return null;
  }
}

/**
 * 獲取商城商品列表
 * @param {object} filter - 篩選條件 {category, isActive}
 * @returns {object} 商品列表
 */
function getMallProducts(filter = {}) {
  try {
    Logger.log('========== getMallProducts 開始 ==========');
    
    const sheet = getSheet(PRODUCTS_SHEET);
    const data = sheet.getDataRange().getValues();
    const products = [];
    
    for (let i = 1; i < data.length; i++) {
      // 只顯示上架的商品
      const isActive = data[i][11];
      if (!isActive) continue;
      
      // 分類篩選
      if (filter.category && data[i][8] !== filter.category) continue;
      
      const productCode = data[i][1];
      
      // 🔧 通過商品編號（productCode）自動匹配賣家資訊
      const seller = getMemberByReferralCode(productCode);
      
      products.push({
        productId: data[i][0],
        productCode: productCode,
        productName: data[i][2],
        description: data[i][3],
        imageUrl: data[i][4],
        points: Number(data[i][5]) || 0,
        originalPrice: Number(data[i][6]) || 0,
        discount: Number(data[i][7]) || 0,
        category: data[i][8],
        stock: Number(data[i][9]) || 0,
        soldCount: Number(data[i][10]) || 0,
        isActive: data[i][11],
        sortOrder: Number(data[i][12]) || 0,
        tags: data[i][13],
        createdAt: data[i][14],
        updatedAt: data[i][15],
        // 🔧 販售者資訊（自動從 Members 表獲取）
        sellerUserId: seller ? seller.lineUserId : '',
        sellerName: seller ? seller.name : '',
        sellerReferralCode: seller ? seller.referralCode : '',
        sellerPhone: seller ? seller.phone : '',
        sellerEmail: seller ? seller.email : ''
      });
    }
    
    // 按排序順序排列
    products.sort((a, b) => a.sortOrder - b.sortOrder);
    
    Logger.log(`找到 ${products.length} 個商品`);
    Logger.log('========== getMallProducts 結束 ==========');
    
    return {
      success: true,
      products: products,
      total: products.length
    };
    
  } catch (error) {
    Logger.log('getMallProducts Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 獲取商品詳情
 * @param {string} productId - 商品ID
 * @returns {object} 商品詳情
 */
function getMallProductDetail(productId) {
  try {
    const sheet = getSheet(PRODUCTS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === productId) {
        const productCode = data[i][1];
        
        // 🔧 通過商品編號（productCode）自動匹配賣家資訊
        const seller = getMemberByReferralCode(productCode);
        
        return {
          success: true,
          product: {
            productId: data[i][0],
            productCode: productCode,
            productName: data[i][2],
            description: data[i][3],
            imageUrl: data[i][4],
            points: Number(data[i][5]) || 0,
            originalPrice: Number(data[i][6]) || 0,
            discount: Number(data[i][7]) || 0,
            category: data[i][8],
            stock: Number(data[i][9]) || 0,
            soldCount: Number(data[i][10]) || 0,
            isActive: data[i][11],
            sortOrder: Number(data[i][12]) || 0,
            tags: data[i][13],
            createdAt: data[i][14],
            updatedAt: data[i][15],
            // 🔧 販售者資訊（自動從 Members 表獲取）
            sellerUserId: seller ? seller.lineUserId : '',
            sellerName: seller ? seller.name : '',
            sellerReferralCode: seller ? seller.referralCode : '',
            sellerPhone: seller ? seller.phone : '',
            sellerEmail: seller ? seller.email : ''
          }
        };
      }
    }
    
    return {
      success: false,
      message: '找不到該商品'
    };
    
  } catch (error) {
    Logger.log('getMallProductDetail Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 購買商城商品
 * @param {string} lineUserId - 會員ID
 * @param {string} productId - 商品ID
 * @returns {object} 購買結果
 */
function purchaseMallProduct(lineUserId, productId) {
  try {
    Logger.log('========== purchaseMallProduct 開始 ==========');
    Logger.log(`會員: ${lineUserId}, 商品: ${productId}`);
    
    // 1. 獲取商品資訊
    const productResult = getMallProductDetail(productId);
    if (!productResult.success) {
      return {
        success: false,
        message: '商品不存在'
      };
    }
    
    const product = productResult.product;
    
    // 檢查商品是否上架
    if (!product.isActive) {
      return {
        success: false,
        message: '商品已下架'
      };
    }
    
    // 檢查庫存
    if (product.stock !== -1 && product.stock <= 0) {
      return {
        success: false,
        message: '商品已售完'
      };
    }
    
    // 2. 獲取會員資訊
    const membersSheet = getSheet(MEMBERS_SHEET);
    const membersData = membersSheet.getDataRange().getValues();
    let memberRow = -1;
    let memberName = '';
    let currentPoints = 0;
    
    for (let i = 1; i < membersData.length; i++) {
      if (membersData[i][0] === lineUserId) {
        memberRow = i + 1;
        memberName = membersData[i][1];
        currentPoints = Number(membersData[i][7]) || 0;
        break;
      }
    }
    
    if (memberRow === -1) {
      return {
        success: false,
        message: '會員不存在'
      };
    }
    
    // 3. 檢查點數是否足夠
    if (currentPoints < product.points) {
      return {
        success: false,
        message: `點數不足，需要 ${product.points} 點，目前只有 ${currentPoints} 點`
      };
    }
    
    // 4. 扣除買家點數
    const newPoints = currentPoints - product.points;
    membersSheet.getRange(memberRow, 8).setValue(newPoints);
    membersSheet.getRange(memberRow, 17).setValue(new Date().toISOString());
    
    Logger.log(`✅ 買家點數扣除成功: ${currentPoints} → ${newPoints}`);
    
    // 5. 轉點數給販售者（如果有設定販售者）
    let sellerReward = null;
    if (product.sellerUserId) {
      const transferResult = transferPointsToSeller(product.sellerUserId, product.points, product.productName, memberName);
      if (transferResult.success) {
        sellerReward = {
          sellerUserId: product.sellerUserId,
          sellerName: product.sellerName,
          points: product.points
        };
        Logger.log(`✅ 點數已轉給販售者: ${product.sellerName}`);
      }
    }
    
    // 6. 記錄買家交易
    addTransaction({
      type: 'mall_purchase',
      senderUserId: lineUserId,
      senderName: memberName,
      receiverUserId: product.sellerUserId || '',
      receiverName: product.sellerName || '系統',
      points: -product.points,
      message: `購買商城商品：${product.productName}${product.sellerName ? ` (販售者：${product.sellerName})` : ''}`,
      balanceAfter: newPoints,
      status: STATUS_CH.COMPLETED
    });
    
    // 6. 創建訂單
    const now = new Date();
    const orderNumber = 'MO' + now.getTime();
    const ordersSheet = getSheet(MALL_ORDERS_SHEET);
    
    // 🔧 移除虛擬商品序號功能，改為記錄賣家聯絡資訊
    const sellerContact = product.sellerPhone ? 
      `📱 ${product.sellerPhone}` : 
      (product.sellerEmail ? `📧 ${product.sellerEmail}` : '');
    
    ordersSheet.appendRow([
      now.getTime(),              // 訂單ID
      orderNumber,                // 訂單編號
      lineUserId,                 // 會員ID
      memberName,                 // 會員姓名
      product.productId,          // 商品ID
      product.productCode,        // 商品代碼
      product.productName,        // 商品名稱
      product.imageUrl,           // 商品圖片
      product.points,             // 購買點數
      currentPoints,              // 購買前點數
      newPoints,                  // 購買後點數
      product.sellerName || '',   // 🔧 賣家姓名
      product.sellerPhone || '',  // 🔧 賣家電話
      product.sellerReferralCode || product.productCode, // 🔧 賣家推薦碼
      STATUS_CH.COMPLETED,        // 訂單狀態（中文）
      now.toISOString(),          // 付款時間
      now.toISOString(),          // 完成時間
      sellerContact,              // 🔧 賣家聯絡資訊（在備註欄）
      now.toISOString()           // 建立時間
    ]);
    
    // 7. 更新商品庫存和銷售數量
    const productsSheet = getSheet(PRODUCTS_SHEET);
    const productsData = productsSheet.getDataRange().getValues();
    
    for (let i = 1; i < productsData.length; i++) {
      if (productsData[i][0] === productId) {
        const productRow = i + 1;
        const currentStock = Number(productsData[i][9]) || 0;
        const soldCount = Number(productsData[i][10]) || 0;
        
        // 更新庫存（如果不是無限庫存）
        if (currentStock !== -1) {
          productsSheet.getRange(productRow, 10).setValue(currentStock - 1);
        }
        
        // 更新銷售數量
        productsSheet.getRange(productRow, 11).setValue(soldCount + 1);
        break;
      }
    }
    
    Logger.log('========== purchaseMallProduct 結束 ==========');
    
    // 🔧 C2C 商城不使用虛擬序號，改為顯示賣家聯絡資訊
    let message = `購買成功！`;
    if (product.sellerName) {
      message += `\n請聯絡賣家：${product.sellerName}`;
      if (product.sellerPhone) {
        message += `\n電話：${product.sellerPhone}`;
      }
    }
    if (sellerReward) {
      message += `\n\n販售者 ${sellerReward.sellerName} 已收到 ${sellerReward.points} 點`;
    }
    
    return {
      success: true,
      orderNumber: orderNumber,
      productCode: product.productCode,
      productName: product.productName,
      newPoints: newPoints,
      sellerName: product.sellerName || null,
      sellerPhone: product.sellerPhone || null,
      sellerReward: sellerReward,
      message: message
    };
    
  } catch (error) {
    Logger.log('purchaseMallProduct Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 獲取我的商城訂單
 * @param {string} lineUserId - 會員ID
 * @param {number} limit - 限制筆數
 * @returns {object} 訂單列表
 */
function getMallOrders(lineUserId, limit = 50) {
  try {
    Logger.log('========== getMallOrders 開始 ==========');
    Logger.log('查詢會員: ' + lineUserId);
    
    const sheet = getSheet(MALL_ORDERS_SHEET);
    const data = sheet.getDataRange().getValues();
    const orders = [];
    
    if (data.length <= 1) {
      return {
        success: true,
        orders: [],
        total: 0
      };
    }
    
    // 🚀 優化：預先載入商品分類 Map
    const productsSheet = getSheet(PRODUCTS_SHEET);
    const productsData = productsSheet.getDataRange().getValues();
    const productCategoryMap = {};
    for (let j = 1; j < productsData.length; j++) {
      productCategoryMap[productsData[j][0]] = productsData[j][8];
    }
    
    // 從最新的記錄開始讀取
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][2] === lineUserId) {
        const productCategory = productCategoryMap[data[i][4]] || '';
        
        orders.push({
          orderId: data[i][0],
          orderNumber: data[i][1],
          memberName: data[i][3],
          productId: data[i][4],
          productCode: data[i][5],
          productName: data[i][6],
          productImage: data[i][7],
          pointsUsed: Number(data[i][8]) || 0,
          pointsBefore: Number(data[i][9]) || 0,
          pointsAfter: Number(data[i][10]) || 0,
          sellerName: data[i][11] || '',           // 🔧 賣家姓名
          sellerPhone: data[i][12] || '',          // 🔧 賣家電話
          sellerReferralCode: data[i][13] || '',   // 🔧 賣家推薦碼
          status: data[i][14],
          orderDate: data[i][15],
          completedAt: data[i][16],
          notes: data[i][17],
          createdAt: data[i][18],
          productCategory: productCategory,
          quantity: 1
        });
        
        if (orders.length >= limit) {
          break;
        }
      }
    }
    
    Logger.log(`找到 ${orders.length} 筆訂單`);
    Logger.log('========== getMallOrders 結束 ==========');
    
    return {
      success: true,
      orders: orders,
      total: orders.length
    };
    
  } catch (error) {
    Logger.log('getMallOrders Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 生成虛擬商品序號
 * @param {string} productCode - 商品代碼
 * @returns {string} 序號
 */
function generateSerialNumber(productCode) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = (productCode || 'ITEM').substring(0, 4).toUpperCase();
  return `${code}-${timestamp}-${random}`;
}

// ==================== 🏪 會員上架商品功能 ====================

/**
 * 會員上架商品（每人限 1 個）
 * @param {string} lineUserId - 會員ID
 * @param {object} productData - 商品資料
 * @returns {object} 上架結果
 */
function uploadProduct(lineUserId, productData) {
  try {
    Logger.log('========== uploadProduct 開始 ==========');
    Logger.log('會員: ' + lineUserId);
    
    // 1. 檢查會員是否存在並獲取資訊
    const membersSheet = getSheet(MEMBERS_SHEET);
    const membersData = membersSheet.getDataRange().getValues();
    let memberInfo = null;
    
    for (let i = 1; i < membersData.length; i++) {
      if (membersData[i][0] === lineUserId) {
        memberInfo = {
          lineUserId: membersData[i][0],
          name: membersData[i][1],
          phone: membersData[i][2],
          email: membersData[i][3],
          referralCode: membersData[i][11]
        };
        break;
      }
    }
    
    if (!memberInfo) {
      return {
        success: false,
        message: '會員不存在'
      };
    }
    
    // 2. 檢查是否已經上架過商品（限制 1 個）
    const productsSheet = getSheet(PRODUCTS_SHEET);
    const productsData = productsSheet.getDataRange().getValues();
    
    for (let i = 1; i < productsData.length; i++) {
      // productCode 等於會員推薦碼表示是該會員上架的商品
      if (productsData[i][1] === memberInfo.referralCode) {
        return {
          success: false,
          message: '您已經上架過商品了！每位會員限上架 1 個商品。'
        };
      }
    }
    
    // 3. 驗證商品資料
    if (!productData.productName || productData.productName.length < 2) {
      return { success: false, message: '商品名稱太短' };
    }
    
    if (!productData.description || productData.description.length < 10) {
      return { success: false, message: '商品描述太短，請詳細描述' };
    }
    
    if (!productData.imageUrl || !productData.imageUrl.startsWith('http')) {
      return { success: false, message: '請提供有效的圖片網址' };
    }
    
    const points = parseInt(productData.points);
    if (isNaN(points) || points < 1 || points > 100000) {
      return { success: false, message: '售價必須在 1-100000 點之間' };
    }
    
    if (!['physical', 'virtual', 'charity'].includes(productData.category)) {
      return { success: false, message: '請選擇有效的商品分類' };
    }
    
    const stock = parseInt(productData.stock);
    if (isNaN(stock) || (stock < -1 || stock === 0)) {
      return { success: false, message: '庫存數量無效' };
    }
    
    // 4. 新增商品到 Products 表
    const now = new Date();
    const productId = 'PROD-' + now.getTime();
    const originalPrice = parseInt(productData.originalPrice) || 0;
    
    // productCode 設為會員的推薦碼，這樣系統會自動匹配賣家資訊
    const productCode = memberInfo.referralCode;
    
    // 計算排序順序（放在最後）
    const sortOrder = productsData.length;
    
    productsSheet.appendRow([
      productId,                           // 商品ID
      productCode,                         // 商品代碼（會員推薦碼）
      productData.productName,             // 商品名稱
      productData.description,             // 商品描述
      productData.imageUrl,                // 商品圖片
      points,                              // 所需點數
      originalPrice,                       // 原價
      0,                                   // 折扣（預設無折扣）
      productData.category,                // 商品分類
      stock,                               // 庫存
      0,                                   // 已售數量
      false,                               // isActive（需審核，預設 false）
      sortOrder,                           // 排序
      productData.tags || '',              // 標籤
      now.toISOString(),                   // 建立時間
      now.toISOString()                    // 更新時間
    ]);
    
    Logger.log('✅ 商品上架成功: ' + productData.productName);
    
    return {
      success: true,
      message: '商品上架成功！等待管理員審核後即可在商城顯示。',
      productId: productId,
      productCode: productCode,
      sellerName: memberInfo.name,
      sellerPhone: memberInfo.phone
    };
    
  } catch (error) {
    Logger.log('uploadProduct Error: ' + error.toString());
    return {
      success: false,
      message: '上架失敗：' + error.toString()
    };
  }
}

/**
 * 更新會員的商品
 * @param {string} lineUserId - 會員ID
 * @param {object} productData - 商品資料
 * @returns {object} 更新結果
 */
function updateProduct(lineUserId, productData) {
  try {
    Logger.log('========== updateProduct 開始 ==========');
    
    // 1. 獲取會員推薦碼
    const membersSheet = getSheet(MEMBERS_SHEET);
    const membersData = membersSheet.getDataRange().getValues();
    let referralCode = '';
    
    for (let i = 1; i < membersData.length; i++) {
      if (membersData[i][0] === lineUserId) {
        referralCode = membersData[i][11];
        break;
      }
    }
    
    if (!referralCode) {
      return { success: false, message: '會員不存在' };
    }
    
    // 2. 找到會員的商品
    const productsSheet = getSheet(PRODUCTS_SHEET);
    const productsData = productsSheet.getDataRange().getValues();
    let productRow = -1;
    
    for (let i = 1; i < productsData.length; i++) {
      if (productsData[i][1] === referralCode) {
        productRow = i + 1;
        break;
      }
    }
    
    if (productRow === -1) {
      return { success: false, message: '找不到您的商品' };
    }
    
    // 3. 驗證資料
    const points = parseInt(productData.points);
    const stock = parseInt(productData.stock);
    const originalPrice = parseInt(productData.originalPrice) || 0;
    
    if (isNaN(points) || points < 1 || points > 100000) {
      return { success: false, message: '售價無效' };
    }
    
    if (isNaN(stock) || (stock < -1 || stock === 0)) {
      return { success: false, message: '庫存數量無效' };
    }
    
    // 4. 更新商品資訊
    const now = new Date();
    
    productsSheet.getRange(productRow, 3).setValue(productData.productName);        // 商品名稱
    productsSheet.getRange(productRow, 4).setValue(productData.description);        // 描述
    productsSheet.getRange(productRow, 5).setValue(productData.imageUrl);           // 圖片
    productsSheet.getRange(productRow, 6).setValue(points);                         // 點數
    productsSheet.getRange(productRow, 7).setValue(originalPrice);                  // 原價
    productsSheet.getRange(productRow, 9).setValue(productData.category);           // 分類
    productsSheet.getRange(productRow, 10).setValue(stock);                         // 庫存
    productsSheet.getRange(productRow, 12).setValue(false);                         // 需重新審核
    productsSheet.getRange(productRow, 14).setValue(productData.tags || '');        // 標籤
    productsSheet.getRange(productRow, 16).setValue(now.toISOString());             // 更新時間
    
    Logger.log('✅ 商品更新成功');
    
    return {
      success: true,
      message: '商品更新成功！等待管理員重新審核。'
    };
    
  } catch (error) {
    Logger.log('updateProduct Error: ' + error.toString());
    return {
      success: false,
      message: '更新失敗：' + error.toString()
    };
  }
}

/**
 * 查詢會員的商品
 * @param {string} lineUserId - 會員ID
 * @returns {object} 商品資訊
 */
function getMyProduct(lineUserId) {
  try {
    Logger.log('========== getMyProduct 開始 ==========');
    
    // 1. 獲取會員推薦碼
    const membersSheet = getSheet(MEMBERS_SHEET);
    const membersData = membersSheet.getDataRange().getValues();
    let referralCode = '';
    
    for (let i = 1; i < membersData.length; i++) {
      if (membersData[i][0] === lineUserId) {
        referralCode = membersData[i][11];
        break;
      }
    }
    
    if (!referralCode) {
      return { success: false, message: '會員不存在' };
    }
    
    // 2. 查詢商品
    const productsSheet = getSheet(PRODUCTS_SHEET);
    const productsData = productsSheet.getDataRange().getValues();
    
    for (let i = 1; i < productsData.length; i++) {
      if (productsData[i][1] === referralCode) {
        return {
          success: true,
          product: {
            productId: productsData[i][0],
            productCode: productsData[i][1],
            productName: productsData[i][2],
            description: productsData[i][3],
            imageUrl: productsData[i][4],
            points: Number(productsData[i][5]) || 0,
            originalPrice: Number(productsData[i][6]) || 0,
            discount: Number(productsData[i][7]) || 0,
            category: productsData[i][8],
            stock: Number(productsData[i][9]) || 0,
            soldCount: Number(productsData[i][10]) || 0,
            isActive: productsData[i][11],
            sortOrder: Number(productsData[i][12]) || 0,
            tags: productsData[i][13],
            createdAt: productsData[i][14],
            updatedAt: productsData[i][15]
          }
        };
      }
    }
    
    // 沒有找到商品
    return {
      success: false,
      message: '尚未上架商品'
    };
    
  } catch (error) {
    Logger.log('getMyProduct Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 初始化所有工作表的下拉選單
 * 為各工作表的狀態欄位設定中文下拉選單
 */
function initAllDropdowns() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    Logger.log('========== 開始設定所有下拉選單 ==========');
    
    // 1. 會員資料 - 帳號狀態和會員等級
    try {
      const membersSheet = ss.getSheetByName(MEMBERS_SHEET);
      if (membersSheet) {
        // 帳號狀態 (第 M 欄)
        const statusRange = membersSheet.getRange('M2:M1000');
        const statusRule = SpreadsheetApp.newDataValidation()
          .requireValueInList([
            ACCOUNT_STATUS_CH.ACTIVE,
            ACCOUNT_STATUS_CH.INACTIVE,
            ACCOUNT_STATUS_CH.SUSPENDED,
            ACCOUNT_STATUS_CH.BLOCKED
          ], true)
          .setAllowInvalid(false)
          .build();
        statusRange.setDataValidation(statusRule);
        
        // 會員等級 (第 I 欄)
        const levelRange = membersSheet.getRange('I2:I1000');
        const levelRule = SpreadsheetApp.newDataValidation()
          .requireValueInList([
            MEMBER_LEVELS.BRONZE.name,
            MEMBER_LEVELS.SILVER.name,
            MEMBER_LEVELS.GOLD.name,
            MEMBER_LEVELS.PLATINUM.name
          ], true)
          .setAllowInvalid(false)
          .build();
        levelRange.setDataValidation(levelRule);
        
        Logger.log('✅ 會員資料 - 下拉選單設定完成');
      }
    } catch (e) {
      Logger.log('⚠️ 會員資料設定失敗: ' + e.toString());
    }
    
    // 2. 交易記錄 - 狀態
    try {
      const transSheet = ss.getSheetByName(TRANSACTIONS_SHEET);
      if (transSheet) {
        const statusRange = transSheet.getRange('J2:J10000');
        const statusRule = SpreadsheetApp.newDataValidation()
          .requireValueInList([
            STATUS_CH.COMPLETED,
            STATUS_CH.PENDING,
            STATUS_CH.CANCELLED
          ], true)
          .setAllowInvalid(false)
          .build();
        statusRange.setDataValidation(statusRule);
        Logger.log('✅ 交易記錄 - 下拉選單設定完成');
      }
    } catch (e) {
      Logger.log('⚠️ 交易記錄設定失敗: ' + e.toString());
    }
    
    // 3. 提領記錄 - 處理狀態
    try {
      const withdrawSheet = ss.getSheetByName(WITHDRAWALS_SHEET);
      if (withdrawSheet) {
        const statusRange = withdrawSheet.getRange('U2:U1000');
        const statusRule = SpreadsheetApp.newDataValidation()
          .requireValueInList([
            STATUS_CH.PENDING,
            STATUS_CH.PROCESSING,
            STATUS_CH.COMPLETED,
            STATUS_CH.REJECTED
          ], true)
          .setAllowInvalid(false)
          .build();
        statusRange.setDataValidation(statusRule);
        Logger.log('✅ 提領記錄 - 下拉選單設定完成');
      }
    } catch (e) {
      Logger.log('⚠️ 提領記錄設定失敗: ' + e.toString());
    }
    
    // 4. 購買記錄 - 付款方式和狀態
    try {
      const purchaseSheet = ss.getSheetByName(PURCHASES_SHEET);
      if (purchaseSheet) {
        // 付款方式
        const paymentRange = purchaseSheet.getRange('H2:H1000');
        const paymentRule = SpreadsheetApp.newDataValidation()
          .requireValueInList([
            PAYMENT_METHOD_CH.CASH,
            PAYMENT_METHOD_CH.CREDIT_CARD,
            PAYMENT_METHOD_CH.BANK_TRANSFER,
            PAYMENT_METHOD_CH.LINE_PAY,
            PAYMENT_METHOD_CH.OTHER
          ], true)
          .setAllowInvalid(false)
          .build();
        paymentRange.setDataValidation(paymentRule);
        
        // 狀態
        const statusRange = purchaseSheet.getRange('L2:L1000');
        const statusRule = SpreadsheetApp.newDataValidation()
          .requireValueInList([
            STATUS_CH.PENDING,
            STATUS_CH.COMPLETED,
            STATUS_CH.CANCELLED
          ], true)
          .setAllowInvalid(false)
          .build();
        statusRange.setDataValidation(statusRule);
        
        Logger.log('✅ 購買記錄 - 下拉選單設定完成');
      }
    } catch (e) {
      Logger.log('⚠️ 購買記錄設定失敗: ' + e.toString());
    }
    
    // 5. 商城訂單 - 訂單狀態
    try {
      const ordersSheet = ss.getSheetByName(MALL_ORDERS_SHEET);
      if (ordersSheet) {
        const statusRange = ordersSheet.getRange('O2:O1000');
        const statusRule = SpreadsheetApp.newDataValidation()
          .requireValueInList([
            STATUS_CH.PENDING,
            STATUS_CH.PROCESSING,
            STATUS_CH.COMPLETED,
            STATUS_CH.SHIPPED,
            STATUS_CH.CANCELLED
          ], true)
          .setAllowInvalid(false)
          .build();
        statusRange.setDataValidation(statusRule);
        Logger.log('✅ 商城訂單 - 下拉選單設定完成');
      }
    } catch (e) {
      Logger.log('⚠️ 商城訂單設定失敗: ' + e.toString());
    }
    
    // 6. 會員等級 - 啟用狀態
    try {
      const levelSheet = ss.getSheetByName(MEMBER_LEVELS_SHEET);
      if (levelSheet) {
        const statusRange = levelSheet.getRange('H2:H100');
        const statusRule = SpreadsheetApp.newDataValidation()
          .requireValueInList(['啟用', '停用'], true)
          .setAllowInvalid(false)
          .build();
        statusRange.setDataValidation(statusRule);
        Logger.log('✅ 會員等級 - 下拉選單設定完成');
      }
    } catch (e) {
      Logger.log('⚠️ 會員等級設定失敗: ' + e.toString());
    }
    
    Logger.log('========== 所有下拉選單設定完成 ==========');
    
    Browser.msgBox(
      '✅ 下拉選單設定完成',
      '所有工作表的下拉選單已設定完成！\\n\\n' +
      '包含：\\n' +
      '• 會員資料（帳號狀態、會員等級）\\n' +
      '• 交易記錄（狀態）\\n' +
      '• 提領記錄（處理狀態）\\n' +
      '• 購買記錄（付款方式、狀態）\\n' +
      '• 商城訂單（訂單狀態）\\n' +
      '• 會員等級（啟用狀態）\\n\\n' +
      '所有狀態都已中文化！',
      Browser.Buttons.OK
    );
    
    return { success: true, message: '所有下拉選單設定完成' };
    
  } catch (error) {
    Logger.log('❌ 設定失敗：' + error.toString());
    Browser.msgBox(
      '❌ 設定失敗',
      '錯誤訊息：' + error.toString(),
      Browser.Buttons.OK
    );
    return { success: false, message: error.toString() };
  }
}

/**
 * 🌟 一鍵初始化所有工作表（推薦使用）
 * 自動建立所有工作表並設定中文欄位標題和下拉選單
 */
function initAllSheetsAtOnce() {
  try {
    Logger.log('========== 開始一鍵初始化所有工作表 ==========');
    
    const results = [];
    
    // 1. 初始化會員資料表
    try {
      initMembersSheet();
      results.push('✅ 會員資料');
    } catch (e) {
      results.push('❌ 會員資料: ' + e.toString());
    }
    
    // 2. 初始化交易記錄表
    try {
      initTransactionsSheet();
      results.push('✅ 交易記錄');
    } catch (e) {
      results.push('❌ 交易記錄: ' + e.toString());
    }
    
    // 3. 初始化推薦關係表
    try {
      initReferralsSheet();
      results.push('✅ 推薦關係');
    } catch (e) {
      results.push('❌ 推薦關係: ' + e.toString());
    }
    
    // 4. 初始化購買記錄表
    try {
      initPurchasesSheet();
      results.push('✅ 購買記錄');
    } catch (e) {
      results.push('❌ 購買記錄: ' + e.toString());
    }
    
    // 5. 初始化提領記錄表
    try {
      initWithdrawalsSheet();
      results.push('✅ 提領記錄');
    } catch (e) {
      results.push('❌ 提領記錄: ' + e.toString());
    }
    
    // 6. 初始化商城商品表
    try {
      initProductsSheet();
      results.push('✅ 商城商品');
    } catch (e) {
      results.push('❌ 商城商品: ' + e.toString());
    }
    
    // 7. 初始化商城訂單表
    try {
      initMallOrdersSheet();
      results.push('✅ 商城訂單');
    } catch (e) {
      results.push('❌ 商城訂單: ' + e.toString());
    }
    
    // 8. 初始化會員等級表
    try {
      initMemberLevelsSheet();
      results.push('✅ 會員等級');
    } catch (e) {
      results.push('❌ 會員等級: ' + e.toString());
    }
    
    // 9. 初始化活動記錄表
    try {
      initActivitiesSheet();
      results.push('✅ 活動記錄');
    } catch (e) {
      results.push('❌ 活動記錄: ' + e.toString());
    }
    
    // 10. 初始化系統設定表
    try {
      initSettingsSheet();
      results.push('✅ 系統設定');
    } catch (e) {
      results.push('❌ 系統設定: ' + e.toString());
    }
    
    // 11. 初始化每日統計表
    try {
      initDailyStatsSheet();
      results.push('✅ 每日統計');
    } catch (e) {
      results.push('❌ 每日統計: ' + e.toString());
    }
    
    // 12. 設定所有下拉選單
    try {
      initAllDropdowns();
      results.push('✅ 下拉選單設定');
    } catch (e) {
      results.push('❌ 下拉選單: ' + e.toString());
    }
    
    Logger.log('========== 初始化完成 ==========');
    Logger.log(results.join('\n'));
    
    Browser.msgBox(
      '🎉 一鍵初始化完成',
      '所有工作表已建立並設定完成！\n\n' + results.join('\n'),
      Browser.Buttons.OK
    );
    
    return { success: true, results: results };
    
  } catch (error) {
    Logger.log('❌ 初始化失敗：' + error.toString());
    Browser.msgBox(
      '❌ 初始化失敗',
      '錯誤訊息：' + error.toString(),
      Browser.Buttons.OK
    );
    return { success: false, message: error.toString() };
  }
}

/**
 * 初始化會員資料表
 */
function initMembersSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(MEMBERS_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(MEMBERS_SHEET);
  }
  
  // 中文欄位標題
  const headers = [
    'LINE用戶ID', '姓名', '電話', 'Email', '生日',
    'LINE暱稱', 'LINE頭像', '點數餘額', '會員等級', '累計獲得',
    '累計使用', '推薦碼', '帳號狀態', '最後登入', '註冊時間',
    '更新時間'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 設定格式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  Logger.log('✅ 會員資料表初始化完成');
}

/**
 * 初始化交易記錄表
 */
function initTransactionsSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(TRANSACTIONS_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(TRANSACTIONS_SHEET);
  }
  
  const headers = [
    '交易ID', '交易類型', '發送者ID', '接收者ID', '發送者姓名',
    '接收者姓名', '點數', '訊息', '交易後餘額', '狀態', '交易時間'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  Logger.log('✅ 交易記錄表初始化完成');
}

/**
 * 初始化推薦關係表
 */
function initReferralsSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(REFERRALS_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(REFERRALS_SHEET);
  }
  
  const headers = [
    '推薦ID', '推薦碼', '推薦人ID', '推薦人姓名', '推薦人電話',
    '新會員ID', '新會員姓名', '新會員電話', '推薦人獎勵', '新會員獎勵',
    '推薦時間', '備註'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  Logger.log('✅ 推薦關係表初始化完成');
}

/**
 * 初始化購買記錄表
 */
function initPurchasesSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(PURCHASES_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(PURCHASES_SHEET);
  }
  
  const headers = [
    '購買ID', '訂單編號', '會員ID', '會員姓名', '購買點數',
    '支付金額', '單價', '付款方式', '推薦人姓名', '推薦人獎勵',
    '購買前點數', '購買後點數', '狀態', '付款時間', '備註', '建立時間'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  Logger.log('✅ 購買記錄表初始化完成');
}

/**
 * 初始化提領記錄表
 */
function initWithdrawalsSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(WITHDRAWALS_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(WITHDRAWALS_SHEET);
  }
  
  const headers = [
    '提領ID', '訂單編號', '會員ID', '會員姓名', '會員電話',
    '提領點數', '提領金額', '手續費', '實際金額', '銀行代碼',
    '銀行名稱', '分行名稱', '帳號', '戶名', '推薦人姓名',
    '推薦人獎勵', '提領前點數', '提領後點數', '申請時間', '完成時間',
    '處理狀態', '備註'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  Logger.log('✅ 提領記錄表初始化完成');
}

/**
 * 初始化商城商品表
 */
function initProductsSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(PRODUCTS_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(PRODUCTS_SHEET);
  }
  
  const headers = [
    '商品ID', '商品代碼', '商品名稱', '商品描述', '商品圖片',
    '所需點數', '原價', '折扣', '商品分類', '庫存',
    '已售數量', '上架狀態', '排序', '標籤', '建立時間', '更新時間'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  Logger.log('✅ 商城商品表初始化完成');
}

/**
 * 初始化會員等級表
 */
function initMemberLevelsSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(MEMBER_LEVELS_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(MEMBER_LEVELS_SHEET);
  }
  
  const headers = [
    '等級ID', '等級代碼', '等級名稱', '最低點數', '折扣',
    '圖示', '顏色', '啟用狀態', '建立時間'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  // 新增預設等級資料
  const now = new Date().toISOString();
  sheet.appendRow([1, 'BRONZE', '銅級會員', 0, 0, '🥉', '#CD7F32', '啟用', now]);
  sheet.appendRow([2, 'SILVER', '銀級會員', 500, 0.05, '🥈', '#C0C0C0', '啟用', now]);
  sheet.appendRow([3, 'GOLD', '金級會員', 1000, 0.1, '🥇', '#FFD700', '啟用', now]);
  sheet.appendRow([4, 'PLATINUM', '白金會員', 5000, 0.15, '💎', '#E5E4E2', '啟用', now]);
  
  Logger.log('✅ 會員等級表初始化完成（含預設資料）');
}

/**
 * 初始化活動記錄表
 */
function initActivitiesSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(ACTIVITIES_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(ACTIVITIES_SHEET);
  }
  
  const headers = [
    '活動ID', '會員ID', '活動類型', '點數', '元數據',
    '完成時間', '建立時間'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  Logger.log('✅ 活動記錄表初始化完成');
}

/**
 * 初始化系統設定表
 */
function initSettingsSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SETTINGS_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS_SHEET);
  }
  
  const headers = [
    '設定鍵', '設定值', '類型', '說明', '分類',
    '更新者', '更新時間'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  // 新增預設設定
  const now = new Date().toISOString();
  sheet.appendRow(['INITIAL_POINTS', '0', 'number', '新會員註冊贈送點數', '會員', 'system', now]);
  sheet.appendRow(['REFERRAL_REWARD', '20', 'number', '推薦獎勵百分比', '推薦', 'system', now]);
  sheet.appendRow(['WITHDRAWAL_FEE', '0', 'number', '提領手續費百分比', '提領', 'system', now]);
  sheet.appendRow(['MIN_WITHDRAWAL', '100', 'number', '最低提領點數', '提領', 'system', now]);
  
  Logger.log('✅ 系統設定表初始化完成（含預設資料）');
}

/**
 * 初始化每日統計表
 */
function initDailyStatsSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(DAILY_STATS_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(DAILY_STATS_SHEET);
  }
  
  const headers = [
    '日期', '新增會員', '活躍會員', '總交易數', '發放點數',
    '消耗點數', '建立時間'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#667eea');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  Logger.log('✅ 每日統計表初始化完成');
}

/**
 * 初始化 MallOrders 工作表
 * 自動建立工作表和欄位結構
 * 在 Apps Script 編輯器中執行此函數即可
 */
function initMallOrdersSheet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // 檢查是否已存在 MallOrders 工作表
    let sheet = ss.getSheetByName(MALL_ORDERS_SHEET);
    
    if (sheet) {
      const response = Browser.msgBox(
        '工作表已存在',
        '已經存在 MallOrders 工作表，是否要重新建立？\\n（警告：這將刪除所有現有資料）',
        Browser.Buttons.YES_NO
      );
      
      if (response === 'yes') {
        ss.deleteSheet(sheet);
        Logger.log('已刪除舊的 MallOrders 工作表');
      } else {
        Logger.log('取消操作');
        return {
          success: false,
          message: '用戶取消操作'
        };
      }
    }
    
    // 建立新的 MallOrders 工作表
    sheet = ss.insertSheet(MALL_ORDERS_SHEET);
    Logger.log('✅ 已建立 MallOrders 工作表');
    
    // 設定欄位標題（第一行）- 中文版
    const headers = [
      '訂單ID',              // A: orderId
      '訂單編號',            // B: orderNumber
      '會員ID',              // C: memberUserId
      '會員姓名',            // D: memberName
      '商品ID',              // E: productId
      '商品代碼',            // F: productCode
      '商品名稱',            // G: productName
      '商品圖片',            // H: productImage
      '使用點數',            // I: pointsUsed
      '購買前點數',          // J: pointsBefore
      '購買後點數',          // K: pointsAfter
      '賣家姓名',            // L: sellerName ⭐
      '賣家電話',            // M: sellerPhone ⭐
      '賣家推薦碼',          // N: sellerReferralCode ⭐
      '訂單狀態',            // O: status
      '訂單日期',            // P: orderDate
      '完成時間',            // Q: completedAt
      '備註',                // R: notes
      '建立時間'             // S: createdAt
    ];
    
    // 寫入標題列
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // 設定標題列格式
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#667eea');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    
    // 凍結第一行
    sheet.setFrozenRows(1);
    
    // 設定欄寬
    const columnWidths = {
      1: 120,   // A: orderId
      2: 140,   // B: orderNumber
      3: 150,   // C: memberUserId
      4: 100,   // D: memberName
      5: 120,   // E: productId
      6: 100,   // F: productCode
      7: 150,   // G: productName
      8: 200,   // H: productImage
      9: 80,    // I: pointsUsed
      10: 80,   // J: pointsBefore
      11: 80,   // K: pointsAfter
      12: 100,  // L: sellerName
      13: 120,  // M: sellerPhone
      14: 120,  // N: sellerReferralCode
      15: 100,  // O: status
      16: 150,  // P: orderDate
      17: 150,  // Q: completedAt
      18: 200,  // R: notes
      19: 150   // S: createdAt
    };
    
    for (let col in columnWidths) {
      sheet.setColumnWidth(parseInt(col), columnWidths[col]);
    }
    
    // 設定資料驗證（訂單狀態）- 中文選項
    const statusRange = sheet.getRange('O2:O1000');
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList([
        STATUS_CH.PENDING,
        STATUS_CH.PROCESSING,
        STATUS_CH.COMPLETED,
        STATUS_CH.SHIPPED,
        STATUS_CH.CANCELLED
      ], true)
      .setAllowInvalid(false)
      .build();
    statusRange.setDataValidation(statusRule);
    
    // 設定條件式格式（訂單狀態顏色）- 中文狀態
    const rules = [
      // 已完成 - 綠色
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(STATUS_CH.COMPLETED)
        .setBackground('#D4EDDA')
        .setFontColor('#155724')
        .setRanges([sheet.getRange('O:O')])
        .build(),
      // 處理中 - 黃色
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(STATUS_CH.PROCESSING)
        .setBackground('#FFF3CD')
        .setFontColor('#856404')
        .setRanges([sheet.getRange('O:O')])
        .build(),
      // 待處理 - 灰色
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(STATUS_CH.PENDING)
        .setBackground('#E2E3E5')
        .setFontColor('#383D41')
        .setRanges([sheet.getRange('O:O')])
        .build(),
      // 已取消 - 紅色
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(STATUS_CH.CANCELLED)
        .setBackground('#F8D7DA')
        .setFontColor('#721C24')
        .setRanges([sheet.getRange('O:O')])
        .build(),
      // 已出貨 - 藍色
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(STATUS_CH.SHIPPED)
        .setBackground('#D1ECF1')
        .setFontColor('#0C5460')
        .setRanges([sheet.getRange('O:O')])
        .build()
    ];
    
    sheet.setConditionalFormatRules(rules);
    
    Logger.log('✅ 欄位標題設定完成');
    Logger.log('✅ 格式設定完成');
    Logger.log('✅ 條件式格式設定完成');
    
    // 新增說明註解
    sheet.getRange('A1').setNote(
      'MallOrders 工作表\n' +
      '建立時間：' + new Date().toLocaleString('zh-TW') + '\n' +
      '共 19 個欄位\n' +
      '包含賣家聯絡資訊（L、M、N 欄）'
    );
    
    Logger.log('========================================');
    Logger.log('✅ MallOrders 工作表初始化完成！');
    Logger.log('共建立 ' + headers.length + ' 個欄位');
    Logger.log('工作表名稱：' + MALL_ORDERS_SHEET);
    Logger.log('========================================');
    
    Browser.msgBox(
      '✅ 初始化完成',
      'MallOrders 工作表已成功建立！\\n\\n' +
      '共建立 19 個欄位\\n' +
      '包含賣家聯絡資訊（姓名、電話、推薦碼）\\n\\n' +
      '您現在可以開始使用商城功能了。',
      Browser.Buttons.OK
    );
    
    return {
      success: true,
      message: 'MallOrders 工作表初始化完成',
      columnCount: headers.length,
      sheetName: MALL_ORDERS_SHEET
    };
    
  } catch (error) {
    Logger.log('❌ 初始化失敗：' + error.toString());
    Browser.msgBox(
      '❌ 初始化失敗',
      '錯誤訊息：' + error.toString(),
      Browser.Buttons.OK
    );
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * 轉點數給販售者
 * @param {string} sellerUserId - 販售者ID
 * @param {number} points - 點數
 * @param {string} productName - 商品名稱
 * @param {string} buyerName - 買家名稱
 * @returns {object} 轉點結果
 */
function transferPointsToSeller(sellerUserId, points, productName, buyerName) {
  try {
    const membersSheet = getSheet(MEMBERS_SHEET);
    const data = membersSheet.getDataRange().getValues();
    
    // 找到販售者
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sellerUserId) {
        const sellerRow = i + 1;
        const sellerName = data[i][1];
        const sellerPoints = Number(data[i][7]) || 0;
        const newSellerPoints = sellerPoints + points;
        
        // 增加販售者點數
        membersSheet.getRange(sellerRow, 8).setValue(newSellerPoints);
        membersSheet.getRange(sellerRow, 17).setValue(new Date().toISOString());
        
        // 記錄販售者收到點數的交易
        addTransaction({
          type: 'mall_sale',
          senderUserId: buyerName, // 買家名稱
          senderName: buyerName,
          receiverUserId: sellerUserId,
          receiverName: sellerName,
          points: points,
          message: `商品售出：${productName}`,
          balanceAfter: newSellerPoints,
          status: 'completed'
        });
        
        Logger.log(`✅ 販售者 ${sellerName} 收到 ${points} 點`);
        
        return {
          success: true,
          sellerName: sellerName,
          points: points,
          newBalance: newSellerPoints
        };
      }
    }
    
    return {
      success: false,
      message: '找不到販售者'
    };
    
  } catch (error) {
    Logger.log('transferPointsToSeller Error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

