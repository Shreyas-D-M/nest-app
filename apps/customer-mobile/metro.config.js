const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for a pnpm monorepo.
 *
 * Metro does not walk up out of the app directory by default, so it has to be
 * told to watch the workspace root and to resolve modules from the root
 * node_modules. Without this, imports of `@nest/ui` and friends fail to resolve.
 *
 * `disableHierarchicalLookup` stops Metro from silently picking up a nested copy
 * of a package, which is what produces "two Reacts" bugs in monorepos.
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

module.exports = config;
