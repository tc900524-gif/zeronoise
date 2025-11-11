// 主游戏逻辑
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.level = 1;
        this.score = 0;
        
        // 初始化画布
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 游戏对象
        this.player = null;
        this.enemies = [];
        this.obstacles = [];
        this.explosions = [];
        
        // 输入控制
        this.keys = {};
        this.mouse = { x: 0, y: 0, pressed: false };
        
        this.setupEventListeners();
        this.setupUI();
        
        // 游戏循环
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // 保持16:9的宽高比
        const maxWidth = Math.min(rect.width - 40, 1000);
        const maxHeight = Math.min(rect.height - 40, 600);
        
        let width = maxWidth;
        let height = (maxWidth * 9) / 16;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = (maxHeight * 16) / 9;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // 鼠标事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.gameState === 'playing') {
                this.mouse.pressed = true;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.pressed = false;
            }
        });

        // 防止右键菜单
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    setupUI() {
        // 开始按钮
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // 游戏说明按钮
        document.getElementById('instructionsBtn').addEventListener('click', () => {
            this.showInstructions();
        });

        // 返回按钮
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showMenu();
        });

        // 重新开始按钮
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('restartBtn2').addEventListener('click', () => {
            this.restartGame();
        });

        // 菜单按钮
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.showMenu();
        });
        
        document.getElementById('menuBtn2').addEventListener('click', () => {
            this.showMenu();
        });

        // 继续游戏按钮
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeGame();
        });
    }

    startGame() {
        this.gameState = 'playing';
        this.level = 1;
        this.score = 0;
        this.hideAllMenus();
        this.initLevel();
        this.updateUI();
    }

    restartGame() {
        this.startGame();
    }

    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pauseMenu').classList.remove('hidden');
    }

    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseMenu').classList.add('hidden');
    }

    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }

    showMenu() {
        this.gameState = 'menu';
        document.getElementById('gameMenu').classList.remove('hidden');
        document.getElementById('gameUI').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('gameInstructions').classList.add('hidden');
    }

    showInstructions() {
        document.getElementById('gameMenu').classList.add('hidden');
        document.getElementById('gameInstructions').classList.remove('hidden');
    }

    hideAllMenus() {
        document.getElementById('gameMenu').classList.add('hidden');
        document.getElementById('gameInstructions').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('gameUI').classList.remove('hidden');
    }

    initLevel() {
        // 初始化玩家
        this.player = new PlayerTank(this.canvas.width / 2, this.canvas.height - 60);
        
        // 初始化敌坦克
        this.enemies = [];
        const enemyCount = Math.min(2 + this.level, 6);
        for (let i = 0; i < enemyCount; i++) {
            const x = (i % 3) * (this.canvas.width / 3) + 50;
            const y = 50 + Math.floor(i / 3) * 100;
            this.enemies.push(new EnemyTank(x, y));
        }
        
        // 初始化障碍物
        this.obstacles = this.generateObstacles();
        
        // 初始化爆炸效果
        this.explosions = [];
    }

    generateObstacles() {
        const obstacles = [];
        const obstacleCount = 8 + this.level * 2;
        
        for (let i = 0; i < obstacleCount; i++) {
            let x, y, width, height;
            let attempts = 0;
            let validPosition = false;
            
            while (!validPosition && attempts < 50) {
                x = Math.random() * (this.canvas.width - 80) + 40;
                y = Math.random() * (this.canvas.height - 120) + 60;
                width = 30 + Math.random() * 40;
                height = 30 + Math.random() * 40;
                
                // 检查是否与玩家或敌坦克重叠
                const tempObstacle = new Obstacle(x, y, width, height);
                const playerDist = this.player.position.distance(new Vector2(x + width/2, y + height/2));
                const enemyOverlap = this.enemies.some(enemy => {
                    const enemyDist = enemy.position.distance(new Vector2(x + width/2, y + height/2));
                    return enemyDist < 80;
                });
                
                validPosition = playerDist > 100 && !enemyOverlap;
                attempts++;
            }
            
            const type = Math.random() < 0.3 ? 'box' : 'wall';
            obstacles.push(new Obstacle(x, y, width, height, type));
        }
        
        return obstacles;
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;

        // 更新玩家
        this.player.update(this.canvas.width, this.canvas.height, this);
        
        // 玩家瞄准
        if (this.mouse.pressed) {
            this.player.shoot(this.mouse.x, this.mouse.y);
        }

        // 更新敌坦克
        this.enemies.forEach(enemy => enemy.update(this.canvas.width, this.canvas.height, this));

        // 更新爆炸效果
        this.explosions = this.explosions.filter(explosion => {
            explosion.update();
            return explosion.alive;
        });

        // 碰撞检测
        this.handleCollisions();

        // 检查游戏状态
        this.checkGameState();

        // 更新UI
        this.updateUI();
    }

    handleCollisions() {
        // 子弹碰撞检测
        const allTanks = [this.player, ...this.enemies];
        
        allTanks.forEach(tank => {
            if (!tank.alive) return;
            
            tank.bullets.forEach(bullet => {
                if (!bullet.alive) return;
                
                // 与其他坦克碰撞
                allTanks.forEach(target => {
                    if (target !== tank && target.alive && bullet.checkCollision(target)) {
                        target.takeDamage(bullet.damage);
                        bullet.alive = false;
                        
                        if (!target.alive) {
                            this.explosions.push(new Explosion(target.position.x, target.position.y));
                            if (tank.isPlayer) {
                                this.score += 100;
                            }
                        }
                    }
                });
                
                // 与障碍物碰撞
                this.obstacles.forEach(obstacle => {
                    if (obstacle.checkCollision(bullet)) {
                        bullet.alive = false;
                        
                        if (obstacle.takeDamage(bullet.damage)) {
                            // 障碍物被摧毁
                            const index = this.obstacles.indexOf(obstacle);
                            this.obstacles.splice(index, 1);
                        }
                    }
                });
            });
        });

        // 清理无效子弹
        allTanks.forEach(tank => {
            tank.bullets = tank.bullets.filter(bullet => bullet.alive);
        });
    }

    checkGameState() {
        // 检查玩家是否死亡
        if (!this.player.alive) {
            this.gameOver();
            return;
        }

        // 检查是否所有敌人都被击败
        const aliveEnemies = this.enemies.filter(enemy => enemy.alive);
        if (aliveEnemies.length === 0) {
            this.nextLevel();
        }
    }

    nextLevel() {
        this.level++;
        this.initLevel();
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('enemiesLeft').textContent = this.enemies.filter(e => e.alive).length;
        
        // 更新血条
        const healthFill = document.getElementById('healthFill');
        const healthPercent = this.player.health / this.player.maxHealth;
        healthFill.style.width = (healthPercent * 100) + '%';
        
        // 血条颜色
        healthFill.className = 'health-fill';
        if (healthPercent < 0.3) {
            healthFill.classList.add('low');
        } else if (healthPercent < 0.6) {
            healthFill.classList.add('medium');
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // 绘制网格
            this.drawGrid();
            
            // 绘制障碍物
            this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
            
            // 绘制爆炸效果
            this.explosions.forEach(explosion => explosion.draw(this.ctx));
            
            // 绘制玩家
            this.player.draw(this.ctx);
            
            // 绘制敌坦克
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        // 垂直线
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.gameLoop);
    }
}

// 初始化游戏
window.addEventListener('load', () => {
    new Game();
});