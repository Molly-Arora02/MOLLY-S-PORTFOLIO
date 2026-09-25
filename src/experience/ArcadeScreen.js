import * as THREE from 'three';

export default class ArcadeScreen {
  constructor(experience, position = new THREE.Vector3(2.6, 1.35, -2.2)) {
    this.experience = experience;
    this.scene = experience.scene;
    this.audioManager = experience.audioManager;
    this.position = position;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 400;
    this.canvas.height = 480;
    this.ctx = this.canvas.getContext('2d');

    this.currentGame = 'snake'; // 'snake', 'tetris', 'invaders'
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('molly_arcade_hs') || '0', 10);
    this.isGameOver = false;
    this.gameLoopInterval = null;

    // Snake state
    this.snake = [{ x: 10, y: 10 }];
    this.food = { x: 15, y: 12 };
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.gridSize = 20;

    // Tetris state
    this.tetrisCols = 10;
    this.tetrisRows = 20;
    this.tetrisGrid = Array(20).fill(null).map(() => Array(10).fill(0));
    this.currentPiece = null;
    this.tetrisShapes = [
      [[1, 1, 1, 1]], // I
      [[1, 1], [1, 1]], // O
      [[0, 1, 0], [1, 1, 1]], // T
      [[1, 0, 0], [1, 1, 1]], // L
      [[0, 0, 1], [1, 1, 1]], // J
      [[0, 1, 1], [1, 1, 0]], // S
      [[1, 1, 0], [0, 1, 1]]  // Z
    ];
    this.pieceColors = ['#06b6d4', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#ef4444'];

    // Invaders state
    this.playerX = 200;
    this.playerBullets = [];
    this.aliens = [];
    this.alienDir = 1;
    this.alienStepDown = false;

    this.initTextureAndMesh();
    this.initGame(this.currentGame);
  }

  initTextureAndMesh() {
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.NearestFilter;

    // CRT Screen Geometry
    const screenGeo = new THREE.PlaneGeometry(0.7, 0.85);
    this.screenMaterial = new THREE.MeshStandardMaterial({
      map: this.texture,
      emissive: 0xffffff,
      emissiveMap: this.texture,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.1
    });

    this.mesh = new THREE.Mesh(screenGeo, this.screenMaterial);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = -Math.PI / 4; // Angled facing center of room
    this.mesh.userData = { isArcadeScreen: true };

    this.scene.add(this.mesh);
  }

  initGame(gameType) {
    this.currentGame = gameType;
    this.isGameOver = false;
    this.score = 0;
    if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);

    if (gameType === 'snake') {
      this.snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
      this.direction = { x: 1, y: 0 };
      this.nextDirection = { x: 1, y: 0 };
      this.spawnFood();
      this.gameLoopInterval = setInterval(() => this.updateSnake(), 110);
    } else if (gameType === 'tetris') {
      this.tetrisGrid = Array(20).fill(null).map(() => Array(10).fill(0));
      this.spawnTetrisPiece();
      this.gameLoopInterval = setInterval(() => this.updateTetris(), 450);
    } else if (gameType === 'invaders') {
      this.playerX = 200;
      this.playerBullets = [];
      this.aliens = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 7; c++) {
          this.aliens.push({
            x: 60 + c * 42,
            y: 70 + r * 35,
            alive: true,
            color: r === 0 ? '#f43f5e' : (r === 1 ? '#ec4899' : '#06b6d4')
          });
        }
      }
      this.gameLoopInterval = setInterval(() => this.updateInvaders(), 35);
    }

    this.render();
  }

  // --- SNAKE LOGIC ---
  spawnFood() {
    this.food = {
      x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
      y: Math.floor(Math.random() * ((this.canvas.height - 60) / this.gridSize)) + 2
    };
  }

  updateSnake() {
    if (this.isGameOver) return;
    this.direction = this.nextDirection;
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y
    };

    const maxCols = this.canvas.width / this.gridSize;
    const maxRows = this.canvas.height / this.gridSize;

    // Collision check
    if (head.x < 0 || head.x >= maxCols || head.y < 2 || head.y >= maxRows ||
        this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.isGameOver = true;
      this.audioManager?.playArcadeBeep('gameover');
      this.render();
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('molly_arcade_hs', this.highScore);
      }
      this.audioManager?.playArcadeBeep('score');
      this.spawnFood();
    } else {
      this.snake.pop();
    }

    this.render();
  }

  // --- TETRIS LOGIC ---
  spawnTetrisPiece() {
    const idx = Math.floor(Math.random() * this.tetrisShapes.length);
    const shape = this.tetrisShapes[idx];
    this.currentPiece = {
      shape,
      color: this.pieceColors[idx],
      x: Math.floor(this.tetrisCols / 2) - Math.floor(shape[0].length / 2),
      y: 0
    };

    if (this.checkTetrisCollision(this.currentPiece.x, this.currentPiece.y, shape)) {
      this.isGameOver = true;
      this.audioManager?.playArcadeBeep('gameover');
    }
  }

  checkTetrisCollision(px, py, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = px + c;
          const newY = py + r;
          if (newX < 0 || newX >= this.tetrisCols || newY >= this.tetrisRows) return true;
          if (newY >= 0 && this.tetrisGrid[newY][newX]) return true;
        }
      }
    }
    return false;
  }

  updateTetris() {
    if (this.isGameOver || !this.currentPiece) return;
    if (!this.checkTetrisCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
    } else {
      // Lock piece
      for (let r = 0; r < this.currentPiece.shape.length; r++) {
        for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
          if (this.currentPiece.shape[r][c]) {
            const ny = this.currentPiece.y + r;
            const nx = this.currentPiece.x + c;
            if (ny >= 0 && ny < this.tetrisRows) {
              this.tetrisGrid[ny][nx] = this.currentPiece.color;
            }
          }
        }
      }

      // Clear rows
      let cleared = 0;
      for (let r = this.tetrisRows - 1; r >= 0; r--) {
        if (this.tetrisGrid[r].every(cell => cell !== 0)) {
          this.tetrisGrid.splice(r, 1);
          this.tetrisGrid.unshift(Array(this.tetrisCols).fill(0));
          cleared++;
          r++; // check same row index again
        }
      }

      if (cleared > 0) {
        this.score += cleared * 100;
        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('molly_arcade_hs', this.highScore);
        }
        this.audioManager?.playArcadeBeep('score');
      } else {
        this.audioManager?.playArcadeBeep('blip');
      }

      this.spawnTetrisPiece();
    }
    this.render();
  }

  // --- INVADERS LOGIC ---
  updateInvaders() {
    if (this.isGameOver) return;

    // Move bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      this.playerBullets[i].y -= 8;
      if (this.playerBullets[i].y < 40) {
        this.playerBullets.splice(i, 1);
        continue;
      }

      // Hit alien check
      const b = this.playerBullets[i];
      for (let a of this.aliens) {
        if (a.alive && Math.abs(b.x - a.x) < 18 && Math.abs(b.y - a.y) < 14) {
          a.alive = false;
          this.playerBullets.splice(i, 1);
          this.score += 25;
          if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('molly_arcade_hs', this.highScore);
          }
          this.audioManager?.playArcadeBeep('score');
          break;
        }
      }
    }

    // Move aliens
    let changeDir = false;
    this.aliens.forEach(a => {
      if (!a.alive) return;
      if ((this.alienDir > 0 && a.x > this.canvas.width - 35) || (this.alienDir < 0 && a.x < 35)) {
        changeDir = true;
      }
    });

    if (changeDir) {
      this.alienDir *= -1;
      this.aliens.forEach(a => { a.y += 12; });
    } else {
      this.aliens.forEach(a => { a.x += this.alienDir * 1.2; });
    }

    // Check game over
    const aliveAliens = this.aliens.filter(a => a.alive);
    if (aliveAliens.length === 0) {
      // Wave cleared
      this.score += 500;
      this.initGame('invaders');
      return;
    }

    if (aliveAliens.some(a => a.y >= this.canvas.height - 70)) {
      this.isGameOver = true;
      this.audioManager?.playArcadeBeep('gameover');
    }

    this.render();
  }

  // Input Handlers
  handleKey(key) {
    if (this.isGameOver && key === 'Enter') {
      this.initGame(this.currentGame);
      return;
    }

    if (this.currentGame === 'snake') {
      if (key === 'ArrowUp' && this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
      if (key === 'ArrowDown' && this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
      if (key === 'ArrowLeft' && this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
      if (key === 'ArrowRight' && this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
      this.audioManager?.playArcadeBeep('blip');
    } else if (this.currentGame === 'tetris') {
      if (!this.currentPiece || this.isGameOver) return;
      if (key === 'ArrowLeft') {
        if (!this.checkTetrisCollision(this.currentPiece.x - 1, this.currentPiece.y, this.currentPiece.shape)) {
          this.currentPiece.x--;
          this.audioManager?.playArcadeBeep('blip');
        }
      } else if (key === 'ArrowRight') {
        if (!this.checkTetrisCollision(this.currentPiece.x + 1, this.currentPiece.y, this.currentPiece.shape)) {
          this.currentPiece.x++;
          this.audioManager?.playArcadeBeep('blip');
        }
      } else if (key === 'ArrowDown') {
        if (!this.checkTetrisCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
          this.currentPiece.y++;
          this.audioManager?.playArcadeBeep('blip');
        }
      } else if (key === 'ArrowUp' || key === ' ') {
        // Rotate shape
        const rotated = this.currentPiece.shape[0].map((_, i) =>
          this.currentPiece.shape.map(row => row[i]).reverse()
        );
        if (!this.checkTetrisCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
          this.currentPiece.shape = rotated;
          this.audioManager?.playArcadeBeep('blip');
        }
      }
      this.render();
    } else if (this.currentGame === 'invaders') {
      if (this.isGameOver) return;
      if (key === 'ArrowLeft') this.playerX = Math.max(30, this.playerX - 18);
      if (key === 'ArrowRight') this.playerX = Math.min(this.canvas.width - 30, this.playerX + 18);
      if (key === ' ' || key === 'ArrowUp') {
        if (this.playerBullets.length < 3) {
          this.playerBullets.push({ x: this.playerX, y: this.canvas.height - 55 });
          this.audioManager?.playArcadeBeep('blip');
        }
      }
      this.render();
    }
  }

  render() {
    // CRT Background
    this.ctx.fillStyle = '#09090b';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Top HUD
    this.ctx.fillStyle = '#18181b';
    this.ctx.fillRect(0, 0, this.canvas.width, 42);

    this.ctx.font = 'bold 15px monospace';
    this.ctx.fillStyle = '#06b6d4';
    this.ctx.fillText(`GAME: ${this.currentGame.toUpperCase()}`, 15, 26);

    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`SCORE: ${this.score}`, 190, 26);

    this.ctx.fillStyle = '#10b981';
    this.ctx.fillText(`HI: ${this.highScore}`, 315, 26);

    // Render Active Game
    if (this.currentGame === 'snake') {
      // Food
      this.ctx.fillStyle = '#f43f5e';
      this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);

      // Snake Body
      this.snake.forEach((seg, i) => {
        this.ctx.fillStyle = i === 0 ? '#38bdf8' : '#0284c7';
        this.ctx.fillRect(seg.x * this.gridSize, seg.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
      });
    } else if (this.currentGame === 'tetris') {
      const cellW = this.canvas.width / this.tetrisCols;
      const cellH = (this.canvas.height - 45) / this.tetrisRows;

      // Board blocks
      for (let r = 0; r < this.tetrisRows; r++) {
        for (let c = 0; c < this.tetrisCols; c++) {
          if (this.tetrisGrid[r][c]) {
            this.ctx.fillStyle = this.tetrisGrid[r][c];
            this.ctx.fillRect(c * cellW + 1, 45 + r * cellH + 1, cellW - 2, cellH - 2);
          }
        }
      }

      // Current piece
      if (this.currentPiece) {
        this.ctx.fillStyle = this.currentPiece.color;
        for (let r = 0; r < this.currentPiece.shape.length; r++) {
          for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
            if (this.currentPiece.shape[r][c]) {
              this.ctx.fillRect(
                (this.currentPiece.x + c) * cellW + 1,
                45 + (this.currentPiece.y + r) * cellH + 1,
                cellW - 2,
                cellH - 2
              );
            }
          }
        }
      }
    } else if (this.currentGame === 'invaders') {
      // Aliens
      this.aliens.forEach(a => {
        if (a.alive) {
          this.ctx.fillStyle = a.color;
          this.ctx.fillRect(a.x - 12, a.y - 10, 24, 20);
          // Alien eyes
          this.ctx.fillStyle = '#ffffff';
          this.ctx.fillRect(a.x - 6, a.y - 4, 3, 4);
          this.ctx.fillRect(a.x + 3, a.y - 4, 3, 4);
        }
      });

      // Bullets
      this.ctx.fillStyle = '#facc15';
      this.playerBullets.forEach(b => {
        this.ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
      });

      // Player Ship
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.beginPath();
      this.ctx.moveTo(this.playerX, this.canvas.height - 50);
      this.ctx.lineTo(this.playerX - 16, this.canvas.height - 25);
      this.ctx.lineTo(this.playerX + 16, this.canvas.height - 25);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // CRT Scanlines Effect
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = 0; y < this.canvas.height; y += 4) {
      this.ctx.fillRect(0, y, this.canvas.width, 2);
    }

    // Game Over Overlay
    if (this.isGameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.font = 'bold 30px monospace';
      this.ctx.fillStyle = '#ef4444';
      this.ctx.textAlign = 'center';
      this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2 - 20);

      this.ctx.font = '16px monospace';
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 15);
      this.ctx.fillText("Press ENTER / Restart to Play", this.canvas.width / 2, this.canvas.height / 2 + 50);
      this.ctx.textAlign = 'left';
    }

    this.texture.needsUpdate = true;
  }
}
