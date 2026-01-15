import { AppRouter } from './router/AppRouter';
import { ToastContainer } from './components/common/Toast';
import './styles/global.css';

function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}

export default App;
