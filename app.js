/**
 * 聖經朗讀網頁應用程式
 * 和合本聖經經文範圍顯示工具
 * 古典聖經風格重新設計 (2026-04-08)
 */

// ===== 書卷類別定義 =====
const BOOK_CATEGORIES = {
    'pentateuch': {
        name: '摩西五經',
        cssClass: 'cat-pentateuch',
        books: ['創', '出', '利', '民', '申']
    },
    'history': {
        name: '歷史書',
        cssClass: 'cat-history',
        books: ['書', '士', '得', '撒上', '撒下', '王上', '王下', '代上', '代下', '拉', '尼', '斯']
    },
    'wisdom': {
        name: '智慧書',
        cssClass: 'cat-wisdom',
        books: ['伯', '詩', '箴', '傳', '歌']
    },
    'majorProphets': {
        name: '大先知書',
        cssClass: 'cat-major-prophets',
        books: ['賽', '耶', '哀', '結', '但']
    },
    'minorProphets': {
        name: '小先知書',
        cssClass: 'cat-minor-prophets',
        books: ['何', '珥', '摩', '俄', '拿', '彌', '鴻', '哈', '番', '該', '亞', '瑪']
    },
    'gospels': {
        name: '福音書與歷史',
        cssClass: 'cat-gospels',
        books: ['太', '可', '路', '約', '徒']
    },
    'pauline': {
        name: '保羅書信',
        cssClass: 'cat-pauline',
        books: ['羅', '林前', '林後', '加', '弗', '腓', '西', '帖前', '帖後', '提前', '提後', '多', '門']
    },
    'general': {
        name: '一般書信',
        cssClass: 'cat-general',
        books: ['來', '雅', '彼前', '彼後', '約壹', '約貳', '約參', '猶', '啟']
    }
};

// 建立書卷簡稱到類別的對應表
const bookToCategory = {};
for (const [catKey, catData] of Object.entries(BOOK_CATEGORIES)) {
    for (const abbr of catData.books) {
        bookToCategory[abbr] = catData.cssClass;
    }
}

// ===== 應用程式狀態 =====
const state = {
    books: [],          // [{ abbr, name, chapters }]
    bibleData: {},      // { bookAbbr: { chapter: [[verse, text]] } }
    fontSize: 20,
    isLoading: true,
    // 選擇狀態
    startBook: null,    // { abbr, name, chapters }
    startChapter: null,
    endBook: null,
    endChapter: null,
    // 音頻播放狀態
    audioQueue: [],     // [{ bookAbbr, chapter, label }]
    currentAudio: null, // HTMLAudioElement
    currentChapterIndex: 0,
    isPlaying: false,
    playbackRate: 1.0,
    isPreloading: false
};

// ===== DOM 元素 =====
const elements = {};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', init);

async function init() {
    cacheElements();
    bindEvents();
    initAudio();
    await loadBibleData();
}

function cacheElements() {
    // 選擇顯示
    elements.startSelectionDisplay = document.getElementById('startSelectionDisplay');
    elements.endSelectionDisplay = document.getElementById('endSelectionDisplay');

    // 格子容器
    elements.startBookGrid = document.getElementById('startBookGrid');
    elements.startChapterGrid = document.getElementById('startChapterGrid');
    elements.endBookGrid = document.getElementById('endBookGrid');
    elements.endChapterGrid = document.getElementById('endChapterGrid');

    // 提示
    elements.endSelectionHint = document.getElementById('endSelectionHint');
    elements.startHintText = document.getElementById('startHintText');

    // 按鈕和其他
    elements.displayBtn = document.getElementById('displayBtn');
    elements.toolbar = document.getElementById('toolbar');
    elements.fontDecrease = document.getElementById('fontDecrease');
    elements.fontIncrease = document.getElementById('fontIncrease');
    elements.fontSizeDisplay = document.getElementById('fontSizeDisplay');
    elements.showVerseNumbers = document.getElementById('showVerseNumbers');
    elements.scrollTop = document.getElementById('scrollTop');
    elements.loadingMessage = document.getElementById('loadingMessage');
    elements.scriptureContent = document.getElementById('scriptureContent');

    // Fixed Player Bar elements
    elements.playerBar = document.getElementById('playerBar');
    elements.playerChapterDisplay = document.getElementById('playerChapterDisplay');
    elements.playBtn = document.getElementById('playBtn');
    elements.stopBtn = document.getElementById('stopBtn');
    elements.playIcon = document.getElementById('playIcon');
    elements.pauseIcon = document.getElementById('pauseIcon');
    elements.playBtnText = document.getElementById('playBtnText');
    elements.speedBtns = document.querySelectorAll('.speed-btn');
    elements.speedSelect = document.getElementById('playerSpeedSelect');
    elements.prevChapterBtn = document.getElementById('prevChapterBtn');
    elements.nextChapterBtn = document.getElementById('nextChapterBtn');
}

function bindEvents() {
    // 選擇顯示區點擊事件（下拉展開）
    elements.startSelectionDisplay.addEventListener('click', () => toggleDropdown('start', 'book'));
    elements.endSelectionDisplay.addEventListener('click', () => toggleDropdown('end', 'book'));

    // 點擊外部關閉下拉選單
    document.addEventListener('click', handleOutsideClick);

    // 顯示經文按鈕
    elements.displayBtn.addEventListener('click', displayScripture);

    // 字體大小控制 (player bar)
    elements.fontDecrease.addEventListener('click', () => adjustFontSize(-2));
    elements.fontIncrease.addEventListener('click', () => adjustFontSize(2));

    // 節次顯示切換
    elements.showVerseNumbers.addEventListener('change', toggleVerseNumbers);

    // 回到頂部
    elements.scrollTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== 音頻播放器初始化 =====
function initAudio() {
    // 創建音頻元素
    state.audioQueue = [];
    state.currentAudio = null;
    state.currentChapterIndex = 0;
    state.isPlaying = false;
    state.playbackRate = 1.0;

    // 綁定播放按鈕事件
    if (elements.playBtn) {
        elements.playBtn.addEventListener('click', togglePlay);
    }
    if (elements.stopBtn) {
        elements.stopBtn.addEventListener('click', stopAudio);
    }

    // 綁定速度按鈕事件
    if (elements.speedBtns) {
        elements.speedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const rate = parseFloat(btn.dataset.rate);
                setPlaybackRate(rate);
            });
        });
    }

    // 速度下拉選單（Mobile）
    if (elements.speedSelect) {
        elements.speedSelect.addEventListener('change', (e) => {
            const rate = parseFloat(e.target.value);
            setPlaybackRate(rate);
        });
    }

    // 綁定上一章/下一章按鈕
    if (elements.prevChapterBtn) {
        elements.prevChapterBtn.addEventListener('click', goToPrevChapter);
    }
    if (elements.nextChapterBtn) {
        elements.nextChapterBtn.addEventListener('click', goToNextChapter);
    }

    updatePlayButton();
    updateSpeedButtons();
    updatePlayerChapterDisplay();
}

// ===== 上一章 / 下一章 導航 =====
function goToPrevChapter() {
    if (state.audioQueue.length === 0) return;

    // 移動到上一章
    state.currentChapterIndex--;

    // 如果到了最開始，環繞到最後一章
    if (state.currentChapterIndex < 0) {
        state.currentChapterIndex = state.audioQueue.length - 1;
    }

    // 停止當前音頻並載入新章節
    if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio = null;
    }

    const item = state.audioQueue[state.currentChapterIndex];
    if (item) {
        loadAudio(item);
    }

    updatePlayerChapterDisplay();
}

function goToNextChapter() {
    if (state.audioQueue.length === 0) return;

    // 移動到下一章
    state.currentChapterIndex++;

    // 如果到了最後，環繞到第一章
    if (state.currentChapterIndex >= state.audioQueue.length) {
        state.currentChapterIndex = 0;
    }

    // 停止當前音頻並載入新章節
    if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio = null;
    }

    const item = state.audioQueue[state.currentChapterIndex];
    if (item) {
        loadAudio(item);
    }

    updatePlayerChapterDisplay();
}

// ===== 音頻播放控制 =====
function togglePlay() {
    if (state.isPlaying) {
        pauseAudio();
    } else {
        playAudio();
    }
}

function playAudio() {
    if (!state.audioQueue || state.audioQueue.length === 0) {
        console.log('No audio queue to play');
        return;
    }

    if (state.currentChapterIndex >= state.audioQueue.length) {
        // 播放完畢，重置
        state.currentChapterIndex = 0;
    }

    const currentItem = state.audioQueue[state.currentChapterIndex];
    if (!currentItem) return;

    // 如果沒有當前音頻或已停止，創建新的
    if (!state.currentAudio) {
        loadAudio(currentItem);
    } else {
        state.currentAudio.play();
    }

    state.isPlaying = true;
    updatePlayButton();
    updatePlayerChapterDisplay();
}

function pauseAudio() {
    if (state.currentAudio) {
        state.currentAudio.pause();
    }
    state.isPlaying = false;
    updatePlayButton();
}

function stopAudio() {
    if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio.currentTime = 0;
        state.currentAudio = null;
    }
    state.isPlaying = false;
    state.currentChapterIndex = 0;
    updatePlayButton();
    updatePlayerChapterDisplay();
}

function loadAudio(item) {
    if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio = null;
    }

    // 構建音頻 URL
    const audioSrc = `audio/${item.bookAbbr}/${item.bookAbbr}${item.chapter}.mp3`;
    const audio = new Audio(audioSrc);

    audio.addEventListener('loadeddata', () => {
        console.log(`Audio loaded: ${audioSrc}`);
    });

    audio.addEventListener('error', (e) => {
        console.error(`Audio load error: ${audioSrc}`, e);
        // 嘗試播放下一章
        onAudioEnded();
    });

    audio.addEventListener('ended', onAudioEnded);

    audio.playbackRate = state.playbackRate;
    state.currentAudio = audio;
    state.isPlaying = true;

    audio.play().catch(err => {
        console.error('Playback error:', err);
        state.isPlaying = false;
        updatePlayButton();
    });

    updatePlayButton();
    updatePlayerChapterDisplay();
}

function onAudioEnded() {
    // 播放下一章
    state.currentChapterIndex++;

    if (state.currentChapterIndex < state.audioQueue.length) {
        // 預載下一章
        preloadNextChapter();
        // 播放下一章
        const nextItem = state.audioQueue[state.currentChapterIndex];
        loadAudio(nextItem);
    } else {
        // 所有章節播放完畢
        state.isPlaying = false;
        state.currentChapterIndex = 0;
        updatePlayButton();
        updatePlayerChapterDisplay();
    }
}

function preloadNextChapter() {
    if (state.isPreloading) return;

    const nextIndex = state.currentChapterIndex + 1;
    if (nextIndex >= state.audioQueue.length) return;

    state.isPreloading = true;

    // 創建隱藏的音頻元素進行預載
    const nextItem = state.audioQueue[nextIndex];
    const audioSrc = `audio/${nextItem.bookAbbr}/${nextItem.bookAbbr}${nextItem.chapter}.mp3`;
    const preloadAudio = new Audio(audioSrc);

    preloadAudio.addEventListener('canplay', () => {
        console.log(`Preloaded: ${audioSrc}`);
        state.isPreloading = false;
    }, { once: true });

    preloadAudio.addEventListener('error', () => {
        console.error(`Preload error: ${audioSrc}`);
        state.isPreloading = false;
    }, { once: true });
}

function setPlaybackRate(rate) {
    state.playbackRate = rate;

    if (state.currentAudio) {
        state.currentAudio.playbackRate = rate;
    }

    updateSpeedButtons();
}

function updatePlayButton() {
    if (!elements.playBtn) return;

    if (state.isPlaying) {
        elements.playIcon.classList.add('hidden');
        elements.pauseIcon.classList.remove('hidden');
        elements.playBtnText.textContent = '暫停';
        elements.playBtn.classList.add('playing');
    } else {
        elements.playIcon.classList.remove('hidden');
        elements.pauseIcon.classList.add('hidden');
        elements.playBtnText.textContent = '播放';
        elements.playBtn.classList.remove('playing');
    }
}

function updateSpeedButtons() {
    if (!elements.speedBtns) return;

    elements.speedBtns.forEach(btn => {
        const rate = parseFloat(btn.dataset.rate);
        if (Math.abs(rate - state.playbackRate) < 0.01) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Also sync mobile dropdown
    if (elements.speedSelect) {
        elements.speedSelect.value = state.playbackRate.toString();
    }
}

function updatePlayerChapterDisplay() {
    if (!elements.playerChapterDisplay) return;

    if (state.audioQueue.length === 0) {
        elements.playerChapterDisplay.querySelector('.player-chapter-text').textContent = '創世記 1:1-31';
        return;
    }

    const currentItem = state.audioQueue[state.currentChapterIndex];
    if (currentItem) {
        elements.playerChapterDisplay.querySelector('.player-chapter-text').textContent = currentItem.label;
    }
}

// ===== 下拉選單控制 =====
function toggleDropdown(type, target) {
    const bookGrid = type === 'start' ? elements.startBookGrid : elements.endBookGrid;
    const chapterGrid = type === 'start' ? elements.startChapterGrid : elements.endChapterGrid;
    const display = type === 'start' ? elements.startSelectionDisplay : elements.endSelectionDisplay;

    // 先關閉另一邊的所有下拉
    const otherType = type === 'start' ? 'end' : 'start';
    closeDropdown(otherType);

    if (target === 'book') {
        // 切換書卷格子
        const isVisible = bookGrid.classList.contains('visible');
        if (isVisible) {
            closeDropdown(type);
        } else {
            bookGrid.classList.add('visible');
            chapterGrid.classList.remove('visible');
            display.classList.add('active');
        }
    } else if (target === 'chapter') {
        // 顯示章節格子
        bookGrid.classList.remove('visible');
        chapterGrid.classList.add('visible');
    }
}

function closeDropdown(type) {
    const bookGrid = type === 'start' ? elements.startBookGrid : elements.endBookGrid;
    const chapterGrid = type === 'start' ? elements.startChapterGrid : elements.endChapterGrid;
    const display = type === 'start' ? elements.startSelectionDisplay : elements.endSelectionDisplay;

    bookGrid.classList.remove('visible');
    chapterGrid.classList.remove('visible');
    display.classList.remove('active');
}

function closeAllDropdowns() {
    closeDropdown('start');
    closeDropdown('end');
}

function handleOutsideClick(event) {
    // 檢查是否點擊在選擇器區域外
    const startWrapper = elements.startBookGrid.closest('.book-grid-wrapper');
    const endWrapper = elements.endBookGrid.closest('.book-grid-wrapper');

    if (startWrapper && !startWrapper.contains(event.target) &&
        !elements.startSelectionDisplay.contains(event.target)) {
        closeDropdown('start');
    }
    if (endWrapper && !endWrapper.contains(event.target) &&
        !elements.endSelectionDisplay.contains(event.target)) {
        closeDropdown('end');
    }
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

        // 建立格子選擇器
        createBookGrids();

        elements.loadingMessage.classList.add('hidden');
        state.isLoading = false;

    } catch (error) {
        console.error('載入錯誤:', error);
        elements.loadingMessage.innerHTML = `
            <p style="color: #8B5E3C;">載入失敗</p>
            <p style="font-size: 0.9rem; margin-top: 8px;">${error.message}</p>
            <p style="font-size: 0.85rem; margin-top: 16px; color: var(--text-muted);">
                提示：請確保 bible-data.json 檔案與 index.html 在同一資料夾中
            </p>
        `;
    }
}

// ===== 建立書卷格子 =====
function createBookGrids() {
    renderBookGrid(elements.startBookGrid, 'start');
    renderBookGrid(elements.endBookGrid, 'end');
}

function renderBookGrid(container, type) {
    container.innerHTML = '';

    state.books.forEach((book, index) => {
        const cell = document.createElement('div');
        cell.className = `book-cell ${bookToCategory[book.abbr] || ''}`;
        cell.textContent = book.abbr;
        cell.dataset.abbr = book.abbr;
        cell.dataset.index = index;
        cell.title = book.name;

        // 對於結束選擇器，根據起始選擇標記
        if (type === 'end' && state.startBook) {
            const startIndex = state.books.findIndex(b => b.abbr === state.startBook.abbr);
            if (index < startIndex) {
                cell.classList.add('before-start');
            }
        }

        cell.addEventListener('click', () => handleBookClick(book, type));
        container.appendChild(cell);
    });
}

function handleBookClick(book, type) {
    // 更新選擇狀態
    if (type === 'start') {
        state.startBook = book;
        state.startChapter = null;
        // 清除結束選擇（起始改變時）
        state.endBook = null;
        state.endChapter = null;
        updateSelectionDisplay('end');
        elements.endChapterGrid.classList.remove('visible');
        elements.endChapterGrid.innerHTML = '';
    } else {
        state.endBook = book;
        state.endChapter = null;
    }

    // 更新 UI
    updateBookGridSelection(type);
    updateSelectionDisplay(type);

    // 隱藏書卷格子，顯示章節格子
    showChapterGrid(book, type);
    toggleDropdown(type, 'chapter');

    // 如果是起始選擇，更新結束選擇器的限制
    if (type === 'start') {
        renderBookGrid(elements.endBookGrid, 'end');
        updateEndSelectionHint();
    }

    updateDisplayButton();
}

function updateBookGridSelection(type) {
    const container = type === 'start' ? elements.startBookGrid : elements.endBookGrid;
    const selectedBook = type === 'start' ? state.startBook : state.endBook;

    // 移除所有選中狀態
    container.querySelectorAll('.book-cell').forEach(cell => {
        cell.classList.remove('selected');
    });

    // 標記選中
    if (selectedBook) {
        const selectedCell = container.querySelector(`[data-abbr="${selectedBook.abbr}"]`);
        if (selectedCell) {
            selectedCell.classList.add('selected');
        }
    }
}

function showChapterGrid(book, type) {
    const container = type === 'start' ? elements.startChapterGrid : elements.endChapterGrid;
    container.innerHTML = '';

    // 標題
    const header = document.createElement('div');
    header.className = 'chapter-grid-header';
    header.textContent = `${book.name} - 選擇章節`;
    container.appendChild(header);

    // 計算起始章節限制（用於結束選擇）
    let minChapter = 1;
    if (type === 'end' && state.startBook && state.startBook.abbr === book.abbr && state.startChapter) {
        minChapter = state.startChapter;
    }

    // 章節格子
    for (let i = 1; i <= book.chapters; i++) {
        const cell = document.createElement('div');
        cell.className = 'chapter-cell';
        cell.textContent = i;

        if (type === 'end' && i < minChapter) {
            cell.classList.add('disabled');
        }

        cell.addEventListener('click', () => handleChapterClick(i, type));
        container.appendChild(cell);
    }
}

function handleChapterClick(chapter, type) {
    if (type === 'start') {
        state.startChapter = chapter;

        // 如果結束書卷與起始相同，需要檢查結束章節
        if (state.endBook && state.endBook.abbr === state.startBook.abbr) {
            if (state.endChapter && state.endChapter < chapter) {
                state.endChapter = null;
                updateSelectionDisplay('end');
            }
            // 重新渲染結束章節格子
            if (elements.endChapterGrid.classList.contains('visible')) {
                showChapterGrid(state.endBook, 'end');
            }
        }
    } else {
        state.endChapter = chapter;
    }

    // 更新 UI
    updateChapterGridSelection(type);
    updateSelectionDisplay(type);
    updateEndSelectionHint();
    updateDisplayButton();

    // 如果音頻正在播放，且選擇已完整，改建音頻隊列並自動切換
    const isValid = state.startBook && state.startChapter && state.endBook && state.endChapter;
    if (isValid && state.audioQueue.length > 0) {
        // 停掉舊音頻
        stopAudio();
        // 重建音頻隊列（會停在 queue 的第一章）
        rebuildAudioQueue();
        // 自動從新第一章開始播放
        playAudio();
    }

    // 選擇章節後自動關閉下拉選單
    closeDropdown(type);
}

function updateChapterGridSelection(type) {
    const container = type === 'start' ? elements.startChapterGrid : elements.endChapterGrid;
    const selectedChapter = type === 'start' ? state.startChapter : state.endChapter;

    container.querySelectorAll('.chapter-cell').forEach(cell => {
        cell.classList.remove('selected');
        if (parseInt(cell.textContent) === selectedChapter) {
            cell.classList.add('selected');
        }
    });
}

function updateSelectionDisplay(type) {
    const display = type === 'start' ? elements.startSelectionDisplay : elements.endSelectionDisplay;
    const book = type === 'start' ? state.startBook : state.endBook;
    const chapter = type === 'start' ? state.startChapter : state.endChapter;

    if (book && chapter) {
        display.innerHTML = `<span class="selected-value">${book.name} ${chapter} 章</span>`;
    } else if (book) {
        display.innerHTML = `<span class="selected-value">${book.name}</span> <span class="selection-placeholder">（選擇章節）</span>`;
    } else {
        display.innerHTML = `<span class="selection-placeholder">${type === 'start' ? '選擇起始書卷和章節' : '選擇結束書卷和章節'}</span>`;
    }
}

function updateEndSelectionHint() {
    if (state.startBook && state.startChapter) {
        elements.startHintText.textContent = `${state.startBook.name} ${state.startChapter} 章`;
        elements.endSelectionHint.classList.remove('hidden');
    } else if (state.startBook) {
        elements.startHintText.textContent = `${state.startBook.name}`;
        elements.endSelectionHint.classList.remove('hidden');
    } else {
        elements.endSelectionHint.classList.add('hidden');
    }
}

function updateDisplayButton() {
    const isValid = state.startBook && state.startChapter && state.endBook && state.endChapter;
    elements.displayBtn.disabled = !isValid;
}

// ===== 重建音頻隊列（不改變經文顯示）=====
function rebuildAudioQueue() {
    const startBookIndex = state.books.findIndex(b => b.abbr === state.startBook.abbr);
    const endBookIndex = state.books.findIndex(b => b.abbr === state.endBook.abbr);

    state.audioQueue = [];

    for (let bookIdx = startBookIndex; bookIdx <= endBookIndex; bookIdx++) {
        const book = state.books[bookIdx];
        if (!state.bibleData[book.abbr]) continue;

        let chapStart = 1;
        let chapEnd = book.chapters;

        if (bookIdx === startBookIndex) {
            chapStart = state.startChapter;
        }
        if (bookIdx === endBookIndex) {
            chapEnd = state.endChapter;
        }

        for (let chap = chapStart; chap <= chapEnd; chap++) {
            if (state.bibleData[book.abbr][chap] && state.bibleData[book.abbr][chap].length > 0) {
                state.audioQueue.push({
                    bookAbbr: book.abbr,
                    chapter: chap,
                    label: `${book.name} ${chap} 章`
                });
            }
        }
    }

    state.currentChapterIndex = 0;
    updatePlayerChapterDisplay();
}

// ===== 顯示經文 =====
function displayScripture() {
    const startBookIndex = state.books.findIndex(b => b.abbr === state.startBook.abbr);
    const endBookIndex = state.books.findIndex(b => b.abbr === state.endBook.abbr);

    // 驗證範圍
    if (startBookIndex > endBookIndex) {
        alert('起始書卷必須在結束書卷之前或相同');
        return;
    }

    if (startBookIndex === endBookIndex && state.startChapter > state.endChapter) {
        alert('起始章節必須在結束章節之前或相同');
        return;
    }

    // 收集經文
    const chapters = [];

    // 收集音頻隊列
    state.audioQueue = [];

    for (let bookIdx = startBookIndex; bookIdx <= endBookIndex; bookIdx++) {
        const book = state.books[bookIdx];
        if (!state.bibleData[book.abbr]) continue;

        // 決定章節範圍
        let chapStart = 1;
        let chapEnd = book.chapters;

        if (bookIdx === startBookIndex) {
            chapStart = state.startChapter;
        }
        if (bookIdx === endBookIndex) {
            chapEnd = state.endChapter;
        }

        for (let chap = chapStart; chap <= chapEnd; chap++) {
            const verses = state.bibleData[book.abbr][chap];
            if (verses && verses.length > 0) {
                chapters.push({
                    bookAbbr: book.abbr,
                    bookName: book.name,
                    chapter: chap,
                    // 轉換 [verse, text] 格式
                    verses: verses.map(v => ({ verse: v[0], text: v[1] }))
                });

                // 添加到音頻隊列
                state.audioQueue.push({
                    bookAbbr: book.abbr,
                    chapter: chap,
                    label: `${book.name} ${chap} 章`
                });
            }
        }
    }

    // 渲染經文
    renderScripture(chapters);

    // 顯示工具列
    elements.toolbar.style.display = 'flex';

    // 滾動到頂部（因為現在是 fixed bar）
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 重置音頻播放器
    stopAudio();
    updatePlayerChapterDisplay();
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
