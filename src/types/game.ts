export type TexturePattern =
  | 'solid'
  | 'brick'
  | 'foliage'
  | 'marble'
  | 'gold'
  | 'popart'
  | 'wood'
  | 'damask'
  | 'slate';

export type BodyPart = 'all' | 'head' | 'torso' | 'arms' | 'legs';

export type PoseType =
  | 'standing'
  | 'statue_classical'
  | 'wall_hug'
  | 'thinker'
  | 'crouch_bush';

export type SeekerState =
  | 'patrol'
  | 'scan'
  | 'investigate_sound'
  | 'alert'
  | 'chase';

export type GameStatus = 'ready' | 'playing' | 'paused' | 'caught' | 'victory';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface PlayerCamo {
  color: string;
  pattern: TexturePattern;
  roughness: number;
  metalness: number;
}

export interface CamoPreset {
  id: string;
  name: string;
  nameVi: string;
  color: string;
  pattern: TexturePattern;
  roughness: number;
  metalness: number;
  recommendedPose?: PoseType;
  description: string;
}

export interface MatchResult {
  matchPercentage: number;
  backdropName: string;
  backdropColor: string;
  backdropPattern: TexturePattern;
  feedbackTip: string;
  isMoving: boolean;
  isFrozen: boolean;
}

export interface GameStats {
  timeSurvived: number;
  whistlesSurvived: number;
  closeCalls: number;
  bestMatch: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
}
