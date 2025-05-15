
const ROWS = 5;
const COLS = 5;

const CELL_WIDTH = "50px";
const CELL_HEIGHT = "50px";
const TICK = 1000;

const generateHexColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
};

const generateGUID = (): string => {
  return 'xxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
};

const createPlayBoardCell = (id: string) => {
  const div = document.createElement('div');
  div.id = id

  div.style.width = CELL_WIDTH;
  div.style.height = CELL_HEIGHT;
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


  draw () {
    this.element.style.backgroundColor = this.color
  }
}



 class PlayBoard  {

  playBoard: HTMLElement;
  playCells: Cell[];

  constructor (element: HTMLElement) {
    this.playBoard =  element;
    this.playCells = [];
  }

  init (rows: number, cols: number) {
    this.playBoard.style.gridTemplateColumns = `repeat(${cols},min-content)`
    this.playCells = Array.from({ length: rows * cols }, () => new Cell(generateHexColor()));
    this.playCells.map(cell => {
      this.playBoard.appendChild(cell.getElement())
    })


    return this
  }

  update () {
    this.playCells.forEach(cell => cell.setColor(generateHexColor()))

  }

  draw () {
    this.playCells.forEach(cell => cell.draw())

  }
}

const getParams = () => {
  const params = new URLSearchParams(location.search);
  const width = params.get('width') ?? ROWS;
  const height = params.get('height') ?? COLS;
  const tick = params.get('tick') ?? TICK;
  return { width, height, tick }
}





(() => {
  const params = getParams();
  document.getElementById('width').value = params.width;
  document.getElementById('height').value = params.height;
  document.getElementById('tick').value = params.tick;

  const root = document.getElementById('play-board') ?? document.createElement('div');
  root.id = 'play-board';
  root.className = 'playboard'
  
  const playBoard = new PlayBoard(root).init(params.height, params.width);
  playBoard.draw()


  setInterval(() => {
    playBoard.update()
    playBoard.draw()
    // отрисовать поле
    
  }, params.tick);


})()