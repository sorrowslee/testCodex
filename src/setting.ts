export interface GameAssetConfig {
  symbolCount: number;
  // animation type to frame count
  animations: Record<string, number>;
  bg: string;
  border: string;
  lines: { joint: string; body: string };
  symbol: (index: number) => string;
  animationFrame: (type: string, index: number) => string;
}

export interface GameRuleSettings {
  /** Allowed line directions for scoring */
  lineDirections: {
    horizontal: boolean;
    vertical: boolean;
    diagonal: boolean;
  };
  /** Minimum number of consecutive symbols to score */
  minMatch: number;
  /** Score gained per matched symbol */
  scorePerBlock: number;
  /** Score multiple required to trigger Hot Spin */
  hotSpinThresholdMultiple: number;
  /** Number of symbol types during Hot Spin */
  hotSpinSymbolTypeCount: number;
}

function createGameConfig(name: string, symbolCount: number, animations: Record<string, number>): GameAssetConfig {
  return {
    symbolCount,
    animations,
    bg: `assets/${name}/bg/${name}_bg.png`,
    border: `assets/${name}/symbols/${name}_border.png`,
    lines: {
      joint: `assets/${name}/lines/${name}_line_joint.png`,
      body: `assets/${name}/lines/${name}_line_body.png`
    },
    symbol: (index: number) => {
      const num = String(index).padStart(3, '0');
      return `assets/${name}/symbols/${name}_${num}.png`;
    },
    animationFrame: (type: string, index: number) => {
      const num = String(index).padStart(3, '0');
      return `assets/${name}/animation/${type}/${name}_${type}_${num}.png`;
    }
  };
}

export const AssetPaths = {
  bjxb: createGameConfig('bjxb', 10, { hunter: 51 }),
  lobby: {
    bg: 'assets/lobby/lobby_bg.png',
    backBtn: 'assets/lobby/backBtn.png',
    bjxb: 'assets/lobby/lobby_icons/bjxb.png'
  }
} as const;

export const DefaultGameSettings: GameRuleSettings = {
  lineDirections: { horizontal: true, vertical: true, diagonal: true },
  minMatch: 3,
  scorePerBlock: 10,
  hotSpinThresholdMultiple: 100,
  hotSpinSymbolTypeCount: 3
};
