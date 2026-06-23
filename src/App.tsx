import { HashRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import StudyPage from './pages/StudyPage'
import PlansPage from './pages/PlansPage'
import PracticePage from './pages/PracticePage'
import ResourcesPage from './pages/ResourcesPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  )
}
