const elements = {
  newsScript: document.getElementById("newsScript"),
  languageSelect: document.getElementById("languageSelect"),
  voiceSelect: document.getElementById("voiceSelect"),
  rateRange: document.getElementById("rateRange"),
  pitchRange: document.getElementById("pitchRange"),
  rateValue: document.getElementById("rateValue"),
  pitchValue: document.getElementById("pitchValue"),
  previewBtn: document.getElementById("previewBtn"),
  recordBtn: document.getElementById("recordBtn"),
  stopBtn: document.getElementById("stopBtn"),
  statusText: document.getElementById("statusText"),
  downloadLink: document.getElementById("downloadLink"),
  currentLine: document.getElementById("currentLine"),
  languageIndicator: document.getElementById("languageIndicator"),
  stage: document.getElementById("stage"),
  mouth: document.querySelector(".mouth"),
  wave: document.querySelector(".wave"),
};

let voices = [];
let speaking = false;
let recording = false;
let mediaRecorder = null;
let recorderChunks = [];
let activeStream = null;
let currentVideoUrl = "";
let scriptedLines = [];
let lineIndex = 0;
let lineIntervalId = null;
let selectedVoice = null;
let mouthIntervalId = null;

const synthesis = window.speechSynthesis;
const SpeechSynthesisUtteranceConstructor = window.SpeechSynthesisUtterance;

function setStatus(message) {
  elements.statusText.textContent = `Status: ${message}`;
}

function setStageActive(isActive) {
  elements.stage.classList.toggle("is-live", isActive);
  if (elements.wave) {
    elements.wave.classList.toggle("active", isActive);
  }
  if (!isActive && elements.mouth) {
    elements.mouth.classList.remove("talking");
  }
}

function hideDownload() {
  elements.downloadLink.classList.add("hidden");
  elements.downloadLink.removeAttribute("href");
  elements.downloadLink.removeAttribute("download");
}

function clearVideoUrl() {
  if (currentVideoUrl) {
    URL.revokeObjectURL(currentVideoUrl);
    currentVideoUrl = "";
  }
}

function containsUrdu(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function detectLanguage(text) {
  if (elements.languageSelect.value !== "auto") {
    return elements.languageSelect.value;
  }
  return containsUrdu(text) ? "ur-PK" : "en-US";
}

function languageLabelFromCode(code) {
  if (code.startsWith("ur")) return "Urdu";
  if (code.startsWith("en")) return "English";
  return code;
}

function applyDirection(langCode) {
  const isUrdu = langCode.startsWith("ur");
  const direction = isUrdu ? "rtl" : "ltr";
  const textAlign = isUrdu ? "right" : "left";

  elements.currentLine.style.direction = direction;
  elements.currentLine.style.textAlign = textAlign;
}

function getScriptLines(script) {
  return script
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function updateTickerDisplay() {
  if (!scriptedLines.length) {
    elements.currentLine.textContent = "Your script line will appear here while reading...";
    return;
  }
  elements.currentLine.textContent = scriptedLines[lineIndex % scriptedLines.length];
  lineIndex += 1;
}

function startTicker(script) {
  scriptedLines = getScriptLines(script);
  lineIndex = 0;
  updateTickerDisplay();
  if (lineIntervalId) {
    clearInterval(lineIntervalId);
  }
  lineIntervalId = window.setInterval(updateTickerDisplay, 2200);
}

function stopTicker() {
  if (lineIntervalId) {
    clearInterval(lineIntervalId);
    lineIntervalId = null;
  }
  scriptedLines = [];
  lineIndex = 0;
  updateTickerDisplay();
}

function splitUtterances(script) {
  // Keep chunks short so line callbacks and pacing feel natural.
  const normalized = script
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/([.!?؟۔])/g, "$1|");

  const chunks = normalized
    .split("|")
    .map((piece) => piece.trim())
    .filter(Boolean);

  return chunks.length ? chunks : [script];
}

function getVoiceForLanguage(langCode) {
  const selectedVoiceName = elements.voiceSelect.value;
  if (selectedVoiceName) {
    const exact = voices.find((voice) => voice.name === selectedVoiceName);
    if (exact) return exact;
  }
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith(langCode.toLowerCase())) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(langCode.slice(0, 2).toLowerCase())) ||
    null
  );
}

function populateVoices() {
  voices = synthesis.getVoices().sort((a, b) => a.name.localeCompare(b.name));
  const currentSelection = elements.voiceSelect.value;
  elements.voiceSelect.innerHTML = '<option value="">Default voice</option>';

  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    elements.voiceSelect.appendChild(option);
  });

  if (currentSelection && voices.some((voice) => voice.name === currentSelection)) {
    elements.voiceSelect.value = currentSelection;
  }
}

function stopAllSpeech() {
  synthesis.cancel();
  speaking = false;
}

function startMouthAnimation() {
  if (!elements.mouth) return;
  if (mouthIntervalId) {
    clearInterval(mouthIntervalId);
  }
  mouthIntervalId = window.setInterval(() => {
    elements.mouth.classList.toggle("talking");
  }, 140);
}

function stopMouthAnimation() {
  if (mouthIntervalId) {
    clearInterval(mouthIntervalId);
    mouthIntervalId = null;
  }
  if (elements.mouth) {
    elements.mouth.classList.remove("talking");
  }
}

function stopRecordingStream() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }
}

function stopSession() {
  stopAllSpeech();
  stopMouthAnimation();
  stopTicker();
  setStageActive(false);
  if (!recording) {
    setStatus("Stopped.");
  }
  if (recording) {
    stopRecordingStream();
  }
  recording = false;
}

function buildUtterance(text, langCode, onEnd) {
  const utterance = new SpeechSynthesisUtteranceConstructor(text);
  utterance.lang = langCode;
  utterance.rate = Number(elements.rateRange.value);
  utterance.pitch = Number(elements.pitchRange.value);
  utterance.voice = selectedVoice;
  utterance.onend = onEnd;
  utterance.onerror = () => {
    setStatus("Speech failed for one segment. Continuing...");
    onEnd();
  };
  return utterance;
}

function speakScript(script, langCode) {
  return new Promise((resolve) => {
    const queue = splitUtterances(script);
    let idx = 0;
    speaking = true;

    const sayNext = () => {
      if (!speaking || idx >= queue.length) {
        speaking = false;
        stopMouthAnimation();
        resolve();
        return;
      }
      startMouthAnimation();
      const utterance = buildUtterance(queue[idx], langCode, () => {
        idx += 1;
        sayNext();
      });
      synthesis.speak(utterance);
    };

    sayNext();
  });
}

async function startPreview() {
  const script = elements.newsScript.value.trim();
  if (!script) {
    setStatus("Please enter a news script first.");
    return;
  }
  if (!("speechSynthesis" in window) || !SpeechSynthesisUtteranceConstructor) {
    setStatus("This browser does not support text-to-speech.");
    return;
  }

  stopSession();
  hideDownload();

  const langCode = detectLanguage(script);
  selectedVoice = getVoiceForLanguage(langCode);
  applyDirection(langCode);
  elements.languageIndicator.textContent = `Language: ${languageLabelFromCode(langCode)}`;
  setStageActive(true);
  startTicker(script);
  setStatus("Previewing anchor voice...");

  await speakScript(script, langCode);
  stopTicker();
  setStageActive(false);
  setStatus("Preview finished.");
}

function getSupportedMimeType() {
  const options = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
  ];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

async function captureAndRecord() {
  const script = elements.newsScript.value.trim();
  if (!script) {
    setStatus("Please enter a news script first.");
    return;
  }
  if (!("speechSynthesis" in window) || !SpeechSynthesisUtteranceConstructor) {
    setStatus("This browser does not support text-to-speech.");
    return;
  }
  if (!navigator.mediaDevices?.getDisplayMedia) {
    setStatus("Screen capture is not supported in this browser.");
    return;
  }

  hideDownload();
  clearVideoUrl();
  stopSession();

  const langCode = detectLanguage(script);
  selectedVoice = getVoiceForLanguage(langCode);
  applyDirection(langCode);
  elements.languageIndicator.textContent = `Language: ${languageLabelFromCode(langCode)}`;

  try {
    setStatus("Waiting for screen-share permission...");
    activeStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "browser",
        frameRate: 30,
      },
      audio: true,
    });
  } catch (_error) {
    setStatus("Screen sharing cancelled.");
    return;
  }

  const mimeType = getSupportedMimeType();
  try {
    mediaRecorder = mimeType
      ? new MediaRecorder(activeStream, { mimeType })
      : new MediaRecorder(activeStream);
  } catch (_error) {
    setStatus("Could not start recorder in this browser.");
    stopRecordingStream();
    return;
  }

  recorderChunks = [];
  recording = true;
  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recorderChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blobType = mimeType || "video/webm";
    const blob = new Blob(recorderChunks, { type: blobType });
    currentVideoUrl = URL.createObjectURL(blob);
    const extension = blobType.includes("mp4") ? "mp4" : "webm";

    elements.downloadLink.href = currentVideoUrl;
    elements.downloadLink.download = `anchor-news-video-${Date.now()}.${extension}`;
    elements.downloadLink.classList.remove("hidden");

    setStatus("Video ready. Click download.");
    setStageActive(false);
    stopTicker();
    recording = false;
  };

  activeStream.getVideoTracks().forEach((track) => {
    track.onended = () => {
      if (recording) {
        stopSession();
        setStatus("Recording stopped because screen share ended.");
      }
    };
  });

  mediaRecorder.start();
  setStageActive(true);
  startTicker(script);
  setStatus("Recording anchor video...");

  await speakScript(script, langCode);

  if (recording) {
    stopRecordingStream();
  }
}

function setupEvents() {
  elements.rateRange.addEventListener("input", () => {
    elements.rateValue.textContent = Number(elements.rateRange.value).toFixed(1);
  });

  elements.pitchRange.addEventListener("input", () => {
    elements.pitchValue.textContent = Number(elements.pitchRange.value).toFixed(1);
  });

  elements.languageSelect.addEventListener("change", () => {
    const langCode = elements.languageSelect.value;
    const label = langCode === "auto" ? "Auto" : languageLabelFromCode(langCode);
    elements.languageIndicator.textContent = `Language: ${label}`;
  });

  elements.previewBtn.addEventListener("click", startPreview);
  elements.recordBtn.addEventListener("click", captureAndRecord);
  elements.stopBtn.addEventListener("click", () => {
    stopSession();
  });

  window.addEventListener("beforeunload", () => {
    stopSession();
    clearVideoUrl();
  });
}

function init() {
  setupEvents();
  populateVoices();
  if (synthesis.onvoiceschanged !== undefined) {
    synthesis.onvoiceschanged = populateVoices;
  }
}

init();
