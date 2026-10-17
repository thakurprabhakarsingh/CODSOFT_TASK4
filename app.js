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
  const playlistEl = document.getElementById('playlist');

  // Tracklist array
  const tracks = [
    {
      title: "Lofi Study Session",
      artist: "FASSounds",
      art: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80",
      src: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3"
    },
    {
      title: "Chill Gaming Vibes",
      artist: "Coma-Media",
      art: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
      src: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77c30.mp3?filename=chill-abstract-intention-12099.mp3"
    },
    {
      title: "Acoustic Breeze",
      artist: "Benjamin Tissot",
      art: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
      src: "https://www.bensound.com/bensound-music/bensound-ukulele.mp3"
    }
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;

  function loadTrack(index) {
    currentTrackIndex = index;
    const track = tracks[currentTrackIndex];

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    trackArt.src = track.art;
    audio.src = track.src;

    renderPlaylist();
  }

  function playTrack() {
    isPlaying = true;
    audio.play().catch(() => {});
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
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
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrackIndex);
    playTrack();
  }

  function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(currentTrackIndex);
    playTrack();
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Audio Events
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const progress = (audio.currentTime / audio.duration) * 100;
      seekBar.value = progress;
      currentTimeEl.textContent = formatTime(audio.currentTime);
      totalDurationEl.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener('ended', nextTrack);

  // Seek Bar Change
  seekBar.addEventListener('input', () => {
    if (audio.duration) {
      audio.currentTime = (seekBar.value / 100) * audio.duration;
    }
  });

  // Volume Bar
  volumeBar.addEventListener('input', (e) => {
    audio.volume = e.target.value;
  });

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.style.opacity = audio.muted ? '0.4' : '1';
  });

  // Playlist Rendering
  function renderPlaylist() {
    playlistEl.innerHTML = '';
    tracks.forEach((track, idx) => {
      const li = document.createElement('li');
      li.className = `playlist-item ${idx === currentTrackIndex ? 'active' : ''}`;
      li.innerHTML = `<span>${track.title}</span>`;
      li.addEventListener('click', () => {
        loadTrack(idx);
        playTrack();
      });
      playlistEl.appendChild(li);
    });
  }

  // Event Listeners
  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', prevTrack);
  nextBtn.addEventListener('click', nextTrack);

  // Initial Boot
  loadTrack(currentTrackIndex);
  audio.volume = volumeBar.value;
});
