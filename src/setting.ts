// Centralized asset path definitions.  Each game should have its paths grouped
// under its own key so additional games can be added easily.
export const AssetPaths = {
  bjxb: {
    bg: 'assets/bjxb/bg/bg.png',
    symbols: 'assets/bjxb/symbols/',
    border: 'assets/bjxb/symbols/border.png',
    lines: {
      joint: 'assets/bjxb/lines/line_joint.png',
      body: 'assets/bjxb/lines/line_body.png'
    },
    animation: {
      hunter: 'assets/bjxb/animation/hunter/'
    }
  },
  lobby: {
    bg: 'assets/lobby/lobby_bg.png',
    backBtn: 'assets/lobby/backBtn.png',
    bjxb: 'assets/lobby/lobby_icons/bjxb.png'
  }
} as const;
