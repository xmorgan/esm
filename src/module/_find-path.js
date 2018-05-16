// Based on Node's `Module._findPath`.
// Copyright Node.js contributors. Released under MIT license:
// https://github.com/nodejs/node/blob/master/lib/internal/modules/cjs/loader.js

import { isAbsolute, resolve } from "../safe/path.js"

import CHAR_CODE from "../constant/char-code.js"
import ENV from "../constant/env.js"

import Module from "../module.js"
import SafeJSON from "../safe/json.js"

import binding from "../binding.js"
import keys from "../util/keys.js"
import readFileFast from "../fs/read-file-fast.js"
import realpath from "../fs/realpath.js"
import safeToString from "../util/safe-to-string.js"
import shared from "../shared.js"
import stat from "../fs/stat.js"

const {
  BACKWARD_SLASH,
  DOT,
  FORWARD_SLASH
} = CHAR_CODE

const {
  WIN32
} = ENV

const mainFieldRegExp = /"main"/
const { preserveSymlinks } = binding.config

function findPath(request, paths, isMain, searchExts) {
  if (isAbsolute(request)) {
    paths = [""]
  } else if (! paths || ! paths.length) {
    return ""
  }

  const cache = shared.memoize.moduleFindPath

  const cacheKey =
    request + "\0" +
    safeToString(paths) +
    (searchExts ? "\0" + safeToString(searchExts) : "")

  if (Reflect.has(cache, cacheKey)) {
    return cache[cacheKey]
  }

  let trailingSlash = request.length > 0

  if (trailingSlash) {
    let code = request.charCodeAt(request.length - 1)

    if (code === DOT) {
      code = request.charCodeAt(request.length - 2)

      if (code === DOT) {
        code = request.charCodeAt(request.length - 3)
      }
    }

    trailingSlash =
      code === FORWARD_SLASH ||
      (WIN32 &&
       code === BACKWARD_SLASH)
  }

  for (const curPath of paths) {
    if (curPath &&
        stat(curPath) !== 1) {
      continue
    }

    let filename
    const basePath = resolve(curPath, request)
    const rc = stat(basePath)
    const isFile = rc === 0
    const isDir = rc === 1

    if (! trailingSlash) {
      if (isFile) {
        if (preserveSymlinks &&
            ! isMain) {
          filename = resolve(basePath)
        } else {
          filename = realpath(basePath)
        }
      }

      if (! filename) {
        if (searchExts === void 0) {
          searchExts = keys(Module._extensions)
        }

        filename = tryExtensions(basePath, searchExts, isMain)
      }
    }

    if (isDir && ! filename) {
      if (searchExts === void 0) {
        searchExts = keys(Module._extensions)
      }

      filename =
        tryPackage(basePath, searchExts, isMain) ||
        tryExtensions(resolve(basePath, "index"), searchExts, isMain)
    }

    if (filename) {
      return cache[cacheKey] = filename
    }
  }

  return ""
}

function readPackage(thePath) {
  const cache = shared.memoize.moduleReadPackage

  if (Reflect.has(cache, thePath)) {
    return cache[thePath]
  }

  const jsonPath = resolve(thePath, "package.json")
  const json = readFileFast(jsonPath, "utf8")

  if (! json ||
      ! mainFieldRegExp.test(json)) {
    return ""
  }

  let main

  try {
    main = SafeJSON.parse(json).main
  } catch (e) {
    e.path = jsonPath
    e.message = "Error parsing " + jsonPath + ": " + safeToString(e.message)
    throw e
  }

  return typeof main === "string"
    ? cache[thePath] = main
    : ""
}

function tryExtensions(thePath, exts, isMain) {
  let filename = ""

  for (const ext of exts) {
    filename = tryFile(thePath + ext, isMain)

    if (filename) {
      return filename
    }
  }

  return filename
}

function tryFile(thePath, isMain) {
  if (stat(thePath)) {
    return false
  }

  if (preserveSymlinks &&
      ! isMain) {
    return resolve(thePath)
  }

  return realpath(thePath)
}

function tryPackage(thePath, exts, isMain) {
  const mainPath = readPackage(thePath)

  if (! mainPath) {
    return mainPath
  }

  const filename = resolve(thePath, mainPath)

  return tryFile(filename, isMain) ||
         tryExtensions(filename, exts, isMain) ||
         tryExtensions(resolve(filename, "index"), exts, isMain)
}

export default findPath
