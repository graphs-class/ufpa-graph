import {DataSet} from 'vis'
import * as ui from './ui'

const state = {
  face: 0,
}

export function get(key) {
  return state[key]
}

export function set(key, value) {
  state[key] = value
  return get(key)
}

