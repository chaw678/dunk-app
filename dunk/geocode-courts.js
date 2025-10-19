import fs from 'fs';
import fetch from 'node-fetch';

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

function flattenCourts(json) {
  const courts = [];
  for (const [region, types] of Object.entries(json)) {
    for (const [courtType, courtsArr] of Object.entries(types)) {
      for (const court of courtsArr) {
        courts.push({
          name: court.name,
          address: court.address,
          region: region.toLowerCase(),
          type: courtType.toLowerCase(),
        });
      }
    }
  }
  return courts;
}

async function geocode(address) {
  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(address)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.results && data.results.length) {
    return {
      lat: parseFloat(data.results[0].LATITUDE),
      lon: parseFloat(data.results[0].LONGITUDE),
    };
  }
  return {lat: null, lon: null};
}

(async () => {
  const raw = fs.readFileSync('./BasketballCourtsAddresses.json','utf8');
  const json = JSON.parse(raw);
  const courts = flattenCourts(json);
  
  // Optionally extract keywords from name
  function getKeywords(name) {
    return name.split(/\s|@|,|\(|\)/).map(s=>s.replace(/[^a-zA-Z0-9]/g,'').toLowerCase()).filter(Boolean);
  }

  let out = [];
  for(let i=0;i<courts.length;i++){
    const c = courts[i];
    process.stdout.write(`Geocoding ${i+1}/${courts.length}: ${c.name}... `);
    const geo = await geocode(c.address);
    if(geo.lat && geo.lon){
      process.stdout.write('OK\n');
      out.push({
        name: c.name,
        lat: geo.lat,
        lon: geo.lon,
        region: c.region,
        type: c.type,
        keywords: getKeywords(c.name)
      });
    }else{
      process.stdout.write('NOT FOUND\n');
    }
    await sleep(1000); // A small pause to be nice to OneMap servers
  }
  
  // Write to a courts.js file (as a JS array)
  fs.writeFileSync('courts.js', 'const courts = ' + JSON.stringify(out, null, 2) + ';\nexport default courts;\n');
  console.log(`\nDone! Check courts.js for the output.`);
})();
