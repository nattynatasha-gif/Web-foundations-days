// Select all required elements
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

const MAX_CHARS = 200;
const WARNING_THRESHOLD = 180;

// Update character and word counters + warning classes
function updateCounts() {
  const text = noteText.value;
  const charLength = text.length;

  // Character count
  charCount.textContent = `${charLength} / ${MAX_CHARS} characters`;

  // Word count (split on whitespace, filter empty strings)
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  wordCount.textContent = `${words} word${words === 1 ? "" : "s"}`;

  // Warning / over classes
  charCount.classList.remove("warning", "over");
  if (charLength > MAX_CHARS) {
    charCount.classList.add("over");
  } else if (charLength > WARNING_THRESHOLD) {
    charCount.classList.add("warning");
  }
}

// Save draft to localStorage
function saveDraft() {
  localStorage.setItem("noteDraft", noteText.value);
}

// Clear everything
function clearAll() {
  noteText.value = "";
  localStorage.removeItem("noteDraft");
  updateCounts();
}

// Theme handling
function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "Dark mode";
  }
}

function toggleTheme() {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Event listeners
noteText.addEventListener("input", () => {
  updateCounts();
  saveDraft();
});

clearBtn.addEventListener("click", clearAll);

// Escape key clears the textarea
noteText.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    clearAll();
  }
});

themeToggle.addEventListener("click", toggleTheme);

// On page load: restore draft and theme, then update counts
document.addEventListener("DOMContentLoaded", () => {
  // Restore draft
  const savedDraft = localStorage.getItem("noteDraft");
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }

  // Restore theme
  const savedTheme = localStorage.getItem("theme");
  applyTheme(savedTheme === "dark");

  // Initial count update
  updateCounts();
});
