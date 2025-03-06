/**
 * HighScoresStyles.ts
 * Styles for the high scores display
 */
export const highScoresStyles = `
  .highscores-container {
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

  .highscores-header {
    text-align: center;
    margin-bottom: 20px;
    font-size: 24px;
    padding-bottom: 10px;
    border-bottom: 1px solid #33ff33;
  }

  .highscores-table {
    margin: 20px auto;
    width: 80%;
    border-collapse: collapse;
  }

  .highscores-table-header {
    text-align: left;
    padding: 10px 5px;
    border-bottom: 1px solid #33ff33;
    font-size: 16px;
  }

  .highscores-table-row {
    position: relative;
  }

  .highscores-table-row:nth-child(odd) {
    background-color: rgba(51, 255, 51, 0.05);
  }

  .highscores-table-cell {
    padding: 12px 5px;
    font-size: 14px;
  }

  .rank-cell {
    width: 50px;
    text-align: center;
  }

  .name-cell {
    width: 120px;
  }

  .score-cell {
    text-align: right;
  }

  .highscores-back-button {
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

  .highscores-back-button:hover {
    background-color: rgba(51, 255, 51, 0.2);
  }
`;
