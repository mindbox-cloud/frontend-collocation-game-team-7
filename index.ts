const ROWS = 5;
const COLS = 5;


const TICK = 1000;

const randomNumberInt = (n: number) => Math.floor(Math.random() * n) + 1;

const generateGUID = (): string => {
  return 'xxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
};

const generateTeam = (teams: number, rows: number, colls: number) => {
  const color = generateHexColor();
  const totalShips = randomNumberInt(teams);
  const ships =  Array.from({ length: totalShips }, () => ({ x: randomNumberInt(colls), y: randomNumberInt(rows) }));
  const id = generateGUID();
  const accuracy = randomNumberInt(10);
  return  {
    id,
    color,
    sightRadius: teams,
    attackRadius: teams,
    accuracy,
    coolDown: teams,
    ships
  }
}

const generateHexColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
};



const createPlayBoardCell = (id: string) => {
  const div = document.createElement('div');
  div.id = id

  div.className = 'cell'
  return  div;
};


 class Cell  {
  id: string;
  color: string;
  element: HTMLElement;

  constructor (color: string) {
    this.color = color;
    this.id = generateGUID();
    this.element = createPlayBoardCell(this.id)
  }
  getColor () {
    return this.color
  }

  setColor (newColor: string) {
    return this.color = newColor
  }

  getElement () {
    return this.element
  }

  explode () {
    return this.element.
  }


  draw () {
    this.element.style.backgroundColor = this.color
  }
}



 class PlayBoard  {

  playBoard: HTMLElement;
  playCells: Cell[];
  rows: number;
  cols: number;

  constructor (element: HTMLElement) {
    this.playBoard =  element;
    this.playCells = [];
  }

  init (rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;

    this.playBoard.style.gridTemplateColumns = `repeat(${cols},1fr)`
    this.playBoard.style.gridTemplateRows = `repeat(${rows},1fr)`

    this.playCells = Array.from({ length: rows * cols }, () => new Cell('white'));
    this.playCells.map(cell => {
      this.playBoard.appendChild(cell.getElement())
    })


    return this
  }

  update () {
    
  }

  draw () {
    this.playCells.forEach(cell => cell.draw())
  }

  clear () {
    this.playCells.forEach(cell => cell.setColor('white'));
  }

  getCellByCoords (x: number, y: number) {
    const cell = this.playCells[x + y * this.cols];
    if (cell) {
      return cell
    }
  }

  setCell (x: number, y: number, color: string) {
    const cell = this.getCellByCoords(x,y)
    if (cell) {
      cell.setColor(color);
    }
  }

}

const getParams = () => {
  const params = new URLSearchParams(location.search);
  const width = parseInt(params.get('width')) ?? ROWS;
  const height = parseInt(params.get('height')) ?? COLS;
  const tick = params.get('tick') ?? TICK;
  const teamsParam = parseInt(params.get('teams')) ?? 3;
  const teams = Array.from({ length: teamsParam }, () => generateTeam(teamsParam, width, height));
  return { width, height, tick, teams }
}

class Ship {
  id: string;
  x: number;
  y: number;
  isDead: boolean;
  coolDown: number;

  constructor() {
    this.id = generateGUID();
    this.isDead = false;
  }

  draw (board: PlayBoard, color: string) {
    board.setCell(this.x, this.y, this.isDead ? 'black' : color);
  }

  sees (otherShip: Ship, sightRadius: number) {
    const distance = Math.max(Math.abs(this.x - otherShip.x), Math.abs(this.y - otherShip.y));
    return distance <= sightRadius;
  }

  reduceCooldown() {
    this.coolDown = Math.max(this.coolDown - 1, 0);
  }
}

class DecisionsState {
  teams: Array<{ id: string; ships: number }>;
  visibleShips: Array<Ship>;
  ourShips: Array<Ship>;
  sightRadius: number;
  attackRadius: number;
}

class SkipAction {
  type = "Skip"
}
class MoveAction {
  type = "Move"
  ship: string;
  dx: 0 | 1 | -1;
  dy: 0 | 1 | -1;
  constructor (ship, dx, dy) {
    this.ship = ship;
    this.dx = dx;
    this.dy = dy;
  }
}
class ShootAction {
  type = "Shoot"
  ship: string;
  shootAt: string;
  constructor(ship: string, shootAt: string) {
    this.ship = ship;
    this.shootAt = shootAt;
  }
}
type Action = MoveAction | ShootAction | SkipAction;

function randomDir(): 0 | 1 | -1 {
  const a = Math.floor(Math.random() * 3);
  switch(a) {
    case 0: return 1;
    case 1: return -1;
    case 2: return 0;
  }
}

const basicAgent = (state: DecisionsState): Action => {
  if (state.visibleShips.length) {
    let target = null;
    const possibleTargets = state.ourShips.reduce((targets, ship) => {
      if (ship.coolDown > 0 || ship.isDead) return targets;
      const additionalTargets = state.visibleShips
        .filter((testShip) => ship.sees(testShip, state.attackRadius) && !testShip.isDead)
        .map((targetShip) => ({ shootFrom: ship, shootAt: targetShip }));
      return [...targets, ...additionalTargets];
    }, []);
    if (possibleTargets.length > 0) {
      const index = Math.floor(Math.random() * possibleTargets.length);
      const target = possibleTargets[index];
      return new ShootAction(target.shootFrom.id, target.shootAt.id);
    }
  }
  if (state.ourShips.length > 0) {
    const i = Math.floor(Math.random() * state.ourShips.length);
    return new MoveAction(state.ourShips[i].id, randomDir(), randomDir());
  } else {
    return new SkipAction();
  }
}

class Team {
  id: string;
  ships: Ship[];
  color: string;
  attackRadius: number;
  sightRadius: number; 
  coolDown: number;
  accuracy: number;
  agent?: (state: unknown) => Action;

  constructor({ color, sightRadius, attackRadius, coolDown, accuracy, id }) {
    this.id = id;
    this.color = color;
    this.ships = [];
    this.sightRadius = sightRadius;
    this.attackRadius = attackRadius;
    this.coolDown = coolDown;
    this.accuracy = accuracy;
  }

  draw (board: PlayBoard) {
    this.ships.forEach(ship => ship.draw(board, this.color));
  }

  seesShip(ship: Ship) {
    return this.ships.reduce((sees, testShip) => {
      return sees || testShip.sees(ship, this.sightRadius);
    }, false) || false;
  }
}

class Game {
  teams: Team[];
  deadShips: Ship[];
  playBoard: PlayBoard;
  losers: string[];
  session: number | null;

  constructor(playBoard: PlayBoard) {
    this.teams = [];
    this.deadShips = [];
    this.playBoard = playBoard;
    this.losers = [];
    this.session = null;
  }

  registerSession (session: number) {
    this.session = session
  }

  init (teamsParam) {
    this.teams = [];
    this.deadShips = [];
    teamsParam.forEach((param) => {
      const team = new Team({
        id: param.id,
        color: param.color,
        sightRadius: param.sightRadius,
        attackRadius: param.attackRadius,
        coolDown: param.coolDown,
        accuracy: param.accuracy,
      });
      team.agent = basicAgent;
      param.ships.forEach((shipParam) => {
        const ship = new Ship();
        ship.x = shipParam.x;
        ship.y = shipParam.y;
        ship.coolDown = 0;
        team.ships.push(ship);
      });
      this.teams.push(team);
    });
  }

  update() {
    const allShips = this.teams.reduce((ships, team) => [...ships, ...team.ships], [...this.deadShips]);
    allShips.forEach((ship) => ship.reduceCooldown());
    this.teams.forEach(team => {
      const isAllShipsDead = team.ships.filter(ship => !ship.isDead).length === 0;
      if (isAllShipsDead && !this.losers.includes(team.id)) {
        this.losers.push(team.id)
      }
      const visibleShips = allShips.filter((testShip) => {
        const seesShip = team.seesShip(testShip);
        const sameTeam = team.ships.includes(testShip);
        return seesShip && !sameTeam && !testShip.isDead;
      });
      const state: DecisionsState = {
        ourShips: team.ships,
        visibleShips,
        teams: [],
        sightRadius: team.sightRadius,
        attackRadius: team.attackRadius,
      };
      const action = team.agent(state);
      if (action instanceof MoveAction) {
        const ship = team.ships.find(ship => ship.id == action.ship);
        if (!ship || ship.isDead) return;
        let newX = ship.x + action.dx;
        let newY = ship.y + action.dy;
        if (newX < 0) newX = 0;
        if (newX >= this.playBoard.cols) newX = this.playBoard.cols - 1;
        if (newY < 0) newY = 0;
        if (newY >= this.playBoard.rows) newY = this.playBoard.rows - 1;
        // collision
        const collidesWith = allShips.find((testShip) => testShip.x == newX && testShip.y == newY && testShip.id !== ship.id);
        if (!collidesWith) {
          ship.x = newX;
          ship.y = newY;
        }
      }
      if (action instanceof ShootAction) {
        const shootFrom = team.ships.find(ship => ship.id == action.ship);
        const shootAt = allShips.find(ship => ship.id == action.shootAt);
        if (!shootFrom || shootFrom.isDead || !shootAt) return;
        if (shootFrom.coolDown > 0) return;
        const canShoot = shootFrom.sees(shootAt, team.attackRadius);
        const success = Math.random() <= team.accuracy;
        if (canShoot) {
          shootFrom.coolDown = team.coolDown;
          if (success) {
            shootAt.isDead = true;
          }
        }
      }

    });


    if (this.losers.length === this.teams.length - 1) {
      clearInterval(this.session)
    }
  }

  draw() {
    this.playBoard.clear();
    this.teams.forEach(team => team.draw(this.playBoard));
    this.deadShips.forEach(ship => ship.draw(this.playBoard, 'black'));
  }
}



(() => {
  const params = getParams();

  const root = document.getElementById('play-board') ?? document.createElement('div');
  root.id = 'play-board';
  root.classList.add('playboard');
  
  const playBoard = new PlayBoard(root).init(params.height, params.width);
  const game = new Game(playBoard);
  game.init(params.teams);
  game.draw();
  playBoard.draw()

  const session = setInterval(() => {
    game.update();
    game.draw();
    playBoard.draw();
  }, params.tick);

  game.registerSession(session)

})()

