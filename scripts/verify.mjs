import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { root, manifest, verifyPackage } from './common.mjs'

const result = verifyPackage()
const plan = JSON.parse(fs.readFileSync(path.join(root, 'patches/dependency-locales.json'), 'utf8'))
assert.equal(plan.files.length, 30)
assert.equal(new Set(plan.files.map(f => f.package)).size, 7)
for (const record of plan.files) {
  assert.match(record.beforeSha256, /^[a-f0-9]{64}$/)
  assert.match(record.afterSha256, /^[a-f0-9]{64}$/)
  assert(record.edits.length > 0)
  for (const edit of record.edits) {
    assert(Number.isInteger(edit.start) && edit.start >= 0 && edit.end >= edit.start)
    assert.equal(typeof edit.before, 'string')
    assert.equal(typeof edit.after, 'string')
  }
}
console.log(JSON.stringify({ ok: true, ...result, upstreamCommit: manifest.upstreamCommit, dependencyFiles: plan.files.length }))
