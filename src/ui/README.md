# Star Wing UI Components

This directory contains all user interface elements for the Star Wing game, providing the visual framework for player interaction.

## Overview

The `ui` directory houses components that create the game's distinct retro terminal aesthetic and manage all user-facing interfaces. These components work together to create an immersive, arcade-style gaming experience with a nostalgic computer terminal look and feel, enhanced with modern animation techniques using GSAP.

## Key Components

### LoadingScreen

Initial game entry point that provides visual feedback during resource loading.

- Displays the game's logo and a retro-style loading animation
- Presents the "EXECUTE PROGRAM" button to start the game
- Handles the transition from loading to gameplay
- Calls the game's initialization sequence when the player is ready
- Features progress indicators for asset loading

```typescript
// The loading screen is typically created by the Game class
// User interaction with this screen triggers game initialization
const loadingScreen = new LoadingScreen();
loadingScreen.show();
loadingScreen.updateProgress(0.75); // 75% loaded
loadingScreen.onComplete(() => game.start());
```

### Menu

Game menu system providing access to various game functions.

- Manages main menu, pause menu, and settings screens
- Handles navigation between different menu screens
- Provides settings controls (volume, graphics options, control rebinding)
- Creates visual effects like text glitching and scan lines
- Implements animated transitions between menu states

```typescript
// Basic usage
const menu = new Menu();
menu.show("main"); // Show main menu
menu.show("settings"); // Show settings menu
menu.hide(); // Hide current menu

// Event handling
menu.onSettingsChanged((settings) => {
  game.applySettings(settings);
});
```

### TerminalBorder

Decorative border that frames the game in a retro terminal style.

- Creates the signature green terminal-style border
- Adds visual elements like corner brackets and scanlines
- Scales properly with different screen sizes
- Enhances the game's retro computer aesthetic
- Includes animated alert states for gameplay events

```typescript
// Created by the Game class to frame the game canvas
const border = new TerminalBorder();
border.init();
border.setAlertState("warning"); // Visual warning effect
```

### GameHUD

In-game interface showing player status and game information.

- Displays player health, shield status, and weapon information
- Shows mission objectives, score, and progress indicators
- Features animated elements for critical warnings and alerts
- Maintains the terminal aesthetic during gameplay
- Updates dynamically based on game state changes
- Includes weapon cooldown and energy indicators

```typescript
// Basic usage
const hud = new GameHUD();
hud.init();
hud.updateHealth(75); // 75% health
hud.updateShield(50); // 50% shield
hud.showWarning("Incoming missile detected");
```

### DialogOverlay

System for displaying in-game dialogue and story elements.

- Shows mission briefings and character dialogue
- Implements typewriter text effect for dialogue
- Maintains the terminal aesthetic
- Supports choices and interactive elements
- Can be dismissed or auto-advances based on configuration

```typescript
// Displaying a dialogue
const dialogue = new DialogOverlay();
dialogue.showMessage("Commander", "Welcome to Star Wing Squadron, pilot.");
dialogue.onComplete(() => game.startMission());
```

## Design Philosophy

The UI components follow these design principles:

1. **Retro Terminal Aesthetic**: Green text, scanlines, and glitching effects reminiscent of 80s computer terminals
2. **Minimal Intrusion**: HUD elements that provide necessary information without obscuring gameplay
3. **Consistent Theme**: All UI elements maintain the same visual language and style
4. **Responsive Design**: Interfaces that adapt to different screen sizes and aspect ratios
5. **Feedback and Clarity**: Clear visual and audio feedback for all user interactions

## Technical Implementation

The UI system features:

- DOM-based elements for menus and overlays
- Canvas-drawn elements for in-game HUD components
- GSAP-powered animations for smooth transitions and effects
- Event-driven architecture for handling player interaction
- Responsive design that adapts to different screen sizes
- Clean separation from game logic through the observer pattern
- Performance optimizations for smooth rendering

## Animation System

UI animations are powered by GSAP (GreenSock Animation Platform):

- Smooth transitions between UI states
- Text effects including typewriter and glitching
- Dynamic scaling and positioning for responsive design
- Easing functions for natural-feeling animations
- Timeline sequencing for complex animation sequences

```typescript
// Example GSAP animation in UI components
import { gsap } from "gsap";

// Simple animation
gsap.to(element, {
  duration: 0.5,
  opacity: 1,
  y: 0,
  ease: "power2.out",
});

// Complex sequence
const tl = gsap.timeline();
tl.from(title, { y: -50, opacity: 0, duration: 0.5 })
  .from(buttons, { scale: 0.8, opacity: 0, stagger: 0.1 }, "-=0.3")
  .from(border, { drawSVG: 0, duration: 1 }, "-=0.5");
```

## Style Guide

UI elements follow these style guidelines:

- **Primary Color**: Terminal green (#00FF00) with glow effects
- **Secondary Colors**: Warning orange (#FF9900) and danger red (#FF3300)
- **Font**: "PressStart2P" for headers and "Share Tech Mono" for body text
- **Animations**: Text glitching, scanlines, and subtle pulsing
- **Borders**: Angular, bracket-style borders with corner embellishments
- **Sound**: Subtle key clicks and electronic hums for interaction feedback
- **Responsiveness**: Maintains usability across desktop and mobile devices
