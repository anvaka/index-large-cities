let Pbf = require('pbf');
let place = require('../proto/place.js').place;

module.exports = function toProtobuf(elements, name, areaId) {
  let nodes = [];
  let ways = [];
  let date = (new Date()).toISOString();

  elements.forEach(x => {
    if (x.type === 'node') {
      nodes.push(x)
    } else if (x.type === 'way') {
      ways.push(x)
    }
  });

  let pbf = new Pbf()
  place.write({
    version: 1,
    id: areaId,
    date, 
    name: name,
    nodes, ways
  }, pbf);

  return pbf.finish();
}
