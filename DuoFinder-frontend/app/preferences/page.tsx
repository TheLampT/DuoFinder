"use client";

import Link from "next/link";
import styles from "../../styles/pages/preferences.module.css";
import { useState, useEffect } from "react";

export default function Preferences() {
  const [notifications, setNotifications] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>("es");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [playStyle, setPlayStyle] = useState<string>("ambos");
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 40]);

  useEffect(() => {
    // Load saved preferences
    const savedNotifications = localStorage.getItem('notifications');
    const savedLanguage = localStorage.getItem('language');
    const savedPlayStyle = localStorage.getItem('playStyle');
    const savedAgeRange = localStorage.getItem('ageRange');
    
    if (savedNotifications) setNotifications(savedNotifications === 'true');
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedPlayStyle) setPlayStyle(savedPlayStyle);
    if (savedAgeRange) setAgeRange(JSON.parse(savedAgeRange));
    
    // Get current theme from document (avoids flash of wrong theme)
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setIsDarkMode(currentTheme === 'dark');
  }, []);

  // Add this useEffect to update CSS variables for the slider track
  useEffect(() => {
    document.documentElement.style.setProperty('--min', ageRange[0].toString());
    document.documentElement.style.setProperty('--max', ageRange[1].toString());
  }, [ageRange]);

  const handleThemeChange = (isDark: boolean): void => {
    setIsDarkMode(isDark);
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  const handleNotificationsChange = (enabled: boolean): void => {
    setNotifications(enabled);
    localStorage.setItem('notifications', enabled.toString());
  };

  const handleLanguageChange = (lang: string): void => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handlePlayStyleChange = (style: string): void => {
    setPlayStyle(style);
    localStorage.setItem('playStyle', style);
  };

  const handleAgeRangeChange = (min: number, max: number): void => {
    const newAgeRange: [number, number] = [min, max];
    setAgeRange(newAgeRange);
    localStorage.setItem('ageRange', JSON.stringify(newAgeRange));
  };

  return (
    <main className={styles.wrapper}>
      {/* NAVBAR */}
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <img src="/favicon.ico" alt="DuoFinder" className={styles.logo} />
          <span className={styles.brandText}>Preferencias</span>
        </div>
        <div style={{width: "100px"}}></div> {/* For spacing */}
      </nav>

      <div className={styles.container}>
        <div className={styles.preferencesCard}>
          <h2 className={styles.sectionTitle}>Apariencia</h2>
          
          <div className={styles.optionGroup}>
            <div className={styles.option}>
              <span className={styles.optionLabel}>Modo oscuro</span>
              <div className={styles.toggleSwitch}>
                <input 
                  type="checkbox" 
                  id="darkMode" 
                  className={styles.toggleInput}
                  checked={isDarkMode}
                  onChange={(e) => handleThemeChange(e.target.checked)}
                />
                <label htmlFor="darkMode" className={styles.toggleSlider}></label>
              </div>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Notificaciones</h2>
          
          <div className={styles.optionGroup}>
            <div className={styles.option}>
              <span className={styles.optionLabel}>Activar notificaciones</span>
              <div className={styles.toggleSwitch}>
                <input 
                  type="checkbox" 
                  id="notifications" 
                  className={styles.toggleInput}
                  checked={notifications}
                  onChange={(e) => handleNotificationsChange(e.target.checked)}
                />
                <label htmlFor="notifications" className={styles.toggleSlider}></label>
              </div>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Buscando</h2>

          <div className={styles.optionGroup}>
            <div className={styles.option}>
              <div className={styles.ageRangeContainer}>
                <span className={styles.optionLabel}>Rango de edad</span>
                <div className={styles.ageRangeValues}>
                  {ageRange[0]} - {ageRange[1]} años
                </div>
              </div>
              <div className={styles.ageSliderContainer}>
                <div className={styles.ageSlider}>
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={ageRange[0]}
                    onChange={(e) => handleAgeRangeChange(Number(e.target.value), ageRange[1])}
                    className={styles.slider}
                  />
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={ageRange[1]}
                    onChange={(e) => handleAgeRangeChange(ageRange[0], Number(e.target.value))}
                    className={styles.slider}
                  />
                </div>
              </div>
            </div>
          </div>  
        </div>
      </div>
    </main>
  );
}