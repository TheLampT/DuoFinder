"use client";

import Link from "next/link";
import styles from "../../styles/pages/preferences.module.css";
import { useState, useEffect } from "react";
import Image from 'next/image';
import { profileService } from '../../lib/auth';

export default function Preferences() {
  const [notifications, setNotifications] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>("es");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [playStyle, setPlayStyle] = useState<string>("ambos");
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 40]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const profile = await profileService.getProfile();
      
      // Check if profile has age_min and age_max with proper null checks
      if (profile.age_min != null && profile.age_max != null) {
        const newAgeRange: [number, number] = [Number(profile.age_min), Number(profile.age_max)];
        setAgeRange(newAgeRange);
      }
      // If age_min or age_max are null/undefined, keep the default [18, 40]
      
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Fallback to localStorage if API fails
      const savedAgeRange = localStorage.getItem('ageRange');
      if (savedAgeRange) {
        try {
          const parsed = JSON.parse(savedAgeRange);
          if (Array.isArray(parsed) && parsed.length === 2 && 
              parsed[0] != null && parsed[1] != null) {
            const tupleAgeRange: [number, number] = [Number(parsed[0]), Number(parsed[1])];
            setAgeRange(tupleAgeRange);
          }
        } catch (e) {
          console.error('Failed to parse saved age range:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update CSS variables for the slider track with null checks
  useEffect(() => {
    if (ageRange && ageRange[0] != null && ageRange[1] != null) {
      document.documentElement.style.setProperty('--min', ageRange[0].toString());
      document.documentElement.style.setProperty('--max', ageRange[1].toString());
    }
  }, [ageRange]);

  const savePreferences = async () => {
    if (!ageRange) return;
    
    try {
      setIsSaving(true);
      // Update age range via API
      await profileService.updateProfile({
        age_min: ageRange[0],
        age_max: ageRange[1]
      });
      
      // Save other preferences to localStorage
      localStorage.setItem('notifications', notifications.toString());
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      localStorage.setItem('ageRange', JSON.stringify(ageRange));
      
      setHasChanges(false);
      console.log('Preferences saved successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      // Fallback to localStorage only if API fails
      localStorage.setItem('ageRange', JSON.stringify(ageRange));
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (isDark: boolean): void => {
    setIsDarkMode(isDark);
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    setHasChanges(true);
  };

  const handleNotificationsChange = (enabled: boolean): void => {
    setNotifications(enabled);
    setHasChanges(true);
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
    setHasChanges(true);
  };

  const handleSaveClick = async () => {
    await savePreferences();
  };

  // Don't render anything until mounted (SSR compatibility)
  if (!isMounted || isLoading) {
    return (
      <main className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.preferencesCard}>
            <p>Loading preferences...</p>
          </div>
        </div>
      </main>
    );
  }

  // Safe age range values with fallbacks
  const safeAgeRange = ageRange || [18, 40];
  const minAge = safeAgeRange[0] != null ? safeAgeRange[0] : 18;
  const maxAge = safeAgeRange[1] != null ? safeAgeRange[1] : 40;

  return (
    <main className={styles.wrapper}>
      {/* NAVBAR */}
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <Image 
            src="/favicon.ico" 
            alt="DuoFinder" 
            width={40}
            height={40}
            className={styles.logo}
          />
          <span className={styles.brandText}>Preferencias</span>
        </div>
        <div style={{width: "100px"}}></div>
      </nav>

      <div className={styles.container}>
        <div className={styles.preferencesCard}>
          {/* Save indicator */}
          <h2 className={styles.sectionTitle}>Apariencia</h2>
          
          <div className={styles.optionGroup}>
            <div className={styles.option}>
              <span className={styles.optionLabel}>Modo oscuro</span>
              <div className={styles.toggleSwitch}>
                <input 
                  type="checkbox" 
                  id="darkMode" 
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
              <span className={styles.optionLabel}>Estilo de juego</span>
              <div className={styles.dropdownContainer}>
                <select 
                  value={playStyle}
                  onChange={(e) => handlePlayStyleChange(e.target.value)}
                  className={styles.dropdown}
                >
                  <option value="competitivo">Competitivo</option>
                  <option value="casual">Casual</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
            </div>

            <div className={styles.option}>
              <div className={styles.ageRangeContainer}>
                <span className={styles.optionLabel}>Rango de edad</span>
                <div className={styles.ageRangeValues}>
                  {minAge} - {maxAge} años
                </div>
              </div>
              <div className={styles.ageSliderContainer}>
                <div className={styles.ageSlider}>
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={minAge}
                    onChange={(e) => handleAgeRangeChange(Number(e.target.value), maxAge)}
                    className={styles.slider}
                  />
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={maxAge}
                    onChange={(e) => handleAgeRangeChange(minAge, Number(e.target.value))}
                    className={styles.slider}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save button at the bottom */}
          
          {hasChanges && (<div className={styles.saveSection}>
              <button 
                onClick={handleSaveClick}
                disabled={!hasChanges || isSaving}
                className={`${styles.saveButton} ${!hasChanges ? styles.saveButtonDisabled : ''}`}
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              {!hasChanges && (
                <span className={styles.savedText}>Todos los cambios están guardados</span>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}