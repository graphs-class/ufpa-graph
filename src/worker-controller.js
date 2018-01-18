import CurriculumWorker from './workers/curriculum.worker.js'
import * as store from './store'
import * as ui from './ui'

const worker = new CurriculumWorker()

function receive(e, data) {
  const {type} = data

  const handler = ({
    clearNetwork: ui.clearNetwork,
    redrawNetwork: ui.redraw,
    updateStore: () => updateStore(data.data),
    updateNetwork: () => ui.updateNetwork(data)
  })[type]

  if (!handler) {
    console.error('Missing handler for', type)
  } else {
    handler()
  }
}

function updateStore(data) {
  store.setPeople(data.people)
  store.setProductions(data.productions)
  ui.redraw()
}

export function send(raw) {
  const msg = JSON.stringify(raw)
  worker.postMessage(msg)
}

worker.onmessage = function onMessage(e) {
  const data = JSON.parse(e.data)
  receive(e, data)
}
