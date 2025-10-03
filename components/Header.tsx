
import React from 'react';

const Header: React.FC = () => (
  <header className="text-center p-4 md:p-6 border-b border-gray-700">
    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
      Video Prompt Reverser
    </h1>
    <p className="mt-2 text-lg text-gray-400">
      Let Gemini craft the perfect prompt from your video clip.
    </p>
  </header>
);

export default Header;
