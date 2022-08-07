import { each } from "./utils"

const makeLocalGetters = (store, namespace) => {
  const { _makeLocalGettersCache } = store

  if (_makeLocalGettersCache[namespace]) {
    const length = namespace.length
    const proxyGetter = Object.create(null)

    each(store.getters, name => {
      if (name.slice(0, length) !== namespace) {
        return
      }

      
      const userDef = name.slice(namespace)

      Object.defineProperty(proxyGetter, userDef, {
        get () {
          store.getters[name]
        }
      })
    })

    _makeLocalGettersCache[namespace] = proxyGetter
  }

  return _makeLocalGettersCache[namespace]
}

export default makeLocalGetters