export function saveScanToHistory(scanRecord) {
    try {
      const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
      history.push(scanRecord);
      localStorage.setItem('scanHistory', JSON.stringify(history.slice(-100)));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }