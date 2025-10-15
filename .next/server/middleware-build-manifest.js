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
    "/bookings": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/bookings.js"
    ],
    "/manage-admins": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/manage-admins.js"
    ],
    "/manage-categories": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/manage-categories.js"
    ],
    "/products": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/products.js"
    ],
    "/settings": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/settings.js"
    ],
    "/tracking": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/tracking.js"
    ],
    "/upload": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/upload.js"
    ]
  },
  "ampFirstPages": []
};
self.__BUILD_MANIFEST.lowPriorityFiles = [
"/static/" + process.env.__NEXT_BUILD_ID + "/_buildManifest.js",
,"/static/" + process.env.__NEXT_BUILD_ID + "/_ssgManifest.js",

];