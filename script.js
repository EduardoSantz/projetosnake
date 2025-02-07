(function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const startScreen = document.getElementById('startScreen');
  const gameArea = document.getElementById('gameArea');
  const rankingBoard = document.getElementById('rankingBoard');
  const rankingList = document.getElementById('rankingList');
  const scoreEl = document.getElementById('score');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const playerNameIn = document.getElementById('playerName');

  const gridSize = 10;
  const gameSpeed = 100;
  let gameInterval, snake, computerSnake, direction, compDirection, food;
  let score, compScore, playerName;
  let ranking = JSON.parse(localStorage.getItem('ranking')) || [];

  // Bloqueia a rolagem com as setas
  function handleKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    
    // Controles da cobra
    if (e.key === 'ArrowUp' && direction.y === 0) direction = { x: 0, y: -gridSize };
    if (e.key === 'ArrowDown' && direction.y === 0) direction = { x: 0, y: gridSize };
    if (e.key === 'ArrowLeft' && direction.x === 0) direction = { x: -gridSize, y: 0 };
    if (e.key === 'ArrowRight' && direction.x === 0) direction = { x: gridSize, y: 0 };
  }

  // Permite usar setas no input
  playerNameIn.addEventListener('keydown', function(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.stopPropagation();
    }
  });

  // Restante do código mantido igual
  function drawRect(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridSize, gridSize);
  }

  function drawSnake(arr, color) {
    arr.forEach(p => drawRect(p.x, p.y, color));
  }

  function drawFood() {
    drawRect(food.x, food.y, 'red');
  }

  function updateScore() {
    scoreEl.textContent = `${playerName}: ${score} | Computador: ${compScore}`;
  }

  function placeFood() {
    do {
      food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
        y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
      };
    } while (
      snake.some(p => p.x === food.x && p.y === food.y) ||
      computerSnake.some(p => p.x === food.x && p.y === food.y)
    );
  }

  function move(arr, dir) {
    const newHead = { x: arr[0].x + dir.x, y: arr[0].y + dir.y };
    arr.unshift(newHead);
    if (newHead.x === food.x && newHead.y === food.y) {
      placeFood();
      return true;
    }
    arr.pop();
    return false;
  }

  function checkCollision(arr) {
    const head = arr[0];
    return head.x < 0 || head.y < 0 ||
           head.x >= canvas.width || head.y >= canvas.height ||
           arr.slice(1).some(p => p.x === head.x && p.y === head.y);
  }

  function checkSnakeCollision(snakeA, snakeB) {
    return snakeB.some(p => p.x === snakeA[0].x && p.y === snakeA[0].y);
  }

  function computerAI() {
    const head = computerSnake[0];
    const dirs = [
      { x: gridSize, y: 0 },
      { x: -gridSize, y: 0 },
      { x: 0, y: gridSize },
      { x: 0, y: -gridSize }
    ].sort((a, b) => {
      const da = Math.abs(head.x + a.x - food.x) + Math.abs(head.y + a.y - food.y);
      const db = Math.abs(head.x + b.x - food.x) + Math.abs(head.y + b.y - food.y);
      return da - db;
    });
    for (let d of dirs) {
      const nx = head.x + d.x, ny = head.y + d.y;
      if (nx >= 0 && ny >= 0 && nx < canvas.width && ny < canvas.height &&
          !computerSnake.some(p => p.x === nx && p.y === ny) &&
          !snake.some(p => p.x === nx && p.y === ny)) {
        compDirection = d;
        return;
      }
    }
  }

  function saveRanking() {
    ranking.push({ name: playerName, score });
    ranking.sort((a, b) => b.score - a.score);
    ranking = ranking.slice(0, 5);
    localStorage.setItem('ranking', JSON.stringify(ranking));
  }

  function showRanking() {
    rankingList.innerHTML = '';
    ranking.forEach((item, i) => {
      const li = document.createElement('li');
      li.textContent = `${i + 1}. ${item.name} - ${item.score} pontos`;
      rankingList.appendChild(li);
    });
  }

  function endGame(msg) {
    clearInterval(gameInterval);
    document.removeEventListener('keydown', handleKeyDown);
    alert(`${msg}\nRanking atualizado!`);
    saveRanking();
    showRanking();
    restartBtn.style.display = 'block';
  }

  function initGame() {
    document.addEventListener('keydown', handleKeyDown);
    playerName = playerNameIn.value.trim() || "Jogador";
    snake = [{ x: 200, y: 200 }];
    computerSnake = [{ x: 100, y: 100 }];
    direction = { x: 0, y: -gridSize };
    compDirection = { x: 0, y: gridSize };
    score = compScore = 0;
    placeFood();
    updateScore();
    gameInterval = setInterval(loop, gameSpeed);
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();
    drawSnake(snake, 'lime');
    drawSnake(computerSnake, 'blue');

    if (move(snake, direction)) score++;
    computerAI();
    if (move(computerSnake, compDirection)) compScore++;

    if (checkCollision(snake)) return endGame(`${playerName} perdeu!`);
    if (checkCollision(computerSnake)) return endGame(`Computador perdeu!`);
    if (checkSnakeCollision(snake, computerSnake)) return endGame(`${playerName} colidiu com o Computador!`);
    if (checkSnakeCollision(computerSnake, snake)) return endGame(`Computador colidiu com ${playerName}!`);

    updateScore();
  }

  startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameArea.style.display = 'block';
    restartBtn.style.display = 'none';
    initGame();
  });

  restartBtn.addEventListener('click', () => {
    startScreen.style.display = 'block';
    gameArea.style.display = 'none';
    restartBtn.style.display = 'none';
    document.removeEventListener('keydown', handleKeyDown);
  });

  showRanking();
})();