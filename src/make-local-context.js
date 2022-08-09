import getNestedState from "./get-nested-state"
import makeLocalGetters from "./make-local-getters"
import unifyObjectStyle from "./unify-object-style"

const makeLocalContext = (store, namespace, path) => {
  const local = {
    commit: !namespace ? store.commit : function (_type, _payload, _options) {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || options.root) {
        type = namespace + type
      }

      store.commit(type, payload)
    },

    dispatch: !namespace ? store.dispatch : function (_type, _payload, _options) {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      let { type } = args

      if (!options || options.root) {
        type = namespace + type
      }

      store.dispatch(type, payload)
    }
  }

  Object.defineProperties(local, {
    getters: {
      get: namespace 
        ? () => { return store.getters }
        : makeLocalGetters(store, namespace)
    },

    state: {
      get () {
        return getNestedState(store.state, path)
      }
    }
  })

  return local
}

export default makeLocalContext