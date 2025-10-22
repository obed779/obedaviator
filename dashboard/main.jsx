const ws = new WebSocket("wss://obedaviator.onrender.com");

const tableBody = document.getElementById("history-body");

ws.onopen = () => {
  console.log("✅ Connected to Aviator live feed");
};

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    // If the server sends round history
    if (Array.isArray(data)) {
      tableBody.innerHTML = "";
      data.slice().reverse().forEach((round) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${round.id}</td>
          <td>${round.round_id}</td>
          <td>${round.result}x</td>
          <td>${round.created_at}</td>
        `;
        tableBody.appendChild(row);
      });
    }

    // If it's a new live crash update
    else if (data.round_id) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${data.id || "-"}</td>
        <td>${data.round_id}</td>
        <td>${data.result}x</td>
        <td>${data.created_at || new Date().toLocaleTimeString()}</td>
      `;
      tableBody.prepend(row);
    }
  } catch (e) {
    console.error("Error parsing data", e);
  }
};

ws.onclose = () => {
  console.warn("❌ Disconnected from live server");
  const row = document.createElement("tr");
  row.innerHTML = `<td colspan="4">Disconnected from server...</td>`;
  tableBody.appendChild(row);
};
