const canvas = document.getElementById('gameCanvas');
canvas.width = 800;
canvas.height = 640;
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const GRAVITY = 0.5;
const ROWS = 20;
const COLS = 25;

// --- Images ---
const playerImg = new Image();
playerImg.src = 'images/player.png';
const obstacleImg = new Image();
obstacleImg.src = 'images/obstacle.png';
const solImg = new Image();
solImg.src = 'images/sol.png';

// --- Audio ---
const bgMusic = new Audio('audio/background.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
bgMusic.play();
const jumpSound = new Audio('audio/jump.mp3');
const deathSound = new Audio('audio/cridemort.mp3');

// --- Chargement images ---
let imagesLoaded = 0;
function checkAllLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 3) update();
}
playerImg.onload = checkAllLoaded;
obstacleImg.onload = checkAllLoaded;
solImg.onload = checkAllLoaded;

// --- Joueur ---
let player = {
    x: TILE_SIZE * 2,
    y: canvas.height - TILE_SIZE * 2,
    width: TILE_SIZE,
    height: TILE_SIZE,
    dx: 0,
    dy: 0,
    speed: 3,
    jumpPower: 8,
    onGround: false
};

// --- Caméra ---
let cameraX = 0;

// --- Niveau infini ---
let levels = [generateLevel()];
let offsetX = 0;

// --- Génération d'une section ---
function generateLevel() {
    const level = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    for (let x = 0; x < COLS; x++) level[ROWS - 1][x] = 1;

    let prevY = ROWS - 1;
    let prevX = 0;

    while (prevX < COLS - 2) {
        let platformLength = Math.floor(Math.random() * 5) + 3;
        let gap = Math.floor(Math.random() * 4) + 1;
        let newX = prevX + gap;
        if (newX + platformLength >= COLS) break;

        let deltaY = Math.floor(Math.random() * 3) - 1;
        let newY = Math.max(2, Math.min(ROWS - 2, prevY + deltaY));

        for (let x = newX; x < newX + platformLength; x++) level[newY][x] = 1;

        if (Math.random() < 0.3) {
            let obsX = newX + Math.floor(Math.random() * platformLength);
            level[newY - 1][obsX] = 2;
        }

        prevX = newX + platformLength;
        prevY = newY;
    }
    return level;
}

// --- Touches ---
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// --- Reset joueur ---
function resetPlayer() {
    deathSound.play();
    setTimeout(() => deathSound.pause(), 3000);

    player.x = TILE_SIZE * 2;
    player.y = canvas.height - TILE_SIZE * 2;
    player.dx = 0;
    player.dy = 0;
    player.onGround = false;
    cameraX = 0;
    levels = [generateLevel()];
}

// --- Dessin du niveau infini ---
function drawLevel() {
    for (let l = 0; l < levels.length; l++) {
        const level = levels[l];
        for (let y = 0; y < level.length; y++) {
            for (let x = 0; x < level[y].length; x++) {
                const tile = level[y][x];
                const drawX = x * TILE_SIZE + l * COLS * TILE_SIZE - cameraX;
                const drawY = y * TILE_SIZE;
                if (tile === 1) ctx.drawImage(solImg, drawX, drawY, TILE_SIZE, TILE_SIZE);
                else if (tile === 2) ctx.drawImage(obstacleImg, drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

// --- Collisions ---
function handleCollisions(axis) {
    const left = Math.floor((player.x + cameraX) / TILE_SIZE);
    const right = Math.floor((player.x + player.width + cameraX - 1) / TILE_SIZE);
    const top = Math.floor(player.y / TILE_SIZE);
    const bottom = Math.floor((player.y + player.height - 1) / TILE_SIZE);

    for (let l = 0; l < levels.length; l++) {
        const level = levels[l];
        for (let y = top; y <= bottom; y++) {
            for (let x = left - l * COLS; x <= right - l * COLS; x++) {
                if (!level[y] || !level[y][x]) continue;
                const tile = level[y][x];
                if (tile === 1) {
                    if (axis === 'y') {
                        if (player.dy > 0) {
                            player.y = y * TILE_SIZE - player.height;
                            player.dy = 0;
                            player.onGround = true;
                        } else if (player.dy < 0) {
                            player.y = (y + 1) * TILE_SIZE;
                            player.dy = 0;
                        }
                    } else if (axis === 'x') {
                        if (player.dx > 0) player.x = x * TILE_SIZE + l * COLS * TILE_SIZE - cameraX - player.width;
                        else if (player.dx < 0) player.x = x * TILE_SIZE + l * COLS * TILE_SIZE - cameraX + TILE_SIZE;
                    }
                } else if (tile === 2) {
                    resetPlayer();
                }
            }
        }
    }

    if (player.y > canvas.height) resetPlayer();
}

// --- Génération infinie contrôlée ---
function generateNextSectionIfNeeded() {
    const currentLevelEnd = levels.length * COLS * TILE_SIZE;
    if (cameraX + canvas.width + TILE_SIZE * 5 > currentLevelEnd) {
        levels.push(generateLevel());
    }
}

// --- Boucle du jeu ---
function update() {
    player.dx = 0;
    if (keys['ArrowLeft']) player.dx = -player.speed;
    if (keys['ArrowRight']) player.dx = player.speed;

    if (keys['ArrowUp'] && player.onGround) {
        player.dy = -player.jumpPower;
        player.onGround = false;
        jumpSound.play();
    }

    player.dy += GRAVITY;
    player.x += player.dx;
    handleCollisions('x');
    player.y += player.dy;
    handleCollisions('y');

    // Caméra qui suit doucement
    const CAMERA_OFFSET = canvas.width / 3;
    if (player.x - cameraX > CAMERA_OFFSET) cameraX = player.x - CAMERA_OFFSET;
    if (player.x - cameraX < CAMERA_OFFSET / 2) cameraX = player.x - CAMERA_OFFSET / 2;

    generateNextSectionIfNeeded();
    draw();
    requestAnimationFrame(update);
}

// --- Dessin ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLevel();
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}
