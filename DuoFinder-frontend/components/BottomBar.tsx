'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BottomBar = () => {
  const pathname = usePathname();

  return (
    <div className="bottom-bar">
      <Link 
        href="/discover" 
        className={`nav-item ${pathname === '/discover' ? 'active' : ''}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" 
                fill="currentColor"/>
          <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" 
                fill="currentColor"/>
          <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z" 
                fill="currentColor"/>
        </svg>
        <span>Discover</span>
      </Link>

      <Link 
        href="/messages" 
        className={`nav-item ${pathname === '/messages' ? 'active' : ''}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" 
                fill="currentColor"/>
          <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12Z" 
                fill="currentColor"/>
        </svg>
        <span>Messages</span>
      </Link>

      <Link 
        href="/preferences" 
        className={`nav-item ${pathname === '/preferences' ? 'active' : ''}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" 
                fill="currentColor"/>
        </svg>
        <span>Preferences</span>
      </Link>

      <Link 
        href="/profile" 
        className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" 
                fill="currentColor"/>
        </svg>
        <span>Profile</span>
      </Link>
    </div>
  );
};

export default BottomBar;