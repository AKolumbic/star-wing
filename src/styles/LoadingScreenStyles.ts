/**
 * LoadingScreenStyles.ts
 * Styles for the game loading screen
 */
export const loadingScreenStyles = `
  .loading-screen-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .loading-terminal {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    max-width: 80%;
    height: 300px;
    background-color: rgba(0, 0, 0, 0.7);
    border: 1px solid #33ff33;
    border-radius: 5px;
    padding: 15px;
    font-family: Courier, "Courier New", monospace;
    color: #33ff33;
    font-size: 14px;
    overflow: hidden;
    box-shadow: 0 0 10px rgba(51, 255, 51, 0.5);
    z-index: 1001;
  }

  .terminal-content {
    display: flex;
    flex-direction: column-reverse;
    height: 100%;
    overflow-y: hidden;
    text-align: left;
    font-family: Courier, "Courier New", monospace;
  }

  .loading-text {
    display: none;
  }

  .execute-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 15px 25px;
    background-color: #000;
    border: 2px solid #33ff33;
    border-radius: 5px;
    font-family: Courier, "Courier New", monospace;
    color: #33ff33;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(51, 255, 51, 0.7);
    transition: background-color 0.2s, box-shadow 0.2s;
    text-transform: uppercase;
    display: none;
    z-index: 1002;
  }

  .execute-button:hover {
    color: black;
    background-color: rgba(51, 255, 51, 0.9);
    box-shadow: 0 0 20px rgba(51, 255, 51, 0.9);
  }

  .error-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 80%;
    padding: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    border: 2px solid #ff3333;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    color: #ff3333;
    font-size: 16px;
    text-align: center;
    box-shadow: 0 0 15px rgba(255, 51, 51, 0.7);
    display: none;
    z-index: 1002;
  }

  .terminal-line {
    margin: 5px 0;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .cursor {
    display: inline-block;
    width: 8px;
    height: 14px;
    background-color: #33ff33;
    margin-left: 2px;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;
