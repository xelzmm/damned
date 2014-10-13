var express = require('express');
var router = express.Router();
var data = require('../services/data');
var game = require('../services/game');
var games = data.games;
/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Damned Hall', games: games});
});

var roomId = 0;
router.get('/create', function(req, res) {
    var room = ++roomId;
    games[room] = new game(room, data.io);
    res.redirect(302, '/game?' + room);
});

router.get('/game', function(req, res) {
   res.render('game', { title: 'Damned'});
});

module.exports = router;
