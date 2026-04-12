const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5001/api/assistant/chat', {
       message: "show near by hospitals",
       location: { lat: 12.9716, lng: 77.5946 }
    }, {
      // no auth needed if protect is mocked, wait, protect middleware requires auth!
      // I don't have token. I can just bypass or mock.
    });
    console.log(res.data.data.response);
  } catch (err) {
    console.log(err.message);
  }
}
// since I don't have auth token, let me just check the controller code again.
// the `assistantRoutes.js` uses `protect` middleware.
