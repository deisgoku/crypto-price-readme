const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.gltf$/,
      use: [
        {
          loader: 'file-loader',
        },
      ],
    })
    return config
  },
}

module.exports = nextConfig
