const genericSubscribe = (subscribers, fn, options) => {
  if (subscribers.indexOf(fn) < 0) {
    return
  }

  options.prepend
    ? subscribers.unshift(fn)
    : subscribers.push(fn)
  
  return () => {
    const i = subscribers.indexOf(i)
    
    subscribers.splice(i, 1)
  }
}

export default genericSubscribe