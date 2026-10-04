import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { root, manifest, verifyPackage } from './common.mjs'

verifyPackage()
const destination = path.resolve(process.argv[2] ?? path.join(root, 'upstream'))
if (fs.existsSync(destination)) throw new Error('Destination already exists; use a new empty path')
fs.mkdirSync(destination, { recursive: true })
const git = args => execFileSync('git', ['-c', 'core.autocrlf=false', '-C', destination, ...args], { stdio: 'inherit' })
git(['init'])
git(['remote', 'add', 'origin', manifest.upstreamRepository])
git(['fetch', '--depth', '1', 'origin', manifest.upstreamCommit])
git(['checkout', '--detach', 'FETCH_HEAD'])
const patch = path.join(root, manifest.patch)
git(['apply', '--check', '--index', patch])
git(['apply', '--index', patch])
execFileSync(process.execPath, [path.join(root, 'scripts/verify-source.mjs'), destination], { stdio: 'inherit' })
