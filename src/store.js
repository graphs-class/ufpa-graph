const store = {
  people: {},
  productions: {},
}

export function data() {
  return store
}

export function addPerson(person) {
  const {id} = person

  const exists = getPerson(id)
  if (exists) return exists

  store.people[id] = Object.assign({
    productions: {},
  }, person)

  return getPerson(id)
}

export function addProduction(production) {
  const {id} = production

  const exists = getProduction(id)
  if (exists) return exists

  store.productions[id] = Object.assign({
    authors: {},
  }, production)

  return getProduction(id)
}

export function setPeople(people) {
  for (let person of Object.values(people)) {
    addPerson(person)
  }
}

export function setProductions(productions) {
  for (let production of Object.values(productions)) {
    addProduction(production)
  }
}

export function getPerson(id) {
  return store.people[id]
}

export function getProduction(id) {
  return store.productions[id]
}

