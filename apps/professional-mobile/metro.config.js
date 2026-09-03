const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Guarantee that 'react' and 'react-native' ALWAYS resolve to the single canonical instance
const reactEntry = require.resolve('react', { paths: [monorepoRoot] });
const reactDir = path.dirname(reactEntry);
const reactNativeEntry = require.resolve('react-native', { paths: [monorepoRoot] });
const reactNativeDir = path.dirname(reactNativeEntry);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react') {
    return {
      filePath: reactEntry,
      type: 'sourceFile',
    };
  }
  if (moduleName.startsWith('react/')) {
    const subpath = moduleName.slice(6);
    return {
      filePath: path.join(reactDir, subpath.endsWith('.js') ? subpath : `${subpath}.js`),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react-native') {
    return {
      filePath: reactNativeEntry,
      type: 'sourceFile',
    };
  }
  if (moduleName.startsWith('react-native/')) {
    const subpath = moduleName.slice(13);
    const resolvedPath = path.join(reactNativeDir, subpath.endsWith('.js') ? subpath : `${subpath}.js`);
    return {
      filePath: resolvedPath,
      type: 'sourceFile',
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
