import assert from "assert"
import mockIo from "mock-stdio"
import console1, { log } from "console"
import * as console2 from "console"
import def1, { d } from "../../fixture/export/def.js"
import * as def2 from "../../fixture/export/def.js"
import path1, { join } from "path"
import * as path2 from "path"
import process1, { cwd } from "process"
import * as process2 from "process"
import regexp1, { test } from "../../fixture/cjs/export/regexp.js"
import * as regexp2 from "../../fixture/cjs/export/regexp.js"

const console3 = require("console")
const def3 = require("../../fixture/export/def.js")
const path3 = require("path")
const process3 = require("process")
const regexp3 = require("../../fixture/cjs/export/regexp.js")

function funcToString(func) {
  return Function.prototype.toString.call(func)
}

function getTagFromString(object) {
  return Object.prototype.toString.call(object).slice(8, -1)
}

function getTagFromSymbol(object) {
  return object[Symbol.toStringTag]
}

export default () => {
  let objects = [console1, console2, console3]
  let oldValue = console1.log

  console1.log = 1
  let updated = [console1.log, console2.log, console3.log, log]

  console1.log = oldValue
  let reverted = [console1.log, console2.log, console3.log]

  mockIo.start()
  console1.log(1)
  console2.log(1)
  console3.log(1)
  log(1)

  assert.strictEqual(mockIo.end().stdout, "1\n1\n1\n1\n")
  assert.strictEqual(funcToString(log), funcToString(console.log))

  assert.deepStrictEqual(updated, [1, 1, 1, 1])
  assert.deepStrictEqual(reverted, Array(3).fill(log))
  assert.strictEqual(console1, console3)

  assert.deepStrictEqual(objects.map(getTagFromString), ["Object", "Module", "Object"])
  assert.deepStrictEqual(objects.map(getTagFromSymbol), [void 0, "Module", void 0])

  objects = [def1, def2, def3]
  oldValue = def1.d

  def1.d = 1
  updated = [def1.d, def2.d, def3.d, d]

  def1.d = oldValue
  reverted = [def1.d, def2.d, def3.d]

  assert.deepStrictEqual(updated, [1, 1, 1, 1])
  assert.deepStrictEqual(reverted, Array(3).fill(d))
  assert.notStrictEqual(def1, def3)

  assert.deepStrictEqual(objects.map(getTagFromString), ["Object", "Module", "Object"])
  assert.deepStrictEqual(objects.map(getTagFromSymbol), [void 0, "Module", void 0])

  objects = [path1, path2, path3]
  oldValue = path1.join

  path1.join = 1
  updated = [path1.join, path2.join, path3.join, join]

  path1.join = oldValue
  reverted = [path1.join, path2.join, path3.join]

  assert.deepStrictEqual(updated, [1, 1, 1, 1])
  assert.deepStrictEqual(reverted, Array(3).fill(join))
  assert.strictEqual(path1, path3)

  assert.deepStrictEqual(objects.map(getTagFromString), ["Object", "Module", "Object"])
  assert.deepStrictEqual(objects.map(getTagFromSymbol), [void 0, "Module", void 0])

  objects = [process1, process2, process3]
  oldValue = process1.cwd

  process1.cwd = 1
  updated = [process1.cwd, process2.cwd, process3.cwd, cwd]

  process1.cwd = oldValue
  reverted = [process1.cwd, process2.cwd, process3.cwd]

  assert.strictEqual(cwd(), process1.cwd())
  assert.strictEqual(process2.cwd(), process1.cwd())
  assert.strictEqual(process3.cwd(), process1.cwd())
  assert.strictEqual(funcToString(cwd), funcToString(process.cwd))

  assert.deepStrictEqual(updated, [1, 1, 1, 1])
  assert.deepStrictEqual(reverted, Array(3).fill(cwd))
  assert.strictEqual(process1, process3)

  assert.deepStrictEqual(objects.map(getTagFromString), ["process", "Module", "process"])
  assert.deepStrictEqual(objects.map(getTagFromSymbol), ["process", "Module", "process"])

  objects = [regexp1, regexp2, regexp3]
  oldValue = regexp1.test

  regexp1.test = 1
  updated = [regexp1.test, regexp2.test, regexp3.test, test]

  regexp1.test = oldValue

  assert.strictEqual(test.name, "test")
  assert.strictEqual(test.length, 1)
  assert.strictEqual(String(test), String(RegExp.prototype.test))
  assert.ok(test.call(/b/, "b"))

  assert.deepStrictEqual(updated, [1, 1, 1, 1])
  assert.deepStrictEqual([regexp2.test, regexp3.test], [test, test])

  assert.notStrictEqual(regexp1.test, test)
  assert.notStrictEqual(regexp1, regexp3)

  assert.deepStrictEqual(objects.map(getTagFromString), ["RegExp", "Module", "RegExp"])
  assert.deepStrictEqual(objects.map(getTagFromSymbol), ["RegExp", "Module", void 0])
}
