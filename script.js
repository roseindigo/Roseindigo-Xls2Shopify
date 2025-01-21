document.getElementById('generateCSV').addEventListener('click', () => {
  const inputData = document.getElementById('inputData').value;
  const reference = document.getElementById('fileReference').value.trim();
  const previewTable = document.getElementById('previewTable');
  const downloadCSV = document.getElementById('downloadCSV');
  const baseURL = document.getElementById('baseURL').value.trim();
  const discount = parseFloat(document.getElementById('discount').value) || 0;
  const selectedSeason = document.getElementById('season').value;

  if (!inputData.trim()) {
    alert('Veuillez coller vos données dans le champ prévu.');
    return;
  }

  if (!reference) {
    alert('Veuillez entrer une référence pour nommer le fichier.');
    return;
  }

  const rows = inputData.split('\n').map(row => row.split('\t'));
  const headers = rows[0];

  const imageSrcIndex = headers.indexOf('Image Src');
  const handleIndex = headers.indexOf('Handle');
  const costIndex = headers.indexOf('Cost per item');
  const priceIndex = headers.indexOf('Variant Price');
  const compareAtPriceIndex = headers.indexOf('Variant Compare At Price');
  const seasonIndex = headers.indexOf('Saison (product.metafields.custom.saison)');

  if (imageSrcIndex === -1 || handleIndex === -1 || seasonIndex === -1) {
    alert('Les colonnes obligatoires (Handle, Image Src, Saison) sont introuvables !');
    return;
  }

  const newRows = [];
  const tbody = previewTable.querySelector('tbody');
  const thead = previewTable.querySelector('thead');

  // Clear previous table
  thead.innerHTML = '';
  tbody.innerHTML = '';

  // Push headers directly without escaping or quoting
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
    const season = row[seasonIndex]?.trim();

    // Apply the discount if the season matches the selected season
    if (season === selectedSeason && priceIndex !== -1) {
      const originalPrice = parseFloat(row[priceIndex]) || 0;
      const discountedPrice = (originalPrice * (1 - discount / 100)).toFixed(2).replace(',', '.');
      row[priceIndex] = discountedPrice;
    }

    // Format the "Cost per item" field
    if (costIndex !== -1 && row[costIndex]) {
      row[costIndex] = parseFloat(row[costIndex]).toFixed(2).replace(',', '.');
    }

    // Format the "Variant Compare At Price" field
    if (compareAtPriceIndex !== -1 && row[compareAtPriceIndex]) {
      row[compareAtPriceIndex] = parseFloat(row[compareAtPriceIndex]).toFixed(2).replace(',', '.');
    }

    images.forEach((image, index) => {
      const normalizedImage = image.trim().replace(/\.[^/.]+$/, ext => ext.toLowerCase());
      const fullImageUrl = baseURL + normalizedImage;

      if (index === 0) {
        row[imageSrcIndex] = fullImageUrl;
        row[headers.indexOf('Image Position')] = index + 1;
        newRows.push(row.map(escapeAndQuote).join(',')); // Apply `escapeAndQuote` to rows only
        addRowToTable(row);
      } else {
        const minimalRow = Array(headers.length).fill('');
        minimalRow[handleIndex] = handle;
        minimalRow[imageSrcIndex] = fullImageUrl;
        minimalRow[headers.indexOf('Image Position')] = index + 1;

        if (costIndex !== -1) minimalRow[costIndex] = '';
        if (priceIndex !== -1) minimalRow[priceIndex] = '';
        if (compareAtPriceIndex !== -1) minimalRow[compareAtPriceIndex] = '';

        newRows.push(minimalRow.map(escapeAndQuote).join(',')); // Apply `escapeAndQuote` to rows only
        addRowToTable(minimalRow);
      }
    });
  });

  function addRowToTable(rowData) {
    const tr = document.createElement('tr');
    rowData.forEach(cellData => {
      const td = document.createElement('td');
      td.textContent = escapeAndQuote(cellData).slice(1, -1); // Remove outer quotes for display
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

function escapeAndQuote(value) {
  if (value === null || value === undefined || value === '') return '""'; // Empty value

  const stringValue = String(value);

  // If already wrapped in quotes, remove them before processing
  const unwrappedValue = stringValue.replace(/^"(.*)"$/, '$1');

  // Escape inner quotes
  const escapedValue = unwrappedValue.replace(/"/g, '""');

  // Wrap the result in a single pair of quotes
  return `"${escapedValue}"`;
}

  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  const formattedTime = now.toTimeString().split(' ')[0].replace(/:/g, '_');
  const sanitizedReference = reference
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '');

  const fileName = `${formattedDate}-${formattedTime}-${sanitizedReference}.csv`;

  downloadCSV.dataset.csvData = '\ufeff' + newRows.join('\n');
  downloadCSV.dataset.fileName = fileName;
  downloadCSV.disabled = false;
});

document.getElementById('downloadCSV').addEventListener('click', () => {
  const csvData = document.getElementById('downloadCSV').dataset.csvData;
  const fileName = document.getElementById('downloadCSV').dataset.fileName;

  if (!csvData || !fileName) {
    alert('Données ou nom de fichier manquants !');
    return;
  }

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
});

document.addEventListener('DOMContentLoaded', () => {
  const scriptVersion = '1.0.7';
  const versionDiv = document.getElementById('scriptVersion');
  if (versionDiv) {
    versionDiv.textContent = `Script Version: ${scriptVersion}`;
  } else {
    console.error('Element with ID "scriptVersion" not found.');
  }
});