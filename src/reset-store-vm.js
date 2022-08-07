import { Vue } from "./install"
import { each } from "./utils"

const resetStoreVM = (store, state) => {
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
}

export default resetStoreVM