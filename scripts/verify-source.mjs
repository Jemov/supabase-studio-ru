import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { root, manifest, verifyPackage, sha256 } from './common.mjs'

verifyPackage()
const source = path.resolve(process.argv[2] ?? path.join(root, 'upstream'))
const git = args => execFileSync('git', ['-c', 'core.autocrlf=false', '-c', 'core.abbrev=7', '-C', source, ...args], { maxBuffer: 32 * 1024 * 1024 })
if (git(['rev-parse', 'HEAD']).toString().trim() !== manifest.upstreamCommit) throw new Error('Upstream commit differs')
if (git(['diff', '--name-only']).length) throw new Error('Source has additional unstaged modifications')
if (git(['ls-files', '--others', '--exclude-standard']).length) throw new Error('Source has untracked files')
const diff = git(['diff', '--cached', '--binary', '--no-ext-diff', '--no-textconv', 'HEAD'])
if (sha256(diff) !== manifest.files[manifest.patch]) throw new Error('Source index differs from the published full translation patch')
console.log(JSON.stringify({ ok: true, sourceCommit: manifest.upstreamCommit, sourceHash: manifest.sourceHash, patchBytes: diff.length }))
