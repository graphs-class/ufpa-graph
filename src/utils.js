import JSZip from 'jszip'
import {parseString, Parser} from 'xml2js'
import promisify from 'pify'
import camelCase from 'camel-case'
import lazy from 'imlazy'

const xmlParser = new Parser({
  explicitRoot: false,
  tagNameProcessors: [camelCase],
  attrNameProcessors: [camelCase],
})

export async function extractLattes(file) {
  const zip = await JSZip.loadAsync(file)
  const lattes = zip.files['curriculo.xml']
  return Array.from( // fuck ISO-8859-1
    lazy.map(String.fromCharCode, await lattes.async('array'))
  ).join('')
}

export async function parseXml(xml) {
  return await promisify(xmlParser.parseString)(xml)
}

export function sameSet (A, B) {
  return contains(A, B) && contains(B, A)
}

export function contains (A, B) {
  return Array.from(B.values()).every(v => A.has(v))
}

export function buildEdgeId({id: idA}, {id: idB}) {
  if (idA > idB) {
    return `edge:${idA}:${idB}`
  }
  return `edge:${idB}:${idA}`
}
