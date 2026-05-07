module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@nexus-hub/core': '../../core/src/index.ts',
          },
        },
      ],
    ],
  };
};
