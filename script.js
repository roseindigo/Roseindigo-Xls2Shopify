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
  const costIndex = headers.indexOf('Cost per item');
  const priceIndex = headers.indexOf('Variant Price');
  const fulfillmentIndex = headers.indexOf('Fulfillment service');
  const inventoryPolicyIndex = headers.indexOf('Inventory policy');

  if (imageSrcIndex === -1 || handleIndex === -1) {
    alert('Required columns (Handle, Image Src) not found!');
    return;
  }

  // Add missing columns if not present
  if (!headers.includes('Image Position')) headers.push('Image Position');
  if (fulfillmentIndex === -1) headers.push('Fulfillment service');
  if (inventoryPolicyIndex === -1) headers.push('Inventory policy');

  const newRows = [headers.map(quoteValue).join(',')];
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
        row[costIndex] = row[costIndex] || '0'; // Default Cost per item
        row[priceIndex] = row[priceIndex] || '0'; // Default Variant Price
        row[fulfillmentIndex] = row[fulfillmentIndex] || 'manual'; // Default Fulfillment service
        row[inventoryPolicyIndex] = row[inventoryPolicyIndex] || 'deny'; // Default Inventory policy
        newRows.push(row.map(quoteValue).join(','));
        addRowToTable(row);
      } else {
        // Additional images: Minimal row, ensure all required fields
        const minimalRow = Array(headers.length).fill('');
        minimalRow[handleIndex] = handle;
        minimalRow[imageSrcIndex] = image.trim();
        minimalRow[headers.indexOf('Image Position')] = index + 1;
        minimalRow[costIndex] = '0'; // Default Cost per item
        minimalRow[priceIndex] = '0'; // Default Variant Price
        minimalRow[fulfillmentIndex] = 'manual'; // Default Fulfillment service
        minimalRow[inventoryPolicyIndex] = 'deny'; // Default Inventory policy
        newRows.push(minimalRow.map(quoteValue).join(','));
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

  function quoteValue(value) {
    if (value === null || value === undefined) return '""'; // Ensure null/undefined are empty quotes
    return `"${String(value).replace(/"/g, '""')}"`; // Escape existing quotes and wrap in quotes
  }

  // Set CSV data in the button's dataset
  downloadCSV.dataset.csvData = '\ufeff' + newRows.join('\n'); // Add BOM for UTF-8 encoding

  // Enable download button
  downloadCSV.disabled = false;
});

document.getElementById('downloadCSV').addEventListener('click', () => {
  const csvData = document.getElementById('downloadCSV').dataset.csvData;

  if (!csvData) {
    alert('No data available to download!');
    return;
  }

  // Create a blob with UTF-8 encoding
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