const axios = require("axios");
const fs = require("fs");
const path = require("path");

const getData = () => {
  axios
    .get(
      "https://static01.nyt.com/elections-assets/2020/data/api/2020-11-03/votes-remaining-page/national/president.json"
    )
    .then((response) => {
      const data = response.data.data.races;

      data.forEach((state) => {
        const stateData = JSON.stringify(state);
        fs.writeFile(
          path.join(__dirname, `data/${state.state_slug}.json`),
          stateData,
          (err) => {
            if (err) throw err;
            console.log(`Data written to data/${state.state_slug}.json`);
          }
        );
      });
    });
};

getData();
