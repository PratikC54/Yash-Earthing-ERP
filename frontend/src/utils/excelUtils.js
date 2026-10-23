import * as XLSX from "xlsx";

// Export array of objects to Excel .xlsx file
export function exportToExcel(data, fileName = "Export_Data", sheetName = "Sheet1") {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Create worksheet from JSON
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Auto-fit column widths
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    const maxValLength = Math.max(
      ...data.map((row) => String(row[key] || "").length),
      key.length
    );
    return { wch: Math.min(Math.max(maxValLength + 2, 12), 40) };
  });
  ws["!cols"] = colWidths;

  // Generate file and trigger download
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Parse Excel (.xlsx, .xls) or CSV file into array of JSON objects
export function importFromExcel(file, onComplete, onError) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (onComplete) {
        onComplete(jsonData);
      }
    } catch (err) {
      console.error("Error parsing Excel file:", err);
      if (onError) {
        onError(err);
      } else {
        alert("Failed to parse the Excel file. Please ensure it is a valid .xlsx or .csv file.");
      }
    }
  };

  reader.onerror = (err) => {
    if (onError) onError(err);
  };

  reader.readAsArrayBuffer(file);
}
