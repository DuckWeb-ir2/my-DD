// notes.js
// NEW: Import showMessage and showCustomConfirm directly from script.js
import { showMessage, showCustomConfirm, displaySelectedContent } from './script.js';
// NEW: Import Firestore functions to interact with Firebase
import {
    collection,
    query,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    writeBatch,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


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

// --- Firestore Collection for Notes ---
// Structure in Firestore: /artifacts/{appId}/users/{userId}/notes/{docUniqueId}
// Each document is named after the README's uniqueId and contains a map of headingIds to note objects.
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

// --- NEW: Firestore Helper and Listener ---

/**
 * Returns the Firestore collection path for notes based on the current user.
 * @returns {string} The collection path.
 */
function getNotesCollectionPath() {
    if (!window.appId || !window.userId) {
        console.error("Firebase App ID or User ID is not available for notes.");
        return `invalid/path/for/notes`;
    }
    return `artifacts/${window.appId}/users/${window.userId}/notes`;
}

let unsubscribeNotesListener; // To keep track of the real-time listener

/**
 * Sets up a real-time listener for notes from Firestore.
 */
async function listenToNotes() {
    // Wait until Firebase auth state is determined
    await new Promise(resolve => {
        const interval = setInterval(() => {
            if (window.isAuthReady) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });

    // Detach any existing listener before starting a new one
    if (unsubscribeNotesListener) {
        unsubscribeNotesListener();
    }

    // If user is logged out, clear local notes data and stop.
    if (window.userId === 'logged_out_public_session') {
        notesData = {};
        if (window.currentDisplayedDocumentId) {
            displaySelectedContent(window.currentDisplayedDocumentId);
        }
        return;
    }

    const notesPath = getNotesCollectionPath();
    if (notesPath.startsWith('invalid')) return;

    const q = query(collection(window.db, notesPath));
    unsubscribeNotesListener = onSnapshot(q, (snapshot) => {
        const remoteNotes = {};
        snapshot.forEach((doc) => {
            // The document ID is the docUniqueId
            remoteNotes[doc.id] = doc.data();
        });
        notesData = remoteNotes;

        // Re-render notes for the currently displayed document to reflect changes
        if (window.currentDisplayedDocumentId) {
            displaySelectedContent(window.currentDisplayedDocumentId);
        }
    }, (error) => {
        console.error("Error listening to notes collection:", error);
        showMessage('Firestore Error', 'Could not sync notes.', 'error');
    });
}


// Function to populate the color palette
function populateNoteThemePalette(currentTheme) {
    noteThemePalette.innerHTML = ''; // Clear previous swatches
    for (const themeKey in noteThemes) {
        const theme = noteThemes[themeKey];
        const swatchButton = document.createElement('button');
        swatchButton.type = 'button'; // Important to prevent form submission
        swatchButton.classList.add(
            'w-8', 'h-8', 'rounded-full', 'border-2', 'border-transparent',
            'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'dark:focus:ring-offset-slate-800',
            'transition-all', 'duration-150', 'ease-in-out'
        );
        swatchButton.classList.add(...theme.colorClass.split(' '));
        swatchButton.dataset.theme = themeKey;
        swatchButton.title = theme.name;

        if (themeKey === currentTheme) {
            const activeBorderColor = noteThemes[currentTheme].colorClass.replace('bg-', 'border-').replace('hover:bg-', 'hover:border-');
            swatchButton.classList.add('ring-2', 'ring-offset-2', 'ring-white', 'dark:ring-slate-400');
            swatchButton.classList.add(...activeBorderColor.split(' '));
        }

        swatchButton.addEventListener('click', () => {
            selectedNoteTheme = themeKey;
            noteThemePalette.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('ring-2', 'ring-offset-2', 'ring-white', 'dark:ring-slate-400');
                for (const key in noteThemes) {
                    const removeBorder = noteThemes[key].colorClass.replace('bg-', 'border-').replace('hover:bg-', 'hover:border-');
                    btn.classList.remove(...removeBorder.split(' '));
                }
            });
            const activeBorderColor = noteThemes[themeKey].colorClass.replace('bg-', 'border-').replace('hover:bg-', 'hover:border-');
            swatchButton.classList.add('ring-2', 'ring-offset-2', 'ring-white', 'dark:ring-slate-400');
            swatchButton.classList.add(...activeBorderColor.split(' '));
        });
        noteThemePalette.appendChild(swatchButton);
    }
}

// Function to save notes to a JSON file (for backup)
async function saveNotesToFile() {
    if (Object.keys(notesData).length === 0) {
        showMessage('No Notes', 'There are no notes to save.', 'info');
        return;
    }

    if (!window.showSaveFilePicker) {
        showMessage('Unsupported Browser', 'File System Access API is not supported in your browser.', 'warning');
        return;
    }

    const options = {
        suggestedName: 'readme_notes_backup.json',
        types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
        }],
    };

    try {
        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        const jsonData = JSON.stringify(notesData, null, 2);
        await writable.write(jsonData);
        await writable.close();
        showMessage('Notes Saved', 'All notes have been successfully saved to a JSON file.', 'success');
    } catch (err) {
        if (err.name === 'AbortError') {
            showMessage('Save Cancelled', 'Note save operation was cancelled by the user.', 'info');
        } else {
            console.error('Error saving notes to file:', err);
            showMessage('Save Failed', `Error saving notes to file: ${err.message}`, 'error');
        }
    }
}

// NEW: Function to restore notes from a JSON file to FIRESTORE
async function restoreNotesFromFile() {
    if (!window.showOpenFilePicker) {
        showMessage('Unsupported Browser', 'File System Access API is not supported in your browser.', 'warning');
        return;
    }

    if (window.userId === 'logged_out_public_session') {
        showMessage('Login Required', 'Please log in to restore notes to your account.', 'warning');
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

        const confirmed = await showCustomConfirm('Restoring will overwrite all current notes in your account. Are you sure?');
        if (!confirmed) {
            showMessage('Restore Cancelled', 'Restore operation cancelled.', 'info');
            return;
        }

        const restoredNotes = JSON.parse(contents);
        if (typeof restoredNotes !== 'object' || restoredNotes === null) {
            showMessage('Restore Failed', 'Invalid notes file format.', 'error');
            return;
        }

        const notesPath = getNotesCollectionPath();
        const batch = writeBatch(window.db);

        // First, delete all existing notes for this user to ensure a clean restore
        const existingNotesQuery = query(collection(window.db, notesPath));
        const existingNotesSnapshot = await getDocs(existingNotesQuery);
        existingNotesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Now, add the restored notes
        for (const docId in restoredNotes) {
            if (Object.prototype.hasOwnProperty.call(restoredNotes, docId) && Object.keys(restoredNotes[docId]).length > 0) {
                const noteDocRef = doc(window.db, notesPath, docId);
                batch.set(noteDocRef, restoredNotes[docId]);
            }
        }

        await batch.commit();
        showMessage('Notes Restored', 'Notes successfully restored from file to your account!', 'success');
        // The onSnapshot listener will handle the UI update automatically.

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
    selectedNoteTheme = currentTheme;
    populateNoteThemePalette(currentTheme);

    noteModal.classList.remove('hidden');
    noteContentInput.focus();

    const hasExistingNote = notesData[docUniqueId] && notesData[docUniqueId][headingId] && notesData[docUniqueId][headingId].content;
    deleteNoteBtn.disabled = !hasExistingNote;
    deleteNoteBtn.classList.toggle('opacity-50', !hasExistingNote);
    deleteNoteBtn.classList.toggle('cursor-not-allowed', !hasExistingNote);
}

// Function to close the note modal
function closeNoteModal() {
    noteModal.classList.add('hidden');
    noteContentInput.value = '';
    currentNoteContext = { docUniqueId: null, headingId: null };
    selectedNoteTheme = 'blue';
    noteThemePalette.innerHTML = '';
}

// Event listener for closing the note modal
closeNoteModalBtn.addEventListener('click', closeNoteModal);

// Event listener for saving a note (within the modal) - MODIFIED FOR FIRESTORE
saveNoteBtn.addEventListener('click', async () => {
    const { docUniqueId, headingId } = currentNoteContext;
    if (!docUniqueId || !headingId) {
        showMessage('Error', 'Invalid note context.', 'error');
        return;
    }

    if (window.userId === 'logged_out_public_session') {
        showMessage('Login Required', 'Please log in to save notes.', 'warning');
        return;
    }

    const content = noteContentInput.value.trim();
    const direction = noteDirectionSelect.value;
    const theme = selectedNoteTheme;

    const notesPath = getNotesCollectionPath();
    if (notesPath.startsWith('invalid')) return;

    // Update local data structure first for immediate UI feedback if needed
    if (!notesData[docUniqueId]) {
        notesData[docUniqueId] = {};
    }

    if (content) {
        notesData[docUniqueId][headingId] = { content, direction, theme };
    } else {
        if (notesData[docUniqueId]) {
            delete notesData[docUniqueId][headingId];
            if (Object.keys(notesData[docUniqueId]).length === 0) {
                delete notesData[docUniqueId];
            }
        }
    }

    // Now, sync this change with Firestore
    try {
        const noteDocRef = doc(window.db, notesPath, docUniqueId);
        if (notesData[docUniqueId]) {
            // If notes for this document still exist, save/update the document
            await setDoc(noteDocRef, notesData[docUniqueId]);
            showMessage('Saved', 'Note saved successfully!', 'success');
        } else {
            // If no notes are left for this document, delete the document
            await deleteDoc(noteDocRef);
            showMessage('Cleared', 'Note content cleared.', 'info');
        }
    } catch (error) {
        console.error("Error saving note to Firestore:", error);
        showMessage('Save Failed', `Could not save note: ${error.message}`, 'error');
    }

    closeNoteModal();
    // The onSnapshot listener will automatically update the UI.
    // An explicit call here might feel more responsive, but is not strictly necessary.
    if (docUniqueId === window.currentDisplayedDocumentId) {
        displaySelectedContent(docUniqueId);
    }
});

// Event listener for deleting a note - MODIFIED FOR FIRESTORE
deleteNoteBtn.addEventListener('click', async () => {
    const { docUniqueId, headingId } = currentNoteContext;
    if (!docUniqueId || !headingId) {
        showMessage('Error', 'Invalid note context for deletion.', 'error');
        return;
    }

    if (window.userId === 'logged_out_public_session') {
        showMessage('Login Required', 'Please log in to delete notes.', 'warning');
        return;
    }

    const confirmed = await showCustomConfirm('Are you sure you want to delete this note?');
    if (confirmed) {
        const notesPath = getNotesCollectionPath();
        if (notesPath.startsWith('invalid')) return;

        // Optimistically update local data
        if (notesData[docUniqueId] && notesData[docUniqueId][headingId]) {
            delete notesData[docUniqueId][headingId];
            if (Object.keys(notesData[docUniqueId]).length === 0) {
                delete notesData[docUniqueId];
            }

            // Sync change to Firestore
            try {
                const noteDocRef = doc(window.db, notesPath, docUniqueId);
                if (notesData[docUniqueId]) {
                    // Update the document with the note removed
                    await setDoc(noteDocRef, notesData[docUniqueId]);
                } else {
                    // Delete the document if it's now empty
                    await deleteDoc(noteDocRef);
                }
                closeNoteModal();
                showMessage('Deleted', 'Note successfully deleted!', 'success');
                // UI update will be handled by the listener, but this provides immediate feedback
                if (docUniqueId === window.currentDisplayedDocumentId) {
                    displaySelectedContent(docUniqueId);
                }
            } catch (error) {
                console.error("Error deleting note from Firestore:", error);
                showMessage('Delete Failed', `Could not delete note: ${error.message}`, 'error');
                // NOTE: Here you might want to revert the local optimistic update if the DB call fails.
            }
        }
    }
});

// Function to inject note buttons and display notes (reads from global notesData)
function injectNoteButtonsAndNotes(contentElement, docUniqueId) {
    contentElement.querySelectorAll('.note-container, .note-button').forEach(el => el.remove());

    const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
        if (!heading.id) {
            heading.id = `heading-${docUniqueId}-${index}`;
        }

        const noteButton = document.createElement('button');
        noteButton.classList.add('note-button');
        noteButton.title = 'Add/Edit Note';
        noteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm6.39-2.91a.75.75 0 0 1 .01-1.05S9.46 6 10 6a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V7.12L8.4 7.04a.75.75 0 0 1-.01-1.05ZM10 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" clip-rule="evenodd" /></svg>`;
        noteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const existingNote = notesData[docUniqueId]?.[heading.id];
            openNoteModal(docUniqueId, heading.id, existingNote?.content || '', existingNote?.direction || 'ltr', existingNote?.theme || 'blue');
        });
        heading.appendChild(noteButton);

        const existingNote = notesData[docUniqueId]?.[heading.id];
        if (existingNote && existingNote.content) {
            const noteContainer = document.createElement('div');
            noteContainer.classList.add('note-container', 'p-3', 'mt-2', 'mb-4', 'rounded-lg', 'border', 'shadow-sm', 'relative');
            noteContainer.setAttribute('data-direction', existingNote.direction);
            noteContainer.style.direction = existingNote.direction;
            noteContainer.style.textAlign = existingNote.direction === 'rtl' ? 'right' : 'left';

            const themeClasses = noteThemes[existingNote.theme || 'blue'];
            if (themeClasses) {
                noteContainer.classList.add(themeClasses.bgLight, themeClasses.bgDark, themeClasses.borderLight, themeClasses.borderDark);
            }

            const noteContentParagraphClass = existingNote.direction === 'rtl' ? 'text-gray-700 dark:text-gray-200 font-vazir' : 'text-gray-700 dark:text-gray-200';

            noteContainer.innerHTML = `<div class="font-bold ${themeClasses.titleLight} ${themeClasses.titleDark} mb-1">Note:</div><p class="${noteContentParagraphClass}">${existingNote.content}</p>`;
            heading.parentNode.insertBefore(noteContainer, heading.nextSibling);
        }
    });
}

// Expose necessary functions to the global window object
window.notesData = notesData;
window.listenToNotes = listenToNotes; // Replaces loadNotesFromLocalStorage
window.saveNotesToFile = saveNotesToFile;
window.restoreNotesFromFile = restoreNotesFromFile;
window.injectNoteButtonsAndNotes = injectNoteButtonsAndNotes;

// Initial load of notes
document.addEventListener('DOMContentLoaded', listenToNotes);

// Intercept window.loadAllData to re-attach listener on user login/logout
const originalLoadAllData = window.loadAllData;
window.loadAllData = function() {
    originalLoadAllData();
    listenToNotes(); // This ensures the listener is updated with the correct user ID
};

// Add note modal to close on escape key
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (!noteModal.classList.contains('hidden')) {
            closeNoteModal();
        }
    }
});
