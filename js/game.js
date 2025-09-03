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
const screamerImg = new Image();
screamerImg.src = 'images/smiledogs.jpg';

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
let totalOffset = 0;

// --- Coyote time ---
const COYOTE_FRAMES = 10;
let coyoteTime = 0;

// --- Score ---
let score = 0;

// --- Effet mort ---
let flash = 0;

// --- Niveau infini ---
let levels = [generateLevel()];

// --- État du jeu ---
let gameState = 'menu'; // 'menu', 'playing', 'gameover'

// --- Screamer ---
let screamerActive = false;
let screamerTimer = 0;

// --- Bouton Play ---
const playButton = {
    x: canvas.width / 2 - 120,
    y: canvas.height / 2 - 40,
    width: 240,
    height: 80
};

// --- Chargement images ---
let imagesLoaded = 0;
function checkAllLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 4) startGame();
}
playerImg.onload = checkAllLoaded;
obstacleImg.onload = checkAllLoaded;
solImg.onload = checkAllLoaded;
screamerImg.onload = checkAllLoaded;

// --- Touches ---
const keys = {};
let jumpPressed = false;

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') jumpPressed = true;
    keys[e.key] = true;
});
document.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp') jumpPressed = false;
    keys[e.key] = false;
});

// Toggle musique
document.addEventListener('keydown', e => {
    if (e.key === 'm') bgMusic.paused ? bgMusic.play() : bgMusic.pause();
});

// Démarrage musique sur interaction
document.addEventListener('click', () => {
    if (bgMusic.paused) bgMusic.play();
}, { once: true });

// --- Gestion clic sur bouton Play ---
canvas.addEventListener('click', e => {
    if (gameState === 'menu' || gameState === 'gameover') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (mouseX >= playButton.x && mouseX <= playButton.x + playButton.width &&
            mouseY >= playButton.y && mouseY <= playButton.y + playButton.height) {
            
            // --- Reset ---
            player.x = canvas.width / 3;
            player.y = canvas.height - TILE_SIZE * 2;
            player.dx = 0;
            player.dy = 0;
            player.onGround = false;

            cameraX = 0;
            totalOffset = 0;
            levels = [generateLevel()];
            score = 0;
            flash = 0;
            screamerActive = false;
            screamerTimer = 0;

            gameState = 'playing';
        }
    }
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

// --- Quand le joueur meurt ---
function playerDie() {
    gameState = 'gameover';
    flash = 10;

    if (Math.random() < 0.2) { // 20% chance
        screamerActive = true;
        screamerTimer = 120; // 2s à 60 FPS
    }

    deathSound.play();
}

// --- Collisions ---
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
                const tileX = x * TILE_SIZE + l * COLS * TILE_SIZE - cameraX;
                const tileY = y * TILE_SIZE;

                if (tile === 1) {
                    // Bas
                    if (player.dy > 0 && player.y + player.height > tileY && player.y < tileY) {
                        player.y = tileY - player.height;
                        player.dy = 0;
                        player.onGround = true;
                        coyoteTime = COYOTE_FRAMES;
                    }
                    // Haut
                    else if (player.dy < 0 && player.y < tileY + TILE_SIZE && player.y + player.height > tileY + TILE_SIZE) {
                        player.y = tileY + TILE_SIZE;
                        player.dy = 0;
                    }
                    // Gauche
                    else if (player.x + player.width > tileX && player.x < tileX && player.dy >= 0) {
                        player.x = tileX - player.width;
                    }
                    // Droite
                    else if (player.x < tileX + TILE_SIZE && player.x + player.width > tileX + TILE_SIZE && player.dy >= 0) {
                        player.x = tileX + TILE_SIZE;
                    }
                } else if (tile === 2) {
                    playerDie();
                }
            }
        }
    }

    if (player.y > canvas.height) playerDie();
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
    if (gameState === 'playing') {
        if (keys['ArrowRight']) cameraX += player.speed;
        if (keys['ArrowLeft'] && cameraX > 0) cameraX -= player.speed;

        if (jumpPressed && coyoteTime > 0) {
            player.dy = -player.jumpPower;
            player.onGround = false;
            jumpSound.play();
            coyoteTime = 0;
            jumpPressed = false;
        }

        player.dy += GRAVITY;
        player.y += player.dy;

        if (coyoteTime > 0) coyoteTime--;

        handleCollisions();
        generateNextSectionIfNeeded();

        score = Math.floor((cameraX + totalOffset) / 10);
    }

    if (gameState === 'gameover' && screamerActive) {
        screamerTimer--;
        if (screamerTimer <= 0) screamerActive = false;
    }

    draw();
    requestAnimationFrame(update);
}

// --- Dessin ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'red';
        ctx.font = '60px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Tralalero Tralarun', canvas.width / 2, 100);

        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(playButton.x, playButton.y, playButton.width, playButton.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeRect(playButton.x, playButton.y, playButton.width, playButton.height);

        ctx.fillStyle = 'black';
        ctx.font = '30px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PLAY', canvas.width / 2, canvas.height / 2);

        return;
    }

    if (flash > 0) {
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flash--;
    }

    drawLevel();
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    ctx.fillStyle = 'white';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);

    if (gameState === 'gameover') {
        if (screamerActive && screamerImg.complete) {
            ctx.drawImage(screamerImg, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.font = '40px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);

            ctx.font = '25px "Press Start 2P", monospace';
            ctx.fillText('Score final: ' + score, canvas.width / 2, canvas.height / 2 + 20);
            ctx.fillText('Clique sur PLAY pour rejouer', canvas.width / 2, canvas.height / 2 + 60);
        }
    }
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

// --- Démarrage du jeu ---
function startGame() {
    update(); // Lance la boucle
}
