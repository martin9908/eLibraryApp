// Metro config for the mobile app inside the pnpm workspace.
// Expo defaults assume a hoisted node_modules at the project root; under pnpm's
// symlinked store the dependencies live at the workspace root, so Metro must
// watch it and be told where to resolve modules from.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole workspace so changes to packages/* trigger reloads.
config.watchFolders = [workspaceRoot];

// Resolve from the app first, then the workspace root store.
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// pnpm uses symlinks; don't walk up parent dirs looking for modules.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
