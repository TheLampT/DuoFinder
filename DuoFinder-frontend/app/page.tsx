export default function Home() {
  return (
    <div className="demo-container">
      <h1>Tinder-like App</h1>
      <div className="page-content">
        <h2>Welcome to the Demo</h2>
        <p>This is a demonstration of the bottom navigation bar.</p>
        <p>Try navigating to different pages using the bottom bar.</p>
        
        <div className="nav-instructions">
          <p>Click on the buttons in the bottom bar to navigate to:</p>
          <ul>
            <li><strong>Discover</strong> - Browse profiles</li>
            <li><strong>Messages</strong> - Chat with matches</li>
            <li><strong>Preferences</strong> - Adjust settings</li>
            <li><strong>Profile</strong> - View your profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
}