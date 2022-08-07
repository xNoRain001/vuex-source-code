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

var Module = /*#__PURE__*/function () {
  function Module(rawModule) {
    _classCallCheck(this, Module);

    this._children = [];
    this._rawModule = rawModule;
    this.state = rawModule.state;
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

var isArray = function isArray(v) {
  return Array.isArray(v);
};

var isPlainObject = function isPlainObject(v) {
  return Object.prototype.toString.call(v).slice(8, -1) === 'Object';
};

var each = function each(target, fn) {
  if (isArray(target)) {
    for (var i = 0, l = keys.length; i < l; i++) {
      fn.call(target, i, target[i]);
    }
  } else if (isPlainObject(target)) {
    var _keys = Object.keys(target);

    for (var _i = 0, _l = _keys.length; _i < _l; _i++) {
      var key = _keys[_i];
      fn.call(target, key, target[key]);
    }
  }
};

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

  this._modules = new ModuleCollection(options);
  console.log(this._modules);
});

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

var index = {
  Store: Store,
  install: install
};

export { index as default };
