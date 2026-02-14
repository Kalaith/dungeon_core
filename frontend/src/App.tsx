import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { GamePage } from './pages/GamePage';

function App() {
  return (
    <ErrorBoundary>
      <GamePage />
    </ErrorBoundary>
  );
}

export default App;
