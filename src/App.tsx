import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Phase1 from './pages/Phase1'
import Phase2 from './pages/Phase2'
import Phase3 from './pages/Phase3'
import Phase4 from './pages/Phase4'
import Phase5 from './pages/Phase5'
import Phase6 from './pages/Phase6'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/phase/1" element={<Phase1 />} />
      <Route path="/phase/2" element={<Phase2 />} />
      <Route path="/phase/3" element={<Phase3 />} />
      <Route path="/phase/4" element={<Phase4 />} />
      <Route path="/phase/5" element={<Phase5 />} />
      <Route path="/phase/6" element={<Phase6 />} />
    </Routes>
  )
}
