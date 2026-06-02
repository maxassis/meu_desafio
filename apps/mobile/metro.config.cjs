const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')

function escapePathForRegex(pathname) {
  return pathname.replaceAll('\\', '/').replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
}

module.exports = (() => {
  const config = getDefaultConfig(__dirname)
  const apiRoot = path.resolve(__dirname, '../api')
  const apiRootRegex = new RegExp(`${escapePathForRegex(apiRoot)}/.*`)

  const { transformer, resolver } = config

  config.watchFolders = config.watchFolders?.filter(folder => folder !== apiRoot)

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  }
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
    blockList: Array.isArray(resolver.blockList)
      ? [...resolver.blockList, apiRootRegex]
      : resolver.blockList
        ? [resolver.blockList, apiRootRegex]
        : [apiRootRegex],
    sourceExts: [...resolver.sourceExts, 'svg'],
  }

  return withUniwindConfig(config, {
    cssEntryFile: './global.css',
    dtsFile: './uniwind-types.d.ts',
    polyfills: {
      rem: 14,
    },
  })
})()
