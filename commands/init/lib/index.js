'use strict';

const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')
const userHome = require('user-home')
const ejs = require('ejs')
const glob = require('glob')
const Command = require('@uni-cli/command')
const Package = require('@uni-cli/package')
const log = require('@uni-cli/log')
const { spawnAsync } = require('@uni-cli/methods')

const TEMPLATE = [
  {
    name: '标准模板',
    npmName: 'tar-dev-template-vue',
    version: '1.0.2',
    type: 'normal',
    installCommand: 'npm install',
    startCommand: 'npm run serve',
    ignore: 'node_module/**,public/**'
  }
]

const WHITE_COMMAND = ['npm', 'cnpm']

class InitCommand  extends Command{
  init() {
    this.projectName = this._argv[0] || ''
    this.force = this._cmds.force
  }

  async exec() {
    try{
      // 1. 准备阶段
      await this.prepare()

      if (!this.projectInfo) return

      // 2. 下载模板
      await this.downloadTemplate()
      // 3. 安装模板
      await this.installTemplate()
    } catch (e) {
      throw new Error(e.message)
    }
  }

  async prepare() {
    // 1. 判断当前目录是否为空
    const localPath = process.cwd()
    let isContinue = false

    if (!this.isCwdEmpty(localPath)) {
      // 1.1 询问是否继续创建
      if(!this.force) {
        const answer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'isContinue',
            message: '当前文件夹不为空，是否继续创建项目？',
            default: false
          }
        ])

        isContinue = answer.isContinue
        if (!isContinue) return;
      }

      console.log('isContinue', isContinue)

      // 2.是否强制更新
      if (isContinue || this.force) {
        //二次确认
        const { confirmDelete } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmDelete',
            message: '是否确认清空当前目录下文件？',
            default: false
          }
        ])

        if (confirmDelete) {
          fse.emptyDirSync(localPath)
        }
      }
    }

    this.projectInfo = await this.getProjectInfo()
    log.verbose(this.projectInfo)
  }

  async getProjectInfo() {
    const projectNameReg = /^[a-zA-Z]+([/w-]*[a-zA-Z0-9])*$/
    let projectName = ''

    if (!this.projectName || !projectNameReg.test(this.projectName)) {
      const o = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: this.projectName && !projectNameReg.test(this.projectName) ? '项目名称不合法，请重新输入' : '请输入项目名称',
          validate: (v) => {
            return projectNameReg.test(v)
          }
        }
      ])

      projectName = o.projectName
    } else {
      projectName = this.projectName
    }

    const { version, template } = await inquirer.prompt([
      {
        type: 'input',
        name: 'version',
        default: '1.0.0',
        message: '请输入项目版本号',
        validate: function (v) {
          return !!semver.valid(v)
        },
        filter: (v) => {
          if (!!semver.valid(v)) {
            return semver.valid(v)
          } else {
            return  v
          }
        }
      },
      {
        type: 'list',
        name: 'template',
        message: '请选择项目模板',
        choices: TEMPLATE.map(item => {
          return {
            name: item.name,
            value: item.npmName
          }
        })
      }
    ])

    return {
      projectName,
      version,
      template
    }
  }

  async downloadTemplate() {
    console.log('downloadTemplate')
    const template = TEMPLATE.find(file => file.npmName === this.projectInfo.template)
    this.templateInfo = template
    const { npmName, version } = template
    const targetPath = path.resolve(userHome, process.env.CLI_HOME_PATH, 'template')
    const storeDir = path.resolve(userHome, process.env.CLI_HOME_PATH, 'template', 'node_modules')

    const pkg = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      version: version
    })

    this.pkg = pkg

    if (await pkg.exists()) {
      await pkg.update()
    } else {
      await pkg.install()
    }
  }

  async installTemplate() {
    try{
      const templatePath = path.resolve(this.pkg.cacheFilePath(), 'template')
      const targetPath = process.cwd()

      fse.ensureDirSync(templatePath)
      fse.ensureDirSync(templatePath)

      fse.copySync(templatePath, targetPath)
      log.success('安装成功')
    } catch (e) {
      throw e
    }

    // 模板渲染
    await this.ejsRender({ ignore: this.templateInfo.ignore.split(',')})
    log.success('模板渲染成功')

    // 依赖安装
    // 启动命令执行
    const { installCommand, startCommand } = this.templateInfo
    if (installCommand) {
      await this.execCommand(installCommand, '依赖安装失败！')
    }

    if (startCommand) {
      await this.execCommand(startCommand, '启动命令执行失败！')
    }
  }

  ejsRender(options) {
    const { projectName, version } = this.projectInfo
    return new Promise(((resolve, reject) => {
      glob('**', {
        cwd: process.cwd(),
        ignore: options.ignore || [],
        nodir: true,
      }, (err, files) => {
        if (err) {
          reject(err)
        } else {
          Promise.all(files.map(file => {
            const filePath = path.resolve(process.cwd(), file)
            ejs.renderFile(filePath, {className: projectName, projectVersion: version}, (err, result) => {
              if (err) {
                reject(err)
              } else {
                // ejs渲染成功但并不会写入 需调用方法重新
                fse.writeFileSync(filePath, result)
                resolve(result)
              }
            })
          }))
            .then(() => {
              resolve()
            })
        }
      })
    }))
  }

  async execCommand(command, msg = '') {
    const startCmd = command.split(' ')
    const cmd = startCmd[0]
    const args = startCmd.slice(1)

    if (!cmd) {
      throw new Error('命令不存在！ 命令：' + cmd)
    }

    if (!WHITE_COMMAND.includes(cmd)) {
      throw new Error('预料外命令，终止执行！ 命令：' + cmd)
    }

    const ret = await spawnAsync(cmd, args, {
      cmd: process.cwd(),
      stdio: 'inherit'
    })

    if (ret !== 0) {
      throw new Error(msg)
    }
  }

  isCwdEmpty(localPath) {
    let fileList = fs.readdirSync(localPath)
    fileList = fileList.filter(file => !file.startsWith('.') && !['node_modules'].includes(file))

    return (!fileList || fileList.length <= 0)
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports.InitCommand = InitCommand
module.exports = init
