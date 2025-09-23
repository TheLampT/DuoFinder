"use client";

import Link from "next/link";
import styles from "../../styles/pages/preferences.module.css";
import { useState, useEffect } from "react";

export default function Preferences() {
  const [notifications, setNotifications] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>("es");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    // Load saved preferences
    const savedNotifications = localStorage.getItem('notifications');
    const savedLanguage = localStorage.getItem('language');
    
    if (savedNotifications) setNotifications(savedNotifications === 'true');
    if (savedLanguage) setLanguage(savedLanguage);
    
    // Get current theme from document (avoids flash of wrong theme)
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setIsDarkMode(currentTheme === 'dark');
  }, []);

  const handleThemeChange = (isDark: boolean): void => {
    setIsDarkMode(isDark);
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  // ... rest of the component remains the same

  const handleNotificationsChange = (enabled: boolean): void => {
    setNotifications(enabled);
    localStorage.setItem('notifications', enabled.toString());
  };

  const handleLanguageChange = (lang: string): void => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <main className={styles.wrapper}>
      {/* NAVBAR */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.backButton}>
          ← Volver
        </Link>
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
        </div>
      </div>
    </main>
  );
}