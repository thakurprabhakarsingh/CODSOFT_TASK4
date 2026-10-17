document.addEventListener('DOMContentLoaded', () => {
  const audio = new Audio();
  audio.preload = 'auto';

  // Background AudioContext to prevent tab sleeping
  let audioCtx = null;
  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0.0001; // Silent keep-alive
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const trackArt = document.getElementById('track-art');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');

  const playBtn = document.getElementById('play-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  const seekBar = document.getElementById('seek-bar');
  const currentTimeEl = document.getElementById('current-time');
  const totalDurationEl = document.getElementById('total-duration');

  const volumeBar = document.getElementById('volume-bar');
  const muteBtn = document.getElementById('mute-btn');
  const fileUpload = document.getElementById('file-upload');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const playlistEl = document.getElementById('playlist');
  const playlistCountEl = document.getElementById('playlist-count');
  const listHeading = document.getElementById('list-heading');

  const fallbackArt = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80";

  let tracks = [];
  let currentTrackIndex = 0;
  let isPlaying = false;

  // Background & Lock Screen Media Notification Setup
  function updateMediaSession(track) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: 'Bollywood Hits',
        artwork: [
          { src: track.art, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', playTrack);
      navigator.mediaSession.setActionHandler('pause', pauseTrack);
      navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
      navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && audio.duration) {
          audio.currentTime = details.seekTime;
        }
      });
    }
  }

  // Prevent background pause on tab switch
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isPlaying) {
      audio.play().catch(() => {});
    }
  });

  // Reliable Apple Music Engine (Zero Downtime & Zero Search Error)
  async function searchBollywoodSongs(query) {
    listHeading.textContent = `Searching: ${query}...`;
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20&country=IN`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.results && data.results.length > 0) {
        tracks = data.results.map(item => ({
          title: item.trackName || "Bollywood Hit",
          artist: item.artistName || "Artist",
          art: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : fallbackArt,
          src: item.previewUrl
        })).filter(t => Boolean(t.src));

        listHeading.textContent = `Results: ${query}`;
        renderPlaylist();
        if (tracks.length > 0) {
          loadTrack(0);
        }
      } else {
        listHeading.textContent = "No songs found, try another title";
      }
    } catch (err) {
      console.error("Music Fetch Error:", err);
      listHeading.textContent = "Network error, please retry";
    }
  }

  function loadTrack(index) {
    if (!tracks[index]) return;
    currentTrackIndex = index;
    const track = tracks[currentTrackIndex];

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    trackArt.src = track.art || fallbackArt;
    audio.src = track.src;

    updateMediaSession(track);
    renderPlaylist();
  }

  function playTrack() {
    initAudioContext();
    isPlaying = true;
    audio.play().then(() => {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    }).catch(err => {
      console.warn("User action required:", err);
    });
  }

  function pauseTrack() {
    isPlaying = false;
    audio.pause();
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  function togglePlay() {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }

  function prevTrack() {
    if (tracks.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrackIndex);
    playTrack();
  }

  function nextTrack() {
    if (tracks.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(currentTrackIndex);
    playTrack();
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  audio.addEventListener('timeupdate', () => {
    if (audio.duration && !isNaN(audio.duration)) {
      const progress = (audio.currentTime / audio.duration) * 100;
      seekBar.value = progress;
      currentTimeEl.textContent = formatTime(audio.currentTime);
      totalDurationEl.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener('ended', nextTrack);

  seekBar.addEventListener('input', () => {
    if (audio.duration && !isNaN(audio.duration)) {
      audio.currentTime = (seekBar.value / 100) * audio.duration;
    }
  });

  volumeBar.addEventListener('input', (e) => {
    audio.volume = e.target.value / 100;
  });

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.style.opacity = audio.muted ? '0.4' : '1';
  });

  function triggerSearch() {
    const q = searchInput.value.trim();
    if (q) {
      searchBollywoodSongs(q);
    }
  }

  searchBtn.addEventListener('click', triggerSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') triggerSearch();
  });

  // Phone local files
  fileUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const fileUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");

      tracks.unshift({
        title: cleanTitle,
        artist: "Device Storage",
        art: fallbackArt,
        src: fileUrl
      });
    });

    listHeading.textContent = "Device Songs Added";
    renderPlaylist();
    loadTrack(0);
    playTrack();
  });

  function renderPlaylist() {
    playlistEl.innerHTML = '';
    playlistCountEl.textContent = `${tracks.length} songs`;

    tracks.forEach((track, idx) => {
      const li = document.createElement('li');
      li.className = `playlist-item ${idx === currentTrackIndex ? 'active' : ''}`;
      li.innerHTML = `
        <img class="item-thumb" src="${track.art || fallbackArt}" alt="thumb">
        <div class="item-meta">
          <div class="item-title">${track.title}</div>
          <div class="item-artist">${track.artist}</div>
        </div>
      `;

      li.addEventListener('click', () => {
        loadTrack(idx);
        playTrack();
      });

      playlistEl.appendChild(li);
    });
  }

  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', prevTrack);
  nextBtn.addEventListener('click', nextTrack);

  audio.volume = volumeBar.value / 100;

  // Initial Bollywood song fetch
  searchBollywoodSongs("Tere bina");
});
