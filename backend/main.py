from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import os

# --- 🚀 NEW RUNTIME INJECTION: Hooks Deno into your cloud system paths ---
deno_path = os.path.expanduser("~/.deno/bin")
if deno_path not in os.environ["PATH"]:
    os.environ["PATH"] = f"{deno_path}:{os.environ['PATH']}"
# ------------------------------------------------------------------------

app = FastAPI(title="YT Downloader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoRequest(BaseModel):
    url: str

def create_cookie_file():
    """Generates a native Netscape cookie file on the server's local storage dynamically."""
    raw_cookies = os.getenv("YT_COOKIES")
    if raw_cookies:
        cookie_path = "cookies.txt"
        with open(cookie_path, "w", encoding="utf-8") as f:
            f.write(raw_cookies)
        return cookie_path
    return None

@app.post("/api/info")
async def get_video_info(request: VideoRequest):
    cookie_file = create_cookie_file()
    
    ydl_opts = {
        "quiet": True, 
        "no_warnings": True,
        "cookiefile": cookie_file
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    host_url = os.getenv("LIVE_BACKEND_URL", "https://yt-downloader-backend-gr6h.onrender.com")
    local_download_url = f"{host_url}/api/download?url={request.url}"

    return {
        "title": info.get("title", "YouTube Video"),
        "thumbnail": info.get("thumbnail"),
        "url": local_download_url,
        "duration": info.get("duration"),
        "view_count": info.get("view_count")
    }

def remove_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass

@app.get("/api/download")
async def download_video(url: str, quality: str, background_tasks: BackgroundTasks):
    os.makedirs("downloads", exist_ok=True)
    height = quality if quality in ["1080", "720", "480", "360"] else "720"
    
    cookie_file = create_cookie_file()

    ydl_opts = {
        "format": f"bestvideo[height<={height}]+bestaudio/best[height<={height}]",
        "outtmpl": "downloads/%(title)s.%(ext)s",
        "merge_output_format": "mp4",
        "restrictfilenames": True,
        "quiet": True,
        "no_warnings": True,
        "cookiefile": cookie_file
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            if not os.path.exists(filename):
                base, _ = os.path.splitext(filename)
                if os.path.exists(base + ".mp4"):
                    filename = base + ".mp4"

            if os.path.exists(filename):
                background_tasks.add_task(remove_file, filename)
                return FileResponse(
                    path=filename,
                    filename=os.path.basename(filename),
                    media_type="application/octet-stream"
                )
            else:
                raise HTTPException(status_code=500, detail="Processing failed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
