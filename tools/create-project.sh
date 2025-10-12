#!/bin/bash

# 會員系統專案生成工具
# 用法: ./create-project.sh <產業類型> <專案名稱> <公司名稱>
# 範例: ./create-project.sh restaurant my-restaurant "美味餐廳"

set -e

INDUSTRY=$1
PROJECT_NAME=$2
COMPANY_NAME=$3

if [ -z "$INDUSTRY" ] || [ -z "$PROJECT_NAME" ] || [ -z "$COMPANY_NAME" ]; then
    echo "❌ 使用方式: ./create-project.sh <產業類型> <專案名稱> <公司名稱>"
    echo "產業類型: restaurant, beauty, fitness, retail, coffee, general"
    echo "範例: ./create-project.sh restaurant my-restaurant '美味餐廳'"
    exit 1
fi

echo "🚀 開始創建專案: $PROJECT_NAME"
echo "📁 產業類型: $INDUSTRY"
echo "🏢 公司名稱: $COMPANY_NAME"
echo ""

# 創建專案資料夾
mkdir -p "../$PROJECT_NAME"
cd "../$PROJECT_NAME"

echo "✅ 步驟 1/5: 創建資料夾結構..."
mkdir -p assets
mkdir -p docs

echo "✅ 步驟 2/5: 複製核心文件..."
# 複製 HTML 文件
cp ../會員註冊系統/index.html .
cp ../會員註冊系統/register.html .
cp ../會員註冊系統/profile.html .
cp ../會員註冊系統/transfer.html .
cp ../會員註冊系統/edit.html .
cp ../會員註冊系統/history.html .

# 複製樣式
cp ../會員註冊系統/assets/style.css assets/

# 複製 Google Apps Script
cp ../會員註冊系統/google-apps-script.js .

echo "✅ 步驟 3/5: 創建配置文件..."
# 根據產業類型複製配置
if [ -f "../會員註冊系統/templates/${INDUSTRY}-config.js" ]; then
    cp "../會員註冊系統/templates/${INDUSTRY}-config.js" config.js
    echo "   使用 ${INDUSTRY} 產業模板"
else
    cp "../會員註冊系統/config.template.js" config.js
    echo "   使用通用模板"
fi

# 替換公司名稱（macOS 和 Linux 兼容）
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/您的公司名稱/$COMPANY_NAME/g" config.js
else
    # Linux
    sed -i "s/您的公司名稱/$COMPANY_NAME/g" config.js
fi

echo "✅ 步驟 4/5: 創建說明文件..."
cat > README.md << EOF
# $COMPANY_NAME 會員系統

基於通用會員系統模板建立

## 🚀 快速開始

1. 編輯 \`config.js\` 填入您的設定
2. 部署 \`google-apps-script.js\` 到 Google Apps Script
3. 設定 LINE LIFF
4. 部署到 GitHub Pages

## 📁 專案結構

- \`index.html\` - 首頁
- \`register.html\` - 註冊頁面
- \`profile.html\` - 會員中心
- \`transfer.html\` - 轉點頁面
- \`config.js\` - 配置文件 ⭐
- \`google-apps-script.js\` - 後端 API

## 📞 技術支援

如有問題請聯繫系統開發商

---

建立時間: $(date +"%Y-%m-%d")
產業類型: $INDUSTRY
EOF

cat > .gitignore << EOF
# 本地開發
.DS_Store
Thumbs.db
*.log

# 敏感資訊（如果有的話）
config.local.js
.env

# 編輯器
.vscode/
.idea/
*.swp
EOF

echo "✅ 步驟 5/5: 初始化 Git..."
git init
git add .
git commit -m "初始化 $COMPANY_NAME 會員系統"

echo ""
echo "🎉 專案創建完成！"
echo ""
echo "📁 專案位置: $(pwd)"
echo ""
echo "📋 接下來的步驟:"
echo "1. 編輯 config.js 填入您的設定"
echo "2. 將 Logo 放到 assets/logo.png"
echo "3. 設定 Google Apps Script"
echo "4. 設定 LINE LIFF"
echo "5. 推送到 GitHub:"
echo "   git remote add origin https://github.com/您的帳號/$PROJECT_NAME.git"
echo "   git push -u origin main"
echo ""
echo "✨ 祝您使用愉快！"

