/**
 * MenuStyles.ts
 * Styles for the game menu component
 */
export const menuStyles = `
  @font-face {
    font-family: 'PressStart2P';
    src: url('https://fonts.gstatic.com/s/pressstart2p/v14/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
  }

  .terminal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    font-family: 'PressStart2P', monospace;
    overflow: hidden;
    z-index: 1000;
    color: #fff;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* CRT Screen Effect with Viewport */
  .terminal-viewport {
    position: relative;
    width: calc(100% - 56px);
    height: calc(100% - 56px);
    overflow: hidden;
    background: transparent;
    z-index: 1002;
    border: none;
  }

  .content-container {
    position: relative;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    border: none;
  }

  /* Remove any potential dividing lines */
  .title-section, .menu-section, .development-placeholder {
    border: none;
    border-bottom: none;
    border-top: none;
    outline: none;
    box-shadow: none;
  }

  .title-section {
    text-align: center;
    margin-bottom: 2rem;
  }

  .game-title {
    font-size: 3.5rem;
    color: #ff0;
    text-shadow: 3px 3px 0 #f00;
    margin: 0;
    animation: pulse 1.5s infinite alternate;
    letter-spacing: -2px;
  }

  .title-invaders {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }

  .invader {
    width: 30px;
    height: 30px;
    margin: 0 10px;
    background-color: #0f0;
    clip-path: polygon(
      0% 25%, 35% 25%, 35% 0%, 65% 0%, 65% 25%, 100% 25%, 
      100% 60%, 85% 60%, 85% 75%, 70% 75%, 70% 60%, 30% 60%, 
      30% 75%, 15% 75%, 15% 60%, 0% 60%
    );
  }

  /* We'll control the animation with JavaScript to sync with the music */
  .invader-up {
    transform: translateY(0);
  }

  .invader-down {
    transform: translateY(5px);
  }

  .copyright {
    color: #fff;
    font-size: 0.8rem;
    text-align: center;
    position: absolute;
    bottom: 20px;
    width: 100%;
    z-index: 1006;
  }

  .menu-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0;
  }

  .menu-option {
    color: #fff;
    font-size: 1.4rem;
    margin: 15px 0;
    padding: 5px 20px;
    position: relative;
    transition: all 0.1s;
    cursor: pointer;
  }

  .menu-option.selected {
    color: #0f0;
  }

  .menu-option:hover {
    color: #0f0;
    text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  /* Fix for the screen-flicker animation to prevent line artifacts */
  @keyframes screen-flicker {
    0%, 95% { opacity: 1; background: transparent; }
    96%, 100% { opacity: 0.8; background: transparent; }
  }

  .screen-flicker {
    animation: screen-flicker 10s infinite;
    background: transparent;
  }
`;
