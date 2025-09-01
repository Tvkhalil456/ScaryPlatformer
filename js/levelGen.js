const MAX_JUMP = 8; // puissance de saut du joueur
const PLAYER_SPEED = 3;

function generatePlayableLevel() {
    let level = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    // Sol
    for (let x = 0; x < COLS; x++) level[ROWS - 1][x] = 1;

    let prevY = ROWS - 1;
    let prevX = 0;

    while (prevX < COLS) {
        let platformLength = Math.floor(Math.random() * 5) + 3; // 3 à 7 tuiles
        let gap = Math.floor(Math.random() * 4) + 1; // 1 à 4 tuiles de vide

        let newX = prevX + gap;
        if (newX + platformLength >= COLS) break; // pas dépasser le niveau

        // Plateforme plus haute ou plus basse mais toujours accessible
        let deltaY = Math.floor(Math.random() * 3) - 1; // -1,0,+1
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
