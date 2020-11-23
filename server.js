const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.get("/api/data/:state", (req, res) => {
  const { state } = req.params;
  const data = fs.readFileSync(
    path.join(__dirname, `/nyt-election-data/${state}.json`),
    "utf8"
  );
  res.json(JSON.parse(data));
});

app.get("/api/states", (req, res) => {
  fs.readdir(path.join(__dirname, "/nyt-election-data"), (err, files) => {
    const stateNames = files.map((file) => {
      return file.replace(".json", "");
    });
    res.json(stateNames);
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/views/index.html"));
});

app.listen(PORT, () => {
  console.log(`Listenting at http://localhost:${PORT}`);
});
