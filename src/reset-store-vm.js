import enableStrictMode from "./enable-strict-mode"
import { Vue } from "./install"
import { each } from "./utils"

const resetStoreVM = (store, state) => {
  const oldVm = store._vm
  const computed = Object.create(null)
  store.getters = Object.create(null)

  each(store._wrappedGetters, (name, wrappedGetter) => {
    computed[name] = wrappedGetter

    Object.defineProperty(store.getters, name, {
      get () {
        return store._vm[name]
      },
      enumerable: true
    })
  })

  store._vm = new Vue({
    data () {
      return {
        $$state: state
      }
    },
    computed
  })

  if (store.strict) {
    enableStrictMode(store)
  }

  if (oldVm) {
    Vue.nextTick(() => oldVm.$destory())
  }
}

export default resetStoreVM