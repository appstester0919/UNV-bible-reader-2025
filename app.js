/**
 * 聖經朗讀網頁應用程式
 * 和合本聖經經文範圍顯示工具
 * 優化版本 - 使用 JSON 資料格式
 */

// ===== 應用程式狀態 =====
const state = {
    books: [],          // [{ abbr, name, chapters }]
    bibleData: {},      // { bookAbbr: { chapter: [[verse, text]] } }
    fontSize: 20,
    isLoading: true
};

// ===== DOM 元素 =====
const elements = {};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', init);

async function init() {
    cacheElements();
    bindEvents();
    await loadBibleData();
}

function cacheElements() {
    elements.startBook = document.getElementById('startBook');
    elements.startChapter = document.getElementById('startChapter');
    elements.endBook = document.getElementById('endBook');
    elements.endChapter = document.getElementById('endChapter');
    elements.displayBtn = document.getElementById('displayBtn');
    elements.toolbar = document.getElementById('toolbar');
    elements.fontDecrease = document.getElementById('fontDecrease');
    elements.fontIncrease = document.getElementById('fontIncrease');
    elements.fontSizeDisplay = document.getElementById('fontSizeDisplay');
    elements.showVerseNumbers = document.getElementById('showVerseNumbers');
    elements.scrollTop = document.getElementById('scrollTop');
    elements.loadingMessage = document.getElementById('loadingMessage');
    elements.scriptureContent = document.getElementById('scriptureContent');
}

function bindEvents() {
    // 書卷選擇事件
    elements.startBook.addEventListener('change', () => {
        updateChapterSelect(elements.startBook, elements.startChapter);
        updateDisplayButton();
    });
    elements.endBook.addEventListener('change', () => {
        updateChapterSelect(elements.endBook, elements.endChapter);
        updateDisplayButton();
    });

    // 章節選擇事件
    elements.startChapter.addEventListener('change', updateDisplayButton);
    elements.endChapter.addEventListener('change', updateDisplayButton);

    // 顯示經文按鈕
    elements.displayBtn.addEventListener('click', displayScripture);

    // 字體大小控制
    elements.fontDecrease.addEventListener('click', () => adjustFontSize(-2));
    elements.fontIncrease.addEventListener('click', () => adjustFontSize(2));

    // 節次顯示切換
    elements.showVerseNumbers.addEventListener('change', toggleVerseNumbers);

    // 回到頂部
    elements.scrollTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== 載入聖經資料 =====
async function loadBibleData() {
    try {
        const response = await fetch('bible-data.json');
        if (!response.ok) throw new Error('無法載入聖經資料');

        const data = await response.json();

        // 儲存書卷列表
        state.books = data.books.map(b => ({
            abbr: b.a,
            name: b.n,
            chapters: b.c
        }));

        // 儲存經文資料
        state.bibleData = data.data;

        populateBookSelects();
        elements.loadingMessage.classList.add('hidden');
        state.isLoading = false;

    } catch (error) {
        console.error('載入錯誤:', error);
        elements.loadingMessage.innerHTML = `
            <p style="color: #ef4444;">❌ 載入失敗</p>
            <p style="font-size: 0.9rem; margin-top: 8px;">${error.message}</p>
            <p style="font-size: 0.85rem; margin-top: 16px; color: var(--text-muted);">
                提示：請確保 bible-data.json 檔案與 index.html 在同一資料夾中
            </p>
        `;
    }
}

// ===== 填充選擇器 =====
function populateBookSelects() {
    const optionsHTML = state.books
        .map(book => `<option value="${book.abbr}">${book.name}</option>`)
        .join('');

    const defaultOption = '<option value="">選擇書卷</option>';
    elements.startBook.innerHTML = defaultOption + optionsHTML;
    elements.endBook.innerHTML = defaultOption + optionsHTML;
}

function updateChapterSelect(bookSelect, chapterSelect) {
    const bookAbbr = bookSelect.value;

    if (!bookAbbr) {
        chapterSelect.innerHTML = '<option value="">章</option>';
        chapterSelect.disabled = true;
        return;
    }

    const book = state.books.find(b => b.abbr === bookAbbr);
    const maxChapter = book ? book.chapters : 1;
    const options = ['<option value="">選擇章節</option>'];

    for (let i = 1; i <= maxChapter; i++) {
        options.push(`<option value="${i}">${i} 章</option>`);
    }

    chapterSelect.innerHTML = options.join('');
    chapterSelect.disabled = false;
}

function updateDisplayButton() {
    const startBook = elements.startBook.value;
    const startChapter = elements.startChapter.value;
    const endBook = elements.endBook.value;
    const endChapter = elements.endChapter.value;

    const isValid = startBook && startChapter && endBook && endChapter;
    elements.displayBtn.disabled = !isValid;
}

// ===== 顯示經文 =====
function displayScripture() {
    const startBook = elements.startBook.value;
    const startChapter = parseInt(elements.startChapter.value, 10);
    const endBook = elements.endBook.value;
    const endChapter = parseInt(elements.endChapter.value, 10);

    // 取得書卷索引
    const startBookIndex = state.books.findIndex(b => b.abbr === startBook);
    const endBookIndex = state.books.findIndex(b => b.abbr === endBook);

    // 驗證範圍
    if (startBookIndex > endBookIndex) {
        alert('起始書卷必須在結束書卷之前或相同');
        return;
    }

    if (startBookIndex === endBookIndex && startChapter > endChapter) {
        alert('起始章節必須在結束章節之前或相同');
        return;
    }

    // 收集經文
    const chapters = [];

    for (let bookIdx = startBookIndex; bookIdx <= endBookIndex; bookIdx++) {
        const book = state.books[bookIdx];
        if (!state.bibleData[book.abbr]) continue;

        // 決定章節範圍
        let chapStart = 1;
        let chapEnd = book.chapters;

        if (bookIdx === startBookIndex) {
            chapStart = startChapter;
        }
        if (bookIdx === endBookIndex) {
            chapEnd = endChapter;
        }

        for (let chap = chapStart; chap <= chapEnd; chap++) {
            const verses = state.bibleData[book.abbr][chap];
            if (verses && verses.length > 0) {
                chapters.push({
                    bookName: book.name,
                    chapter: chap,
                    // 轉換 [verse, text] 格式
                    verses: verses.map(v => ({ verse: v[0], text: v[1] }))
                });
            }
        }
    }

    // 渲染經文
    renderScripture(chapters);

    // 顯示工具列
    elements.toolbar.style.display = 'flex';

    // 滾動到經文區
    elements.scriptureContent.scrollIntoView({ behavior: 'smooth' });
}

function renderScripture(chapters) {
    if (chapters.length === 0) {
        elements.scriptureContent.innerHTML = `
            <div class="chapter-block">
                <p style="color: var(--text-secondary);">找不到符合條件的經文</p>
            </div>
        `;
        return;
    }

    const html = chapters.map(chapter => {
        const versesHTML = chapter.verses
            .map(v => `
                <div class="verse">
                    <span class="verse-number">${v.verse}</span>
                    <span class="verse-text">${v.text}</span>
                </div>
            `)
            .join('');

        return `
            <article class="chapter-block">
                <h2 class="chapter-title">${chapter.bookName} ${chapter.chapter} 章</h2>
                ${versesHTML}
            </article>
        `;
    }).join('');

    elements.scriptureContent.innerHTML = html;
}

// ===== 字體大小調整 =====
function adjustFontSize(delta) {
    const newSize = Math.max(14, Math.min(36, state.fontSize + delta));
    if (newSize === state.fontSize) return;

    state.fontSize = newSize;
    elements.fontSizeDisplay.textContent = newSize;
    elements.scriptureContent.style.fontSize = `${newSize}px`;
}

// ===== 節次顯示切換 =====
function toggleVerseNumbers() {
    const showNumbers = elements.showVerseNumbers.checked;
    if (showNumbers) {
        elements.scriptureContent.classList.remove('hide-verse-numbers');
    } else {
        elements.scriptureContent.classList.add('hide-verse-numbers');
    }
}
