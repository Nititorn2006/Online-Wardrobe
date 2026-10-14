var label = maestro.copiedText;
var match = /^(?:Add (.+) to favorites|Remove (.+) from favorites)$/.exec(label);
if (!match) {
  throw new Error('Cannot read favorite item from label: ' + label);
}
output.favoriteItemName = match[1] || match[2];
var escapedName = output.favoriteItemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
output.addFavoriteSelector = '^Add ' + escapedName + ' to favorites$';
output.removeFavoriteSelector = '^Remove ' + escapedName + ' from favorites$';
console.log('Favorite test item: ' + output.favoriteItemName);
