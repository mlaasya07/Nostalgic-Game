import React from 'react';
import { useState } from 'react';
import AstroRaids from './components/AstroRaids';

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
  };

  if (!gameStarted) {
    return (
      <div id="startScreen" className="screen">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-pink-500 mb-2 pixel-text retro-glow tracking-wider">
            ASTRORAIDS
          </h1>
          <div className="text-cyan-300 text-sm font-mono tracking-wide mb-1">
            ◄ ═══════════════════════════════════════ ►
          </div>
          <p className="text-pink-300 text-lg font-mono tracking-wide pixel-text">
            NOSTALGIC SPACE ARCADE EXPERIENCE
          </p>
        </div>
        
        <div className="welcome-message">
          <p className="greeting">Welcome Commander, Your mission to defend the galaxy begins.</p>
          <div className="rules-container">
            <h3>MISSION PARAMETERS:</h3>
            <div className="rules-grid">
              <div className="rule-item">
                <span class="pill blue-pill">🛸</span>
                <span class="rule-text">UFO Invader → +15 Points</span>
              </div>
              <div className="rule-item">
                <span class="pill cyan-pill">🚀</span>
                <span class="rule-text">Bonus Spaceship → +100 Points</span>
              </div>
              <div className="rule-item">
                <span class="pill cyan-pill">⚡</span>
                <span class="rule-text">Plasma Bullet → Destroy Enemies</span>
              </div>
              <div className="rule-item">
                <span class="pill blue-pill">💥</span>
                <span class="rule-text">Breach Defense → Life Lost</span>
              </div>
              <div className="rule-item">
                <span class="pill control-pill">[CTL]</span>
                <span class="rule-text">Arrow Keys / Mouse → Paddle Control</span>
              </div>
              <div className="rule-item">
                <span class="pill control-pill">[SPC]</span>
                <span class="rule-text">Spacebar → Fire Weapon</span>
              </div>
              <div className="rule-item">
                <span className="pill cyan-pill">💥</span>
                <span className="rule-text">Explosion → Enemy Destroyed</span>
              </div>
              <div className="rule-item">
                <span className="pill control-pill">[P]</span>
                <span className="rule-text">Pause Game</span>
              </div>
            </div>
          </div>
          <button className="game-button" onClick={startGame}>
            <span className="button-text">Initialize Mission</span>
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <div className="text-pink-400 text-xs font-mono opacity-60 tracking-wider">
            ▲ ▲ ▲ RETRO GAMING DIVISION ▲ ▲ ▲
          </div>
          <div className="text-cyan-300 text-xs font-mono mt-1 opacity-40">
            EST. 2025 • PIXEL PERFECT ARCADE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4" style={{
      background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)'
    }}>
      <div className="text-center mb-6">
        <h1 className="text-6xl font-bold text-pink-500 mb-2 pixel-text retro-glow tracking-wider">
          ASTRORAIDS
        </h1>
        <div className="text-cyan-300 text-sm font-mono tracking-wide mb-1">
          ◄ ═══════════════════════════════════════ ►
        </div>
        <p className="text-pink-300 text-lg font-mono tracking-wide pixel-text">
          NOSTALGIC SPACE ARCADE EXPERIENCE
        </p>
        <p className="text-cyan-400 text-xs font-mono mt-2 opacity-80">
          COMBINING BRICK BREAKER × SPACE INVADERS
        </p>
      </div>
      <AstroRaids />
      
      <div className="mt-4 text-center">
        <div className="text-pink-400 text-xs font-mono opacity-60 tracking-wider">
          ▲ ▲ ▲ RETRO GAMING DIVISION ▲ ▲ ▲
        </div>
        <div className="text-cyan-300 text-xs font-mono mt-1 opacity-40">
          EST. 2025 • PIXEL PERFECT ARCADE
        </div>
      </div>
    </div>
  );
}

export default App;
