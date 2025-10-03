
import React from 'react';

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => (
  <div className="w-full max-w-lg mx-auto mt-6">
    <video
      controls
      src={src}
      className="rounded-lg shadow-2xl w-full border-2 border-gray-700"
      aria-label="Uploaded video preview"
    >
      Your browser does not support the video tag.
    </video>
  </div>
);

export default VideoPlayer;
