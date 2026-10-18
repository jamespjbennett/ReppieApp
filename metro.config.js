const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

// SDK 57 builds the web page with lazy bundling on and chunk splitting off.
// The sqlite worker is then missing from the graph, and the serializer asserts.
const cliServer = require.resolve(
  './node_modules/expo/node_modules/@expo/cli/build/src/start/server/metro/MetroBundlerDevServer.js',
);
if (require.cache[cliServer]) {
  const { MetroBundlerDevServer } = require(cliServer);
  const proto = MetroBundlerDevServer.prototype;
  const original = proto.metroImportAsArtifactsAsync;
  if (original && !original.reppieWorkerChunks) {
    function metroImportAsArtifactsAsync(filePath, specificOptions = {}) {
      const options = { ...specificOptions };
      if (options.platform === 'web' && options.environment === 'client') {
        options.lazy = false;
        options.splitChunks = true;
      }
      return original.call(this, filePath, options);
    }
    metroImportAsArtifactsAsync.reppieWorkerChunks = true;
    proto.metroImportAsArtifactsAsync = metroImportAsArtifactsAsync;
  }
}

// expo-sqlite on web needs SharedArrayBuffer. These are the header values from the SDK 57 docs.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return middleware(req, res, next);
  };
};

module.exports = config;
