/**
 * Created by xelz on 14-10-3.
 */
var debug = require('debug')('damned:server');
var game = require('./game');
var games = {};
var server = function(io) {
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
                games[room] = new game(room, io);
            }
            games[room].add(socket);
        });
        socket.on('ready', function() {
            var _room = socket.socketRoom;
            if(!_room) {
                debug('socket[' + socket.id + '] ready: join a room needed!');
                return;
            }
            debug('socket[' + socket.id + '] ready');
            games[_room].readyToStart(socket);
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
        socket.on('disconnect', function() {
            debug('client disconnected, socket id: ' + socket.id);
            if(!!socket.socketRoom)
                leave();
        });
        socket.on('leave', leave);
    });
};

module.exports = server;