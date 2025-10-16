/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./lib/simpleAuth.js":
/*!***************************!*\
  !*** ./lib/simpleAuth.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ADMIN_CREDENTIALS: () => (/* binding */ ADMIN_CREDENTIALS),\n/* harmony export */   checkAdminAccess: () => (/* binding */ checkAdminAccess),\n/* harmony export */   checkSession: () => (/* binding */ checkSession),\n/* harmony export */   simpleLogin: () => (/* binding */ simpleLogin),\n/* harmony export */   simpleLogout: () => (/* binding */ simpleLogout)\n/* harmony export */ });\n// Simple authentication for admin panel\n// No Supabase Auth dependency\nconst ADMIN_CREDENTIALS = [];\n// Simple login function\nconst simpleLogin = async (email, _password)=>{\n    const sessionData = {\n        email,\n        name: \"Admin\",\n        role: \"super_admin\",\n        loginTime: new Date().toISOString()\n    };\n    if (false) {}\n    return sessionData;\n};\n// Check if user is logged in\nconst checkSession = ()=>{\n    if (true) return null;\n    try {\n        const session = localStorage.getItem(\"admin_session\");\n        if (!session) return null;\n        const sessionData = JSON.parse(session);\n        // Check if session is still valid (24 hours)\n        const loginTime = new Date(sessionData.loginTime);\n        const now = new Date();\n        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);\n        if (hoursDiff > 24) {\n            localStorage.removeItem(\"admin_session\");\n            return null;\n        }\n        return sessionData;\n    } catch (error) {\n        localStorage.removeItem(\"admin_session\");\n        return null;\n    }\n};\n// Logout function\nconst simpleLogout = ()=>{\n    if (false) {}\n};\n// Check admin access\nconst checkAdminAccess = ()=>true;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9saWIvc2ltcGxlQXV0aC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLHdDQUF3QztBQUN4Qyw4QkFBOEI7QUFFdkIsTUFBTUEsb0JBQW9CLEVBQUU7QUFFbkMsd0JBQXdCO0FBQ2pCLE1BQU1DLGNBQWMsT0FBT0MsT0FBT0M7SUFDdkMsTUFBTUMsY0FBYztRQUNsQkY7UUFDQUcsTUFBTTtRQUNOQyxNQUFNO1FBQ05DLFdBQVcsSUFBSUMsT0FBT0MsV0FBVztJQUNuQztJQUNBLElBQUksS0FBa0IsRUFBYSxFQUVsQztJQUNELE9BQU9MO0FBQ1QsRUFBQztBQUVELDZCQUE2QjtBQUN0QixNQUFNVSxlQUFlO0lBQzFCLElBQUksSUFBa0IsRUFBYSxPQUFPO0lBRTFDLElBQUk7UUFDRixNQUFNQyxVQUFVTCxhQUFhTSxPQUFPLENBQUM7UUFDckMsSUFBSSxDQUFDRCxTQUFTLE9BQU87UUFFckIsTUFBTVgsY0FBY1EsS0FBS0ssS0FBSyxDQUFDRjtRQUUvQiw2Q0FBNkM7UUFDN0MsTUFBTVIsWUFBWSxJQUFJQyxLQUFLSixZQUFZRyxTQUFTO1FBQ2hELE1BQU1XLE1BQU0sSUFBSVY7UUFDaEIsTUFBTVcsWUFBWSxDQUFDRCxNQUFNWCxTQUFRLElBQU0sUUFBTyxLQUFLLEVBQUM7UUFFcEQsSUFBSVksWUFBWSxJQUFJO1lBQ2xCVCxhQUFhVSxVQUFVLENBQUM7WUFDeEIsT0FBTztRQUNUO1FBRUEsT0FBT2hCO0lBQ1QsRUFBRSxPQUFPaUIsT0FBTztRQUNkWCxhQUFhVSxVQUFVLENBQUM7UUFDeEIsT0FBTztJQUNUO0FBQ0YsRUFBQztBQUVELGtCQUFrQjtBQUNYLE1BQU1FLGVBQWU7SUFDMUIsSUFBSSxLQUFrQixFQUFhLEVBRWxDO0FBQ0gsRUFBQztBQUVELHFCQUFxQjtBQUNkLE1BQU1DLG1CQUFtQixJQUFNLEtBQUkiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90YWxpeW8tYWRtaW4tcGFuZWwvLi9saWIvc2ltcGxlQXV0aC5qcz8zZmM4Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIFNpbXBsZSBhdXRoZW50aWNhdGlvbiBmb3IgYWRtaW4gcGFuZWxcbi8vIE5vIFN1cGFiYXNlIEF1dGggZGVwZW5kZW5jeVxuXG5leHBvcnQgY29uc3QgQURNSU5fQ1JFREVOVElBTFMgPSBbXVxuXG4vLyBTaW1wbGUgbG9naW4gZnVuY3Rpb25cbmV4cG9ydCBjb25zdCBzaW1wbGVMb2dpbiA9IGFzeW5jIChlbWFpbCwgX3Bhc3N3b3JkKSA9PiB7XG4gIGNvbnN0IHNlc3Npb25EYXRhID0ge1xuICAgIGVtYWlsLFxuICAgIG5hbWU6ICdBZG1pbicsXG4gICAgcm9sZTogJ3N1cGVyX2FkbWluJyxcbiAgICBsb2dpblRpbWU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICB9XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhZG1pbl9zZXNzaW9uJywgSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbkRhdGEpKVxuICB9XG4gIHJldHVybiBzZXNzaW9uRGF0YVxufVxuXG4vLyBDaGVjayBpZiB1c2VyIGlzIGxvZ2dlZCBpblxuZXhwb3J0IGNvbnN0IGNoZWNrU2Vzc2lvbiA9ICgpID0+IHtcbiAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gbnVsbFxuICBcbiAgdHJ5IHtcbiAgICBjb25zdCBzZXNzaW9uID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FkbWluX3Nlc3Npb24nKVxuICAgIGlmICghc2Vzc2lvbikgcmV0dXJuIG51bGxcbiAgICBcbiAgICBjb25zdCBzZXNzaW9uRGF0YSA9IEpTT04ucGFyc2Uoc2Vzc2lvbilcbiAgICBcbiAgICAvLyBDaGVjayBpZiBzZXNzaW9uIGlzIHN0aWxsIHZhbGlkICgyNCBob3VycylcbiAgICBjb25zdCBsb2dpblRpbWUgPSBuZXcgRGF0ZShzZXNzaW9uRGF0YS5sb2dpblRpbWUpXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKVxuICAgIGNvbnN0IGhvdXJzRGlmZiA9IChub3cgLSBsb2dpblRpbWUpIC8gKDEwMDAgKiA2MCAqIDYwKVxuICAgIFxuICAgIGlmIChob3Vyc0RpZmYgPiAyNCkge1xuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2FkbWluX3Nlc3Npb24nKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHNlc3Npb25EYXRhXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2FkbWluX3Nlc3Npb24nKVxuICAgIHJldHVybiBudWxsXG4gIH1cbn1cblxuLy8gTG9nb3V0IGZ1bmN0aW9uXG5leHBvcnQgY29uc3Qgc2ltcGxlTG9nb3V0ID0gKCkgPT4ge1xuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnYWRtaW5fc2Vzc2lvbicpXG4gIH1cbn1cblxuLy8gQ2hlY2sgYWRtaW4gYWNjZXNzXG5leHBvcnQgY29uc3QgY2hlY2tBZG1pbkFjY2VzcyA9ICgpID0+IHRydWUiXSwibmFtZXMiOlsiQURNSU5fQ1JFREVOVElBTFMiLCJzaW1wbGVMb2dpbiIsImVtYWlsIiwiX3Bhc3N3b3JkIiwic2Vzc2lvbkRhdGEiLCJuYW1lIiwicm9sZSIsImxvZ2luVGltZSIsIkRhdGUiLCJ0b0lTT1N0cmluZyIsImxvY2FsU3RvcmFnZSIsInNldEl0ZW0iLCJKU09OIiwic3RyaW5naWZ5IiwiY2hlY2tTZXNzaW9uIiwic2Vzc2lvbiIsImdldEl0ZW0iLCJwYXJzZSIsIm5vdyIsImhvdXJzRGlmZiIsInJlbW92ZUl0ZW0iLCJlcnJvciIsInNpbXBsZUxvZ291dCIsImNoZWNrQWRtaW5BY2Nlc3MiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./lib/simpleAuth.js\n");

/***/ }),

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/router */ \"./node_modules/.pnpm/next@14.2.15_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _lib_simpleAuth__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../lib/simpleAuth */ \"./lib/simpleAuth.js\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_4__);\n\n\n\n\n\nfunction MyApp({ Component, pageProps }) {\n    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true);\n    const [user, setUser] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_2__.useRouter)();\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        checkAuthStatus();\n    }, [\n        router.pathname\n    ]);\n    const checkAuthStatus = ()=>{\n        setLoading(true);\n        try {\n            const session = (0,_lib_simpleAuth__WEBPACK_IMPORTED_MODULE_3__.checkSession)();\n            if (session) {\n                setUser(session);\n                // Redirect to dashboard if on login page\n                if (router.pathname === \"/login\") {\n                    router.push(\"/\");\n                }\n            } else {\n                setUser(null);\n                // Redirect to login if trying to access protected route\n                if (router.pathname !== \"/login\") {\n                    router.push(\"/login\");\n                }\n            }\n        } catch (error) {\n            console.error(\"Auth check error:\", error);\n            setUser(null);\n            if (router.pathname !== \"/login\") {\n                router.push(\"/login\");\n            }\n        }\n        setLoading(false);\n    };\n    // Show loading spinner during auth check\n    if (loading) {\n        return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"min-h-screen flex items-center justify-center bg-gray-100\",\n            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"text-center\",\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                        className: \"loading-spinner mx-auto mb-4\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\WDAGUtilityAccount\\\\Desktop\\\\Taliyo Marketplace (1)\\\\Taliyo Marketplace (1)\\\\admin-panel\\\\pages\\\\_app.js\",\n                        lineNumber: 52,\n                        columnNumber: 11\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                        className: \"text-gray-600\",\n                        children: \"Loading...\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\WDAGUtilityAccount\\\\Desktop\\\\Taliyo Marketplace (1)\\\\Taliyo Marketplace (1)\\\\admin-panel\\\\pages\\\\_app.js\",\n                        lineNumber: 53,\n                        columnNumber: 11\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"C:\\\\Users\\\\WDAGUtilityAccount\\\\Desktop\\\\Taliyo Marketplace (1)\\\\Taliyo Marketplace (1)\\\\admin-panel\\\\pages\\\\_app.js\",\n                lineNumber: 51,\n                columnNumber: 9\n            }, this)\n        }, void 0, false, {\n            fileName: \"C:\\\\Users\\\\WDAGUtilityAccount\\\\Desktop\\\\Taliyo Marketplace (1)\\\\Taliyo Marketplace (1)\\\\admin-panel\\\\pages\\\\_app.js\",\n            lineNumber: 50,\n            columnNumber: 7\n        }, this);\n    }\n    // Pass user to all pages\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n        ...pageProps,\n        user: user\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\WDAGUtilityAccount\\\\Desktop\\\\Taliyo Marketplace (1)\\\\Taliyo Marketplace (1)\\\\admin-panel\\\\pages\\\\_app.js\",\n        lineNumber: 60,\n        columnNumber: 10\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQTJDO0FBQ0o7QUFDUztBQUNsQjtBQUU5QixTQUFTSSxNQUFNLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFFO0lBQ3JDLE1BQU0sQ0FBQ0MsU0FBU0MsV0FBVyxHQUFHUCwrQ0FBUUEsQ0FBQztJQUN2QyxNQUFNLENBQUNRLE1BQU1DLFFBQVEsR0FBR1QsK0NBQVFBLENBQUM7SUFDakMsTUFBTVUsU0FBU1Qsc0RBQVNBO0lBRXhCRixnREFBU0EsQ0FBQztRQUNSWTtJQUNGLEdBQUc7UUFBQ0QsT0FBT0UsUUFBUTtLQUFDO0lBRXBCLE1BQU1ELGtCQUFrQjtRQUN0QkosV0FBVztRQUVYLElBQUk7WUFDRixNQUFNTSxVQUFVWCw2REFBWUE7WUFFNUIsSUFBSVcsU0FBUztnQkFDWEosUUFBUUk7Z0JBRVIseUNBQXlDO2dCQUN6QyxJQUFJSCxPQUFPRSxRQUFRLEtBQUssVUFBVTtvQkFDaENGLE9BQU9JLElBQUksQ0FBQztnQkFDZDtZQUNGLE9BQU87Z0JBQ0xMLFFBQVE7Z0JBRVIsd0RBQXdEO2dCQUN4RCxJQUFJQyxPQUFPRSxRQUFRLEtBQUssVUFBVTtvQkFDaENGLE9BQU9JLElBQUksQ0FBQztnQkFDZDtZQUNGO1FBQ0YsRUFBRSxPQUFPQyxPQUFPO1lBQ2RDLFFBQVFELEtBQUssQ0FBQyxxQkFBcUJBO1lBQ25DTixRQUFRO1lBQ1IsSUFBSUMsT0FBT0UsUUFBUSxLQUFLLFVBQVU7Z0JBQ2hDRixPQUFPSSxJQUFJLENBQUM7WUFDZDtRQUNGO1FBRUFQLFdBQVc7SUFDYjtJQUVBLHlDQUF5QztJQUN6QyxJQUFJRCxTQUFTO1FBQ1gscUJBQ0UsOERBQUNXO1lBQUlDLFdBQVU7c0JBQ2IsNEVBQUNEO2dCQUFJQyxXQUFVOztrQ0FDYiw4REFBQ0Q7d0JBQUlDLFdBQVU7Ozs7OztrQ0FDZiw4REFBQ0M7d0JBQUVELFdBQVU7a0NBQWdCOzs7Ozs7Ozs7Ozs7Ozs7OztJQUlyQztJQUVBLHlCQUF5QjtJQUN6QixxQkFBTyw4REFBQ2Q7UUFBVyxHQUFHQyxTQUFTO1FBQUVHLE1BQU1BOzs7Ozs7QUFDekM7QUFFQSxpRUFBZUwsS0FBS0EsRUFBQSIsInNvdXJjZXMiOlsid2VicGFjazovL3RhbGl5by1hZG1pbi1wYW5lbC8uL3BhZ2VzL19hcHAuanM/ZTBhZCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VSb3V0ZXIgfSBmcm9tICduZXh0L3JvdXRlcidcbmltcG9ydCB7IGNoZWNrU2Vzc2lvbiB9IGZyb20gJy4uL2xpYi9zaW1wbGVBdXRoJ1xuaW1wb3J0ICcuLi9zdHlsZXMvZ2xvYmFscy5jc3MnXG5cbmZ1bmN0aW9uIE15QXBwKHsgQ29tcG9uZW50LCBwYWdlUHJvcHMgfSkge1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKVxuICBjb25zdCBbdXNlciwgc2V0VXNlcl0gPSB1c2VTdGF0ZShudWxsKVxuICBjb25zdCByb3V0ZXIgPSB1c2VSb3V0ZXIoKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY2hlY2tBdXRoU3RhdHVzKClcbiAgfSwgW3JvdXRlci5wYXRobmFtZV0pXG5cbiAgY29uc3QgY2hlY2tBdXRoU3RhdHVzID0gKCkgPT4ge1xuICAgIHNldExvYWRpbmcodHJ1ZSlcbiAgICBcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2Vzc2lvbiA9IGNoZWNrU2Vzc2lvbigpXG4gICAgICBcbiAgICAgIGlmIChzZXNzaW9uKSB7XG4gICAgICAgIHNldFVzZXIoc2Vzc2lvbilcbiAgICAgICAgXG4gICAgICAgIC8vIFJlZGlyZWN0IHRvIGRhc2hib2FyZCBpZiBvbiBsb2dpbiBwYWdlXG4gICAgICAgIGlmIChyb3V0ZXIucGF0aG5hbWUgPT09ICcvbG9naW4nKSB7XG4gICAgICAgICAgcm91dGVyLnB1c2goJy8nKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRVc2VyKG51bGwpXG4gICAgICAgIFxuICAgICAgICAvLyBSZWRpcmVjdCB0byBsb2dpbiBpZiB0cnlpbmcgdG8gYWNjZXNzIHByb3RlY3RlZCByb3V0ZVxuICAgICAgICBpZiAocm91dGVyLnBhdGhuYW1lICE9PSAnL2xvZ2luJykge1xuICAgICAgICAgIHJvdXRlci5wdXNoKCcvbG9naW4nKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0F1dGggY2hlY2sgZXJyb3I6JywgZXJyb3IpXG4gICAgICBzZXRVc2VyKG51bGwpXG4gICAgICBpZiAocm91dGVyLnBhdGhuYW1lICE9PSAnL2xvZ2luJykge1xuICAgICAgICByb3V0ZXIucHVzaCgnL2xvZ2luJylcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgc2V0TG9hZGluZyhmYWxzZSlcbiAgfVxuXG4gIC8vIFNob3cgbG9hZGluZyBzcGlubmVyIGR1cmluZyBhdXRoIGNoZWNrXG4gIGlmIChsb2FkaW5nKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLWgtc2NyZWVuIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWdyYXktMTAwXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxvYWRpbmctc3Bpbm5lciBteC1hdXRvIG1iLTRcIj48L2Rpdj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNjAwXCI+TG9hZGluZy4uLjwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cblxuICAvLyBQYXNzIHVzZXIgdG8gYWxsIHBhZ2VzXG4gIHJldHVybiA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IHVzZXI9e3VzZXJ9IC8+XG59XG5cbmV4cG9ydCBkZWZhdWx0IE15QXBwXG4iXSwibmFtZXMiOlsidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJ1c2VSb3V0ZXIiLCJjaGVja1Nlc3Npb24iLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsImxvYWRpbmciLCJzZXRMb2FkaW5nIiwidXNlciIsInNldFVzZXIiLCJyb3V0ZXIiLCJjaGVja0F1dGhTdGF0dXMiLCJwYXRobmFtZSIsInNlc3Npb24iLCJwdXNoIiwiZXJyb3IiLCJjb25zb2xlIiwiZGl2IiwiY2xhc3NOYW1lIiwicCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next@14.2.15_react-dom@18.3.1_react@18.3.1__react@18.3.1","vendor-chunks/@swc+helpers@0.5.5"], () => (__webpack_exec__("./pages/_app.js")));
module.exports = __webpack_exports__;

})();