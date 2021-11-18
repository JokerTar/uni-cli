#! /usr/bin/env node

const importLocal = require('import-local')

if (importLocal(__filename)) {
  console.log('正在使用 tar-dev 本地版本')
} else {
  require('../lib')(process.argv.slice(2))
}
