import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScrollContainer } from './components/layout/ScrollContainer';
import { CursorGlow } from './components/layout/CursorGlow';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Episode01Genesis } from './episodes/episode-01-genesis';
import { Episode02Blueprint } from './episodes/episode-02-blueprint';
import { Episode03Heartbeat } from './episodes/episode-03-heartbeat';
import { Episode04MemoryPalace } from './episodes/episode-04-memory-palace';
import { Episode05ManyLives } from './episodes/episode-05-many-lives';
import { Episode06Pathways } from './episodes/episode-06-pathways';
import { Episode07Strategy } from './episodes/episode-07-strategy';
import { Episode08Rules } from './episodes/episode-08-rules';
import { Episode09Fever } from './episodes/episode-09-fever';
import { Episode10Cleanup } from './episodes/episode-10-cleanup';
import { Episode11Statistics } from './episodes/episode-11-statistics';
import { Episode12Connections } from './episodes/episode-12-connections';
import { Episode13Replicas } from './episodes/episode-13-replicas';
import { Episode14Partitioning } from './episodes/episode-14-partitioning';
import { Episode15Finale } from './episodes/episode-15-finale';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollContainer>
          <CursorGlow />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/episode/1" element={<Episode01Genesis />} />
            <Route path="/episode/2" element={<Episode02Blueprint />} />
            <Route path="/episode/3" element={<Episode03Heartbeat />} />
            <Route path="/episode/4" element={<Episode04MemoryPalace />} />
            <Route path="/episode/5" element={<Episode05ManyLives />} />
            <Route path="/episode/6" element={<Episode06Pathways />} />
            <Route path="/episode/7" element={<Episode07Strategy />} />
            <Route path="/episode/8" element={<Episode08Rules />} />
            <Route path="/episode/9" element={<Episode09Fever />} />
            <Route path="/episode/10" element={<Episode10Cleanup />} />
            <Route path="/episode/11" element={<Episode11Statistics />} />
            <Route path="/episode/12" element={<Episode12Connections />} />
            <Route path="/episode/13" element={<Episode13Replicas />} />
            <Route path="/episode/14" element={<Episode14Partitioning />} />
            <Route path="/episode/15" element={<Episode15Finale />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ScrollContainer>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
