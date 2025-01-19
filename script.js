document.getElementById('generateCSV').addEventListener('click', () => {
  const inputData = document.getElementById('inputData').value;
  const reference = document.getElementById('fileReference').value.trim();
  const previewTable = document.getElementById('previewTable');
  const downloadCSV = document.getElementById('downloadCSV');
  const baseURL = document.getElementById('baseURL').value.trim(); // Replace with your base URL

  if (!inputData.trim()) {
    alert('Veuillez coller vos données dans le champ prévu.');
    return;
  }

  if (!reference) {
    alert('Veuillez entrer une référence pour nommer le fichier.');
    return;
  }

  // Split rows by newline and columns by tabs
  const rows = inputData.split('\n').map(row => row.split('\t'));
  const headers = rows[0];

  // Find relevant column indices
  const imageSrcIndex = headers.indexOf('Image Src');
  const handleIndex = headers.indexOf('Handle');
  const costIndex = headers.indexOf('Cost per item');
  const priceIndex = headers.indexOf('Variant Price');

  if (imageSrcIndex === -1 || handleIndex === -1) {
    alert('Les colonnes obligatoires (Handle, Image Src) sont introuvables !');
    return;
  }

  // Add missing columns if not present
  // if (!headers.includes('Image Position')) headers.push('Image Position');

  const newRows = [];
  const tbody = previewTable.querySelector('tbody');
  const thead = previewTable.querySelector('thead');

  // Clear previous table
  thead.innerHTML = '';
  tbody.innerHTML = '';

  // Create table headers without quotes
  newRows.push(headers.join(','));
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
      const fullImageUrl = baseURL + image.trim(); // Prepend the base URL to the image URL

      if (index === 0) {
        // First image: Full row
        row[imageSrcIndex] = fullImageUrl; // Update the 'Image Src' cell to contain the full URL
        row[headers.indexOf('Image Position')] = index + 1; // Add Image Position
        newRows.push(row.map(smartQuote).join(',')); // Add the row to the CSV
        addRowToTable(row); // Display the row in the preview table
      } else {
        // Additional images: Minimal row, ensure no prices or costs
        const minimalRow = Array(headers.length).fill('');
        minimalRow[handleIndex] = handle;
        minimalRow[imageSrcIndex] = fullImageUrl; // Use the full URL
        minimalRow[headers.indexOf('Image Position')] = index + 1;

        // Explicitly leave numeric fields blank
        if (costIndex !== -1) minimalRow[costIndex] = ''; // Cost per item
        if (priceIndex !== -1) minimalRow[priceIndex] = ''; // Variant Price

        newRows.push(minimalRow.map(smartQuote).join(','));
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

  function smartQuote(value) {
    if (value === null || value === undefined) return ''; // Return empty for null/undefined
    return String(value).includes(',') ? `"${String(value).replace(/"/g, '""')}"` : value; // Quote if comma
  }

  // Generate a file name based on the reference and the current date/time
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const formattedTime = now.toTimeString().split(' ')[0]; // Format: HH:MM:SS
  const sanitizedReference = reference.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/[^a-zA-Z0-9-]/g, ''); // Remove special characters

  const fileName = `${formattedDate}-${formattedTime}-${sanitizedReference}.csv`;

  // Set CSV data in the button's dataset
  downloadCSV.dataset.csvData = '\ufeff' + newRows.join('\n'); // Add BOM for UTF-8 encoding
  downloadCSV.dataset.fileName = fileName;

  // Enable download button
  downloadCSV.disabled = false;
});

document.getElementById('downloadCSV').addEventListener('click', () => {
  const csvData = document.getElementById('downloadCSV').dataset.csvData;
  const fileName = document.getElementById('downloadCSV').dataset.fileName;

  if (!csvData || !fileName) {
    alert('Données ou nom de fichier manquants !');
    return;
  }

  // Create a blob with UTF-8 encoding
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a); // Append anchor to body
  a.click();
  document.body.removeChild(a); // Remove anchor after clicking

  URL.revokeObjectURL(url); // Clean up
});