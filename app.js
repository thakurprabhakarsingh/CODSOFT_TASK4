document.addEventListener('DOMContentLoaded', () => {
  // OFFICIAL GOOGLE CLOUD YOUTUBE API KEY
  const YOUTUBE_API_KEY = "AIzaSyAcEjWKrSl6UGXsYZVHsGUD4tvDD0LfSss";

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

  let ytPlayer = null;
  let localAudio = new Audio();
  let tracks = [];
  let currentTrackIndex = 0;
  let isPlaying = false;
  let timerInterval = null;

  function decodeHTML(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }

  // YouTube API IFrame Player Initialization
  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-audio-player', {
      height: '10',
      width: '10',
      playerVars: {
        'playsinline': 1,
        'controls': 0,
        'disablekb': 1
      },
      events: {
        'onStateChange': onPlayerStateChange
      }
    });
  };

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      isPlaying = true;
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      startTimer();
    } else if (event.data === YT.PlayerState.PAUSED) {
      isPlaying = false;
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      clearInterval(timerInterval);
    } else if (event.data === YT.PlayerState.ENDED) {
      nextTrack();
    }
  }

  // Google Cloud YouTube Data API v3 Search
  async function searchYouTubeTracks(query) {
    listHeading.textContent = `Searching: ${query}...`;
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=15&q=${encodeURIComponent(query + ' song')}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.items && data.items.length > 0) {
        tracks = data.items.map(item => ({
          type: 'youtube',
          id: item.id.videoId,
          title: decodeHTML(item.snippet.title),
          artist: decodeHTML(item.snippet.channelTitle),
          art: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : (item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : fallbackArt)
        }));

        listHeading.textContent = `Results: ${query}`;
        renderPlaylist();
        if (tracks.length > 0) {
          loadTrack(0);
        }
      } else {
        listHeading.textContent = "No tracks found";
      }
    } catch (err) {
      console.error("YouTube API Error:", err);
      listHeading.textContent = "API error, please retry";
    }
  }

  function loadTrack(index) {
    if (!tracks[index]) return;
    currentTrackIndex = index;
    const track = tracks[currentTrackIndex];

    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    trackArt.src = track.art || fallbackArt;

    if (track.type === 'youtube') {
      localAudio.pause();
      if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(track.id);
      }
    } else {
      if (ytPlayer && ytPlayer.pauseVideo) {
        ytPlayer.pauseVideo();
      }
      localAudio.src = track.src;
    }

    renderPlaylist();
  }

  function playTrack() {
    const track = tracks[currentTrackIndex];
    if (!track) return;

    if (track.type === 'youtube') {
      if (ytPlayer && ytPlayer.playVideo) {
        ytPlayer.playVideo();
      }
    } else {
      localAudio.play().then(() => {
        isPlaying = true;
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      });
    }
  }

  function pauseTrack() {
    const track = tracks[currentTrackIndex];
    if (!track) return;

    if (track.type === 'youtube') {
      if (ytPlayer && ytPlayer.pauseVideo) {
        ytPlayer.pauseVideo();
      }
    } else {
      localAudio.pause();
      isPlaying = false;
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
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

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const track = tracks[currentTrackIndex];
      if (track && track.type === 'youtube' && ytPlayer && ytPlayer.getDuration) {
        const cur = ytPlayer.getCurrentTime();
        const dur = ytPlayer.getDuration();
        if (dur > 0) {
          seekBar.value = (cur / dur) * 100;
          currentTimeEl.textContent = formatTime(cur);
          totalDurationEl.textContent = formatTime(dur);
        }
      }
    }, 500);
  }

  // Local audio timeupdate
  localAudio.addEventListener('timeupdate', () => {
    if (localAudio.duration && !isNaN(localAudio.duration)) {
      seekBar.value = (localAudio.currentTime / localAudio.duration) * 100;
      currentTimeEl.textContent = formatTime(localAudio.currentTime);
      totalDurationEl.textContent = formatTime(localAudio.duration);
    }
  });

  localAudio.addEventListener('ended', nextTrack);

  // Seek bar
  seekBar.addEventListener('input', () => {
    const track = tracks[currentTrackIndex];
    if (track && track.type === 'youtube' && ytPlayer && ytPlayer.getDuration) {
      const seekTo = (seekBar.value / 100) * ytPlayer.getDuration();
      ytPlayer.seekTo(seekTo, true);
    } else if (localAudio.duration) {
      localAudio.currentTime = (seekBar.value / 100) * localAudio.duration;
    }
  });

  // Volume
  volumeBar.addEventListener('input', (e) => {
    const vol = Number(e.target.value);
    if (ytPlayer && ytPlayer.setVolume) {
      ytPlayer.setVolume(vol);
    }
    localAudio.volume = vol / 100;
  });

  muteBtn.addEventListener('click', () => {
    if (ytPlayer && ytPlayer.isMuted) {
      if (ytPlayer.isMuted()) {
        ytPlayer.unMute();
        muteBtn.style.opacity = '1';
      } else {
        ytPlayer.mute();
        muteBtn.style.opacity = '0.4';
      }
    }
  });

  // Search Action
  function triggerSearch() {
    const q = searchInput.value.trim();
    if (q) {
      searchYouTubeTracks(q);
    }
  }

  searchBtn.addEventListener('click', triggerSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') triggerSearch();
  });

  // Local Device Audio
  fileUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const fileUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");

      tracks.unshift({
        type: 'local',
        title: cleanTitle,
        artist: "Phone Audio",
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

  // Initial load
  searchYouTubeTracks("Arijit Singh Hits");
});
