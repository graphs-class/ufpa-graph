import * as store from './store'

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

      // case 'demaisTiposDeProducaoBibliografica':
      //   consumeBooksAndChapters(
      //     Object.entries(items)
      //       .reduce((acc, [key, val]) => {
      //         console.log({key, val});
      //         if (key === 'outraProducaoBibliografica') {
      //           acc[key] = [
      //             {[key]: val}
      //           ]
      //         } else {
      //           acc[key] = val
      //         }
      //         return acc
      //       }, {})
      //   )
      //   break

      default:
        console.log('misses', {type})
    }
  }
  console.log(store.data())
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
      production.authors.add(author)
      author.productions.add(production)
    }
  }
}

function consumeBooksAndChapters(node) {
  console.log({node});
  for ([outerContainer] of Object.values(node)) {
    console.log({outerContainer});
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
        production.authors.add(author)
        author.productions.add(production)
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
      production.authors.add(author)
      author.productions.add(production)
    }
  }
}
