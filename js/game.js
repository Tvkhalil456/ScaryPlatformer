const canvas = document.getElementById('gameCanvas');
canvas.width = 800;
canvas.height = 640;
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const GRAVITY = 0.5;

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

// Vérifier que toutes les images sont chargées
let imagesLoaded = 0;
function checkAllLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 3) {
        update();
    }
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

// --- Génération du niveau ---
function generateLevel() {
    const ROWS = 20;
    const COLS = 25;
    const level = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    // Sol
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

        for (let x = newX; x < newX + platformLength; x++) {
            level[newY][x] = 1;
        }

        // Obstacle aléatoire
        if (Math.random() < 0.3) {
            let obsX = newX + Math.floor(Math.random() * platformLength);
            level[newY - 1][obsX] = 2;
        }

        prevX = newX + platformLength;
        prevY = newY;
    }

    return level;
}

let level = generateLevel();

// --- Touches ---
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// --- Reset joueur ---
function resetPlayer() {
    // Son de mort pendant 3 secondes
    deathSound.play();
    setTimeout(() => deathSound.pause(), 3000);

    player.x = TILE_SIZE * 2;
    player.y = canvas.height - TILE_SIZE * 2;
    player.dx = 0;
    player.dy = 0;
    player.onGround = false;
}

// --- Dessin du niveau ---
function drawLevel() {
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            const tile = level[y][x];
            if (tile === 1) ctx.drawImage(solImg, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            else if (tile === 2) ctx.drawImage(obstacleImg, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

// --- Gestion des collisions ---
function handleCollisions(axis) {
    const left = Math.floor(player.x / TILE_SIZE);
    const right = Math.floor((player.x + player.width - 1) / TILE_SIZE);
    const top = Math.floor(player.y / TILE_SIZE);
    const bottom = Math.floor((player.y + player.height - 1) / TILE_SIZE);

    for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
            if (!level[y] || !level[y][x]) continue;

            const tile = level[y][x];

            if (tile === 1) { // SOL
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
                    if (player.dx > 0) player.x = x * TILE_SIZE - player.width;
                    else if (player.dx < 0) player.x = (x + 1) * TILE_SIZE;
                }
            } else if (tile === 2) { // OBSTACLE
                resetPlayer();
            }
        }
    }

    if (player.y > canvas.height) resetPlayer();
}

// --- Boucle du jeu ---
function update() {
    player.dx = 0;
    if (keys['ArrowLeft']) player.dx = -player.speed;
    if (keys['ArrowRight']) player.dx = player.speed;

    if (keys['ArrowUp'] && player.onGround) {
        player.dy = -player.jumpPower;
        player.onGround = false;
        jumpSound.play(); // son du saut
    }

    player.dy += GRAVITY;

    player.x += player.dx;
    handleCollisions('x');
    player.y += player.dy;
    handleCollisions('y');

    draw();
    requestAnimationFrame(update);
}

// --- Dessin ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLevel();
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}
