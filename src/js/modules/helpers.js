import { dom, updateStatus } from './ui.js';
import { sendScanToServer } from './api.js';
import { saveScanToHistory } from './history.js';

export async function enumerateDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    dom.cameraSwitchBtn.style.display = devices.filter(d => d.kind === 'videoinput').length > 1 ? 'flex' : 'none';
  } catch (error) {
    console.error('Error enumerating devices:', error);
    dom.cameraSwitchBtn.style.display = 'none';
  }
}

export function handleManualSubmit(event) {
  event.preventDefault();
  const barcodeValue = dom.barcodeInput.value.trim();
  const locationValue = dom.locationInput.value.trim() || 'Unknown Location';
  const vinValue = dom.vinInput.value.trim() || '';
  if (barcodeValue) {
    updateStatus(`Manual entry: ${barcodeValue} at ${locationValue}`);
    dom.barcodeInput.value = '';
    const scanRecord = { 
      barcode: barcodeValue, 
      location: locationValue, 
      vin: vinValue,
      timestamp: new Date().toISOString(), 
      method: 'manual' 
    };
    saveScanToHistory(scanRecord);
    sendScanToServer(scanRecord);
  } else {
    updateStatus('Please enter a valid barcode');
  }
}
