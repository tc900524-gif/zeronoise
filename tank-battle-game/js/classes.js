// 游戏类定义文件

// 向量类
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const len = this.length();
        return len > 0 ? new Vector2(this.x / len, this.y / len) : new Vector2(0, 0);
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    distance(other) {
        return this.subtract(other).length();
    }
}

// 子弹类
class Bullet {
    constructor(x, y, direction, isPlayer = true) {
        this.position = new Vector2(x, y);
        this.direction = direction.normalize();
        this.speed = 8;
        this.radius = 3;
        this.isPlayer = isPlayer;
        this.damage = isPlayer ? 25 : 15;
        this.alive = true;
        this.color = isPlayer ? '#00ff00' : '#ff0000';
    }

    update(gameWidth, gameHeight) {
        // 移动子弹
        this.position = this.position.add(this.direction.multiply(this.speed));

        // 检查边界
        if (this.position.x < 0 || this.position.x > gameWidth ||
            this.position.y < 0 || this.position.y > gameHeight) {
            this.alive = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    checkCollision(target) {
        const distance = this.position.distance(target.position);
        return distance < target.radius + this.radius;
    }
}

// 障碍物类
class Obstacle {
    constructor(x, y, width, height, type = 'wall') {
        this.position = new Vector2(x, y);
        this.width = width;
        this.height = height;
        this.type = type;
        this.destructible = type === 'box';
        this.health = this.destructible ? 50 : Infinity;
    }

    draw(ctx) {
        if (this.type === 'wall') {
            ctx.fillStyle = '#666';
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
            ctx.strokeStyle = '#888';
            ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
        } else if (this.type === 'box') {
            ctx.fillStyle = this.health > 25 ? '#8B4513' : '#A0522D';
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
            ctx.strokeStyle = '#654321';
            ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
        }
    }

    checkCollision(bullet) {
        return bullet.position.x > this.position.x &&
               bullet.position.x < this.position.x + this.width &&
               bullet.position.y > this.position.y &&
               bullet.position.y < this.position.y + this.height;
    }

    takeDamage(damage) {
        if (this.destructible) {
            this.health -= damage;
            if (this.health <= 0) {
                this.health = 0;
                return true; // 被摧毁
            }
        }
        return false;
    }
}

// 坦克基类
class Tank {
    constructor(x, y, isPlayer = false) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.rotation = 0;
        this.speed = 3;
        this.turnSpeed = 0.08;
        this.radius = 20;
        this.health = 100;
        this.maxHealth = 100;
        this.isPlayer = isPlayer;
        this.bullets = [];
        this.lastShot = 0;
        this.shootCooldown = 300; // 毫秒
        this.alive = true;
    }

    update(gameWidth, gameHeight, game) {
        if (!this.alive) return;

        // 更新位置
        this.position = this.position.add(this.velocity);

        // 边界检查
        this.position.x = Math.max(this.radius, Math.min(gameWidth - this.radius, this.position.x));
        this.position.y = Math.max(this.radius, Math.min(gameHeight - this.radius, this.position.y));

        // 更新子弹
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(gameWidth, gameHeight);
            return bullet.alive;
        });
    }

    canShoot() {
        return Date.now() - this.lastShot > this.shootCooldown;
    }

    shoot(targetX, targetY) {
        if (!this.canShoot() || !this.alive) return;

        const target = new Vector2(targetX, targetY);
        const direction = target.subtract(this.position).normalize();
        
        this.bullets.push(new Bullet(
            this.position.x + direction.x * (this.radius + 5),
            this.position.y + direction.y * (this.radius + 5),
            direction,
            this.isPlayer
        ));
        
        this.lastShot = Date.now();
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);

        // 坦克主体
        ctx.fillStyle = this.isPlayer ? '#3498db' : '#e74c3c';
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        
        // 炮管
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.radius * 0.5, -3, this.radius + 10, 6);
        
        // 炮塔
        ctx.fillStyle = this.isPlayer ? '#2980b9' : '#c0392b';
        ctx.fillRect(-this.radius * 0.5, -this.radius * 0.5, this.radius, this.radius);

        ctx.restore();

        // 绘制子弹
        this.bullets.forEach(bullet => bullet.draw(ctx));

        // 绘制血条
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        if (!this.alive) return;

        const barWidth = 40;
        const barHeight = 6;
        const x = this.position.x - barWidth / 2;
        const y = this.position.y - this.radius - 15;

        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);

        // 血量
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#27ae60' : 
                       healthPercent > 0.3 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // 边框
        ctx.strokeStyle = '#555';
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    getCollidingObstacle(obstacles) {
        return obstacles.find(obstacle => {
            return this.position.x + this.radius > obstacle.position.x &&
                   this.position.x - this.radius < obstacle.position.x + obstacle.width &&
                   this.position.y + this.radius > obstacle.position.y &&
                   this.position.y - this.radius < obstacle.position.y + obstacle.height;
        });
    }
}

// 玩家坦克类
class PlayerTank extends Tank {
    constructor(x, y) {
        super(x, y, true);
        this.score = 0;
    }

    handleInput(keys) {
        this.velocity = new Vector2(0, 0);
        
        if (keys['w'] || keys['W']) this.velocity.y -= this.speed;
        if (keys['s'] || keys['S']) this.velocity.y += this.speed;
        if (keys['a'] || keys['A']) this.velocity.x -= this.speed;
        if (keys['d'] || keys['D']) this.velocity.x += this.speed;

        // 归一化对角线移动
        if (this.velocity.x !== 0 && this.velocity.y !== 0) {
            this.velocity = this.velocity.normalize().multiply(this.speed);
        }
    }

    update(gameWidth, gameHeight, game) {
        this.handleInput(game.keys);
        super.update(gameWidth, gameHeight, game);

        // 碰撞检测
        const obstacle = this.getCollidingObstacle(game.obstacles);
        if (obstacle) {
            // 简单反弹
            this.position = this.position.subtract(this.velocity);
        }
    }
}

// 敌人工坦类
class EnemyTank extends Tank {
    constructor(x, y) {
        super(x, y, false);
        this.target = null;
        this.lastDirectionChange = 0;
        this.directionChangeInterval = 2000; // 2秒改变一次方向
    }

    update(gameWidth, gameHeight, game) {
        if (!this.alive) return;

        this.target = game.player;
        if (!this.target || !this.target.alive) return;

        // AI行为
        this.updateAI(game);

        super.update(gameWidth, gameHeight, game);

        // 碰撞检测
        const obstacle = this.getCollidingObstacle(game.obstacles);
        if (obstacle) {
            this.position = this.position.subtract(this.velocity);
        }
    }

    updateAI(game) {
        if (!this.target) return;

        const distanceToTarget = this.position.distance(this.target.position);
        const directionToTarget = this.target.position.subtract(this.position).normalize();

        // 朝向玩家
        this.rotation = Math.atan2(directionToTarget.y, directionToTarget.x);

        // 移动逻辑
        if (distanceToTarget > 200) {
            // 距离太远，靠近玩家
            this.velocity = directionToTarget.multiply(this.speed * 0.7);
        } else if (distanceToTarget < 100) {
            // 距离太近，后退
            this.velocity = directionToTarget.multiply(-this.speed * 0.5);
        } else {
            // 保持距离
            this.velocity = new Vector2(0, 0);
        }

        // 随机移动（避免卡住）
        if (Date.now() - this.lastDirectionChange > this.directionChangeInterval) {
            const randomAngle = Math.random() * Math.PI * 2;
            this.velocity = new Vector2(Math.cos(randomAngle), Math.sin(randomAngle)).multiply(this.speed * 0.3);
            this.lastDirectionChange = Date.now();
        }

        // 射击逻辑
        if (distanceToTarget < 300 && this.canShoot()) {
            this.shoot(this.target.position.x, this.target.position.y);
        }
    }
}

// 爆炸效果类
class Explosion {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.radius = 0;
        this.maxRadius = 30;
        this.alpha = 1;
        this.alive = true;
    }

    update() {
        this.radius += 2;
        this.alpha = Math.max(0, 1 - this.radius / this.maxRadius);
        
        if (this.radius >= this.maxRadius) {
            this.alive = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // 外圈
        ctx.fillStyle = '#ff4500';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 内圈
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}