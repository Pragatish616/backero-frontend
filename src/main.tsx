import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { ActiveBriefProvider } from './lib/activeBrief'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <ActiveBriefProvider>
      <App />
    </ActiveBriefProvider>
  </HashRouter>,
)
