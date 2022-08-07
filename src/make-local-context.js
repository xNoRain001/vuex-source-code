import getNestedState from "./get-nested-state"

const makeLocalContext = (store, path) => {
  const local = {
    commit: store.commit,
    dispatch: store.dispatch,
  }

  Object.defineProperties(local, {
    getters: {
      get () {
        return store.getters
      }
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