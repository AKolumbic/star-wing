/**
 * GameHUDStyles.ts
 * Styles for the in-game heads-up display
 */
export const gameHUDStyles = `
  /* Main HUD container */
  .game-hud-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
    font-family: 'PressStart2P', monospace;
    color: #fff;
    text-shadow: 0 0 5px #0ff, 0 0 10px #0af;
    /* Add padding to account for terminal border */
    box-sizing: border-box;
    padding: 35px;
  }
  
  /* Health and shield bars */
  .hud-bar-container {
    position: absolute;
    left: 40px; /* Increased from 20px to account for terminal border */
    height: 15px;
    width: 200px;
    background-color: rgba(0, 0, 0, 0.5);
    border: 2px solid #fff;
    box-shadow: 0 0 5px #0ff, inset 0 0 5px rgba(0, 0, 0, 0.8);
    overflow: hidden;
  }
  
  .health-bar-container {
    bottom: 70px; /* Increased from 50px to account for terminal border */
  }
  
  .shield-bar-container {
    bottom: 95px; /* Increased from 75px to account for terminal border */
  }
  
  .hud-bar {
    height: 100%;
    width: 100%;
    transform-origin: left;
  }
  
  .health-bar {
    background: linear-gradient(to right, #22ff22, #44ff44);
    box-shadow: 0 0 10px #0f0 inset;
  }
  
  .shield-bar {
    background: linear-gradient(to right, #2288ff, #44aaff);
    box-shadow: 0 0 10px #0af inset;
  }
  
  /* Weapon status */
  .weapon-status-container {
    position: absolute;
    right: 40px; /* Increased from 20px to account for terminal border */
    bottom: 40px; /* Increased from 20px to account for terminal border */
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px; /* Add spacing between weapon items */
  }
  
  .weapon-item {
    background-color: rgba(0, 0, 0, 0.5);
    border: 2px solid #fff;
    border-radius: 5px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 0 5px #0ff;
    min-width: 160px;
  }
  
  .weapon-label {
    font-size: 10px;
    color: #0ff;
    letter-spacing: 1px;
    font-weight: bold;
    text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
  }
  
  .weapon-icon {
    width: 30px;
    height: 30px;
    border: 1px solid #0ff;
    margin-right: 5px;
    background-color: rgba(0, 150, 255, 0.3);
    /* Center the text */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
  }
  
  .weapon-cooldown {
    width: 70px;
    height: 12px;
    background-color: rgba(0, 0, 0, 0.7);
    border: 1px solid #fff;
    position: relative;
    margin-left: 10px;
  }
  
  .cooldown-bar {
    height: 100%;
    background-color: #0ff;
    width: 100%;
    box-shadow: 0 0 5px #0ff;
  }
  
  /* Radar */
  .radar-container {
    position: absolute;
    right: 40px; /* Increased from 20px to account for terminal border */
    top: 40px; /* Increased from 20px to account for terminal border */
    width: 150px;
    height: 150px;
    background-color: rgba(0, 0, 0, 0.5);
    border: 2px solid #fff;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 0 10px #0ff;
  }
  
  /* Info container */
  .info-container {
    position: absolute;
    top: 40px; /* Increased from 20px to account for terminal border */
    left: 40px; /* Increased from 20px to account for terminal border */
    background-color: rgba(0, 0, 0, 0.5);
    border: 2px solid #fff;
    padding: 5px 10px;
    font-size: 12px;
    box-shadow: 0 0 5px #0ff;
  }
  
  /* Warning container */
  .warning-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    color: #ff0022;
    text-shadow: 0 0 10px #f00;
    text-align: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .warning-visible {
    opacity: 1;
    animation: warning-pulse 1s infinite;
  }
  
  @keyframes warning-pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }
`;
