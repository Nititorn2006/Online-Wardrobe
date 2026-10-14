if (output.savedCountAfter !== output.savedCountBefore - 1) throw new Error('Saved outfit count did not decrease by one');
if (output.clothesCountAfter !== output.clothesCountBefore) throw new Error('Deleting outfit changed clothing count');
