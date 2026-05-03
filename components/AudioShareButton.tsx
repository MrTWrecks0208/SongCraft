import React, { useState, useRef, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface AudioShareButtonProps {
  audioData: string;
  fileName: string;
}

export const AudioShareButton: React.FC<AudioShareButtonProps> = ({ audioData, fileName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNativeShare = async () => {
    setIsOpen(false);
    
    // Determine if web share is available
    if (!navigator.share) {
      alert("Sharing is not supported on this browser/device.");
      return;
    }

    setIsProcessing(true);
    try {
      // We need a File object to share natively
      let fileToShare: File;
      
      const response = await fetch(audioData);
      const blob = await response.blob();
      
      let mimeType = blob.type || 'audio/wav';
      let extension = 'wav';
      if (mimeType.includes('mp3')) extension = 'mp3';
      else if (mimeType.includes('webm')) extension = 'webm';
      else if (mimeType.includes('m4a') || mimeType.includes('aac')) extension = 'm4a';

      const safeName = `${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
      fileToShare = new File([blob], safeName, { type: mimeType });

      if (navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        await navigator.share({
          title: fileName,
          text: 'Check out my new song created with GhostWriter!',
          files: [fileToShare]
        });
      } else {
        // Fallback for sharing just text + url if it's a public link
        if (audioData.startsWith('http')) {
          await navigator.share({
            title: fileName,
            text: 'Check out my new song created with GhostWriter!',
            url: audioData
          });
        } else {
          alert("Your device doesn't support sharing this file directly.");
        }
      }
    } catch (error: any) {
      // AbortError is common if user cancels the share dialog, ignore it
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    setIsOpen(false);
    
    // We can only use URL-based intents if the audio is a public remote URL
    const isPublicUrl = audioData.startsWith('http') && !audioData.includes('localhost');
    const shareUrl = isPublicUrl ? encodeURIComponent(audioData) : encodeURIComponent('https://songweaver.app');
    const shareText = encodeURIComponent(`Listen to my new song "${fileName}" created on GhostWriter! 🎶`);

    let intentUrl = '';
    
    switch (platform) {
      case 'twitter':
        intentUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
        break;
      case 'facebook':
        intentUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case 'whatsapp':
        intentUrl = `https://api.whatsapp.com/send?text=${shareText} ${shareUrl}`;
        break;
    }

    if (intentUrl) {
      window.open(intentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isProcessing}
        className={`p-2 transition-colors flex items-center gap-1 ${isProcessing ? 'text-gray-500' : 'text-gray-400 hover:text-sky-400'}`}
        title="Share to Social Media"
      >
        <Share2 className={`w-5 h-5 ${isProcessing ? 'animate-pulse' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[#1d2951] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden transform-gpu origin-top-right">
          <div className="py-2 flex flex-col">
            <span className="px-4 py-1 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Share via</span>
            
            <button
              onClick={handleNativeShare}
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              Device Default (Apps)
            </button>
            <button
              onClick={() => handleSocialShare('twitter')}
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#1DA1F2] hover:text-white transition-colors"
            >
              X (Twitter)
            </button>
            <button
              onClick={() => handleSocialShare('facebook')}
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#4267B2] hover:text-white transition-colors"
            >
              Facebook
            </button>
            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#25D366] hover:text-white transition-colors"
            >
              WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
