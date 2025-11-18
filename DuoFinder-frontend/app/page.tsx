"use client";

import Link from "next/link";
import styles from "../styles/pages/page.module.css";
import { useState, useEffect } from "react";
import Image from 'next/image';

const PHONES: string[] = [
  "https://picsum.photos/id/1062/400/800",
  "https://picsum.photos/id/1011/400/800",
  "https://picsum.photos/id/1005/400/800",
  "https://picsum.photos/id/1027/400/800",
  "https://picsum.photos/id/1012/400/800",
  "https://picsum.photos/id/1021/400/800",
  "https://picsum.photos/id/1024/400/800",
  "https://picsum.photos/id/1015/400/800",
  "https://picsum.photos/id/1016/400/800",
  "https://picsum.photos/id/1020/400/800",
];

export default function Landing() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Check for system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    // Apply the theme to the document
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [isDarkMode]);

  const toggleTheme = (): void => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <main className={styles.wrapper}>
      {/* NAVBAR simple */}
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <Image src="/favicon.ico" alt="DuoFinder" className={styles.logo} />
          <span className={styles.brandText}>DuoFinder</span>
        </div>
        
        <div className={styles.navButtons}>
          {/* Theme toggle button */}
          <button className={styles.themeToggle} onClick={toggleTheme}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <Link href="/preferences" className={styles.settingsBtn}>⚙️</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        {/* fondo de "celulares" */}
        <div className={styles.phones}>
          {PHONES.map((src, i) => (
            <div
              key={i}
              className={`${styles.phone} ${styles["p" + ((i % 10) + 1)]}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>

        {/* overlay para oscurecer */}
        <div className={styles.overlay} />

        {/* contenido principal */}
        <div className={styles.content}>
          <h1 className={styles.title}>Deslizá a la derecha</h1>
          
          <div className={styles.buttonGroup}>
            <Link href="/login" className={styles.loginBtn}>Iniciar sesión</Link>
            <Link href="/register" className={styles.cta}>Crear cuenta</Link>
          </div>
        </div>
      </section>
    </main>
  );
}