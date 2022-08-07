class Module {
  constructor (rawModule) {
    this._children = []
    this._rawModule = rawModule
    this.state = rawModule.state
  }

  // 添加 module
  addChild (name, module) {
    this._children[name] = module
  }

  // 获取 module
  getChild (name) {
    return this._children[name]
  }
}

export default Module