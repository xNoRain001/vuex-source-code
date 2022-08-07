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

var isArray = function isArray(v) {
  return Array.isArray(v);
};

var isPlainObject = function isPlainObject(v) {
  return Object.prototype.toString.call(v).slice(8, -1) === 'Object';
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
};

var getNestedState = function getNestedState(rootState, path) {
  return path.reduce(function (state, key) {
    return state[key];
  }, rootState);
};

var makeLocalContext = function makeLocalContext(store, path) {
  var local = {
    commit: store.commit,
    dispatch: store.dispatch
  };
  Object.defineProperties(local, {
    getters: {
      get: function get() {
        return store.getters;
      }
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
  if (path.length !== 0) {
    var parentState = getNestedState(rootState, path.slice(0, -1));
    Vue.set(parentState, path[path.length - 1], module.state);
  }

  var local = module.context = makeLocalContext(store, path);
  var _module$_rawModule = module._rawModule,
      actions = _module$_rawModule.actions,
      mutations = _module$_rawModule.mutations,
      getters = _module$_rawModule.getters;

  if (actions) {
    each(actions, function (name, handler) {
      var entry = store._actions[name] = store._actions[name] || [];
      entry.push(function wrappedActionHandler(payload) {
        handler.call(store, local, payload);
      });
    });
  }

  if (mutations) {
    each(mutations, function (name, handler) {
      var entry = store._mutations[name] = store._mutations[name] || [];
      entry.push(function wrappedMutationHandler(payload) {
        handler.call(store, local.state, payload);
      });
    });
  }

  if (getters) {
    each(getters, function (name, handler) {
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
  } // 添加 module


  _createClass(Module, [{
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
    }
  }]);

  return ModuleCollection;
}();

var Store = /*#__PURE__*/function () {
  function Store() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Store);

    this._actions = Object.create(null);
    this._mutations = Object.create(null);
    this._wrappedGetters = Object.create(null);
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
    resetStoreVM(this, state); // console.log(this)
  }

  _createClass(Store, [{
    key: "state",
    get: function get() {
      return this._vm._data.$$state;
    }
  }, {
    key: "dispatch",
    value: function dispatch(type, payload) {
      each(this._actions[type], function (_, wrappedActionHandler) {
        wrappedActionHandler(payload);
      });
    }
  }, {
    key: "commit",
    value: function commit(type, payload) {
      each(this._mutations[type], function (_, wrappedMutationHandler) {
        wrappedMutationHandler(payload);
      });
    }
  }]);

  return Store;
}();

var index = {
  Store: Store,
  install: install
};

export { index as default };
