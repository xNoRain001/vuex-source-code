import resetStoreVM from "./reset-store-vm"
import installModule from "./install-module"
import unifyObjectStyle from "./unify-object-style"
import ModuleCollection from "./module/module-collection"
import { each, isString, isFunction } from "./utils"

class Store {
  constructor (options = {}) {
    this._committing = false
    this._subscribers = []
    this._actionSubscribes = []
    this._actions = Object.create(null)
    this._mutations = Object.create(null)
    this._wrappedGetters = Object.create(null)
    this._makeLocalGettersCache = Object.create(null)
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

    const { plugins, strict } = options
    this.strict = strict

    const { state } = this._modules.root
    
    installModule(this, state, [], this._modules.root)
    resetStoreVM(this, state)

    each(plugins, (_, plugin) => {
      plugin(this)
    })
  }

  get state () {
    return this._vm._data.$$state
  }

  dispatch (_type, _payload) {
    const {type, payload} = unifyObjectStyle(_type, _payload)
    const action = {
      type,
      payload
    }

    each(this._actionSubscribes.filter(sub => sub.before), (_, sub) => {
      sub.before(action, this.state)
    })
      
    const entry = this._actions[type]
    const result = entry.length > 1
      ? entry.map(wrappedActionHandler => wrappedActionHandler(payload))
      : entry[0](payload)

    return new Promise((resolve, reject) => {
      result.then(res => {
        each(this._actionSubscribes.filter(sub => sub.after), (_, sub) => {
          sub.after(action, this.state)
        })

        resolve(res)
      }, error => {
        each(this._actionSubscribes.filter(sub => sub.error), (_, sub) => {
          sub.error(action, this.state, error)
        })

        reject(error)
      })
    })
  }

  commit (_type, _payload) {
    const {type, payload} = unifyObjectStyle(_type, _payload)
    const mutation = {
      type,
      payload
    }

    this._withCommit(() => {
      each(this._mutations[type], (_, wrappedMutationHandler) => {
        wrappedMutationHandler(payload)
      })
    })

    each(this._subscribers, (_, sub) => {
      sub(mutation, this.state)
    })
  }

  replaceState (state) {
    this._witchCommit(() => {
      this._vm._data.$$state = state
    })
  }

  subscribe (fn, options = {}) {
    genericSubscribe(this._subscribers, fn, options)
  }

  subscribeAction (fn, options = {}) {
    const sub = isFunction(fn)
      ? { before: fn }
      : fn
    genericSubscribe(this._subscribers, sub, options)
  }

  registerModule (path, rawModule) {
    path = isString(path)
      ? [path]
      : path

    this._modules.register(path, rawModule)
    const { state } = this
    installModule(this, state, path, this._modules.get(path))
    resetStoreVM(this, state)
  }

  _withCommit (fn) {
    const { _committing } = this
    this._withCommitting = true
    fn()
    this._withCommitting = _committing
  }
}

export default Store