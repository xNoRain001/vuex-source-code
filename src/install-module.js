import getNestedState from "./get-nested-state"
import makeLocalContext from "./make-local-context"
import { Vue } from "./install"
import { each } from "./utils"

const installModule = (store, rootState, path, module) => {
  if (path.length !== 0) {
    const parentState = getNestedState(rootState, path.slice(0, -1))
    Vue.set(parentState, path[path.length - 1], module.state)
  }

  const local = module.context = makeLocalContext(store, path)
  const { actions, mutations, getters } = module._rawModule

  if (actions) {
    each(actions, (name, handler) => {
      const entry = store._actions[name] = (store._actions[name] || [])
      entry.push(function wrappedActionHandler (payload) {
        handler.call(store, local, payload)
      })
    })
  }

  if (mutations) {
    each(mutations, (name, handler) => {
      const entry = store._mutations[name] = (store._mutations[name] || [])
      entry.push(function wrappedMutationHandler (payload) {
        handler.call(store, local.state, payload)
      })
    })
  }

  if (getters) {
    each(getters, (name, handler) => {
      store._wrappedGetters[name] = function wrappedGetter () {
        return handler(
          local.getters,
          local.state,
          store.getters,
          store.state
        )
      }
    })
  }
  
  const { _children } = module
  
  if (_children) {
    each(_children, (name, module) => {
      installModule(store, rootState, path.concat(name), module)
    })
  }
}

export default installModule