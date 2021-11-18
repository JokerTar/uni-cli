'use strict';

module.exports = core;

const path = require('path')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const semver = require('semver')
const rootCheck = require('root-check')
const log = require('@uni-cli/log')
const { getNpmInfoVersions } = require('@uni-cli/get-npm-info')

const setting = require('../../../setting')

async function core() {
  try {
    await prepare()
    registerCommand()
  } catch (e) {
    log.error(e.message)
  }
}

async function prepare() {
  // 1. 检查node版本号
  checkNodeVersion()
  // 2. 检查root启动
  checkRoot()
  // 3. 检查用户主目录
  checkUserHome()
  // 4. 检查是否为最新版本
  await checkGlobUpdate()
}

function registerCommand() {}

function checkNodeVersion() {
  // 获取当前版本
  const currentVersion = process.version
  const lowestVersion = setting.LOWEST_NODE_VERSION

  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(`uni-cli 需要安装 ${lowestVersion} 以上版本 node.js`)
  }
}

function checkRoot() {
  // root账号启动自查和自动降级功能
  rootCheck()
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error('用户主目录不存在！')
  }
}

async function checkGlobUpdate() {
  const versions = await getNpmInfoVersions()
  console.log(versions)
}
