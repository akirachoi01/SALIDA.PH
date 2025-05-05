/**
 * Enhanced navigation for movie sections with smooth scrolling
 */
(function() {
    /**
     * Set up navigation buttons for sections with improved scrolling
     */
    function setupSectionNavigation() {
        // Get all navigation buttons
        const navButtons = document.querySelectorAll('.navigation-button');

        // Remove existing event listeners to avoid duplicates
        navButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });

        // Ensure navigation buttons match container heights
        adjustNavigationButtonHeights();

        // Set up event listeners for all navigation buttons
        document.querySelectorAll('.navigation-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Find the parent container
                const container = this.closest('.movie-container');
                if (!container) return;

                // Find the movies box inside this container
                const moviesBox = container.querySelector('.movies-box');
                if (!moviesBox) return;

                // Calculate scroll amount based on device and container width
                const itemWidth = 220; // Base movie item width
                const gap = 15; // Gap between items
                const isSmallScreen = window.innerWidth <= 560;
                const containerWidth = moviesBox.clientWidth;

                // Adjust scroll amount for different screen sizes
                let scrollAmount;

                if (isSmallScreen) {
                    // For mobile, use a smaller scroll amount that feels more natural
                    scrollAmount = containerWidth * 0.85;
                } else if (window.innerWidth <= 780) {
                    // For tablets
                    scrollAmount = containerWidth * 0.7;
                } else {
                    // For desktop
                    scrollAmount = containerWidth * 0.75;
                }

                // Provide visual feedback
                this.classList.add('button-active');
                setTimeout(() => {
                    this.classList.remove('button-active');
                }, 200);

                // Apply the scroll
                if (this.classList.contains('previous')) {
                    moviesBox.scrollBy({
                        left: -scrollAmount,
                        behavior: 'auto' // Use 'auto' instead of 'smooth' for better performance with our custom momentum
                    });
                } else if (this.classList.contains('next')) {
                    moviesBox.scrollBy({
                        left: scrollAmount,
                        behavior: 'auto'
                    });
                }
            });
        });
    }

    /**
     * Adjust navigation button heights to match their containers
     */
    function adjustNavigationButtonHeights() {
        // Process each movie container to match button heights
        document.querySelectorAll('.movie-container').forEach(container => {
            // Get the actual height of the first movie item (if exists)
            const movieItem = container.querySelector('.movie-item');
            if (!movieItem) return;

            const movieHeight = movieItem.offsetHeight;

            // Get navigation buttons in this container
            const buttons = container.querySelectorAll('.navigation-button');

            // Set the buttons to match the movie height
            buttons.forEach(button => {
                button.style.height = `${movieHeight}px`;
            });
        });
    }

    /**
     * Creates the banner indicator dots
     */
    function createBannerIndicators() {
        if (!window.bannerItems || window.bannerItems.length <= 1) return;

        const indicators = document.getElementById('banner-indicators');
        if (!indicators) return;

        // Clear any existing indicators
        indicators.innerHTML = '';

        // Create indicator dots for each banner
        window.bannerItems.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'banner-dot';
            dot.setAttribute('data-index', index);

            // Add click event to navigate to specific banner
            dot.addEventListener('click', function() {
                const targetIndex = parseInt(this.getAttribute('data-index'));

                // Show navigation buttons when indicator dots are clicked
                const prevButton = document.getElementById('banner-prev');
                const nextButton = document.getElementById('banner-next');
                if (prevButton) prevButton.classList.add('active');
                if (nextButton) nextButton.classList.add('active');

                // Check if we're on mobile
                const isMobile = window.innerWidth <= 480;

                // Hide buttons after delay - longer on mobile for better touch interaction
                setTimeout(() => {
                    if (prevButton) prevButton.classList.remove('active');
                    if (nextButton) nextButton.classList.remove('active');
                }, isMobile ? 2500 : 1500);

                // Update current banner index
                window.currentBannerIndex = targetIndex;

                // Update banner using the appropriate function
                if (typeof window.showBannerAtIndex === 'function') {
                    window.showBannerAtIndex(targetIndex);
                } else if (typeof window.updateBanner === 'function' && window.bannerItems[targetIndex]) {
                    window.updateBanner(window.bannerItems[targetIndex]);
                }

                // Reset any auto-rotation
                if (window.bannerInterval) {
                    clearInterval(window.bannerInterval);
                    if (typeof window.startBannerSlideshow === 'function') {
                        window.startBannerSlideshow();
                    } else if (typeof window.startBannerRotation === 'function') {
                        window.startBannerRotation();
                    }
                }

                // Update active indicator
                updateActiveIndicator();
            });

            indicators.appendChild(dot);
        });

        // Initialize with current active indicator
        updateActiveIndicator();
    }

    /**
     * Updates which indicator dot is active based on current banner index
     */
    function updateActiveIndicator() {
        if (window.currentBannerIndex === undefined) return;

        const indicators = document.querySelectorAll('.banner-dot');

        // Remove active class from all dots
        indicators.forEach(dot => {
            dot.classList.remove('active');
        });

        // Add active class to current dot
        const activeDot = document.querySelector(`.banner-dot[data-index="${window.currentBannerIndex}"]`);
        if (activeDot) {
            activeDot.classList.add('active');
        }

        // Make sure buttons are visible
        const prevButton = document.getElementById('banner-prev');
        const nextButton = document.getElementById('banner-next');

        if (prevButton && nextButton) {
            // Ensure buttons are displayed and styled correctly
            prevButton.style.display = 'flex';
            nextButton.style.display = 'flex';
        }
    }

    /**
     * Set up banner navigation with improved touch handling
     */
    function setupBannerNavigation() {
        const prevButton = document.getElementById('banner-prev');
        const nextButton = document.getElementById('banner-next');

        // Only proceed if we have banner items
        if (!window.bannerItems || window.bannerItems.length <= 1) {
            if (prevButton) prevButton.style.display = 'none';
            if (nextButton) nextButton.style.display = 'none';
            document.getElementById('banner-indicators').style.display = 'none';
            return;
        }

        // Show navigation buttons but keep them initially hidden with CSS opacity
        if (prevButton) {
            prevButton.style.display = 'flex';
            prevButton.classList.remove('active');
        }
        if (nextButton) {
            nextButton.style.display = 'flex';
            nextButton.classList.remove('active');
        }

        // Set up event handlers with clean replacement to avoid duplicates
        if (prevButton) {
            prevButton.replaceWith(prevButton.cloneNode(true));
            const newPrevButton = document.getElementById('banner-prev');

            if (newPrevButton) {
                newPrevButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Show both navigation buttons when one is clicked
                    const prevButton = document.getElementById('banner-prev');
                    const nextButton = document.getElementById('banner-next');
                    if (prevButton) prevButton.classList.add('active');
                    if (nextButton) nextButton.classList.add('active');

                    // Check if we're on mobile
                    const isMobile = window.innerWidth <= 480;

                    // Hide the buttons after a delay - longer on mobile for better accessibility
                    setTimeout(() => {
                        if (prevButton) prevButton.classList.remove('active');
                        if (nextButton) nextButton.classList.remove('active');
                    }, isMobile ? 2500 : 1500);

                    // Show visual feedback
                    this.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    setTimeout(() => {
                        this.style.backgroundColor = '';
                    }, 150);

                    // Navigate to previous banner
                    if (window.currentBannerIndex !== undefined && window.bannerItems) {
                        window.currentBannerIndex = (window.currentBannerIndex - 1 + window.bannerItems.length) % window.bannerItems.length;

                        // Use the existing function if available, otherwise use a simpler approach
                        if (typeof window.showBannerAtIndex === 'function') {
                            window.showBannerAtIndex(window.currentBannerIndex);
                        } else if (typeof window.updateBanner === 'function' && window.bannerItems[window.currentBannerIndex]) {
                            window.updateBanner(window.bannerItems[window.currentBannerIndex]);
                        }

                        // Update the indicator dots
                        updateActiveIndicator();

                        // Reset auto-rotation if needed
                        if (window.bannerInterval) {
                            clearInterval(window.bannerInterval);
                            if (typeof window.startBannerSlideshow === 'function') {
                                window.startBannerSlideshow();
                            } else if (typeof window.startBannerRotation === 'function') {
                                window.startBannerRotation();
                            }
                        }
                    }
                });
            }
        }

        if (nextButton) {
            nextButton.replaceWith(nextButton.cloneNode(true));
            const newNextButton = document.getElementById('banner-next');

            if (newNextButton) {
                newNextButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Show both navigation buttons when one is clicked
                    const prevButton = document.getElementById('banner-prev');
                    const nextButton = document.getElementById('banner-next');
                    if (prevButton) prevButton.classList.add('active');
                    if (nextButton) nextButton.classList.add('active');

                    // Check if we're on mobile
                    const isMobile = window.innerWidth <= 480;

                    // Hide the buttons after a delay - longer on mobile for better accessibility
                    setTimeout(() => {
                        if (prevButton) prevButton.classList.remove('active');
                        if (nextButton) nextButton.classList.remove('active');
                    }, isMobile ? 2500 : 1500);

                    // Show visual feedback
                    this.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    setTimeout(() => {
                        this.style.backgroundColor = '';
                    }, 150);

                    // Navigate to next banner
                    if (window.currentBannerIndex !== undefined && window.bannerItems) {
                        window.currentBannerIndex = (window.currentBannerIndex + 1) % window.bannerItems.length;

                        // Use the existing function if available, otherwise use a simpler approach
                        if (typeof window.showBannerAtIndex === 'function') {
                            window.showBannerAtIndex(window.currentBannerIndex);
                        } else if (typeof window.updateBanner === 'function' && window.bannerItems[window.currentBannerIndex]) {
                            window.updateBanner(window.bannerItems[window.currentBannerIndex]);
                        }

                        // Update the indicator dots
                        updateActiveIndicator();

                        // Reset auto-rotation if needed
                        if (window.bannerInterval) {
                            clearInterval(window.bannerInterval);
                            if (typeof window.startBannerSlideshow === 'function') {
                                window.startBannerSlideshow();
                            } else if (typeof window.startBannerRotation === 'function') {
                                window.startBannerRotation();
                            }
                        }
                    }
                });
            }
        }

        // Create the banner indicators
        createBannerIndicators();
    }

    /**
     * Briefly show and then hide banner navigation buttons
     * This gives users a hint that navigation is available
     */
    function showNavigationButtonsHint() {
        const prevButton = document.getElementById('banner-prev');
        const nextButton = document.getElementById('banner-next');

        // Only proceed if we have buttons and banner items
        if ((!prevButton || !nextButton) || !window.bannerItems || window.bannerItems.length <= 1) {
            return;
        }

        // Check if we're on mobile
        const isMobile = window.innerWidth <= 480;

        // Briefly show the buttons
        if (prevButton) prevButton.classList.add('active');
        if (nextButton) nextButton.classList.add('active');

        // Hide them after a delay - longer on mobile for better accessibility
        setTimeout(() => {
            if (prevButton) prevButton.classList.remove('active');
            if (nextButton) nextButton.classList.remove('active');
        }, isMobile ? 2500 : 1500);
    }

    /**
     * Add CSS for better navigation button feedback
     */
    function addNavigationButtonStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .navigation-button {
                transition: background-color 0.15s ease-out, opacity 0.2s ease !important;
            }
            .navigation-button:active,
            .button-active {
                background-color: rgba(0, 0, 0, 0.8) !important;
                opacity: 1 !important;
            }
            @media only screen and (max-width: 780px) {
                .navigation-button {
                    opacity: 0.6 !important;
                    background-color: rgba(0, 0, 0, 0.7) !important;
                    width: 40px !important;
                }
                .movie-container:hover .navigation-button {
                    opacity: 0.75 !important;
                }
            }

            /* Fix for mobile navigation buttons to match container heights */
            @media only screen and (max-width: 560px) {
                .navigation-button {
                    height: 160px !important;
                }

                /* Netflix and Anime sections use portrait orientation */
                .netflix-previous, .netflix-next,
                .anime-upcoming-new-previous, .anime-upcoming-new-next,
                .anime-comedy-previous, .anime-comedy-next,
                .anime-romance-previous, .anime-romance-next,
                .anime-popular-previous, .anime-popular-next,
                .anime-top-previous, .anime-top-next,
                .anime-upcoming-previous, .anime-upcoming-next {
                    height: 260px !important;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }

    // Initialize everything when the document is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Setup section navigation buttons
        setupSectionNavigation();

        // Make sure navigation button heights are set correctly
        adjustNavigationButtonHeights();

        // Setup banner navigation
        setupBannerNavigation();

        // Add styles for navigation buttons
        addNavigationButtonStyles();

        // Show a hint about navigation buttons after a short delay
        setTimeout(() => {
            showNavigationButtonsHint();
        }, 2000);

        // Fix any window-level functions
        if (window.startBannerRotation && typeof window.startBannerRotation === 'function') {
            const originalFn = window.startBannerRotation;
            window.startBannerRotation = function() {
                if (typeof originalFn === 'function') {
                    originalFn.apply(this, arguments);
                }
                setupBannerNavigation();
            };
        }

        if (window.startBannerSlideshow && typeof window.startBannerSlideshow === 'function') {
            const originalFn = window.startBannerSlideshow;
            window.startBannerSlideshow = function() {
                if (typeof originalFn === 'function') {
                    originalFn.apply(this, arguments);
                }
                setupBannerNavigation();
            };
        }

        // Also update the original update banner function to update indicators
        if (window.updateBanner && typeof window.updateBanner === 'function') {
            const originalUpdateBanner = window.updateBanner;
            window.updateBanner = function(banner) {
                if (typeof originalUpdateBanner === 'function') {
                    originalUpdateBanner.apply(this, arguments);
                }
                updateActiveIndicator();

                // Show navigation buttons briefly when banner updates automatically
                const prevButton = document.getElementById('banner-prev');
                const nextButton = document.getElementById('banner-next');

                if (prevButton && nextButton && window.bannerItems && window.bannerItems.length > 1) {
                    prevButton.classList.add('active');
                    nextButton.classList.add('active');

                    // Check if we're on mobile
                    const isMobile = window.innerWidth <= 480;

                    setTimeout(() => {
                        prevButton.classList.remove('active');
                        nextButton.classList.remove('active');
                    }, isMobile ? 2500 : 1500);
                }
            };
        }

        // Add window resize listener to adjust button heights when screen size changes
        let resizeTimeout;
        window.addEventListener('resize', function() {
            // Debounce to avoid excessive calls
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                adjustNavigationButtonHeights();

                // Handle mobile vs desktop view for banner buttons
                const isMobile = window.innerWidth <= 480;
                const prevButton = document.getElementById('banner-prev');
                const nextButton = document.getElementById('banner-next');

                if (prevButton && nextButton) {
                    // On resize to mobile, ensure buttons are not showing unless active
                    if (isMobile) {
                        prevButton.classList.remove('active');
                        nextButton.classList.remove('active');
                    }
                }
            }, 200);
        });
    });
})();
