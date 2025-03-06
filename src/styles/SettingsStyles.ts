/**
 * SettingsStyles.ts
 * Styles for the game settings dialog
 */
export const settingsStyles = `
  .settings-container {
    position: relative;
    width: calc(100% - 100px);
    max-width: 800px;
    height: calc(100% - 100px);
    background-color: rgba(0, 0, 0, 0.9);
    border: 2px solid #33ff33;
    border-radius: 5px;
    padding: 20px;
    color: #33ff33;
    font-family: 'PressStart2P', monospace;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 20px rgba(51, 255, 51, 0.3);
  }

  .settings-header {
    text-align: center;
    margin-bottom: 20px;
    font-size: 24px;
    padding-bottom: 10px;
    border-bottom: 1px solid #33ff33;
  }

  .settings-section {
    margin-bottom: 30px;
  }

  .settings-section-title {
    font-size: 18px;
    margin-bottom: 15px;
    text-transform: uppercase;
    position: relative;
  }

  .settings-section-title::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -5px;
    width: 50px;
    height: 2px;
    background-color: #33ff33;
  }

  .settings-option {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    font-size: 14px;
  }

  .settings-label {
    flex: 1;
  }

  .settings-toggle {
    width: 60px;
    height: 30px;
    background-color: #111;
    border: 2px solid #33ff33;
    border-radius: 15px;
    position: relative;
    cursor: pointer;
  }

  .settings-toggle.active::after {
    left: 30px;
  }

  .settings-toggle::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 26px;
    height: 26px;
    background-color: #33ff33;
    border-radius: 50%;
    transition: left 0.2s;
  }

  .settings-back-button {
    cursor: pointer;
    background-color: #000;
    color: #33ff33;
    border: 2px solid #33ff33;
    padding: 10px 20px;
    font-family: 'PressStart2P', monospace;
    margin-top: auto;
    align-self: center;
    transition: background-color 0.2s;
    text-transform: uppercase;
  }

  .settings-back-button:hover {
    background-color: rgba(51, 255, 51, 0.2);
  }

  .volume-slider-container {
    display: flex;
    align-items: center;
    margin-left: 15px;
  }

  /* Target the correct volume slider class */
  .volume-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 150px;
    height: 10px;
    background: #111;
    outline: none;
    border: 2px solid #33ff33;
    border-radius: 5px;
  }

  /* Webkit (Chrome, Safari, newer versions of Opera) */
  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #33ff33;
    border-radius: 50%;
    cursor: pointer;
  }

  /* Firefox */
  .volume-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #33ff33;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }

  .volume-slider::-moz-range-track {
    background: #111;
    border: 2px solid #33ff33;
    border-radius: 5px;
    height: 10px;
  }

  .volume-slider::-moz-range-progress {
    background: #33ff33;
    height: 10px;
    border-radius: 3px;
  }

  /* MS Edge and IE */
  .volume-slider::-ms-thumb {
    width: 20px;
    height: 20px;
    background: #33ff33;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }

  .volume-slider::-ms-track {
    background: transparent;
    border-color: transparent;
    color: transparent;
    height: 10px;
  }

  .volume-slider::-ms-fill-lower {
    background: #33ff33;
    border: 2px solid #33ff33;
    border-radius: 5px;
  }

  .volume-slider::-ms-fill-upper {
    background: #111;
    border: 2px solid #33ff33;
    border-radius: 5px;
  }

  /* Ensure browser default styling is removed */
  .volume-slider:focus {
    outline: none;
  }

  .volume-value {
    margin-left: 15px;
    font-size: 12px;
    width: 45px;
    text-align: center;
  }
`;
