import AuthCallback from './pages/AuthCallback.jsx';
import Home from './pages/Home.jsx';

function App() {
  return window.location.pathname === '/auth/callback' ? <AuthCallback /> : <Home />;
}

export default App;
