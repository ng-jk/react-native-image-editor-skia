const path = require('path');
const pak = require('../package.json');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Resolve the library package name to its TypeScript source in ../src,
    // so you can edit the library and see changes with Fast Refresh.
    [
      'module-resolver',
      {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          [pak.name]: path.join(__dirname, '..', pak.source || 'src'),
        },
      },
    ],
    // Reanimated v4 delegates its Babel plugin to react-native-worklets.
    // This MUST be the last plugin.
    'react-native-worklets/plugin',
  ],
};
