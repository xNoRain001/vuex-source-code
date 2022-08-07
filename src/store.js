import ModuleCollection from "./module/module-collection"

class Store {
  constructor (options = {}) {
    this._modules = new ModuleCollection(options)
    console.log(this._modules)
  }
}

export default Store