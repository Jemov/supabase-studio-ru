import fs from 'node:fs'
import path from 'node:path'
import { root, manifest, sha256, inside, verifyPackage } from './common.mjs'

verifyPackage()
const app = path.resolve(process.argv[2] ?? path.join(root, 'build/app'))
const store = path.join(app, 'node_modules/.pnpm')
const plan = JSON.parse(fs.readFileSync(path.join(root, 'patches/dependency-locales.json'), 'utf8'))
const packageRoots = new Map()
for (const pkg of plan.packages) {
  const prefix = `${pkg.name.replaceAll('/', '+')}@${pkg.version}`
  const candidates = fs.readdirSync(store).filter(name => name === prefix || name.startsWith(prefix + '_'))
  const matches = candidates.map(name => path.join(store, name, 'node_modules', pkg.name)).filter(dir => {
    if (!fs.existsSync(path.join(dir, 'package.json'))) return false
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    return meta.name === pkg.name && meta.version === pkg.version
  })
  if (matches.length !== 1) throw new Error(`Expected one pinned package: ${pkg.name}@${pkg.version}; found ${matches.length}`)
  packageRoots.set(pkg.name, matches[0])
}
// Verify every preimage and output before changing any dependency file.
const pending = []
for (const record of plan.files) {
  const file = inside(packageRoots.get(record.package), record.file)
  const before = fs.readFileSync(file, 'utf8')
  const digest = sha256(before)
  if (digest === record.afterSha256) continue
  if (digest !== record.beforeSha256) throw new Error(`Unexpected dependency checksum: ${record.package}/${record.file}`)
  let after = before
  let previousStart = before.length + 1
  for (const edit of [...record.edits].sort((a, b) => b.start - a.start)) {
    if (edit.end > previousStart || before.slice(edit.start, edit.end) !== edit.before) throw new Error('Overlapping or changed dependency edit')
    after = after.slice(0, edit.start) + edit.after + after.slice(edit.end)
    previousStart = edit.start
  }
  if (sha256(after) !== record.afterSha256) throw new Error('Translated dependency checksum differs')
  pending.push({ file, after })
}
const amd = path.join(app, 'apps/studio/public/monaco-editor/vs/nls.messages.ru.js')
if (sha256(fs.readFileSync(amd)) !== manifest.monacoAmdSha256) throw new Error('Full Monaco AMD Russian asset is missing or changed')
for (const { file, after } of pending) {
  // Replace instead of editing a possible pnpm store hard link in place.
  const temporary = `${file}.studio-ru.part`
  fs.writeFileSync(temporary, after)
  fs.renameSync(temporary, file)
}
console.log(JSON.stringify({ ok: true, inspectedFiles: plan.files.length, translatedFiles: pending.length, packages: plan.packages.length }))
