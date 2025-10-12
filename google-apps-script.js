/**
 * 會員註冊系統 - Google Apps Script
 * 用於 Google Sheets 作為資料庫
 * 
 * 工作表結構：
 * - Members: lineUserId, name, phone, email, birthday, lineName, linePicture, points, createdAt, updatedAt
 * - Transactions: id, type, senderUserId, receiverUserId, senderName, receiverName, points, message, createdAt
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
        createdAt: data[i][8],
        updatedAt: data[i][9]
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
    
    // 新增會員資料
    sheet.appendRow([
      data.lineUserId,
      data.name,
      data.phone,
      data.email || '',
      data.birthday || '',
      data.lineName || '',
      data.linePicture || '',
      INITIAL_POINTS,
      now,
      now
    ]);
    
    // 記錄註冊交易
    addTransaction({
      type: 'register',
      receiverUserId: data.lineUserId,
      receiverName: data.name,
      points: INITIAL_POINTS,
      message: '新會員註冊贈送'
    });
    
    return {
      success: true,
      message: '註冊成功',
      points: INITIAL_POINTS
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
      message: data.message || ''
    });
    
    // 記錄交易 (接收者)
    addTransaction({
      type: 'transfer_in',
      senderUserId: data.senderUserId,
      senderName: senderName,
      receiverUserId: data.receiverUserId,
      receiverName: receiverName,
      points: data.points,
      message: data.message || ''
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
        const newPoints = currentPoints + data.points;
        
        if (newPoints < 0) {
          return {
            success: false,
            message: '調整後點數不能為負數'
          };
        }
        
        sheet.getRange(row, 8).setValue(newPoints);
        sheet.getRange(row, 10).setValue(new Date().toISOString());
        
        // 記錄交易
        addTransaction({
          type: data.points > 0 ? 'admin_add' : 'admin_deduct',
          receiverUserId: data.lineUserId,
          receiverName: allData[i][1],
          points: data.points,
          message: data.reason || '管理員調整'
        });
        
        return {
          success: true,
          message: '調整成功',
          newPoints: newPoints
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
      'createdAt',
      'updatedAt'
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 10);
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
      'createdAt'
    ]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 9);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#34a853');
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

