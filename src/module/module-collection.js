import Module from "./module"
import { each } from "../utils"

class ModuleCollection {
  constructor (options) {
    this.register([], options)
  }

  register (path, rawModule) {
    const newModule = new Module(rawModule)

    if (path.length === 0) {
      this.root = newModule
    } else {
      const parent = this.get(path.slice(0, -1))
      parent.addChild(path[path.length - 1], newModule)
    }

    const { modules } = rawModule

    if (modules) {
      each(modules, (name, childRawModule) => {
        this.register(path.concat(name), childRawModule)
      })
    }
  }

  // 根据 path 获取 module
  get (path) {
    return path.reduce((module, name) => {
      return module.getChild(name)
    }, this.root)
  }
}

export default ModuleCollection