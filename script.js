const ICONS = {
    check: `<svg class="svg-icon" viewBox="0 0 24 24" style="color: var(--primary);"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    warning: `<svg class="svg-icon" viewBox="0 0 24 24" style="color: #fbbf24;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    btnCheck: `<svg class="svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    btnCross: `<svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    sun: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line></svg>`,
    moon: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    export: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
    import: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`
};

let fullDataset = [];
let displayData = [];
let collectedState = JSON.parse(localStorage.getItem('dexboxer_collection') || '{}');

let currentConfig = {
    game: 'NatDex',
    completeness: 'species',
    sort: 'game',
    gap: 'continuous'
};

const REGIONAL_PREFIX_ORDER = {
    'SwSh': ['', 'A', 'C'],
    'SV': ['P', 'K', 'B', ''],
    'PLZA': ['', 'H']
};

const SLOTS_PER_BOX = 30;
let currentModalPokemon = null;

const els = {
    gameSelect: document.getElementById('game-select'),
    compSelect: document.getElementById('completeness-select'),
    sortSelect: document.getElementById('sort-select'),
    gapSelect: document.getElementById('gap-select'),
    themeToggle: document.getElementById('theme-toggle'),
    btnExport: document.getElementById('btn-export'),
    btnImport: document.getElementById('btn-import'),
    fileImport: document.getElementById('file-import'),
    container: document.getElementById('boxes-container'),
    statusMsg: document.getElementById('status-message'),
    statsMsg: document.getElementById('stats-message'),
    modal: document.getElementById('detail-modal'),
    closeModal: document.getElementById('close-modal'),
    modalToggleBtn: document.getElementById('modal-toggle-btn')
};

const fallbackData = [
    { "NatDex": "1", "Name": "Bulbasaur", "Keyword": "bulbasaur", "Order": "1", "HOME": "1", "SV": "167" },
    { "NatDex": "2", "Name": "Ivysaur", "Keyword": "ivysaur", "Order": "2", "HOME": "2", "SV": "168" },
    { "NatDex": "3", "Name": "Venusaur", "Keyword": "venusaur", "Order": "3", "HOME": "3", "SV": "169" },
    { "NatDex": "4", "Name": "Charmander", "Keyword": "charmander", "Order": "4", "HOME": "4", "SV": "164" },
    { "NatDex": "4", "Name": "Charmander", "Keyword": "charmander-shiny", "Form Name": "Shiny", "Order": "5", "HOME": "4", "SV": "164" },
    { "NatDex": "5", "Name": "Charmeleon", "Keyword": "charmeleon", "Order": "6", "HOME": "5", "SV": "165" },
    { "NatDex": "6", "Name": "Charizard", "Keyword": "charizard", "Order": "7", "HOME": "6", "SV": "166" },
    { "NatDex": "25", "Name": "Pikachu", "Keyword": "pikachu", "Order": "35", "HOME": "25", "SV": "74" },
    { "NatDex": "25", "Name": "Pikachu", "Keyword": "pikachu-f", "Gender": "-f", "Order": "36", "HOME": "25", "SV": "74" },
    { "NatDex": "1000", "Name": "Gholdengo", "Keyword": "gholdengo", "Order": "1200", "HOME": "1000", "SV": "392" }
];

async function init() {
    initTheme();
    loadSavedConfig();

    els.btnExport.innerHTML = ICONS.export;
    els.btnImport.innerHTML = ICONS.import;

    attachEventListeners();
    await loadData();
}

function loadSavedConfig() {
    try {
        const savedConfig = localStorage.getItem('dexboxer_config');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            currentConfig = { ...currentConfig, ...parsed };

            els.gameSelect.value = currentConfig.game;
            els.compSelect.value = currentConfig.completeness;
            els.sortSelect.value = currentConfig.sort;
            els.gapSelect.value = currentConfig.gap;
        }
    } catch (e) {
        console.warn("Failed to load saved configuration.");
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('dexboxer_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
    updateThemeIcon();
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('dexboxer_theme', isLight ? 'light' : 'dark');
    updateThemeIcon();
}

function updateThemeIcon() {
    const isLight = document.body.classList.contains('light-theme');
    els.themeToggle.innerHTML = isLight ? ICONS.moon : ICONS.sun;
}

async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("File not found");
        fullDataset = await response.json();

        els.statusMsg.innerHTML = `${ICONS.check} Loaded complete dataset`;
    } catch (err) {
        console.warn("Could not load data.json, using fallback data.", err);
        fullDataset = fallbackData;
        els.statusMsg.innerHTML = `${ICONS.warning} Using demo data (data.json not found)`;
    }
    updateView();
}

function updateView() {
    currentConfig.game = els.gameSelect.value;
    currentConfig.completeness = els.compSelect.value;
    currentConfig.sort = els.sortSelect.value;
    currentConfig.gap = els.gapSelect.value;

    localStorage.setItem('dexboxer_config', JSON.stringify(currentConfig));

    filterAndSortData();
    renderBoxes();
    updateStats();
}

function filterAndSortData() {
    const { game, completeness, sort } = currentConfig;

    let processed = fullDataset.filter(p => {
        if (!p.NatDex || String(p.NatDex).trim() === "") return false;
        if (game === 'NatDex') return true;
        return p[game] && String(p[game]).trim() !== "";
    });

    const seenSpecies = new Set();

    processed = processed.filter(p => {
        if (completeness === 'species') {
            if (!seenSpecies.has(p.NatDex)) {
                seenSpecies.add(p.NatDex);
                return true;
            }
            return false;
        } else if (completeness === 'forms') {
            if (p.Gender === '-f' && (!p['Form Name'] || p['Form Name'] === "")) return false;
            return true;
        }
        return true;
    });

    processed.sort((a, b) => {
        if (sort === 'game') {
            if (game === 'NatDex') {
                const numA = parseInt(a.NatDex) || 0;
                const numB = parseInt(b.NatDex) || 0;
                if (numA === numB) return (parseInt(a.Order) || 0) - (parseInt(b.Order) || 0);
                return numA - numB;
            } else {
                const valA = String(a[game] || "").trim();
                const valB = String(b[game] || "").trim();

                const matchA = valA.match(/^([A-Za-z]*)[-\s]*(\d+)$/);
                const matchB = valB.match(/^([A-Za-z]*)[-\s]*(\d+)$/);

                const prefixA = matchA ? matchA[1] : (isNaN(parseInt(valA)) ? valA : '');
                const numA = matchA ? parseInt(matchA[2], 10) : (parseInt(valA) || 0);

                const prefixB = matchB ? matchB[1] : (isNaN(parseInt(valB)) ? valB : '');
                const numB = matchB ? parseInt(matchB[2], 10) : (parseInt(valB) || 0);

                const prefixOrder = REGIONAL_PREFIX_ORDER[game];

                if (prefixOrder) {
                    let idxA = prefixOrder.indexOf(prefixA);
                    let idxB = prefixOrder.indexOf(prefixB);

                    if (idxA === -1) idxA = 999;
                    if (idxB === -1) idxB = 999;

                    if (idxA !== idxB) {
                        return idxA - idxB;
                    }
                } else {
                    if (prefixA !== prefixB) {
                        return prefixA.localeCompare(prefixB);
                    }
                }

                return numA - numB;
            }
        } else if (sort === 'natDex') {
            return (parseInt(a.NatDex) || 0) - (parseInt(b.NatDex) || 0);
        } else if (sort === 'name') {
            return String(a.Name).localeCompare(String(b.Name));
        }
    });

    displayData = processed;
}

function getGeneration(natDexNum) {
    const num = parseInt(natDexNum);
    if (num <= 151) return 1;
    if (num <= 251) return 2;
    if (num <= 386) return 3;
    if (num <= 493) return 4;
    if (num <= 649) return 5;
    if (num <= 721) return 6;
    if (num <= 809) return 7;
    if (num <= 905) return 8;
    return 9;
}

function getPrefix(gameIdStr) {
    const match = String(gameIdStr).trim().match(/^([A-Za-z]*)[-\s]*(\d+)$/);
    return match ? match[1] : '';
}

function buildBoxes() {
    const boxes = [];
    let currentBox = [];
    let currentGroup = null;
    const useGap = currentConfig.gap === 'gap';

    for (let i = 0; i < displayData.length; i++) {
        const p = displayData[i];
        let itemGroup = null;

        if (useGap && currentConfig.sort === 'game') {
            if (currentConfig.game === 'NatDex') {
                itemGroup = getGeneration(p.NatDex);
            } else {
                itemGroup = getPrefix(p[currentConfig.game]);
            }
        }

        if (useGap && currentGroup !== null && itemGroup !== currentGroup && currentBox.length > 0) {
            while (currentBox.length < SLOTS_PER_BOX) currentBox.push(null);
            boxes.push(currentBox);
            currentBox = [];
        }

        currentGroup = itemGroup;

        p._globalIndex = i;
        currentBox.push(p);

        if (currentBox.length === SLOTS_PER_BOX) {
            boxes.push(currentBox);
            currentBox = [];
        }
    }

    if (currentBox.length > 0) {
        while (currentBox.length < SLOTS_PER_BOX) currentBox.push(null);
        boxes.push(currentBox);
    }

    return boxes;
}

function renderBoxes() {
    els.container.innerHTML = '';

    if (displayData.length === 0) {
        els.container.innerHTML = `<div class="empty-state">No Pokémon found for these filters.</div>`;
        return;
    }

    const boxes = buildBoxes();

    boxes.forEach((boxData, boxIdx) => {
        const boxWrapper = document.createElement('div');
        boxWrapper.className = 'box-wrapper';

        const boxTitle = document.createElement('div');
        boxTitle.className = 'box-title';

        const titleText = document.createElement('span');
        titleText.textContent = `BOX ${boxIdx + 1}`;

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'box-actions';

        const collectBtn = document.createElement('button');
        collectBtn.className = 'btn-collect-box';
        collectBtn.innerHTML = `${ICONS.check} Collect`;
        collectBtn.title = "Mark all Pokémon in this box as collected";
        collectBtn.addEventListener('click', () => {
            let changed = false;
            boxData.forEach(p => {
                if (p) {
                    const kw = p.Keyword || `${p.NatDex}-${p._globalIndex}`;
                    if (!collectedState[kw]) {
                        collectedState[kw] = true;
                        changed = true;
                    }
                }
            });
            if (changed) {
                localStorage.setItem('dexboxer_collection', JSON.stringify(collectedState));
                renderBoxes();
                updateStats();
            }
        });

        const uncollectBtn = document.createElement('button');
        uncollectBtn.className = 'btn-uncollect-box';
        uncollectBtn.innerHTML = `${ICONS.btnCross} Clear`;
        uncollectBtn.title = "Mark all Pokémon in this box as uncollected";
        uncollectBtn.addEventListener('click', () => {
            let changed = false;
            boxData.forEach(p => {
                if (p) {
                    const kw = p.Keyword || `${p.NatDex}-${p._globalIndex}`;
                    if (collectedState[kw]) {
                        delete collectedState[kw];
                        changed = true;
                    }
                }
            });
            if (changed) {
                localStorage.setItem('dexboxer_collection', JSON.stringify(collectedState));
                renderBoxes();
                updateStats();
            }
        });

        actionsContainer.appendChild(collectBtn);
        actionsContainer.appendChild(uncollectBtn);

        boxTitle.appendChild(titleText);
        boxTitle.appendChild(actionsContainer);

        const boxGrid = document.createElement('div');
        boxGrid.className = 'pc-box';

        boxData.forEach((p, i) => {
            const slot = document.createElement('div');

            if (p) {
                const kw = p.Keyword || `${p.NatDex}-${p._globalIndex}`;
                const isCollected = !!collectedState[kw];

                slot.className = `pc-slot ${isCollected ? '' : 'uncollected'}`;
                slot.dataset.keyword = kw;

                const gameIdTxt = currentConfig.game === 'NatDex' ? `NatDex #${p.NatDex}` : `ID: ${p[currentConfig.game]}`;
                const formTxt = p['Form Name'] ? ` - ${p['Form Name']}` : '';
                const genderTxt = p.Gender ? (p.Gender === '-f' ? ' (Female)' : ` (${p.Gender})`) : '';
                slot.title = `${gameIdTxt} ${p.Name}${formTxt}${genderTxt}\nLeft-click: Track\nRight-click: Details`;

                const img = document.createElement('img');
                img.className = 'pokemon-sprite';
                img.alt = p.Name;
                img.loading = 'lazy';
                const cleanId = parseInt(p.NatDex);
                img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${cleanId}.png`;

                img.onerror = function () {
                    this.src = `https://placehold.co/64x64/e2e8f0/64748b?text=${String(p.Name).substring(0, 3)}`;
                };

                slot.appendChild(img);
                slot.addEventListener('click', () => toggleCollection(kw, slot));
                slot.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    showModal(p, kw, slot);
                });
            } else {
                slot.className = 'pc-slot empty';
            }
            boxGrid.appendChild(slot);
        });

        boxWrapper.appendChild(boxTitle);
        boxWrapper.appendChild(boxGrid);
        els.container.appendChild(boxWrapper);
    });
}

function toggleCollection(keyword, slotElement) {
    const isCurrentlyCollected = !!collectedState[keyword];
    collectedState[keyword] = !isCurrentlyCollected;

    localStorage.setItem('dexboxer_collection', JSON.stringify(collectedState));

    if (collectedState[keyword]) {
        slotElement.classList.remove('uncollected');
    } else {
        slotElement.classList.add('uncollected');
    }

    if (currentModalPokemon && currentModalPokemon.keyword === keyword) {
        updateModalStatus(collectedState[keyword]);
    }
    updateStats();
}

function updateStats() {
    if (displayData.length === 0) return;

    let collectedCount = 0;
    displayData.forEach(p => {
        const kw = p.Keyword || `${p.NatDex}`;
        if (collectedState[kw]) collectedCount++;
    });

    const percent = Math.round((collectedCount / displayData.length) * 100);
    els.statsMsg.innerHTML = `${collectedCount} / ${displayData.length} Collected <span class="stats-badge">${percent}%</span>`;
}

function flashStatusMessage(message, isError = false) {
    const originalHTML = `${ICONS.check} Loaded complete dataset`;
    els.statusMsg.innerHTML = `${isError ? ICONS.warning : ICONS.check} ${message}`;
    setTimeout(() => {
        els.statusMsg.innerHTML = originalHTML;
    }, 3000);
}

function handleExport() {
    const dataStr = JSON.stringify(collectedState);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dexboxer_collection.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    flashStatusMessage("Collection exported!");
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (typeof imported !== 'object' || imported === null) throw new Error("Invalid format");

            collectedState = imported;
            localStorage.setItem('dexboxer_collection', JSON.stringify(collectedState));
            renderBoxes();
            updateStats();
            flashStatusMessage("Collection successfully imported!");
        } catch (err) {
            flashStatusMessage("Error importing file! Invalid JSON.", true);
        }
        e.target.value = '';
    };
    reader.readAsText(file);
}

function showModal(pokemon, keyword, slotElement) {
    currentModalPokemon = { data: pokemon, keyword: keyword, element: slotElement };

    document.getElementById('modal-name').textContent = pokemon.Name || 'Unknown';
    document.getElementById('modal-natdex').textContent = (pokemon.NatDex || '???').padStart(4, '0');
    document.getElementById('modal-gameid').textContent = currentConfig.game === 'NatDex' ? pokemon.NatDex : pokemon[currentConfig.game];
    document.getElementById('modal-form').textContent = pokemon['Form Name'] || 'Base Form';
    document.getElementById('modal-gender').textContent = pokemon.Gender === '-f' ? 'Female Variant' : (pokemon.Gender ? pokemon.Gender : 'Default');

    const cleanId = parseInt(pokemon.NatDex);
    const spriteEl = document.getElementById('modal-sprite');
    spriteEl.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${cleanId}.png`;
    spriteEl.onerror = function () {
        this.src = `https://placehold.co/128x128/e2e8f0/64748b?text=${String(pokemon.Name).substring(0, 3)}`;
    };

    updateModalStatus(!!collectedState[keyword]);
    els.modal.classList.add('show');
}

function updateModalStatus(isCollected) {
    const statusEl = document.getElementById('modal-status');
    const btn = els.modalToggleBtn;

    if (isCollected) {
        statusEl.textContent = "Collected";
        statusEl.className = "info-value status-collected";
        btn.innerHTML = `${ICONS.btnCross} Mark as Uncollected`;
        btn.className = "btn-toggle collected";
    } else {
        statusEl.textContent = "Not Collected";
        statusEl.className = "info-value status-uncollected";
        btn.innerHTML = `${ICONS.btnCheck} Mark as Collected`;
        btn.className = "btn-toggle uncollected";
    }
}

function hideModal() {
    els.modal.classList.remove('show');
    setTimeout(() => { currentModalPokemon = null; }, 300);
}

function attachEventListeners() {
    els.themeToggle.addEventListener('click', toggleTheme);
    els.btnExport.addEventListener('click', handleExport);

    els.btnImport.addEventListener('click', () => els.fileImport.click());
    els.fileImport.addEventListener('change', handleImport);

    els.gameSelect.addEventListener('change', updateView);
    els.compSelect.addEventListener('change', updateView);
    els.sortSelect.addEventListener('change', updateView);
    els.gapSelect.addEventListener('change', updateView);

    els.closeModal.addEventListener('click', hideModal);
    els.modal.addEventListener('click', (e) => {
        if (e.target === els.modal) hideModal();
    });

    els.modalToggleBtn.addEventListener('click', () => {
        if (currentModalPokemon) {
            toggleCollection(currentModalPokemon.keyword, currentModalPokemon.element);
        }
    });
}

window.addEventListener('DOMContentLoaded', init);