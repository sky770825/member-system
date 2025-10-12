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
const MEMBERS_SHEET = 'Members';
const TRANSACTIONS_SHEET = 'Transactions';
const MEMBER_LEVELS_SHEET = 'MemberLevels';
const ACTIVITIES_SHEET = 'Activities';
const SETTINGS_SHEET = 'Settings';
const DAILY_STATS_SHEET = 'DailyStats';
const INITIAL_POINTS = 100; // 新會員註冊贈送點數

// 會員等級定義
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
          linePicture: e.parameter.linePicture || ''
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
 */
function doOptions(e) {
  return createCorsResponse({});
}

/**
 * 建立帶有 CORS 標頭的回應
 * 注意：Google Apps Script 的 Web App 在正確部署後會自動處理 CORS
 */
function createCorsResponse(data) {
  const jsonOutput = JSON.stringify(data);
  
  return ContentService.createTextOutput(jsonOutput)
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
      const referralCount = countReferrals(data[i][11]); // referralCode
      
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
        referralCode: data[i][11],        // 🎯 推薦碼
        referralCount: referralCount,     // 🎯 推薦人數
        createdAt: data[i][14],
        updatedAt: data[i][15]
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
    const referralCode = generateReferralCode(data.lineUserId);
    
    // 新增會員資料（包含新欄位）
    sheet.appendRow([
      data.lineUserId,
      data.name,
      data.phone,
      data.email || '',
      data.birthday || '',
      data.lineName || '',
      data.linePicture || '',
      initialPoints,
      memberLevel,
      initialPoints,  // totalEarned
      0,              // totalSpent
      referralCode,
      'active',       // status
      now,            // lastLoginAt
      now,            // createdAt
      now             // updatedAt
    ]);
    
    // 記錄註冊交易
    addTransaction({
      type: 'register',
      receiverUserId: data.lineUserId,
      receiverName: data.name,
      points: initialPoints,
      message: '新會員註冊贈送',
      balanceAfter: initialPoints,
      status: 'completed'
    });
    
    // 🎯 處理推薦獎勵
    let referralBonus = 0;
    let referrerName = '';
    if (data.referralCode && data.referralCode.trim() !== '') {
      const referralResult = processReferralReward(data.lineUserId, data.name, data.referralCode.trim());
      if (referralResult.success) {
        referralBonus = referralResult.newMemberBonus;
        referrerName = referralResult.referrerName;
        
        // 更新新會員點數
        const allData = sheet.getDataRange().getValues();
        for (let i = 1; i < allData.length; i++) {
          if (allData[i][0] === data.lineUserId) {
            const newPoints = initialPoints + referralBonus;
            sheet.getRange(i + 1, 8).setValue(newPoints); // points
            sheet.getRange(i + 1, 10).setValue(newPoints); // totalEarned
            break;
          }
        }
      }
    }
    
    // 記錄註冊活動
    logActivity(data.lineUserId, 'register', initialPoints, {
      name: data.name,
      phone: data.phone,
      referralCode: referralCode,
      referredBy: data.referralCode || null
    });
    
    const successMessage = referralBonus > 0 
      ? `註冊成功！獲得 ${initialPoints} 點 + 推薦獎勵 ${referralBonus} 點（推薦人：${referrerName}）` 
      : '註冊成功';
    
    return {
      success: true,
      message: successMessage,
      points: initialPoints + referralBonus,
      memberLevel: memberLevel,
      referralCode: referralCode,
      referralBonus: referralBonus
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
      status: 'completed'
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
      status: 'completed'
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
    const now = new Date().toISOString();
    
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
      data.status || 'completed',
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
        transactions.push({
          id: row[0],
          type: row[1],
          senderUserId: row[2],
          receiverUserId: row[3],
          senderName: row[4],
          receiverName: row[5],
          points: row[6],
          message: row[7],
          createdAt: row[8]
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
      members.push({
        lineUserId: data[i][0],
        name: data[i][1],
        phone: data[i][2],
        email: data[i][3],
        points: Number(data[i][7]),
        memberLevel: data[i][8] || 'BRONZE',
        totalEarned: Number(data[i][9]) || 0,
        totalSpent: Number(data[i][10]) || 0,
        referralCode: data[i][11],
        status: data[i][12] || 'active',
        lastLoginAt: data[i][13],
        createdAt: data[i][14]
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
      const createdDate = new Date(membersData[i][14]); // createdAt 在第15欄（索引14）
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
      'lineUserId',
      'name',
      'phone',
      'email',
      'birthday',
      'lineName',
      'linePicture',
      'points',
      'memberLevel',
      'totalEarned',
      'totalSpent',
      'referralCode',
      'status',
      'lastLoginAt',
      'createdAt',
      'updatedAt'
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 16);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    
  } else if (sheetName === TRANSACTIONS_SHEET) {
    sheet.appendRow([
      'id',
      'type',
      'senderUserId',
      'receiverUserId',
      'senderName',
      'receiverName',
      'points',
      'message',
      'balanceAfter',
      'status',
      'createdAt'
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 11);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#34a853');
    headerRange.setFontColor('#ffffff');
    
  } else if (sheetName === MEMBER_LEVELS_SHEET) {
    sheet.appendRow([
      'id',
      'levelCode',
      'levelName',
      'minPoints',
      'discount',
      'icon',
      'color',
      'isActive',
      'createdAt'
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 9);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#FF9800');
    headerRange.setFontColor('#ffffff');
    
    // 插入預設等級資料
    const now = new Date().toISOString();
    sheet.appendRow(['1', 'BRONZE', '銅級會員', 0, 0, '🥉', '#CD7F32', true, now]);
    sheet.appendRow(['2', 'SILVER', '銀級會員', 500, 0.05, '🥈', '#C0C0C0', true, now]);
    sheet.appendRow(['3', 'GOLD', '金級會員', 1000, 0.1, '🥇', '#FFD700', true, now]);
    sheet.appendRow(['4', 'PLATINUM', '白金會員', 5000, 0.15, '💎', '#E5E4E2', true, now]);
    
  } else if (sheetName === ACTIVITIES_SHEET) {
    sheet.appendRow([
      'id',
      'lineUserId',
      'activityType',
      'points',
      'metadata',
      'completedAt',
      'createdAt'
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#9C27B0');
    headerRange.setFontColor('#ffffff');
    
  } else if (sheetName === SETTINGS_SHEET) {
    sheet.appendRow([
      'key',
      'value',
      'type',
      'description',
      'category',
      'updatedBy',
      'updatedAt'
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#607D8B');
    headerRange.setFontColor('#ffffff');
    
    // 插入預設設定
    const now = new Date().toISOString();
    sheet.appendRow(['initialPoints', '100', 'number', '註冊贈送點數', 'points', 'system', now]);
    sheet.appendRow(['pointsExpiryDays', '365', 'number', '點數有效天數（0=永久）', 'points', 'system', now]);
    sheet.appendRow(['minTransferPoints', '1', 'number', '最小轉點數量', 'points', 'system', now]);
    sheet.appendRow(['maxTransferPoints', '10000', 'number', '最大轉點數量', 'points', 'system', now]);
    sheet.appendRow(['maintenanceMode', 'false', 'boolean', '維護模式', 'general', 'system', now]);
    
  } else if (sheetName === DAILY_STATS_SHEET) {
    sheet.appendRow([
      'date',
      'newMembers',
      'activeMembers',
      'totalTransactions',
      'pointsIssued',
      'pointsRedeemed',
      'createdAt'
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#00BCD4');
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
  if (points >= 5000) return 'PLATINUM';
  if (points >= 1000) return 'GOLD';
  if (points >= 500) return 'SILVER';
  return 'BRONZE';
}

/**
 * 生成推薦碼
 */
function generateReferralCode(lineUserId) {
  // 使用 userId 的最後 6 碼 + 隨機 2 碼
  const userPart = lineUserId.slice(-6).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 4).toUpperCase();
  return userPart + randomPart;
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
 * 處理推薦獎勵
 * @param {string} newMemberUserId - 新會員 LINE User ID
 * @param {string} newMemberName - 新會員姓名
 * @param {string} referralCode - 推薦碼
 * @returns {object} 處理結果
 */
function processReferralReward(newMemberUserId, newMemberName, referralCode) {
  try {
    // 驗證推薦碼
    const verifyResult = verifyReferralCode(referralCode);
    if (!verifyResult.success) {
      return {
        success: false,
        message: '推薦碼無效'
      };
    }
    
    const referrer = verifyResult.referrer;
    const REFERRAL_REWARD = 50; // 推薦獎勵點數
    
    const sheet = getSheet(MEMBERS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // 找到推薦人並增加點數
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === referrer.lineUserId) {
        const row = i + 1;
        const currentPoints = Number(data[i][7]) || 0;
        const totalEarned = Number(data[i][9]) || 0;
        const newPoints = currentPoints + REFERRAL_REWARD;
        const newTotalEarned = totalEarned + REFERRAL_REWARD;
        
        // 更新推薦人點數
        sheet.getRange(row, 8).setValue(newPoints); // points
        sheet.getRange(row, 10).setValue(newTotalEarned); // totalEarned
        sheet.getRange(row, 16).setValue(new Date().toISOString()); // updatedAt
        
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
        
        Logger.log(`推薦獎勵完成：推薦人 ${referrer.name} 和新會員 ${newMemberName} 各獲得 ${REFERRAL_REWARD} 點`);
        
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

// ==================== 工作表初始化函數 ====================

/**
 * 初始化所有新工作表（一次性執行）
 */
function initializeAllSheets() {
  try {
    // 初始化所有工作表
    getSheet(MEMBERS_SHEET);
    getSheet(TRANSACTIONS_SHEET);
    getSheet(MEMBER_LEVELS_SHEET);
    getSheet(ACTIVITIES_SHEET);
    getSheet(SETTINGS_SHEET);
    getSheet(DAILY_STATS_SHEET);
    
    Logger.log('所有工作表初始化完成！');
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
        const code = generateReferralCode(lineUserId);
        sheet.getRange(row, 12).setValue(code);
        Logger.log(`會員 ${data[i][1]}: 生成推薦碼 ${code}`);
      }
      
      // 如果沒有 status (第13欄)，補上
      if (!data[i][12]) {
        sheet.getRange(row, 13).setValue('active');
      }
      
      // 如果沒有 lastLoginAt (第14欄)，補上
      if (!data[i][13]) {
        sheet.getRange(row, 14).setValue(data[i][14] || data[i][8]); // 使用 updatedAt 或 createdAt
      }
    }
    
    Logger.log('遷移完成！所有會員資料已更新');
    return { success: true, message: '遷移完成' };
  } catch (error) {
    Logger.log('migrateExistingMembers Error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

