/*
  ASSET CONFIGURATION
  Put your files in assets/images/ or assets/sounds/ and update the paths below.
  Supported image formats: PNG, JPG, WEBP. Audio: WAV, MP3, OGG.
  Leave a value as an empty string to keep the built-in placeholder art/sound.
*/
window.GAME_ASSETS = {
  images: {
    forestTop: "assets/images/forest-top.png",       // e.g. "assets/images/forest-top.png" (wide strip)
    forestBottom: "assets/images/forest-bottom.png",    // e.g. "assets/images/forest-bottom.png" (wide strip)
    ground: "",           // e.g. "assets/images/ground.png" (tileable ground)
    bush: "assets/images/bush.png",             // e.g. "assets/images/bush.png" (transparent PNG recommended)
    hunter: "assets/images/hunter.png",           // e.g. "assets/images/hunter.png" (spritesheet or single image; single image supported)
    caveman: "assets/images/caveman.png",          // e.g. "assets/images/caveman.png" (single image supported)
    hitAnimation: "assets/images/hunter-hit.gif"      // e.g. "assets/images/hunter-hit.gif" (shown for the 3-second hit reaction)
  },
  sounds: {
    gunshot: "assets/sounds/shot.wav",           // e.g. "assets/sounds/shot.wav"
    cavemanScream: "assets/sounds/caveman_Scream.wav",     // plays when a caveman rushes out of a bush
    hunterHit: "assets/sounds/sexu.wav",         // plays on contact
    cavemanDeath: "",      // plays when a caveman is defeated
    ambience: "assets/sounds/music.wav"           // optional quiet forest ambience; loops while playing
  },
  tuning: {
    fps: 30,                // target update rate; rendering stays smooth on typical displays
    hunterSpeed: 190,
    hunterLives: 5,
    bushCount: 15,
    maxQueuedCavemenPerBush: 3,
    maxActiveCavemen: 3,      // hard cap: no more than three active cavemen at once
    queueWaitDistance: 66,   // enemies wait nearby while the hunter's hit animation plays,
    cavemanSpeed: 105,
    spawnNearDistance: 145,
    contactDistance: 28,
    heartEveryMeters: 450
  }
};
