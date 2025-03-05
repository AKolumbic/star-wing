# Public Assets Directory

This directory contains static assets that need to be served directly by the web server in production builds.

## File Structure

- `/assets/audio/` - Audio files used in the game (music, sound effects)
- `/assets/img/` - Image files, icons, and other visual elements

## Important Note

When adding new static assets (like audio files, images, etc.), make sure to place them in this `public` directory. Files in this location will be:

1. Copied directly to the root of the built site
2. Accessible at their relative paths (e.g., `/assets/audio/file.mp3`)
3. Not processed by the bundler (unlike files imported directly in code)

Assets placed in the `src` or project root directories will **not** be available in production builds on platforms like Vercel unless they are properly imported and processed by the bundler.

## Audio Files

Audio files should be placed in the `public/assets/audio/` directory to ensure they can be loaded by the `AudioManager` in production builds.
