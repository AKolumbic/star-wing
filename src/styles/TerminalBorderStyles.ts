/**
 * TerminalBorderStyles.ts
 * Styles for the terminal border that wraps around the game UI
 */
export const terminalBorderStyles = `
  .terminal-border-container {
    /* Container styles */
  }

  .terminal-frame {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 28px solid #333;
    box-sizing: border-box;
    border-radius: 15px;
    pointer-events: none;
    background: transparent;
    z-index: 9999;
    box-shadow: 
      inset 0 0 20px rgba(0, 0, 0, 0.8),
      0 0 10px rgba(0, 0, 0, 0.8);
  }

  /* Scan line effect */
  .terminal-scanlines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      rgba(18, 16, 16, 0) 50%, 
      rgba(0, 0, 0, 0.25) 50%
    );
    background-size: 100% 4px;
    z-index: 10000;
    pointer-events: none;
    opacity: 0.7;
  }

  /* Screen glare effect */
  .terminal-glare {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      ellipse at center,
      rgba(255, 255, 255, 0.025) 0%,
      rgba(0, 0, 0, 0) 99%
    );
    z-index: 10001;
    pointer-events: none;
  }

  /* Corner screws */
  .terminal-screw {
    position: absolute;
    width: 12px;
    height: 12px;
    background-color: #222;
    border-radius: 50%;
    z-index: 10002;
    box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.2);
  }
  .terminal-screw::after {
    content: "+";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 8px;
    color: #666;
  }
  .terminal-screw-tl { top: 8px; left: 8px; }
  .terminal-screw-tr { top: 8px; right: 8px; }
  .terminal-screw-bl { bottom: 8px; left: 8px; }
  .terminal-screw-br { bottom: 8px; right: 8px; }

  /* Power button */
  .terminal-power-button {
    position: absolute;
    top: -20px;
    right: 50px;
    width: 40px;
    height: 20px;
    background-color: #444;
    border-radius: 10px 10px 0 0;
    z-index: 10002;
  }
  .terminal-power-button::after {
    content: "POWER";
    position: absolute;
    top: 3px;
    left: 4px;
    font-size: 5px;
    color: #aaa;
  }
  .terminal-power-led {
    position: absolute;
    right: 5px;
    top: 5px;
    width: 5px;
    height: 5px;
    background-color: #0f0;
    border-radius: 50%;
    box-shadow: 0 0 5px #0f0;
    animation: terminal-blink 4s infinite;
  }

  @keyframes terminal-blink {
    0%, 95% { opacity: 1; }
    96%, 100% { opacity: 0.7; }
  }
`;
