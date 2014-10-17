var roomBoard = document.getElementById('roomBoard');
//var canvas = document.getElementById('roomBoard');
//var context = canvas.getContext && canvas.getContext('2d');
//window.context = context;
window.Game = {rooms: [], players: [], elements: [], started: false};
var gameResource = new Image();
var drawResource = function (resourceName, x, y) {
//    context = context || window.context;
//    var _bounds = GameConfig.resourceBounds[resourceName];
//    context.drawImage(gameResource, _bounds.x, _bounds.y, _bounds.w, _bounds.h, x, y, _bounds.w, _bounds.h);
    var container = document.getElementById('roomContainer');
    var img = document.createElement('div');
    img.className = resourceName;
    img.style.left = x + 'px';
    img.style.top = y + 'px';
    container.appendChild(img);
};
var removeNode = function(node) {
    node.parentNode.removeChild(node);
};
var drawElement = function (resourceName, x, y) {
    var container = document.getElementById('elementContainer');
    var img = document.createElement('div');
    img.className = resourceName;
    img.style.left = x + 'px';
    img.style.top = y + 'px';
    img.style.webkitTransition = '0.5s';
    img.style.MozTransition = '0.5s';
    img.style.msTransition = '0.5s';
    img.style.OTransition = '0.5s';
    img.style.transition = '0.5s';
    container.appendChild(img);
    return img;
};
var initElementStyle = function() {
    var style;
    if(document.createStyleSheet) {
        style = document.createStyleSheet();
    } else {
        style = document.createElement('style');
        style.type = 'text/css';
    }
    var styleText = '';
    for(var i in GameConfig.resourceBounds) {
        if(GameConfig.resourceBounds.hasOwnProperty(i)) {
            var element = i;
            var _bounds = GameConfig.resourceBounds[element];
            var aStyleText =  'position: absolute;' +
                'background-image: url(\'/images/game.gif\');' +
                'background-position: -' + _bounds.x + 'px -' + _bounds.y + 'px;' +
                'width: ' + _bounds.w + 'px;' +
                'height: ' + _bounds.h + 'px;';
            if(document.createStyleSheet) {
                style.addRule('.' + element, aStyleText);
            } else {
                styleText += '.' + element + '{' + aStyleText + '}\n';
            }
        }
    }
    if(!document.createStyleSheet) {
        style.innerHTML = styleText;
        document.getElementsByTagName('HEAD').item(0).appendChild(style);
    }
};

var initRoomMap = function() {
    var map = document.createElement('map');
    map.name = 'map';
    for(var i in GameConfig.roomPosition) {
        if(GameConfig.roomPosition.hasOwnProperty(i)) {
            var position = GameConfig.roomPosition[i];
            var area = document.createElement('area');
            area.shape = 'poly';
            area.coords = (position.x + 135) + ',' + (position.y + 3) + ',' +
                (position.x + 267) + ',' + (position.y + 135) + ',' +
                (position.x + 135) + ',' + (position.y + 267) + ',' +
                (position.x + 3) + ',' + (position.y + 135);
            area.onclick = function(roomId) {
                return function() {
                    if(!Game.canMove) return;
                    var optionalMovements = Game.rooms[me.room].routesToRoom(roomId, me.hasKey);
                    if(optionalMovements.length == 0) {
                        print('您无法' + (roomId == me.room ? '留在 ' : '移动到 ') + roomId + ' 号房间，请重新选择！');
                        return;
                    }
                    if(!confirm('确定' + (roomId == me.room ? '留在 ' : '移动到 ') + roomId + ' 号房间？')) return;
                    var emitMove = function(movements) {
                        socket.emit('move', movements);
                    };
                    if(optionalMovements.length == 1) {
                        emitMove(optionalMovements[0].movements);
                        return;
                    }
                    var msg = '请选择移动方案, 留空默认第一种:\n';
                    for (var i in optionalMovements) {
                        if (optionalMovements.hasOwnProperty(i)) {
                            msg += (parseInt(i) + 1) + ': ' + optionalMovements[i].desc + '\n';
                        }
                    }
                    do {
                        var decision = prompt(msg);
                        if(decision == '' || decision == null)
                            decision = 1;
                        else
                            decision = parseInt(decision);
                        if((decision - 1) in optionalMovements) {
                            emitMove(optionalMovements[decision - 1].movements);
                            return;
                        }
                    }while(true);
                }
            }(i);
            map.appendChild(area);
        }
    }
    var roomMap = document.getElementById('roomMap');
    roomMap.useMap = '#map';
    roomMap.parentNode.appendChild(map);
};

gameResource.src="/images/game.gif";
gameResource.onload = function() {
    removeNode(document.getElementById('loading'));
    document.getElementById('chatArea').style.display = 'block';
    init();
};
Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "h+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
};
var print = function(msg, style) {
    msg = msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var chatBoard = document.getElementById('chatBoard');
    var autoScroll = chatBoard.scrollTop + chatBoard.clientHeight >= chatBoard.scrollHeight - 5;
    var msgBox = document.createElement('div');
    style = !!style ? style : '';
    msgBox.innerHTML = '<span class="time">[' + new Date().format('hh:mm:ss') + ']</span><span class="' + style + '">' +  msg + '</span>';
    chatBoard.appendChild(msgBox);
    if(autoScroll) chatBoard.scrollTop = chatBoard.scrollHeight;
};
var notice = function(msg){print(msg, 'notice');};
var resize = function() {
    // scale
    var height = window.innerHeight || document.documentElement.clientHeight,
        width = window.innerWidth || document.documentElement.clientWidth;
    var edge = height > width ? width : height;
    var mapArea = document.getElementById('mapArea');
    mapArea.style.width = edge + 'px';
    mapArea.style.height = edge + 'px';
    var transform = 'scale(' + edge / roomBoard.clientWidth + ')',
        transformOrigin = 'left top';
    var scaleContainer = document.getElementById('scaleContainer');
    scaleContainer.style.webkitTransformOrigin = transformOrigin;
    scaleContainer.style.MozTransformOrigin = transformOrigin;
    scaleContainer.style.msTransformOrigin = transformOrigin;
    scaleContainer.style.OTransformOrigin = transformOrigin;
    scaleContainer.style.transformOrigin = transformOrigin;
    scaleContainer.style.webkitTransform = transform;
    scaleContainer.style.MozTransform = transform;
    scaleContainer.style.msTransform = transform;
    scaleContainer.style.OTransform = transform;
    scaleContainer.style.transform = transform;

    var chatArea = document.getElementById('chatArea');
    if(height > width) {
        chatArea.style.width = width + 'px';
        chatArea.style.height = (height - width - 1) + 'px';
    } else {
        chatArea.style.height = height + 'px';
        chatArea.style.width = (width - height - 1) + 'px';
    }
    document.getElementById('chatBoard').style.height = (chatArea.clientHeight - document.getElementById('inputBox').clientHeight) + 'px';

};
var init = function() {

    resize();
    window.onresize = resize;
    initElementStyle();
    initRoomMap();

    drawResource("playground", 0, 0);

    window.socket = io('ws://' + window.location.hostname + (window.location.hostname == 'msjh.aliapp.com' ? '' : ':4000'));

    document.getElementById('input').onkeydown = function(e) {
        if(e.keyCode == 13) {
            if(Game.canSpeak) {
                if(e.target.value.trim() == "") {
                    if(confirm('结束发言？')) {
                        socket.emit('speak', 'over');
                    }
                } else {
                    socket.emit('speak', e.target.value);
                    e.target.value = '';
                }
            } else if(!Game.started) {
                if(e.target.value.trim() != "") {
                    socket.emit('speak', e.target.value);
                    e.target.value = '';
                }
            } else {
                print('你现在不能发言。');
            }
        }
    };
    document.onkeydown = function(e) {
        if(!(e.metaKey || e.ctrlKey || e.altKey || e.shiftKey))
            document.getElementById('input').focus();
    };

    socket.on('join', function(name) {
        if(typeof(name) == 'object') {
            switch(name.reason) {
                case 'nosuchroom':
                    alert('该房间不存在！');
                    break;
                case 'full':
                    alert('房间已满员！');
                    break;
                case 'started':
                    alert('游戏已经开始，暂不支持观战。');
                    break;
            }
            window.location.href = '/';
        } else {
            print(name + ' 进入了游戏房间。');
        }
    });
    socket.on('leave', function(name) {
        print(name + ' 离开了游戏房间。');
        if(Game.started) {
            notice('游戏结束。');
            Game.started = false;
            window.onbeforeunload = null;
        }
    });
    socket.on('room', function(room, players) {
        print('你已加入【' + room + '】号游戏房间。');
        var roomKeeper = true;
        for(var i in players) {
            if(players.hasOwnProperty(i)) {
                print('玩家：' + players[i].name + (players[i].ready ? ' 已准备就绪。' : ' 尚未准备就绪。'));
                roomKeeper = false;
            }
        }
        if(roomKeeper) {
            print('复制本页地址 ' + window.location.href + ' 给好友一起来玩吧！');
        }
        notice('点击游戏区完成准备。');
        document.getElementById('scaleContainer').onclick = readyHook;
    });
    var readyHook = function() {
        if(!confirm('您已准备就绪？'))return;
        socket.emit('ready');
        document.getElementById('scaleContainer').onclick = null;
    };
    socket.on('ready', function(name){
        if(typeof (name) =='string') {
            notice(name + ' 已准备就绪。');
        }
    });
    socket.on('safe', function(room) {
        notice('安全房间是 【' + room + '】 号房间！');
        alert('你的身份是【奸徒】，安全房间是 【' + room + '】 号房间！');
    });
    socket.on('start', function(rooms, players, id) {
        var me = players[id - 1];
        print('游戏开始了！总共有 ' + players.length + ' 名玩家。');
        notice('你是【' + me.id + '号】玩家，你的身份是【' + GameConfig.role[me.role] + '】!');
//        print('rooms:');print(rooms);
//        print('players:');print(players);
        initPlayGround(rooms, players);
        print('提示1：点击线索标记区可以切换线索标记状态。', 'self');
        print('提示2：发言中包含"over"字样或者提交空发言可以提前结束发言。', 'self');
        window.me = Game.players[id - 1];
        document.title = 'Damned | Player ' + me.id + ' | Room ' + me.room;
        print('进入 第 1 回合.');
        window.onbeforeunload = function() {
            return '游戏正在进行，此操作将会断开游戏并令该局游戏终止。';
        };
    });
    socket.on('update', function(progress) {
        Game.progress = progress;
        var roomMap = document.getElementById('roomMask');
        if(Game.canSpeak)delete Game.canSpeak;
        if(Game.canMove) {
            document.title = 'Damned | Player ' + me.id + ' | Room ' + me.room;
            delete Game.canMove;
            roomMap.style.zIndex = '0';
        }
        if(progress.room == null) {
            print('====== 进入【' + GameConfig.stage[progress.stage] + '】阶段 ======', 'stage');
            if(['speak', 'move', 'perform'].indexOf(progress.stage) >= 0) {
                var _rooms = Game.rooms, _order = Game.order = [];
                var _orderString = '';
                for (var i in _rooms) { // 获取行动顺序
                    if (_rooms.hasOwnProperty(i)) {
                        _order[i] = _rooms[i].players.slice(0);
                        if(_order[i].length > 0)_orderString += _order[i] + ',';
                    }
                }
                print('行动顺序：' + _orderString.substr(0, _orderString.length - 1));
            } else {
                Game.order = [];
                if(progress.stage == 'time') {
                    print('进入 第 ' + progress.round + ' 回合.');
                    if(progress.round == 8 && progress.bomb != 2) {
                        Game.elements.timer.style.left = (GameConfig.timerBoard.x + 7.5 * GameConfig.timerBoard.step) + 'px';
                    } else {
                        Game.elements.timer.style.left = (GameConfig.timerBoard.x + (progress.round - 1) * GameConfig.timerBoard.step) + 'px';
                    }
                } else if(progress.stage == 'thinking') {
                    print('思考 ' + progress.time + ' 秒，考虑接下来如何行动。');
                }
            }
        } else {
            if(me.id == Game.order[progress.room][progress.player]) {
                notice('轮到你 [' + GameConfig.stage[progress.stage] + '] 了.' + (progress.time == 1 ? '' : ' 限时 ' + progress.time + ' 秒.'));
                switch(progress.stage) {
                    case 'speak':
                        Game.canSpeak = true;
                        break;
                    case 'move':
                        notice('请点击房间进行移动。');
                        document.title = '* Damned | Player ' + me.id + ' | Room ' + me.room;
                        roomMap.style.zIndex = '100';
                        Game.canMove = true;
                        break;
                }
            } else {
                print('现在是 ' + Game.order[progress.room][progress.player] + ' 号玩家的 [' + GameConfig.stage[progress.stage] + '] 时间. ' + (progress.time == 1 ? '' : ' 限时 ' + progress.time + ' 秒.'));
            }
        }
    });
    socket.on('speak', function(data) {
        if(Game.started) {
            if(data.content == 'over') return;
            var _players = Game.players;
            var playerId = data.player;
            if(me.id == playerId) {
                print('你说: ' + data.content, 'self');
            } else {
                print(playerId + ' 号玩家(' + _players[playerId - 1].name + ') 说: ' + data.content, 'player');
            }
        } else {
            print(data.player + ' 说: ' + data.content, 'player', 'player');
        }
    });
    socket.on('move', function(data) {
        var _players = Game.players;
        var playerId = data.player;
        _players[playerId - 1].move(data.movements, Game.rooms);
        if(playerId == me.id)document.title = 'Damned | Player ' + me.id + ' | Room ' + me.room;
    });
    socket.on('key', function(data) {
        var _players = Game.players;
        var playerId = data.player, type = data.type;
        _players[playerId - 1].gainKey();
        Game.rooms[_players[playerId - 1].room].loseKey();
    });
    socket.on('detoxify', function(data) {
        var _players = Game.players;
        var playerId = data.player;
        _players[playerId - 1].detoxify();
    });
    socket.on('clue', function(data) {
        var _players = Game.players;
        var playerId = data.player, type = data.type;
        switch(type) {
            case 'gain':
                _players[playerId - 1].gainClue(data.clue);
                break;
            case 'receive':
                me.gainClue(data.clue);
                break;
            case 'destroy':
                if(data.destroy) {
                    notice(playerId + ' 号玩家(' + _players[playerId - 1].name + ') 销毁了他(她)的线索卡.');
                    _players[playerId - 1].loseClue();
                }
                else {
                    notice(playerId + ' 号玩家(' + _players[playerId - 1].name + ') 选择不销毁他(她)的线索卡.');
                }
                break;
            case 'watch':
                notice(playerId + ' 号玩家(' + _players[playerId - 1].name + ') 查看了 ' + data.target + ' 号玩家的线索卡.');
                break;
            case 'saw':
                me.sawClue(playerId, data.clue);
                break;
        }
    });
    socket.on('timeout', function(playerId) {
        Game.players[playerId - 1].debug('行动超时');
    });
    socket.on('challenge', function(type, options) {
        document.title = '* Damned | Player ' + me.id + ' | Room ' + me.room;
        var decision;
        switch(type) {
            case 'destroy':
                decision = confirm('是否销毁手中的线索卡?');
                break;
            case 'watch':
                do {
                    decision = parseInt(prompt('你想查看谁的线索卡 [' + options + ']?'));
                } while (options.indexOf(decision) < 0);
                break;
            case 'who':
                do {
                    decision = parseInt(prompt('你想与谁 ' +
                            (Game.rooms[me.room]["function"] == 'upgrade' ? '升级' : '降级') +
                            ' 线索卡 [' + options + ']?'));
                } while (options.indexOf(decision) < 0);
                break;
            case 'action':
                switch (Game.rooms[me.room]["function"]) {
                    case 'upgrade':
                    case 'downgrade':
                        decision = confirm('是否配合' +
                            (Game.rooms[me.room]["function"] == 'upgrade' ? '升级' : '降级') +
                            ' 线索卡？ 合成后的线索卡将归 ' +
                            (me.id == options ? ' 你 ' : options + ' 号玩家') +
                            '所有！');
                        break;
                    case 'disarm':
                        decision = confirm('是否配合进行拆弹？' + (me.role == 'victim' ? '(你是受害者，必须配合，选哪个都一样)' : ''));
                }
        }
        document.title = 'Damned | Player ' + me.id + ' | Room ' + me.room;
        socket.emit('challenge', decision);
    });
    socket.on('wait', function(actions) {
        var actionPlayers = [];
        for(var i in actions) {
            if(actions.hasOwnProperty(i)) {
                actionPlayers.push(parseInt(i));
            }
        }
        if(actionPlayers.indexOf(me.id) >= 0) {
            print('请做出选择。');
        } else {
            print('请等待 [' + actionPlayers + '] 号玩家行动');
        }
    });
    socket.on('action', function(action) {
            switch(action.type) {
                case 'upgrade':
                case 'downgrade':
                    notice((action.type == 'upgrade' ? '升级' : '降级') + '线索卡' + (action.result ? '成功！' : '失败！'));
                    if(action.result) {
                        Game.players[action.participants[0] - 1].loseClue();
                        Game.players[action.participants[1] - 1].loseClue();
                        Game.players[action.gain.player - 1].gainClue({level: action.gain.level});
                    }
                    break;
                case 'disarm':
                    notice('拆弹第 ' + (Game.progress.bomb == 0 ? '一' : '二') + ' 次' + (action.result ? '成功！' : '失败！'));
                    if(!action.result) {
                        Game.elements.bomb.className = 'bomb-invalid';
                    } else {
                        Game.elements.bomb.style.left = (GameConfig.bombBoard.x + action.bomb * GameConfig.bombBoard.step) + 'px';
                        if(action.bomb == 2) {
                            Game.elements.roundBoard.style.opacity = '0';
                            notice('游戏将在第 9 回合结束！');
                        }
                    }
            }
    });
    socket.on('over', function(result) {
        notice('安全房间是：【' + result.safeRoom + '】号房间。');
        if(Game.started) {
            if (me.role == result.winner) {
                notice('你(' + (me.role == 'victim' ? '受害者' : '奸徒') + ')获得了胜利！');
            } else {
                notice('你失败了！');
                notice((me.role != 'victim' ? '受害者' : '奸徒') + '获得了胜利！');
            }
            Game.started = false;
            window.onbeforeunload = null;
        }
        if(me.role == 'victim') {
            if (!!result.traitor) {
                notice(result.traitor + ' 号玩家是【奸徒】。');
            } else {
                notice('本场游戏没有奸徒。');
            }
        }
        print('点击游戏区完成准备。');
        document.getElementById('scaleContainer').onclick = readyHook;
    });
    fakeInit();
};
var getCookie = function(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return decodeURIComponent(c.substring(name.length, c.length));
    }
    return "";
};
var setCookie = function (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + encodeURIComponent(cvalue) + "; " + expires;
};
var fakeInit = function() {
    var username = getCookie('name');
    if(username == '') {
        do {
            username = 'player_' + new Date().getTime() % 10000;
            username = prompt('请设定您的昵称：', username);
        } while (username == null || username.trim() == '');
        setCookie("name", username, 365);
    }
    print(username + '，欢迎你进入密室惊魂。');
    socket.emit('name', username);
    var room = window.location.search.substr(1, window.location.search.length - 1);
    if(room == '') room = 0;
    socket.emit('join', room);
//    socket.emit('ready');
};
var initPlayGround = function(rooms, players) {
    var i;
    if(!!Game.rooms) {
        for(i in Game.rooms) {
            if(Game.rooms.hasOwnProperty(i) && !!Game.rooms[i].lockMarker) {
                removeNode(Game.rooms[i].lockMarker);
                removeNode(Game.rooms[i].dangerousMarker);
            }
        }
        for(i in Game.players) {
            if(Game.players.hasOwnProperty(i) && !!Game.players[i].playerMarker) {
                removeNode(Game.players[i].playerMarker);
            }
        }
        for(i in Game.elements) {
            if(Game.elements.hasOwnProperty(i)) {
                removeNode(Game.elements[i]);
            }
        }
        var container = document.getElementById('roomContainer');
        while (container.childElementCount > 1) {
            container.removeChild(container.lastChild);
        }
    }
    Game.started = true;
    Game.rooms = [];
    for(i in rooms) {
        if(rooms.hasOwnProperty(i)) {
            var _room = rooms[i];
            Game.rooms.push(new Room(_room));
            _room = Game.rooms[i];
            var _roomPosition = GameConfig.roomPosition[i];
            if(_room["function"] == 'hall') {
                drawResource('hall-' + _room.rule, _roomPosition.x, _roomPosition.y);
            } else {
                _room.dangerousMarker = drawElement(_room.dangerous, GameConfig.dangerousBoard.x + GameConfig.dangerousBoard.step * _room.id, GameConfig.dangerousBoard.y);
                _room.dangerousMarker.onclick = (function(room) {
                    return function() {
                        room.markDangerous();
                    };
                })(_room);
                // 房间颜色
                drawResource(_room.color, _roomPosition.x, _roomPosition.y);
                // 房间功能
                drawResource(_room["function"] + '-' + _room.rule, _roomPosition.x + 25, _roomPosition.y + 80);
            }
            // 房间锁/钥匙状态
            if(_room.hasLock || _room.hasKey) {
                _room.lockMarker = drawElement(_room.hasKey ? 'key' : _room.locked ? 'locked' : 'unlocked', _roomPosition.x + 180, _roomPosition.y + 100);
            }
        }
    }
    Game.elements = [];
    // 回合指示
    Game.elements.roundBoard = drawElement('round-board', GameConfig.roundBoard.x, GameConfig.roundBoard.y);
    // 进度指示
    Game.elements.timer = drawElement('timer', GameConfig.timerBoard.x, GameConfig.timerBoard.y);
    // 炸弹指示
    Game.elements.bomb = drawElement('bomb', GameConfig.bombBoard.x, GameConfig.bombBoard.y);
    Game.players = [];
    for (i in players) {
        if(players.hasOwnProperty(i)) {
            var _player = players[i];
            if(players.hasOwnProperty(i)) {
                Game.players.push(new Player(_player));
                var position = Game.rooms[0].genPosition(_player.id);
                Game.players[i].playerMarker = drawElement('player-' + _player.id + '-red',
                    position.x, position.y);
            }
        }
    }
};