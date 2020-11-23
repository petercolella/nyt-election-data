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
    $.get(`/api/data/${state}`).then((response) => {
      $("#table-body").empty();
      $("#table-title").text(
        `${state[0].toUpperCase()}${state.substring(1)} Data`
      );
      const data = response.data.races[0].timeseries;
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
          prevRowBidenVotes =
            data[i - 1].votes * data[i - 1].vote_shares.bidenj;
          prevRowTrumpVotes =
            data[i - 1].votes * data[i - 1].vote_shares.trumpd;
          prevOtherVotes =
            data[i - 1].votes - prevRowBidenVotes - prevRowTrumpVotes;
        }
        const bidenDropped = bidenVotes < prevRowBidenVotes || 0;
        const bidenUp100K = bidenVotes - prevRowBidenVotes > 100000;
        const trumpDropped = trumpVotes < prevRowTrumpVotes || 0;
        const trumpUp100K = trumpVotes - prevRowTrumpVotes > 100000;
        const otherDropped = otherVotes < prevOtherVotes || 0;
        const otherUp10K = otherVotes - prevOtherVotes > 10000;
        $("#table-body").append(`
        <tr>
            <th>${localeString}</th>
            <td>${votes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
            <td>${(bidenj * 100).toFixed(2)}</td>
            <td class=${
              bidenDropped ? "bg-danger" : bidenUp100K ? "bg-success" : null
            }>${bidenVotes
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
            <td>${(trumpd * 100).toFixed(2)}</td>
            <td class=${
              trumpDropped ? "bg-primary" : trumpUp100K ? "bg-success" : null
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
      $("#table-body").append(`
    <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <th></th>
        <td></td>
        <td></td>
        <td class="bg-danger">Fewer than previous row</td>
        <td></td>
        <td class="bg-primary">Fewer than previous row</td>
        <td class="bg-warning">Fewer than previous row</td>
    </tr>
    <tr>
        <th></th>
        <td></td>
        <td></td>
        <td class="bg-success">100K > than previous row</td>
        <td></td>
        <td class="bg-success">100K > than previous row</td>
        <td class="bg-info">10K > than previous row</td>
    </tr>
    `);
    });
  });
});
