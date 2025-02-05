import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

let mediaRecorder;
let recordedChunks = [];
let videoStream;
let activeEffect = null;
let imageSegmenter;

// DOM Elements
const videoInput = document.getElementById('videoInput');
const outputCanvas = document.getElementById('outputCanvas');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const ctx = outputCanvas.getContext('2d');

// Check if device has camera
async function checkCameraAvailability() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (err) {
    console.error('Error checking camera availability:', err);
    return false;
  }
}

// Check supported MIME types
function getSupportedMimeType() {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
    'video/mp4'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return null;
}

// Initialize MediaPipe
async function initializeAI() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
        delegate: "GPU"
      },
      runningMode: "VIDEO"
    });
  } catch (err) {
    console.error('Error initializing AI:', err);
    showError('Failed to initialize AI features. Please try again later.');
  }
}

// Initialize video stream
async function initializeVideo() {
  try {
    // First check if media devices are supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Media devices not supported in this browser');
    }

    // Check if camera exists
    const hasCamera = await checkCameraAvailability();
    if (!hasCamera) {
      throw new Error('No camera found on this device');
    }

    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      throw new Error('MediaRecorder not supported in this browser');
    }

    // Check if we have a supported MIME type
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      throw new Error('No supported video codec found');
    }

    videoStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: 480, 
        height: 360,
        facingMode: 'user' // Prefer front camera if available
      },
      audio: true 
    });
    
    videoInput.srcObject = videoStream;
    videoInput.onloadedmetadata = () => {
      videoInput.play().catch(err => {
        console.error('Error playing video:', err);
        showError('Failed to start video stream. Please refresh the page.');
      });
    };
    
    // Set up canvas size
    outputCanvas.width = 480;
    outputCanvas.height = 360;
    
    // Enable start button once everything is ready
    startBtn.disabled = false;
    hideError();
  } catch (err) {
    console.error('Error accessing camera:', err);
    if (err.name === 'NotFoundError' || err.message.includes('No camera found')) {
      showError('No camera found. Please connect a camera and refresh the page. If you\'re using a laptop, make sure your built-in camera is not disabled.');
      disableVideoFeatures();
    } else if (err.name === 'NotAllowedError') {
      showError('Camera access denied. Please allow camera access in your browser settings and refresh the page.');
    } else if (err.message.includes('MediaRecorder') || err.message.includes('codec')) {
      showError('Your browser does not support video recording. Please try a different browser like Chrome or Firefox.');
    } else {
      showError('Failed to access camera. Please check your camera connection and refresh the page.');
    }
  }
}

// Disable video features when camera is not available
function disableVideoFeatures() {
  startBtn.disabled = true;
  stopBtn.disabled = true;
  downloadBtn.disabled = true;
  document.querySelectorAll('.effect-btn').forEach(btn => {
    btn.disabled = true;
  });
  
  // Show placeholder in video element
  const placeholderCtx = outputCanvas.getContext('2d');
  placeholderCtx.fillStyle = '#2d3748';
  placeholderCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
  placeholderCtx.fillStyle = '#ffffff';
  placeholderCtx.font = '16px system-ui';
  placeholderCtx.textAlign = 'center';
  placeholderCtx.fillText('Camera not available', outputCanvas.width / 2, outputCanvas.height / 2);
}

// Error handling
function showError(message) {
  let errorContainer = document.querySelector('.error-message');
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    document.querySelector('.video-container').insertBefore(errorContainer, videoInput);
  }
  errorContainer.textContent = message;
  errorContainer.style.display = 'block';
}

function hideError() {
  const errorContainer = document.querySelector('.error-message');
  if (errorContainer) {
    errorContainer.style.display = 'none';
  }
}

// Start recording
function startRecording() {
  try {
    recordedChunks = [];
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      throw new Error('No supported video codec found');
    }

    const options = { mimeType };
    mediaRecorder = new MediaRecorder(videoStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      showError('An error occurred while recording. Please try again.');
      stopRecording();
    };

    mediaRecorder.onstop = () => {
      downloadBtn.disabled = false;
    };

    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (err) {
    console.error('Error starting recording:', err);
    showError('Failed to start recording. Please try a different browser.');
  }
}

// Stop recording
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// Download recorded video
function downloadVideo() {
  try {
    const mimeType = getSupportedMimeType();
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = 'ai-video' + (mimeType.includes('mp4') ? '.mp4' : '.webm');
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error downloading video:', err);
    showError('Failed to download the video. Please try again.');
  }
}

// Apply AI effects
async function applyEffect(frame) {
  if (!activeEffect || !imageSegmenter) return frame;

  try {
    switch (activeEffect) {
      case 'background':
        const result = imageSegmenter.segmentForVideo(frame, performance.now());
        const mask = result.confidenceMasks[0];
        
        // Apply background removal effect
        const imageData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        for (let i = 0; i < mask.length; i++) {
          const pixelIndex = i * 4;
          if (mask[i] < 0.5) {
            imageData.data[pixelIndex + 3] = 0; // Make background transparent
          }
        }
        return imageData;

      case 'face':
        // Implement face effects here
        return frame;

      case 'pose':
        // Implement pose detection here
        return frame;

      default:
        return frame;
    }
  } catch (err) {
    console.error('Error applying effect:', err);
    return frame;
  }
}

// Main render loop
function render() {
  try {
    if (videoStream && videoInput.readyState === videoInput.HAVE_ENOUGH_DATA) {
      ctx.drawImage(videoInput, 0, 0, outputCanvas.width, outputCanvas.height);
      if (activeEffect) {
        applyEffect(videoInput);
      }
    }
    requestAnimationFrame(render);
  } catch (err) {
    console.error('Error in render loop:', err);
  }
}

// Event Listeners
startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
downloadBtn.addEventListener('click', downloadVideo);

document.querySelectorAll('.effect-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeEffect = btn.dataset.effect;
  });
});

// Initialize
async function init() {
  await initializeAI();
  await initializeVideo();
  render();
}

init();