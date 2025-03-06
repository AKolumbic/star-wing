import { Game } from "../core/Game";
import { Logger } from "../utils/Logger";
import { StyleManager } from "../styles/StyleManager";
import { highScoresStyles } from "../styles/HighScoresStyles";

export class HighScores {
  private container: HTMLDivElement;
  private isVisible: boolean = false;

  /**
   * Reference to the Game instance
   * Maintained for future integration with game state and score management
   */
  private game: Game;
  private onCloseCallback: (() => void) | null = null;
  private logger = Logger.getInstance();

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

    // Apply styles
    StyleManager.applyStyles("highScores", highScoresStyles);

    this.setupHighScores();
    this.hide(); // Initially hidden

    // Add keyboard event listener for ESC key
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
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
    // Remove styles
    StyleManager.removeStyles("highScores");

    document.removeEventListener("keydown", this.handleKeyDown.bind(this));

    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.logger.info("HighScores: Disposed");
  }
}
