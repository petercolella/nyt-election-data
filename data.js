const axios = require("axios");
const fs = require("fs");
const path = require("path");

const createStateJSONFiles = (data) => {
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
};

const createValueAndNameArray = (data) => {
  const arr = [];

  data.forEach((state) => {
    const { state_name, state_slug } = state;
    const stateObj = {
      state_name,
      state_slug,
    };
    arr.push(stateObj);
  });

  fs.writeFile(
    path.join(__dirname, "data/state-names.json"),
    JSON.stringify(arr, null, 2),
    (err) => {
      if (err) throw err;
      console.log(`Array of length: ${arr.length} added to state-names.json`);
    }
  );
};

const getData = () => {
  axios
    .get(
      "https://static01.nyt.com/elections-assets/2020/data/api/2020-11-03/votes-remaining-page/national/president.json"
    )
    .then((response) => {
      const data = response.data.data.races;

      createValueAndNameArray(data);
      createStateJSONFiles(data);
    });
};

getData();
