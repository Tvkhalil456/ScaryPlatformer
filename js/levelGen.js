// levelGen.js

const TILE_SIZE = 32;
const ROWS = 20;
const COLS = 25;

// Génère un niveau simple
function generateLevel() {
    let level = [];
    for (let y = 0; y < ROWS; y++) {
        level[y] = [];
        for (let x = 0; x < COLS; x++) {
            if (y === ROWS - 1) level[y][x] = 1; // sol
            else if (Math.random() < 0.1) level[y][x] = 2; // obstacle
            else level[y][x] = 0; // vide
        }
    }
    return level;
}