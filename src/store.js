import resetStoreVM from "./resetStoreVM"
import installModule from "./installModule"
import ModuleCollection from "./module/module-collection"

class Store {
  constructor (options = {}) {
    this._actions = Object.create(null)
    this._mutations = Object.create(null)
    this._wrappedGetters = Object.create(null)
    this._modules = new ModuleCollection(options)

    const { state } = this._modules.root
    
    installModule(this, state, [], this._modules.root)

    resetStoreVM(this, state)

    console.log(this)
  }
}

export default Store