// game.js

const canvas = document.getElementById('gameCanvas');
canvas.width = 800;
canvas.height = 640;
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;

// Images
const playerImg = new Image();
playerImg.src = 'images/player.png';

const obstacleImg = new Image();
obstacleImg.src = 'images/obstacle.png';

const solImg = new Image();
solImg.src = 'images/sol.png';

// Player
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
    maxFrames: 4 // pour sprite player.png
};

// Niveaux
let level = generateLevel();

// Touches
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Dessine un sprite depuis une spritesheet
function drawSprite(img, x, y, frameX = 0, frameY = 0, width = 32, height = 32) {
    ctx.drawImage(img, frameX * width, frameY * height, width, height, x, y, width, height);
}

// Reset joueur
function resetPlayer() {
    player.x = TILE_SIZE * 2;
    player.y = canvas.height - TILE_SIZE * 2;
    player.dx = 0;
    player.dy = 0;
}

// Dessin du niveau
function drawLevel() {
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            const tile = level[y][x];
            if (tile === 1) drawSprite(solImg, x * TILE_SIZE, y * TILE_SIZE);
            else if (tile === 2) drawSprite(obstacleImg, x * TILE_SIZE, y * TILE_SIZE, 0, 0, 32, 32);
        }
    }
}

// Boucle du jeu
function update() {
    // Mouvement horizontal
    player.dx = 0;
    if (keys['ArrowLeft']) player.dx = -player.speed;
    if (keys['ArrowRight']) player.dx = player.speed;

    // Saut
    if (keys['ArrowUp'] && player.onGround) {
        player.dy = -player.jumpPower;
        player.onGround = false;
    }

    // Gravité
    player.dy += 0.5;

    // Position
    player.x += player.dx;
    player.y += player.dy;

    // Collisions simples avec le sol
    let row = Math.floor((player.y + player.height) / TILE_SIZE);
    if (row >= level.length) {
        resetPlayer();
        return;
    }

    if (level[row] && level[row][Math.floor(player.x / TILE_SIZE)] === 1) {
        player.y = row * TILE_SIZE - player.height;
        player.dy = 0;
        player.onGround = true;
    }

    // Collisions obstacles
    if (level[row] && level[row][Math.floor(player.x / TILE_SIZE)] === 2) {
        resetPlayer();
    }

    draw();
    requestAnimationFrame(update);
}

// Dessin
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLevel();
    drawSprite(playerImg, player.x, player.y, player.frame, 0, player.width, player.height);
}

// Lancement du jeu
playerImg.onload = () => {
    obstacleImg.onload = () => {
        solImg.onload = () => {
            update();
        };
    };
};