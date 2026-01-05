import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { colors } from '../../config/theme';
import { btreeNavigation, pathwayMotion } from '../../config/animation';
import { delay, isAbortError } from '../../lib/utils';

// Use centralized timing from animation.ts
const TIMING = btreeNavigation.timing;

interface TreeNode {
  id: string;
  keys: string[];
  children?: TreeNode[];
  isLeaf?: boolean;
  ctids?: { key: string; ctid: string }[];
}

// B-tree structure for email index
const btree: TreeNode = {
  id: 'root',
  keys: ['charlie@', 'mike@'],
  children: [
    {
      id: 'left',
      keys: ['bob@'],
      children: [
        {
          id: 'leaf-1',
          isLeaf: true,
          keys: [],
          ctids: [
            { key: 'alice@example.com', ctid: '(38, 3)' },
            { key: 'anna@example.com', ctid: '(12, 2)' },
          ],
        },
        {
          id: 'leaf-2',
          isLeaf: true,
          keys: [],
          ctids: [
            { key: 'bob@example.com', ctid: '(5, 4)' },
            { key: 'brian@example.com', ctid: '(22, 5)' },
          ],
        },
      ],
    },
    {
      id: 'middle',
      keys: ['frank@'],
      children: [
        {
          id: 'leaf-3',
          isLeaf: true,
          keys: [],
          ctids: [
            { key: 'carol@example.com', ctid: '(8, 2)' },
            { key: 'dave@example.com', ctid: '(15, 3)' },
          ],
        },
        {
          id: 'leaf-4',
          isLeaf: true,
          keys: [],
          ctids: [
            { key: 'eve@example.com', ctid: '(19, 4)' },
            { key: 'frank@example.com', ctid: '(27, 2)' },
          ],
        },
      ],
    },
    {
      id: 'right',
      keys: ['sarah@'],
      children: [
        {
          id: 'leaf-5',
          isLeaf: true,
          keys: [],
          ctids: [
            { key: 'mike@example.com', ctid: '(31, 3)' },
            { key: 'rachel@example.com', ctid: '(44, 2)' },
          ],
        },
        {
          id: 'leaf-6',
          isLeaf: true,
          keys: [],
          ctids: [
            { key: 'sarah@example.com', ctid: '(41, 4)' },
            { key: 'tom@example.com', ctid: '(47, 3)' },
          ],
        },
      ],
    },
  ],
};

interface SearchState {
  phase: 'idle' | 'searching' | 'found' | 'not-found';
  path: string[];
  currentNode: string | null;
  foundCtid: string | null;
  pagesRead: number;
  rejectedNodes: string[];
  decisionQuestion: string | null; // "Is 'alice@' < 'charlie@'?"
  decisionAnswer: string | null; // "YES → LEFT"
  searchSpace: number; // Shows narrowing: 12 → 4 → 2 → 1
  travelingSignal: { from: string; to: string } | null;
  showingQuestion: boolean; // For two-phase reveal
}

export function BTreeNavigator() {
  const [searchEmail, setSearchEmail] = useState('alice@example.com');
  const [searchState, setSearchState] = useState<SearchState>({
    phase: 'idle',
    path: [],
    currentNode: null,
    foundCtid: null,
    pagesRead: 0,
    rejectedNodes: [],
    decisionQuestion: null,
    decisionAnswer: null,
    searchSpace: 12,
    travelingSignal: null,
    showingQuestion: false,
  });

  // Ref for SVG container to calculate node positions
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Ref for cancelling async operations
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const search = useCallback(async () => {
    // Cancel any existing search
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const email = searchEmail.toLowerCase();
      const emailPrefix = email.split('@')[0] + '@';

      // Helper for two-phase decision reveal
      const showDecision = async (question: string, answer: string, newSpace: number) => {
        // Phase 1: Show question
        setSearchState((s) => ({
          ...s,
          decisionQuestion: question,
          decisionAnswer: null,
          showingQuestion: true,
        }));
        await delay(TIMING.questionReveal, signal);

        // Phase 2: Show answer with drama
        setSearchState((s) => ({
          ...s,
          decisionAnswer: answer,
          showingQuestion: false,
          searchSpace: newSpace,
        }));
        await delay(TIMING.answerReveal, signal);
      };

      // Start at root - all 12 entries in search space
      setSearchState({
        phase: 'searching',
        path: [],
        currentNode: 'root',
        foundCtid: null,
        pagesRead: 1,
        rejectedNodes: [],
        decisionQuestion: 'Examining root node...',
        decisionAnswer: null,
        searchSpace: 12,
        travelingSignal: null,
        showingQuestion: true,
      });

      await delay(TIMING.rootInspection, signal);

      const path = ['root'];
      const rejected: string[] = [];
      let pagesRead = 1;

      let nextNode: TreeNode;
      let question: string;
      let answer: string;

      if (email < 'charlie@') {
        nextNode = btree.children![0];
        path.push('left');
        rejected.push('middle', 'right');
        question = `Is '${emailPrefix}' < 'charlie@' ?`;
        answer = 'YES → GO LEFT';
      } else if (email < 'mike@') {
        nextNode = btree.children![1];
        path.push('middle');
        rejected.push('left', 'right');
        question = `Is '${emailPrefix}' < 'mike@' ?`;
        answer = 'YES → GO MIDDLE';
      } else {
        nextNode = btree.children![2];
        path.push('right');
        rejected.push('left', 'middle');
        question = `Is '${emailPrefix}' >= 'mike@' ?`;
        answer = 'YES → GO RIGHT';
      }

      // Two-phase decision reveal
      await showDecision(question, answer, 4);

      // Show traveling signal from root to next node
      setSearchState((s) => ({
        ...s,
        travelingSignal: { from: 'root', to: nextNode.id },
        rejectedNodes: rejected,
      }));
      await delay(TIMING.signalTravel, signal);

      setSearchState((s) => ({
        ...s,
        path,
        currentNode: nextNode.id,
        pagesRead: ++pagesRead,
        travelingSignal: null,
      }));
      await delay(TIMING.nodeInspection, signal);

      let leafNode: TreeNode;
      if (nextNode.children) {
        const compareKey = nextNode.keys[0];
        let leafId: string;
        if (email < compareKey) {
          leafNode = nextNode.children[0];
          leafId = leafNode.id;
          rejected.push(nextNode.children[1].id);
          question = `Is '${emailPrefix}' < '${compareKey}' ?`;
          answer = 'YES → GO LEFT';
        } else {
          leafNode = nextNode.children[1];
          leafId = leafNode.id;
          rejected.push(nextNode.children[0].id);
          question = `Is '${emailPrefix}' >= '${compareKey}' ?`;
          answer = 'YES → GO RIGHT';
        }

        // Two-phase decision reveal
        await showDecision(question, answer, 2);

        // Show traveling signal from internal node to leaf
        setSearchState((s) => ({
          ...s,
          travelingSignal: { from: nextNode.id, to: leafId },
          rejectedNodes: rejected,
        }));
        await delay(TIMING.signalTravel, signal);

        path.push(leafNode.id);
        setSearchState((s) => ({
          ...s,
          path,
          currentNode: leafNode.id,
          pagesRead: ++pagesRead,
          travelingSignal: null,
        }));
        await delay(TIMING.nodeInspection, signal);
      } else {
        leafNode = nextNode;
      }

      setSearchState((s) => ({
        ...s,
        decisionQuestion: 'Scanning leaf entries...',
        decisionAnswer: null,
        showingQuestion: true,
      }));
      await delay(TIMING.leafScan, signal);

      const found = leafNode.ctids?.find((c) => c.key === email);
      if (found) {
        // Dramatic found buildup
        setSearchState((s) => ({
          ...s,
          decisionQuestion: null,
          decisionAnswer: null,
        }));
        await delay(200, signal);

        setSearchState({
          phase: 'found',
          path,
          currentNode: leafNode.id,
          foundCtid: found.ctid,
          pagesRead,
          rejectedNodes: rejected,
          decisionQuestion: 'FOUND!',
          decisionAnswer: `ctid = ${found.ctid}`,
          searchSpace: 1,
          travelingSignal: null,
          showingQuestion: false,
        });

        // Trigger confetti celebration
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { x: 0.5, y: 0.5 },
          colors: [colors.glow.healthy, colors.glow.warning, '#ffffff'],
        });
      } else {
        setSearchState({
          phase: 'not-found',
          path,
          currentNode: leafNode.id,
          foundCtid: null,
          pagesRead,
          rejectedNodes: rejected,
          decisionQuestion: 'NOT FOUND',
          decisionAnswer: 'Key does not exist in index',
          searchSpace: 0,
          travelingSignal: null,
          showingQuestion: false,
        });
      }
    } catch (e) {
      if (!isAbortError(e)) throw e;
    }
  }, [searchEmail]);

  const reset = useCallback(() => {
    // Cancel any running search
    abortControllerRef.current?.abort();

    setSearchState({
      phase: 'idle',
      path: [],
      currentNode: null,
      foundCtid: null,
      pagesRead: 0,
      rejectedNodes: [],
      decisionQuestion: null,
      decisionAnswer: null,
      searchSpace: 12,
      travelingSignal: null,
      showingQuestion: false,
    });
  }, []);

  const isInPath = (nodeId: string) => searchState.path.includes(nodeId);
  const isCurrent = (nodeId: string) => searchState.currentNode === nodeId;
  const isRejected = (nodeId: string) => searchState.rejectedNodes.includes(nodeId);

  // Get line color based on path state
  const getLineColor = (nodeId: string) => {
    if (isInPath(nodeId)) return colors.glow.healthy;
    if (isRejected(nodeId)) return colors.text.muted + '20';
    return colors.text.muted + '40';
  };

  // Get line glow for path
  const getLineGlow = (nodeId: string) => {
    if (isInPath(nodeId)) return `0 0 8px ${colors.glow.healthy}, 0 0 16px ${colors.glow.healthy}40`;
    return 'none';
  };

  return (
    <div
      className="p-4 md:p-6 rounded-xl"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${colors.text.muted}20`,
      }}
    >
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-medium" style={{ color: colors.text.primary }}>
          B-tree Index Navigator
        </h3>
        <p className="text-xs md:text-sm mt-1" style={{ color: colors.text.muted }}>
          Watch how PostgreSQL finds your row in O(log n) time
        </p>
      </div>

      {/* Search Input */}
      <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
        <input
          type="text"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder="Enter email to search..."
          aria-label="Email address to search in B-tree index"
          className="flex-1 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-mono"
          style={{
            background: colors.ocean,
            color: colors.text.primary,
            border: `1px solid ${colors.text.muted}40`,
          }}
        />
        <motion.button
          className="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={searchState.phase === 'idle' ? search : reset}
          style={{
            background: `${colors.glow.healthy}20`,
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
        >
          {searchState.phase === 'idle' ? 'Search' : 'Reset'}
        </motion.button>
      </div>

      {/* Decision Text Banner - Two Phase Reveal */}
      <AnimatePresence mode="wait">
        {(searchState.decisionQuestion || searchState.decisionAnswer) && (
          <motion.div
            className="mb-4 p-3 md:p-4 rounded-xl text-center"
            style={{
              background: searchState.phase === 'found'
                ? `${colors.glow.healthy}15`
                : searchState.phase === 'not-found'
                ? `${colors.glow.critical}15`
                : `${colors.oceanLight}`,
              border: `2px solid ${
                searchState.phase === 'found'
                  ? colors.glow.healthy
                  : searchState.phase === 'not-found'
                  ? colors.glow.critical
                  : colors.glow.warning
              }60`,
              boxShadow: searchState.phase === 'found'
                ? `0 0 30px ${colors.glow.healthy}40`
                : 'none',
            }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
            key={`${searchState.decisionQuestion}-${searchState.decisionAnswer}`}
          >
            {/* Question */}
            {searchState.decisionQuestion && (
              <motion.div
                className="font-mono text-sm md:text-base"
                style={{ color: colors.text.secondary }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {searchState.decisionQuestion}
              </motion.div>
            )}

            {/* Answer - appears with delay */}
            <AnimatePresence>
              {searchState.decisionAnswer && (
                <motion.div
                  className="font-mono text-lg md:text-xl font-bold mt-2"
                  style={{
                    color: searchState.phase === 'found'
                      ? colors.glow.healthy
                      : searchState.phase === 'not-found'
                      ? colors.glow.critical
                      : colors.glow.warning,
                  }}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'backOut' }}
                >
                  {searchState.decisionAnswer}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulsing dots while thinking */}
            {searchState.showingQuestion && !searchState.decisionAnswer && (
              <motion.div className="flex justify-center gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: colors.glow.warning }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Space Counter - Dramatic Elimination */}
      {searchState.phase === 'searching' && (
        <motion.div
          className="mb-6 flex flex-col items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-xs uppercase tracking-widest" style={{ color: colors.text.muted }}>
            Search Space Narrowing
          </span>
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={searchState.searchSpace}
                className="relative"
                initial={{ scale: 2, opacity: 0, filter: 'blur(8px)' }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                exit={{ scale: 0.3, opacity: 0, y: 30, filter: 'blur(4px)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="font-mono font-black text-4xl md:text-5xl px-6 py-3 rounded-2xl relative"
                  style={{
                    background: searchState.searchSpace <= 2
                      ? `${colors.glow.healthy}20`
                      : searchState.searchSpace <= 4
                      ? `${colors.glow.warning}20`
                      : `${colors.text.muted}20`,
                    color: searchState.searchSpace <= 2
                      ? colors.glow.healthy
                      : searchState.searchSpace <= 4
                      ? colors.glow.warning
                      : colors.text.primary,
                    boxShadow: searchState.searchSpace <= 4
                      ? `0 0 30px ${searchState.searchSpace <= 2 ? colors.glow.healthy : colors.glow.warning}50`
                      : 'none',
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {searchState.searchSpace}
                  {/* Pulse rings on number change */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      border: `2px solid ${searchState.searchSpace <= 2 ? colors.glow.healthy : colors.glow.warning}`,
                    }}
                    initial={{ opacity: 0.8, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
            <div className="text-left">
              <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                entries
              </div>
              <div className="text-xs" style={{ color: colors.text.muted }}>
                {searchState.searchSpace === 12 ? 'total' : 'remaining'}
              </div>
            </div>
          </div>
          {/* Progress indicator */}
          <div className="flex gap-1 mt-2">
            {[12, 4, 2, 1].map((stage) => (
              <motion.div
                key={stage}
                className="w-8 h-1 rounded-full"
                style={{
                  background: searchState.searchSpace <= stage
                    ? colors.glow.healthy
                    : colors.text.muted + '30',
                }}
                animate={{
                  opacity: searchState.searchSpace === stage ? [0.5, 1, 0.5] : 1,
                }}
                transition={searchState.searchSpace === stage ? { repeat: Infinity, duration: 1 } : undefined}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* B-tree Visualization - Clean table-like structure */}
      <div className="py-4 relative">
        {/* Mobile scroll indicators - fade gradients */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-20 md:hidden"
          style={{
            background: `linear-gradient(to right, ${colors.oceanDark}, transparent)`,
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-20 md:hidden"
          style={{
            background: `linear-gradient(to left, ${colors.oceanDark}, transparent)`,
          }}
        />

        <div className="overflow-x-auto">
        <div ref={treeContainerRef} className="relative flex flex-col items-center" style={{ minWidth: '700px' }}>
          {/* SVG Overlay for Nerve Pathway Effects */}
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {/* Glow filter for active pathways */}
              <filter id="pathway-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={pathwayMotion.pathwayIgnite.glowBlur / 3} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Stronger glow for traveling signal */}
              <filter id="signal-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Traveling Signal Dot - when a signal is active */}
            <AnimatePresence>
              {searchState.travelingSignal && (
                <motion.circle
                  r={6}
                  fill={colors.glow.healthy}
                  filter="url(#signal-glow)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1, 1, 0.5],
                    cy: ['0%', '100%'],
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    duration: pathwayMotion.synapseTravel.duration,
                    ease: 'easeOut',
                  }}
                  style={{ cx: '50%' }}
                />
              )}
            </AnimatePresence>
          </svg>

          {/* LEVEL 0: Root Node */}
          <TreeNodeBox
            node={btree}
            isInPath={isInPath('root')}
            isCurrent={isCurrent('root')}
            isRejected={false}
          />

          {/* Vertical line from root - nerve pathway */}
          <motion.div
            className="w-0.5 h-5 relative"
            style={{
              background: getLineColor('root'),
              boxShadow: getLineGlow('root'),
            }}
            animate={{
              opacity: isInPath('root') ? [0.7, 1, 0.7] : 1,
            }}
            transition={isInPath('root') ? {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            } : undefined}
          >
            {/* Traveling signal with comet trail */}
            {searchState.travelingSignal?.from === 'root' && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2"
                initial={{ top: 0, opacity: 0 }}
                animate={{ top: '100%', opacity: [0, 1, 1, 0.5] }}
                transition={{ duration: TIMING.signalTravel / 1000, ease: 'easeOut' }}
              >
                {/* Comet trail */}
                {[0.2, 0.4, 0.6].map((opacity, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full -translate-x-1/2"
                    style={{
                      background: colors.glow.healthy,
                      opacity,
                      top: -8 - i * 6,
                    }}
                  />
                ))}
                {/* Main signal */}
                <motion.div
                  className="w-4 h-4 rounded-full -translate-x-1/2"
                  style={{
                    background: colors.glow.healthy,
                    boxShadow: `0 0 12px ${colors.glow.healthy}, 0 0 24px ${colors.glow.healthy}, 0 0 36px ${colors.glow.healthy}50`,
                  }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                />
              </motion.div>
            )}
          </motion.div>

          {/* LEVEL 1: Internal Nodes with horizontal connector */}
          <div className="flex w-full justify-center">
            {btree.children!.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === btree.children!.length - 1;

              return (
                <div key={child.id} className="flex flex-col items-center" style={{ flex: '1', maxWidth: '280px' }}>
                  {/* Horizontal line segment + vertical drop - nerve pathway */}
                  <div className="flex w-full h-5">
                    {/* Left half of horizontal segment */}
                    <motion.div
                      className="h-0.5 flex-1"
                      style={{
                        background: isFirst ? 'transparent' : getLineColor(child.id),
                        boxShadow: isFirst ? 'none' : getLineGlow(child.id),
                      }}
                      animate={{
                        opacity: isRejected(child.id)
                          ? pathwayMotion.pathwayDim.opacity
                          : isInPath(child.id)
                          ? [0.7, 1, 0.7]
                          : 1,
                      }}
                      transition={isInPath(child.id) && !isRejected(child.id) ? {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      } : { duration: pathwayMotion.pathwayDim.duration }}
                    />
                    {/* Vertical drop line */}
                    <motion.div
                      className="w-0.5 h-full relative"
                      style={{
                        background: getLineColor(child.id),
                        boxShadow: getLineGlow(child.id),
                      }}
                      animate={{
                        opacity: isRejected(child.id)
                          ? pathwayMotion.pathwayDim.opacity
                          : isInPath(child.id)
                          ? [0.7, 1, 0.7]
                          : 1,
                      }}
                      transition={isInPath(child.id) && !isRejected(child.id) ? {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      } : { duration: pathwayMotion.pathwayDim.duration }}
                    >
                      {/* Traveling signal from root to internal node - comet trail */}
                      {searchState.travelingSignal?.to === child.id && (
                        <motion.div
                          className="absolute left-1/2 -translate-x-1/2"
                          initial={{ top: 0, opacity: 0 }}
                          animate={{ top: '100%', opacity: [0, 1, 1, 0.5] }}
                          transition={{ duration: TIMING.signalTravel / 1000, ease: 'easeOut' }}
                        >
                          {[0.2, 0.4, 0.6].map((opacity, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-3 h-3 rounded-full -translate-x-1/2"
                              style={{ background: colors.glow.healthy, opacity, top: -8 - i * 6 }}
                            />
                          ))}
                          <motion.div
                            className="w-4 h-4 rounded-full -translate-x-1/2"
                            style={{
                              background: colors.glow.healthy,
                              boxShadow: `0 0 12px ${colors.glow.healthy}, 0 0 24px ${colors.glow.healthy}, 0 0 36px ${colors.glow.healthy}50`,
                            }}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.3, repeat: Infinity }}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                    {/* Right half of horizontal segment */}
                    <motion.div
                      className="h-0.5 flex-1"
                      style={{
                        background: isLast ? 'transparent' : getLineColor(btree.children![idx + 1]?.id || child.id),
                        boxShadow: isLast ? 'none' : getLineGlow(btree.children![idx + 1]?.id || child.id),
                      }}
                      animate={{
                        opacity: isRejected(btree.children![idx + 1]?.id || child.id)
                          ? pathwayMotion.pathwayDim.opacity
                          : 1,
                      }}
                      transition={{ duration: pathwayMotion.pathwayDim.duration }}
                    />
                  </div>

                  {/* Internal Node */}
                  <TreeNodeBox
                    node={child}
                    isInPath={isInPath(child.id)}
                    isCurrent={isCurrent(child.id)}
                    isRejected={isRejected(child.id)}
                  />

                  {/* Vertical line from internal node to leaves - nerve pathway */}
                  <motion.div
                    className="w-0.5 h-4 relative"
                    style={{
                      background: getLineColor(child.id),
                      boxShadow: getLineGlow(child.id),
                    }}
                    animate={{
                      opacity: isRejected(child.id)
                        ? pathwayMotion.pathwayDim.opacity
                        : isInPath(child.id)
                        ? [0.7, 1, 0.7]
                        : 1,
                    }}
                    transition={isInPath(child.id) && !isRejected(child.id) ? {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    } : { duration: pathwayMotion.pathwayDim.duration }}
                  >
                    {/* Traveling signal from internal node to leaf - comet trail */}
                    {searchState.travelingSignal?.from === child.id && (
                      <motion.div
                        className="absolute left-1/2 -translate-x-1/2"
                        initial={{ top: 0, opacity: 0 }}
                        animate={{ top: '100%', opacity: [0, 1, 1, 0.5] }}
                        transition={{ duration: TIMING.signalTravel / 1000, ease: 'easeOut' }}
                      >
                        {[0.2, 0.4, 0.6].map((opacity, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full -translate-x-1/2"
                            style={{ background: colors.glow.healthy, opacity, top: -8 - i * 6 }}
                          />
                        ))}
                        <motion.div
                          className="w-4 h-4 rounded-full -translate-x-1/2"
                          style={{
                            background: colors.glow.healthy,
                            boxShadow: `0 0 12px ${colors.glow.healthy}, 0 0 24px ${colors.glow.healthy}, 0 0 36px ${colors.glow.healthy}50`,
                          }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.3, repeat: Infinity }}
                        />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* LEVEL 2: Leaf Nodes with horizontal connector */}
                  {child.children && (
                    <div className="flex w-full">
                      {child.children.map((leaf, leafIdx) => {
                        const isFirstLeaf = leafIdx === 0;
                        const isLastLeaf = leafIdx === child.children!.length - 1;

                        return (
                          <div key={leaf.id} className="flex-1 flex flex-col items-center">
                            {/* Horizontal segment + vertical drop - nerve pathway */}
                            <div className="flex w-full h-4">
                              <motion.div
                                className="h-0.5 flex-1"
                                style={{
                                  background: isFirstLeaf ? 'transparent' : getLineColor(leaf.id),
                                  boxShadow: isFirstLeaf ? 'none' : getLineGlow(leaf.id),
                                }}
                                animate={{
                                  opacity: isRejected(leaf.id)
                                    ? pathwayMotion.pathwayDim.opacity
                                    : isInPath(leaf.id)
                                    ? [0.7, 1, 0.7]
                                    : 1,
                                }}
                                transition={isInPath(leaf.id) && !isRejected(leaf.id) ? {
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                } : { duration: pathwayMotion.pathwayDim.duration }}
                              />
                              <motion.div
                                className="w-0.5 h-full"
                                style={{
                                  background: getLineColor(leaf.id),
                                  boxShadow: getLineGlow(leaf.id),
                                }}
                                animate={{
                                  opacity: isRejected(leaf.id)
                                    ? pathwayMotion.pathwayDim.opacity
                                    : isInPath(leaf.id)
                                    ? [0.7, 1, 0.7]
                                    : 1,
                                }}
                                transition={isInPath(leaf.id) && !isRejected(leaf.id) ? {
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                } : { duration: pathwayMotion.pathwayDim.duration }}
                              />
                              <motion.div
                                className="h-0.5 flex-1"
                                style={{
                                  background: isLastLeaf ? 'transparent' : getLineColor(child.children![leafIdx + 1]?.id || leaf.id),
                                  boxShadow: isLastLeaf ? 'none' : getLineGlow(child.children![leafIdx + 1]?.id || leaf.id),
                                }}
                                animate={{
                                  opacity: isRejected(child.children![leafIdx + 1]?.id || leaf.id)
                                    ? pathwayMotion.pathwayDim.opacity
                                    : 1,
                                }}
                                transition={{ duration: pathwayMotion.pathwayDim.duration }}
                              />
                            </div>

                            {/* Leaf Node */}
                            <LeafNodeBox
                              node={leaf}
                              isInPath={isInPath(leaf.id)}
                              isCurrent={isCurrent(leaf.id)}
                              isRejected={isRejected(leaf.id)}
                              searchState={searchState}
                              searchEmail={searchEmail.toLowerCase()}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      {/* Stats */}
      {searchState.phase !== 'idle' && (
        <motion.div
          className="mt-4 md:mt-6 p-3 md:p-4 rounded-lg"
          style={{ background: colors.ocean }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
            <div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: colors.glow.healthy }}>
                {searchState.pagesRead}
              </div>
              <div className="text-xs" style={{ color: colors.text.muted }}>Pages Read</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>3</div>
              <div className="text-xs" style={{ color: colors.text.muted }}>Tree Levels</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>12</div>
              <div className="text-xs" style={{ color: colors.text.muted }}>Total Rows</div>
            </div>
            <div>
              <div
                className="text-xl md:text-2xl font-bold"
                style={{
                  color: searchState.phase === 'found' ? colors.glow.healthy : colors.glow.critical,
                }}
              >
                {searchState.phase === 'found' ? 'Found' : searchState.phase === 'not-found' ? 'Not Found' : '...'}
              </div>
              <div className="text-xs" style={{ color: colors.text.muted }}>Result</div>
            </div>
          </div>

          {searchState.phase === 'found' && (
            <motion.div
              className="mt-3 md:mt-4 p-2 md:p-3 rounded text-center"
              style={{
                background: `${colors.glow.healthy}10`,
                border: `1px solid ${colors.glow.healthy}40`,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-sm md:text-base" style={{ color: colors.glow.healthy }}>
                Found at ctid = <code className="font-mono">{searchState.foundCtid}</code>
              </p>
              <p className="text-xs md:text-sm mt-1" style={{ color: colors.text.muted }}>
                That's page {searchState.foundCtid?.match(/\((\d+)/)?.[1]}, row{' '}
                {searchState.foundCtid?.match(/, (\d+)/)?.[1]} in the heap
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Explanation */}
      <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-lg text-xs md:text-sm" style={{ background: colors.ocean }}>
        <p style={{ color: colors.text.secondary }}>
          <span style={{ color: colors.glow.healthy }}>B-tree</span> = Balanced tree.
          Each node is a <span style={{ color: colors.glow.warning }}>page</span> (8KB).
        </p>
        <p className="mt-2" style={{ color: colors.text.muted }}>
          The tree is sorted by email. At each level, we pick which child to follow.
          Leaf nodes store{' '}
          <code className="px-1 rounded" style={{ background: colors.oceanDark }}>(key, ctid)</code>{' '}
          pairs pointing to the heap.
        </p>
      </div>
    </div>
  );
}

function TreeNodeBox({
  node,
  isInPath,
  isCurrent,
  isRejected,
}: {
  node: TreeNode;
  isInPath: boolean;
  isCurrent: boolean;
  isRejected: boolean;
}) {
  return (
    <motion.div
      className="px-4 py-2 rounded-lg text-xs md:text-sm font-mono text-center relative"
      style={{
        background: isCurrent
          ? `${colors.glow.healthy}20`
          : isInPath
          ? colors.oceanLight
          : colors.ocean,
        border: `2px solid ${
          isCurrent
            ? colors.glow.healthy
            : isInPath
            ? colors.glow.healthy + '60'
            : colors.text.muted + '40'
        }`,
        boxShadow: isCurrent ? `0 0 20px ${colors.glow.healthy}60, 0 0 40px ${colors.glow.healthy}30` : 'none',
      }}
      animate={{
        opacity: isRejected ? 0.2 : 1,
        scale: isCurrent ? 1.05 : isRejected ? 0.95 : 1,
        filter: isRejected ? 'grayscale(80%)' : 'grayscale(0%)',
      }}
      transition={{
        duration: isRejected ? 0.6 : 0.3,
        ease: 'easeOut',
      }}
    >
      {/* Pulse rings when current */}
      {isCurrent && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-lg"
              style={{
                border: `2px solid ${colors.glow.healthy}`,
              }}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
      <div className="text-[10px] md:text-xs mb-0.5" style={{ color: colors.text.muted }}>
        {node.id === 'root' ? 'ROOT' : 'NODE'}
      </div>
      <div style={{ color: isCurrent ? colors.glow.healthy : colors.text.primary }}>
        {node.keys.map((k, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: colors.text.muted }}> | </span>}
            {k}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function LeafNodeBox({
  node,
  isInPath,
  isCurrent,
  isRejected,
  searchState,
  searchEmail,
}: {
  node: TreeNode;
  isInPath: boolean;
  isCurrent: boolean;
  isRejected: boolean;
  searchState: SearchState;
  searchEmail: string;
}) {
  return (
    <motion.div
      className="px-2 py-2 rounded-lg text-[10px] md:text-xs font-mono w-full mx-1 relative"
      style={{
        background: isCurrent
          ? `${colors.glow.healthy}20`
          : isInPath
          ? colors.oceanLight
          : colors.ocean,
        border: `2px solid ${
          isCurrent
            ? colors.glow.healthy
            : isInPath
            ? colors.glow.healthy + '60'
            : colors.text.muted + '40'
        }`,
        boxShadow: isCurrent ? `0 0 20px ${colors.glow.healthy}60, 0 0 40px ${colors.glow.healthy}30` : 'none',
      }}
      animate={{
        opacity: isRejected ? 0.2 : 1,
        scale: isCurrent ? 1.02 : isRejected ? 0.95 : 1,
        filter: isRejected ? 'grayscale(80%)' : 'grayscale(0%)',
      }}
      transition={{
        duration: isRejected ? 0.6 : 0.3,
        ease: 'easeOut',
      }}
    >
      {/* Pulse rings when current */}
      {isCurrent && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-lg"
              style={{
                border: `2px solid ${colors.glow.healthy}`,
              }}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.3 }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
      <div className="text-center mb-1 uppercase tracking-wide" style={{ color: colors.text.muted }}>
        Leaf
      </div>
      {node.ctids?.map((c, i) => {
        const isMatch = c.key === searchEmail && searchState.phase === 'found';
        return (
          <motion.div
            key={i}
            className="flex justify-between items-center py-1 px-2 rounded mb-0.5 gap-1 relative"
            style={{
              background: isMatch ? `${colors.glow.healthy}40` : 'transparent',
              border: isMatch ? `1px solid ${colors.glow.healthy}` : '1px solid transparent',
            }}
            animate={isMatch ? {
              scale: [1, 1.08, 1],
              x: [0, -2, 2, -2, 2, 0], // Victory shake
            } : {}}
            transition={isMatch ? {
              scale: { repeat: 3, duration: 0.4 },
              x: { duration: 0.4, delay: 0.2 },
            } : undefined}
          >
            {/* Match celebration glow */}
            {isMatch && (
              <motion.div
                className="absolute inset-0 rounded"
                style={{ background: colors.glow.healthy }}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            <span
              className="truncate relative z-10"
              style={{
                color: isMatch ? colors.glow.healthy : colors.text.secondary,
                fontWeight: isMatch ? 'bold' : 'normal',
              }}
            >
              {c.key.split('@')[0]}@
            </span>
            <span
              className="whitespace-nowrap relative z-10"
              style={{
                color: isMatch ? colors.glow.healthy : colors.text.muted,
                fontWeight: isMatch ? 'bold' : 'normal',
              }}
            >
              {c.ctid}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
