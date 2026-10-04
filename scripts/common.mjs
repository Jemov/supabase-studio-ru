import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const root = path.resolve(import.meta.dirname, '..')
export const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'))
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
export function inside(parent, relative) {
  const target = path.resolve(parent, relative)
  const rel = path.relative(parent, target)
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`Path escapes root: ${relative}`)
  }
  return target
}
export function verifyPackage() {
  for (const [relative, expected] of Object.entries(manifest.files)) {
    if (sha256(fs.readFileSync(inside(root, relative))) !== expected) {
      throw new Error(`Published file checksum differs: ${relative}`)
    }
  }
  const patch = fs.readFileSync(inside(root, manifest.patch))
  const sourceHash = crypto.createHash('sha256').update(manifest.upstreamCommit).update('\0').update(patch).digest('hex')
  if (sourceHash !== manifest.sourceHash) throw new Error('Translation source hash differs')
  return { sourceHash, files: Object.keys(manifest.files).length }
}
