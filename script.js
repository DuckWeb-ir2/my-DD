import { 
    getFirestore, collection, query, onSnapshot, 
    doc, setDoc, deleteDoc, writeBatch, 
    where, getDocs, orderBy 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Import Firebase Auth functions exposed globally by index.html
const { 
    auth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} = window;

// --- DOM ELEMENTS ---
const readmeContent = document.getElementById('readmeContent');
const exampleContent = document.getElementById('exampleContent');
const saveCurrentSectionButton = document.getElementById('saveCurrentSectionButton');
const deleteAllCurrentSectionButton = document.getElementById('deleteAllCurrentSectionButton');
const appThemeSelector = document.getElementById('appThemeSelector');
const codeBlockThemeSelector = document.getElementById('codeBlockThemeSelector');
const fontFamilySelector = document.getElementById('fontFamilySelector');
const fullscreenToggle = document.getElementById('fullscreenToggle');
const mainContainer = document.getElementById('mainContainer');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValueDisplay = document.getElementById('fontSizeValue');
const importFileInput = document.getElementById('importFileInput');

const messageBox = document.getElementById('messageBox');
const normalMarkdownPreview = document.getElementById('normalMarkdownPreview');
const contentDisplayArea = document.getElementById('selectedDocumentContent');
const mainContentActionButtons = document.getElementById('mainContentActionButtons');
const contentDisplayAreaWrapper = document.getElementById('contentDisplayAreaWrapper');
const currentDocumentTitle = document.getElementById('currentDocumentTitle');

// Hamburger Menu Elements
const hamburgerIcon = document.getElementById('hamburgerIcon');
const hamburgerMenu = document.getElementById('hamburgerMenu');
const hamburgerOverlay = document.getElementById('hamburgerOverlay');

// Backup and Restore Buttons
const backupAllButton = document.getElementById('backupAllButton');
const restoreAllButton = document.getElementById('restoreAllButton');
const saveAllNotesButton = document.getElementById('saveAllNotesButton'); 
const restoreNotesButton = document.getElementById('restoreNotesButton'); 

// Sidebar Elements
const sidebar = document.getElementById('sidebar');
const sidebarTitles = document.getElementById('sidebarTitles');
const addEditDocumentSidebarBtn = document.getElementById('addEditDocumentSidebarBtn');
const manageFoldersBtn = document.getElementById('manageFoldersBtn');

// Editor Area Elements
const editorArea = document.getElementById('editorArea');
const addOrSaveDocumentButton = document.getElementById('addOrSaveDocumentButton');
const summarizeContentButton = document.getElementById('summarizeContentButton');
const summarizeButtonText = document.getElementById('summarizeButtonText');
const summarizeSpinner = document.getElementById('summarizeSpinner');

// Sidebar Context Menu
const sidebarContextMenu = document.getElementById('sidebarContextMenu');

// Main Content Action Buttons
const editDocumentMainBtn = document.getElementById('editDocumentMainBtn');
const deleteDocumentMainBtn = document.getElementById('deleteDocumentMainBtn');
const toggleDirectionMainBtn = document.getElementById('toggleDirectionMainBtn');
const openSearchModalBtn = document.getElementById('openSearchModalBtn');

// Combined Section Toggle Button
const sectionToggleBtn = document.getElementById('sectionToggleBtn');

// Sidebar Toggle Button
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
// NEW: Sidebar Toggle Icons (from index.html)
const sidebarToggleOpenIcon = document.getElementById('sidebarToggleOpenIcon');
const sidebarToggleCloseIcon = document.getElementById('sidebarToggleCloseIcon');


// Scroll to Top Button
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

// Custom Confirm Modal Elements
const customConfirmModal = document.getElementById('customConfirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');
let resolveConfirmPromise;

// Summary Modal Elements
const summaryModal = document.getElementById('summaryModal');
const summaryContent = document.getElementById('summaryContent');
const closeSummaryModal = document.getElementById('closeSummaryModal');

// Advanced Search Modal Elements
const advancedSearchModal = document.getElementById('advancedSearchModal');
const closeSearchModalBtn = document.getElementById('closeSearchModalBtn');
const modalSearchTermInput = document.getElementById('modalSearchTerm');
const modalSearchCaseSensitive = document.getElementById('modalSearchCaseSensitive');
const modalSearchWholeWord = document.getElementById('modalSearchWholeWord');
const modalSearchScope = document.getElementById('modalSearchScope');
const modalSearchInTitles = document.getElementById('modalSearchInTitles');
const modalSearchInContent = document.getElementById('modalSearchInContent');
const executeAdvancedSearchBtn = document.getElementById('executeAdvancedSearchBtn');
const advancedSearchResultsContainer = document.getElementById('advancedSearchResultsContainer');
const advancedSearchResultsPlaceholder = document.getElementById('advancedSearchResultsPlaceholder');
const modalSectionTypeFilterContainer = document.getElementById('modalSectionTypeFilterContainer');
const modalFilterJS = document.getElementById('modalFilterJS');
const modalFilterReact = document.getElementById('modalFilterReact');

// --- FOLDER MANAGEMENT ELEMENTS ---
const folderManagementModal = document.getElementById('folderManagementModal');
const closeFolderModalBtn = document.getElementById('closeFolderModalBtn');
const newFolderNameInput = document.getElementById('newFolderName');
const createFolderBtn = document.getElementById('createFolderBtn');
const folderListContainer = document.getElementById('folderListContainer'); 

const uncategorizedDocsModal = document.getElementById('uncategorizedDocsModal');
const closeUncategorizedModalBtn = document.getElementById('closeUncategorizedModalBtn');
const uncategorizedDocsList = document.getElementById('uncategorizedDocsList');
const addSelectedDocsToFolderBtn = document.getElementById('addSelectedDocsToFolderBtn');
let currentFolderIdForAssignment = null; 

const documentMovementButtons = document.getElementById('documentMovementButtons');
const moveDocUpFixedBtn = document.getElementById('moveDocUpFixedBtn');
const moveDocDownFixedBtn = document.getElementById('moveDocDownFixedBtn');
const moveDocToFolderFixedBtn = document.getElementById('moveDocToFolderFixedBtn');
let selectedDocIdForMovement = null; 

// NEW: Auth Elements
const authButton = document.getElementById('authButton');
const authButtonText = document.getElementById('authButtonText');
const authIcon = document.getElementById('authIcon');
const loginModal = document.getElementById('loginModal');
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
const loginModalTitle = document.getElementById('loginModalTitle');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const loginSubmitText = document.getElementById('loginSubmitText');
const loginSpinner = document.getElementById('loginSpinner');
const switchToSignUpBtn = document.getElementById('switchToSignUpBtn');
const authErrorMsg = document.getElementById('authErrorMsg');

// Resizer Elements
const resizer = document.getElementById('resizer');
const mainLayout = document.getElementById('mainLayout'); 
const mainContentArea = document.getElementById('mainContentArea');


// --- DATA AND STATE ---
let documentsData = []; 
let foldersData = []; 

const LAST_OPENED_DOC_KEY = 'lastOpenedDocumentId'; 
const THEME_STORAGE_KEY = 'themeMode';
const APP_THEME_STORAGE_KEY = 'appTheme';
const CODE_BLOCK_THEME_STORAGE_KEY = 'codeBlockTheme';
const FONT_FAMILY_STORAGE_KEY = 'fontFamily';
const FONT_SIZE_STORAGE_KEY = 'fontSize';
const README_AUTOSAVE_DRAFT_KEY = 'readmeAutosaveDraft';
const CURRENT_SECTION_STORAGE_KEY = 'currentSectionType';
const SIDEBAR_STATE_KEY = 'sidebarState';
const SIDEBAR_WIDTH_KEY = 'sidebarWidth';
const FOLDER_OPEN_STATE_KEY = 'folderOpenStates';

let editingDocumentUniqueId = null;
window.currentDisplayedDocumentId = null; 

let isSigningUp = false; 
let currentSection = 'js';

let currentInlineSearchTerm = '';
let highlightedMatches = [];
let currentMatchIndex = -1;

const ALERT_SVG_PATH = "M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 010-2h1v-3H8a1 1 0 010-2h2a1 1 0 011 1v4h1a1 1 0 010 2Z";

// --- THEME DATA (unchanged) ---
const appThemes = {
    'system-default': { name: 'System Default', bodyClass: '', defaultHighlightDark: 'github-dark', defaultHighlightLight: 'github' },
    'midnight-blue': { name: 'Midnight Blue UI', bodyClass: 'theme-midnight-blue', defaultHighlightDark: 'dracula', defaultHighlightLight: 'dracula' },
    'night-owl-ui': { name: 'Night Owl UI', bodyClass: 'theme-night-owl', defaultHighlightDark: 'night-owl', defaultHighlightLight: 'night-owl' },
    'dracula-ui': { name: 'Dracula UI', bodyClass: 'theme-dracula-ui', defaultHighlightDark: 'dracula', defaultHighlightLight: 'dracula' },
    'nord-ui': { name: 'Nord UI', bodyClass: 'theme-nord-ui', defaultHighlightDark: 'nord', defaultHighlightLight: 'nord' },
};

const codeHighlightThemes = {
    'github': { name: 'GitHub', light: 'github', dark: 'github-dark' },
    'atom-one': { name: 'Atom One', light: 'atom-one-light', dark: 'atom-one-dark' },
    'vs': { name: 'Visual Studio', light: 'vs', dark: 'vs2015' },
    'night-owl-code': { name: 'Night Owl (Code)', light: 'night-owl', dark: 'night-owl' },
    'dracula-code': { name: 'Dracula (Code)', light: 'dracula', dark: 'dracula' },
    'nord-code': { name: 'Nord (Code)', light: 'nord', dark: 'nord' },
    'solarized': { name: 'Solarized', light: 'solarized-light', dark: 'solarized-dark' },
    'agate-code': { name: 'Agate (Code)', light: 'agate', dark: 'agate' },
    'monokai-sublime': { name: 'Monokai Sublime', light: 'monokai-sublime', dark: 'monokai-sublime'},
    'tomorrow-night': { name: 'Tomorrow Night', light: 'tomorrow-night', dark: 'tomorrow-night'},
    'ocean': { name: 'Ocean', light: 'ocean', dark: 'ocean'},
    'xcode': { name: 'Xcode', light: 'xcode', dark: 'xcode'},
};
// --- END THEME DATA ---

// --- UTILITY FUNCTIONS ---

const MIN_SIDEBAR_WIDTH = 200; 
const MAX_SIDEBAR_WIDTH = 600; 
const DEFAULT_SIDEBAR_WIDTH = 320;

function applySidebarWidth(width) {
    const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(width, MAX_SIDEBAR_WIDTH));
    if (sidebar) sidebar.style.width = `${newWidth}px`;
    if (resizer) resizer.style.left = `${newWidth}px`;
    if (mainContentArea) {
        // On Desktop, set margin-left for main content
        if (window.innerWidth >= 768 && !document.body.classList.contains('sidebar-closed')) {
            mainContentArea.style.marginLeft = `${newWidth}px`;
        } else {
            mainContentArea.style.marginLeft = '0px';
        }
    }
}

function loadAndApplySidebarWidth() {
    let savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    let initialWidth = savedWidth ? parseInt(savedWidth, 10) : DEFAULT_SIDEBAR_WIDTH;
    initialWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(initialWidth, MAX_SIDEBAR_WIDTH));
    
    // Apply width to the sidebar element itself
    if(sidebar) sidebar.style.width = `${initialWidth}px`;
    
    const isClosed = document.body.classList.contains('sidebar-closed');
    const isMobile = window.innerWidth < 768;

    // Remove transitions temporarily for instant repositioning
    if(sidebar) sidebar.style.transition = 'none';
    if(resizer) resizer.style.transition = 'none';
    if(mainContentArea) mainContentArea.style.transition = 'none';

    if (isMobile) {
        // Mobile view: sidebar is fixed and moves with 'left' property
        if (isClosed) {
            // Closed state: sidebar is off-screen
            if(sidebar) sidebar.style.left = `-${initialWidth}px`;
            if(mainContentArea) mainContentArea.style.marginLeft = '0px';
            if(resizer) resizer.style.left = `0px`; // Resizer always hidden by CSS on mobile
        } else {
            // Open state: sidebar is visible, overlays content
            if(sidebar) sidebar.style.left = '0px';
            if(mainContentArea) mainContentArea.style.marginLeft = '0px';
            if(resizer) resizer.style.left = `0px`;
        }
        
    } else {
        // Desktop view: sidebar is part of layout flow using margin-left
        if (isClosed) {
            // Closed state: off-screen and main content shifts left
            if(sidebar) sidebar.style.left = `-${initialWidth}px`;
            if(mainContentArea) mainContentArea.style.marginLeft = '0px';
            if(resizer) resizer.style.left = `0px`; 
        } else {
            // Open state: visible, main content pushed by margin-left
            if(sidebar) sidebar.style.left = '0px';
            if(mainContentArea) mainContentArea.style.marginLeft = `${initialWidth}px`;
            if(resizer) resizer.style.left = `${initialWidth}px`;
        }
    }

    // Resizer visibility control
    if (resizer) {
        if (isMobile || isClosed) { 
            resizer.style.display = 'none';
        } else {
            resizer.style.display = 'block';
        }
    }
    
    // Control visibility of the mobile toggle button
    if (sidebarToggleBtn) {
        if (isMobile) {
            sidebarToggleBtn.style.display = 'flex'; // Show on mobile
        } else {
            sidebarToggleBtn.style.display = 'none'; // Hide on desktop
        }
    }
    
    updateSidebarToggleIcon();

    // Reapply transitions after state is set
    setTimeout(() => {
        if(sidebar) sidebar.style.transition = 'left 0.3s ease-in-out, width 0.3s ease-in-out';
        if(resizer) resizer.style.transition = 'background-color 0.15s ease-in-out, left 0.3s ease-in-out';
        if(mainContentArea) mainContentArea.style.transition = 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out';
    }, 0);
}

if (resizer) {
    resizer.addEventListener('mousedown', function(e) {
        // Only allow resizing on desktop and when sidebar is open
        if (document.body.classList.contains('sidebar-closed') || window.innerWidth < 768) return;
        let isResizing = true;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize'; 
        document.body.style.userSelect = 'none'; 
        const startX = e.clientX;
        const startWidth = sidebar.offsetWidth;

        function handleMouseMove(e) {
            if (!isResizing) return;
            const deltaX = e.clientX - startX;
            let newWidth = startWidth + deltaX;
            newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(newWidth, MAX_SIDEBAR_WIDTH));
            
            sidebar.style.transition = 'none';
            mainContentArea.style.transition = 'none';
            resizer.style.transition = 'none';
            applySidebarWidth(newWidth);
        }

        function handleMouseUp() {
            if (!isResizing) return;
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // Reapply transitions
            sidebar.style.transition = 'left 0.3s ease-in-out, width 0.3s ease-in-out';
            mainContentArea.style.transition = 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out';
            resizer.style.transition = 'background-color 0.15s ease-in-out, left 0.3s ease-in-out';
            
            localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebar.offsetWidth.toString());
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-',
    gfm: true, breaks: true, pedantic: false, sanitize: true, smartLists: true, smartypants: false
});

function applySyntaxHighlighting() {
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

function applyStyling() {
    const selectedAppThemeKey = appThemeSelector.value;
    const selectedCodeThemeKey = codeBlockThemeSelector.value;
    const highlightThemeLink = document.getElementById('highlightThemeLink');

    Object.values(appThemes).forEach(details => {
        if (details.bodyClass) document.body.classList.remove(details.bodyClass);
    });

    const appThemeDetails = appThemes[selectedAppThemeKey];
    if (appThemeDetails && appThemeDetails.bodyClass) {
        document.body.classList.add(appThemeDetails.bodyClass);
    }

    let codeHighlightFile;
    const codeThemeDetails = codeHighlightThemes[selectedCodeThemeKey];
    if (codeThemeDetails) {
        codeHighlightFile = codeThemeDetails.dark; 
        if (!codeHighlightFile) codeHighlightFile = codeThemeDetails.light; 
    }
    if (!codeHighlightFile) {
        const fallbackAppTheme = appThemeDetails || appThemes['system-default'];
        codeHighlightFile = fallbackAppTheme.defaultHighlightDark; 
    }
    highlightThemeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${codeHighlightFile}.min.css`;
    setTimeout(applySyntaxHighlighting, 50);
}

function applyFontFamily(fontFamily) {
    document.body.style.fontFamily = `'${fontFamily}', sans-serif`;
}

function applyFontSize(size) {
    const markdownContentElements = document.querySelectorAll('.markdown-content');
    markdownContentElements.forEach(element => {
        element.style.fontSize = `${size}px`;
    });
    fontSizeValueDisplay.textContent = `${size}px`;
}

export function showMessage(title, message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('flex', 'items-center', 'p-4', 'mb-4', 'text-sm', 'rounded-lg', 'pointer-events-auto', 'w-full', 'max-w-xs', 'shadow-lg');
    let bgColorClasses = [], textColorClasses = [], srOnlyText = '';

    switch (type) {
        case 'success':
            bgColorClasses = ['bg-gray-800']; textColorClasses = ['text-green-400']; srOnlyText = 'Success'; break;
        case 'error':
            bgColorClasses = ['bg-gray-800']; textColorClasses = ['text-red-400']; srOnlyText = 'Error'; break;
        case 'info':
            bgColorClasses = ['bg-gray-800']; textColorClasses = ['text-blue-400']; srOnlyText = 'Info'; break;
        case 'warning':
            bgColorClasses = ['bg-gray-800']; textColorClasses = ['text-yellow-300']; srOnlyText = 'Warning'; break;
        default: 
            bgColorClasses = ['bg-gray-800']; textColorClasses = ['text-gray-300']; srOnlyText = 'Message'; break;
    }
    alertDiv.classList.add(...bgColorClasses, ...textColorClasses);
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `<svg class="shrink-0 inline w-4 h-4 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="${ALERT_SVG_PATH}"/></svg><span class="sr-only">${srOnlyText}</span><div><span class="font-medium">${title}</span> ${message}</div>`;
    messageBox.prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

export function showCustomConfirm(message) {
    return new Promise((resolve) => {
        confirmMessage.textContent = message;
        customConfirmModal.classList.remove('hidden');
        resolveConfirmPromise = resolve;
    });
}

confirmYes.addEventListener('click', () => {
    customConfirmModal.classList.add('hidden');
    if (resolveConfirmPromise) resolveConfirmPromise(true);
});

confirmNo.addEventListener('click', () => {
    customConfirmModal.classList.add('hidden');
    if (resolveConfirmPromise) resolveConfirmPromise(false);
});

function getDocumentTitleFromMarkdown(markdownText) {
    const h1HeadingRegex = /^#\s(?!#)(.*)$/m;
    const lines = markdownText.split('\n');
    let title = "Untitled Document";
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(h1HeadingRegex);
        if (match) { title = match[1].trim(); break; }
    }
    return title;
}

function renderNormalPreview() {
    const markdownText = readmeContent.value;
    const exampleContentValue = exampleContent.value;

    let previewHtml = marked.parse(markdownText);
    
    if (exampleContentValue.trim()) {
        const exampleHtml = marked.parse(exampleContentValue);
        previewHtml += `<h3 class="text-xl font-bold mt-8 mb-4 text-red-800 ">Related Examples</h3><div class="example-content">${exampleHtml}</div>`;
    }

    normalMarkdownPreview.innerHTML = previewHtml;
    applySyntaxHighlighting();
    applyFontSize(fontSizeSlider.value);
}

function updateAddSaveButtonState(isEditing) {
    if (isEditing) {
        addOrSaveDocumentButton.innerHTML = `<svg class="inline-block w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2zM15 11l-3 3-1-4-2-1z"/></svg> Save Changes`;
        addOrSaveDocumentButton.classList.remove('bg-green-600', 'hover:bg-green-700', 'dark:bg-emerald-500', 'dark:hover:bg-emerald-600');
        addOrSaveDocumentButton.classList.add('bg-orange-500', 'hover:bg-orange-600', 'dark:bg-orange-600', 'dark:hover:bg-orange-700');
    } else {
        addOrSaveDocumentButton.innerHTML = `<svg class="inline-block w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Add/Save Document`;
        addOrSaveDocumentButton.classList.remove('bg-orange-500', 'hover:bg-orange-600', 'dark:bg-orange-600', 'dark:hover:bg-orange-700');
        addOrSaveDocumentButton.classList.add('bg-green-600', 'hover:bg-green-700', 'dark:bg-emerald-500', 'dark:hover:bg-emerald-600');
    }
}

function showEditor() {
    editorArea.classList.remove('hidden');
    contentDisplayAreaWrapper.classList.add('hidden');
    mainContentActionButtons.classList.add('hidden');
    currentDocumentTitle.textContent = editingDocumentUniqueId ? `Editing: ${documentsData.find(doc => doc.uniqueId === editingDocumentUniqueId)?.title || 'Document'}` : 'New Document';
    clearSearchHighlights();
}

function hideEditor() {
    editorArea.classList.add('hidden');
    contentDisplayAreaWrapper.classList.remove('hidden');
}

export function displaySelectedContent(uniqueId, searchTermForHighlighting = null) {
    hideEditor();
    clearSearchHighlights();
    const selectedDoc = documentsData.find(doc => doc.uniqueId === uniqueId);
    if (selectedDoc) {
        let contentHtml = marked.parse(selectedDoc.markdown);
        
        if (selectedDoc.exampleContent && selectedDoc.exampleContent.trim()) {
            contentHtml += `<h3 class="text-xl font-bold mt-8 mb-4">Related Examples</h3><div class="example-content">${marked.parse(selectedDoc.exampleContent)}</div>`;
        }

        contentDisplayArea.innerHTML = contentHtml;
        contentDisplayArea.setAttribute('data-direction', selectedDoc.direction);
        
        applySyntaxHighlighting();
        applyFontSize(fontSizeSlider.value);

        document.querySelectorAll('#sidebarTitles a').forEach(link => link.classList.remove('active-sidebar-link'));
        const activeLink = document.querySelector(`#sidebarTitles a[href="#${uniqueId}"]`);
        if (activeLink) {
            const detailsElement = activeLink.closest('details');
            if (detailsElement && !detailsElement.open) {
                detailsElement.open = true;
            }
            activeLink.classList.add('active-sidebar-link');
            setTimeout(() => {
                const listItem = activeLink.closest('li');
                if (listItem) {
                    listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 50); 
        }
        mainContentActionButtons.classList.remove('hidden');
        window.currentDisplayedDocumentId = uniqueId;
        currentDocumentTitle.textContent = selectedDoc.title;

        localStorage.setItem(LAST_OPENED_DOC_KEY, uniqueId);

        if (searchTermForHighlighting) {
            setTimeout(() => highlightSearchTermInCurrentDocument(searchTermForHighlighting, modalSearchCaseSensitive.checked, modalSearchWholeWord.checked), 100);
        }

        setTimeout(() => {
            if (contentDisplayAreaWrapper) {
                contentDisplayAreaWrapper.scrollTop = 0; 
            }
        }, 50);

        if (window.injectNoteButtonsAndNotes) { 
            window.injectNoteButtonsAndNotes(contentDisplayArea, uniqueId);
        }

    } else {
        contentDisplayArea.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">Select a document from the sidebar to view content.</p>`;
        mainContentActionButtons.classList.add('hidden');
        window.currentDisplayedDocumentId = null;
        currentDocumentTitle.textContent = 'No Document Selected';
    }
}

// --- FIREBASE UTILITY FUNCTIONS (Modified: No Anonymous ID) ---

/**
 * مسیر Collection را بر اساس appId و userId برمی‌گرداند.
 * اگر کاربر لاگین نکرده باشد، یک مسیر عمومی/لاگ‌آوت شده بازمی‌گرداند.
 * @param {string} collectionName نام Collection (docs یا folders)
 * @returns {string} مسیر کامل Collection
 */
function getCollectionPath(collectionName) {
    if (!window.appId || !window.userId) {
        console.error("Firebase App ID or User ID is not available.");
        return `invalid/path/for/${collectionName}`; 
    }
    return `artifacts/${window.appId}/users/${window.userId}/${collectionName}`;
}

/**
 * یک سند را در Firestore ذخره می‌کند.
 * @param {object} documentData داده‌های سند
 * @param {string} collectionName نام Collection (docs یا folders)
 * @param {string} docId شناسه سند (برای setDoc)
 * @returns {Promise<void>}
 */
async function saveDocumentToFirestore(documentData, collectionName, docId) {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Authentication Required', 'Please log in to save and manage your private data.', 'warning');
        return;
    }
    
    const path = getCollectionPath(collectionName);
    if (path.startsWith('invalid')) return;

    try {
        await setDoc(doc(window.db, path, docId), documentData);
    } catch (error) {
        console.error(`Error saving document ${docId} to Firestore:`, error);
        showMessage('Firestore Error', `Failed to save data: ${error.message}`, 'error');
    }
    // FIX 1: Explicitly call updateSidebarTitles after successful save of documents/folders
    // The onSnapshot listener handles data update, but immediate UI refresh ensures responsiveness
    if (collectionName === 'documents' || collectionName === 'folders') {
        updateSidebarTitles(); 
    }
}

/**
 * یک سند را از Firestore حذف می‌کند.
 * @param {string} docId شناسه سند
 * @param {string} collectionName نام Collection
 * @returns {Promise<void>}
 */
async function deleteDocumentFromFirestore(docId, collectionName) {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to delete documents.', 'warning');
        return;
    }

    const path = getCollectionPath(collectionName);
    if (path.startsWith('invalid')) return;

    try {
        await deleteDoc(doc(window.db, path, docId));
    } catch (error) {
        console.error(`Error deleting document ${docId} from Firestore:`, error);
        showMessage('Firestore Error', `Failed to delete data: ${error.message}`, 'error');
    }
    // FIX 1: Explicitly call updateSidebarTitles after successful deletion
    if (collectionName === 'documents' || collectionName === 'folders') {
        updateSidebarTitles(); 
    }
}

// --- DATA LISTENER FUNCTIONS (Modified: Handle Unsubscribe) ---

let unsubscribeDocuments;
let unsubscribeFolders;

/**
 * گوش دادن به تغییرات اسناد (Documents) در Firestore
 * اگر کاربر لاگین نکرده باشد، شنونده متوقف شده و آرایه‌ها خالی می‌شوند.
 */
function listenToDocuments() {
    if (unsubscribeDocuments) unsubscribeDocuments();

    const docsPath = getCollectionPath('documents');
    
    if (window.userId === 'logged_out_public_session' || docsPath.startsWith('invalid')) {
        documentsData = [];
        updateSidebarTitles();
        return;
    }

    const docsQuery = query(collection(window.db, docsPath));

    unsubscribeDocuments = onSnapshot(docsQuery, (snapshot) => {
        const docs = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            docs.push({
                uniqueId: doc.id,
                title: data.title || 'Untitled Document',
                markdown: data.markdown || '',
                exampleContent: data.exampleContent || '',
                direction: data.direction || 'ltr',
                type: data.type || 'js', 
                folderId: data.folderId === undefined ? null : data.folderId,
                checked: data.checked || false,
                orderIndex: data.orderIndex || 0,
            });
        });

        documentsData = docs.sort((a, b) => a.orderIndex - b.orderIndex);
        updateSidebarTitles(); 
    }, (error) => {
        console.error("Error listening to documents:", error);
        showMessage('Firestore Error', 'Failed to listen to documents.', 'error');
    });
}

/**
 * گوش دادن به تغییرات پوشه‌ها (Folders) در Firestore
 */
function listenToFolders() {
    if (unsubscribeFolders) unsubscribeFolders();

    const foldersPath = getCollectionPath('folders');
    
    if (window.userId === 'logged_out_public_session' || foldersPath.startsWith('invalid')) {
        foldersData = [];
        updateSidebarTitles();
        return;
    }

    const foldersQuery = query(collection(window.db, foldersPath));

    unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
        const folders = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            folders.push({
                id: doc.id,
                name: data.name || 'Untitled Folder',
                type: data.type || 'js',
                isOpen: data.isOpen || false,
                orderIndex: data.orderIndex || 0, 
            });
        });

        foldersData = folders.sort((a, b) => a.orderIndex - b.orderIndex);
        updateSidebarTitles(); 
        
        // FIX 2: Ensure modal update only happens if the modal is visibly open
        if (!folderManagementModal.classList.contains('hidden')) {
            populateFolderManagementModal();
        }
    }, (error) => {
        console.error("Error listening to folders:", error);
        showMessage('Firestore Error', 'Failed to listen to folders.', 'error');
    });
}

/**
 * انتظار برای آمادگی احراز هویت
 * @returns {Promise<void>}
 */
function waitForAuth() {
    return new Promise(resolve => {
        if (window.isAuthReady) {
            resolve();
            return;
        }
        const interval = setInterval(() => {
            if (window.isAuthReady) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

async function loadAllData() {
    await waitForAuth();
    updateAuthUI(window.auth.currentUser); 
    const user = window.auth.currentUser;
    const userStatus = user ? 
        `Logged in as: ${user.email}` : 
        `No user logged in. Please log in to view/save data.`;
    showMessage('Connected', userStatus, 'info');

    const savedSection = localStorage.getItem(CURRENT_SECTION_STORAGE_KEY);
    currentSection = (savedSection === 'js' || savedSection === 'react') ? savedSection : 'js';

    listenToDocuments(); 
    listenToFolders();

    if (window.loadNotesFromLocalStorage) { 
        window.loadNotesFromLocalStorage();
    }

    updateSectionToggleBtn();
}


// --- CRUD Operations (Modified: Authentication Check Added) ---

async function editDocument(uniqueId) {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to edit documents.', 'warning');
        return;
    }
    const docToEdit = documentsData.find(doc => doc.uniqueId === uniqueId);
    if (docToEdit) {
        readmeContent.value = docToEdit.markdown;
        exampleContent.value = docToEdit.exampleContent || '';
        renderNormalPreview();
        editingDocumentUniqueId = uniqueId;
        updateAddSaveButtonState(true);
        showEditor();
        readmeContent.focus();
        showMessage('Editing', `Content for "${docToEdit.title}" loaded into the editor.`, 'info');
    }
}

async function renameDocument(uniqueId) {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to rename documents.', 'warning');
        return;
    }
    const docToRename = documentsData.find(doc => doc.uniqueId === uniqueId);
    if (!docToRename) return;

    const currentTitle = docToRename.title;
    const newTitle = prompt("Enter new title:", currentTitle); 

    if (newTitle && newTitle.trim() !== "" && newTitle !== currentTitle) {
        const updatedDoc = { ...docToRename, title: newTitle.trim(), direction: docToRename.direction, type: docToRename.type, folderId: docToRename.folderId, checked: docToRename.checked };
        // NOTE: orderIndex removed in saveDocumentToFirestore
        await saveDocumentToFirestore(updatedDoc, 'documents', uniqueId);
        if (window.currentDisplayedDocumentId === uniqueId) {
            currentDocumentTitle.textContent = newTitle.trim(); 
        }
        showMessage('Renamed', `Document renamed to "${newTitle.trim()}".`, 'success');
    } else if (newTitle === null) {
        showMessage('Cancelled', 'Rename operation cancelled.', 'info');
    } else if (newTitle && newTitle.trim() === "") {
        showMessage('Error', 'Title cannot be empty.', 'error');
    }
}

async function renameFolder(folderId) {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to rename folders.', 'warning');
        return;
    }

    const folderToRename = foldersData.find(f => f.id === folderId);
    if (!folderToRename) return;

    const currentFolderName = folderToRename.name;
    const newFolderName = prompt("Enter new folder name:", currentFolderName);

    if (newFolderName && newFolderName.trim() !== "" && newFolderName !== currentFolderName) {
        const updatedFolder = { name: newFolderName.trim(), type: folderToRename.type, isOpen: folderToRename.isOpen, orderIndex: folderToRename.orderIndex }; // Keep order index
        
        // 1. Save changes (this updates Firestore and triggers onSnapshot)
        await saveDocumentToFirestore(updatedFolder, 'folders', folderId);
        
        // 2. Refresh modal explicitly immediately after save (before onSnapshot callback fully processes)
        if (!folderManagementModal.classList.contains('hidden')) {
            populateFolderManagementModal();
        }

        showMessage('Renamed', `Folder renamed to "${newFolderName.trim()}".`, 'success');
    } else if (newFolderName === null) {
        showMessage('Cancelled', 'Rename operation cancelled.', 'info');
    } else if (newFolderName && newFolderName.trim() === "") {
        showMessage('Error', 'Folder name cannot be empty.', 'error');
    }
}

async function deleteDocument(uniqueId) {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to delete documents.', 'warning');
        return;
    }

    const confirmed = await showCustomConfirm('Are you sure you want to delete this document? This action cannot be undone.');
    if (confirmed) {
        await deleteDocumentFromFirestore(uniqueId, 'documents');
            
        if (window.currentDisplayedDocumentId === uniqueId) {
            window.currentDisplayedDocumentId = null;
        }
        
        if (editingDocumentUniqueId === uniqueId) {
             readmeContent.value = '';
             exampleContent.value = ''; 
             normalMarkdownPreview.innerHTML = '';
             editingDocumentUniqueId = null; 
             updateAddSaveButtonState(false);
        }

        showMessage('Success', 'Document successfully deleted!', 'success');
        clearAutosaveDraft();
    }
}

async function toggleDocumentDirection(uniqueId) {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to change document properties.', 'warning');
        return;
    }
    
    const docToToggle = documentsData.find(doc => doc.uniqueId === uniqueId);
    if (docToToggle) {
        const newDirection = docToToggle.direction === 'ltr' ? 'rtl' : 'ltr';
        const updatedDoc = { ...docToToggle, direction: newDirection, title: docToToggle.title, type: docToToggle.type, folderId: docToToggle.folderId, checked: docToToggle.checked, markdown: docToToggle.markdown, exampleContent: docToToggle.exampleContent };
        // NOTE: orderIndex removed in saveDocumentToFirestore
        await saveDocumentToFirestore(updatedDoc, 'documents', uniqueId);
        
        if (window.currentDisplayedDocumentId === uniqueId) {
            displaySelectedContent(uniqueId);
        }
        showMessage('Direction Changed', `Content direction changed to ${newDirection.toUpperCase()}.`, 'info');
    }
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this; clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function saveAutosaveDraft() {
    const currentContent = readmeContent.value;
    const currentExampleContent = exampleContent.value;
    
    if (currentContent.trim() !== '' || currentExampleContent.trim() !== '') {
        localStorage.setItem(README_AUTOSAVE_DRAFT_KEY, JSON.stringify({
            main: currentContent,
            example: currentExampleContent
        }));
    } else {
        clearAutosaveDraft();
    }
}


function clearAutosaveDraft() { localStorage.removeItem(README_AUTOSAVE_DRAFT_KEY); }

async function loadAutosaveDraft() {
    const savedDraft = localStorage.getItem(README_AUTOSAVE_DRAFT_KEY);
    if (savedDraft) {
        const confirmed = await showCustomConfirm('A saved draft was found. Do you want to restore it?');
        if (confirmed) {
            const draftData = JSON.parse(savedDraft);
            readmeContent.value = draftData.main;
            exampleContent.value = draftData.example; 
            renderNormalPreview();
            showMessage('Restored', 'Draft successfully restored.', 'info');
        } else {
            clearAutosaveDraft(); showMessage('Cancelled', 'Draft not restored.', 'info');
        }
    }
}

const debouncedSaveAutosaveDraft = debounce(saveAutosaveDraft, 2000);

async function addOrSaveDocument() {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Authentication Required', 'Please log in to create or save documents.', 'warning');
        return;
    }

    const currentMarkdown = readmeContent.value;
    const currentExampleContent = exampleContent.value;

    if (!currentMarkdown.trim() && !currentExampleContent.trim()) {
        showMessage('Error', 'No content in the editor to save/add!', 'error'); return;
    }
    const title = getDocumentTitleFromMarkdown(currentMarkdown);
    let docIdToDisplay;
    
    if (editingDocumentUniqueId !== null) {
        const indexToUpdate = documentsData.findIndex(item => item.uniqueId === editingDocumentUniqueId);
        if (indexToUpdate > -1) {
            const currentDoc = documentsData[indexToUpdate];
            const updatedDocData = {
                title: title,
                markdown: currentMarkdown,
                exampleContent: currentExampleContent,
                direction: currentDoc.direction,
                type: currentDoc.type,
                folderId: currentDoc.folderId === undefined ? null : currentDoc.folderId,
                checked: currentDoc.checked,
            };
            docIdToDisplay = editingDocumentUniqueId;
            await saveDocumentToFirestore(updatedDocData, 'documents', docIdToDisplay);
            showMessage('Saved!', `Changes to "${title}" successfully saved!`, 'success');
        } else { 
            showMessage('Error!', 'Document not found for update.', 'error'); 
            return; 
        }
        editingDocumentUniqueId = null; 
        updateAddSaveButtonState(false);
    } else {
        // NOTE: Since orderIndex is now just for local sorting, we derive the actual orderIndex here
        const lastOrderIndex = documentsData.reduce((max, doc) => Math.max(max, doc.orderIndex), 0);
        const newDocId = doc(collection(window.db, getCollectionPath('documents'))).id;
        docIdToDisplay = newDocId;

        const newDocData = {
            title: title,
            markdown: currentMarkdown,
            exampleContent: currentExampleContent,
            direction: 'ltr',
            checked: false,
            type: currentSection,
            folderId: null, 
            orderIndex: lastOrderIndex + 1
        };
        
        await saveDocumentToFirestore(newDocData, 'documents', newDocId);
        window.currentDisplayedDocumentId = docIdToDisplay; 
        showMessage('Success!', 'New document successfully added!', 'success');
    }
    
    readmeContent.value = '';
    exampleContent.value = ''; 
    normalMarkdownPreview.innerHTML = '';
    hideEditor(); 
    clearAutosaveDraft();
}

readmeContent.addEventListener('input', () => { renderNormalPreview(); debouncedSaveAutosaveDraft(); });
exampleContent.addEventListener('input', () => { renderNormalPreview(); debouncedSaveAutosaveDraft(); }); 
addOrSaveDocumentButton.addEventListener('click', addOrSaveDocument);
addEditDocumentSidebarBtn.addEventListener('click', async () => {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to create documents.', 'warning');
        return;
    }
    readmeContent.value = '';
    exampleContent.value = '';
    normalMarkdownPreview.innerHTML = '';
    editingDocumentUniqueId = null; 
    updateAddSaveButtonState(false);
    showEditor(); 
    readmeContent.focus(); 
    await loadAutosaveDraft();
});

editDocumentMainBtn.addEventListener('click', () => {
    if (currentDisplayedDocumentId) editDocument(currentDisplayedDocumentId);
    else showMessage('Error', 'No document selected for editing.', 'error');
});
deleteDocumentMainBtn.addEventListener('click', () => {
    if (currentDisplayedDocumentId) deleteDocument(currentDisplayedDocumentId);
    else showMessage('Error', 'No document selected for deletion.', 'error');
});
toggleDirectionMainBtn.addEventListener('click', () => {
    if (currentDisplayedDocumentId) toggleDocumentDirection(currentDisplayedDocumentId);
    else showMessage('Error', 'No document selected to toggle direction.', 'error');
});


// --- Bulk Operations (Modified: Authentication Check) ---

saveCurrentSectionButton.addEventListener('click', () => {
    const foldersInCurrentSection = foldersData.filter(f => f.type === currentSection);
    const docsInCurrentSection = documentsData.filter(d => d.type === currentSection);

    let combinedContent = [];

    foldersInCurrentSection.forEach(folder => {
        const docsInFolder = docsInCurrentSection
            .filter(doc => doc.folderId === folder.id)
            .sort((a, b) => a.orderIndex - b.orderIndex);
        
        docsInFolder.forEach(doc => {
            combinedContent.push(doc.markdown);
            if (doc.exampleContent && doc.exampleContent.trim()) {
                combinedContent.push(`\n\n### Related Examples\n\n${doc.exampleContent}`);
            }
        });
    });

    const uncategorizedDocs = docsInCurrentSection
        .filter(doc => doc.folderId === null)
        .sort((a, b) => a.orderIndex - b.orderIndex);

    if (uncategorizedDocs.length > 0 && foldersInCurrentSection.length > 0) {
        combinedContent.push('\n\n---\n\n# Uncategorized Documents\n\n'); 
    } else if (uncategorizedDocs.length > 0) {
        combinedContent.push('# Uncategorized Documents\n\n');
    }

    uncategorizedDocs.forEach(doc => {
        combinedContent.push(doc.markdown);
        if (doc.exampleContent && doc.exampleContent.trim()) {
             combinedContent.push(`\n\n### Related Examples\n\n${doc.exampleContent}`);
        }
    });

    const finalContent = combinedContent.join('\n\n---\n\n'); 

    if (!finalContent.trim()) {
        showMessage('Error', `No documents in the ${currentSection.toUpperCase()} section to save.`, 'error'); return;
    }

    const filename = `README_${currentSection.toUpperCase()}.md`;
    try {
        const blob = new Blob([finalContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        showMessage('Success', `${filename} file successfully downloaded!`, 'success');
    } catch (error) {
        console.error('Error saving file:', error);
        showMessage('Error', 'Error saving file. Please try again.', 'error');
    }
});

deleteAllCurrentSectionButton.addEventListener('click', async () => {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Authentication Required', 'Please log in to delete bulk content.', 'warning');
        return;
    }

    const docsInCurrentSection = documentsData.filter(doc => doc.type === currentSection);
    const foldersInCurrentSection = foldersData.filter(f => f.type === currentSection);

    if (docsInCurrentSection.length === 0 && foldersInCurrentSection.length === 0) {
        showMessage('Info', `No content in the ${currentSection.toUpperCase()} section to delete.`, 'info'); return;
    }
    
    const confirmed = await showCustomConfirm(`Are you sure you want to delete all documents and folders in the ${currentSection.toUpperCase()} section? This action cannot be undone.`);
    if (confirmed) {
        const batch = writeBatch(window.db);
        
        const docsPath = getCollectionPath('documents');
        const foldersPath = getCollectionPath('folders');

        docsInCurrentSection.forEach(docToDelete => {
            batch.delete(doc(window.db, docsPath, docToDelete.uniqueId));
        });

        foldersInCurrentSection.forEach(folderToDelete => {
            batch.delete(doc(window.db, foldersPath, folderToDelete.id));
        });

        try {
            await batch.commit();
            
            // UI cleanup handled by onSnapshot -> updateSidebarTitles
            
            if (editingDocumentUniqueId && docsInCurrentSection.some(d => d.uniqueId === editingDocumentUniqueId)) {
                editingDocumentUniqueId = null;
                readmeContent.value = '';
                exampleContent.value = '';
                normalMarkdownPreview.innerHTML = '';
                updateAddSaveButtonState(false); 
                hideEditor(); 
                clearAutosaveDraft();
            }
            if (docsInCurrentSection.some(d => d.uniqueId === currentDisplayedDocumentId)) {
                window.currentDisplayedDocumentId = null;
            }

            showMessage('Success', `All content in ${currentSection.toUpperCase()} section successfully deleted!`, 'success');
        } catch (error) {
            console.error("Error batch deleting content:", error);
            showMessage('Firestore Error', `Failed to delete all content: ${error.message}`, 'error');
        }
    }
});


function showSidebarContextMenu(event, uniqueId) {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to manage documents.', 'warning');
        return;
    }

    event.preventDefault(); 
    hideSidebarContextMenu(); 

    sidebarContextMenu.style.top = `${event.pageY}px`;
    sidebarContextMenu.style.left = `${event.pageX}px`;
    sidebarContextMenu.dataset.targetId = uniqueId; 
    sidebarContextMenu.classList.add('show');
}

function hideSidebarContextMenu() {
    sidebarContextMenu.classList.remove('show');
    sidebarContextMenu.dataset.targetId = '';
}

sidebarContextMenu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    const uniqueId = sidebarContextMenu.dataset.targetId;

    if (action && uniqueId) {
        if (action === 'rename') {
            renameDocument(uniqueId);
        } else if (action === 'delete') {
            deleteDocument(uniqueId);
        }
        hideSidebarContextMenu();
    }
});

document.addEventListener('click', (e) => {
    if (!sidebarContextMenu.contains(e.target)) {
        hideSidebarContextMenu();
    }
});
sidebarContextMenu.addEventListener('contextmenu', (e) => e.stopPropagation());


function createSidebarListItem(item) {
    const li = document.createElement('li');
    li.classList.add('flex', 'items-center', 'space-x-2', 'relative', 'group', 'p-1', 'rounded-md', 'hover:bg-gray-200', 'dark:hover:bg-slate-600');
    li.dataset.uniqueId = item.uniqueId;
    li.dataset.type = item.type;

    li.addEventListener('contextmenu', (e) => {
        showSidebarContextMenu(e, item.uniqueId);
    });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `sidebar-checkbox-${item.uniqueId}`;
    checkbox.classList.add('form-checkbox', 'h-4', 'w-4', 'text-blue-600', 'rounded', 'border-gray-300', 'focus:ring-blue-500', 'dark:bg-slate-600', 'dark:border-slate-500', 'dark:checked:bg-blue-500', 'mr-2', 'cursor-pointer', 'flex-shrink-0');
    checkbox.checked = item.checked;
    
    checkbox.addEventListener('change', async () => { 
        if (window.userId === 'logged_out_public_session') {
             showMessage('Access Denied', 'Please log in to manage document status.', 'warning');
             checkbox.checked = !checkbox.checked;
             return;
        }

        const docToUpdate = documentsData.find(d => d.uniqueId === item.uniqueId);
        if (docToUpdate) {
            const updatedDoc = { ...docToUpdate, checked: checkbox.checked, title: docToUpdate.title, direction: docToUpdate.direction, type: docToUpdate.type, folderId: docToUpdate.folderId, markdown: docToUpdate.markdown, exampleContent: docToUpdate.exampleContent };
            // NOTE: orderIndex removed in saveDocumentToFirestore
            await saveDocumentToFirestore(updatedDoc, 'documents', item.uniqueId);
        }
    });

    const a = document.createElement('a');
    a.href = `#${item.uniqueId}`;
    a.textContent = item.title;
    a.classList.add('block', 'flex-grow', 'p-1', 'rounded-md', 'text-gray-700', 'dark:text-slate-200', 'transition-colors', 'duration-200', 'cursor-pointer');
    a.style.userSelect = 'text';
    a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        displaySelectedContent(item.uniqueId);
        
        // NEW: On mobile, close sidebar after selecting a document
        if (window.innerWidth < 768 && !document.body.classList.contains('sidebar-closed')) {
            // Force close sequence after content loads/displays
            toggleSidebarState(true); 
        }
    });

    li.appendChild(checkbox);
    li.appendChild(a);
    return li;
}

function addMultipleDocumentsFromMarkdown(fullMarkdownText, sectionType = 'js', exampleContent = '') {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to import documents.', 'warning');
        return;
    }

    const title = getDocumentTitleFromMarkdown(fullMarkdownText);
    const lastOrderIndex = documentsData.reduce((max, doc) => Math.max(max, doc.orderIndex), 0);
    const newDocId = doc(collection(window.db, getCollectionPath('documents'))).id;

    const newDocData = {
        title: title,
        markdown: fullMarkdownText.trim(),
        exampleContent: exampleContent,
        direction: 'ltr',
        checked: false,
        type: sectionType,
        folderId: null, 
        orderIndex: lastOrderIndex + 1
    };
    
    saveDocumentToFirestore(newDocData, 'documents', newDocId);
}

// --- Backup/Restore (Modified: Data Access Check) ---

async function backupAllDocuments() {
    if (!window.showSaveFilePicker) {
        showMessage('Unsupported Browser', 'File System Access API is not supported in your browser.', 'warning');
        return;
    }
    
    if (documentsData.length === 0 && foldersData.length === 0 && Object.keys(window.notesData).length === 0) {
        showMessage('No Data', 'There is no data to back up.', 'info');
        return;
    }
    if (window.userId === 'logged_out_public_session') {
        showMessage('Warning', 'You are currently logged out. The backup may contain only limited data if any. Log in to ensure all your data is included.', 'warning');
    }

    const backupData = {
        documents: documentsData,
        folders: foldersData,
        notes: window.notesData
    };

    const options = {
        suggestedName: 'readme_editor_backup.json',
        types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
        }],
    };

    try {
        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        const jsonData = JSON.stringify(backupData, null, 2); 
        await writable.write(jsonData);
        await writable.close();
        showMessage('Backup Successful', 'All documents, folders, and notes backed up successfully.', 'success');
    } catch (err) {
        if (err.name === 'AbortError') {
            showMessage('Backup Cancelled', 'Backup operation was cancelled by the user.', 'info');
        } else {
            console.error('Error backing up data:', err);
            showMessage('Backup Failed', `Error: ${err.message}`, 'error');
        }
    }
}

async function restoreDocuments() {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Authentication Required', 'Please log in to restore data to your account.', 'warning');
        return;
    }
    
    if (!window.showOpenFilePicker) {
        showMessage('Unsupported Browser', 'File System Access API is not supported in your browser.', 'warning');
        return;
    }
    await waitForAuth(); 

    const options = {
        types: [{
            description: 'JSON Backup Files',
            accept: { 'application/json': ['.json'] },
        }],
        multiple: false,
    };

    try {
        const [fileHandle] = await window.showOpenFilePicker(options);
        const file = await fileHandle.getFile();
        const contents = await file.text();
        
        const confirmed = await showCustomConfirm('Restoring will overwrite ALL current documents, folders, and notes on your cloud account (Firestore). Are you sure?');
        if (!confirmed) {
            showMessage('Restore Cancelled', 'Restore operation cancelled.', 'info');
            return;
        }

        try {
            const restoredData = JSON.parse(contents);
            
            let restoreDocs = [];
            let restoreFolders = [];
            let restoreNotes = {};

            if (restoredData && Array.isArray(restoredData.documents) && Array.isArray(restoredData.folders) && restoredData.notes !== undefined) {
                restoreDocs = restoredData.documents.map(item => ({ 
                    ...item, 
                    folderId: item.folderId === undefined ? null : item.folderId,
                    exampleContent: item.exampleContent || '', 
                    orderIndex: item.orderIndex || 0,
                }));
                restoreFolders = restoredData.folders.map(item => ({
                    ...item,
                    orderIndex: item.orderIndex || 0,
                }));
                restoreNotes = restoredData.notes;

            } else if (Array.isArray(restoredData)) { 
                restoreDocs = restoredData.map(item => ({ 
                    uniqueId: item.uniqueId || doc(collection(window.db, getCollectionPath('documents'))).id,
                    title: item.title,
                    markdown: item.markdown,
                    direction: item.direction || 'ltr',
                    checked: item.checked || false,
                    type: item.type || 'js',
                    exampleContent: '',
                    folderId: null, 
                    orderIndex: 0, 
                }));
                restoreFolders = []; 
                restoreNotes = {}; 
            } else {
                showMessage('Restore Failed', 'Invalid backup file format.', 'error');
                return;
            }

            const docsPath = getCollectionPath('documents');
            const foldersPath = getCollectionPath('folders');
            
            // 1. حذف تمام اسناد و پوشه‌های موجود
            const existingDocs = await getDocs(query(collection(window.db, docsPath)));
            const existingFolders = await getDocs(query(collection(window.db, foldersPath)));

            let batch = writeBatch(window.db);

            existingDocs.forEach(d => batch.delete(d.ref));
            existingFolders.forEach(f => batch.delete(f.ref));
            
            await batch.commit();
            
            // 2. افزودن داده‌های بازیابی شده 
            let currentBatch = writeBatch(window.db);
            let operationCount = 0;
            const maxBatchSize = 499;

            restoreDocs.forEach(docData => {
                const docRef = doc(window.db, docsPath, docData.uniqueId);
                const dataToSave = { ...docData };
                delete dataToSave.orderIndex; 
                currentBatch.set(docRef, dataToSave);
                operationCount++;

                if (operationCount >= maxBatchSize) {
                    currentBatch.commit();
                    currentBatch = writeBatch(window.db);
                    operationCount = 0;
                }
            });

            restoreFolders.forEach(folderData => {
                const docRef = doc(window.db, foldersPath, folderData.id);
                const dataToSave = { ...folderData };
                delete dataToSave.orderIndex; 
                currentBatch.set(docRef, dataToSave);
                operationCount++;

                if (operationCount >= maxBatchSize) {
                    currentBatch.commit();
                    currentBatch = writeBatch(window.db);
                    operationCount = 0;
                }
            });

            if (operationCount > 0) {
                await currentBatch.commit();
            }

            window.notesData = restoreNotes; 
            localStorage.setItem('readmeNotesData', JSON.stringify(restoreNotes)); 

            showMessage('Restore Successful', 'Documents, folders, and notes restored successfully to Firestore!', 'success');

        } catch (parseError) {
            console.error('Error parsing or saving backup file to Firestore:', parseError);
            showMessage('Restore Failed', 'Could not parse or save the backup file. Ensure it is valid JSON and Firestore operations succeeded.', 'error');
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            showMessage('Restore Cancelled', 'File selection was cancelled.', 'info');
        } else {
            console.error('Error restoring documents:', err);
            showMessage('Restore Failed', `Error: ${err.message}`, 'error');
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    renderNormalPreview(); 
    loadAndApplySidebarWidth(); 
    
    loadAllData(); 
    
    window.auth.onAuthStateChanged((user) => {
        updateAuthUI(user);
        
        if (window.isAuthReady) {
            listenToDocuments(); 
            listenToFolders();
            
            if (window.loadNotesFromLocalStorage) { 
                window.loadNotesFromLocalStorage();
            }
        }
    });

    // Initial state loading is now handled inside loadAndApplySidebarWidth for better responsiveness
    // based on screen size and saved preference.
    
    updateSectionIconDisplay(currentSection); 
    // updateSidebarToggleIcon() is called inside loadAndApplySidebarWidth now

    if (appThemeSelector) {
        for (const key in appThemes) { const option = document.createElement('option'); option.value = key; option.textContent = appThemes[key].name; appThemeSelector.appendChild(option); }
    }
    if (codeBlockThemeSelector) {
        for (const key in codeHighlightThemes) { const option = document.createElement('option'); option.value = key; option.textContent = codeHighlightThemes[key].name; codeBlockThemeSelector.appendChild(option); }
    }
    document.body.classList.add('dark'); 
    document.body.classList.remove('glassmorphism-mode'); 
    localStorage.setItem(THEME_STORAGE_KEY, 'dark'); 
    
    const savedAppTheme = localStorage.getItem(APP_THEME_STORAGE_KEY);
    appThemeSelector.value = (savedAppTheme && appThemes[savedAppTheme]) ? savedAppTheme : 'system-default';
    const savedCodeBlockTheme = localStorage.getItem(CODE_BLOCK_THEME_STORAGE_KEY);
    codeBlockThemeSelector.value = (savedCodeBlockTheme && codeHighlightThemes[savedCodeBlockTheme]) ? savedCodeBlockTheme : 'github';
    applyStyling();
    const savedFontFamily = localStorage.getItem(FONT_FAMILY_STORAGE_KEY);
    fontFamilySelector.value = savedFontFamily || 'Inter'; applyFontFamily(fontFamilySelector.value);
    const savedFontSize = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    fontSizeSlider.value = savedFontSize || '16'; applyFontSize(savedFontSize);
    updateFullscreenToggleIcon();

    if (moveDocUpFixedBtn) {
        moveDocUpFixedBtn.addEventListener('click', () => {
            if (selectedDocIdForMovement) {
                moveItemInModal(selectedDocIdForMovement, false, 'up');
            }
        });
    }

    if (moveDocDownFixedBtn) {
        moveDocDownFixedBtn.addEventListener('click', () => {
            if (selectedDocIdForMovement) {
                moveItemInModal(selectedDocIdForMovement, false, 'down');
            }
        });
    }

    if (moveDocToFolderFixedBtn) {
        moveDocToFolderFixedBtn.addEventListener('click', async () => {
            if (!selectedDocIdForMovement) return;

            const docToMove = documentsData.find(d => d.uniqueId === selectedDocIdForMovement);
            if (!docToMove) return;

            const foldersInCurrentSection = foldersData.filter(f => f.type === currentSection);
            
            let promptMessage = "Enter the name or ID of the target folder, or type 'uncategorized' to remove from folder:";
            const targetFolderPrompt = prompt(promptMessage, docToMove.folderId || 'uncategorized');
            
            if (targetFolderPrompt === null) { 
                showMessage('Cancelled', 'Document move cancelled.', 'info');
                return;
            }
            
            const normalizedPrompt = targetFolderPrompt.trim().toLowerCase();
            let targetFolderId = null;

            if (normalizedPrompt !== 'uncategorized') {
                const targetFolder = foldersInCurrentSection.find(f => 
                    f.id === normalizedPrompt || f.name.toLowerCase() === normalizedPrompt
                );

                if (!targetFolder) {
                    showMessage('Error', 'Target folder ID or name not found.', 'error');
                    return;
                }
                targetFolderId = targetFolder.id;
            }
            
            const updatedDoc = { ...docToMove, folderId: targetFolderId };
            delete updatedDoc.orderIndex; 
            await saveDocumentToFirestore(updatedDoc, 'documents', docToMove.uniqueId);

            populateFolderManagementModal(); 
            const newFolderName = targetFolderId ? foldersData.find(f => f.id === targetFolderId).name : 'Uncategorized';
            showMessage('Moved', `Document "${docToMove.title}" moved to "${newFolderName}".`, 'success');
            hideDocumentMovementButtons();
        });
    }
    hideDocumentMovementButtons();

    if (saveAllNotesButton) {
        saveAllNotesButton.addEventListener('click', () => {
            if (window.saveNotesToFile) { 
                window.saveNotesToFile();
            } else {
                showMessage('Error', 'Note saving functionality not available.', 'error');
            }
        });
    }

    if (restoreNotesButton) {
        restoreNotesButton.addEventListener('click', () => {
            if (window.restoreNotesFromFile) { 
                window.restoreNotesFromFile();
            } else {
                showMessage('Error', 'Note restoring functionality not available.', 'error');
            }
        });
    }
});

if (appThemeSelector) appThemeSelector.addEventListener('change', () => { localStorage.setItem(APP_THEME_STORAGE_KEY, appThemeSelector.value); applyStyling(); });
if (codeBlockThemeSelector) codeBlockThemeSelector.addEventListener('change', () => { localStorage.setItem(CODE_BLOCK_THEME_STORAGE_KEY, codeBlockThemeSelector.value); applyStyling(); });
fontFamilySelector.addEventListener('change', () => { const selectedFont = fontFamilySelector.value; localStorage.setItem(FONT_FAMILY_STORAGE_KEY, selectedFont); applyFontFamily(selectedFont); });
fontSizeSlider.addEventListener('input', () => { const currentSize = fontSizeSlider.value; localStorage.setItem(FONT_SIZE_STORAGE_KEY, currentSize); applyFontSize(currentSize); });

function openMenu() { hamburgerMenu.classList.add('open'); hamburgerOverlay.classList.add('open'); hamburgerIcon.classList.add('open'); document.body.classList.add('menu-open'); }
function closeMenu() { hamburgerMenu.classList.remove('open'); hamburgerOverlay.classList.remove('open'); hamburgerIcon.classList.remove('open'); document.body.classList.remove('menu-open'); }
hamburgerIcon.addEventListener('click', () => { if (hamburgerMenu.classList.contains('open')) closeMenu(); else openMenu(); });
hamburgerOverlay.addEventListener('click', closeMenu);

function updateSidebarToggleIcon() {
    const isClosed = document.body.classList.contains('sidebar-closed');
    // Hide one icon and show the other based on the closed state
    if (sidebarToggleOpenIcon && sidebarToggleCloseIcon) {
        if (isClosed) {
            sidebarToggleOpenIcon.classList.remove('hidden');
            sidebarToggleCloseIcon.classList.add('hidden');
        } else {
            sidebarToggleOpenIcon.classList.add('hidden');
            sidebarToggleCloseIcon.classList.remove('hidden');
        }
    }
}

/**
 * Toggles the sidebar state (open/closed).
 * @param {boolean} [forceClose] If true, forces the sidebar to close.
 */
function toggleSidebarState(forceClose = false) {
    const currentSidebarWidth = sidebar.offsetWidth; 
    const isMobile = window.innerWidth < 768;
    const isClosed = document.body.classList.contains('sidebar-closed');

    if (forceClose && isClosed) return; // Already closed, no action needed

    let shouldBeClosed = isClosed;
    if (forceClose) {
        shouldBeClosed = true;
    } else {
        shouldBeClosed = !isClosed;
    }

    if (shouldBeClosed) {
        document.body.classList.add('sidebar-closed');
        localStorage.setItem(SIDEBAR_STATE_KEY, 'closed');
    } else {
        document.body.classList.remove('sidebar-closed');
        localStorage.setItem(SIDEBAR_STATE_KEY, 'open');
    }

    // Apply transitions for visual smoothness
    if(sidebar) sidebar.style.transition = 'left 0.3s ease-in-out, width 0.3s ease-in-out';
    if(resizer) resizer.style.transition = 'left 0.3s ease-in-out, background-color 0.15s ease-in-out';
    if(mainContentArea) mainContentArea.style.transition = 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out';

    if (isMobile) {
        if (shouldBeClosed) {
            // Close: move sidebar off-screen to the left
            if(sidebar) sidebar.style.left = `-${currentSidebarWidth}px`;
            if(mainContentArea) mainContentArea.style.marginLeft = '0px';
            if(resizer) resizer.style.left = `0px`;
        } else { 
            // Open: move sidebar to be visible (0)
            if(sidebar) sidebar.style.left = '0px';
            // Overlay the main content (no margin needed)
            if(mainContentArea) mainContentArea.style.marginLeft = '0px';
            if(resizer) resizer.style.left = `0px`;
        }
        
    } else {
        // Desktop behavior
        if (shouldBeClosed) { 
            if(sidebar) sidebar.style.left = `-${currentSidebarWidth}px`;
            if(resizer) resizer.style.left = `0px`;
            if(mainContentArea) mainContentArea.style.marginLeft = '0px';
            if(resizer) resizer.style.display = 'none';
        } else { 
            if(sidebar) sidebar.style.left = '0px';
            if(resizer) resizer.style.left = `${currentSidebarWidth}px`;
            if(mainContentArea) mainContentArea.style.marginLeft = `${currentSidebarWidth}px`;
            if(resizer) resizer.style.display = 'block';
        }
    }

    updateSidebarToggleIcon();
}

sidebarToggleBtn.addEventListener('click', () => {
    toggleSidebarState();
});

// NEW: Add window resize listener to ensure responsiveness updates
window.addEventListener('resize', loadAndApplySidebarWidth);


const sectionIconDisplay = document.getElementById('sectionIconDisplay');
const sectionNameText = document.getElementById('sectionNameText');
const sectionIcons = {
    js: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unofficial_JavaScript_logo_2.svg/1024px-Unofficial_JavaScript_logo_2.svg.png',textColor: 'text-black', bgColor: 'bg-yellow-300', darkBgColor: 'dark:bg-yellow-300', sectionName: 'JavaScript', backgroundPosition: 'left center', altText: 'JS' },
    react: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png', bgColor: 'bg-blue-200', darkBgColor: 'dark:bg-blue-900', sectionName: 'React', backgroundPosition: 'left center', altText: 'React' }
};
function updateSectionIconDisplay(sectionType) {
    const iconData = sectionIcons[sectionType];
    if (iconData && sectionIconDisplay && sectionNameText) {
        sectionIconDisplay.style.backgroundImage = `url('${iconData.url}')`;
        sectionIconDisplay.style.backgroundSize = 'contain'; sectionIconDisplay.style.backgroundRepeat = 'no-repeat';
        sectionIconDisplay.style.backgroundPosition = iconData.backgroundPosition;
        sectionNameText.textContent = iconData.sectionName;
        for (const key in sectionIcons) { sectionIconDisplay.classList.remove(sectionIcons[key].bgColor, sectionIcons[key].darkBgColor); }
        sectionIconDisplay.classList.add(iconData.bgColor, iconData.darkBgColor);
    }
}

function updateSidebarTitles() {
    if (window.userId === 'logged_out_public_session') {
        sidebarTitles.innerHTML = `
            <div class="p-4 bg-red-100 dark:bg-red-900 rounded-lg text-center mt-4">
                <p class="text-sm font-semibold text-red-800 dark:text-red-200">
                    برای مشاهده و مدیریت اسناد، لطفاً وارد شوید.
                </p>
            </div>
        `;
        return;
    }
    
    const savedOpenStates = JSON.parse(localStorage.getItem(FOLDER_OPEN_STATE_KEY) || '{}');
    
    sidebarTitles.innerHTML = '';
    
    const foldersForCurrentSection = foldersData.filter(f => f.type === currentSection)
                                                .sort((a,b) => a.orderIndex - b.orderIndex);

    const docsForCurrentSection = documentsData.filter(d => d.type === currentSection)
                                               .sort((a,b) => a.orderIndex - b.orderIndex);


    foldersForCurrentSection.forEach(folder => {
        const folderContainer = document.createElement('details'); 
        folderContainer.className = 'folder-container group'; 
        folderContainer.dataset.folderId = folder.id;
        folderContainer.open = savedOpenStates[folder.id] !== undefined ? savedOpenStates[folder.id] : true;

        folderContainer.addEventListener('toggle', () => {
            savedOpenStates[folder.id] = folderContainer.open;
            localStorage.setItem(FOLDER_OPEN_STATE_KEY, JSON.stringify(savedOpenStates));
        });

        const summary = document.createElement('summary');
        summary.className = 'flex justify-between items-center px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 cursor-pointer folder-header';
        summary.innerHTML = `
            <span class="flex-grow">${folder.name}</span>
            <div class="flex items-center space-x-2">
                <svg class="folder-arrow w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
        `;

        const folderContentDiv = document.createElement('div');
        folderContentDiv.className = 'folder-content'; 
        
        const ul = document.createElement('ul');
        ul.className = 'space-y-1 mt-2';
        ul.dataset.folderId = folder.id; 

        const docsInFolder = docsForCurrentSection.filter(d => d.folderId === folder.id)
                                                .sort((a,b) => a.orderIndex - b.orderIndex); 
        
        docsInFolder.forEach(doc => {
            ul.appendChild(createSidebarListItem(doc));
        });

        folderContentDiv.appendChild(ul);
        folderContainer.appendChild(summary);
        folderContainer.appendChild(folderContentDiv);
        sidebarTitles.appendChild(folderContainer);
    });

    const uncategorizedDocs = docsForCurrentSection.filter(d => d.folderId === null)
                                                    .sort((a,b) => a.orderIndex - b.orderIndex); 

    if (uncategorizedDocs.length > 0) {
        const uncategorizedHeader = document.createElement('h4');
        uncategorizedHeader.className = 'text-md font-semibold text-gray-700 dark:text-slate-300 mt-4 mb-2 px-1';
        uncategorizedHeader.textContent = 'Uncategorized Documents';
        sidebarTitles.appendChild(uncategorizedHeader);

        const uncategorizedList = document.createElement('ul');
        uncategorizedList.className = 'space-y-1 mt-2';
        uncategorizedList.dataset.folderId = 'null'; 
        uncategorizedDocs.forEach(doc => {
            uncategorizedList.appendChild(createSidebarListItem(doc));
        });
        sidebarTitles.appendChild(uncategorizedList);
    }

    const currentDocStillExists = docsForCurrentSection.some(d => d.uniqueId === window.currentDisplayedDocumentId);
    
    if (docsForCurrentSection.length === 0) {
        contentDisplayArea.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">No documents in this section. Add one or switch sections.</p>`;
        mainContentActionButtons.classList.add('hidden');
        window.currentDisplayedDocumentId = null;
        hideEditor();
        currentDocumentTitle.textContent = 'No Document Selected';
    } else if (window.currentDisplayedDocumentId && currentDocStillExists) {
        displaySelectedContent(window.currentDisplayedDocumentId);
    } else {
        const lastOpenedId = localStorage.getItem(LAST_OPENED_DOC_KEY);
        const lastDocStillExists = docsForCurrentSection.some(d => d.uniqueId === lastOpenedId);
        
        if (lastOpenedId && lastDocStillExists) {
             displaySelectedContent(lastOpenedId);
        } else {
            displaySelectedContent(docsForCurrentSection[0].uniqueId);
        }
    }
}


function updateSectionToggleBtn() {
    sectionToggleBtn.textContent = currentSection === 'js' ? 'Switch to React Section' : 'Switch to JS Section';
    updateSectionIconDisplay(currentSection);
}
sectionToggleBtn.addEventListener('click', () => {
    currentSection = currentSection === 'js' ? 'react' : 'js';
    showMessage('Section Changed', `Switched to ${currentSection.toUpperCase()} Section.`, 'info');
    localStorage.setItem(CURRENT_SECTION_STORAGE_KEY, currentSection);
    updateSectionToggleBtn(); 
    updateSidebarTitles(); 
});


function updateFullscreenToggleIcon() {
    fullscreenToggle.innerHTML = document.fullscreenElement ? '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H4m0 0v4m0-4l5 5m7-5h4m0 0v4m0-4l-5 5M8 20H4m0 0v4m0 4l5-5m7 5h4m0 0v-4m0 4l-5-5"></path></svg>' : '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5"></path></svg>';
}
fullscreenToggle.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(err => showMessage('Fullscreen Error', `Error: ${err.message}`, 'error'));
    else if (document.exitFullscreen) document.exitFullscreen();
});
document.addEventListener('fullscreenchange', updateFullscreenToggleIcon);

scrollToTopBtn.addEventListener('click', () => {
    if (contentDisplayAreaWrapper) { contentDisplayAreaWrapper.scrollTop = 0; showMessage('Scrolled to Top', 'Content scrolled to the top.', 'info'); }
});

summarizeContentButton.addEventListener('click', async () => {
    const markdownText = readmeContent.value;
    if (!markdownText.trim()) { showMessage('Error', 'No content to summarize!', 'error'); return; }
    summarizeButtonText.classList.add('hidden'); summarizeSpinner.classList.remove('hidden'); summarizeContentButton.disabled = true;
    try {
        let chatHistory = [{ role: "user", parts: [{ text: `Summarize the following Markdown content concisely, focusing on key sections like project overview, installation, usage, and features. Keep it under 200 words. Do not include any conversational filler. Just the summary.\n\nContent:\n${markdownText}` }] }];
        const payload = { contents: chatHistory }; 
        const apiKey = ""; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`; 
        
        let response;
        const maxRetries = 5;
        let delay = 1000;
        for (let i = 0; i < maxRetries; i++) {
            response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (response.ok) break;
            if (response.status === 429 || response.status >= 500) {
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                } else {
                    const errorData = await response.json().catch(() => ({ error: { message: "Unknown API error during retry" } }));
                    throw new Error(`API Error after multiple retries: ${response.status} ${response.statusText} - ${errorData.error.message}`);
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: { message: "Unknown API error" } }));
                    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
            }
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: "Unknown API error" } }));
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
            const summary = result.candidates[0].content.parts[0].text;
            summaryContent.innerHTML = marked.parse(summary); applySyntaxHighlighting(); applyFontSize(fontSizeSlider.value);
            summaryModal.classList.remove('hidden'); showMessage('Summary Ready!', 'Content summary generated.', 'success');
        } else { console.error('Unexpected API response:', result); showMessage('Error', 'No valid summary from API.', 'error'); }
    } catch (error) { console.error('Error calling Gemini API:', error); showMessage('Summarization Error', `Issue generating summary: ${error.message}`, 'error');
    } finally { summarizeSpinner.classList.add('hidden'); summarizeButtonText.classList.remove('hidden'); summarizeContentButton.disabled = false; }
});
closeSummaryModal.addEventListener('click', () => { summaryModal.classList.add('hidden'); summaryContent.innerHTML = ''; });

function openSearchModal() { advancedSearchModal.classList.remove('hidden'); modalSearchTermInput.focus(); }
function closeSearchModal() { advancedSearchModal.classList.add('hidden'); }
if(openSearchModalBtn) openSearchModalBtn.addEventListener('click', openSearchModal);
if(closeSearchModalBtn) closeSearchModalBtn.addEventListener('click', closeSearchModal);
if(modalSearchScope) modalSearchScope.addEventListener('change', () => {
    modalSectionTypeFilterContainer.classList.toggle('hidden', modalSearchScope.value !== 'allDocuments');
});
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (!advancedSearchModal.classList.contains('hidden')) closeSearchModal();
        if (!summaryModal.classList.contains('hidden')) closeSummaryModal();
        if (!customConfirmModal.classList.contains('hidden')) { if(resolveConfirmPromise) resolveConfirmPromise(false); customConfirmModal.classList.add('hidden'); }
        if (sidebarContextMenu.classList.contains('show')) hideSidebarContextMenu(); 
        if (!folderManagementModal.classList.contains('hidden')) closeFolderModal(); 
        if (!uncategorizedDocsModal.classList.contains('hidden')) closeUncategorizedDocsModal(); 
        if (!loginModal.classList.contains('hidden')) closeLoginModal(); 
        if (document.getElementById('noteModal') && !document.getElementById('noteModal').classList.contains('hidden')) {
            if (window.closeNoteModal) window.closeNoteModal();
        }
    }
});

function clearSearchHighlights() {
    const highlights = contentDisplayArea.querySelectorAll('mark.search-highlight, mark.search-highlight-active');
    highlights.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) { while (mark.firstChild) parent.insertBefore(mark.firstChild, mark); try { parent.removeChild(mark); } catch (e) {} parent.normalize(); }
    });
    highlightedMatches = []; currentMatchIndex = -1;
}

function highlightSearchTermInCurrentDocument(searchTerm, isCaseSensitive, isWholeWord) {
    clearSearchHighlights(); currentInlineSearchTerm = searchTerm;
    if (!searchTerm.trim() || !contentDisplayArea) return;
    const flags = isCaseSensitive ? 'g' : 'gi';
    let regexTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) regexTerm = `\\b${regexTerm}\\b`;
    const regex = new RegExp(regexTerm, flags);
    function highlightNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let match; const text = node.nodeValue; const parent = node.parentNode;
            if (parent && (parent.nodeName === 'MARK' || parent.nodeName === 'SCRIPT' || parent.nodeName === 'STYLE')) return;
            const fragment = document.createDocumentFragment(); let currentPosition = 0;
            while ((match = regex.exec(text)) !== null) {
                if (match.index > currentPosition) fragment.appendChild(document.createTextNode(text.substring(currentPosition, match.index)));
                const mark = document.createElement('mark'); mark.className = 'search-highlight';
                mark.appendChild(document.createTextNode(match[0])); fragment.appendChild(mark);
                highlightedMatches.push(mark); currentPosition = regex.lastIndex;
            }
            if (currentPosition < text.length) fragment.appendChild(document.createTextNode(text.substring(currentPosition)));
            if (fragment.childNodes.length > 0 && parent) parent.replaceChild(fragment, node);
        } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE' && node.nodeName !== 'TEXTAREA') {
            const children = Array.from(node.childNodes);
            for (let i = 0; i < children.length; i++) highlightNode(children[i]);
        }
    }
    highlightNode(contentDisplayArea);
    if (highlightedMatches.length > 0) { currentMatchIndex = 0; navigateToInlineMatch(currentMatchIndex); }
}

function generateSnippet(text, regex, contextLength = 50) {
    const localRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
    const match = localRegex.exec(text);
    if (!match) return escapeHtml(text.substring(0, contextLength * 2) + (text.length > contextLength * 2 ? "..." : ""));
    const matchStart = match.index; const matchEnd = match.index + match[0].length;
    const start = Math.max(0, matchStart - contextLength); const end = Math.min(text.length, matchEnd + contextLength);
    let prefix = text.substring(start, matchStart); let suffix = text.substring(matchEnd, end);
    if (start > 0) prefix = "..." + prefix; if (end < text.length) suffix = suffix + "...";
    return `${escapeHtml(prefix)}<mark>${escapeHtml(match[0])}</mark>${escapeHtml(suffix)}`;
}
const escapeHtml = (unsafe) => {
    if (typeof unsafe !== 'string') return '';
    return unsafe.replace(/[&<"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '"': '&quot;', "'": '&#039;' }[m]));
};

async function performAdvancedSearchInModal() {
    const searchTerm = modalSearchTermInput.value.trim();
    if (!searchTerm) {
        showMessage('Search Term Required', 'Please enter a term to search.', 'warning');
        advancedSearchResultsContainer.innerHTML = ''; advancedSearchResultsPlaceholder.textContent = 'Please enter a search term.';
        advancedSearchResultsPlaceholder.classList.remove('hidden'); return;
    }
    const isCaseSensitive = modalSearchCaseSensitive.checked; const isWholeWord = modalSearchWholeWord.checked;
    const scope = modalSearchScope.value; const searchTitles = modalSearchInTitles.checked; const searchContent = modalSearchInContent.checked;
    if (!searchTitles && !searchContent) {
        showMessage('Search Target Required', 'Please select to search in Titles and/or Content.', 'warning');
        advancedSearchResultsContainer.innerHTML = ''; advancedSearchResultsPlaceholder.textContent = 'Select search in Titles or Content.';
        advancedSearchResultsPlaceholder.classList.remove('hidden'); return;
    }
    advancedSearchResultsContainer.innerHTML = `<div class="flex justify-center items-center h-full"><div class="spinner dark:border-slate-500/30 dark:border-t-slate-400"></div><p class="ml-2 dark:text-slate-300">Searching...</p></div>`;
    advancedSearchResultsPlaceholder.classList.add('hidden');
    let documentsToSearch = [];
    if (scope === 'currentDocument') { const currentDoc = documentsData.find(doc => doc.uniqueId === currentDisplayedDocumentId); if (currentDoc) documentsToSearch.push(currentDoc); }
    else if (scope === 'currentSection') documentsToSearch = documentsData.filter(doc => doc.type === currentSection);
    else {
        documentsToSearch = [...documentsData]; const selectedSectionTypes = [];
        if(modalFilterJS.checked) selectedSectionTypes.push('js'); if(modalFilterReact.checked) selectedSectionTypes.push('react');
        if (!modalSectionTypeFilterContainer.classList.contains('hidden') && selectedSectionTypes.length > 0) {
             documentsToSearch = documentsToSearch.filter(doc => selectedSectionTypes.includes(doc.type));
        } else if (!modalSectionTypeFilterContainer.classList.contains('hidden') && !modalFilterJS.checked && !modalFilterReact.checked) {
            documentsToSearch = [];
        }
    }
    const results = []; const flags = isCaseSensitive ? 'g' : 'gi';
    let regexTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) regexTerm = `\\b${regexTerm}\\b`;
    const testRegex = new RegExp(regexTerm, isCaseSensitive ? '' : 'i');
    const highlightRegex = new RegExp(regexTerm, flags);
    for (const doc of documentsToSearch) {
        let titleMatch = false; let contentMatchDetails = null;
        if (searchTitles && doc.title && testRegex.test(doc.title)) titleMatch = true;
        if (searchContent && doc.markdown && testRegex.test(doc.markdown)) {
            contentMatchDetails = { snippet: generateSnippet(doc.markdown, highlightRegex, 50) };
        }
        if (titleMatch || contentMatchDetails) {
            results.push({ docId: doc.uniqueId, docType: doc.type, title: doc.title, matchedInTitle: titleMatch, contentMatch: contentMatchDetails, originalSearchTerm: searchTerm });
        }
    }
    setTimeout(() => renderAdvancedSearchResults(results), 50);
}

function renderAdvancedSearchResults(results) {
    advancedSearchResultsContainer.innerHTML = '';
    if (results.length === 0) {
        advancedSearchResultsPlaceholder.textContent = 'No results found.';
        advancedSearchResultsPlaceholder.classList.remove('hidden'); return;
    }
    advancedSearchResultsPlaceholder.classList.add('hidden');
    const ul = document.createElement('ul'); ul.className = 'divide-y divide-gray-200 dark:divide-slate-700';
    results.forEach(result => {
        const li = document.createElement('li'); li.className = 'search-result-item'; li.setAttribute('data-doc-id', result.docId);
        const sectionIconData = sectionIcons[result.docType];
        if (sectionIconData) { const iconImg = document.createElement('img'); iconImg.src = sectionIconData.url; iconImg.alt = sectionIconData.altText; iconImg.className = 'search-result-section-icon'; li.appendChild(iconImg); }
        else { const iconPlaceholder = document.createElement('div'); iconPlaceholder.className = 'search-result-section-icon bg-gray-300 dark:bg-gray-600 rounded-sm'; li.appendChild(iconPlaceholder); }
        const textContentDiv = document.createElement('div'); textContentDiv.className = 'search-result-text-content';
        let matchIndicatorHtml = '';
        if (result.matchedInTitle && result.contentMatch) matchIndicatorHtml = '<span class="text-xs bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-200 px-1.5 py-0.5 rounded-full ml-2 whitespace-nowrap">Title & Content</span>';
        else if (result.matchedInTitle) matchIndicatorHtml = '<span class="text-xs bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded-full ml-2 whitespace-nowrap">Title</span>';
        else if (result.contentMatch) matchIndicatorHtml = '<span class="text-xs bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200 px-1.5 py-0.5 rounded-full ml-2 whitespace-nowrap">Content</span>';
        const titleWrapperDiv = document.createElement('div'); titleWrapperDiv.className = 'search-result-title-wrapper';
        const titleDiv = document.createElement('div'); titleDiv.className = 'search-result-title';
        titleDiv.innerHTML = highlightText(result.title, result.originalSearchTerm, modalSearchCaseSensitive.checked, modalSearchWholeWord.checked);
        titleWrapperDiv.appendChild(titleDiv); titleWrapperDiv.innerHTML += matchIndicatorHtml;
        textContentDiv.appendChild(titleWrapperDiv);
        if (result.contentMatch && result.contentMatch.snippet) {
            const snippetP = document.createElement('p'); snippetP.className = 'search-result-snippet';
            snippetP.innerHTML = result.contentMatch.snippet; textContentDiv.appendChild(snippetP);
        }
        li.appendChild(textContentDiv);
        li.addEventListener('click', () => {
            closeSearchModal();
            const targetDoc = documentsData.find(doc => doc.uniqueId === result.docId);
            if (targetDoc && targetDoc.type !== currentSection) {
                currentSection = targetDoc.type; localStorage.setItem(CURRENT_SECTION_STORAGE_KEY, currentSection);
                updateSectionToggleBtn(); updateSidebarTitles();
                setTimeout(() => displaySelectedContent(result.docId, result.originalSearchTerm), 50);
            } else { displaySelectedContent(result.docId, result.originalSearchTerm); }

            // NEW: Close sidebar on mobile after search selection
            if (window.innerWidth < 768) {
                toggleSidebarState(true); 
            }
        });
        ul.appendChild(li);
    });
    advancedSearchResultsContainer.appendChild(ul);
}

function highlightText(text, term, isCaseSensitive, isWholeWord) {
    if (!term || !text) return escapeHtml(text);
    try {
        const flags = isCaseSensitive ? 'g' : 'gi';
        let regexTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (isWholeWord) regexTerm = `\\b${regexTerm}\\b`;
        const regex = new RegExp(regexTerm, flags);
        return escapeHtml(text).replace(regex, '<mark class="search-highlight-active">$&</mark>');
    } catch (e) { console.error("Error creating regex for highlighting text:", e); return escapeHtml(text); }
}

executeAdvancedSearchBtn.addEventListener('click', performAdvancedSearchInModal);
modalSearchTermInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') performAdvancedSearchInModal(); });

if (backupAllButton) backupAllButton.addEventListener('click', backupAllDocuments);
if (restoreAllButton) restoreAllButton.addEventListener('click', restoreDocuments);

// --- AUTH LOGIC (MODIFIED: No Anonymous) ---

function openLoginModal(isSignUp = false) {
    isSigningUp = isSignUp;
    loginModalTitle.textContent = isSignUp ? 'Sign Up' : 'Log In';
    loginSubmitText.textContent = isSignUp ? 'Sign Up' : 'Log In';
    switchToSignUpBtn.textContent = isSignUp ? 'Log In' : 'Sign Up';
    authErrorMsg.textContent = '';
    authErrorMsg.classList.add('hidden');
    loginEmail.value = '';
    loginPassword.value = '';
    loginModal.classList.remove('hidden');
    loginEmail.focus();
}

function closeLoginModal() {
    loginModal.classList.add('hidden');
    loginSpinner.classList.add('hidden');
    loginSubmitText.classList.remove('hidden');
    loginSubmitBtn.disabled = false;
}

function updateAuthUI(user) {
    if (user) {
        // Logged in with email/password
        authButtonText.textContent = `Logout (${user.email.split('@')[0]})`;
        authIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1"></path>`; // Logout icon
        showMessage('Status', `Logged in as: ${user.email}`, 'success');
        // Enable features
        addEditDocumentSidebarBtn.disabled = false;
        manageFoldersBtn.disabled = false;
        deleteAllCurrentSectionButton.disabled = false;
        backupAllButton.disabled = false;
        restoreAllButton.disabled = false;
        saveAllNotesButton.disabled = false;
        restoreNotesButton.disabled = false;
        
    } else {
        // Logged out / Public session
        authButtonText.textContent = 'Login / Sign Up';
        authIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1"></path>`; // Login icon
        // Disable features
        addEditDocumentSidebarBtn.disabled = true;
        manageFoldersBtn.disabled = true;
        deleteAllCurrentSectionButton.disabled = true;
        // NOTE: We keep backup/restore buttons enabled as they handle local data/files, 
        // but the Firestore restore operation is blocked inside restoreDocuments()
        backupAllButton.disabled = false; // Allow backup of limited/cached data
        restoreAllButton.disabled = false; // Allow restoration of local files
        saveAllNotesButton.disabled = false;
        restoreNotesButton.disabled = false;
    }
    updateSidebarTitles(); 
}

async function handleAuthSubmit() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    authErrorMsg.classList.add('hidden');

    if (!email || !password) {
        authErrorMsg.textContent = 'Email and password are required.';
        authErrorMsg.classList.remove('hidden');
        return;
    }

    loginSpinner.classList.remove('hidden');
    loginSubmitText.classList.add('hidden');
    loginSubmitBtn.disabled = true;

    try {
        if (isSigningUp) {
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage('Success', 'Account created and logged in!', 'success');
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage('Success', 'Successfully logged in!', 'success');
        }
        closeLoginModal();
    } catch (error) {
        console.error("Auth Error:", error);
        let msg = 'Authentication failed. Please check your credentials.';
        if (error.code === 'auth/email-already-in-use') {
            msg = 'This email is already in use. Try logging in or use a different email.';
        } else if (error.code === 'auth/invalid-email') {
             msg = 'Invalid email address format.';
        } else if (error.code === 'auth/weak-password') {
            msg = 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            msg = 'Invalid email or password.';
        }
        authErrorMsg.textContent = msg;
        authErrorMsg.classList.remove('hidden');
    } finally {
        loginSpinner.classList.add('hidden');
        loginSubmitText.classList.remove('hidden');
        loginSubmitBtn.disabled = false;
    }
}

async function handleLogout() {
    const confirmed = await showCustomConfirm('Are you sure you want to log out? You will not be able to view or save your private data until you log in again.');
    if (confirmed) {
        try {
            await signOut(auth);
            showMessage('Logged Out', 'Successfully logged out. Please log in to access your data.', 'info');
            closeMenu();
        } catch (error) {
            console.error("Logout Error:", error);
            showMessage('Logout Error', 'Failed to log out.', 'error');
        }
    }
}

authButton.addEventListener('click', () => {
    const user = window.auth.currentUser;
    if (user) { 
        handleLogout();
    } else {
        openLoginModal(false); 
        closeMenu(); 
    }
});

closeLoginModalBtn.addEventListener('click', closeLoginModal);
loginSubmitBtn.addEventListener('click', handleAuthSubmit);
switchToSignUpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openLoginModal(!isSigningUp);
});
loginPassword.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleAuthSubmit();
    }
});


// --- FOLDER MANAGEMENT LOGIC (Modified: Authentication Check) ---

function openFolderModal() {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to manage folders.', 'warning');
        return;
    }
    populateFolderManagementModal();
    folderManagementModal.classList.remove('hidden');
    closeMenu(); // Close hamburger menu
    hideDocumentMovementButtons();
}

function closeFolderModal() {
    folderManagementModal.classList.add('hidden');
    hideDocumentMovementButtons();
}

// NOTE: createFolder, deleteFolder, renameFolder are defined here and are accessible to event listeners

/**
 * Creates a new folder in Firestore.
 */
async function createFolder() {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to create folders.', 'warning');
        return;
    }

    const folderName = newFolderNameInput.value.trim();
    if (!folderName) {
        showMessage('Error', 'Folder name cannot be empty.', 'error');
        return;
    }
    
    const foldersPath = getCollectionPath('folders');
    const newFolderId = doc(collection(window.db, foldersPath)).id;
    const lastOrderIndex = foldersData.reduce((max, folder) => Math.max(max, folder.orderIndex), 0);
    
    const newFolderData = {
        id: newFolderId,
        name: folderName,
        type: currentSection,
        isOpen: false, // NEW: Default to closed
        orderIndex: lastOrderIndex + 1
    };
    
    await saveDocumentToFirestore(newFolderData, 'folders', newFolderId);

    newFolderNameInput.value = '';
    showMessage('Success', `Folder "${folderName}" created.`, 'success');
    // UI update handled by onSnapshot listener, but explicit call here for immediate modal feedback
    if (!folderManagementModal.classList.contains('hidden')) {
        populateFolderManagementModal();
    }
}

/**
 * Deletes a folder and moves its contents to uncategorized.
 */
async function deleteFolder(folderId) {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to delete folders.', 'warning');
        return;
    }

    const folder = foldersData.find(f => f.id === folderId);
    if (!folder) return;

    const confirmed = await showCustomConfirm(`Are you sure you want to delete the folder "${folder.name}"? All documents inside will become uncategorized.`);
    if (confirmed) {
        const docsPath = getCollectionPath('documents');
        const foldersPath = getCollectionPath('folders');
        const batch = writeBatch(window.db);

        const docsInFolder = documentsData.filter(doc => doc.folderId === folderId);
        docsInFolder.forEach(docToUpdate => {
            const docRef = doc(window.db, docsPath, docToUpdate.uniqueId);
            batch.update(docRef, { folderId: null });
        });
        
        batch.delete(doc(window.db, foldersPath, folderId));

        try {
            await batch.commit();
            showMessage('Success', `Folder "${folder.name}" deleted.`, 'success');
            // FIX 3: Explicitly call populateFolderManagementModal after batch commit
            if (!folderManagementModal.classList.contains('hidden')) {
                populateFolderManagementModal();
            }
        } catch (error) {
            console.error("Error batch deleting folder:", error);
            showMessage('Firestore Error', `Failed to delete folder: ${error.message}`, 'error');
        }
    }
}


function showUncategorizedDocumentsModal(folderId) {
     if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to manage folders.', 'warning');
        return;
    }
    currentFolderIdForAssignment = folderId;
    uncategorizedDocsList.innerHTML = ''; 

    const uncategorizedDocs = documentsData.filter(doc => doc.folderId === null && doc.type === currentSection);

    if (uncategorizedDocs.length === 0) {
        uncategorizedDocsList.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">No uncategorized documents in this section.</p>';
        addSelectedDocsToFolderBtn.disabled = true;
    } else {
        addSelectedDocsToFolderBtn.disabled = false;
        uncategorizedDocs.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'flex items-center p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `uncategorized-doc-${doc.uniqueId}`;
            checkbox.value = doc.uniqueId;
            checkbox.classList.add('form-checkbox', 'h-4', 'w-4', 'text-blue-600', 'rounded', 'border-gray-300', 'dark:border-slate-500', 'focus:ring-blue-500', 'dark:bg-slate-600', 'dark:checked:bg-blue-500', 'shadow-sm', 'mr-2');
            const label = document.createElement('label');
            label.htmlFor = `uncategorized-doc-${doc.uniqueId}`;
            label.textContent = doc.title;
            label.classList.add('text-gray-700', 'dark:text-slate-200', 'cursor-pointer');
            div.appendChild(checkbox);
            div.appendChild(label);
            uncategorizedDocsList.appendChild(div);
        });
    }

    uncategorizedDocsModal.classList.remove('hidden');
}

function closeUncategorizedDocsModal() {
    uncategorizedDocsModal.classList.add('hidden');
    uncategorizedDocsList.innerHTML = '';
    currentFolderIdForAssignment = null;
}

async function addSelectedDocsToFolder() {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to manage folders.', 'warning');
        return;
    }
    if (!currentFolderIdForAssignment) return;

    const checkboxes = uncategorizedDocsList.querySelectorAll('input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
        showMessage('No Selection', 'Please select at least one document to add.', 'warning');
        return;
    }
    
    const docsPath = getCollectionPath('documents');
    const batch = writeBatch(window.db);

    checkboxes.forEach(checkbox => {
        const docId = checkbox.value;
        const docToUpdate = documentsData.find(d => d.uniqueId === docId);

        if (docToUpdate) {
            const docRef = doc(window.db, docsPath, docId);
            batch.update(docRef, { folderId: currentFolderIdForAssignment });
        }
    });

    try {
        await batch.commit();
        closeUncategorizedDocsModal();
        showMessage('Documents Added', `Selected documents moved to folder.`, 'success');
        // FIX 4: Explicitly call populateFolderManagementModal after batch commit
        if (!folderManagementModal.classList.contains('hidden')) {
            populateFolderManagementModal();
        }
    } catch (error) {
        console.error("Error batch updating documents folderId:", error);
        showMessage('Firestore Error', `Failed to move documents: ${error.message}`, 'error');
    }
}

function selectDocumentForMovement(docId) {
    if (folderManagementModal.classList.contains('hidden') || window.userId === 'logged_out_public_session') {
        return;
    }

    const currentlySelected = folderListContainer.querySelector('.folder-item-doc.selected-for-movement');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected-for-movement');
    }

    const newlySelected = folderListContainer.querySelector(`[data-unique-id="${docId}"]`);
    if (newlySelected) {
        newlySelected.classList.add('selected-for-movement');
        selectedDocIdForMovement = docId;
        showDocumentMovementButtons(); 
        updateDocumentMovementButtonStates();
    } else {
        selectedDocIdForMovement = null;
        hideDocumentMovementButtons();
    }
}

function showDocumentMovementButtons() {
    documentMovementButtons.classList.remove('hidden');
}

function hideDocumentMovementButtons() {
    documentMovementButtons.classList.add('hidden');
    selectedDocIdForMovement = null;
    const currentlySelected = folderListContainer.querySelector('.folder-item-doc.selected-for-movement');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected-for-movement');
    }
}

function updateDocumentMovementButtonStates() {
    if (!selectedDocIdForMovement || window.userId === 'logged_out_public_session') {
        moveDocUpFixedBtn.disabled = true;
        moveDocDownFixedBtn.disabled = true;
        moveDocToFolderFixedBtn.disabled = true;
        return;
    }

    const docToMove = documentsData.find(d => d.uniqueId === selectedDocIdForMovement);
    if (!docToMove) {
        moveDocUpFixedBtn.disabled = true;
        moveDocDownFixedBtn.disabled = true;
        moveDocToFolderFixedBtn.disabled = true;
        return;
    }

    const currentFolderId = docToMove.folderId;
    const relevantDocs = documentsData.filter(d => d.type === currentSection && d.folderId === currentFolderId);
    relevantDocs.sort((a, b) => a.orderIndex - b.orderIndex);

    const docIndexInRelevant = relevantDocs.findIndex(d => d.uniqueId === selectedDocIdForMovement);

    moveDocUpFixedBtn.disabled = docIndexInRelevant <= 0;
    moveDocDownFixedBtn.disabled = docIndexInRelevant >= relevantDocs.length - 1;
    
    const otherFoldersExist = foldersData.some(f => f.type === currentSection && f.id !== currentFolderId);
    const hasUncategorizedOption = docToMove.folderId !== null; 
    
    if (!otherFoldersExist && !hasUncategorizedOption) {
        moveDocToFolderFixedBtn.disabled = true;
    } else {
        moveDocToFolderFixedBtn.disabled = false;
    }
}


async function moveItemInModal(itemId, isFolder, direction) {
    if (window.userId === 'logged_out_public_session') {
        showMessage('Access Denied', 'Please log in to reorder content.', 'warning');
        return;
    }

    let collectionData = isFolder ? foldersData : documentsData;
    let relevantItems;
    let collectionName = isFolder ? 'folders' : 'documents';
    
    if (isFolder) {
        relevantItems = collectionData.filter(f => f.type === currentSection);
        relevantItems.sort((a, b) => a.orderIndex - b.orderIndex);
    } else { 
        const itemToMove = collectionData.find(doc => doc.uniqueId === itemId);
        if (!itemToMove) return;
        const currentFolderId = itemToMove.folderId;
        relevantItems = collectionData.filter(doc => doc.type === currentSection && doc.folderId === currentFolderId);
        relevantItems.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    const currentItemRelevantIndex = isFolder ? relevantItems.findIndex(f => f.id === itemId) : relevantItems.findIndex(d => d.uniqueId === itemId);
    if (currentItemRelevantIndex === -1) return;

    if ((direction === 'up' && currentItemRelevantIndex === 0) || 
        (direction === 'down' && currentItemRelevantIndex === relevantItems.length - 1)) {
        showMessage('Info', `Cannot move ${isFolder ? 'folder' : 'document'} further in this direction.`, 'info');
        return;
    }

    const newRelevantIndex = direction === 'up' ? currentItemRelevantIndex - 1 : currentItemRelevantIndex + 1;
    
    const itemToMove = relevantItems[currentItemRelevantIndex];
    const itemToSwap = relevantItems[newRelevantIndex];

    const batch = writeBatch(window.db);
    const path = getCollectionPath(collectionName);

    const newOrderIndexForMoved = itemToSwap.orderIndex;
    const newOrderIndexForSwapped = itemToMove.orderIndex;
    
    const movedDocRef = doc(window.db, path, isFolder ? itemToMove.id : itemToMove.uniqueId);
    batch.update(movedDocRef, { orderIndex: newOrderIndexForMoved });

    const swappedDocRef = doc(window.db, path, isFolder ? itemToSwap.id : itemToSwap.uniqueId);
    batch.update(swappedDocRef, { orderIndex: newOrderIndexForSwapped });

    try {
        await batch.commit();
        showMessage('Reordered', `${isFolder ? 'Folder' : 'Document'} reordered.`, 'success');
        // FIX 5: Explicitly call populateFolderManagementModal after batch commit
        if (!folderManagementModal.classList.contains('hidden')) {
            populateFolderManagementModal();
        }
    } catch (error) {
        console.error("Error batch updating order:", error);
        showMessage('Firestore Error', `Failed to reorder: ${error.message}`, 'error');
    }
}

function populateFolderManagementModal() {
    folderListContainer.innerHTML = '';
    const foldersForCurrentSection = foldersData.filter(f => f.type === currentSection).sort((a,b) => a.orderIndex - b.orderIndex);
    const docsForCurrentSection = documentsData.filter(d => d.type === currentSection).sort((a,b) => a.orderIndex - b.orderIndex);

    let draggedItemInfo = null;
    let draggedElement = null;

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedItemInfo || window.userId === 'logged_out_public_session') return;

        document.querySelectorAll('.drop-target-folder, .drop-target-doc').forEach(el => {
            el.classList.remove('drop-target-folder', 'drop-target-doc');
        });
        if (draggedElement) draggedElement.classList.remove('dragging');

        const targetElement = e.currentTarget;
        const docsPath = getCollectionPath('documents');

        if (draggedItemInfo.type === 'document') {
            const draggedDocId = draggedItemInfo.id;
            const draggedDoc = documentsData.find(d => d.uniqueId === draggedDocId);
            if (!draggedDoc) return;
            
            const batch = writeBatch(window.db);
            const docRef = doc(window.db, docsPath, draggedDocId);
            let updateNeeded = false;
            let moveSuccess = false;

            if (targetElement.classList.contains('folder-item') || targetElement.classList.contains('uncategorized-container')) {
                const targetFolderElement = targetElement.closest('.folder-item, .uncategorized-container');
                const targetFolderId = targetFolderElement.dataset.folderId === 'null' ? null : targetFolderElement.dataset.folderId;
                
                if (draggedDoc.folderId !== targetFolderId) {
                    batch.update(docRef, { folderId: targetFolderId });
                    updateNeeded = true;
                    moveSuccess = true;
                    showMessage('Moved', `Document "${draggedDoc.title}" moved to ${targetFolderId ? 'folder' : 'uncategorized'}.`, 'success');
                }
            } 
            else if (targetElement.dataset.uniqueId) {
                const targetDocId = targetElement.dataset.uniqueId;
                const targetDoc = documentsData.find(d => d.uniqueId === targetDocId);

                if (draggedDocId !== targetDocId && targetDoc && targetDoc.folderId === draggedDoc.folderId) {
                    const relevantDocs = docsForCurrentSection.filter(d => d.folderId === draggedDoc.folderId).sort((a,b) => a.orderIndex - b.orderIndex);
                    
                    const currentIndex = relevantDocs.findIndex(d => d.uniqueId === draggedDocId);
                    const targetIndex = relevantDocs.findIndex(d => d.uniqueId === targetDocId);

                    if (currentIndex > -1 && targetIndex > -1) {
                        const [movedDocLocal] = relevantDocs.splice(currentIndex, 1);
                        relevantDocs.splice(targetIndex, 0, movedDocLocal);

                        relevantDocs.forEach((docItem, index) => {
                            if (docItem.orderIndex !== index) {
                                const docToUpdateRef = doc(window.db, docsPath, docItem.uniqueId);
                                batch.update(docToUpdateRef, { orderIndex: index });
                                updateNeeded = true;
                            }
                        });
                        moveSuccess = true;
                        showMessage('Reordered', `Document "${draggedDoc.title}" reordered.`, 'success');
                    }
                }
            }

            if (updateNeeded) {
                await batch.commit();
                // FIX 6: Explicitly call populateFolderManagementModal after batch commit
                populateFolderManagementModal();
            } else if (moveSuccess) {
                 // UI update handled by onSnapshot listener if it triggered a change, but explicit call here for safety
                 populateFolderManagementModal();
            } else {
                showMessage('Info', 'No change in folder or order.', 'info');
            }
        }
        else if (draggedItemInfo.type === 'folder' && targetElement.classList.contains('folder-item')) {
            const targetFolderId = targetElement.dataset.folderId;
            if (draggedItemInfo.id !== targetFolderId) {
                const relevantFolders = foldersForCurrentSection;
                const currentIndex = relevantFolders.findIndex(f => f.id === draggedItemInfo.id);
                const targetIndex = relevantFolders.findIndex(f => f.id === targetFolderId);

                if (currentIndex > -1 && targetIndex > -1) {
                    const [movedFolderLocal] = relevantFolders.splice(currentIndex, 1);
                    relevantFolders.splice(targetIndex, 0, movedFolderLocal);

                    const foldersPath = getCollectionPath('folders');
                    const folderBatch = writeBatch(window.db);
                    let updateNeeded = false;

                    relevantFolders.forEach((folderItem, index) => {
                        if (folderItem.orderIndex !== index) {
                            const folderToUpdateRef = doc(window.db, foldersPath, folderItem.id);
                            folderBatch.update(folderToUpdateRef, { orderIndex: index });
                            updateNeeded = true;
                        }
                    });

                    if (updateNeeded) {
                        await folderBatch.commit();
                        showMessage('Reordered', `Folder reordered.`, 'success');
                        // FIX 7: Explicitly call populateFolderManagementModal after batch commit
                        populateFolderManagementModal();
                    }
                }
            }
        }
        
        draggedItemInfo = null;
        draggedElement = null;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        document.querySelectorAll('.drop-target-folder, .drop-target-doc').forEach(el => el.classList.remove('drop-target-folder', 'drop-target-doc'));

        const targetElement = e.currentTarget;
        if (draggedItemInfo.type === 'folder' && targetElement.classList.contains('folder-item') && draggedItemInfo.id !== targetElement.dataset.folderId) {
            targetElement.classList.add('drop-target-folder');
        } else if (draggedItemInfo.type === 'document') {
            if (targetElement.classList.contains('folder-item') || targetElement.classList.contains('uncategorized-container')) {
                targetElement.classList.add('drop-target-folder');
            } else if (targetElement.classList.contains('folder-item-doc') && draggedItemInfo.id !== targetElement.dataset.uniqueId) {
                 targetElement.classList.add('drop-target-doc');
            }
        }
    };
    
    foldersForCurrentSection.forEach(folder => {
        const folderItem = document.createElement('details');
        folderItem.className = 'folder-item';
        folderItem.dataset.folderId = folder.id;
        // NEW: Default to closed (false)
        folderItem.open = false; 

        if (window.userId !== 'logged_out_public_session') {
            folderItem.draggable = true;
            folderItem.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                draggedItemInfo = { type: 'folder', id: folder.id };
                draggedElement = folderItem;
                setTimeout(() => folderItem.classList.add('dragging'), 0);
            });
            folderItem.addEventListener('dragend', () => folderItem.classList.remove('dragging'));
            folderItem.addEventListener('dragover', handleDragOver);
            folderItem.addEventListener('drop', handleDrop);
        }

        const summary = document.createElement('summary');
        summary.className = 'flex justify-between items-center p-3 bg-gray-100 dark:bg-slate-700 font-bold cursor-pointer rounded-t-lg';
        summary.innerHTML = `
            <span class="flex-grow">${folder.name}</span>
            <div class="flex items-center space-x-2">
                <button onclick="event.preventDefault(); showUncategorizedDocumentsModal('${folder.id}')" class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors" title="Add Uncategorized Docs" ${window.userId === 'logged_out_public_session' ? 'disabled' : ''}>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </button>
                <button onclick="event.preventDefault(); renameFolder('${folder.id}')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors" title="Rename Folder" ${window.userId === 'logged_out_public_session' ? 'disabled' : ''}>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="event.preventDefault(); deleteFolder('${folder.id}')" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800 transition-colors" title="Delete Folder" ${window.userId === 'logged_out_public_session' ? 'disabled' : ''}>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <svg class="folder-arrow w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
        `;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'folder-item-content bg-white dark:bg-slate-800 rounded-b-lg';
        const ul = document.createElement('ul');
        ul.className = 'list-inside text-sm text-gray-700 dark:text-slate-200';

        const docsInFolder = docsForCurrentSection.filter(d => d.folderId === folder.id).sort((a,b) => a.orderIndex - b.orderIndex);
        docsInFolder.forEach(doc => {
            const li = document.createElement('li');
            li.className = 'folder-item-doc p-2';
            li.dataset.uniqueId = doc.uniqueId;
            li.textContent = doc.title;

            if (window.userId !== 'logged_out_public_session') {
                li.draggable = true;
                li.addEventListener('dragstart', (e) => {
                    e.stopPropagation();
                    draggedItemInfo = { type: 'document', id: doc.uniqueId };
                    draggedElement = li;
                    setTimeout(() => li.classList.add('dragging'), 0);
                });
                li.addEventListener('dragend', () => li.classList.remove('dragging'));
                li.addEventListener('dragover', handleDragOver);
                li.addEventListener('drop', handleDrop);
                
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectDocumentForMovement(doc.uniqueId);
                });
            } else {
                li.classList.add('opacity-50', 'cursor-not-allowed');
            }

            ul.appendChild(li);
        });

        contentDiv.appendChild(ul);
        folderItem.appendChild(summary); 
        folderItem.appendChild(contentDiv);
        folderListContainer.appendChild(folderItem);
    });

    const uncategorizedDocs = docsForCurrentSection.filter(d => d.folderId === null).sort((a,b) => a.orderIndex - b.orderIndex);
    if (uncategorizedDocs.length > 0) {
        const uncategorizedContainer = document.createElement('div');
        uncategorizedContainer.className = 'uncategorized-container mt-4';
        uncategorizedContainer.dataset.folderId = 'null'; 

        if (window.userId !== 'logged_out_public_session') {
            uncategorizedContainer.addEventListener('dragover', handleDragOver);
            uncategorizedContainer.addEventListener('drop', handleDrop);
        }

        const header = document.createElement('h4');
        header.className = 'text-md font-semibold text-gray-700 dark:text-slate-300 mb-2 px-1';
        header.textContent = 'Uncategorized Documents';
        uncategorizedContainer.appendChild(header);

        const list = document.createElement('ul');
        list.className = 'space-y-1 mt-2 p-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700';
        uncategorizedDocs.forEach(doc => {
            const li = document.createElement('li');
            li.className = 'folder-item-doc p-2';
            li.dataset.uniqueId = doc.uniqueId;
            li.textContent = doc.title;

            if (window.userId !== 'logged_out_public_session') {
                li.draggable = true;
                li.addEventListener('dragstart', (e) => {
                    e.stopPropagation();
                    draggedItemInfo = { type: 'document', id: doc.uniqueId };
                    draggedElement = li;
                    setTimeout(() => li.classList.add('dragging'), 0);
                });
                li.addEventListener('dragend', () => li.classList.remove('dragging'));
                li.addEventListener('dragover', handleDragOver);
                li.addEventListener('drop', handleDrop);
                
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectDocumentForMovement(doc.uniqueId);
                });
            } else {
                li.classList.add('opacity-50', 'cursor-not-allowed');
            }
            
            list.appendChild(li);
        });
        uncategorizedContainer.appendChild(list);
        folderListContainer.appendChild(uncategorizedContainer);
    }

    hideDocumentMovementButtons();
}

// Event Listeners for Folder Management
manageFoldersBtn.addEventListener('click', openFolderModal);
closeFolderModalBtn.addEventListener('click', closeFolderModal);
createFolderBtn.addEventListener('click', createFolder);

newFolderNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createFolder();
    }
});

closeUncategorizedModalBtn.addEventListener('click', closeUncategorizedDocsModal);
addSelectedDocsToFolderBtn.addEventListener('click', addSelectedDocsToFolder);

// --- FIX: Expose functions globally for inline HTML attributes (onclick) ---
window.renameFolder = renameFolder;
window.deleteFolder = deleteFolder;
window.showUncategorizedDocumentsModal = showUncategorizedDocumentsModal;
// -------------------------------------------------------------------------
