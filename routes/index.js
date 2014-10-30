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
    res.redirect(302, '/game?' + room);
});

router.get('/test', function(req, res) {
    var room = ++roomId;
    games[room] = new game(room, data.io, true);
    res.redirect(302, '/game?' + room);
});

router.get('/game', function(req, res) {
   res.render('game');
});

router.get('/watch', function(req, res) {
    res.render('game');
});

module.exports = router;
