/**
 * TextCrawlStyles.ts
 * Styles for the text crawl intro sequence
 */
export const textCrawlStyles = `
  .text-crawl-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.2); /* More transparent background to see starfield */
    perspective: 500px; /* Increased perspective for more dramatic effect */
    display: flex;
    justify-content: center;
    font-family: 'PressStart2P', monospace;
  }

  .crawl-content {
    position: absolute;
    top: 100%;
    color: #FFE81F; /* Star Wars gold */
    font-size: 28px;
    text-align: center;
    width: 80%;
    max-width: 800px;
    transform-origin: 50% 100%;
    transform: rotateX(25deg); /* Reduced angle for better readability */
    line-height: 2;
    letter-spacing: 2px;
    text-shadow: 0 0 10px rgba(255, 232, 31, 0.7);
    padding-bottom: 20%;
  }

  /* Add a subtle fade effect only at the very bottom edge */
  .crawl-content::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 15%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
    pointer-events: none;
  }

  .crawl-title {
    font-size: 50px; /* Larger title */
    margin-bottom: 100px;
    color: #FFE81F; /* Star Wars gold */
    text-transform: uppercase;
    text-shadow: 0 0 20px rgba(255, 232, 31, 0.9);
  }

  .crawl-paragraph {
    margin-bottom: 50px;
    text-shadow: 0 0 15px rgba(255, 232, 31, 0.8); /* Enhanced text shadow for better readability */
  }

  @keyframes scroll {
    0% { 
      top: 100%; 
    }
    100% { 
      top: -250%;
    }
  }
`;
