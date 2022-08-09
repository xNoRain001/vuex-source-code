const enableStrictMode = store => {
  store._vm.$watch(function () {
    return this._data.$$state
  }, () => {
    console.assert(store._committing, 'error')
  }, { deep: true, sync: true })
}

export default enableStrictMode