import React, { useState, useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import './EmojiPicker.css';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose, position }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
    onClose();
  };

  return (
    <div 
      ref={pickerRef}
      className="emoji-picker-container"
      style={position ? { top: position.top, left: position.left } : {}}
    >
      <Picker 
        data={data}
        onEmojiSelect={handleEmojiSelect}
        theme="dark"
        skinTonePosition="none"
        previewPosition="none"
        searchPosition="none"
        categories={['frequent', 'people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags']}
      />
    </div>
  );
};

export default EmojiPicker;