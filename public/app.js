const spotifyUrl = "https://open.spotify.com/search/Broken%20Pines";

const tracks = [
  {
    title: "They Can't Own This Life",
    album: "Broken Pines single",
    src: "/assets/audio/3-a.mp3",
    cover: "/assets/covers/they-cant-own-this-life.png"
  },
  {
    title: "Long Road Home",
    album: "Long Road Home",
    src: "/assets/audio/long-road-home.mp3",
    cover: "/assets/covers/long-road-home.png"
  },
  {
    title: "Losing My Mind",
    album: "Losing My Mind",
    src: "/assets/audio/losing-my-mind.mp3",
    cover: "/assets/covers/losing-my-mind.png"
  },
  {
    title: "Mirror Don't Lie",
    album: "Broken Pines single",
    src: "/assets/audio/mirror-dont-lie.mp3",
    cover: "/assets/covers/losing-my-mind.png"
  },
  {
    title: "More Liquor",
    album: "Broken Pines single",
    src: "/assets/audio/more-liquor.mp3",
    cover: "/assets/covers/they-cant-own-this-life.png"
  }
];

const audio = document.querySelector("[data-audio]");
const trackList = document.querySelector("[data-track-list]");
const progress = document.querySelector("[data-progress]");
const volume = document.querySelector("[data-volume]");
const currentTimeLabel = document.querySelector("[data-current-time]");
const durationLabel = document.querySelector("[data-duration]");
const visualizer = document.querySelector("[data-visualizer]");

const elements = {
  heroImage: document.querySelector("[data-hero-image]"),
  nowCover: document.querySelector("[data-now-cover]"),
  nowTitle: document.querySelector("[data-now-title]"),
  nowAlbum: document.querySelector("[data-now-album]"),
  stageCover: document.querySelector("[data-stage-cover]"),
  stageTitle: document.querySelector("[data-stage-title]"),
  stageAlbum: document.querySelector("[data-stage-album]"),
  dockCover: document.querySelector("[data-dock-cover]"),
  dockTitle: document.querySelector("[data-dock-title]"),
  dockAlbum: document.querySelector("[data-dock-album]")
};

let currentTrackIndex = 0;
let audioContext;
let analyser;
let sourceNode;
let animationFrame;

document.querySelectorAll("[data-spotify-link]").forEach((link) => {
  link.href = spotifyUrl;
});

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function renderTrackList() {
  trackList.innerHTML = tracks
    .map(
      (track, index) => `
        <button class="track-item" type="button" data-track-index="${index}" aria-current="${index === currentTrackIndex}">
          <img src="${track.cover}" alt="" loading="lazy" />
          <span>
            <strong>${track.title}</strong>
            <span>${track.album}</span>
          </span>
          <em>${String(index + 1).padStart(2, "0")}</em>
        </button>
      `
    )
    .join("");
}

function updatePlayButtons() {
  const isPlaying = !audio.paused;

  document.querySelectorAll("[data-action='toggle']").forEach((button) => {
    const playIcon = button.querySelector("[data-play-icon]");
    const pauseIcon = button.querySelector("[data-pause-icon]");
    button.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
    button.setAttribute("title", isPlaying ? "Pause" : "Play");
    playIcon.hidden = isPlaying;
    pauseIcon.hidden = !isPlaying;
  });
}

function updateTrackUi() {
  const track = tracks[currentTrackIndex];

  audio.src = track.src;
  audio.load();

  elements.heroImage.src = track.cover;
  elements.nowCover.src = track.cover;
  elements.nowCover.alt = `${track.title} cover`;
  elements.nowTitle.textContent = track.title;
  elements.nowAlbum.textContent = track.album;
  elements.stageCover.src = track.cover;
  elements.stageCover.alt = `${track.title} cover`;
  elements.stageTitle.textContent = track.title;
  elements.stageAlbum.textContent = track.album;
  elements.dockCover.src = track.cover;
  elements.dockTitle.textContent = track.title;
  elements.dockAlbum.textContent = track.album;

  document.querySelectorAll("[data-track-index]").forEach((button, index) => {
    button.setAttribute("aria-current", String(index === currentTrackIndex));
  });

  progress.value = 0;
  currentTimeLabel.textContent = "0:00";
  durationLabel.textContent = "0:00";
  updatePlayButtons();
}

function ensureVisualizer() {
  if (audioContext || !visualizer) {
    return;
  }

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 128;
  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);
  drawVisualizer();
}

function drawVisualizer() {
  const canvas = visualizer;
  const context = canvas.getContext("2d");
  const data = new Uint8Array(analyser.frequencyBinCount);
  const width = canvas.width;
  const height = canvas.height;

  function draw() {
    analyser.getByteFrequencyData(data);
    context.clearRect(0, 0, width, height);

    const barWidth = width / data.length;
    data.forEach((value, index) => {
      const percent = value / 255;
      const barHeight = Math.max(6, percent * height);
      const x = index * barWidth;
      const y = height - barHeight;
      const hueShift = index % 3;
      context.fillStyle =
        hueShift === 0
          ? "rgba(214, 163, 75, 0.82)"
          : hueShift === 1
            ? "rgba(181, 95, 42, 0.72)"
            : "rgba(111, 136, 145, 0.64)";
      context.fillRect(x, y, Math.max(3, barWidth - 3), barHeight);
    });

    animationFrame = requestAnimationFrame(draw);
  }

  cancelAnimationFrame(animationFrame);
  draw();
}

async function playCurrentTrack() {
  ensureVisualizer();

  if (audioContext?.state === "suspended") {
    await audioContext.resume();
  }

  try {
    await audio.play();
  } catch (error) {
    console.warn("Audio playback was blocked until the next user action.", error);
  }
}

function selectTrack(index, shouldPlay = true) {
  currentTrackIndex = (index + tracks.length) % tracks.length;
  updateTrackUi();

  if (shouldPlay) {
    playCurrentTrack();
  }
}

function nextTrack() {
  selectTrack(currentTrackIndex + 1, true);
}

function previousTrack() {
  selectTrack(currentTrackIndex - 1, true);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.matches("[data-track-index]")) {
    selectTrack(Number(button.dataset.trackIndex), true);
    return;
  }

  const action = button.dataset.action;
  if (action === "toggle") {
    if (audio.paused) {
      playCurrentTrack();
    } else {
      audio.pause();
    }
  }

  if (action === "next") {
    nextTrack();
  }

  if (action === "previous") {
    previousTrack();
  }
});

audio.addEventListener("play", updatePlayButtons);
audio.addEventListener("pause", updatePlayButtons);
audio.addEventListener("ended", nextTrack);

audio.addEventListener("loadedmetadata", () => {
  durationLabel.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  if (!Number.isFinite(audio.duration)) {
    return;
  }

  progress.value = String((audio.currentTime / audio.duration) * 1000);
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  durationLabel.textContent = formatTime(audio.duration);
});

progress.addEventListener("input", () => {
  if (!Number.isFinite(audio.duration)) {
    return;
  }

  audio.currentTime = (Number(progress.value) / 1000) * audio.duration;
});

volume.addEventListener("input", () => {
  audio.volume = Number(volume.value);
});

audio.volume = Number(volume.value);
renderTrackList();
updateTrackUi();
