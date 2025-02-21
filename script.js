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

function formatPrice(value_in) {
    console.log("value_in:", value_in, "| Type:", typeof value_in);

    if (value_in == null || value_in === "" || value_in === undefined) {
        console.warn("⚠️ Warning: Received an invalid value, returning '0.00'");
        return "0.00"; // Prevents toFixed() error
    }

    let num;

    if (typeof value_in === "string") {
        value_in = value_in.replace(",", "."); // Ensure decimal separator is dot
        num = parseFloat(value_in);
        console.log("String -> num:", num);
    } else {
        num = value_in;
    }

    if (isNaN(num)) {
        console.warn("⚠️ Warning: Invalid number, returning '0.00'");
        return "0.00";
    }

    console.log("Parsed number:", num, "| Type:", typeof num);
    return num.toFixed(2); // Always returns a string with two decimals
}


  // Process each row
  rows.slice(1).forEach(row => {
    const handle = row[handleIndex];
    const images = row[imageSrcIndex]?.split(';') || [];
    const season = row[seasonIndex]?.trim();
    console.log("ROOWWWWWWWWW")
    // Apply discount if applicable
    console.log("Processing Row: ", row);
    console.log("--Season:", season, "| Selected Season:", selectedSeason);

    const originalPrice = formatPrice(row[priceIndex]) || 0;

    if (!isNaN(originalPrice) && originalPrice > 0) {
        if (season === selectedSeason) {
            console.log("--Applying Discount: ", discount, "%");
            row[priceIndex] = formatPrice(originalPrice * (1 - discount / 100));
            console.log("--Price After Discount:", row[priceIndex]);
        } else {
            console.log("--No Discount, Keeping Original Price");
            row[priceIndex] = formatPrice(originalPrice);
        }
    }

    // Format "Variant Compare At Price"
    if (compareAtPriceIndex !== -1) {
      console.log("--Compare Price Before:", row[compareAtPriceIndex]);
      row[compareAtPriceIndex] = formatPrice(row[compareAtPriceIndex]);
      console.log("--Compare Price After:", row[compareAtPriceIndex]);
    }

    if (costIndex !== -1) {
      console.log("--Cost Before:", row[costIndex]);
      row[costIndex] = formatPrice(row[costIndex]);
      console.log("--Cost After:", row[costIndex]);
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
    const unwrappedValue = stringValue.replace(/^"(.*)"$/, '$1'); // Remove quotes
    const escapedValue = unwrappedValue.replace(/"/g, '""');

    return `"${escapedValue}"`; // Wrap in quotes
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
  const scriptVersion = '1.1.1';
  const versionDiv = document.getElementById('scriptVersion');
  if (versionDiv) {
    versionDiv.textContent = `Script Version: ${scriptVersion}`;
  } else {
    console.error('Element with ID "scriptVersion" not found.');
  }
});