import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScrollContainer } from './components/layout/ScrollContainer';
import { CursorGlow } from './components/layout/CursorGlow';
import { Home } from './pages/Home';
import { Episode01Genesis } from './episodes/episode-01-genesis';
import { Episode02Heartbeat } from './episodes/episode-02-heartbeat';
import { Episode03MemoryPalace } from './episodes/episode-03-memory-palace';
import { Episode04ManyLives } from './episodes/episode-04-many-lives';
import { Episode05Pathways } from './episodes/episode-05-pathways';
import { Episode06Strategy } from './episodes/episode-06-strategy';
import { Episode07Rules } from './episodes/episode-07-rules';
import { Episode08Fever } from './episodes/episode-08-fever';
import { Episode09Cleanup } from './episodes/episode-09-cleanup';

function App() {
  return (
    <BrowserRouter>
      <ScrollContainer>
        <CursorGlow />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/episode/1" element={<Episode01Genesis />} />
          <Route path="/episode/2" element={<Episode02Heartbeat />} />
          <Route path="/episode/3" element={<Episode03MemoryPalace />} />
          <Route path="/episode/4" element={<Episode04ManyLives />} />
          <Route path="/episode/5" element={<Episode05Pathways />} />
          <Route path="/episode/6" element={<Episode06Strategy />} />
          <Route path="/episode/7" element={<Episode07Rules />} />
          <Route path="/episode/8" element={<Episode08Fever />} />
          <Route path="/episode/9" element={<Episode09Cleanup />} />
        </Routes>
      </ScrollContainer>
    </BrowserRouter>
  );
}

export default App;
