'use strict';

// 拿到rootFile
// 通过rootFile执行后续init操作

const Package = require('@uni-cli/package')
const path = require('path')
const userHome = require('user-home')
const log = require("@uni-cli/log")

const CACHE_PATH = 'dependencies'
const SETTING = {
  init: '@uni-cli/init'
}

async function exec(source, destination) {
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = path.resolve(userHome, process.env.CLI_HOME_PATH)
  let storeDir = ''
  const version = 'latest'
  let pkg = null

  log.verbose('targetPath:', targetPath)
  log.verbose('homePath:', homePath)

  const cmdObj = arguments[arguments.length - 1]
  const packageName = SETTING[cmdObj.name()]

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_PATH)
    storeDir = path.resolve(targetPath, 'node_modules')
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      version
    })

    console.log('pkg', pkg)

    if (await pkg.exists()) {
      await pkg.update()
    } else {
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      version
    })
  }

  console.log('pkg', pkg)
  const rootFile = pkg.getRootFilePath();
  console.log('rootFile', rootFile)
  console.log(cmdObj.parent.opts())
  const argv = Array.from(arguments)
  const cmdArgv = argv.slice(0, argv.length - 1)
  require(rootFile)(cmdArgv)
}

module.exports = exec
