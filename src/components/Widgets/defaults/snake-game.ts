import type { WebOSWidgetItem } from '../../../types';

export const widgetSnake: WebOSWidgetItem = {
  id: 'snake-game',
  pageIndex: 0,
  type: 'widget',
  title: 'Retro Snake',
  widgetId: 'snake-game',
  cols: 6,
  rows: 6,
  bgColor: '#0f172a',
  html: `<div class="snake-root outline-none" tabindex="0">
      <div class="snake-header">
          <div class="score">SCORE: <span id="score">0</span></div>
          <div class="hiscore">HI: <span id="hiscore">0</span></div>
      </div>
      <div class="game-area">
          <canvas id="game-canvas" width="300" height="300"></canvas>
          
          <div id="start-screen" class="overlay">
              <div class="msg">PRESS SPACE</div>
          </div>
          <div id="game-over" class="overlay hidden">
              <div class="msg">GAME OVER</div>
              <div class="sub-msg">Space to restart</div>
          </div>
          <div id="paused-screen" class="overlay hidden">
              <div class="msg">PAUSED</div>
              <div class="sub-msg">Click to resume</div>
          </div>

      </div>
  </div>`,
  css: `.snake-root {
      height: 100%; display: flex; flex-direction: column; 
      padding: 8px; color: #22c55e; font-family: 'Courier New', monospace;
      background: #000; overflow: hidden;
  }
  .snake-root:focus { outline: none; }
  .snake-header {
      display: flex; justify-content: space-between; margin-bottom: 5px;
      font-weight: bold; font-size: 14px; text-shadow: 0 0 5px #22c55e;
  }
  .game-area {
      position: relative; flex: 1; border: 2px solid #15803d;
      border-radius: 4px; overflow: hidden; background: #052e16;
  }
  canvas { width: 100%; height: 100%; image-rendering: pixelated; display: block; }
  .overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      backdrop-filter: blur(2px); z-index: 10;
  }
  .hidden { display: none; }
  .msg { font-size: 24px; font-weight: 900; color: #fff; text-shadow: 2px 2px #000; animation: blink 1s infinite; }
  .sub-msg { font-size: 12px; color: #ccc; margin-top: 5px; text-transform: uppercase; }
  @keyframes blink { 50% { opacity: 0; } }`,
  js: `
    const canvas = container.querySelector('#game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = container.querySelector('#score');
    const hiEl = container.querySelector('#hiscore');
    
    const startScreen = container.querySelector('#start-screen');
    const gameOverScreen = container.querySelector('#game-over');
    const pausedScreen = container.querySelector('#paused-screen');
    const root = container.querySelector('.snake-root');

    // Config
    const gridSize = 15; 
    const tileCount = 20; 
    let speed = 10; // FPS cible
    
    let score = 0;
    let hiscore = localStorage.getItem('snake-hiscore') || 0;
    hiEl.innerText = hiscore;

    let velocityX = 0;
    let velocityY = 0;
    let playerX = 10;
    let playerY = 10;
    
    let appleX = 15;
    let appleY = 15;
    
    let trail = [];
    let tail = 5;
    
    let gameInterval = null;
    let isRunning = false;
    let isDead = false;
    let isPaused = false;

    canvas.width = tileCount * gridSize;
    canvas.height = tileCount * gridSize;

    const gameUpdate = () => {
        if(isDead || isPaused) return;

        playerX += velocityX;
        playerY += velocityY;

        if(playerX < 0) playerX = tileCount - 1;
        if(playerX > tileCount - 1) playerX = 0;
        if(playerY < 0) playerY = tileCount - 1;
        if(playerY > tileCount - 1) playerY = 0;

        // Render Fond
        ctx.fillStyle = '#052e16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render Pomme
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ef4444';
        ctx.fillRect(appleX * gridSize + 1, appleY * gridSize + 1, gridSize - 2, gridSize - 2);
        ctx.shadowBlur = 0;

        // Render Snake
        ctx.fillStyle = '#22c55e';
        for(let i = 0; i < trail.length; i++) {
            if(i === trail.length - 1) ctx.fillStyle = '#4ade80';
            else ctx.fillStyle = '#22c55e';
            ctx.fillRect(trail[i].x * gridSize, trail[i].y * gridSize, gridSize - 1, gridSize - 1);

            if(trail[i].x === playerX && trail[i].y === playerY) {
                if(isRunning && (velocityX !==0 || velocityY !== 0)) die();
            }
        }

        trail.push({x: playerX, y: playerY});
        while(trail.length > tail) {
            trail.shift();
        }

        if(appleX === playerX && appleY === playerY) {
            tail++;
            score += 10;
            scoreEl.innerText = score;
            appleX = Math.floor(Math.random() * tileCount);
            appleY = Math.floor(Math.random() * tileCount);
        }
    };

    const die = () => {
        isDead = true;
        isRunning = false;
        clearInterval(gameInterval);
        gameOverScreen.classList.remove('hidden');
        if(score > hiscore) {
            hiscore = score;
            localStorage.setItem('snake-hiscore', hiscore);
            hiEl.innerText = hiscore;
        }
    };

    const reset = () => {
        score = 0;
        scoreEl.innerText = '0';
        tail = 5;
        trail = [];
        playerX = 10;
        playerY = 10;
        velocityX = 1; 
        velocityY = 0;
        appleX = 15;
        appleY = 15;
        
        isDead = false;
        isPaused = false;
        isRunning = true;
        
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        pausedScreen.classList.add('hidden');
        
        if(gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameUpdate, 1000 / speed);
    };

    // --- GESTION PAUSE (FOCUS/BLUR) ---
    
    const onBlur = () => {
        if(isRunning && !isDead && !isPaused) {
            isPaused = true;
            clearInterval(gameInterval); // Arrête le CPU
            pausedScreen.classList.remove('hidden');
        }
    };

    const onFocus = () => {
        if(isRunning && !isDead && isPaused) {
            isPaused = false;
            pausedScreen.classList.add('hidden');
            // Relance la boucle
            if(gameInterval) clearInterval(gameInterval);
            gameInterval = setInterval(gameUpdate, 1000 / speed);
        }
    };

    // --- EVENTS ---

    const handleInput = (key) => {
        if(!isRunning && (isDead || !gameInterval) && key === ' ') {
            reset();
            return;
        }
        
        // Empêche le scroll avec espace
        if(key === ' ') return; 

        // Empêcher retournement direct
        switch(key) {
            case 'ArrowLeft':
                if(velocityX !== 1) { velocityX = -1; velocityY = 0; }
                break;
            case 'ArrowRight':
                if(velocityX !== -1) { velocityX = 1; velocityY = 0; }
                break;
            case 'ArrowUp':
                if(velocityY !== 1) { velocityX = 0; velocityY = -1; }
                break;
            case 'ArrowDown':
                if(velocityY !== -1) { velocityX = 0; velocityY = 1; }
                break;
        }
    };

    root.onkeydown = (e) => {
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
            e.preventDefault();
            handleInput(e.key);
        }
    };

    // Clic pour focus
    root.onclick = () => root.focus();
    
    // Auto Pause/Resume
    root.addEventListener('blur', onBlur);
    root.addEventListener('focus', onFocus);

    // Initial Render
    ctx.fillStyle = '#052e16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  `
};