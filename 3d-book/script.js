document.addEventListener('DOMContentLoaded', () => {
    const scene = document.getElementById('scene');
    const book = document.getElementById('book');
    const pages = document.querySelectorAll('.page');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageIndicator = document.getElementById('page-indicator');
    
    let isBookOpen = false;
    let currentPageIndex = 0; // 0 means at page 1, 1 means page 1 flipped, etc.

    // Initialize z-index ordering for resting stack
    function updateZIndices() {
        pages.forEach((page, i) => {
            if (page.classList.contains('flipped')) {
                page.style.zIndex = 10 + i;
            } else {
                page.style.zIndex = pages.length - i;
            }
        });
    }
    updateZIndices();

    function updateIndicator() {
        if (!isBookOpen) {
            pageIndicator.textContent = 'Cover';
            if (prevBtn) prevBtn.textContent = 'Open Book';
            if (nextBtn) nextBtn.textContent = 'Open Book';
            return;
        }

        if (currentPageIndex === 0) {
            pageIndicator.textContent = 'Chapter I (1-2)';
            if (prevBtn) prevBtn.textContent = '◂ Close Book';
            if (nextBtn) nextBtn.textContent = 'Next Page ▸';
        } else if (currentPageIndex === 1) {
            pageIndicator.textContent = 'Chapter II (3-4)';
            if (prevBtn) prevBtn.textContent = '◂ Previous';
            if (nextBtn) nextBtn.textContent = 'Next Page ▸';
        } else if (currentPageIndex === 2) {
            pageIndicator.textContent = 'Chapter III (5-6)';
            if (prevBtn) prevBtn.textContent = '◂ Previous';
            if (nextBtn) nextBtn.textContent = 'Next Page ▸';
        } else {
            pageIndicator.textContent = 'Epilogue';
            if (prevBtn) prevBtn.textContent = '◂ Previous';
            if (nextBtn) nextBtn.textContent = 'Close Book ▸';
        }
    }

    function openBook() {
        if (isBookOpen) return;
        scene.classList.add('is-open');
        isBookOpen = true;
        updateIndicator();
    }

    function closeBook() {
        if (!isBookOpen) return;
        scene.classList.remove('is-open');
        isBookOpen = false;
        
        // Reset flipped pages smoothly
        setTimeout(() => {
            currentPageIndex = 0;
            pages.forEach((page, i) => {
                page.classList.remove('flipped');
                page.style.zIndex = pages.length - i;
            });
            updateIndicator();
        }, 400);
        updateIndicator();
    }

    function flipNext() {
        if (!isBookOpen) {
            openBook();
            return;
        }

        if (currentPageIndex < pages.length) {
            const pageToFlip = pages[currentPageIndex];
            
            // Flipped page immediately jumps to higher z-index to stay above left stack
            pageToFlip.style.zIndex = 10 + currentPageIndex;
            pageToFlip.classList.add('flipped');
            
            currentPageIndex++;
            updateIndicator();
        } else {
            // Already at the end
            closeBook();
        }
    }

    function flipPrev() {
        if (!isBookOpen) {
            openBook();
            return;
        }

        if (currentPageIndex > 0) {
            currentPageIndex--;
            const pageToUnflip = pages[currentPageIndex];
            
            pageToUnflip.classList.remove('flipped');
            
            // Restore z-index halfway through the animation (600ms)
            // so it stays above left stack while traveling and lands cleanly on right stack
            setTimeout(() => {
                pageToUnflip.style.zIndex = pages.length - currentPageIndex;
            }, 600);
            updateIndicator();
        } else {
            // At first page, going back closes book
            closeBook();
        }
    }

    // Direct click handler on the book/scene
    scene.addEventListener('click', (e) => {
        // If clicking navigation buttons, don't trigger book click
        if (e.target.closest('.ui-overlay')) return;

        if (!isBookOpen) {
            openBook();
            return;
        }
        
        // Click on right side of screen advances page, left side goes back
        const centerX = window.innerWidth / 2;
        if (e.clientX > centerX) {
            flipNext();
        } else {
            flipPrev();
        }
    });

    // Navigation buttons
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            flipNext();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            flipPrev();
        });
    }

    // Keyboard support: Arrow Right/Down, Arrow Left/Up, Space, Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            flipNext();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            flipPrev();
        } else if (e.key === ' ' || e.key === 'Enter') {
            if (!isBookOpen) openBook();
            else flipNext();
        } else if (e.key === 'Escape') {
            closeBook();
        }
    });

    updateIndicator();
});
