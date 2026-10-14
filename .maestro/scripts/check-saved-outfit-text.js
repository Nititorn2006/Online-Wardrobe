var actual = String(maestro.copiedText).replace(/\s+/g, ' ').trim().toLowerCase();
var expected = String(output[EXPECTED_KEY]).replace(/\s+/g, ' ').trim().toLowerCase();
if (actual !== expected) {
  throw new Error('Saved outfit ' + EXPECTED_KEY + ' mismatch: expected ' + expected + ', got ' + actual);
}
