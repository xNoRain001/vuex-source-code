const isArray = v => Array.isArray(v)

const isPlainObject = v => Object.prototype.toString.call(v).slice(8, -1) === 'Object'

const each = (target, fn) => {
  if (isArray(target)) {
    for (let i = 0, l = keys.length; i < l; i++) {
      fn.call(target, i, target[i])
    }
  }
  else if (isPlainObject(target)) {
    const keys = Object.keys(target)

    for (let i = 0, l = keys.length; i < l; i++) {
      const key = keys[i]
      fn.call(target, key, target[key])
    }
  }
}

export {
  each
}