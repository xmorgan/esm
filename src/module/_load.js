// Based on Node's `Module._load` method.
// Copyright Node.js contributors. Released under MIT license:
// https://github.com/nodejs/node/blob/master/lib/module.js

import Entry from "../entry.js"
import GenericArray from "../generic/array.js"
import Module from "../module.js"

import moduleState from "./state.js"
import shared from "../shared.js"

function load(request, parent, isMain, state, loader) {
  let child
  let filename
  let entry = request

  if (typeof request === "string") {
    filename = request
    child = state._cache[filename]

    if (child) {
      entry = Entry.get(child)
    }
  } else {
    child = entry.module
    filename = child.filename
  }

  if (child) {
    const children = parent && parent.children

    if (children &&
        GenericArray.indexOf(children, child) === -1) {
      GenericArray.push(children, child)
    }

    if (child.loaded ||
        moduleState.parsing) {
      return entry
    }

    if (! moduleState.parsing &&
        entry.state !== 2) {
      return entry
    }

    entry.state = 3
  } else {
    child = new Module(filename, parent)
    child.filename = filename

    if (isMain) {
      moduleState.mainModule =
      process.mainModule = child
      child.id = "."
    }

    entry = Entry.get(child)
    entry.id = filename
    entry.parent = Entry.get(parent)
    entry.state = moduleState.parsing ? 1 : 3
  }

  if (moduleState.passthru &&
      ! moduleState.parsing) {
    entry.state = 2
  } else {
    const { _compile } = child

    child._compile = (content, filename) => {
      delete child._compile

      const symbol = shared.symbol._compile
      const func = typeof child[symbol] === "function"
        ? child[symbol]
        : _compile

      return Reflect.apply(func, child, [content, filename])
    }
  }

  loader(entry)
  return entry
}

export default load
