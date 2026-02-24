<!DOCTYPE html>
<html lang="et">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Snow Spot Logger</title>

<style>
body {
    font-family: Arial, sans-serif;
    background: #eef3f9;
    margin: 0;
    padding: 15px;
}
.container {
    max-width: 900px;
    margin: auto;
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
input, textarea {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-size: 18px;
    margin-top: 8px;
}
button {
    border: none;
    cursor: pointer;
    border-radius: 10px;
    font-weight: bold;
}

.primary { background:#2d6cdf; color:white; width:100%; padding:14px; margin-top:10px;}
.export { background:#27ae60; color:white; width:100%; padding:14px; margin-top:10px;}
.clear { background:#c0392b; color:white; width:100%; padding:14px; margin-top:10px;}
.secondary { background:#aaa; color:white; width:100%; padding:14px; margin-top:10px;}

.status { margin-top:10px; font-size:14px; color:#555; }

table {
    width:100%;
    border-collapse: collapse;
    margin-top:20px;
    font-size:13px;
}
th, td {
    border:1px solid #ddd;
    padding:6px;
    text-align:center;
}
th { background:#2d6cdf; color:white; }

/* SNOW */
.snow-input {
    font-size:28px;
    text-align:center;
    font-weight:bold;
}
.snow-row {
    display:flex;
    gap:6px;
    margin-top:10px;
}
.snow-btn {
    flex:1;
    padding:18px 0;
    font-size:20px;
}
.sminus { background:#2e86c1; color:white; }
.splus { background:#27ae60; color:white; }

/* TEMP */
.temp-input {
    font-size:26px;
    text-align:center;
    font-weight:bold;
}
.temp-row {
    display:flex;
    gap:6px;
    margin-top:10px;
}
.temp-btn {
    flex:1;
    padding:18px 0;
    font-size:20px;
}
.tminus { background:#3b6edb; color:white; }
.tplus { background:#e67e22; color:white; }
</style>
</head>
<body>

<div class="container">

<h2>❄ Snow Spot Logger</h2>

<label>Spot ID</label>
<input type="text" id="station">

<label>Snow Depth (cm)</label>
<input type="number" id="snow" min="0" step="1" class="snow-input">

<div class="snow-row">
    <button type="button" class="snow-btn sminus" onclick="changeSnow(-1)">-1</button>
    <button type="button" class="snow-btn splus" onclick="changeSnow(1)">+1</button>
    <button type="button" class="snow-btn splus" onclick="changeSnow(5)">+5</button>
    <button type="button" class="snow-btn splus" onclick="changeSnow(10)">+10</button>
</div>

<label>Air Temperature (°C)</label>
<input type="number" id="temp" step="0.1" class="temp-input">

<div class="temp-row">
    <button type="button" class="temp-btn tminus" onclick="changeTemp(-1)">-1</button>
    <button type="button" class="temp-btn tminus" onclick="changeTemp(-0.1)">-0.1</button>
    <button type="button" class="temp-btn tplus" onclick="changeTemp(0.1)">+0.1</button>
    <button type="button" class="temp-btn tplus" onclick="changeTemp(1)">+1</button>
</div>

<label>Notes</label>
<textarea id="notes"></textarea>

<div class="status" id="gpsStatus">GPS: waiting...</div>

<button type="button" class="primary" onclick="addRecord()">Add Spot (Auto Time + GPS)</button>
<button type="button" class="secondary" onclick="clearForm()">Clear Form</button>
<button type="button" class="clear" onclick="clearStored()">Clear Stored Data</button>
<button type="button" class="export" onclick="exportCSV()">Export CSV</button>

<table>
<thead>
<tr>
<th>Spot</th>
<th>DateTime (EE)</th>
<th>Snow</th>
<th>Temp</th>
<th>Lat</th>
<th>Lon</th>
<th>Acc</th>
<th>Del</th>
</tr>
</thead>
<tbody id="tableBody"></tbody>
</table>

</div>

<script>

let records = JSON.parse(localStorage.getItem("snowSpots")) || [];

function save() {
    localStorage.setItem("snowSpots", JSON.stringify(records));
}

function getEETimestamp() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().slice(0,16);
}

/* SNOW */
function changeSnow(step) {
    const input = document.getElementById("snow");
    let value = parseInt(input.value);
    if (isNaN(value)) value = 0;

    value += step;
    if (value < 0) value = 0;

    input.value = value;
}

/* TEMP */
function changeTemp(step) {
    const input = document.getElementById("temp");
    let value = parseFloat(input.value);
    if (isNaN(value)) value = 0;

    value += step;
    value = Math.round(value * 10) / 10;

    input.value = value.toFixed(1);
}

/* TABLE */
function loadTable() {
    const table = document.getElementById("tableBody");
    table.innerHTML = "";

    records.forEach((r, index) => {
        const row = table.insertRow();
        row.insertCell(0).innerText = r.station;
        row.insertCell(1).innerText = r.ee;
        row.insertCell(2).innerText = r.snow;
        row.insertCell(3).innerText = r.temp;
        row.insertCell(4).innerText = r.lat || "";
        row.insertCell(5).innerText = r.lon || "";
        row.insertCell(6).innerText = r.acc || "";

        const del = row.insertCell(7);
        const btn = document.createElement("button");
        btn.innerText = "X";
        btn.onclick = () => {
            records.splice(index,1);
            save();
            loadTable();
        };
        del.appendChild(btn);
    });
}

/* ADD */
function addRecord() {

    const station = document.getElementById("station").value.trim();
    const snow = document.getElementById("snow").value;
    const temp = document.getElementById("temp").value;
    const notes = document.getElementById("notes").value;

    if (!station || snow === "") {
        alert("Spot and snow required.");
        return;
    }

    const eeTime = getEETimestamp();
    const utcTime = new Date().toISOString();

    const gpsStatus = document.getElementById("gpsStatus");
    gpsStatus.innerText = "GPS: acquiring...";

    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat = pos.coords.latitude.toFixed(6);
            const lon = pos.coords.longitude.toFixed(6);
            const acc = Math.round(pos.coords.accuracy);

            gpsStatus.innerText = `GPS OK ±${acc}m`;

            records.push({station, ee:eeTime, utc:utcTime, snow, temp, lat, lon, acc, notes});
            save();
            loadTable();
            clearForm();
        },
        () => {
            gpsStatus.innerText = "GPS failed";
            records.push({station, ee:eeTime, utc:utcTime, snow, temp, notes});
            save();
            loadTable();
            clearForm();
        }
    );
}

function clearForm() {
    document.getElementById("station").value = "";
    document.getElementById("snow").value = "";
    document.getElementById("temp").value = "";
    document.getElementById("notes").value = "";
}

function clearStored() {
    if (!confirm("Delete ALL data?")) return;
    records = [];
    localStorage.removeItem("snowSpots");
    loadTable();
}

function exportCSV() {

    if (!records.length) return alert("No data.");

    let csv = "SpotID;DateTime_EE;DateTime_UTC;Snow_cm;Temp_C;Lat;Lon;Accuracy;Notes\n";

    records.forEach(r => {
        csv += `${r.station};${r.ee};${r.utc};${r.snow};${r.temp};${r.lat||""};${r.lon||""};${r.acc||""};${r.notes||""}\n`;
    });

    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "snow_spots_"+new Date().toISOString().slice(0,10)+".csv";
    link.click();
}

loadTable();

</script>

</body>
</html>
