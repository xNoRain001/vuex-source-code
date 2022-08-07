import { Vue } from "./install"
import { each } from "./utils"

const resetStoreVM = (store, state) => {
  const computed = Object.create(null)

  each(store._wrappedGetters, (name, handler) => {
    computed[name] = handler

    Object.defineProperty(store, name, {
      get () {
        return store._vm[name]
      }
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