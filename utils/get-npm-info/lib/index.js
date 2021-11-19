'use strict';

const semver = require('semver')
const axios = require('axios')
const urlJoin = require('url-join')

const setting = {
  BASE_REGISTRY: 'https://registry.npmjs.org',
  TAOBAO_REGISTRY: 'https://registry.npm.taobao.org'
}

function getNpmInfo(npmName = '@uni-cli/cli', register = setting.BASE_REGISTRY) {
  if (!npmName) return null

  let npmInfoUrl = urlJoin(register, npmName)
  console.log(npmInfoUrl)

  return  axios.get(npmInfoUrl).then(res => {
    if (res.status === 200) {
      return res.data
    } else {
      return null
    }
  })
}

async function getNpmInfoVersions(npmName, register) {
  const data = await getNpmInfo(npmName, register)
  if (!data || !data.versions) {
    return []
  } else {
    return Object.keys(data.versions)
  }
}

async function getSemverVersion(npmName) {
  let versions = await getNpmInfoVersions(npmName)
  versions = versions
    // .filter(version => semver.gt(version, baseVersion))
    .sort((a, b) => {
      if (semver.gt(b, a)) return 1
      return  -1
    })

  return versions
}



async function getLatestVersion(npmName) {
  const versions = await getSemverVersion(npmName)
  console.log(versions)
  if (versions && versions.length) return versions[0]

  return null
}

module.exports = {
  getNpmInfo,
  getNpmInfoVersions,
  getSemverVersion,
  getLatestVersion
}
