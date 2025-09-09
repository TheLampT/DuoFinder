import Link from "next/link";
import styles from "./page.module.css";

const PHONES = [
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
  return (
    <main className={styles.wrapper}>
      {/* NAVBAR simple */}
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <img src="/favicon.ico" alt="DuoFinder" className={styles.logo} />
          <span className={styles.brandText}>DuoFinder</span>
        </div>
        <Link href="/login" className={styles.loginBtn}>Iniciar sesión</Link>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        {/* fondo de “celulares” */}
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
          <Link href="/register" className={styles.cta}>Crear cuenta</Link>
        </div>
      </section>
    </main>
  );
}
