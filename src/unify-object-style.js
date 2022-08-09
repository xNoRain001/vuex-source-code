import { isPlainObject } from './utils'

const unifyObjectStyle = (type, payload, options) => {
  if (isPlainObject(type) && type.type) {
    options = payload
    payload = type
    type = type.type
  }

  return {
    type,
    payload,
    options
  }
}

export default unifyObjectStyle