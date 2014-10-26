/**
 * Created by xelz on 14-10-3.
 */
var data = require('./data');
var games = data.games;
var debug = require('debug'),
    gameDebug = debug('damned:game'),
    playerDebug = debug('damned:player'),
    roomDebug = debug('damned:room');
var Config = {
    stageChangeNotifyTime: 3,
    speakTime: 60,
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
    this.debug('room created: ' + room);
    this.started = false;
};

Game.prototype = {
    debug: function(msg) {
        gameDebug('Game [' + this.socketRoom + '] ' + msg);
    },
    reset: function() {
        delete this.paused;
        this.data = {};
        this.players = [];
        this.started = false;
        clearTimeout(this.timeoutId);
        clearTimeout(this.chooseTimeoutId);
        for(var i in this.clients) {
            if (this.clients.hasOwnProperty(i)) {
                if(!!this.inGameSpeakHandler)
                    this.clients[i].removeListener('speak', this.inGameSpeakHandler);
                this.clients[i].removeAllListeners('move');
                this.clients[i].removeAllListeners('challenge');
                this.clients[i].playerReady = false;
            }
        }
    },
    start: function() {
        this.debug('starting game...');
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
        _rooms[0] = new Room(0, this.socketRoom, 'hall-' + ['small', 'large'][parseInt(Math.random() * 2)],
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
            _rooms[i] = new Room(i, this.socketRoom, roomFunctions[i], roomColors[i], roomLocks[i], 'unknown', []);
        }

        var _clues = _data.clues = {};
        _clues.level1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        var safeRoomId = this.data.safeRoom = parseInt(Math.random() * 12) + 1;
        if(_clients.length > 5) {
            _clues.level1.push(13);
        }
        if(_clients.length > 6) {
            _clues.level1.push(0);
        }
        _clues.level1.sort(shuffle);
        _clues.level2 = ['yellow', 'red', 'blue', 'green'].sort(shuffle);
        _clues.level1.splice(_clues.level1.indexOf(safeRoomId), 1);
        _clues.level2.splice(_clues.level2.indexOf(_rooms[safeRoomId].color), 1);
        _clues.level3 = [_rooms[safeRoomId].hasLock ? 'noLock' : 'hasLock'];

        var _roles = ['traitor'];
        for (i=0; i<=_playerCount; i++ ) _roles.push('victim');
        _roles.sort(shuffle);
        _clients.sort(shuffle);
        for(i in _clients) {
            if(_clients.hasOwnProperty(i)) {
                _clients[i].playerReady = false;
                var playerId = parseInt(i) + 1;
                var player = new Player(playerId, _clients[i].playerName, _roles[i], _clients[i].id, this.socketRoom);
                _players.push(player);
                _rooms[player.room].addPlayer(playerId);
            }
        }

        for(i in _clients) {
            if(_clients.hasOwnProperty(i)) {
                var sHeaders = _clients[i].handshake.headers,
                    clientIp = sHeaders['x-forwarded-for'] ? sHeaders['x-forwarded-for'] : _clients[i].client.conn.remoteAddress;
                this.debug('Player ' + (parseInt(i) + 1) + '(' + _clients[i].playerName + ') ' + _roles[i] + ' ip: ' + clientIp);
            }
        }

        this.debug('==============Game Config Start==============');
        this.debug('rooms: \n' + JSON.stringify(_rooms, null, 4));
        this.debug('players: \n' + JSON.stringify(_players, null, 4));
        this.debug('clues: ' + JSON.stringify(_clues, null, 0));
        this.debug('===============Game Config End===============');

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

        for(i in _players) {
            if (_players.hasOwnProperty(i)) {
                this.notify(_players[i].id, 'start', {
                    rooms: _rooms,
                    players: prunePlayers(i),
                    playerId: parseInt(i) + 1,
                    safeRoom: _players[i].role == 'traitor' ? safeRoomId : undefined
                });
            }
        }

//        告诉奸徒安全房间
//        for(i in _players) {
//            if (_players.hasOwnProperty(i) && _players[i].role == 'traitor') {
//                this.debug('tell safe room [' + safeRoomId + '] to player ' + _players[i].id + ' through socket ' + _players[i].socket);
//                this.io.to(_players[i].socket).emit('safe', safeRoomId);
//                this.notify(_players[i].id, 'safe', safeRoomId);
//            }
//        }

        _data.progress = {round: 0, stage:'prepare', room: null, player: null, time:0, bomb: 0};

//        for(i in _clients) {
//            if (_clients.hasOwnProperty(i)) {
//                this.serv(_clients[i]);
//            }
//        }
        this.nextStep();
    },
    over: function () {
        var _rooms = this.data.rooms;
        var _players = this.players;
        var safeRoom = _rooms[this.data.safeRoom];
        var escapedPlayers = [], i, player;
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
        var winner = escapedPlayers.length >= _players.length - (traitor == undefined ? 0 : 1) - 2 ? 'victim' : 'traitor';
        this.broadcast('over', {
            traitor: traitor,
            winner: winner,
            safeRoom: this.data.safeRoom
        });
        this.reset();
    },
    nextStep: function() {
        var _self = this, i, roomId, playerId, player, client;
        var _rooms = this.data.rooms;
        var _clues = this.data.clues;
        var _players = this.players;
        var _clients = this.clients;
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
                    _progress.room = -1;
                    for (i in _rooms) { // 获取行动顺序
                        if(_rooms.hasOwnProperty(i)) {
                            _order[i] = _rooms[i].players.slice(0);
                        }
                    }
                    this.debug('Action order ' + JSON.stringify(_order, null, 0));
                }
                _progress.time = _progress.stage == 'speak' ? (Config.speakTime + _progress.round * 10) : Config.moveTime;
                // 如果有钥匙事件
                if(this.data.keyAction) {
                    _progress.time = Config.chooseTime;
                    var to = this.data.keyAction.to;
                    this.challenge(to, _clients[to.id - 1], this.data.keyAction.type, {
                        fromPlayer: this.data.keyAction.from.id,
                        message: this.data.keyAction.message
                    });
                    delete this.data.keyAction;
                    return;
                }
                // 下一个玩家
                if(_progress.player != null && _progress.player < _order[_progress.room].length - 1) { // 房间里还有其他玩家
                    _progress.player += 1;
                } else { // 上一个房间所有玩家执行完毕
                    // 如果有钥匙投票事件
                    if(this.data.keyVote) {
                        var masterId, slavePlayerIds = _rooms[_progress.room].players.slice(0);
                        for(i in slavePlayerIds) {
                            if(slavePlayerIds.hasOwnProperty(i)) {
                                if(_players[slavePlayerIds[i] - 1].hasKey) {
                                    masterId = slavePlayerIds[i];
                                    break;
                                }
                            }
                        }
                        slavePlayerIds.splice(slavePlayerIds.indexOf(masterId), 1);
                        this.askForAction(masterId, slavePlayerIds);
                        delete this.data.keyVote;
                        return;
                    }
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
                    this.over();
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
                    this.debug('Perform order ' + JSON.stringify(_order, null, 0));
                }
                if((!this.functionPerformed
                    || _progress.room != -1 && _rooms[_progress.room].hasKey)
                    && _progress.player < _order[_progress.room].length - 1) { // (房间功能尚未执行或房间有钥匙)且存在其他玩家
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
//                            this.nextStep();
                            this.nextWithReason(player.id, 'player-detoxified');
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
//                                this.nextStep();
                                this.nextWithReason(player.id, 'empty-clue-pool');
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
                        this.debug('Players that can be watched: ' + JSON.stringify(alternativePlayers, null, 0));
                        this.functionPerformed = true;
                        if(alternativePlayers.length == 0) {
//                            this.nextStep();
                            this.nextWithReason(player.id, 'no-player-to-watch')
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
//                            this.nextStep();
                            this.nextWithReason(player.id, 'player-no-clue');
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
                        if(alternativePlayers.length == 0) {// 无可执行的升级方案，让过房间功能执行权
//                            this.nextStep();
                            this.nextWithReason(player.id, 'no-valid-solution');
                        } else if(alternativePlayers.length == 1) {
                            this.functionPerformed = true;
                            this.askForAction(player.id, [alternativePlayers[0]]);
                        } else {
                            this.functionPerformed = true;
                            this.challenge(player, client, 'who', alternativePlayers);
                        }
                        break;
                    case 'disarm':
                        this.functionPerformed = true;
                        if(_progress.bomb < 0 || _progress.bomb == 2) { // 拆弹房失效 或已拆两次
//                            this.nextStep();
                            this.nextWithReason(player.id, 'can-not-disarm');
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
//                            this.nextStep();
                            this.nextWithReason(player.id, 'second-disarm-room');
                            break;
                        }
                        var minPlayerCount = 2;
                        if((_progress.bomb == 1 && this.players.length >=6 && this.players.length <= 8) // 6-8人第二次
                            || (_progress.bomb == 0 && this.players.length >= 8 && this.players.length <= 9)) // 8-9人第一次
                            minPlayerCount = 3;
                        if(_progress.bomb == 1 && this.players.length ==9) // 9人第二次
                            minPlayerCount = 4;
                        if(room.players.length < 1 || anotherDisarmRoom.players.length < 1 ||
                            room.players.length + anotherDisarmRoom.players.length < minPlayerCount) { // 人数不足
//                            this.nextStep();
                            this.nextWithReason(player.id, 'no-enough-player');
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
        _self.inGameSpeakHandler = function(msg) {
            if(typeof(msg) == 'string') {
                player.debug('says: ' + msg);
                _self.broadcast('speak', {player: player.id, content: msg});
                if (msg.toLowerCase().indexOf('over') >= 0) {
                    socket.removeListener('speak', _self.inGameSpeakHandler);
                    _self.nextBeforeTimeout();
                }
            } else if(typeof(msg) == 'object'){
                player.debug('key action:' + JSON.stringify(msg, null, 0));
                if(msg.type == 'give' || msg.type == 'request') {
                    var targetPlayer = _self.players[parseInt(msg.targetPlayerId) - 1];
                    if(!targetPlayer || targetPlayer.room != player.room) return;
                    if((msg.type == 'give' && (!player.hasKey || targetPlayer.hasKey)) ||
                        (msg.type == 'request' && (player.hasKey || !targetPlayer.hasKey))) {
                        player.debug('inlvalid key action ' + JSON.stringify(msg, null, 0));
                        return;
                    }
                    _self.data.keyAction = {
                        type: msg.type,
                        from: player,
                        to: targetPlayer,
                        message: msg.message
                    };
                    _self.debug('key action:' + JSON.stringify(_self.data.keyAction, null, 4));
                } else if(msg.type == 'vote') {
                    var currentRoom = _self.data.rooms[_self.data.progress.room];
                    if(currentRoom.players.length < 3) return; //人数少于3
                    var keyCount = 0;
                    for(var i in currentRoom.players) {
                        if(currentRoom.players.hasOwnProperty(i)) {
                            var _player = _self.players[currentRoom.players[i] - 1];
                            if(_player.hasKey) {
                                keyCount ++;
                            }
                        }
                    }
                    if(keyCount != 1) return; // 只有一把钥匙才能投票
                    _self.data.keyVote = true;
                    _self.broadcast('speak', {
                        player: player.id,
                        content: '我发起了抢钥匙，本房间内所有玩家发言完毕后将会进行投票。'
                    })
                }
            }
        };
        socket.on('speak', _self.inGameSpeakHandler);

        _self.updateGameAndAwaitNext(function() {
            socket.removeListener('speak', _self.inGameSpeakHandler);
            player.debug('speak timeout');
        });
    },
    startMove: function(player, socket) {
        var _self = this;
        socket.on('move', function(movements) {
            player.debug('got move: ' + JSON.stringify(movements, null, 0));
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
            _self.checkConnectionAndDo(function() {
                switch(question) {
                    case 'destroy': // 执行销毁线索
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
                    case 'watch': // 执行查看线索
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
                    case 'who': // 选定升级/降级的配合者
                        targetPlayerId = decision;
                        if(!_self.checkMsgType(targetPlayerId, 'number')
                            || options.indexOf(decision) < 0) return;
                        clearTimeout(_self.chooseTimeoutId);
                        socket.removeAllListeners('challenge');
                        _self.askForAction(player.id, [targetPlayerId]);
                        break;
                    case 'give': // 给予/索取钥匙的答复
                    case 'request':
                        if(!_self.checkMsgType(decision, 'boolean')) return;
                        socket.removeAllListeners('challenge');
                        var srcPlayer = _self.players[options.fromPlayer - 1];
                        if(decision) {
                            if(question == 'give') {
                                srcPlayer.transformKey(player);
                            } else {
                                player.transformKey(srcPlayer);
                            }
                        }
                        _self.broadcast('key', {
                            type: question,
                            agree: decision,
                            player: player.id,
                            fromPlayer: options.fromPlayer
                        });
                        _self.nextBeforeTimeout();
                        break;
                }
            });
        });
        switch(question) {
            case 'who': // 设定选人的超时AI
                _self.updateGame();
//                    _self.broadcast('choose', {type: 'who', playerId: player.id, time: Config.chooseTime});
                _self.chooseTimeoutId = setTimeout(function () {
                    _self.checkConnectionAndDo(function() {
                        socket.removeAllListeners('challenge');
                        _self.broadcast('timeout', player.id);
                        player.debug('response challenge [' + question + '] timeout');
                        var targetPlayerId = options[parseInt(Math.random() * options.length)];
                        _self.askForAction(player.id, [targetPlayerId]);
                    });
                }, Config.chooseTime * 1000);
                break;
            case 'destroy': // 设定销毁线索的超时AI
            case 'watch': // 设定查看线索的超时AI
            case 'give': // 设定转让key的超时AI
            case 'request': // 设定索取key的超时AI
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
                        case 'give':
                        case 'request':
                            _self.broadcast('key', {
                                type: question,
                                agree: question == 'give',
                                player: player.id,
                                fromPlayer: options.fromPlayer
                            });
                    }
                });
                break;
        }
        _self.checkConnectionAndDo(function() {
            _self.debug('Challenge player ' + player.id + ' with [' + question + ']');
            _self.broadcast('challenge', {
                player: player.id,
                question: question,
                options: options,
                time: Config.chooseTime
            }); // 送出问题
        });
    },
    challengeMultiplePlayer: function(participants, question, options) {
        var _self = this;
        for(var i in participants) {
            if(participants.hasOwnProperty(i)) {
                var playerId = participants[i],
                    player = _self.players[playerId - 1], socket = _self.clients[playerId - 1];
                (function(player, socket) {
                    socket.on('challenge', function (decision) {
                        player.debug('response challenge [' + question + '] with ' + decision);
                        switch(options.actionType) {
                            case 'disarm':
                            case 'downgrade':
                            case 'upgrade':
                                if(!_self.checkMsgType(decision, 'boolean')) return;
                                socket.removeAllListeners('challenge');
                                if (options.actionType == 'disarm' && player.role == 'victim') {
                                    decision = true;
                                }
                                break;
                            case 'vote':
                                if(!_self.checkMsgType(decision, 'number')) return;
                                if(decision != 0 && !_self.actions.hasOwnProperty(decision)) return;
                                socket.removeAllListeners('challenge');
                                break;
                        }
                        _self.actions[player.id] = decision;
                        _self.performAction();
                    });
                })(player, socket);
            }
        }
        _self.checkConnectionAndDo(function() {
            _self.debug('Challenge multiple player [' + participants + '] with [' + question + ']');
            _self.broadcast('challenge', {
                participants: participants,
                question: question,
                options: options,
                time: Config.chooseTime
            }); // 送出问题
        });
    },
    askForAction: function(masterId, slavePlayerIds) {
        this.actions = {};
        this.actions[masterId] = 'tbd';
        for(var i in slavePlayerIds) {
            if(slavePlayerIds.hasOwnProperty(i)) {
                this.actions[slavePlayerIds[i]] = 'tbd';
            }
        }
        var _self = this;
        this.checkConnectionAndDo(function() {
//            _self.broadcast('wait', {
//                type: _self.data.rooms[_self.data.progress.room].function,
//                actions: _self.actions,
//                time: Config.performTime
//            });
            var players = [], clients = [], participants = [];
            for(var i in _self.actions) {
                if(_self.actions.hasOwnProperty(i)) {
                    var playerId = parseInt(i);
                    players.push(_self.players[playerId - 1]);
                    clients.push(_self.clients[playerId - 1]);
                    participants.push(playerId);
                }
            }
            _self.challengeMultiplePlayer(participants, 'action', {
                masterPlayer: masterId,
                actionType: _self.data.progress.stage == 'speak' ? 'vote' : _self.data.rooms[_self.data.progress.room].function
            });
            _self.chooseTimeoutId = setTimeout(function() { // 设定challenge多人的超时AI
                for(var i in _self.actions) {
                    if(_self.actions.hasOwnProperty(i) && _self.actions[i] == 'tbd') {
                        _self.actions[i] = Math.random() > 0.5; // 随机一个action
                        if(_self.data.progress.stage == 'speak') {
                            _self.actions[i] = 0; // 投票弃权
                        } else if(_self.data.rooms[_self.data.progress.room].function == 'disarm'
                            && _self.players[parseInt(i) - 1].role == 'victim') {
                            _self.actions[i] = true; // 受害者强制拆弹
                        }
                        _self.broadcast('timeout', i);
                        _self.clients[parseInt(i) - 1].removeAllListeners('challenge');
                        _self.debug('Player ' + i + ' response [action] timeout, auto action: ' + _self.actions[i]);
                    }
                }
                _self.performAction();
            }, Config.performTime * 1000);
        });
    },
    performAction: function() {
        var allResponsed = true, actionResult = true;
        for(var i in this.actions) {
            if(this.actions.hasOwnProperty(i)){
                if(this.actions[i] == 'tbd') {
                    allResponsed = false;
                    break;
                }
                if(this.actions[i] === false) {
                    actionResult = false;
                }
            }
        }
        this.debug('Actions: ' + JSON.stringify(this.actions, null, 4));
        if(allResponsed) {
            clearTimeout(this.chooseTimeoutId);
            this.debug('All players responsed, action result: ' + actionResult);
            var roomFunction = this.data.rooms[this.data.progress.room].function;
            var _self = this;
            this.checkConnectionAndDo(function() {
                if(_self.data.progress.stage == 'speak') {
                    var voteResult = {};
                    for(i in _self.actions) {
                        if(_self.actions.hasOwnProperty(i)) {
                            voteResult[i] = 0;
                        }
                    }
                    for(i in _self.actions) {
                        if(_self.actions.hasOwnProperty(i)) {
                            if(_self.actions[i] != 0) {
                                voteResult[_self.actions[i]] ++;
                            }
                        }
                    }
                    var winnerId = 0, maxVotes = 0, parallel = false;
                    for(i in voteResult) {
                        if(voteResult.hasOwnProperty(i)) {
                            if(voteResult[i] > maxVotes) {
                                winnerId = i;
                                maxVotes = voteResult[i];
                                parallel = false;
                            } else if(voteResult[i] == maxVotes){
                                parallel = true;
                            }
                        }
                    }
                    if(parallel) { // 平票
                        winnerId = 0;
                        _self.debug('key stay with original owner.')
                    }
                    if(winnerId != 0) {
                        var keyOwner;
                        for(i in _self.actions) {
                            if(_self.actions.hasOwnProperty(i) && _self.players[i - 1].hasKey) {
                                keyOwner = _self.players[i - 1];
                                break;
                            }
                        }
                        keyOwner.transformKey(_self.players[winnerId - 1]);
                    }
                    _self.broadcast('key', {
                        type: 'vote',
                        vote: _self.actions,
                        winner: winnerId
                    });
                } else {
                    switch (roomFunction) {
                        case 'upgrade':
                        case 'downgrade':
                            if (actionResult) {
                                var _progress = _self.data.progress,
                                    _players = _self.players,
                                    _order = _self.actionOrder,
                                    _clues = _self.data.clues;
                                var oldClues = [], participants = [];
                                for (i in _self.actions) {
                                    if (_self.actions.hasOwnProperty(i)) {
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
                                _self.broadcast('action', {
                                    type: roomFunction,
                                    result: true,
                                    gain: {
                                        player: masterPlayer.id,
                                        level: resultLevel
                                    },
                                    participants: participants
                                });
                                _self.notify(masterPlayer.id, 'clue', {
                                    type: 'receive',
                                    clue: masterPlayer.clue
                                });
                            } else {
                                _self.broadcast('action', {
                                    type: roomFunction,
                                    result: false
                                });
                            }
                            break;
                        case 'disarm':
                            if (actionResult) {
                                _self.data.progress.bomb += 1;
                            } else {
                                _self.data.progress.bomb = -1 - _self.data.progress.bomb;
                            }
                            _self.broadcast('action', {
                                type: 'disarm',
                                result: actionResult,
                                bomb: _self.data.progress.bomb
                            });
                    }
                }
                delete _self.actions;
                _self.nextBeforeTimeout();
            });
        }
    },
    checkMsgType: function(msg, type) {
        if(typeof(msg) != type) {
            this.debug('Event message type mismatch, type "'+ typeof(msg) + '",' + 'expected "' + type +'"');
            return false;
        }
        return true;
    },
    nextWithReason: function(playerId, reason) {
        var _self = this;
        this.checkConnectionAndDo(function() {
            _self.broadcast('skip', {
                player: playerId,
                reason: reason
            });
            _self.timeoutId = setTimeout(function () {
                _self.nextStep();
            }, Config.notifyTime * 1000);
        });
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
//        this.broadcast('update', this.data.progress);
        this.checkConnectionAndDo(function() {
            _self.updateGame();
            _self.timeoutId = setTimeout(function(){
                if(!!timeoutHandler) {
                    timeoutHandler();
                    _self.timeoutId = setTimeout(function () {
                        _self.nextStep();
                    }, (delay ? delay : Config.notifyTime) * 1000);
                } else {
                    _self.nextStep();
                }
            }, _self.data.progress.time * 1000);
        });
    },
    updateGame: function() {
        if(this.data.progress.stage == 'thinking') {
            this.data.progress.clueCounts = [
                this.data.clues.level1.length,
                this.data.clues.level2.length,
                this.data.clues.level3.length
            ];
        }
        this.broadcast('update', this.data.progress);
        if(this.data.progress.stage == 'thinking') {
            delete this.data.progress.clueCounts;
        }
    },
    broadcast: function(event, msg) {
        this.debug('broadcast event [' + event + ']: ' + JSON.stringify(msg, null, 0));
        this.io.to(this.socketRoom).emit(event, msg);
    },
    notify: function(playerId, event, msg) {
        this.debug('notify player ' + playerId + ' [' + event + ']: ' + JSON.stringify(msg, null, 0));
        this.io.to(this.players[playerId - 1].socket).emit(event, msg);
    },
    checkConnectionAndDo: function(handler) {
        if(!this.paused) {
            handler();
        } else {
            this.debug('game paused, waiting for player reconnect.');
            this.pendingHandler = handler;
        }
    },
    add: function(socket) {
        var _room = this.socketRoom;
        this.debug('add client ' + socket.id + ' to room ' + _room);
        var _clients = this.clients;
        var reason = undefined;
        if(this.started) {
            this.debug('failed because game is started');
            reason = 'started';
        } else if(_clients.length == Config.maximumPlayerCount) {
            this.debug('failed because room is full.');
            reason = 'full';
        } else if (_clients.indexOf(socket) >= 0) {
            this.debug('failed because client already in this room.');
            reason = 'unknown';
        }
        if(!!reason) {
            socket.emit('join failed', reason);
            return false;
        }
        socket.socketRoom = _room;
        var _players = [];
        for(var i in _clients) {
            if(_clients.hasOwnProperty(i)) {
                _players.push({
                    clientId: _clients[i].id,
                    name: _clients[i].playerName,
                    ready: _clients[i].playerReady
                });
            }
        }
        socket.emit('room', _room, _players);
        socket.join(_room);
        _clients.push(socket);
        this.broadcast('join', {name: socket.playerName, clientId: socket.id});
        return true;
    },
    remove: function(socket, force) {
        var _room = this.socketRoom;
        this.debug('remove client ' + socket.id + ' from room ' + _room);
        var _clients = this.clients;
        delete socket.socketRoom; // 标示这个socket已经掉线
        socket.leave(_room);
        var _self = this;
        if(this.started) {
            if(force) {
                delete _self.paused;
                this.broadcast('leave', {name: socket.playerName, clientId:socket.id});
                _clients.splice(_clients.indexOf(socket), 1);
                this.over();
            } else {
                if (this.clients.indexOf(socket) >= 0) {
                    if(this.paused) { // 第二人掉线
//                        delete _self.paused;
                        this.broadcast('leave', {name: socket.playerName, clientId:socket.id});
                        _clients.splice(_clients.indexOf(socket), 1);
//                        this.over();
                        if (this.overTimeout) {
                            clearTimeout(this.overTimeout); // 提前结束游戏
                            delete this.overTimeout;
                            this.offlineTimeoutHandler();
                        }
                    } else {
                        this.debug('Player ' + socket.playerName + ' disconnected, game paused.');
                        this.broadcast('offline', {name: socket.playerName, clientId: socket.id, playerId: _clients.indexOf(socket) + 1});
                        this.paused = true;
                        if (this.overTimeout) {
                            clearTimeout(this.overTimeout);
                        }
                        this.offlineTimeoutHandler = function () {
                            _self.broadcast('leave', {name: socket.playerName, clientId: socket.id});
                            delete _self.paused;
                            _clients.splice(_clients.indexOf(socket), 1);
                            if (_self.started) {
                                _self.over();
                            }
                            delete this.offlineTimeoutHandler;
                        };
                        this.overTimeout = setTimeout(this.offlineTimeoutHandler, 120000);
                    }
                } else {
                    // 已经重连成功 之后才检测到掉线
                }
            }
        } else {
            this.broadcast('leave', {name: socket.playerName, clientId:socket.id});
            _clients.splice(_clients.indexOf(socket), 1);
            this.readyToStart();
        }
        if(this.clients.length == 0) {
            if(this.closeTimeout) {
                clearTimeout(this.closeTimeout);
            }
            this.closeTimeout = setTimeout(function() {
                _self.pendingClose();
            }, 30000);
        }
    },
    resume: function(socket, token) {
        var _clients = this.clients, allConnected = true;
        for(var i in _clients) {
            if(_clients.hasOwnProperty(i) && _clients[i].token == token) {
                socket.playerName = _clients[i].playerName;
                socket.playerReady = false;
                socket.token = token;
                socket.socketRoom = this.socketRoom;
                socket.join(this.socketRoom);
                this.debug(_clients[i].playerName + ' reconnected. old socket id: ' + _clients[i].id + ', new socket id: ' + socket.id);
                this.broadcast('reonline', {playerId: parseInt(i) + 1, oldClientId: _clients[i].id, newClientId: socket.id});
                _clients.splice(i, 1, socket);
                clearTimeout(this.overTimeout);
                delete this.overTimeout;
                break;
            }
        }
        for(i in _clients) {
            if(_clients.hasOwnProperty(i) && _clients[i].disconnected) {
                allConnected = false;
                break;
            }
        }
        if(allConnected) {
            delete this.paused;
            if(this.pendingHandler) {
                this.debug('all players online, game resumed.');
                this.pendingHandler();
                delete this.pendingHandler;
            }
        }
    },
    pendingClose: function() {
        if(this.clients.length == 0) {
            this.debug('No players in this room, gonna closed.');
            delete this.closeTimeout;
            delete games[this.socketRoom];
        }
    },
    readyToStart: function() {
        var ready = true, _clients = this.clients;
//        socket.playerReady = true;
//        this.broadcast('ready', socket.playerName);
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
            this.debug('player count enough and all ready, now starting the game.');
            this.start();
        }
    }
};

var Player = function (id, name, role, socket, gameRoom) {
    this.id = id;
    this.name = name;
    this.hasKey = false;
    this.injured = true;
    this.role = role;
    this.room = 0;
    this.socket = socket;
    this.clue = undefined;
    this.gameRoom = gameRoom;
};

Player.prototype = {
    debug: function(msg) {
        playerDebug('Game [' + this.gameRoom + '] Player ' + this.id + ' ' + msg);
    },
    gainKey: function() {
        this.debug('got a key.');
        this.hasKey = true;
    },
    loseKey: function() {
        this.debug('lost the key.');
        this.hasKey = false;
    },
    transformKey: function(anotherPlayer) {
        this.debug('give key to player ' + anotherPlayer.id);
        this.hasKey = false;
        anotherPlayer.hasKey = true;
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
                                if (i == 1 || keyUsed || !this.hasKey || !_room.hasLock
                                    || _room.locked) // 必须持有钥匙、原房间有锁未锁，不能是第二次移动
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
//                            if (room.hasLock) { // 原房间有锁
//                                optionalMovements.push({to: route, lockAction: '-lock'}); // 移动至该房间并回头锁上原房间
//                            }
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

var Room = function (id, gameRoom, roomFunction, color, lock, dangerous, players) {
    this.id = id;
    this.gameRoom = gameRoom;
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
        roomDebug('Game [' + this.gameRoom + '] Room ' + this.id + ' ' + msg);
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
