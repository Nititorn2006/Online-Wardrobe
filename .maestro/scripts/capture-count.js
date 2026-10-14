var match = String(maestro.copiedText).match(/[0-9]+/);
if (!match) throw new Error('Cannot read count: ' + maestro.copiedText);
output[KEY] = parseInt(match[0], 10);
