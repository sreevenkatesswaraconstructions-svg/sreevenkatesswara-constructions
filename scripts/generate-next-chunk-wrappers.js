const fs = require('fs')
const path = require('path')

const serverDir = path.join(__dirname, '..', '.next', 'server')
const chunksDir = path.join(serverDir, 'chunks')

if (!fs.existsSync(serverDir)){
  console.error('.next/server not found. Run build or dev once first.')
  process.exit(1)
}
if (!fs.existsSync(chunksDir)){
  console.error('.next/server/chunks not found. Nothing to do.')
  process.exit(0)
}

const files = fs.readdirSync(chunksDir).filter(f=>f.endsWith('.js'))
files.forEach(f=>{
  const wrapperPath = path.join(serverDir, f)
  const targetRel = './chunks/' + f
  const content = `module.exports = require('${targetRel}')\n`
  try{
    fs.writeFileSync(wrapperPath, content, { encoding: 'utf8' })
  }catch(err){
    console.error('Failed to write', wrapperPath, err.message)
  }
})

