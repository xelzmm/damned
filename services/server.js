/**
 * Created by xelz on 14-10-3.
 */
var debug = require('debug')('damned:server');
var data = require('./data');
var games = data.games, io = data.io;
var server = function() {
    io.sockets.on('connection', function(socket) {
        debug('client connected, socket id: ' + socket.id);
        socket.on('connect', function() {
            debug('socket[' + socket.id + '] connected.');
        });
        socket.on('name', function(name) {
            if(!!socket.playerName) {
                debug('socket[' + socket.id + '] set name: name already set.');
                return false;
            }
            debug('socket[' + socket.id + '] set name: ' + name);
            socket.playerName = name;
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
                socket.emit('join', {reason: 'nosuchroom'});
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
            io.broadcast('ready', socket.playerName);
            games[_room].readyToStart();
        });
        var leave = function() {
            var _room = socket.socketRoom;
            if(!_room) {
                debug('socket[' + socket.id + '] leave: no room to leave!');
                return false;
            }
            debug('socket[' + socket.id + '] leave ' + _room);
            games[_room].remove(socket);
        };
        socket.on('speak', function(msg) {
            var _room = socket.socketRoom;
            if(!_room) {
                debug('socket[' + socket.id + '] speak: join a room needed!');
                return;
            }
            games[_room].broadcast('speak', {player: socket.playerName, content: msg});
        });
        socket.on('disconnect', function() {
            debug('client disconnected, socket id: ' + socket.id);
            if(!!socket.socketRoom)
                leave();
        });
        socket.on('leave', leave);
    });
};

module.exports = server;