/**
 * Smooth inertia-based touch scrolling for movie carousels
 * Based on the scrolling behavior from andoks.cc
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get all carousel containers
  const movieContainers = document.querySelectorAll('.movies-box');

  // Apply smooth scrolling to each container
  movieContainers.forEach(container => {
    enableSmoothScroll(container);
  });

  /**
   * Main function that enables smooth scrolling with inertia
   */
  function enableSmoothScroll(element) {
    // Variables to track touch state
    let isDown = false;
    let startX, startY;
    let scrollLeft;
    let momentumID = null;
    let velocityTracking = [];
    let lastTimestamp = 0;
    let initialTouchY = 0;

    // Add touch event listeners
    element.addEventListener('touchstart', function(e) {
      // Stop any ongoing momentum scrolling
      if (momentumID) {
        cancelAnimationFrame(momentumID);
        momentumID = null;
      }

      // Reset tracking
      velocityTracking = [];
      isDown = true;
      startX = e.touches[0].pageX;
      startY = e.touches[0].pageY;
      initialTouchY = startY;
      scrollLeft = element.scrollLeft;
      lastTimestamp = Date.now();

      // Add active class for styling if needed
      element.classList.add('active-scrolling');
    }, { passive: true });

    element.addEventListener('touchmove', function(e) {
      if (!isDown) return;

      const x = e.touches[0].pageX;
      const y = e.touches[0].pageY;
      const now = Date.now();
      const timeElapsed = now - lastTimestamp;

      // Check if scrolling more vertically than horizontally
      const deltaY = Math.abs(y - initialTouchY);
      const deltaX = Math.abs(x - startX);

      // If more vertical movement, let the browser handle it
      if (deltaY > deltaX * 1.5) {
        return;
      }

      // Actual scrolling
      const walk = (startX - x);
      element.scrollLeft = scrollLeft + walk;

      // Track velocity for momentum (limited to 5 points for averaging)
      if (timeElapsed > 0) {
        // Store velocity data points (negative for right, positive for left)
        velocityTracking.push({
          velocity: (startX - x) / timeElapsed,
          time: now
        });

        // Keep only the most recent 5 tracking points
        if (velocityTracking.length > 5) {
          velocityTracking.shift();
        }
      }

      // Update reference point
      startX = x;
      scrollLeft = element.scrollLeft;
      lastTimestamp = now;
    }, { passive: true });

    element.addEventListener('touchend', function(e) {
      if (!isDown) return;
      isDown = false;
      element.classList.remove('active-scrolling');

      // Calculate average velocity from recent tracking points
      // More weight given to recent points
      let avgVelocity = 0;
      let totalWeight = 0;

      if (velocityTracking.length) {
        const now = Date.now();
        velocityTracking.forEach((track, index) => {
          // More recent points get higher weight
          const age = now - track.time;
          const weight = Math.max(1 - (age / 300), 0.1);
          avgVelocity += track.velocity * weight;
          totalWeight += weight;
        });

        // Get weighted average velocity
        if (totalWeight > 0) {
          avgVelocity = avgVelocity / totalWeight;
        }
      }

      // Apply momentum if velocity is significant
      if (Math.abs(avgVelocity) > 0.1) {
        applyMomentum(element, avgVelocity);
      }
    }, { passive: true });

    element.addEventListener('touchcancel', function() {
      isDown = false;
      element.classList.remove('active-scrolling');
      if (momentumID) {
        cancelAnimationFrame(momentumID);
        momentumID = null;
      }
    }, { passive: true });

    /**
     * Apply momentum scrolling with smooth deceleration
     */
    function applyMomentum(element, velocity) {
      // Initial settings
      let amplitude = velocity * 800; // How far we'll scroll based on velocity
      const timeConstant = 325; // Higher = longer scroll with less friction
      const startTime = Date.now();
      const startPosition = element.scrollLeft;

      // Cancel any existing animation
      if (momentumID) {
        cancelAnimationFrame(momentumID);
      }

      // Animation function
      function momentumStep() {
        // Calculate the time delta
        const elapsed = Date.now() - startTime;

        // Calculate the deceleration factor with exponential decay
        const delta = Math.exp(-elapsed / timeConstant);

        // Calculate how much to scroll
        const moveAmount = amplitude * delta;

        if (Math.abs(moveAmount) > 0.5) {
          // Update scroll position
          element.scrollLeft = startPosition + (amplitude * (1 - delta));
          momentumID = requestAnimationFrame(momentumStep);
        } else {
          momentumID = null;
        }
      }

      // Start the momentum animation
      momentumID = requestAnimationFrame(momentumStep);
    }
  }

  /**
   * Special handling for navigation buttons to provide a consistent experience
   */
  function setupNavigationButtons() {
    const navButtons = document.querySelectorAll('.navigation-button');

    navButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Get the parent container
        const container = this.closest('.movie-container');
        if (!container) return;

        // Find the movies box
        const moviesBox = container.querySelector('.movies-box');
        if (!moviesBox) return;

        // Clear any active momentum scrolling
        if (moviesBox.momentumID) {
          cancelAnimationFrame(moviesBox.momentumID);
          moviesBox.momentumID = null;
        }
      });
    });
  }

  // Set up navigation buttons
  setupNavigationButtons();

  /**
   * Add CSS to the page to enhance the touch scrolling experience
   */
  function addStylesForSmoothScrolling() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .movies-box {
        -webkit-overflow-scrolling: touch !important;
        scroll-behavior: auto !important;
        overflow-x: auto !important;
        /* Enhanced scrolling on modern mobile browsers */
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      .movies-box::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      .active-scrolling {
        cursor: grabbing !important;
      }
      .movie-item {
        will-change: transform !important;
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
      }
      @media only screen and (max-width: 780px) {
        .movies-box {
          padding-bottom: 5px !important;
          padding-top: 5px !important;
        }
        .movie-item {
          transition: transform 0.12s ease-out !important;
        }
        .movie-item:active {
          transform: scale(0.98) !important;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Add our custom styles
  addStylesForSmoothScrolling();
});
