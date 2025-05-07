import { updateStatus } from '../modules/ui.js';

const API_BASE_URL = 'https://ee3f-2607-fea8-439d-ba00-19ff-2ba5-447d-bb43.ngrok-free.app';

export async function sendScanToServer(scanRecord) {
  try {
    updateStatus(`Sending ${scanRecord.barcode} to server...`);
    const response = await fetch(`${API_BASE_URL}/api/scan`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'  // Add this header
      },
      body: JSON.stringify(scanRecord)
    });
    
    if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
    const data = await response.json();
    updateStatus(`Server: ${data.message}`);
    
    // After successful scan, fetch part details
    await fetchAndDisplayPartDetails(scanRecord.barcode);
    
    return data;
  } catch (error) {
    console.error('Error sending scan to server:', error);
    updateStatus(`Error: Could not send to server. ${error.message}`);
    return null;
  }
}

export async function fetchAndDisplayPartDetails(partNumber) {
  try {
    updateStatus(`Fetching details for part #${partNumber}...`);
    
    // Create new endpoint URL for part details
    const response = await fetch(`${API_BASE_URL}/api/part/${partNumber}`, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true'  // Add this header
      }
    });
    
    if (!response.ok) throw new Error(`Could not fetch part details: ${response.status}`);
    
    const partData = await response.json();
    
    // Create or get the results container
    let resultsContainer = document.getElementById('scan-results');
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.id = 'scan-results';
      resultsContainer.className = 'scan-results';
      document.querySelector('.app-container').appendChild(resultsContainer);
    }
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    // Create HTML for the part information
    const html = `
      <div class="result-card">
        <div class="result-header">
          <h2>Part Information</h2>
          <span class="part-number">#${partData.part_number || partNumber}</span>
        </div>
        
        <div class="result-section">
          <h3>Description</h3>
          <p>${partData.description || 'No description available'}</p>
        </div>
        
        ${partData.vin ? `
        <div class="result-section">
          <h3>Vehicle Information</h3>
          <div class="vehicle-info">
            <p><strong>VIN:</strong> ${partData.vin || 'N/A'}</p>
            <p><strong>Year:</strong> ${partData.year || 'N/A'}</p>
            <p><strong>Make:</strong> ${partData.make || 'N/A'}</p>
            <p><strong>Model:</strong> ${partData.model || 'N/A'}</p>
            <p><strong>Trim:</strong> ${partData.trim || 'N/A'}</p>
            <p><strong>Engine:</strong> ${partData.engine || 'N/A'}</p>
          </div>
        </div>` : ''}
        
        ${partData.fitments && partData.fitments.length > 0 ? `
        <div class="result-section">
          <h3>Compatible With</h3>
          <div class="fitments-list">
            ${partData.fitments.map(fitment => `
              <div class="fitment-item">
                <p>${fitment.year} ${fitment.make} ${fitment.model} ${fitment.trim || ''}</p>
                <p class="engine-info">${fitment.engines ? fitment.engines.join(', ') : 'N/A'}</p>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
      </div>
    `;
    
    // Insert the HTML
    resultsContainer.innerHTML = html;
    
    // Add CSS if needed
    if (!document.getElementById('scan-results-styles')) {
      const style = document.createElement('style');
      style.id = 'scan-results-styles';
      style.textContent = `
        .scan-results {
          margin-top: 20px;
          padding: 0 15px;
          max-width: 100%;
        }
        .result-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .result-header {
          background: #0056b3;
          color: white;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .result-header h2 {
          margin: 0;
          font-size: 1.2rem;
        }
        .part-number {
          font-family: monospace;
          font-weight: bold;
        }
        .result-section {
          padding: 15px;
          border-bottom: 1px solid #eee;
        }
        .result-section h3 {
          margin-top: 0;
          color: #333;
          font-size: 1rem;
        }
        .vehicle-info {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }
        .vehicle-info p {
          margin: 5px 0;
        }
        .fitments-list {
          max-height: 200px;
          overflow-y: auto;
        }
        .fitment-item {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .fitment-item p {
          margin: 3px 0;
        }
        .engine-info {
          font-size: 0.9em;
          color: #666;
        }
      `;
      document.head.appendChild(style);
    }
    
    updateStatus(`Part #${partNumber} information displayed`);
    
  } catch (error) {
    console.error('Error fetching part details:', error);
    updateStatus(`Error: Could not fetch part details. ${error.message}`);
  }
}

export async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scan`, { 
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true'  // Add this header
      }
    });
    if (response.ok) {
      updateStatus('Server connected successfully');
      return true;
    } else {
      updateStatus(`Server error: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Error connecting to server:', error);
    updateStatus('Server not connected. Make sure Flask is running');
    return false;
  }
}