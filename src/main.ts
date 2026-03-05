import './style.css';
import { clamp } from 'es-toolkit';

const PLAYER_SIZE = 5;
const HEIGHT = 200;
const CEILING = PLAYER_SIZE;
const DECK = HEIGHT - PLAYER_SIZE;
const JUMP_FORCE = 3;

let jump = false;
document.body.addEventListener('keydown', (ev) => {
  if (ev.key === ' ') jump = true;
  if (ev.key === 'r') {
    state = initialState;
    canvas.classList.add('running');
    canvas.classList.remove('animate');
    setTimeout(() => canvas.classList.add('animate'));
    gameLoop();
  }
});
document.body.addEventListener('keyup', (ev) => {
  if (ev.key === ' ') jump = false;
});

const debugEl = document.querySelector('#debug')!;
const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
canvas.height = HEIGHT;
canvas.width = (HEIGHT * 21) / 9;
const aspect = canvas.width / canvas.height;
console.log(aspect, canvas.width, canvas.height);

const ctx = canvas.getContext('2d')!;

const initialState = {
  gravity: 0.6,
  jump: false,
  x: 10,
  y: DECK,
  speed: 1.8,
  dVertical: 0,
  collision: false,
  map: [
    { type: 'spike' as const, x: 50, y: DECK },
    { type: 'spike' as const, x: 70, y: DECK },
    { type: 'spike' as const, x: 100, y: DECK },
    { type: 'spike' as const, x: 120, y: DECK },
    { type: 'spike' as const, x: 140, y: DECK },
    { type: 'portal' as const, x: 80, y: DECK + 10 },
  ],
};

type State = typeof initialState;

function updateState(state: State, jump: boolean): State {
  const onGround = state.gravity > 0 ? state.y >= DECK : state.y <= CEILING;
  const dVertical = jump && onGround ? JUMP_FORCE : !onGround ? state.dVertical - state.gravity : 0;
  const collision = state.map.some((o) => Math.abs(o.x - state.x) < 3 && Math.abs(o.y - state.y) < 3);
  return {
    gravity: state.gravity,
    jump,
    x: state.x,
    y: clamp(state.y - dVertical, CEILING, DECK),
    dVertical,
    speed: state.speed,
    collision,
    map: state.map.map((o) => ({ ...o, x: o.x - state.speed })),
  };
}

let state = initialState;
let lastLoop = Date.now();

function gameLoop() {
  const now = Date.now();
  if (now - lastLoop < 60) return requestAnimationFrame(gameLoop);
  lastLoop = now;
  state = updateState(state, jump);
  writeDebug(state);

  // render
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer(state, ctx);
  drawMap(state.map, ctx);
  if (state.collision) {
    ctx.font = '50px serif';
    ctx.fillStyle = 'red';
    ctx.fillText('GAME OVER', 50, 50, 100);
    canvas.classList.remove('running');

    return;
  }

  requestAnimationFrame(gameLoop);
}

function drawPlayer(state: State, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'black';
  ctx.fillRect(state.x, state.y, PLAYER_SIZE, PLAYER_SIZE);
}

function drawMap(map: State['map'], ctx: CanvasRenderingContext2D) {
  map
    .filter((o) => o.x < canvas.width)
    .forEach((o) => {
      if (o.type === 'spike') {
        ctx.fillStyle = 'red';
        ctx.fillRect(o.x, o.y, 3, 5);
      }
    });
}

function writeDebug(state: State) {
  debugEl.textContent = `x: ${state.x.toFixed(2)}, y: ${state.y.toFixed(2)}, jump: ${state.jump}, gravity: ${state.gravity}, dVertical: ${state.dVertical.toFixed(3)}`;
}
