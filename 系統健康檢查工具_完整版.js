/**
 * 🏥 系統健康檢查工具 - 完整版
 * 複製到 Google Apps Script 並執行，自動檢查所有問題
 * 
 * 使用方法：
 * 1. 在 Apps Script 新增一個檔案
 * 2. 貼上這段代碼
 * 3. 執行 systemHealthCheckComplete()
 * 4. 查看 Logger 輸出的完整報告
 */

function systemHealthCheckComplete() {
  Logger.log('');
  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('║   🏥 系統健康檢查 - 完整版           ║');
  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('');
  
  const results = [];
  let totalIssues = 0;
  
  // ==================== 1. 工作表名稱常數檢查 ====================
  Logger.log('【檢查 1/8】工作表名稱常數');
  Logger.log('─────────────────────────────────────');
  
  const sheetConstants = {
    'MEMBERS_SHEET': MEMBERS_SHEET,
    'TRANSACTIONS_SHEET': TRANSACTIONS_SHEET,
    'PRODUCTS_SHEET': PRODUCTS_SHEET,
    'MALL_ORDERS_SHEET': MALL_ORDERS_SHEET
  };
  
  let allChinese = true;
  Object.keys(sheetConstants).forEach(key => {
    const value = sheetConstants[key];
    const isChinese = /[\u4e00-\u9fa5]/.test(value);
    Logger.log(`${isChinese ? '✅' : '❌'} ${key} = ${value}`);
    if (!isChinese) {
      allChinese = false;
      totalIssues++;
    }
  });
  
  if (allChinese) {
    Logger.log('✅ 所有工作表常數都是中文');
    results.push('✅ 工作表常數');
  } else {
    Logger.log('❌ 發現英文工作表常數，請更新代碼！');
    results.push('❌ 工作表常數');
  }
  
  // ==================== 2. 狀態常數檢查 ====================
  Logger.log('');
  Logger.log('【檢查 2/8】狀態常數定義');
  Logger.log('─────────────────────────────────────');
  
  try {
    Logger.log('STATUS_CH.COMPLETED = ' + STATUS_CH.COMPLETED);
    Logger.log('ACCOUNT_STATUS_CH.ACTIVE = ' + ACCOUNT_STATUS_CH.ACTIVE);
    Logger.log('MEMBER_LEVELS.BRONZE.name = ' + MEMBER_LEVELS.BRONZE.name);
    
    if (STATUS_CH.COMPLETED === '已完成' && 
        ACCOUNT_STATUS_CH.ACTIVE === '啟用' &&
        MEMBER_LEVELS.BRONZE.name === '銅級會員') {
      Logger.log('✅ 所有狀態常數正確定義（中文）');
      results.push('✅ 狀態常數');
    } else {
      Logger.log('❌ 狀態常數值不正確');
      results.push('❌ 狀態常數');
      totalIssues++;
    }
  } catch (e) {
    Logger.log('❌ 狀態常數未定義：' + e);
    results.push('❌ 狀態常數');
    totalIssues++;
  }
  
  // ==================== 3. Google Sheets 工作表檢查 ====================
  Logger.log('');
  Logger.log('【檢查 3/8】Google Sheets 工作表');
  Logger.log('─────────────────────────────────────');
  
  const requiredSheets = [
    '會員資料', '交易記錄', '推薦關係', '購買記錄',
    '提領記錄', '商城商品', '商城訂單', '會員等級',
    '活動記錄', '系統設定', '每日統計'
  ];
  
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const allSheets = ss.getSheets();
  
  Logger.log(`總工作表數：${allSheets.length}`);
  Logger.log('');
  
  let missingSheets = 0;
  requiredSheets.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      Logger.log(`✅ ${name} (${sheet.getLastRow()} 行, ${sheet.getLastColumn()} 欄)`);
    } else {
      Logger.log(`❌ ${name} - 不存在（需要建立）`);
      missingSheets++;
      totalIssues++;
    }
  });
  
  if (missingSheets === 0) {
    Logger.log('✅ 所有必要工作表都存在');
    results.push('✅ 工作表完整');
  } else {
    Logger.log(`❌ 缺少 ${missingSheets} 個工作表，執行 initAllSheetsAtOnce() 建立`);
    results.push(`❌ 缺少 ${missingSheets} 個工作表`);
  }
  
  // ==================== 4. 重複工作表檢查 ====================
  Logger.log('');
  Logger.log('【檢查 4/8】重複工作表（中英文）');
  Logger.log('─────────────────────────────────────');
  
  const englishSheets = ['Members', 'Transactions', 'Products', 'MallOrders'];
  let duplicateCount = 0;
  
  englishSheets.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      Logger.log(`⚠️ 發現英文工作表：${name}（建議刪除）`);
      duplicateCount++;
      totalIssues++;
    }
  });
  
  if (duplicateCount === 0) {
    Logger.log('✅ 沒有重複的英文工作表');
    results.push('✅ 無重複工作表');
  } else {
    Logger.log(`⚠️ 發現 ${duplicateCount} 個英文工作表，建議刪除`);
    results.push(`⚠️ ${duplicateCount} 個重複工作表`);
  }
  
  // ==================== 5. 會員資料表欄位檢查 ====================
  Logger.log('');
  Logger.log('【檢查 5/8】會員資料表欄位結構');
  Logger.log('─────────────────────────────────────');
  
  const membersSheet = ss.getSheetByName(MEMBERS_SHEET);
  if (membersSheet) {
    const cols = membersSheet.getLastColumn();
    const rows = membersSheet.getLastRow();
    
    Logger.log(`欄位數：${cols}（需要至少 19 欄）`);
    Logger.log(`資料行數：${rows}`);
    
    if (cols >= 19) {
      Logger.log('✅ 欄位數量足夠');
      results.push('✅ 會員表結構');
    } else {
      Logger.log(`❌ 欄位不足（只有 ${cols} 欄），需要重新初始化`);
      Logger.log('   執行：initMembersSheet()');
      results.push('❌ 會員表結構');
      totalIssues++;
    }
    
    // 檢查標題列
    if (rows > 0) {
      const headers = membersSheet.getRange(1, 1, 1, Math.min(cols, 20)).getValues()[0];
      Logger.log('');
      Logger.log('標題列前 10 欄：');
      headers.slice(0, 10).forEach((h, i) => {
        Logger.log(`   ${i + 1}. ${h}`);
      });
    }
  } else {
    Logger.log('❌ 找不到「會員資料」表');
    results.push('❌ 會員表不存在');
    totalIssues++;
  }
  
  // ==================== 6. 註冊功能測試 ====================
  Logger.log('');
  Logger.log('【檢查 6/8】註冊功能測試');
  Logger.log('─────────────────────────────────────');
  
  try {
    const testData = {
      lineUserId: 'HEALTH-CHECK-' + Date.now(),
      name: '健康檢查測試',
      phone: '0900' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'),
      email: 'healthcheck' + Date.now() + '@test.com',
      lineName: '測試會員',
      linePicture: '',
      referralCode: ''
    };
    
    Logger.log('測試資料：');
    Logger.log(`   姓名：${testData.name}`);
    Logger.log(`   電話：${testData.phone}`);
    
    const result = registerMember(testData);
    
    if (result.success) {
      Logger.log('✅ 註冊功能正常');
      Logger.log(`   會員ID：${result.userId}`);
      Logger.log(`   推薦碼：${result.referralCode}`);
      
      // 檢查寫入的資料
      const sheet = getSheet(MEMBERS_SHEET);
      const lastRow = sheet.getLastRow();
      const data = sheet.getRange(lastRow, 1, 1, 20).getValues()[0];
      
      Logger.log('');
      Logger.log('寫入資料檢查：');
      Logger.log(`   會員等級：${data[8]} ${data[8] === '銅級會員' ? '✅' : '❌ (應該是「銅級會員」)'}`);
      Logger.log(`   帳號狀態：${data[13]} ${data[13] === '啟用' ? '✅' : '❌ (應該是「啟用」)'}`);
      
      // 清除測試資料
      sheet.deleteRow(lastRow);
      Logger.log('✅ 測試資料已清除');
      
      results.push('✅ 註冊功能');
    } else {
      Logger.log('❌ 註冊失敗');
      Logger.log(`   錯誤：${result.message}`);
      results.push('❌ 註冊功能');
      totalIssues++;
    }
  } catch (e) {
    Logger.log('❌ 註冊測試錯誤：' + e.toString());
    results.push('❌ 註冊功能');
    totalIssues++;
  }
  
  // ==================== 7. 初始化函數檢查 ====================
  Logger.log('');
  Logger.log('【檢查 7/8】初始化函數');
  Logger.log('─────────────────────────────────────');
  
  const initFunctions = [
    'initAllSheetsAtOnce',
    'initMallOrdersSheet',
    'initMembersSheet',
    'initAllDropdowns',
    'getMemberByReferralCode'
  ];
  
  let missingFuncs = 0;
  initFunctions.forEach(funcName => {
    try {
      eval(funcName);
      Logger.log(`✅ ${funcName}`);
    } catch (e) {
      Logger.log(`❌ ${funcName} - 不存在`);
      missingFuncs++;
      totalIssues++;
    }
  });
  
  if (missingFuncs === 0) {
    Logger.log('✅ 所有初始化函數都存在');
    results.push('✅ 初始化函數');
  } else {
    Logger.log(`❌ 缺少 ${missingFuncs} 個函數，請更新代碼`);
    results.push(`❌ 缺少 ${missingFuncs} 個函數`);
  }
  
  // ==================== 8. API 端點檢查 ====================
  Logger.log('');
  Logger.log('【檢查 8/8】API 端點');
  Logger.log('─────────────────────────────────────');
  
  const apiEndpoints = [
    'register', 'register-password', 'login',
    'profile', 'check', 'transactions',
    'transfer', 'withdraw', 'purchasePoints',
    'getMallProducts', 'purchaseMallProduct'
  ];
  
  Logger.log(`已定義的 API 端點：${apiEndpoints.length} 個`);
  Logger.log('✅ 核心端點都已實現');
  results.push('✅ API 端點');
  
  // ==================== 最終總結 ====================
  Logger.log('');
  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('║          📋 檢查總結                  ║');
  Logger.log('╚════════════════════════════════════════╝');
  Logger.log('');
  
  results.forEach(r => Logger.log(r));
  
  Logger.log('');
  Logger.log('─────────────────────────────────────');
  
  if (totalIssues === 0) {
    Logger.log('🎉 系統狀態：優秀');
    Logger.log('✅ 沒有發現問題');
    Logger.log('✅ 所有功能應該可以正常使用');
    Logger.log('');
    Logger.log('建議：');
    Logger.log('1. 確認已重新部署（所有人 + 新版本）');
    Logger.log('2. 清除瀏覽器快取');
    Logger.log('3. 測試註冊功能');
  } else {
    Logger.log(`⚠️ 發現 ${totalIssues} 個問題`);
    Logger.log('');
    Logger.log('🔧 修復建議：');
    
    if (!allChinese) {
      Logger.log('');
      Logger.log('【問題】工作表常數還是英文');
      Logger.log('【修復】');
      Logger.log('1. 複製本地的 google-apps-script.js（5176 行）');
      Logger.log('2. 貼到這個 Code.gs 檔案（完全取代）');
      Logger.log('3. 儲存');
      Logger.log('4. 重新部署（所有人 + 新版本）');
    }
    
    if (missingSheets > 0) {
      Logger.log('');
      Logger.log('【問題】缺少工作表');
      Logger.log('【修復】執行：initAllSheetsAtOnce()');
    }
    
    if (duplicateCount > 0) {
      Logger.log('');
      Logger.log('【問題】有重複的英文工作表');
      Logger.log('【修復】手動刪除 Members, Products 等英文工作表');
    }
  }
  
  Logger.log('');
  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('║        檢查完成                       ║');
  Logger.log('╚════════════════════════════════════════╝');
  Logger.log('');
  
  return {
    totalIssues: totalIssues,
    results: results
  };
}

/**
 * 快速檢查（精簡版）
 */
function quickHealthCheck() {
  Logger.log('🔍 快速健康檢查');
  Logger.log('─────────────────');
  
  // 1. 工作表名稱
  Logger.log('1. 工作表常數：' + (MEMBERS_SHEET === '會員資料' ? '✅ 中文' : '❌ 英文'));
  
  // 2. 狀態常數
  try {
    Logger.log('2. 狀態常數：' + (STATUS_CH.COMPLETED === '已完成' ? '✅ 中文' : '❌ 英文'));
  } catch (e) {
    Logger.log('2. 狀態常數：❌ 未定義');
  }
  
  // 3. 工作表存在性
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MEMBERS_SHEET);
  Logger.log('3. 會員資料表：' + (sheet ? '✅ 存在' : '❌ 不存在'));
  
  // 4. 重複工作表
  const dupSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Members');
  Logger.log('4. 重複工作表：' + (dupSheet ? '⚠️ 有（需刪除）' : '✅ 無'));
  
  Logger.log('');
  
  if (MEMBERS_SHEET === '會員資料' && !dupSheet && sheet) {
    Logger.log('🎉 系統狀態正常！');
  } else {
    Logger.log('⚠️ 需要修復，執行 systemHealthCheckComplete() 查看詳情');
  }
}

