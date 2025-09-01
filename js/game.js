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
const jumpSound = new Audio('audio/jump.mp3');
const deathSound = new Audio('audio/cridemort.mp3');

// --- Joueur ---
let player = {
    x: canvas.width / 3,
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
let totalOffset = 0; // décalage total pour score et collisions

// --- Coyote time ---
const COYOTE_FRAMES = 10;
let coyoteTime = 0;

// --- Score ---
let score = 0;

// --- Effet mort ---
let flash = 0;

// --- Niveau infini ---
let levels = [generateLevel()];

// --- Chargement images ---
let imagesLoaded = 0;
function checkAllLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 3) startGame();
}
playerImg.onload = checkAllLoaded;
obstacleImg.onload = checkAllLoaded;
solImg.onload = checkAllLoaded;

// --- Touches ---
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Toggle musique
document.addEventListener('keydown', e => {
    if (e.key === 'm') bgMusic.paused ? bgMusic.play() : bgMusic.pause();
});

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

// --- Reset joueur ---
function resetPlayer() {
    deathSound.play();
    flash = 10; // effet flash
    setTimeout(() => {
        player.y = canvas.height - TILE_SIZE * 2;
        player.dy = 0;
        player.onGround = false;
        cameraX = 0;
        totalOffset = 0;
        levels = [generateLevel()];
        score = 0;
    }, 500);
}

// --- Dessin du niveau ---
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

// --- Collisions optimisées ---
function handleCollisions() {
    const worldX = cameraX + player.x;
    const left = Math.floor(worldX / TILE_SIZE);
    const right = Math.floor((worldX + player.width - 1) / TILE_SIZE);
    const top = Math.floor(player.y / TILE_SIZE);
    const bottom = Math.floor((player.y + player.height - 1) / TILE_SIZE);

    player.onGround = false;

    for (let l = 0; l < levels.length; l++) {
        const level = levels[l];
        for (let y = top; y <= bottom; y++) {
            for (let x = left - l * COLS; x <= right - l * COLS; x++) {
                if (x < 0 || x >= COLS || !level[y] || !level[y][x]) continue;
                const tile = level[y][x];
                const tileTop = y * TILE_SIZE;
                const tileBottom = tileTop + TILE_SIZE;
                const tileLeft = x * TILE_SIZE + l * COLS * TILE_SIZE;
                const tileRight = tileLeft + TILE_SIZE;

                if (tile === 1) {
                    if (player.dy > 0 && player.y + player.height > tileTop && player.y < tileTop) {
                        player.y = tileTop - player.height;
                        player.dy = 0;
                        player.onGround = true;
                        coyoteTime = COYOTE_FRAMES;
                    } else if (player.dy < 0 && player.y < tileBottom && player.y + player.height > tileBottom) {
                        player.y = tileBottom;
                        player.dy = 0;
                    }
                } else if (tile === 2) {
                    resetPlayer();
                }
            }
        }
    }

    if (player.y > canvas.height) resetPlayer();
}

// --- Génération infinie ---
function generateNextSectionIfNeeded() {
    const currentLevelEnd = levels.length * COLS * TILE_SIZE;
    if (cameraX + canvas.width + TILE_SIZE * 5 > currentLevelEnd) {
        levels.push(generateLevel());
    }

    if (levels.length > 3) {
        totalOffset += COLS * TILE_SIZE;
        levels.shift();
    }
}

// --- Boucle du jeu ---
function update() {
    if (keys['ArrowRight']) cameraX += player.speed;
    if (keys['ArrowLeft'] && cameraX > 0) cameraX -= player.speed;

    if (keys['ArrowUp'] && coyoteTime > 0) {
        player.dy = -player.jumpPower;
        player.onGround = false;
        jumpSound.play();
        coyoteTime = 0;
    }

    player.dy += GRAVITY;
    player.y += player.dy;

    if (coyoteTime > 0) coyoteTime--;

    handleCollisions();
    generateNextSectionIfNeeded();

    score = Math.floor((cameraX + totalOffset) / 10); // score basé sur la distance

    draw();
    requestAnimationFrame(update);
}

// --- Dessin ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (flash > 0) {
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flash--;
    }

    drawLevel();
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
}

// --- Démarrage du jeu ---
function startGame() {
    document.addEventListener('keydown', () => {
        if (bgMusic.paused) bgMusic.play();
    }, { once: true });

    update();
}
