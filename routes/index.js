var express = require('express');
var router = express.Router();
var data = require('../services/data');
var game = require('../services/game');
var games = data.games;
/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {games: games});
});

var roomId = 0;
router.get('/create', function(req, res) {
    var room = ++roomId;
    games[room] = new game(room, data.io, false);
    res.redirect(302, '/game/' + room);
});

router.get('/test', function(req, res) {
    var room = ++roomId;
    games[room] = new game(room, data.io, true);
    res.redirect(302, '/game/' + room);
});

router.get('/game/:roomId', function(req, res) {
    var roomId = req.params.roomId;
    if(!games.hasOwnProperty(roomId)) {
        res.redirect(302, '/');
    } else {
        res.render('game', {roomId: req.params.roomId, mode: 'play'});
    }
});

router.get('/watch/:roomId', function(req, res) {
    var roomId = req.params.roomId;
    if(!games.hasOwnProperty(roomId)) {
        res.redirect(302, '/');
    } else {
        res.render('game', {roomId: req.params.roomId, mode: 'watch'});
    }
});

router.get('/backdoor', function(req, res) {
    if(data.key !== undefined && req.query.key == data.key) {
        if(games.hasOwnProperty(req.query.room)) {
            res.render('backdoor', {game: games[req.query.room]});
        } else {
            res.send('There is no backdoor!');
        }
    } else {
        res.redirect(302, '/');
    }
});

router.get('*', function(req, res) {
   res.redirect(302, '/');
});

module.exports = router;
