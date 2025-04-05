// --- Game Configuration ---
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.6;
const JUMP_FORCE = -11;
const GROUND_Y_OFFSET = 50;
const LLAMA_BODY_WIDTH = 16;
const LLAMA_BODY_HEIGHT = 22;
const LLAMA_X_POS = 70;
const GAME_SPEED_START = 6;
const GAME_SPEED_INCREMENT = 0.0015;

// Obstacle Config
const MIN_OBSTACLE_SPACING = 350; const MAX_OBSTACLE_SPACING = 750;
const CACTUS_WIDTH = 18; const CACTUS_HEIGHT_SMALL = 35; const CACTUS_HEIGHT_LARGE = 45;
const BIRD_WIDTH = 30; const BIRD_HEIGHT = 18; const BIRD_ALTITUDE_LOW = 55; const BIRD_ALTITUDE_HIGH = 95;

// Coin Config
const COIN_SIZE = 15;
const MIN_COIN_SPACING = 200; const MAX_COIN_SPACING = 500;
const COIN_GROUND_CLEARANCE = 30; const COIN_MAX_HEIGHT_FACTOR = 5.5;
const COIN_MAGNET_RANGE = 80; const COIN_MAGNET_STRENGTH = 0.1;
const COIN_MAGNET_DURATION_SCORE = 300;

// Background Config
const CLOUD_MIN_SPACING = 200; const CLOUD_MAX_SPACING = 500;
const CLOUD_SPEED_FACTOR = 0.3; const STAR_SPEED_FACTOR = 0.1;
const SCORE_PER_CYCLE_PHASE = 700;

// Store Config
const STORE_ITEM_SHIELD_COST = 50;
const STORE_ITEM_EXTRA_LIFE_COST = 100;
const STORE_ITEM_MAGNET_COST = 75;
const STORE_ITEM_COLOR_COST = 150;
const STORE_ITEM_NO_ADS_COST = 500;

// --- Color Definitions ---
let DEFAULT_PLAYER_COLOR, CACTUS_COLOR, BIRD_COLOR, COIN_COLOR;
let GROUND_DAY_COLOR, GROUND_NIGHT_COLOR;
let SKY_DAY_COLOR, SKY_NIGHT_COLOR;
let TEXT_DAY_COLOR, TEXT_NIGHT_COLOR, TEXT_INFO_COLOR;
let CLOUD_COLOR, STAR_COLOR;
let BUTTON_COLOR, BUTTON_TEXT_COLOR, BUTTON_HOVER_COLOR, BUTTON_PRESS_COLOR, BUTTON_STROKE_COLOR;
let BUTTON_ALT_COLOR, BUTTON_ALT_HOVER_COLOR, BUTTON_ALT_PRESS_COLOR;
let BUTTON_DISABLED_COLOR, BUTTON_DISABLED_TEXT_COLOR;

// --- Global Variables ---
let player;
let obstacles = []; let clouds = []; let stars = []; let coins = [];
let groundY;
let score = 0; let highScore = 0;
let totalCoins = 0; let coinsCollectedThisRun = 0;
let gameSpeed;
let gameState = 'menu';
let nextObstacleDist, nextCloudDist, nextStarDist, nextCoinDist;
let currentBgType = 'day';
let screenFlashAlpha = 0;

// --- Persistent Store/Settings Variables ---
let purchasedColors = ['default']; let equippedColorId = 'default';
let currentPlayerColor; let hasNoAds = false;
let shieldEnabledForNextRun = false; let extraLifeEnabledForNextRun = false; let magnetEnabledForNextRun = false;

// --- Sound Variables ---
let jumpOsc, coinOsc, gameOverOsc, purchaseSoundOsc, buttonClickSoundOsc, powerupSoundOsc;
let jumpEnv, coinEnv, gameOverEnv, purchaseSoundEnv, buttonClickSoundEnv, powerupSoundEnv;
let audioInitialized = false;

// --- Store Item Definitions ---
const llamaColors = [ { id: 'default', name: 'Beige', value: [222, 184, 135], cost: 0 }, { id: 'red', name: 'Red', value: [255, 80, 80], cost: STORE_ITEM_COLOR_COST }, { id: 'blue', name: 'Blue', value: [80, 120, 255], cost: STORE_ITEM_COLOR_COST }, { id: 'green', name: 'Green', value: [80, 200, 80], cost: STORE_ITEM_COLOR_COST }, { id: 'purple', name: 'Purple', value: [180, 100, 255], cost: STORE_ITEM_COLOR_COST } ];

// --- UI Elements ---
let startButton, storeButtonMenu, restartButton, storeButtonGameOver, backButtonStore;
let purchaseNoAdsButton;
let powerupButtons = [];
let colorButtons = [];
let clickedButton = null;

// --- p5.js Functions ---

function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    pixelDensity(1);

    // Initialize Colors
    DEFAULT_PLAYER_COLOR = color(llamaColors.find(c => c.id === 'default').value);
    CACTUS_COLOR = color(0, 150, 0); BIRD_COLOR = color(100, 100, 180); COIN_COLOR = color(255, 215, 0);
    GROUND_DAY_COLOR = color(60, 130, 60); GROUND_NIGHT_COLOR = color(70, 60, 50);
    SKY_DAY_COLOR = color(135, 206, 250); SKY_NIGHT_COLOR = color(30, 30, 100);
    TEXT_DAY_COLOR = color(50); TEXT_NIGHT_COLOR = color(240); TEXT_INFO_COLOR = color(80, 80, 80, 200);
    CLOUD_COLOR = color(255, 255, 255, 200); STAR_COLOR = color(255, 255, 200);
    BUTTON_COLOR = color(90, 190, 90); BUTTON_TEXT_COLOR = color(255); BUTTON_HOVER_COLOR = color(110, 210, 110); BUTTON_PRESS_COLOR = color(70, 170, 70); BUTTON_STROKE_COLOR = color(40, 100, 40);
    BUTTON_ALT_COLOR = color(100, 150, 200); BUTTON_ALT_HOVER_COLOR = color(120, 170, 220); BUTTON_ALT_PRESS_COLOR = color(80, 130, 180);
    BUTTON_DISABLED_COLOR = color(180); BUTTON_DISABLED_TEXT_COLOR = color(120);

    groundY = height - GROUND_Y_OFFSET;
    loadData();
    updateCurrentPlayerColor();

    textFont('monospace', 18);
    textAlign(CENTER, CENTER);
    rectMode(CORNER); ellipseMode(CENTER);

    setupUIElements();
    resetGameVariables();
}

function loadData() {
    try {
        let storedHighScore = localStorage.getItem('llamaRunnerHighScore'); let storedCoins = localStorage.getItem('llamaRunnerTotalCoins'); let storedColors = localStorage.getItem('llamaRunnerPurchasedColors'); let storedEquipped = localStorage.getItem('llamaRunnerEquippedColor'); let storedNoAds = localStorage.getItem('llamaRunnerNoAds');
        if (storedHighScore) highScore = parseInt(storedHighScore) || 0;
        if (storedCoins) totalCoins = parseInt(storedCoins) || 0;
        if (storedColors) { try { purchasedColors = JSON.parse(storedColors); if (!Array.isArray(purchasedColors)) purchasedColors = ['default']; } catch (e) { console.warn("Could not parse purchased colors, resetting:", e); purchasedColors = ['default']; } } else { purchasedColors = ['default']; }
        if (storedEquipped) equippedColorId = storedEquipped; else equippedColorId = 'default';
        if (storedNoAds) hasNoAds = JSON.parse(storedNoAds) === true; else hasNoAds = false;
        if (!purchasedColors.includes('default')) { purchasedColors.push('default'); saveData('purchasedColors'); }
        if (!llamaColors.some(c => c.id === equippedColorId) || !purchasedColors.includes(equippedColorId)) { equippedColorId = 'default'; saveData('equippedColorId'); }
    } catch (e) { console.error("Error loading data from localStorage:", e); highScore = 0; totalCoins = 0; purchasedColors = ['default']; equippedColorId = 'default'; hasNoAds = false; }
}

function saveData(dataType) {
    try {
        switch (dataType) {
            case 'highScore': localStorage.setItem('llamaRunnerHighScore', highScore); break;
            case 'totalCoins': localStorage.setItem('llamaRunnerTotalCoins', totalCoins); break;
            case 'purchasedColors': localStorage.setItem('llamaRunnerPurchasedColors', JSON.stringify(purchasedColors)); break;
            case 'equippedColorId': localStorage.setItem('llamaRunnerEquippedColor', equippedColorId); break;
            case 'hasNoAds': localStorage.setItem('llamaRunnerNoAds', JSON.stringify(hasNoAds)); break;
            case 'all': localStorage.setItem('llamaRunnerHighScore', highScore); localStorage.setItem('llamaRunnerTotalCoins', totalCoins); localStorage.setItem('llamaRunnerPurchasedColors', JSON.stringify(purchasedColors)); localStorage.setItem('llamaRunnerEquippedColor', equippedColorId); localStorage.setItem('llamaRunnerNoAds', JSON.stringify(hasNoAds)); break;
        }
    } catch (e) { console.error("Error saving data to localStorage:", e); }
}

function updateCurrentPlayerColor() {
    const colorData = llamaColors.find(c => c.id === equippedColorId);
    if (colorData) { currentPlayerColor = color(colorData.value); } else { currentPlayerColor = DEFAULT_PLAYER_COLOR; equippedColorId = 'default'; }
}

function setupUIElements() { // Powerup Grid + Color Grid
    let btnW = 190; let btnH = 55; let centerX = width / 2; let centerY = height / 2; let menuStartY = centerY - 50;
    startButton = { x: centerX - btnW / 2, y: menuStartY, w: btnW, h: btnH, text: "Start Game" };
    storeButtonMenu = { x: centerX - btnW / 2, y: menuStartY + btnH + 15, w: btnW, h: btnH, text: "Store" };
    let goBtnY = height * 0.75;
    restartButton = { x: centerX - btnW - 25, y: goBtnY, w: btnW, h: btnH, text: "Restart" };
    storeButtonGameOver = { x: centerX + 25, y: goBtnY, w: btnW, h: btnH, text: "Store" };

    let storePadding = 40; let storeTitleY = 30; let sectionGap = 35; let buttonGap = 15;
    backButtonStore = { x: storePadding, y: height - 50 - storePadding, w: 120, h: 40, text: "Back", type: 'alt' };

    // Power-up Grid Setup (2x2)
    powerupButtons = [];
    let powerupGridStartX = storePadding; let powerupGridStartY = storeTitleY + 60;
    let powerupBtnW = 200; let powerupBtnH = 50;
    const powerups = [
        { text: `Shield - ${STORE_ITEM_SHIELD_COST}`, id: 'shield', cost: STORE_ITEM_SHIELD_COST, flag: 'shieldEnabledForNextRun' },
        { text: `Extra Life - ${STORE_ITEM_EXTRA_LIFE_COST}`, id: 'extra_life', cost: STORE_ITEM_EXTRA_LIFE_COST, flag: 'extraLifeEnabledForNextRun' },
        { text: `Coin Magnet - ${STORE_ITEM_MAGNET_COST}`, id: 'magnet', cost: STORE_ITEM_MAGNET_COST, flag: 'magnetEnabledForNextRun' }
    ];
    for (let i = 0; i < powerups.length; i++) {
        let col = i % 2; let row = floor(i / 2);
        powerupButtons.push({
            x: powerupGridStartX + col * (powerupBtnW + buttonGap),
            y: powerupGridStartY + row * (powerupBtnH + buttonGap),
            w: powerupBtnW, h: powerupBtnH, text: powerups[i].text, // Base text
            id: powerups[i].id, cost: powerups[i].cost, flag: powerups[i].flag, type: 'alt'
        });
    }
    // Position "Remove Ads" below the power-up grid area
    let powerupGridRows = ceil(powerups.length / 2);
    let removeAdsY = powerupGridStartY + powerupGridRows * (powerupBtnH + buttonGap);
    purchaseNoAdsButton = { x: powerupGridStartX, y: removeAdsY, w: powerupBtnW * 2 + buttonGap, h: powerupBtnH, text: `Remove Ads - ${STORE_ITEM_NO_ADS_COST}`, id: 'no_ads', type: 'alt' };

    // Color Grid Setup
    colorButtons = [];
    let colorGridStartX = width / 2 + storePadding; let colorGridStartY = powerupGridStartY; // Align top
    let colorBtnW = 160; let colorBtnH = 45;
    let purchasableColors = llamaColors.filter(c => c.id !== 'default');
    for(let i = 0; i < purchasableColors.length; i++) { let color = purchasableColors[i]; let col = i % 2; let row = floor(i / 2); let btnX = colorGridStartX + col * (colorBtnW + buttonGap); let btnY = colorGridStartY + row * (colorBtnH + buttonGap); colorButtons.push({ x: btnX, y: btnY, w: colorBtnW, h: colorBtnH, name: color.name, id: color.id, cost: color.cost, colorValue: color.value, type: 'alt' }); }
}


function initAudio() {
    if (audioInitialized) return; try { jumpEnv = new p5.Envelope(0.005, 0.05, 0.1, 0.1); jumpEnv.setRange(0.8, 0); jumpOsc = new p5.Oscillator('sine', 660); jumpOsc.amp(jumpEnv); jumpOsc.start(); coinEnv = new p5.Envelope(0.01, 0.08, 0.1, 0.15); coinEnv.setRange(0.7, 0); coinOsc = new p5.Oscillator('triangle', 880); coinOsc.amp(coinEnv); coinOsc.start(); gameOverEnv = new p5.Envelope(0.02, 0.3, 0.1, 0.5); gameOverEnv.setRange(0.9, 0); gameOverOsc = new p5.Oscillator('sawtooth', 220); gameOverOsc.amp(gameOverEnv); gameOverOsc.start(); purchaseSoundEnv = new p5.Envelope(0.01, 0.1, 0.2, 0.2); purchaseSoundEnv.setRange(0.6, 0); purchaseSoundOsc = new p5.Oscillator('square', 988); purchaseSoundOsc.amp(purchaseSoundEnv); purchaseSoundOsc.start(); buttonClickSoundEnv = new p5.Envelope(0.001, 0.05, 0.0, 0.1); buttonClickSoundEnv.setRange(0.5, 0); buttonClickSoundOsc = new p5.Oscillator('sine', 523); buttonClickSoundOsc.amp(buttonClickSoundEnv); buttonClickSoundOsc.start(); powerupSoundEnv = new p5.Envelope(0.01, 0.15, 0.1, 0.2); powerupSoundEnv.setRange(0.7, 0); powerupSoundOsc = new p5.Oscillator('triangle', 1318); powerupSoundOsc.amp(powerupSoundEnv); powerupSoundOsc.start(); audioInitialized = true; console.log("Audio Initialized"); } catch (e) { console.error("Failed to initialize audio:", e); audioInitialized = false; }
}
function playSound(type) {
    if (!audioInitialized) return; try { switch (type) { case 'jump': jumpEnv.play(); break; case 'coin': coinEnv.play(); break; case 'gameOver': gameOverEnv.play(); break; case 'purchase': purchaseSoundEnv.play(); break; case 'buttonClick': buttonClickSoundEnv.play(); break; case 'powerup': powerupSoundEnv.play(); break; } } catch (e) { console.error("Error playing sound:", type, e); }
}

// --- Main Draw Loop ---
function draw() {
    drawBackground(); drawGround(); drawBackgroundElements();
    switch (gameState) {
        case 'menu': drawMenu(); break;
        case 'playing': drawGame(); break;
        case 'gameOver': drawGameOverScreen(); break;
        case 'store': drawStore(); break;
    }
     if (gameState === 'playing' || gameState === 'gameOver') { drawHUD(); }
     if (screenFlashAlpha > 0) { fill(255, 255, 255, screenFlashAlpha); rect(0, 0, width, height); screenFlashAlpha -= 5; }
}

// --- State Drawing Functions ---
function drawMenu() {
    let currentTextColor = currentBgType === 'day' ? TEXT_DAY_COLOR : TEXT_NIGHT_COLOR; textAlign(CENTER, CENTER); textSize(52); fill(currentTextColor); text("Llama Runner", width / 2, height / 3.5); drawButton(startButton); drawButton(storeButtonMenu); textSize(16); fill(TEXT_INFO_COLOR); let instructionY = storeButtonMenu.y + storeButtonMenu.h + 40; text("[SPACE] or [UP] to Jump", width / 2, instructionY); text("[DOWN] to Duck (when running)", width / 2, instructionY + 25); textAlign(CENTER, CENTER);
}
function drawGame() {
    if (gameState === 'playing') { player.update(); updateObstacles(); updateCoins(); updateScoreAndSpeed(); checkCollisions(); if (gameState === 'playing') { checkBackgroundChange(); updateBackgroundElements(); } } drawCoins(); player.show(); drawObstacles();
}
function drawGameOverScreen() {
     drawCoins(); player.show(); drawObstacles();
}

function drawStore() { // *** UPDATED with Powerup Grid & Correct Text ***
    let currentTextColor = currentBgType === 'day' ? TEXT_DAY_COLOR : TEXT_NIGHT_COLOR;
    let storeTitleSize = 36; let sectionTitleSize = 22; let itemTextSize = 16;
    let titleY = 30; let sectionStartY = titleY + 60;

    textAlign(CENTER, TOP); textSize(storeTitleSize); fill(currentTextColor); text("Store", width / 2, titleY);
    textSize(20); textAlign(LEFT, TOP); text(`Coins: ${totalCoins}`, 30, titleY);

    drawButton(backButtonStore);

    // --- Power-ups Section ---
    let powerupTitleX = powerupButtons.length > 0 ? powerupButtons[0].x : 40;
    textAlign(LEFT, TOP); textSize(sectionTitleSize); fill(currentTextColor);
    text("Power-ups (Single Use):", powerupTitleX, sectionStartY - 30); // Title above grid

    powerupButtons.forEach(btn => {
        let isEquipped = window[btn.flag];
        let override = isEquipped ? "ACTIVE (Next Run)" : null; // Correct status text
        let isDisabled = isEquipped || totalCoins < btn.cost;
        // Let drawButton handle the text display for powerups
        drawButton(btn, override, isDisabled, isEquipped ? color(150, 250, 150) : null);
    });

    // --- Remove Ads Section --- (Positioned below powerup grid)
    stroke(currentTextColor, 100); strokeWeight(1);
    line(powerupTitleX, purchaseNoAdsButton.y - sectionGap/2, powerupTitleX + purchaseNoAdsButton.w, purchaseNoAdsButton.y - sectionGap/2);
    let isDisabledNoAds = hasNoAds || totalCoins < STORE_ITEM_NO_ADS_COST;
    drawButton(purchaseNoAdsButton, hasNoAds ? "PURCHASED" : null, isDisabledNoAds);


    // --- Llama Colors Section ---
    let colorTitleX = colorButtons.length > 0 ? colorButtons[0].x : width / 2 + 40;
    textAlign(LEFT, TOP); textSize(sectionTitleSize); fill(currentTextColor);
    text("Llama Colors:", colorTitleX, sectionStartY - 30); // Title above grid

    if (colorButtons.length > 0) {
        colorButtons.forEach(btn => {
            let isOwned = purchasedColors.includes(btn.id); let isEquipped = btn.id === equippedColorId; let canAfford = totalCoins >= btn.cost;
            let buttonInternalText = ""; // Text INSIDE button rect
            if (isOwned) { buttonInternalText = isEquipped ? "EQUIPPED" : "Equip"; }
             else { buttonInternalText = `${btn.cost}`; } // Show cost only inside button
            let isDisabled = !isOwned && !canAfford;

            // 1. Draw Button Background/State (Pass empty string for automatic text)
            drawButton(btn, "", isDisabled, isEquipped ? color(150, 250, 150) : null);

            // 2. Draw Swatch (left side)
            let swatchSize = 24; let swatchX = btn.x + 10; let swatchY = btn.y + btn.h / 2 - swatchSize / 2;
            fill(btn.colorValue); stroke(isDisabled ? 150 : 50); strokeWeight(1); rect(swatchX, swatchY, swatchSize, swatchSize, 3);

            // 3. Draw Action/Cost Text (Manually, right side) - ** NO NAME HERE **
            let actionTextColor = isDisabled ? BUTTON_DISABLED_TEXT_COLOR : BUTTON_TEXT_COLOR;
            if (isEquipped && isOwned) actionTextColor = color(0); // Black text if equipped highlight
            fill(actionTextColor);
            textSize(14); textAlign(RIGHT, CENTER);
            text(buttonInternalText, btn.x + btn.w - 10, btn.y + btn.h / 2);
        });
     }
     textAlign(CENTER, CENTER); // Reset default alignment
}


// --- UI Helper ---
function drawButton(btn, overrideText = null, disabled = false, highlightColor = null) { // Simplified internal text logic
    if (!btn) return;
    let isAlt = btn.type === 'alt'; let baseColor = isAlt ? BUTTON_ALT_COLOR : BUTTON_COLOR; let hoverColor = isAlt ? BUTTON_ALT_HOVER_COLOR : BUTTON_HOVER_COLOR; let pressColor = isAlt ? BUTTON_ALT_PRESS_COLOR : BUTTON_PRESS_COLOR; let currentButtonColor = baseColor; let currentButtonTextColor = BUTTON_TEXT_COLOR; let currentStrokeColor = BUTTON_STROKE_COLOR;
    let effectiveText = overrideText !== null ? overrideText : (btn.text || ''); // Use override if provided, else button's base text
    let hovering = isMouseOver(btn);

    if (disabled) { currentButtonColor = BUTTON_DISABLED_COLOR; currentButtonTextColor = BUTTON_DISABLED_TEXT_COLOR; currentStrokeColor = color(140); }
    else if (clickedButton === btn) { currentButtonColor = pressColor; currentStrokeColor = color(red(pressColor)*0.8, green(pressColor)*0.8, blue(pressColor)*0.8); }
    else if (hovering) { currentButtonColor = hoverColor; }
    else if (highlightColor) { currentButtonColor = highlightColor; currentButtonTextColor = color(0); currentStrokeColor = color(red(highlightColor)*0.7, green(highlightColor)*0.7, blue(highlightColor)*0.7); }

    // 1. Draw Button Background/Border
    fill(currentButtonColor); strokeWeight(2); stroke(currentStrokeColor); rect(btn.x, btn.y, btn.w, btn.h, 8);

    // 2. Draw Text **ONLY IF** effectiveText is not empty AND it's NOT a color button
    let isColorButton = colorButtons.includes(btn);
    if (!isColorButton && effectiveText !== "") {
        noStroke(); fill(currentButtonTextColor);
        let defaultTextSize = (btn.h > 45) ? 18 : 16; let smallTextSize = (btn.h > 45) ? 14 : 12;
        let paddingX = 15;
        let textX = btn.x + btn.w / 2; let textY = btn.y + btn.h / 2;
        let availableTextWidth = btn.w - 2 * paddingX;

        textAlign(CENTER, CENTER);
        textSize(defaultTextSize);
        // Check width and adjust size ONLY for the actual text being displayed
        if (textWidth(effectiveText) > availableTextWidth) {
            textSize(smallTextSize);
        }
        text(effectiveText, textX, textY); // Draw the text
    }
    // Reset defaults
    textSize(18);
    textAlign(CENTER, CENTER);
}
function isMouseOver(btn) { return btn && mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h; }

// --- Input Handling ---
function mousePressed() {
    if (!audioInitialized) { userStartAudio().then(() => initAudio()).catch(e => console.error(e)); return; }
    clickedButton = null; let buttonToCheck = null;
    if (gameState === 'menu') { if (isMouseOver(startButton)) buttonToCheck = startButton; else if (isMouseOver(storeButtonMenu)) buttonToCheck = storeButtonMenu; }
    else if (gameState === 'gameOver') { if (isMouseOver(restartButton)) buttonToCheck = restartButton; else if (isMouseOver(storeButtonGameOver)) buttonToCheck = storeButtonGameOver; }
    else if (gameState === 'store') {
        if (isMouseOver(backButtonStore)) buttonToCheck = backButtonStore;
        else {
            powerupButtons.forEach(btn => { if (isMouseOver(btn)) { let flagToCheck = window[btn.flag]; let canAfford = totalCoins >= btn.cost; if (!flagToCheck && canAfford) buttonToCheck = btn; } });
        }
        if (!buttonToCheck && isMouseOver(purchaseNoAdsButton) && !hasNoAds && totalCoins >= STORE_ITEM_NO_ADS_COST) buttonToCheck = purchaseNoAdsButton;
        if (!buttonToCheck) { for (let btn of colorButtons) { if (isMouseOver(btn)) { let isOwned = purchasedColors.includes(btn.id); if (isOwned || totalCoins >= btn.cost) { buttonToCheck = btn; break; } } } }
    }
    if (buttonToCheck) { clickedButton = buttonToCheck; }
}
function mouseReleased() {
    if (!clickedButton) return; if (isMouseOver(clickedButton)) { playSound('buttonClick'); switch (gameState) { case 'menu': if (clickedButton === startButton) startGame(); else if (clickedButton === storeButtonMenu) enterStore('menu'); break; case 'gameOver': if (clickedButton === restartButton) startGame(); else if (clickedButton === storeButtonGameOver) enterStore('gameOver'); break; case 'store': handleStoreClickRelease(clickedButton); break; } } clickedButton = null;
}
function handleStoreClickRelease(btn) {
    if (btn === backButtonStore) { exitStore(); return; }
    if (powerupButtons.includes(btn)) { let flagName = btn.flag; if (!window[flagName] && totalCoins >= btn.cost) { playSound('purchase'); totalCoins -= btn.cost; window[flagName] = true; saveData('totalCoins'); } return; }
    if (btn === purchaseNoAdsButton && !hasNoAds && totalCoins >= STORE_ITEM_NO_ADS_COST) { playSound('purchase'); totalCoins -= STORE_ITEM_NO_ADS_COST; hasNoAds = true; saveData('totalCoins'); saveData('hasNoAds'); return; }
    if (colorButtons.includes(btn)) { let isOwned = purchasedColors.includes(btn.id); if (isOwned) { equippedColorId = btn.id; updateCurrentPlayerColor(); saveData('equippedColorId'); } else { if (totalCoins >= btn.cost) { playSound('purchase'); totalCoins -= btn.cost; purchasedColors.push(btn.id); equippedColorId = btn.id; updateCurrentPlayerColor(); saveData('totalCoins'); saveData('purchasedColors'); saveData('equippedColorId'); } } return; }
}
function keyPressed() {
     if (!audioInitialized) { userStartAudio().then(() => initAudio()).catch(e => console.error(e)); return; } if (gameState === 'playing' && player) { if (key === ' ' || keyCode === UP_ARROW) { player.jump(); } else if (keyCode === DOWN_ARROW) { player.duck(); } } else if (gameState === 'gameOver') { if (key === ' ' || keyCode === UP_ARROW || keyCode === ENTER) { playSound('buttonClick'); startGame(); } } else if (gameState === 'menu') { if (key === ' ' || keyCode === UP_ARROW || keyCode === ENTER) { playSound('buttonClick'); startGame(); } }
 }
 function keyReleased() {
      if (gameState === 'playing' && player) { if (keyCode === DOWN_ARROW) { player.stopDucking(); } }
}

// --- Game Flow Control ---
let previousGameState = 'menu';
function startGame() {
    resetGameVariables(); player = new Llama(); if (shieldEnabledForNextRun) { player.shieldActive = true; shieldEnabledForNextRun = false; } if (extraLifeEnabledForNextRun) { player.extraLifeActive = true; extraLifeEnabledForNextRun = false; } if (magnetEnabledForNextRun) { player.magnetActive = true; magnetEnabledForNextRun = false; } gameState = 'playing'; if (!isLooping()) { loop(); }
}
function enterStore(fromState) {
     previousGameState = fromState; gameState = 'store'; if (!isLooping()) { loop(); }
}
function exitStore() {
     gameState = previousGameState; if (gameState === 'gameOver' && !isLooping()) { loop(); }
}
function resetGameVariables() {
    obstacles = []; clouds = []; stars = []; coins = []; score = 0; coinsCollectedThisRun = 0; gameSpeed = GAME_SPEED_START; currentBgType = 'day'; nextObstacleDist = width; nextCloudDist = random(width*0.5, width); nextStarDist = random(width*0.5, width); nextCoinDist = width*0.8; screenFlashAlpha = 0;
}

// --- Core Game Logic ---
function updateScoreAndSpeed() { if (gameState === 'playing') { score += 0.2; gameSpeed += GAME_SPEED_INCREMENT; } }
function updateObstacles() { if (gameState !== 'playing') return; if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < width - nextObstacleDist) { spawnObstacle(); setNextObstacleDist(); } for (let i = obstacles.length - 1; i >= 0; i--) { obstacles[i].move(); if (obstacles[i].isOffscreen()) { obstacles.splice(i, 1); } } }
function updateCoins() { if (gameState !== 'playing') return; if (player && player.magnetActive && score >= COIN_MAGNET_DURATION_SCORE) { player.magnetActive = false; } if (coins.length === 0 || coins[coins.length - 1].x < width - nextCoinDist) { spawnCoin(); setNextCoinDist(); } for (let i = coins.length - 1; i >= 0; i--) { let coin = coins[i]; coin.move(); if (player && player.magnetActive) { let d = dist(player.x + player.w / 2, player.y - player.h / 2, coin.x + coin.w / 2, coin.y + coin.h / 2); if (d < COIN_MAGNET_RANGE) { coin.x += (player.x + player.w / 2 - (coin.x + coin.w / 2)) * COIN_MAGNET_STRENGTH; coin.y += (player.y - player.h / 2 - (coin.y + coin.h / 2)) * COIN_MAGNET_STRENGTH; } } if (coin.isOffscreen()) { coins.splice(i, 1); } } }
function spawnObstacle() { let type = random(1) > 0.4 ? 'cactus' : 'bird'; if (type === 'cactus') { obstacles.push(new Cactus(random(1) > 0.5 ? 'small' : 'large')); } else { let altitude = random(1) > 0.4 ? BIRD_ALTITUDE_LOW : BIRD_ALTITUDE_HIGH; obstacles.push(new Bird(altitude)); } }
function spawnCoin() { if (!player) return; let jumpReach = -JUMP_FORCE * 15; let maxCoinY = groundY - jumpReach * 0.8 - COIN_SIZE; let minCoinY = groundY - COIN_GROUND_CLEARANCE - COIN_SIZE - player.h * 0.5; let coinY = random(max(COIN_SIZE*2, minCoinY), maxCoinY); coinY = constrain(coinY, COIN_SIZE*2, groundY - COIN_GROUND_CLEARANCE - COIN_SIZE); coins.push(new Coin(coinY)); }
function checkCollisions() { if (gameState !== 'playing') return; for (let i = obstacles.length - 1; i >= 0; i--) { let obs = obstacles[i]; if (player.hits(obs)) { if (player.shieldActive) { player.shieldActive = false; playSound('powerup'); obstacles.splice(i, 1); continue; } if (player.extraLifeActive) { player.extraLifeActive = false; playSound('powerup'); screenFlashAlpha = 200; obstacles.splice(i, 1); continue; } playSound('gameOver'); gameState = 'gameOver'; totalCoins += coinsCollectedThisRun; saveData('totalCoins'); let finalScore = floor(score); if (finalScore > highScore) { highScore = finalScore; saveData('highScore'); } return; } } for (let i = coins.length - 1; i >= 0; i--) { if (player.hits(coins[i])) { coinsCollectedThisRun++; playSound('coin'); coins.splice(i, 1); } } }
function setNextObstacleDist() { nextObstacleDist = random(MIN_OBSTACLE_SPACING, MAX_OBSTACLE_SPACING); let speedFactor = max(0.5, (gameSpeed / GAME_SPEED_START)); nextObstacleDist /= speedFactor; nextObstacleDist = max(MIN_OBSTACLE_SPACING / 2, nextObstacleDist); }
function setNextCoinDist() { nextCoinDist = random(MIN_COIN_SPACING, MAX_COIN_SPACING); nextCoinDist = max(MIN_COIN_SPACING * 0.8, nextCoinDist); }
function checkBackgroundChange() { if (gameState !== 'playing') return; let phaseIndex = floor(score / SCORE_PER_CYCLE_PHASE); let targetBgType = (phaseIndex % 2 === 0) ? 'day' : 'night'; if (targetBgType !== currentBgType) { currentBgType = targetBgType; console.log(`Cycling background to: ${currentBgType} at score ${floor(score)}`); if (currentBgType === 'day') { stars = []; setNextCloudDist(); } else { clouds = []; setNextStarDist(); } } }

// --- Drawing Functions ---
function drawGround() { let currentGroundColor = (currentBgType === 'day') ? GROUND_DAY_COLOR : GROUND_NIGHT_COLOR; fill(currentGroundColor); noStroke(); rect(0, groundY, width, height - groundY); stroke(red(currentGroundColor)*0.7, green(currentGroundColor)*0.7, blue(currentGroundColor)*0.7); strokeWeight(3); line(0, groundY, width, groundY); }
function drawCoins() { for (let i = coins.length - 1; i >= 0; i--) { coins[i].show(); } }
function drawObstacles() { for (let obs of obstacles) obs.show(); }
function drawHUD() { let currentTextColor = (currentBgType === 'day') ? TEXT_DAY_COLOR : TEXT_NIGHT_COLOR; if (gameState === 'playing' || gameState === 'gameOver') { fill(currentTextColor); noStroke(); textSize(18); textAlign(LEFT, TOP); text(`Score: ${floor(score)}`, 15, 15); text(`Coins: ${coinsCollectedThisRun}`, 15, 40); textAlign(RIGHT, TOP); text(`HI: ${floor(highScore)}`, width - 15, 15); text(`Total: ${totalCoins}`, width - 15, 40); textAlign(CENTER, CENTER); } if (gameState === 'gameOver') { fill(0, 0, 0, 180); let panelY = height * 0.2; let panelH = height * 0.65; rect(width*0.1, panelY, width*0.8, panelH, 15); fill(255, 60, 60); textSize(52); text("GAME OVER", width / 2, panelY + panelH * 0.25); fill(240); textSize(26); text(`Final Score: ${floor(score)}`, width / 2, panelY + panelH * 0.5); textSize(22); text(`Coins Collected: ${coinsCollectedThisRun}`, width / 2, panelY + panelH * 0.65); textSize(18); drawButton(restartButton); drawButton(storeButtonGameOver); } }
function drawBackground() { background(currentBgType === 'day' ? SKY_DAY_COLOR : SKY_NIGHT_COLOR); }
function updateBackgroundElements() { if (gameState !== 'playing') return; let cloudTopY = 40; let cloudBottomY = height * 0.6; let starTopY = 20; let starBottomY = height * 0.7; if (currentBgType === 'day') { if (clouds.length === 0 || (clouds.length > 0 && clouds[clouds.length - 1].x < width - nextCloudDist)) { clouds.push(new Cloud(random(cloudTopY, cloudBottomY))); setNextCloudDist(); } let bgSpeed = gameSpeed * CLOUD_SPEED_FACTOR; for (let i = clouds.length - 1; i >= 0; i--) { clouds[i].move(bgSpeed); if (clouds[i].isOffscreen()) clouds.splice(i, 1); } } else { if (stars.length === 0 || (stars.length > 0 && stars[stars.length - 1].x < width - nextStarDist)) { stars.push(new Star(random(starTopY, starBottomY))); setNextStarDist(); } let starSpeed = gameSpeed * STAR_SPEED_FACTOR; for (let i = stars.length - 1; i >= 0; i--) { stars[i].move(starSpeed); if (stars[i].isOffscreen()) stars.splice(i, 1); } } }
function drawBackgroundElements() { if (currentBgType === 'day') { for (let cloud of clouds) cloud.show(); } else { for (let star of stars) star.show(); } }
function setNextCloudDist() { nextCloudDist = random(CLOUD_MIN_SPACING, CLOUD_MAX_SPACING); }
function setNextStarDist() { nextStarDist = random(80, 300); }

// --- Classes ---
class Llama { constructor(){ this.w=LLAMA_BODY_WIDTH;this.h=LLAMA_BODY_HEIGHT; this.x=LLAMA_X_POS; this.y=groundY - this.h; this.vy=0; this.isGrounded=true; this.legToggle=false; this.isDucking=false; this.shieldActive=false; this.extraLifeActive = false; this.magnetActive = false; let scaleFactor=0.75; this.neckOffsetX=this.w*0.6; this.neckOffsetY=-this.h*1.3*scaleFactor; this.neckW=this.w*0.5*scaleFactor; this.neckH=this.h*1.4*scaleFactor; this.headOffsetX=this.neckOffsetX-this.w*0.1*scaleFactor; this.headOffsetY=this.neckOffsetY-this.h*0.6*scaleFactor; this.headW=this.w*0.9*scaleFactor; this.headH=this.h*0.8*scaleFactor; this.snoutOffsetX=this.headOffsetX+this.headW*0.5; this.snoutOffsetY=this.headOffsetY+this.headH*0.3; this.snoutW=this.w*0.6*scaleFactor; this.snoutH=this.h*0.5*scaleFactor; this.ear1OffsetX=this.headOffsetX+this.headW*0.1; this.ear1OffsetY=this.headOffsetY-this.h*0.5*scaleFactor; this.ear2OffsetX=this.headOffsetX+this.headW*0.6; this.ear2OffsetY=this.headOffsetY-this.h*0.5*scaleFactor; this.earW=this.w*0.3*scaleFactor; this.earH=this.h*0.6*scaleFactor; this.tailOffsetX=-this.w*0.4*scaleFactor; this.tailOffsetY=-this.h*0.1*scaleFactor; this.tailW=this.w*0.5*scaleFactor; this.tailH=this.h*0.5*scaleFactor; this.eyeOffsetX=this.headOffsetX+this.headW*0.4; this.eyeOffsetY=this.headOffsetY+this.headH*0.3; this.eyeSize=max(2,3*scaleFactor); } jump(){if(this.isGrounded&&!this.isDucking){this.vy=JUMP_FORCE;this.isGrounded=false;playSound('jump');}} duck(){if(this.isGrounded){this.isDucking=true;}} stopDucking(){this.isDucking=false;} applyGravity(){ this.y+=this.vy; this.vy+=GRAVITY; let groundPos = groundY - this.h; if(this.y >= groundPos){this.y = groundPos; this.vy = 0; this.isGrounded = true; } } update(){this.applyGravity();if(this.isGrounded&&!this.isDucking&&frameCount%12<6)this.legToggle=true;else if(this.isGrounded&&!this.isDucking)this.legToggle=false;if(!this.isGrounded)this.isDucking=false;} show(){ push();translate(this.x,this.y);stroke(40);strokeWeight(1);let duckOffset=this.isDucking?this.h*0.5:0;fill(currentPlayerColor);rect(this.tailOffsetX,this.tailOffsetY+duckOffset*0.5,this.tailW,this.tailH,1);this.drawLegs(0,0,false);rect(0,duckOffset*0.2,this.w,this.h,2);rect(this.neckOffsetX,this.neckOffsetY+duckOffset,this.neckW,this.neckH,1);rect(this.headOffsetX,this.headOffsetY+duckOffset,this.headW,this.headH,2);rect(this.snoutOffsetX,this.snoutOffsetY+duckOffset,this.snoutW,this.snoutH,1);rect(this.ear1OffsetX,this.ear1OffsetY+duckOffset,this.earW,this.earH);rect(this.ear2OffsetX,this.ear2OffsetY+duckOffset,this.earW,this.earH);fill(0);noStroke();ellipse(this.eyeOffsetX+this.eyeSize/2,this.eyeOffsetY+duckOffset+this.eyeSize/2,this.eyeSize,this.eyeSize);this.drawLegs(0,0,true); if(this.shieldActive){noFill();stroke(0,150,255,180);strokeWeight(3);ellipse(this.w/2,-this.h*0.5+duckOffset,this.w*2.5,this.h*3.5);} if(this.extraLifeActive){fill(255,100,100,100); noStroke(); ellipse(this.w*0.8, -this.h*0.9 + duckOffset, 12, 12); fill(255); ellipse(this.w*0.8, -this.h*0.9 + duckOffset, 5, 5);} pop(); } drawLegs(baseX,baseY,isFrontLeg){ fill(currentPlayerColor);stroke(40);strokeWeight(1);let scaleFactor=0.75;let duckOffset=this.isDucking?this.h*0.2:0;let legBaseX=isFrontLeg?baseX+this.w*0.6:baseX+this.w*0.1; let legTopY=baseY+this.h*0.8+duckOffset; let legW=this.w*0.4*scaleFactor;let legH=this.h*0.8*scaleFactor;let hoofH=legH*0.25;let hoofW=legW*1.2; if(this.isGrounded&&!this.isDucking){if((isFrontLeg&&this.legToggle)||(!isFrontLeg&&!this.legToggle)){rect(legBaseX,legTopY,legW,legH);fill(80);rect(legBaseX-(hoofW-legW)/2,legTopY+legH,hoofW,hoofH);}else{rect(legBaseX,legTopY,legW,legH*0.9);fill(80);rect(legBaseX-(hoofW-legW)/2,legTopY+legH*0.9,hoofW,hoofH);}}else if(this.isDucking){let duckLegX=isFrontLeg?legBaseX+legW*0.1:legBaseX-legW*0.1;rect(duckLegX,legTopY,legW,legH*0.8);fill(80);rect(duckLegX-(hoofW-legW)/2,legTopY+legH*0.8,hoofW,hoofH);} else{let tuckX=isFrontLeg?legBaseX:baseX+legW*0.5;let tuckY=legTopY+legH*0.2;rect(tuckX,tuckY,legW*0.8,legH*0.6);fill(80);rect(tuckX-(hoofW-legW*0.8)/2,tuckY+legH*0.6,hoofW*0.9,hoofH*0.8);}} hits(other){ let duckOffset=this.isDucking?this.h*0.5:0;let currentHeadOffsetY=this.headOffsetY+duckOffset;let pLeft=this.x;let pRight=this.x+this.w+this.neckW; let pTop=this.y+currentHeadOffsetY;let pBottom=this.y+this.h+(this.h*0.8*0.75); if(this.isDucking){pTop=this.y+duckOffset*0.2;pBottom=this.y+this.h+5;} let oLeft=other.x;let oRight=other.x+other.w;let oTop=other.y;let oBottom=other.y+other.h; return pRight>oLeft&&pLeft<oRight&&pBottom>oTop&&pTop<oBottom;} }
class Obstacle {constructor(w, h, yPos){this.x=width;this.w=w;this.h=h;this.y=yPos;}move(){this.x-=gameSpeed;}isOffscreen(){return this.x<-this.w;}show(){}}
class Cactus extends Obstacle {constructor(size){let h=(size==='small')?CACTUS_HEIGHT_SMALL:CACTUS_HEIGHT_LARGE;super(CACTUS_WIDTH,h,groundY-h);this.size=size;}show(){fill(CACTUS_COLOR);noStroke();rect(this.x,this.y,this.w,this.h,2);if(this.size==='large')rect(this.x-this.w*0.4,this.y+this.h*0.3,this.w*1.8,this.h*0.25,1);else rect(this.x-this.w*0.2,this.y+this.h*0.5,this.w*1.4,this.h*0.2,1);}}
class Bird extends Obstacle {constructor(altitude){super(BIRD_WIDTH,BIRD_HEIGHT,groundY-altitude-BIRD_HEIGHT);this.wingToggle=false;}move(){this.x-=gameSpeed*1.1;this.wingToggle=frameCount%14<7;}show(){fill(BIRD_COLOR);noStroke();rect(this.x,this.y,this.w,this.h,3);fill(240);let wingW=this.w*0.6,wingH=this.h*0.7;if(this.wingToggle)rect(this.x+this.w*0.2,this.y-wingH*0.7,wingW,wingH,2);else rect(this.x+this.w*0.2,this.y+this.h*0.4,wingW,wingH,2);}}
class Coin {constructor(yPos){this.x=width;this.y=yPos;this.w=COIN_SIZE;this.h=COIN_SIZE;}move(){this.x-=gameSpeed;}show(){fill(COIN_COLOR);stroke(184,134,11);strokeWeight(1);ellipse(this.x+this.w/2,this.y+this.h/2,this.w,this.h);fill(255,255,150);noStroke();ellipse(this.x+this.w/2,this.y+this.h/2,this.w*0.6,this.h*0.6);}isOffscreen(){return this.x<-this.w;}}
class Cloud {constructor(yPos){this.x=width;this.y=yPos;this.w=random(50,100);this.h=random(20,35);}move(speed){this.x-=speed;}show(){fill(CLOUD_COLOR);noStroke();rect(this.x,this.y,this.w,this.h,10);rect(this.x+this.w*0.2,this.y-this.h*0.4,this.w*0.7,this.h*1.8,12);rect(this.x-this.w*0.15,this.y+this.h*0.1,this.w*0.9,this.h*0.9,8);}isOffscreen(){return this.x<-this.w*1.5;}}
class Star {constructor(yPos){this.x=width;this.y=yPos;this.size=random(1.5,4);this.twinkle=random(150,255);}move(speed){this.x-=speed;if(frameCount%10===0)this.twinkle=random(150,255);}show(){fill(STAR_COLOR.levels[0],STAR_COLOR.levels[1],STAR_COLOR.levels[2],this.twinkle);noStroke();ellipse(this.x,this.y,this.size,this.size);}isOffscreen(){return this.x<-this.size;}}