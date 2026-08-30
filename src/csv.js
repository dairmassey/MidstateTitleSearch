export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [rawHeaders = [], ...dataRows] = rows;
  const headers = rawHeaders.map(header =>
    header.replace(/^\uFEFF/, '').trim(),
  );

  return dataRows
    .map((values, index) => ({
      id: String(index + 1),
      ...Object.fromEntries(
        headers.map((header, valueIndex) => [
          header,
          (values[valueIndex] || '').trim(),
        ]),
      ),
    }))
    .filter(record => record.name);
}

export function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreRecord(record, query) {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(' ').filter(Boolean);
  const fields = {
    name: normalize(record.name),
    address: normalize(record.address),
    county: normalize(record.county),
    invoice: normalize(record.invoice_number),
    date: normalize(record.date),
  };

  if (
    !terms.every(term =>
      Object.values(fields).some(fieldValue => fieldValue.includes(term)),
    )
  ) {
    return -1;
  }

  let score = 0;
  if (fields.name === normalizedQuery) score += 1000;
  else if (fields.name.startsWith(normalizedQuery)) score += 500;
  else if (fields.name.includes(normalizedQuery)) score += 300;
  if (fields.address.includes(normalizedQuery)) score += 120;
  if (fields.county === normalizedQuery) score += 100;
  if (fields.invoice === normalizedQuery) score += 90;
  if (fields.date === normalizedQuery) score += 80;
  score += terms.filter(term => fields.name.includes(term)).length * 20;
  return score;
}

export function searchRecords(records, query) {
  if (!normalize(query)) return [];

  return records
    .map(record => ({record, score: scoreRecord(record, query)}))
    .filter(result => result.score >= 0)
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.record.name.localeCompare(second.record.name),
    )
    .map(result => result.record);
}

export function hasExactName(records, query) {
  const normalizedQuery = normalize(query);
  return records.some(record => normalize(record.name) === normalizedQuery);
}

export function formatDate(value) {
  if (!value) return '—';
  const parts = value.split('/').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return value;
  const [month, day, year] = parts;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}
