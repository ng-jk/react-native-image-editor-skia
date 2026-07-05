const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const pak = require('../package.json');

const root = path.resolve(__dirname, '..');

// Shared modules that must resolve to a SINGLE copy (the example app's), even
// though the library repo also has them in ../node_modules. Duplicates of React
// or Reanimated would crash at runtime.
const modules = Object.keys({ ...pak.peerDependencies });

function escape(s) {
  return s.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  // Watch the library source (../src) so edits hot-reload.
  watchFolders: [root],
  resolver: {
    // Block the library repo's own copies of the shared modules.
    blockList: modules.map(
      (m) =>
        new RegExp(`^${escape(path.join(root, 'node_modules', m))}([/\\\\].*)?$`)
    ),
    // Force those modules to resolve from the example app's node_modules.
    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name);
      return acc;
    }, {}),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
