import resetStoreVM from "./reset-store-vm"
import installModule from "./install-module"
import ModuleCollection from "./module/module-collection"
import { each } from "./utils"

class Store {
  constructor (options = {}) {
    this._actions = Object.create(null)
    this._mutations = Object.create(null)
    this._wrappedGetters = Object.create(null)
    this._modules = new ModuleCollection(options)

    const store = this
    const { commit, dispatch } = this

    this.dispatch = function boundDispatch (type, payload) {
      dispatch.call(store, type, payload)
    }

    this.commit = function boundCommit (type, payload) {
      // store.commit() => this 是 store
      // context.commit() => this 是 context，即 local
      // foo ({ commit }) { commit('bar') } => this 是 undefined
      commit.call(store, type, payload)
    }

    const { state } = this._modules.root
    
    installModule(this, state, [], this._modules.root)

    resetStoreVM(this, state)

    

    // console.log(this)
  }

  get state () {
    return this._vm._data.$$state
  }

  dispatch (type, payload) {
    each(this._actions[type], (_, wrappedActionHandler) => {
      wrappedActionHandler(payload)
    })
  }

  commit (type, payload) {
    each(this._mutations[type], (_, wrappedMutationHandler) => {
      wrappedMutationHandler(payload)
    })
  }
}

export default Store