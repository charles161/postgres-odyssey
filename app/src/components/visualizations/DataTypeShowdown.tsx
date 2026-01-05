import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

type DataTypeCategory = 'timestamps' | 'money' | 'text' | 'ids';

interface Comparison {
  bad: {
    type: string;
    example: string;
    problem: string;
  };
  good: {
    type: string;
    example: string;
    benefit: string;
  };
  demo?: React.ReactNode;
}

const comparisons: Record<DataTypeCategory, Comparison> = {
  timestamps: {
    bad: {
      type: 'TIMESTAMP',
      example: "created_at TIMESTAMP DEFAULT now()",
      problem: 'Stores time without timezone. When your server moves from US-East to EU, all your times shift by 5 hours.',
    },
    good: {
      type: 'TIMESTAMPTZ',
      example: "created_at TIMESTAMPTZ DEFAULT now()",
      benefit: 'Stores time in UTC internally, converts to local timezone on display. Server location never matters.',
    },
  },
  money: {
    bad: {
      type: 'FLOAT / DECIMAL',
      example: "price DECIMAL(10, 2)",
      problem: '0.1 + 0.2 = 0.30000000000000004. Floating point errors compound into real money.',
    },
    good: {
      type: 'INTEGER (cents)',
      example: "price_cents INTEGER NOT NULL",
      benefit: '$19.99 stored as 1999. No floating point errors. Division/multiplication stays precise.',
    },
  },
  text: {
    bad: {
      type: 'VARCHAR(255)',
      example: "name VARCHAR(255)",
      problem: 'A cargo-cult from MySQL. In Postgres, VARCHAR(n) has NO performance benefit over TEXT.',
    },
    good: {
      type: 'TEXT + CHECK',
      example: "name TEXT CHECK (char_length(name) <= 255)",
      benefit: 'Same constraint, but easier to change. No migration needed to increase limit.',
    },
  },
  ids: {
    bad: {
      type: 'SERIAL',
      example: "id SERIAL PRIMARY KEY",
      problem: '/users/1, /users/2, /users/3... Attackers enumerate your entire user base.',
    },
    good: {
      type: 'UUID',
      example: "id UUID DEFAULT gen_random_uuid()",
      benefit: 'Unpredictable. Safe in URLs. Works across distributed systems. No sequence contention.',
    },
  },
};

const categoryLabels: Record<DataTypeCategory, string> = {
  timestamps: 'Timestamps',
  money: 'Money',
  text: 'Text',
  ids: 'IDs',
};

function TimestampDemo() {
  const [serverLocation, setServerLocation] = useState<'us-east' | 'eu-west'>('us-east');
  const baseTime = new Date('2025-01-03T14:30:00Z');

  const usEastTime = new Date(baseTime.getTime() - 5 * 60 * 60 * 1000);
  const euWestTime = new Date(baseTime.getTime());

  const timestampDisplay = serverLocation === 'us-east'
    ? usEastTime.toISOString().replace('T', ' ').slice(0, 19)
    : euWestTime.toISOString().replace('T', ' ').slice(0, 19);

  return (
    <div className="mt-4 p-4 rounded-lg" style={{ background: colors.oceanDark }}>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm" style={{ color: colors.text.muted }}>Server location:</span>
        <div className="flex gap-2">
          {(['us-east', 'eu-west'] as const).map((loc) => (
            <button
              key={loc}
              className="px-3 py-1 rounded text-xs font-mono transition-colors"
              style={{
                background: serverLocation === loc ? colors.glow.critical + '30' : 'transparent',
                color: serverLocation === loc ? colors.glow.critical : colors.text.muted,
                border: `1px solid ${serverLocation === loc ? colors.glow.critical : colors.text.muted}40`,
              }}
              onClick={() => setServerLocation(loc)}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded" style={{ background: colors.glow.critical + '10' }}>
          <div className="text-xs font-mono mb-1" style={{ color: colors.glow.critical }}>TIMESTAMP</div>
          <div className="font-mono text-sm" style={{ color: colors.text.primary }}>{timestampDisplay}</div>
          <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
            {serverLocation === 'eu-west' ? 'Shifted +5 hours!' : 'Looks correct... for now'}
          </div>
        </div>
        <div className="p-3 rounded" style={{ background: colors.glow.healthy + '10' }}>
          <div className="text-xs font-mono mb-1" style={{ color: colors.glow.healthy }}>TIMESTAMPTZ</div>
          <div className="font-mono text-sm" style={{ color: colors.text.primary }}>2025-01-03 14:30:00+00</div>
          <div className="text-xs mt-1" style={{ color: colors.text.muted }}>Always UTC. Always correct.</div>
        </div>
      </div>
    </div>
  );
}

function MoneyDemo() {
  const [operations, setOperations] = useState(0);
  const floatResult = Array(operations).fill(0.1).reduce((a, b) => a + b, 0);
  const intResult = operations * 10;

  return (
    <div className="mt-4 p-4 rounded-lg" style={{ background: colors.oceanDark }}>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm" style={{ color: colors.text.muted }}>Add $0.10:</span>
        <button
          className="px-3 py-1 rounded text-xs font-mono transition-colors"
          style={{
            background: colors.glow.healthy + '30',
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
          onClick={() => setOperations(o => o + 1)}
        >
          + Add
        </button>
        <button
          className="px-3 py-1 rounded text-xs font-mono transition-colors"
          style={{
            background: colors.text.muted + '20',
            color: colors.text.muted,
            border: `1px solid ${colors.text.muted}40`,
          }}
          onClick={() => setOperations(0)}
        >
          Reset
        </button>
        <span className="text-sm font-mono" style={{ color: colors.text.secondary }}>
          ({operations} operations)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded" style={{ background: colors.glow.critical + '10' }}>
          <div className="text-xs font-mono mb-1" style={{ color: colors.glow.critical }}>FLOAT</div>
          <div className="font-mono text-sm" style={{ color: colors.text.primary }}>
            ${floatResult.toFixed(14)}
          </div>
          {operations > 0 && floatResult !== operations * 0.1 && (
            <div className="text-xs mt-1" style={{ color: colors.glow.critical }}>
              Error: {(floatResult - operations * 0.1).toFixed(14)}
            </div>
          )}
        </div>
        <div className="p-3 rounded" style={{ background: colors.glow.healthy + '10' }}>
          <div className="text-xs font-mono mb-1" style={{ color: colors.glow.healthy }}>INTEGER (cents)</div>
          <div className="font-mono text-sm" style={{ color: colors.text.primary }}>
            {intResult} cents = ${(intResult / 100).toFixed(2)}
          </div>
          <div className="text-xs mt-1" style={{ color: colors.glow.healthy }}>
            Always exact
          </div>
        </div>
      </div>
    </div>
  );
}

function IdDemo() {
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="mt-4 p-4 rounded-lg" style={{ background: colors.oceanDark }}>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm" style={{ color: colors.text.muted }}>Create user:</span>
        <button
          className="px-3 py-1 rounded text-xs font-mono transition-colors"
          style={{
            background: colors.glow.healthy + '30',
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
          onClick={() => setClickCount(c => c + 1)}
        >
          + Create
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded" style={{ background: colors.glow.critical + '10' }}>
          <div className="text-xs font-mono mb-1" style={{ color: colors.glow.critical }}>SERIAL</div>
          <div className="font-mono text-sm" style={{ color: colors.text.primary }}>
            /users/{clickCount + 1}
          </div>
          <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
            Attacker knows: {clickCount + 1} users exist
          </div>
        </div>
        <div className="p-3 rounded" style={{ background: colors.glow.healthy + '10' }}>
          <div className="text-xs font-mono mb-1" style={{ color: colors.glow.healthy }}>UUID</div>
          <div className="font-mono text-sm break-all" style={{ color: colors.text.primary }}>
            /users/{crypto.randomUUID().slice(0, 8)}...
          </div>
          <div className="text-xs mt-1" style={{ color: colors.glow.healthy }}>
            Unpredictable. Unguessable.
          </div>
        </div>
      </div>
    </div>
  );
}

export function DataTypeShowdown() {
  const [activeCategory, setActiveCategory] = useState<DataTypeCategory>('timestamps');
  const comparison = comparisons[activeCategory];

  return (
    <div className="w-full">
      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(comparisons) as DataTypeCategory[]).map((category) => (
          <button
            key={category}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeCategory === category ? colors.glow.healthy + '20' : 'transparent',
              color: activeCategory === category ? colors.glow.healthy : colors.text.muted,
              border: `1px solid ${activeCategory === category ? colors.glow.healthy : colors.text.muted}40`,
            }}
            onClick={() => setActiveCategory(category)}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Comparison display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bad choice */}
            <div
              className="p-6 rounded-xl relative overflow-hidden"
              style={{
                background: colors.oceanLight,
                border: `1px solid ${colors.glow.critical}30`,
              }}
            >
              <div
                className="absolute top-0 right-0 px-3 py-1 text-xs font-mono rounded-bl"
                style={{ background: colors.glow.critical + '20', color: colors.glow.critical }}
              >
                AVOID
              </div>

              <h4 className="text-lg font-semibold mb-3" style={{ color: colors.glow.critical }}>
                {comparison.bad.type}
              </h4>

              <pre
                className="text-sm font-mono p-3 rounded mb-4 overflow-x-auto"
                style={{ background: colors.oceanDark, color: colors.text.secondary }}
              >
                {comparison.bad.example}
              </pre>

              <p className="text-sm leading-relaxed" style={{ color: colors.text.muted }}>
                {comparison.bad.problem}
              </p>
            </div>

            {/* Good choice */}
            <div
              className="p-6 rounded-xl relative overflow-hidden"
              style={{
                background: colors.oceanLight,
                border: `1px solid ${colors.glow.healthy}30`,
              }}
            >
              <div
                className="absolute top-0 right-0 px-3 py-1 text-xs font-mono rounded-bl"
                style={{ background: colors.glow.healthy + '20', color: colors.glow.healthy }}
              >
                USE THIS
              </div>

              <h4 className="text-lg font-semibold mb-3" style={{ color: colors.glow.healthy }}>
                {comparison.good.type}
              </h4>

              <pre
                className="text-sm font-mono p-3 rounded mb-4 overflow-x-auto"
                style={{ background: colors.oceanDark, color: colors.text.secondary }}
              >
                {comparison.good.example}
              </pre>

              <p className="text-sm leading-relaxed" style={{ color: colors.text.muted }}>
                {comparison.good.benefit}
              </p>
            </div>
          </div>

          {/* Interactive demos */}
          {activeCategory === 'timestamps' && <TimestampDemo />}
          {activeCategory === 'money' && <MoneyDemo />}
          {activeCategory === 'ids' && <IdDemo />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
