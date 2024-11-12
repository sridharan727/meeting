// Firebase references
const auth = firebase.auth();
const db = firebase.database();

// PDF.js setup
const url = 'path_to_your_pdf_file.pdf'; // Update with the actual PDF file URL
let pdfDoc = null;
let currentPage = 1;

// HTML elements
const pdfViewer = document.getElementById('pdfViewer');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageStatus = document.getElementById('pageStatus');

// Function to render the current page
const renderPage = async (num) => {
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1.5 });
    pdfViewer.width = viewport.width;
    pdfViewer.height = viewport.height;

    const ctx = pdfViewer.getContext('2d');
    const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
    };
    await page.render(renderContext).promise;
    pageStatus.textContent = `Page ${num}`;
};

// Function to load the PDF document
const loadPDF = async () => {
    const loadingTask = pdfjsLib.getDocument(url);
    pdfDoc = await loadingTask.promise;
    renderPage(currentPage);
};

// Function to update the current page in Firebase
const updatePageInFirebase = (pageNum) => {
    const sessionRef = db.ref('sessions/defaultSession');
    sessionRef.update({ currentPage: pageNum });
};

// Function to synchronize the page with Firebase updates
const syncPage = () => {
    const sessionRef = db.ref('sessions/defaultSession');
    sessionRef.on('value', (snapshot) => {
        const sessionData = snapshot.val();
        if (sessionData && sessionData.currentPage !== currentPage) {
            currentPage = sessionData.currentPage;
            renderPage(currentPage);
        }
    });
};

// Initialize Firebase authentication and handle user roles
const initAuth = () => {
    auth.signInAnonymously().then(() => {
        const isAdmin = confirm("Are you the admin?");
        if (isAdmin) {
            prevPageBtn.disabled = false;
            nextPageBtn.disabled = false;
        } else {
            syncPage();
        }
    }).catch((error) => {
        console.error("Error signing in:", error);
    });
};

// Event listeners for navigation buttons
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
        updatePageInFirebase(currentPage);
    }
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage < pdfDoc.numPages) {
        currentPage++;
        renderPage(currentPage);
        updatePageInFirebase(currentPage);
    }
});

// Load the PDF and initialize Firebase authentication
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';
loadPDF();
initAuth();
