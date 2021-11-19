'use strict';

const path = require('path')
const pathExists = require('path-exists')
const fse = require('fs-extra')
const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')

const { isObject } = require('@uni-cli/methods')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的options参数不能为空！')
    }

    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为对象！')
    }

    this.targetPath = options.targetPath
    this.storeDir = options.storeDir
    this.packageName = options.packageName
    this.packageVersion = options.version
  }

  cacheFilePath(version = this.packageVersion) {
    // @tar-dev/core => _@tar-dev_core@1.0.5@@tar-dev
    const pathPre = this.packageName.replace('/', '_')
    return path.resolve(this.storeDir, `_${pathPre}@${version}@${this.packageName}`)
  }

  async prepare() {
    // 创建目录
    if (this.storeDir) {
      const flag = await pathExists(this.storeDir)
      if (!flag) fse.mkdirpSync(this.storeDir)
    }
  }

  // 判断当前Package是否存在
  async exists() {
    console.log('here')
    console.log(this.cacheFilePath(this.packageVersion))
    if (this.storeDir) {
      return await pathExists(this.cacheFilePath(this.packageVersion))
    } else {
      return await pathExists(this.targetPath)
    }
  }

  async install() {
    console.log('install...')
    console.log({name: this.packageName, version: this.packageVersion})
    await this.prepare()
    await npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: 'https://registry.npmjs.org',
      pkgs: [
        {name: this.packageName, version: this.packageVersion}
      ]
    });
  }

  async update() {
    console.log('update...')
    // 获取最新版本号
    const latestVersion = process.env.CLI_LATEST_VERSION
    const currentVersion = this.packageVersion
    // 查询本地缓存中是否存在最新版本
    const flag = pathExists(this.cacheFilePath(latestVersion))
    if (!flag) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: 'https://registry.npmjs.org',
        pkgs: [
          {name: this.packageName, version: latestVersion}
        ]
      });
      this.packageVersion = latestVersion
    } else {
      this.packageVersion = latestVersion
    }
    this.packageVersion = latestVersion
  }

  getRootFilePath() {
    function _getRootFile(cacheFilePath) {
      // 1. 获取package.json所在目录 - pkg-dir
      const dir = pkgDir(cacheFilePath)
      const file = require(path.resolve(dir, 'package.json'))
      if (file && file.main) {
        return path.resolve(dir, file.main)
      }
    }

    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath(this.packageVersion))
    } else {
      return _getRootFile(this.targetPath)
    }
  }

}

module.exports = Package
