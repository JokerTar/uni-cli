'use strict';

const log = require('npmlog')

log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'

log.addLevel('success', 2500, { fg: 'green', bg: 'black' })

module.exports = log;
