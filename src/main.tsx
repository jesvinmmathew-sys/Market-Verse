import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { AccountBoundary } from './components/AccountBoundary';
import './index.css';

import {ThemeProvider} from './context/ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AccountBoundary />
    </ThemeProvider>
  </StrictMode>,
);
