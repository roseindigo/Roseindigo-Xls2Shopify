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

  // Error tracking
  const errors = {
    '#REF!': 0,
    '#VALUE!': 0,
    '#DIV/0!': 0,
    '#NAME?': 0,
    '#N/A': 0,
    '#NUM!': 0,
    '#NULL!': 0,
    '#GETTING_DATA': 0
  };
  const errorCells = []; // Store {row, col, value, type} for highlighting

  // Clear previous table and warnings
  thead.innerHTML = '';
  tbody.innerHTML = '';
  clearWarningPanel();

  // Push headers directly without escaping or quoting
  newRows.push(headers.join(','));
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Helper function to detect Excel errors
  function detectError(value) {
    if (value == null || value === undefined) return null;
    const strValue = String(value).trim();

    const errorTypes = ['#REF!', '#VALUE!', '#DIV/0!', '#NAME?', '#N/A', '#NUM!', '#NULL!', '#GETTING_DATA'];

    for (const errorType of errorTypes) {
      if (strValue === errorType) {
        return errorType;
      }
    }

    return null;
  }

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
    const rowIndex = tbody.children.length;

    rowData.forEach((cellData, colIndex) => {
      const td = document.createElement('td');
      const displayValue = escapeAndQuote(cellData).slice(1, -1); // Remove outer quotes for display
      td.textContent = displayValue;

      // Check for errors
      const errorType = detectError(cellData);
      if (errorType) {
        td.classList.add('error-cell');
        td.title = `Excel Error: ${errorType}`;
        errors[errorType]++;
        errorCells.push({ row: rowIndex, col: colIndex, value: cellData, type: errorType });
      }

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

  // Display warning panel if errors found
  displayWarningPanel(errors, errorCells.length);
});

// Helper function to clear warning panel
function clearWarningPanel() {
  const existingPanel = document.getElementById('warningPanel');
  if (existingPanel) {
    existingPanel.remove();
  }
}

// Helper function to display warning panel
function displayWarningPanel(errors, totalErrors) {
  clearWarningPanel();

  if (totalErrors === 0) return; // No errors, no panel

  const panel = document.createElement('div');
  panel.id = 'warningPanel';
  panel.className = 'warning-panel';

  const title = document.createElement('h3');
  title.textContent = `⚠️ ${totalErrors} erreur${totalErrors > 1 ? 's' : ''} détectée${totalErrors > 1 ? 's' : ''}`;
  panel.appendChild(title);

  const errorList = document.createElement('ul');
  for (const [errorType, count] of Object.entries(errors)) {
    if (count > 0) {
      const li = document.createElement('li');
      li.textContent = `${errorType}: ${count} occurrence${count > 1 ? 's' : ''}`;
      errorList.appendChild(li);
    }
  }
  panel.appendChild(errorList);

  const message = document.createElement('p');
  message.textContent = 'Les cellules avec des erreurs sont surlignées en rouge dans le tableau.';
  panel.appendChild(message);

  // Insert panel before the preview table
  const previewTable = document.getElementById('previewTable');
  previewTable.parentNode.insertBefore(panel, previewTable);
}

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
  const scriptVersion = '1.2.0';
  const versionDiv = document.getElementById('scriptVersion');
  if (versionDiv) {
    versionDiv.textContent = `Script Version: ${scriptVersion}`;
  } else {
    console.error('Element with ID "scriptVersion" not found.');
  }
});