function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

var Vue;

var install = function install(_Vue) {
  if (_Vue === Vue) {
    return;
  }

  Vue = _Vue;
  applyMixin(Vue);
};

var applyMixin = function applyMixin(Vue) {
  Vue.mixin({
    beforeCreate: function beforeCreate() {
      var options = this.$options;

      if (options.store) {
        this.$store = options.store;
      } else if (options.parent && options.parent.$store) {
        this.$store = options.parent.$store;
      }
    }
  });
};

var isString = function isString(v) {
  return typeof v === 'string';
};

var isArray = function isArray(v) {
  return Array.isArray(v);
};

var isPlainObject = function isPlainObject(v) {
  return Object.prototype.toString.call(v).slice(8, -1) === 'Object';
};

var isFunction = function isFunction(v) {
  return typeof v === 'function';
};

var isPromise = function isPromise(v) {
  return v && isFunction(v);
};

var each = function each(target, fn) {
  if (isArray(target)) {
    for (var i = 0, l = target.length; i < l; i++) {
      fn(i, target[i]);
    }
  } else if (isPlainObject(target)) {
    var keys = Object.keys(target);

    for (var _i = 0, _l = keys.length; _i < _l; _i++) {
      var key = keys[_i];
      fn(key, target[key]);
    }
  }
};

var resetStoreVM = function resetStoreVM(store, state) {
  var oldVm = store._vm;
  var computed = Object.create(null);
  store.getters = Object.create(null);
  each(store._wrappedGetters, function (name, wrappedGetter) {
    computed[name] = wrappedGetter;
    Object.defineProperty(store.getters, name, {
      get: function get() {
        return store._vm[name];
      },
      enumerable: true
    });
  });
  store._vm = new Vue({
    data: function data() {
      return {
        $$state: state
      };
    },
    computed: computed
  });

  if (oldVm) {
    Vue.nextTick(function () {
      return oldVm.$destory();
    });
  }
};

var getNestedState = function getNestedState(rootState, path) {
  return path.reduce(function (state, key) {
    return state[key];
  }, rootState);
};

var makeLocalGetters = function makeLocalGetters(store, namespace) {
  var _makeLocalGettersCache = store._makeLocalGettersCache;

  if (_makeLocalGettersCache[namespace]) {
    var length = namespace.length;
    var proxyGetter = Object.create(null);
    each(store.getters, function (name) {
      if (name.slice(0, length) !== namespace) {
        return;
      }

      var userDef = name.slice(namespace);
      Object.defineProperty(proxyGetter, userDef, {
        get: function get() {
          store.getters[name];
        }
      });
    });
    _makeLocalGettersCache[namespace] = proxyGetter;
  }

  return _makeLocalGettersCache[namespace];
};

var unifyObjectStyle = function unifyObjectStyle(type, payload, options) {
  if (isPlainObject(type) && type.type) {
    options = payload;
    payload = type;
    type = type.type;
  }

  return {
    type: type,
    payload: payload,
    options: options
  };
};

var makeLocalContext = function makeLocalContext(store, namespace, path) {
  var local = {
    commit: !namespace ? store.commit : function (_type, _payload, _options) {
      var args = unifyObjectStyle(_type, _payload, _options);
      var payload = args.payload,
          options = args.options;
      var type = args.type;

      if (!options || !options.root) {
        type = namespace + type;
      }

      store.commit(type, payload);
    },
    dispatch: !namespace ? store.dispatch : function (_type, _payload, _options) {
      var args = unifyObjectStyle(_type, _payload, _options);
      var payload = args.payload,
          options = args.options;
      var type = args.type;

      if (!options || !options.root) {
        type = namespace + type;
      }

      store.dispatch(type, payload);
    }
  };
  Object.defineProperties(local, {
    getters: {
      get: namespace ? function () {
        return store.getters;
      } : makeLocalGetters(store, namespace)
    },
    state: {
      get: function get() {
        return getNestedState(store.state, path);
      }
    }
  });
  return local;
};

var installModule = function installModule(store, rootState, path, module) {
  // 每次都从根模块找到
  var namespace = store._modules.getNameSpace(path);

  if (path.length !== 0) {
    var parentState = getNestedState(rootState, path.slice(0, -1));
    Vue.set(parentState, path[path.length - 1], module.state);
  }

  var local = module.context = makeLocalContext(store, namespace, path);
  var _module$_rawModule = module._rawModule,
      actions = _module$_rawModule.actions,
      mutations = _module$_rawModule.mutations,
      getters = _module$_rawModule.getters;

  if (actions) {
    each(actions, function (name, handler) {
      name = handler.root ? name : namespace + name;
      handler = handler.handler || handler;
      var entry = store._actions[name] = store._actions[name] || [];
      entry.push(function wrappedActionHandler(payload) {
        var res = handler.call(store, local, payload);

        if (!isPromise(res)) {
          res = Promise.resolve(res);
        }

        return res;
      });
    });
  }

  if (mutations) {
    each(mutations, function (name, handler) {
      name = namespace + name;
      var entry = store._mutations[name] = store._mutations[name] || [];
      entry.push(function wrappedMutationHandler(payload) {
        handler.call(store, local.state, payload);
      });
    });
  }

  if (getters) {
    each(getters, function (name, handler) {
      name = namespace + name;

      store._wrappedGetters[name] = function wrappedGetter() {
        return handler(local.getters, local.state, store.getters, store.state);
      };
    });
  }

  var _children = module._children;

  if (_children) {
    each(_children, function (name, module) {
      installModule(store, rootState, path.concat(name), module);
    });
  }
};

var Module = /*#__PURE__*/function () {
  function Module(rawModule) {
    _classCallCheck(this, Module);

    this._children = Object.create(null);
    this._rawModule = rawModule;
    this.state = rawModule.state || {};
  }

  _createClass(Module, [{
    key: "namespaced",
    get: function get() {
      return !!this._rawModule.namespaced;
    } // 添加 module

  }, {
    key: "addChild",
    value: function addChild(name, module) {
      this._children[name] = module;
    } // 获取 module

  }, {
    key: "getChild",
    value: function getChild(name) {
      return this._children[name];
    }
  }]);

  return Module;
}();

var ModuleCollection = /*#__PURE__*/function () {
  function ModuleCollection(options) {
    _classCallCheck(this, ModuleCollection);

    this.register([], options);
  }

  _createClass(ModuleCollection, [{
    key: "register",
    value: function register(path, rawModule) {
      var _this = this;

      var newModule = new Module(rawModule);

      if (path.length === 0) {
        this.root = newModule;
      } else {
        var parent = this.get(path.slice(0, -1));
        parent.addChild(path[path.length - 1], newModule);
      }

      var modules = rawModule.modules;

      if (modules) {
        each(modules, function (name, childRawModule) {
          _this.register(path.concat(name), childRawModule);
        });
      }
    } // 根据 path 获取 module

  }, {
    key: "get",
    value: function get(path) {
      return path.reduce(function (module, name) {
        return module.getChild(name);
      }, this.root);
    } // 拼接出 namespace

  }, {
    key: "getNameSpace",
    value: function getNameSpace(path) {
      var module = this.root;
      return path.reduce(function (namespace, name) {
        module = module.getChild(name);
        return namespace += module.namespaced ? "".concat(name, "/") : '';
      }, '');
    }
  }]);

  return ModuleCollection;
}();

var Store = /*#__PURE__*/function () {
  function Store() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Store);

    this._subscribers = [];
    this._actionSubscribes = [];
    this._actions = Object.create(null);
    this._mutations = Object.create(null);
    this._wrappedGetters = Object.create(null);
    this._makeLocalGettersCache = Object.create(null);
    this._modules = new ModuleCollection(options);
    var store = this;
    var commit = this.commit,
        dispatch = this.dispatch;

    this.dispatch = function boundDispatch(type, payload) {
      dispatch.call(store, type, payload);
    };

    this.commit = function boundCommit(type, payload) {
      // store.commit() => this 是 store
      // context.commit() => this 是 context，即 local
      // foo ({ commit }) { commit('bar') } => this 是 undefined
      commit.call(store, type, payload);
    };

    var state = this._modules.root.state;
    installModule(this, state, [], this._modules.root);
    resetStoreVM(this, state);
    var plugins = options.plugins;
    each(plugins, function (_, plugin) {
      plugin(_this);
    }); // console.log(this)
  }

  _createClass(Store, [{
    key: "state",
    get: function get() {
      return this._vm._data.$$state;
    }
  }, {
    key: "dispatch",
    value: function dispatch(_type, _payload) {
      var _this2 = this;

      var _unifyObjectStyle = unifyObjectStyle(_type, _payload),
          type = _unifyObjectStyle.type,
          payload = _unifyObjectStyle.payload;

      var action = {
        type: type,
        payload: payload
      };
      each(this._actionSubscribes.filter(function (sub) {
        return sub.before;
      }), function (_, sub) {
        sub.before(action, _this2.state);
      });
      var entry = this._actions[type];
      var result = entry.length > 1 ? entry.map(function (wrappedActionHandler) {
        return wrappedActionHandler(payload);
      }) : entry[0](payload);
      return new Promise(function (resolve, reject) {
        result.then(function (res) {
          each(_this2._actionSubscribes.filter(function (sub) {
            return sub.after;
          }), function (_, sub) {
            sub.after(action, _this2.state);
          });
          resolve(res);
        }, function (error) {
          each(_this2._actionSubscribes.filter(function (sub) {
            return sub.error;
          }), function (_, sub) {
            sub.error(action, _this2.state, error);
          });
          reject(error);
        });
      });
    }
  }, {
    key: "commit",
    value: function commit(_type, _payload) {
      var _this3 = this;

      var _unifyObjectStyle2 = unifyObjectStyle(_type, _payload),
          type = _unifyObjectStyle2.type,
          payload = _unifyObjectStyle2.payload;

      var mutation = {
        type: type,
        payload: payload
      };
      each(this._mutations[type], function (_, wrappedMutationHandler) {
        wrappedMutationHandler(payload);
      });
      each(this._subscribers, function (_, sub) {
        sub(mutation, _this3.state);
      });
    }
  }, {
    key: "subscribe",
    value: function subscribe(fn) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      genericSubscribe(this._subscribers, fn, options);
    }
  }, {
    key: "subscribeAction",
    value: function subscribeAction(fn) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var sub = isFunction(fn) ? {
        before: fn
      } : fn;
      genericSubscribe(this._subscribers, sub, options);
    }
  }, {
    key: "registerModule",
    value: function registerModule(path, rawModule) {
      path = isString(path) ? [path] : path;

      this._modules.register(path, rawModule);

      var state = this.state;
      installModule(this, state, path, this._modules.get(path));
      resetStoreVM(this, state);
    }
  }]);

  return Store;
}();

var index = {
  Store: Store,
  install: install
};

export { index as default };
