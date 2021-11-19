'use strict';

// 拿到rootFile
// 通过rootFile执行后续init操作

const CACHE_PATH = 'dependencies'

const path = require('path')
const userHome = require('user-home')
const log = require("@uni-cli/log")

async function exec(source, destination) {
  const targetPath = process.env.CLI_TARGET_PATH
  const homePath = path.resolve(userHome, process.env.CLI_HOME_PATH)

  log.verbose('targetPath:', targetPath)
  log.verbose('homePath:', homePath)
}

module.exports = exec
