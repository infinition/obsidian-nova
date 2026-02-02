import type { WebOSWidgetItem } from '../../../types';

export const widgetPomodoro: WebOSWidgetItem = {
  id: 'pomodoro',
  pageIndex: 0,
  type: 'widget',
  title: 'Focus Timer',
  widgetId: 'pomodoro',
  cols: 4,
  rows: 5,
  bgColor: '#1e293b',
  html: `<div class="pomo-root">
    <div class="pomo-modes">
      <button class="mode-btn active" data-time="25" data-mode="focus">Focus</button>
      <button class="mode-btn" data-time="5" data-mode="short">Short</button>
      <button class="mode-btn" data-time="15" data-mode="long">Long</button>
    </div>

    <div class="pomo-timer">
      <svg class="progress-ring" width="120" height="120">
        <circle class="progress-ring__circle bg" stroke="rgba(255,255,255,0.1)" stroke-width="8" fill="transparent" r="52" cx="60" cy="60"/>
        <circle id="progress" class="progress-ring__circle fg" stroke="#f43f5e" stroke-width="8" fill="transparent" r="52" cx="60" cy="60"/>
      </svg>
      <div class="time-display" id="time-display">25:00</div>
    </div>

    <div class="pomo-controls">
      <button id="btn-toggle" class="ctrl-btn start">START</button>
      <button id="btn-reset" class="ctrl-btn reset">↺</button>
    </div>
  </div>`,
  css: `.pomo-root {
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    height: 100%; padding: 12px 8px; box-sizing: border-box; color: white;
    font-family: system-ui, sans-serif;
  }
  
  /* Modes (Tabs) */
  .pomo-modes {
    display: flex; gap: 4px; background: rgba(0,0,0,0.2); padding: 3px; border-radius: 8px;
  }
  .mode-btn {
    background: transparent; border: none; color: #94a3b8; font-size: 10px; font-weight: 600;
    padding: 4px 8px; border-radius: 6px; cursor: pointer; transition: all 0.2s;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .mode-btn:hover { color: #e2e8f0; }
  .mode-btn.active { background: rgba(255,255,255,0.1); color: white; shadow: 0 1px 2px rgba(0,0,0,0.1); }

  /* Timer Circle */
  .pomo-timer { position: relative; display: flex; justify-content: center; align-items: center; margin: 10px 0; }
  .progress-ring__circle { transition: stroke-dashoffset 0.35s; transform: rotate(-90deg); transform-origin: 50% 50%; }
  .time-display {
    position: absolute; font-size: 28px; font-weight: 700; font-variant-numeric: tabular-nums;
    letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); pointer-events: none;
  }

  /* Controls */
  .pomo-controls { display: flex; gap: 10px; width: 100%; justify-content: center; }
  .ctrl-btn {
    border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px;
    padding: 8px 0; transition: transform 0.1s, filter 0.1s; width: 80px;
    display: flex; align-items: center; justify-content: center;
  }
  .ctrl-btn:active { transform: scale(0.96); }
  .ctrl-btn.start { background: #f43f5e; color: white; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4); }
  .ctrl-btn.start.paused { background: #eab308; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.4); }
  .ctrl-btn.reset { background: rgba(255,255,255,0.1); color: #cbd5e1; width: 36px; }
  .ctrl-btn.reset:hover { background: rgba(255,255,255,0.2); }

  /* Theme colors based on mode */
  .theme-focus #progress { stroke: #f43f5e; }
  .theme-focus .ctrl-btn.start { background: #f43f5e; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4); }
  
  .theme-short #progress { stroke: #10b981; }
  .theme-short .ctrl-btn.start { background: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }

  .theme-long #progress { stroke: #3b82f6; }
  .theme-long .ctrl-btn.start { background: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
  `,
  js: `
    const circle = container.querySelector('#progress');
    const display = container.querySelector('#time-display');
    const toggleBtn = container.querySelector('#btn-toggle');
    const resetBtn = container.querySelector('#btn-reset');
    const root = container.querySelector('.pomo-root');
    const modeBtns = container.querySelectorAll('.mode-btn');

    // Config Circle SVG
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = \`\${circumference} \${circumference}\`;
    circle.style.strokeDashoffset = circumference;

    let timer = null;
    let timeLeft = 25 * 60;
    let totalTime = 25 * 60;
    let isRunning = false;
    let currentMode = 'focus'; // focus, short, long

    // Sound Generator (Beep simple)
    const beep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = 880; // A5
            gain.gain.value = 0.1;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
    };

    const updateDisplay = () => {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        display.innerText = \`\${m < 10 ? '0'+m : m}:\${s < 10 ? '0'+s : s}\`;
        
        // Update Circle
        const offset = circumference - (timeLeft / totalTime) * circumference;
        circle.style.strokeDashoffset = offset;
    };

    const switchMode = (mode, minutes) => {
        currentMode = mode;
        totalTime = minutes * 60;
        timeLeft = totalTime;
        isRunning = false;
        if(timer) clearInterval(timer);
        
        // UI Update
        root.className = 'pomo-root theme-' + mode;
        modeBtns.forEach(b => {
            if(b.dataset.mode === mode) b.classList.add('active');
            else b.classList.remove('active');
        });
        toggleBtn.innerText = 'START';
        toggleBtn.classList.remove('paused');
        
        updateDisplay();
    };

    const toggleTimer = () => {
        if(isRunning) {
            // Pause
            clearInterval(timer);
            isRunning = false;
            toggleBtn.innerText = 'RESUME';
            toggleBtn.classList.add('paused');
        } else {
            // Start
            isRunning = true;
            toggleBtn.innerText = 'PAUSE';
            toggleBtn.classList.remove('paused');
            timer = setInterval(() => {
                if(timeLeft > 0) {
                    timeLeft--;
                    updateDisplay();
                } else {
                    clearInterval(timer);
                    isRunning = false;
                    toggleBtn.innerText = 'START';
                    beep();
                    // Petit effet visuel fin
                    root.style.opacity = 0.5;
                    setTimeout(() => root.style.opacity = 1, 300);
                }
            }, 1000);
        }
    };

    modeBtns.forEach(btn => {
        btn.onclick = () => {
            switchMode(btn.dataset.mode, parseInt(btn.dataset.time));
        };
    });

    toggleBtn.onclick = toggleTimer;
    
    resetBtn.onclick = () => {
        const activeBtn = Array.from(modeBtns).find(b => b.classList.contains('active'));
        switchMode(activeBtn.dataset.mode, parseInt(activeBtn.dataset.time));
    };

    // Init
    switchMode('focus', 25);
  `
};