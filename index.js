let fs = require('fs');
let fetch = require('node-fetch')
let forEachLine = require('for-each-line');
let randomAPI = require('ngraph.random');
let toProtobuf = require('./lib/toProtobuf');
let path = require('path')
let outFileName = path.join(__dirname, 'data', 'processed.json');
let outErrorsFileName = path.join(__dirname, 'data', 'errors.json');
let outgoing;
let outErrors;
let queue = [];
let executeOSMQuery = require('./lib/executeOSMQuery')
var JSONStream = require('JSONStream')
var es = require('event-stream')

readErroredFile(outFileName, crawl);

// function readErrors(seen) {
//   readProcessedFile(outFileName, function (errors) {
//
//   });
// }

function crawl(seen) {
  forEachLine(process.argv[2] || 'cities.txt', line => {
    let cityName = sanitize(line)
    if (!seen.has(cityName)) queue.push(cityName)
  }).then(downloadAll);
}

function downloadAll() {
  let last = 0;
  randomAPI.randomIterator(queue).shuffle();

  downloadNext();

  function downloadNext() {
    let city = queue[last];
    if (!city) {
      console.warn('All done');
      return;
    }

    last += 1;

    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;
    console.log('Fetching area for: ' + url);

    fetch(url)
      .then(x => x.json())
      .then(x => x.filter(row => row.osm_type === 'relation').map(row => ({
        key: city,
        name: row.display_name,
        type: row.type,
        areaId: row.osm_id + 36e8
      })))
      .then(data => {
        if (!data.length) {
          console.warn('Could not find matches for ' + city + '; Skipping');
          downloadNext();
          return;
        }

        return downloadOSM(data[0]);
      }).catch(err => {
        console.error('Error when fetching ' + url)
        console.error(err);
        setTimeout(downloadNext, 2000);
      });
  }

  function downloadOSM(place) {
    let query = getQuery(place.areaId);
    return executeOSMQuery(query)
      .then(data => saveResults(data.elements, place))
      .then(downloadNext)
  }

  function saveResults(elements, place) {
    let buffer = toProtobuf(elements, place.name, place.areaId);
    let fileName = path.join(__dirname, 'data', place.areaId + '.pbf');
    fs.writeFileSync(fileName, buffer);
    markProcessed(place);
  }

function getQuery(areaId) {
    return `[timeout:9000][maxsize:2000000000][out:json];
area(${areaId});
(._; )->.area;
(
way["highway"](area.area);
node(w);
);
out skel;`;
}
}

function sanitize(name) {
  return name.replace(/\t/g, ',');
}

function markProcessed(page) {
  if(!outgoing) {
    createOutStream();
  }

  outgoing.write(page);
}

function createOutStream() {
  outgoing = JSONStream.stringify(false);
  var fileStream = fs.createWriteStream(outFileName, {
    encoding: 'utf8',
    flags: 'a'
  });
  outgoing.pipe(fileStream);
}

function readProcessedFile(fileName, done) {
  var seen = new Set();
  if (!fs.existsSync(fileName)) {
    done(seen);
    return;
  }

  console.log('Parsing processed list...');
  var jsonStreamParser = JSONStream.parse();
  fs.createReadStream(fileName)
    .pipe(jsonStreamParser)
    .pipe(es.mapSync(markProcessed))
    .on('end', fileInitialized);

  function markProcessed(place) {
    seen.add(place.key);
  }

  function fileInitialized() {
    console.log('Processed: ' + seen.size);
    done(seen);
  }
}
