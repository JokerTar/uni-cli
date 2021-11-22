'use strict';

const path = require('path')
const cp = require('child_process')

function formatPath(p) {
  if (p && typeof p === 'string') {
    const sep = path.sep
    if (sep === '/') return p
    return p.replace(/\\/g, '/')
  }
  return p
}

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

function spawn(command, args, options) {
  const win32 = process.platform === 'win32'
  const cmd = win32 ? 'cmd' : command
  const cmdArgv = win32 ? ['/c'].concat(command,args) : args

  return cp.spawn(cmd, cmdArgv, options || {})
}

function spawnAsync(command, args, options) {
  return new Promise(((resolve, reject) => {
    const p = spawn(command, args, options)

    p.on('error', e => {
      reject(e)
    })

    p.on('exit', c => {
      resolve(c)
    })
  }))
}

module.exports = {
  formatPath,
  isObject,
  spawnAsync,
  spawn
}
