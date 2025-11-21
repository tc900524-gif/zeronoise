// 游戏配置
const config = {
    rows: 8,
    cols: 8,
    candyTypes: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    initialMoves: 30
};

// 游戏状态
let gameState = {
    board: [],
    score: 0,
    moves: config.initialMoves,
    selectedCandy: null,
    isSwapping: false,
    isProcessing: false
};

// DOM元素
const gameBoard = document.getElementById('gameBoard');
const scoreElement = document.getElementById('score');
const movesElement = document.getElementById('moves');
const restartBtn = document.getElementById('restartBtn');

// 初始化游戏
function initGame() {
    createBoard();
    renderBoard();
    updateUI();
    
    // 添加事件监听器
    restartBtn.addEventListener('click', resetGame);
}

// 创建游戏板
function createBoard() {
    gameState.board = [];
    
    for (let row = 0; row < config.rows; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < config.cols; col++) {
            let candyType;
            // 确保初始状态没有匹配
            do {
                candyType = getRandomCandyType();
            } while (wouldCreateMatch(row, col, candyType));
            
            gameState.board[row][col] = {
                type: candyType,
                element: null,
                row: row,
                col: col
            };
        }
    }
}

// 获取随机糖果类型
function getRandomCandyType() {
    const randomIndex = Math.floor(Math.random() * config.candyTypes.length);
    return config.candyTypes[randomIndex];
}

// 检查是否会创建匹配
function wouldCreateMatch(row, col, type) {
    // 检查水平方向
    let horizontalCount = 1;
    // 检查左边
    for (let c = col - 1; c >= 0 && gameState.board[row][c].type === type; c--) {
        horizontalCount++;
    }
    // 检查右边
    for (let c = col + 1; c < config.cols && gameState.board[row][c].type === type; c++) {
        horizontalCount++;
    }
    
    if (horizontalCount >= 3) return true;
    
    // 检查垂直方向
    let verticalCount = 1;
    // 检查上方
    for (let r = row - 1; r >= 0 && gameState.board[r][col].type === type; r--) {
        verticalCount++;
    }
    // 检查下方
    for (let r = row + 1; r < config.rows && gameState.board[r][col].type === type; r--) {
        verticalCount++;
    }
    
    return verticalCount >= 3;
}

// 渲染游戏板
function renderBoard() {
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
            const candy = gameState.board[row][col];
            const candyElement = document.createElement('div');
            candyElement.className = `candy ${candy.type}`;
            candyElement.dataset.row = row;
            candyElement.dataset.col = col;
            
            // 添加点击事件
            candyElement.addEventListener('click', () => handleCandyClick(candy));
            
            candy.element = candyElement;
            gameBoard.appendChild(candyElement);
        }
    }
}

// 处理糖果点击
function handleCandyClick(candy) {
    if (gameState.isProcessing || gameState.moves <= 0) return;
    
    if (!gameState.selectedCandy) {
        // 选择第一个糖果
        selectCandy(candy);
    } else if (gameState.selectedCandy === candy) {
        // 取消选择
        deselectCandy();
    } else if (isAdjacent(gameState.selectedCandy, candy)) {
        // 尝试交换
        attemptSwap(gameState.selectedCandy, candy);
    } else {
        // 选择新的糖果
        deselectCandy();
        selectCandy(candy);
    }
}

// 选择糖果
function selectCandy(candy) {
    gameState.selectedCandy = candy;
    candy.element.classList.add('selected');
}

// 取消选择糖果
function deselectCandy() {
    if (gameState.selectedCandy) {
        gameState.selectedCandy.element.classList.remove('selected');
        gameState.selectedCandy = null;
    }
}

// 检查两个糖果是否相邻
function isAdjacent(candy1, candy2) {
    const rowDiff = Math.abs(candy1.row - candy2.row);
    const colDiff = Math.abs(candy1.col - candy2.col);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// 尝试交换糖果
function attemptSwap(candy1, candy2) {
    // 交换位置
    const tempType = candy1.type;
    candy1.type = candy2.type;
    candy2.type = tempType;
    
    gameState.isProcessing = true;
    
    // 重新渲染
    updateCandyDisplay(candy1);
    updateCandyDisplay(candy2);
    
    // 检查是否有匹配
    const matches = findMatches();
    
    if (matches.length > 0) {
        // 有效交换，扣减步数
        gameState.moves--;
        processMatches(matches);
    } else {
        // 无效交换，还原
        candy2.type = candy1.type;
        candy1.type = tempType;
        updateCandyDisplay(candy1);
        updateCandyDisplay(candy2);
        
        gameState.isProcessing = false;
    }
    
    deselectCandy();
    updateUI();
}

// 更新糖果显示
function updateCandyDisplay(candy) {
    candy.element.className = `candy ${candy.type}`;
}

// 查找所有匹配的糖果
function findMatches() {
    const matches = [];
    
    // 检查水平匹配
    for (let row = 0; row < config.rows; row++) {
        let count = 1;
        let currentType = gameState.board[row][0].type;
        
        for (let col = 1; col < config.cols; col++) {
            if (gameState.board[row][col].type === currentType) {
                count++;
            } else {
                if (count >= 3) {
                    for (let i = col - count; i < col; i++) {
                        matches.push(gameState.board[row][i]);
                    }
                }
                count = 1;
                currentType = gameState.board[row][col].type;
            }
        }
        
        if (count >= 3) {
            for (let i = config.cols - count; i < config.cols; i++) {
                matches.push(gameState.board[row][i]);
            }
        }
    }
    
    // 检查垂直匹配
    for (let col = 0; col < config.cols; col++) {
        let count = 1;
        let currentType = gameState.board[0][col].type;
        
        for (let row = 1; row < config.rows; row++) {
            if (gameState.board[row][col].type === currentType) {
                count++;
            } else {
                if (count >= 3) {
                    for (let i = row - count; i < row; i++) {
                        matches.push(gameState.board[i][col]);
                    }
                }
                count = 1;
                currentType = gameState.board[row][col].type;
            }
        }
        
        if (count >= 3) {
            for (let i = config.rows - count; i < config.rows; i++) {
                matches.push(gameState.board[i][col]);
            }
        }
    }
    
    // 去重
    return [...new Set(matches)];
}

// 处理匹配的糖果
function processMatches(matches) {
    if (matches.length === 0) {
        gameState.isProcessing = false;
        return;
    }
    
    // 添加匹配动画
    matches.forEach(candy => {
        candy.element.classList.add('matched');
        // 增加分数，匹配越多分数越高
        gameState.score += 10 * matches.length;
    });
    
    updateUI();
    
    // 移除匹配的糖果并下落
    setTimeout(() => {
        removeMatchesAndDrop(matches);
    }, 500);
}

// 移除匹配的糖果并让上方糖果下落
function removeMatchesAndDrop(matches) {
    // 移除匹配的糖果
    matches.forEach(candy => {
        gameState.board[candy.row][candy.col] = null;
    });
    
    // 让上方糖果下落
    for (let col = 0; col < config.cols; col++) {
        let emptySpaces = 0;
        
        // 从底部开始向上处理
        for (let row = config.rows - 1; row >= 0; row--) {
            if (gameState.board[row][col] === null) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                // 将糖果下移
                const newRow = row + emptySpaces;
                gameState.board[newRow][col] = gameState.board[row][col];
                gameState.board[newRow][col].row = newRow;
                
                // 清空原位置
                gameState.board[row][col] = null;
            }
        }
        
        // 在顶部填充新的糖果
        for (let row = 0; row < emptySpaces; row++) {
            const newCandyType = getRandomCandyType();
            gameState.board[row][col] = {
                type: newCandyType,
                element: null,
                row: row,
                col: col
            };
        }
    }
    
    // 重新渲染
    renderBoard();
    
    // 检查新的匹配
    setTimeout(() => {
        const newMatches = findMatches();
        if (newMatches.length > 0) {
            // 连锁反应
            processMatches(newMatches);
        } else {
            gameState.isProcessing = false;
            
            // 检查游戏是否结束
            if (gameState.moves <= 0) {
                setTimeout(endGame, 500);
            } else {
                // 生成新的匹配机会
                setTimeout(() => {
                    if (!hasPossibleMoves()) {
                        resetBoard();
                    }
                }, 300);
            }
        }
    }, 300);
}

// 更新UI
function updateUI() {
    scoreElement.textContent = gameState.score;
    movesElement.textContent = gameState.moves;
}

// 重新开始游戏
function resetGame() {
    gameState = {
        board: [],
        score: 0,
        moves: config.initialMoves,
        selectedCandy: null,
        isSwapping: false,
        isProcessing: false
    };
    
    initGame();
}

// 结束游戏
function endGame() {
    if (gameState.score >= 100) {
        alert(`游戏结束！最终得分: ${gameState.score}。恭喜通关！`);
    } else {
        alert(`游戏结束！最终得分: ${gameState.score}。继续努力哦！`);
    }
}

// 检查是否有可行的移动
function hasPossibleMoves() {
    // 检查水平方向
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols - 1; col++) {
            // 交换相邻糖果
            const temp = gameState.board[row][col].type;
            gameState.board[row][col].type = gameState.board[row][col + 1].type;
            gameState.board[row][col + 1].type = temp;
            
            // 检查是否有匹配
            if (findMatches().length > 0) {
                // 还原交换
                gameState.board[row][col + 1].type = gameState.board[row][col].type;
                gameState.board[row][col].type = temp;
                return true;
            }
            
            // 还原交换
            gameState.board[row][col + 1].type = gameState.board[row][col].type;
            gameState.board[row][col].type = temp;
        }
    }
    
    // 检查垂直方向
    for (let col = 0; col < config.cols; col++) {
        for (let row = 0; row < config.rows - 1; row++) {
            // 交换相邻糖果
            const temp = gameState.board[row][col].type;
            gameState.board[row][col].type = gameState.board[row + 1][col].type;
            gameState.board[row + 1][col].type = temp;
            
            // 检查是否有匹配
            if (findMatches().length > 0) {
                // 还原交换
                gameState.board[row + 1][col].type = gameState.board[row][col].type;
                gameState.board[row][col].type = temp;
                return true;
            }
            
            // 还原交换
            gameState.board[row + 1][col].type = gameState.board[row][col].type;
            gameState.board[row][col].type = temp;
        }
    }
    
    return false;
}

// 重置游戏板
function resetBoard() {
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
            const candy = gameState.board[row][col];
            candy.type = getRandomCandyType();
            updateCandyDisplay(candy);
        }
    }
    
    // 确保没有初始匹配
    let matches;
    do {
        matches = findMatches();
        if (matches.length > 0) {
            matches.forEach(candy => {
                candy.type = getRandomCandyType();
            });
        }
    } while (matches.length > 0);
    
    renderBoard();
    
    // 延迟一小段时间再允许处理
    setTimeout(() => {
        gameState.isProcessing = false;
    }, 500);
}

// 启动游戏
window.onload = initGame;