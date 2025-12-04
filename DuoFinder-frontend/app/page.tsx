"use client";

import Link from "next/link";
import styles from "../styles/pages/page.module.css";
import { useState, useEffect } from "react";
import Image from 'next/image';

const PHONES: string[] = [
  //Brazo robot
  "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //Play Controller
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=647&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //Teclado iluminado
  "https://images.unsplash.com/photo-1581351123004-757df051db8e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //Xbox controller
  "https://images.unsplash.com/photo-1619382581049-c87bedd3b479?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //Dado
  "https://images.unsplash.com/photo-1595744043037-68de3376ed59?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //Play has no limits
  "https://images.unsplash.com/photo-1593280359364-5242f1958068?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //Pc gamer 
  "https://images.unsplash.com/photo-1726442116417-de02f3116eed?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGdhbWVzfGVufDB8MXwwfHx8MA%3D%3D",
  //Nintendo Switch
  "https://images.unsplash.com/photo-1635514569156-ca58f1247e8d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjN8fGdhbWVzfGVufDB8MXwwfHx8MA%3D%3D",
  //Cartas Poker
  "https://images.unsplash.com/photo-1709532539319-7cdd32e90e24?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //Parlante JASJDA
  "https://plus.unsplash.com/premium_photo-1677870728084-e8be4c7cdb5c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzR8fGdhbWVzfGVufDB8MXwwfHx8MA%3D%3D",
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
          <Image 
            src="/favicon.ico" 
            alt="DuoFinder" 
            width={40}  // adjust as needed
            height={40} // adjust as needed
            className={styles.logo}
          />
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