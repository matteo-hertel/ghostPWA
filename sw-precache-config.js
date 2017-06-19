module.exports = {
  staticFileGlobs: [
    "/index.html",
    "/favicon.ico",
    "/manifest.json",
    "/bower_components/webcomponentsjs/webcomponents-lite.js",
    "/images/*",
    "/fonts/*"
  ],
  skipWaiting: true,
  clientsClaim: true,
  handleFetch: true,
  templateFilePath: "./custom-service-worker.tmpl",
  navigateFallback: "/index.html",
  navigateFallbackWhitelist: [/^(?!.*\.html$|\/data\/|\/fonts\/|\/images\/).*/],
  runtimeCaching: [
    {
      urlPattern: /(\/data\/|\/fonts\/|\/images\/|\/src\/|\/bower_components\/)/,
      handler: "fastest"
    },
    {
      urlPattern: /.*\.html/,
      handler: "fastest"
    },
    {
      urlPattern: /api/,
      handler: "networkFirst"
    },
    {
      urlPattern: /\//,
      handler: "networkFirst"
    },
    {
      urlPattern: /https:\/\/fonts.googleapis.com\/*/,
      handler: "fastest"
    }
    ,
    {
      urlPattern: /https:\/\/cdn.matteohertel.com\/*/,
      handler: "fastest"
    }
  ]
};
