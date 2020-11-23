$(document).ready(() => {
  $.get("/api/states").then((states) => {
    states.forEach((state) => {
      const capitalizedState = `${state[0].toUpperCase()}${state.substring(1)}`;
      $("#states-select").append(
        `<option value=${state}>${capitalizedState}</option>`
      );
    });
  });

  $("#states-input").on("click", "#state-submit", () => {
    const state = $("#states-select").val();
    if (state === "Choose a state...") return;
    localStorage.setItem("state", state);
    getStateData(state);
  });

  $("#button-biden-up").on("click", () => {
    const bidenUp = $("#biden-up").val();
    localStorage.setItem("biden-up", bidenUp);
    prependLegend();
    localStorage.getItem("state") &&
      getStateData(localStorage.getItem("state"));
  });

  $("#button-trump-up").on("click", () => {
    const trumpUp = $("#trump-up").val();
    localStorage.setItem("trump-up", trumpUp);
    prependLegend();
    localStorage.getItem("state") &&
      getStateData(localStorage.getItem("state"));
  });

  function prependLegend() {
    $("#table-body").empty();
    const bidenUp = localStorage.getItem("biden-up") || 100000;
    const bidenUpFormatted = `${Math.floor(bidenUp / 1000)}K`;
    const trumpUp = localStorage.getItem("trump-up") || 100000;
    const trumpUpFormatted = `${Math.floor(trumpUp / 1000)}K`;
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
        <td class="bg-primary">${bidenUpFormatted} > than previous row</td>
        <td></td>
        <td class="bg-danger">${trumpUpFormatted} > than previous row</td>
        <td class="bg-info">10K > than previous row</td>
    </tr>
    `);
  }

  function getStateData(state) {
    if (state === "Choose a state...") return;
    $.get(`/api/data/${state}`).then((response) => {
      $("#table-title").text(
        `${state[0].toUpperCase()}${state.substring(1)} Data`
      );
      const data = response.data.races[0].timeseries;
      renderTable(data);
    });
  }

  function init() {
    localStorage.getItem("state") &&
      getStateData(localStorage.getItem("state"));
    $("#biden-up").val(localStorage.getItem("biden-up"));
    $("#trump-up").val(localStorage.getItem("trump-up"));
    prependLegend();
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
      const otherDropped = otherVotes < prevOtherVotes || 0;
      const otherUp10K = otherVotes - prevOtherVotes > 10000;
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
              otherDropped ? "bg-warning" : otherUp10K ? "bg-info" : null
            }>${otherVotes
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
        </tr>
        `);
    }
  }
  init();
});
