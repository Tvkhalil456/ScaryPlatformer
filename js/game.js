// game.js

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

// S'assurer que toutes les images sont chargées avant de lancer le jeu
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
    onGround: false,
    frame: 0,
    maxFrames: 4
};

// --- Génération du niveau ---
function generateLevel() {
    const rows = 20;
    const cols = 25;
    const lvl = [];
    for (let y = 0; y < rows; y++) {
        lvl[y] = [];
        for (let x = 0; x < cols; x++) {
            if (y === rows - 1) lvl[y][x] = 1; // sol
            else if (Math.random() < 0.05) lvl[y][x] = 2; // obstacle aléatoire
            else lvl[y][x] = 0;
        }
    }
    return lvl;
}

let level = generateLevel();

// --- Touches ---
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// --- Dessine un sprite depuis une spritesheet ---
function drawSprite(img, x, y, frameX = 0, frameY = 0, width = 32, height = 32) {
    ctx.drawImage(img, frameX * width, frameY * height, width, height, x, y, width, height);
}

// --- Reset joueur ---
function resetPlayer() {
    player.x = TILE_SIZE * 2;
    player.y = canvas.height - TILE_SIZE * 2;
    player.dx = 0;
    player.dy = 0;
}

// --- Dessin du niveau ---
function drawLevel() {
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            const tile = level[y][x];
            if (tile === 1) drawSprite(solImg, x * TILE_SIZE, y * TILE_SIZE);
            else if (tile === 2) drawSprite(obstacleImg, x * TILE_SIZE, y * TILE_SIZE);
        }
    }
}

// --- Boucle du jeu ---
function update() {
    // --- Mouvement horizontal ---
    player.dx = 0;
    if (keys['ArrowLeft']) player.dx = -player.speed;
    if (keys['ArrowRight']) player.dx = player.speed;

    // --- Animation du joueur ---
    if (player.dx !== 0) {
        player.frame++;
        if (player.frame >= player.maxFrames) player.frame = 0;
    } else {
        player.frame = 0;
    }

    // --- Saut ---
    if (keys['ArrowUp'] && player.onGround) {
        player.dy = -player.jumpPower;
        player.onGround = false;
    }

    // --- Gravité ---
    player.dy += GRAVITY;

    // --- Déplacement et collisions ---
    // Déplacement horizontal
    player.x += player.dx;
    handleCollisions('x');

    // Déplacement vertical
    player.y += player.dy;
    handleCollisions('y');

    draw();
    requestAnimationFrame(update);
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
                    if (player.dy > 0) { // chute
                        player.y = y * TILE_SIZE - player.height;
                        player.dy = 0;
                        player.onGround = true;
                    } else if (player.dy < 0) { // plafond
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

    // Si le joueur tombe en dehors du niveau
    if (player.y > canvas.height) resetPlayer();
}

// --- Dessin ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLevel();
    drawSprite(playerImg, player.x, player.y, player.frame, 0, player.width, player.height);
}
