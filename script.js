document.getElementById('generateCSV').addEventListener('click', () => {
  const inputData = document.getElementById('inputData').value;
  const outputData = document.getElementById('outputData');
  const downloadCSV = document.getElementById('downloadCSV');

  if (!inputData.trim()) {
    alert('Please paste your data!');
    return;
  }

  // Split rows by newline and columns by tabs
  const rows = inputData.split('\n').map(row => row.split('\t'));
  const headers = rows[0];

  // Find the indices of relevant columns
  const imageSrcIndex = headers.indexOf('Image Src');
  const handleIndex = headers.indexOf('Handle');

  if (imageSrcIndex === -1 || handleIndex === -1) {
    alert('Required columns (Handle, Image Src) not found!');
    return;
  }

  // Add "Image Position" column if not present
  if (!headers.includes('Image Position')) {
    headers.push('Image Position');
  }
  const newRows = [headers.join(',')];

  // Process each row
  rows.slice(1).forEach(row => {
    const handle = row[handleIndex];
    const imageSrc = row[imageSrcIndex]?.split(';') || [];

    imageSrc.forEach((image, index) => {
      if (index === 0) {
        // For the first image, keep the original row
        row.push(index + 1); // Add Image Position
        newRows.push(row.join(','));
      } else {
        // For subsequent images, create a new row
        const newRow = new Array(headers.length).fill('');
        newRow[handleIndex] = handle; // Keep the Handle
        newRow[imageSrcIndex] = image.trim(); // Add the Image Src
        newRow[headers.indexOf('Image Position')] = index + 1; // Add Image Position
        newRows.push(newRow.join(','));
      }
    });
  });

  // Set the output and enable download
  outputData.value = newRows.join('\n');
  downloadCSV.disabled = false;

  // Store CSV data for download
  downloadCSV.dataset.csvData = newRows.join('\n');
});

document.getElementById('downloadCSV').addEventListener('click', () => {
  const csvData = document.getElementById('downloadCSV').dataset.csvData;

  // Create a blob and download it as a CSV file
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'shopify_import.csv';
  a.click();

  URL.revokeObjectURL(url); // Clean up
});