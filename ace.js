#!/usr/bin/env node
// some configuration for aliyun ace
var debug = require('debug');
debug.useColors = function() {return false};
debug.log = console.log;
process.env['PORT'] = 80;
process.env['DEBUG'] = 'damned:*';
require('./app');
