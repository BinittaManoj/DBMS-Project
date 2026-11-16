async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Request failed');
    }
    return await response.json();
}

function renderTable(rows, columns) {
    if (!rows || rows.length === 0) {
        return '<div class="alert alert-info">No records available.</div>';
    }

    const head = columns.map((c) => `<th>${c.label}</th>`).join('');
    const body = rows.map((row) => {
        const cells = columns.map((c) => `<td>${row[c.key] ?? ''}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    return `
    <table class="table table-striped table-hover">
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}
