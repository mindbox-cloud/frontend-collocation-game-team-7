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
var randomNumberInt = function (n) { return Math.floor(Math.random() * n) + 1; };
var generateGUID = function () {
    return 'xxxxxxxx'.replace(/[xy]/g, function (char) {
        var random = Math.random() * 16 | 0;
        var value = char === 'x' ? random : (random & 0x3 | 0x8);
        return value.toString(16);
    });
};
var generateTeam = function (teams, rows, colls) {
    var color = generateHexColor();
    var totalShips = randomNumberInt(teams);
    var ships = Array.from({ length: totalShips }, function () { return ({ x: randomNumberInt(colls), y: randomNumberInt(rows) }); });
    var id = generateGUID();
    var accuracy = randomNumberInt(10);
    return {
        id: id,
        color: color,
        sightRadius: teams,
        attackRadius: teams,
        accuracy: accuracy,
        coolDown: teams,
        ships: ships
    };
};
var generateHexColor = function () {
    return "#".concat(Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
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
    Cell.prototype.explode = function () {
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
    PlayBoard.prototype.getCellByCoords = function (x, y) {
        var cell = this.playCells[x + y * this.cols];
        if (cell) {
            return cell;
        }
    };
    PlayBoard.prototype.setCell = function (x, y, color) {
        var cell = this.getCellByCoords(x, y);
        if (cell) {
            cell.setColor(color);
        }
    };
    return PlayBoard;
}());
var getParams = function () {
    var _a, _b, _c, _d;
    var params = new URLSearchParams(location.search);
    var width = (_a = parseInt(params.get('width'))) !== null && _a !== void 0 ? _a : ROWS;
    var height = (_b = parseInt(params.get('height'))) !== null && _b !== void 0 ? _b : COLS;
    var tick = (_c = params.get('tick')) !== null && _c !== void 0 ? _c : TICK;
    var teamsParam = (_d = parseInt(params.get('teams'))) !== null && _d !== void 0 ? _d : 3;
    var teams = Array.from({ length: teamsParam }, function () { return generateTeam(teamsParam, width, height); });
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
var basicAgent = function () {
    var lastDx = randomDir();
    var lastDy = randomDir();
    var lastTurned = 10;
    return function (state) {
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
            var action = new MoveAction(state.ourShips[i].id, lastDx, lastDy);
            lastTurned -= 1;
            if (lastTurned == 0) {
                lastTurned = 10;
                lastDx = randomDir();
                lastDy = randomDir();
            }
            return action;
        }
        else {
            return new SkipAction();
        }
    };
};
var Team = (function () {
    function Team(_a) {
        var color = _a.color, sightRadius = _a.sightRadius, attackRadius = _a.attackRadius, coolDown = _a.coolDown, accuracy = _a.accuracy, id = _a.id;
        this.id = id;
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
        this.losers = [];
        this.session = null;
    }
    Game.prototype.registerSession = function (session) {
        this.session = session;
    };
    Game.prototype.init = function (teamsParam) {
        var _this = this;
        this.teams = [];
        this.deadShips = [];
        teamsParam.forEach(function (param) {
            var team = new Team({
                id: param.id,
                color: param.color,
                sightRadius: param.sightRadius,
                attackRadius: param.attackRadius,
                coolDown: param.coolDown,
                accuracy: param.accuracy,
            });
            team.agent = basicAgent();
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
            var isAllShipsDead = team.ships.filter(function (ship) { return !ship.isDead; }).length === 0;
            if (isAllShipsDead && !_this.losers.includes(team.id)) {
                _this.losers.push(team.id);
            }
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
        if (this.losers.length === this.teams.length - 1) {
            clearInterval(this.session);
        }
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
    var session = setInterval(function () {
        game.update();
        game.draw();
        playBoard.draw();
    }, params.tick);
    game.registerSession(session);
})();
//# sourceMappingURL=index.js.map