// Starting data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

/**
 * Returns an array of notes whose text contains the given word (case-insensitive).
 */
function searchNotes(word) {
  const lowerWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(lowerWord));
}

/**
 * Returns the note object with the most characters, or null if there are no notes.
 */
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  return notes.reduce((longest, current) => {
    return current.text.length > longest.text.length ? current : longest;
  });
}

/**
 * Returns an object counting notes per category.
 */
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    const cat = note.category;
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

/**
 * Returns a summary sentence of the notes.
 * Uses "note" for exactly one note and "notes" otherwise.
 */
function getSummary() {
  const total = notes.length;
  const counts = countByCategory();
  const parts = Object.entries(counts).map(([cat, count]) => `${count} ${cat}`);
  const noteWord = total === 1 ? "note" : "notes";
  return `${total} ${noteWord}: ${parts.join(", ")}.`;
}

/**
 * Returns true if a note with the same text already exists (ignoring case and extra spaces).
 */
function isDuplicate(text) {
  const normalized = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === normalized);
}

/**
 * Adds a note only if it is 1–200 characters, is not a duplicate,
 * and the category is one of personal, work or study.
 * Returns true when added and false otherwise, logging the reason.
 */
function addNote(text, category) {
  const allowedCategories = ["personal", "work", "study"];
  const trimmed = text.trim();

  if (trimmed.length < 1 || trimmed.length > 200) {
    console.log("Reason: text must be between 1 and 200 characters");
    return false;
  }

  if (isDuplicate(trimmed)) {
    console.log("Reason: duplicate note");
    return false;
  }

  if (!allowedCategories.includes(category)) {
    console.log("Reason: category must be personal, work or study");
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: newId, text: trimmed, category });
  return true;
}

// ==================== TESTS ====================

// searchNotes – normal case
console.log(searchNotes("javascript")); 
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]

// searchNotes – edge case (no results)
console.log(searchNotes("xyz")); 
// Expected: []

// longestNote – normal case
console.log(longestNote()); 
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

// longestNote – edge case (empty array)
const originalNotes = notes;
notes = [];
console.log(longestNote()); 
// Expected: null
notes = originalNotes; // restore

// countByCategory – normal case
console.log(countByCategory()); 
// Expected: { personal: 2, work: 1, study: 2 }

// countByCategory – edge case (after adding a note)
addNote("Buy more milk", "personal");
console.log(countByCategory()); 
// Expected: { personal: 3, work: 1, study: 2 }

// getSummary – normal case (after the previous add)
console.log(getSummary()); 
// Expected: "6 notes: 3 personal, 1 work, 2 study."

// getSummary – edge case (single note)
notes = [{ id: 1, text: "Only one", category: "personal" }];
console.log(getSummary()); 
// Expected: "1 note: 1 personal."
notes = originalNotes; // restore (but we already mutated – restore properly below)

// Restore original notes for remaining tests
notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// isDuplicate – normal case (exists)
console.log(isDuplicate("  Call Mum  ")); 
// Expected: true

// isDuplicate – edge case (does not exist)
console.log(isDuplicate("Go for a walk")); 
// Expected: false

// addNote – normal case (successful add)
console.log(addNote("Prepare presentation slides", "work")); 
// Expected: true  (and note is added)

// addNote – edge case (duplicate)
console.log(addNote("Buy milk and bread", "personal")); 
// Expected: false  (logs "Reason: duplicate note")

// addNote – edge case (invalid length)
console.log(addNote("", "study")); 
// Expected: false  (logs "Reason: text must be between 1 and 200 characters")

// addNote – edge case (invalid category)
console.log(addNote("Valid text here", "hobby")); 
// Expected: false  (logs "Reason: category must be personal, work or study")
