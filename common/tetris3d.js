// 3D俄罗斯方块游戏使用Three.js
import * as THREE from 'three';

class Tetris3D {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.board = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.boardWidth = 10;
    this.boardHeight = 20;
    this.boardDepth = 10; // 3D俄罗斯方块的深度
    this.gameActive = false;
    this.gamePaused = false;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.dropCounter = 0;
    this.dropInterval = 1000; // 毫秒
    this.lastTime = 0;
    
    // 方块类型定义
    this.shapes = [
      { // I 形
        blocks: [
          {x: -1, y: 0, z: 0}, {x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 2, y: 0, z: 0}
        ],
        color: 0x00ffff
      },
      { // O 形
        blocks: [
          {x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, 
          {x: 0, y: 1, z: 0}, {x: 1, y: 1, z: 0}
        ],
        color: 0xffff00
      },
      { // T 形
        blocks: [
          {x: -1, y: 0, z: 0}, {x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, 
          {x: 0, y: 1, z: 0}
        ],
        color: 0x800080
      },
      { // S 形
        blocks: [
          {x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, 
          {x: -1, y: 1, z: 0}, {x: 0, y: 1, z: 0}
        ],
        color: 0x00ff00
      },
      { // Z 形
        blocks: [
          {x: -1, y: 0, z: 0}, {x: 0, y: 0, z: 0}, 
          {x: 0, y: 1, z: 0}, {x: 1, y: 1, z: 0}
        ],
        color: 0xff0000
      },
      { // J 形
        blocks: [
          {x: -1, y: 0, z: 0}, {x: -1, y: 1, z: 0}, 
          {x: 0, y: 1, z: 0}, {x: 1, y: 1, z: 0}
        ],
        color: 0x0000ff
      },
      { // L 形
        blocks: [
          {x: 1, y: 0, z: 0}, {x: 1, y: 1, z: 0}, 
          {x: 0, y: 1, z: 0}, {x: -1, y: 1, z: 0}
        ],
        color: 0xff7700
      }
    ];
    
    this.initializeGame();
  }

  initializeGame() {
    // 初始化游戏板
    this.createBoard();
    
    // 设置Three.js场景
    this.setupScene();
    
    // 生成第一个方块
    this.nextPiece = this.getRandomShape();
    this.spawnNewPiece();
    
    // 绑定事件
    this.bindEvents();
  }

  createBoard() {
    this.board = [];
    for (let x = 0; x < this.boardWidth; x++) {
      this.board[x] = [];
      for (let y = 0; y < this.boardHeight; y++) {
        this.board[x][y] = [];
        for (let z = 0; z < this.boardDepth; z++) {
          this.board[x][y][z] = 0; // 0 表示空位
        }
      }
    }
  }

  setupScene() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111122);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(75, 400 / 600, 0.1, 1000);
    this.camera.position.set(7, 15, 15);
    this.camera.lookAt(5, 0, 5);

    // 创建渲染器
    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(400, 600);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // 添加网格地板
    const gridHelper = new THREE.GridHelper(this.boardWidth, this.boardWidth);
    gridHelper.position.y = -0.5;
    this.scene.add(gridHelper);

    // 添加坐标轴助手
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
  }

  getRandomShape() {
    const shapeIndex = Math.floor(Math.random() * this.shapes.length);
    return JSON.parse(JSON.stringify(this.shapes[shapeIndex]));
  }

  spawnNewPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getRandomShape();
    
    // 将当前方块放在游戏板顶部中央
    this.currentPiece.x = Math.floor(this.boardWidth / 2) - 1;
    this.currentPiece.y = this.boardHeight - 1; // 从顶部开始
    this.currentPiece.z = Math.floor(this.boardDepth / 2) - 1;

    // 检查新生成的方块是否与现有方块冲突
    if (this.checkCollision()) {
      this.gameOver();
    }
  }

  checkCollision() {
    for (const block of this.currentPiece.blocks) {
      const x = this.currentPiece.x + block.x;
      const y = this.currentPiece.y + block.y;
      const z = this.currentPiece.z + block.z;

      // 检查边界
      if (x < 0 || x >= this.boardWidth || y < 0 || y >= this.boardHeight || z < 0 || z >= this.boardDepth) {
        return true;
      }

      // 检查是否与已放置的方块冲突
      if (y >= 0 && this.board[x][y][z] !== 0) {
        return true;
      }
    }
    return false;
  }

  rotatePiece() {
    if (!this.gameActive || this.gamePaused) return;

    // 简单的旋转变换（绕Z轴旋转）
    const originalBlocks = JSON.parse(JSON.stringify(this.currentPiece.blocks));
    
    for (let i = 0; i < this.currentPiece.blocks.length; i++) {
      const block = this.currentPiece.blocks[i];
      // 顺时针旋转90度
      const newX = -block.z;
      const newZ = block.x;
      this.currentPiece.blocks[i] = { x: newX, y: block.y, z: newZ };
    }

    // 如果旋转后发生碰撞，则恢复原始位置
    if (this.checkCollision()) {
      this.currentPiece.blocks = originalBlocks;
    }
  }

  movePiece(dx, dy, dz) {
    if (!this.gameActive || this.gamePaused) return;

    this.currentPiece.x += dx;
    this.currentPiece.y += dy;
    this.currentPiece.z += dz;

    if (this.checkCollision()) {
      // 如果移动后发生碰撞，撤销移动
      this.currentPiece.x -= dx;
      this.currentPiece.y -= dy;
      this.currentPiece.z -= dz;

      // 如果是向下移动导致的碰撞，说明方块已放置
      if (dy < 0) {
        this.placePiece();
        this.clearLines();
        this.spawnNewPiece();
      }
    }
  }

  dropPiece() {
    if (!this.gameActive || this.gamePaused) return;

    while (!this.checkCollision()) {
      this.currentPiece.y--;
    }
    // 碰撞后向上移动一行再放置
    this.currentPiece.y++;
    this.placePiece();
    this.clearLines();
    this.spawnNewPiece();
  }

  placePiece() {
    for (const block of this.currentPiece.blocks) {
      const x = this.currentPiece.x + block.x;
      const y = this.currentPiece.y + block.y;
      const z = this.currentPiece.z + block.z;

      if (y >= 0) { // 只有在游戏区域内才放置
        this.board[x][y][z] = this.currentPiece.color;
      }
    }
  }

  clearLines() {
    let linesCleared = 0;

    // 检查每一层是否有完整的行
    for (let y = this.boardHeight - 1; y >= 0; y--) {
      let fullLayers = 0;
      
      // 检查当前层是否完全填满
      let layerFull = true;
      for (let x = 0; x < this.boardWidth; x++) {
        for (let z = 0; z < this.boardDepth; z++) {
          if (this.board[x][y][z] === 0) {
            layerFull = false;
            break;
          }
        }
        if (!layerFull) break;
      }
      
      if (layerFull) {
        fullLayers++;
        linesCleared++;
        
        // 移除完整的层
        for (let x = 0; x < this.boardWidth; x++) {
          for (let z = 0; z < this.boardDepth; z++) {
            this.board[x][y][z] = 0;
          }
        }
        
        // 将上面的层下移
        for (let y2 = y; y2 < this.boardHeight - 1; y2++) {
          for (let x = 0; x < this.boardWidth; x++) {
            for (let z = 0; z < this.boardDepth; z++) {
              this.board[x][y2][z] = this.board[x][y2 + 1][z];
            }
          }
        }
        
        // 检查同一层是否还有完整的层（因为移动后可能产生新的完整层）
        y++; // 重新检查当前层
      }
    }

    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.score += linesCleared * 100 * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
      
      // 更新UI
      document.getElementById('score-value').textContent = this.score;
      document.getElementById('level-value').textContent = this.level;
      document.getElementById('lines-value').textContent = this.lines;
    }
  }

  update(time) {
    if (!this.gameActive || this.gamePaused) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.dropCounter += deltaTime;
    if (this.dropCounter > this.dropInterval) {
      this.movePiece(0, -1, 0); // 向下移动
      this.dropCounter = 0;
    }

    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }

  bindEvents() {
    document.addEventListener('keydown', (event) => {
      if (!this.gameActive || this.gamePaused) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.movePiece(-1, 0, 0); // 左移
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.movePiece(1, 0, 0); // 右移
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.rotatePiece(); // 旋转
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.movePiece(0, -1, 0); // 下移
          break;
        case ' ':
          this.dropPiece(); // 快速下落
          break;
      }
    });

    // 按钮事件
    document.getElementById('start-btn').addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('pause-btn').addEventListener('click', () => {
      this.pauseGame();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
      this.resetGame();
    });
  }

  startGame() {
    if (!this.gameActive) {
      this.gameActive = true;
      this.gamePaused = false;
      this.lastTime = performance.now();
      this.gameLoop();
    } else if (this.gamePaused) {
      this.gamePaused = false;
      this.lastTime = performance.now();
    }
  }

  pauseGame() {
    if (this.gameActive) {
      this.gamePaused = true;
    }
  }

  resetGame() {
    this.gameActive = false;
    this.gamePaused = false;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.dropInterval = 1000;
    
    // 更新UI
    document.getElementById('score-value').textContent = this.score;
    document.getElementById('level-value').textContent = this.level;
    document.getElementById('lines-value').textContent = this.lines;
    
    // 重置游戏板
    this.createBoard();
    
    // 生成新方块
    this.nextPiece = this.getRandomShape();
    this.spawnNewPiece();
  }

  gameOver() {
    this.gameActive = false;
    alert(`Game Over! Your score: ${this.score}`);
  }

  gameLoop = () => {
    if (this.gameActive && !this.gamePaused) {
      const time = performance.now();
      this.update(time);
    }
    requestAnimationFrame(this.gameLoop);
  }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  // 检查Three.js是否已加载
  if (typeof THREE !== 'undefined') {
    const game = new Tetris3D();
  } else {
    console.error('Three.js library not loaded!');
  }
});