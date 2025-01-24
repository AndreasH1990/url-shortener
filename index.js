require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const app = express();
let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

let Url;

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true
  },
  shortenedUrl: {
    type: Number,
    required: true
  }
});

Url = mongoose.model('Url', urlSchema);

const findNumberOfDocuments = async () => {
  try {
    const count = await Url.countDocuments({});
    console.log("Number of docs: ", count);
    return count;
  } catch (err) {
    console.error("Error counting documents:", err);
    throw err;
  }
};

const createAndSaveUrlDocument = async (urlPosted, count) => {
  const newUrlDocument = new Url({
    originalUrl: urlPosted,
    shortenedUrl: count + 1
  });
  try {
    const savedDocument = await newUrlDocument.save();
    console.log("Saved Document:", savedDocument);
    return savedDocument;
  } catch (err) {
    console.error("Error saving document:", err);
    throw err;
  }
};

const checkForCorrectFormat = (urlPosted) => {
  const regex = /^(http|https)(:\/\/)/;
  if (regex.test(urlPosted)) {
    console.log("URL is correct format.")
    return true;
  } else {
    return false;
  }
};

const findOriginalUrlByShort = async (shortUrl) => {
  try {
    const foundDocument = await Url.findOne({
      shortenedUrl: shortUrl
    });
    console.log(foundDocument);
    return foundDocument;
  } catch (err) {
    console.error("Error finding document:", err);
    throw err;
  }
};

app.post("/api/shorturl", async function (req, res) {
  const urlPosted = req.body.url;
  if (checkForCorrectFormat(urlPosted)) {
    try {
      const count = await findNumberOfDocuments();
      const savedDocument = await createAndSaveUrlDocument(urlPosted, count);
      res.json({
        original_url: savedDocument.originalUrl,
        short_url: savedDocument.shortenedUrl,
      });
    } catch (err) {
      console.error("Error in /api/shorturl:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.json({ error: 'invalid url' });
  }
});

app.get("/api/shorturl/:inputShortUrl", async function (req, res) {
  const inputShortUrl = Number(req.params.inputShortUrl);
  if (isNaN(inputShortUrl)) {
    return res.json({ error: "invalid short_url" });
  }
  try {
    const queryResult = await findOriginalUrlByShort(inputShortUrl);
    if (!queryResult) {
      return res.json({ error: "No short URL found" });
    }
    res.redirect(queryResult.originalUrl);
  } catch (err) {
    console.error("Error in /api/shorturl/:inputShortUrl:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
