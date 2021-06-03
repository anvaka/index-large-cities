// an example how to read a graph. Assuming you've indexed cities with
// node index.js

let Pbf = require('pbf');
const fs = require('fs');
let createGraph = require('ngraph.graph');
let place = require('./proto/place.js').place;

/**
 * Given a path to .pbf file, reads it into a graph
 */
function readGraph(path) {
  let data = fs.readFileSync(path);
  let obj = place.read(new Pbf(data));
  let graph = createGraph();

  obj.ways.forEach(way => {
    way.nodes.forEach((node, idx, arr) => {
      if (idx == 0) return;
      let from = arr[idx - 1];
      let to = arr[idx];
      if (graph.hasLink(from, to)) return;
      if (graph.hasLink(to, from)) return;
      graph.addLink(from, to);
    });
  })
  console.log(path, 'nodes: ' + graph.getNodeCount() + '; edges: ' + graph.getLinkCount());
  return graph;
}


module.exports = readGraph;