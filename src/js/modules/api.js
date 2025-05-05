import { updateStatus } from '../modules/ui.js';

const API_BASE_URL = 'https://0d1e-2607-fea8-439d-ba00-f4d4-8a72-f2dd-b1a.ngrok-free.app';

export async function sendScanToServer(scanRecord) {
  try {
    updateStatus(`Sending ${scanRecord.barcode} to server...`);
    const response = await fetch(`${API_BASE_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scanRecord)
    });
    if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
    const data = await response.json();
    updateStatus(`Server: ${data.message}`);
    return data;
  } catch (error) {
    console.error('Error sending scan to server:', error);
    updateStatus(`Error: Could not send to server. ${error.message}`);
    return null;
  }
}

export async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scan`, { method: 'GET' });
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