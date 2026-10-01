import * as THREE from 'three';

const paintingCache = new Map<string, THREE.CanvasTexture>();

export interface MasterpieceInfo {
  id: string;
  title: string;
  artist: string;
  year: string;
  dominantColors: string[];
  description: string;
}

export const MASTERPIECES: MasterpieceInfo[] = [
  {
    id: 'starry_night',
    title: 'Đêm Đầy Sao (The Starry Night)',
    artist: 'Vincent van Gogh',
    year: '1889',
    dominantColors: ['#1e3a8a', '#eab308', '#0f172a', '#38bdf8', '#14532d'],
    description: 'Bầu trời xoáy tròn màu lam đậm, vầng trăng khuyết rực rỡ và ngọn cây bách đen tuyền.',
  },
  {
    id: 'mona_lisa',
    title: 'Mona Lisa',
    artist: 'Leonardo da Vinci',
    year: '1503',
    dominantColors: ['#3b2f2f', '#78350f', '#ca8a04', '#1f2937', '#92400e'],
    description: 'Kỹ thuật sfumato huyền thoại với tông màu đất ấm áp, nụ cười bí ẩn và vạt áo nhung tối.',
  },
  {
    id: 'the_scream',
    title: 'Tiếng Thét (The Scream)',
    artist: 'Edvard Munch',
    year: '1893',
    dominantColors: ['#ea580c', '#f97316', '#1e293b', '#0369a1', '#7c2d12'],
    description: 'Bầu trời rực lửa màu cam đỏ uốn lượn kịch tính trên cây cầu gỗ bên vịnh hẹp sâu thẳm.',
  },
  {
    id: 'great_wave',
    title: 'Sóng Lớn Kanagawa (The Great Wave)',
    artist: 'Hokusai',
    year: '1831',
    dominantColors: ['#1e40af', '#60a5fa', '#f8fafc', '#78350f', '#0f172a'],
    description: 'Ngọn sóng khổng lồ màu lam Phổ mang bọt trắng cuồn cuộn vây quanh đỉnh núi Phú Sĩ.',
  },
  {
    id: 'the_kiss',
    title: 'Nụ Hôn (The Kiss)',
    artist: 'Gustav Klimt',
    year: '1907',
    dominantColors: ['#d97706', '#fef08a', '#b45309', '#065f46', '#831843'],
    description: 'Mảng vàng dát óng ả điểm xuyết hoa văn hình học trừu tượng và thảm cỏ hoa rực rỡ.',
  },
];

/**
 * Creates high-detail procedural canvas textures for famous paintings
 */
export function getPaintingTexture(paintingId: string): THREE.CanvasTexture {
  if (paintingCache.has(paintingId)) {
    return paintingCache.get(paintingId)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  switch (paintingId) {
    case 'starry_night':
      drawStarryNight(ctx);
      break;
    case 'mona_lisa':
      drawMonaLisa(ctx);
      break;
    case 'the_scream':
      drawTheScream(ctx);
      break;
    case 'great_wave':
      drawGreatWave(ctx);
      break;
    case 'the_kiss':
      drawTheKiss(ctx);
      break;
    default:
      drawStarryNight(ctx);
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  paintingCache.set(paintingId, texture);
  return texture;
}

function drawStarryNight(ctx: CanvasRenderingContext2D) {
  // Deep night sky background
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 500);
  skyGrad.addColorStop(0, '#0a192f');
  skyGrad.addColorStop(0.5, '#1e3a8a');
  skyGrad.addColorStop(0.8, '#172554');
  skyGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 512, 640);

  // Swirling wind bands (Impressionist thick strokes)
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  const swirls = [
    { startX: 40, startY: 180, cp1x: 160, cp1y: 110, cp2x: 280, cp2y: 240, endX: 480, endY: 160, col: '#38bdf8' },
    { startX: 60, startY: 210, cp1x: 180, cp1y: 140, cp2x: 300, cp2y: 270, endX: 460, endY: 200, col: '#60a5fa' },
    { startX: 100, startY: 140, cp1x: 220, cp1y: 90, cp2x: 320, cp2y: 190, endX: 490, endY: 130, col: '#93c5fd' },
    { startX: 180, startY: 180, cp1x: 250, cp1y: 250, cp2x: 210, cp2y: 130, endX: 280, endY: 170, col: '#fef08a' },
  ];

  swirls.forEach(s => {
    ctx.strokeStyle = s.col;
    ctx.beginPath();
    ctx.moveTo(s.startX, s.startY);
    ctx.bezierCurveTo(s.cp1x, s.cp1y, s.cp2x, s.cp2y, s.endX, s.endY);
    ctx.stroke();
  });

  // Glowing Stars with concentric circles
  const stars = [
    { x: 90, y: 90, r: 24 },
    { x: 210, y: 80, r: 18 },
    { x: 340, y: 110, r: 22 },
    { x: 140, y: 260, r: 16 },
    { x: 380, y: 240, r: 20 },
    { x: 450, y: 70, r: 35 }, // Crescent Moon
  ];

  stars.forEach((st, idx) => {
    // Halo glow
    const glow = ctx.createRadialGradient(st.x, st.y, 4, st.x, st.y, st.r * 1.8);
    glow.addColorStop(0, '#fef08a');
    glow.addColorStop(0.4, '#eab308');
    glow.addColorStop(1, 'rgba(234, 179, 8, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Star core
    ctx.fillStyle = idx === 5 ? '#fde047' : '#ffffff';
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  });

  // Rolling Hills at bottom
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.bezierCurveTo(140, 430, 260, 490, 512, 450);
  ctx.lineTo(512, 640);
  ctx.lineTo(0, 640);
  ctx.fill();

  // Dark Cypress Tree spire on left
  ctx.fillStyle = '#064e3b';
  ctx.beginPath();
  ctx.moveTo(70, 640);
  ctx.bezierCurveTo(30, 420, 20, 250, 75, 120);
  ctx.bezierCurveTo(110, 260, 130, 440, 110, 640);
  ctx.fill();

  // Texture dashes (Van Gogh brushwork)
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 400;
    ctx.strokeStyle = Math.random() > 0.5 ? '#fef08a' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 8, ry + 2);
    ctx.stroke();
  }
}

function drawMonaLisa(ctx: CanvasRenderingContext2D) {
  // Sfumato warm sepia & ochre background
  const bg = ctx.createLinearGradient(0, 0, 0, 640);
  bg.addColorStop(0, '#2d251e');
  bg.addColorStop(0.4, '#4a3728');
  bg.addColorStop(0.7, '#6b4f3b');
  bg.addColorStop(1, '#1c1510');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 640);

  // Distant misty landscape & bridge
  ctx.fillStyle = '#3a443b';
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.bezierCurveTo(150, 320, 350, 340, 512, 330);
  ctx.lineTo(512, 420);
  ctx.lineTo(0, 420);
  ctx.fill();

  // Mona Lisa seated body & dark draped dress
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.ellipse(256, 540, 180, 140, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck & Chest
  ctx.fillStyle = '#d4a373';
  ctx.beginPath();
  ctx.ellipse(256, 300, 65, 45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Oval Face with warm Renaissance skin
  const faceGrad = ctx.createRadialGradient(256, 230, 15, 256, 230, 80);
  faceGrad.addColorStop(0, '#fef08a');
  faceGrad.addColorStop(0.6, '#d4a373');
  faceGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.ellipse(256, 230, 68, 88, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iconic Enigmatic Smile & Features
  ctx.fillStyle = '#78350f';
  // Eyes
  ctx.beginPath();
  ctx.ellipse(230, 215, 14, 7, -0.1, 0, Math.PI * 2);
  ctx.ellipse(282, 215, 14, 7, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 260, 24, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Dark veil & cascading wavy hair
  ctx.fillStyle = 'rgba(28, 25, 23, 0.88)';
  ctx.beginPath();
  ctx.moveTo(170, 150);
  ctx.bezierCurveTo(240, 130, 280, 130, 342, 150);
  ctx.bezierCurveTo(365, 260, 360, 420, 340, 480);
  ctx.lineTo(170, 480);
  ctx.bezierCurveTo(150, 420, 148, 260, 170, 150);
  ctx.fill();

  // Folded hands in foreground
  ctx.fillStyle = '#cca47e';
  ctx.beginPath();
  ctx.ellipse(256, 560, 95, 35, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTheScream(ctx: CanvasRenderingContext2D) {
  // Blood-orange turbulent sunset sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
  skyGrad.addColorStop(0, '#ea580c');
  skyGrad.addColorStop(0.35, '#f97316');
  skyGrad.addColorStop(0.7, '#fbbf24');
  skyGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 512, 640);

  // Wavy orange & blood-red sky ribbons
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#b91c1c';
  for (let y = 40; y < 220; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(160, y - 25, 320, y + 35, 512, y);
    ctx.stroke();
  }

  // Dark Fjord & hills
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(140, 280);
  ctx.bezierCurveTo(260, 220, 420, 260, 512, 230);
  ctx.lineTo(512, 460);
  ctx.bezierCurveTo(340, 420, 240, 460, 140, 380);
  ctx.fill();

  // Perspective Bridge railing stretching diagonally
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.lineTo(0, 640);
  ctx.lineTo(320, 640);
  ctx.lineTo(120, 280);
  ctx.fill();

  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 440);
  ctx.lineTo(240, 640);
  ctx.stroke();

  // The screaming agonized figure
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(170, 640);
  ctx.bezierCurveTo(150, 520, 160, 450, 190, 430);
  ctx.bezierCurveTo(230, 450, 240, 520, 220, 640);
  ctx.fill();

  // Pale skull-like face & hands clutching ears
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(195, 410, 32, 48, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // Hollow eyes and screaming mouth
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(185, 395, 6, 0, Math.PI * 2);
  ctx.arc(208, 395, 6, 0, Math.PI * 2);
  ctx.ellipse(196, 425, 9, 18, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGreatWave(ctx: CanvasRenderingContext2D) {
  // Pale ivory/ochre Japanese parchment sky
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(0, 0, 512, 640);

  // Mount Fuji in distance
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.moveTo(210, 430);
  ctx.lineTo(256, 370);
  ctx.lineTo(302, 430);
  ctx.fill();

  // Snow cap on Fuji
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(242, 388);
  ctx.lineTo(256, 370);
  ctx.lineTo(270, 388);
  ctx.fill();

  // Dramatic towering Great Wave (Prussian Blue)
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.moveTo(0, 640);
  ctx.lineTo(0, 260);
  ctx.bezierCurveTo(140, 120, 240, 100, 320, 180);
  ctx.bezierCurveTo(260, 260, 180, 240, 140, 340);
  ctx.bezierCurveTo(220, 400, 360, 360, 460, 460);
  ctx.bezierCurveTo(340, 580, 200, 520, 0, 640);
  ctx.fill();

  // Secondary roaring curl
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.bezierCurveTo(120, 260, 190, 240, 240, 210);
  ctx.bezierCurveTo(180, 320, 100, 380, 0, 460);
  ctx.fill();

  // White foam claws and spray dots
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i++) {
    const clawX = 220 + Math.random() * 120;
    const clawY = 130 + Math.random() * 100;
    ctx.beginPath();
    ctx.arc(clawX, clawY, 4 + Math.random() * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wooden boats riding the waves
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(190, 480, 75, 12, 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawTheKiss(ctx: CanvasRenderingContext2D) {
  // Gilded shimmering gold background
  const goldGrad = ctx.createLinearGradient(0, 0, 512, 640);
  goldGrad.addColorStop(0, '#fef08a');
  goldGrad.addColorStop(0.3, '#d97706');
  goldGrad.addColorStop(0.7, '#b45309');
  goldGrad.addColorStop(1, '#fef08a');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, 512, 640);

  // Floral Meadow at the base
  ctx.fillStyle = '#065f46';
  ctx.beginPath();
  ctx.ellipse(256, 560, 190, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flowers
  const flowerColors = ['#ec4899', '#3b82f6', '#eab308', '#ffffff'];
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = flowerColors[i % flowerColors.length];
    ctx.beginPath();
    ctx.arc(100 + Math.random() * 312, 520 + Math.random() * 70, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Embracing couple in ornate golden mosaic cloak
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.ellipse(256, 360, 110, 170, 0, 0, Math.PI * 2);
  ctx.fill();

  // Klimt geometric motifs: Black/White rectangles on Man, Colorful circles on Woman
  // Man's geometric black & white rectangles
  ctx.fillStyle = '#0f172a';
  for (let y = 240; y < 460; y += 32) {
    ctx.fillRect(180 + Math.random() * 40, y, 22, 12);
  }

  // Woman's colorful circular bullseyes
  for (let y = 260; y < 480; y += 36) {
    const cx = 270 + Math.random() * 40;
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(cx, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heads touching in tender embrace
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(245, 195, 28, 0, Math.PI * 2); // Man head
  ctx.arc(275, 210, 24, 0, Math.PI * 2); // Woman head
  ctx.fill();

  // Woman's flower crown
  ctx.fillStyle = '#ec4899';
  for (let a = 0; a < 8; a++) {
    ctx.beginPath();
    ctx.arc(275 + Math.cos(a) * 22, 210 + Math.sin(a) * 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Creates luxurious Persian rug texture for art gallery floors
 */
export function createPersianRugTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Crimson red base
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(0, 0, 512, 512);

  // Ornate navy border
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 32;
  ctx.strokeRect(16, 16, 480, 480);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, 440, 440);

  // Central Gold Medallion
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.arc(256, 256, 90, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.arc(256, 256, 55, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(256, 256, 25, 0, Math.PI * 2);
  ctx.fill();

  // Corner motifs
  const corners = [{ x: 60, y: 60 }, { x: 452, y: 60 }, { x: 60, y: 452 }, { x: 452, y: 452 }];
  corners.forEach(c => {
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 45, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}
