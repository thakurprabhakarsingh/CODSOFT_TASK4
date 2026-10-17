document.addEventListener('DOMContentLoaded', () => {
  const audio = new Audio();

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
  const onlineUrlInput = document.getElementById('online-url-input');
  const addUrlBtn = document.getElementById('add-url-btn');
  const playlistEl = document.getElementById('playlist');
  const playlistCountEl = document.getElementById('playlist-count');

  const defaultArtwork = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80";

  // Pre-configured online tracks (Direct high-quality CDN audio streams)
  let tracks = [
    {
      title: "Lofi Dream Session",
      artist: "Online Stream",
      art: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80",
      src: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Keshco/Suspended_Animation/Keshco_-_01_-_Flute_Song.mp3",
      source: "Online"
    },
    {
      title: "Morning Sun Acoustic",
      artist: "Online Stream",
      art: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
      src: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Kai_Engel/Sollers_Philosophia/Kai_Engel_-_01_-_Damaged_Lough.mp3",
      source: "Online"
    },
    {
      title: "Electronic Synthwave",
      artist: "Online Stream",
      art: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80",
      src: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Algorithms.mp3",
      source: "Online"
    }
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;

  function loadTrack(index) {
    if (!tracks[index]) return;
    currentTrackIndex = index;
    const track = tracks[currentTrackIndex];

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    trackArt.src = track.art || defaultArtwork;
    audio.src = track.src;

    renderPlaylist();
  }

  function playTrack() {
    isPlaying = true;
    audio.play().then(() => {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    }).catch(err => {
      console.warn('Playback waiting for user gesture or loading...', err);
    });
  }

  function pauseTrack() {
    isPlaying = false;
    audio.pause();
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
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

  // Audio timeline update
  audio.addEventListener('timeupdate', () => {
    if (audio.duration && !isNaN(audio.duration)) {
      const progress = (audio.currentTime / audio.duration) * 100;
      seekBar.value = progress;
      currentTimeEl.textContent = formatTime(audio.currentTime);
      totalDurationEl.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener('ended', nextTrack);

  // Seek bar drag/touch
  seekBar.addEventListener('input', () => {
    if (audio.duration && !isNaN(audio.duration)) {
      audio.currentTime = (seekBar.value / 100) * audio.duration;
    }
  });

  // Volume
  volumeBar.addEventListener('input', (e) => {
    audio.volume = e.target.value;
  });

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.style.opacity = audio.muted ? '0.4' : '1';
  });

  // 1. Phone Storage se Gaane Add Karna
  fileUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const fileUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");

      tracks.push({
        title: cleanTitle,
        artist: "Phone Storage",
        art: defaultArtwork,
        src: fileUrl,
        source: "Local"
      });
    });

    renderPlaylist();
    loadTrack(tracks.length - files.length);
    playTrack();
  });

  // 2. Direct Online MP3 Link Add Karna
  addUrlBtn.addEventListener('click', () => {
    const url = onlineUrlInput.value.trim();
    if (!url) return;

    let title = "Online Audio Track";
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.split('/').pop();
      if (pathname) title = decodeURIComponent(pathname);
    } catch (_) {}

    tracks.push({
      title: title,
      artist: "Web Audio Stream",
      art: defaultArtwork,
      src: url,
      source: "Online"
    });

    onlineUrlInput.value = '';
    renderPlaylist();
    loadTrack(tracks.length - 1);
    playTrack();
  });

  // Render Playlist UI
  function renderPlaylist() {
    playlistEl.innerHTML = '';
    playlistCountEl.textContent = `${tracks.length} songs`;

    tracks.forEach((track, idx) => {
      const li = document.createElement('li');
      li.className = `playlist-item ${idx === currentTrackIndex ? 'active' : ''}`;
      li.innerHTML = `
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px;">
          ${track.title}
        </span>
        <span class="track-tag">${track.source || 'Audio'}</span>
      `;

      li.addEventListener('click', () => {
        loadTrack(idx);
        playTrack();
      });

      playlistEl.appendChild(li);
    });
  }

  // Controls Event Listeners
  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', prevTrack);
  nextBtn.addEventListener('click', nextTrack);

  // Initialize
  loadTrack(currentTrackIndex);
  audio.volume = volumeBar.value;
});
