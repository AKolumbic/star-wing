/**
 * Sound Effect Generator Script
 *
 * This script generates basic sound effects for the game using Tone.js
 * Run with: node scripts/generate-sfx.js
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the directory if it doesn't exist
const audioDir = path.join(__dirname, "../public/assets/audio");
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Generate a laser sound effect
const generateLaser = () => {
  const laserScript = `
const fs = require('fs');
const path = require('path');
const Tone = require('tone');

// Create an offline context for rendering audio
const renderLength = 1; // seconds
const context = new Tone.OfflineContext(2, renderLength, 44100);
Tone.setContext(context);

// Create a synth for the laser sound
const synth = new Tone.Synth({
  oscillator: {
    type: 'sawtooth'
  },
  envelope: {
    attack: 0.001,
    decay: 0.1,
    sustain: 0,
    release: 0.1
  }
}).toDestination();

// Create a filter for the laser effect
const filter = new Tone.Filter({
  type: 'bandpass',
  frequency: 1000,
  Q: 5
}).connect(Tone.getDestination());

// Connect the synth to the filter
synth.connect(filter);

// Schedule the laser sound
synth.triggerAttackRelease('C6', 0.1, 0);
filter.frequency.exponentialRampToValueAtTime(5000, 0.1);

// Render the audio
context.render().then((buffer) => {
  // Convert to WAV
  const wavBuffer = Tone.WaveFormat.encode(buffer);
  
  // Save the file
  fs.writeFileSync(path.join(__dirname, '../public/assets/audio/laser.mp3'), Buffer.from(wavBuffer));
  console.log('Laser sound effect generated');
});
  `;

  fs.writeFileSync(path.join(__dirname, "temp-laser.js"), laserScript);
  return new Promise((resolve, reject) => {
    exec("node scripts/temp-laser.js", (error) => {
      fs.unlinkSync(path.join(__dirname, "temp-laser.js"));
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// Generate an explosion sound effect
const generateExplosion = () => {
  const explosionScript = `
const fs = require('fs');
const path = require('path');
const Tone = require('tone');

// Create an offline context for rendering audio
const renderLength = 1.5; // seconds
const context = new Tone.OfflineContext(2, renderLength, 44100);
Tone.setContext(context);

// Create a noise generator for the explosion
const noise = new Tone.NoiseSynth({
  noise: {
    type: 'white'
  },
  envelope: {
    attack: 0.001,
    decay: 0.3,
    sustain: 0.1,
    release: 1
  }
}).toDestination();

// Create a filter for the explosion effect
const filter = new Tone.Filter({
  type: 'lowpass',
  frequency: 800,
  Q: 1
}).connect(Tone.getDestination());

// Connect the noise to the filter
noise.connect(filter);

// Schedule the explosion sound
noise.triggerAttackRelease(0.5, 0);
filter.frequency.exponentialRampToValueAtTime(100, 0.5);

// Render the audio
context.render().then((buffer) => {
  // Convert to WAV
  const wavBuffer = Tone.WaveFormat.encode(buffer);
  
  // Save the file
  fs.writeFileSync(path.join(__dirname, '../public/assets/audio/explosion.mp3'), Buffer.from(wavBuffer));
  console.log('Explosion sound effect generated');
});
  `;

  fs.writeFileSync(path.join(__dirname, "temp-explosion.js"), explosionScript);
  return new Promise((resolve, reject) => {
    exec("node scripts/temp-explosion.js", (error) => {
      fs.unlinkSync(path.join(__dirname, "temp-explosion.js"));
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// Generate a menu select sound effect
const generateMenuSelect = () => {
  const menuSelectScript = `
const fs = require('fs');
const path = require('path');
const Tone = require('tone');

// Create an offline context for rendering audio
const renderLength = 0.5; // seconds
const context = new Tone.OfflineContext(2, renderLength, 44100);
Tone.setContext(context);

// Create a synth for the menu select sound
const synth = new Tone.Synth({
  oscillator: {
    type: 'sine'
  },
  envelope: {
    attack: 0.001,
    decay: 0.1,
    sustain: 0,
    release: 0.1
  }
}).toDestination();

// Schedule the menu select sound - two quick notes
synth.triggerAttackRelease('C5', 0.05, 0);
synth.triggerAttackRelease('G5', 0.05, 0.1);

// Render the audio
context.render().then((buffer) => {
  // Convert to WAV
  const wavBuffer = Tone.WaveFormat.encode(buffer);
  
  // Save the file
  fs.writeFileSync(path.join(__dirname, '../public/assets/audio/menu_select.mp3'), Buffer.from(wavBuffer));
  console.log('Menu select sound effect generated');
});
  `;

  fs.writeFileSync(
    path.join(__dirname, "temp-menu-select.js"),
    menuSelectScript
  );
  return new Promise((resolve, reject) => {
    exec("node scripts/temp-menu-select.js", (error) => {
      fs.unlinkSync(path.join(__dirname, "temp-menu-select.js"));
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// Generate all sound effects
const generateAllSfx = async () => {
  try {
    console.log("Generating sound effects...");

    // Create placeholder files
    fs.writeFileSync(path.join(audioDir, "laser.mp3"), "placeholder");
    fs.writeFileSync(path.join(audioDir, "explosion.mp3"), "placeholder");
    fs.writeFileSync(path.join(audioDir, "menu_select.mp3"), "placeholder");

    console.log(
      "Created placeholder files. For actual sound generation, you need to:"
    );
    console.log("1. Install Tone.js: npm install tone");
    console.log(
      "2. Find suitable sound effects and place them in public/assets/audio/"
    );
    console.log("3. Or create them using a sound editor");

    console.log("Sound effect generation complete!");
  } catch (error) {
    console.error("Error generating sound effects:", error);
  }
};

// Run the generator
generateAllSfx();
