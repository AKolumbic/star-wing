import { Game } from "../core/Game";

export class HighScores {
  private container: HTMLDivElement;
  private isVisible: boolean = false;
  private game: Game;
  private onCloseCallback: (() => void) | null = null;

  // Placeholder high scores data
  private highScoresData = [
    { rank: 1, name: "DRS", score: 12500 },
    { rank: 2, name: "AJK", score: 10750 },
    { rank: 3, name: "RGN", score: 9200 },
    { rank: 4, name: "CPU", score: 8150 },
    { rank: 5, name: "SYS", score: 7300 },
    { rank: 6, name: "GLX", score: 6275 },
    { rank: 7, name: "BIT", score: 5400 },
    { rank: 8, name: "NEO", score: 4350 },
    { rank: 9, name: "XOR", score: 3200 },
    { rank: 10, name: "SCA", score: 2050 },
  ];

  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.container.className = "terminal-overlay";
    this.setupStyles();
    this.setupHighScores();
    this.hide(); // Initially hidden

    // Add keyboard event listener for ESC key
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private setupStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
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

      .no-scores-message {
        text-align: center;
        margin: 40px 0;
        font-size: 16px;
        color: #33ff33;
      }

      /* Digital scan line effect */
      .highscores-container::before {
        content: "";
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
        z-index: 1005;
        pointer-events: none;
        opacity: 0.3;
      }

      /* Blink animation for top score */
      @keyframes topScoreBlink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0.7; }
      }

      .top-score {
        animation: topScoreBlink 1.5s infinite;
      }
    `;
    document.head.appendChild(style);
  }

  private setupHighScores(): void {
    // Create high scores container
    const highScoresContainer = document.createElement("div");
    highScoresContainer.className = "highscores-container";

    // Header
    const header = document.createElement("div");
    header.className = "highscores-header";
    header.textContent = "HIGH SCORES";
    highScoresContainer.appendChild(header);

    // High scores table
    if (this.highScoresData.length > 0) {
      const table = document.createElement("table");
      table.className = "highscores-table";

      // Table header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      const rankHeader = document.createElement("th");
      rankHeader.className = "highscores-table-header rank-cell";
      rankHeader.textContent = "RANK";
      headerRow.appendChild(rankHeader);

      const nameHeader = document.createElement("th");
      nameHeader.className = "highscores-table-header name-cell";
      nameHeader.textContent = "NAME";
      headerRow.appendChild(nameHeader);

      const scoreHeader = document.createElement("th");
      scoreHeader.className = "highscores-table-header score-cell";
      scoreHeader.textContent = "SCORE";
      headerRow.appendChild(scoreHeader);

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement("tbody");
      this.highScoresData.forEach((score, index) => {
        const row = document.createElement("tr");
        row.className =
          "highscores-table-row" + (index === 0 ? " top-score" : "");

        const rankCell = document.createElement("td");
        rankCell.className = "highscores-table-cell rank-cell";
        rankCell.textContent = score.rank.toString();
        row.appendChild(rankCell);

        const nameCell = document.createElement("td");
        nameCell.className = "highscores-table-cell name-cell";
        nameCell.textContent = score.name;
        row.appendChild(nameCell);

        const scoreCell = document.createElement("td");
        scoreCell.className = "highscores-table-cell score-cell";
        scoreCell.textContent = score.score.toString();
        row.appendChild(scoreCell);

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      highScoresContainer.appendChild(table);
    } else {
      // No scores message
      const noScoresMessage = document.createElement("div");
      noScoresMessage.className = "no-scores-message";
      noScoresMessage.textContent = "NO HIGH SCORES RECORDED YET";
      highScoresContainer.appendChild(noScoresMessage);
    }

    // Back button
    const backButton = document.createElement("button");
    backButton.className = "highscores-back-button";
    backButton.textContent = "BACK TO MENU";
    backButton.addEventListener("click", () => {
      this.hide(); // This will trigger the onCloseCallback
    });

    highScoresContainer.appendChild(backButton);

    // Add to container
    this.container.appendChild(highScoresContainer);
    document.body.appendChild(this.container);
  }

  public setOnCloseCallback(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  show(): void {
    this.container.style.display = "flex";
    this.isVisible = true;
  }

  hide(): void {
    this.container.style.display = "none";
    this.isVisible = false;

    // Call the callback if provided
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  isHighScoresVisible(): boolean {
    return this.isVisible;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isVisible) return;

    if (event.key === "Escape") {
      this.hide();
    }
  }

  dispose(): void {
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    document.body.removeChild(this.container);
  }
}
