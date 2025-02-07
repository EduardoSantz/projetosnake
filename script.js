(function() {
  // Elementos principais do jogo
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

  // Configurações básicas do jogo
  const gridSize = 10; // Tamanho de cada bloco/segmento da cobra
  const gameSpeed = 100; // Velocidade de atualização do jogo (em milissegundos)
  let gameInterval, snake, computerSnake, direction, compDirection, food;
  let score, compScore, playerName;
  let ranking = JSON.parse(localStorage.getItem('ranking')) || []; // Carrega ranking salvo

  // Controles: Bloqueia a rolagem da página com as setas do teclado
  function handleKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    
    // Atualiza direção da cobra do jogador conforme teclas pressionadas
    if (e.key === 'ArrowUp' && direction.y === 0) direction = { x: 0, y: -gridSize };
    if (e.key === 'ArrowDown' && direction.y === 0) direction = { x: 0, y: gridSize };
    if (e.key === 'ArrowLeft' && direction.x === 0) direction = { x: -gridSize, y: 0 };
    if (e.key === 'ArrowRight' && direction.x === 0) direction = { x: gridSize, y: 0 };
  }

  // Permite usar setas no campo de nome do jogador
  playerNameIn.addEventListener('keydown', function(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.stopPropagation();
    }
  });

  // Funções de desenho básicas
  function drawRect(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridSize, gridSize);
  }

  // Desenha todas as partes de uma cobra
  function drawSnake(arr, color) {
    arr.forEach(p => drawRect(p.x, p.y, color));
  }

  // Desenha a comida na tela
  function drawFood() {
    drawRect(food.x, food.y, 'red');
  }

  // Atualiza a exibição da pontuação
  function updateScore() {
    scoreEl.textContent = `${playerName}: ${score} | Computador: ${compScore}`;
  }

  // Posiciona nova comida em local aleatório que não conflite com as cobras
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

  // Movimenta a cobra e verifica se comeu a comida
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

  // Verifica colisões com bordas e com o próprio corpo
  function checkCollision(arr) {
    const head = arr[0];
    return head.x < 0 || head.y < 0 ||
           head.x >= canvas.width || head.y >= canvas.height ||
           arr.slice(1).some(p => p.x === head.x && p.y === head.y);
  }

  // Verifica colisão entre as duas cobras
  function checkSnakeCollision(snakeA, snakeB) {
    return snakeB.some(p => p.x === snakeA[0].x && p.y === snakeA[0].y);
  }

  // Inteligência artificial da cobra computador (busca a comida)
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

  // Salva pontuação no ranking (armazenamento local do navegador)
  function saveRanking() {
    ranking.push({ name: playerName, score });
    ranking.sort((a, b) => b.score - a.score);
    ranking = ranking.slice(0, 5);
    localStorage.setItem('ranking', JSON.stringify(ranking));
  }

  // Exibe os 5 melhores scores
  function showRanking() {
    rankingList.innerHTML = '';
    ranking.forEach((item, i) => {
      const li = document.createElement('li');
      li.textContent = `${i + 1}. ${item.name} - ${item.score} pontos`;
      rankingList.appendChild(li);
    });
  }

  // Finaliza o jogo e mostra resultado
  function endGame(msg) {
    clearInterval(gameInterval);
    document.removeEventListener('keydown', handleKeyDown);
    alert(`${msg}\nRanking atualizado!`);
    saveRanking();
    showRanking();
    restartBtn.style.display = 'block';
  }

  // Inicializa novo jogo
  function initGame() {
    document.addEventListener('keydown', handleKeyDown);
    playerName = playerNameIn.value.trim() || "Jogador";
    snake = [{ x: 200, y: 200 }]; // Posição inicial da cobra jogador
    computerSnake = [{ x: 100, y: 100 }]; // Posição inicial da cobra computador
    direction = { x: 0, y: -gridSize }; // Direção inicial
    compDirection = { x: 0, y: gridSize };
    score = compScore = 0;
    placeFood();
    updateScore();
    gameInterval = setInterval(loop, gameSpeed);
  }

  // Loop principal do jogo (atualização contínua)
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFood();
    drawSnake(snake, 'lime'); // Cobra jogador em verde
    drawSnake(computerSnake, 'blue'); // Cobra computador em azul

    if (move(snake, direction)) score++; // Movimenta jogador
    computerAI(); // Calcula movimento do computador
    if (move(computerSnake, compDirection)) compScore++; // Movimenta computador

    // Verifica todas condições de fim de jogo
    if (checkCollision(snake)) return endGame(`${playerName} perdeu!`);
    if (checkCollision(computerSnake)) return endGame(`Computador perdeu!`);
    if (checkSnakeCollision(snake, computerSnake)) return endGame(`${playerName} colidiu com o Computador!`);
    if (checkSnakeCollision(computerSnake, snake)) return endGame(`Computador colidiu com ${playerName}!`);

    updateScore();
  }

  // Controles de interface (iniciar/reiniciar)
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

  // Exibe ranking ao carregar
  showRanking();
})();
