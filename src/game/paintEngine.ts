import * as THREE from 'three';
import { BodyPart } from '../types/game';

export type PaintTool = 'brush' | 'bucket' | 'eraser' | 'eyedropper';

export interface PaintConfig {
  tool: PaintTool;
  color: string;
  brushSize: number; // 2 to 48
  brushOpacity: number; // 0.1 to 1.0
  activePart: BodyPart;
}

export class PaintEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public texture: THREE.CanvasTexture;

  // History stack for Undo / Redo
  private history: ImageData[] = [];
  private historyIndex: number = -1;
  private maxHistory: number = 20;

  // Config
  public config: PaintConfig = {
    tool: 'brush',
    color: '#1e3a8a',
    brushSize: 14,
    brushOpacity: 0.9,
    activePart: 'all',
  };

  // Stroke tracking
  private isDrawing: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;

  constructor(size: number = 512) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;

    // Initial base white plaster
    this.clearAll();

    // Create Three.js CanvasTexture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.needsUpdate = true;
  }

  public clearAll() {
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle plaster grain noise
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let i = 0; i < 2000; i++) {
      const rx = Math.random() * this.canvas.width;
      const ry = Math.random() * this.canvas.height;
      this.ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Save initial state to history
    this.saveSnapshot();
    if (this.texture) this.texture.needsUpdate = true;
  }

  private saveSnapshot() {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    // If we undo and then draw, discard future history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(imgData);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  public undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
      this.texture.needsUpdate = true;
      return true;
    }
    return false;
  }

  public redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
      this.texture.needsUpdate = true;
      return true;
    }
    return false;
  }

  public canUndo(): boolean {
    return this.historyIndex > 0;
  }

  public canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Paint Bucket / Fill (Thùng sơn): Fills whole body or specific region
   */
  public fillRegion(part: BodyPart, color: string) {
    this.ctx.save();
    this.ctx.fillStyle = color;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const hw = w / 2;
    const hh = h / 2;

    switch (part) {
      case 'head':
        // Top-left quadrant
        this.ctx.fillRect(0, 0, hw, hh);
        break;
      case 'torso':
        // Top-right quadrant
        this.ctx.fillRect(hw, 0, hw, hh);
        break;
      case 'arms':
        // Bottom-left quadrant
        this.ctx.fillRect(0, hh, hw, hh);
        break;
      case 'legs':
        // Bottom-right quadrant
        this.ctx.fillRect(hw, hh, hw, hh);
        break;
      case 'all':
      default:
        this.ctx.fillRect(0, 0, w, h);
        break;
    }

    this.ctx.restore();
    this.saveSnapshot();
    this.texture.needsUpdate = true;
  }

  /**
   * Start drawing stroke
   */
  public startStroke(x: number, y: number): string | null {
    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;

    if (this.config.tool === 'eyedropper') {
      return this.sampleColorAt(x, y);
    }

    if (this.config.tool === 'bucket') {
      this.fillRegion(this.config.activePart, this.config.color);
      return null;
    }

    this.drawStroke(x, y);
    return null;
  }

  /**
   * Continue drawing stroke
   */
  public continueStroke(x: number, y: number) {
    if (!this.isDrawing) return;
    if (this.config.tool === 'eyedropper' || this.config.tool === 'bucket') return;

    this.drawStroke(x, y);
    this.lastX = x;
    this.lastY = y;
  }

  /**
   * End drawing stroke
   */
  public endStroke() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.saveSnapshot();
      this.texture.needsUpdate = true;
    }
  }

  private drawStroke(x: number, y: number) {
    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = this.config.brushSize;

    if (this.config.tool === 'eraser') {
      this.ctx.strokeStyle = '#f8fafc';
      this.ctx.globalAlpha = 1.0;
    } else {
      this.ctx.strokeStyle = this.config.color;
      this.ctx.globalAlpha = this.config.brushOpacity;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.ctx.restore();
    this.texture.needsUpdate = true;
  }

  /**
   * Samples exact RGB hex color from canvas coordinates
   */
  public sampleColorAt(x: number, y: number): string {
    const clX = Math.max(0, Math.min(this.canvas.width - 1, Math.round(x)));
    const clY = Math.max(0, Math.min(this.canvas.height - 1, Math.round(y)));
    const pixel = this.ctx.getImageData(clX, clY, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    this.config.color = hex;
    return hex;
  }

  /**
   * Export base64 dataURL for network peer synchronization
   */
  public exportDataURL(): string {
    return this.canvas.toDataURL('image/jpeg', 0.65);
  }

  /**
   * Import base64 dataURL from network peer
   */
  public importDataURL(dataUrl: string, onLoaded?: () => void) {
    const img = new Image();
    img.onload = () => {
      this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      this.saveSnapshot();
      this.texture.needsUpdate = true;
      if (onLoaded) onLoaded();
    };
    img.src = dataUrl;
  }
}
