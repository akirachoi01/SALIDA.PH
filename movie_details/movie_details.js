//
// Selecting the logo element and adding a click event listener to navigate to the homepage
const logo = document.querySelector('.logo');
logo.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Selecting various elements on the page for displaying movie details
const movieTitle = document.getElementById('movieTitle');
const moviePoster = document.getElementById('moviePoster');
const movieYear = document.getElementById('movieYear');
const rating = document.getElementById('rating');
const genre = document.getElementById('genre');
const plot = document.getElementById("plot");
const language = document.getElementById("language");
const iframe = document.getElementById("iframe");
const watchListBtn = document.querySelector('.watchListBtn');
const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Season and Episode selectors (mobile)
const seasonsContainer = document.getElementById('seasons-container');
const seasonSelect = document.getElementById('season-select');
const episodesList = document.getElementById('episodes-list');

// Desktop Season and Episode selectors
const desktopSeasonsContainer = document.getElementById('desktop-seasons-container');
const desktopSeasonSelect = document.getElementById('desktop-season-select');
const desktopEpisodesList = document.getElementById('desktop-episodes-list');

// API key for TMDB API
const api_Key = 'e79515e88dfd7d9f6eeca36e49101ac2';

// Retrieve the TMDb ID and Media from the URL parameter
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const media = params.get("media");

// Log parameters for debugging
console.log(`Loaded with parameters - ID: ${id}, Media type: ${media}`);

// Function to fetch detailed information using its TMDb ID
async function fetchMovieDetails(id) {
    try {
        // For all media types including anime, use TMDB API
        // Make sure to use the correct endpoint based on media type
        const mediaType = media === "all" ? "movie" : media;
        const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${api_Key}`;
        console.log(`Fetching details from: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched movie details:", data);

        // For anime check if we have additional genre info to include
        if (mediaType === "tv" && data) {
            // Check if this is likely anime by looking at genres
            const isAnime = data.genres && data.genres.some(genre => genre.id === 16); // 16 is Animation genre

            if (isAnime) {
                // Mark this as anime content for specialized handling if needed
                data.is_anime = true;
            }
        }

        return data;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return {
            title: "Error Loading Details",
            name: "Error Loading Details",
            overview: "Unable to load details. Please try again later.",
            release_date: "Unknown",
            first_air_date: "Unknown",
            vote_average: "N/A",
            genres: [{ name: "Unknown" }],
            spoken_languages: [{ english_name: "Unknown" }]
        };
    }
}

// Function to fetch video details (trailers) for a movie or TV show
async function fetchVideoDetails(id) {
    try {
        const mediaType = media === "all" ? "movie" : media;
        const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${api_Key}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching video details:', error);
        return [];
    }
}

// Function to fetch TV show seasons (with episodes for each season)
async function fetchTVSeasons(id) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${api_Key}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        // For each season, fetch its episodes
        if (data.seasons && data.seasons.length > 0) {
            // Only fetch episodes for regular seasons (season_number > 0)
            const seasonsWithEpisodes = [];
            for (const season of data.seasons) {
                if (season.season_number > 0) {
                    const episodes = await fetchSeasonEpisodes(id, season.season_number);
                    seasonsWithEpisodes.push({
                        ...season,
                        episodes: episodes
                    });
                }
            }
            return seasonsWithEpisodes;
        }
        return [];
    } catch (error) {
        console.error('Error fetching TV seasons:', error);
        return [];
    }
}

// Function to fetch episodes for a specific season
async function fetchSeasonEpisodes(tvId, seasonNumber) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${api_Key}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.episodes;
    } catch (error) {
        console.error('Error fetching season episodes:', error);
        return [];
    }
}

// Document ready function to set up event handlers
document.addEventListener('DOMContentLoaded', function() {
    // Set up event handlers for both desktop and mobile server selectors
    setupServerDropdowns();

    // Set up event handlers for change server buttons
    setupChangeServerButtons();

    // Other DOMContentLoaded event handlers can go here if needed
});

// Function to set up change server buttons
function setupChangeServerButtons() {
    const serverSelector = document.getElementById('server-selector');

    // Set up click handler for close button
    const closeButton = serverSelector.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            serverSelector.style.display = 'none';
        });
    }

    // Set up click handler for document to close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('#server-selector')) {
            serverSelector.style.display = 'none';
        }
    });
}

document.getElementById('server-selector').addEventListener('click', (e) => {
  if (e.target !== document.getElementById('server')) {
    document.getElementById('server-selector').style.display = 'none';
  }
});

// Add event listener for the close button
document.querySelector('.close-button').addEventListener('click', () => {
  document.getElementById('server-selector').style.display = 'none';
});

// Function to create season options in the season select dropdown
function createSeasonOptions(seasons) {
    // Clear existing options
    seasonSelect.innerHTML = '';
    desktopSeasonSelect.innerHTML = '';

    seasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season.season_number;
        option.textContent = `Season ${season.season_number} (${season.episodes.length} Episodes)`;

        const desktopOption = option.cloneNode(true);

        seasonSelect.appendChild(option);
        desktopSeasonSelect.appendChild(desktopOption);
    });

    // Remove previous event listeners to prevent duplicates
    seasonSelect.onchange = null;
    desktopSeasonSelect.onchange = null;

    // Add event listener to season select dropdown to populate episodes
    seasonSelect.addEventListener('change', function() {
        const selectedSeason = seasons.find(season => season.season_number == this.value);
        populateEpisodes(selectedSeason);

        // Sync with desktop
        desktopSeasonSelect.value = this.value;
    });

    // Add same event listener to desktop season select
    desktopSeasonSelect.addEventListener('change', function() {
        const selectedSeason = seasons.find(season => season.season_number == this.value);
        populateEpisodes(selectedSeason, true);

        // Sync with mobile
        seasonSelect.value = this.value;
    });

    // Populate episodes for the first season
    if (seasons.length > 0) {
        populateEpisodes(seasons[0]);
    }
}

// Function to populate episodes for the selected season
function populateEpisodes(season, fromDesktop = false) {
    // Clear the existing episodes
    episodesList.innerHTML = '';
    desktopEpisodesList.innerHTML = '';

    if (!season || !season.episodes) return;

    season.episodes.forEach(episode => {
        // Create an episode item for each episode
        const episodeItem = createEpisodeItem(episode, season.season_number);
        const desktopEpisodeItem = createEpisodeItem(episode, season.season_number, true);

        episodesList.appendChild(episodeItem);
        desktopEpisodesList.appendChild(desktopEpisodeItem);
    });
}

// Function to create an episode item
function createEpisodeItem(episode, seasonNumber, isDesktop = false) {
    const episodeItem = document.createElement('div');
    episodeItem.className = 'episode-item';
    episodeItem.dataset.episodeNumber = episode.episode_number;
    episodeItem.dataset.seasonNumber = seasonNumber;

    // Create thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'thumbnail-container';

    // Create thumbnail image
    const thumbnail = document.createElement('img');
    thumbnail.className = 'episode-thumbnail';
    thumbnail.alt = `${episode.name} Thumbnail`;

    if (episode.still_path) {
        thumbnail.src = `https://image.tmdb.org/t/p/w300${episode.still_path}`;
    } else {
        thumbnail.src = 'https://via.placeholder.com/300x170?text=No+Image';
    }

    // Create episode number
    const episodeNumber = document.createElement('div');
    episodeNumber.className = 'episode-number';
    episodeNumber.textContent = episode.episode_number;

    thumbnailContainer.appendChild(thumbnail);
    thumbnailContainer.appendChild(episodeNumber);

    // Create episode info
    const episodeInfo = document.createElement('div');
    episodeInfo.className = 'episode-info';

    // Create episode title
    const episodeTitle = document.createElement('div');
    episodeTitle.className = 'episode-title';
    episodeTitle.textContent = episode.name || `Episode ${episode.episode_number}`;

    // Create episode description
    const episodeDescription = document.createElement('div');
    episodeDescription.className = 'episode-description';
    episodeDescription.textContent = episode.overview || 'No description available';

    episodeInfo.appendChild(episodeTitle);
    episodeInfo.appendChild(episodeDescription);

    // Append all to episode item
    episodeItem.appendChild(thumbnailContainer);
    episodeItem.appendChild(episodeInfo);

    // Add click event to play the episode
    episodeItem.addEventListener('click', function() {
        // Get the season and episode numbers
        const seasonNumber = this.dataset.seasonNumber;
        const episodeNumber = this.dataset.episodeNumber;

        // Remove active class from all episode items in both desktop and mobile
        document.querySelectorAll('.episode-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to this episode item
        this.classList.add('active');

        // Sync active state with desktop/mobile counterpart
        let selector;
        if (isDesktop) {
            // Find the mobile episode item
            selector = `.episode-item[data-season-number="${seasonNumber}"][data-episode-number="${episodeNumber}"]:not(#desktop-episodes-list .episode-item)`;
        } else {
            // Find the desktop episode item
            selector = `#desktop-episodes-list .episode-item[data-season-number="${seasonNumber}"][data-episode-number="${episodeNumber}"]`;
        }
        const otherItem = document.querySelector(selector);
        if (otherItem) {
            otherItem.classList.add('active');
        }

        // Play the episode
        playEpisode(id, seasonNumber, episodeNumber);
    });

    return episodeItem;
}

// Function to show seasons for TV shows
async function setupTVShow(id) {
    try {
        const seasons = await fetchTVSeasons(id);
        if (seasons && seasons.length > 0) {
            createSeasonOptions(seasons);

            // Display the seasons containers
            seasonsContainer.style.display = "flex";
            desktopSeasonsContainer.classList.add('show-seasons');

            // Scroll to the seasons container for better mobile experience if needed
            if (window.innerWidth <= 740) {
                window.scrollTo({
                    top: seasonsContainer.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        }
    } catch (err) {
        console.error("Error setting up TV seasons:", err);
    }
}

// Function to set up server dropdowns for both desktop and mobile
function setupServerDropdowns() {
    // Get all server dropdown headers (both desktop and mobile)
    const serverDropdownHeaders = document.querySelectorAll('.server-dropdown-header');
    const serverOptions = document.querySelectorAll('.server-option');

    // Set up click handlers for all dropdown headers
    serverDropdownHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // Toggle dropdown
            const content = this.nextElementSibling;
            const arrow = this.querySelector('.dropdown-arrow');
            content.classList.toggle('show');
            arrow.classList.toggle('up');

            // Add active class to header
            this.classList.toggle('active');
        });
    });

    // Set up click handlers for all server options
    serverOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Get the server value
            const server = this.dataset.server;

            // Remove active class from all options in all dropdowns
            serverOptions.forEach(opt => opt.classList.remove('active'));

            // Add active class to clicked option
            this.classList.add('active');

            // Update both desktop and mobile dropdown headers
            updateServerSelectionDisplay(server, this);

            // Set the hidden server select value
            document.getElementById('server').value = server;

            // Close dropdown
            const content = this.closest('.server-dropdown-content');
            content.classList.remove('show');

            // Update arrow
            const header = content.previousElementSibling;
            const arrow = header.querySelector('.dropdown-arrow');
            arrow.classList.remove('up');

            // Change server
            changeServer();
        });
    });

    // Set initial active server and update display
    const initialServer = document.getElementById('server').value || 'player.videasy.net';
    document.getElementById('server').value = initialServer; // Ensure select matches

    const initialServerOption = document.querySelector(`.server-option[data-server="${initialServer}"]`);
    if (initialServerOption) {
        initialServerOption.classList.add('active');
        updateServerSelectionDisplay(initialServer, initialServerOption);
    }
}

// Function to update the display of server selection in both dropdowns
function updateServerSelectionDisplay(server, selectedOption) {
    // Get server info
    const serverName = selectedOption.querySelector('.server-name').textContent;
    const serverTags = selectedOption.querySelectorAll('.server-tag');

    // Update all dropdown headers
    const selectedServers = document.querySelectorAll('.selected-server');

    selectedServers.forEach(selected => {
        // Clear current selection
        selected.innerHTML = '';

        // Add server name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'server-name';
        nameSpan.textContent = serverName;
        selected.appendChild(nameSpan);

        // Add tags
        serverTags.forEach(tag => {
            const newTag = tag.cloneNode(true);
            selected.appendChild(newTag);
        });
    });
}

// Function to handle video source change based on selected server
async function changeServer() {
    // Get server value - try to get from active server option first
    const activeOption = document.querySelector('.server-option.active');
    let server = '';

    if (activeOption) {
        server = activeOption.dataset.server;
    } else {
        server = document.getElementById('server').value; // Fallback to select element
    }

    const actualMedia = media === "all" ? "movie" : media; // Convert "all" to "movie" for server URLs
    const type = actualMedia === "movie" ? "movie" : (actualMedia === "anime" ? "anime" : "tv"); // Movie, TV, or Anime type

    console.log(`Changing server to: ${server}, Media type: ${type}, ID: ${id}`);

    // Check if we're viewing a TV show with episode selected
    if (type === "tv" && (seasonsContainer.style.display === "flex" || desktopSeasonsContainer.classList.contains('show-seasons'))) {
        // If an episode is already selected (playing), update it with the new server
        const activeEpisode = document.querySelector('.episode-item.active');
        if (activeEpisode) {
            const seasonNumber = activeEpisode.dataset.seasonNumber;
            const episodeNumber = activeEpisode.dataset.episodeNumber;
            playEpisode(id, seasonNumber, episodeNumber);
            return;
        }
    }

    let embedURL = "";  // URL to embed video from the selected server

    // Set the video URL depending on the selected server and media type
    if (type === "anime") {
        // For anime, we'll use Gogo-anime, 9anime or other anime-specific providers
        // This is a placeholder implementation - these URLs are examples and may not work
        switch (server) {
            case "vidlink.pro":
                embedURL = `https://vidlink.pro/anime/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                break;
            case "vidsrc.cc":
                embedURL = `https://vidsrc.cc/v2/embed/anime/${id}`;
                break;
            case "vidsrc.me":
                embedURL = `https://vidsrc.net/embed/anime/?mal=${id}`;
                break;
            case "player.videasy.net":
                embedURL = `https://player.videasy.net/anime/${id}`;
                break;
            case "2embed":
                embedURL = `https://www.2embed.cc/embed/anime/${id}`;
                break;
            case "movieapi.club":
                embedURL = `https://moviesapi.club/anime/${id}`;
                break;
            default:
                // Fallback to a generic anime provider
                embedURL = `https://vidlink.pro/anime/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                break;
        }
    } else {
        // For movies and TV shows, use the existing providers
        switch (server) {
            case "vidlink.pro":
                if (type === "tv") {
                    // For TV shows, default to first episode of first season
                    embedURL = `https://vidlink.pro/tv/${id}/1/1?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                } else {
                    embedURL = `https://vidlink.pro/movie/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                }
                break;
            case "vidsrc.cc":
                embedURL = `https://vidsrc.cc/v2/embed/${type}/${id}`;
                break;
            case "vidsrc.me":
                embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${id}`;
                break;
            case "player.videasy.net":
                embedURL = `https://player.videasy.net/${type}/${id}`;
                break;
            case "2embed":
                embedURL = `https://www.2embed.cc/embed/${id}`;
                break;
            case "movieapi.club":
                embedURL = `https://moviesapi.club/${type}/${id}`;
                break;
            default:
                // Default to vidlink.pro as a fallback
                if (type === "tv") {
                    embedURL = `https://vidlink.pro/tv/${id}/1/1?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                } else {
                    embedURL = `https://vidlink.pro/movie/${id}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
                }
                break;
        }
    }

    // Log the URL for debugging
    console.log(`Loading ${type} from: ${embedURL}`);

    // Update the iframe source with the correct video URL
    if (iframe) {
        iframe.src = embedURL;
        iframe.style.display = "block";  // Show the iframe

        // Make sure iframe is visible and not positioned absolutely for better layout
        iframe.style.position = "relative";
        iframe.style.top = "auto";
        iframe.style.left = "auto";
    } else {
        console.error("iframe element not found!");
    }

    // Hide the movie poster when the video is playing
    if (moviePoster) {
        moviePoster.style.display = "none";  // Hide the movie poster image
    }
}

// Function to play a specific episode
function playEpisode(tvId, seasonNumber, episodeNumber) {
    // Get server value - try to get from active server option first
    const activeOption = document.querySelector('.server-option.active');
    let server = '';
    if (activeOption) {
        server = activeOption.dataset.server;
    } else {
        server = document.getElementById('server').value;
    }
    let embedURL = "";

    // Update the URL for each server to include season and episode parameters
    switch (server) {
        case "player.videasy.net":
            embedURL = `https://player.videasy.net/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
            break;
        case "vidlink.pro":
            embedURL = `https://vidlink.pro/tv/${tvId}/${seasonNumber}/${episodeNumber}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
            break;
        case "vidsrc.cc":
            embedURL = `https://vidsrc.cc/v2/embed/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
            break;
        case "vidsrc.me":
            embedURL = `https://vidsrc.net/embed/tv/?tmdb=${tvId}&season=${seasonNumber}&episode=${episodeNumber}`;
            break;
        case "2embed":
            embedURL = `https://www.2embed.cc/embedtv/${tvId}&s=${seasonNumber}&e=${episodeNumber}`;
            break;
        case "movieapi.club":
            embedURL = `https://moviesapi.club/tv/${tvId}/${seasonNumber}/${episodeNumber}`;
            break;
        default:
            // Default to vidlink.pro as a fallback
            embedURL = `https://vidlink.pro/tv/${tvId}/${seasonNumber}/${episodeNumber}?primaryColor=63b8bc&iconColor=ffffff&autoplay=true`;
            break;
    }

    if (embedURL) {
        // Log the URL for debugging
        console.log(`Loading TV episode from: ${embedURL}`);

        // Update the iframe source with the episode URL
        iframe.src = embedURL;
        iframe.style.display = "block";
        moviePoster.style.display = "none";

        // Make sure iframe is visible and not positioned absolutely
        iframe.style.position = "relative";
        iframe.style.top = "auto";
        iframe.style.left = "auto";

        // Mark the selected episode as active
        const episodes = document.querySelectorAll('.episode-item');
        episodes.forEach(item => item.classList.remove('active'));

        // Mark both desktop and mobile episode items as active
        document.querySelectorAll(`.episode-item[data-season-number="${seasonNumber}"][data-episode-number="${episodeNumber}"]`).forEach(item => {
            item.classList.add('active');
        });

        // Scroll to the active episode for better UX (only in the relevant list)
        const currentEpisodeMobile = episodesList.querySelector(`.episode-item[data-season-number="${seasonNumber}"][data-episode-number="${episodeNumber}"]`);
        if (currentEpisodeMobile) {
            episodesList.scrollTop = currentEpisodeMobile.offsetTop - episodesList.offsetTop - 10;
        }
        const currentEpisodeDesktop = desktopEpisodesList.querySelector(`.episode-item[data-season-number="${seasonNumber}"][data-episode-number="${episodeNumber}"]`);
        if (currentEpisodeDesktop) {
            desktopEpisodesList.scrollTop = currentEpisodeDesktop.offsetTop - desktopEpisodesList.offsetTop - 10;
        }

        // Scroll to top of video for better mobile experience
        if (window.innerWidth <= 740) {
            window.scrollTo({
                top: iframe.offsetTop - 20,
                behavior: 'smooth'
            });
        }
    }
}

// Store the last loaded movie details for watchlist toggling
let lastLoadedMovieDetails = null;

// Function to display movie details on the page
async function displayMovieDetails() {
    try {
        if (!id) {
            throw new Error("No movie ID provided in URL parameters");
        }

        const movieDetails = await fetchMovieDetails(id);
        lastLoadedMovieDetails = movieDetails;

        if (!movieDetails) {
            throw new Error("Failed to fetch movie details");
        }

        var spokenlanguage = movieDetails.spoken_languages ? movieDetails.spoken_languages.map(language => language.english_name) : ['Unknown'];
        language.textContent = spokenlanguage.join(', ');

        var genreNames = movieDetails.genres ? movieDetails.genres.map(genre => genre.name) : ['Unknown'];
        genre.innerText = genreNames.join(', ');

        // For anime, display a special message if we're using a placeholder
        if (media === "anime" && movieDetails.overview === 'Unable to load anime details.') {
            plot.textContent = "This anime is available for viewing. Click the Play button to start.";
        } else if (movieDetails.overview && movieDetails.overview.length > 290) {
            plot.textContent = `${movieDetails.overview.substring(0, 290)}...`;
        } else {
            plot.textContent = movieDetails.overview || 'No description available';
        }

        // Set the movie title (using name for TV shows or title for movies)
        movieTitle.textContent = movieDetails.name || movieDetails.title || "Unknown Title";

        // Set the movie poster image
        if (movieDetails.backdrop_path) {
            if (movieDetails.backdrop_path.startsWith('http')) {
                moviePoster.src = movieDetails.backdrop_path;
            } else {
                moviePoster.src = `https://image.tmdb.org/t/p/w500${movieDetails.backdrop_path}`;
            }
            moviePoster.style.display = "block";
        } else if (movieDetails.poster_path) {
            if (movieDetails.poster_path.startsWith('http')) {
                moviePoster.src = movieDetails.poster_path;
            } else {
                moviePoster.src = `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`;
            }
            moviePoster.style.display = "block";
        } else {
            moviePoster.src = 'https://via.placeholder.com/500x281?text=No+Image+Available';
            moviePoster.style.display = "block";
        }

        // Set release date and rating
        movieYear.textContent = `${movieDetails.release_date || movieDetails.first_air_date || 'Unknown'}`;
        rating.textContent = movieDetails.vote_average ? (typeof movieDetails.vote_average === "number" ? movieDetails.vote_average.toFixed(1) : movieDetails.vote_average) : 'N/A';

        // If this is a TV show, setup the seasons and episodes section
        const actualMedia = media === "all" ? "movie" : media;
        if (actualMedia === "tv") {
            await setupTVShow(id);
        }

        // Call the changeServer function to update the video source
        changeServer();

        // Updating the favorite button text and adding a click event listener to toggle favorites
        if (watchlist.some(favoriteMovie => favoriteMovie.id === movieDetails.id)) {
            watchListBtn.textContent = "Remove From WatchList";
        } else {
            watchListBtn.textContent = "Add To WatchList";
        }

        // Remove previous event listeners to prevent duplicates
        watchListBtn.replaceWith(watchListBtn.cloneNode(true));
        // Re-select the button after replacement
        const newWatchListBtn = document.querySelector('.watchListBtn');
        newWatchListBtn.textContent = watchListBtn.textContent;
        newWatchListBtn.addEventListener('click', () => toggleFavorite(lastLoadedMovieDetails));

    } catch (error) {
        console.error('Error displaying movie details:', error);
        movieTitle.textContent = "Details are not available right now! Please try after some time.";
        plot.textContent = "Error: " + error.message;
    }
}

// Function to toggle adding/removing from favorites
function toggleFavorite(movieDetails) {
    if (!movieDetails) return;
    const index = watchlist.findIndex(movie => movie.id === movieDetails.id);
    if (index !== -1) {
        watchlist.splice(index, 1);
        document.querySelector('.watchListBtn').textContent = "Add To WatchList";
    } else {
        watchlist.push(movieDetails);
        document.querySelector('.watchListBtn').textContent = "Remove From WatchList";
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// Function to handle changes when server selection is made
document.getElementById('server').addEventListener('change', () => {
    changeServer();
});

// Add window resize listener to ensure responsive video size
window.addEventListener('resize', () => {
    // Only update if iframe is visible
    if (iframe && iframe.style.display === "block") {
        // No need to call changeServer here as it would reload the video
        // Just ensure the sizing is correct
    }
});

// Initialize everything when the window loads
window.addEventListener('load', function() {
    console.log("Window loaded, initializing FreeFlix...");

    // Set a default server if none is selected
    const serverSelect = document.getElementById('server');
    if (serverSelect && !serverSelect.value) {
        serverSelect.value = "player.videasy.net";
    }

    // Display movie details
    displayMovieDetails();
});
