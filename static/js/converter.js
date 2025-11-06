// URL Validation
function validateYouTubeURL(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&=%\?]{11})/;
    return youtubeRegex.test(url);
}

// Format selection handler
document.addEventListener('DOMContentLoaded', () => {
    const formatRadios = document.querySelectorAll('input[name="format"]');
    const qualitySelector = document.getElementById('quality-selector');
    
    formatRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'mp3') {
                qualitySelector.style.display = 'none';
            } else {
                qualitySelector.style.display = 'block';
            }
        });
    });
    
    // Convert button handler
    const convertBtn = document.getElementById('convert-btn');
    const urlInput = document.getElementById('youtube-url');
    const videoInfoDiv = document.getElementById('video-info');
    const progressContainer = document.getElementById('progress-container');
    
    convertBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        const format = document.querySelector('input[name="format"]:checked').value;
        const quality = document.getElementById('quality').value;
        
        // Validate URL
        if (!url) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please enter a YouTube URL',
                background: 'rgba(17, 24, 39, 0.9)',
                color: '#fff',
                confirmButtonColor: '#b026ff'
            });
            return;
        }
        
        if (!validateYouTubeURL(url)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid URL',
                text: 'Please enter a valid YouTube URL',
                background: 'rgba(17, 24, 39, 0.9)',
                color: '#fff',
                confirmButtonColor: '#b026ff'
            });
            return;
        }
        
        // Hide video info, show progress
        videoInfoDiv.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        
        // Disable convert button during processing
        convertBtn.disabled = true;
        convertBtn.style.opacity = '0.6';
        convertBtn.style.cursor = 'not-allowed';
        
        // Animate progress bar - more realistic progress with longer timeout support
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        let progress = 5; // Start at 5%
        let lastProgressUpdate = Date.now();
        const progressInterval = setInterval(() => {
            // Slower progress increase for longer videos
            const timeSinceLastUpdate = Date.now() - lastProgressUpdate;
            // Progress slower for longer waits (still processing)
            if (timeSinceLastUpdate > 30000) { // If waiting more than 30 seconds
                progress += Math.random() * 2 + 0.5; // Very slow progress
            } else {
                progress += Math.random() * 6 + 2; // Normal progress
            }
            if (progress > 92) progress = 92; // Keep at 92% until actual completion
            if (progressBar) progressBar.style.width = progress + '%';
            lastProgressUpdate = Date.now();
        }, 500);
        
        // Update progress text with more informative messages
        let progressMessages = [
            'Fetching video information...',
            'Analyzing video format...',
            'Downloading video data...',
            'Processing video stream...',
            'Converting format...',
            'Optimizing file...',
            'Finalizing download...',
            'Almost done...'
        ];
        let messageIndex = 0;
        let messageInterval = null;
        let startTime = Date.now();
        if (progressText) {
            messageInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                let message = progressMessages[messageIndex % progressMessages.length];
                if (elapsed > 60) {
                    message += ` (${Math.floor(elapsed / 60)}m ${elapsed % 60}s)`;
                } else if (elapsed > 10) {
                    message += ` (${elapsed}s)`;
                }
                progressText.textContent = message;
                messageIndex++;
            }, 3000); // Update every 3 seconds
        }
        
        let infoTimeout = null;
        let convertTimeout = null;
        
        try {
            // First, get video info (with timeout)
            const infoController = new AbortController();
            infoTimeout = setTimeout(() => infoController.abort(), 30000); // 30 second timeout
            
            const infoResponse = await fetch('/video-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url }),
                signal: infoController.signal
            });
            
            if (infoTimeout) clearTimeout(infoTimeout);
            const infoData = await infoResponse.json();
            
            if (infoData.success) {
                // Display video info
                document.getElementById('video-thumbnail').src = infoData.thumbnail;
                document.getElementById('video-title').textContent = infoData.title;
                document.getElementById('video-meta').textContent = 
                    `Uploader: ${infoData.uploader} | Duration: ${infoData.duration} | Views: ${infoData.view_count.toLocaleString()}`;
                videoInfoDiv.classList.remove('hidden');
            }
            
            // Start conversion (with extended timeout - but reasonable for normal videos)
            const convertController = new AbortController();
            // Calculate timeout based on video duration and format
            let timeoutDuration = 600000; // 10 minutes default
            if (infoData.success && infoData.duration) {
                // Parse duration (format: MM:SS or HH:MM:SS)
                const durationParts = infoData.duration.split(':').map(Number);
                let totalSeconds = 0;
                if (durationParts.length === 3) {
                    totalSeconds = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2];
                } else if (durationParts.length === 2) {
                    totalSeconds = durationParts[0] * 60 + durationParts[1];
                }
                // For MP3, allow more time for conversion (5x duration), for MP4 use 3x
                const multiplier = format === 'mp3' ? 5000 : 3000;
                // Allow multiplier * duration + 3 minutes buffer, minimum 3 minutes, maximum 30 minutes
                timeoutDuration = Math.min(Math.max(totalSeconds * multiplier + 180000, 180000), 1800000);
            } else {
                // If no duration info, use format-based default
                timeoutDuration = format === 'mp3' ? 900000 : 600000; // 15 min for MP3, 10 min for MP4
            }
            convertTimeout = setTimeout(() => convertController.abort(), timeoutDuration);
            
            const response = await fetch('/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    format: format,
                    quality: quality
                }),
                signal: convertController.signal
            });
            
            if (convertTimeout) clearTimeout(convertTimeout);
            if (infoTimeout) clearTimeout(infoTimeout);
            clearInterval(progressInterval);
            if (messageInterval) clearInterval(messageInterval);
            if (progressBar) progressBar.style.width = '100%';
            if (progressText) {
                progressText.textContent = 'Conversion complete!';
            }
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Success
                // Re-enable convert button
                convertBtn.disabled = false;
                convertBtn.style.opacity = '1';
                convertBtn.style.cursor = 'pointer';
                
                setTimeout(() => {
                    progressContainer.classList.add('hidden');
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Conversion Complete!',
                        text: 'Your video is ready for download',
                        background: 'rgba(17, 24, 39, 0.9)',
                        color: '#fff',
                        confirmButtonColor: '#b026ff',
                        showCancelButton: true,
                        confirmButtonText: 'Download',
                        cancelButtonText: 'Close'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = `/download/${data.filename}`;
                        }
                    });
                }, 500);
            } else {
                throw new Error(data.error || 'Conversion failed');
            }
        } catch (error) {
            if (infoTimeout) clearTimeout(infoTimeout);
            if (convertTimeout) clearTimeout(convertTimeout);
            clearInterval(progressInterval);
            if (messageInterval) clearInterval(messageInterval);
            progressContainer.classList.add('hidden');
            
            // Re-enable convert button
            convertBtn.disabled = false;
            convertBtn.style.opacity = '1';
            convertBtn.style.cursor = 'pointer';
            
            let errorMessage = 'An error occurred during conversion';
            if (error.name === 'AbortError') {
                errorMessage = 'Conversion timed out. This may happen with slow connections or very long videos. Please check your internet connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Conversion Failed',
                text: errorMessage,
                background: 'rgba(17, 24, 39, 0.9)',
                color: '#fff',
                confirmButtonColor: '#b026ff'
            });
        }
    });
    
    // Real-time URL validation
    urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url && validateYouTubeURL(url)) {
            urlInput.classList.add('border-green-500');
            urlInput.classList.remove('border-red-500');
        } else if (url) {
            urlInput.classList.add('border-red-500');
            urlInput.classList.remove('border-green-500');
        } else {
            urlInput.classList.remove('border-red-500', 'border-green-500');
        }
    });
    
    // Enter key to convert
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            convertBtn.click();
        }
    });
});

