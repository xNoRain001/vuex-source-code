const getNestedState = (rootState, path) => {
  return path.reduce((state, key) => {
    return state[key]
  }, rootState)
}

export default getNestedState