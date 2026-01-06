import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { colors } from '../../config/theme';
import { btreeNavigation } from '../../config/animation';
import { delay, isAbortError } from '../../lib/utils';

const TIMING = btreeNavigation.timing;

interface TreeNode {
  id: string;
  keys: string[];
  children?: TreeNode[];
  isLeaf?: boolean;
  ctids?: { key: string; ctid: string }[];
}

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
  decisionQuestion: string | null;
  decisionAnswer: string | null;
  searchSpace: number;
  showingQuestion: boolean;
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
    showingQuestion: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const search = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const email = searchEmail.toLowerCase();
      const emailPrefix = email.split('@')[0] + '@';

      const showDecision = async (question: string, answer: string, newSpace: number) => {
        setSearchState((s) => ({
          ...s,
          decisionQuestion: question,
          decisionAnswer: null,
          showingQuestion: true,
        }));
        await delay(TIMING.questionReveal, signal);

        setSearchState((s) => ({
          ...s,
          decisionAnswer: answer,
          showingQuestion: false,
          searchSpace: newSpace,
        }));
        await delay(TIMING.answerReveal, signal);
      };

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

      await showDecision(question, answer, 4);

      setSearchState((s) => ({
        ...s,
        rejectedNodes: rejected,
      }));
      await delay(TIMING.signalTravel, signal);

      setSearchState((s) => ({
        ...s,
        path,
        currentNode: nextNode.id,
        pagesRead: ++pagesRead,
      }));
      await delay(TIMING.nodeInspection, signal);

      let leafNode: TreeNode;
      if (nextNode.children) {
        const compareKey = nextNode.keys[0];

        if (email < compareKey) {
          leafNode = nextNode.children[0];
          rejected.push(nextNode.children[1].id);
          question = `Is '${emailPrefix}' < '${compareKey}' ?`;
          answer = 'YES → GO LEFT';
        } else {
          leafNode = nextNode.children[1];
          rejected.push(nextNode.children[0].id);
          question = `Is '${emailPrefix}' >= '${compareKey}' ?`;
          answer = 'YES → GO RIGHT';
        }

        await showDecision(question, answer, 2);

        setSearchState((s) => ({
          ...s,
          rejectedNodes: rejected,
        }));
        await delay(TIMING.signalTravel, signal);

        path.push(leafNode.id);
        setSearchState((s) => ({
          ...s,
          path,
          currentNode: leafNode.id,
          pagesRead: ++pagesRead,
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
          showingQuestion: false,
        });

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
          showingQuestion: false,
        });
      }
    } catch (e) {
      if (!isAbortError(e)) throw e;
    }
  }, [searchEmail]);

  const reset = useCallback(() => {
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
      showingQuestion: false,
    });
  }, []);

  const isInPath = (nodeId: string) => searchState.path.includes(nodeId);
  const isCurrent = (nodeId: string) => searchState.currentNode === nodeId;
  const isRejected = (nodeId: string) => searchState.rejectedNodes.includes(nodeId);

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

      {/* Decision Text Banner */}
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
            }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
            key={`${searchState.decisionQuestion}-${searchState.decisionAnswer}`}
          >
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

      {/* Search Space Counter */}
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
                  className="font-mono font-black text-4xl md:text-5xl px-6 py-3 rounded-2xl"
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
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {searchState.searchSpace}
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

      {/* B-tree Visualization - Div-based lines (naturally align with flex) */}
      <div className="py-4 relative">
        {/* Mobile scroll indicators */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-20 md:hidden"
          style={{ background: `linear-gradient(to right, ${colors.oceanDark}, transparent)` }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-20 md:hidden"
          style={{ background: `linear-gradient(to left, ${colors.oceanDark}, transparent)` }}
        />

        <div className="overflow-x-auto">
          <div className="relative flex flex-col items-center" style={{ minWidth: '700px' }}>
            {/* LEVEL 0: Root Node */}
            <TreeNodeBox
              node={btree}
              isInPath={isInPath('root')}
              isCurrent={isCurrent('root')}
              isRejected={false}
            />

            {/* Vertical line from root */}
            <ConnectorLine
              isActive={isInPath('root')}
              isRejected={false}
              className="w-0.5 h-5"
            />

            {/* LEVEL 1: Internal Nodes with horizontal connector */}
            <div className="flex w-full justify-center">
              {btree.children!.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === btree.children!.length - 1;

                return (
                  <div key={child.id} className="flex flex-col items-center" style={{ flex: '1', maxWidth: '280px' }}>
                    {/* Horizontal line segment + vertical drop */}
                    <div className="flex w-full h-5">
                      {/* Left half of horizontal segment */}
                      <ConnectorLine
                        isActive={isInPath(child.id)}
                        isRejected={isRejected(child.id)}
                        className="h-0.5 flex-1"
                        style={{ visibility: isFirst ? 'hidden' : 'visible' }}
                      />
                      {/* Vertical drop line */}
                      <ConnectorLine
                        isActive={isInPath(child.id)}
                        isRejected={isRejected(child.id)}
                        className="w-0.5 h-full"
                      />
                      {/* Right half of horizontal segment */}
                      <ConnectorLine
                        isActive={isInPath(btree.children![idx + 1]?.id) || isInPath(child.id)}
                        isRejected={isRejected(btree.children![idx + 1]?.id || child.id)}
                        className="h-0.5 flex-1"
                        style={{ visibility: isLast ? 'hidden' : 'visible' }}
                      />
                    </div>

                    {/* Internal Node */}
                    <TreeNodeBox
                      node={child}
                      isInPath={isInPath(child.id)}
                      isCurrent={isCurrent(child.id)}
                      isRejected={isRejected(child.id)}
                    />

                    {/* Vertical line from internal node to leaves */}
                    <ConnectorLine
                      isActive={isInPath(child.id)}
                      isRejected={isRejected(child.id)}
                      className="w-0.5 h-4"
                    />

                    {/* LEVEL 2: Leaf Nodes with horizontal connector */}
                    {child.children && (
                      <div className="flex w-full">
                        {child.children.map((leaf, leafIdx) => {
                          const isFirstLeaf = leafIdx === 0;
                          const isLastLeaf = leafIdx === child.children!.length - 1;

                          return (
                            <div key={leaf.id} className="flex-1 flex flex-col items-center">
                              {/* Horizontal segment + vertical drop */}
                              <div className="flex w-full h-4">
                                <ConnectorLine
                                  isActive={isInPath(leaf.id)}
                                  isRejected={isRejected(leaf.id)}
                                  className="h-0.5 flex-1"
                                  style={{ visibility: isFirstLeaf ? 'hidden' : 'visible' }}
                                />
                                <ConnectorLine
                                  isActive={isInPath(leaf.id)}
                                  isRejected={isRejected(leaf.id)}
                                  className="w-0.5 h-full"
                                />
                                <ConnectorLine
                                  isActive={isInPath(child.children![leafIdx + 1]?.id) || isInPath(leaf.id)}
                                  isRejected={isRejected(child.children![leafIdx + 1]?.id || leaf.id)}
                                  className="h-0.5 flex-1"
                                  style={{ visibility: isLastLeaf ? 'hidden' : 'visible' }}
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

// Connector line component - animates via CSS filter, no overlays
function ConnectorLine({
  isActive,
  isRejected,
  className,
  style,
}: {
  isActive: boolean;
  isRejected: boolean;
  className: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{
        background: colors.text.muted + '40',
        filter: 'brightness(1)',
      }}
      animate={{
        background: isActive
          ? colors.glow.healthy
          : isRejected
          ? colors.text.muted + '15'
          : colors.text.muted + '40',
        filter: isActive
          ? `brightness(1.3) drop-shadow(0 0 4px ${colors.glow.healthy})`
          : 'brightness(1)',
        opacity: isRejected ? 0.3 : 1,
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    />
  );
}

// Node box - glows via CSS filter, no overlay pulse rings
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
      className="px-4 py-2 rounded-lg text-xs md:text-sm font-mono text-center"
      style={{
        background: colors.ocean,
        borderWidth: 2,
        borderStyle: 'solid',
      }}
      initial={{
        borderColor: colors.text.muted + '40',
        filter: 'brightness(1)',
      }}
      animate={{
        borderColor: isCurrent
          ? colors.glow.healthy
          : isInPath
          ? colors.glow.healthy + '80'
          : colors.text.muted + '40',
        background: isCurrent
          ? `${colors.glow.healthy}15`
          : isInPath
          ? colors.oceanLight
          : colors.ocean,
        filter: isCurrent
          ? [
              `brightness(1.1) drop-shadow(0 0 8px ${colors.glow.healthy})`,
              `brightness(1.25) drop-shadow(0 0 14px ${colors.glow.healthy})`,
              `brightness(1.1) drop-shadow(0 0 8px ${colors.glow.healthy})`,
            ]
          : isInPath
          ? `brightness(1.05) drop-shadow(0 0 6px ${colors.glow.healthy}60)`
          : 'brightness(1)',
        opacity: isRejected ? 0.25 : 1,
        scale: isCurrent ? 1.05 : isRejected ? 0.95 : 1,
      }}
      transition={{
        filter: isCurrent
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.4 },
        borderColor: { duration: 0.4 },
        background: { duration: 0.4 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.3, ease: 'easeOut' },
      }}
    >
      <div className="text-[10px] md:text-xs mb-0.5" style={{ color: colors.text.muted }}>
        {node.id === 'root' ? 'ROOT' : 'NODE'}
      </div>
      <motion.div
        animate={{ color: isCurrent ? colors.glow.healthy : colors.text.primary }}
        transition={{ duration: 0.3 }}
      >
        {node.keys.map((k, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: colors.text.muted }}> | </span>}
            {k}
          </span>
        ))}
      </motion.div>
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
      className="px-2 py-2 rounded-lg text-[10px] md:text-xs font-mono w-full mx-1"
      style={{
        background: colors.ocean,
        borderWidth: 2,
        borderStyle: 'solid',
      }}
      initial={{
        borderColor: colors.text.muted + '40',
        filter: 'brightness(1)',
      }}
      animate={{
        borderColor: isCurrent
          ? colors.glow.healthy
          : isInPath
          ? colors.glow.healthy + '80'
          : colors.text.muted + '40',
        background: isCurrent
          ? `${colors.glow.healthy}15`
          : isInPath
          ? colors.oceanLight
          : colors.ocean,
        filter: isCurrent
          ? [
              `brightness(1.1) drop-shadow(0 0 8px ${colors.glow.healthy})`,
              `brightness(1.25) drop-shadow(0 0 14px ${colors.glow.healthy})`,
              `brightness(1.1) drop-shadow(0 0 8px ${colors.glow.healthy})`,
            ]
          : isInPath
          ? `brightness(1.05) drop-shadow(0 0 6px ${colors.glow.healthy}60)`
          : 'brightness(1)',
        opacity: isRejected ? 0.25 : 1,
        scale: isCurrent ? 1.02 : isRejected ? 0.95 : 1,
      }}
      transition={{
        filter: isCurrent
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.4 },
        borderColor: { duration: 0.4 },
        background: { duration: 0.4 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.3, ease: 'easeOut' },
      }}
    >
      <div className="text-center mb-1 uppercase tracking-wide" style={{ color: colors.text.muted }}>
        Leaf
      </div>
      {node.ctids?.map((c, i) => {
        const isMatch = c.key === searchEmail && searchState.phase === 'found';
        return (
          <motion.div
            key={i}
            className="flex justify-between items-center py-1 px-2 rounded mb-0.5 gap-1"
            initial={{ background: 'transparent' }}
            animate={{
              background: isMatch ? `${colors.glow.healthy}30` : 'transparent',
              scale: isMatch ? [1, 1.05, 1] : 1,
            }}
            transition={{
              background: { duration: 0.3 },
              scale: isMatch ? { duration: 0.4, repeat: 2 } : { duration: 0 },
            }}
            style={{
              border: isMatch ? `1px solid ${colors.glow.healthy}` : '1px solid transparent',
            }}
          >
            <motion.span
              className="truncate"
              animate={{
                color: isMatch ? colors.glow.healthy : colors.text.secondary,
                fontWeight: isMatch ? 700 : 400,
              }}
              transition={{ duration: 0.3 }}
            >
              {c.key.split('@')[0]}@
            </motion.span>
            <motion.span
              className="whitespace-nowrap"
              animate={{
                color: isMatch ? colors.glow.healthy : colors.text.muted,
                fontWeight: isMatch ? 700 : 400,
              }}
              transition={{ duration: 0.3 }}
            >
              {c.ctid}
            </motion.span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
