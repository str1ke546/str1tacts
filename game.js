/* global DB */
const DEFAULT_STATE = {
    money: 1000,
    inv: [],
    selectedCase: 'kilowatt',
    gpuCount: 0,
    openedCount: 0,
    totalSpent: 0,
    bestDrop: null,
    theme: 'black',
    snow: false,
    contractSelected: [],
    qCases: 0,
    qUpgrades: 0,
    qCasesClaimed: false,
    qUpgradesClaimed: false,
    stickers: [],
    usedPromos: [] // <-- Заменили promoUsed на массив использованных промокодов
};

let state = { ...DEFAULT_STATE };
let rouletteTimer = null; // Переменная для таймера анимации
let rouletteTickInterval = null; // Переменная для тиканья звука
let rouletteCallback = null; // Переменная, которая запомнит функцию выдачи приза

let upgrader = { my: null, target: null, type: 'my', isRunning: false };
let jackpotData = { playerSkin: null, bank: [], isRolling: false };

// --- СИСТЕМА ЛОКАЛЬНОГО СОХРАНЕНИЯ (LOCALSTORAGE) ---
function saveGame() {
    try {
        // Делаем копию состояния, чтобы не испортить текущую игру
        const saveState = JSON.parse(JSON.stringify(state));

        // Вырезаем картинки из наклеек в инвентаре перед записью на диск
        if (saveState.stickers && Array.isArray(saveState.stickers)) {
            saveState.stickers.forEach(st => {
                delete st.img; 
            });
        }
        
        // Вырезаем картинки из наклеек, которые уже нанесены на пушки
        if (saveState.inv && Array.isArray(saveState.inv)) {
            saveState.inv.forEach(item => {
                if (item.appliedStickers && Array.isArray(item.appliedStickers)) {
                    item.appliedStickers.forEach(st => delete st.img);
                }
            });
        }

        localStorage.setItem('str1tact_save_data', JSON.stringify(saveState));
    } catch (e) {
        console.error("Ошибка сохранения:", e);
    }
}

function loadGame() {
    const saved = localStorage.getItem('str1tact_save_data');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state = Object.assign({}, DEFAULT_STATE, parsed);
        } catch (e) {
            console.error("Ошибка загрузки данных:", e);
            if (state.stickers && Array.isArray(state.stickers)) {
    state.stickers.forEach(userSticker => {
        // Ищем оригинальную наклейку в базе по её имени
        let baseSticker = DB.stickersDB.find(s => s.name === userSticker.name);
        if (baseSticker && baseSticker.img) {
            userSticker.img = baseSticker.img; // Возвращаем картинку в оперативку
        }
    });
}
        }
    }
}

function resetGame() {
    if (confirm("Вы уверены, что хотите полностью сбросить прогресс? Это действие нельзя отменить!")) {
        localStorage.removeItem('str1tact_save_data');
        state = { ...DEFAULT_STATE, inv: [] };
        location.reload();
    }
}

// --- СИСТЕМА ЗВАНИЙ (РАНГИ) ---
function getRankInfo(opened) {
    if (opened >= 500) return { name: "The Global Elite 👑", color: "#caab05" };
    if (opened >= 300) return { name: "Supreme Master First Class 🌟", color: "#eb4b4b" };
    if (opened >= 175) return { name: "Legendary Eagle 🦅", color: "#d32ce6" };
    if (opened >= 100) return { name: "Master Guardian Elite ⚔️", color: "#8847ff" };
    if (opened >= 50) return { name: "Gold Nova I ✨", color: "#4b69ff" };
    if (opened >= 20) return { name: "Silver Elite Master 🥈", color: "#a5b1c2" };
    if (opened >= 5) return { name: "Silver II 🥈", color: "#95a5a6" };
    return { name: "Silver I 🥉", color: "#7f8c8d" };
}

// --- ЛАЙВ ДРОП (ИМИТАЦИЯ ОНЛАЙНА) ---
function initLiveDrop() {
    const bar = document.getElementById('live-drop-bar');
    setInterval(() => {
        // Выбираем случайный скин (с небольшим перевесом в сторону дешевых, чтобы было реалистично)
        const rand = Math.random();
        let targetRarity = rand < 0.6 ? 'mil-spec' : (rand < 0.8 ? 'restricted' : 'classified');
        const pool = DB.skins.filter(s => s.rarity === targetRarity);
        const skin = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : DB.skins[0];

        const div = document.createElement('div');
        div.className = 'live-item';
        div.style.borderColor = `var(--${skin.rarity})`;
        div.innerHTML = `<img src="${skin.img}"> <span style="color:var(--${skin.rarity})">${skin.name}</span>`;
        
        bar.prepend(div);
        if(bar.children.length > 8) bar.lastChild.remove();
    }, 2500); // Каждые 2.5 секунды
}

// --- СИСТЕМА ДОСТИЖЕНИЙ ---
function showToast(text) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = text;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function checkAchievements() {
    if(state.money >= 100000 && !state.achievements.includes('rich')) {
        state.achievements.push('rich');
        showToast('🏆 ДОСТИЖЕНИЕ: Магнат! (Баланс $100,000)');
    }
    if(state.openedCount >= 50 && !state.achievements.includes('case_50')) {
        state.achievements.push('case_50');
        showToast('🏆 ДОСТИЖЕНИЕ: Охотник за лутом! (50 кейсов)');
    }
}

// --- КАСТОМНЫЕ УВЕДОМЛЕНИЯ ---
function showAlert(title, text, isSuccess = true) {
    const modal = document.getElementById('custom-alert');
    const titleEl = document.getElementById('custom-alert-title');
    titleEl.innerText = title;
    titleEl.style.color = isSuccess ? '#2ecc71' : '#eb4b4b'; 
    document.getElementById('custom-alert-text').innerHTML = text.replace(/\n/g, '<br>');
    modal.style.display = 'flex';
}
function closeCustomAlert() { document.getElementById('custom-alert').style.display = 'none'; }

// --- ИНИЦИАЛИЗАЦИЯ И РЕНДЕР КЕЙСОВ ---
function initCases() {
    const grid = document.getElementById('case-selector-grid');
    grid.innerHTML = '';
    Object.keys(DB.cases).forEach(key => {
        const c = DB.cases[key];
        const b = document.createElement('button');
        b.className = `tab-btn ${state.selectedCase === key ? 'active' : ''}`;
        b.innerText = c.name;
        b.onclick = () => selectCase(key);
        grid.appendChild(b);
    });
    selectCase(state.selectedCase);
}

function selectCase(key) {
    state.selectedCase = key;
    document.querySelectorAll('#case-selector-grid .tab-btn').forEach((b, idx) => {
        b.classList.toggle('active', Object.keys(DB.cases)[idx] === key);
    });
    const c = DB.cases[key];
    document.getElementById('case-img').src = c.img;
    document.getElementById('case-title').innerText = c.name;
    document.getElementById('case-open-btn').innerText = `ОТКРЫТЬ $${c.price}`;

    renderCaseContents(key);
}

function renderCaseContents(caseKey) {
    const contentsGrid = document.getElementById('case-contents-grid');
    contentsGrid.innerHTML = '';

    if(caseKey === 'sticker_capsule') {
        // --- ОТОБРАЖЕНИЕ НАКЛЕЕК В МЕНЮ КЕЙСА ---
        DB.stickersDB.forEach(st => {
            const div = document.createElement('div');
            div.className = 'item';
            div.style.borderColor = st.color;
            
            // Если у наклейки есть картинка (Base64 или ссылка) — рендерим <img>, иначе текстовый блок
            const visual = st.img 
                ? `<img src="${st.img}" style="max-height:80px; object-fit:contain; margin:10px auto; display:block;">` 
                : `<div style="width:100%; height:90px; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:900; color:${st.color}; background:rgba(255,255,255,0.02); border-radius:10px;">${st.short}</div>`;

            div.innerHTML = `
                ${visual}
                <div style="font-size:10px; font-weight:700; height:30px; overflow:hidden; color: ${st.color}; margin-top:5px;">${st.name}</div>
                <div style="color:#caab05; font-weight:900;">+$${st.bonusPrice} к цене</div>
            `;
            contentsGrid.appendChild(div);
        });
    } else {
        // Стандартный показ скинов из обычного кейса (оставляем без изменений)
        const caseSkins = DB.skins.filter(s => s.coll === caseKey || !s.coll);
        caseSkins.sort((a, b) => DB.rarityOrder.indexOf(a.rarity) - DB.rarityOrder.indexOf(b.rarity));

        caseSkins.forEach(skin => {
            const div = document.createElement('div');
            div.className = 'item';
            div.style.borderColor = `var(--${skin.rarity})`;
            div.innerHTML = `
                <img src="${skin.img}">
                <div style="font-size:10px; font-weight:700; height:30px; overflow:hidden; color: var(--${skin.rarity}); margin-top:5px;">${skin.name}</div>
                <div style="color:#85bb65; font-weight:900;">$${skin.price}</div>
            `;
            contentsGrid.appendChild(div);
        });
    }
}

// --- ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ---
function switchTab(id, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const targetSection = document.getElementById(`sec-${id}`);
    if (targetSection) targetSection.classList.add('active');
    if (btn) btn.classList.add('active');
    
    document.getElementById('up-select-box').style.display = 'none';

    if(id === 'inv') renderInventory();
    if(id === 'upgrader') resetUpgraderUI();
    if(id === 'quests') renderQuests();
    if(id === 'jackpot') initJackpotUI();
    if(id === 'contracts') renderContractInv();
}

// --- ЛОГИКА ОТКРЫТИЯ КЕЙСА ---
function openCase() {
    const c = DB.cases[state.selectedCase];
    if(state.money < c.price) return showAlert('Ошибка', "Недостаточно средств для открытия!", false);
    
    state.money -= c.price;
    state.totalSpent += c.price;
    
    // Если открываем капсулу с наклейками
    if(state.selectedCase === 'sticker_capsule') {
        updateUI();
        
        // Считаем шансы на редкость наклейки
        const rand = Math.random() * 100;
        let r = "mil-spec"; 
        if(rand < 5) r = "gold"; 
        else if(rand < 25) r = "classified"; 
        
        // Выбираем конкретную выигравшую наклейку
        const capsulePool = DB.stickersDB.filter(s => s.rarity === r);
        const winSticker = capsulePool[Math.floor(Math.random() * capsulePool.length)];
        
        // Флаг IsSticker передаем внутрь рулетки, чтобы она знала, что крутит наклейки
        startRoulette(winSticker, DB.stickersDB, true); 
        return;
    }
    
    // Обычная логика открытия кейса со скинами
    state.openedCount++;
    state.qCases++; 
    updateUI();

    const pool = DB.skins.filter(s => s.coll === state.selectedCase || !s.coll);
    const rand = Math.random() * 100;
    let r = "mil-spec";
    if(rand < 0.5) r = "gold";
    else if(rand < 1.5) r = "covert";
    else if(rand < 5) r = "classified";
    else if(rand < 20) r = "restricted";

    const filtered = pool.filter(s => s.rarity === r);
    const win = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : pool[0];

    startRoulette(win, pool, false); // false — значит крутим обычный скин
}

function startRoulette(win, pool, isSticker = false) {
    const track = document.getElementById('track');
    track.innerHTML = '';
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    document.getElementById('roulette-modal').style.display = 'flex';
    document.getElementById('collect-btn').style.display = 'none';
    
    // Показываем кнопку скипа в момент начала кручения
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.style.display = 'block';
    
    const winName = document.getElementById('win-name');
    winName.innerText = "КРУТИМ...";

    // Генерация 60 карточек
    for(let i=0; i<60; i++) {
        const item = i === 50 ? win : pool[Math.floor(Math.random()*pool.length)];
        const card = document.createElement('div');
        card.className = 'card';
        
        if (isSticker) {
            const visual = item.img 
                ? `<img src="${item.img}" style="max-height:75px; object-fit:contain; margin-top:15px;">` 
                : `<div style="font-size:24px; font-weight:900; color:${item.color}; height:90px; display:flex; align-items:center; justify-content:center;">${item.short}</div>`;
            card.innerHTML = `${visual}<div class="card-rarity" style="background:${item.color}"></div>`;
        } else {
            card.innerHTML = `<img src="${item.img}"><div class="card-rarity" style="background:var(--${item.rarity})"></div>`;
        }
        track.appendChild(card);
    }

    const tick = document.getElementById('snd-tick');
    let lastStep = 0;
    const cardWidth = 200;

    // Запуск анимации прокрутки
    setTimeout(() => {
        const target = (50 * cardWidth) + (cardWidth/2) - (window.innerWidth/2);
        track.style.transition = 'transform 6s cubic-bezier(0.1, 0, 0.05, 1)';
        track.style.transform = `translateX(-${target}px)`;

        // Записываем интервал звуков в глобальную переменную
        rouletteTickInterval = setInterval(() => {
            const curX = Math.abs(track.getBoundingClientRect().left);
            const step = Math.floor(curX / cardWidth);
            if(step > lastStep) {
                if (tick) { tick.currentTime = 0; tick.play().catch(()=>{}); }
                lastStep = step;
            }
        }, 10);
        
        // Очистка звуков через 6 секунд
        setTimeout(() => clearInterval(rouletteTickInterval), 6000);
    }, 50);

    // Выносим логику выдачи приза в отдельную функцию внутри, чтобы её мог вызвать скип
    rouletteCallback = () => {
        if (skipBtn) skipBtn.style.display = 'none'; // Скрываем кнопку скипа
        document.getElementById('collect-btn').style.display = 'block';
        
        const isStatTrak = Math.random() < 0.1; 

        if (isSticker) {
            const finalBonus = isStatTrak ? Math.floor(win.bonusPrice * 1.5) : win.bonusPrice;
            const displayName = isStatTrak ? `StatTrak™ ${win.name}` : win.name;

            winName.innerText = displayName;
            winName.style.color = isStatTrak ? '#cf6a32' : win.color;
            
            state.stickers.push({ 
                ...win, 
                id: Date.now() + Math.random(),
                name: displayName,
                bonusPrice: finalBonus,
                isStatTrak: isStatTrak
            });
        } else {
            const finalPrice = isStatTrak ? Math.floor(win.price * 1.5) : win.price;
            const displayName = isStatTrak ? `StatTrak™ ${win.name}` : win.name;

            winName.innerText = displayName;
            winName.style.color = isStatTrak ? '#cf6a32' : `var(--${win.rarity})`;
            
            const newSkin = { 
                ...win, 
                id: Date.now() + Math.random(),
                name: displayName,
                price: finalPrice,
                isStatTrak: isStatTrak
            };

            state.inv.push({
                name: newSkin.name,
                price: newSkin.price,
                rarity: newSkin.rarity,
                isStatTrak: newSkin.isStatTrak,
                id: newSkin.id
            });
            
            // Восстанавливаем картинку в оперативке для отображения
            state.inv[state.inv.length - 1].img = win.img;
            
            if(!state.bestDrop || newSkin.price > state.bestDrop.price) {
                state.bestDrop = newSkin;
            }
        }
        
        updateUI();
        renderInventory(); 
    };

    // Запускаем основной таймер ожидания окончания рулетки (6.1 сек)
    rouletteTimer = setTimeout(() => {
        if(rouletteCallback) {
            rouletteCallback();
            rouletteCallback = null; // Очищаем ссылку
        }
    }, 6100);
}
function skipRoulette() {
    // 1. Убиваем таймер ожидания рулетки и интервал тиканья звуков
    if (rouletteTimer) { clearTimeout(rouletteTimer); rouletteTimer = null; }
    if (rouletteTickInterval) { clearInterval(rouletteTickInterval); rouletteTickInterval = null; }
    
    // 2. Мгновенно перематываем ленту рулетки на победный 50-й элемент без анимации
    const track = document.getElementById('track');
    const cardWidth = 200;
    const target = (50 * cardWidth) + (cardWidth/2) - (window.innerWidth/2);
    
    track.style.transition = 'none'; // Отключаем плавность
    track.style.transform = `translateX(-${target}px)`; // Мгновенный сдвиг
    
    // 3. Вызываем функцию выдачи приза, если она еще не сработала
    if (rouletteCallback) {
        rouletteCallback();
        rouletteCallback = null;
    }
}

function closeRoulette() { document.getElementById('roulette-modal').style.display = 'none'; }
document.getElementById('skip-btn').style.display = 'none';

// --- ИНВЕНТАРЬ ---
function renderInventory() {
    const grid = document.getElementById('inv-grid');
    grid.innerHTML = '';
    
    // Клик по предмету теперь продает его, но мы добавим кнопку для кастомизации
    state.inv.forEach(s => {
        const div = document.createElement('div');
        div.className = 'item';
        div.style.borderColor = `var(--${s.rarity})`;
        
        // Генерируем HTML для наклеек на оружии (максимум 4 штуки)
        let stickersHTML = '<div class="sticker-badge-container">';
        if(s.appliedStickers) {
            s.appliedStickers.forEach(st => {
                stickersHTML += `<div class="sticker-badge" style="background:${st.color}" title="${st.name}">${st.short}</div>`;
            });
        }
        stickersHTML += '</div>';

        div.innerHTML = `
            ${stickersHTML}
            <img src="${s.img}">
            <div style="font-size:11px; font-weight:700; height:30px; overflow:hidden; margin-top:5px;">${s.name}</div>
            <div style="color:#85bb65; font-weight:900; margin-top:5px;">$${s.price}</div>
            <button class="custom-btn-secondary" onclick="event.stopPropagation(); openStickerMenuForSkin('${s.id}')">Наклеить</button>
        `;
        
        // Клик по самой карточке (не по кнопке) — продажа
        div.onclick = () => {
            state.money += s.price;
            state.inv = state.inv.filter(x => x.id !== s.id);
            renderInventory();
            updateUI();
        };
        grid.appendChild(div);
    });

    // Отрендерим ниже блок со свободными наклейками игрока
    renderPlayerStickersStorage();
}

// Дополнительная функция визуализации чистых наклеек внизу инвентаря
function renderPlayerStickersStorage() {
    // Проверим, есть ли уже блок наклеек, если нет — создадим его
    let storageDiv = document.getElementById('stickers-storage-box');
    if(!storageDiv) {
        storageDiv = document.createElement('div');
        storageDiv.id = 'stickers-storage-box';
        storageDiv.style.marginTop = '40px';
        document.getElementById('sec-inv').appendChild(storageDiv);
    }
    
    storageDiv.innerHTML = `<h2 style="margin-bottom:15px;">ВАШИ НАКЛЕЙКИ (${state.stickers ? state.stickers.length : 0} шт.)</h2>`;
    
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))'; // Чуть расширили под кнопку
    container.style.gap = '10px';
    
    if(!state.stickers || state.stickers.length === 0) {
        container.innerHTML = '<div style="opacity:0.5; grid-column: 1/-1;">У вас пока нет свободных наклеек. Откройте капсулу в магазине!</div>';
    } else {
        state.stickers.forEach((st, idx) => {
            // Проверка на наличие картинки
            const visualElement = st.img 
                ? `<img src="${st.img}" style="height:35px; width:35px; object-fit:contain; border-radius:4px; border: 1px solid rgba(255,255,255,0.2);">` 
                : `<b style="color:${st.color}; font-size:12px;">[${st.short}]</b>`;

            // Создаем карточку наклейки
            const card = document.createElement('div');
            card.className = 'sticker-item';
            card.style.borderLeft = `4px solid ${st.color}`;
            card.style.display = 'flex';
            card.style.alignItems = 'center';
            card.style.justifyContent = 'space-between'; // Чтобы кнопка была справа
            card.style.gap = '10px';

            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    ${visualElement}
                    <div>
                        <span style="font-size:11px; font-weight:700;">${st.name.split('|')[1] || st.name}</span>
                        <div style="font-size:10px; color:#85bb65; font-weight:700;">$${st.bonusPrice}</div>
                    </div>
                </div>
                <button class="custom-btn-secondary" style="background:#c0392b; margin-top:0;" onclick="sellSticker(${idx})">Продать</button>
            `;
            
            container.appendChild(card);
        });
    }
    storageDiv.appendChild(container);
}

// --- НОВАЯ ФУНКЦИЯ ДЛЯ ПРОДАЖИ НАКЛЕЙКИ ---
window.sellSticker = function(idx) {
    if(!state.stickers || !state.stickers[idx]) return;
    
    const sticker = state.stickers[idx];
    
    // Добавляем деньги на баланс игрока
    state.money += sticker.bonusPrice;
    
    // Удаляем наклейку из массива по индексу
    state.stickers.splice(idx, 1);
    
    // Обновляем интерфейс и сохраняем прогресс
    updateUI();
    renderInventory(); // Перерисует инвентарь и вызовет renderPlayerStickersStorage внутри себя
};

// --- ЕЖЕДНЕВНЫЕ КВЕСТЫ ---
function renderQuests() {
    const container = document.getElementById('quests-container');
    container.innerHTML = '';

    const q1Ready = state.qCases >= 5;
    const q2Ready = state.qUpgrades >= 3;

    container.innerHTML += `
        <div class="quest-card">
            <div class="quest-info">
                <h3>Открыть 5 любых кейсов</h3>
                <p>Прогресс: <b>${Math.min(state.qCases, 5)} / 5</b></p>
                <div class="quest-reward">Награда: +$500</div>
            </div>
            <button class="btn-open" style="font-size:14px; padding:10px 25px;" ${q1Ready && !state.qCasesClaimed ? '' : 'disabled'} onclick="claimQuest('cases', 500)">
                ${state.qCasesClaimed ? 'ЗАБРАНО' : 'ЗАБРАТЬ'}
            </button>
        </div>

        <div class="quest-card">
            <div class="quest-info">
                <h3>Рискнуть в Апгрейдере 3 раза</h3>
                <p>Прогресс: <b>${Math.min(state.qUpgrades, 3)} / 3</b></p>
                <div class="quest-reward">Награда: +$1200</div>
            </div>
            <button class="btn-open" style="font-size:14px; padding:10px 25px;" ${q2Ready && !state.qUpgradesClaimed ? '' : 'disabled'} onclick="claimQuest('upgrades', 1200)">
                ${state.qUpgradesClaimed ? 'ЗАБРАНО' : 'ЗАБРАТЬ'}
            </button>
        </div>
    `;
}

function claimQuest(type, reward) {
    if(type === 'cases') state.qCasesClaimed = true;
    if(type === 'upgrades') state.qUpgradesClaimed = true;
    state.money += reward;
    updateUI();
    renderQuests();
    showAlert('Успех!', `Награда за задание успешно получена:\n+$${reward}`, true);
}

// Продажа всего инвентаря
window.sellAll = function() {
    // 1. Проверяем, есть ли что продавать
    const itemsCount = state.inv.length;
    const stickersCount = state.stickers ? state.stickers.length : 0;
    
    if (itemsCount === 0 && stickersCount === 0) {
        return showAlert('Внимание', 'Ваш инвентарь и хранилище наклеек уже пустые!', false);
    }
    
    // 2. Считаем общую стоимость
    let totalIncome = 0;
    state.inv.forEach(item => totalIncome += item.price);
    if (state.stickers) {
        state.stickers.forEach(sticker => totalIncome += sticker.bonusPrice);
    }
    
    // 3. Формируем красивый HTML-контент для твоего showAlert
    let htmlContent = `
        <div style="text-align: center; margin-top: 15px;">
            <p style="font-size: 14px; opacity: 0.9; margin-bottom: 15px;">
                Вы точно хотите очистить весь инвентарь и хранилище наклеек?
            </p>
            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; text-align: left; display: inline-block; min-width: 200px;">
                • Скинов: <b style="color: #fff;">${itemsCount} шт.</b><br>
                • Наклеек: <b style="color: #fff;">${stickersCount} шт.</b><br>
                • Выручка: <b style="color: #85bb65;">$${totalIncome}</b>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button class="custom-btn" style="background: #c0392b; padding: 8px 20px;" onclick="confirmGlobalSell(${totalIncome}); closeCustomAlert();">Да, продать</button>
                <button class="custom-btn-secondary" style="background: #34495e; padding: 8px 20px; margin-top:0;" onclick="closeCustomAlert();">Отмена</button>
            </div>
        </div>
    `;
    
    // Вызываем твой красивый алерт (заголовок, контент, флаг успеха для цвета рамки)
    showAlert('⚠️ ПОДТВЕРЖДЕНИЕ', htmlContent, false);
};

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПРОВЕДЕНИЯ ТРАНЗАКЦИИ ---
window.confirmGlobalSell = function(income) {
    state.money += income;
    state.inv = [];
    state.stickers = [];
    
    updateUI();
    renderInventory();
    
    showAlert('Успех!', `Весь инвентарь успешно продан за <b>$${income}</b>!`, true);
};

// --- РЕЖИМ JACKPOT С БОТАМИ ---
function initJackpotUI() {
    if(jackpotData.isRolling) return;
    jackpotData.playerSkin = null;
    jackpotData.bank = [];
    
    document.getElementById('jp-status').innerText = "Ожидание вашей ставки...";
    document.getElementById('jp-bank-val').innerText = "$0";
    document.getElementById('jp-chance').innerText = "0%";
    document.getElementById('jp-start-btn').disabled = true;

    const invList = document.getElementById('jp-inv-list');
    invList.innerHTML = '';
    if(state.inv.length === 0) invList.innerHTML = '<div style="opacity:0.5; padding:5px;">Ваш инвентарь пуст</div>';
    
    state.inv.forEach(s => {
        const row = document.createElement('div');
        row.className = 'up-list-item';
        row.innerHTML = `<span>${s.name}</span><span style="color:gold; font-weight:bold;">$${s.price}</span>`;
        row.onclick = () => selectJackpotSkin(s);
        invList.appendChild(row);
    });

    renderJackpotPlayers();
}

function selectJackpotSkin(skin) {
    jackpotData.playerSkin = skin;
    jackpotData.bank = [];
    
    jackpotData.bank.push({ name: "ВЫ (Игрок)", price: skin.price, isPlayer: true, rarity: skin.rarity });

    const botNames = ["Капитан Прайс 🎖️", "Бот Паша 🥊", "s1mple_pro ⚡"];
    botNames.forEach(bot => {
        const filteredSkins = DB.skins.filter(s => s.price >= skin.price * 0.3 && s.price <= skin.price * 2.0);
        const botSkin = filteredSkins.length > 0 ? filteredSkins[Math.floor(Math.random() * filteredSkins.length)] : DB.skins[0];
        jackpotData.bank.push({ name: bot, price: botSkin.price, isPlayer: false, rSkin: botSkin });
    });

    const totalBank = jackpotData.bank.reduce((sum, item) => sum + item.price, 0);
    const playerChance = (skin.price / totalBank) * 100;

    document.getElementById('jp-status').innerText = "Ставки сделаны! Банк сформирован.";
    document.getElementById('jp-bank-val').innerText = `$${totalBank}`;
    document.getElementById('jp-chance').innerText = `${playerChance.toFixed(1)}%`;
    document.getElementById('jp-start-btn').disabled = false;

    renderJackpotPlayers();
}

function renderJackpotPlayers() {
    const list = document.getElementById('jp-players-list');
    list.innerHTML = '';
    jackpotData.bank.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player-row';
        div.style.borderLeft = p.isPlayer ? "4px solid #ffcc00" : "4px solid #888";
        div.innerHTML = `<div><b>${p.name}</b><br><span style="font-size:11px; opacity:0.6;">Сделал ставку</span></div><div style="margin-left:auto; color:#85bb65; font-weight:900;">$${p.price}</div>`;
        list.appendChild(div);
    });
}

function startJackpot() {
    if(jackpotData.isRolling || !jackpotData.playerSkin) return;
    jackpotData.isRolling = true;
    document.getElementById('jp-start-btn').disabled = true;

    let totalBank = jackpotData.bank.reduce((sum, item) => sum + item.price, 0);
    let currentTicket = 0;
    
    jackpotData.bank.forEach(p => {
        p.minTicket = currentTicket;
        p.maxTicket = currentTicket + p.price;
        currentTicket = p.maxTicket;
    });

    let counter = 0;
    let interval = setInterval(() => {
        counter++;
        document.getElementById('jp-status').innerText = `🎰 КРУТИМ БАНК... ${".".repeat((counter % 4) + 1)}`;
        document.getElementById('snd-tick').currentTime = 0;
        document.getElementById('snd-tick').play().catch(()=>{});
        if(counter > 15) {
            clearInterval(interval);
            finishJackpot(totalBank);
        }
    }, 200);
}

function finishJackpot(totalBank) {
    const winningTicket = Math.random() * totalBank;
    let winner = jackpotData.bank.find(p => winningTicket >= p.minTicket && winningTicket <= p.maxTicket);
    if(!winner) winner = jackpotData.bank[0];

    if(winner.isPlayer) {
        jackpotData.bank.forEach(p => {
            if(!p.isPlayer && p.rSkin) state.inv.push({ ...p.rSkin, id: Date.now() + Math.random() });
        });
        showAlert('🎉 ПОБЕДА!', `Вы выиграли Джекпот!\nЗабран весь банк суммой $${totalBank}!`, true);
    } else {
        state.inv = state.inv.filter(x => x.id !== jackpotData.playerSkin.id);
        showAlert('💀 ПРОИГРЫШ', `Победил ${winner.name}.\nВаша ставка сгорела.`, false);
    }

    jackpotData.isRolling = false;
    updateUI();
    initJackpotUI();
}

// --- КОНТРАКТЫ ---
function renderContractInv() {
    const grid = document.getElementById('con-inv-grid');
    grid.innerHTML = '';
    state.contractSelected = [];
    document.getElementById('con-ready').innerText = '0';
    document.getElementById('btn-con-run').disabled = true;

    state.inv.forEach(s => {
        const div = document.createElement('div');
        div.className = 'item';
        div.style.borderColor = `var(--${s.rarity})`;
        div.innerHTML = `<img src="${s.img}"><div style="font-size:11px; font-weight:700; height:30px; overflow:hidden; margin-top:5px;">${s.name}</div>`;
        
        div.onclick = () => {
            const isSel = state.contractSelected.includes(s.id);
            if(isSel) {
                state.contractSelected = state.contractSelected.filter(id => id !== s.id);
                div.classList.remove('selected');
            } else if(state.contractSelected.length < 10) {
                state.contractSelected.push(s.id);
                div.classList.add('selected');
            }
            document.getElementById('con-ready').innerText = state.contractSelected.length;
            document.getElementById('btn-con-run').disabled = state.contractSelected.length !== 10;
        };
        grid.appendChild(div);
    });
}

function doContract() {
    if(state.contractSelected.length !== 10) return;
    
    const items = state.contractSelected.map(id => state.inv.find(s => s.id === id));
    const rarity = items[0].rarity;
    if(!items.every(item => item.rarity === rarity)) {
        return showAlert('Ошибка', 'Для контракта нужны предметы одинаковой редкости!', false);
    }

    const nextIdx = DB.rarityOrder.indexOf(rarity) + 1;
    if(nextIdx >= DB.rarityOrder.length) {
        return showAlert('Ошибка', 'Выбрана максимальная редкость! Дальше улучшать нельзя.', false);
    }

    const nextRarity = DB.rarityOrder[nextIdx];
    const pool = DB.skins.filter(s => s.rarity === nextRarity);
    const win = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : pool[0];

    state.inv = state.inv.filter(s => !state.contractSelected.includes(s.id));
    state.inv.push({ ...win, id: Date.now() + Math.random() });
    
    state.contractSelected = [];
    updateUI();
    renderContractInv();
    showAlert('Успешный контракт!', `Вы успешно подписали контракт и получили:\n${win.name}`, true);
}


// --- АПГРЕЙДЕР ЛОГИКА ---
function resetUpgraderUI() {
    upgrader.my = null; upgrader.target = null;
    document.getElementById('up-my-empty').style.display = 'block';
    document.getElementById('up-my-content').style.display = 'none';
    document.getElementById('up-target-empty').style.display = 'block';
    document.getElementById('up-target-content').style.display = 'none';
    document.getElementById('up-select-box').style.display = 'none';
    document.getElementById('up-chance-val').innerText = '0.00';
    document.getElementById('up-run-btn').disabled = true;
    drawWheel(0);
}

function openUpSelect(type) {
    if(upgrader.isRunning) return;
    upgrader.type = type;
    const box = document.getElementById('up-select-box');
    const title = document.getElementById('up-select-title');
    const itemsCont = document.getElementById('up-list-items');
    
    box.style.display = 'block';
    itemsCont.innerHTML = '';

    if(type === 'my') {
        title.innerText = 'Выберите скин для апгрейда:';
        if(state.inv.length === 0) itemsCont.innerHTML = '<div style="padding:10px; opacity:0.5;">Ваш инвентарь пуст</div>';
        state.inv.forEach(s => {
            const row = document.createElement('div');
            row.className = 'up-list-item';
            row.innerHTML = `<span>${s.name}</span><span style="color:#85bb65; font-weight:bold;">$${s.price}</span>`;
            row.onclick = () => selectUpItem(s);
            itemsCont.appendChild(row);
        });
    } else {
        title.innerText = 'Выберите желаемый скин (цель):';
        if(!upgrader.my) {
            itemsCont.innerHTML = '<div style="padding:10px; color:#eb4b4b;">Сначала выберите свой скин!</div>';
            return;
        }
        const targets = DB.skins.filter(s => s.price > upgrader.my.price).sort((a,b)=>a.price - b.price);
        if(targets.length === 0) itemsCont.innerHTML = '<div style="padding:10px; opacity:0.5;">Нет скинов дороже вашего</div>';
        targets.forEach(s => {
            const row = document.createElement('div');
            row.className = 'up-list-item';
            row.innerHTML = `<span>${s.name}</span><span style="color:#85bb65; font-weight:bold;">$${s.price}</span>`;
            row.onclick = () => selectUpItem(s);
            itemsCont.appendChild(row);
        });
    }
}

function selectUpItem(item) {
    const type = upgrader.type;
    document.getElementById('up-select-box').style.display = 'none';
    
    if(type === 'my') {
        upgrader.my = item;
        document.getElementById('up-my-empty').style.display = 'none';
        document.getElementById('up-my-content').style.display = 'block';
        document.getElementById('up-my-img').src = item.img;
        document.getElementById('up-my-name').innerText = item.name;
        document.getElementById('up-my-price').innerText = `$${item.price}`;
        upgrader.target = null;
        document.getElementById('up-target-empty').style.display = 'block';
        document.getElementById('up-target-content').style.display = 'none';
    } else {
        upgrader.target = item;
        document.getElementById('up-target-empty').style.display = 'none';
        document.getElementById('up-target-content').style.display = 'block';
        document.getElementById('up-target-img').src = item.img;
        document.getElementById('up-target-name').innerText = item.name;
        document.getElementById('up-target-price').innerText = `$${item.price}`;
    }
    calculateUpgradeChance();
}

function calculateUpgradeChance() {
    if(!upgrader.my || !upgrader.target) {
        document.getElementById('up-chance-val').innerText = '0.00';
        document.getElementById('up-run-btn').disabled = true;
        drawWheel(0);
        return;
    }
    let chance = (upgrader.my.price / upgrader.target.price) * 100;
    if(chance > 99.9) chance = 99.9;
    
    document.getElementById('up-chance-val').innerText = chance.toFixed(2);
    document.getElementById('up-run-btn').disabled = false;
    drawWheel(chance / 100);
}

function drawWheel(successFraction, currentAngle = 0) {
    const canvas = document.getElementById('up-wheel');
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Серый фон колеса (зона проигрыша)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#2d2d3d';
    ctx.fill();

    // 2. Желтый сектор (зона выигрыша)
    if(successFraction > 0) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, 0, Math.PI * 2 * successFraction);
        ctx.fillStyle = '#ffcc00';
        ctx.fill();
    }

    // 3. Внутренний круг (создаем эффект бублика/кольца)
    ctx.beginPath();
    ctx.arc(cx, cy, r - 15, 0, Math.PI * 2);
    ctx.fillStyle = '#161622';
    ctx.fill();

    // 4. ОРИГИНАЛЬНАЯ СТРЕЛКА (Теперь синхронизирована на 3 часа)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(currentAngle);
    ctx.beginPath();
    // Перевели координаты стрелки, чтобы при угле 0 она указывала вправо (на начало желтого сектора)
    ctx.moveTo(r - 25, 0);  // Острие стрелки, направленное к кольцу
    ctx.lineTo(r - 45, -8); // Верхнее основание треугольника
    ctx.lineTo(r - 45, 8);  // Нижнее основание треугольника
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
}

function runUpgrade() {
    if(upgrader.isRunning || !upgrader.my || !upgrader.target) return;
    upgrader.isRunning = true;
    state.qUpgrades++; 
    document.getElementById('up-run-btn').disabled = true;

    const chance = upgrader.my.price / upgrader.target.price;
    const isWin = Math.random() < chance;

    let duration = 4000;
    let startTimestamp = null;
    const totalRotation = Math.PI * 2 * 6; 
    let targetAngle = Math.random() * Math.PI * 2;
    
    if(isWin) {
        targetAngle = Math.random() * (Math.PI * 2 * chance);
    } else {
        targetAngle = (Math.PI * 2 * chance) + Math.random() * (Math.PI * 2 * (1 - chance));
    }

    const finalTargetAngle = totalRotation + targetAngle;

    function animateWheel(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = timestamp - startTimestamp;
        const t = Math.min(progress / duration, 1);
        const easeOut = 1 - Math.pow(1 - t, 3);
        const currentAngle = finalTargetAngle * easeOut;

        drawWheel(chance, currentAngle);

        if (t < 1) {
            requestAnimationFrame(animateWheel);
        } else {
            upgrader.isRunning = false;
            if(isWin) {
                showAlert('🔥 УСПЕХ!', `Скин улучшен до:\n${upgrader.target.name}`, true);
                state.inv.push({ ...upgrader.target, id: Date.now() + Math.random() });
            } else {
                showAlert('💀 НЕУДАЧА!', `Ваш предмет ${upgrader.my.name} сгорел.`, false);
            }
            state.inv = state.inv.filter(x => x.id !== upgrader.my.id);
            resetUpgraderUI();
            updateUI();
        }
    }
    requestAnimationFrame(animateWheel);
}

// --- СИСТЕМА ОБНОВЛЕНИЯ ИНТЕРФЕЙСА И СОХРАНЕНИЯ ---

function getGPUPrice() {
    return Math.floor(500 * Math.pow(1.5, state.gpuCount));
}

function updateUI() {
    // Вывод базовых значений
    document.getElementById('balance-val').innerText = Math.floor(state.money);
    document.getElementById('st-opened').innerText = state.openedCount;
    document.getElementById('st-spent').innerText = state.totalSpent;
    document.getElementById('st-best').innerText = state.bestDrop ? state.bestDrop.name : '-';
    
    // Рассчет динамического ранга в статистике
    const rankInfo = getRankInfo(state.openedCount);
    const rankEl = document.getElementById('st-rank');
    if(rankEl) {
        rankEl.innerText = rankInfo.name;
        rankEl.style.color = rankInfo.color;
    }

    // Динамический вывод фермы
    if(document.getElementById('farm-income')) {
        document.getElementById('farm-income').innerText = state.gpuCount * 2;
    }
    const gpuBtn = document.querySelector('#sec-farm .btn-open');
    if(gpuBtn) {
        gpuBtn.innerText = `КУПИТЬ ВИДЕОКАРТУ ($${getGPUPrice()})`;
    }

    // Автоматическое сохранение при каждом изменении состояния
    saveGame();
}

function buyGPU() {
    const currentPrice = getGPUPrice(); 
    if(state.money >= currentPrice) { 
        state.money -= currentPrice; 
        state.gpuCount++; 
        updateUI(); 
    }
    else { showAlert('Ошибка', "Недостаточно средств для покупки видеокарты!", false); }
}

// Таймер пассивного заработка фермы
setInterval(() => { 
    if(state.gpuCount > 0) { 
        state.money += state.gpuCount * 2; 
        updateUI(); 
    } 
}, 1000);

function usePromo() {
    const input = document.getElementById('promo-input');
    const code = input.value.trim().toUpperCase(); // Переводим в верхний регистр, чтобы не было ошибок с мелкими буквами
    
    if(!code) return showAlert('Ошибка', 'Введите промокод!', false);

    // --- БАЗА НАШИХ ПРОМОКОДОВ ---
    const PROMO_DB = {
        "STR1TACTS": { type: "money", value: 5000, msg: "Вы получили $5,000 на баланс!" },
        "START":     { type: "money", value: 1500, msg: "Стартовый бонус $1,500 начислен!" },
        "BOOST":     { type: "money", value: 15000, msg: "Мега-буст!+$15,000 на ваш баланс!" },
        
        // Секретный промокод на бесплатную золотую наклейку!
        "GOLDSTICKER": { 
            type: "sticker", 
            rarity: "gold", 
            msg: "🔥 Ничего себе! Вам выдана уникальная Золотая наклейка Str1tacts!" 
        },
        // Промокод на голографическую наклейку Spirit
        "SPIRIT": { 
            type: "sticker", 
            rarity: "classified", 
            msg: "🔮 Промокод активирован! Вы получили Голографическую наклейку Team Spirit!" 
        }
    };

    // Проверяем, существует ли такой код вообще
    if (!PROMO_DB[code]) {
        return showAlert('Ошибка', 'Такого промокода не существует!', false);
    }

    // Инициализируем массив, если его не было (защита от багов старых сохранений)
    if (!state.usedPromos) state.usedPromos = [];

    // Проверяем, не вводил ли игрок этот код РАНЕЕ
    if (state.usedPromos.includes(code)) {
        return showAlert('Внимание', 'Вы уже активировали этот промокод!', false);
    }

    // Награда за промокод
    const reward = PROMO_DB[code];

    if (reward.type === "money") {
        // Логика выдачи денег
        state.money += reward.value;
    } 
    else if (reward.type === "sticker") {
        // Логика выдачи наклейки напрямую в инвентарь кастомизации
        const pool = DB.stickersDB.filter(s => s.rarity === reward.rarity);
        if (pool.length === 0) return showAlert('Ошибка', 'Ошибка базы данных наклеек!', false);
        
        // Берем наклейку из пула (для GOLDSTICKER выберется золотая, для SPIRIT — спирит)
        const winSticker = pool[0]; 
        state.stickers.push({ ...winSticker, id: Date.now() + Math.random() });
    }

    // Добавляем код в список использованных, чтобы нельзя было активировать бесконечно
    state.usedPromos.push(code);

    // Сбрасываем поле ввода, сохраняем игру и обновляем сайт
    input.value = '';
    updateUI();
    renderInventory(); // Перерисовываем хранилище, если выдали наклейку
    
    showAlert('🎉 ПРОМОКОД!', reward.msg, true);
}

function setTheme(t) { 
    state.theme = t; 
    document.body.setAttribute('data-theme', t); 
    updateUI(); 
}

// --- СНЕГ ---
const canvas = document.getElementById('snow-canvas'); const ctx = canvas.getContext('2d'); let flakes = [];
function toggleSnow() {
    state.snow = !state.snow; canvas.style.display = state.snow ? 'block' : 'none';
    document.getElementById('snow-toggle').classList.toggle('active', state.snow);
    if(state.snow) {
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        flakes = Array.from({length: 100}, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 3 + 1, d: Math.random() * 1 }));
        requestAnimationFrame(updateSnow);
    }
    saveGame();
}
function updateSnow() {
    if(!state.snow) return; ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "white";
    flakes.forEach(f => {
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); f.y += Math.cos(f.d) + 1 + f.r / 2; f.x += Math.sin(f.d) * 0.5;
        if(f.y > canvas.height) { f.y = -10; f.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(updateSnow);
}
// Открытие интерактивного окна для выбора наклейки на пушку
function openStickerMenuForSkin(skinId) {
    const skin = state.inv.find(s => s.id == skinId);
    if(!skin) return;
    
    if(!state.stickers || state.stickers.length === 0) {
        return showAlert('Кастомизация', 'У вас нет свободных наклеек! Купите капсулу в магазине.', false);
    }
    
    if(!skin.appliedStickers) skin.appliedStickers = [];
    if(skin.appliedStickers.length >= 4) {
        return showAlert('Ошибка', 'На одно оружие можно нанести максимум 4 наклейки!', false);
    }

    // Формируем список наклеек для выбора внутри всплывающего окнаshowAlert
    let listHTML = `<div style="text-align:left; margin-top:15px; max-height:200px; overflow-y:auto;">`;
    state.stickers.forEach((st, idx) => {
        listHTML += `
            <div class="up-list-item" onclick="applyStickerToSkin('${skin.id}', ${idx}); closeCustomAlert();">
                <span style="color:${st.color}"><b>[${st.short}]</b> ${st.name}</span>
                <span style="color:gold; font-weight:bold;">+$${st.bonusPrice}</span>
            </div>
        `;
    });
    listHTML += `</div>`;

    showAlert(`Нанести наклейку на ${skin.name.split('|')[0]}`, `Выберите наклейку из списка (она увеличит стоимость скина):` + listHTML, true);
}

// Процесс наклеивания
function applyStickerToSkin(skinId, stickerIdx) {
    const skin = state.inv.find(s => s.id == skinId);
    if(!skin || !state.stickers[stickerIdx]) return;
    
    const sticker = state.stickers[stickerIdx];
    
    // Наносим наклейку на оружие
    if(!skin.appliedStickers) skin.appliedStickers = [];
    skin.appliedStickers.push(sticker);
    
    // Наклейка увеличивает итоговую стоимость скина
    skin.price += sticker.bonusPrice;
    
    // Удаляем наклейку из инвентаря свободных наклеек
    state.stickers.splice(stickerIdx, 1);
    
    updateUI();
    renderInventory();
    showAlert('Успех!', `Наклейка успешно нанесена!\nСтоимость оружия выросла на +$${sticker.bonusPrice}!`, true);
}
// Перехват нажатия клавиш для вызова админки (Ctrl + Shift + Y)
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyY') {
        e.preventDefault();
        const modal = document.getElementById('admin-modal');
        modal.style.display = 'flex';
        document.getElementById('admin-password').focus();
    }
});

// Проверка секретного пароля
function checkAdminPassword() {
    const pass = document.getElementById('admin-password').value;
    if (pass === 'str1kedev546') {
        document.getElementById('admin-auth').style.display = 'none';
        document.getElementById('admin-cheats').style.display = 'block';
    } else {
        alert('Неверный пароль разработчика!');
        document.getElementById('admin-password').value = '';
    }
}

// Вспомогательная функция автоподгрузки картинок (чтобы они не пропадали в инвентаре)
function restoreCheatImages() {
    state.inv.forEach(userItem => {
        let cleanName = userItem.name.replace("StatTrak™ ", "");
        let baseSkin = DB.skins.find(s => s.name === cleanName);
        if (baseSkin && baseSkin.img) userItem.img = baseSkin.img;
    });
    state.stickers.forEach(userSticker => {
        let cleanName = userSticker.name.replace("StatTrak™ ", "");
        let baseSticker = DB.stickersDB.find(s => s.name === cleanName);
        if (baseSticker && baseSticker.img) userSticker.img = baseSticker.img;
    });
}

// Читерские функции выдачи ресурсов (ОБЛЕГЧЕННЫЕ, без багов с кэшем)
function giveAdminMoney(amount) {
    state.money += amount;
    updateUI();
    renderInventory();
}

function giveAdminGoldItems(makeStatTrak = false) {
    let goldItems = DB.skins.filter(s => s.rarity === 'gold');
    goldItems.forEach(item => {
        let name = makeStatTrak ? `StatTrak™ ${item.name}` : item.name;
        let price = makeStatTrak ? Math.floor(item.price * 1.5) : item.price;
        state.inv.push({
            name: name,
            price: price,
            rarity: item.rarity,
            isStatTrak: makeStatTrak,
            id: Date.now() + Math.random()
        });
    });
    restoreCheatImages();
    updateUI();
    renderInventory();
}

function giveAdminGoldStickers(count) {
    let goldSticker = DB.stickersDB.find(s => s.rarity === 'gold');
    if (!goldSticker) return;
    
    for (let i = 0; i < count; i++) {
        state.stickers.push({
            name: goldSticker.name,
            bonusPrice: goldSticker.bonusPrice,
            color: goldSticker.color,
            short: goldSticker.short,
            id: Date.now() + Math.random()
            // Поле img сознательно НЕ пишем сюда, чтобы не забивать localStorage
        });
    }
    
    // Подгружаем картинки только в оперативную память для рендеринга
    restoreCheatImages(); 
    updateUI();
    renderInventory();
}

// Загрузка страницы
window.onload = () => { 
    loadGame(); // Восстанавливаем данные из localStorage
    restoreCheatImages(); // <--- Добавь эту строчку в конец загрузки или инициализации игры
    initCases(); 
    document.body.setAttribute('data-theme', state.theme);
    if(state.snow) {
        state.snow = false; // сбрасываем флаг для корректного переключения функции toggle
        toggleSnow();
    }
    updateUI(); 
};