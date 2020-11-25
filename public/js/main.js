$(document).ready(() => {
  let currentState;

  $("#states-input").on("click", "#state-submit", () => {
    const state = $("#states-select").val();
    if (state === "Choose a state...") return;
    $("#states-spinner").removeClass("d-none");
    currentState = state;
    localStorage.setItem("state", state);
    getStateData(state);
  });

  $("#button-biden-up").on("click", () => {
    const bidenUp = $("#biden-up").val();
    localStorage.setItem("biden-up", bidenUp);
    prependLegend();
    if (currentState) {
      $("#biden-spinner").removeClass("d-none");
      getStateData(currentState);
    }
  });

  $("#button-trump-up").on("click", () => {
    const trumpUp = $("#trump-up").val();
    localStorage.setItem("trump-up", trumpUp);
    prependLegend();
    if (currentState) {
      $("#trump-spinner").removeClass("d-none");
      getStateData(currentState);
    }
  });

  $("#button-other-up").on("click", () => {
    const otherUp = $("#other-up").val();
    localStorage.setItem("other-up", otherUp);
    prependLegend();
    if (currentState) {
      $("#other-spinner").removeClass("d-none");
      getStateData(currentState);
    }
  });

  function formatVotesUp(votes) {
    return `${
      Math.floor(votes / 1000) >= 1 ? Math.floor(votes / 1000) : "<1"
    }K`;
  }

  function getAllData() {
    $.get(
      "https://static01.nyt.com/elections-assets/2020/data/api/2020-11-03/votes-remaining-page/national/president.json"
    ).then((response) => console.log("data", response));
  }

  getAllData();

  function getOptions() {
    $.get("/api/states").then((states) => {
      states.forEach((state) => {
        const capitalizedState = `${state[0].toUpperCase()}${state.substring(
          1
        )}`;
        $("#states-select").append(
          `<option value=${state}>${capitalizedState}</option>`
        );
      });

      currentState && $("#states-select").val(currentState).change();
    });
  }

  function getStateData(state) {
    if (state === "Choose a state...") return;
    $.get(`/api/data/${state}`).then((response) => {
      $(
        "#states-spinner, #biden-spinner, #trump-spinner, #other-spinner"
      ).addClass("d-none");
      $("#table-title").text(
        `${state[0].toUpperCase()}${state.substring(1)} Data`
      );
      const data = response.data.races[0].timeseries;
      renderTable(data);
    });
  }

  function init() {
    getOptions();
    currentState = localStorage.getItem("state");
    currentState && getStateData(currentState);
    $("#biden-up").val(localStorage.getItem("biden-up"));
    $("#trump-up").val(localStorage.getItem("trump-up"));
    $("#other-up").val(localStorage.getItem("other-up"));
    prependLegend();
  }

  function prependLegend() {
    $("#table-body").empty();
    const bidenUp = localStorage.getItem("biden-up") || 100000;
    const trumpUp = localStorage.getItem("trump-up") || 100000;
    const otherUp = localStorage.getItem("other-up") || 10000;
    $("#table-body").prepend(`
    <tr>
        <td></td>
        <td></td>
        <td></td>
        <td class="bg-danger">Fewer than previous row</td>
        <td></td>
        <td class="bg-primary">Fewer than previous row</td>
        <td class="bg-warning">Fewer than previous row</td>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
        <td class="bg-primary">${formatVotesUp(
          bidenUp
        )} more than previous row</td>
        <td></td>
        <td class="bg-danger">${formatVotesUp(
          trumpUp
        )} more than previous row</td>
        <td class="bg-info">${formatVotesUp(
          otherUp
        )} more than previous row</td>
    </tr>
    `);
  }

  function renderTable(data) {
    prependLegend();
    for (let i = 0; i < data.length; i++) {
      const {
        timestamp,
        votes,
        vote_shares: { bidenj, trumpd },
      } = data[i];
      const localeString = new Date(timestamp).toLocaleString();
      const bidenVotes = votes * bidenj;
      const trumpVotes = votes * trumpd;
      const otherVotes = votes - bidenVotes - trumpVotes;
      let prevRowBidenVotes;
      let prevRowTrumpVotes;
      let prevOtherVotes;
      if (i > 0) {
        prevRowBidenVotes = data[i - 1].votes * data[i - 1].vote_shares.bidenj;
        prevRowTrumpVotes = data[i - 1].votes * data[i - 1].vote_shares.trumpd;
        prevOtherVotes =
          data[i - 1].votes - prevRowBidenVotes - prevRowTrumpVotes;
      }
      const bidenUp = localStorage.getItem("biden-up") || 100000;
      const bidenDropped = bidenVotes < prevRowBidenVotes || 0;
      const bidenUpBool = bidenVotes - prevRowBidenVotes > bidenUp;
      const trumpUp = localStorage.getItem("trump-up") || 100000;
      const trumpDropped = trumpVotes < prevRowTrumpVotes || 0;
      const trumpUpBool = trumpVotes - prevRowTrumpVotes > trumpUp;
      const otherUp = localStorage.getItem("other-up") || 100000;
      const otherDropped = otherVotes < prevOtherVotes || 0;
      const otherUpBool = otherVotes - prevOtherVotes > otherUp;
      $("#table-body").append(`
        <tr>
            <th>${localeString}</th>
            <td>${votes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
            <td>${(bidenj * 100).toFixed(2)}</td>
            <td class=${
              bidenDropped ? "bg-danger" : bidenUpBool ? "bg-primary" : null
            }>${bidenVotes
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
            <td>${(trumpd * 100).toFixed(2)}</td>
            <td class=${
              trumpDropped ? "bg-primary" : trumpUpBool ? "bg-danger" : null
            }>${trumpVotes
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
            <td class=${
              otherDropped ? "bg-warning" : otherUpBool ? "bg-info" : null
            }>${otherVotes
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
        </tr>
        `);
    }
  }
  init();
});
