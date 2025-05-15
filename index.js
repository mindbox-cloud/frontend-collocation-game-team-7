var ROWS = 5;
var COLS = 5;
var CELL_WIDTH = "50px";
var CELL_HEIGHT = "50px";
var generateHexColor = function () {
    return "#".concat(Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
};
var generateGUID = function () {
    return 'xxxxxxxx'.replace(/[xy]/g, function (char) {
        var random = Math.random() * 16 | 0;
        var value = char === 'x' ? random : (random & 0x3 | 0x8);
        return value.toString(16);
    });
};
var createPlayBoardCell = function (id) {
    var div = document.createElement('div');
    div.id = id;
    div.style.width = CELL_WIDTH;
    div.style.height = CELL_HEIGHT;
    div.className = 'cell';
    return div;
};
var Cell = (function () {
    function Cell(color) {
        this.color = color;
        this.id = generateGUID();
        this.element = createPlayBoardCell(this.id);
    }
    Cell.prototype.getColor = function () {
        return this.color;
    };
    Cell.prototype.setColor = function (newColor) {
        return this.color = newColor;
    };
    Cell.prototype.getElement = function () {
        return this.element;
    };
    Cell.prototype.draw = function () {
        this.element.style.backgroundColor = this.color;
    };
    return Cell;
}());
var PlayBoard = (function () {
    function PlayBoard(element) {
        this.playBoard = element;
        this.playCells = [];
    }
    PlayBoard.prototype.init = function (rows, cols) {
        var _this = this;
        this.playBoard.style.gridTemplateColumns = "repeat(".concat(cols, ",min-content)");
        this.playCells = Array.from({ length: rows * cols }, function () { return new Cell(generateHexColor()); });
        this.playCells.map(function (cell) {
            _this.playBoard.appendChild(cell.getElement());
        });
        return this;
    };
    PlayBoard.prototype.update = function () {
        this.playCells.forEach(function (cell) { return cell.setColor(generateHexColor()); });
    };
    PlayBoard.prototype.draw = function () {
        this.playCells.forEach(function (cell) { return cell.draw(); });
    };
    return PlayBoard;
}());
(function () {
    var _a;
    var root = (_a = document.getElementById('play-board')) !== null && _a !== void 0 ? _a : document.createElement('div');
    root.id = 'play-board';
    root.className = 'playboard';
    var playBoard = new PlayBoard(root).init(ROWS, COLS);
    playBoard.draw();
    setInterval(function () {
        playBoard.update();
        playBoard.draw();
    }, 1000);
})();
//# sourceMappingURL=index.js.map