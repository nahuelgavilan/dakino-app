import { AppRouter } from './router/AppRouter';
import { ToastContainer } from './components/common/Toast';
import { PWAPrompt } from './components/common/PWAPrompt';
import './styles/global.css';

function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
      <PWAPrompt />
    </>
  );
}

export default App;
