import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';
import { pathwayMotion } from '../../config/animation';

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
  decisionText: string | null;
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
    decisionText: null,
  });

  const search = useCallback(async () => {
    const email = searchEmail.toLowerCase();
    const emailPrefix = email.split('@')[0] + '@';

    setSearchState({
      phase: 'searching',
      path: [],
      currentNode: 'root',
      foundCtid: null,
      pagesRead: 1,
      rejectedNodes: [],
      decisionText: 'Starting at root node...',
    });

    await delay(800);

    const path = ['root'];
    const rejected: string[] = [];
    let pagesRead = 1;

    let nextNode: TreeNode;
    let decisionText: string;

    if (email < 'charlie@') {
      nextNode = btree.children![0];
      path.push('left');
      rejected.push('middle', 'right');
      decisionText = `${emailPrefix} < charlie@? YES → go left`;
    } else if (email < 'mike@') {
      nextNode = btree.children![1];
      path.push('middle');
      rejected.push('left', 'right');
      decisionText = `${emailPrefix} < mike@? YES → go middle`;
    } else {
      nextNode = btree.children![2];
      path.push('right');
      rejected.push('left', 'middle');
      decisionText = `${emailPrefix} >= mike@? YES → go right`;
    }

    setSearchState((s) => ({
      ...s,
      path,
      currentNode: nextNode.id,
      pagesRead: ++pagesRead,
      rejectedNodes: rejected,
      decisionText,
    }));
    await delay(1000);

    let leafNode: TreeNode;
    if (nextNode.children) {
      const compareKey = nextNode.keys[0];
      if (email < compareKey) {
        leafNode = nextNode.children[0];
        rejected.push(nextNode.children[1].id);
        decisionText = `${emailPrefix} < ${compareKey}? YES → go left`;
      } else {
        leafNode = nextNode.children[1];
        rejected.push(nextNode.children[0].id);
        decisionText = `${emailPrefix} >= ${compareKey}? YES → go right`;
      }
      path.push(leafNode.id);
      setSearchState((s) => ({
        ...s,
        path,
        currentNode: leafNode.id,
        pagesRead: ++pagesRead,
        rejectedNodes: rejected,
        decisionText,
      }));
      await delay(1000);
    } else {
      leafNode = nextNode;
    }

    setSearchState((s) => ({ ...s, decisionText: 'Scanning leaf entries...' }));
    await delay(600);

    const found = leafNode.ctids?.find((c) => c.key === email);
    if (found) {
      setSearchState({
        phase: 'found',
        path,
        currentNode: leafNode.id,
        foundCtid: found.ctid,
        pagesRead,
        rejectedNodes: rejected,
        decisionText: `Found! ctid = ${found.ctid}`,
      });
    } else {
      setSearchState({
        phase: 'not-found',
        path,
        currentNode: leafNode.id,
        foundCtid: null,
        pagesRead,
        rejectedNodes: rejected,
        decisionText: 'Key not found in leaf',
      });
    }
  }, [searchEmail]);

  const reset = useCallback(() => {
    setSearchState({
      phase: 'idle',
      path: [],
      currentNode: null,
      foundCtid: null,
      pagesRead: 0,
      rejectedNodes: [],
      decisionText: null,
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
        {searchState.decisionText && (
          <motion.div
            className="mb-4 p-2 md:p-3 rounded-lg text-center font-mono text-xs md:text-sm"
            style={{
              background: searchState.phase === 'found'
                ? `${colors.glow.healthy}15`
                : `${colors.glow.warning}15`,
              border: `1px solid ${
                searchState.phase === 'found' ? colors.glow.healthy : colors.glow.warning
              }40`,
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: pathwayMotion.decisionText.duration }}
            key={searchState.decisionText}
          >
            <span
              style={{
                color: searchState.phase === 'found' ? colors.glow.healthy : colors.glow.warning,
              }}
            >
              {searchState.decisionText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* B-tree Visualization - Clean table-like structure */}
      <div className="py-4 overflow-x-auto">
        <div className="flex flex-col items-center" style={{ minWidth: '700px' }}>

          {/* LEVEL 0: Root Node */}
          <TreeNodeBox
            node={btree}
            isInPath={isInPath('root')}
            isCurrent={isCurrent('root')}
            isRejected={false}
          />

          {/* Vertical line from root */}
          <div
            className="w-0.5 h-5"
            style={{
              background: getLineColor('root'),
              boxShadow: getLineGlow('root'),
            }}
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
                    <div
                      className="h-0.5 flex-1"
                      style={{
                        background: isFirst ? 'transparent' : getLineColor(child.id),
                        boxShadow: isFirst ? 'none' : getLineGlow(child.id),
                      }}
                    />
                    {/* Vertical drop line */}
                    <div
                      className="w-0.5 h-full"
                      style={{
                        background: getLineColor(child.id),
                        boxShadow: getLineGlow(child.id),
                      }}
                    />
                    {/* Right half of horizontal segment */}
                    <div
                      className="h-0.5 flex-1"
                      style={{
                        background: isLast ? 'transparent' : getLineColor(btree.children![idx + 1]?.id || child.id),
                        boxShadow: isLast ? 'none' : getLineGlow(btree.children![idx + 1]?.id || child.id),
                      }}
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
                  <motion.div
                    className="w-0.5 h-4"
                    style={{
                      background: getLineColor(child.id),
                      boxShadow: getLineGlow(child.id),
                    }}
                    animate={{ opacity: isRejected(child.id) ? 0.3 : 1 }}
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
                              <div
                                className="h-0.5 flex-1"
                                style={{
                                  background: isFirstLeaf ? 'transparent' : getLineColor(leaf.id),
                                  boxShadow: isFirstLeaf ? 'none' : getLineGlow(leaf.id),
                                }}
                              />
                              <motion.div
                                className="w-0.5 h-full"
                                style={{
                                  background: getLineColor(leaf.id),
                                  boxShadow: getLineGlow(leaf.id),
                                }}
                                animate={{ opacity: isRejected(leaf.id) ? 0.3 : 1 }}
                              />
                              <div
                                className="h-0.5 flex-1"
                                style={{
                                  background: isLastLeaf ? 'transparent' : getLineColor(child.children![leafIdx + 1]?.id || leaf.id),
                                  boxShadow: isLastLeaf ? 'none' : getLineGlow(child.children![leafIdx + 1]?.id || leaf.id),
                                }}
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
      className="px-4 py-2 rounded-lg text-xs md:text-sm font-mono text-center"
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
        boxShadow: isCurrent ? `0 0 12px ${colors.glow.healthy}60` : 'none',
      }}
      animate={{
        opacity: isRejected ? pathwayMotion.pathwayDim.opacity : 1,
        scale: isCurrent ? [1, 1.02, 1] : isRejected ? 0.98 : 1,
      }}
      transition={{
        duration: 0.3,
        scale: isCurrent ? { repeat: Infinity, duration: 1 } : undefined,
      }}
    >
      <div className="text-[10px] md:text-xs mb-0.5" style={{ color: colors.text.muted }}>
        {node.id === 'root' ? 'Root' : 'Node'}
      </div>
      <div style={{ color: colors.text.primary }}>
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
      className="px-2 py-2 rounded-lg text-[10px] md:text-xs font-mono w-full mx-1"
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
        boxShadow: isCurrent ? `0 0 12px ${colors.glow.healthy}60` : 'none',
      }}
      animate={{
        opacity: isRejected ? pathwayMotion.pathwayDim.opacity : 1,
        scale: isCurrent ? [1, 1.02, 1] : isRejected ? 0.98 : 1,
      }}
      transition={{
        duration: 0.3,
        scale: isCurrent ? { repeat: Infinity, duration: 1 } : undefined,
      }}
    >
      <div className="text-center mb-1" style={{ color: colors.text.muted }}>Leaf</div>
      {node.ctids?.map((c, i) => {
        const isMatch = c.key === searchEmail && searchState.phase === 'found';
        return (
          <motion.div
            key={i}
            className="flex justify-between items-center py-0.5 px-1 rounded mb-0.5 gap-1"
            style={{ background: isMatch ? `${colors.glow.healthy}30` : 'transparent' }}
            animate={isMatch ? { scale: [1, 1.05, 1] } : {}}
            transition={isMatch ? { repeat: 2, duration: 0.3 } : undefined}
          >
            <span
              className="truncate"
              style={{ color: isMatch ? colors.glow.healthy : colors.text.secondary }}
            >
              {c.key.split('@')[0]}@
            </span>
            <span className="whitespace-nowrap" style={{ color: isMatch ? colors.glow.healthy : colors.text.muted }}>
              {c.ctid}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
