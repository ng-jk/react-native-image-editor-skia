module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // react-native-worklets/plugin must be listed LAST.
  // (react-native-reanimated v4 delegates its Babel plugin to react-native-worklets.)
  plugins: ['react-native-worklets/plugin'],
};
