# GitHub Pages 部署指南

## 需要上傳的檔案

| 檔案 | 說明 | 必要 |
|------|------|------|
| `index.html` | 主頁面 | ✅ |
| `index.css` | 樣式檔 | ✅ |
| `app.js` | 核心邏輯 | ✅ |
| `bible-data.json` | 聖經資料 | ✅ |

> 📝 `BibleUNV.txt` 和 `convert-bible.js` 不需要上傳

---

## 部署步驟

### 1. 建立 GitHub Repository

1. 前往 [github.com/new](https://github.com/new)
2. Repository name: `bible-reader`（或任意名稱）
3. 設為 **Public**
4. 點擊 **Create repository**

### 2. 上傳檔案

**方法 A：使用 GitHub 網頁介面**
1. 點擊 **uploading an existing file**
2. 拖曳以下 4 個檔案：
   - `index.html`
   - `index.css`
   - `app.js`
   - `bible-data.json`
3. 點擊 **Commit changes**

**方法 B：使用 Git 命令**
```powershell
cd "d:\AI\Bible read aloud"
git init
git add index.html index.css app.js bible-data.json
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的帳號/bible-reader.git
git push -u origin main
```

### 3. 啟用 GitHub Pages

1. 進入 Repository → **Settings**
2. 左側選單點擊 **Pages**
3. Source 選擇 **Deploy from a branch**
4. Branch 選擇 **main** → **/ (root)**
5. 點擊 **Save**

### 4. 完成！

等待 1-2 分鐘後，你的網站將在以下網址可用：

```
https://你的帳號.github.io/bible-reader/
```

---

## 預期效能

| 項目 | 數值 |
|------|------|
| 首次載入時間 | 2-4 秒 |
| 後續載入時間 | <1 秒（快取） |
| 資料大小（gzip 壓縮後） | ~800 KB |

---

## 手機使用建議

1. 在手機瀏覽器開啟網站
2. 點擊「加入主畫面」或「新增到主螢幕」
3. 網站將如同 App 一樣可從主畫面啟動
4. 選擇經文範圍後，使用系統 TTS 朗讀功能

---

## 故障排除

| 問題 | 解決方案 |
|------|----------|
| 載入失敗 | 確認 4 個檔案都已上傳 |
| 頁面 404 | 等待幾分鐘讓 GitHub Pages 部署完成 |
| 資料載入慢 | 正常現象，首次載入後會快取 |
