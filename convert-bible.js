/**
 * 聖經資料轉換工具
 * 將 BibleUNV.txt 轉換為優化的 JSON 格式
 * 
 * 使用方式: node convert-bible.js
 */

const fs = require('fs');
const path = require('path');

// 書卷資料（與 app.js 一致）
const BOOK_DATA = [
    { abbr: '創', name: '創世記' },
    { abbr: '出', name: '出埃及記' },
    { abbr: '利', name: '利未記' },
    { abbr: '民', name: '民數記' },
    { abbr: '申', name: '申命記' },
    { abbr: '書', name: '約書亞記' },
    { abbr: '士', name: '士師記' },
    { abbr: '得', name: '路得記' },
    { abbr: '撒上', name: '撒母耳記上' },
    { abbr: '撒下', name: '撒母耳記下' },
    { abbr: '王上', name: '列王紀上' },
    { abbr: '王下', name: '列王紀下' },
    { abbr: '代上', name: '歷代志上' },
    { abbr: '代下', name: '歷代志下' },
    { abbr: '拉', name: '以斯拉記' },
    { abbr: '尼', name: '尼希米記' },
    { abbr: '斯', name: '以斯帖記' },
    { abbr: '伯', name: '約伯記' },
    { abbr: '詩', name: '詩篇' },
    { abbr: '箴', name: '箴言' },
    { abbr: '傳', name: '傳道書' },
    { abbr: '歌', name: '雅歌' },
    { abbr: '賽', name: '以賽亞書' },
    { abbr: '耶', name: '耶利米書' },
    { abbr: '哀', name: '耶利米哀歌' },
    { abbr: '結', name: '以西結書' },
    { abbr: '但', name: '但以理書' },
    { abbr: '何', name: '何西阿書' },
    { abbr: '珥', name: '約珥書' },
    { abbr: '摩', name: '阿摩司書' },
    { abbr: '俄', name: '俄巴底亞書' },
    { abbr: '拿', name: '約拿書' },
    { abbr: '彌', name: '彌迦書' },
    { abbr: '鴻', name: '那鴻書' },
    { abbr: '哈', name: '哈巴谷書' },
    { abbr: '番', name: '西番雅書' },
    { abbr: '該', name: '哈該書' },
    { abbr: '亞', name: '撒迦利亞書' },
    { abbr: '瑪', name: '瑪拉基書' },
    { abbr: '太', name: '馬太福音' },
    { abbr: '可', name: '馬可福音' },
    { abbr: '路', name: '路加福音' },
    { abbr: '約', name: '約翰福音' },
    { abbr: '徒', name: '使徒行傳' },
    { abbr: '羅', name: '羅馬書' },
    { abbr: '林前', name: '哥林多前書' },
    { abbr: '林後', name: '哥林多後書' },
    { abbr: '加', name: '加拉太書' },
    { abbr: '弗', name: '以弗所書' },
    { abbr: '腓', name: '腓立比書' },
    { abbr: '西', name: '歌羅西書' },
    { abbr: '帖前', name: '帖撒羅尼迦前書' },
    { abbr: '帖後', name: '帖撒羅尼迦後書' },
    { abbr: '提前', name: '提摩太前書' },
    { abbr: '提後', name: '提摩太後書' },
    { abbr: '多', name: '提多書' },
    { abbr: '門', name: '腓利門書' },
    { abbr: '來', name: '希伯來書' },
    { abbr: '雅', name: '雅各書' },
    { abbr: '彼前', name: '彼得前書' },
    { abbr: '彼後', name: '彼得後書' },
    { abbr: '約壹', name: '約翰一書' },
    { abbr: '約貳', name: '約翰二書' },
    { abbr: '約參', name: '約翰三書' },
    { abbr: '猶', name: '猶大書' },
    { abbr: '啟', name: '啟示錄' }
];

function convertBible() {
    console.log('開始轉換聖經資料...');

    // 讀取原始檔案
    const inputPath = path.join(__dirname, 'BibleUNV.txt');
    let text = fs.readFileSync(inputPath, 'utf-8');

    // 移除 BOM (Byte Order Mark) 字元
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
        console.log('已移除 BOM 字元');
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim());

    console.log(`讀取 ${lines.length} 行經文`);

    // 解析經文
    const bibleData = {};
    const bookChapters = {};
    const regex = /^([^0-9]+)(\d+):(\d+)(.*)$/;

    for (const line of lines) {
        const match = line.match(regex);
        if (!match) continue;

        const [, bookAbbr, chapter, verse, verseText] = match;
        const chapterNum = parseInt(chapter, 10);
        const verseNum = parseInt(verse, 10);

        if (!bibleData[bookAbbr]) {
            bibleData[bookAbbr] = {};
        }

        if (!bibleData[bookAbbr][chapterNum]) {
            bibleData[bookAbbr][chapterNum] = [];
        }

        // 使用陣列格式 [節次, 經文] 節省空間
        bibleData[bookAbbr][chapterNum].push([verseNum, verseText.trim()]);

        if (!bookChapters[bookAbbr] || chapterNum > bookChapters[bookAbbr]) {
            bookChapters[bookAbbr] = chapterNum;
        }
    }

    // 建立優化的資料結構
    const optimizedData = {
        // 書卷列表（只包含有資料的書卷）
        books: BOOK_DATA.filter(b => bibleData[b.abbr]).map(b => ({
            a: b.abbr,      // abbr
            n: b.name,      // name
            c: bookChapters[b.abbr]  // chapters count
        })),
        // 經文資料
        data: bibleData
    };

    // 寫入 JSON 檔案
    const outputPath = path.join(__dirname, 'bible-data.json');
    const jsonContent = JSON.stringify(optimizedData);
    fs.writeFileSync(outputPath, jsonContent, 'utf-8');

    // 統計
    const originalSize = fs.statSync(inputPath).size;
    const jsonSize = fs.statSync(outputPath).size;
    const reduction = ((1 - jsonSize / originalSize) * 100).toFixed(1);

    console.log('\n轉換完成！');
    console.log(`原始檔案大小: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`JSON 檔案大小: ${(jsonSize / 1024).toFixed(1)} KB`);
    console.log(`減少: ${reduction}%`);
    console.log(`\n輸出檔案: ${outputPath}`);
}

convertBible();
