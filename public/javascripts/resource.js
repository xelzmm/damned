/**
 * Created by xelz on 14-10-3.
 */
var GameConfig = {
    resourceBounds: {
        "playground": {x: 0, y: 0, w: 1091, h: 1091},
        "key": {x: 1132, y: 0, w: 57, h: 66},
        "unlocked": {x: 1206, y: 0, w: 57, h: 66},
        "locked": {x: 1276, y: 0, w: 57, h: 66},
        "player-1-green": {x: 1345, y: 0, w: 55, h: 55},
        "player-2-green": {x: 1417, y: 0, w: 55, h: 55},
        "player-3-green": {x: 1488, y: 0, w: 55, h: 55},
        "player-4-green": {x: 1558, y: 0, w: 55, h: 55},
        "player-5-green": {x: 1629, y: 0, w: 55, h: 55},
        "player-6-green": {x: 1700, y: 0, w: 55, h: 55},
        "player-7-green": {x: 1771, y: 0, w: 55, h: 55},
        "player-8-green": {x: 1842, y: 0, w: 55, h: 55},
        "player-9-green": {x: 1913, y: 0, w: 55, h: 55},
        "round-board": {x: 1984, y: 0, w: 199, h: 94},
        "timer": {x: 2196, y: 0, w: 67, h: 93},
        "bomb": {x: 2267, y: 0, w: 67, h: 93},
        "bomb-invalid": {x: 2267, y: 99, w: 67, h: 93},
        "confirmed": {x: 1133, y: 70, w: 46, h: 55},
        "possible": {x: 1206, y: 70, w: 46, h: 55},
        "unknown": {x: 1279, y: 70, w: 46, h: 55},
        "player-1-red": {x: 1345, y: 70, w: 55, h: 55},
        "player-2-red": {x: 1417, y: 70, w: 55, h: 55},
        "player-3-red": {x: 1488, y: 70, w: 55, h: 55},
        "player-4-red": {x: 1558, y: 70, w: 55, h: 55},
        "player-5-red": {x: 1629, y: 70, w: 55, h: 55},
        "player-6-red": {x: 1700, y: 70, w: 55, h: 55},
        "player-7-red": {x: 1771, y: 70, w: 55, h: 55},
        "player-8-red": {x: 1842, y: 70, w: 55, h: 55},
        "player-9-red": {x: 1913, y: 70, w: 55, h: 55},
        "red": {x: 1132, y: 146, w: 273, h: 273},
        "green": {x: 1417, y: 146, w: 273, h: 273},
        "yellow": {x: 1700, y: 146, w: 273, h: 273},
        "blue": {x: 1984, y: 146, w: 273, h: 273},
        "hall-small": {x: 2123, y: 429, w: 270, h: 270},
        "hall-large": {x: 2123, y: 741, w: 270, h: 270},
        "upgrade-large": {x: 1132, y: 428, w: 224, h: 168},
        "upgrade-small": {x: 1374, y: 428, w: 224, h: 168},
        "clue-large": {x: 1617, y: 428, w: 224, h: 168},
        "clue-small": {x: 1859, y: 428, w: 224, h: 168},
        "downgrade-large": {x: 1132, y: 616, w: 224, h: 168},
        "downgrade-small": {x: 1374, y: 616, w: 224, h: 168},
        "watch-large": {x: 1617, y: 616, w: 224, h: 168},
        "watch-small": {x: 1859, y: 616, w: 224, h: 168},
        "detoxify-large": {x: 1132, y: 795, w: 224, h: 168},
        "detoxify-small": {x: 1374, y: 795, w: 224, h: 168},
        "disarm-large": {x: 1617, y: 795, w: 224, h: 168},
        "disarm-small": {x: 1859, y: 795, w: 224, h: 168}
    },
    roomPosition: [
        {x: 410, y: 399}, // 0
        {x: 681, y: 128}, // 1
        {x: 410, y: 128}, // 2
        {x: 544, y: 265}, // 3
        {x: 681, y: 399}, // 4
        {x: 139, y: 128}, // 5
        {x: 273, y: 265}, // 6
        {x: 544, y: 534}, // 7
        {x: 681, y: 670}, // 8
        {x: 139, y: 399}, // 9
        {x: 273, y: 534}, // 10
        {x: 410, y: 670}, // 11
        {x: 139, y: 670}  // 12
    ],
    dangerousBoard: {
        x: 382,
        y: 42,
        step: 48
    },
    roundBoard: {
        x: 538,
        y: 962
    },
    timerBoard: {
        x: 135,
        y: 964,
        step: 67
    },
    bombBoard: {
        x: 825,
        y: 964,
        step: 68
    },
    clueBoard: {
        x: 430,
        y: 44,
        step: 47
    },
    stage: {
        speak: '发言',
        move: '移动',
        time: '时间',
        perform: '执行',
        thinking: '思考'
    },
    function: {
        clue: '线索',
        upgrade: '升级',
        downgrade: '降级',
        disarm: '拆弹',
        watch: '监控',
        detoxify: '治疗',
        hall: '大厅'
    },
    role: {
        victim: '受害者',
        traitor:'奸徒'
    },
    color: {
        yellow: '黄色',
        red: '红色',
        blue: '蓝色',
        green: '绿色',
        black: '黑色'
    },
    seats: [
        [],
        [{x: 135, y: 135}], // .
        [{x: 105, y: 135}, {x: 165, y: 135}], // ..
        [         {x: 135, y: 110},
         {x: 105, y: 160}, {x: 165, y: 160}], // ∴
        [         {x: 135, y:  90},
         {x:  90, y: 135}, {x: 180, y: 135},
                  {x: 135, y: 180}],          // +
        [                  {x: 135, y:  75},
         {x:  75, y: 135}, {x: 135, y: 135}, {x: 195, y: 135},
                           {x: 135, y: 195}],
        [                  {x: 135, y:  75},
         {x:  75, y: 135}, {x: 135, y: 135}, {x: 195, y: 135},
                   {x: 105, y: 190}, {x: 165, y: 190}], // ☆
        [          {x: 105, y:  80}, {x: 165, y:  80},
         {x:  75, y: 135}, {x: 135, y: 135}, {x: 195, y: 135},
                   {x: 105, y: 190}, {x: 165, y: 190}], // #
        [         {x: 105, y:  80}, {x: 165, y:  80},
         {x:  75, y: 135}, {x: 135, y: 135}, {x: 195, y: 135},
         {x:  75, y: 195}, {x: 135, y: 195}, {x: 195, y: 195}],
        [{x:  75, y:  75}, {x: 135, y:  75}, {x: 195, y:  75},
         {x:  75, y: 135}, {x: 135, y: 135}, {x: 195, y: 135},
         {x:  75, y: 195}, {x: 135, y: 195}, {x: 195, y: 195}]
    ]
};

var Player = function (player) {
    for (var prop in player) {
        if (player.hasOwnProperty(prop))
            this[prop] = player[prop];
    }
};

Player.prototype = {
    debug: function (msg) {
        msg = this.getDisplayName() + msg;
        print(msg, this.id == me.id ? 'self' : 'player');
    },
    getDisplayName: function() {
        return this.id == me.id ? '【你】' : ('【' + this.id + '】号玩家 (' + this.name + ') ');
    },
    speak: function(content) {
        var msg = this.getDisplayName() + '说：' + content;
        print(msg, (this.id == me.id ? 'self' : 'player') + ' speak');
    },
    gainKey: function (from) {
        this.debug('获得了' + from.getDisplayName() + '的钥匙.');
        from.loseKey();
        this.hasKey = true;
        if (!this.keyMarker) {
            var keyMarker = this.keyMarker = document.createElement('img');
            keyMarker.src = '/images/key.png';
            keyMarker.style.position = 'absolute';
            keyMarker.style.right = '0px';
            keyMarker.title = keyMarker.alt = '钥匙';
            this.playerMarker.appendChild(keyMarker);
        }
    },
    loseKey: function () {
        this.debug('失去了钥匙.');
        this.hasKey = false;
        if (this.keyMarker) {
            removeNode(this.keyMarker);
            delete this.keyMarker;
        }
    },
    processKeyGive: function(agree, fromPlayer) {
        this.debug((agree ? '【接受】' : '【拒绝】') + '了' + fromPlayer.getDisplayName() + '赠予的钥匙。');
        if(agree) {
            this.gainKey(fromPlayer);
        }
    },
    processKeyRequest: function(agree, fromPlayer) {
        this.debug((agree ? '【同意】' : '【拒绝】') + '了' + fromPlayer.getDisplayName() + '的索要钥匙请求。');
        if(agree) {
            fromPlayer.gainKey(this);
        }
    },
    detoxify: function () {
        this.debug('获得了治疗.');
        this.injured = false;
        this.playerMarker.className = 'player-' + this.id + '-green';
    },
    injure: function () {
        this.debug('受到毒雾感染.');
        this.injured = true;
        this.playerMarker.className = 'player-' + this.id + '-red';
    },
    sawClue: function (playerId, clue) {
        var targetPlayer = Game.players[playerId - 1];
        if(!clue) {
            this.debug('查看了' + targetPlayer.getDisplayName() + '的线索卡.');
        } else {
            var msg = '看到了 ' + targetPlayer.getDisplayName() + '的【' + clue.level + '】级线索卡, 上面写着: ';
            switch (clue.level) {
                case 1:
                    msg += clue.room == 0 ? '【大厅】' : ('【' + clue.room + '】号房间');
                    break;
                case 2:
                    msg += '【' + GameConfig.color[clue.room] + '】房间';
                    break;
                case 3:
                    msg += clue.room == 'hasLock' ? '【有锁】的房间' : '【无锁】的房间';
                    break;
            }
            msg += '是最终危险的!';
            this.debug(msg);
            alert('你' + msg);
            this.markDangerous(clue);
        }
        if (!targetPlayer.watchedMarker) {
            var watchedMarker = targetPlayer.watchedMarker = document.createElement('img');
            watchedMarker.src = '/images/watched.png';
            watchedMarker.style.position = 'absolute';
            watchedMarker.style.right = '0px';
            watchedMarker.style.bottom = '0px';
            watchedMarker.title = watchedMarker.alt = '线索已被查看过';
            targetPlayer.playerMarker.appendChild(watchedMarker);
        }
    },
    gainClue: function (clue) {
        var msg = '获得了一张【' + clue.level + '】级线索卡';
        if (clue.room != undefined) {
            msg += '.';
        } else {
            msg += ', 上面写着: ';
            switch (clue.level) {
                case 1:
                    msg += clue.room == 0 ? '【大厅】' : ('【' + clue.room + '】号房间');
                    break;
                case 2:
                    msg += '【' + GameConfig.color[clue.room] + '】的房间';
                    break;
                case 3:
                    msg += clue.room == 'hasLock' ? '【有锁】的房间' : '【无锁】的房间';
                    break;
            }
            msg += '是最终危险的!';
            alert('你' + msg);
        }
        this.debug(msg);
        if(clue.room === 13) {
            print('等一下？！这里为什么没有【13】号房间？');
        } else if (clue.room === 0) {
            print('这奇怪的九芒星阵到底什么意思？');
        } else if (clue.room === 'black') {
            print ('这黑色的房间没有门！');
        }
        this.clue = clue;
        if (!this.clueMarker) {
            var clueMarker = this.clueMarker = document.createElement('img');
            clueMarker.src = '/images/level' + clue.level + '.png';
            clueMarker.style.position = 'absolute';
            clueMarker.style.bottom = '0px';
            clueMarker.title = clueMarker.alt = '【' + clue.level + '】级线索卡';
            this.playerMarker.appendChild(clueMarker);
        }
        if (clue.room)
            this.markDangerous(clue);
    },
    markDangerous: function (clue) {
        var i;
        switch (clue.level) {
            case 1:
                if(clue.room != 13 && clue.room != 0) {
                    Game.rooms[clue.room].markDangerous('confirmed');
                }
                break;
            case 2:
                for (i in Game.rooms) {
                    if (Game.rooms.hasOwnProperty(i) && Game.rooms[i].color == clue.room) {
                        Game.rooms[i].markDangerous('confirmed');
                    }
                }
                break;
            case 3:
                for (i in Game.rooms) {
                    if (Game.rooms.hasOwnProperty(i) && Game.rooms[i].hasLock == (clue.room == 'hasLock')) {
                        Game.rooms[i].markDangerous('confirmed');
                    }
                }
                break;
        }
    },
    loseClue: function () {
        this.debug('失去了线索卡.');
        this.clue = undefined;
        if (this.clueMarker) {
            removeNode(this.clueMarker);
            delete this.clueMarker;
        }
        if (this.watchedMarker) {
            removeNode(this.watchedMarker);
            delete this.watchedMarker;
        }
    },
    move: function (movements, rooms) {
        var _room = rooms[this.room], msg, _self = this;
        var movement = movements[0],
            _toRoom = rooms[movement.to],
            lockAction = movement.lockAction;
        if (!!_toRoom) {
            msg = '离开了' + Room.nameOf(_room.id) + '，进入' + Room.nameOf(_toRoom.id);
            _self.room = _toRoom.id;
            _room.removePlayer(_self.id);
            _toRoom.addPlayer(_self.id);
//            var _position = _toRoom.genPosition(_self.id);
//            _self.playerMarker.style.left = _position.x + 'px';
//            _self.playerMarker.style.top = _position.y + 'px';
        } else {
            msg = '留在了' + Room.nameOf(_self.room);
        }
        switch (lockAction) {
            case 'lock':
                msg += '，并将其【上锁】。';
                (!!_toRoom ? _toRoom : _room).lock();
                break;
            case 'unlock':
                msg += '，并将其【解锁】。';
                (!!_toRoom ? _toRoom : _room).unlock();
                break;
            case '-lock':
                msg += '，并回头【锁上】' + Room.nameOf(_room.id) + '。';
                _room.lock();
                break;
            case undefined:
                msg += '.';
                break;
        }
        _self.debug(msg);
        if (movements.length == 2) {
            _room = _toRoom;
            movement = movements[1];
            _toRoom = rooms[movement.to];
            lockAction = movement.lockAction;
            setTimeout(function () {
                msg = '离开了' + Room.nameOf(_room.id) + '，进入' + Room.nameOf(_toRoom.id);
                _self.room = _toRoom.id;
                _room.removePlayer(_self.id);
                _toRoom.addPlayer(_self.id);
//                var _position = _toRoom.genPosition(_self.id);
//                _self.playerMarker.style.left = _position.x + 'px';
//                _self.playerMarker.style.top = _position.y + 'px';
                switch (lockAction) {
                    case 'lock':
                        msg += '，并将其【上锁】。';
                        _toRoom.lock();
                        break;
                    case 'unlock':
                        msg += '，并将其【解锁】。';
                        _toRoom.unlock();
                        break;
//                    case '-lock':
//                        msg += '，并回头【锁上】' + Room.nameOf(_room.id) + '。';
//                        _room.lock();
//                        break;
                    case undefined:
                        msg += '.';
                        break;
                }
                _self.debug(msg);
            }, 300);
        }
    }
};

var Room = function (room) {
    for (var prop in room) {
        if (room.hasOwnProperty(prop))
            this[prop] = room[prop];
    }
};

Room.prototype = {
    getDisplayName: function() {
        if(this.id == 0) {
            return GameConfig.function.hall + '(' + this.rule[0].toUpperCase() + ')';
        } else {
            return '【' + this.id + '】号' + GameConfig.function[this.function] + '(' + (this.rule[0].toUpperCase()) + + ')房间';
        }
    },
    debug: function (msg) {
        msg =  this.getDisplayName() + msg;
        print(msg);
    },
    lock: function () {
        this.debug('被锁上.');
        this.locked = true;
        this.lockMarker.className = 'locked';
    },
    unlock: function () {
        this.debug('被打开.');
        this.locked = false;
        this.lockMarker.className = 'unlocked';
    },
    loseKey: function () {
        this.hasKey = false;
        this.lockMarker.style.opacity = '0';
    },

    markDangerous: function (dangerous) {
        if (dangerous) this.dangerous = dangerous;
        else {
            if (this.dangerous == 'unknown') {
                this.dangerous = 'possible';
            } else if (this.dangerous == 'possible') {
                this.dangerous = 'confirmed';
            } else if (this.dangerous == 'confirmed') {
                this.dangerous = 'unknown';
            }
        }
        if (this.dangerousMarker) {
            this.dangerousMarker.className = this.dangerous;
        }
    },
    addPlayer: function (playerId) {
        var _players = this.players;
        var large = function (a, b) {
            return b - a;
        };
        var small = function (a, b) {
            return a - b;
        };
        _players.push(playerId);
        _players.sort(this.rule == 'small' ? small : large);
        for (var i in _players) {
            if (_players.hasOwnProperty(i)) {
                var player = Game.players[_players[i] - 1];
                var position = this.genPosition(player.id);
                player.playerMarker.style.left = position.x + 'px';
                player.playerMarker.style.top = position.y + 'px';
            }
        }
    },
    removePlayer: function (playerId) {
        var _players = this.players;
        _players.splice(_players.indexOf(playerId), 1);
        for (var i in _players) {
            if (_players.hasOwnProperty(i)) {
                var player = Game.players[_players[i] - 1];
                var position = this.genPosition(player.id);
                player.playerMarker.style.left = position.x + 'px';
                player.playerMarker.style.top = position.y + 'px';
            }
        }
    },
    nearBy: function (anotherRoom) {
        return Room.route[this.id].indexOf(anotherRoom.id) >= 0;
    },
    routes: function () {
        return Room.route[this.id];
    },
    routesToRoom: function (roomId, hasKey) {
        var optionalMovements = [];
        var build = function (movements, desc) {
            return {
                movements: movements,
                desc: desc
            };
        };
        var lockedRoomCount = 0;
        for (var i in Game.rooms) {
            if (Game.rooms.hasOwnProperty(i) && Game.rooms[i].locked) {
                lockedRoomCount += 1;
            }
        }
        var canLock = lockedRoomCount < 3;
        var wannaLock = false;
        if (roomId == this.id) {
            var _routes = this.routes(), canStay = true;
            for (i in _routes) {
                if (_routes.hasOwnProperty(i)) {
                    var _room = Game.rooms[_routes[i]];
                    if (!_room.locked) {
                        canStay = false;
                        break;
                    }
                }
            }
            if (canStay || roomId == 0 || this.locked || Game.progress.round == (Game.progress.bomb == 2 ? 8 : 7)) {
                optionalMovements.push(build([
                    {
                        to: undefined,
                        lockAction: undefined
                    }
                ], '留在' + this.getDisplayName() + '。'));
            }
            if (this.hasLock && hasKey) {
                if (!this.locked) wannaLock = true;
                if (!this.locked && canLock) {
                    optionalMovements.push(build([
                        {
                            to: undefined,
                            lockAction: 'lock'
                        }
                    ], '留在' + this.getDisplayName() + '，并将其【锁上】。'));
                } else if (this.locked) {
                    optionalMovements.push(build([
                        {
                            to: undefined,
                            lockAction: 'unlock'
                        }
                    ], '留在' + this.getDisplayName() + '，并将其【解锁】。'));
                }
            }
        } else {
            _routes = this.routes();
            for (i in _routes) {
                if (_routes.hasOwnProperty(i)) {
                    _room = Game.rooms[_routes[i]];
                    if (_room.id == roomId) {
                        if (!this.locked) {
                            if (!_room.locked) {
                                optionalMovements.push(build([
                                    {
                                        to: _room.id,
                                        lockAction: undefined
                                    }
                                ], '进入' + Room.nameOf(_room.id) + '。'));
                            }
                            if (_room.hasLock && hasKey) {
                                if (!_room.locked) wannaLock = true;
                                if (!_room.locked && canLock) {
                                    optionalMovements.push(build([
                                        {
                                            to: _room.id,
                                            lockAction: 'lock'
                                        }
                                    ], '进入' + Room.nameOf(_room.id) + '，并将其【锁上】。'));
                                } else if (_room.locked) {
                                    optionalMovements.push(build([
                                        {
                                            to: _room.id,
                                            lockAction: 'unlock'
                                        }
                                    ], '进入' + Room.nameOf(_room.id) + '，并将其【解锁】。'));
                                }
                            }
                            if (this.hasLock && !_room.locked && hasKey) wannaLock = true;
                            if (this.hasLock && !_room.locked && hasKey && canLock) {
                                optionalMovements.push(build([
                                    {
                                        to: _room.id,
                                        lockAction: '-lock'
                                    }
                                ], '进入' + Room.nameOf(_room.id) + '，并回头【锁上】' + this.getDisplayName() + '。'));
                            }
                        }
                    } else {
                        var _routes2 = _room.routes();
                        for (var j in _routes2) {
                            if (_routes2.hasOwnProperty(j) && roomId == _routes2[j]) {
                                var _room2 = Game.rooms[_routes2[j]];
                                if (!this.locked) {
                                    if (!_room.locked) {
                                        if (!_room2.locked) {
                                            optionalMovements.push(build([
                                                {to: _room.id, lockAction: undefined},
                                                {to: _room2.id, lockAction: undefined}
                                            ], '经过 ' + _room.id + ' 号房间到达' + Room.nameOf(_room2.id) + '。'));
                                        }
                                        if (hasKey) {
                                            if (!_room2.locked) {
                                                if (this.hasLock) wannaLock = true;
                                                if (this.hasLock && canLock) {
                                                    optionalMovements.push(build([
                                                        {to: _room.id, lockAction: '-lock'},
                                                        {to: _room2.id, lockAction: undefined}
                                                    ], '经过 ' + _room.id + ' 号房间到达' + Room.nameOf(_room2.id) + '，并回头【锁上】' + this.getDisplayName() + '。'));
                                                }
//                                                if (_room.hasLock) wannaLock = true;
//                                                if (_room.hasLock && canLock) {
//                                                    optionalMovements.push(build([
//                                                        {to: _room.id, lockAction: undefined},
//                                                        {to: _room2.id, lockAction: '-lock'}
//                                                    ], '经过 ' + _room.id + ' 号房间到达' + Room.nameOf(_room2.id) + '号房间，并回头【锁上】' + Room.nameOf(_room.id) + '号房间。'));
//                                                }
                                            }
                                            if (_room2.hasLock) {
                                                if (!_room2.locked) wannaLock = true;
                                                if (!_room2.locked && canLock) {
                                                    optionalMovements.push(build([
                                                        {to: _room.id, lockAction: undefined},
                                                        {to: _room2.id, lockAction: 'lock'}
                                                    ], '经过 ' + _room.id + ' 号房间到达' + Room.nameOf(_room2.id) + '号房间，并将其【锁上】。'));
                                                } else if (_room2.locked) {
                                                    optionalMovements.push(build([
                                                        {to: _room.id, lockAction: undefined},
                                                        {to: _room2.id, lockAction: 'unlock'}
                                                    ], '经过 ' + _room.id + ' 号房间到达' + Room.nameOf(_room2.id) + '号房间，并将其【解锁】。'));
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if(wannaLock && !canLock) {
            notice('已经有【3】个房间被锁上，本次移动过程中，你无法再锁上任何房间。');
        }
        return optionalMovements;
    },
    genPosition: function (playerId) {
        var index = this.players.indexOf(playerId),
            seats = GameConfig.seats[this.players.length];
        return {
            x: GameConfig.roomPosition[this.id].x + parseInt(Math.random() * 5) + seats[index].x - 24,
            y: GameConfig.roomPosition[this.id].y + parseInt(Math.random() * 5) + seats[index].y - 24
        }
    }
};

Room.nameOf = function(roomId) {
    if(Game.rooms.hasOwnProperty(roomId)) {
        return Game.rooms[roomId].getDisplayName();
    } else {
        return '【' + roomId + '】号房间';
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

