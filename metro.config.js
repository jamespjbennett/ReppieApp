const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

// expo-sqlite on web needs SharedArrayBuffer. These are the header values from the SDK 57 docs.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    if (
      req.url &&
      req.url.includes('.bundle') &&
      req.url.includes('platform=web') &&
      !req.url.includes('serializer.splitChunks=')
    ) {
      const join = req.url.includes('?') ? '&' : '?';
      req.url = `${req.url}${join}serializer.splitChunks=true`;
    }
    return middleware(req, res, next);
  };
};

module.exports = config;
