import { BjxbSlotGame } from './games/bjxb/BjxbSlotGame';

document.addEventListener('DOMContentLoaded', () => {
  const game = new BjxbSlotGame();
  game.start('game');
});

