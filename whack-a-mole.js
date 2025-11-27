document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const scoreDisplay = document.getElementById('score');
    const timeDisplay = document.getElementById('time');
    const molesHitDisplay = document.getElementById('moles-hit');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const gameOverScreen = document.getElementById('game-over');
    const finalScoreDisplay = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');

    // 游戏变量
    let score = 0;
    let timeLeft = 30;
    let molesHit = 0;
    let gameActive = false;
    let timer;
    let moleTimer;
    let holes = [];
    const totalHoles = 9;

    // 创建游戏洞
    function createHoles() {
        gameBoard.innerHTML = '';
        holes = [];
        
        for (let i = 0; i < totalHoles; i++) {
            const hole = document.createElement('div');
            hole.classList.add('hole');
            hole.dataset.index = i;
            
            const mole = document.createElement('div');
            mole.classList.add('mole');
            mole.dataset.index = i;
            
            mole.addEventListener('click', whackMole);
            
            hole.appendChild(mole);
            gameBoard.appendChild(hole);
            holes.push({
                hole: hole,
                mole: mole
            });
        }
    }

    // 打地鼠
    function whackMole(e) {
        if (!gameActive) return;
        
        const mole = e.target;
        if (mole.classList.contains('up')) {
            mole.classList.remove('up');
            score += 10;
            molesHit++;
            scoreDisplay.textContent = score;
            molesHitDisplay.textContent = molesHit;
        }
    }

    // 随机显示地鼠
    function showMole() {
        if (!gameActive) return;
        
        // 随机选择一个洞
        const randomIndex = Math.floor(Math.random() * totalHoles);
        const mole = holes[randomIndex].mole;
        
        // 显示地鼠
        mole.classList.add('up');
        
        // 设置地鼠消失时间
        setTimeout(() => {
            if (mole.classList.contains('up')) {
                mole.classList.remove('up');
            }
        }, 800); // 地鼠显示800毫秒
    }

    // 开始游戏
    function startGame() {
        if (gameActive) return;
        
        resetGame();
        gameActive = true;
        startBtn.disabled = true;
        
        // 开始随机显示地鼠
        moleTimer = setInterval(showMole, 800);
        
        // 开始倒计时
        timer = setInterval(() => {
            timeLeft--;
            timeDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // 暂停游戏
    function pauseGame() {
        gameActive = !gameActive;
        pauseBtn.textContent = gameActive ? '暂停' : '继续';
        
        if (gameActive) {
            // 恢复计时器
            timer = setInterval(() => {
                timeLeft--;
                timeDisplay.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    endGame();
                }
            }, 1000);
            
            // 恢复地鼠出现
            moleTimer = setInterval(showMole, 800);
        } else {
            // 暂停计时器
            clearInterval(timer);
            clearInterval(moleTimer);
        }
    }

    // 结束游戏
    function endGame() {
        gameActive = false;
        clearInterval(timer);
        clearInterval(moleTimer);
        
        // 隐藏所有地鼠
        holes.forEach(hole => {
            hole.mole.classList.remove('up');
        });
        
        startBtn.disabled = false;
        pauseBtn.textContent = '暂停';
        
        // 显示游戏结束界面
        finalScoreDisplay.textContent = score;
        gameOverScreen.style.display = 'block';
    }

    // 重新开始游戏
    function restartGame() {
        gameOverScreen.style.display = 'none';
        startGame();
    }

    // 重置游戏
    function resetGame() {
        score = 0;
        timeLeft = 30;
        molesHit = 0;
        
        scoreDisplay.textContent = score;
        timeDisplay.textContent = timeLeft;
        molesHitDisplay.textContent = molesHit;
        
        gameOverScreen.style.display = 'none';
    }

    // 事件监听器
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    restartBtn.addEventListener('click', restartGame);

    // 初始化游戏
    createHoles();
});