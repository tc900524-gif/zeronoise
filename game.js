// 坦克大战游戏主逻辑
class TankBattleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // 游戏状态
        this.gameState = {
            lives: 3,
            score: 0,
            level: 1,
            isGameOver: false,
            isPaused: false
        };
        
        // 游戏对象
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.obstacles = [];
        this.explosions = [];
        
        // 输入控制
        this.keys = {};
        
        // 游戏配置
        this.config = {
            enemyCount: 3,
            enemySpeed: 1.5,
            playerSpeed: 3,
            bulletSpeed: 5,
            fireCooldown: 300
        };
        
        this.lastFireTime = 0;
        this.lastEnemyFireTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateMap();
        this.createPlayer();
        this.createEnemies();
        this.startGameLoop();
    }
    
    setupEventListeners() {
        // 键盘输入
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'r' || e.key === 'R') {
                if (this.gameState.isGameOver) {
                    this.restartGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    generateMap() {
        this.obstacles = [];
        
        // 地图边界
        for (let x = 0; x < this.canvas.width; x += 40) {
            for (let y = 0; y < this.canvas.height; y += 40) {
                if (x === 0 || y === 0 || x === this.canvas.width - 40 || y === this.canvas.height - 40) {
                    this.obstacles.push({
                        x: x,
                        y: y,
                        width: 40,
                        height: 40,
                        type: 'wall',
                        destructible: false
                    });
                }
            }
        }
        
        // 随机障碍物
        for (let i = 0; i < 15; i++) {
            let x, y, validPosition = false;
            let attempts = 0;
            
            while (!validPosition && attempts < 50) {
                x = Math.floor(Math.random() * 18) * 40 + 40;
                y = Math.floor(Math.random() * 13) * 40 + 40;
                validPosition = true;
                
                // 检查是否与玩家出生点或敌方出生点重叠
                for (let obs of this.obstacles) {
                    if (this.isColliding({x, y, width: 40, height: 40}, obs)) {
                        validPosition = false;
                        break;
                    }
                }
                
                // 检查是否在玩家或敌方区域
                if ((x < 120 && y > 440) || (x > 680 && y < 160)) {
                    validPosition = false;
                }
                
                attempts++;
            }
            
            if (validPosition) {
                this.obstacles.push({
                    x: x,
                    y: y,
                    width: 40,
                    height: 40,
                    type: Math.random() > 0.3 ? 'brick' : 'steel',
                    destructible: Math.random() > 0.3
                });
            }
        }
    }
    
    createPlayer() {
        this.player = {
            x: 80,
            y: 480,
            width: 30,
            height: 30,
            speed: this.config.playerSpeed,
            direction: 'up',
            color: '#4ecdc4',
            health: 100
        };
    }
    
    createEnemies() {
        this.enemies = [];
        const enemyPositions = [
            {x: 720, y: 80},
            {x: 720, y: 240},
            {x: 720, y: 400}
        ];
        
        for (let i = 0; i < this.config.enemyCount; i++) {
            const pos = enemyPositions[i] || {x: 720, y: 80 + i * 80};
            this.enemies.push({
                x: pos.x,
                y: pos.y,
                width: 30,
                height: 30,
                speed: this.config.enemySpeed,
                direction: 'down',
                color: '#ff6b6b',
                health: 100,
                aiState: 'patrol',
                lastDirectionChange: 0,
                targetX: pos.x,
                targetY: pos.y
            });
        }
    }
    
    startGameLoop() {
        const gameLoop = () => {
            if (!this.gameState.isGameOver) {
                this.update();
                this.render();
            }
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    
    update() {
        this.updatePlayer();
        this.updateEnemies();
        this.updateBullets();
        this.updateExplosions();
        this.checkCollisions();
        this.updateGameState();
    }
    
    updatePlayer() {
        if (!this.player) return;
        
        let newX = this.player.x;
        let newY = this.player.y;
        
        // 移动控制
        if (this.keys['w'] || this.keys['arrowup']) {
            newY -= this.player.speed;
            this.player.direction = 'up';
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            newY += this.player.speed;
            this.player.direction = 'down';
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            newX -= this.player.speed;
            this.player.direction = 'left';
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            newX += this.player.speed;
            this.player.direction = 'right';
        }
        
        // 检查边界
        if (newX >= 0 && newX <= this.canvas.width - this.player.width) {
            this.player.x = newX;
        }
        if (newY >= 0 && newY <= this.canvas.height - this.player.height) {
            this.player.y = newY;
        }
        
        // 检查与障碍物碰撞
        for (let obstacle of this.obstacles) {
            if (this.isColliding(this.player, obstacle)) {
                this.player.x = this.player.x - (this.player.x - newX) * 0.5;
                this.player.y = this.player.y - (this.player.y - newY) * 0.5;
                break;
            }
        }
        
        // 射击控制
        if (this.keys[' '] || this.keys['space']) {
            const currentTime = Date.now();
            if (currentTime - this.lastFireTime > this.config.fireCooldown) {
                this.playerFire();
                this.lastFireTime = currentTime;
            }
        }
    }
    
    updateEnemies() {
        const currentTime = Date.now();
        
        for (let enemy of this.enemies) {
            if (enemy.health <= 0) continue;
            
            // 简单AI：追踪玩家或随机巡逻
            if (this.player && currentTime - enemy.lastDirectionChange > 1000) {
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    // 追踪模式
                    enemy.aiState = 'chase';
                    if (Math.abs(dx) > Math.abs(dy)) {
                        enemy.direction = dx > 0 ? 'right' : 'left';
                    } else {
                        enemy.direction = dy > 0 ? 'down' : 'up';
                    }
                } else {
                    // 巡逻模式
                    enemy.aiState = 'patrol';
                    const directions = ['up', 'down', 'left', 'right'];
                    enemy.direction = directions[Math.floor(Math.random() * 4)];
                }
                
                enemy.lastDirectionChange = currentTime;
            }
            
            // 移动
            let newX = enemy.x;
            let newY = enemy.y;
            
            switch (enemy.direction) {
                case 'up':
                    newY -= enemy.speed;
                    break;
                case 'down':
                    newY += enemy.speed;
                    break;
                case 'left':
                    newX -= enemy.speed;
                    break;
                case 'right':
                    newX += enemy.speed;
                    break;
            }
            
            // 检查边界和障碍物
            let canMove = true;
            if (newX < 0 || newX > this.canvas.width - enemy.width) canMove = false;
            if (newY < 0 || newY > this.canvas.height - enemy.height) canMove = false;
            
            const tempEnemy = {x: newX, y: newY, width: enemy.width, height: enemy.height};
            for (let obstacle of this.obstacles) {
                if (this.isColliding(tempEnemy, obstacle)) {
                    canMove = false;
                    break;
                }
            }
            
            if (canMove) {
                enemy.x = newX;
                enemy.y = newY;
            } else {
                // 改变方向
                const directions = ['up', 'down', 'left', 'right'];
                enemy.direction = directions[Math.floor(Math.random() * 4)];
            }
            
            // AI射击
            if (this.player && currentTime - this.lastEnemyFireTime > 2000) {
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 250) {
                    this.enemyFire(enemy);
                    this.lastEnemyFireTime = currentTime;
                }
            }
        }
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            switch (bullet.direction) {
                case 'up':
                    bullet.y -= bullet.speed;
                    break;
                case 'down':
                    bullet.y += bullet.speed;
                    break;
                case 'left':
                    bullet.x -= bullet.speed;
                    break;
                case 'right':
                    bullet.x += bullet.speed;
                    break;
            }
            
            // 移除超出边界的子弹
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.life -= 1;
            
            if (explosion.life <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // 子弹与障碍物碰撞
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.obstacles.length - 1; j >= 0; j--) {
                const obstacle = this.obstacles[j];
                
                if (this.isColliding(bullet, obstacle)) {
                    // 创建爆炸效果
                    this.createExplosion(bullet.x, bullet.y);
                    
                    // 移除子弹
                    this.bullets.splice(i, 1);
                    
                    // 破坏可破坏的障碍物
                    if (obstacle.destructible) {
                        this.obstacles.splice(j, 1);
                        this.gameState.score += 10;
                    }
                    
                    break;
                }
            }
        }
        
        // 子弹与坦克碰撞
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // 检查与敌方坦克碰撞
            for (let enemy of this.enemies) {
                if (enemy.health > 0 && this.isColliding(bullet, enemy)) {
                    this.createExplosion(bullet.x, bullet.y);
                    this.bullets.splice(i, 1);
                    enemy.health -= 50;
                    
                    if (enemy.health <= 0) {
                        this.createExplosion(enemy.x, enemy.y);
                        this.gameState.score += 100;
                    }
                    break;
                }
            }
            
            // 检查与玩家坦克碰撞
            if (this.player && this.isColliding(bullet, this.player)) {
                this.createExplosion(bullet.x, bullet.y);
                this.bullets.splice(i, 1);
                this.player.health -= 25;
                
                if (this.player.health <= 0) {
                    this.createExplosion(this.player.x, this.player.y);
                    this.gameState.lives -= 1;
                    this.player.health = 100;
                    
                    if (this.gameState.lives <= 0) {
                        this.gameOver();
                    }
                }
            }
        }
    }
    
    updateGameState() {
        // 检查关卡完成
        const aliveEnemies = this.enemies.filter(enemy => enemy.health > 0);
        if (aliveEnemies.length === 0) {
            this.nextLevel();
        }
    }
    
    nextLevel() {
        this.gameState.level += 1;
        this.config.enemyCount = Math.min(8, 3 + this.gameState.level);
        this.config.enemySpeed = Math.min(3, 1.5 + this.gameState.level * 0.2);
        
        this.showLevelUp();
        this.generateMap();
        this.createEnemies();
        this.createPlayer();
    }
    
    playerFire() {
        const bullet = {
            x: this.player.x + this.player.width / 2 - 2,
            y: this.player.y + this.player.height / 2 - 2,
            width: 4,
            height: 4,
            speed: this.config.bulletSpeed,
            direction: this.player.direction,
            owner: 'player',
            color: '#4ecdc4'
        };
        
        // 调整子弹初始位置
        switch (this.player.direction) {
            case 'up':
                bullet.y = this.player.y;
                break;
            case 'down':
                bullet.y = this.player.y + this.player.height - 4;
                break;
            case 'left':
                bullet.x = this.player.x;
                break;
            case 'right':
                bullet.x = this.player.x + this.player.width - 4;
                break;
        }
        
        this.bullets.push(bullet);
    }
    
    enemyFire(enemy) {
        const bullet = {
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height / 2 - 2,
            width: 4,
            height: 4,
            speed: this.config.bulletSpeed * 0.8,
            direction: enemy.direction,
            owner: 'enemy',
            color: '#ff6b6b'
        };
        
        // 调整子弹初始位置
        switch (enemy.direction) {
            case 'up':
                bullet.y = enemy.y;
                break;
            case 'down':
                bullet.y = enemy.y + enemy.height - 4;
                break;
            case 'left':
                bullet.x = enemy.x;
                break;
            case 'right':
                bullet.x = enemy.x + enemy.width - 4;
                break;
        }
        
        this.bullets.push(bullet);
    }
    
    createExplosion(x, y) {
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 30,
            life: 20,
            color: '#ffaa00'
        });
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    showLevelUp() {
        const levelUp = document.getElementById('levelUp');
        levelUp.style.display = 'block';
        setTimeout(() => {
            levelUp.style.display = 'none';
        }, 2000);
    }
    
    gameOver() {
        this.gameState.isGameOver = true;
        document.getElementById('finalScore').textContent = this.gameState.score;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    restartGame() {
        this.gameState = {
            lives: 3,
            score: 0,
            level: 1,
            isGameOver: false,
            isPaused: false
        };
        
        this.config = {
            enemyCount: 3,
            enemySpeed: 1.5,
            playerSpeed: 3,
            bulletSpeed: 5,
            fireCooldown: 300
        };
        
        this.generateMap();
        this.createPlayer();
        this.createEnemies();
        this.bullets = [];
        this.explosions = [];
        
        document.getElementById('gameOver').style.display = 'none';
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('lives').textContent = this.gameState.lives;
        document.getElementById('score').textContent = this.gameState.score;
        document.getElementById('level').textContent = this.gameState.level;
    }
    
    render() {
        // 清空画布
        this.ctx.fillStyle = '#2d4a1f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制障碍物
        for (let obstacle of this.obstacles) {
            this.drawObstacle(obstacle);
        }
        
        // 绘制玩家
        if (this.player) {
            this.drawTank(this.player, true);
        }
        
        // 绘制敌方
        for (let enemy of this.enemies) {
            if (enemy.health > 0) {
                this.drawTank(enemy, false);
            }
        }
        
        // 绘制子弹
        for (let bullet of this.bullets) {
            this.drawBullet(bullet);
        }
        
        // 绘制爆炸
        for (let explosion of this.explosions) {
            this.drawExplosion(explosion);
        }
        
        // 更新UI
        this.updateUI();
    }
    
    drawTank(tank, isPlayer) {
        this.ctx.fillStyle = tank.color;
        this.ctx.fillRect(tank.x, tank.y, tank.width, tank.height);
        
        // 绘制炮管
        this.ctx.fillStyle = isPlayer ? '#45b7aa' : '#ff5252';
        const barrelLength = 20;
        const barrelWidth = 6;
        
        this.ctx.save();
        this.ctx.translate(tank.x + tank.width / 2, tank.y + tank.height / 2);
        
        switch (tank.direction) {
            case 'up':
                this.ctx.rotate(-Math.PI / 2);
                break;
            case 'down':
                this.ctx.rotate(Math.PI / 2);
                break;
            case 'left':
                this.ctx.rotate(Math.PI);
                break;
        }
        
        this.ctx.fillRect(0, -barrelWidth / 2, barrelLength, barrelWidth);
        this.ctx.restore();
        
        // 绘制生命值条（仅对敌方）
        if (!isPlayer && tank.health < 100) {
            const healthBarWidth = tank.width;
            const healthBarHeight = 4;
            const healthPercent = tank.health / 100;
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(tank.x, tank.y - 8, healthBarWidth, healthBarHeight);
            
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(tank.x, tank.y - 8, healthBarWidth * healthPercent, healthBarHeight);
        }
    }
    
    drawBullet(bullet) {
        this.ctx.fillStyle = bullet.color;
        this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    
    drawObstacle(obstacle) {
        switch (obstacle.type) {
            case 'wall':
                this.ctx.fillStyle = '#666666';
                break;
            case 'brick':
                this.ctx.fillStyle = '#8B4513';
                break;
            case 'steel':
                this.ctx.fillStyle = '#C0C0C0';
                break;
        }
        
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // 添加边框效果
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
    
    drawExplosion(explosion) {
        const alpha = explosion.life / 20;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        const gradient = this.ctx.createRadialGradient(
            explosion.x + 15, explosion.y + 15, 0,
            explosion.x + 15, explosion.y + 15, explosion.maxRadius
        );
        
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff8800');
        gradient.addColorStop(1, '#ff0000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(explosion.x + 15, explosion.y + 15, explosion.maxRadius * (1 - alpha * 0.5), 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
}

// 全局函数
function restartGame() {
    if (window.game) {
        window.game.restartGame();
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TankBattleGame();
});