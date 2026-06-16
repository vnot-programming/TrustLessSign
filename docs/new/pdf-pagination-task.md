# Task List: PDF Pagination & Specific Page Selection

## Sprint 5: PDF Pagination & Specific Page Selection
**STATUS:** PENDING  
**Assigned to:** Frontend/Extension Team

### Task 5.1: Web Dashboard Implementation
- [x] Add Page Navigation UI (Prev, Next, Go To, Page X of Y) in `SignDocument.jsx`.
- [x] Connect `pageNumber` state to Navigation UI.
- [x] Ensure `pageNumber` state bounds are valid (1 to `numPages`).

### Task 5.2: Chrome & Safari Extension Implementation
- [x] Add Page Navigation UI in `popup.html`.
- [x] Implement global `currentPage` state and `renderPage(pageNumber)` function in `popup.js`.
- [x] Add Event Listeners for Prev/Next and "Go to" input.
- [x] Bind `currentPage` to the `TRUSTLESS_SIGN_REQUEST` payload.

### Task 5.3: Verification & Polish
- [ ] Upload a multi-page PDF in Web Dashboard, test navigation and jumping to a specific page.
- [ ] Upload a multi-page PDF in Extension, test navigation and jumping.
- [ ] Verify placing the QR/Image on a non-first page actually embeds correctly on that target page.
