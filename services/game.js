/**
 * Created by xelz on 14-10-3.
 */
var debug = require('debug'),
    gameDebug = debug('damned:game'),
    playerDebug = debug('damned:player'),
    roomDebug = debug('damned:room'),
    socketDebug = debug('damned:socket');
var Config = {
    stageChangeNotifyTime: 3,
    speakTime: 120,
    moveTime: 30,
    performTime: 30,
    thinkingTime: 15,
    notifyTime: 1,
    chooseTime: 15,
    minimumPlayerCount: 5,
    maximumPlayerCount: 9
};
var Game = function(room, io) {
    this.data = {};
    this.players = [];
    this.clients = [];
    this.actionOrder = [];
    for(var i = 0; i < 13; i++) {
        this.actionOrder.push(undefined);
    }
    this.socketRoom = room;
    this.io = io;
    this.started = false;
};

Game.prototype = {
    reset: function() {
        this.data = {};
        this.players = [];
        this.started = false;
        clearTimeout(this.timeoutId);
        clearTimeout(this.chooseTimeoutId);
        for(var i in this.clients) {
            if (this.clients.hasOwnProperty(i)) {
                this.clients[i].removeAllListeners('speak');
                this.clients[i].removeAllListeners('move');
                this.clients[i].removeAllListeners('challenge');
            }
        }
    },
    start: function() {
        gameDebug('starting game...');
        var _clients = this.clients;
        var _players = this.players;
        var _playerCount = _clients.length;
        var i;
        var shuffle = function() {
            return Math.random()>.5 ? -1 : 1;
        };
        var _data = this.data;
        var roomColors = [
            'red', 'green', 'blue', 'yellow',
            'red', 'green', 'blue', 'yellow',
            'red', 'green', 'blue', 'yellow'
        ];
        roomColors.sort(shuffle);
        var roomFunctions = [
            'upgrade-large', 'upgrade-small',
            'downgrade-large', 'downgrade-small',
            'clue-large', 'clue-small',
            'watch-large', 'watch-small',
            'detoxify-large', 'detoxify-small',
            'disarm-large', 'disarm-small'
        ];
        roomFunctions.sort(shuffle);
        var roomLocks = [
            'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
            'locked', 'locked', 'locked', 'locked', 'locked', 'locked'
        ];
        roomLocks.sort(shuffle);

        var _rooms = _data.rooms = [];
        // 大厅
        _rooms[0] = new Room(0, 'hall-' + ['small', 'large'][parseInt(Math.random() * 2)],
            'black', 'empty', 'confirmed', []);

        roomColors.unshift('black');
        roomFunctions.unshift('hall-small');
        roomLocks.unshift('empty');
        var _lockedCount = 0, _emptyCount = 0;
        for(i = 1; i <= 12; i++) {
            if (roomLocks[i] == 'empty' && _emptyCount < 3) { // 房间号大的3把钥匙拿走，小的3把留下
                _emptyCount ++;
                roomLocks[i] = 'key';
            } else if (roomLocks[i] == 'locked' && _lockedCount < 3) { // 房间号大的3把锁锁上，小的3把打开
                _lockedCount ++;
                roomLocks[i] = 'unlocked';
            }
            _rooms[i] = new Room(i, roomFunctions[i], roomColors[i], roomLocks[i], 'unknown', []);
        }

        var _clues = _data.clues = {
            level1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].sort(shuffle),
            level2: ['yellow', 'red', 'blue', 'green'].sort(shuffle)
        };
        var safeRoomId = this.data.safeRoom = parseInt(Math.random() * 12) + 1;
        _clues.level1.splice(_clues.level1.indexOf(safeRoomId), 1);
        _clues.level2.splice(_clues.level2.indexOf(_rooms[safeRoomId].color), 1);
        _clues.level3 = [!(_rooms[safeRoomId].lock == 'locked' || _rooms[safeRoomId].lock == 'unlocked')
                            ? 'hasLock' : 'noLock'];

        var _roles = ['traitor'];
        for (i=0; i<=_playerCount; i++ ) _roles.push('victim');
        _roles.sort(shuffle);
        _clients.sort(shuffle);
        for(i in _clients) {
            if(_clients.hasOwnProperty(i)) {
                var playerId = parseInt(i) + 1;
                _clients[i].playerId = playerId;
                var player = new Player(playerId, _clients[i].playerName, _roles[i], _clients[i].id);
                _players.push(player);
                _rooms[player.room].addPlayer(playerId);
            }
        }

        gameDebug('==============Game Config Start==============');
        gameDebug('rooms: \n' + JSON.stringify(_rooms, null, 4));
        gameDebug('players: \n' + JSON.stringify(_players, null, 4));
        gameDebug('clues: ' + JSON.stringify(_clues, null, 0));
        gameDebug('===============Game Config End===============');

        this.started = true;

        var prunePlayers = function(playerId) {
            var _prunedPlayers = [];
            for(var i in _players) {
                if(_players.hasOwnProperty(i)) {
                    _prunedPlayers.push({
                        id: _players[i].id,
                        name: _players[i].name,
                        hasKey: _players[i].hasKey,
                        injured: _players[i].injured,
                        role: i == playerId ? _players[i].role : 'unknown',
                        room: _players[i].room
                    });
                }
            }
            return _prunedPlayers;
        };

        for(i in _clients) {
            if (_clients.hasOwnProperty(i)) {
                this.io.to(_clients[i].id).emit('start', _rooms, prunePlayers(i), parseInt(i) + 1);
            }
        }

        // 告诉奸徒安全房间
        for(i in _players) {
            if (_players.hasOwnProperty(i) && _players[i].role == 'traitor') {
                socketDebug('tell safe room to player ' + _players[i].id + ' through socket ' + _players[i].socket);
                this.io.to(_players[i].socket).emit('safe', safeRoomId);
            }
        }

        _data.progress = {round: 0, stage:'prepare', room: null, player: null, time:0, bomb: 0};

//        for(i in _clients) {
//            if (_clients.hasOwnProperty(i)) {
//                this.serv(_clients[i]);
//            }
//        }
        this.nextStep();
    },
    nextStep: function() {
        var _self = this, i, roomId, playerId, player, client;
        var _rooms = this.data.rooms;
        var _clues = this.data.clues;
        var _players = this.players;
        var _order = this.actionOrder;
        var _progress = this.data.progress;
        switch (_progress.stage) {
            case 'prepare':
                _progress.round = 1;
                _progress.stage = 'speak';
                _progress.room = null;
                _progress.player = null;
                _progress.time = Config.stageChangeNotifyTime;
                this.updateGameAndAwaitNext();
                return;
            case 'speak':
            case 'move':
                if(_progress.room == null) { // 刚进入行动(发言、移动)阶段，初始化
                    _progress.time = _progress.stage == 'speak' ? Config.speakTime : Config.moveTime;
                    _progress.room = -1;
                    for (i in _rooms) { // 获取行动顺序
                        if(_rooms.hasOwnProperty(i)) {
                            _order[i] = _rooms[i].players.slice(0);
                        }
                    }
                    gameDebug('Action order ' + JSON.stringify(_order, null, 0));
                }
                // 下一个玩家
                if(_progress.player != null && _progress.player < _order[_progress.room].length - 1) { // 房间里还有其他玩家
                    _progress.player += 1;
                } else { // 上一个房间所有玩家执行完毕
                    _progress.player = null;
                    for (roomId = _progress.room + 1; roomId <= 12; roomId ++) { // 按照房号查找下一个有玩家的房间
                        if(_order[roomId].length != 0) { // 找到一个有玩家的房间
                            _progress.room = roomId;
                            _progress.player = 0;
                            break;
                        }
                    }
                    if(_progress.player == null) { // 没找到，代表所有玩家都行动完毕
                        _progress.room = null;
                        _progress.time = Config.stageChangeNotifyTime;
                        if(_progress.stage == 'speak') {
                            _progress.stage = 'move'; // 进入行动阶段
                        } else {
                            _progress.round++;
                            _progress.stage = 'time'; // 进入时间阶段
                        }
                        this.updateGameAndAwaitNext();
                        return;
                    }
                }
                playerId = _order[_progress.room][_progress.player];
                player = _players[playerId - 1];
                client = this.clients[playerId - 1];
                _progress.stage == 'move' ? this.startMove(player, client) : this.startSpeak(player, client);
                return;
            case 'time':
                if(_progress.round == (_progress.bomb == 2 ? 9 : 8)) {
                    var safeRoom = _rooms[this.data.safeRoom];
                    var escapedPlayers = [];
                    for(i in safeRoom.players) {
                        if(safeRoom.players.hasOwnProperty(i)) {
                            player = _players[safeRoom.players[i] - 1];
                            if(!player.injured && player.role == 'victim') escapedPlayers.push(player);
                        }
                    }
                    var traitor = undefined;
                    for(i in _players) {
                        if(_players.hasOwnProperty(i) && _players[i].role == 'traitor') {
                            traitor = _players[i].id;
                        }
                    }
                    var winner = escapedPlayers.length >= _players.length - 3 ? 'victim' : 'traitor';
                    this.broadcast('over', {
                        traitor: traitor,
                        winner: winner,
                        safeRoom: this.data.safeRoom
                    });
                    break;
                } else {
                    _progress.stage = 'perform';
                    this.updateGameAndAwaitNext();
                }
                return;
            case 'perform':
                _progress.time = Config.performTime;
                if(_progress.room == null) { // 刚进入执行阶段，初始化
                    _progress.room = -1;
                    for (i in _rooms) { // 获取执行顺序
                        if(_rooms.hasOwnProperty(i)) {
                            _order[i] = _rooms[i].players.slice(0);
                        }
                    }
                    this.functionPerformed = true; // 标记-1号房间功能执行完毕
                    gameDebug('Perform order ' + JSON.stringify(_order, null, 0));
                }
                if(!this.functionPerformed && _progress.player < _order[_progress.room].length - 1) { // 房间功能尚未执行且存在其他玩家
                    _progress.player += 1; // 下一个玩家执行房间功能
                } else { // 上一个房间功能执行完毕
                    _progress.player = null;
                    this.functionPerformed = false;
                    for (roomId = _progress.room + 1; roomId <= 12; roomId ++) { // 按照房号查找下一个有玩家的房间
                        if(_order[roomId].length != 0) { // 找到一个有玩家的房间
                            if(roomId == 0) { // 跳过大厅
                                continue;
                            }
                            _progress.room = roomId;
                            _progress.player = 0; // 房间内第一个玩家执行房间功能
                            break;
                        }
                    }
                    if(_progress.player == null) { // 没找到，代表所有房间功能都执行完毕
                        delete this.functionPerformed;
                        _progress.room = null;
                        _progress.time = Config.thinkingTime;
                        _progress.stage = 'thinking'; // 进入思考阶段
                        this.updateGameAndAwaitNext();
                        return;
                    }
                }
                // 开始执行房间功能
                var room = _rooms[_progress.room];
                playerId = _order[_progress.room][_progress.player];
                player = _players[playerId - 1];
                client = this.clients[playerId - 1];
                // 分配钥匙
                if(room.hasKey && !player.hasKey) {
                    player.gainKey();
                    room.loseKey();
                    this.broadcast('key', {player: playerId, type: 'gain'});
                }
                // 执行房间功能
                if(this.functionPerformed) {
                    this.nextStep();
                    return;
                }
                switch(room.function) {
                    case 'detoxify':
                        if(player.injured) {
                            _progress.time = Config.notifyTime;
                            this.updateGameAndAwaitNext(function() {
                                player.detoxify();
                                _self.functionPerformed = true;
                                _self.broadcast('detoxify', {player: playerId});
                            }, Config.notifyTime);
                        } else { // 玩家已解毒，权利让过
                            this.nextStep();
                        }
                        break;
                    case 'clue':
                        if(!player.clue) { // 玩家没线索卡
                            if(_clues.level1.length > 0) {
                                _progress.time = Config.notifyTime;
                                this.updateGameAndAwaitNext(function() {
                                    player.gainClue({'level': 1, room: _clues.level1.splice(0, 1)[0]});
                                    _self.functionPerformed = true;
                                    _self.broadcast('clue', {
                                        player: playerId,
                                        type: 'gain',
                                        clue:{
                                            level: 1,
                                            room: undefined
                                        }
                                    });
                                    _self.notify(playerId, 'clue', {
                                        type: 'receive',
                                        clue: player.clue
                                    });
                                });
                            } else { // 没线索卡了，权利让过
                                this.nextStep();
                            }
                        } else { // 玩家有线索卡，询问是否销毁
                            this.challenge(player, client, 'destroy');
                        }
                        break;
                    case 'watch':
                        var alternativePlayers = [];
                        for(i in _players) {
                            if(_players.hasOwnProperty(i)) {
                                var _player = _players[i];
                                if(!!_player.clue && _player.id != player.id
                                    && _self.data.rooms[_player.room].function != 'watch') {
                                    alternativePlayers.push(_player.id);
                                }
                            }
                        }
                        gameDebug('Players that can be watched: ' + JSON.stringify(alternativePlayers, null, 0));
                        this.functionPerformed = true;
                        if(alternativePlayers.length == 0) {
                            this.nextStep();
                        } else if(alternativePlayers.length == 1) {
                            _progress.time = Config.notifyTime;
                            this.updateGameAndAwaitNext(function() {
                                _self.broadcast('clue', {
                                    player: player.id,
                                    type:'watch',
                                    target: alternativePlayers[0]
                                });
                                _self.notify(player.id, 'clue', {
                                    player: alternativePlayers[0],
                                    type:'saw',
                                    clue: _self.players[alternativePlayers[0] - 1].clue
                                });
                            });
                        } else {
                            this.challenge(player, client, 'watch', alternativePlayers);
                        }
                        break;
                    case 'upgrade':
                    case 'downgrade':
                        if(!player.clue) { // 玩家没有线索卡，跳过该玩家
                            this.nextStep();
                            break;
                        }
                        var playersWithClue = []; // 找到房间里其他有线索卡的玩家
                        for(i = _progress.player + 1; i < _order[_progress.room].length; i++) {
                            if(!!_players[_order[_progress.room][i] - 1].clue) {
                                playersWithClue.push(_players[_order[_progress.room][i] - 1]);
                            }
                        }
                        alternativePlayers = []; // 找出可以升级的组合
                        for(i = 0; i < playersWithClue.length; i++) {
                            var slave = playersWithClue[i];
                            var upgradeLevel = player.clue.level + slave.clue.level,
                                downGradeLevel = Math.abs(player.clue.level - slave.clue.level);
                            if(room.function == 'upgrade'
                                && (upgradeLevel == 2 || upgradeLevel == 3)
                                && _clues['level' + upgradeLevel].length > 0) {
                                alternativePlayers.push(slave.id);
                            }
                            if(room.function == 'downgrade'
                                && (downGradeLevel == 1 || downGradeLevel == 2)
                                && _clues['level' + downGradeLevel].length > 0) {
                                alternativePlayers.push(slave.id);
                            }
                        }
                        this.functionPerformed = true;
                        if(alternativePlayers.length == 0) {// 无可执行的升级方案，跳过房间功能执行
                            this.nextStep();
                        } else if(alternativePlayers.length == 1) {
                            this.askForAction(player.id, [alternativePlayers[0]]);
                        } else {
                            this.challenge(player, client, 'who', alternativePlayers);
                        }
                        break;
                    case 'disarm':
                        this.functionPerformed = true;
                        if(_progress.bomb < 0 || _progress.bomb == 2) { // 拆弹房失效 或已拆两次
                            this.nextStep();
                            break;
                        }
                        var anotherDisarmRoom;
                        for(i in _rooms) { // 找第一个拆弹房间
                            if(_rooms.hasOwnProperty(i) && _rooms[i].function == 'disarm' && i != room.id) {
                                anotherDisarmRoom = _rooms[i];
                                break;
                            }
                        }
                        if(anotherDisarmRoom.id < room.id) { // 当前是第二个拆弹房， 跳过
                            this.nextStep();
                            break;
                        }
                        var minPlayerCount = 2;
                        if((_progress.bomb > 0 && this.players.length >= 5) || this.players.length == 9)
                            minPlayerCount = 3;
                        if(room.players.length < 1 || anotherDisarmRoom.players.length < 1 ||
                            room.players.length + anotherDisarmRoom.players.length < minPlayerCount) { // 人数不足
                            this.nextStep();
                            break;
                        }
                        var participants = room.players.concat(anotherDisarmRoom.players);
                        this.askForAction(player.id, participants);
                        break;
                }
                return;
            case 'thinking':
                _progress.stage = 'speak';
                _progress.time = Config.stageChangeNotifyTime;
                this.updateGameAndAwaitNext();
                return;
            default:
                // nothing...
                return;
        }
    },
    startSpeak: function(player, socket) {
        var _self = this;
        socket.on('speak', function(msg) {
            player.debug('says: ' + msg);
            if(!_self.checkMsgType(msg, 'string')) return;
            if(msg.indexOf('over') >= 0) {
                socket.removeAllListeners('speak');
                _self.nextBeforeTimeout();
                return;
            }
            _self.broadcast('speak', {player: socket.playerId, content: msg});
        });
        _self.updateGameAndAwaitNext(function() {
            socket.removeAllListeners('speak');
            player.debug('speak timeout');
        });
    },
    startMove: function(player, socket) {
        var _self = this;
        socket.on('move', function(movements) {
            player.debug('emit move: ' + JSON.stringify(movements, null, 0));
            if (!_self.checkMsgType(movements, 'object')) return;
            var checkedMovements = player.checkMovements(movements, _self.data);
            player.debug('actual move: ' + JSON.stringify(checkedMovements, null, 0));
            if (!!checkedMovements) {
                socket.removeAllListeners('move');
                player.move(checkedMovements, _self.data);
                _self.broadcast('move', {player: player.id, movements: checkedMovements});
                _self.nextBeforeTimeout(2);
            }
        });
        _self.updateGameAndAwaitNext(function() {
            socket.removeAllListeners('move');
            player.debug('move timeout');
            _self.broadcast('timeout', player.id);
            var generatedMovements = player.autoMove(_self.data);
            player.debug('auto move: ' + JSON.stringify(generatedMovements, null, 0));
            player.move(generatedMovements, _self.data);
            _self.broadcast('move', {player: player.id, movements: generatedMovements});
        }, 2);
    },
    challenge: function(player, socket, question, options) {
        var _self = this;
        socket.on('challenge', function(decision) {
            player.debug('response challenge [' + question + '] with ' + decision);
            switch(question) {
                case 'destroy':
                    if(!_self.checkMsgType(decision, 'boolean')) return;
                    socket.removeAllListeners('challenge');
                    if(decision) { // 销毁，房间功能被使用
                        player.loseClue();
                        _self.broadcast('clue', {
                            player: player.id,
                            type:'destroy',
                            destroy: true
                        });
                        _self.functionPerformed = true;
                    } else { // 不销毁，权利让过
                        _self.broadcast('clue', {
                            player: player.id,
                            type:'destroy',
                            destroy: false
                        });
                    }
                    _self.nextBeforeTimeout();
                    break;
                case 'watch':
                    var targetPlayerId = decision;
                    if(!_self.checkMsgType(targetPlayerId, 'number')
                        || options.indexOf(decision) < 0) return;
                    socket.removeAllListeners('challenge');
                    _self.broadcast('clue', {
                        player: player.id,
                        type:'watch',
                        target: targetPlayerId
                    });
                    _self.notify(player.id, 'clue', {
                        player: targetPlayerId,
                        type:'saw',
                        clue: _self.players[targetPlayerId - 1].clue
                    });
                    _self.nextBeforeTimeout();
                    break;
                case 'who':
                    targetPlayerId = decision;
                    if(!_self.checkMsgType(targetPlayerId, 'number')
                        || options.indexOf(decision) < 0) return;
                    clearTimeout(_self.chooseTimeoutId);
                    socket.removeAllListeners('challenge');
                    _self.askForAction(player.id, [targetPlayerId]);
                    break;
                case 'action':
                    if(!_self.checkMsgType(decision, 'boolean')) return;
                    socket.removeAllListeners('challenge');
                    if(_self.data.rooms[_self.data.progress.room].function == 'disarm' && player.role == 'victim') {
                        decision = true;
                    }
                    _self.actions[player.id] = decision;
                    _self.performAction();
                    break;
            }
        });
        switch(question) {
            case 'who':
                _self.updateGame();
                _self.chooseTimeoutId = setTimeout(function () {
                    socket.removeAllListeners('challenge');
                    _self.broadcast('timeout', player.id);
                    player.debug('response challenge [' + question + '] timeout');
                    var targetPlayerId = options[parseInt(Math.random() * options.length)];
                    _self.askForAction(player.id, [targetPlayerId]);
                }, Config.chooseTime * 1000);
                break;
            case 'destroy':
            case 'watch':
                _self.updateGameAndAwaitNext(function () {
                    socket.removeAllListeners('challenge');
                    _self.broadcast('timeout', player.id);
                    player.debug('response challenge [' + question + '] timeout');
                    switch (question) {
                        case 'destroy':
                            _self.broadcast('clue', {
                                player: player.id,
                                type: 'destroy',
                                destroy: false});
                            break;
                        case 'watch':
                            var targetPlayerId = options[parseInt(Math.random() * options.length)];
                            _self.broadcast('clue', {
                                player: player.id,
                                type: 'watch',
                                target: targetPlayerId
                            });
                            _self.notify(player.id, 'clue', {
                                player: targetPlayerId,
                                type: 'saw',
                                clue: _self.players[targetPlayerId - 1].clue
                            });
                            break;
                    }
                });
                break;
        }
        socketDebug('Challenge player ' + player.id + ' with [' + question + ']');
        socket.emit('challenge', question, options);
    },
    askForAction: function(masterId, slavePlayerIds) {
        this.actions = {};
        this.actions[masterId] = 'tbd';
        for(var i in slavePlayerIds) {
            if(slavePlayerIds.hasOwnProperty(i)) {
                this.actions[slavePlayerIds[i]] = 'tbd';
            }
        }
        this.broadcast('wait', this.actions);
        for(i in this.actions) {
            if(this.actions.hasOwnProperty(i)) {
                var playerId = i,
                    player = this.players[playerId - 1],
                    client = this.clients[playerId - 1];
                this.challenge(player, client, 'action', masterId);
            }
        }
        var _self = this;
        this.chooseTimeoutId = setTimeout(function() {
            for(var i in _self.actions) {
                if(_self.actions.hasOwnProperty(i) && _self.actions[i] == 'tbd') {
                    _self.actions[i] = Math.random() > 0.5;
                    if(_self.data.rooms[_self.data.progress.room].function == 'disarm'
                        && _self.players[parseInt(i) - 1].role == 'victim') {
                        _self.actions[i] = true;
                    }
                    _self.broadcast('timeout', i);
                    _self.clients[parseInt(i) - 1].removeAllListeners('challenge');
                    gameDebug('Player ' + i + ' response [action] timeout, auto action: ' + _self.actions[i]);
                }
            }
            _self.performAction();
        }, Config.performTime * 1000);
    },
    performAction: function() {
        var allResponsed = true, actionResult = true;
        for(var i in this.actions) {
            if(this.actions.hasOwnProperty(i)){
                if(this.actions[i] == 'tbd') {
                    allResponsed = false;
                    break;
                }
                if(this.actions[i] == false) {
                    actionResult = false;
                }
            }
        }
        gameDebug('Actions: ' + JSON.stringify(this.actions, null, 4));
        if(allResponsed) {
            clearTimeout(this.chooseTimeoutId);
            gameDebug('All players responsed, action result: ' + actionResult);
            var roomFunction = this.data.rooms[this.data.progress.room].function;
            switch (roomFunction) {
                case 'upgrade':
                case 'downgrade':
                    if (actionResult) {
                        var _progress = this.data.progress,
                            _players = this.players,
                            _order = this.actionOrder,
                            _clues = this.data.clues;
                        var oldClues = [], participants = [];
                        for (i in this.actions) {
                            if (this.actions.hasOwnProperty(i)) {
                                oldClues.push(_players[parseInt(i) - 1].clue.level);
                                participants.push(parseInt(i));
                                _players[parseInt(i) - 1].loseClue();
                            }
                        }
                        var masterPlayer = _players[_order[_progress.room][_progress.player] - 1],
                            resultLevel = roomFunction == 'upgrade' ? (oldClues[0] + oldClues[1]) :
                                Math.abs(oldClues[0] - oldClues[1]);
                        masterPlayer.gainClue({
                            level: resultLevel,
                            room: _clues["level" + resultLevel].splice(0, 1)[0]
                        });
                        this.broadcast('action', {
                            type: roomFunction,
                            result: true,
                            gain: {
                                player: masterPlayer.id,
                                level: resultLevel
                            },
                            participants: participants
                        });
                        this.notify(masterPlayer.id, 'clue', {
                            type: 'receive',
                            clue: masterPlayer.clue
                        });
                    } else {
                        this.broadcast('action', {
                            type: roomFunction,
                            result: false
                        });
                    }
                    break;
                case 'disarm':
                    if(actionResult) {
                        this.data.progress.bomb += 1;
                    } else {
                        this.data.progress.bomb = -1 - this.data.progress.bomb;
                    }
                    this.broadcast('action', {
                        type: 'disarm',
                        result: actionResult,
                        bomb: this.data.progress.bomb
                    });
            }
            delete this.actions;
            this.nextBeforeTimeout();
        }
    },
//    serv: function(socket) {
//        if(!!socket.serving) {
//            return;
//        }
//        socket.serving = true;
//        gameDebug('begin to serve player ' +socket.playerId + '[' + socket.id + ']' );
//        var _self = this, _rooms = this.data.rooms, _players = this.players, _player = _players[socket.playerId - 1];
//        var _progress = this.data.progress;
//        var abilityTo = function (stage) {
//            if(_progress.stage != stage || _progress.room == null || _progress.player == null
//                || _rooms[_progress.room].players[_progress.player] != socket.playerId) {
//                gameDebug('Player ' + socket.playerName + '(id:' + socket.playerId + ') ' + stage + ' not permitted');
//                return false;
//            }
//            return true;
//        };
//        socket.on('speak', function(msg) {
//            gameDebug('Player ' + socket.playerName + '(id:' + socket.playerId + ') says: ' + msg);
//            if(!_self.checkMsgType(msg, 'string')) return;
//            if(!abilityTo('speak'))return;
//            _self.broadcast('speak', {player: socket.playerId, content: msg});
//        });
//        socket.on('speak over', function() {
//            gameDebug('Player ' + socket.playerName + '(id:' + socket.playerId + ') speak over.');
//            if(!abilityTo('speak'))return;
//            _self.nextBeforeTimeout();
//        });
//        socket.on('move', function(movements) {
//            gameDebug('Player ' + socket.playerName + '(id:' + socket.playerId + ') move: '
//                + JSON.stringify(movements, null, 0));
//            if(!_self.checkMsgType(movements, 'object')) return;
//            if(!abilityTo('move'))return;
//            var checkedMovements = _player.checkMovements(movements, _self.data);
//            gameDebug('Player ' + _player.id + ' move: ' + checkedMovements);
//            if(!!checkedMovements) {
//                _player.move(checkedMovements, _self.data);
//                _self.broadcast('move', {player: socket.playerId, movements: checkedMovements});
//                _self.nextBeforeTimeout();
//            }
//        });
//    },
    checkMsgType: function(msg, type) {
        if(typeof(msg) != type) {
            gameDebug('Event message type mismatch, type "'+ typeof(msg) + '",' + 'expected "' + type +'"');
            return false;
        }
        return true;
    },
    nextBeforeTimeout: function(delay) {
        var _self = this;
        clearTimeout(_self.timeoutId);
        this.timeoutId = setTimeout(function () {
            _self.nextStep();
        }, (delay ? delay : Config.notifyTime) * 1000);
    },
    updateGameAndAwaitNext: function(timeoutHandler, delay) {
        var _self = this;
//        if(!(this.data.progress.stage == 'perform' && this.data.progress.room != null))
        this.broadcast('update', this.data.progress);
        this.timeoutId = setTimeout(function(){
            if(!!timeoutHandler) {
                timeoutHandler();
                _self.timeoutId = setTimeout(function () {
                    _self.nextStep();
                }, (delay ? delay : Config.notifyTime) * 1000);
            } else {
                _self.nextStep();
            }
        }, this.data.progress.time * 1000);
    },
    updateGame: function() {
        this.broadcast('update', this.data.progress);
    },
    broadcast: function(event, msg) {
        socketDebug('broadcast event [' + event + ']: ' + JSON.stringify(msg, null, 0));
        this.io.to(this.socketRoom).emit(event, msg);
    },
    notify: function(playerId, event, msg) {
        socketDebug('notify player ' + playerId + ' [' + event + ']: ' + JSON.stringify(msg, null, 0));
        this.io.to(this.players[playerId - 1].socket).emit(event, msg);
    },
    add: function(socket) {
        var _room = this.socketRoom;
        gameDebug('add client ' + socket.id + ' to room ' + _room);
        var _clients = this.clients;
        if(this.started) {
            gameDebug('failed because game is started');
            return false;
        } else if(_clients.length == Config.maximumPlayerCount) {
            gameDebug('failed because room is full.');
            return false;
        } else if (_clients.indexOf(socket) >= 0) {
            gameDebug('failed because client already in this room.');
            return false;
        }
        socket.socketRoom = _room;
        var _players = [];
        for(var i in _clients) {
            if(_clients.hasOwnProperty(i)) {
                _players.push(_clients[i].playerName);
            }
        }
        socket.emit('room', _room, _players);
        socket.join(_room);
        _clients.push(socket);
        this.broadcast('join', socket.playerName);
        return true;
    },
    remove: function(socket) {
        var _room = this.socketRoom;
        gameDebug('remove client ' + socket.id + ' from room ' + _room);
        var _clients = this.clients;
        delete socket.socketRoom;
        this.broadcast('leave', socket.playerName);
        socket.leave(_room);
        _clients.splice(_clients.indexOf(socket), 1);
        if(this.started) {
            this.reset();
        }
    },
    readyToStart: function(socket) {
        var ready = true, _clients = this.clients;
        socket.playerReady = true;
        if(_clients.length < Config.minimumPlayerCount) {
            return;
        }
        for(var i in _clients) {
            if(_clients.hasOwnProperty(i) && !_clients[i].playerReady) {
                ready = false;
                break;
            }
        }
        if(ready) {
            gameDebug('player count enough and all ready, now starting the game.');
            this.start();
        }
    }
};

var Player = function (id, name, role, socket) {
    this.id = id;
    this.name = name;
    this.hasKey = false;
    this.injured = true;
    this.role = role;
    this.room = 0;
    this.socket = socket;
    this.clue = undefined;
};

Player.prototype = {
    debug: function(msg) {
        playerDebug('Player ' + this.id + ' ' + msg);
    },
    gainKey: function() {
        this.debug('got a key.');
        this.hasKey = true;
    },
    loseKey: function() {
        this.debug('lost the key.');
        this.hasKey = false;
    },
    detoxify: function() {
        this.debug('got detoxified.');
        this.injured = false;
    },
    injure: function() {
        this.debug('got injured.');
        this.injured = true;
    },
    gainClue: function(clue) {
        this.debug('got a clue: ' + JSON.stringify(clue, null, 0));
        this.clue = clue;
    },
    loseClue: function() {
        this.debug('lost the clue');
        this.clue = undefined;
    },
    move: function(movements, data) {
        var _rooms = data.rooms,
            _originRoom = _rooms[this.room],
            _room = _originRoom;
        for(var i in movements) {
            if(movements.hasOwnProperty(i)) {
                var movement = movements[i],
                    _toRoom = _rooms[movement.to],
                    lockAction = movement.lockAction;
                switch (lockAction) {
                    case 'lock':
                        (!!_toRoom ? _toRoom : _room).lock();
                        break;
                    case 'unlock':
                        (!!_toRoom ? _toRoom : _room).unlock();
                        break;
                    case '-lock':
                        _room.lock();
                        break;
                    case undefined:
                        // nothind to do with the locks
                }
                _room = _toRoom;
            }
        }
        if(!!_toRoom) {
            this.debug('leave room ' + this.room + ' and go to room ' + _toRoom.id);
            this.room = _toRoom.id;
            _originRoom.removePlayer(this.id);
            _toRoom.addPlayer(this.id);
        }
    },
    checkMovements: function(movements, data) {
        if(!(movements instanceof Array) || movements.length > 2 || movements.length < 1) { // 非法的移动
            return false;
        }
        var _progress = data.progress,
            _rooms = data.rooms,
            _originRoom = _rooms[this.room],
            _room = _originRoom,
            keyUsed = false,
            _movements = [];
        for(var i in movements) {
            if (movements.hasOwnProperty(i)) {
                var movement = movements[i],
                    _toRoom = _rooms[movement.to],
                    lockAction = movement.lockAction,
                    anotherMove = i == 0 && movements.length > 1;
                if(!_toRoom) { // 待在原房间
                    if(i == 1 || anotherMove) return false; // 不合法的移动， 停留在原房间只能是唯一的一次移动
                    if(_progress.round == (_progress.bomb == 2 ? 9 : 8) - 1) { // 逃生状态之前的一回合，可以待在原房间
//                        return true;
                    } else if(_room.id == 0) { // 大厅可以停留
//                        return true;
                    } else if(_room.locked) { // 所在房间已上锁
                        if(!lockAction) { // 没有解锁操作，可以停留
//                            return true;
                        } else if(lockAction == 'unlock' && this.hasKey) { // 用钥匙解锁，需且必须停留
//                            return true;
                        } else {
                            return false; // 其他情况，不能停留
                        }
                    } else { // 所在房间没被锁
                        if (_room.hasLock) { // 所在房间有锁
                            if(lockAction == 'lock' && this.hasKey) { // 用钥匙锁上，停留
//                                return true;
                            } else {
                                return false;
                            }
                        } else { // 所在房间没锁，判断是否旁边的房间都被锁了，无路可走
                            var _routes = _room.routes();
                            for(var j in _routes) {
                                if(_routes.hasOwnProperty(j) && !_rooms[_routes[j]].locked) { // 有一个没锁的，不能停留
                                    return false;
                                }
                            }
//                            return true; // 旁边的房间都锁了，可以停留
                        }
                    }
                } else { // 走出了
                    if(!_room.nearBy(_toRoom)) { // 房间不相邻，不能移动
                        return false;
                    } else if (_toRoom.id == _originRoom.id) { // 回到原房间
                        return false;
                    } else {
                        switch (lockAction) {
                            case 'unlock': // 进入有上锁标记的房间，并解锁
                                if (keyUsed || !this.hasKey || _room.locked || !_toRoom.locked
                                    || anotherMove) // 必须持有钥匙、所在房间未锁、目标房间已锁，进入后停留
                                    return false;
                                break;
                            case 'lock': // 进入有解锁标记的房间，并上锁
                                if (keyUsed || !this.hasKey || _room.locked || !_toRoom.hasLock || _toRoom.locked
                                    || anotherMove) // 必须持有钥匙、所在房间未锁、目标房间有锁未锁，上锁后停留
                                    return false;
                                break;
                            case '-lock': // 离开有解锁标记的房间，并上锁
                                if (keyUsed || !this.hasKey || !_room.hasLock
                                    || _room.locked) // 必须持有钥匙、原房间有锁未锁
                                    return false;
                                keyUsed = true; // 使用过钥匙，不能再次使用
                                break;
                            case undefined: // 没有解锁/上锁动作
                                if (_room.locked || _toRoom.locked) // 必须移动之前之后两个房间都没上锁
                                    return false;
                                break;
                            default:
                                return false;
                        }
                        _room = _toRoom;
                    }
                }
                _movements.push({to: movements[i].to, lockAction: movements[i].lockAction});
            }
        }
        return _movements;
    },
    autoMove: function(data) {
        var _rooms = data.rooms,
            room = _rooms[this.room],
            routes = room.routes(),
            optionalMovements = [],
            autoMovements = [];
        var lockedRoomCount = 0;
        for(var i in _rooms) {
            if(_rooms.hasOwnProperty(i) && _rooms[i].locked){
                lockedRoomCount += 1;
            }
        }
        var canLock = lockedRoomCount < 3;
        if(room.locked) { // 所在房间已上锁
            optionalMovements.push({to: undefined, lockAction: undefined}); // 停留
            if(this.hasKey) { // 有钥匙，开锁，停留
                optionalMovements.push({to: undefined, lockAction: 'unlock'});
            }
        } else { // 所在房间未上锁
            if(data.progress.round == (data.progress.bomb == 2 ? 8 : 7) || this.room == 0) { // 逃生前一回合 或者 身处大厅
                optionalMovements.push({to: undefined, lockAction: undefined}); // 停留
            }
            for(i in routes) { // 遍历可达房间
                if(routes.hasOwnProperty(i)) {
                    var route = routes[i];
                    if(!_rooms[route].locked) { // 目标房间未上锁
                        optionalMovements.push({to: route, lockAction: undefined}); // 移动至该房间
                        if(_rooms[route].hasLock && this.hasKey && canLock) { // 目标房间有锁，且玩家拥有钥匙
                            optionalMovements.push({to: route, lockAction: 'lock'}); // 移动至该房间并上锁
                        }
                        if(room.hasLock && this.hasKey && canLock) { // 原房间有锁，且玩家拥有钥匙
                            optionalMovements.push({to: route, lockAction: '-lock'}); // 移动至该房间并回头锁上原房间
                        }
                    } else { // 目标房间已上锁
                        if(this.hasKey) { // 玩家拥有钥匙
                            optionalMovements.push({to: route, lockAction: 'unlock'}); // 移动至该房间，并解锁
                        }
                    }

                }
            }
            if(optionalMovements.length == 0) { // 无可行移动方案
                optionalMovements.push({to: undefined, lockAction: undefined}); // 只能停留
            }
        }
        autoMovements.push(optionalMovements[parseInt(Math.random() * optionalMovements.length)]);
        var firstMovement = autoMovements[0];
        if(Math.random() > 0.5 // 50% 几率尝试走第二步
            && firstMovement.to != undefined  // 走出了
            && firstMovement.lockAction != 'lock' && firstMovement.lockAction != 'unlock') { // 且没有被强制停留
            optionalMovements = [];
            room = _rooms[firstMovement.to]; // 此房间必然没上锁
            routes = _rooms[firstMovement.to].routes();
            for(i in routes) { // 遍历可达房间
                if (routes.hasOwnProperty(i) && routes[i] != this.room) { // 不能回原房间
                    route = routes[i];
                    if(!_rooms[route].locked) { // 目标房间未上锁
                        optionalMovements.push({to: route, lockAction: undefined}); // 移动至该房间
                        if(firstMovement.lockAction != '-lock' && this.hasKey && canLock) { // 玩家拥有钥匙，且没使用过钥匙
                            if (_rooms[route].hasLock) { // 目标房间有锁
                                optionalMovements.push({to: route, lockAction: 'lock'}); // 移动至该房间并上锁
                            }
                            if (room.hasLock) { // 原房间有锁
                                optionalMovements.push({to: route, lockAction: '-lock'}); // 移动至该房间并回头锁上原房间
                            }
                        }
                    } else { // 目标房间已上锁
                        if(firstMovement.lockAction != '-lock' && this.hasKey) { // 玩家拥有钥匙，且没使用过钥匙
                            optionalMovements.push({to: route, lockAction: 'unlock'}); // 移动至该房间，并解锁
                        }
                    }
                }
            }
            if(optionalMovements.length != 0) { // 有可行移动方案
                autoMovements.push(optionalMovements[parseInt(Math.random() * optionalMovements.length)]);
            }
        }
        return autoMovements;
    }
};

var Room = function (id, roomFunction, color, lock, dangerous, players) {
    this.id = id;
    roomFunction = roomFunction.split('-');
    this.function = roomFunction[0];
    this.rule = roomFunction[1];
    this.color = color;
    switch (lock) {
        case 'locked':
            this.locked = true;
            this.hasLock = true;
            this.hasKey = false;
            break;
        case 'unlocked':
            this.locked = false;
            this.hasLock = true;
            this.hasKey = false;
            break;
        case 'key':
            this.locked = false;
            this.hasLock = false;
            this.hasKey = true;
            break;
        case 'empty':
        default:
            this.locked = false;
            this.hasLock = false;
            this.hasKey = false;
    }
    this.dangerous = dangerous;
    this.players = players;
};

Room.prototype = {
    debug: function(msg) {
        roomDebug('Room ' + this.id + ' ' + msg);
    },
    lock: function() {
        this.debug('locked.');
        this.locked = true;
    },
    unlock: function() {
        this.debug('unlocked.');
        this.locked = false;
    },
    loseKey: function() {
        this.debug('lose the key.');
        this.hasKey = false;
    },
    addPlayer: function(player) {
        var _players = this.players;
        var large = function(a, b) { return b - a; };
        var small = function(a, b) { return a - b; };
        _players.push(player);
        _players.sort(this.rule == 'small' ? small : large);
        this.debug('add player ' + player + ', all players [' + _players + ']');
    },
    removePlayer: function(player) {
        var _players = this.players;
        _players.splice(_players.indexOf(player), 1);
        this.debug('remove player ' + player + ', all players [' + _players + ']');
    },
    nearBy: function(anotherRoom) {
        return Room.route[this.id].indexOf(anotherRoom.id) >= 0;
    },
    routes: function() {
        return Room.route[this.id];
    }
};

Room.route = [
    [ 3,  6,  7, 10], // 0
    [ 3],             // 1
    [ 3,  6],         // 2
    [ 0,  1,  2,  4], // 3
    [ 3,  7],         // 4
    [ 6],             // 5
    [ 0,  2,  5,  9], // 6
    [ 0,  4,  8, 11], // 7
    [ 7],             // 8
    [ 6, 10],         // 9
    [ 0,  9, 11, 12], //10
    [ 7, 10],         //11
    [10]              //12
];

module.exports = Game;
