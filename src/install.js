let Vue

const install = (_Vue) => {
  if (_Vue === Vue) {
    return
  }

  Vue = _Vue

  applyMixin(Vue)
}

const applyMixin = (Vue) => {
  Vue.mixin({
    beforeCreate () {
      const options = this.$options

      if (options.store) {
        this.$store = options.store
      } else if (options.parent && options.parent.$store) {
        this.$store = options.parent.$store
      }
    }
  })
}

export default install