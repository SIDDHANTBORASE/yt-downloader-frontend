import { useState } from 'react';
import { Download, Youtube, AlertCircle, Film, Eye, Clock } from 'lucide-react';

interface VideoInfo {
  title: string;
  thumbnail: string;
  url: string;
  duration?: number;
  view_count?: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState('720'); 

  const isValidYouTubeUrl = (input: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return pattern.test(input);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setVideo(null);

    // Dynamic URL: Uses Netlify config variable or falls back to localhost
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${API_BASE_URL}/api/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to fetch video information');
      }

      setVideo(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-red-500/30">
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <Youtube className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              YT Downloader
            </h1>
            <p className="text-xs text-gray-500 tracking-wide font-medium mt-0.5">HIGH-SPEED STREAM CONVERTER</p>
          </div>
        </div>

        {/* Main Panel */}
        <div className="w-full bg-zinc-950/40 backdrop-blur-xl border border-zinc-900 rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your YouTube video link here..."
                disabled={loading}
                className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl pl-4 pr-12 py-4 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600">
                <Film className="w-5 h-5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim() || !isValidYouTubeUrl(url)}
              className="w-full py-4 rounded-2xl bg-white hover:bg-gray-100 text-black font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner />
                  Processing Stream...
                </>
              ) : (
                'Generate Download Link'
              )}
            </button>
          </form>

          {/* Error Box */}
          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-red-400">Extraction Failed</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Video Preview Card */}
          {video && (
            <div className="mt-8 pt-8 border-t border-zinc-900/80 space-y-6">
              <div className="flex gap-4">
                <div className="relative w-40 shrink-0 aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800/50">
                  <img src={video.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                  {video.duration && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-gray-300 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-200 line-clamp-2">
                    {video.title}
                  </h3>
                  {video.view_count && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{formatViews(video.view_count)} views</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quality Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Target Resolution
                </label>
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800/80 text-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 cursor-pointer"
                >
                  <option value="1080">1080p (Full HD - Processing Needed)</option>
                  <option value="720">720p (Standard HD - Blazing Fast)</option>
                  <option value="480">480p (Standard Definition)</option>
                  <option value="360">360p (Low Quality - Saving Data)</option>
                </select>
              </div>

              <div className="pt-2">
                <a
                  href={`${video.url}&quality=${selectedQuality}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg tracking-wide transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download MP4
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin text-black" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}