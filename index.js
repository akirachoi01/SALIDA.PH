/**
 * Main JavaScript file for the movie/anime streaming site.
 * Handles fetching, displaying, and UI interactions for movies, TV shows, and anime.
 */

// Get references to HTML elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const goToWatchlistBtn = document.getElementById('goToWatchlist');
const navItems = document.querySelectorAll('.nav-item');
const movieSections = document.querySelectorAll('.movie-section');
const animeSections = document.querySelectorAll('.anime-section');

// Add a new variable to track the current active section
let currentSection = 'all'; // Default to 'all'

// Banner slideshow variables
let bannerItems = []; // Will store banner items
let currentBannerIndex = 0; // Current index in the slideshow
let bannerInterval; // Interval for auto-rotation

// TMDB API key
const api_Key = 'ba3885a53bc2c4f3c4b5bdc1237e69a0';

// Function to update banner slideshow based on section
function updateBannerForSection(section) {
    const banner = document.getElementById('banner');
    const bannerTitle = document.getElementById('banner-title');

    // Clear current banner
    banner.src = '';
    bannerTitle.textContent = '';

    // Clear existing interval if any
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    // Reset banner items array
    bannerItems = [];
    currentBannerIndex = 0;

    if (section === 'all') {
        // For "All" section, we'll use trending content across all media types
        fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const items = data.results || [];
                // Filter to items with backdrop images
                bannerItems = items.filter(item => item.backdrop_path).slice(0, 9).map(item => ({
                    ...item,
                    mediaType: item.media_type || 'movie'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'movies') {
        // For Movies section, use trending movies
        fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const movies = data.results || [];
                // Filter to movies with backdrop images
                bannerItems = movies.filter(movie => movie.backdrop_path).slice(0, 9).map(movie => ({
                    ...movie,
                    mediaType: 'movie'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'tv') {
        // For TV Shows section, use trending TV shows
        fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const shows = data.results || [];
                // Filter to shows with backdrop images
                bannerItems = shows.filter(show => show.backdrop_path).slice(0, 9).map(show => ({
                    ...show,
                    mediaType: 'tv'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'anime') {
        // For Anime section, use upcoming anime for banner slideshow
        const today = new Date();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6); // Get anime coming in the next 6 months

        const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const futureDateStr = futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        // Get anime that will air after today but before 6 months from now
        fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${todayStr}&air_date.lte=${futureDateStr}&sort_by=primary_release_date.asc`)
            .then(response => response.json())
            .then(data => {
                const upcomingAnimes = data.results || [];
                console.log('Upcoming anime fetched:', upcomingAnimes.length);
                // Filter to animes with backdrop images, get up to 9 items
                bannerItems = upcomingAnimes.filter(anime => anime.backdrop_path).slice(0, 9).map(anime => ({
                    ...anime,
                    mediaType: 'tv'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating anime banner:', error));
    }
}

// Function to start auto-rotation of banner items
function startBannerSlideshow() {
    // Clear any existing interval
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    // Only start if we have multiple items
    if (bannerItems.length > 1) {
        bannerInterval = setInterval(() => {
            // Move to next banner
            currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);

            // This will be implemented in navigation-fix.js
            if (typeof updateActiveIndicator === 'function') {
                updateActiveIndicator();
            }
        }, 8000); // Change banner every 8 seconds
    }

    // Make banner items available to navigation-fix.js
    window.bannerItems = bannerItems;
    window.currentBannerIndex = currentBannerIndex;
    window.bannerInterval = bannerInterval;
}

// Function to show banner at specific index with enhanced styling
function showBannerAtIndex(index) {
    if (index < 0 || index >= bannerItems.length) return;

    const item = bannerItems[index];
    if (item && item.backdrop_path) {
        const banner = document.getElementById('banner');
        const bannerTitle = document.getElementById('banner-title');

        // Set banner image with high quality
        banner.src = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;

        // Create a more detailed title with additional info
        const title = item.title || item.name;

        // Add subtitle information if available
        const extraInfo = [];
        if (item.release_date) {
            extraInfo.push(new Date(item.release_date).getFullYear());
        } else if (item.first_air_date) {
            extraInfo.push(new Date(item.first_air_date).getFullYear());
        }

        // Add media type (Movie, TV Show, or Latest Update based on section)
        if (item.mediaType === 'movie') {
            extraInfo.push('Latest');
            extraInfo.push('Movie');
        } else if (item.mediaType === 'tv') {
            // Check which section we're in
            if (currentSection === 'anime') {
                extraInfo.push('Latest Update');
            } else {
                extraInfo.push('Latest');
                extraInfo.push('TV Show');
            }
        }

        // Add rating if available
        if (item.vote_average) {
            extraInfo.push(`⭐ ${parseFloat(item.vote_average).toFixed(1)}`);
        }

        if (extraInfo.length > 0) {
            bannerTitle.innerHTML = `
                ${title}
                <div class="banner-subtitle">${extraInfo.join(' • ')}</div>
            `;

            // Add some CSS to the subtitle for better appearance
            const subtitleElement = bannerTitle.querySelector('.banner-subtitle');
            if (subtitleElement) {
                subtitleElement.style.fontSize = '0.85rem';
                subtitleElement.style.opacity = '0.8';
                subtitleElement.style.marginTop = '8px';
                subtitleElement.style.fontWeight = 'normal';

                // Style all "Latest" tags - works for all sections
                const latestTag = 'Latest';
                if (subtitleElement.textContent.includes(latestTag) && currentSection !== 'anime') {
                    // Create a span to style just the "Latest" text
                    subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                        latestTag,
                        `<span class="latest-badge">${latestTag}</span>`
                    );

                    // Style the badge
                    const badge = subtitleElement.querySelector('.latest-badge');
                    if (badge) {
                        badge.style.backgroundColor = 'rgba(231, 76, 60, 0.85)'; // Red for trending content
                        badge.style.padding = '2px 6px';
                        badge.style.borderRadius = '4px';
                        badge.style.color = 'white';
                        badge.style.fontWeight = 'bold';
                        badge.style.marginRight = '3px';
                        badge.style.marginLeft = '3px';
                        badge.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)';
                    }
                }

                // Handle the "Latest Update" tag for anime section separately
                if (currentSection === 'anime' && subtitleElement.textContent.includes('Latest Update')) {
                    // Create a span to style just the "Latest Update" text
                    subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                        'Latest Update',
                        '<span class="latest-update-badge">Latest Update</span>'
                    );

                    // Style the badge
                    const badge = subtitleElement.querySelector('.latest-update-badge');
                    if (badge) {
                        badge.style.backgroundColor = 'rgba(52, 152, 219, 0.9)'; // Blue for latest updates
                        badge.style.padding = '3px 8px';
                        badge.style.borderRadius = '4px';
                        badge.style.color = 'white';
                        badge.style.fontWeight = 'bold';
                        badge.style.marginRight = '3px';
                        badge.style.marginLeft = '3px';
                        badge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
                    }
                }
            }
        } else {
            bannerTitle.textContent = title;
        }

        // Update the banner image to have better display
        banner.style.objectFit = 'cover';
        banner.style.objectPosition = 'center top';

        // Apply a subtle gradient overlay to make text more readable if not already added
        const bannerContainer = document.getElementById('banner-container');
        if (bannerContainer) {
            // Make sure the container has relative positioning for the overlay to work
            bannerContainer.style.position = 'relative';

            // Look for an existing overlay or create one
            let overlay = document.getElementById('banner-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'banner-overlay';
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 80%)';
                overlay.style.pointerEvents = 'none';
                overlay.style.zIndex = '1';

                // Insert overlay as the first child, behind other content
                bannerContainer.insertBefore(overlay, bannerContainer.firstChild);

                // Make sure detail elements appear above the overlay
                const detailsContainer = document.getElementById('details-container');
                if (detailsContainer) {
                    detailsContainer.style.zIndex = '2';
                    detailsContainer.style.position = 'relative';
                }
            }
        }

        // Update button click events
        const playButton = document.getElementById('play-button');
        const moreInfoButton = document.getElementById('more-info');

        // Clear any existing event listeners
        playButton.replaceWith(playButton.cloneNode(true));
        moreInfoButton.replaceWith(moreInfoButton.cloneNode(true));

        // Get fresh references to the buttons
        const newPlayButton = document.getElementById('play-button');
        const newMoreInfoButton = document.getElementById('more-info');

        // Add multiple event types for better mobile compatibility
        ['click', 'touchstart'].forEach(eventType => {
            newPlayButton.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
               const movieDetailsUrl = `/movie_details.html?media=${media}&id=${id}`;
            window.location.href = movieDetailsUrl;
            }, {passive: false});

            newMoreInfoButton.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
                const movieDetailsUrl = `/movie_details.html?media=${media}&id=${id}`;
                window.location.href = movieDetailsUrl;
            }, {passive: false});
        });

        // Update the current index
        currentBannerIndex = index;

        // Make current index available to navigation-fix.js
        window.currentBannerIndex = currentBannerIndex;

        // This will be implemented in navigation-fix.js
        if (typeof updateActiveIndicator === 'function') {
            updateActiveIndicator();
        }
    }
}

// Banner indicators have been removed as requested

// This function is kept empty to maintain compatibility with existing code
function updateBannerIndicators() {
    // Indicators functionality has been removed
}

// Function to get appropriate star color based on rating
function getRatingColor(rating) {
    if (rating >= 8) return '#4CAF50'; // Green for high ratings
    if (rating >= 6) return '#8d16c9'; // Purple (main theme color) for good ratings
    if (rating >= 4) return '#FFC107'; // Amber for average ratings
    return '#F44336'; // Red for low ratings
}

// Function to fetch and display movies or TV shows
function fetchMedia(containerClass, endpoint, mediaType, usePosterPath = false) {
    console.log(`Fetching ${mediaType} for ${containerClass} with endpoint ${endpoint}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        fetch(`https://api.themoviedb.org/3/${endpoint}api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const movies = data.results || [];
                console.log(`Got ${mediaType} data for ${containerClass}, found ${movies.length} items`);
                container.innerHTML = ''; // Clear the container

                movies.forEach(movie => {
                    // Skip if no image is available
                    const imageUrl = usePosterPath
                        ? movie.poster_path
                        : movie.backdrop_path;
                    if (!imageUrl) return;

                    let pathToUse = usePosterPath ? movie.poster_path : movie.backdrop_path;
                    // Create item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';
                    itemElement.dataset.mediaType = mediaType || 'movie';

                    // Using a wrapper for the image to maintain aspect ratio
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'image-wrapper';

                    // Create and add the image
                    const img = document.createElement('img');
                    img.src = `https://image.tmdb.org/t/p/w780${pathToUse}`;
                    img.alt = movie.title || movie.name;
                    img.loading = 'lazy'; // Add lazy loading for better performance

                    imgWrapper.appendChild(img);
                    itemElement.appendChild(imgWrapper);
                    container.appendChild(itemElement);

                    // Add click event to navigate to movie details
                    itemElement.addEventListener('click', () => {
                        const mediaId = movie.id;
                        const mediaToUse = mediaType || (movie.first_air_date ? 'tv' : 'movie');
                        window.location.href = `movie_details/movie_details.html?media=${mediaToUse}&id=${mediaId}`;
                    });

                    // Create overlay with title and rating
                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    // Create title element
                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = movie.title || movie.name;

                    // Enhanced star rating visibility
                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    const ratingValue = document.createElement('span');
                    ratingValue.className = 'rating-value';

                    // Format the rating to show only one decimal place
                    const voteAverage = movie.vote_average || 0;
                    const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';
                    ratingValue.textContent = formattedRating;

                    // Set color based on rating
                    if (formattedRating !== 'N/A') {
                        star.style.color = getRatingColor(voteAverage);
                    }

                    // Build the rating element
                    rating.appendChild(star);
                    rating.appendChild(ratingValue);

                    // Build the overlay
                    overlay.appendChild(titleElement);
                    overlay.appendChild(rating);

                    // Add overlay to the image wrapper
                    imgWrapper.appendChild(overlay);
                });
            })
            .catch(error => {
                console.error('Error fetching media data:', error);
            });
    });
}

// Set up scroll distance
const scrollDistance = 1200;

// Get references to the header and other elements
// (header and navMenu are now defined below for scroll behavior)

// Retrieve watchlist from local storage or create an empty array if it doesn't exist
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Function to fetch and display anime from TMDB API
function fetchAnime(containerClass, genreOrKeyword) {
    console.log(`Fetching anime for ${containerClass} with TMDB API using genre/keyword: ${genreOrKeyword}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        // Determine which TMDB endpoint to use based on the input
        let endpoint = '';

        if (genreOrKeyword === 'popular') {
            // For popular anime, use discover with animation genre + anime keyword and sort by popularity
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'top_rated') {
            // For top rated anime, use discover with animation genre + anime keyword sorted by rating
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=vote_average.desc&vote_count.gte=100`;
        } else if (genreOrKeyword === 'upcoming') {
            // For ongoing anime (renamed from upcoming), use discover with recent and ongoing air dates
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.lte=${dateStr}&with_status=0&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'truly_upcoming') {
            // For truly upcoming anime, use discover with future air dates
            const today = new Date();
            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + 6); // Get anime coming in the next 6 months

            const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            const futureDateStr = futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

            // Get anime that will air after today but before 6 months from now
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${todayStr}&air_date.lte=${futureDateStr}&sort_by=primary_release_date.asc`;
        } else if (genreOrKeyword === 'action') {
            // Action anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,28&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'romance') {
            // Romance anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,10749&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'comedy') {
            // Comedy anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,35&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'fantasy') {
            // Fantasy anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,14&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'sci_fi') {
            // Sci-Fi anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,878&with_keywords=210024&sort_by=popularity.desc`;
        } else {
            // Default endpoint for general anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
        }

        // Fetch anime data from TMDB
        console.log(`Fetching anime from TMDB with endpoint: https://api.themoviedb.org/3/${endpoint}`);
        fetch(`https://api.themoviedb.org/3/${endpoint}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`TMDB API responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Got anime data from TMDB for ${containerClass}, found ${data.results ? data.results.length : 0} items`);
                const animeResults = data.results || [];
                container.innerHTML = ''; // Clear the container first to prevent duplicates

                // Process each anime item
                if (animeResults.length === 0) {
                    console.warn(`No anime results found for ${containerClass}`);
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content available at this time. Please try again later.</div>';
                    return;
                }

                // Filter out items without backdrop or poster images
                const validResults = animeResults.filter(item => item.poster_path || item.backdrop_path);

                console.log(`Processing ${validResults.length} valid anime items for ${containerClass}`);
                validResults.forEach((anime, index) => {
                    const title = anime.name || anime.title || 'Unknown Title';
                    console.log(`Processing anime ${index + 1}/${validResults.length}: ${title}`);

                    // Get image URL - use backdrop (landscape) for all anime containers
                    let useBackdrop = containerClass === 'anime-comedy-container' ||
                                      containerClass === 'anime-upcoming-new-container' ||
                                      containerClass === 'anime-romance-container' ||
                                      containerClass === 'anime-popular-container' ||
                                      containerClass === 'anime-top-container' ||
                                      containerClass === 'anime-upcoming-container';

                    const imageUrl = useBackdrop && anime.backdrop_path
                        ? `https://image.tmdb.org/t/p/w780${anime.backdrop_path}` // Use higher quality for landscape
                        : anime.poster_path
                            ? `https://image.tmdb.org/t/p/w500${anime.poster_path}`
                            : anime.backdrop_path
                                ? `https://image.tmdb.org/t/p/w780${anime.backdrop_path}`
                                : 'https://via.placeholder.com/780x439?text=No+Image+Available'; // 16:9 aspect ratio

                    // Create the main item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';

                    // Apply landscape dimensions for all anime containers
                    if (useBackdrop) {
                        itemElement.style.width = '290px';  // Landscape width
                        itemElement.style.height = '170px'; // Landscape height (16:9 aspect ratio)
                    }

                    itemElement.dataset.mediaType = 'tv'; // Using TV since most anime are TV shows in TMDB
                    itemElement.dataset.id = anime.id;

                    // Create a wrapper for the image
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'image-wrapper';

                    // Create and add the image
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = title;
                    img.loading = 'lazy';

                    // Error handling for image loading
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = 'https://via.placeholder.com/500x750?text=Image+Error';
                    };

                    imgWrapper.appendChild(img);
                    itemElement.appendChild(imgWrapper);
                    container.appendChild(itemElement);

                    // Add click event to navigate to details page
                    itemElement.addEventListener('click', () => {
                        const movieDetailsUrl = `/movie_details.html?media=${media}&id=${id}`;
                window.location.href = movieDetailsUrl;
                    });

                    // Create overlay with title and rating
                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    // Create title element
                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = title;

                    // Enhanced star rating
                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    const ratingValue = document.createElement('span');
                    ratingValue.className = 'rating-value';

                    // Format the rating to show only one decimal place
                    const voteAverage = anime.vote_average || 0;

                    // Show actual ratings for all anime including upcoming ones
                    const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';

                    // Set color based on rating
                    if (formattedRating !== 'N/A') {
                        star.style.color = getRatingColor(voteAverage);
                    }

                    ratingValue.textContent = formattedRating;

                    // Build the overlay
                    rating.appendChild(star);
                    rating.appendChild(ratingValue);
                    overlay.appendChild(titleElement);
                    overlay.appendChild(rating);

                    // Add overlay to the image wrapper
                    imgWrapper.appendChild(overlay);
                });
            })
            .catch(error => {
                console.error('Error fetching anime data from TMDB:', error);
                container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">Error loading anime content. Please try again later.</div>';
            });
    });
}

// Initial fetch of movies
fetchMedia('netflix-container', 'discover/tv?with_networks=213&', 'tv', true); // Netflix originals with poster_path
fetchMedia('trending-container', 'trending/all/week?&', 'all');
fetchMedia('top-container', 'movie/top_rated?&', 'movie');
fetchMedia('horror-container', 'discover/movie?with_genres=27&', 'movie');
fetchMedia('comedy-container', 'discover/movie?with_genres=35&', 'movie');
fetchMedia('action-container', 'discover/movie?with_genres=28&', 'movie');

// Additional movie genres
fetchMedia('thriller-container', 'discover/movie?with_genres=53&', 'movie'); // Thriller movies
fetchMedia('adventure-container', 'discover/movie?with_genres=12&', 'movie'); // Adventure movies
fetchMedia('fantasy-movie-container', 'discover/movie?with_genres=14&', 'movie'); // Fantasy movies
fetchMedia('scifi-movie-container', 'discover/movie?with_genres=878&', 'movie'); // Sci-Fi movies

// Initial fetch of TV shows by genre
fetchMedia('drama-tv-container', 'discover/tv?with_genres=18&', 'tv'); // Drama (18)
fetchMedia('crime-tv-container', 'discover/tv?with_genres=80&', 'tv'); // Crime (80)
fetchMedia('scifi-tv-container', 'discover/tv?with_genres=10765&', 'tv'); // Sci-Fi & Fantasy (10765)
fetchMedia('comedy-tv-container', 'discover/tv?with_genres=35&', 'tv'); // Comedy TV (35)
fetchMedia('documentary-tv-container', 'discover/tv?with_genres=99&', 'tv'); // Documentary (99)

// Initial fetch of anime using TMDB API with appropriate genres/keywords
fetchAnime('anime-popular-container', 'popular'); // Popular anime
fetchAnime('anime-top-container', 'top_rated'); // Top rated anime
fetchAnime('anime-upcoming-container', 'upcoming'); // Ongoing anime (keeping the same container name)
fetchAnime('anime-upcoming-new-container', 'truly_upcoming'); // Latest anime

// Additional anime genres (removed the ones not needed)
fetchAnime('anime-comedy-container', 'comedy'); // Comedy anime
fetchAnime('anime-romance-container', 'romance'); // Romance anime

// The generic anime container has been removed

// Function to fetch search results from TMDB API
async function fetchSearchResults(query) {
    try {
        // Now just use TMDB multi-search API to get results for everything including anime
        const tmdbResponse = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${api_Key}&query=${encodeURIComponent(query)}`);
        const tmdbData = await tmdbResponse.json();

        // Also specifically search for anime with a dedicated request that includes the animation genre and anime keyword
        const animeResponse = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${api_Key}&query=${encodeURIComponent(query)}&with_genres=16&with_keywords=210024`);
        const animeData = await animeResponse.json();

        // Combine and format results
        let combinedResults = [];

        // Format TMDB multi-search results
        if (tmdbData.results) {
            tmdbData.results.forEach(item => {
                if (item.poster_path || item.backdrop_path) {
                    const posterPath = item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : item.backdrop_path
                            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                            : 'https://via.placeholder.com/500x750?text=No+Image+Available';

                    combinedResults.push({
                        id: item.id,
                        title: item.title || item.name,
                        poster_path: posterPath,
                        media_type: item.media_type,
                        release_date: item.release_date || item.first_air_date,
                        isAnime: false,
                        url: null
                    });
                }
            });
        }

        // Format dedicated anime search results
        if (animeData.results) {
            animeData.results.forEach(item => {
                // Check if this item is not already in results (to avoid duplicates)
                if (!combinedResults.some(result => result.id === item.id)) {
                    const posterPath = item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : item.backdrop_path
                            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                            : 'https://via.placeholder.com/500x750?text=No+Image+Available';

                    combinedResults.push({
                        id: item.id,
                        title: item.name || 'Unknown Title',
                        poster_path: posterPath,
                        media_type: 'tv', // Use 'tv' instead of 'anime' since TMDB treats anime as TV shows
                        release_date: item.first_air_date || '',
                        isAnime: true, // Mark as anime for specific handling
                        url: null
                    });
                }
            });
        }

        // Sort by popularity if available
        combinedResults.sort((a, b) => {
            if (a.popularity && b.popularity) {
                return b.popularity - a.popularity;
            }
            return 0;
        });

        return combinedResults;
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

// Define a function to handle scrolling
function setupScroll(containerClass, previousButtonClass, nextButtonClass) {
    const previousButtons = document.querySelectorAll(`.${previousButtonClass}`);
    const nextButtons = document.querySelectorAll(`.${nextButtonClass}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container, index) => {
        const previousButton = previousButtons[index];
        const nextButton = nextButtons[index];

        if (previousButton && nextButton) {
            nextButton.addEventListener('click', () => {
                container.scrollBy({
                    left: scrollDistance,
                    behavior: 'smooth',
                });
            });

            previousButton.addEventListener('click', () => {
                container.scrollBy({
                    left: -scrollDistance,
                    behavior: 'smooth',
                });
            });
        }
    });
}

// Setup scroll for movie sections
setupScroll('trending-container', 'trending-previous', 'trending-next');
setupScroll('netflix-container', 'netflix-previous', 'netflix-next');
setupScroll('top-container', 'top-previous', 'top-next');
setupScroll('horror-container', 'horror-previous', 'horror-next');
setupScroll('comedy-container', 'comedy-previous', 'comedy-next');
setupScroll('action-container', 'action-previous', 'action-next');

// Setup scroll for new movie genre sections
setupScroll('thriller-container', 'thriller-previous', 'thriller-next');
setupScroll('adventure-container', 'adventure-previous', 'adventure-next');
setupScroll('fantasy-movie-container', 'fantasy-movie-previous', 'fantasy-movie-next');
setupScroll('scifi-movie-container', 'scifi-movie-previous', 'scifi-movie-next');

// TV genres scroll
setupScroll('drama-tv-container', 'drama-tv-previous', 'drama-tv-next');
setupScroll('crime-tv-container', 'crime-tv-previous', 'crime-tv-next');
setupScroll('scifi-tv-container', 'scifi-tv-previous', 'scifi-tv-next');
setupScroll('comedy-tv-container', 'comedy-tv-previous', 'comedy-tv-next');
setupScroll('documentary-tv-container', 'documentary-tv-previous', 'documentary-tv-next');

// Anime scroll (updated to reflect removed sections)
setupScroll('anime-popular-container', 'anime-popular-previous', 'anime-popular-next');
setupScroll('anime-top-container', 'anime-top-previous', 'anime-top-next');
setupScroll('anime-upcoming-container', 'anime-upcoming-previous', 'anime-upcoming-next');
setupScroll('anime-upcoming-new-container', 'anime-upcoming-new-previous', 'anime-upcoming-new-next');
setupScroll('anime-comedy-container', 'anime-comedy-previous', 'anime-comedy-next');
setupScroll('anime-romance-container', 'anime-romance-previous', 'anime-romance-next');

// Event listener to navigate to WatchList page
goToWatchlistBtn.addEventListener('click', () => {
    window.location.href = 'watchList/watchlist.html';
});

// Add header scroll behavior
let prevScrollPos = window.scrollY;
const header = document.querySelector('.header');
const navMenu = document.querySelector('.nav-menu');

// Function to handle scroll behavior
function handleScroll() {
    const currentScrollPos = window.scrollY;

    if (window.innerWidth <= 560) { // Only apply this behavior on mobile
        if (prevScrollPos > currentScrollPos) {
            // Scrolling up - show header
            header.style.top = "0";
            navMenu.style.top = "60px";
        } else {
            // Scrolling down - hide header when not at the top
            if (currentScrollPos > 100) {
                header.style.top = "-60px";
                navMenu.style.top = "0";
            }
        }
    } else {
        // Reset for desktop
        header.style.top = "0";
        navMenu.style.top = "70px";
    }

    prevScrollPos = currentScrollPos;
}

// Add scroll event listener
window.addEventListener('scroll', handleScroll);

// Listen for window resize to adjust behavior
window.addEventListener('resize', function() {
    if (window.innerWidth > 560) {
        // Reset for desktop
        header.style.top = "0";
        navMenu.style.top = "70px";
    }
});

// Function to add Back to Top button
function addBackToTopButton() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.setAttribute('id', 'back-to-top-btn');
    backToTopBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
    </svg>`;

    document.body.appendChild(backToTopBtn);

    // Initially hide the button
    backToTopBtn.style.opacity = '0';
    backToTopBtn.style.visibility = 'hidden';

    // Show button when scrolled down
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
        }
    });

    // Scroll to top when clicked
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Add the back to top button
addBackToTopButton();

// Navigation menu functionality
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all items
        navItems.forEach(navItem => navItem.classList.remove('active'));

        // Add active class to clicked item
        item.classList.add('active');

        // Get the section to show
        const section = item.querySelector('a').getAttribute('data-section');
        currentSection = section; // Update the current section

        // Update the banner slideshow for the selected section
        updateBannerForSection(section);

        // First, fade out all sections
        movieSections.forEach(section => {
            section.classList.add('fade-out');
            section.classList.remove('fade-in');
        });

        // Wait for fade out to complete, then update visibility and fade in
        setTimeout(() => {
            // Show/hide sections based on selection
            if (section === 'all') {
                // Show all sections
                movieSections.forEach(section => {
                    section.style.display = 'block';
                    // Stagger the animations for a cascade effect
                    setTimeout(() => {
                        section.classList.remove('fade-out');
                        section.classList.add('fade-in');
                    }, Math.random() * 200); // Random delay between 0-200ms for natural feel
                });
            } else if (section === 'anime') {
                // Show only anime sections
                movieSections.forEach(section => {
                    if (section.classList.contains('anime-section')) {
                        section.style.display = 'block';
                        // Stagger the animations
                        setTimeout(() => {
                            section.classList.remove('fade-out');
                            section.classList.add('fade-in');
                        }, Math.random() * 200);
                    } else {
                        section.style.display = 'none';
                    }
                });

                // Adjust the scroll position to show the first anime section
                const firstAnimeSection = document.querySelector('.anime-section');
                if (firstAnimeSection) {
                    setTimeout(() => {
                        window.scrollTo({
                            top: firstAnimeSection.offsetTop - 150,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            } else if (section === 'movies') {
                // Show only movie sections (not TV or anime)
                movieSections.forEach(section => {
                    if (section.classList.contains('anime-section')) {
                        section.style.display = 'none';
                    } else if (section.id && section.id.includes('tv')) {
                        section.style.display = 'none';
                    } else {
                        // Check if the section contains "Netflix" which is TV shows
                        const sectionTitle = section.querySelector('h1');
                        if (sectionTitle && sectionTitle.textContent.includes('NETFLIX ORIGINALS')) {
                            section.style.display = 'none';
                        } else {
                            section.style.display = 'block';
                            // Stagger the animations
                            setTimeout(() => {
                                section.classList.remove('fade-out');
                                section.classList.add('fade-in');
                            }, Math.random() * 200);
                        }
                    }
                });
            } else if (section === 'tv') {
                // Show only TV show sections (not movies or anime)
                movieSections.forEach(section => {
                    if (section.classList.contains('anime-section')) {
                        section.style.display = 'none';
                    } else {
                        // Check if the section contains "Netflix" which is TV shows
                        const sectionTitle = section.querySelector('h1');
                        if (sectionTitle && sectionTitle.textContent.includes('NETFLIX ORIGINALS')) {
                            section.style.display = 'block';
                            // Stagger the animations
                            setTimeout(() => {
                                section.classList.remove('fade-out');
                                section.classList.add('fade-in');
                            }, Math.random() * 200);
                        } else if (section.classList.contains('tv-section')) {
                            section.style.display = 'block';
                            // Stagger the animations
                            setTimeout(() => {
                                section.classList.remove('fade-out');
                                section.classList.add('fade-in');
                            }, Math.random() * 200);
                        } else {
                            section.style.display = 'none';
                        }
                    }
                });
            }
        }, 400); // Wait for fade out animation to complete
    });
});

// Function to handle search input changes
async function handleSearchInput() {
    const query = searchInput.value;
    if (query.length > 2) {
        const results = await fetchSearchResults(query);
        if (results.length !== 0) {
            searchResults.style.visibility = "visible";
        }
        displaySearchResults(results);
    } else {
        searchResults.innerHTML = '';
        searchResults.style.visibility = "hidden";
    }
}

// Function to display search results
function displaySearchResults(results) {
    searchResults.innerHTML = '';
    results.map(item => {
        const shortenedTitle = item.title || 'Unknown Title';
        const date = item.release_date || '';

        let buttonText = "Add to WatchList"; // Set default button text

        // Check if the movie is already in WatchList
        if (watchlist.find(watchlistItem => watchlistItem.id === item.id)) {
            buttonText = "Go to WatchList"; // Change button text
        }

        const movieItem = document.createElement('div');
        // Create HTML structure for each item
        movieItem.innerHTML = `<div class = "search-item-thumbnail">
                                    <img src ="${item.poster_path}">
                                </div>
                                <div class ="search-item-info">
                                    <h3>${shortenedTitle}</h3>
                                    <p>${item.media_type || 'unknown'} <span> &nbsp; ${date}</span></p>
                                </div>
                                <button class="watchListBtn" id="${item.id}">${buttonText}</button>`;

        const watchListBtn = movieItem.querySelector('.watchListBtn');

        // Add event listener to WatchList button
        watchListBtn.addEventListener('click', () => {
            if (buttonText === "Add to WatchList") {
                addToWatchList(item);
            } else {
                window.location.href = 'watchList/watchlist.html'; // Navigate to the WatchList page
            }
        });

        const thumbnail = movieItem.querySelector('.search-item-thumbnail');
        const info = movieItem.querySelector('.search-item-info');

        // Add event listener to navigate to details page
        thumbnail.addEventListener('click', () => {
            if (item.isAnime) {
                const movieDetailsUrl = `/movie_details.html?media=${media}&id=${id}`;
                window.location.href = movieDetailsUrl;
            } else {
                const movieDetailsUrl = `/movie_details.html?media=${item.media_type}&id=${item.id}`;
                window.location.href = movieDetailsUrl;
            }
        });

        info.addEventListener('click', () => {
            if (item.isAnime) {
                const movieDetailsUrl = `/movie_details.html?media=${media}&id=${id}`;
                window.location.href = movieDetailsUrl;
            } else {
               const movieDetailsUrl = `/movie_details.html?media=${item.media_type}&id=${item.id}`;
                window.location.href = movieDetailsUrl;
            }
        });

        movieItem.setAttribute('class', 'movie-list');

        // Append movie item to search results
        searchResults.appendChild(movieItem);
    });
}

// Function to add a movie to WatchList
function addToWatchList(movie) {
    // Check if the movie is not already in the WatchList list
    if (!watchlist.find(watchlistItem => watchlistItem.id === movie.id)) {
        watchlist.push(movie);
        localStorage.setItem('watchlist', JSON.stringify(watchlist)); // Store in Local Storage
        const watchListBtn = document.querySelector(`[id="${movie.id}"]`);
        if (watchListBtn) {
            watchListBtn.textContent = "Go to WatchList";
            watchListBtn.addEventListener('click', () => {
                window.location.href = 'watchList/watchlist.html'; // Navigate to the WatchList page
            });
        }
    }
}

// Event listener for search input changes
searchInput.addEventListener('input', handleSearchInput);

// Event listener for Enter key press in search input
searchInput.addEventListener('keyup', async event => {
    if (event.key === 'Enter') {
        handleSearchInput();
    }
});

// Event listener to close search results when clicking outside
document.addEventListener('click', event => {
    if (!searchResults.contains(event.target)) {
        searchResults.innerHTML = '';
        searchResults.style.visibility = "hidden";
    }
});

// Initialize the banner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add initial fade-in class to all sections
    movieSections.forEach(section => {
        section.classList.add('fade-out');
        // Stagger the animations for a cascade effect on initial load
        setTimeout(() => {
            section.classList.remove('fade-out');
            section.classList.add('fade-in');
        }, Math.random() * 500); // Longer random delay for initial load
    });

    // Update the banner based on the active section
    const activeNavItem = document.querySelector('.nav-item.active');
    if (activeNavItem) {
        const section = activeNavItem.querySelector('a').getAttribute('data-section');
        currentSection = section;
        updateBannerForSection(section);
    } else {
        // Default to 'all' if no nav item is active
        updateBannerForSection('all');
    }

    // Ensure proper spacing between the banner and section headings
    const bannerContainer = document.getElementById('banner-container');
    if (bannerContainer) {
        // Force a significant margin to prevent overlap
        bannerContainer.style.marginBottom = '80px';
    }

    // Adjust section headings to be more visible
    const sectionHeadings = document.querySelectorAll('.movie-section h1, .tv-section h1, .anime-section h1');
    sectionHeadings.forEach(heading => {
        heading.style.position = 'relative';
        heading.style.zIndex = '5';
    });

    // Set up banner navigation button handlers
    const prevButton = document.getElementById('banner-prev');
    const nextButton = document.getElementById('banner-next');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            // Move to previous banner
            currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);

            // Reset interval to prevent quick transitions
            if (bannerInterval) {
                clearInterval(bannerInterval);
                startBannerSlideshow();
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            // Move to next banner
            currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);

            // Reset interval to prevent quick transitions
            if (bannerInterval) {
                clearInterval(bannerInterval);
                startBannerSlideshow();
            }
        });
    }
});

// Improved touch swipe functionality for movie sections
const movieContainers = document.querySelectorAll('.movies-box');

movieContainers.forEach(container => {
    let startX, startY;
    let isDragging = false;
    let lastX;
    let scrollLeft;
    let velocityX = 0;
    let lastTimestamp = 0;
    let isTouchScrolling = false;
    let rafId = null;
    let lastTouchPosition = { x: 0, y: 0 };

    // Prevent default browser handling of all panning and zooming gestures
    container.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    }, { passive: false });

    // Reset function
    function resetTouchState() {
        isDragging = false;
        isTouchScrolling = false;
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    // Touch start handler with passive option
    container.addEventListener('touchstart', (e) => {
        // Cancel any existing momentum scrolling
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        if (e.touches.length === 1) {
            isDragging = true;
            isTouchScrolling = true;
            startX = e.touches[0].pageX;
            startY = e.touches[0].pageY;
            lastX = startX;
            lastTouchPosition.x = startX;
            lastTouchPosition.y = startY;
            scrollLeft = container.scrollLeft;
            lastTimestamp = Date.now();
            velocityX = 0;
        }
    }, { passive: true });

    // Touch move handler
    container.addEventListener('touchmove', (e) => {
        if (!isDragging || !isTouchScrolling) return;

        const touch = e.touches[0];
        const x = touch.pageX;
        const y = touch.pageY;
        const now = Date.now();
        const elapsed = now - lastTimestamp;

        // Calculate horizontal and vertical movement
        const deltaX = lastTouchPosition.x - x;
        const deltaY = lastTouchPosition.y - y;

        // If vertical scrolling is more significant, let the browser handle it
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
            isTouchScrolling = false;
            return;
        }

        // Prevent default to disable browser overscroll
        if (e.cancelable) {
            e.preventDefault();
        }

        // Calculate velocity (pixels per millisecond)
        if (elapsed > 0) {
            velocityX = (lastX - x) / elapsed;
        }

        // Update scroll position
        container.scrollLeft = scrollLeft + (startX - x);

        // Store last position and timestamp
        lastX = x;
        lastTouchPosition.x = x;
        lastTouchPosition.y = y;
        lastTimestamp = now;
    }, { passive: false });

    // Touch end handler
    container.addEventListener('touchend', (e) => {
        if (!isDragging || !isTouchScrolling) {
            resetTouchState();
            return;
        }

        // Calculate final momentum scroll
        const vx = velocityX * 1000; // Convert to pixels per second
        const distance = Math.abs(vx);

        // Apply momentum scrolling only if there was enough velocity
        if (Math.abs(vx) > 0.5) {
            // Determine scroll distance based on velocity
            // Use a deceleration factor to slow down naturally
            const momentumDistance = vx * 0.7;

            // Setting up momentum scrolling with requestAnimationFrame for smoother animation
            let startTime = null;
            const momentumDuration = Math.min(Math.abs(momentumDistance) * 4, 800); // Cap duration

            function momentumScroll(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / momentumDuration, 1);

                // Apply easing for natural deceleration
                const easeOutQuad = function(t) { return t * (2 - t); };
                const easedProgress = easeOutQuad(progress);

                // Calculate the new scroll position with easing
                const scrollDistance = momentumDistance * (1 - easedProgress);
                container.scrollBy({ left: scrollDistance, behavior: 'auto' });

                // Continue animation if not complete
                if (progress < 1) {
                    rafId = requestAnimationFrame(momentumScroll);
                } else {
                    rafId = null;
                }
            }

            // Start momentum scrolling animation
            rafId = requestAnimationFrame(momentumScroll);
        }

        resetTouchState();
    }, { passive: true });

    // Cancel momentum scrolling if user touches screen again
    container.addEventListener('touchcancel', resetTouchState, { passive: true });
});

// Add fade-in/fade-out CSS classes for smooth transitions if not already present
(function injectFadeStyles() {
    if (!document.getElementById('fade-section-styles')) {
        const style = document.createElement('style');
        style.id = 'fade-section-styles';
        style.innerHTML = `
            .fade-in {
                opacity: 1 !important;
                transition: opacity 0.5s cubic-bezier(0.4,0,0.2,1);
                pointer-events: auto;
            }
            .fade-out {
                opacity: 0 !important;
                transition: opacity 0.4s cubic-bezier(0.4,0,0.2,1);
                pointer-events: none;
            }
            .movie-section, .anime-section {
                opacity: 1;
                transition: opacity 0.5s cubic-bezier(0.4,0,0.2,1);
            }
        `;
        document.head.appendChild(style);
    }
})();/**
 * Main JavaScript file for the movie/anime streaming site.
 * Handles fetching, displaying, and UI interactions for movies, TV shows, and anime.
 */

// Get references to HTML elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const goToWatchlistBtn = document.getElementById('goToWatchlist');
const navItems = document.querySelectorAll('.nav-item');
const movieSections = document.querySelectorAll('.movie-section');
const animeSections = document.querySelectorAll('.anime-section');

// Add a new variable to track the current active section
let currentSection = 'all'; // Default to 'all'

// Banner slideshow variables
let bannerItems = []; // Will store banner items
let currentBannerIndex = 0; // Current index in the slideshow
let bannerInterval; // Interval for auto-rotation

// TMDB API key
const api_Key = 'ba3885a53bc2c4f3c4b5bdc1237e69a0';

// Function to update banner slideshow based on section
function updateBannerForSection(section) {
    const banner = document.getElementById('banner');
    const bannerTitle = document.getElementById('banner-title');

    // Clear current banner
    banner.src = '';
    bannerTitle.textContent = '';

    // Clear existing interval if any
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    // Reset banner items array
    bannerItems = [];
    currentBannerIndex = 0;

    if (section === 'all') {
        // For "All" section, we'll use trending content across all media types
        fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const items = data.results || [];
                // Filter to items with backdrop images
                bannerItems = items.filter(item => item.backdrop_path).slice(0, 9).map(item => ({
                    ...item,
                    mediaType: item.media_type || 'movie'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'movies') {
        // For Movies section, use trending movies
        fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const movies = data.results || [];
                // Filter to movies with backdrop images
                bannerItems = movies.filter(movie => movie.backdrop_path).slice(0, 9).map(movie => ({
                    ...movie,
                    mediaType: 'movie'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'tv') {
        // For TV Shows section, use trending TV shows
        fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const shows = data.results || [];
                // Filter to shows with backdrop images
                bannerItems = shows.filter(show => show.backdrop_path).slice(0, 9).map(show => ({
                    ...show,
                    mediaType: 'tv'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating banner:', error));
    } else if (section === 'anime') {
        // For Anime section, use upcoming anime for banner slideshow
        const today = new Date();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6); // Get anime coming in the next 6 months

        const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const futureDateStr = futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        // Get anime that will air after today but before 6 months from now
        fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${todayStr}&air_date.lte=${futureDateStr}&sort_by=primary_release_date.asc`)
            .then(response => response.json())
            .then(data => {
                const upcomingAnimes = data.results || [];
                console.log('Upcoming anime fetched:', upcomingAnimes.length);
                // Filter to animes with backdrop images, get up to 9 items
                bannerItems = upcomingAnimes.filter(anime => anime.backdrop_path).slice(0, 9).map(anime => ({
                    ...anime,
                    mediaType: 'tv'
                }));

                if (bannerItems.length > 0) {
                    showBannerAtIndex(0); // Show first banner
                    startBannerSlideshow(); // Start auto-rotation
                }
            })
            .catch(error => console.error('Error updating anime banner:', error));
    }
}

// Function to start auto-rotation of banner items
function startBannerSlideshow() {
    // Clear any existing interval
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }

    // Only start if we have multiple items
    if (bannerItems.length > 1) {
        bannerInterval = setInterval(() => {
            // Move to next banner
            currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);

            // This will be implemented in navigation-fix.js
            if (typeof updateActiveIndicator === 'function') {
                updateActiveIndicator();
            }
        }, 8000); // Change banner every 8 seconds
    }

    // Make banner items available to navigation-fix.js
    window.bannerItems = bannerItems;
    window.currentBannerIndex = currentBannerIndex;
    window.bannerInterval = bannerInterval;
}

// Function to show banner at specific index with enhanced styling
function showBannerAtIndex(index) {
    if (index < 0 || index >= bannerItems.length) return;

    const item = bannerItems[index];
    if (item && item.backdrop_path) {
        const banner = document.getElementById('banner');
        const bannerTitle = document.getElementById('banner-title');

        // Set banner image with high quality
        banner.src = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;

        // Create a more detailed title with additional info
        const title = item.title || item.name;

        // Add subtitle information if available
        const extraInfo = [];
        if (item.release_date) {
            extraInfo.push(new Date(item.release_date).getFullYear());
        } else if (item.first_air_date) {
            extraInfo.push(new Date(item.first_air_date).getFullYear());
        }

        // Add media type (Movie, TV Show, or Latest Update based on section)
        if (item.mediaType === 'movie') {
            extraInfo.push('Latest');
            extraInfo.push('Movie');
        } else if (item.mediaType === 'tv') {
            // Check which section we're in
            if (currentSection === 'anime') {
                extraInfo.push('Latest Update');
            } else {
                extraInfo.push('Latest');
                extraInfo.push('TV Show');
            }
        }

        // Add rating if available
        if (item.vote_average) {
            extraInfo.push(`⭐ ${parseFloat(item.vote_average).toFixed(1)}`);
        }

        if (extraInfo.length > 0) {
            bannerTitle.innerHTML = `
                ${title}
                <div class="banner-subtitle">${extraInfo.join(' • ')}</div>
            `;

            // Add some CSS to the subtitle for better appearance
            const subtitleElement = bannerTitle.querySelector('.banner-subtitle');
            if (subtitleElement) {
                subtitleElement.style.fontSize = '0.85rem';
                subtitleElement.style.opacity = '0.8';
                subtitleElement.style.marginTop = '8px';
                subtitleElement.style.fontWeight = 'normal';

                // Style all "Latest" tags - works for all sections
                const latestTag = 'Latest';
                if (subtitleElement.textContent.includes(latestTag) && currentSection !== 'anime') {
                    // Create a span to style just the "Latest" text
                    subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                        latestTag,
                        `<span class="latest-badge">${latestTag}</span>`
                    );

                    // Style the badge
                    const badge = subtitleElement.querySelector('.latest-badge');
                    if (badge) {
                        badge.style.backgroundColor = 'rgba(231, 76, 60, 0.85)'; // Red for trending content
                        badge.style.padding = '2px 6px';
                        badge.style.borderRadius = '4px';
                        badge.style.color = 'white';
                        badge.style.fontWeight = 'bold';
                        badge.style.marginRight = '3px';
                        badge.style.marginLeft = '3px';
                        badge.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)';
                    }
                }

                // Handle the "Latest Update" tag for anime section separately
                if (currentSection === 'anime' && subtitleElement.textContent.includes('Latest Update')) {
                    // Create a span to style just the "Latest Update" text
                    subtitleElement.innerHTML = subtitleElement.innerHTML.replace(
                        'Latest Update',
                        '<span class="latest-update-badge">Latest Update</span>'
                    );

                    // Style the badge
                    const badge = subtitleElement.querySelector('.latest-update-badge');
                    if (badge) {
                        badge.style.backgroundColor = 'rgba(52, 152, 219, 0.9)'; // Blue for latest updates
                        badge.style.padding = '3px 8px';
                        badge.style.borderRadius = '4px';
                        badge.style.color = 'white';
                        badge.style.fontWeight = 'bold';
                        badge.style.marginRight = '3px';
                        badge.style.marginLeft = '3px';
                        badge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
                    }
                }
            }
        } else {
            bannerTitle.textContent = title;
        }

        // Update the banner image to have better display
        banner.style.objectFit = 'cover';
        banner.style.objectPosition = 'center top';

        // Apply a subtle gradient overlay to make text more readable if not already added
        const bannerContainer = document.getElementById('banner-container');
        if (bannerContainer) {
            // Make sure the container has relative positioning for the overlay to work
            bannerContainer.style.position = 'relative';

            // Look for an existing overlay or create one
            let overlay = document.getElementById('banner-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'banner-overlay';
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 80%)';
                overlay.style.pointerEvents = 'none';
                overlay.style.zIndex = '1';

                // Insert overlay as the first child, behind other content
                bannerContainer.insertBefore(overlay, bannerContainer.firstChild);

                // Make sure detail elements appear above the overlay
                const detailsContainer = document.getElementById('details-container');
                if (detailsContainer) {
                    detailsContainer.style.zIndex = '2';
                    detailsContainer.style.position = 'relative';
                }
            }
        }

        // Update button click events
        const playButton = document.getElementById('play-button');
        const moreInfoButton = document.getElementById('more-info');

        // Clear any existing event listeners
        playButton.replaceWith(playButton.cloneNode(true));
        moreInfoButton.replaceWith(moreInfoButton.cloneNode(true));

        // Get fresh references to the buttons
        const newPlayButton = document.getElementById('play-button');
        const newMoreInfoButton = document.getElementById('more-info');

        // Add multiple event types for better mobile compatibility
        ['click', 'touchstart'].forEach(eventType => {
            newPlayButton.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
               const movieDetailsUrl = `/movie_details.html?media=${media}&id=${id}`;
            window.location.href = movieDetailsUrl;
            }, {passive: false});

            newMoreInfoButton.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
                const movieDetailsUrl = `/movie_details.html?media=${media}&id=${id}`;
                window.location.href = movieDetailsUrl;
            }, {passive: false});
        });

        // Update the current index
        currentBannerIndex = index;

        // Make current index available to navigation-fix.js
        window.currentBannerIndex = currentBannerIndex;

        // This will be implemented in navigation-fix.js
        if (typeof updateActiveIndicator === 'function') {
            updateActiveIndicator();
        }
    }
}

// Banner indicators have been removed as requested

// This function is kept empty to maintain compatibility with existing code
function updateBannerIndicators() {
    // Indicators functionality has been removed
}

// Function to get appropriate star color based on rating
function getRatingColor(rating) {
    if (rating >= 8) return '#4CAF50'; // Green for high ratings
    if (rating >= 6) return '#8d16c9'; // Purple (main theme color) for good ratings
    if (rating >= 4) return '#FFC107'; // Amber for average ratings
    return '#F44336'; // Red for low ratings
}

// Function to fetch and display movies or TV shows
function fetchMedia(containerClass, endpoint, mediaType, usePosterPath = false) {
    console.log(`Fetching ${mediaType} for ${containerClass} with endpoint ${endpoint}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        fetch(`https://api.themoviedb.org/3/${endpoint}api_key=${api_Key}`)
            .then(response => response.json())
            .then(data => {
                const movies = data.results || [];
                console.log(`Got ${mediaType} data for ${containerClass}, found ${movies.length} items`);
                container.innerHTML = ''; // Clear the container

                movies.forEach(movie => {
                    // Skip if no image is available
                    const imageUrl = usePosterPath
                        ? movie.poster_path
                        : movie.backdrop_path;
                    if (!imageUrl) return;

                    let pathToUse = usePosterPath ? movie.poster_path : movie.backdrop_path;
                    // Create item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';
                    itemElement.dataset.mediaType = mediaType || 'movie';

                    // Using a wrapper for the image to maintain aspect ratio
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'image-wrapper';

                    // Create and add the image
                    const img = document.createElement('img');
                    img.src = `https://image.tmdb.org/t/p/w780${pathToUse}`;
                    img.alt = movie.title || movie.name;
                    img.loading = 'lazy'; // Add lazy loading for better performance

                    imgWrapper.appendChild(img);
                    itemElement.appendChild(imgWrapper);
                    container.appendChild(itemElement);

                    // Add click event to navigate to movie details
                    itemElement.addEventListener('click', () => {
                        const mediaId = movie.id;
                        const mediaToUse = mediaType || (movie.first_air_date ? 'tv' : 'movie');
                        window.location.href = `movie_details/movie_details.html?media=${mediaToUse}&id=${mediaId}`;
                    });

                    // Create overlay with title and rating
                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    // Create title element
                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = movie.title || movie.name;

                    // Enhanced star rating visibility
                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    const ratingValue = document.createElement('span');
                    ratingValue.className = 'rating-value';

                    // Format the rating to show only one decimal place
                    const voteAverage = movie.vote_average || 0;
                    const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';
                    ratingValue.textContent = formattedRating;

                    // Set color based on rating
                    if (formattedRating !== 'N/A') {
                        star.style.color = getRatingColor(voteAverage);
                    }

                    // Build the rating element
                    rating.appendChild(star);
                    rating.appendChild(ratingValue);

                    // Build the overlay
                    overlay.appendChild(titleElement);
                    overlay.appendChild(rating);

                    // Add overlay to the image wrapper
                    imgWrapper.appendChild(overlay);
                });
            })
            .catch(error => {
                console.error('Error fetching media data:', error);
            });
    });
}

// Set up scroll distance
const scrollDistance = 1200;

// Get references to the header and other elements
// (header and navMenu are now defined below for scroll behavior)

// Retrieve watchlist from local storage or create an empty array if it doesn't exist
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Function to fetch and display anime from TMDB API
function fetchAnime(containerClass, genreOrKeyword) {
    console.log(`Fetching anime for ${containerClass} with TMDB API using genre/keyword: ${genreOrKeyword}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container) => {
        // Determine which TMDB endpoint to use based on the input
        let endpoint = '';

        if (genreOrKeyword === 'popular') {
            // For popular anime, use discover with animation genre + anime keyword and sort by popularity
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'top_rated') {
            // For top rated anime, use discover with animation genre + anime keyword sorted by rating
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=vote_average.desc&vote_count.gte=100`;
        } else if (genreOrKeyword === 'upcoming') {
            // For ongoing anime (renamed from upcoming), use discover with recent and ongoing air dates
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.lte=${dateStr}&with_status=0&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'truly_upcoming') {
            // For truly upcoming anime, use discover with future air dates
            const today = new Date();
            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + 6); // Get anime coming in the next 6 months

            const todayStr = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            const futureDateStr = futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

            // Get anime that will air after today but before 6 months from now
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&air_date.gte=${todayStr}&air_date.lte=${futureDateStr}&sort_by=primary_release_date.asc`;
        } else if (genreOrKeyword === 'action') {
            // Action anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,28&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'romance') {
            // Romance anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,10749&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'comedy') {
            // Comedy anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,35&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'fantasy') {
            // Fantasy anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,14&with_keywords=210024&sort_by=popularity.desc`;
        } else if (genreOrKeyword === 'sci_fi') {
            // Sci-Fi anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16,878&with_keywords=210024&sort_by=popularity.desc`;
        } else {
            // Default endpoint for general anime
            endpoint = `discover/tv?api_key=${api_Key}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`;
        }

        // Fetch anime data from TMDB
        console.log(`Fetching anime from TMDB with endpoint: https://api.themoviedb.org/3/${endpoint}`);
        fetch(`https://api.themoviedb.org/3/${endpoint}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`TMDB API responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Got anime data from TMDB for ${containerClass}, found ${data.results ? data.results.length : 0} items`);
                const animeResults = data.results || [];
                container.innerHTML = ''; // Clear the container first to prevent duplicates

                // Process each anime item
                if (animeResults.length === 0) {
                    console.warn(`No anime results found for ${containerClass}`);
                    container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">No anime content available at this time. Please try again later.</div>';
                    return;
                }

                // Filter out items without backdrop or poster images
                const validResults = animeResults.filter(item => item.poster_path || item.backdrop_path);

                console.log(`Processing ${validResults.length} valid anime items for ${containerClass}`);
                validResults.forEach((anime, index) => {
                    const title = anime.name || anime.title || 'Unknown Title';
                    console.log(`Processing anime ${index + 1}/${validResults.length}: ${title}`);

                    // Get image URL - use backdrop (landscape) for all anime containers
                    let useBackdrop = containerClass === 'anime-comedy-container' ||
                                      containerClass === 'anime-upcoming-new-container' ||
                                      containerClass === 'anime-romance-container' ||
                                      containerClass === 'anime-popular-container' ||
                                      containerClass === 'anime-top-container' ||
                                      containerClass === 'anime-upcoming-container';

                    const imageUrl = useBackdrop && anime.backdrop_path
                        ? `https://image.tmdb.org/t/p/w780${anime.backdrop_path}` // Use higher quality for landscape
                        : anime.poster_path
                            ? `https://image.tmdb.org/t/p/w500${anime.poster_path}`
                            : anime.backdrop_path
                                ? `https://image.tmdb.org/t/p/w780${anime.backdrop_path}`
                                : 'https://via.placeholder.com/780x439?text=No+Image+Available'; // 16:9 aspect ratio

                    // Create the main item element
                    const itemElement = document.createElement('div');
                    itemElement.className = 'movie-item';

                    // Apply landscape dimensions for all anime containers
                    if (useBackdrop) {
                        itemElement.style.width = '290px';  // Landscape width
                        itemElement.style.height = '170px'; // Landscape height (16:9 aspect ratio)
                    }

                    itemElement.dataset.mediaType = 'tv'; // Using TV since most anime are TV shows in TMDB
                    itemElement.dataset.id = anime.id;

                    // Create a wrapper for the image
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'image-wrapper';

                    // Create and add the image
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = title;
                    img.loading = 'lazy';

                    // Error handling for image loading
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = 'https://via.placeholder.com/500x750?text=Image+Error';
                    };

                    imgWrapper.appendChild(img);
                    itemElement.appendChild(imgWrapper);
                    container.appendChild(itemElement);

                    // Add click event to navigate to details page
                    itemElement.addEventListener('click', () => {
                        const movieDetailsUrl = `/movie_details.html?media=${media}&id=${id}`;
                window.location.href = movieDetailsUrl;
                    });

                    // Create overlay with title and rating
                    const overlay = document.createElement('div');
                    overlay.className = 'movie-overlay';

                    // Create title element
                    const titleElement = document.createElement('div');
                    titleElement.className = 'movie-title';
                    titleElement.textContent = title;

                    // Enhanced star rating
                    const rating = document.createElement('div');
                    rating.className = 'movie-rating';

                    const star = document.createElement('span');
                    star.className = 'rating-star';
                    star.innerHTML = '★';

                    const ratingValue = document.createElement('span');
                    ratingValue.className = 'rating-value';

                    // Format the rating to show only one decimal place
                    const voteAverage = anime.vote_average || 0;

                    // Show actual ratings for all anime including upcoming ones
                    const formattedRating = voteAverage !== 0 ? voteAverage.toFixed(1) : 'N/A';

                    // Set color based on rating
                    if (formattedRating !== 'N/A') {
                        star.style.color = getRatingColor(voteAverage);
                    }

                    ratingValue.textContent = formattedRating;

                    // Build the overlay
                    rating.appendChild(star);
                    rating.appendChild(ratingValue);
                    overlay.appendChild(titleElement);
                    overlay.appendChild(rating);

                    // Add overlay to the image wrapper
                    imgWrapper.appendChild(overlay);
                });
            })
            .catch(error => {
                console.error('Error fetching anime data from TMDB:', error);
                container.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">Error loading anime content. Please try again later.</div>';
            });
    });
}

// Initial fetch of movies
fetchMedia('netflix-container', 'discover/tv?with_networks=213&', 'tv', true); // Netflix originals with poster_path
fetchMedia('trending-container', 'trending/all/week?&', 'all');
fetchMedia('top-container', 'movie/top_rated?&', 'movie');
fetchMedia('horror-container', 'discover/movie?with_genres=27&', 'movie');
fetchMedia('comedy-container', 'discover/movie?with_genres=35&', 'movie');
fetchMedia('action-container', 'discover/movie?with_genres=28&', 'movie');

// Additional movie genres
fetchMedia('thriller-container', 'discover/movie?with_genres=53&', 'movie'); // Thriller movies
fetchMedia('adventure-container', 'discover/movie?with_genres=12&', 'movie'); // Adventure movies
fetchMedia('fantasy-movie-container', 'discover/movie?with_genres=14&', 'movie'); // Fantasy movies
fetchMedia('scifi-movie-container', 'discover/movie?with_genres=878&', 'movie'); // Sci-Fi movies

// Initial fetch of TV shows by genre
fetchMedia('drama-tv-container', 'discover/tv?with_genres=18&', 'tv'); // Drama (18)
fetchMedia('crime-tv-container', 'discover/tv?with_genres=80&', 'tv'); // Crime (80)
fetchMedia('scifi-tv-container', 'discover/tv?with_genres=10765&', 'tv'); // Sci-Fi & Fantasy (10765)
fetchMedia('comedy-tv-container', 'discover/tv?with_genres=35&', 'tv'); // Comedy TV (35)
fetchMedia('documentary-tv-container', 'discover/tv?with_genres=99&', 'tv'); // Documentary (99)

// Initial fetch of anime using TMDB API with appropriate genres/keywords
fetchAnime('anime-popular-container', 'popular'); // Popular anime
fetchAnime('anime-top-container', 'top_rated'); // Top rated anime
fetchAnime('anime-upcoming-container', 'upcoming'); // Ongoing anime (keeping the same container name)
fetchAnime('anime-upcoming-new-container', 'truly_upcoming'); // Latest anime

// Additional anime genres (removed the ones not needed)
fetchAnime('anime-comedy-container', 'comedy'); // Comedy anime
fetchAnime('anime-romance-container', 'romance'); // Romance anime

// The generic anime container has been removed

// Function to fetch search results from TMDB API
async function fetchSearchResults(query) {
    try {
        // Now just use TMDB multi-search API to get results for everything including anime
        const tmdbResponse = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${api_Key}&query=${encodeURIComponent(query)}`);
        const tmdbData = await tmdbResponse.json();

        // Also specifically search for anime with a dedicated request that includes the animation genre and anime keyword
        const animeResponse = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${api_Key}&query=${encodeURIComponent(query)}&with_genres=16&with_keywords=210024`);
        const animeData = await animeResponse.json();

        // Combine and format results
        let combinedResults = [];

        // Format TMDB multi-search results
        if (tmdbData.results) {
            tmdbData.results.forEach(item => {
                if (item.poster_path || item.backdrop_path) {
                    const posterPath = item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : item.backdrop_path
                            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                            : 'https://via.placeholder.com/500x750?text=No+Image+Available';

                    combinedResults.push({
                        id: item.id,
                        title: item.title || item.name,
                        poster_path: posterPath,
                        media_type: item.media_type,
                        release_date: item.release_date || item.first_air_date,
                        isAnime: false,
                        url: null
                    });
                }
            });
        }

        // Format dedicated anime search results
        if (animeData.results) {
            animeData.results.forEach(item => {
                // Check if this item is not already in results (to avoid duplicates)
                if (!combinedResults.some(result => result.id === item.id)) {
                    const posterPath = item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : item.backdrop_path
                            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                            : 'https://via.placeholder.com/500x750?text=No+Image+Available';

                    combinedResults.push({
                        id: item.id,
                        title: item.name || 'Unknown Title',
                        poster_path: posterPath,
                        media_type: 'tv', // Use 'tv' instead of 'anime' since TMDB treats anime as TV shows
                        release_date: item.first_air_date || '',
                        isAnime: true, // Mark as anime for specific handling
                        url: null
                    });
                }
            });
        }

        // Sort by popularity if available
        combinedResults.sort((a, b) => {
            if (a.popularity && b.popularity) {
                return b.popularity - a.popularity;
            }
            return 0;
        });

        return combinedResults;
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

// Define a function to handle scrolling
function setupScroll(containerClass, previousButtonClass, nextButtonClass) {
    const previousButtons = document.querySelectorAll(`.${previousButtonClass}`);
    const nextButtons = document.querySelectorAll(`.${nextButtonClass}`);
    const containers = document.querySelectorAll(`.${containerClass}`);

    containers.forEach((container, index) => {
        const previousButton = previousButtons[index];
        const nextButton = nextButtons[index];

        if (previousButton && nextButton) {
            nextButton.addEventListener('click', () => {
                container.scrollBy({
                    left: scrollDistance,
                    behavior: 'smooth',
                });
            });

            previousButton.addEventListener('click', () => {
                container.scrollBy({
                    left: -scrollDistance,
                    behavior: 'smooth',
                });
            });
        }
    });
}

// Setup scroll for movie sections
setupScroll('trending-container', 'trending-previous', 'trending-next');
setupScroll('netflix-container', 'netflix-previous', 'netflix-next');
setupScroll('top-container', 'top-previous', 'top-next');
setupScroll('horror-container', 'horror-previous', 'horror-next');
setupScroll('comedy-container', 'comedy-previous', 'comedy-next');
setupScroll('action-container', 'action-previous', 'action-next');

// Setup scroll for new movie genre sections
setupScroll('thriller-container', 'thriller-previous', 'thriller-next');
setupScroll('adventure-container', 'adventure-previous', 'adventure-next');
setupScroll('fantasy-movie-container', 'fantasy-movie-previous', 'fantasy-movie-next');
setupScroll('scifi-movie-container', 'scifi-movie-previous', 'scifi-movie-next');

// TV genres scroll
setupScroll('drama-tv-container', 'drama-tv-previous', 'drama-tv-next');
setupScroll('crime-tv-container', 'crime-tv-previous', 'crime-tv-next');
setupScroll('scifi-tv-container', 'scifi-tv-previous', 'scifi-tv-next');
setupScroll('comedy-tv-container', 'comedy-tv-previous', 'comedy-tv-next');
setupScroll('documentary-tv-container', 'documentary-tv-previous', 'documentary-tv-next');

// Anime scroll (updated to reflect removed sections)
setupScroll('anime-popular-container', 'anime-popular-previous', 'anime-popular-next');
setupScroll('anime-top-container', 'anime-top-previous', 'anime-top-next');
setupScroll('anime-upcoming-container', 'anime-upcoming-previous', 'anime-upcoming-next');
setupScroll('anime-upcoming-new-container', 'anime-upcoming-new-previous', 'anime-upcoming-new-next');
setupScroll('anime-comedy-container', 'anime-comedy-previous', 'anime-comedy-next');
setupScroll('anime-romance-container', 'anime-romance-previous', 'anime-romance-next');

// Event listener to navigate to WatchList page
goToWatchlistBtn.addEventListener('click', () => {
    window.location.href = 'watchList/watchlist.html';
});

// Add header scroll behavior
let prevScrollPos = window.scrollY;
const header = document.querySelector('.header');
const navMenu = document.querySelector('.nav-menu');

// Function to handle scroll behavior
function handleScroll() {
    const currentScrollPos = window.scrollY;

    if (window.innerWidth <= 560) { // Only apply this behavior on mobile
        if (prevScrollPos > currentScrollPos) {
            // Scrolling up - show header
            header.style.top = "0";
            navMenu.style.top = "60px";
        } else {
            // Scrolling down - hide header when not at the top
            if (currentScrollPos > 100) {
                header.style.top = "-60px";
                navMenu.style.top = "0";
            }
        }
    } else {
        // Reset for desktop
        header.style.top = "0";
        navMenu.style.top = "70px";
    }

    prevScrollPos = currentScrollPos;
}

// Add scroll event listener
window.addEventListener('scroll', handleScroll);

// Listen for window resize to adjust behavior
window.addEventListener('resize', function() {
    if (window.innerWidth > 560) {
        // Reset for desktop
        header.style.top = "0";
        navMenu.style.top = "70px";
    }
});

// Function to add Back to Top button
function addBackToTopButton() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.setAttribute('id', 'back-to-top-btn');
    backToTopBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
    </svg>`;

    document.body.appendChild(backToTopBtn);

    // Initially hide the button
    backToTopBtn.style.opacity = '0';
    backToTopBtn.style.visibility = 'hidden';

    // Show button when scrolled down
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
        }
    });

    // Scroll to top when clicked
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Add the back to top button
addBackToTopButton();

// Navigation menu functionality
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all items
        navItems.forEach(navItem => navItem.classList.remove('active'));

        // Add active class to clicked item
        item.classList.add('active');

        // Get the section to show
        const section = item.querySelector('a').getAttribute('data-section');
        currentSection = section; // Update the current section

        // Update the banner slideshow for the selected section
        updateBannerForSection(section);

        // First, fade out all sections
        movieSections.forEach(section => {
            section.classList.add('fade-out');
            section.classList.remove('fade-in');
        });

        // Wait for fade out to complete, then update visibility and fade in
        setTimeout(() => {
            // Show/hide sections based on selection
            if (section === 'all') {
                // Show all sections
                movieSections.forEach(section => {
                    section.style.display = 'block';
                    // Stagger the animations for a cascade effect
                    setTimeout(() => {
                        section.classList.remove('fade-out');
                        section.classList.add('fade-in');
                    }, Math.random() * 200); // Random delay between 0-200ms for natural feel
                });
            } else if (section === 'anime') {
                // Show only anime sections
                movieSections.forEach(section => {
                    if (section.classList.contains('anime-section')) {
                        section.style.display = 'block';
                        // Stagger the animations
                        setTimeout(() => {
                            section.classList.remove('fade-out');
                            section.classList.add('fade-in');
                        }, Math.random() * 200);
                    } else {
                        section.style.display = 'none';
                    }
                });

                // Adjust the scroll position to show the first anime section
                const firstAnimeSection = document.querySelector('.anime-section');
                if (firstAnimeSection) {
                    setTimeout(() => {
                        window.scrollTo({
                            top: firstAnimeSection.offsetTop - 150,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            } else if (section === 'movies') {
                // Show only movie sections (not TV or anime)
                movieSections.forEach(section => {
                    if (section.classList.contains('anime-section')) {
                        section.style.display = 'none';
                    } else if (section.id && section.id.includes('tv')) {
                        section.style.display = 'none';
                    } else {
                        // Check if the section contains "Netflix" which is TV shows
                        const sectionTitle = section.querySelector('h1');
                        if (sectionTitle && sectionTitle.textContent.includes('NETFLIX ORIGINALS')) {
                            section.style.display = 'none';
                        } else {
                            section.style.display = 'block';
                            // Stagger the animations
                            setTimeout(() => {
                                section.classList.remove('fade-out');
                                section.classList.add('fade-in');
                            }, Math.random() * 200);
                        }
                    }
                });
            } else if (section === 'tv') {
                // Show only TV show sections (not movies or anime)
                movieSections.forEach(section => {
                    if (section.classList.contains('anime-section')) {
                        section.style.display = 'none';
                    } else {
                        // Check if the section contains "Netflix" which is TV shows
                        const sectionTitle = section.querySelector('h1');
                        if (sectionTitle && sectionTitle.textContent.includes('NETFLIX ORIGINALS')) {
                            section.style.display = 'block';
                            // Stagger the animations
                            setTimeout(() => {
                                section.classList.remove('fade-out');
                                section.classList.add('fade-in');
                            }, Math.random() * 200);
                        } else if (section.classList.contains('tv-section')) {
                            section.style.display = 'block';
                            // Stagger the animations
                            setTimeout(() => {
                                section.classList.remove('fade-out');
                                section.classList.add('fade-in');
                            }, Math.random() * 200);
                        } else {
                            section.style.display = 'none';
                        }
                    }
                });
            }
        }, 400); // Wait for fade out animation to complete
    });
});

// Function to handle search input changes
async function handleSearchInput() {
    const query = searchInput.value;
    if (query.length > 2) {
        const results = await fetchSearchResults(query);
        if (results.length !== 0) {
            searchResults.style.visibility = "visible";
        }
        displaySearchResults(results);
    } else {
        searchResults.innerHTML = '';
        searchResults.style.visibility = "hidden";
    }
}

// Function to display search results
function displaySearchResults(results) {
    searchResults.innerHTML = '';
    results.map(item => {
        const shortenedTitle = item.title || 'Unknown Title';
        const date = item.release_date || '';

        let buttonText = "Add to WatchList"; // Set default button text

        // Check if the movie is already in WatchList
        if (watchlist.find(watchlistItem => watchlistItem.id === item.id)) {
            buttonText = "Go to WatchList"; // Change button text
        }

        const movieItem = document.createElement('div');
        // Create HTML structure for each item
        movieItem.innerHTML = `<div class = "search-item-thumbnail">
                                    <img src ="${item.poster_path}">
                                </div>
                                <div class ="search-item-info">
                                    <h3>${shortenedTitle}</h3>
                                    <p>${item.media_type || 'unknown'} <span> &nbsp; ${date}</span></p>
                                </div>
                                <button class="watchListBtn" id="${item.id}">${buttonText}</button>`;

        const watchListBtn = movieItem.querySelector('.watchListBtn');

        // Add event listener to WatchList button
        watchListBtn.addEventListener('click', () => {
            if (buttonText === "Add to WatchList") {
                addToWatchList(item);
            } else {
                window.location.href = 'watchList/watchlist.html'; // Navigate to the WatchList page
            }
        });

        const thumbnail = movieItem.querySelector('.search-item-thumbnail');
        const info = movieItem.querySelector('.search-item-info');

        // Add event listener to navigate to details page
        thumbnail.addEventListener('click', () => {
            if (item.isAnime) {
          const movieDetailsUrl = `/movie_details.html?media=${media}&id=${id}`;
                window.location.href = movieDetailsUrl;
            } else {
                const movieDetailsUrl = `/movie_details.html?media=${item.media_type}&id=${item.id}`;
                window.location.href = movieDetailsUrl;
            }
        });

        info.addEventListener('click', () => {
            if (item.isAnime) {
                window.location.href = `movie_details/movie_details.html?media=tv&id=${item.id}`;
            } else {
                window.location.href = `movie_details/movie_details.html?media=${item.media_type}&id=${item.id}`;
            }
        });

        movieItem.setAttribute('class', 'movie-list');

        // Append movie item to search results
        searchResults.appendChild(movieItem);
    });
}

// Function to add a movie to WatchList
function addToWatchList(movie) {
    // Check if the movie is not already in the WatchList list
    if (!watchlist.find(watchlistItem => watchlistItem.id === movie.id)) {
        watchlist.push(movie);
        localStorage.setItem('watchlist', JSON.stringify(watchlist)); // Store in Local Storage
        const watchListBtn = document.querySelector(`[id="${movie.id}"]`);
        if (watchListBtn) {
            watchListBtn.textContent = "Go to WatchList";
            watchListBtn.addEventListener('click', () => {
                window.location.href = 'watchList/watchlist.html'; // Navigate to the WatchList page
            });
        }
    }
}

// Event listener for search input changes
searchInput.addEventListener('input', handleSearchInput);

// Event listener for Enter key press in search input
searchInput.addEventListener('keyup', async event => {
    if (event.key === 'Enter') {
        handleSearchInput();
    }
});

// Event listener to close search results when clicking outside
document.addEventListener('click', event => {
    if (!searchResults.contains(event.target)) {
        searchResults.innerHTML = '';
        searchResults.style.visibility = "hidden";
    }
});

// Initialize the banner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add initial fade-in class to all sections
    movieSections.forEach(section => {
        section.classList.add('fade-out');
        // Stagger the animations for a cascade effect on initial load
        setTimeout(() => {
            section.classList.remove('fade-out');
            section.classList.add('fade-in');
        }, Math.random() * 500); // Longer random delay for initial load
    });

    // Update the banner based on the active section
    const activeNavItem = document.querySelector('.nav-item.active');
    if (activeNavItem) {
        const section = activeNavItem.querySelector('a').getAttribute('data-section');
        currentSection = section;
        updateBannerForSection(section);
    } else {
        // Default to 'all' if no nav item is active
        updateBannerForSection('all');
    }

    // Ensure proper spacing between the banner and section headings
    const bannerContainer = document.getElementById('banner-container');
    if (bannerContainer) {
        // Force a significant margin to prevent overlap
        bannerContainer.style.marginBottom = '80px';
    }

    // Adjust section headings to be more visible
    const sectionHeadings = document.querySelectorAll('.movie-section h1, .tv-section h1, .anime-section h1');
    sectionHeadings.forEach(heading => {
        heading.style.position = 'relative';
        heading.style.zIndex = '5';
    });

    // Set up banner navigation button handlers
    const prevButton = document.getElementById('banner-prev');
    const nextButton = document.getElementById('banner-next');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            // Move to previous banner
            currentBannerIndex = (currentBannerIndex - 1 + bannerItems.length) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);

            // Reset interval to prevent quick transitions
            if (bannerInterval) {
                clearInterval(bannerInterval);
                startBannerSlideshow();
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            // Move to next banner
            currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;

            // Show the banner
            showBannerAtIndex(currentBannerIndex);

            // Reset interval to prevent quick transitions
            if (bannerInterval) {
                clearInterval(bannerInterval);
                startBannerSlideshow();
            }
        });
    }
});

// Improved touch swipe functionality for movie sections
const movieContainers = document.querySelectorAll('.movies-box');

movieContainers.forEach(container => {
    let startX, startY;
    let isDragging = false;
    let lastX;
    let scrollLeft;
    let velocityX = 0;
    let lastTimestamp = 0;
    let isTouchScrolling = false;
    let rafId = null;
    let lastTouchPosition = { x: 0, y: 0 };

    // Prevent default browser handling of all panning and zooming gestures
    container.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    }, { passive: false });

    // Reset function
    function resetTouchState() {
        isDragging = false;
        isTouchScrolling = false;
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    // Touch start handler with passive option
    container.addEventListener('touchstart', (e) => {
        // Cancel any existing momentum scrolling
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        if (e.touches.length === 1) {
            isDragging = true;
            isTouchScrolling = true;
            startX = e.touches[0].pageX;
            startY = e.touches[0].pageY;
            lastX = startX;
            lastTouchPosition.x = startX;
            lastTouchPosition.y = startY;
            scrollLeft = container.scrollLeft;
            lastTimestamp = Date.now();
            velocityX = 0;
        }
    }, { passive: true });

    // Touch move handler
    container.addEventListener('touchmove', (e) => {
        if (!isDragging || !isTouchScrolling) return;

        const touch = e.touches[0];
        const x = touch.pageX;
        const y = touch.pageY;
        const now = Date.now();
        const elapsed = now - lastTimestamp;

        // Calculate horizontal and vertical movement
        const deltaX = lastTouchPosition.x - x;
        const deltaY = lastTouchPosition.y - y;

        // If vertical scrolling is more significant, let the browser handle it
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
            isTouchScrolling = false;
            return;
        }

        // Prevent default to disable browser overscroll
        if (e.cancelable) {
            e.preventDefault();
        }

        // Calculate velocity (pixels per millisecond)
        if (elapsed > 0) {
            velocityX = (lastX - x) / elapsed;
        }

        // Update scroll position
        container.scrollLeft = scrollLeft + (startX - x);

        // Store last position and timestamp
        lastX = x;
        lastTouchPosition.x = x;
        lastTouchPosition.y = y;
        lastTimestamp = now;
    }, { passive: false });

    // Touch end handler
    container.addEventListener('touchend', (e) => {
        if (!isDragging || !isTouchScrolling) {
            resetTouchState();
            return;
        }

        // Calculate final momentum scroll
        const vx = velocityX * 1000; // Convert to pixels per second
        const distance = Math.abs(vx);

        // Apply momentum scrolling only if there was enough velocity
        if (Math.abs(vx) > 0.5) {
            // Determine scroll distance based on velocity
            // Use a deceleration factor to slow down naturally
            const momentumDistance = vx * 0.7;

            // Setting up momentum scrolling with requestAnimationFrame for smoother animation
            let startTime = null;
            const momentumDuration = Math.min(Math.abs(momentumDistance) * 4, 800); // Cap duration

            function momentumScroll(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / momentumDuration, 1);

                // Apply easing for natural deceleration
                const easeOutQuad = function(t) { return t * (2 - t); };
                const easedProgress = easeOutQuad(progress);

                // Calculate the new scroll position with easing
                const scrollDistance = momentumDistance * (1 - easedProgress);
                container.scrollBy({ left: scrollDistance, behavior: 'auto' });

                // Continue animation if not complete
                if (progress < 1) {
                    rafId = requestAnimationFrame(momentumScroll);
                } else {
                    rafId = null;
                }
            }

            // Start momentum scrolling animation
            rafId = requestAnimationFrame(momentumScroll);
        }

        resetTouchState();
    }, { passive: true });

    // Cancel momentum scrolling if user touches screen again
    container.addEventListener('touchcancel', resetTouchState, { passive: true });
});

// Add fade-in/fade-out CSS classes for smooth transitions if not already present
(function injectFadeStyles() {
    if (!document.getElementById('fade-section-styles')) {
        const style = document.createElement('style');
        style.id = 'fade-section-styles';
        style.innerHTML = `
            .fade-in {
                opacity: 1 !important;
                transition: opacity 0.5s cubic-bezier(0.4,0,0.2,1);
                pointer-events: auto;
            }
            .fade-out {
                opacity: 0 !important;
                transition: opacity 0.4s cubic-bezier(0.4,0,0.2,1);
                pointer-events: none;
            }
            .movie-section, .anime-section {
                opacity: 1;
                transition: opacity 0.5s cubic-bezier(0.4,0,0.2,1);
            }
        `;
        document.head.appendChild(style);
    }
})();
