'use strict';

const path = require('path')
const semver = require('semver')
const axios = require('axios')

const setting = require('../../../setting')

function getNpmInfo(npmName, register = setting.BASE_REGISTRY) {
  if (!npmName) return null

  const npmInfoUrl = path.join(register, npmName)
  console.log(npmInfoUrl)

  return  axios.get(npmInfoUrl).then(res => {
    if (res.status === 200) {
      return res.data
    } else {
      return null
    }
  })
}

async function getNpmInfoVersions(npmName = '@tar-dev/core', register = setting.BASE_REGISTRY) {
  const data = await getNpmInfo(npmName, register)
  if (!data) {
    return []
  } else {
    return Object.keys(data)
  }
}



function getLatestVersion() {}

module.exports = {
  getNpmInfo,
  getNpmInfoVersions
}
