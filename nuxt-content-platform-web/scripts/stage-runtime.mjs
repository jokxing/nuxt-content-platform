import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Stage output outside the repository without following Nitro's cyclic dependency links.
const source = fileURLToPath(new URL('../.output', import.meta.url))
const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'contentpulse-runtime-'))
const links = []
function copy(from, to) {
  const stat = fs.lstatSync(from)
  if (stat.isSymbolicLink()) {
    const target = fs.realpathSync(from)
    const relative = path.relative(source, target)
    if (relative.startsWith('..') || path.isAbsolute(relative))
      throw new Error('Build output links outside its deployment directory')
    links.push({ to, target: path.join(destination, relative), directory: fs.statSync(from).isDirectory() })
  }
  else if (stat.isDirectory()) {
    fs.mkdirSync(to, { recursive: true })
    for (const name of fs.readdirSync(from)) copy(path.join(from, name), path.join(to, name))
  }
  else {
    fs.copyFileSync(from, to)
  }
}
copy(source, destination)
for (const link of links) fs.symlinkSync(link.target, link.to, link.directory ? 'junction' : 'file')
console.log(JSON.stringify({ destination, internalLinks: links.length }))
