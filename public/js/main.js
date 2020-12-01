$(document).ready(() => {
  let currentState;
  let bidenUp;
  let trumpUp;
  let otherUp;

  $("#states-input").on("click", "#state-submit", () => {
    const state = $("#states-select").val();
    if (state === "Choose a state...") return;
    $("#states-spinner").removeClass("d-none");
    currentState = state;
    localStorage.setItem("state", state);
    getStateData(state);
  });

  $("#button-biden-up").on("click", () => {
    const value = $("#biden-up").val();
    bidenUp = value;
    localStorage.setItem("biden-up", value);
    prependLegend();
    if (currentState) {
      $("#biden-spinner").removeClass("d-none");
      getStateData(currentState);
    }
  });

  $("#button-trump-up").on("click", () => {
    const value = $("#trump-up").val();
    trumpUp = value;
    localStorage.setItem("trump-up", value);
    prependLegend();
    if (currentState) {
      $("#trump-spinner").removeClass("d-none");
      getStateData(currentState);
    }
  });

  $("#button-other-up").on("click", () => {
    const value = $("#other-up").val();
    otherUp = value;
    localStorage.setItem("other-up", value);
    prependLegend();
    if (currentState) {
      $("#other-spinner").removeClass("d-none");
      getStateData(currentState);
    }
  });

  function addCommas(num) {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function addTotals(totals) {
    const {
      bidenDownTotal,
      trumpDownTotal,
      otherDownTotal,
      bidenUpTotal,
      trumpUpTotal,
      otherUpTotal,
    } = totals;

    $(`
    <tr>
        <td></td>
        <td></td>
        <td></td>
        <td class="bg-danger">Total Down: ${addCommas(
          bidenDownTotal.toFixed(0)
        )}</td>
        <td></td>
        <td class="bg-primary">Total Down: ${addCommas(
          trumpDownTotal.toFixed(0)
        )}</td>
        <td class="bg-warning">Total Down: ${addCommas(
          otherDownTotal.toFixed(0)
        )}</td>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
        <td class="bg-primary">Total Up: ${addCommas(
          bidenUpTotal.toFixed(0)
        )}</td>
        <td></td>
        <td class="bg-danger">Total Up: ${addCommas(
          trumpUpTotal.toFixed(0)
        )}</td>
        <td class="bg-info">Total Up: ${addCommas(otherUpTotal.toFixed(0))}</td>
    </tr>
    `).insertAfter("#legend");
  }

  function formatVotesUp(votes) {
    return `${votes / 1000 >= 1 ? (votes / 1000).toFixed(0) : "<1"}K`;
  }

  function getAllData() {
    $.get(
      "https://static01.nyt.com/elections-assets/2020/data/api/2020-11-03/votes-remaining-page/national/president.json"
    ).then((response) => console.log("NY Times API:", response));
  }

  getAllData();

  function getOptions() {
    $.get("/api/states").then((states) => {
      states.forEach((state) => {
        const { state_name, state_slug } = state;
        $("#states-select").append(
          `<option value=${state_slug}>${state_name}</option>`
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
      const { state_name, timeseries } = response;
      $("#table-title").text(`${state_name} Data`);
      renderTable(timeseries);
    });
  }

  function init() {
    getOptions();
    currentState = localStorage.getItem("state");
    currentState && getStateData(currentState);
    bidenUp = localStorage.getItem("biden-up") || 100000;
    trumpUp = localStorage.getItem("trump-up") || 100000;
    otherUp = localStorage.getItem("other-up") || 10000;
    $("#biden-up").val(bidenUp);
    $("#trump-up").val(trumpUp);
    $("#other-up").val(otherUp);
    prependLegend();
  }

  function prependLegend() {
    $("#table-body").empty();
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
    <tr id="legend">
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

    let bidenDownTotal = 0;
    let trumpDownTotal = 0;
    let otherDownTotal = 0;
    let bidenUpTotal = 0;
    let trumpUpTotal = 0;
    let otherUpTotal = 0;

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
      let prevRowOtherVotes;

      if (i > 0) {
        prevRowBidenVotes = data[i - 1].votes * data[i - 1].vote_shares.bidenj;
        prevRowTrumpVotes = data[i - 1].votes * data[i - 1].vote_shares.trumpd;
        prevRowOtherVotes =
          data[i - 1].votes - prevRowBidenVotes - prevRowTrumpVotes;
      }

      const bidenUp = localStorage.getItem("biden-up") || 100000;
      const bidenDropped = bidenVotes < prevRowBidenVotes || 0;
      const bidenUpBool = bidenVotes - prevRowBidenVotes > bidenUp;

      const trumpUp = localStorage.getItem("trump-up") || 100000;
      const trumpDropped = trumpVotes < prevRowTrumpVotes || 0;
      const trumpUpBool = trumpVotes - prevRowTrumpVotes > trumpUp;

      const otherUp = localStorage.getItem("other-up") || 100000;
      const otherDropped = otherVotes < prevRowOtherVotes || 0;
      const otherUpBool = otherVotes - prevRowOtherVotes > otherUp;

      bidenDownTotal = bidenDropped
        ? (bidenDownTotal += prevRowBidenVotes - bidenVotes)
        : bidenDownTotal;
      trumpDownTotal = trumpDropped
        ? (trumpDownTotal += prevRowTrumpVotes - trumpVotes)
        : trumpDownTotal;
      otherDownTotal = otherDropped
        ? (otherDownTotal += prevRowOtherVotes - otherVotes)
        : otherDownTotal;
      bidenUpTotal = bidenUpBool
        ? (bidenUpTotal += bidenVotes - prevRowBidenVotes)
        : bidenUpTotal;
      trumpUpTotal = trumpUpBool
        ? (trumpUpTotal += trumpVotes - prevRowTrumpVotes)
        : trumpUpTotal;
      otherUpTotal = otherUpBool
        ? (otherUpTotal += otherVotes - prevRowOtherVotes)
        : otherUpTotal;

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

    addTotals({
      bidenDownTotal,
      trumpDownTotal,
      otherDownTotal,
      bidenUpTotal,
      trumpUpTotal,
      otherUpTotal,
    });
  }

  init();
});
