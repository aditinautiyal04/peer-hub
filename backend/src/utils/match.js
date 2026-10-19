const list = (s) => (s || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
// share of the smaller list that overlaps (0..1)
exports.overlap = (a, b) => {
  const A = list(a), B = new Set(list(b));
  if (!A.length || !B.size) return 0;
  return A.filter((x) => B.has(x)).length / Math.min(A.length, B.size);
};
// share of interests mentioned in free text (0..1)
exports.mentions = (interests, text) => {
  const I = list(interests); const t = (text || '').toLowerCase();
  return I.length ? I.filter((x) => t.includes(x)).length / I.length : 0;
};
