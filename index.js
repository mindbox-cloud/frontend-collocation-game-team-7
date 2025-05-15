var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var ROWS = 5;
var COLS = 5;
var TICK = 1000;
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
        this.rows = rows;
        this.cols = cols;
        this.playBoard.style.gridTemplateColumns = "repeat(".concat(cols, ",1fr)");
        this.playBoard.style.gridTemplateRows = "repeat(".concat(rows, ",1fr)");
        this.playCells = Array.from({ length: rows * cols }, function () { return new Cell('white'); });
        this.playCells.map(function (cell) {
            _this.playBoard.appendChild(cell.getElement());
        });
        return this;
    };
    PlayBoard.prototype.update = function () {
    };
    PlayBoard.prototype.draw = function () {
        this.playCells.forEach(function (cell) { return cell.draw(); });
    };
    PlayBoard.prototype.clear = function () {
        this.playCells.forEach(function (cell) { return cell.setColor('white'); });
    };
    PlayBoard.prototype.setCell = function (x, y, color) {
        var cell = this.playCells[x + y * this.cols];
        if (cell) {
            cell.setColor(color);
        }
    };
    return PlayBoard;
}());
var getParams = function () {
    var _a, _b, _c, _d;
    var params = new URLSearchParams(location.search);
    var width = (_a = params.get('width')) !== null && _a !== void 0 ? _a : ROWS;
    var height = (_b = params.get('height')) !== null && _b !== void 0 ? _b : COLS;
    var tick = (_c = params.get('tick')) !== null && _c !== void 0 ? _c : TICK;
    var teams = (_d = JSON.parse(params.get('teams'))) !== null && _d !== void 0 ? _d : [
        {
            id: 1,
            color: 'red',
            ships: [{ x: 2, y: 3 }]
        }
    ];
    return { width: width, height: height, tick: tick, teams: teams };
};
var Ship = (function () {
    function Ship() {
        this.id = generateGUID();
        this.isDead = false;
    }
    Ship.prototype.draw = function (board, color) {
        board.setCell(this.x, this.y, this.isDead ? 'black' : color);
    };
    Ship.prototype.sees = function (otherShip, sightRadius) {
        var distance = Math.max(Math.abs(this.x - otherShip.x), Math.abs(this.y - otherShip.y));
        return distance <= sightRadius;
    };
    Ship.prototype.reduceCooldown = function () {
        this.coolDown = Math.max(this.coolDown - 1, 0);
    };
    return Ship;
}());
var DecisionsState = (function () {
    function DecisionsState() {
    }
    return DecisionsState;
}());
var SkipAction = (function () {
    function SkipAction() {
        this.type = "Skip";
    }
    return SkipAction;
}());
var MoveAction = (function () {
    function MoveAction(ship, dx, dy) {
        this.type = "Move";
        this.ship = ship;
        this.dx = dx;
        this.dy = dy;
    }
    return MoveAction;
}());
var ShootAction = (function () {
    function ShootAction(ship, shootAt) {
        this.type = "Shoot";
        this.ship = ship;
        this.shootAt = shootAt;
    }
    return ShootAction;
}());
function randomDir() {
    var a = Math.floor(Math.random() * 3);
    switch (a) {
        case 0: return 1;
        case 1: return -1;
        case 2: return 0;
    }
}
var basicAgent = function (state) {
    if (state.visibleShips.length) {
        var target = null;
        var possibleTargets = state.ourShips.reduce(function (targets, ship) {
            if (ship.coolDown > 0 || ship.isDead)
                return targets;
            var additionalTargets = state.visibleShips
                .filter(function (testShip) { return ship.sees(testShip, state.attackRadius) && !testShip.isDead; })
                .map(function (targetShip) { return ({ shootFrom: ship, shootAt: targetShip }); });
            return __spreadArray(__spreadArray([], targets, true), additionalTargets, true);
        }, []);
        if (possibleTargets.length > 0) {
            var index = Math.floor(Math.random() * possibleTargets.length);
            var target_1 = possibleTargets[index];
            return new ShootAction(target_1.shootFrom.id, target_1.shootAt.id);
        }
    }
    if (state.ourShips.length > 0) {
        var i = Math.floor(Math.random() * state.ourShips.length);
        return new MoveAction(state.ourShips[i].id, randomDir(), randomDir());
    }
    else {
        return new SkipAction();
    }
};
var Team = (function () {
    function Team(_a) {
        var color = _a.color, sightRadius = _a.sightRadius, attackRadius = _a.attackRadius, coolDown = _a.coolDown, accuracy = _a.accuracy;
        this.color = color;
        this.ships = [];
        this.sightRadius = sightRadius;
        this.attackRadius = attackRadius;
        this.coolDown = coolDown;
        this.accuracy = accuracy;
    }
    Team.prototype.draw = function (board) {
        var _this = this;
        this.ships.forEach(function (ship) { return ship.draw(board, _this.color); });
    };
    Team.prototype.seesShip = function (ship) {
        var _this = this;
        return this.ships.reduce(function (sees, testShip) {
            return sees || testShip.sees(ship, _this.sightRadius);
        }, false) || false;
    };
    return Team;
}());
var Game = (function () {
    function Game(playBoard) {
        this.teams = [];
        this.deadShips = [];
        this.playBoard = playBoard;
    }
    Game.prototype.init = function (teamsParam) {
        var _this = this;
        this.teams = [];
        this.deadShips = [];
        var ds = new Ship();
        ds.x = 10;
        ds.y = 10;
        ds.isDead = true;
        this.deadShips.push(ds);
        teamsParam.forEach(function (param) {
            var team = new Team({
                color: param.color,
                sightRadius: param.sightRadius,
                attackRadius: param.attackRadius,
                coolDown: param.coolDown,
                accuracy: param.accuracy,
            });
            team.agent = basicAgent;
            param.ships.forEach(function (shipParam) {
                var ship = new Ship();
                ship.x = shipParam.x;
                ship.y = shipParam.y;
                ship.coolDown = 0;
                team.ships.push(ship);
            });
            _this.teams.push(team);
        });
    };
    Game.prototype.update = function () {
        var _this = this;
        var allShips = this.teams.reduce(function (ships, team) { return __spreadArray(__spreadArray([], ships, true), team.ships, true); }, __spreadArray([], this.deadShips, true));
        allShips.forEach(function (ship) { return ship.reduceCooldown(); });
        this.teams.forEach(function (team) {
            var visibleShips = allShips.filter(function (testShip) {
                var seesShip = team.seesShip(testShip);
                var sameTeam = team.ships.includes(testShip);
                return seesShip && !sameTeam && !testShip.isDead;
            });
            var state = {
                ourShips: team.ships,
                visibleShips: visibleShips,
                teams: [],
                sightRadius: team.sightRadius,
                attackRadius: team.attackRadius,
            };
            var action = team.agent(state);
            console.log(action);
            if (action instanceof MoveAction) {
                var ship_1 = team.ships.find(function (ship) { return ship.id == action.ship; });
                if (!ship_1 || ship_1.isDead)
                    return;
                var newX_1 = ship_1.x + action.dx;
                var newY_1 = ship_1.y + action.dy;
                if (newX_1 < 0)
                    newX_1 = 0;
                if (newX_1 >= _this.playBoard.cols)
                    newX_1 = _this.playBoard.cols - 1;
                if (newY_1 < 0)
                    newY_1 = 0;
                if (newY_1 >= _this.playBoard.rows)
                    newY_1 = _this.playBoard.rows - 1;
                var collidesWith = allShips.find(function (testShip) { return testShip.x == newX_1 && testShip.y == newY_1 && testShip.id !== ship_1.id; });
                if (!collidesWith) {
                    ship_1.x = newX_1;
                    ship_1.y = newY_1;
                }
            }
            if (action instanceof ShootAction) {
                var shootFrom = team.ships.find(function (ship) { return ship.id == action.ship; });
                var shootAt = allShips.find(function (ship) { return ship.id == action.shootAt; });
                if (!shootFrom || shootFrom.isDead || !shootAt)
                    return;
                if (shootFrom.coolDown > 0)
                    return;
                var canShoot = shootFrom.sees(shootAt, team.attackRadius);
                var success = Math.random() <= team.accuracy;
                if (canShoot) {
                    shootFrom.coolDown = team.coolDown;
                    if (success) {
                        shootAt.isDead = true;
                    }
                }
            }
        });
    };
    Game.prototype.draw = function () {
        var _this = this;
        this.playBoard.clear();
        this.teams.forEach(function (team) { return team.draw(_this.playBoard); });
        this.deadShips.forEach(function (ship) { return ship.draw(_this.playBoard, 'black'); });
    };
    return Game;
}());
(function () {
    var _a;
    var params = getParams();
    var root = (_a = document.getElementById('play-board')) !== null && _a !== void 0 ? _a : document.createElement('div');
    root.id = 'play-board';
    root.classList.add('playboard');
    var playBoard = new PlayBoard(root).init(params.height, params.width);
    var game = new Game(playBoard);
    game.init(params.teams);
    game.draw();
    playBoard.draw();
    setInterval(function () {
        game.update();
        game.draw();
        playBoard.draw();
    }, params.tick);
})();
//# sourceMappingURL=index.js.map