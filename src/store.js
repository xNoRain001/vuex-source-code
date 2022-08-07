import installModule from "./installModule"
import ModuleCollection from "./module/module-collection"

class Store {
  constructor (options = {}) {
    this._actions = Object.create(null)
    this._mutations = Object.create(null)
    this._wrappedGetters = Object.create(null)

    this._modules = new ModuleCollection(options)
    installModule(this, this._modules.root.state, [], this._modules.root)

    console.log(this)
  }
}

export default Store