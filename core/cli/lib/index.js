'use strict';

module.exports = core;

const path = require('path')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const semver = require('semver')
const rootCheck = require('root-check')
const commander = require('commander')
const log = require('@uni-cli/log')
const { getLatestVersion } = require('@uni-cli/get-npm-info')
const exec = require('@uni-cli/exec')

const pkg = require('../package.json')

const program = new commander.Command()

const setting = {
  LOWEST_NODE_VERSION: '12.0.0',
  DEFAULT_CLI_HOME_PATH: '.uni-cli'
}

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
  // 4.检查环境变量
  createDefaultConfig()
  // 5. 检查是否为最新版本
  await checkGlobUpdate()
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .version(pkg.version)
    .usage('<command> [option]')
    .option('-d --debug', '是否开启debug模式', false)
    .option('-tp --targetPath <targetPath>', '是否指定本地调试路径', '');

  program
    .command('init [projectName]')
    .option('-f --force', '是否强制初始化项目')
    .description('')
    .action(exec)

  program.on('option:debug', function () {
    if (program.opts().debug) {
      process.env.LOG_LEVEL ='verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
  })

  program.on('option:targetPath', function () {
    process.env.CLI_TARGET_PATH  = program.opts().targetPath
  })

  // 监听未知命令
  program.on('command:*', function (obj) {
    const availableCommands = program.commands.map(cmd => cmd.name())
    log.warn('未知命令：', obj[0])
    log.info('可用命令：', availableCommands.join(' '))
  })

  program
    .parse(process.argv);
}

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

function createDefaultConfig() {
  process.env.CLI_HOME_PATH = setting.DEFAULT_CLI_HOME_PATH
}

async function checkGlobUpdate() {
  const currentVersion = pkg.version
  const npmName = pkg.name
  const latestVersion = await getLatestVersion(npmName)
  if (!semver.gte(currentVersion, latestVersion)) {
    log.warn(`请手动更新 ${npmName}, 当前版本 ${currentVersion}, 最新版本 ${latestVersion}`)
  }
}
