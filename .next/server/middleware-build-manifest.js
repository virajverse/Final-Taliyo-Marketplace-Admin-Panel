self.__BUILD_MANIFEST = {
  "polyfillFiles": [
    "static/chunks/polyfills.js"
  ],
  "devFiles": [
    "static/chunks/react-refresh.js"
  ],
  "ampDevFiles": [],
  "lowPriorityFiles": [],
  "rootMainFiles": [],
  "pages": {
    "/_app": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_app.js"
    ],
    "/_error": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_error.js"
    ],
    "/analytics": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/analytics.js"
    ],
    "/banner-analytics": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/banner-analytics.js"
    ],
    "/banners": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/banners.js"
    ],
    "/manage-categories": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/manage-categories.js"
    ],
    "/tracking": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/tracking.js"
    ]
  },
  "ampFirstPages": []
};
self.__BUILD_MANIFEST.lowPriorityFiles = [
"/static/" + process.env.__NEXT_BUILD_ID + "/_buildManifest.js",
,"/static/" + process.env.__NEXT_BUILD_ID + "/_ssgManifest.js",

];