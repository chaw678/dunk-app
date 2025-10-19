// src/utils/geocode.js
export async function geocodeAddress(address) {
  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(address)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    return {
      lat: parseFloat(data.results[0].LATITUDE),
      lon: parseFloat(data.results[0].LONGITUDE)
    };
  } else {
    return null; // Address not found
  }
}
