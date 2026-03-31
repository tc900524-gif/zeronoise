document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('gameBoard');
    const scoreDisplay = document.getElementById('score');
    const movesDisplay = document.getElementById('moves');
    const restartBtn = document.getElementById('restartBtn');
    
    const BOARD_SIZE = 8;
    const TILE_TYPES = 6;
    let board = [];
    let score = 0;
    let moves = 30;
    let selectedTile = null;
    
    // 初始化游戏
    function initGame() {
        board = [];
        score = 0;
        moves = 30;
        selectedTile = null;
        scoreDisplay.textContent = score;
        movesDisplay.textContent = moves;
        gameBoard.innerHTML = '';
        createBoard();
        renderBoard();
    }
    
    // 创建游戏板
    function createBoard() {
        for (let i = 0; i < BOARD_SIZE; i++) {
            board[i] = [];
            for (let j = 0; j < BOARD_SIZE; j++) {
                board[i][j] = Math.floor(Math.random() * TILE_TYPES);
            }
        }
        
        // 确保开始时没有匹配项
        while (findMatches().length > 0) {
            removeMatches(findMatches());
            fillBoard();
        }
    }
    
    // 渲染游戏板
    function renderBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const tile = document.createElement('div');
                tile.className = `tile tile-${board[i][j]}`;
                tile.dataset.row = i;
                tile.dataset.col = j;
                tile.textContent = ''; // 不显示数字，只用颜色区分
                tile.addEventListener('click', () => handleTileClick(i, j));
                gameBoard.appendChild(tile);
            }
        }
    }
    
    // 处理方块点击
    function handleTileClick(row, col) {
        if (moves <= 0) return;
        
        const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
        
        if (!selectedTile) {
            // 第一次点击
            selectedTile = { row, col };
            tile.classList.add('selected');
        } else if (selectedTile.row === row && selectedTile.col === col) {
            // 点击同一个方块，取消选择
            tile.classList.remove('selected');
            selectedTile = null;
        } else if (isAdjacent(selectedTile.row, selectedTile.col, row, col)) {
            // 点击相邻方块，尝试交换
            tile.classList.remove('selected');
            swapTiles(selectedTile.row, selectedTile.col, row, col);
            selectedTile = null;
        } else {
            // 点击非相邻方块，重新选择
            document.querySelector('.tile.selected')?.classList.remove('selected');
            selectedTile = { row, col };
            tile.classList.add('selected');
        }
    }
    
    // 检查两个方块是否相邻
    function isAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    // 交换两个方块
    function swapTiles(row1, col1, row2, col2) {
        // 交换数据
        const temp = board[row1][col1];
        board[row1][col1] = board[row2][col2];
        board[row2][col2] = temp;
        
        // 重新渲染
        renderBoard();
        
        // 检查是否有匹配
        const matches = findMatches();
        if (matches.length > 0) {
            // 有匹配，移除并更新分数
            moves--;
            movesDisplay.textContent = moves;
            removeMatches(matches);
            updateScore(matches.length);
            // 填充新方块
            setTimeout(() => {
                fillBoard();
                // 继续检查是否有新的匹配
                setTimeout(() => {
                    const newMatches = findMatches();
                    if (newMatches.length > 0) {
                        processMatches();
                    }
                }, 300);
            }, 300);
        } else {
            // 没有匹配，换回来
            const temp = board[row1][col1];
            board[row1][col1] = board[row2][col2];
            board[row2][col2] = temp;
            renderBoard();
            moves--;
            movesDisplay.textContent = moves;
        }
    }
    
    // 查找匹配项
    function findMatches() {
        const matches = [];
        
        // 检查水平匹配
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE - 2; j++) {
                const type = board[i][j];
                if (type !== -1 && 
                    type === board[i][j + 1] && 
                    type === board[i][j + 2]) {
                    
                    // 查找连续相同类型的方块
                    let count = 3;
                    while (j + count < BOARD_SIZE && board[i][j + count] === type) {
                        count++;
                    }
                    
                    // 添加匹配项
                    for (let k = 0; k < count; k++) {
                        matches.push({ row: i, col: j + k });
                    }
                    
                    j += count - 1;
                }
            }
        }
        
        // 检查垂直匹配
        for (let j = 0; j < BOARD_SIZE; j++) {
            for (let i = 0; i < BOARD_SIZE - 2; i++) {
                const type = board[i][j];
                if (type !== -1 && 
                    type === board[i + 1][j] && 
                    type === board[i + 2][j]) {
                    
                    // 查找连续相同类型的方块
                    let count = 3;
                    while (i + count < BOARD_SIZE && board[i + count][j] === type) {
                        count++;
                    }
                    
                    // 添加匹配项
                    for (let k = 0; k < count; k++) {
                        matches.push({ row: i + k, col: j });
                    }
                    
                    i += count - 1;
                }
            }
        }
        
        // 去除重复项
        return matches.filter((match, index, self) => 
            index === self.findIndex(m => m.row === match.row && m.col === match.col)
        );
    }
    
    // 移除匹配项
    function removeMatches(matches) {
        matches.forEach(match => {
            board[match.row][match.col] = -1;
        });
    }
    
    // 填充新方块
    function fillBoard() {
        // 从下往上填充
        for (let j = 0; j < BOARD_SIZE; j++) {
            let emptySpaces = 0;
            for (let i = BOARD_SIZE - 1; i >= 0; i--) {
                if (board[i][j] === -1) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    board[i + emptySpaces][j] = board[i][j];
                    board[i][j] = -1;
                }
            }
            
            // 填充顶部的空位
            for (let i = 0; i < emptySpaces; i++) {
                board[i][j] = Math.floor(Math.random() * TILE_TYPES);
            }
        }
        
        renderBoard();
    }
    
    // 处理匹配（级联消除）
    function processMatches() {
        const matches = findMatches();
        if (matches.length > 0) {
            removeMatches(matches);
            updateScore(matches.length);
            renderBoard();
            
            setTimeout(() => {
                fillBoard();
                setTimeout(() => {
                    processMatches();
                }, 300);
            }, 300);
        }
    }
    
    // 更新分数
    function updateScore(matchCount) {
        score += matchCount * 10;
        scoreDisplay.textContent = score;
        
        // 检查游戏是否结束
        if (moves <= 0) {
            setTimeout(() => {
                alert(`游戏结束！你的得分是：${score}`);
            }, 500);
        }
    }
    
    // 重新开始游戏
    restartBtn.addEventListener('click', initGame);
    
    // 初始化游戏
    initGame();
});