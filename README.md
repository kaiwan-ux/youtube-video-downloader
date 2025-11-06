# VidFlow - YouTube to MP4 Converter

A modern, futuristic 3D-styled YouTube to MP4/MP3 converter built with Python Flask, Tailwind CSS, and JavaScript. Features glassmorphism design, neon glow effects, and immersive 3D visuals.

## Features

- 🎬 **High-Quality Conversion** - Convert YouTube videos to MP4 or MP3 formats
- ⚡ **Lightning Fast** - Optimized processing for quick conversions
- 🎨 **3D Visuals** - Stunning glassmorphism UI with neon glow effects
- 📱 **Responsive Design** - Works seamlessly across all devices
- 🌓 **Dark/Light Mode** - Toggle between themes
- 🔒 **Secure** - Privacy-focused with secure processing
- 🚫 **Ad-Free** - No ads or interruptions

## Technology Stack

### Backend
- Python Flask
- pytubefix (Pure Python YouTube downloader - No FFmpeg required!)
- Gunicorn (Production server)

### Frontend
- HTML5
- Tailwind CSS
- JavaScript (ES6+)
- GSAP (Animations)
- Three.js (3D effects)
- SweetAlert2 (Modals)

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

**Note:** VidFlow uses pure Python libraries (pytube) - no FFmpeg or external dependencies required! Both MP4 and MP3 downloads work out of the box.

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd proj
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Deployment

### Render.com

1. Connect your repository to Render
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `gunicorn app:app`
4. Add environment variables if needed
5. Deploy!

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Configure serverless functions if needed

### AWS / Gunicorn + Nginx

1. Install Gunicorn: `pip install gunicorn`
2. Run with Gunicorn: `gunicorn app:app --bind 0.0.0.0:8000`
3. Configure Nginx as reverse proxy (see `nginx.conf.example`)

### Docker (Optional)

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000"]
```

## Project Structure

```
proj/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── Procfile              # Process file for deployment
├── .gitignore            # Git ignore file
├── templates/            # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── features.html
│   ├── faq.html
│   └── about.html
├── static/               # Static assets
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   ├── converter.js
│   │   └── faq.js
│   └── images/
└── downloads/            # Converted files (created at runtime)
```

## API Endpoints

- `GET /` - Homepage
- `GET /features` - Features page
- `GET /faq` - FAQ page
- `GET /about` - About page
- `GET /health` - Health check endpoint
- `POST /convert` - Convert YouTube video
- `POST /video-info` - Get video metadata
- `GET /download/<filename>` - Download converted file

## Usage

1. Visit the homepage
2. Paste a YouTube URL
3. Select format (MP4 or MP3)
4. Choose quality (for MP4)
5. Click "Convert"
6. Download your file when ready

## Configuration

### Environment Variables

- `PORT` - Server port (default: 5000)
- `SECRET_KEY` - Flask secret key for sessions

### File Limits

- Maximum file size: 16MB (configurable in `app.py`)
- Cache duration: 1 hour (configurable in `app.py`)

## Security

- URL validation and sanitization
- Secure file handling
- Automatic cleanup of old files
- No storage of personal information

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on the repository.

---

Built with ❤️ using Flask, Tailwind CSS, and modern web technologies.

