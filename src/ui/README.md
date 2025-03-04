# Star Wing UI Components

This directory contains all user interface elements for the Star Wing game, providing the visual framework for player interaction.

## Overview

The `ui` directory houses components that create the game's distinct retro terminal aesthetic and manage all user-facing interfaces. These components work together to create an immersive, arcade-style gaming experience with a nostalgic computer terminal look and feel.

## Key Components

### LoadingScreen

Initial game entry point that provides visual feedback during resource loading.

- Displays the game's logo and a retro-style loading animation
- Presents the "EXECUTE PROGRAM" button to start the game
- Handles the transition from loading to gameplay
- Calls the game's initialization sequence when the player is ready

```typescript
// The loading screen is typically created by the Game class
// User interaction with this screen triggers game initialization
```

### Menu

Game menu system providing access to various game functions.

- Manages main menu, pause menu, and settings screens
- Handles navigation between different menu screens
- Provides settings controls (volume, graphics options)
- Creates visual effects like text glitching and scan lines

```typescript
// Basic usage
const menu = new Menu();
menu.show("main"); // Show main menu
menu.hide(); // Hide current menu
```

### TerminalBorder

Decorative border that frames the game in a retro terminal style.

- Creates the signature green terminal-style border
- Adds visual elements like corner brackets and scanlines
- Scales properly with different screen sizes
- Enhances the game's retro computer aesthetic

```typescript
// Created by the Game class to frame the game canvas
const border = new TerminalBorder();
border.init();
```

### HUD (Heads-Up Display)

In-game interface showing player status and game information.

- Displays player health, score, and weapon status
- Shows mission objectives and progress
- Features animated elements for critical warnings
- Maintains the terminal aesthetic during gameplay

## Design Philosophy

The UI components follow these design principles:

1. **Retro Terminal Aesthetic**: Green text, scanlines, and glitching effects reminiscent of 80s computer terminals
2. **Minimal Intrusion**: HUD elements that provide necessary information without obscuring gameplay
3. **Consistent Theme**: All UI elements maintain the same visual language and style
4. **Responsive Design**: Interfaces that adapt to different screen sizes and aspect ratios

## Technical Implementation

The UI system features:

- DOM-based elements for menus and overlays
- Canvas-drawn elements for in-game HUD components
- CSS animations for visual effects
- Event-driven architecture for handling player interaction
- Clean separation from game logic

## Style Guide

UI elements follow these style guidelines:

- **Primary Color**: Terminal green (#00FF00) with glow effects
- **Font**: "PressStart2P" for authentic retro styling
- **Animations**: Text glitching, scanlines, and subtle pulsing
- **Borders**: Angular, bracket-style borders with corner embellishments
- **Sound**: Subtle key clicks and electronic hums for interaction feedback
