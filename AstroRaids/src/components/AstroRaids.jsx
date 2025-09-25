import React, { useRef, useEffect, useState } from "react";

// AstroRaids - Nostalgic Space Arcade Game
// A retro-styled hybrid combining Brick Breaker and Space Invaders
// Controls: ArrowLeft/ArrowRight or A/D to move paddle, Mouse to move, SPACE to shoot, P to pause

export default function AstroRaids() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const pressedRef = useRef({});
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState("PRESS SPACE TO BEGIN MISSION");
  const [tabPaused, setTabPaused] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({ spaceship: false, ufo: false });
  
  // Preload images
  const spaceshipImg = useRef(null);
  const ufoImg = useRef(null);
  
  useEffect(() => {
    spaceshipImg.current = new Image();
    ufoImg.current = new Image();
    
    spaceshipImg.current.onload = () => {
      setImagesLoaded(prev => ({ ...prev, spaceship: true }));
    };
    spaceshipImg.current.onerror = () => {
      setImagesLoaded(prev => ({ ...prev, spaceship: false }));
    };
    
    ufoImg.current.onload = () => {
      setImagesLoaded(prev => ({ ...prev, ufo: true }));
    };
    ufoImg.current.onerror = () => {
      setImagesLoaded(prev => ({ ...prev, ufo: false }));
    };
    
    spaceshipImg.current.src = '/spaceship.png';
    ufoImg.current.src = '/ufo.png';
  }, []);

  // Nostalgic retro color palette
  const COLORS = {
    bg: "#0f0f23",
    text: "#00ffff",
    paddle: "#ff6b35",
    alien: "#ffa500",
    bullet: "#00ffff",
    levelText: "#ffff00",
    border: "#ff1493",
    ui: "#ff1493",
    spaceship: "#ff69b4",
    confetti: ["#ff1493", "#00ffff", "#ffff00", "#ff6b35", "#ffa500"]
  };

  // Game configuration
  const GAME = useRef({
    width: 800,
    height: 560,
    paddleWidth: 120,
    paddleHeight: 16,
    paddleSpeed: 10,
    bulletSpeed: 9,
    alienRows: 4,
    alienCols: 9,
    alienPadding: 12,
    alienOffsetTop: 70,
    alienOffsetLeft: 45,
    alienHGap: 12,
    alienVGap: 16,
    alienSpeedX: 0.7,
    alienDropY: 20,
  });

  const stateRef = useRef({
    paddle: { x: 0, y: 0, w: GAME.current.paddleWidth, h: GAME.current.paddleHeight },
    bullets: [],
    aliens: [],
    spaceships: [],
    confetti: [],
    alienDir: 1, // 1 => right, -1 => left
    lastShot: 0,
    shotCooldown: 200, // ms
    lives: 3,
    levelUpFlash: 0,
    lastSpaceshipSpawn: 0,
    spaceshipCooldown: 15000, // 15 seconds
  });

  // Initialize canvas size and game objects
  useEffect(() => {
    const c = canvasRef.current;
    const ratio = Math.min(1, window.devicePixelRatio || 1);
    GAME.current.width = Math.min(920, Math.max(640, window.innerWidth - 80));
    GAME.current.height = Math.floor((GAME.current.width * 0.7));
    c.width = GAME.current.width * ratio;
    c.height = GAME.current.height * ratio;
    c.style.width = GAME.current.width + "px";
    c.style.height = GAME.current.height + "px";
    const ctx = c.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    
    // Disable anti-aliasing for pixelated look
    ctx.imageSmoothingEnabled = false;

    resetLevel(level);

    function onKey(e) {
      pressedRef.current[e.code] = e.type === "keydown";
      // start on space
      if (e.type === "keydown") {
        if (!running && e.code === "Space") {
          setRunning(true);
          setMessage("");
        }
        if (e.code === "KeyP") {
          setPaused((p) => !p);
          setTabPaused(false);
        }
        // Resume from tab pause with ESC or SPACE
        if (tabPaused && (e.code === "Escape" || e.code === "Space")) {
          setTabPaused(false);
          setPaused(false);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    // Tab visibility change detection
    function onVisibilityChange() {
      if (document.hidden && running && !paused) {
        setTabPaused(true);
        setPaused(true);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    function onMouseMove(e) {
      const rect = c.getBoundingClientRect();
      const x = e.clientX - rect.left;
      stateRef.current.paddle.x = clamp(x - stateRef.current.paddle.w / 2, 0, GAME.current.width - stateRef.current.paddle.w);
    }

    c.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      c.removeEventListener("mousemove", onMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Game loop
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    let last = performance.now();

    function loop(now) {
      const dt = now - last;
      last = now;
      if (!paused && !tabPaused && running) {
        update(dt);
      }
      render(ctx);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, paused, tabPaused, level, score]);

  // Level reset / create aliens
  function resetLevel(levelNum) {
    const G = GAME.current;
    const S = stateRef.current;
    S.paddle.w = G.paddleWidth - Math.min(50, (levelNum - 1) * 5);
    S.paddle.h = G.paddleHeight;
    S.paddle.x = (G.width - S.paddle.w) / 2;
    S.paddle.y = G.height - 45;
    S.bullets = [];
    S.spaceships = [];
    S.confetti = [];
    S.alienDir = 1;
    S.lastShot = 0;
    S.lastSpaceshipSpawn = 0;
    S.lives = Math.max(1, 3 - Math.floor((levelNum - 1) / 3));
    S.levelUpFlash = 80;

    // build aliens
    const rows = G.alienRows + Math.floor((levelNum - 1) / 2);
    const cols = G.alienCols;
    const aliens = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = G.alienOffsetLeft + c * (G.alienPadding + G.alienHGap);
        const y = G.alienOffsetTop + r * (G.alienPadding + G.alienVGap);
        aliens.push({ x, y, w: 38, h: 22, row: r, col: c, hp: 1 });
      }
    }
    S.aliens = aliens;
    setScore(0);
  }

  function update(dt) {
    const S = stateRef.current;
    const G = GAME.current;
    const now = performance.now();

    // Paddle control
    if (pressedRef.current.ArrowLeft || pressedRef.current.KeyA) {
      S.paddle.x -= G.paddleSpeed;
    }
    if (pressedRef.current.ArrowRight || pressedRef.current.KeyD) {
      S.paddle.x += G.paddleSpeed;
    }
    S.paddle.x = clamp(S.paddle.x, 0, G.width - S.paddle.w);

    // Shooting
    if (pressedRef.current.Space) {
      if (now - S.lastShot > S.shotCooldown) {
        S.lastShot = now;
        S.bullets.push({ x: S.paddle.x + S.paddle.w / 2 - 3, y: S.paddle.y - 12, w: 6, h: 14, dy: -G.bulletSpeed });
      }
    }

    // Spawn bonus spaceship occasionally
    if (now - S.lastSpaceshipSpawn > S.spaceshipCooldown && Math.random() < 0.3) {
      S.lastSpaceshipSpawn = now;
      const side = Math.random() < 0.5 ? 'left' : 'right';
      const x = side === 'left' ? -80 : G.width + 20;
      const direction = side === 'left' ? 1 : -1;
      S.spaceships.push({
        x: x,
        y: 80 + Math.random() * 100,
        w: 60,
        h: 30,
        dx: direction * 2,
        points: 100
      });
    }

    // Move bullets
    for (let i = S.bullets.length - 1; i >= 0; i--) {
      const b = S.bullets[i];
      b.y += b.dy;
      if (b.y + b.h < 0) S.bullets.splice(i, 1);
    }

    // Move spaceships
    for (let i = S.spaceships.length - 1; i >= 0; i--) {
      const ship = S.spaceships[i];
      ship.x += ship.dx;
      if (ship.x < -100 || ship.x > G.width + 100) {
        S.spaceships.splice(i, 1);
      }
    }

    // Update confetti
    for (let i = S.confetti.length - 1; i >= 0; i--) {
      const c = S.confetti[i];
      c.x += c.dx;
      c.y += c.dy;
      c.dy += 0.2; // gravity
      c.life -= dt;
      if (c.life <= 0 || c.y > G.height) {
        S.confetti.splice(i, 1);
      }
    }

    // Move aliens horizontally; if edge hit, drop them and reverse
    let hitEdge = false;
    const speed = G.alienSpeedX + (level - 1) * 0.06;
    for (let a of S.aliens) {
      a.x += speed * S.alienDir * (dt / 16);
      if (a.x + a.w > G.width - 20 || a.x < 15) hitEdge = true;
    }
    if (hitEdge) {
      S.alienDir *= -1;
      for (let a of S.aliens) {
        a.y += G.alienDropY;
      }
    }

    // Check collisions bullet <-> alien and spaceship
    for (let i = S.bullets.length - 1; i >= 0; i--) {
      const b = S.bullets[i];
      
      // Check alien collisions
      for (let j = S.aliens.length - 1; j >= 0; j--) {
        const a = S.aliens[j];
        if (rectsOverlap(b, a)) {
          S.aliens.splice(j, 1);
          S.bullets.splice(i, 1);
          setScore((s) => s + 15 + (level - 1) * 3);
          break;
        }
      }
      
      // Check spaceship collisions
      if (S.bullets[i]) { // bullet might have been removed
        for (let j = S.spaceships.length - 1; j >= 0; j--) {
          const ship = S.spaceships[j];
          if (rectsOverlap(b, ship)) {
            S.spaceships.splice(j, 1);
            S.bullets.splice(i, 1);
            setScore(prevScore => prevScore + ship.points);
            
            // Create confetti explosion
            for (let k = 0; k < 20; k++) {
              S.confetti.push({
                x: ship.x + ship.w / 2,
                y: ship.y + ship.h / 2,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8 - 2,
                color: COLORS.confetti[Math.floor(Math.random() * COLORS.confetti.length)],
                size: 3 + Math.random() * 4,
                life: 2000 + Math.random() * 1000
              });
            }
            const points = 15 + (level - 1) * 3;
            setScore(prevScore => prevScore + points);
            break;
          }
        }
      }
    }

    // Aliens reach paddle area -> lose life or end
    for (let a of S.aliens) {
      if (a.y + a.h >= S.paddle.y - 8) {
        // penalty
        S.lives -= 1;
        // remove the alien(s) that reached
        S.aliens = S.aliens.filter((x) => x.y + x.h < S.paddle.y - 8);
        if (S.lives <= 0) {
          // game over
          setMessage("MISSION FAILED — PRESS SPACE TO RETRY");
          setRunning(false);
        }
        break;
      }
    }

    // Victory check
    if (S.aliens.length === 0) {
      // Create level-up confetti
      for (let i = 0; i < 50; i++) {
        S.confetti.push({
          x: G.width / 2 + (Math.random() - 0.5) * 200,
          y: G.height / 2 + (Math.random() - 0.5) * 100,
          dx: (Math.random() - 0.5) * 12,
          dy: (Math.random() - 0.5) * 12 - 4,
          color: COLORS.confetti[Math.floor(Math.random() * COLORS.confetti.length)],
          size: 4 + Math.random() * 6,
          life: 3000 + Math.random() * 2000
        });
      }
      
      setLevel((L) => L + 1);
      // create a small flash timer for "NEXT WAVE"
      S.levelUpFlash = 100;
      // small delay then reset
      setTimeout(() => {
        resetLevel(level + 1);
      }, 500);
    }

    if (S.levelUpFlash > 0) S.levelUpFlash -= 1;
  }

  function render(ctx) {
    const S = stateRef.current;
    const G = GAME.current;

    // Clear background with starfield effect
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, G.width, G.height);
    
    // Add subtle starfield
    ctx.fillStyle = COLORS.border;
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % G.width;
      const y = (i * 73 + performance.now() * 0.01) % G.height;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw pixelated header with retro styling
    ctx.fillStyle = COLORS.border;
    ctx.font = "bold 16px 'Roboto Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE: ${score.toString().padStart(6, '0')}`, 16, 32);
    ctx.textAlign = "center";
    ctx.fillText(`◄ SECTOR ${level.toString().padStart(2, '0')} ►`, G.width / 2, 32);
    ctx.textAlign = "right";
    ctx.fillText(`LIVES: ${stateRef.current.lives}`, G.width - 16, 32);

    // Draw retro grid lines
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < G.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 50);
      ctx.lineTo(i, G.height - 20);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw paddle with pixelated style
    pixelRect(ctx, S.paddle.x, S.paddle.y, S.paddle.w, S.paddle.h, COLORS.paddle);

    // Draw bullets with glow effect
    for (let b of S.bullets) {
      ctx.shadowColor = COLORS.bullet;
      ctx.shadowBlur = 8;
      pixelRect(ctx, b.x, b.y, b.w, b.h, COLORS.bullet);
      ctx.shadowBlur = 0;
    }

    // Draw aliens as emoji-style invaders
    for (let a of S.aliens) {
      if (imagesLoaded.ufo && ufoImg.current && ufoImg.current.complete) {
        ctx.drawImage(ufoImg.current, a.x, a.y, a.w, a.h);
      } else {
        // Fallback to emoji if image not loaded
        ctx.font = "32px monospace";
        ctx.textAlign = "center";
        ctx.fillText("🛸", a.x + a.w / 2, a.y + a.h - 2);
      }
    }

    // Draw bonus spaceships
    for (let ship of S.spaceships) {
      if (imagesLoaded.spaceship && spaceshipImg.current && spaceshipImg.current.complete) {
        ctx.shadowColor = COLORS.spaceship;
        ctx.shadowBlur = 10;
        ctx.drawImage(spaceshipImg.current, ship.x, ship.y, ship.w, ship.h);
        ctx.shadowBlur = 0;
      } else {
        // Fallback design if image not loaded
        ctx.fillStyle = COLORS.spaceship;
        ctx.shadowColor = COLORS.spaceship;
        ctx.shadowBlur = 10;
        pixelRect(ctx, ship.x, ship.y, ship.w, ship.h, COLORS.spaceship);
        ctx.shadowBlur = 0;
        
        // Spaceship details
        ctx.fillStyle = COLORS.text;
        ctx.fillRect(ship.x + 10, ship.y + 8, 8, 4);
        ctx.fillRect(ship.x + ship.w - 18, ship.y + 8, 8, 4);
        ctx.fillRect(ship.x + ship.w / 2 - 4, ship.y + 4, 8, 8);
      }
      
      // Points indicator
      ctx.fillStyle = COLORS.levelText;
      ctx.font = "bold 12px 'Roboto Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("100", ship.x + ship.w / 2, ship.y - 8);
    }

    // Draw confetti
    for (let c of S.confetti) {
      ctx.fillStyle = c.color;
      ctx.globalAlpha = Math.max(0, c.life / 2000);
      ctx.fillRect(c.x, c.y, c.size, c.size);
    }
    ctx.globalAlpha = 1;

    // Draw level-up flash with enhanced pixelated text
    if (S.levelUpFlash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = COLORS.levelText;
      const alpha = Math.min(1, S.levelUpFlash / 80);
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${45 + (S.levelUpFlash / 3)}px 'Roboto Mono', monospace`;
      ctx.textAlign = "center";
      ctx.shadowColor = COLORS.levelText;
      ctx.shadowBlur = 15;
      ctx.fillText("◄ NEXT SECTOR ►", G.width / 2, G.height / 2);
      ctx.restore();
    }

    // Draw central message with retro styling
    if (!running) {
      ctx.fillStyle = COLORS.border;
      ctx.font = "bold 22px 'Roboto Mono', monospace";
      ctx.textAlign = "center";
      ctx.shadowColor = COLORS.border;
      ctx.shadowBlur = 10;
      ctx.fillText(message, G.width / 2, G.height / 2 - 25);
      ctx.shadowBlur = 0;
      
      ctx.font = "14px 'Roboto Mono', monospace";
      ctx.fillStyle = COLORS.text;
      ctx.fillText("MOVE: ◄ ► or A/D   FIRE: SPACE   PAUSE: P", G.width / 2, G.height / 2 + 8);
    }

    // Paused overlay with retro effect
    if (paused || tabPaused) {
      ctx.fillStyle = "rgba(15,15,35,0.8)";
      ctx.fillRect(0, 0, G.width, G.height);
      ctx.fillStyle = COLORS.ui;
      ctx.font = "bold 36px 'Roboto Mono', monospace";
      ctx.textAlign = "center";
      ctx.shadowColor = COLORS.ui;
      ctx.shadowBlur = 15;
      if (tabPaused) {
        ctx.fillText("◄ GAME PAUSED ►", G.width / 2, G.height / 2 - 20);
        ctx.font = "16px 'Roboto Mono', monospace";
        ctx.fillText("PRESS ESC OR SPACEBAR TO CONTINUE", G.width / 2, G.height / 2 + 20);
      } else {
        ctx.fillText("◄ PAUSED ►", G.width / 2, G.height / 2);
      }
      ctx.shadowBlur = 0;
    }

    // Retro border with enhanced styling
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 50, G.width - 16, G.height - 60);
    
    // Corner decorations
    ctx.fillStyle = COLORS.border;
    const corners = [[8,50], [G.width-8,50], [8,G.height-10], [G.width-8,G.height-10]];
    corners.forEach(([x,y]) => {
      ctx.fillRect(x-2, y-2, 4, 4);
    });
  }

  // Utility: clamp
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // Utility: rect collision
  function rectsOverlap(a, b) {
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  }

  // Utility: pixelated rectangle
  function pixelRect(ctx, x, y, w, h, fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    
    // Add subtle highlight for 3D effect
    ctx.fillStyle = fillColor + '40';
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), 2);
    ctx.fillRect(Math.floor(x), Math.floor(y), 2, Math.floor(h));
  }

  // Input handlers for UI buttons
  function handleStartRestart() {
    if (!running) {
      setRunning(true);
      setMessage("");
      resetLevel(1);
      setLevel(1);
    }
  }

  function togglePause() {
    if (tabPaused) {
      setTabPaused(false);
      setPaused(false);
    } else {
      setPaused((p) => !p);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center font-mono">
      <div className="flex items-center gap-4 mb-4 p-4 bg-black bg-opacity-50 rounded-lg border border-pink-500 border-opacity-30">
        <button 
          onClick={handleStartRestart} 
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded font-mono tracking-wide transition-all duration-200 border-2 border-orange-400 shadow-lg hover:shadow-orange-400/50"
        >
          ◄ START MISSION ►
        </button>
        <button 
          onClick={togglePause} 
          className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-2 px-4 rounded font-mono tracking-wide transition-all duration-200 border-2 border-cyan-400 shadow-lg hover:shadow-cyan-400/50"
        >
          {paused ? '► RESUME' : '⏸ PAUSE'}
        </button>
      </div>

      <canvas 
        ref={canvasRef} 
        className="rounded-lg shadow-2xl border-2 border-pink-500 border-opacity-50" 
        style={{ 
          boxShadow: '0 0 30px rgba(255,20,147,0.3), inset 0 0 20px rgba(0,0,0,0.5)',
          imageRendering: 'pixelated'
        }} 
      />

    </div>
  );
}