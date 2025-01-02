document.getElementById('generateCSV').addEventListener('click', () => {
  const inputData = document.getElementById('inputData').value;
  const previewTable = document.getElementById('previewTable');
  const downloadCSV = document.getElementById('downloadCSV');

  if (!inputData.trim()) {
    alert('Please paste your data!');
    return;
  }

  // Split rows by newline and columns by tabs
  const rows = inputData.split('\n').map(row => row.split('\t'));
  const headers = rows[0];

  // Find relevant column indices
  const imageSrcIndex = headers.indexOf('Image Src');
  const handleIndex = headers.indexOf('Handle');

  if (imageSrcIndex === -1 || handleIndex === -1) {
    alert('Required columns (Handle, Image Src) not found!');
    return;
  }

  // Add "Image Position" if not present
  if (!headers.includes('Image Position')) {
    headers.push('Image Position');
  }

  const newRows = [headers.join(',')];
  const tbody = previewTable.querySelector('tbody');
  const thead = previewTable.querySelector('thead');

  // Clear previous table
  thead.innerHTML = '';
  tbody.innerHTML = '';

  // Create table headers
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Process each row
  rows.slice(1).forEach(row => {
    const handle = row[handleIndex];
    const images = row[imageSrcIndex]?.split(';') || [];

    images.forEach((image, index) => {
      if (index === 0) {
        // First image: Full row
        row[headers.indexOf('Image Position')] = index + 1; // Add Image Position
        newRows.push(row.join(','));
        addRowToTable(row);
      } else {
        // Additional images: Minimal row
        const minimalRow = Array(headers.length).fill('');
        minimalRow[handleIndex] = handle;
        minimalRow[imageSrcIndex] = image.trim();
        minimalRow[headers.indexOf('Image Position')] = index + 1;
        newRows.push(minimalRow.join(','));
        addRowToTable(minimalRow);
      }
    });
  });

  function addRowToTable(rowData) {
    const tr = document.createElement('tr');
    rowData.forEach(cellData => {
      const td = document.createElement('td');
      td.textContent = cellData || '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  // Set CSV data in the button's dataset
  downloadCSV.dataset.csvData = newRows.join('\n');

  // Enable download button
  downloadCSV.disabled = false;
});

document.getElementById('downloadCSV').addEventListener('click', () => {
  const csvData = document.getElementById('downloadCSV').dataset.csvData;

  if (!csvData) {
    alert('No data available to download!');
    return;
  }

  // Create a blob and download it as a CSV file
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'shopify_import.csv';
  document.body.appendChild(a); // Append anchor to body
  a.click();
  document.body.removeChild(a); // Remove anchor after clicking

  URL.revokeObjectURL(url); // Clean up
});