# FOREST HUNTER — Customisable Web Game Starter (v0.2)

A browser-based, top-down, slightly pixelated retro survival game. This project uses plain HTML, CSS and JavaScript. No game engine, account, build step, database, or package installation is required.

## Gameplay rules

- The hunter starts with **5 hearts/lives**.
- Move with **W/A/S/D** (arrow keys also work); aim with the mouse and fire with **right-click**. **Space** is an alternate fire key.
- The game simulation targets **30 FPS** for a retro feel while keeping movement smooth. The hunter and placeholder characters have procedural bobbing/walking animation.
- Each bush hides a queue of **up to three cavemen**. A caveman remains hidden until the hunter approaches the enlarged trigger zone. The hunter stays near the left side of the track and moves with smooth, Mario-like WASD controls; the world scrolls as the hunter advances. The hunter's body stays upright while the gun aims at the mouse.
- **Only one caveman can emerge from a given bush at a time.** Once that caveman is killed or hits the hunter, the next one in that bush's queue can take its turn.
- Cavemen appear from bushes as the hunter progresses past the opening stretch. Encounters are spaced along the endless track, with a maximum of **three active cavemen at once**.
- When a caveman emerges, the configured scream plays once. It then chases the hunter; aim and shoot before it reaches you.
- If a caveman touches the hunter, that caveman disappears and the hunter loses **exactly one life**. The configured hunter-hit sound plays and the custom hit GIF runs for **3 full seconds**. This same GIF and sound replay for every later hit.
- During the three-second hit reaction, the hunter cannot move or shoot, active cavemen pause and wait, and triggered bushes do not release new enemies. When the GIF finishes, play resumes. Waiting enemies then chase again; if another reaches the hunter, the same hit sequence starts again.
- The **fifth/fatal hit** still plays the full 3-second GIF and sound. The game-over screen appears only after that reaction ends.
- Hearts appear as the hunter travels. Collect one to restore a missing life; if already at full health, it awards bonus score.
- Score, distance and best score are displayed. Best score is saved in this browser on this device.

## Run the game

### Option A — open directly
1. Download and extract `forest_hunter_game.zip`.
2. Open the extracted `forest_hunter_game` folder.
3. Double-click `index.html`.
4. Click **START GAME**.

### Option B — use a local web server (recommended if local assets do not load)
1. Install Python 3 if needed.
2. Open Command Prompt inside the extracted `forest_hunter_game` folder. In File Explorer, click the address bar, type `cmd`, and press Enter.
3. Run `py -m http.server 8000` on Windows, or `python -m http.server 8000` if that command is available.
4. Open `http://localhost:8000` in your browser.
5. Stop the server with **Ctrl+C** in Command Prompt.

No Node.js or additional packages are required.

## Add your own graphics, background, GIF and sounds

1. Copy your files into `assets/images/` or `assets/sounds/`.
2. Open `asset-config.js` in Notepad or another text editor.
3. Replace the matching empty string with the file path, keeping the quotes.
4. Save the file and refresh the game. Use the exact spelling and file extension; case matters on many web hosts.

### Recommended filenames and folders

```text
forest_hunter_game/
├── index.html
├── style.css
├── game.js
├── asset-config.js
├── README.md
└── assets/
    ├── images/
    │   ├── forest-top.png
    │   ├── forest-bottom.png
    │   ├── ground.png
    │   ├── bush.png
    │   ├── hunter.png
    │   ├── caveman.png
    │   └── hunter-hit.gif
    └── sounds/
        ├── gunshot.wav
        ├── caveman-scream.wav
        ├── hunter-hit.wav
        ├── caveman-death.wav
        └── forest-ambience.mp3
```

These are suggested names. You may use other names as long as `asset-config.js` points to the correct file.

### Image guide

| Config key | Example path | What to create |
|---|---|---|
| `forestTop` | `assets/images/forest-top.png` | Wide forest strip at the top of the play area. |
| `forestBottom` | `assets/images/forest-bottom.png` | Wide forest strip at the bottom. |
| `ground` | `assets/images/ground.png` | Central clearing/ground texture, stretched to fill the middle. |
| `bush` | `assets/images/bush.png` | One bush reused at multiple positions. Transparent PNG recommended. |
| `hunter` | `assets/images/hunter.png` | Transparent hunter character image, tightly cropped and ideally facing right. The hunter body stays upright; the gun aims independently toward the mouse. |
| `caveman` | `assets/images/caveman.png` | Transparent caveman image, tightly cropped. The game rotates it to face the hunter. |
| `hitAnimation` | `assets/images/hunter-hit.gif` | Hunter hit/fall GIF shown for 3 seconds each time a caveman makes contact. Transparent background recommended. |

**Canvas size:** 960 × 540 pixels (16:9 aspect ratio). The forest strips are wide landscape art; the ground fills the middle clearing. A ground image around 960 × 400 is a convenient starting point. Character art around 128–256 pixels square works well because it is scaled down by the game. Bush artwork is displayed at roughly 50–66 pixels across. Use transparent PNGs for characters and bushes to avoid white rectangles.

### Hit GIF behavior

- Put the GIF in `assets/images/` and set `hitAnimation: "assets/images/hunter-hit.gif"` in `asset-config.js`.
- The GIF is drawn in a **104 × 104 pixel box centered on the hunter**. Crop/design the animation to fit this area; adjust `game.js` if you need a different display size.
- The game timer—not the GIF's native duration—controls the **3-second lockout**. Use an animated/looping GIF suitable for this display period.
- Every contact that costs a life restarts the same GIF and plays `hunterHit` again. During the GIF, the hunter cannot move or fire, existing cavemen wait, and newly triggered bushes hold their queues.
- GIF animation should be tested in the browser you plan to use. If it doesn't animate as expected, a transparent WebM or a sprite-sheet animation can be substituted with a code change.
- The current hunter and caveman slots accept single images, not sprite sheets. Walking is currently procedural; frame-by-frame custom walking animation would require extending `game.js`.

### Sound guide

| Config key | Example path | When it plays |
|---|---|---|
| `gunshot` | `assets/sounds/gunshot.wav` | Every shot fired. |
| `cavemanScream` | `assets/sounds/caveman-scream.wav` | Once when a caveman emerges from a bush. Not continuous while chasing. |
| `hunterHit` | `assets/sounds/hunter-hit.wav` | Every time the 3-second hunter hit GIF begins, including the fatal fifth hit. |
| `cavemanDeath` | `assets/sounds/caveman-death.wav` | When a caveman is shot and defeated. |
| `ambience` | `assets/sounds/forest-ambience.mp3` | Reserved optional forest ambience slot; it is not currently auto-looped. |

WAV, MP3 and OGG are widely supported. Keep one-shot effects short. Browsers may block audio until you interact with the page, so click **START GAME** before testing sounds. If audio doesn't play, check the filename, extension, path, and browser console.

### Example `asset-config.js` entries

```js
images: {
  forestTop: "assets/images/forest-top.png",
  forestBottom: "assets/images/forest-bottom.png",
  ground: "assets/images/ground.png",
  bush: "assets/images/bush.png",
  hunter: "assets/images/hunter.png",
  caveman: "assets/images/caveman.png",
  hitAnimation: "assets/images/hunter-hit.gif"
},
sounds: {
  gunshot: "assets/sounds/gunshot.wav",
  cavemanScream: "assets/sounds/caveman-scream.wav",
  hunterHit: "assets/sounds/hunter-hit.wav",
  cavemanDeath: "assets/sounds/caveman-death.wav",
  ambience: "assets/sounds/forest-ambience.mp3"
}
```

Only change the values inside the existing `window.GAME_ASSETS` object in `asset-config.js`; do not paste a second object over the whole file.

## Tuning gameplay

Edit the `tuning` section in `asset-config.js`:

- `fps`: simulation update rate (default `30`).
- `hunterSpeed`: hunter movement speed.
- `hunterLives`: starting and maximum lives (default `5`).
- `bushCount`: number of bushes placed in the clearing.
- `maxQueuedCavemenPerBush`: maximum hidden queue for each bush (default `3`). A bush only releases one caveman at a time.
- `maxActiveCavemen`: hard global cap for active cavemen across all bushes (default `3`).
- `cavemanSpeed`: chase speed.
- `spawnNearDistance`: distance at which the hunter triggers a bush.
- `contactDistance`: distance at which a caveman hits the hunter.
- `heartEveryMeters`: distance travelled between heart pickups.

## Saving and privacy

Best score is saved using browser `localStorage` on this device. There are no profiles, online leaderboard, server-side save, or account system. Clearing browser site data may erase the best score.

## Troubleshooting

- **Black/blank game:** try the local-server method above and check the browser console for typos in `asset-config.js`.
- **Artwork missing:** verify the path and exact filename.
- **White box around character:** use a transparent PNG/GIF.
- **No sound:** click the page/start button first, then check path, extension and browser console.
- **Restore placeholder artwork:** set that image's path back to an empty string (`""`).

This is a playable starter prototype intended for your own graphics and audio. It is not yet a polished production release.
