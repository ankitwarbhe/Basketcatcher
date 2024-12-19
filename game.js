class Player {
    constructor(canvas, image) {
        this.canvas = canvas;
        this.image = image;
        this.width = 80;
        this.height = 80;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 10;
        this.baseSpeed = 5;  // Base movement speed
        this.speed = this.baseSpeed;  // Current speed that will scale with score
    }

    update(keys, speedMultiplier = 1) {
        this.speed = this.baseSpeed * speedMultiplier;  // Update speed based on game progress
        if (keys.ArrowLeft && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys.ArrowRight && this.x < this.canvas.width - this.width) {
            this.x += this.speed;
        }
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class FallingObject {
    constructor(canvas, image, type, gameSpeed) {
        this.canvas = canvas;
        this.image = image;
        this.type = type;
        this.width = 40;
        this.height = 40;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.baseSpeed = 3;  // Base falling speed
        this.speed = this.baseSpeed * gameSpeed;  // Current speed that scales with gameSpeed
    }

    update(gameSpeed) {
        this.speed = this.baseSpeed * gameSpeed;  // Update speed based on game progress
        this.y += this.speed;
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.keys = {};
        this.initializeBackground();  // Initialize background first
        this.loadAssets();
        this.loadScores();
        this.setupGame();
        this.setupEventListeners();
    }

    initializeBackground() {
        const background = document.getElementById('game-background');
        background.style.position = 'fixed';
        background.style.top = '0';
        background.style.left = '0';
        background.style.width = '100%';
        background.style.height = '100%';
        background.style.zIndex = '-1';
        
        // Create a canvas for the background
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        const bgCtx = bgCanvas.getContext('2d');

        // Create gradient background
        const gradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
        gradient.addColorStop(0, '#1a8cff');  // Bright blue at top
        gradient.addColorStop(1, '#99ccff');  // Light blue at bottom
        bgCtx.fillStyle = gradient;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

        // Add decorative elements
        // Draw stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * bgCanvas.width;
            const y = Math.random() * (bgCanvas.height * 0.6);
            const size = Math.random() * 2;
            
            bgCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            bgCtx.beginPath();
            bgCtx.arc(x, y, size, 0, Math.PI * 2);
            bgCtx.fill();
        }

        // Draw mountains in the background
        const drawMountain = (x, height, color) => {
            bgCtx.fillStyle = color;
            bgCtx.beginPath();
            bgCtx.moveTo(x, bgCanvas.height);
            bgCtx.lineTo(x + 200, bgCanvas.height - height);
            bgCtx.lineTo(x + 400, bgCanvas.height);
            bgCtx.closePath();
            bgCtx.fill();
        };

        // Draw multiple mountain ranges
        for (let i = 0; i < bgCanvas.width; i += 300) {
            drawMountain(i - 100, 200, '#2d5986');  // Back mountains
            drawMountain(i, 150, '#3973ac');  // Front mountains
        }

        // Draw clouds
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * bgCanvas.width;
            const y = Math.random() * (bgCanvas.height * 0.4);
            const size = 30 + Math.random() * 50;
            
            bgCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            bgCtx.beginPath();
            bgCtx.arc(x, y, size, 0, Math.PI * 2);
            bgCtx.arc(x + size * 0.5, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
            bgCtx.arc(x - size * 0.5, y - size * 0.1, size * 0.6, 0, Math.PI * 2);
            bgCtx.fill();
        }

        // Set the background image
        background.style.background = `url(${bgCanvas.toDataURL()})`;
        background.style.backgroundSize = 'cover';
        background.style.backgroundPosition = 'center';
    }

    loadAssets() {
        const createBasketImage = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 80;
            canvas.height = 80;
            const ctx = canvas.getContext('2d');
            
            // Colors
            const handleColor = '#594300';  // Dark brown for handle
            const basketColor = '#FFD700';  // Golden yellow for basket weaving
            const shadowColor = '#594300';  // Darker color for weaving shadows
            
            // Draw handle
            ctx.strokeStyle = handleColor;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(40, 25, 30, Math.PI, 2 * Math.PI, false);
            ctx.stroke();

            // Draw basket base shape
            const basketHeight = 35;
            const basketTop = 35;
            
            // Draw horizontal weaving lines
            ctx.strokeStyle = basketColor;
            ctx.lineWidth = 4;
            for (let y = basketTop; y < basketTop + basketHeight; y += 6) {
                ctx.beginPath();
                ctx.moveTo(5, y);
                ctx.bezierCurveTo(5, y + 3, 75, y + 3, 75, y);
                ctx.stroke();
            }

            // Draw diagonal weaving lines (left to right)
            ctx.lineWidth = 3;
            for (let x = -20; x < 80; x += 12) {
                ctx.beginPath();
                ctx.moveTo(x, basketTop);
                ctx.lineTo(x + 30, basketTop + basketHeight);
                ctx.stroke();
            }

            // Draw diagonal weaving lines (right to left)
            for (let x = 100; x > 0; x -= 12) {
                ctx.beginPath();
                ctx.moveTo(x, basketTop);
                ctx.lineTo(x - 30, basketTop + basketHeight);
                ctx.stroke();
            }

            // Draw shadow lines
            ctx.strokeStyle = shadowColor;
            ctx.lineWidth = 1;
            for (let y = basketTop; y < basketTop + basketHeight; y += 6) {
                ctx.beginPath();
                ctx.moveTo(5, y + 2);
                ctx.bezierCurveTo(5, y + 5, 75, y + 5, 75, y + 2);
                ctx.stroke();
            }

            // Draw basket rim
            ctx.strokeStyle = handleColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(5, basketTop);
            ctx.bezierCurveTo(5, basketTop - 2, 75, basketTop - 2, 75, basketTop);
            ctx.stroke();

            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };

        const createFruitImage = (type) => {
            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            const ctx = canvas.getContext('2d');

            switch(type) {
                case 'strawberry':
                    // Draw strawberry
                    ctx.fillStyle = '#FF3232';  // Bright red
                    ctx.beginPath();
                    ctx.arc(20, 25, 15, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Leaf
                    ctx.fillStyle = '#32CD32';
                    ctx.beginPath();
                    ctx.moveTo(20, 10);
                    ctx.lineTo(15, 15);
                    ctx.lineTo(20, 13);
                    ctx.lineTo(25, 15);
                    ctx.lineTo(20, 10);
                    ctx.fill();
                    
                    // Seeds
                    ctx.fillStyle = '#FFE135';
                    for(let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        const x = 20 + Math.cos(angle) * 8;
                        const y = 25 + Math.sin(angle) * 8;
                        ctx.beginPath();
                        ctx.arc(x, y, 1, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;

                case 'apple':
                    // Draw apple
                    ctx.fillStyle = '#FF0000';  // Red
                    ctx.beginPath();
                    ctx.arc(20, 25, 15, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Leaf
                    ctx.fillStyle = '#32CD32';
                    ctx.beginPath();
                    ctx.moveTo(20, 10);
                    ctx.lineTo(25, 15);
                    ctx.lineTo(20, 12);
                    ctx.fill();
                    break;

                case 'orange':
                    // Draw orange
                    ctx.fillStyle = '#FFA500';
                    ctx.beginPath();
                    ctx.arc(20, 20, 15, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Leaf
                    ctx.fillStyle = '#32CD32';
                    ctx.beginPath();
                    ctx.moveTo(20, 5);
                    ctx.lineTo(25, 10);
                    ctx.lineTo(20, 8);
                    ctx.fill();
                    break;

                case 'banana':
                    // Draw banana
                    ctx.fillStyle = '#FFE135';
                    ctx.beginPath();
                    ctx.moveTo(10, 30);
                    ctx.quadraticCurveTo(20, 0, 30, 10);
                    ctx.quadraticCurveTo(25, 15, 15, 35);
                    ctx.fill();
                    break;

                case 'watermelon':
                    // Draw watermelon slice
                    ctx.fillStyle = '#FF6B6B';
                    ctx.beginPath();
                    ctx.arc(20, 20, 15, 0, Math.PI);
                    ctx.fill();
                    
                    // Rind
                    ctx.fillStyle = '#90EE90';
                    ctx.beginPath();
                    ctx.arc(20, 20, 15, Math.PI, Math.PI * 1.2);
                    ctx.arc(20, 20, 15, Math.PI * 0.8, Math.PI);
                    ctx.fill();
                    
                    // Seeds
                    ctx.fillStyle = '#000';
                    for(let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.ellipse(15 + i * 5, 25 - (i % 2) * 5, 1, 2, Math.PI/4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
            }

            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };

        const createBadObjectImage = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            const ctx = canvas.getContext('2d');

            // Draw bomb body (black circle)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(20, 25, 12, 0, Math.PI * 2);
            ctx.fill();

            // Draw fuse wire
            ctx.strokeStyle = '#4A4A4A';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(20, 13);
            ctx.quadraticCurveTo(25, 8, 30, 10);
            ctx.stroke();

            // Draw explosion star
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(30, 10);
            ctx.lineTo(33, 7);
            ctx.lineTo(30, 4);
            ctx.lineTo(33, 1);
            ctx.lineTo(30, 0);
            ctx.lineTo(33, 3);
            ctx.lineTo(30, 6);
            ctx.closePath();
            ctx.fill();

            // Add shine highlight to bomb
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(15, 20, 3, 0, Math.PI * 2);
            ctx.fill();

            const img = new Image();
            img.src = canvas.toDataURL();
            return img;
        };

        // Create array of fruit images
        this.fruitImages = [
            createFruitImage('strawberry'),
            createFruitImage('apple'),
            createFruitImage('orange'),
            createFruitImage('banana'),
            createFruitImage('watermelon')
        ];

        // Load images
        this.images = {
            background: (() => {
                const canvas = document.createElement('canvas');
                canvas.width = this.canvas.width;  // Match game canvas size
                canvas.height = this.canvas.height;
                const ctx = canvas.getContext('2d');
                
                // Create a pattern background
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#87CEEB');  // Sky blue at top
                gradient.addColorStop(1, '#E0F7FA');  // Lighter blue at bottom
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Add decorative elements
                // Clouds
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * (canvas.height / 2);
                    const size = 30 + Math.random() * 50;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.arc(x + size * 0.5, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
                    ctx.arc(x - size * 0.5, y - size * 0.1, size * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Add some trees in the background
                const drawTree = (x, y, size) => {
                    // Tree trunk
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(x - size/8, y - size/2, size/4, size);
                    
                    // Tree leaves
                    ctx.fillStyle = '#228B22';
                    ctx.beginPath();
                    ctx.moveTo(x, y - size * 1.5);
                    ctx.lineTo(x + size, y - size/2);
                    ctx.lineTo(x - size, y - size/2);
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.moveTo(x, y - size * 1.2);
                    ctx.lineTo(x + size * 0.8, y - size/4);
                    ctx.lineTo(x - size * 0.8, y - size/4);
                    ctx.fill();
                };

                // Draw multiple trees
                for (let i = 0; i < 4; i++) {
                    const x = (i + 1) * (canvas.width / 5);
                    drawTree(x, canvas.height - 50, 80);
                }

                // Add grass at the bottom
                ctx.fillStyle = '#90EE90';
                ctx.beginPath();
                ctx.moveTo(0, canvas.height);
                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(canvas.width, canvas.height - 30);
                ctx.quadraticCurveTo(canvas.width/2, canvas.height - 50, 0, canvas.height - 30);
                ctx.fill();

                const img = new Image();
                img.src = canvas.toDataURL();
                return img;
            })(),
            player: createBasketImage(),
            badObject: createBadObjectImage()
        };

        // Create silent audio elements as fallbacks
        const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");

        this.sounds = {
            background: silentAudio,
            collect: silentAudio,
            collision: silentAudio
        };

        this.sounds.background.loop = true;
    }

    loadImage(src) {
        const img = new Image();
        img.src = src;
        return img;
    }

    setupGame() {
        this.player = new Player(this.canvas, this.images.player);
        this.fallingObjects = [];
        this.score = 0;
        this.level = 1;
        this.fruitsCollected = 0;  // Track fruits collected for level up
        this.gameSpeed = 1;
        this.isPaused = false;
        this.isGameOver = false;
        this.playerName = document.getElementById('player-name').value || 'Anonymous';
        
        this.lastSpawn = 0;
        this.spawnInterval = 2000;

        // Clear the canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateDifficulty() {
        // Calculate speed multiplier based on level and score
        const baseSpeedMultiplier = 1 + (this.level - 1) * 0.2;  // 20% faster per level
        const scoreMultiplier = Math.floor(this.score / 50) * 0.1;  // Additional speed from score
        
        // Add a cap to prevent the game from becoming impossible
        this.gameSpeed = Math.min(baseSpeedMultiplier + scoreMultiplier, 3.0);  // Maximum 3x speed
        
        // Update player speed with the same multiplier
        if (this.player) {
            this.player.update(this.keys, this.gameSpeed);
        }
        
        // Decrease spawn interval as level increases
        this.spawnInterval = Math.max(400, 2000 - (this.level - 1) * 200);
    }

    spawnObject() {
        if (Date.now() - this.lastSpawn > this.spawnInterval) {
            const objectType = Math.random() < 0.2 ? 'bad' : 'good';
            const object = new FallingObject(
                this.canvas,
                objectType === 'good' 
                    ? this.fruitImages[Math.floor(Math.random() * this.fruitImages.length)]
                    : this.images.badObject,
                objectType,
                this.gameSpeed
            );
            this.fallingObjects.push(object);
            this.lastSpawn = Date.now();
        }
    }

    update() {
        if (this.isPaused) return;

        this.updateDifficulty();  // Update difficulty first
        this.spawnObject();

        this.fallingObjects = this.fallingObjects.filter(obj => {
            obj.update(this.gameSpeed);
            
            // Check for collision with player
            if (this.checkCollision(this.player, obj)) {
                if (obj.type === 'good') {
                    this.score += 10;
                    this.fruitsCollected++;
                    
                    // Check for level up every 5 fruits
                    if (this.fruitsCollected >= 5) {
                        this.level++;
                        this.fruitsCollected = 0;  // Reset fruits collected
                        this.showLevelUpMessage();
                    }
                    
                    this.sounds.collect.play();
                } else {
                    this.gameOver("You hit a bomb!");
                }
                return false;
            }
            
            // Check if object hit the ground
            if (obj.y + obj.height >= this.canvas.height) {
                if (obj.type === 'good') {
                    this.gameOver("A fruit hit the ground!");
                    return false;
                }
                return false;  // Remove bombs that hit the ground
            }
            
            return true;  // Keep the object in play
        });
    }

    checkCollision(player, object) {
        return player.x < object.x + object.width &&
               player.x + player.width > object.x &&
               player.y < object.y + object.height &&
               player.y + player.height > object.y;
    }

    draw() {
        // Draw background
        this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game elements
        this.player.draw(this.ctx);
        this.fallingObjects.forEach(obj => obj.draw(this.ctx));

        // Draw UI
        this.drawUI();
    }

    drawUI() {
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 24px Arial';
        
        const scoreText = `Score: ${this.score}`;
        const levelText = `Level: ${this.level}`;
        const fruitsText = `Fruits: ${this.fruitsCollected}/5`;
        
        // Draw score with stroke (left side)
        this.ctx.strokeText(scoreText, 10, 30);
        this.ctx.fillText(scoreText, 10, 30);
        
        // Draw level with stroke (right side)
        this.ctx.strokeText(levelText, this.canvas.width - 120, 30);
        this.ctx.fillText(levelText, this.canvas.width - 120, 30);

        // Draw fruits counter below level
        this.ctx.strokeText(fruitsText, this.canvas.width - 120, 60);
        this.ctx.fillText(fruitsText, this.canvas.width - 120, 60);
    }

    gameOver(message = "Game Over!") {
        this.isGameOver = true;
        this.sounds.background.pause();
        this.sounds.collision.play();
        
        // Save the score before showing game over screen
        this.saveScore(this.score);
        
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
        
        // Display game over message if element exists
        const messageElement = document.getElementById('game-over-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Button controls
        document.getElementById('start-button').addEventListener('click', () => {
            const nameInput = document.getElementById('player-name');
            if (!nameInput.value.trim()) {
                const popup = document.getElementById('name-popup');
                popup.classList.remove('hidden');
                
                document.getElementById('popup-ok').onclick = () => {
                    popup.classList.add('hidden');
                    nameInput.focus();
                };
                return;
            }
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            this.start();
        });

        document.getElementById('pause-button').addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                this.sounds.background.pause();
            } else {
                this.sounds.background.play();
            }
        });

        document.getElementById('restart-button').addEventListener('click', () => {
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            this.setupGame();
            this.start();
        });
    }

    start() {
        this.setupGame();  // Reset game state when starting
        this.sounds.background.play().catch(() => {});  // Handle audio play error
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isGameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    loadScores() {
        // Load scores from localStorage
        this.scores = JSON.parse(localStorage.getItem('basketCatcherScores')) || [];
        this.updateScoreboardDisplay();
    }

    saveScore(score) {
        // Add new score with level and player name
        const newScore = {
            name: this.playerName,
            score: score,
            level: this.level
        };
        
        // Add to array and sort by score (highest first)
        this.scores.push(newScore);
        this.scores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10 scores
        this.scores = this.scores.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('basketCatcherScores', JSON.stringify(this.scores));
        
        // Update display
        this.updateScoreboardDisplay();
    }

    updateScoreboardDisplay() {
        const scoresList = document.getElementById('scores-list');
        scoresList.innerHTML = '';  // Clear current scores
        
        this.scores.forEach((scoreData, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item' + (index === 0 ? ' latest' : '');
            
            scoreItem.innerHTML = `
                <div class="score-info">
                    <span class="rank">#${index + 1}</span>
                    <span class="name">${scoreData.name || 'Anonymous'}</span>
                    <span class="level">Lvl ${scoreData.level || 1}</span>
                </div>
                <span class="score">${scoreData.score}</span>
            `;
            
            scoresList.appendChild(scoreItem);
        });
    }

    showLevelUpMessage() {
        // Create level up message
        const levelUpDiv = document.createElement('div');
        levelUpDiv.className = 'level-up-message';
        levelUpDiv.textContent = `Level ${this.level}!`;
        document.getElementById('game-screen').appendChild(levelUpDiv);

        // Remove the message after animation
        setTimeout(() => {
            levelUpDiv.remove();
        }, 2000);
    }
}

// Initialize game when window loads
window.onload = () => {
    const game = new Game();
    // Don't auto-start, wait for button click
};