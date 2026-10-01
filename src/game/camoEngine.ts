import * as THREE from 'three';
import { MatchResult } from '../types/game';
import { MuseumExhibit } from './environment';
import { PlayerCharacter } from './player';

export class CamouflageEngine {
  /**
   * Find the masterpiece or exhibit closest to the player
   */
  public static getBackdropBehindPlayer(
    player: PlayerCharacter,
    exhibits: MuseumExhibit[]
  ): MuseumExhibit | null {
    const playerPos = player.position;
    let bestExhibit: MuseumExhibit | null = null;
    let minDistance = Infinity;

    for (const exhibit of exhibits) {
      const dist = new THREE.Vector2(
        playerPos.x - exhibit.worldPosition.x,
        playerPos.z - exhibit.worldPosition.z
      ).length();

      if (dist < minDistance) {
        minDistance = dist;
        bestExhibit = exhibit;
      }
    }

    return bestExhibit;
  }

  /**
   * Compute Camouflage percentage and feedback against masterpiece
   */
  public static evaluateCamouflage(
    player: PlayerCharacter,
    exhibit: MuseumExhibit | null
  ): MatchResult {
    if (!exhibit) {
      return {
        matchPercentage: 10,
        backdropName: 'Khu vực trống',
        backdropColor: '#f8fafc',
        backdropPattern: 'solid',
        feedbackTip: 'Hãy chạy lại gần một bức tranh kiệt tác để ngụy trang!',
        isMoving: player.isMoving,
        isFrozen: player.isFrozen,
      };
    }

    // Compare player's painted color with dominant colors of the masterpiece
    const playerColor = player.getMainColor();
    let bestSimilarity = 0.2;

    for (const color of exhibit.dominantColors) {
      const sim = this.calculateColorSimilarity(playerColor, color);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
      }
    }

    // Pose synergy bonus
    let poseBonus = 0;
    if (player.isFrozen) {
      poseBonus = 0.2;
      if (player.currentPose === 'wall_hug') {
        poseBonus += 0.15; // Flattened against painting
      } else if (player.currentPose === 'statue_classical' && exhibit.id.includes('statue')) {
        poseBonus += 0.2;
      }
    }

    let rawScore = bestSimilarity * 0.65 + poseBonus;

    if (player.isMoving) {
      rawScore = Math.min(0.2, rawScore * 0.25);
    } else if (!player.isFrozen) {
      rawScore = rawScore * 0.7;
    }

    const matchPercentage = Math.round(Math.min(100, Math.max(0, rawScore * 100)));

    let feedbackTip = '';
    if (player.isMoving) {
      feedbackTip = '⚠️ Đang di chuyển! Thợ săn phát hiện chuyển động tức thì.';
    } else if (!player.isFrozen) {
      feedbackTip = 'Nhấn [SPACE] để khóa tư thế đứng yên trước tranh!';
    } else if (matchPercentage >= 80) {
      feedbackTip = `✨ Tiệp màu hoàn hảo với ${exhibit.nameVi}!`;
    } else {
      feedbackTip = `🎨 Dùng Hút Màu để lấy đúng sắc độ của ${exhibit.nameVi}.`;
    }

    return {
      matchPercentage,
      backdropName: exhibit.nameVi,
      backdropColor: exhibit.dominantColors[0] || '#f8fafc',
      backdropPattern: 'solid',
      feedbackTip,
      isMoving: player.isMoving,
      isFrozen: player.isFrozen,
    };
  }

  private static calculateColorSimilarity(hex1: string, hex2: string): number {
    const c1 = new THREE.Color(hex1);
    const c2 = new THREE.Color(hex2);

    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;

    const dist = Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3);
    return Math.max(0, 1 - dist);
  }
}
