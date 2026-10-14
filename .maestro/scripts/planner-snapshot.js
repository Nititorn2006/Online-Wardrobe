if (PHASE === 'before') {
  output.plannerBefore = maestro.copiedText;
} else {
  var text = String(maestro.copiedText);
  if (text === output.plannerBefore) throw new Error('Try another did not change the outfit');
  var names = text.replace(/^Ready: /, '').split(' · ');
  if (names.length < 2) throw new Error('Incomplete planner outfit');
  output.savedTop = names[0];
  output.savedBottom = names[1];
  output.savedMetadataSelector = 'Work / school · Smart casual · ' + names.length + ' pieces';
}
