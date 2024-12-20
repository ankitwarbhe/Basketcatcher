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

class PartyPopper {
    constructor(canvas, x, y) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.particles = [];
        this.gravity = 0.5;
        this.fade = 0.02;
        this.colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#1E90FF', '#FF69B4'];
        
        // Create initial particles
        this.createParticles();
    }

    createParticles() {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = 2 + Math.random() * 6;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                opacity: 1
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += this.gravity;
            particle.opacity -= this.fade;

            if (particle.opacity <= 0) {
                this.particles.splice(i, 1);
            }
        }
        return this.particles.length > 0;
    }

    draw(ctx) {
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
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
        this.partyPoppers = [];  // Add this line
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

        // Create night sky gradient
        const gradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
        gradient.addColorStop(0, '#0B1026');  // Dark blue at top
        gradient.addColorStop(0.5, '#1B2045');  // Medium blue
        gradient.addColorStop(1, '#2A1B3D');  // Purple-ish at bottom
        bgCtx.fillStyle = gradient;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

        // Add stars
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * bgCanvas.width;
            const y = Math.random() * (bgCanvas.height * 0.8);
            const size = Math.random() * 2;
            
            // Create twinkling effect with different opacities
            bgCtx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.7})`;
            bgCtx.beginPath();
            bgCtx.arc(x, y, size, 0, Math.PI * 2);
            bgCtx.fill();
        }

        // Draw buildings
        const drawBuilding = (x, width, height, hasWindows = true) => {
            // Building base
            bgCtx.fillStyle = '#1a1a1a';
            bgCtx.fillRect(x, bgCanvas.height - height, width, height);

            // Windows
            if (hasWindows) {
                const windowSize = 10;
                const gap = 15;
                for (let row = 0; row < Math.floor((height - 20) / gap); row++) {
                    for (let col = 0; col < Math.floor((width - 10) / gap); col++) {
                        // Random light color
                        const brightness = Math.random();
                        if (brightness > 0.3) { // 70% chance of light being on
                            bgCtx.fillStyle = `rgba(255, 255, ${150 + Math.random() * 100}, ${brightness})`;
                            bgCtx.fillRect(
                                x + 5 + col * gap,
                                bgCanvas.height - height + 10 + row * gap,
                                windowSize,
                                windowSize
                            );
                        }
                    }
                }
            }
        };

        // Draw multiple buildings of varying heights
        const buildingCount = Math.ceil(bgCanvas.width / 100);
        for (let i = 0; i < buildingCount; i++) {
            const width = 60 + Math.random() * 40;
            const height = 150 + Math.random() * 250;
            drawBuilding(i * 100, width, height);
        }

        // Add UFOs/Aliens
        const drawUFO = (x, y, size) => {
            bgCtx.fillStyle = '#333';
            // UFO body
            bgCtx.beginPath();
            bgCtx.ellipse(x, y, size, size/2, 0, 0, Math.PI * 2);
            bgCtx.fill();
            
            // UFO dome
            bgCtx.fillStyle = 'rgba(120, 220, 255, 0.6)';
            bgCtx.beginPath();
            bgCtx.ellipse(x, y - size/4, size/2, size/3, 0, Math.PI, 0);
            bgCtx.fill();
            
            // UFO lights
            for(let i = 0; i < 3; i++) {
                const lightX = x - size + (i * size);
                bgCtx.fillStyle = `rgba(255, 255, 100, ${0.5 + Math.random() * 0.5})`;
                bgCtx.beginPath();
                bgCtx.arc(lightX, y, size/6, 0, Math.PI * 2);
                bgCtx.fill();
            }
        };

        // Draw multiple UFOs
        for(let i = 0; i < 5; i++) {
            const x = Math.random() * bgCanvas.width;
            const y = 100 + Math.random() * 200;
            const size = 20 + Math.random() * 30;
            drawUFO(x, y, size);
        }

        // Add light beam effect from one UFO
        const beamX = bgCanvas.width * 0.7;
        const beamY = 150;
        const gradient2 = bgCtx.createLinearGradient(beamX, beamY, beamX, beamY + 200);
        gradient2.addColorStop(0, 'rgba(255, 255, 150, 0.3)');
        gradient2.addColorStop(1, 'rgba(255, 255, 150, 0)');
        bgCtx.fillStyle = gradient2;
        bgCtx.beginPath();
        bgCtx.moveTo(beamX - 40, beamY);
        bgCtx.lineTo(beamX + 40, beamY);
        bgCtx.lineTo(beamX + 80, beamY + 200);
        bgCtx.lineTo(beamX - 80, beamY + 200);
        bgCtx.closePath();
        bgCtx.fill();

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
                canvas.width = this.canvas.width;
                canvas.height = this.canvas.height;
                const ctx = canvas.getContext('2d');
                
                // Create a more dramatic sky gradient
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#1a7bb5');   // Deeper blue at top
                gradient.addColorStop(0.4, '#63b4cf'); // Mid-sky lighter blue
                gradient.addColorStop(0.7, '#a7d9e8'); // Lower sky very light blue
                gradient.addColorStop(1, '#def3f8');   // Horizon almost white
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Add subtle clouds
                const drawCloud = (x, y, size) => {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.arc(x + size * 0.5, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
                    ctx.arc(x - size * 0.5, y, size * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                };

                // Add a few subtle clouds
                for (let i = 0; i < 4; i++) {
                    drawCloud(
                        Math.random() * canvas.width,
                        50 + Math.random() * 100,
                        20 + Math.random() * 30
                    );
                }

                // Draw grass base with gradient
                const grassGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
                grassGradient.addColorStop(0, '#2d5a27');  // Darker grass at top
                grassGradient.addColorStop(1, '#3d7a34');  // Lighter grass at bottom
                ctx.fillStyle = grassGradient;
                ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

                // Draw detailed grass pattern
                for (let i = 0; i < canvas.width; i += 3) {
                    const grassHeight = 10 + Math.random() * 15;
                    ctx.strokeStyle = `rgb(${45 + Math.random() * 20}, ${90 + Math.random() * 30}, ${39 + Math.random() * 20})`;
                    ctx.beginPath();
                    ctx.moveTo(i, canvas.height - 95);
                    ctx.lineTo(i, canvas.height - 95 - grassHeight);
                    ctx.stroke();
                }

                // Enhanced Christmas tree drawing function
                const drawTree = (x, y, size) => {
                    // Tree trunk with gradient
                    const trunkGradient = ctx.createLinearGradient(x - size/8, y, x + size/8, y);
                    trunkGradient.addColorStop(0, '#5D4037');  // Dark brown
                    trunkGradient.addColorStop(0.5, '#795548'); // Medium brown
                    trunkGradient.addColorStop(1, '#5D4037');  // Dark brown
                    ctx.fillStyle = trunkGradient;
                    
                    // Draw trunk
                    ctx.fillRect(x - size/8, y - size/4, size/4, size/3);

                    // Draw Christmas tree triangular layers
                    const treeColors = ['#0f5132', '#146B3A', '#165B33'];  // Different shades of Christmas green
                    const layers = 3;
                    const layerHeight = size/layers;

                    for(let i = 0; i < layers; i++) {
                        ctx.fillStyle = treeColors[i % treeColors.length];
                        ctx.beginPath();
                        ctx.moveTo(x - size * (0.8 - i * 0.2), y - size/4 - i * layerHeight);
                        ctx.lineTo(x, y - size - i * layerHeight/2);
                        ctx.lineTo(x + size * (0.8 - i * 0.2), y - size/4 - i * layerHeight);
                        ctx.closePath();
                        ctx.fill();
                    }

                    // Add Christmas decorations
                    const ornamentColors = ['#ff0000', '#ffd700', '#ff69b4', '#4169e1', '#ffffff'];
                    const addOrnament = (ornX, ornY, radius) => {
                        // Ornament base
                        ctx.fillStyle = ornamentColors[Math.floor(Math.random() * ornamentColors.length)];
                        ctx.beginPath();
                        ctx.arc(ornX, ornY, radius, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Ornament shine
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.beginPath();
                        ctx.arc(ornX - radius/3, ornY - radius/3, radius/3, 0, Math.PI * 2);
                        ctx.fill();
                    };

                    // Add ornaments in a pattern
                    for(let layer = 0; layer < layers; layer++) {
                        const layerY = y - size/4 - layer * layerHeight;
                        const layerWidth = size * (1.6 - layer * 0.4);
                        const ornamentCount = 3 + layer * 2;
                        
                        for(let j = 0; j < ornamentCount; j++) {
                            const ornX = x - layerWidth/2 + (layerWidth/(ornamentCount-1)) * j;
                            const ornY = layerY - layerHeight/2;
                            addOrnament(ornX, ornY, 5);
                        }
                    }

                    // Add star on top
                    const starX = x;
                    const starY = y - size - layers * layerHeight/2;
                    ctx.fillStyle = '#ffd700';  // Gold color
                    
                    // Draw 5-pointed star
                    ctx.beginPath();
                    for(let i = 0; i < 5; i++) {
                        const angle = (i * 4 * Math.PI) / 5;
                        const outerX = starX + Math.cos(angle) * 15;
                        const outerY = starY + Math.sin(angle) * 15;
                        const innerX = starX + Math.cos(angle + Math.PI/5) * 7;
                        const innerY = starY + Math.sin(angle + Math.PI/5) * 7;
                        
                        if(i === 0) ctx.moveTo(outerX, outerY);
                        else ctx.lineTo(outerX, outerY);
                        ctx.lineTo(innerX, innerY);
                    }
                    ctx.closePath();
                    ctx.fill();

                    // Add garland (string lights)
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    for(let layer = 0; layer < layers; layer++) {
                        ctx.beginPath();
                        const startY = y - size/4 - layer * layerHeight;
                        const endY = startY - layerHeight/2;
                        const width = size * (1.4 - layer * 0.3);
                        
                        // Draw wavy line for garland
                        for(let w = 0; w <= 1; w += 0.1) {
                            const wx = x - width/2 + width * w;
                            const wy = startY - layerHeight/2 + Math.sin(w * Math.PI * 2) * 10;
                            if(w === 0) ctx.moveTo(wx, wy);
                            else ctx.lineTo(wx, wy);
                        }
                        ctx.stroke();

                        // Add light bulbs along the garland
                        for(let w = 0; w <= 1; w += 0.2) {
                            const wx = x - width/2 + width * w;
                            const wy = startY - layerHeight/2 + Math.sin(w * Math.PI * 2) * 10;
                            ctx.fillStyle = ornamentColors[Math.floor(Math.random() * ornamentColors.length)];
                            ctx.beginPath();
                            ctx.arc(wx, wy, 3, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                };

                // Draw background trees (smaller and darker)
                for (let i = 0; i < 5; i++) {
                    const x = (i + 1) * (canvas.width / 6) + Math.random() * 30 - 15;
                    const y = canvas.height - 90;
                    const size = 70 + Math.random() * 20;
                    drawTree(x, y, size);
                }

                // Draw Santa Claus
                const drawSanta = (x, y, size) => {
                    // Santa's face
                    ctx.fillStyle = '#FFE0D1';  // Skin tone
                    ctx.beginPath();
                    ctx.arc(x, y - size/2, size/4, 0, Math.PI * 2);
                    ctx.fill();

                    // Santa's hat
                    ctx.fillStyle = '#FF0000';  // Red
                    ctx.beginPath();
                    ctx.moveTo(x - size/3, y - size/2);
                    ctx.quadraticCurveTo(x, y - size, x + size/3, y - size/2);
                    ctx.fill();

                    // Hat trim
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(x - size/3, y - size/2, size/1.5, size/10);
                    
                    // Hat pompom
                    ctx.beginPath();
                    ctx.arc(x + size/3, y - size/2, size/10, 0, Math.PI * 2);
                    ctx.fill();

                    // Beard
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(x, y - size/3, size/3, 0, Math.PI);
                    ctx.fill();

                    // Body (coat)
                    ctx.fillStyle = '#FF0000';
                    ctx.beginPath();
                    ctx.ellipse(x, y + size/4, size/2, size/1.5, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Belt
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x - size/2, y, size, size/10);
                    
                    // Belt buckle
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(x - size/8, y - size/40, size/4, size/8);

                    // Arms
                    ctx.fillStyle = '#FF0000';
                    ctx.beginPath();
                    ctx.ellipse(x - size/2, y, size/4, size/8, -Math.PI/4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(x + size/2, y, size/4, size/8, Math.PI/4, 0, Math.PI * 2);
                    ctx.fill();

                    // Hands
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(x - size/1.5, y + size/8, size/10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x + size/1.5, y + size/8, size/10, 0, Math.PI * 2);
                    ctx.fill();

                    // Eyes
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.arc(x - size/8, y - size/2, size/20, 0, Math.PI * 2);
                    ctx.arc(x + size/8, y - size/2, size/20, 0, Math.PI * 2);
                    ctx.fill();

                    // Rosy cheeks
                    ctx.fillStyle = '#FF9999';
                    ctx.beginPath();
                    ctx.arc(x - size/5, y - size/3, size/15, 0, Math.PI * 2);
                    ctx.arc(x + size/5, y - size/3, size/15, 0, Math.PI * 2);
                    ctx.fill();

                    // Smile
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(x, y - size/3, size/8, 0, Math.PI);
                    ctx.stroke();

                    // Add gift sack
                    ctx.fillStyle = '#8B4513';
                    ctx.beginPath();
                    ctx.ellipse(x + size, y + size/2, size/2, size/1.5, Math.PI/4, 0, Math.PI * 2);
                    ctx.fill();

                    // Sack highlights
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x + size*0.7, y);
                    ctx.lineTo(x + size*1.3, y + size);
                    ctx.stroke();
                };

                // Add Santa to the scene
                drawSanta(canvas.width * 0.8, canvas.height - 120, 80);

                // Draw some bushes
                const drawBush = (x, y, size) => {
                    const bushColors = ['#2d5a27', '#3e7a3c', '#1a4314', '#4a8f48'];
                    
                    // Draw multiple layers for depth
                    for (let i = 3; i >= 0; i--) {
                        ctx.fillStyle = bushColors[i];
                        ctx.beginPath();
                        
                        // Create irregular bush shape
                        for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
                            const variance = (Math.random() * 0.3 + 0.7) * size;
                            const px = x + Math.cos(angle) * variance + i * 5;
                            const py = y + Math.sin(angle) * variance + i * 3;
                            if (angle === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        }
                        ctx.closePath();
                        ctx.fill();
                    }
                };

                // Add bushes
                for (let i = 0; i < 8; i++) {
                    const x = i * (canvas.width / 8) + Math.random() * 30;
                    const y = canvas.height - 60;
                    const size = 25 + Math.random() * 15;
                    drawBush(x, y, size);
                }

                // Add some flowers
                const drawFlower = (x, y) => {
                    const colors = ['#ff6b6b', '#ffd93d', '#ff9f43', '#ff4757', '#ffffff', '#ffeb3b'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    // Draw petals
                    ctx.fillStyle = color;
                    for (let i = 0; i < 5; i++) {
                        const angle = (i / 5) * Math.PI * 2;
                        const px = x + Math.cos(angle) * 5;
                        const py = y + Math.sin(angle) * 5;
                        ctx.beginPath();
                        ctx.ellipse(px, py, 4, 2, angle, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    // Draw flower center
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                };

                // Add scattered flowers
                for (let i = 0; i < 30; i++) {
                    const x = Math.random() * canvas.width;
                    const y = canvas.height - 40 - Math.random() * 40;
                    drawFlower(x, y);
                }

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

        // Update party poppers and remove finished ones
        this.partyPoppers = this.partyPoppers.filter(popper => popper.update());

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
        
        // Draw party poppers
        this.partyPoppers.forEach(popper => popper.draw(this.ctx));

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
        
        // Initialize with some default scores if empty
        if (this.scores.length === 0) {
            this.scores = [
                { name: 'Player 1', score: 100, level: 3 },
                { name: 'Player 2', score: 80, level: 2 },
                { name: 'Player 3', score: 60, level: 2 },
                { name: 'Player 4', score: 40, level: 1 },
                { name: 'Player 5', score: 20, level: 1 }
            ];
            localStorage.setItem('basketCatcherScores', JSON.stringify(this.scores));
        }
        
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
        
        // Add header
        const header = document.createElement('div');
        header.className = 'scores-header';
        header.innerHTML = `
            <div>Rank</div>
            <div>Player</div>
            <div>Level</div>
            <div>Score</div>
        `;
        scoresList.appendChild(header);
        
        // Add scores
        this.scores.forEach((scoreData, index) => {
            const scoreEntry = document.createElement('div');
            scoreEntry.className = 'score-entry';
            
            const rank = document.createElement('div');
            rank.className = 'rank';
            rank.textContent = `#${index + 1}`;
            
            const playerName = document.createElement('div');
            playerName.className = 'player-name';
            playerName.textContent = scoreData.name || 'Anonymous';
            
            const level = document.createElement('div');
            level.className = 'level';
            level.textContent = `Lvl ${scoreData.level || 1}`;
            
            const score = document.createElement('div');
            score.className = 'score';
            score.textContent = scoreData.score;
            
            scoreEntry.appendChild(rank);
            scoreEntry.appendChild(playerName);
            scoreEntry.appendChild(level);
            scoreEntry.appendChild(score);
            
            scoresList.appendChild(scoreEntry);
        });
    }

    showLevelUpMessage() {
        // Create level up message
        const levelUpDiv = document.createElement('div');
        levelUpDiv.className = 'level-up-message';
        levelUpDiv.textContent = `Level ${this.level}!`;
        
        // Add to the game canvas container
        const gameCanvas = document.getElementById('gameCanvas');
        gameCanvas.parentElement.appendChild(levelUpDiv);

        // Check if it's every 3rd level
        if (this.level % 3 === 0) {
            // Create multiple party poppers across the screen
            for (let i = 0; i < 5; i++) {
                this.partyPoppers.push(new PartyPopper(
                    this.canvas,
                    Math.random() * this.canvas.width,
                    Math.random() * this.canvas.height
                ));
            }
        }

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

function updateScoreboard(scores) {
    const scoresList = document.getElementById('scores-list');
    scoresList.innerHTML = '';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'scores-header';
    header.innerHTML = `
        <div>Rank</div>
        <div>Player</div>
        <div>Level</div>
        <div>Score</div>
    `;
    scoresList.appendChild(header);
    
    // Add scores
    scores.sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .forEach((score, index) => {
            const scoreEntry = document.createElement('div');
            scoreEntry.className = 'score-entry';
            
            const rank = document.createElement('div');
            rank.className = 'rank';
            rank.textContent = `#${index + 1}`;
            
            const playerName = document.createElement('div');
            playerName.className = 'player-name';
            playerName.textContent = score.name;
            
            const level = document.createElement('div');
            level.className = 'level';
            level.textContent = `Lvl ${score.level || 1}`;
            
            const scoreValue = document.createElement('div');
            scoreValue.className = 'score';
            scoreValue.textContent = score.score;
            
            scoreEntry.appendChild(rank);
            scoreEntry.appendChild(playerName);
            scoreEntry.appendChild(level);
            scoreEntry.appendChild(scoreValue);
            scoresList.appendChild(scoreEntry);
        });
}