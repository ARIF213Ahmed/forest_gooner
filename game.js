// (() => {
//   'use strict';
//   const cfg = window.GAME_ASSETS || {};
//   const tuning = Object.assign({ fps: 30, hunterSpeed: 155, hunterLives: 5, bushCount: 13, maxQueuedCavemenPerBush: 1, maxActiveCavemen: 3, cavemanSpeed: 175, spawnNearDistance: 125, contactDistance: 28, queueWaitDistance: 66, heartEveryMeters: 450 }, cfg.tuning || {});
//   const canvas = document.getElementById('game');
//   const ctx = canvas.getContext('2d');
//   ctx.imageSmoothingEnabled = false;
//   const W = canvas.width, H = canvas.height;
//   const ui = { score: document.getElementById('score'), lives: document.getElementById('lives'), distance: document.getElementById('distance'), best: document.getElementById('best'), toast: document.getElementById('toast'), start: document.getElementById('startOverlay'), end: document.getElementById('endOverlay'), endTitle: document.getElementById('endTitle'), finalScore: document.getElementById('finalScore') };
//   const keys = new Set();
//   const imageFiles = cfg.images || {}, soundFiles = cfg.sounds || {};
//   const images = {}, sounds = {};
//   for (const [key, path] of Object.entries(imageFiles)) { if (path) { const im = new Image(); im.src = path; images[key] = im; } }
//   let audioReady = false, state = 'title', last = 0, accumulator = 0, toastTimer = 0, score = 0, distance = 0, best = Number(localStorage.getItem('forestHunterBest') || 0), elapsed = 0, nextHeart = 450, worldOffset = 0, trackIndex = 0, metersToNextWave = 180;
//   ui.best.textContent = best;
//   const hunter = { x: W * .24, y: H * .53, angle: 0, lives: tuning.hunterLives, invuln: 0, walk: 0, shootFlash: 0, hitAnim: 0 };
//   let bushes = [], enemies = [], bullets = [], pickups = [], particles = [];
//   const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
//   const rand = (a, b) => a + Math.random() * (b - a);
//   function loadSound(name) { const p = soundFiles[name]; if (!p) return null; const a = new Audio(p); a.preload = 'auto'; return a; }
//   for (const n of Object.keys(soundFiles)) if (soundFiles[n]) sounds[n] = loadSound(n);
//   function playSound(name) { const a = sounds[name]; if (!a) return; try { a.currentTime = 0; const copy = a.cloneNode(); copy.volume = name === 'ambience' ? .25 : .8; copy.play().catch(() => { }); } catch (_) { } }
//   function toast(text) { ui.toast.textContent = text; ui.toast.classList.add('show'); toastTimer = 1.7; }
//   function makeBush(x, y, count = 1) { return { x, y, r: Math.random() < .28 ? rand(29, 36) : rand(19, 25), count, triggered: false, dead: false, shade: Math.floor(rand(0, 3)), spawnWait: 0 }; }
//   function reset() { score = 0; distance = 0; elapsed = 0; nextHeart = tuning.heartEveryMeters; worldOffset = 0; trackIndex = 0; metersToNextWave = 180; hunter.x = W * .18; hunter.y = H * .53; hunter.angle = 0; hunter.lives = tuning.hunterLives; hunter.invuln = 0; hunter.walk = 0; hunter.shootFlash = 0; hunter.hitAnim = 0; enemies = []; bullets = []; pickups = []; particles = []; bushes = []; for (let i = 0; i < tuning.bushCount; i++)bushes.push(makeBush(rand(W * .58, W + 120), rand(165, H - 45), 1)); updateHud(); }
//   function updateHud() { ui.score.textContent = String(score).padStart(6, '0'); ui.lives.textContent = Array.from({ length: tuning.hunterLives }, (_, i) => i < hunter.lives ? '♥' : '♡').join(' '); ui.distance.textContent = Math.floor(distance) + ' m'; }
//   function start() { reset(); state = 'playing'; ui.start.classList.add('hidden'); ui.end.classList.add('hidden'); last = performance.now(); accumulator = 0; }
//   function finish() { state = 'over'; ui.finalScore.textContent = score; ui.endTitle.textContent = hunter.lives > 0 ? 'RUN PAUSED' : 'YOU WERE CAUGHT'; if (score > best) { best = score; localStorage.setItem('forestHunterBest', String(best)); ui.best.textContent = best; } ui.end.classList.remove('hidden'); }
//   function pause() { if (state === 'playing') { state = 'paused'; toast('PAUSED — PRESS P TO RESUME'); } else if (state === 'paused') { state = 'playing'; last = performance.now(); } }
//   function spawnEnemy(b) { if (b.count <= 0 || enemies.filter(e => e.alive).length >= tuning.maxActiveCavemen) return; b.count--; b.triggered = true; b.spawnWait = 0.55; const e = { x: b.x, y: b.y, source: b, alive: true, hitFlash: 0, walk: 0, waiting: false }; enemies.push(e); playSound('cavemanScream'); for (let i = 0; i < 8; i++)particles.push({ x: b.x, y: b.y, vx: rand(-45, 45), vy: rand(-45, 45), life: rand(.15, .4), color: '#d4d18b' }); }
//   function shoot() { if (state !== 'playing' || hunter.hitAnim > 0) return; const speed = 470; bullets.push({ x: hunter.x + Math.cos(hunter.angle) * 22, y: hunter.y + Math.sin(hunter.angle) * 22, vx: Math.cos(hunter.angle) * speed, vy: Math.sin(hunter.angle) * speed, life: .65 }); hunter.shootFlash = .08; playSound('gunshot'); for (let i = 0; i < 3; i++)particles.push({ x: hunter.x + Math.cos(hunter.angle) * 20, y: hunter.y + Math.sin(hunter.angle) * 20, vx: rand(-30, 30) + Math.cos(hunter.angle) * 70, vy: rand(-30, 30) + Math.sin(hunter.angle) * 70, life: .12, color: '#ffe9a0' }); }
//   function update(dt) {
//     if (state !== 'playing') return; elapsed += dt; hunter.invuln = Math.max(0, hunter.invuln - dt); hunter.shootFlash = Math.max(0, hunter.shootFlash - dt); hunter.hitAnim = Math.max(0, hunter.hitAnim - dt);
//     const inHitReaction = hunter.hitAnim > 0;
//     let dx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
//     let dy = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
//     const len = Math.hypot(dx, dy) || 1;
//     if (!inHitReaction && (dx || dy)) {
//       const step = tuning.hunterSpeed * dt / len;
//       // Mario-like movement: move the hunter normally, then scroll the world at the track edges.
//       if (dx > 0) {
//         if (hunter.x < W * .31) { hunter.x += step; }
//         else { distance += step; worldOffset = (worldOffset + step) % W; for (const b of bushes) b.x -= step; for (const e of enemies) e.x -= step; for (const p of pickups) p.x -= step; for (const b of bullets) b.x -= step; }
//       } else if (dx < 0) {
//         if (hunter.x > W * .13) { hunter.x -= step; }
//         else { const shift = Math.min(step, Math.max(0, W * .70 - hunter.x)); for (const b of bushes) b.x += shift; for (const e of enemies) e.x += shift; for (const p of pickups) p.x += shift; for (const b of bullets) b.x += shift; distance = Math.max(0, distance - shift); }
//       }
//       hunter.y += dy / len * tuning.hunterSpeed * dt; hunter.walk += dt * 11;
//     }
//     hunter.x = clamp(hunter.x, W * .12, W * .31); hunter.y = clamp(hunter.y, 150, H - 25);
//     hunter.angle = Math.atan2(mouse.y - hunter.y, mouse.x - hunter.x);
//     // Bushes only trigger after the hunter has passed the opening stretch; waves are spread along the endless track.
//     for (const b of bushes) {
//       if (!b.triggered && b.count > 0 && distance >= 180 && Math.hypot(hunter.x - b.x, hunter.y - b.y) < Math.max(tuning.spawnNearDistance, b.r + 75)) {
//         b.triggered = true; b.spawnWait = .35;
//       }
//       if (b.triggered && b.count > 0 && !enemies.some(e => e.alive && e.source === b)) {
//         b.spawnWait = Math.max(0, b.spawnWait - dt);
//         if (!inHitReaction && b.spawnWait <= 0 && enemies.filter(e => e.alive).length < tuning.maxActiveCavemen) spawnEnemy(b);
//       }
//     }
//     // Refill the path ahead so encounters keep arriving as the hunter advances, never at the starting point.
//     for (let i = 0; i < bushes.length; i++) {
//       const b = bushes[i];
//       if (b.x < -Math.max(65, b.r + 15)) {
//         bushes[i] = makeBush(W + rand(90, 280), rand(165, H - 45), 1); trackIndex++;
//       }
//     }
//     for (const e of enemies) {
//       if (!e.alive) continue; e.walk += dt * 10; e.hitFlash = Math.max(0, e.hitFlash - dt); const ex = hunter.x - e.x, ey = hunter.y - e.y, d = Math.hypot(ex, ey) || 1;
//       e.waiting = inHitReaction;
//       if (!inHitReaction) { const a = Math.atan2(ey, ex); e.x += Math.cos(a) * tuning.cavemanSpeed * dt; e.y += Math.sin(a) * tuning.cavemanSpeed * dt; }
//       if (!inHitReaction && d < tuning.contactDistance && hunter.invuln <= 0) { e.alive = false; hunter.lives--; hunter.invuln = 3.05; hunter.hitAnim = 3; playSound('hunterHit'); toast(hunter.lives <= 0 ? 'FATAL HIT! — 3 SECOND FINAL REACTION' : 'HIT! — 3 SECOND RECOVERY'); for (let i = 0; i < 15; i++)particles.push({ x: hunter.x, y: hunter.y, vx: rand(-100, 100), vy: rand(-100, 100), life: rand(.2, .65), color: '#e16d50' }); }
//     }
//     for (const b of bullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; for (const e of enemies) { if (e.alive && Math.hypot(b.x - e.x, b.y - e.y) < 21) { e.alive = false; b.life = 0; score += 100; playSound('cavemanDeath'); for (let i = 0; i < 13; i++)particles.push({ x: e.x, y: e.y, vx: rand(-85, 85), vy: rand(-85, 85), life: rand(.2, .55), color: i % 2 ? '#bb6f49' : '#ead28a' }); break; } } }
//     bullets = bullets.filter(b => b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20); enemies = enemies.filter(e => e.alive);
//     if (distance >= nextHeart) { pickups.push({ x: rand(55, W - 55), y: rand(175, H - 50), life: 12 }); nextHeart += tuning.heartEveryMeters; toast('A HEART HAS APPEARED'); }
//     for (const p of pickups) { p.life -= dt; if (Math.hypot(hunter.x - p.x, hunter.y - p.y) < 24) { p.life = 0; if (hunter.lives < tuning.hunterLives) { hunter.lives++; toast('LIFE RESTORED'); } else { score += 150; toast('FULL HEALTH — BONUS SCORE'); } } }
//     pickups = pickups.filter(p => p.life > 0);
//     for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= .96; p.vy *= .96; } particles = particles.filter(p => p.life > 0);
//     if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) ui.toast.classList.remove('show'); } updateHud();
//     if (hunter.lives <= 0 && hunter.hitAnim <= 0) { finish(); return; }
//   }
//   const mouse = { x: W * .65, y: H * .5 };
//   function canvasMouse(e) { const r = canvas.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * W; mouse.y = (e.clientY - r.top) / r.height * H; }
//   canvas.addEventListener('mousemove', canvasMouse); canvas.addEventListener('contextmenu', e => e.preventDefault()); canvas.addEventListener('mousedown', e => { canvasMouse(e); if (e.button === 0) shoot(); });
//   window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault(); keys.add(k); if (k === 'p') pause(); if (k === ' ' && state === 'playing') shoot(); }); window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
//   function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
//   function drawImageOr(key, x, y, w, h, drawFallback) { const im = images[key]; if (im && im.complete && im.naturalWidth) { ctx.drawImage(im, x, y, w, h); } else drawFallback(); }
//   function drawTreeBand(y, flip = false) { drawImageOr(flip ? 'forestBottom' : 'forestTop', 0, y, W, flip ? H - y : 145, () => { rect(0, y, W, flip ? H - y : 145, '#294b32'); for (let x = -35 - (worldOffset % 95); x < W + 50; x += 95) { const h = rand(0, 0); void h; const xx = x; rect(xx + 9, y + 15, 12, 75, '#493b2a'); rect(xx - 9, y + 4, 48, 39, '#386a3b'); rect(xx - 17, y + 20, 48, 36, '#315b35'); rect(xx + 2, y + 31, 38, 28, '#477943'); rect(xx + 1, y + 9, 4, 4, '#729451'); } }); }
//   function drawGround() { drawImageOr('ground', 0, 140, W, H - 140, () => { rect(0, 140, W, H - 140, '#a2b96a'); for (let y = 150; y < H; y += 27) { for (let x = ((y * 13) % 41) - worldOffset % 41; x < W; x += 41) { rect(x, y, 3, 2, '#8aa457'); rect(x + 14, y + 9, 2, 2, '#c1ca79'); } } rect(0, 140, W, 8, '#526c3c'); rect(0, H - 9, W, 9, '#526c3c'); }); }
//   function drawBush(b) { drawImageOr('bush', b.x - b.r - 8, b.y - b.r - 7, (b.r + 8) * 2, (b.r + 7) * 2, () => { const colors = [['#315c32', '#3e7339', '#4f8844'], ['#35532e', '#486b36', '#658347'], ['#254f35', '#37704a', '#4c8955']][b.shade]; rect(b.x - b.r * .8, b.y - b.r * .45, b.r * 1.6, b.r * 1.1, colors[0]); rect(b.x - b.r, b.y - b.r * .2, b.r * .9, b.r * .8, colors[1]); rect(b.x - b.r * .3, b.y - b.r * .8, b.r * 1.05, b.r * .9, colors[2]); rect(b.x + b.r * .15, b.y - b.r * .6, b.r * .65, b.r * .65, colors[1]); rect(b.x - b.r * .5, b.y - b.r * .25, 5, 4, '#8fb05c'); }); }
//   function drawPerson(x, y, angle, walk, isHunter, hit = false) { const key = isHunter ? 'hunter' : 'caveman'; drawImageOr(key, x - 22, y - 25, 44, 50, () => { ctx.save(); ctx.translate(Math.round(x), Math.round(y + Math.sin(walk) * 2)); if (!isHunter) ctx.rotate(angle); if (hit) { rect(-19, -25, 38, 50, '#e2a07a'); rect(-16, -22, 32, 44, '#d84f46'); ctx.restore(); return; } const bob = Math.sin(walk) * 2; rect(-9, -9 + bob, 18, 20, isHunter ? '#d8c6a0' : '#8a4e31'); rect(-10, -23 + bob, 20, 15, isHunter ? '#d7b28b' : '#5a3826'); rect(-9, -26 + bob, 18, 7, isHunter ? '#4e4b35' : '#3b2921'); rect(-13, -2 + bob, 6, 17, isHunter ? '#e1c4a0' : '#8c5938'); rect(7, -2 + bob, 6, 17, isHunter ? '#e1c4a0' : '#8c5938'); rect(-8, 10 + bob + (Math.sin(walk) * 2), 7, 14, '#393d2d'); rect(2, 10 + bob - (Math.sin(walk) * 2), 7, 14, '#393d2d'); rect(-7, -18 + bob, 3, 3, '#171a14'); rect(4, -18 + bob, 3, 3, '#171a14'); if (isHunter) { rect(-8, -4 + bob, 23, 5, '#343a35'); rect(12, -6 + bob, 8, 9, '#252b26'); } else { rect(12, -4 + bob, 9, 5, '#6e412b'); rect(14, -10 + bob, 4, 5, '#e2c48a'); } ctx.restore(); }); }
//   function draw() {
//     ctx.clearRect(0, 0, W, H); drawGround(); drawTreeBand(0); drawTreeBand(H - 100, true);
//     // Bushes are foreground cover; a hidden caveman only appears when triggered.
//     for (const b of bushes) drawBush(b);
//     for (const p of pickups) { rect(p.x - 9, p.y - 9, 18, 18, '#f6e8c9'); rect(p.x - 7, p.y - 5, 6, 6, '#e04e4e'); rect(p.x + 1, p.y - 5, 6, 6, '#e04e4e'); rect(p.x - 5, p.y, 10, 7, '#e04e4e'); }
//     for (const b of bullets) { rect(b.x - 3, b.y - 2, 7, 4, '#ffe8a0'); }
//     for (const e of enemies) { drawPerson(e.x, e.y, Math.atan2(hunter.y - e.y, hunter.x - e.x), e.walk, false, false); if (e.waiting) { ctx.fillStyle = '#f6e8c9'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText('WAIT', e.x, e.y - 31); } }
//     if (hunter.hitAnim > 0) { const im = images.hitAnimation; if (im && im.complete && im.naturalWidth) ctx.drawImage(im, hunter.x - 52, hunter.y - 52, 104, 104); else { ctx.save(); ctx.globalAlpha = .78; rect(hunter.x - 28, hunter.y - 35, 56, 70, '#c94c3e'); rect(hunter.x - 20, hunter.y - 27, 40, 54, '#f0d6a1'); rect(hunter.x - 17, hunter.y - 22, 7, 7, '#171c19'); rect(hunter.x + 10, hunter.y - 22, 7, 7, '#171c19'); rect(hunter.x - 14, hunter.y + 9, 28, 5, '#171c19'); ctx.restore(); } } else if (hunter.invuln <= 0 || Math.floor(elapsed * 12) % 2 === 0) drawPerson(hunter.x, hunter.y, hunter.angle, hunter.walk, true, false);
//     // Draw the weapon independently: the hunter's body never spins, but the gun follows the mouse.
//     if (hunter.hitAnim <= 0) { ctx.save(); ctx.translate(hunter.x, hunter.y); ctx.rotate(hunter.angle); rect(3, -5, 25, 6, '#343a35'); rect(24, -7, 9, 10, '#252b26'); ctx.restore(); }
//     if (hunter.shootFlash > 0) { ctx.strokeStyle = '#fff0ae'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hunter.x + Math.cos(hunter.angle) * 24, hunter.y + Math.sin(hunter.angle) * 24); ctx.lineTo(hunter.x + Math.cos(hunter.angle) * 43, hunter.y + Math.sin(hunter.angle) * 43); ctx.stroke(); }
//     for (const p of particles) { ctx.globalAlpha = clamp(p.life * 3, 0, 1); rect(p.x, p.y, 4, 4, p.color); ctx.globalAlpha = 1; }
//     // Small aim marker
//     ctx.strokeStyle = '#f9edc4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 7, 0, Math.PI * 2); ctx.moveTo(mouse.x - 11, mouse.y); ctx.lineTo(mouse.x - 4, mouse.y); ctx.moveTo(mouse.x + 4, mouse.y); ctx.lineTo(mouse.x + 11, mouse.y); ctx.moveTo(mouse.x, mouse.y - 11); ctx.lineTo(mouse.x, mouse.y - 4); ctx.moveTo(mouse.x, mouse.y + 4); ctx.lineTo(mouse.x, mouse.y + 11); ctx.stroke();
//     if (state === 'paused') { rect(0, 0, W, H, '#0d120c99'); ctx.fillStyle = '#fff1c9'; ctx.font = '18px monospace'; ctx.textAlign = 'center'; ctx.fillText('PAUSED — PRESS P TO CONTINUE', W / 2, H / 2); }
//   }
//   function loop(now) { const frame = 1000 / tuning.fps; if (!last) last = now; let delta = Math.min(.1, (now - last) / 1000); last = now; accumulator += delta; while (accumulator >= 1 / tuning.fps) { update(1 / tuning.fps); accumulator -= 1 / tuning.fps; } draw(); requestAnimationFrame(loop); }
//   document.getElementById('startBtn').addEventListener('click', start); document.getElementById('restartBtn').addEventListener('click', start); document.getElementById('pauseBtn').addEventListener('click', pause);
//   reset(); requestAnimationFrame(loop);
// })();

// (() => {
//   'use strict';
//   const cfg = window.GAME_ASSETS || {};
//   const tuning = Object.assign({ fps: 30, hunterSpeed: 155, hunterLives: 5, bushCount: 13, maxQueuedCavemenPerBush: 1, maxActiveCavemen: 3, cavemanSpeed: 175, spawnNearDistance: 125, contactDistance: 28, queueWaitDistance: 66, heartEveryMeters: 450 }, cfg.tuning || {});
//   const canvas = document.getElementById('game');
//   const ctx = canvas.getContext('2d');
//   ctx.imageSmoothingEnabled = false;
//   const W = canvas.width, H = canvas.height;
//   const ui = { score: document.getElementById('score'), lives: document.getElementById('lives'), distance: document.getElementById('distance'), best: document.getElementById('best'), toast: document.getElementById('toast'), start: document.getElementById('startOverlay'), end: document.getElementById('endOverlay'), endTitle: document.getElementById('endTitle'), finalScore: document.getElementById('finalScore') };
//   const keys = new Set();
//   const imageFiles = cfg.images || {}, soundFiles = cfg.sounds || {};
//   const images = {}, sounds = {};
//   for (const [key, path] of Object.entries(imageFiles)) { if (path) { const im = new Image(); im.src = path; images[key] = im; } }
//   let audioReady = false, state = 'title', last = 0, accumulator = 0, toastTimer = 0, score = 0, distance = 0, best = Number(localStorage.getItem('forestHunterBest') || 0), elapsed = 0, nextHeart = 450, worldOffset = 0, trackIndex = 0, metersToNextWave = 180;
//   ui.best.textContent = best;
//   const hunter = { x: W * .24, y: H * .53, angle: 0, lives: tuning.hunterLives, invuln: 0, walk: 0, shootFlash: 0, hitAnim: 0 };
//   let bushes = [], enemies = [], bullets = [], pickups = [], particles = [];
//   const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
//   const rand = (a, b) => a + Math.random() * (b - a);
//   function loadSound(name) { const p = soundFiles[name]; if (!p) return null; const a = new Audio(p); a.preload = 'auto'; return a; }
//   for (const n of Object.keys(soundFiles)) if (soundFiles[n]) sounds[n] = loadSound(n);
//   function playSound(name) { const a = sounds[name]; if (!a) return; try { a.currentTime = 0; const copy = a.cloneNode(); copy.volume = name === 'ambience' ? .25 : .8; copy.play().catch(() => { }); } catch (_) { } }

//   // Background music: loop while the game is active.
//   const backgroundMusic = soundFiles.ambience ? new Audio(soundFiles.ambience) : null;
//   if (backgroundMusic) {
//     backgroundMusic.loop = true;
//     backgroundMusic.preload = 'auto';
//     backgroundMusic.volume = 0.25;
//   }
//   function startBackgroundMusic() {
//     if (!backgroundMusic) return;
//     backgroundMusic.play().catch(() => { });
//   }
//   function stopBackgroundMusic() {
//     if (!backgroundMusic) return;
//     backgroundMusic.pause();
//     backgroundMusic.currentTime = 0;
//   }

//   function toast(text) { ui.toast.textContent = text; ui.toast.classList.add('show'); toastTimer = 1.7; }
//   function makeBush(x, y, count = 1) { return { x, y, r: Math.random() < .28 ? rand(29, 36) : rand(19, 25), count, triggered: false, dead: false, shade: Math.floor(rand(0, 3)), spawnWait: 0 }; }
//   function reset() { score = 0; distance = 0; elapsed = 0; nextHeart = tuning.heartEveryMeters; worldOffset = 0; trackIndex = 0; metersToNextWave = 180; hunter.x = W * .18; hunter.y = H * .53; hunter.angle = 0; hunter.lives = tuning.hunterLives; hunter.invuln = 0; hunter.walk = 0; hunter.shootFlash = 0; hunter.hitAnim = 0; enemies = []; bullets = []; pickups = []; particles = []; bushes = []; for (let i = 0; i < tuning.bushCount; i++)bushes.push(makeBush(rand(W * .58, W + 120), rand(165, H - 45), 1)); updateHud(); }
//   function updateHud() { ui.score.textContent = String(score).padStart(6, '0'); ui.lives.textContent = Array.from({ length: tuning.hunterLives }, (_, i) => i < hunter.lives ? '♥' : '♡').join(' '); ui.distance.textContent = Math.floor(distance) + ' m'; }
//   function start() { reset(); state = 'playing'; ui.start.classList.add('hidden'); ui.end.classList.add('hidden'); last = performance.now(); accumulator = 0; startBackgroundMusic(); }
//   function finish() { state = 'over'; stopBackgroundMusic(); ui.finalScore.textContent = score; ui.endTitle.textContent = hunter.lives > 0 ? 'RUN PAUSED' : 'YOU WERE CAUGHT'; if (score > best) { best = score; localStorage.setItem('forestHunterBest', String(best)); ui.best.textContent = best; } ui.end.classList.remove('hidden'); }
//   function pause() { if (state === 'playing') { state = 'paused'; toast('PAUSED — PRESS P TO RESUME'); } else if (state === 'paused') { state = 'playing'; last = performance.now(); } }
//   function spawnEnemy(b) { if (b.count <= 0 || enemies.filter(e => e.alive).length >= tuning.maxActiveCavemen) return; b.count--; b.triggered = true; b.spawnWait = 0.55; const e = { x: b.x, y: b.y, source: b, alive: true, hitFlash: 0, walk: 0, waiting: false }; enemies.push(e); playSound('cavemanScream'); for (let i = 0; i < 8; i++)particles.push({ x: b.x, y: b.y, vx: rand(-45, 45), vy: rand(-45, 45), life: rand(.15, .4), color: '#d4d18b' }); }
//   function shoot() { if (state !== 'playing' || hunter.hitAnim > 0) return; const speed = 470; bullets.push({ x: hunter.x + Math.cos(hunter.angle) * 22, y: hunter.y + Math.sin(hunter.angle) * 22, vx: Math.cos(hunter.angle) * speed, vy: Math.sin(hunter.angle) * speed, life: .65 }); hunter.shootFlash = .08; playSound('gunshot'); for (let i = 0; i < 3; i++)particles.push({ x: hunter.x + Math.cos(hunter.angle) * 20, y: hunter.y + Math.sin(hunter.angle) * 20, vx: rand(-30, 30) + Math.cos(hunter.angle) * 70, vy: rand(-30, 30) + Math.sin(hunter.angle) * 70, life: .12, color: '#ffe9a0' }); }
//   function update(dt) {
//     if (state !== 'playing') return; elapsed += dt; hunter.invuln = Math.max(0, hunter.invuln - dt); hunter.shootFlash = Math.max(0, hunter.shootFlash - dt); hunter.hitAnim = Math.max(0, hunter.hitAnim - dt);
//     const inHitReaction = hunter.hitAnim > 0;
//     let dx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
//     let dy = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
//     const len = Math.hypot(dx, dy) || 1;
//     if (!inHitReaction && (dx || dy)) {
//       const step = tuning.hunterSpeed * dt / len;
//       // Mario-like movement: move the hunter normally, then scroll the world at the track edges.
//       if (dx > 0) {
//         if (hunter.x < W * .31) { hunter.x += step; }
//         else { distance += step; worldOffset = (worldOffset + step) % W; for (const b of bushes) b.x -= step; for (const e of enemies) e.x -= step; for (const p of pickups) p.x -= step; for (const b of bullets) b.x -= step; }
//       } else if (dx < 0) {
//         if (hunter.x > W * .13) { hunter.x -= step; }
//         else { const shift = Math.min(step, Math.max(0, W * .70 - hunter.x)); for (const b of bushes) b.x += shift; for (const e of enemies) e.x += shift; for (const p of pickups) p.x += shift; for (const b of bullets) b.x += shift; distance = Math.max(0, distance - shift); }
//       }
//       hunter.y += dy / len * tuning.hunterSpeed * dt; hunter.walk += dt * 11;
//     }
//     hunter.x = clamp(hunter.x, W * .12, W * .31); hunter.y = clamp(hunter.y, 150, H - 25);
//     hunter.angle = Math.atan2(mouse.y - hunter.y, mouse.x - hunter.x);
//     // Bushes only trigger after the hunter has passed the opening stretch; waves are spread along the endless track.
//     for (const b of bushes) {
//       if (!b.triggered && b.count > 0 && distance >= 180 && Math.hypot(hunter.x - b.x, hunter.y - b.y) < Math.max(tuning.spawnNearDistance, b.r + 75)) {
//         b.triggered = true; b.spawnWait = .35;
//       }
//       if (b.triggered && b.count > 0 && !enemies.some(e => e.alive && e.source === b)) {
//         b.spawnWait = Math.max(0, b.spawnWait - dt);
//         if (!inHitReaction && b.spawnWait <= 0 && enemies.filter(e => e.alive).length < tuning.maxActiveCavemen) spawnEnemy(b);
//       }
//     }
//     // Refill the path ahead so encounters keep arriving as the hunter advances, never at the starting point.
//     for (let i = 0; i < bushes.length; i++) {
//       const b = bushes[i];
//       if (b.x < -Math.max(65, b.r + 15)) {
//         bushes[i] = makeBush(W + rand(90, 280), rand(165, H - 45), 1); trackIndex++;
//       }
//     }
//     for (const e of enemies) {
//       if (!e.alive) continue; e.walk += dt * 10; e.hitFlash = Math.max(0, e.hitFlash - dt); const ex = hunter.x - e.x, ey = hunter.y - e.y, d = Math.hypot(ex, ey) || 1;
//       e.waiting = inHitReaction;
//       if (!inHitReaction) { const a = Math.atan2(ey, ex); e.x += Math.cos(a) * tuning.cavemanSpeed * dt; e.y += Math.sin(a) * tuning.cavemanSpeed * dt; }
//       if (!inHitReaction && d < tuning.contactDistance && hunter.invuln <= 0) { e.alive = false; hunter.lives--; hunter.invuln = 3.05; hunter.hitAnim = 3; playSound('hunterHit'); toast(hunter.lives <= 0 ? 'FATAL HIT! — 3 SECOND FINAL REACTION' : 'HIT! — 3 SECOND RECOVERY'); for (let i = 0; i < 15; i++)particles.push({ x: hunter.x, y: hunter.y, vx: rand(-100, 100), vy: rand(-100, 100), life: rand(.2, .65), color: '#e16d50' }); }
//     }
//     for (const b of bullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; for (const e of enemies) { if (e.alive && Math.hypot(b.x - e.x, b.y - e.y) < 21) { e.alive = false; b.life = 0; score += 100; playSound('cavemanDeath'); for (let i = 0; i < 13; i++)particles.push({ x: e.x, y: e.y, vx: rand(-85, 85), vy: rand(-85, 85), life: rand(.2, .55), color: i % 2 ? '#bb6f49' : '#ead28a' }); break; } } }
//     bullets = bullets.filter(b => b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20); enemies = enemies.filter(e => e.alive);
//     if (distance >= nextHeart) { pickups.push({ x: rand(55, W - 55), y: rand(175, H - 50), life: 12 }); nextHeart += tuning.heartEveryMeters; toast('A HEART HAS APPEARED'); }
//     for (const p of pickups) { p.life -= dt; if (Math.hypot(hunter.x - p.x, hunter.y - p.y) < 24) { p.life = 0; if (hunter.lives < tuning.hunterLives) { hunter.lives++; toast('LIFE RESTORED'); } else { score += 150; toast('FULL HEALTH — BONUS SCORE'); } } }
//     pickups = pickups.filter(p => p.life > 0);
//     for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= .96; p.vy *= .96; } particles = particles.filter(p => p.life > 0);
//     if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) ui.toast.classList.remove('show'); } updateHud();
//     if (hunter.lives <= 0 && hunter.hitAnim <= 0) { finish(); return; }
//   }
//   const mouse = { x: W * .65, y: H * .5 };
//   function canvasMouse(e) { const r = canvas.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * W; mouse.y = (e.clientY - r.top) / r.height * H; }
//   canvas.addEventListener('mousemove', canvasMouse); canvas.addEventListener('contextmenu', e => e.preventDefault()); canvas.addEventListener('mousedown', e => { canvasMouse(e); if (e.button === 0) shoot(); });
//   window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault(); keys.add(k); if (k === 'p') pause(); if (k === ' ' && state === 'playing') shoot(); }); window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
//   function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
//   function drawImageOr(key, x, y, w, h, drawFallback) { const im = images[key]; if (im && im.complete && im.naturalWidth) { ctx.drawImage(im, x, y, w, h); } else drawFallback(); }
//   function drawTreeBand(y, flip = false) { drawImageOr(flip ? 'forestBottom' : 'forestTop', 0, y, W, flip ? H - y : 145, () => { rect(0, y, W, flip ? H - y : 145, '#294b32'); for (let x = -35 - (worldOffset % 95); x < W + 50; x += 95) { const h = rand(0, 0); void h; const xx = x; rect(xx + 9, y + 15, 12, 75, '#493b2a'); rect(xx - 9, y + 4, 48, 39, '#386a3b'); rect(xx - 17, y + 20, 48, 36, '#315b35'); rect(xx + 2, y + 31, 38, 28, '#477943'); rect(xx + 1, y + 9, 4, 4, '#729451'); } }); }
//   function drawGround() { drawImageOr('ground', 0, 140, W, H - 140, () => { rect(0, 140, W, H - 140, '#a2b96a'); for (let y = 150; y < H; y += 27) { for (let x = ((y * 13) % 41) - worldOffset % 41; x < W; x += 41) { rect(x, y, 3, 2, '#8aa457'); rect(x + 14, y + 9, 2, 2, '#c1ca79'); } } rect(0, 140, W, 8, '#526c3c'); rect(0, H - 9, W, 9, '#526c3c'); }); }
//   function drawBush(b) { drawImageOr('bush', b.x - b.r - 8, b.y - b.r - 7, (b.r + 8) * 2, (b.r + 7) * 2, () => { const colors = [['#315c32', '#3e7339', '#4f8844'], ['#35532e', '#486b36', '#658347'], ['#254f35', '#37704a', '#4c8955']][b.shade]; rect(b.x - b.r * .8, b.y - b.r * .45, b.r * 1.6, b.r * 1.1, colors[0]); rect(b.x - b.r, b.y - b.r * .2, b.r * .9, b.r * .8, colors[1]); rect(b.x - b.r * .3, b.y - b.r * .8, b.r * 1.05, b.r * .9, colors[2]); rect(b.x + b.r * .15, b.y - b.r * .6, b.r * .65, b.r * .65, colors[1]); rect(b.x - b.r * .5, b.y - b.r * .25, 5, 4, '#8fb05c'); }); }
//   function drawPerson(x, y, angle, walk, isHunter, hit = false) { const key = isHunter ? 'hunter' : 'caveman'; drawImageOr(key, x - 22, y - 25, 44, 50, () => { ctx.save(); ctx.translate(Math.round(x), Math.round(y + Math.sin(walk) * 2)); if (!isHunter) ctx.rotate(angle); if (hit) { rect(-19, -25, 38, 50, '#e2a07a'); rect(-16, -22, 32, 44, '#d84f46'); ctx.restore(); return; } const bob = Math.sin(walk) * 2; rect(-9, -9 + bob, 18, 20, isHunter ? '#d8c6a0' : '#8a4e31'); rect(-10, -23 + bob, 20, 15, isHunter ? '#d7b28b' : '#5a3826'); rect(-9, -26 + bob, 18, 7, isHunter ? '#4e4b35' : '#3b2921'); rect(-13, -2 + bob, 6, 17, isHunter ? '#e1c4a0' : '#8c5938'); rect(7, -2 + bob, 6, 17, isHunter ? '#e1c4a0' : '#8c5938'); rect(-8, 10 + bob + (Math.sin(walk) * 2), 7, 14, '#393d2d'); rect(2, 10 + bob - (Math.sin(walk) * 2), 7, 14, '#393d2d'); rect(-7, -18 + bob, 3, 3, '#171a14'); rect(4, -18 + bob, 3, 3, '#171a14'); if (isHunter) { rect(-8, -4 + bob, 23, 5, '#343a35'); rect(12, -6 + bob, 8, 9, '#252b26'); } else { rect(12, -4 + bob, 9, 5, '#6e412b'); rect(14, -10 + bob, 4, 5, '#e2c48a'); } ctx.restore(); }); }

//   // function draw() {

//   //   ctx.clearRect(0, 0, W, H); drawGround(); drawTreeBand(0); drawTreeBand(H - 100, true);

//   //   // Bushes are foreground cover; a hidden caveman only appears when triggered.

//   //   for (const b of bushes) drawBush(b);

//   //   for (const p of pickups) { rect(p.x - 9, p.y - 9, 18, 18, '#f6e8c9'); rect(p.x - 7, p.y - 5, 6, 6, '#e04e4e'); rect(p.x + 1, p.y - 5, 6, 6, '#e04e4e'); rect(p.x - 5, p.y, 10, 7, '#e04e4e'); }

//   //   for (const b of bullets) { rect(b.x - 3, b.y - 2, 7, 4, '#ffe8a0'); }

//   //   for (const e of enemies) { drawPerson(e.x, e.y, Math.atan2(hunter.y - e.y, hunter.x - e.x), e.walk, false, false); if (e.waiting) { ctx.fillStyle = '#f6e8c9'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText('WAIT', e.x, e.y - 31); } }

//   //   // Hit animation: display at the same size as the character.
//   //   if (hunter.hitAnim > 0) {
//   //     const im = images.hitAnimation;

//   //     if (im && im.complete && im.naturalWidth) {
//   //       ctx.drawImage(im, hunter.x - 22, hunter.y - 25, 44, 50);
//   //     } else {
//   //       ctx.save();
//   //       ctx.globalAlpha = .78;
//   //       rect(hunter.x - 28, hunter.y - 35, 56, 70, '#c94c3e');
//   //       rect(hunter.x - 20, hunter.y - 27, 40, 54, '#f0d6a1');
//   //       rect(hunter.x - 17, hunter.y - 22, 7, 7, '#171c19');
//   //       rect(hunter.x + 10, hunter.y - 22, 7, 7, '#171c19');
//   //       rect(hunter.x - 14, hunter.y + 9, 28, 5, '#171c19');
//   //       ctx.restore();
//   //     }
//   //   } else if (hunter.invuln <= 0 || Math.floor(elapsed * 12) % 2 === 0) {
//   //     drawPerson(hunter.x, hunter.y, hunter.angle, hunter.walk, true, false);
//   //   }

//   //   // Draw the weapon independently: the hunter's body never spins, but the gun follows the mouse.

//   //   if (hunter.hitAnim <= 0) { ctx.save(); ctx.translate(hunter.x, hunter.y); ctx.rotate(hunter.angle); rect(3, -5, 25, 6, '#343a35'); rect(24, -7, 9, 10, '#252b26'); ctx.restore(); }

//   //   if (hunter.shootFlash > 0) { ctx.strokeStyle = '#fff0ae'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hunter.x + Math.cos(hunter.angle) * 24, hunter.y + Math.sin(hunter.angle) * 24); ctx.lineTo(hunter.x + Math.cos(hunter.angle) * 43, hunter.y + Math.sin(hunter.angle) * 43); ctx.stroke(); }

//   //   for (const p of particles) { ctx.globalAlpha = clamp(p.life * 3, 0, 1); rect(p.x, p.y, 4, 4, p.color); ctx.globalAlpha = 1; }

//   //   // Small aim marker

//   //   ctx.strokeStyle = '#f9edc4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 7, 0, Math.PI * 2); ctx.moveTo(mouse.x - 11, mouse.y); ctx.lineTo(mouse.x - 4, mouse.y); ctx.moveTo(mouse.x + 4, mouse.y); ctx.lineTo(mouse.x + 11, mouse.y); ctx.moveTo(mouse.x, mouse.y - 11); ctx.lineTo(mouse.x, mouse.y - 4); ctx.moveTo(mouse.x, mouse.y + 4); ctx.lineTo(mouse.x, mouse.y + 11); ctx.stroke();

//   //   if (state === 'paused') { rect(0, 0, W, H, '#0d120c99'); ctx.fillStyle = '#fff1c9'; ctx.font = '18px monospace'; ctx.textAlign = 'center'; ctx.fillText('PAUSED — PRESS P TO CONTINUE', W / 2, H / 2); }

//   // }


//   function draw() {

//     ctx.clearRect(0, 0, W, H); drawGround(); drawTreeBand(0); drawTreeBand(H - 100, true);

//     // Bushes are foreground cover; a hidden caveman only appears when triggered.

//     for (const b of bushes) drawBush(b);

//     for (const p of pickups) { rect(p.x - 9, p.y - 9, 18, 18, '#f6e8c9'); rect(p.x - 7, p.y - 5, 6, 6, '#e04e4e'); rect(p.x + 1, p.y - 5, 6, 6, '#e04e4e'); rect(p.x - 5, p.y, 10, 7, '#e04e4e'); }

//     for (const b of bullets) { rect(b.x - 3, b.y - 2, 7, 4, '#ffe8a0'); }

//     for (const e of enemies) { drawPerson(e.x, e.y, Math.atan2(hunter.y - e.y, hunter.x - e.x), e.walk, false, false); if (e.waiting) { ctx.fillStyle = '#f6e8c9'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText('WAIT', e.x, e.y - 31); } }

//     // Hit animation: slightly smaller and centered on the character.
//     if (hunter.hitAnim > 0) {
//       const im = images.hitAnimation;

//       if (im && im.complete && im.naturalWidth) {
//         ctx.drawImage(im, hunter.x - 85, hunter.y - 75, 170, 150);
//       } else {
//         ctx.save();
//         ctx.globalAlpha = .78;
//         rect(hunter.x - 28, hunter.y - 35, 56, 70, '#c94c3e');
//         rect(hunter.x - 20, hunter.y - 27, 40, 54, '#f0d6a1');
//         rect(hunter.x - 17, hunter.y - 22, 7, 7, '#171c19');
//         rect(hunter.x + 10, hunter.y - 22, 7, 7, '#171c19');
//         rect(hunter.x - 14, hunter.y + 9, 28, 5, '#171c19');
//         ctx.restore();
//       }
//     } else if (hunter.invuln <= 0 || Math.floor(elapsed * 12) % 2 === 0) {
//       drawPerson(hunter.x, hunter.y, hunter.angle, hunter.walk, true, false);
//     }

//     // Draw the weapon independently: the hunter's body never spins, but the gun follows the mouse.

//     if (hunter.hitAnim <= 0) { ctx.save(); ctx.translate(hunter.x, hunter.y); ctx.rotate(hunter.angle); rect(3, -5, 25, 6, '#343a35'); rect(24, -7, 9, 10, '#252b26'); ctx.restore(); }

//     if (hunter.shootFlash > 0) { ctx.strokeStyle = '#fff0ae'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hunter.x + Math.cos(hunter.angle) * 24, hunter.y + Math.sin(hunter.angle) * 24); ctx.lineTo(hunter.x + Math.cos(hunter.angle) * 43, hunter.y + Math.sin(hunter.angle) * 43); ctx.stroke(); }

//     for (const p of particles) { ctx.globalAlpha = clamp(p.life * 3, 0, 1); rect(p.x, p.y, 4, 4, p.color); ctx.globalAlpha = 1; }

//     // Small aim marker

//     ctx.strokeStyle = '#f9edc4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 7, 0, Math.PI * 2); ctx.moveTo(mouse.x - 11, mouse.y); ctx.lineTo(mouse.x - 4, mouse.y); ctx.moveTo(mouse.x + 4, mouse.y); ctx.lineTo(mouse.x + 11, mouse.y); ctx.moveTo(mouse.x, mouse.y - 11); ctx.lineTo(mouse.x, mouse.y - 4); ctx.moveTo(mouse.x, mouse.y + 4); ctx.lineTo(mouse.x, mouse.y + 11); ctx.stroke();

//     if (state === 'paused') { rect(0, 0, W, H, '#0d120c99'); ctx.fillStyle = '#fff1c9'; ctx.font = '18px monospace'; ctx.textAlign = 'center'; ctx.fillText('PAUSED — PRESS P TO CONTINUE', W / 2, H / 2); }

//   }


//   function loop(now) { const frame = 1000 / tuning.fps; if (!last) last = now; let delta = Math.min(.1, (now - last) / 1000); last = now; accumulator += delta; while (accumulator >= 1 / tuning.fps) { update(1 / tuning.fps); accumulator -= 1 / tuning.fps; } draw(); requestAnimationFrame(loop); }
//   document.getElementById('startBtn').addEventListener('click', start); document.getElementById('restartBtn').addEventListener('click', start); document.getElementById('pauseBtn').addEventListener('click', pause);
//   reset(); requestAnimationFrame(loop);
// })();



(() => {
    'use strict';

    const cfg = window.GAME_ASSETS || {};
    const tuning = Object.assign({
        fps: 30,
        hunterSpeed: 155,
        hunterLives: 5,
        bushCount: 13,
        maxQueuedCavemenPerBush: 1,
        maxActiveCavemen: 3,
        cavemanSpeed: 175,
        spawnNearDistance: 125,
        contactDistance: 28,
        queueWaitDistance: 66,
        heartEveryMeters: 450
    }, cfg.tuning || {});

    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width, H = canvas.height;

    const ui = {
        score: document.getElementById('score'),
        lives: document.getElementById('lives'),
        distance: document.getElementById('distance'),
        best: document.getElementById('best'),
        toast: document.getElementById('toast'),
        start: document.getElementById('startOverlay'),
        end: document.getElementById('endOverlay'),
        endTitle: document.getElementById('endTitle'),
        finalScore: document.getElementById('finalScore')
    };

    const keys = new Set();
    const imageFiles = cfg.images || {};
    const soundFiles = cfg.sounds || {};
    const images = {};
    const sounds = {};

    for (const [key, path] of Object.entries(imageFiles)) {
        if (path) {
            const im = new Image();
            im.src = path;
            images[key] = im;
        }
    }

    // Animated hit GIF overlay.
    // Native HTML images animate GIFs properly, unlike canvas drawImage().
    const hitGif = document.createElement('img');
    hitGif.src = imageFiles.hitAnimation || 'assets/images/hunter-hit.gif';
    hitGif.alt = '';
    hitGif.setAttribute('aria-hidden', 'true');

    hitGif.style.cssText = [
        'position:absolute',
        'width:170px',
        'height:150px',
        'object-fit:contain',
        'pointer-events:none',
        'display:none',
        'z-index:10',
        'image-rendering:pixelated',
        'max-width:none',
        'margin:0',
        'padding:0'
    ].join(';');

    const gameWrap = canvas.parentElement;

    if (gameWrap) {
        if (getComputedStyle(gameWrap).position === 'static') {
            gameWrap.style.position = 'relative';
        }

        gameWrap.appendChild(hitGif);
    }

    // Keep the GIF aligned with the hunter, even when the canvas is resized.
    function updateHitGif() {
        if (!gameWrap || !canvas.isConnected) {
            hitGif.style.display = 'none';
            return;
        }

        if (hunter.hitAnim <= 0 || state === 'title' || state === 'over') {
            hitGif.style.display = 'none';
            return;
        }

        const canvasRect = canvas.getBoundingClientRect();
        const wrapRect = gameWrap.getBoundingClientRect();

        const scaleX = canvasRect.width / W;
        const scaleY = canvasRect.height / H;

        hitGif.style.left =
            (canvasRect.left - wrapRect.left + (hunter.x - 85) * scaleX) + 'px';

        hitGif.style.top =
            (canvasRect.top - wrapRect.top + (hunter.y - 75) * scaleY) + 'px';

        hitGif.style.width = (120 * scaleX) + 'px';
        hitGif.style.height = (110 * scaleY) + 'px';
        hitGif.style.display = 'block';
    }

    let audioReady = false;
    let state = 'title';
    let last = 0;
    let accumulator = 0;
    let toastTimer = 0;
    let score = 0;
    let distance = 0;
    let best = Number(localStorage.getItem('forestHunterBest') || 0);
    let elapsed = 0;
    let nextHeart = 450;
    let worldOffset = 0;
    let trackIndex = 0;
    let metersToNextWave = 180;

    ui.best.textContent = best;

    const hunter = {
        x: W * .24,
        y: H * .53,
        angle: 0,
        lives: tuning.hunterLives,
        invuln: 0,
        walk: 0,
        shootFlash: 0,
        hitAnim: 0
    };

    let bushes = [];
    let enemies = [];
    let bullets = [];
    let pickups = [];
    let particles = [];

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const rand = (a, b) => a + Math.random() * (b - a);

    function loadSound(name) {
        const p = soundFiles[name];
        if (!p) return null;

        const a = new Audio(p);
        a.preload = 'auto';
        return a;
    }

    for (const n of Object.keys(soundFiles)) {
        if (soundFiles[n]) sounds[n] = loadSound(n);
    }

    function playSound(name) {
        const a = sounds[name];
        if (!a) return;

        try {
            a.currentTime = 0;
            const copy = a.cloneNode();
            copy.volume = name === 'ambience' ? .25 : .8;
            copy.play().catch(() => { });
        } catch (_) { }
    }

    // Background music: loop while the game is active.
    // Music behavior is intentionally unchanged.
    const backgroundMusic = soundFiles.ambience
        ? new Audio(soundFiles.ambience)
        : null;

    if (backgroundMusic) {
        backgroundMusic.loop = true;
        backgroundMusic.preload = 'auto';
        backgroundMusic.volume = 0.25;
    }

    function startBackgroundMusic() {
        if (!backgroundMusic) return;
        backgroundMusic.play().catch(() => { });
    }

    function stopBackgroundMusic() {
        if (!backgroundMusic) return;
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }

    function toast(text) {
        ui.toast.textContent = text;
        ui.toast.classList.add('show');
        toastTimer = 1.7;
    }

    function makeBush(x, y, count = 1) {
        return {
            x,
            y,
            r: Math.random() < .28 ? rand(29, 36) : rand(19, 25),
            count,
            triggered: false,
            dead: false,
            shade: Math.floor(rand(0, 3)),
            spawnWait: 0
        };
    }

    function reset() {
        score = 0;
        distance = 0;
        elapsed = 0;
        nextHeart = tuning.heartEveryMeters;
        worldOffset = 0;
        trackIndex = 0;
        metersToNextWave = 180;

        hunter.x = W * .18;
        hunter.y = H * .53;
        hunter.angle = 0;
        hunter.lives = tuning.hunterLives;
        hunter.invuln = 0;
        hunter.walk = 0;
        hunter.shootFlash = 0;
        hunter.hitAnim = 0;

        hitGif.style.display = 'none';

        enemies = [];
        bullets = [];
        pickups = [];
        particles = [];
        bushes = [];

        for (let i = 0; i < tuning.bushCount; i++) {
            bushes.push(makeBush(rand(W * .58, W + 120), rand(165, H - 45), 1));
        }

        updateHud();
    }

    function updateHud() {
        ui.score.textContent = String(score).padStart(6, '0');

        ui.lives.textContent = Array.from(
            { length: tuning.hunterLives },
            (_, i) => i < hunter.lives ? '♥' : '♡'
        ).join(' ');

        ui.distance.textContent = Math.floor(distance) + ' m';
    }

    function start() {
        reset();
        state = 'playing';

        ui.start.classList.add('hidden');
        ui.end.classList.add('hidden');

        last = performance.now();
        accumulator = 0;

        startBackgroundMusic();
    }

    function finish() {
        state = 'over';
        hitGif.style.display = 'none';

        stopBackgroundMusic();

        ui.finalScore.textContent = score;
        ui.endTitle.textContent = hunter.lives > 0
            ? 'RUN PAUSED'
            : 'YOU WERE CAUGHT';

        if (score > best) {
            best = score;
            localStorage.setItem('forestHunterBest', String(best));
            ui.best.textContent = best;
        }

        ui.end.classList.remove('hidden');
    }

    function pause() {
        if (state === 'playing') {
            state = 'paused';
            toast('PAUSED — PRESS P TO RESUME');
        } else if (state === 'paused') {
            state = 'playing';
            last = performance.now();
        }
    }

    function spawnEnemy(b) {
        if (
            b.count <= 0 ||
            enemies.filter(e => e.alive).length >= tuning.maxActiveCavemen
        ) return;

        b.count--;
        b.triggered = true;
        b.spawnWait = 0.55;

        const e = {
            x: b.x,
            y: b.y,
            source: b,
            alive: true,
            hitFlash: 0,
            walk: 0,
            waiting: false
        };

        enemies.push(e);
        playSound('cavemanScream');

        for (let i = 0; i < 8; i++) {
            particles.push({
                x: b.x,
                y: b.y,
                vx: rand(-45, 45),
                vy: rand(-45, 45),
                life: rand(.15, .4),
                color: '#d4d18b'
            });
        }
    }

    function shoot() {
        if (state !== 'playing' || hunter.hitAnim > 0) return;

        const speed = 470;

        bullets.push({
            x: hunter.x + Math.cos(hunter.angle) * 22,
            y: hunter.y + Math.sin(hunter.angle) * 22,
            vx: Math.cos(hunter.angle) * speed,
            vy: Math.sin(hunter.angle) * speed,
            life: .65
        });

        hunter.shootFlash = .08;
        playSound('gunshot');

        for (let i = 0; i < 3; i++) {
            particles.push({
                x: hunter.x + Math.cos(hunter.angle) * 20,
                y: hunter.y + Math.sin(hunter.angle) * 20,
                vx: rand(-30, 30) + Math.cos(hunter.angle) * 70,
                vy: rand(-30, 30) + Math.sin(hunter.angle) * 70,
                life: .12,
                color: '#ffe9a0'
            });
        }
    }

    function update(dt) {
        if (state !== 'playing') return;

        elapsed += dt;

        hunter.invuln = Math.max(0, hunter.invuln - dt);
        hunter.shootFlash = Math.max(0, hunter.shootFlash - dt);
        hunter.hitAnim = Math.max(0, hunter.hitAnim - dt);

        const inHitReaction = hunter.hitAnim > 0;

        let dx =
            (keys.has('d') || keys.has('arrowright') ? 1 : 0) -
            (keys.has('a') || keys.has('arrowleft') ? 1 : 0);

        let dy =
            (keys.has('s') || keys.has('arrowdown') ? 1 : 0) -
            (keys.has('w') || keys.has('arrowup') ? 1 : 0);

        const len = Math.hypot(dx, dy) || 1;

        if (!inHitReaction && (dx || dy)) {
            const step = tuning.hunterSpeed * dt / len;

            // Mario-like movement: move normally, then scroll the world at track edges.
            if (dx > 0) {
                if (hunter.x < W * .31) {
                    hunter.x += step;
                } else {
                    distance += step;
                    worldOffset = (worldOffset + step) % W;

                    for (const b of bushes) b.x -= step;
                    for (const e of enemies) e.x -= step;
                    for (const p of pickups) p.x -= step;
                    for (const b of bullets) b.x -= step;
                }
            } else if (dx < 0) {
                if (hunter.x > W * .13) {
                    hunter.x -= step;
                } else {
                    const shift = Math.min(
                        step,
                        Math.max(0, W * .70 - hunter.x)
                    );

                    for (const b of bushes) b.x += shift;
                    for (const e of enemies) e.x += shift;
                    for (const p of pickups) p.x += shift;
                    for (const b of bullets) b.x += shift;

                    distance = Math.max(0, distance - shift);
                }
            }

            hunter.y += dy / len * tuning.hunterSpeed * dt;
            hunter.walk += dt * 11;
        }

        hunter.x = clamp(hunter.x, W * .12, W * .31);
        hunter.y = clamp(hunter.y, 150, H - 25);

        hunter.angle = Math.atan2(
            mouse.y - hunter.y,
            mouse.x - hunter.x
        );

        // Bushes trigger after the hunter passes the opening stretch.
        for (const b of bushes) {
            if (
                !b.triggered &&
                b.count > 0 &&
                distance >= 180 &&
                Math.hypot(hunter.x - b.x, hunter.y - b.y) <
                Math.max(tuning.spawnNearDistance, b.r + 75)
            ) {
                b.triggered = true;
                b.spawnWait = .35;
            }

            if (
                b.triggered &&
                b.count > 0 &&
                !enemies.some(e => e.alive && e.source === b)
            ) {
                b.spawnWait = Math.max(0, b.spawnWait - dt);

                if (
                    !inHitReaction &&
                    b.spawnWait <= 0 &&
                    enemies.filter(e => e.alive).length < tuning.maxActiveCavemen
                ) {
                    spawnEnemy(b);
                }
            }
        }

        // Refill the path ahead.
        for (let i = 0; i < bushes.length; i++) {
            const b = bushes[i];

            if (b.x < -Math.max(65, b.r + 15)) {
                bushes[i] = makeBush(
                    W + rand(90, 280),
                    rand(165, H - 45),
                    1
                );

                trackIndex++;
            }
        }

        for (const e of enemies) {
            if (!e.alive) continue;

            e.walk += dt * 10;
            e.hitFlash = Math.max(0, e.hitFlash - dt);

            const ex = hunter.x - e.x;
            const ey = hunter.y - e.y;
            const d = Math.hypot(ex, ey) || 1;

            e.waiting = inHitReaction;

            if (!inHitReaction) {
                const a = Math.atan2(ey, ex);
                e.x += Math.cos(a) * tuning.cavemanSpeed * dt;
                e.y += Math.sin(a) * tuning.cavemanSpeed * dt;
            }

            if (
                !inHitReaction &&
                d < tuning.contactDistance &&
                hunter.invuln <= 0
            ) {
                e.alive = false;
                hunter.lives--;
                hunter.invuln = 3.05;
                hunter.hitAnim = 3;

                // Hit sound plays on impact, unchanged.
                playSound('hunterHit');

                toast(
                    hunter.lives <= 0
                        ? 'FATAL HIT! — 3 SECOND FINAL REACTION'
                        : 'HIT! — 3 SECOND RECOVERY'
                );

                for (let i = 0; i < 15; i++) {
                    particles.push({
                        x: hunter.x,
                        y: hunter.y,
                        vx: rand(-100, 100),
                        vy: rand(-100, 100),
                        life: rand(.2, .65),
                        color: '#e16d50'
                    });
                }
            }
        }

        for (const b of bullets) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;

            for (const e of enemies) {
                if (
                    e.alive &&
                    Math.hypot(b.x - e.x, b.y - e.y) < 21
                ) {
                    e.alive = false;
                    b.life = 0;
                    score += 100;

                    playSound('cavemanDeath');

                    for (let i = 0; i < 13; i++) {
                        particles.push({
                            x: e.x,
                            y: e.y,
                            vx: rand(-85, 85),
                            vy: rand(-85, 85),
                            life: rand(.2, .55),
                            color: i % 2 ? '#bb6f49' : '#ead28a'
                        });
                    }

                    break;
                }
            }
        }

        bullets = bullets.filter(
            b => b.life > 0 &&
                b.x > -20 &&
                b.x < W + 20 &&
                b.y > -20 &&
                b.y < H + 20
        );

        enemies = enemies.filter(e => e.alive);

        if (distance >= nextHeart) {
            pickups.push({
                x: rand(55, W - 55),
                y: rand(175, H - 50),
                life: 12
            });

            nextHeart += tuning.heartEveryMeters;
            toast('A HEART HAS APPEARED');
        }

        for (const p of pickups) {
            p.life -= dt;

            if (Math.hypot(hunter.x - p.x, hunter.y - p.y) < 24) {
                p.life = 0;

                if (hunter.lives < tuning.hunterLives) {
                    hunter.lives++;
                    toast('LIFE RESTORED');
                } else {
                    score += 150;
                    toast('FULL HEALTH — BONUS SCORE');
                }
            }
        }

        pickups = pickups.filter(p => p.life > 0);

        for (const p of particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.vx *= .96;
            p.vy *= .96;
        }

        particles = particles.filter(p => p.life > 0);

        if (toastTimer > 0) {
            toastTimer -= dt;

            if (toastTimer <= 0) {
                ui.toast.classList.remove('show');
            }
        }

        updateHud();

        if (hunter.lives <= 0 && hunter.hitAnim <= 0) {
            finish();
            return;
        }
    }

    const mouse = {
        x: W * .65,
        y: H * .5
    };

    function canvasMouse(e) {
        const r = canvas.getBoundingClientRect();

        mouse.x = (e.clientX - r.left) / r.width * W;
        mouse.y = (e.clientY - r.top) / r.height * H;
    }

    canvas.addEventListener('mousemove', canvasMouse);

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('mousedown', e => {
        canvasMouse(e);

        if (e.button === 0) shoot();
    });

    window.addEventListener('keydown', e => {
        const k = e.key.toLowerCase();

        if (
            ['w', 'a', 's', 'd', 'arrowup', 'arrowdown',
                'arrowleft', 'arrowright', ' '].includes(k)
        ) {
            e.preventDefault();
        }

        keys.add(k);

        if (k === 'p') pause();

        if (k === ' ' && state === 'playing') shoot();
    });

    window.addEventListener('keyup', e => {
        keys.delete(e.key.toLowerCase());
    });

    function rect(x, y, w, h, c) {
        ctx.fillStyle = c;

        ctx.fillRect(
            Math.round(x),
            Math.round(y),
            Math.round(w),
            Math.round(h)
        );
    }

    function drawImageOr(key, x, y, w, h, drawFallback) {
        const im = images[key];

        if (im && im.complete && im.naturalWidth) {
            ctx.drawImage(im, x, y, w, h);
        } else {
            drawFallback();
        }
    }

    function drawTreeBand(y, flip = false) {
        drawImageOr(
            flip ? 'forestBottom' : 'forestTop',
            0,
            y,
            W,
            flip ? H - y : 145,
            () => {
                rect(0, y, W, flip ? H - y : 145, '#294b32');

                for (
                    let x = -35 - (worldOffset % 95);
                    x < W + 50;
                    x += 95
                ) {
                    const h = rand(0, 0);
                    void h;

                    const xx = x;

                    rect(xx + 9, y + 15, 12, 75, '#493b2a');
                    rect(xx - 9, y + 4, 48, 39, '#386a3b');
                    rect(xx - 17, y + 20, 48, 36, '#315b35');
                    rect(xx + 2, y + 31, 38, 28, '#477943');
                    rect(xx + 1, y + 9, 4, 4, '#729451');
                }
            }
        );
    }

    function drawGround() {
        drawImageOr('ground', 0, 140, W, H - 140, () => {
            rect(0, 140, W, H - 140, '#a2b96a');

            for (let y = 150; y < H; y += 27) {
                for (
                    let x = ((y * 13) % 41) - worldOffset % 41;
                    x < W;
                    x += 41
                ) {
                    rect(x, y, 3, 2, '#8aa457');
                    rect(x + 14, y + 9, 2, 2, '#c1ca79');
                }
            }

            rect(0, 140, W, 8, '#526c3c');
            rect(0, H - 9, W, 9, '#526c3c');
        });
    }

    function drawBush(b) {
        drawImageOr(
            'bush',
            b.x - b.r - 8,
            b.y - b.r - 7,
            (b.r + 8) * 2,
            (b.r + 7) * 2,
            () => {
                const colors = [
                    ['#315c32', '#3e7339', '#4f8844'],
                    ['#35532e', '#486b36', '#658347'],
                    ['#254f35', '#37704a', '#4c8955']
                ][b.shade];

                rect(b.x - b.r * .8, b.y - b.r * .45, b.r * 1.6, b.r * 1.1, colors[0]);
                rect(b.x - b.r, b.y - b.r * .2, b.r * .9, b.r * .8, colors[1]);
                rect(b.x - b.r * .3, b.y - b.r * .8, b.r * 1.05, b.r * .9, colors[2]);
                rect(b.x + b.r * .15, b.y - b.r * .6, b.r * .65, b.r * .65, colors[1]);
                rect(b.x - b.r * .5, b.y - b.r * .25, 5, 4, '#8fb05c');
            }
        );
    }

    function drawPerson(x, y, angle, walk, isHunter, hit = false) {
        const key = isHunter ? 'hunter' : 'caveman';

        drawImageOr(key, x - 22, y - 25, 44, 50, () => {
            ctx.save();

            ctx.translate(
                Math.round(x),
                Math.round(y + Math.sin(walk) * 2)
            );

            if (!isHunter) ctx.rotate(angle);

            if (hit) {
                rect(-19, -25, 38, 50, '#e2a07a');
                rect(-16, -22, 32, 44, '#d84f46');
                ctx.restore();
                return;
            }

            const bob = Math.sin(walk) * 2;

            rect(-9, -9 + bob, 18, 20, isHunter ? '#d8c6a0' : '#8a4e31');
            rect(-10, -23 + bob, 20, 15, isHunter ? '#d7b28b' : '#5a3826');
            rect(-9, -26 + bob, 18, 7, isHunter ? '#4e4b35' : '#3b2921');
            rect(-13, -2 + bob, 6, 17, isHunter ? '#e1c4a0' : '#8c5938');
            rect(7, -2 + bob, 6, 17, isHunter ? '#e1c4a0' : '#8c5938');
            rect(-8, 10 + bob + (Math.sin(walk) * 2), 7, 14, '#393d2d');
            rect(2, 10 + bob - (Math.sin(walk) * 2), 7, 14, '#393d2d');
            rect(-7, -18 + bob, 3, 3, '#171a14');
            rect(4, -18 + bob, 3, 3, '#171a14');

            if (isHunter) {
                rect(-8, -4 + bob, 23, 5, '#343a35');
                rect(12, -6 + bob, 8, 9, '#252b26');
            } else {
                rect(12, -4 + bob, 9, 5, '#6e412b');
                rect(14, -10 + bob, 4, 5, '#e2c48a');
            }

            ctx.restore();
        });
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        drawGround();
        drawTreeBand(0);
        drawTreeBand(H - 100, true);

        // Bushes.
        for (const b of bushes) drawBush(b);

        // Heart pickups.
        for (const p of pickups) {
            rect(p.x - 9, p.y - 9, 18, 18, '#f6e8c9');
            rect(p.x - 7, p.y - 5, 6, 6, '#e04e4e');
            rect(p.x + 1, p.y - 5, 6, 6, '#e04e4e');
            rect(p.x - 5, p.y, 10, 7, '#e04e4e');
        }

        // Bullets.
        for (const b of bullets) {
            rect(b.x - 3, b.y - 2, 7, 4, '#ffe8a0');
        }

        // Enemies.
        for (const e of enemies) {
            drawPerson(
                e.x,
                e.y,
                Math.atan2(hunter.y - e.y, hunter.x - e.x),
                e.walk,
                false,
                false
            );

            if (e.waiting) {
                ctx.fillStyle = '#f6e8c9';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('WAIT', e.x, e.y - 31);
            }
        }

        // Hit reaction: the HTML GIF overlay supplies the actual animation.
        if (hunter.hitAnim > 0) {
            // Keep a canvas fallback in case the GIF hasn't loaded.
            const im = images.hitAnimation;

            if (!im || !im.complete || !im.naturalWidth) {
                ctx.save();
                ctx.globalAlpha = .78;

                rect(hunter.x - 28, hunter.y - 35, 56, 70, '#c94c3e');
                rect(hunter.x - 20, hunter.y - 27, 40, 54, '#f0d6a1');
                rect(hunter.x - 17, hunter.y - 22, 7, 7, '#171c19');
                rect(hunter.x + 10, hunter.y - 22, 7, 7, '#171c19');
                rect(hunter.x - 14, hunter.y + 9, 28, 5, '#171c19');

                ctx.restore();
            }
        } else if (
            hunter.invuln <= 0 ||
            Math.floor(elapsed * 12) % 2 === 0
        ) {
            drawPerson(
                hunter.x,
                hunter.y,
                hunter.angle,
                hunter.walk,
                true,
                false
            );
        }

        // Update animated GIF position and visibility.
        updateHitGif();

        // Draw the weapon independently; the gun follows the mouse.
        if (hunter.hitAnim <= 0) {
            ctx.save();
            ctx.translate(hunter.x, hunter.y);
            ctx.rotate(hunter.angle);

            rect(3, -5, 25, 6, '#343a35');
            rect(24, -7, 9, 10, '#252b26');

            ctx.restore();
        }

        if (hunter.shootFlash > 0) {
            ctx.strokeStyle = '#fff0ae';
            ctx.lineWidth = 4;
            ctx.beginPath();

            ctx.moveTo(
                hunter.x + Math.cos(hunter.angle) * 24,
                hunter.y + Math.sin(hunter.angle) * 24
            );

            ctx.lineTo(
                hunter.x + Math.cos(hunter.angle) * 43,
                hunter.y + Math.sin(hunter.angle) * 43
            );

            ctx.stroke();
        }

        // Particles.
        for (const p of particles) {
            ctx.globalAlpha = clamp(p.life * 3, 0, 1);
            rect(p.x, p.y, 4, 4, p.color);
            ctx.globalAlpha = 1;
        }

        // Aim marker.
        ctx.strokeStyle = '#f9edc4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 7, 0, Math.PI * 2);

        ctx.moveTo(mouse.x - 11, mouse.y);
        ctx.lineTo(mouse.x - 4, mouse.y);

        ctx.moveTo(mouse.x + 4, mouse.y);
        ctx.lineTo(mouse.x + 11, mouse.y);

        ctx.moveTo(mouse.x, mouse.y - 11);
        ctx.lineTo(mouse.x, mouse.y - 4);

        ctx.moveTo(mouse.x, mouse.y + 4);
        ctx.lineTo(mouse.x, mouse.y + 11);

        ctx.stroke();

        // Pause overlay.
        if (state === 'paused') {
            rect(0, 0, W, H, '#0d120c99');

            ctx.fillStyle = '#fff1c9';
            ctx.font = '18px monospace';
            ctx.textAlign = 'center';

            ctx.fillText(
                'PAUSED — PRESS P TO CONTINUE',
                W / 2,
                H / 2
            );
        }
    }

    function loop(now) {
        const frame = 1000 / tuning.fps;

        if (!last) last = now;

        let delta = Math.min(.1, (now - last) / 1000);
        last = now;
        accumulator += delta;

        while (accumulator >= 1 / tuning.fps) {
            update(1 / tuning.fps);
            accumulator -= 1 / tuning.fps;
        }

        draw();
        requestAnimationFrame(loop);
    }

    document.getElementById('startBtn').addEventListener('click', start);
    document.getElementById('restartBtn').addEventListener('click', start);
    document.getElementById('pauseBtn').addEventListener('click', pause);

    reset();
    requestAnimationFrame(loop);
})();