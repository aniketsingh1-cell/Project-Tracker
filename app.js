const sheetForm = document.getElementById('sheetForm');
const sheetUrlInput = document.getElementById('sheetUrl');
const sheetGidInput = document.getElementById('sheetGid');
const dataTable = document.getElementById('dataTable');
const emptyState = document.getElementById('emptyState');
const statusText = document.getElementById('statusText');

sheetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await loadSheetData();
});

loadSheetData();

async function loadSheetData() {
  try {
    statusText.textContent = 'Loading...';
    const sheetId = extractSheetId(sheetUrlInput.value.trim());
    const gid = sheetGidInput.value.trim();
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(gid)}`;

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Unable to fetch data (${response.status})`);
    }

    const csvText = await response.text();
    const rows = parseCsv(csvText);
    renderTable(rows);
    statusText.textContent = `Loaded ${Math.max(rows.length - 1, 0)} row(s).`;
  } catch (error) {
    statusText.textContent = `Error: ${error.message}`;
    renderTable([]);
  }
}

function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('Invalid Google Sheet URL.');
  return match[1];
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  return lines.map(splitCsvLine);
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function renderTable(rows) {
  dataTable.innerHTML = '';

  if (!rows.length) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  const [headers, ...dataRows] = rows;

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headers.forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  dataRows.forEach((row) => {
    const tr = document.createElement('tr');
    headers.forEach((_, index) => {
      const td = document.createElement('td');
      td.textContent = row[index] ?? '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  dataTable.appendChild(thead);
  dataTable.appendChild(tbody);
}
