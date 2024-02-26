module.exports = {
  webpack(config, { isServer })  {
    if (!isServer) {
      config.devtool = 'source-map'
    }

    return config
  }
}
