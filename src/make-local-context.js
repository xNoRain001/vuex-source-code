import getNestedState from "./get-nested-state"
import makeLocalGetters from "./make-local-getters"

const makeLocalContext = (store, namespace, path) => {
  const local = {
    commit: !namespace ? store.commit : function (type, payload) {
      type = namespace + type
      store.commit(type, payload)
    },

    dispatch: !namespace ? store.dispatch : function (type, payload) {
      type = namespace + type
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