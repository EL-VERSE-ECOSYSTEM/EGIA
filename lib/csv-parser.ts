export function parseCSV(text: string) {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',').map(v => v.trim());
    const entry: any = {};
    headers.forEach((header, index) => {
      entry[header] = values[index];
    });
    data.push(entry);
  }

  return data;
}

export function validateQuestionCSV(data: any[]) {
  const requiredFields = ['questionText', 'questionType', 'marks'];
  return data.every(row => requiredFields.every(field => field in row));
}
