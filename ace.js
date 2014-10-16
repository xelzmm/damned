#!/usr/bin/env node
// some configuration for aliyun ace
process.env['DEBUG'] = 'damned:*';
var debug = require('debug');
debug.useColors = function() {return false};
debug.log = console.log;
process.env['PORT'] = 80;
require('./app');
