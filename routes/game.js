var express = require('express');
var game = express.Router();

/* GET game page. */
game.get('/', function(req, res) {
    res.render('game', { title: 'Damned' });
});

module.exports = game;
