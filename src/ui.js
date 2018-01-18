import vis, {DataSet, Network} from 'vis'
import lazy from 'imlazy'
import titleCase from 'title-case'
import dijkstra from 'node-dijkstra'

import * as worker from './worker-controller'
import * as store from './store'
import * as config from './config'
import * as utils from './utils'

const $network = document.getElementById('network')
const $dijkstraBtn = document.getElementById('dijkstra-btn')

import graphsConfig from './graphs.config.js'
const {colors, options} = graphsConfig

let nodes = new DataSet([])
let edges = new DataSet([])
let network = new Network($network, {nodes, edges}, {})

let dijkstraMode = false
let nodesForDijkstra = new Set()
let itensToResetForDijkstra = {nodes: [], edges: []}

let uniqueRelations = new Set()

$dijkstraBtn.addEventListener('click', prepareForDijkstra)
network.on('click', onClick)

export function init() {
  redraw()
}

export function redraw() {
  const faceId = config.get('face')

  if (faceId !== 0) {
    $dijkstraBtn.setAttribute('disabled', true)
  } else if (!dijkstraMode) {
    $dijkstraBtn.removeAttribute('disabled')
  }

  worker.send({ type: 'renderFace' })
}

export function clearNetwork() {
  nodes.clear()
  edges.clear()
  uniqueRelations = new Set()
}

export function updateNetwork(data) {
  if (data.nodes.length) {
    nodes.add(data.nodes.filter(node => !nodes.get(node.id)))
  }

  if (data.edges.length) {
    if (config.get('face') === 1) {
      // We put 0 valued to represent no interaction.
      // Adding more lattes can make these invalid so I flush it.
      edges.clear()
    }

    edges.add(data.edges.filter(edge => !edges.get(edge.id)))
  }

  network.setOptions(options[data.face])
}

function prepareForDijkstra() {
  nodes.update(itensToResetForDijkstra.nodes.map(id => ({id, color: colors.person})))
  edges.update(itensToResetForDijkstra.edges.map(id => ({
    id,
    color: {
      color: colors.edge,
      highlight: colors.edge,
      hover: colors.edge,
    }
  })))

  dijkstraMode = true
  $dijkstraBtn.setAttribute('disabled', true)
  $dijkstraBtn.innerText = 'Select two different nodes'
}

function onClick(e) {
  if (dijkstraMode && e.nodes.length) {
    const [node] = e.nodes

    nodesForDijkstra.add(node)

    switch (nodesForDijkstra.size) {
      case 2:
        console.log({nodesForDijkstra});
        runDijkstra(...nodesForDijkstra.values())
        dijkstraMode = false
        $dijkstraBtn.innerText = 'Dijkstra'
        $dijkstraBtn.removeAttribute('disabled')
        nodesForDijkstra = new Set([])
        break

      case 1:
        $dijkstraBtn.innerText = 'Select one more node'
        break
    }
  }
}

function runDijkstra(from, to) {
  const adjacencies = nodes.getIds()
    .reduce((acc, id) => {
      acc[id] = {}
      return acc
    }, {})

  edges.forEach(({from, to, value}) => {
    adjacencies[from][to] = value
    adjacencies[to][from] = value
  })

  const route = new dijkstra()

  for (let id of Object.keys(adjacencies)) {
    route.addNode(id, adjacencies[id])
  }

  const path = route.path(from, to)

  const edgesToHighlight = path.slice(1)
    .map((node, i) => {
      const before = path[i]
      return utils.buildEdgeId({id: node}, {id: before})
    })

  nodes.update(path.map(id => ({id, color: colors.dijkstra})))
  edges.update(edgesToHighlight.map(id => ({
    id,
    color: {
      color: colors.dijkstra,
      highlight: colors.dijkstra,
      hover: colors.dijkstra,
    }
  })))

  itensToResetForDijkstra = {
    nodes: path,
    edges: edgesToHighlight,
  }
}
