"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutableClasses = exports.registerRouter = exports.handleRouteChange = exports.RouteUpdated = exports.RouteDectivated = exports.RouteActivated = exports.RouteMatcher = exports.Routed = void 0;
var registeredClasses = new Map();
var routeableObjects = new Set();
function getRegisteredClass(key) {
    if (!registeredClasses.has(key)) {
        registeredClasses.set(key, { activeRoutes: [] });
    }
    return registeredClasses.get(key);
}
function registerRoutableObject(object) {
    routeableObjects.add(object);
}
function setRoutesMetadata(flatTree, parentPath) {
    if (parentPath === void 0) { parentPath = ''; }
    flatTree.forEach(function (node) {
        var pathName = parentPath ? "".concat(parentPath, ".").concat(node.name) : node.name;
        node.meta = { pathName: pathName };
        if (node.children && node.children.length > 0) {
            setRoutesMetadata(node.children, pathName);
        }
    });
}
function matchesRoute(config, route) {
    if (Array.isArray(config.activeRoutes)) {
        return !!config.activeRoutes.find(function (exp) {
            var _a, _b;
            if (exp instanceof RegExp) {
                return exp.test((_a = route.meta) === null || _a === void 0 ? void 0 : _a.pathName);
            }
            else if (typeof exp === 'string') {
                return exp === ((_b = route.meta) === null || _b === void 0 ? void 0 : _b.pathName);
            }
            else {
                return exp(route);
            }
        });
    }
}
function handleError(promise, controller, method) {
    if (!(promise instanceof Promise)) {
        throw new Error("Controller ".concat(controller.name, ".").concat(method, " must be async or return a Promise"));
    }
    return promise.catch(function (error) {
        console.error("Error in ".concat(method, " for controller ").concat(controller.name, ": ").concat(error.message));
    });
}
function Routed(arg) {
    return function (ctor) {
        var _a;
        var config = getRegisteredClass(ctor.prototype);
        (_a = config.activeRoutes).push.apply(_a, (arg || []));
        return /** @class */ (function (_super) {
            __extends(class_1, _super);
            function class_1() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _this = _super.apply(this, args) || this;
                registerRoutableObject(_this);
                return _this;
            }
            return class_1;
        }(ctor));
    };
}
exports.Routed = Routed;
function RouteMatcher(target, propertyKey, descriptor) {
    var config = getRegisteredClass(target);
    config.activeRoutes.push(target[propertyKey]);
}
exports.RouteMatcher = RouteMatcher;
function RouteActivated(target, propertyKey, descriptor) {
    var config = getRegisteredClass(target);
    config.activate = target[propertyKey];
}
exports.RouteActivated = RouteActivated;
function RouteDectivated(target, propertyKey, descriptor) {
    var config = getRegisteredClass(target);
    config.deactivate = target[propertyKey];
}
exports.RouteDectivated = RouteDectivated;
function RouteUpdated(target, propertyKey, descriptor) {
    var config = getRegisteredClass(target);
    config.update = target[propertyKey];
}
exports.RouteUpdated = RouteUpdated;
function handleRouteChange(from, to) {
    return __awaiter(this, void 0, void 0, function () {
        var promises;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = [];
                    Array.from(routeableObjects).forEach(function (routable) {
                        var key = Object.getPrototypeOf(Object.getPrototypeOf(routable));
                        var config = registeredClasses.get(key);
                        if (!config) {
                            return;
                        }
                        if (!matchesRoute(config, to) && !matchesRoute(config, from)) {
                            return;
                        }
                        if (to.name === from.name && config.update) {
                            promises.push(handleError(config.update.call(routable, to, from), key.name, 'update'));
                        }
                        else if (config.activate && matchesRoute(config, to)) {
                            promises.push(handleError(config.activate.call(routable, to, from), key.name, 'activate'));
                        }
                        else if (config.deactivate) {
                            promises.push(handleError(config.deactivate.call(routable, to, from), key.name, 'deactivate'));
                        }
                    });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.handleRouteChange = handleRouteChange;
function registerRouter(router) {
    setRoutesMetadata(router.getRoutes());
    return router;
}
exports.registerRouter = registerRouter;
function registerRoutableClasses() {
    var classes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        classes[_i] = arguments[_i];
    }
    for (var _a = 0, classes_1 = classes; _a < classes_1.length; _a++) {
        var clazz = classes_1[_a];
        clazz.prototype;
    } //just poke the class in order to be loaded
}
exports.registerRoutableClasses = registerRoutableClasses;
