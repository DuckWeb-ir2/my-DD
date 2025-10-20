// notes.js
// NEW: Import showMessage and showCustomConfirm directly from script.js
import { showMessage, showCustomConfirm, displaySelectedContent } from './script.js';

// --- Note Modal Elements ---
const noteModal = document.getElementById('noteModal');
const closeNoteModalBtn = document.getElementById('closeNoteModalBtn');
const noteContentInput = document.getElementById('noteContent');
const noteDirectionSelect = document.getElementById('noteDirection');
const noteThemePalette = document.getElementById('noteThemePalette'); // Reference to the color palette container
const saveNoteBtn = document.getElementById('saveNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');

// State to hold the ID of the document and heading for the current note being edited
let currentNoteContext = {
    docUniqueId: null,
    headingId: null // This will be the ID of the HTML heading element
};

// --- LOCAL STORAGE KEY for Notes ---
const LOCAL_STORAGE_KEY_NOTES = 'readmeNotesData';
// Structure: { docUniqueId: { headingId: { content: "...", direction: "ltr", theme: "blue" } } }
let notesData = {};

// Define available note themes and their Tailwind CSS classes
const noteThemes = {
    "blue": {
        name: "Blue",
        colorClass: "bg-blue-500 hover:bg-blue-600", // For swatch button
        bgLight: "bg-blue-50",
        bgDark: "dark:bg-blue-900",
        borderLight: "border-blue-200",
        borderDark: "dark:border-blue-700",
        titleLight: "text-blue-800",
        titleDark: "dark:text-blue-300"
    },
    "green": {
        name: "Green",
        colorClass: "bg-green-500 hover:bg-green-600",
        bgLight: "bg-green-50",
        bgDark: "dark:bg-green-900",
        borderLight: "border-green-200",
        borderDark: "dark:border-green-700",
        titleLight: "text-green-800",
        titleDark: "dark:text-green-300"
    },
    "yellow": {
        name: "Yellow",
        colorClass: "bg-yellow-500 hover:bg-yellow-600",
        bgLight: "bg-yellow-50",
        bgDark: "dark:bg-yellow-900",
        borderLight: "border-yellow-200",
        borderDark: "dark:border-yellow-700",
        titleLight: "text-yellow-800",
        titleDark: "dark:text-yellow-300"
    },
    "purple": {
        name: "Purple",
        colorClass: "bg-purple-500 hover:bg-purple-600",
        bgLight: "bg-purple-50",
        bgDark: "dark:bg-purple-900",
        borderLight: "border-purple-200",
        borderDark: "dark:border-purple-700",
        titleLight: "text-purple-800",
        titleDark: "dark:text-purple-300"
    },
    "red": {
        name: "Red",
        colorClass: "bg-red-500 hover:bg-red-600",
        bgLight: "bg-red-50",
        bgDark: "dark:bg-red-900",
        borderLight: "border-red-200",
        borderDark: "dark:border-red-700",
        titleLight: "text-red-800",
        titleDark: "dark:text-red-300"
    }
};

// Global variable to store the currently selected theme in the modal
let selectedNoteTheme = 'blue'; // Default theme

// Function to populate the color palette
function populateNoteThemePalette(currentTheme) {
    noteThemePalette.innerHTML = ''; // Clear previous swatches
    for (const themeKey in noteThemes) {
        const theme = noteThemes[themeKey];
        const swatchButton = document.createElement('button');
        swatchButton.type = 'button'; // Important to prevent form submission
        swatchButton.classList.add(
            'w-8', 'h-8', // Size
            'rounded-full', // Circular shape
            'border-2', 'border-transparent', // Default border
            'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'dark:focus:ring-offset-slate-800',
            'transition-all', 'duration-150', 'ease-in-out'
        );
        // FIX: Use spread operator with split(' ') for adding multiple classes
        swatchButton.classList.add(...theme.colorClass.split(' '));

        swatchButton.dataset.theme = themeKey;
        swatchButton.title = theme.name; // Add title for accessibility

        // Add active state if this is the currently selected theme
        if (themeKey === currentTheme) {
            // Ensure the border color matches the chosen theme for better visual feedback
            const activeBorderColor = noteThemes[currentTheme].colorClass.replace('bg-', 'border-').replace('hover:bg-', 'hover:border-');
            swatchButton.classList.add('ring-2', 'ring-offset-2', 'ring-white', 'dark:ring-slate-400');
            // FIX: Use spread operator with split(' ') for adding multiple classes
            swatchButton.classList.add(...activeBorderColor.split(' '));
        }

        swatchButton.addEventListener('click', () => {
            selectedNoteTheme = themeKey; // Update global selected theme
            // Remove active class from all other swatches
            noteThemePalette.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('ring-2', 'ring-offset-2', 'ring-white', 'dark:ring-slate-400');
                // Also remove all possible border colors from previously selected theme
                for (const key in noteThemes) {
                    const removeBorder = noteThemes[key].colorClass.replace('bg-', 'border-').replace('hover:bg-', 'hover:border-');
                    // FIX: Use spread operator with split(' ') for removing multiple classes
                    btn.classList.remove(...removeBorder.split(' '));
                }
            });
            // Add active class to the clicked swatch
            const activeBorderColor = noteThemes[themeKey].colorClass.replace('bg-', 'border-').replace('hover:bg-', 'hover:border-');
            swatchButton.classList.add('ring-2', 'ring-offset-2', 'ring-white', 'dark:ring-slate-400');
            // FIX: Use spread operator with split(' ') for adding multiple classes
            swatchButton.classList.add(...activeBorderColor.split(' '));
        });
        noteThemePalette.appendChild(swatchButton);
    }
}


// Function to load notes from localStorage
function loadNotes() {
    const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
    if (savedNotes) {
        notesData = JSON.parse(savedNotes);
    } else {
        notesData = {};
    }
}

// Function to save notes to a JSON file
async function saveNotesToFile() { // Renamed from saveNotes to clarify purpose
    if (Object.keys(notesData).length === 0) {
        showMessage('No Notes', 'There are no notes to save.', 'info');
        return;
    }

    if (!window.showSaveFilePicker) {
        showMessage('Unsupported Browser', 'File System Access API is not supported in your browser. Notes can only be saved to local storage.', 'warning');
        return;
    }

    const options = {
        suggestedName: 'readme_notes_backup.json', // Changed suggested name for clarity
        types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
        }],
    };

    try {
        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        const jsonData = JSON.stringify(notesData, null, 2); // Pretty print JSON
        await writable.write(jsonData);
        await writable.close();
        showMessage('Notes Saved', 'All notes have been successfully saved to a JSON file.', 'success');
        // No need to save to localStorage here, as saveNoteBtn handler already does that for individual notes
        // and initial load still pulls from localStorage.
    } catch (err) {
        if (err.name === 'AbortError') {
            showMessage('Save Cancelled', 'Note save operation was cancelled by the user.', 'info');
        } else {
            console.error('Error saving notes to file:', err);
            showMessage('Save Failed', `Error saving notes to file: ${err.message}`, 'error');
        }
    }
}

// NEW: Function to restore notes from a JSON file
async function restoreNotesFromFile() {
    if (!window.showOpenFilePicker) {
        showMessage('Unsupported Browser', 'File System Access API is not supported in your browser.', 'warning');
        return;
    }

    const options = {
        types: [{
            description: 'JSON Notes Backup',
            accept: { 'application/json': ['.json'] },
        }],
        multiple: false,
    };

    try {
        const [fileHandle] = await window.showOpenFilePicker(options);
        const file = await fileHandle.getFile();
        const contents = await file.text();

        const confirmed = await showCustomConfirm('Restoring notes will overwrite your current notes. Are you sure?');
        if (!confirmed) {
            showMessage('Restore Cancelled', 'Restore operation cancelled.', 'info');
            return;
        }

        try {
            const restoredNotes = JSON.parse(contents);
            // Basic validation to ensure it's a plausible notes structure
            if (typeof restoredNotes === 'object' && restoredNotes !== null) {
                notesData = restoredNotes; // Overwrite current notes data
                localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(notesData)); // Update localStorage
                showMessage('Notes Restored', 'Notes successfully restored from file!', 'success');
                // Re-display current document to show updated notes (if any for that doc)
                if (window.currentDisplayedDocumentId) {
                    displaySelectedContent(window.currentDisplayedDocumentId);
                }
            } else {
                showMessage('Restore Failed', 'Invalid notes file format. Please select a valid JSON backup.', 'error');
            }
        } catch (parseError) {
            console.error('Error parsing notes backup file:', parseError);
            showMessage('Restore Failed', 'Could not parse the notes backup file. Ensure it is a valid JSON.', 'error');
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            showMessage('Restore Cancelled', 'File selection was cancelled.', 'info');
        } else {
            console.error('Error restoring notes:', err);
            showMessage('Restore Failed', `Error: ${err.message}`, 'error');
        }
    }
}


// Function to open the note modal
function openNoteModal(docUniqueId, headingId, currentContent = '', currentDirection = 'ltr', currentTheme = 'blue') {
    currentNoteContext = { docUniqueId, headingId };
    noteContentInput.value = currentContent;
    noteDirectionSelect.value = currentDirection;
    selectedNoteTheme = currentTheme; // Set the global selected theme
    populateNoteThemePalette(currentTheme); // Populate palette and set active swatch

    noteModal.classList.remove('hidden');
    noteContentInput.focus();

    const hasExistingNote = notesData[docUniqueId] && notesData[docUniqueId][headingId] && notesData[docUniqueId][headingId].content;
    deleteNoteBtn.disabled = !hasExistingNote;
    if (deleteNoteBtn.disabled) {
        deleteNoteBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        deleteNoteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Function to close the note modal
function closeNoteModal() {
    noteModal.classList.add('hidden');
    noteContentInput.value = '';
    currentNoteContext = { docUniqueId: null, headingId: null };
    selectedNoteTheme = 'blue'; // Reset selected theme to default on close
    noteThemePalette.innerHTML = ''; // Clear palette
}

// Event listener for closing the note modal
closeNoteModalBtn.addEventListener('click', closeNoteModal);

// Event listener for saving a note (within the modal)
saveNoteBtn.addEventListener('click', () => {
    const { docUniqueId, headingId } = currentNoteContext;
    if (!docUniqueId || !headingId) {
        showMessage('Error', 'Invalid note context.', 'error');
        return;
    }

    const content = noteContentInput.value.trim();
    const direction = noteDirectionSelect.value;
    const theme = selectedNoteTheme; // Get selected theme from global variable

    if (!notesData[docUniqueId]) {
        notesData[docUniqueId] = {};
    }

    if (content) {
        notesData[docUniqueId][headingId] = { content, direction, theme };
        showMessage('Saved', 'Note saved successfully!', 'success');
    } else {
        delete notesData[docUniqueId][headingId];
        if (Object.keys(notesData[docUniqueId]).length === 0) {
            delete notesData[docUniqueId];
        }
        showMessage('Cleared', 'Note content cleared.', 'info');
    }

    // Always save to localStorage immediately after an individual note change
    localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(notesData)); 
    
    closeNoteModal();
    // NEW: Use imported displaySelectedContent
    if (docUniqueId === window.currentDisplayedDocumentId) {
        displaySelectedContent(docUniqueId);
    }
});

// Event listener for deleting a note
deleteNoteBtn.addEventListener('click', async () => {
    const { docUniqueId, headingId } = currentNoteContext;
    if (!docUniqueId || !headingId) {
        showMessage('Error', 'Invalid note context for deletion.', 'error');
        return;
    }

    const confirmed = await showCustomConfirm('Are you sure you want to delete this note?');
    if (confirmed) {
        if (notesData[docUniqueId] && notesData[docUniqueId][headingId]) {
            delete notesData[docUniqueId][headingId];
            if (Object.keys(notesData[docUniqueId]).length === 0) {
                delete notesData[docUniqueId];
            }
            // After deleting an individual note, update local storage
            localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(notesData)); 
            closeNoteModal();
            showMessage('Deleted', 'Note successfully deleted!', 'success');
            // NEW: Use imported displaySelectedContent
            if (docUniqueId === window.currentDisplayedDocumentId) {
                displaySelectedContent(docUniqueId);
            }
        } else {
            showMessage('Error', 'Note not found to delete.', 'error');
        }
    }
});

// Function to inject note buttons and display notes
function injectNoteButtonsAndNotes(contentElement, docUniqueId) {
    // Clear existing notes and buttons to prevent duplicates on re-render
    contentElement.querySelectorAll('.note-container, .note-button').forEach(el => el.remove());

    const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
        // Assign a unique ID to the heading if it doesn't have one
        if (!heading.id) {
            heading.id = `heading-${docUniqueId}-${index}`;
        }

        // Create and append the note button
        const noteButton = document.createElement('button');
        noteButton.classList.add('note-button');
        noteButton.title = 'Add/Edit Note';
        noteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
            <path fill-rule="evenodd" d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm6.39-2.91a.75.75 0 0 1 .01-1.05S9.46 6 10 6a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V7.12L8.4 7.04a.75.75 0 0 1-.01-1.05ZM10 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" clip-rule="evenodd" />
        </svg>`;
        noteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const existingNote = notesData[docUniqueId]?.[heading.id];
            // Pass existing theme to openNoteModal
            openNoteModal(docUniqueId, heading.id, existingNote?.content || '', existingNote?.direction || 'ltr', existingNote?.theme || 'blue');
        });
        heading.appendChild(noteButton);

        // Display the note content if it exists
        const existingNote = notesData[docUniqueId]?.[heading.id];
        if (existingNote && existingNote.content) {
            const noteContainer = document.createElement('div');
            noteContainer.classList.add(
                'note-container',
                'p-3',
                'mt-2',
                'mb-4',
                'rounded-lg',
                'border',
                'shadow-sm',
                'relative'
            );
            noteContainer.setAttribute('data-direction', existingNote.direction);
            noteContainer.style.direction = existingNote.direction;
            noteContainer.style.textAlign = existingNote.direction === 'rtl' ? 'right' : 'left';

            // Apply theme classes
            const themeClasses = noteThemes[existingNote.theme || 'blue']; // Default to blue if theme is not set
            if (themeClasses) {
                noteContainer.classList.add(
                    themeClasses.bgLight,
                    themeClasses.bgDark,
                    themeClasses.borderLight,
                    themeClasses.borderDark
                );
            }

            // Apply title color based on theme
            // NEW: Add font-vazir class if direction is rtl
            const noteContentParagraphClass = existingNote.direction === 'rtl' ? 'text-gray-700 dark:text-gray-200 font-vazir' : 'text-gray-700 dark:text-gray-200';

            noteContainer.innerHTML = `
                <div class="font-bold ${themeClasses.titleLight} ${themeClasses.titleDark} mb-1">Note:</div>
                <p class="${noteContentParagraphClass}">${existingNote.content}</p>
            `;
            // Insert note after the heading's parent (or the heading itself if it's the root child)
            heading.parentNode.insertBefore(noteContainer, heading.nextSibling);
        }
    });
}

// Expose necessary functions to the global window object for script.js to call.
window.notesData = notesData;
window.loadNotesFromLocalStorage = loadNotes;
window.saveNotesToFile = saveNotesToFile; // Export the new save function
window.restoreNotesFromFile = restoreNotesFromFile; // NEW: Export the restore function
window.injectNoteButtonsAndNotes = injectNoteButtonsAndNotes;

// Initial load of notes
document.addEventListener('DOMContentLoaded', loadNotes);

// Intercept window.saveAllData to also save notes
const originalSaveAllData = window.saveAllData;
window.saveAllData = function() {
    originalSaveAllData();
    // Do not call saveNotesToFile() here, as it's user-initiated for file saving.
    // Individual note saves (from the modal) still update localStorage, which is what the main app uses by default.
};

// Intercept window.loadAllData to also load notes
const originalLoadAllData = window.loadAllData;
window.loadAllData = function() {
    originalLoadAllData();
    loadNotes(); // Load from local storage
    // After loading, if a document is displayed, re-inject notes
    if (window.currentDisplayedDocumentId) {
        const contentDisplayArea = document.getElementById('selectedDocumentContent');
        injectNoteButtonsAndNotes(contentDisplayArea, window.currentDisplayedDocumentId);
    }
};

// Add note modal to close on escape key
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (!noteModal.classList.contains('hidden')) {
            closeNoteModal();
        }
    }
});