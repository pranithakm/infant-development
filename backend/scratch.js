const axios = require('axios');
async function test() {
  const query = '[out:json];node(around:5000,12.9716,77.5946)[amenity=hospital];out 5;';
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, { timeout: 8000 });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}
test();
