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

var getNestedState = function getNestedState(rootState, path) {
  return path.reduce(function (state, key) {
    return state[key];
  }, rootState);
};

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
      fn.call(target, i, target[i]);
    }
  } else if (isPlainObject(target)) {
    var keys = Object.keys(target);

    for (var _i = 0, _l = keys.length; _i < _l; _i++) {
      var key = keys[_i];
      fn.call(target, key, target[key]);
    }
  }
};

var installModule = function installModule(store, rootState, path, module) {
  if (path.length !== 0) {
    var parentState = getNestedState(rootState, path.slice(0, -1));
    Vue.set(parentState, path[path.length - 1], module.state);
  }

  var _module$_rawModule = module._rawModule,
      actions = _module$_rawModule.actions,
      mutations = _module$_rawModule.mutations,
      getters = _module$_rawModule.getters;

  if (actions) {
    each(actions, function (name, handler) {
      (store._actions[name] = store._actions[name] || []).push(handler);
    });
  }

  if (mutations) {
    each(mutations, function (name, handler) {
      (store._mutations[name] = store._mutations[name] || []).push(handler);
    });
  }

  if (getters) {
    each(getters, function (name, handler) {
      store._wrappedGetters[name] = handler;
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

var Store = /*#__PURE__*/_createClass(function Store() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  _classCallCheck(this, Store);

  this._actions = Object.create(null);
  this._mutations = Object.create(null);
  this._wrappedGetters = Object.create(null);
  this._modules = new ModuleCollection(options);
  installModule(this, this._modules.root.state, [], this._modules.root);
  console.log(this);
});

var index = {
  Store: Store,
  install: install
};

export { index as default };
