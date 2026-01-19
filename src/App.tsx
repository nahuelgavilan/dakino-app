import { AppRouter } from './router/AppRouter';
import { ToastContainer } from './components/common/Toast';
import { PWAPrompt } from './components/common/PWAPrompt';
import { PWAUpdater } from './components/common/PWAUpdater';
import './styles/global.css';

function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
      <PWAPrompt />
      <PWAUpdater />
    </>
  );
}

export default App;
