// ====================
// CONFIGURATION DU JEU
// ====================

// Canvas
const canvas = document.getElementById('gameCanvas');
canvas.width = 800;
canvas.height = 640;
const ctx = canvas.getContext('2d');

// Taille des cases (tiles)
const TILE_SIZE = 32;


// ====================
// CHARGEMENT DES IMAGES
// ====================

// Joueur
const playerImg = new Image();
playerImg.src = 'images/player.png';

// Obstacle
const obstacleImg = new Image();
obstacleImg.src = 'images/obstacle.png';

// Sol
const solImg = new Image();
solImg.src = 'images/sol.png';

// Compteur d’images chargées
let imagesLoaded = 0;
function checkAllLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 3) {
        update(); // Quand toutes les images sont prêtes → démarrage du jeu
    }
}
playerImg.onload = checkAllLoaded;
obstacleImg.onload = checkAllLoaded;
solImg.onload = checkAllLoaded;


// ====================
// CONFIGURATION DU JOUEUR
// ====================
let player = {
    x: canvas.width / 3, // 👈 Le joueur reste sur 1/3 de l’écran
    y: canvas.height - TILE_SIZE * 2,
    width: TILE_SIZE,
    height: TILE_SIZE,
    dx: 0,
    dy: 0,
    speed: 3,       // Vitesse de base
    jumpPower: 8,   // Puissance du saut
    onGround: false
};


// ====================
// CAMERA
// ====================

// La caméra sert à donner l’impression que le joueur avance
let cameraX = 0;


// ====================
// NIVEAU
// ====================

// Génère un premier niveau
let level = generateLevel();


// ====================
// TOUCHES CLAVIER
// ====================
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);


// ====================
// OUTILS DE DESSIN
// ====================

// Dessiner un sprite simple
function drawSprite(img, x, y, width = 32, height = 32) {
    ctx.drawImage(img, x, y, width, height);
}

// Reset du joueur
function resetPlayer() {
    player.y = canvas.height - TILE_SIZE * 2;
    player.dy = 0;
    cameraX = 0; // On remet la caméra au début
}

// Dessin du niveau
function drawLevel() {
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            const tile = level[y][x];
            if (tile === 1) drawSprite(solImg, x * TILE_SIZE - cameraX, y * TILE_SIZE);
            else if (tile === 2) drawSprite(obstacleImg, x * TILE_SIZE - cameraX, y * TILE_SIZE);
        }
    }
}


// ====================
// BOUCLE DU JEU
// ====================
function update() {
    // --------------------
    // MOUVEMENT HORIZONTAL
    // --------------------
    if (keys['ArrowRight']) {
        player.speed = Math.min(player.speed + 0.1, 8); // accélère jusqu’à 8
        cameraX += player.speed;
    } 
    else if (keys['ArrowLeft'] && cameraX > 0) {
        player.speed = Math.min(player.speed + 0.1, 8);
        cameraX -= player.speed;
    } 
    else {
        player.speed = 3; // vitesse de base quand pas de touche pressée
    }

    // --------------------
    // SAUT
    // --------------------
    if (keys['ArrowUp'] && player.onGround) {
        player.dy = -player.jumpPower;
        player.onGround = false;
    }

    // --------------------
    // GRAVITÉ
    // --------------------
    player.dy += 0.5;
    player.y += player.dy;

    // --------------------
    // COLLISIONS AVEC LE SOL
    // --------------------
    let row = Math.floor((player.y + player.height) / TILE_SIZE);
    let col = Math.floor((player.x + cameraX) / TILE_SIZE);

    if (row >= level.length) {
        resetPlayer();
        return;
    }

    if (level[row] && level[row][col] === 1) {
        player.y = row * TILE_SIZE - player.height;
        player.dy = 0;
        player.onGround = true;
    }

    // --------------------
    // COLLISIONS AVEC OBSTACLE
    // --------------------
    if (level[row] && level[row][col] === 2) {
        resetPlayer();
    }

    // --------------------
    // GENERATION INFINIE
    // --------------------
    let maxVisibleCols = Math.ceil(canvas.width / TILE_SIZE) + 2;
    let lastCol = Math.floor((cameraX + canvas.width) / TILE_SIZE);

    if (lastCol + maxVisibleCols >= level[0].length) {
        // Ajouter une nouvelle "bande" de colonnes générées
        for (let y = 0; y < level.length; y++) {
            for (let i = 0; i < 5; i++) {
                if (y === level.length - 1) level[y].push(1);
                else if (Math.random() < 0.1) level[y].push(2);
                else level[y].push(0);
            }
        }
    }

    // --------------------
    // DESSIN
    // --------------------
    draw();
    requestAnimationFrame(update);
}


// ====================
// DESSIN GLOBAL
// ====================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLevel(); // Niveau
    drawSprite(playerImg, player.x, player.y, player.width, player.height); // Joueur
}
