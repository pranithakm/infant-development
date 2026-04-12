const { processAssistantQuery } = require('./controllers/assistantController');
const express = require('express');

const req = {
  body: {
    message: "Ayan has had a fever for 4 days.",
    infantId: "67fc4dce2afebc5dfaed748d",
    location: {
        lat: 12.9716,
        lng: 77.5946
    }
  }
};

const res = {
  status: (code) => ({
    json: (data) => console.log(JSON.stringify(data, null, 2))
  })
}

require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(() => {
    processAssistantQuery(req, res).then(() => mongoose.disconnect());
});

