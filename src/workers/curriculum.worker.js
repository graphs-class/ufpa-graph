import lazy from 'imlazy'
import {DataSet} from 'vis'
import titleCase from 'title-case'

import * as utils from './../utils'
import * as store from './../store'
import graphsConfig from '../graphs.config.js'
const {colors} = graphsConfig

const config = {
  ppgccOnly: true,
  face: 0,
}

const FIRST_FACE = 0
const LAST_FACE = 2

let nodes = new DataSet()
let edges = new DataSet()
let uniqueRelations = new Set()

const ppgcc = [
  'Aldebaro Barreto da Rocha Klautau Júnior',
  'Antonio Jorge Gomes Abelém',
  'Antonio Morais da Silveira',
  'Bianchi Serique Meiguins',
  'Carlos Gustavo Resque dos Santos',
  'Carlos Renato Lisboa Francês',
  'Claudomiro de Souza de Sales Junior',
  'Cleidson Ronald Botelho de Souza',
  'Denis Lima do Rosário',
  'Eduardo Coelho Cerqueira',
  'Eloi Luiz Favero',
  'Filipe de Oliveira Saraiva',
  'Gustavo Henrique Lima Pinto',
  'Jefferson Magalhães de Morais',
  'Joao Crisóstomo Weyl Albuquerque Costa',
  'Josivaldo de Souza Araújo',
  'Marcelle Pereira Mota',
  'Nelson Cruz Sampaio Neto',
  'Rommel Thiago Juca Ramos',
  'Sandro Ronaldo Bezerra Oliveira',
]

onmessage = async function onMessage(e) {
  const data = JSON.parse(e.data)
  const {type} = data

  const handler = ({
    parseXml: () => parseXml(data.xml),
    setFace: () => setFace(data.face),
    renderFace: renderFace,
  })[type]

  handler()
}

async function parseXml(xml) {
  const parsed = await utils.parseXml(xml)

  consumeLattes(parsed)

  if (config.face === 1) {
    secondFace()
  }

  send({
    type: 'updateStore',
    data: store.data()
  })
}

export function consumeLattes(curriculum) {
  for (let [type, [items]] of Object.entries(curriculum.producaoBibliografica[0])) {
    switch (type) {
      case 'artigosPublicados':
        consumePublishedArticles(items)
        break

      case 'livrosECapitulos':
        consumeBooksAndChapters(items)
        break

      case 'trabalhosEmEventos':
        consumeEventWorks(items)
        break

      case 'demaisTiposDeProducaoBibliografica':
        consumeBooksAndChapters(
          Object.entries(items)
            .reduce((acc, [key, val]) => {
              console.log({key, val});
              if (['prefacioPosfacio', 'outraProducaoBibliografica'].includes(key)) {
                acc[key] = [
                  {[key]: val}
                ]
              } else {
                acc[key] = val
              }
              return acc
            }, {})
        )
        break

      case 'artigosAceitosParaPublicacao':
        consumeBooksAndChapters(
          Object.entries(items)
            .reduce((acc, [key, val]) => {
              console.log({key, val});
              if (key === 'artigoAceitoParaPublicacao') {
                acc[key] = [
                  {[key]: val}
                ]
              } else {
                acc[key] = val
              }
              return acc
            }, {})
        )
        break

      default:
        console.log('misses', {type})
    }
  }
}

function consumePublishedArticles({artigoPublicado: articles}) {
  for (let article of articles) {
    const details = article.dadosBasicosDoArtigo[0].$

    const production = store.addProduction({
      id: details.doi,
      type: 'artigoPublicado',
      title: details.tituloDoArtigo,
      year: details.anoDoArtigo,
    })

    const authors = article.autores.map(({$: author}) =>
      store.addPerson({
        id: author.nomeCompletoDoAutor,
        name: author.nomeCompletoDoAutor,
        cnpqId: author.nroIdCnpq,
        isPpgcc: ppgcc.includes(author.nomeCompletoDoAutor),
      })
    )

    for (let author of authors) {
      production.authors[author.id] = 1
      author.productions[production.id] = 1
    }
  }
}

function consumeBooksAndChapters(node) {
  for (let [outerContainer] of Object.values(node)) {
    const [type, items] = Object.entries(outerContainer).pop()

    const getters = ({
      livroPublicadoOuOrganizado: {
        id: item => item.detalhamentoDoLivro[0].$.isbn,
        title: item => item.dadosBasicosDoLivro[0].$.tituloDoLivro,
        year: item => item.dadosBasicosDoLivro[0].$.ano,
      },

      capituloDeLivroPublicado: {
        id: item => item.dadosBasicosDoCapitulo[0].$.doi,
        title: item => item.dadosBasicosDoCapitulo[0].$.tituloDoCapituloDoLivro,
        year: item => item.dadosBasicosDoCapitulo[0].$.ano,
      },

      prefacioPosfacio: {
        id: item => {
          const basic = item.dadosBasicosDoPrefacioPosfacio[0].$
          const details = item.detalhamentoDoPrefacioPosfacio[0].$
          return details.issnIsbn || (basic.tipo + ' ' + details.tituloDaPublicacao)
        },
        title: item => item.detalhamentoDoPrefacioPosfacio[0].$.tituloDaPublicacao,
        year: item => item.dadosBasicosDoPrefacioPosfacio[0].$.ano,
      },

      artigoAceitoParaPublicacao: {
        id: item => item.detalhamentoDoArtigo[0].$.issn,
        title: item => item.dadosBasicosDoArtigo[0].$.tituloDoArtigo,
        year: item => item.dadosBasicosDoArtigo[0].$.ano,
      },

      outraProducaoBibliografica: {
        id: item => {
          const basic = item.dadosBasicosDeOutraProducao[0].$
          return basic.doi || basic.titulo
        },
        title: item => item.dadosBasicosDeOutraProducao[0].$.titulo,
        year: item => item.dadosBasicosDeOutraProducao[0].$.ano,
      },
    })[type]

    console.log('getters', type, !!getters);

    for (let item of items) {
      const production = store.addProduction({
        id: getters.id(item),
        type,
        title: getters.title(item),
        year: getters.year(item),
      })

      const authors = item.autores.map(({$: author}) =>
        store.addPerson({
          id: author.nomeCompletoDoAutor,
          name: author.nomeCompletoDoAutor,
          cnpqId: author.nroIdCnpq,
          isPpgcc: ppgcc.includes(author.nomeCompletoDoAutor),
        })
      )

      for (let author of authors) {
        production.authors[author.id] = 1
        author.productions[production.id] = 1
      }
    }
  }
}

function consumeEventWorks({trabalhoEmEventos: works}) {
  for (let work of works) {
    const basic = work.dadosBasicosDoTrabalho[0].$
    const details = work.detalhamentoDoTrabalho[0].$

    const production = store.addProduction({
      id: details.isbn || basic.tituloDoTrabalho,
      type: 'trabalhoEmEventos',
      title: basic.tituloDoTrabalho,
      year: basic.anoDoTrabalho,
    })

    const authors = work.autores.map(({$: author}) =>
      store.addPerson({
        id: author.nomeCompletoDoAutor,
        name: author.nomeCompletoDoAutor,
        cnpqId: author.nroIdCnpq,
        isPpgcc: ppgcc.includes(author.nomeCompletoDoAutor),
      })
    )

    for (let author of authors) {
      production.authors[author.id] = 1
      author.productions[production.id] = 1
    }
  }
}

export function setFace(n) {
  const face = Math.max(FIRST_FACE, Math.min(LAST_FACE, n))

  if (face !== config.face) {
    send({ type: 'clearNetwork' })
    clearNetwork()
  }

  config.face = face
  send({ type: 'redrawNetwork' })
}

function renderFace() {
  const handler = ({
    0: firstFace,
    1: secondFace,
    2: thirdFace,
  })[config.face]

  handler()
}

function firstFace() {
  const state = store.data()

  getPeople(nodes, state)
  getPeopleRelations(nodes, edges, state.productions)

  send({
    type: 'updateNetwork',
    face: config.face,
    nodes: nodes.get(),
    edges: edges.get(),
  })
}

function secondFace() {
  const state = store.data()

  getPeople(nodes, state)

  const allEdges = new DataSet()
  getPeopleRelations(nodes, allEdges, state.productions)

  edges.clear()

  for (let author of nodes.get()) {
    const others = lazy.filter(({id}) => id !== author.id, nodes.get())

    for (let other of others) {
      const edgeId = utils.buildEdgeId(author, other)

      if (!allEdges.get(edgeId)) {
        allEdges.add({
          id: edgeId,
          from: author.id,
          to: other.id,
          label: '0',
          value: 0,
        })
      }
    }
  }

  // prim

  if (nodes.getIds().length) {
    const v = nodes.get()[0].id
    const N = new Set(nodes.map(({id}) => id))
    const T = new Set([v])
    const V = new Set(nodes.map(({id}) => id).filter(id => id !== v))

    while (!utils.sameSet(N, T)) {
      const edge = allEdges.get({
        filter ({from, to}) {
          return (T.has(from) && V.has(to)) ||
            (V.has(from) && T.has(to))
        }
      })
        .reduce((a, b) => +a.label < +b.label ? a : b)

      const {from, to, label} = edge
      const k = V.has(from) ? from : to
      T.add(k)
      V.delete(k)

      if (!edges.get(edge.id)) {
        edges.add(edge)
      }
    }
  }

  send({
    type: 'updateNetwork',
    face: config.face,
    nodes: nodes.get(),
    edges: edges.get(),
  })
}

function thirdFace() {
  const state = store.data()

  getPeople(nodes, state)

  for (let production of Object.values(state.productions)) {
    if (production.year < 2015) continue

    const authors = Array.from(
      lazy.filter(
        x => x,
        lazy.map(
          id => nodes.get(id),
          Object.keys(production.authors)
        )
      )
    )

    for (let author of authors) {
      const yearNodeId = `author:${author.id}:year:${production.year}`

      if (!nodes.get(yearNodeId)) {
        nodes.add({
          id: yearNodeId,
          label: production.year,
          color: colors.year,
        })

        edges.add({
          id: `${yearNodeId}:edge`,
          from: author.id,
          to: yearNodeId,
          arrows: 'to',
        })
      }

      const typeNodeId = `${yearNodeId}:type:${production.type}`

      if (!nodes.get(typeNodeId)) {
        nodes.add({
          id: typeNodeId,
          label: titleCase(production.type),
          color: colors.publicationType,
        })

        edges.add({
          id: `${typeNodeId}:edge`,
          from: yearNodeId,
          to: typeNodeId,
          arrows: 'to',
        })
      }

      incrementValue(nodes, nodes.get(author.id))
      incrementValue(nodes, nodes.get(typeNodeId))
      incrementLabel(edges, edges.get(`${typeNodeId}:edge`))
    }
  }

  send({
    type: 'updateNetwork',
    face: config.face,
    nodes: nodes.get(),
    edges: edges.get(),
  })
}

function send(raw) {
  return postMessage(JSON.stringify(raw))
}

function incrementValue(dataset, entry) {
  const currentValue = entry.value || 0
  dataset.update({
    id: entry.id,
    value: currentValue + 1,
  })
}

function incrementLabel(dataset, entry) {
  const currentValue = +entry.label || 0
  dataset.update({
    id: entry.id,
    label: `${currentValue + 1}`,
  })
}

function getPeople(nodes, state) {
  const notRepeated = person => !nodes.get(person.id)

  const qualifiedPeople = config.ppgccOnly
    ? lazy.filter(
      person => person.isPpgcc && notRepeated(person),
      Object.values(state.people)
    )
    : lazy.filter(notRepeated, Object.values(state.people))

  const people = lazy.map(
    ({id, name}) => ({
      id,
      label: name,
      color: colors.person,
    }),
    qualifiedPeople
  )

  nodes.add(Array.from(people))
}

function getPeopleRelations(nodes, edges, productions) {
  for (let production of Object.values(productions)) {
    const authors = Array.from(
      lazy.filter(
        x => x,
        lazy.map(
          id => nodes.get(id),
          Object.keys(production.authors)
        )
      )
    )

    for (let i = 0, len = authors.length; i < len; i++) {
      const author = authors[i]

      for (var j = i + 1, len2 = authors.length; j < len2; j++) {
        const otherAuthor = authors[j]
        const edgeId = utils.buildEdgeId(author, otherAuthor)

        if (!edges.get(edgeId)) {
          edges.add({
            id: edgeId,
            from: author.id,
            to: otherAuthor.id,
          })
        }

        const edge = edges.get(edgeId)
        const relationKey = `rel:${author.id}:${otherAuthor.id}:${production.id}`

        if (!uniqueRelations.has(relationKey)) {
          uniqueRelations.add(relationKey)

          const newValue = (+edge.label || 0) + 1
          edges.update({
            id: edgeId,
            label: `${newValue}`,
            value: newValue,
          })

          incrementValue(edges, edges.get(edgeId))
          incrementValue(nodes, nodes.get(author.id))
          incrementValue(nodes, nodes.get(otherAuthor.id))
        }
      }
    }
  }
}

function clearNetwork() {
  nodes = new DataSet()
  edges = new DataSet()
  uniqueRelations = new Set()
}
