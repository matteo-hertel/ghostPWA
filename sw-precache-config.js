module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/favicon.ico',
    '/manifest.json',
    '/bower_components/webcomponentsjs/webcomponents-lite.js',
    '/images/*',
    '/fonts/*'
  ],
  templateFilePath: "./custom-service-worker.tmpl",
  navigateFallback: '/index.html',
  navigateFallbackWhitelist: [/^(?!.*\.html$|\/data\/|\/fonts\/|\/images\/).*/],
  "runtimeCaching": [{
      "urlPattern": /(\/data\/|\/fonts\/|\/images\/|\/src\/|\/bower_components\/)/,
      "handler": "networkFirst"
    },
    {
      "urlPattern": /.*\.html/,
      "handler": "networkFirst"
    },
    {
      "urlPattern": /ghost\/api\/*/,
      "handler": "networkFirs"
    }
  ]
};