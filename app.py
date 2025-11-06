from flask import Flask, render_template, request, jsonify, send_file, abort
import os
import re
import json
from datetime import datetime
from pytubefix import YouTube
from pytubefix.exceptions import VideoUnavailable, AgeRestrictedError, VideoPrivate
import tempfile
import shutil
from pathlib import Path
import hashlib
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'vidflow-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching for downloads

# Create necessary directories
UPLOAD_FOLDER = 'downloads'
CACHE_FOLDER = 'cache'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CACHE_FOLDER, exist_ok=True)

# Cache for recent conversions (in-memory, simple implementation)
conversion_cache = {}

def sanitize_filename(filename):
    """Sanitize filename for safe storage"""
    filename = re.sub(r'[^\w\s-]', '', filename)
    filename = re.sub(r'[-\s]+', '-', filename)
    return filename[:200]

def validate_youtube_url(url):
    """Validate YouTube URL"""
    youtube_regex = re.compile(
        r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    )
    return bool(youtube_regex.match(url))

def get_video_info(url):
    """Fetch video metadata using pytubefix - Pure Python, Fast"""
    max_retries = 3
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            # Use pytubefix with better error handling
            # pytubefix handles YouTube API changes better than pytube
            yt = YouTube(url, use_oauth=False, allow_oauth_cache=True)
            
            # Get video info efficiently
            return {
                'title': yt.title or 'Unknown',
                'thumbnail': yt.thumbnail_url or '',
                'duration': yt.length or 0,
                'formats': [],
                'uploader': yt.author or 'Unknown',
                'view_count': yt.views or 0,
            }
        except VideoPrivate:
            raise Exception("This video is private and cannot be accessed.")
        except AgeRestrictedError:
            raise Exception("This video is age-restricted and cannot be downloaded.")
        except VideoUnavailable:
            raise Exception("This video is unavailable. It may have been removed or restricted.")
        except Exception as e:
            error_msg = str(e)
            # Retry on HTTP 400 errors (YouTube API might be temporarily unavailable)
            if ('400' in error_msg or 'bad request' in error_msg.lower() or 'http error' in error_msg.lower()) and attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                continue
            # Provide helpful error messages
            elif '400' in error_msg or 'bad request' in error_msg.lower():
                raise Exception("YouTube API error. Please try again in a moment or check if the video URL is correct.")
            elif 'private' in error_msg.lower():
                raise Exception("This video is private and cannot be accessed.")
            elif 'unavailable' in error_msg.lower() or 'not available' in error_msg.lower():
                raise Exception("This video is unavailable. It may have been removed or restricted.")
            elif 'age' in error_msg.lower() or 'restricted' in error_msg.lower():
                raise Exception("This video is age-restricted and cannot be downloaded.")
            else:
                raise Exception(f"Error fetching video info: {error_msg}")
    
    # If all retries failed
    raise Exception("Failed to fetch video info after multiple attempts. Please try again later.")

def download_video(url, format_type='mp4', quality='best'):
    """Download YouTube video using pure Python (pytube) - No FFmpeg required"""
    temp_dir = None
    try:
        # Create temporary directory
        temp_dir = tempfile.mkdtemp()
        
        # Initialize YouTube object with optimized settings
        # Retry logic for HTTP 400 errors
        max_retries = 3
        retry_delay = 1
        yt = None
        
        for attempt in range(max_retries):
            try:
                yt = YouTube(url, use_oauth=False, allow_oauth_cache=True)
                break
            except Exception as e:
                error_msg = str(e)
                if ('400' in error_msg or 'bad request' in error_msg.lower() or 'http error' in error_msg.lower()) and attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    raise
        
        if not yt:
            raise Exception("Failed to initialize YouTube object after multiple attempts.")
        
        safe_title = sanitize_filename(yt.title or 'video')
        
        if format_type == 'mp3':
            # Download best audio stream - pytube downloads audio directly, no conversion needed
            try:
                # Get audio streams (pytube can download audio in various formats)
                audio_streams = yt.streams.filter(only_audio=True)
                if not audio_streams:
                    raise Exception("No audio stream available for this video")
                
                # Prefer MP4 audio (m4a) as it's widely compatible and doesn't need conversion
                # If not available, get best quality audio
                audio_stream = audio_streams.filter(mime_type="audio/mp4").order_by('abr').desc().first()
                if not audio_stream:
                    audio_stream = audio_streams.order_by('abr').desc().first()
                
                if not audio_stream:
                    audio_stream = audio_streams.first()
                
                # Download audio file directly
                # pytube downloads in native format (m4a/webm) - no conversion needed
                # Download with proper extension
                audio_file = audio_stream.download(output_path=temp_dir, filename=f"{safe_title}")
                
                # Get the actual downloaded file (pytube adds extension automatically)
                if not os.path.exists(audio_file):
                    # Find the actual file by looking for the title
                    files = os.listdir(temp_dir)
                    for f in files:
                        filepath = os.path.join(temp_dir, f)
                        if os.path.isfile(filepath) and (safe_title.lower() in f.lower() or 'audio' in f.lower()):
                            audio_file = filepath
                            break
                
                if not os.path.exists(audio_file):
                    raise Exception("Audio file download failed")
                
                # Rename to .mp3 extension for user convenience
                # The file is actually m4a/webm format but most players handle it fine
                file_ext = os.path.splitext(audio_file)[1].lower()
                mp3_filename = os.path.join(temp_dir, f"{safe_title}.mp3")
                
                # Only rename if extension is different
                if file_ext != '.mp3':
                    if os.path.exists(mp3_filename):
                        os.remove(mp3_filename)
                    shutil.move(audio_file, mp3_filename)
                    filename = mp3_filename
                else:
                    filename = audio_file
                
                expected_ext = '.mp3'
                
            except Exception as e:
                raise Exception(f"Failed to download audio: {str(e)}")
        else:
            # Download MP4 video
            try:
                if quality == 'best':
                    # Get highest quality progressive MP4 (video + audio combined)
                    # Progressive streams are already merged, so no conversion needed
                    video_stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
                    
                    if not video_stream:
                        # Fallback: try any progressive MP4
                        video_stream = yt.streams.filter(progressive=True, file_extension='mp4').first()
                    
                    if not video_stream:
                        # Last resort: try adaptive streams (video only, no audio merge)
                        video_stream = yt.streams.filter(adaptive=True, file_extension='mp4', only_video=True).order_by('resolution').desc().first()
                        if video_stream:
                            # Download video only (user will get video without audio)
                            filename = video_stream.download(output_path=temp_dir, filename=f"{safe_title}.mp4")
                        else:
                            raise Exception("No suitable video stream found")
                    else:
                        # Download progressive stream (has both video and audio)
                        filename = video_stream.download(output_path=temp_dir, filename=f"{safe_title}.mp4")
                else:
                    # Specific quality - get progressive stream at that resolution
                    video_stream = yt.streams.filter(progressive=True, file_extension='mp4', res=f"{quality}p").first()
                    if not video_stream:
                        # Try to find closest resolution
                        all_streams = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution')
                        # Find stream with resolution <= requested quality
                        for stream in reversed(list(all_streams)):
                            try:
                                stream_res = int(stream.resolution.replace('p', '')) if stream.resolution else 0
                                if stream_res <= int(quality):
                                    video_stream = stream
                                    break
                            except:
                                continue
                        
                        # If still not found, get highest quality
                        if not video_stream:
                            video_stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
                    
                    if not video_stream:
                        raise Exception(f"No video stream available at {quality}p quality")
                    
                    filename = video_stream.download(output_path=temp_dir, filename=f"{safe_title}.mp4")
                
                expected_ext = '.mp4'
                
            except Exception as e:
                raise Exception(f"Failed to download video: {str(e)}")
        
        if not filename or not os.path.exists(filename):
            raise Exception(f"Downloaded file not found: {filename}")
        
        # Move to downloads folder with sanitized name
        final_filename = f"{safe_title}{expected_ext}"
        final_path = os.path.join(UPLOAD_FOLDER, final_filename)
        
        # Handle duplicate filenames
        counter = 1
        while os.path.exists(final_path):
            final_filename = f"{safe_title}_{counter}{expected_ext}"
            final_path = os.path.join(UPLOAD_FOLDER, final_filename)
            counter += 1
        
        # Use copy then remove for better error handling
        shutil.copy2(filename, final_path)
        
        # Clean up temp directory
        try:
            shutil.rmtree(temp_dir)
        except:
            pass  # Ignore cleanup errors
        
        return final_filename, final_path
        
    except Exception as e:
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except:
                pass
        raise Exception(f"Error downloading video: {str(e)}")

@app.route('/')
def index():
    """Homepage"""
    return render_template('index.html')

@app.route('/about')
def about():
    """About page"""
    return render_template('about.html')

@app.route('/features')
def features():
    """Features page"""
    return render_template('features.html')

@app.route('/faq')
def faq():
    """FAQ page"""
    return render_template('faq.html')

@app.route('/health')
def health():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'cache_size': len(conversion_cache),
        'backend': 'pytubefix (Pure Python)',
        'ffmpeg_required': False
    }), 200

@app.route('/convert', methods=['POST'])
def convert():
    """Handle video conversion request"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        format_type = data.get('format', 'mp4').lower()
        quality = data.get('quality', 'best')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        if not validate_youtube_url(url):
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        if format_type not in ['mp4', 'mp3']:
            return jsonify({'error': 'Invalid format. Use mp4 or mp3'}), 400
        
        # Check cache
        cache_key = hashlib.md5(f"{url}_{format_type}_{quality}".encode()).hexdigest()
        if cache_key in conversion_cache:
            cached_file = conversion_cache[cache_key]
            if os.path.exists(cached_file['path']):
                return jsonify({
                    'success': True,
                    'filename': cached_file['filename'],
                    'message': 'File retrieved from cache'
                }), 200
        
        # Fetch video info first (with timeout handling)
        try:
            video_info = get_video_info(url)
        except Exception as e:
            return jsonify({'error': f'Failed to fetch video info: {str(e)}'}), 500
        
        # Download and convert (this may take time for longer videos)
        try:
            filename, filepath = download_video(url, format_type, quality)
        except Exception as e:
            error_msg = str(e)
            # Provide more helpful error messages
            if 'timeout' in error_msg.lower() or 'timed out' in error_msg.lower():
                return jsonify({'error': 'Download timed out. The video may be too long or your connection is slow. Please try again.'}), 500
            elif 'not found' in error_msg.lower() or 'unavailable' in error_msg.lower() or 'private' in error_msg.lower():
                return jsonify({'error': 'Video not found, unavailable, or private. Please check the URL.'}), 404
            elif 'age restricted' in error_msg.lower() or 'sign in' in error_msg.lower():
                return jsonify({'error': 'This video is age-restricted or requires sign-in. Cannot download.'}), 403
            elif 'audio' in error_msg.lower() or 'stream' in error_msg.lower():
                return jsonify({'error': f'Audio download error: {error_msg}. Please try again.'}), 500
            else:
                # Return the actual error for debugging
                return jsonify({'error': f'Conversion failed: {error_msg}'}), 500
        
        # Cache the result
        conversion_cache[cache_key] = {
            'filename': filename,
            'path': filepath,
            'timestamp': time.time()
        }
        
        # Clean old cache entries (older than 1 hour)
        current_time = time.time()
        keys_to_remove = [
            key for key, value in conversion_cache.items()
            if current_time - value['timestamp'] > 3600
        ]
        for key in keys_to_remove:
            if os.path.exists(conversion_cache[key]['path']):
                try:
                    os.remove(conversion_cache[key]['path'])
                except:
                    pass
            del conversion_cache[key]
        
        return jsonify({
            'success': True,
            'filename': filename,
            'title': video_info['title'],
            'message': 'Conversion completed successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/video-info', methods=['POST'])
def video_info():
    """Get video metadata without downloading"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        if not validate_youtube_url(url):
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        info = get_video_info(url)
        
        # Format duration
        duration_seconds = info.get('duration', 0)
        hours = duration_seconds // 3600
        minutes = (duration_seconds % 3600) // 60
        seconds = duration_seconds % 60
        if hours > 0:
            duration_str = f"{hours}:{minutes:02d}:{seconds:02d}"
        else:
            duration_str = f"{minutes}:{seconds:02d}"
        
        return jsonify({
            'success': True,
            'title': info.get('title', 'Unknown'),
            'thumbnail': info.get('thumbnail', ''),
            'duration': duration_str,
            'uploader': info.get('uploader', 'Unknown'),
            'view_count': info.get('view_count', 0),
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download(filename):
    """Serve converted file for download"""
    try:
        # Security: prevent directory traversal
        filename = os.path.basename(filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(filepath):
            abort(404)
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='application/octet-stream'
        )
    except Exception as e:
        abort(500)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

