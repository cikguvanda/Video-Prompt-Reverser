
import React, { useState, useCallback, useEffect } from 'react';
import { type AppState } from './types';
import { generatePromptFromFrames } from './services/geminiService';
import Header from './components/Header';
import Loader from './components/Loader';
import VideoPlayer from './components/VideoPlayer';
import PromptDisplay from './components/PromptDisplay';

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

async function extractFramesFromVideo(videoFile: File, frameCount: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return reject(new Error("Failed to get 2D context from canvas."));
    }

    const frames: string[] = [];
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.muted = true;
    let framesExtracted = 0;
    // FIX: Moved interval declaration to a higher scope to be accessible in both onloadedmetadata and onseeked callbacks.
    let interval = 0;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      interval = duration / (frameCount - 1);
      
      video.currentTime = 0;
    };
    
    video.onseeked = () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        if (frameDataUrl) {
            frames.push(frameDataUrl);
        }
        framesExtracted++;

        if (framesExtracted < frameCount) {
            video.currentTime += interval;
        } else {
            URL.revokeObjectURL(videoUrl);
            resolve(frames);
        }
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Error loading or processing video file."));
    };

    video.load();
  });
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup Object URL when component unmounts or videoSrc changes
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setVideoFile(null);
    setVideoSrc(null);
    setGeneratedPrompt(null);
    setErrorMessage(null);
    setAppState('validating');

    if (!file.type.startsWith('video/')) {
      setErrorMessage('Please upload a valid video file.');
      setAppState('error');
      return;
    }

    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    const tempUrl = URL.createObjectURL(file);
    videoElement.src = tempUrl;

    videoElement.onloadedmetadata = () => {
      URL.revokeObjectURL(tempUrl);
      if (videoElement.duration > 10.5) { // Add a small buffer
        setErrorMessage(`Video is too long (${videoElement.duration.toFixed(1)}s). Max 10 seconds allowed.`);
        setAppState('error');
      } else {
        setVideoFile(file);
        setVideoSrc(URL.createObjectURL(file));
        setAppState('ready');
      }
    };

    videoElement.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      setErrorMessage('Could not read video metadata. The file may be corrupt.');
      setAppState('error');
    };
  }, [videoSrc]);

  const handleGenerateClick = useCallback(async () => {
    if (!videoFile) {
      setErrorMessage("No video file selected.");
      setAppState('error');
      return;
    }

    setAppState('generating');
    setErrorMessage(null);
    setGeneratedPrompt(null);

    try {
      const frames = await extractFramesFromVideo(videoFile, 8); // Extract 8 frames
      const prompt = await generatePromptFromFrames(frames);
      setGeneratedPrompt(prompt);
      setAppState('success');
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred during generation.");
      setAppState('error');
    }
  }, [videoFile]);

  const renderContent = () => {
    switch (appState) {
      case 'validating':
        return <Loader message="Validating video..." />;
      case 'generating':
        return <Loader message="Analyzing video & crafting prompt..." />;
      case 'error':
        return <div className="text-center p-8 bg-red-900/30 border border-red-500 rounded-lg">
          <h3 className="text-xl font-bold text-red-400">Error</h3>
          <p className="mt-2 text-red-300">{errorMessage}</p>
        </div>;
      case 'ready':
      case 'success':
        return (
          <>
            {videoSrc && <VideoPlayer src={videoSrc} />}
            {appState === 'success' && generatedPrompt && <PromptDisplay prompt={generatedPrompt} />}
          </>
        );
      default:
        return (
            <div className="text-center text-gray-400">
                <p>Upload a video clip (max 10s) to begin.</p>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
          <label htmlFor="video-upload" className="w-full inline-flex justify-center items-center px-6 py-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 hover:border-purple-500 transition-colors">
            <UploadIcon className="w-8 h-8 mr-3 text-gray-400" />
            <span className="text-lg font-medium text-gray-300">
              {videoFile ? videoFile.name : 'Choose a video file...'}
            </span>
          </label>
          <input id="video-upload" type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
          <button
            onClick={handleGenerateClick}
            disabled={appState !== 'ready' && appState !== 'success'}
            className="w-full mt-4 px-6 py-3 text-lg font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-lg"
          >
            Generate Prompt
          </button>
        </div>
        <div className="w-full mt-8">
            {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Gemini</p>
      </footer>
    </div>
  );
};

export default App;
