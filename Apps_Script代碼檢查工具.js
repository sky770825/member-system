/**
 * Apps Script 代碼檢查工具
 * 複製這段代碼到 Apps Script 並執行，檢查是否為最新版本
 */

function checkAppsScriptVersion() {
  Logger.log('========================================');
  Logger.log('📊 Apps Script 版本檢查');
  Logger.log('========================================');
  
  // 1. 檢查工作表名稱常數
  Logger.log('\n【1】工作表名稱常數：');
  Logger.log('MEMBERS_SHEET = ' + MEMBERS_SHEET);
  Logger.log('TRANSACTIONS_SHEET = ' + TRANSACTIONS_SHEET);
  Logger.log('PRODUCTS_SHEET = ' + PRODUCTS_SHEET);
  Logger.log('MALL_ORDERS_SHEET = ' + MALL_ORDERS_SHEET);
  
  // 判斷版本
  if (MEMBERS_SHEET === '會員資料') {
    Logger.log('\n✅ 工作表名稱：最新版（中文）');
  } else {
    Logger.log('\n❌ 工作表名稱：舊版本（英文）');
    Logger.log('⚠️ 請立即更新 Apps Script 代碼！');
  }
  
  // 2. 檢查狀態常數是否存在
  Logger.log('\n【2】狀態常數檢查：');
  try {
    Logger.log('STATUS_CH.COMPLETED = ' + STATUS_CH.COMPLETED);
    Logger.log('✅ 狀態常數：已定義（最新版）');
  } catch (e) {
    Logger.log('❌ 狀態常數：未定義（舊版本）');
    Logger.log('⚠️ 請立即更新 Apps Script 代碼！');
  }
  
  // 3. 檢查初始化函數是否存在
  Logger.log('\n【3】初始化函數檢查：');
  const functions = [
    'initAllSheetsAtOnce',
    'initMallOrdersSheet',
    'initMembersSheet',
    'initAllDropdowns',
    'getMemberByReferralCode'
  ];
  
  functions.forEach(funcName => {
    try {
      const func = eval(funcName);
      Logger.log(`✅ ${funcName} - 存在`);
    } catch (e) {
      Logger.log(`❌ ${funcName} - 不存在（舊版本）`);
    }
  });
  
  // 4. 檢查 Google Sheets 工作表
  Logger.log('\n【4】Google Sheets 工作表檢查：');
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const allSheets = ss.getSheets();
  
  Logger.log(`總工作表數量：${allSheets.length}`);
  Logger.log('\n工作表列表：');
  allSheets.forEach(sheet => {
    const name = sheet.getName();
    const isChinese = /[\u4e00-\u9fa5]/.test(name);
    Logger.log(`${isChinese ? '✅' : '❌'} ${name}`);
  });
  
  // 5. 檢查是否有重複工作表
  Logger.log('\n【5】重複工作表檢查：');
  const chineseSheets = ['會員資料', '交易記錄', '商城商品', '商城訂單'];
  const englishSheets = ['Members', 'Transactions', 'Products', 'MallOrders'];
  
  let hasDuplicates = false;
  chineseSheets.forEach((cnName, index) => {
    const enName = englishSheets[index];
    const hasCn = ss.getSheetByName(cnName) !== null;
    const hasEn = ss.getSheetByName(enName) !== null;
    
    if (hasCn && hasEn) {
      Logger.log(`⚠️ 重複：${cnName} 和 ${enName} 都存在`);
      hasDuplicates = true;
    }
  });
  
  if (!hasDuplicates) {
    Logger.log('✅ 沒有重複的工作表');
  }
  
  // 6. 最終判斷
  Logger.log('\n========================================');
  Logger.log('📋 最終檢查結果：');
  Logger.log('========================================');
  
  if (MEMBERS_SHEET === '會員資料' && typeof STATUS_CH !== 'undefined') {
    Logger.log('✅ Apps Script 代碼：最新版本（v5.2）');
    Logger.log('✅ 可以正常使用！');
  } else {
    Logger.log('❌ Apps Script 代碼：舊版本');
    Logger.log('');
    Logger.log('⚠️⚠️⚠️ 緊急修復步驟：');
    Logger.log('1. 複製本地的 google-apps-script.js（5176 行）');
    Logger.log('2. 貼到這個 Code.gs 檔案（完全取代）');
    Logger.log('3. 儲存');
    Logger.log('4. 重新部署（選擇：新版本 + 所有人）');
  }
  
  Logger.log('========================================');
}

