var count = parseInt(maestro.copiedText.replace(/^Save /, ""), 10);
if (!(count >= 2)) throw new Error("Invalid outfit item count");
output.savedMetadataSelector = "Work / school · Smart casual · " + count + " pieces";
