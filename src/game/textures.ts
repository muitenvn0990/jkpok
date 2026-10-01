import * as THREE from 'three';
import { TexturePattern } from '../types/game';

// Cache generated textures so we don't recreate them every frame
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a procedural 512x512 canvas texture based on pattern and base color
 */
export function getProceduralTexture(pattern: TexturePattern, baseColorHex: string = '#ffffff'): THREE.CanvasTexture {
  const cacheKey = `${pattern}_${baseColorHex}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const dummy = new THREE.CanvasTexture(canvas);
    return dummy;
  }

  // Draw procedural pattern
  switch (pattern) {
    case 'brick':
      drawBrick(ctx, baseColorHex);
      break;
    case 'foliage':
      drawFoliage(ctx, baseColorHex);
      break;
    case 'wood':
      drawWood(ctx, baseColorHex);
      break;
    case 'marble':
      drawMarble(ctx, baseColorHex);
      break;
    case 'gold':
      drawGold(ctx, baseColorHex);
      break;
    case 'popart':
      drawPopArt(ctx, baseColorHex);
      break;
    case 'damask':
      drawDamask(ctx, baseColorHex);
      break;
    case 'slate':
      drawSlate(ctx, baseColorHex);
      break;
    case 'solid':
    default:
      drawSolid(ctx, baseColorHex);
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

function drawSolid(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 512);

  // Add subtle plaster grain
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

function drawBrick(ctx: CanvasRenderingContext2D, baseColor: string) {
  // Mortar background
  ctx.fillStyle = '#cfc6b8';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 12;
  const rowHeight = 512 / rows;
  const brickWidth = 80;
  const mortar = 6;

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight + mortar / 2;
    const offset = (r % 2) * (brickWidth / 2);

    for (let x = -brickWidth; x < 512 + brickWidth; x += brickWidth + mortar) {
      // Brick color variations
      ctx.fillStyle = baseColor;
      ctx.fillRect(x + offset, y, brickWidth, rowHeight - mortar);

      // Subtle noise on brick surface
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + offset + 2, y + 2, brickWidth - 4, rowHeight - mortar - 4);

      // Brick shading bevel
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + offset, y, brickWidth, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x + offset, y + rowHeight - mortar - 3, brickWidth, 3);
    }
  }
}

function drawFoliage(ctx: CanvasRenderingContext2D, baseColor: string) {
  // Dark jungle green undercoat
  ctx.fillStyle = '#143820';
  ctx.fillRect(0, 0, 512, 512);

  // Overlapping leafy circles / ivy blades
  const leafCount = 180;
  for (let i = 0; i < leafCount; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = 20 + Math.random() * 35;
    const angle = Math.random() * Math.PI * 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.fillStyle = i % 3 === 0 ? baseColor : i % 2 === 0 ? '#2d6a4f' : '#52b788';

    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Leaf vein
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, 0);
    ctx.lineTo(size * 0.8, 0);
    ctx.stroke();

    ctx.restore();
  }
}

function drawWood(ctx: CanvasRenderingContext2D, baseColor: string) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankHeight = 512 / 6;
  ctx.strokeStyle = 'rgba(30, 15, 5, 0.4)';
  ctx.lineWidth = 3;

  for (let p = 0; p < 6; p++) {
    const y = p * plankHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    // Wood rings / grain lines inside plank
    for (let g = 0; g < 15; g++) {
      ctx.strokeStyle = g % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1 + Math.random() * 2;
      const waveY = y + 5 + Math.random() * (plankHeight - 10);
      ctx.beginPath();
      ctx.moveTo(0, waveY);
      ctx.bezierCurveTo(
        150, waveY + (Math.random() - 0.5) * 8,
        350, waveY + (Math.random() - 0.5) * 8,
        512, waveY
      );
      ctx.stroke();
    }
  }
}

function drawMarble(ctx: CanvasRenderingContext2D, baseColor: string) {
  // Marble base
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle clouds
  for (let i = 0; i < 40; i++) {
    const rad = 40 + Math.random() * 80;
    const grad = ctx.createRadialGradient(
      Math.random() * 512, Math.random() * 512, 5,
      Math.random() * 512, Math.random() * 512, rad
    );
    grad.addColorStop(0, 'rgba(220, 220, 230, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }

  // Marble veins
  ctx.strokeStyle = 'rgba(70, 75, 85, 0.22)';
  ctx.lineWidth = 2;
  for (let v = 0; v < 7; v++) {
    let curX = Math.random() * 512;
    let curY = 0;
    ctx.beginPath();
    ctx.moveTo(curX, curY);

    while (curY < 512) {
      curY += 20 + Math.random() * 30;
      curX += (Math.random() - 0.5) * 60;
      ctx.lineTo(curX, curY);
    }
    ctx.stroke();
  }
}

function drawGold(ctx: CanvasRenderingContext2D, baseColor: string) {
  // Gilded golden bronze gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.3, baseColor);
  grad.addColorStop(0.7, '#b45309');
  grad.addColorStop(1, '#fef08a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Metallic brushed lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 120; i++) {
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y + (Math.random() - 0.5) * 20);
    ctx.stroke();
  }
}

function drawPopArt(ctx: CanvasRenderingContext2D, _baseColor: string) {
  // Mondrian-style modern geometric grid
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  const colors = ['#ef4444', '#3b82f6', '#eab308', '#0f172a', '#ffffff', '#ec4899'];
  const cols = [0, 140, 320, 512];
  const rows = [0, 160, 360, 512];

  for (let c = 0; c < cols.length - 1; c++) {
    for (let r = 0; r < rows.length - 1; r++) {
      ctx.fillStyle = colors[(c * 3 + r) % colors.length];
      ctx.fillRect(cols[c], rows[r], cols[c + 1] - cols[c], rows[r + 1] - rows[r]);
    }
  }

  // Thick black Mondrian framing lines
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 12;
  cols.forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  });
  rows.forEach(y => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  });
}

function drawDamask(ctx: CanvasRenderingContext2D, baseColor: string) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Ornate fleur-de-lis / diamond damask motifs
  ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
  const step = 85;
  for (let x = 0; x < 512; x += step) {
    for (let y = 0; y < 512; y += step) {
      const offsetX = (y / step) % 2 === 0 ? 0 : step / 2;
      ctx.beginPath();
      ctx.arc(x + offsetX, y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x + offsetX, y, 6, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x + offsetX, y, 26, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSlate(ctx: CanvasRenderingContext2D, baseColor: string) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  // Dark stone pavers
  const step = 128;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 4;

  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Subtle chipped noise
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  for (let i = 0; i < 200; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    ctx.fillRect(rx, ry, Math.random() * 6, Math.random() * 6);
  }
}

/**
 * Creates museum parquet floor texture
 */
export function createParquetFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2c1810';
  ctx.fillRect(0, 0, 512, 512);

  const plankW = 64;
  const plankH = 16;
  const colors = ['#452618', '#381e13', '#522f1e', '#2c1810'];

  for (let y = 0; y < 512; y += plankH) {
    for (let x = 0; x < 512; x += plankW) {
      const idx = Math.floor(Math.random() * colors.length);
      ctx.fillStyle = colors[idx];
      ctx.fillRect(x + 1, y + 1, plankW - 2, plankH - 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}
