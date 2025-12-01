import React, { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../services/storage';

export default function AutoModeSettings({ visible }) {
  const [timeMultiplier, setTimeMultiplier] = useState(1.0);
  const [speechRate, setSpeechRate] = useState(1.0);

  useEffect(() => {
    const savedTime = loadFromStorage('slowkaTimeMultiplier');
    if (savedTime) setTimeMultiplier(parseFloat(savedTime));

    const savedRate = loadFromStorage('slowkaSpeechRate');
    if (savedRate) setSpeechRate(parseFloat(savedRate));
  }, []);

  const handleTimeChange = (e) => {
    const val = e.target.value;
    setTimeMultiplier(val);
    saveToStorage('slowkaTimeMultiplier', val);
  };

  const handleRateChange = (e) => {
    const val = e.target.value;
    setSpeechRate(val);
    saveToStorage('slowkaSpeechRate', val);
  };

  if (!visible) return null;

  return (
    <div className="auto-mode-settings-panel">
      <label htmlFor="time-multiplier-slider">
        Długość czasu na odpowiedź: <span id="time-multiplier-value">x{parseFloat(timeMultiplier).toFixed(1)}</span>
      </label>
      <input
        type="range"
        id="time-multiplier-slider"
        min="0.5"
        max="2.0"
        step="0.1"
        value={timeMultiplier}
        onChange={handleTimeChange}
      />

      <div style={{ height: '8px' }}></div>

      <label htmlFor="speech-rate-slider">
        Prędkość czytania: <span id="speech-rate-value">{parseFloat(speechRate).toFixed(1)}</span>
      </label>
      <input
        type="range"
        id="speech-rate-slider"
        min="0.5"
        max="2.0"
        step="0.1"
        value={speechRate}
        onChange={handleRateChange}
      />
    </div>
  );
}
