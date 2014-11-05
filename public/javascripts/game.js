var roomBoard = document.getElementById('roomBoard');
//var canvas = document.getElementById('roomBoard');
//var context = canvas.getContext && canvas.getContext('2d');
//window.context = context;
//window.Game = {rooms: [], players: [], elements: [], started: false};
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
var drawPlayer = function (player) {
    var position = Game.rooms[player.room].genPosition(player.id);
    var resourceName = 'player-' + player.id + '-' + (player.injured ? 'red' : 'green');
    var playerMarker = drawElement(resourceName, position.x, position.y);
    var holder = document.createElement('img');
    holder.src = '/images/blank.gif';
    holder.className = 'player-holder';
    holder.title = player.name;
    holder.alt = player.name;
    playerMarker.appendChild(holder);
    var timerContainer = document.createElement('div');
    timerContainer.className = 'count-down-container';
    var timer = document.createElement('div');
    timer.className = 'count-down';
    timerContainer.appendChild(timer);
    playerMarker.appendChild(timerContainer);
    player.timer = timer;
    return playerMarker;
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
                        print('您无法' + (roomId == me.room ? '留在' : '移动到') + Room.nameOf(roomId) + '，请重新选择！');
                        return;
                    }
                    if(!confirm('确定' + (roomId == me.room ? '留在' : '移动到') + Room.nameOf(roomId) + '？' +
                        (roomId == 0 && !!Game.elements.posion && !me.injured && Game.elements.posion.style.opacity != '0'
                            ? '\n你将会受到大厅【毒雾】感染！' : ''))) return;
                    var emitMove = function(movements) {
                        socket.emit('move', movements);
                    };
                    if(optionalMovements.length == 1) {
                        emitMove(optionalMovements[0].movements);
                        return;
                    }
                    var msg = '请选择移动方案, 留空默认第一种:';
                    for (var i in optionalMovements) {
                        if (optionalMovements.hasOwnProperty(i)) {
                            msg += '\n【' + (parseInt(i) + 1) + '】: ' + optionalMovements[i].desc;
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
var print = function(msg, style, literal) {
    if(!literal)
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
var cls = function() {
    document.getElementById('chatBoard').innerHTML = '';
};
var resize = function() {
    // scale
    var height = window.innerHeight || document.documentElement.clientHeight,
        width = window.innerWidth || document.documentElement.clientWidth;
    if(window.originHeight && window.originWidth) {
        if(window.originHeight == height && (window.originWidth - width) / width > 0.3
            || window.originWidth == width && (window.originHeight - height) / height > 0.3) {
            if(window.navigator.userAgent.indexOf('Android') < 0)
                return; // maybe the keyboard active/dismiss
        }
    }
    window.originHeight = height;
    window.originWidth = width;
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
    var infoBoard = document.getElementById('infoBoard');
    infoBoard.style.left = (edge - infoBoard.clientWidth) / 2 + 'px';
    infoBoard.style.top = (edge - infoBoard.clientHeight) / 2 + 'px';

    var chatBoard = document.getElementById('chatBoard');
    chatBoard.scrollTop = chatBoard.scrollHeight;
};
var stopTimer = function() {
    if(Game.timer) {
        for(var i in Game.players) {
            if(Game.players.hasOwnProperty(i)) {
                var player = Game.players[i];
                player.timer.parentNode.style.display = 'none';
                player.timer.style.width = '100%';
            }
        }
        clearInterval(Game.timer);
        delete Game.timer;
    }
};
var updateTimer = function(players, timeLimit) {
    stopTimer();
    for(var i in players) {
        if(players.hasOwnProperty(i)) {
            var player = Game.players[players[i] - 1];
            player.timer.parentNode.style.display = 'block';
        }
    }
    var startTime = new Date();
    Game.timer = setInterval(function() {
        for(var i in players) {
            if(players.hasOwnProperty(i)) {
                var player = Game.players[players[i] - 1];
                var timeLeftPercent = 100 - (new Date() - startTime) / timeLimit / 10;
                if(timeLeftPercent < 0) {
                    timeLeftPercent = 0;
                    stopTimer();
                }
                player.timer.style.width = timeLeftPercent + '%';
            }
        }
    }, 200);
};
var init = function() {

    resize();
    window.onresize = resize;
    initElementStyle();
    initRoomMap();

    drawResource("playground", 0, 0);

    window.socket = io('ws://' + window.location.hostname + (window.location.hostname == 'msjh.aliapp.com' ? '' : ':4000'));

    var input = document.getElementById('input');
    var speakInterval, speakIdle = 0, maxSpeakIdle = 15;
    var lastInput = '';
    var speakCheck = function() {
        speakIdle = 0;
        speakInterval = setInterval(function() {
            if(lastInput != input.value) {
                speakIdle = 0;
                lastInput = input.value;
            } else {
                speakIdle++;
            }
            if(maxSpeakIdle - speakIdle == 5) {
                print((maxSpeakIdle - speakIdle) + ' 秒内无输入，将会自动结束发言。');
            } else if(maxSpeakIdle - speakIdle == 0){
                releaseGameHandle();
                socket.emit('speak', '\1timeout');
            }
        }, 1000);
    };
    var speak = function() {
        if(Game.canSpeak) {
            if(input.value.trim() == "") {
                if(confirm('结束发言？')) {
                    releaseGameHandle();
                    socket.emit('speak', 'over');
                }
            } else {
                socket.emit('speak', input.value);
                input.value = '';
            }
        } else if(!Game.started) {
            if(input.value.trim() != "") {
                socket.emit('speak', input.value);
                input.value = '';
            }
        } else {
            print('你现在不能发言。');
        }
    };
    input.onkeydown = function(e) {
        if(e.keyCode == 13) {
            speak();
        }
    };
    document.getElementById('send').onclick = speak;
    document.onkeydown = function(e) {
        if(!(e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)) {
            document.getElementById('input').focus();
            speakIdle = 0;
        }
    };
    socket.on('join failed', function(reason) {
        Game.started = false;
        var location = '/';
        switch(reason) {
            case 'nosuchroom':
                alert('该房间不存在！');
                break;
            case 'full':
                alert('房间已满员，将转为观战模式');
                location = '/watch/' + Game.roomId;
                break;
            case 'started':
                alert('游戏已经开始，将转为观战。');
                location = '/watch/' + Game.roomId;
                break;
            case 'duplicated':
                alert('您已经在此房间内，请不要重复加入。');
                break;
            case 'cannotreconnect':
                alert('游戏结束，无法重连！');
                break;
        }
        window.location.href = location;
    });
    socket.on('data', function(data){
        print('游戏正在进行中。');
        gameRoom.hide();
        initPlayGround(data.rooms, data.players);
        for(var i in Game.players) {
            if(Game.players.hasOwnProperty(i)) {
                var player = Game.players[i];
                print('【' + player.id + '】号玩家：' + player.name, 'player');
                if(player.hasKey) {
                    var keyMarker = player.keyMarker = document.createElement('img');
                    keyMarker.src = '/images/key.png';
                    keyMarker.style.position = 'absolute';
                    keyMarker.style.right = '0px';
                    keyMarker.title = keyMarker.alt = '钥匙';
                    player.playerMarker.appendChild(keyMarker);
                }
                if(player.clue) {
                    var clueMarker = player.clueMarker = document.createElement('img');
                    clueMarker.src = '/images/level' + player.clue.level + '.png';
                    clueMarker.style.position = 'absolute';
                    clueMarker.style.bottom = '0px';
                    clueMarker.title = clueMarker.alt = '【' + player.clue.level + '】级线索卡';
                    player.playerMarker.appendChild(clueMarker);
                }
            }
        }
        window.me = {id: 0, room: Game.roomId, role:'watcher'};
        var progress = data.progress;
        if(progress.round == 8 && progress.bomb != 2) {
            Game.elements.timer.style.left = (GameConfig.timerBoard.x + 7.5 * GameConfig.timerBoard.step) + 'px';
        } else {
            Game.elements.timer.style.left = (GameConfig.timerBoard.x + (progress.round - 1) * GameConfig.timerBoard.step) + 'px';
        }
        var bomb = progress.bomb;
        if(progress.bomb < 0) {
            Game.elements.bomb.className = 'bomb-invalid';
            bomb = -1 - progress.bomb;
        }
        Game.elements.bomb.style.left = (GameConfig.bombBoard.x + bomb * GameConfig.bombBoard.step) + 'px';
        if(progress.bomb == 2) {
            Game.elements.roundBoard.style.opacity = '0';
        }
        if((!!Game.elements.posion) && progress.round == 6) { // 逃生回合
            Game.elements.posion.style.opacity = '0';
        }
        if(['speak', 'move', 'perform'].indexOf(progress.stage) >= 0) {
            var _rooms = Game.rooms, _order = Game.order = [];
            for (i in _rooms) { // 获取行动顺序
                if (_rooms.hasOwnProperty(i)) {
                    _order[i] = _rooms[i].players.slice(0);
                }
            }
            if(progress.room != null && progress.player != null) {
                var currentPlayer = Game.players[Game.order[progress.room][progress.player] - 1];
                print('现在是' + currentPlayer.getDisplayName() + '的【' + GameConfig.stage[progress.stage] + '】时间. ');
            }
        }
    });
    socket.on('join', function(data) {
        if(data.mode == 'play') {
            print('玩家：' + data.name + ' 进入游戏。');
            gameRoom.addPlayer(data.name, data.clientId, false);
        } else if(data.mode == 'watch'){
            print('观众：' + data.name + ' 进入游戏。');
        }
    });
    socket.on('leave', function(data) {
        gameRoom.removePlayer(data);
    });
    socket.on('room', function(room, players, testMode) {
        print('你已加入【' + room + '】号游戏房间。');
        window.gameRoom = new GameRoom(room);
        for(var i in players) {
            if(players.hasOwnProperty(i)) {
                var player = players[i];
                gameRoom.addPlayer(player.name, player.clientId, player.ready);
            }
        }
        if(Game.mode == 'play') {
            print('复制本页地址 ' + window.location.href + ' 给好友一起来玩吧！');
        } else if(Game.mode == 'watch'){
            print('当前为观战模式。', 'self speak');
            document.getElementById('readyButton').innerHTML = '加入';
        }
        if(testMode) {
            print('当前房间为测试房间！', 'self speak');
        }
        print('首次游戏，请仔细阅读 <a target="_blank" href="/readme.html">操作说明</a>。', 'notice speak', true);
        print('如有任何问题或者建议，请加官方QQ群 <a target="_blank" href="http://shang.qq.com/wpa/qunwpa?idkey=5c2b3d7e0616c2711001a6e8ab9661d9b0d6ae321169afb09e4fa0b38911e7ce"><img border="0" style="vertical-align: top; height: 19px;" src="http://pub.idqqimg.com/wpa/images/group.png" alt="密室惊魂" title="密室惊魂"></a> 进行反馈。', 'speak', true);
        document.getElementById('readyButton').onclick = function() {
            if(Game.mode == 'watch') {
                if(confirm('确认加入游戏？')) {
                    window.location.href = '/game/' + Game.roomId;
                }
                return;
            }
            if(!this.getAttribute('ready')) {
                socket.emit('ready');
                this.setAttribute('ready', 'ready');
                this.innerHTML = '取消';
            } else {
                socket.emit('unready');
                this.removeAttribute('ready');
                this.innerHTML = '准备';
            }
            var _this = this;
            this.setAttribute('disabled', 'true');
            setTimeout(function() {_this.removeAttribute('disabled')}, 1000);
        };
        document.getElementById('exitButton').onclick = function() {
            if(confirm('返回游戏大厅？')) window.location.href = '/';
        };
//        notice('请点击游戏区完成准备。');
//        document.getElementById('scaleContainer').onclick = readyHook;
    });
//    var readyHook = function() {
//        if(!confirm('确认准备就绪？'))return;
//        socket.emit('ready');
//        document.getElementById('scaleContainer').onclick = null;
//    };
    socket.on('ready', function(name, clientId){
        print('玩家：' + name + ' 已准备就绪。');
        gameRoom.playerReady(clientId);
    });
    socket.on('unready', function(name, clientId){
        print('玩家：' + name + ' 取消准备。');
        gameRoom.playerUnready(clientId);
    });
    socket.on('start', function(data) {
        var rooms = data.rooms, players = data.players, playerId = data.playerId, safeRoom = data.safeRoom;
        gameRoom.hide();
        Game.testMode = data.testMode;
        initPlayGround(rooms, players);
        notice('游戏开始了！总共有【' + players.length + '】名玩家。');
        for(var i in players) {
            if(players.hasOwnProperty(i)) {
                print('【' + players[i].id + '】号玩家：' + players[i].name, 'player');
            }
        }
        if(Game.mode == 'play') {
            document.getElementById('readyButton').removeAttribute('ready');
            document.getElementById('readyButton').innerHTML = '准备';
            window.me = Game.players[playerId - 1];
            var me = players[playerId - 1];
            print('你是【' + me.id + '】号玩家，你的身份是【' + GameConfig.role[me.role] + '】!', 'self speak');
            if (me.role == 'victim') {
                print('解除身上的剧毒，并找出安全房间，和大家一起逃离！', 'self speak');
                alert('你是【' + me.id + '】号玩家，你的身份是【受害者】!\n找出安全房间逃离吧！');
            } else if (me.role == 'victim-ex') {
                print('解除身上的剧毒，并找出安全房间，和大家一起逃离！', 'self speak');
                print('你也可以单独逃离，独自获胜！', 'self speak');
                alert('你是【' + me.id + '】号玩家，你的身份是【EX受害者】!\n找出安全房间逃离吧！');
            } else {
                print('安全房间是 【' + safeRoom + '】 号房间，想尽一切办法，阻止大家逃离！', 'self speak');
                alert('你是【' + me.id + '号】玩家，你的身份是【奸徒】!\n安全房间是 【' + safeRoom + '】 号房间！');
            }
            notice('提示1：点击线索标记区可以切换线索标记状态。');
            notice('提示2：发言中包含"over"字样或者提交空发言可以提前结束发言。');
        } else {
            var resetButton = document.getElementById('resetButton');
            resetButton.onclick = null;
            resetButton.style.display = 'none';
            window.me = {id: 0, room: Game.roomId, role: 'wather'};
        }
        if(Game.testMode) {
            print('=== 请注意，当前为测试模式！===', 'player speak');
            print('【1】级线索卡固定为: 0,13,x,...', 'player speak');
            print('【2】级线索卡固定为: 黑色,xx,...', 'player speak');
            print('【奸徒】固定1名，【EX受害者】固定1名', 'player speak');
            print('【大厅毒雾】开启，逃生前一回合解除。', 'player speak');
            print('=== 请注意，当前为测试模式！===', 'player speak');
        } else {
            if(players.length >= 6) print('本局增加【1】级线索卡：【13】号房间危险', 'player');
            if(players.length >= 7) print('本局增加【1】级线索卡：【大厅】危险', 'player');
            if(players.length >= 8) print('本局增加【大厅毒雾】功能，停留大厅将会中毒', 'player');
            if(players.length >= 9) print('本局增加【2】级线索卡：【黑色】房间危险', 'player');
        }
        notice('本局【拆弹】第一次需要【' + (players.length >= 8 ? 3 : 2) + '】人配合，第二次需要【' +
            (players.length >= 9 ? 4 : (players.length >= 6 ? 3 : 2)) + '】人配合!');
        print('进入第【1】回合.');
        window.onbeforeunload = function() {
            if(Game.started && Game.mode == 'play') {
                return '游戏正在进行，此操作将会断开游戏并令该局游戏终止。';
            } else {
                return undefined;
            }
        };
        window.onunload = function() {
            socket.emit('leave');
        }
    });
    var releaseGameHandle = function() {
        stopTimer();
        if(Game.canSpeak) {
            document.getElementById('keyTransform').style.display = 'none';
            document.getElementById('keyVote').style.display = 'none';
            delete Game.canSpeak;
            clearInterval(speakInterval);
            speakIdle = 0;
        }
        if(Game.canMove) {
            delete Game.canMove;
            document.getElementById('roomMask').style.zIndex = '0';
        }
    };
    socket.on('update', function(progress) {
        Game.progress = progress;
        releaseGameHandle();
        var roomMap = document.getElementById('roomMask');
        document.title = 'Damned | Player ' + me.id + ' | Room ' + me.room;
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
                print(GameConfig.stage[progress.stage] + '顺序：【' + _orderString.substr(0, _orderString.length - 1) + '】');
                if(progress.stage == 'move' && progress.bomb >= 0 && progress.bomb <= 1 && progress.round < 7) {
                    print('提示：本回合拆弹需要【' +
                        (progress.bomb == 0 ?
                            (Game.players.length >= 8 ? 3 : 2) :
                            (Game.players.length >= 9 ? 4 : (Game.players.length >= 6 ? 3 : 2))
                        ) +
                    '】人配合！', 'self');
                }
            } else {
                Game.order = [];
                if(progress.stage == 'time') {
                    print('进入第【' + progress.round + '】回合.');
                    if(progress.round == 8 && progress.bomb != 2) {
                        Game.elements.timer.style.left = (GameConfig.timerBoard.x + 7.5 * GameConfig.timerBoard.step) + 'px';
                    } else {
                        Game.elements.timer.style.left = (GameConfig.timerBoard.x + (progress.round - 1) * GameConfig.timerBoard.step) + 'px';
                    }
                } else if(progress.stage == 'thinking') {
                    print('当前剩余线索卡：');
                    print('【1】级线索卡：' + progress.clueCounts[0] + '张');
                    print('【2】级线索卡：' + progress.clueCounts[1] + '张');
                    print('【3】级线索卡：' + progress.clueCounts[2] + '张');
                    if(progress.bomb >= 0 && progress.bomb <= 1 && progress.round < 7) {
                        print('下次拆弹需要【' +
                            (progress.bomb == 0 ?
                                (Game.players.length >= 8 ? 3 : 2) :
                                (Game.players.length >= 9 ? 4 : (Game.players.length >= 6 ? 3 : 2))
                                ) +
                            '】人配合！', 'self');
                    }
                    print('思考 ' + progress.time + ' 秒，考虑接下来如何行动。');
                    if((!!Game.elements.posion) && progress.round == 6) { // 逃生回合
                        notice('【大厅】的毒雾似乎散去了，可以进去暂时躲一躲。');
                        Game.elements.posion.style.opacity = '0';
                    }
                }
            }
        } else {
            var currentPlayer = Game.players[Game.order[progress.room][progress.player] - 1];
            var currentRoom = Game.rooms[progress.room];
            if(progress.time != 1) {
                updateTimer([currentPlayer.id], progress.time);
            }
            if(me.id == currentPlayer.id) {
                document.title = '* Damned | Player ' + me.id + ' | Room ' + me.room;
                notice('轮到你【' + GameConfig.stage[progress.stage] + '】了.' + (progress.time == 1 ? '' : ' 限时 ' + progress.time + ' 秒.'));
                var chatBoard = document.getElementById('chatBoard');
                chatBoard.scrollTop = chatBoard.scrollHeight;
                if(progress.stage == 'speak' || progress.stage == 'move') {
                    if(progress.round == 7 && progress.bomb != 2 || progress.round == 8 && progress.bomb == 2) {
                        print('请注意：当前为逃生前一回合，房间功能不再执行！', 'notice speak');
                        if(progress.stage == 'move') {
                            alert('最终的逃离！\n请移动到你认为的安全房间，可以停留在当前房间。\n房间功能不再执行！');
                        }
                    }
                }
                switch(progress.stage) {
                    case 'speak':
                        Game.canSpeak = true;
                        speakCheck();
                        var _players = currentRoom.players;
                        if(_players.length >= 2) {
                            var targetPlayer = [];
                            for(i in _players) {
                                if(_players.hasOwnProperty(i) && _players[i] != currentPlayer.id) {
                                    if((currentPlayer.hasKey && !Game.players[_players[i] - 1].hasKey)
                                        || (!currentPlayer.hasKey && Game.players[_players[i] - 1].hasKey)) {
                                        targetPlayer.push(_players[i]);
                                    }
                                }
                            }
                            if(targetPlayer.length > 0) {
                                var keyTransformButton = document.getElementById('keyTransform');
                                keyTransformButton.innerHTML = currentPlayer.hasKey ? '赠予钥匙' : '索要钥匙';
                                keyTransformButton.style.display = 'inline';
                                keyTransformButton.onclick = function () {
                                    var decision;
                                    if(targetPlayer.length == 1) {
                                        decision = targetPlayer[0];
                                    } else {
                                        var choice = currentPlayer.hasKey ? '请选择将钥匙赠予哪位玩家，留空视作取消：' : '请选择向哪位玩家索取钥匙，留空视作取消：';
                                        for (i in targetPlayer) {
                                            if (targetPlayer.hasOwnProperty(i))
                                                choice += '\n' + Game.players[targetPlayer[i] - 1].getDisplayName();
                                        }
                                        do {
                                            decision = prompt(choice);
                                            if (!decision) return;
                                        } while (targetPlayer.indexOf(parseInt(decision)) < 0);
                                    }
                                    var message = prompt('即将向' + Game.players[decision - 1].getDisplayName() + (currentPlayer.hasKey ? '赠予':'索要') + '钥匙，请输入附言：');
                                    keyTransformButton.onclick = null;
                                    keyTransformButton.style.display = 'none';
                                    print('你的请求将在发言结束后向' + Game.players[decision - 1].getDisplayName() + '发出。');
                                    socket.emit('speak', {
                                        type: currentPlayer.hasKey ? 'give' : 'request',
                                        targetPlayerId: decision,
                                        message: message
                                    });
                                }
                            }
                        }
                        if(_players.length >= 3 && !currentPlayer.hasKey && !Game.keyVote) { // 3个以上玩家
                            var keyCount = 0;
                            for(i in _players) {
                                if(_players.hasOwnProperty(i)) {
                                    if(Game.players[_players[i] - 1].hasKey) {
                                        keyCount ++;
                                    }
                                }
                            }
                            if(keyCount > 0) {
                                var keyVoteButton = document.getElementById('keyVote');
                                keyVoteButton.style.display = 'inline';
                                keyVoteButton.onclick = function() {
                                    if(confirm('发起抢钥匙，将会在当前房间内所有玩家发言完毕后进行投票。确定继续？')) {
                                        keyVoteButton.onclick = null;
                                        keyVoteButton.style.display = 'none';
                                        socket.emit('speak', {
                                            type: 'vote'
                                        });
                                    }
                                }
                            }
                        }
                        break;
                    case 'move':
                        notice('请点击房间进行移动，停留请点击所处房间。');
                        roomMap.style.zIndex = '100';
                        Game.canMove = true;
                        break;
                }
            } else {
                print('现在是' + currentPlayer.getDisplayName() + '的【' + GameConfig.stage[progress.stage] + '】时间. ' + (progress.time == 1 ? '' : ' 限时 ' + progress.time + ' 秒.'));
            }
        }
    });
    socket.on('speak', function(data) {
        if(Game.started) {
            var _players = Game.players;
            var playerId = data.player;
            if(data.content.toLowerCase() == 'over') {
                _players[playerId - 1].debug('提前结束发言。');
                return;
            }
            if(data.content == '\1timeout') {
                _players[playerId - 1].debug('长时间不发言，自动结束。');
                return;
            }
            _players[playerId - 1].speak(data.content);
//            if(me.id == playerId) {
//                print('你说: ' + data.content, 'self');
//            } else {
//                print(playerId + ' 号玩家(' + _players[playerId - 1].name + ') 说: ' + data.content, 'player');
//            }
        } else {
            print(data.player + ' 说: ' + data.content, 'player speak');
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
        switch(type) {
            case 'gain':
                _players[playerId - 1].gainKey(Game.rooms[_players[playerId - 1].room]);
                break;
            case 'give':
                _players[data.player - 1].processKeyGive(data.agree, _players[data.fromPlayer - 1]);
                break;
            case 'request':
                _players[data.player - 1].processKeyRequest(data.agree, _players[data.fromPlayer - 1]);
                break;
            case 'grab':
                notice(_players[data.player - 1].getDisplayName() + '发起了抢钥匙，当前房间内所有玩家发言完毕后将进行投票。');
                Game.keyVote = true;
                break;
            case 'who':
            case 'vote':
                delete Game.keyVote;
                print('====== 投票结果 ======');
                for(var i in data.vote) {
                    if(data.vote.hasOwnProperty(i)) {
                        if(data.vote[i] == 0) {
                            _players[i - 1].debug('弃权。');
                        } else {
                            _players[i - 1].debug('投票给' + _players[data.vote[i] - 1].getDisplayName());
                        }
                    }
                }
                print('====================');
                if(type == 'who') {
                    if(data.winner == 0) {
                        notice('平票，钥匙归原主人所有。');
                    } else {
                        Game.keyOwner = Game.players[data.winner - 1];
                        notice('现在开始抢' + Game.keyOwner.getDisplayName() + '的钥匙。');
                    }
                    break;
                } else if(type == 'vote'){
                    if(data.winner == 0 || data.winner == Game.keyOwner.id) {
                        notice('平票，钥匙保留在' + Game.keyOwner.getDisplayName() + '身上。');
                    } else {
                        Game.players[data.winner - 1].gainKey(Game.keyOwner);
                    }
                    delete Game.keyOwner;
                    break;
                }
        }
    });
    socket.on('detoxify', function(data) {
        var _players = Game.players;
        var playerId = data.player;
        _players[playerId - 1].detoxify();
    });
    socket.on('injure', function(data) {
        var _players = Game.players;
        for(var i in data.players) {
            if(data.players.hasOwnProperty(i)) {
                var player = _players[data.players[i] - 1];
                if(!player.injured)player.injure();
            }
        }
    });
    socket.on('clue', function(data) {
        var _players = Game.players;
        var playerId = data.player, type = data.type, player = _players[playerId - 1];
        switch(type) {
            case 'gain':
                if(playerId != me.id)
                    player.gainClue(data.clue);
                break;
            case 'receive':
                me.gainClue(data.clue);
                break;
            case 'destroy':
                if(data.destroy) {
                    player.debug('选择了销毁手中的线索卡.');
                    player.loseClue();
                }
                else {
                    player.debug('选择不销毁手中的线索卡.');
                }
                break;
            case 'watch':
                if(playerId != me.id)
//                    player.debug('查看了' + _players[data.target - 1].getDisplayName() + '的线索卡.');
                    player.sawClue(data.target);
                break;
            case 'saw':
                me.sawClue(playerId, data.clue);
                break;
        }
    });
    socket.on('skip', function(data) {
        stopTimer();
        var player = Game.players[data.player - 1], reason = data.reason;
        switch(reason) {
            case 'player-detoxified':
                player.debug('已解毒，让过治疗房间执行权。');
                break;
            case 'empty-clue-pool':
                player.debug('无法获得线索卡，因为【1】级线索卡已经没有了。');
                break;
            case 'no-player-to-watch':
                player.debug('无法执行监视功能，因为没人拥有线索卡。');
                break;
            case 'player-no-clue':
                player.debug('没有线索卡，无法进行线索合成。');
                break;
            case 'no-valid-solution':
                player.debug('无法进行线索合成，因为没有可合成的方案，让过房间执行权。');
                break;
            case 'can-not-disarm':
                player.debug('无法发起拆弹，因为' + (Game.progress.bomb < 0 ? '控制器已经被破坏！' : '炸弹已解除，无需再次拆弹。'));
                break;
            case 'second-disarm-room':
                player.debug('在第二个拆弹房间，跳过房间功能执行。');
                break;
            case 'no-enough-player':
                player.debug('无法发起拆弹，因为人数不足！');
                break;
        }
    });
    socket.on('timeout', function(playerId) {
        Game.players[playerId - 1].debug('行动超时!');
    });
    socket.on('challenge', function(data) {
        var question = data.question, decision;
        if(data.player) {
            updateTimer([data.player], data.time);
            if (data.player == me.id) {
                var options = data.options;
                var choices = '', i, player;
                switch (question) {
                    case 'destroy':
                        print('请选择是否销毁手中的线索卡。');
                        decision = confirm('是否销毁手中的线索卡?');
                        break;
                    case 'watch':
                        print('请选择查看谁的线索卡。');
                        for (i in options) {
                            if (options.hasOwnProperty(i)) {
                                player = Game.players[options[i] - 1];
                                choices += '\n' + player.getDisplayName() + ', Lv' + player.clue.level + (!!player.watchedMarker ? ', 已被查看过' : '');
                            }
                        }
                        do {
                            decision = parseInt(prompt('你想查看谁的线索卡?' + choices));
                        } while (options.indexOf(decision) < 0);
                        break;
                    case 'who':
                        print('请选择与谁' + (Game.rooms[me.room]["function"] == 'upgrade' ? '升级' : '降级') + '线索卡。');
                        for (i in options) {
                            if (options.hasOwnProperty(i)) {
                                player = Game.players[options[i] - 1];
                                choices += '\n' + player.getDisplayName() + ', 【' + player.clue.level + '】级线索卡';
                            }
                        }
                        do {
                            decision = parseInt(prompt('你想与谁【' +
                                (Game.rooms[me.room]["function"] == 'upgrade' ? '升级' : '降级') +
                                '】线索卡?' + choices));
                        } while (options.indexOf(decision) < 0);
                        break;
                    case 'give':
                        print('请选择是否接受' + Game.players[data.options.fromPlayer - 1].getDisplayName() + '给予的钥匙。');
                        Game.players[data.options.fromPlayer - 1].debug('附言：' + data.options.message);
                        decision = confirm('是否接受' + Game.players[data.options.fromPlayer - 1].getDisplayName() + '给予的钥匙？\n附言：\n' + data.options.message);
                        break;
                    case 'request':
                        print('请选择是否同意将钥匙给予' + Game.players[data.options.fromPlayer - 1].getDisplayName());
                        Game.players[data.options.fromPlayer - 1].debug('附言：' + data.options.message);
                        decision = confirm('是否同意将钥匙给予' + Game.players[data.options.fromPlayer - 1].getDisplayName() + '？\n附言：\n' + data.options.message);
                        break;
                }
                socket.emit('challenge', decision);
            } else {
                var msg = '请等待' + Game.players[data.player - 1].getDisplayName();
                switch(question) {
                    case 'who':
                        msg += '选择与谁' + (Game.rooms[me.room]["function"] == 'upgrade' ? '升级' : '降级') + '线索卡。';
                        break;
                    case 'destroy':
                        msg += '选择是否销毁手中的线索卡。';
                        break;
                    case'watch':
                        msg += '选择查看谁的线索卡。';
                        break;
                    case 'give':
                        print(Game.players[data.options.fromPlayer - 1].getDisplayName() + '将钥匙赠予' + Game.players[data.player - 1].getDisplayName() + '。');
                        Game.players[data.options.fromPlayer - 1].debug('附言：' + data.options.message);
                        msg += '确认是否接受。';
                        break;
                    case 'request':
                        print(Game.players[data.options.fromPlayer - 1].getDisplayName() + '向' + Game.players[data.player - 1].getDisplayName() + '索要钥匙。');
                        Game.players[data.options.fromPlayer - 1].debug('附言：' + data.options.message);
                        msg += '确认是否同意。';
                        break;
                }
                print(msg);
            }
        } else if(data.participants) {
            updateTimer(data.participants, data.time);
            var action = {
                'disarm': '拆弹',
                'upgrade': '升级线索卡',
                'downgrade': '降级线索卡',
                'vote': '投票分配钥匙',
                'who': '选择抢谁的钥匙'
            }[data.options.actionType];
            if(data.participants.indexOf(me.id) >= 0) {
                var others = data.participants.concat();
                others.splice(data.participants.indexOf(me.id), 1);
                print('你将与【' + others + '】一起【' + action + '】。');
                switch(data.options.actionType) {
                    case 'disarm':
                    case 'upgrade':
                    case 'downgrade':
                        switch (Game.rooms[me.room]["function"]) {
                            case 'upgrade':
                            case 'downgrade':
                                var functionType = Game.rooms[me.room]["function"] == 'upgrade' ? '升级' : '降级';
                                var masterPlayerId = data.options.masterPlayer;
                                decision = confirm('是否配合【' + functionType +
                                    '】线索卡?\n合成后的线索卡将归' + Game.players[masterPlayerId - 1].getDisplayName() + '所有！' +
                                    '\n【确定】代表配合，【取消】代表破坏。');
                                notice('你选择了【' + (decision ? '配合' : '破坏') + '】' + functionType + '线索卡行动！');
                                break;
                            case 'disarm':
                                if (me.role.indexOf('victim') == 0) {
                                    alert('即将进行拆弹，你是受害者，点击确定予以配合！');
                                    decision = true;
                                } else {
                                    decision = confirm('是否配合进行拆弹？\n【确定】代表配合，【取消】代表破坏。');
                                }
                                notice('你选择了【' + (decision ? '配合' : '破坏') + '】拆弹行动！');
                                break;
                        }
                        break;
                    case 'who':
                        msg = '请投票决定抢谁的钥匙: \n【0】：弃权';
                        for(i in data.participants) {
                            if(data.participants.hasOwnProperty(i)) {
                                var participant = Game.players[data.participants[i] - 1];
                                if(participant.hasKey) {
                                    msg += '\n' + (participant.id == me.id ? '【' + me.id + '】你自己' : participant.getDisplayName());
                                }
                            }
                        }
                        do {
                            decision = prompt(msg, '0');
                            if(!decision) decision = 0;
                            decision = parseInt(decision);
                        } while(decision != 0 && (data.participants.indexOf(decision) < 0 || !Game.players[decision - 1].hasKey) );
                        break;
                    case 'vote':
                        if(!Game.keyOwner) {
                            for (i in data.participants) {
                                if (data.participants.hasOwnProperty(i)) {
                                    if(Game.players[data.participants[i] - 1].hasKey) {
                                        Game.keyOwner = Game.players[data.participants[i] - 1];
                                        break;
                                    }
                                }
                            }
                        }
                        msg = '请投票决定谁最终持有' + Game.keyOwner.getDisplayName() + '的钥匙：\n【0】：弃权';
                        for(i in data.participants) {
                            if(data.participants.hasOwnProperty(i)) {
                                participant = Game.players[data.participants[i] - 1];
                                if(participant.id == Game.keyOwner.id || !participant.hasKey)
                                    msg += '\n' + (participant.id == me.id ? '【'+ me.id + '】你自己' : participant.getDisplayName());
                            }
                        }
                        do {
                            decision = prompt(msg, '0');
                            if(!decision) decision = 0;
                            decision = parseInt(decision);
                        } while(decision != 0 && (data.participants.indexOf(decision) < 0 || !(decision == Game.keyOwner.id || !Game.players[decision - 1].hasKey)));
                        break;
                }
                socket.emit('challenge', decision);
            } else {
                print('请等待【' + data.participants + '】号玩家【' + action + '】。');
            }
        }
    });
//    socket.on('choose', function(data) {
//        var playerId = data.playerId, time = data.time;
//        updateTimer([playerId], time);
//        if(playerId != me.id) {
//            print('请等待' + Game.players[playerId - 1].getDisplayName() + '选择与谁合成线索。');
//        } else {
//            print('请选择与谁合成线索。');
//        }
//    });
//    socket.on('wait', function(data) {
//        var actions = data.actions, type = data.type, time = data.time;
//        var actionPlayers = [];
//        for(var i in actions) {
//            if(actions.hasOwnProperty(i)) {
//                actionPlayers.push(parseInt(i));
//            }
//        }
//        updateTimer(actionPlayers, time);
//        var action = {
//            'disarm': '拆弹',
//            'upgrade': '升级线索卡',
//            'downgrade': '降级线索卡'
//        }[type];
//        if(actionPlayers.indexOf(me.id) < 0) {
//            print('请等待【' + actionPlayers + '】号玩家【' + action + '】。');
//        } else {
//            actionPlayers.splice(actionPlayers.indexOf(me.id), 1);
//            print('你将和【' + actionPlayers + '】号玩家一起【' + action + '】。');
//        }
//    });
    socket.on('action', function(action) {
            switch(action.type) {
                case 'upgrade':
                case 'downgrade':
                    notice((action.type == 'upgrade' ? '【升级】' : '【降级】') + '线索卡' + (action.result ? '【成功】！' : '【失败】！'));
                    if(action.result) {
                        Game.players[action.participants[0] - 1].loseClue();
                        Game.players[action.participants[1] - 1].loseClue();
                        Game.players[action.gain.player - 1].gainClue({level: action.gain.level});
                    }
                    break;
                case 'disarm':
                    notice('拆弹第【' + (Game.progress.bomb == 0 ? '一' : '二') + '】次' + (action.result ? '【成功】！' : '【失败】！'));
                    if(!action.result) {
                        Game.elements.bomb.className = 'bomb-invalid';
                    } else {
                        Game.elements.bomb.style.left = (GameConfig.bombBoard.x + action.bomb * GameConfig.bombBoard.step) + 'px';
                        if(action.bomb == 2) {
                            Game.elements.roundBoard.style.opacity = '0';
                            notice('游戏将在第【9】回合结束！');
                        }
                    }
            }
    });
    socket.on('over', function(result) {
        releaseGameHandle();
        print('游戏结束！');
        document.title = '密室惊魂 - Online';
        print('安全房间是：【' + result.safeRoom + '】号房间。', 'notice speak');
        for(var i in result.players) {
            if(result.players.hasOwnProperty(i)) {
                var player = result.players[i];
                print('【' + player.id + '】号玩家：【' +
                    GameConfig.role[player.role] + '】' +
                    (Game.started ?
                    (player.role == 'traitor' ? '生存' :
                        (player.inSafeRoom ? ('身处安全房间，' + (player.detoxified ? '逃生' : '中毒死亡')) :
                        '身处危险房间，死亡')
                        ) : ''), 'player');
            }
        }
        if(Game.started) {
            var msg;
            switch(result.winner) {
                case 'victim':
                    if(me.role.indexOf('victim') == 0) {
                        msg = '你 (受害者) 获得了胜利！';
                    } else if(me.role == 'traitor'){
                        msg = '你 (奸徒) 失败了！ 受害者获得了胜利。';
                    } else if(me.role == 'watcher'){
                        msg = '受害者获得了胜利！';
                    }
                    break;
                case 'ex':
                    if(me.role == 'victim-ex') {
                        msg = '你 (EX受害者) 胜利，成功独自逃生！';
                    } else if(me.role == 'victim'){
                        msg = '你 (受害者) 失败了！EX受害者独自逃生。';
                    } else if(me.role == 'watcher') {
                        msg = 'EX受害者 胜利，成功独自逃生！';
                    }
                    break;
                case 'ex+traitor':
                    if(me.role == 'victim-ex') {
                        msg = '你 (EX受害者) 成功独自逃生！和 奸徒 一起获得了胜利。';
                    } else if(me.role == 'traitor') {
                        msg = '你 (奸徒) 获得了胜利！EX受害者 独自逃生。';
                    } else if(me.role == 'victim'){
                        msg = '你 (受害者) 失败了！EX受害者 和 奸徒 一起获得了胜利。';
                    } else if(me.role == 'watcher') {
                        msg = 'EX受害者 独自逃生，和 奸徒 一起获得了胜利。';
                    }
                    break;
                case 'traitor':
                    if(me.role == 'traitor') {
                        msg = '你 (奸徒) 获得了胜利！';
                    } else if(me.role.indexOf('victim') == 0){
                        msg = '你 (受害者) 失败了! 奸徒 获得了胜利。';
                    } else if(me.role == 'watcher') {
                        msg = '奸徒获得了胜利！'
                    }
                    break;
                case 'none':
                    if(me.role.indexOf('victim') == 0) {
                        msg = '你 (受害者) 失败了！ 本局没有 奸徒。';
                    } else if(me.role == 'watcher') {
                        msg = '受害者失败了，本局没有奸徒。';
                    }
            }
            print(msg, 'notice speak');
            alert(msg);
            resetGame();
        }
    });
    socket.on('token', function(token) {
        socket.token = token;
    });
    socket.on('disconnect', function() {
        if(Game.started && Game.mode == 'play') {
            notice('与服务器断开连接，正在尝试重连。。。');
            Game.started = false;
            print('请不要刷新页面，重连成功将自动继续游戏！', 'self speak');
        } else {
            alert('与服务器断开连接，请重新进入游戏！');
            window.location.href = '/';
        }
    });
    socket.on('reconnecting', function(number) {
        print('正在尝试第 ' + number + ' 次重连...');
    });
    socket.on('reconnect', function() {
        notice('连接成功！');
        Game.started = true;
        setTimeout(function() {
            socket.emit('rejoin', gameRoom.room, socket.token);
//            if(Game.order.length > 0 && Game.order[Game.progress.room][Game.progress.player] == me.id) {
                notice('断线期间你的行动时间将超时跳过。');
//            }
        }, 1000);
    });
    socket.on('offline', function(data) {
        var playerId = data.playerId;
        notice(Game.players[playerId - 1].getDisplayName() + ' 掉线，请等待重连。。。');
        Game.paused = true;
    });
    socket.on('reonline', function(data) {
        var playerId = data.playerId;
        if(Game.paused) {
            notice(Game.players[playerId - 1].getDisplayName() + ' 已回到游戏。');
            delete Game.paused;
        }
        gameRoom.updatePlayer(data.playerId, data.oldClientId, data.newClientId);
    });
    joinGame();
};
var resetGame = function() {
    Game.started = false;
    document.getElementById('keyTransform').style.display = 'none';
    document.getElementById('keyVote').style.display = 'none';
    var resetButton = document.getElementById('resetButton');
    resetButton.style.display = 'inline';
    stopTimer();
    resetButton.onclick = function() {
        gameRoom.display();
        this.onclick = null;
        this.style.display = 'none';
        if(confirm('是否需要清空聊天区域？')) cls();
    };
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
    document.cookie = cname + "=" + encodeURIComponent(cvalue) + "; " + expires + '; path=/';
};
var joinGame = function() {
    var username = getCookie('name');
    if(username == '') {
        do {
            if (username == null || username.trim() == '') {
                username = 'player_' + new Date().getTime() % 10000;
            }
            username = prompt('请设定你的昵称(16个字符以内)：', username.trim());
        } while (username == null || username.trim() == '' || username.trim().length > 16);
    }
    setCookie("name", username.trim(), 365);
    notice(username + '，欢迎你进入密室惊魂。');
    socket.emit('name', username);
//    var room = parseInt(window.location.search.substr(1, window.location.search.length - 1));
//    if(isNaN(room)) room = 0;
    socket.emit('join', {room: Game.roomId, mode: Game.mode});
//    socket.emit('ready');
};
var initPlayGround = function(rooms, players) {
    var i;
    if(!!Game.rooms) {
        for(i in Game.rooms) {
            if(Game.rooms.hasOwnProperty(i)) {
                if(!!Game.rooms[i].lockMarker) {
                    removeNode(Game.rooms[i].lockMarker);
                }
                if(!!Game.rooms[i].dangerousMarker) {
                    removeNode(Game.rooms[i].dangerousMarker);
                }
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
    Game.elements = [];
    for(i in rooms) {
        if(rooms.hasOwnProperty(i)) {
            var _room = rooms[i];
            Game.rooms.push(new Room(_room));
            _room = Game.rooms[i];
            var _roomPosition = GameConfig.roomPosition[i];
            if(_room["function"] == 'hall') {
                drawResource('hall-' + _room.rule, _roomPosition.x, _roomPosition.y);
                if(players.length >= 8 || Game.testMode) { // 8人局开启毒雾大厅
                    Game.elements.posion = drawElement('posion', 500, 488);
                }
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
                Game.players[i].playerMarker = drawPlayer(Game.players[i]);
            }
        }
    }
};

var GameRoom = function(room) {
    this.room = room;
    this.players = {};
    this.infoBoard = document.getElementById('infoBoard');
    this.display();
};

GameRoom.prototype = {
    addPlayer: function(name, clientId, ready) {
        this.players[clientId] = {name: name, ready: false};
        var roomPlayer = document.createElement('div');
        roomPlayer.className = 'room-player';
        roomPlayer.innerHTML = '<span>' + name + '</span>' + (ready ? '<span>已准备</span>' : '');
        this.players[clientId].marker = roomPlayer;
        document.getElementById('roomPlayers').appendChild(roomPlayer);
    },
    removePlayer: function(data) {
        var clientId = data.clientId;
        if(clientId in this.players) {
            print('玩家：' + data.name + ' 离开游戏。');
            removeNode(this.players[clientId].marker);
            delete this.players[clientId];
            if(Game.started) {
                resetGame();
            }
            var allReady = true, count = 0;
            for(var i in this.players) {
                if(this.players.hasOwnProperty(i)) {
                    count++;
                    if(this.players[i].marker.innerHTML.indexOf('已准备') < 0) {
                        allReady = false;
                    }
                }
            }
            if(allReady) {
                notice('当前为【' + count + '】人局，任意玩家重新准备即可开始。');
            }
        } else { // 观战离开
            print('观众：' + data.name + ' 离开游戏。');
        }
    },
    updatePlayer: function(playerId, oldClientId, newClientId) {
        for(var i in this.players) {
            if(this.players.hasOwnProperty(i) && i == oldClientId) {
                this.players[newClientId] = this.players[oldClientId];
                delete this.players[oldClientId];
                break;
            }
        }
    },
    playerReady: function(clientId) {
        if(clientId in this.players) {
            this.players[clientId].marker.innerHTML += '<span>已准备</span>';
        }
    },
    playerUnready: function(clientId) {
        if(clientId in this.players) {
            this.players[clientId].marker.innerHTML = '<span>' + this.players[clientId].name + '</span>';
        }
    },
    display: function() {
        this.infoBoard.style.display = 'block';
        document.getElementById('infoHeader').innerHTML = '密室惊魂【'+this.room+'】号房间';
        resize();
    },
    hide: function() {
        this.infoBoard.style.display = 'none';
        for(var i in this.players) {
            if(this.players.hasOwnProperty(i)) {
                this.playerUnready(i);
            }
        }
    }
};