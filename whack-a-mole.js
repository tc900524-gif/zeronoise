document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('gameBoard');
    const scoreDisplay = document.getElementById('score');
    const timeDisplay = document.getElementById('time');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const gameOverDisplay = document.getElementById('gameOver');
    const finalScoreDisplay = document.getElementById('finalScore');
    
    // 游戏状态变量
    let score = 0;
    let timeLeft = 30;
    let gameActive = false;
    let timer;
    let moleTimer;
    
    // 创建游戏网格
    function createGameBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const hole = document.createElement('div');
            hole.className = 'mole-hole';
            hole.dataset.index = i;
            
            const mole = document.createElement('div');
            mole.className = 'mole';
            mole.innerHTML = '<div class="mole-img"></div>';
            
            mole.addEventListener('click', () => {
                if (gameActive && mole.classList.contains('up')) {
                    // 击中地鼠
                    mole.classList.remove('up');
                    score++;
                    scoreDisplay.textContent = score;
                }
            });
            
            hole.appendChild(mole);
            gameBoard.appendChild(hole);
        }
    }
    
    // 随机显示地鼠
    function showRandomMole() {
        if (!gameActive) return;
        
        // 获取所有地鼠元素
        const moles = document.querySelectorAll('.mole');
        
        // 随机选择一个地鼠
        const randomIndex = Math.floor(Math.random() * moles.length);
        const randomMole = moles[randomIndex];
        
        // 显示地鼠
        randomMole.classList.add('up');
        
        // 设置地鼠自动隐藏的时间
        setTimeout(() => {
            if(randomMole.classList.contains('up')) {
                randomMole.classList.remove('up');
            }
        }, 800); // 地鼠显示0.8秒
    }
    
    // 开始游戏
    function startGame() {
        if (gameActive) return;
        
        // 重置游戏状态
        score = 0;
        timeLeft = 30;
        gameActive = true;
        
        scoreDisplay.textContent = score;
        timeDisplay.textContent = timeLeft;
        gameOverDisplay.style.display = 'none';
        
        // 开始随机出现地鼠
        moleTimer = setInterval(showRandomMole, 1000); // 每秒随机出现地鼠
        
        // 开始倒计时
        timer = setInterval(() => {
            timeLeft--;
            timeDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }
    
    // 结束游戏
    function endGame() {
        gameActive = false;
        clearInterval(timer);
        clearInterval(moleTimer);
        
        // 隐藏所有地鼠
        const moles = document.querySelectorAll('.mole');
        moles.forEach(mole => mole.classList.remove('up'));
        
        // 显示游戏结束界面
        finalScoreDisplay.textContent = score;
        gameOverDisplay.style.display = 'block';
    }
    
    // 重置游戏
    function resetGame() {
        gameActive = false;
        clearInterval(timer);
        clearInterval(moleTimer);
        
        score = 0;
        timeLeft = 30;
        
        scoreDisplay.textContent = score;
        timeDisplay.textContent = timeLeft;
        gameOverDisplay.style.display = 'none';
        
        // 隐藏所有地鼠
        const moles = document.querySelectorAll('.mole');
        moles.forEach(mole => mole.classList.remove('up'));
    }
    
    // 事件监听器
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    
    // 初始化游戏
    createGameBoard();
});