/**
 * Created by xelz on 14-10-3.
 */
var debug = require('debug')('damned:server');
var data = require('./data');
var games = data.games, io = data.io;
var server = function() {
    io.sockets.on('connection', function(socket) {
        var sHeaders = socket.handshake.headers,
            clientIp = sHeaders['x-forwarded-for'] ? sHeaders['x-forwarded-for'] : socket.client.conn.remoteAddress;
        debug('client connected, socket id: ' + socket.id + ', ip: ' + clientIp);
//        socket.on('connect', function() {
//            debug('socket[' + socket.id + '] connected, ip: ' + socket.client.conn.remoteAddress);
//        });
        socket.on('rejoin', function(room, token) {
            debug('player reconnect with token: ' + token);
            if(games.hasOwnProperty(room) && games[room].started) {
                games[room].resume(socket, token);
            } else {
                socket.emit('join failed', {reason: 'cannotreconnect'});
            }
        });
        socket.on('name', function(name) {
            if(!!socket.playerName) {
                debug('socket[' + socket.id + '] set name: name already set.');
                return false;
            }
            name = name.trim().substr(0, 16);
            debug('socket[' + socket.id + '] set name: ' + name);
            socket.playerName = name;
            socket.token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            socket.emit('token', socket.token);
        });
        socket.on('join', function(room) {
            if(!socket.playerName) {
                debug('socket[' + socket.id + '] join: set name needed!');
                return false;
            }
            if(!!socket.socketRoom) {
                debug('socket[' + socket.id + '] join: already in a room!');
                return false;
            }
            debug('socket[' + socket.id + '] join ' + room);
            if(!(room in games)) {
                debug('socket[' + socket.id + '] join: room ' + room + ' not exists');
                socket.emit('join failed', 'nosuchroom');
            } else {
                games[room].add(socket);
            }
        });
        socket.on('ready', function() {
            var _room = socket.socketRoom;
            if(!_room) {
                debug('socket[' + socket.id + '] ready: join a room needed!');
                return;
            }
            debug('socket[' + socket.id + '] ready');
            socket.playerReady = true;
            io.to(_room).emit('ready', socket.playerName, socket.id);
            games[_room].readyToStart();
        });
        socket.on('unready', function() {
            var _room = socket.socketRoom;
            if(!_room) {
                debug('socket[' + socket.id + '] unready: join a room needed!');
                return;
            }
            debug('socket[' + socket.id + '] unready');
            socket.playerReady = false;
            io.to(_room).emit('unready', socket.playerName, socket.id);
        });
        var leave = function(force) {
            var _room = socket.socketRoom;
            if(!_room) {
                debug('socket[' + socket.id + '] leave: no room to leave!');
                return false;
            }
            debug('socket[' + socket.id + '] leave ' + _room);
            games[_room].remove(socket, force);
        };
        socket.on('speak', function(msg) {
            var _room = socket.socketRoom;
            if(!_room) {
                debug('socket[' + socket.id + '] speak: join a room needed!');
                return;
            }
            if(games[_room].started) {
                return;
            }
            games[_room].broadcast('speak', {player: socket.playerName, content: msg});
        });
        socket.on('disconnect', function() {
            debug('client disconnected, socket id: ' + socket.id);
            if(!!socket.socketRoom)
                leave(false);
        });
        socket.on('leave', function() {
            leave(true);
        });
    });
};

module.exports = server;