import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { RenderPage } from './video/RenderPage.tsx';
import './index.css';

const params = new URLSearchParams(window.location.search);
const isRenderMode = params.get('render') === '1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isRenderMode ? <RenderPage /> : <App />}</StrictMode>
);
