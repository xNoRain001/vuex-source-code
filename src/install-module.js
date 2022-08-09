import getNestedState from "./get-nested-state"
import makeLocalContext from "./make-local-context"
import { Vue } from "./install"
import { each, isPromise, isPlainObject } from "./utils"

const installModule = (store, rootState, path, module) => {
  // 每次都从根模块找到
  const namespace = store._modules.getNameSpace(path)

  if (path.length !== 0) {
    const parentState = getNestedState(rootState, path.slice(0, -1))
    store._withCommit(() => {
      Vue.set(parentState, path[path.length - 1], module.state)
    })
  }

  const local = module.context = makeLocalContext(store, namespace, path)
  const { actions, mutations, getters } = module._rawModule

  if (actions) {
    each(actions, (name, handler) => {
      name = handler.root ? name : namespace + name
      handler = handler.handler || handler
      const entry = store._actions[name] = (store._actions[name] || [])
      entry.push(function wrappedActionHandler (payload) {
        let res = handler.call(store, local, payload)

        if (!isPromise(res)) {
          res = Promise.resolve(res)
        }

        return res
      })
    })
  }

  if (mutations) {
    each(mutations, (name, handler) => {
      name = namespace + name
      const entry = store._mutations[name] = (store._mutations[name] || [])
      entry.push(function wrappedMutationHandler (payload) {
        handler.call(store, local.state, payload)
      })
    })
  }

  if (getters) {
    each(getters, (name, handler) => {
      name = namespace + name
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