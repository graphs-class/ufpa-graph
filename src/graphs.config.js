const colors = {
  person: '#95a5a6',
  edge: '#95a5a6',
  year: '#2ecc71',
  publicationType: '#34495e',
  dijkstra: '#9b59b6',
}

const defaultNode = {
  shape: 'dot',
  size: 16,
}

const defaultPhysics = {
  forceAtlas2Based: {
    gravitationalConstant: -300,
    centralGravity: 0.005,
    springLength: 230,
    springConstant: 0.18
  },

  maxVelocity: 300,
  solver: 'forceAtlas2Based',
  timestep: 0.5,
  stabilization: {iterations: 0}
}

export default {
  colors,

  options: {
    0: {
      nodes: defaultNode,

      edges: {
        color: {
          color: colors.edge,
          highlight: colors.edge,
          hover: colors.edge,
        },
      },

      physics: defaultPhysics,
    },

    1: {
      nodes: defaultNode,

      edges: {
        color: {
          inherit: true,
        },
      },

      physics: defaultPhysics,
    },

    2: {
      nodes: defaultNode,

      edges: {
        color: {
          inherit: true,
        },
      },

      physics: {
        ...defaultPhysics,
        repulsion: {
          ...defaultPhysics.forceAtlas2Based,
          gravitationalConstant: -30000,
        },

        solver: 'repulsion',
      }
    }
  },
}
