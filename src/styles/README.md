# Star Wing Styles

This directory contains the modular styling system for the Star Wing game, providing a consistent approach to managing UI styles across the application.

## Overview

The `styles` directory houses all UI component styles and the central style management system. This modular approach separates styling concerns from component behavior, resulting in more maintainable and cleaner code.

## Key Components

### StyleManager

Central utility for applying and removing CSS styles throughout the application.

- Manages style elements in the document head
- Provides methods for applying and removing styles
- Maintains a registry of active styles
- Handles error logging for style operations

```typescript
// Apply styles to a component
StyleManager.applyStyles("menu", menuStyles);

// Remove styles when component is disposed
StyleManager.removeStyles("menu");
```

### Style Modules

Each UI component has a dedicated style module that exports its CSS as a template string:

- **MenuStyles**: Styling for the main and pause menu
- **TerminalBorderStyles**: Styling for the retro terminal border surrounding the game
- **GameHUDStyles**: Styling for in-game heads-up display elements
- **HighScoresStyles**: Styling for the high scores screen
- **SettingsStyles**: Styling for the settings menu
- **TextCrawlStyles**: Styling for the scrolling text intro
- **LoadingScreenStyles**: Styling for the initial loading screen

## Usage Pattern

The modular styling system follows this pattern:

1. **Define Styles**: Create a dedicated style module for each UI component
2. **Export Styles**: Export styles as a template string
3. **Apply Styles**: Apply styles in the component constructor using `StyleManager`
4. **Remove Styles**: Clean up by removing styles in the component's dispose method

```typescript
// In a style module (e.g., MenuStyles.ts)
export const menuStyles = `
  .menu-container {
    /* CSS properties */
  }
`;

// In a component (e.g., Menu.ts)
constructor() {
  StyleManager.applyStyles('menu', menuStyles);
}

dispose() {
  StyleManager.removeStyles('menu');
}
```

## Design Philosophy

The styling system follows these principles:

1. **Separation of Concerns**: Styles are separated from component logic
2. **Consistency**: All UI components follow the same styling pattern
3. **Performance**: Style elements are efficiently managed
4. **Maintainability**: Styles can be updated without touching component code
5. **Self-Contained**: Each component's styles are encapsulated in their own file

## Style Guidelines

All styles adhere to the game's retro terminal aesthetic:

- **Color Palette**: Terminal green (#00FF00) with dark backgrounds
- **Typography**: "PressStart2P" font for authentic retro styling
- **Effects**: Text glitching, scanlines, and CRT-style effects
- **Borders**: Angular, bracket-style borders with corner embellishments
- **Animations**: Subtle pulsing, scan effects, and cursor blinking

## Extending the Styling System

To add styles for a new UI component:

1. Create a new file (e.g., `NewComponentStyles.ts`)
2. Define and export your styles as a template string
3. Add the export to `index.ts`
4. Apply the styles in your component using `StyleManager`
