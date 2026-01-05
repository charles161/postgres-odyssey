import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

type ConstraintType = 'not_null' | 'check' | 'unique' | 'foreign_key';

interface ConstraintInfo {
  name: string;
  description: string;
  example: string;
  withoutConstraint: string;
  withConstraint: string;
}

const constraints: Record<ConstraintType, ConstraintInfo> = {
  not_null: {
    name: 'NOT NULL',
    description: 'Nullable columns are a code smell. If a value should always exist, enforce it.',
    example: 'email TEXT NOT NULL',
    withoutConstraint: 'Application bug sets email = NULL. Silent corruption.',
    withConstraint: 'INSERT fails. Bug discovered immediately.',
  },
  check: {
    name: 'CHECK',
    description: 'Business rules belong in the database. When your app has a bug, the database rejects bad data.',
    example: "status TEXT CHECK (status IN ('draft', 'sent', 'paid'))",
    withoutConstraint: 'status = "PAID" (wrong case), "pending" (invalid state), "" (empty string)',
    withConstraint: 'Only valid statuses accepted. Typos rejected.',
  },
  unique: {
    name: 'UNIQUE',
    description: 'Creates an index automatically. Essential for preventing duplicate records.',
    example: 'UNIQUE(tenant_id, invoice_number)',
    withoutConstraint: 'Race condition: two requests create invoice #1001 simultaneously.',
    withConstraint: 'Second INSERT fails. No duplicates ever.',
  },
  foreign_key: {
    name: 'FOREIGN KEY',
    description: 'Referential integrity. Prevent orphaned records and broken relationships.',
    example: 'user_id UUID REFERENCES users(id) ON DELETE CASCADE',
    withoutConstraint: 'DELETE user, invoices point to non-existent user_id. Queries break.',
    withConstraint: 'DELETE user cascades to invoices. Or RESTRICT prevents deletion.',
  },
};

interface SimulationState {
  step: 'idle' | 'inserting' | 'success' | 'rejected';
  message: string;
}

function NotNullDemo() {
  const [withConstraint, setWithConstraint] = useState(true);
  const [state, setState] = useState<SimulationState>({ step: 'idle', message: '' });

  const simulateInsert = () => {
    setState({ step: 'inserting', message: 'INSERT INTO users (email) VALUES (NULL)...' });

    setTimeout(() => {
      if (withConstraint) {
        setState({
          step: 'rejected',
          message: 'ERROR: null value in column "email" violates not-null constraint',
        });
      } else {
        setState({
          step: 'success',
          message: 'INSERT 0 1 (1 row affected) - NULL stored silently',
        });
      }
    }, 800);
  };

  return (
    <div className="mt-4 p-4 rounded-lg" style={{ background: colors.oceanDark }}>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm" style={{ color: colors.text.muted }}>Constraint:</span>
        <button
          className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer`}
          style={{
            background: withConstraint ? colors.glow.healthy + '30' : colors.glow.critical + '30',
            color: withConstraint ? colors.glow.healthy : colors.glow.critical,
            border: `1px solid ${withConstraint ? colors.glow.healthy : colors.glow.critical}40`,
          }}
          onClick={() => {
            setWithConstraint(!withConstraint);
            setState({ step: 'idle', message: '' });
          }}
        >
          {withConstraint ? 'NOT NULL enabled' : 'NOT NULL disabled'}
        </button>
        <button
          className="px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer"
          style={{
            background: colors.text.muted + '20',
            color: colors.text.secondary,
            border: `1px solid ${colors.text.muted}40`,
          }}
          onClick={simulateInsert}
        >
          Try INSERT NULL
        </button>
      </div>

      <AnimatePresence mode="wait">
        {state.step !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded font-mono text-sm"
            style={{
              background: state.step === 'rejected' ? colors.glow.critical + '10' : colors.glow.healthy + '10',
              color: state.step === 'rejected' ? colors.glow.critical : colors.glow.healthy,
            }}
          >
            {state.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckDemo() {
  const [withConstraint, setWithConstraint] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [state, setState] = useState<SimulationState>({ step: 'idle', message: '' });

  const validStatuses = ['draft', 'sent', 'paid'];

  const simulateInsert = () => {
    if (!inputValue) return;

    setState({ step: 'inserting', message: `INSERT INTO invoices (status) VALUES ('${inputValue}')...` });

    setTimeout(() => {
      if (withConstraint && !validStatuses.includes(inputValue.toLowerCase())) {
        setState({
          step: 'rejected',
          message: `ERROR: new row violates check constraint "invoices_status_check"`,
        });
      } else {
        setState({
          step: 'success',
          message: `INSERT 0 1 - Stored "${inputValue}" ${!validStatuses.includes(inputValue.toLowerCase()) ? '(but is this valid?)' : ''}`,
        });
      }
    }, 800);
  };

  return (
    <div className="mt-4 p-4 rounded-lg" style={{ background: colors.oceanDark }}>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <span className="text-sm" style={{ color: colors.text.muted }}>Constraint:</span>
        <button
          className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer`}
          style={{
            background: withConstraint ? colors.glow.healthy + '30' : colors.glow.critical + '30',
            color: withConstraint ? colors.glow.healthy : colors.glow.critical,
            border: `1px solid ${withConstraint ? colors.glow.healthy : colors.glow.critical}40`,
          }}
          onClick={() => {
            setWithConstraint(!withConstraint);
            setState({ step: 'idle', message: '' });
          }}
        >
          {withConstraint ? 'CHECK enabled' : 'CHECK disabled'}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Try: PAID, pending, invalid..."
          className="flex-1 px-3 py-2 rounded text-sm font-mono"
          style={{
            background: colors.oceanLight,
            color: colors.text.primary,
            border: `1px solid ${colors.text.muted}40`,
          }}
        />
        <button
          className="px-4 py-2 rounded text-sm font-mono transition-colors cursor-pointer"
          style={{
            background: colors.text.muted + '20',
            color: colors.text.secondary,
            border: `1px solid ${colors.text.muted}40`,
          }}
          onClick={simulateInsert}
        >
          INSERT
        </button>
      </div>

      <div className="text-xs mb-4" style={{ color: colors.text.muted }}>
        Valid values: {validStatuses.map((s) => `'${s}'`).join(', ')}
      </div>

      <AnimatePresence mode="wait">
        {state.step !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded font-mono text-sm"
            style={{
              background: state.step === 'rejected' ? colors.glow.critical + '10' : colors.glow.healthy + '10',
              color: state.step === 'rejected' ? colors.glow.critical : colors.glow.healthy,
            }}
          >
            {state.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UniqueDemo() {
  const [state, setState] = useState<{ invoices: string[]; error: string | null }>({
    invoices: ['INV-1001'],
    error: null,
  });

  const simulateRaceCondition = () => {
    setState((prev) => ({ ...prev, error: null }));

    // Simulate two concurrent inserts
    setTimeout(() => {
      setState((prev) => ({
        invoices: [...prev.invoices, 'INV-1002'],
        error: null,
      }));
    }, 200);

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        error: 'ERROR: duplicate key value violates unique constraint "invoices_number_key"',
      }));
    }, 400);
  };

  return (
    <div className="mt-4 p-4 rounded-lg" style={{ background: colors.oceanDark }}>
      <div className="flex items-center gap-4 mb-4">
        <button
          className="px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer"
          style={{
            background: colors.text.muted + '20',
            color: colors.text.secondary,
            border: `1px solid ${colors.text.muted}40`,
          }}
          onClick={simulateRaceCondition}
        >
          Simulate Race Condition (2 concurrent INSERTs)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-mono mb-2" style={{ color: colors.text.muted }}>
            Existing invoices:
          </div>
          <div className="space-y-1">
            {state.invoices.map((inv, i) => (
              <div
                key={i}
                className="px-2 py-1 rounded text-sm font-mono"
                style={{ background: colors.glow.healthy + '10', color: colors.glow.healthy }}
              >
                {inv}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-mono mb-2" style={{ color: colors.text.muted }}>
            Second concurrent INSERT:
          </div>
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2 rounded text-xs font-mono"
              style={{ background: colors.glow.critical + '10', color: colors.glow.critical }}
            >
              {state.error}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ForeignKeyDemo() {
  const [onDelete, setOnDelete] = useState<'cascade' | 'restrict' | 'set_null'>('cascade');
  const [state, setState] = useState<{
    users: { id: string; name: string }[];
    invoices: { id: string; userId: string | null; number: string }[];
    message: string | null;
  }>({
    users: [{ id: 'u1', name: 'Alice' }],
    invoices: [
      { id: 'i1', userId: 'u1', number: 'INV-001' },
      { id: 'i2', userId: 'u1', number: 'INV-002' },
    ],
    message: null,
  });

  const deleteUser = () => {
    setState((prev) => ({ ...prev, message: null }));

    setTimeout(() => {
      if (onDelete === 'cascade') {
        setState({
          users: [],
          invoices: [],
          message: 'DELETE 1 (user and all invoices deleted)',
        });
      } else if (onDelete === 'restrict') {
        setState((prev) => ({
          ...prev,
          message: 'ERROR: update or delete on table "users" violates foreign key constraint',
        }));
      } else {
        setState((prev) => ({
          users: [],
          invoices: prev.invoices.map((inv) => ({ ...inv, userId: null })),
          message: 'DELETE 1 (user deleted, invoice.user_id set to NULL)',
        }));
      }
    }, 500);
  };

  const reset = () => {
    setState({
      users: [{ id: 'u1', name: 'Alice' }],
      invoices: [
        { id: 'i1', userId: 'u1', number: 'INV-001' },
        { id: 'i2', userId: 'u1', number: 'INV-002' },
      ],
      message: null,
    });
  };

  return (
    <div className="mt-4 p-4 rounded-lg" style={{ background: colors.oceanDark }}>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <span className="text-sm" style={{ color: colors.text.muted }}>ON DELETE:</span>
        {(['cascade', 'restrict', 'set_null'] as const).map((mode) => (
          <button
            key={mode}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer`}
            style={{
              background: onDelete === mode ? colors.glow.healthy + '30' : 'transparent',
              color: onDelete === mode ? colors.glow.healthy : colors.text.muted,
              border: `1px solid ${onDelete === mode ? colors.glow.healthy : colors.text.muted}40`,
            }}
            onClick={() => {
              setOnDelete(mode);
              reset();
            }}
          >
            {mode.toUpperCase().replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs font-mono mb-2" style={{ color: colors.text.muted }}>
            users:
          </div>
          <div className="space-y-1">
            {state.users.length === 0 ? (
              <div className="text-xs" style={{ color: colors.text.muted }}>
                (empty)
              </div>
            ) : (
              state.users.map((u) => (
                <div
                  key={u.id}
                  className="px-2 py-1 rounded text-sm font-mono"
                  style={{ background: colors.glow.healthy + '10', color: colors.glow.healthy }}
                >
                  {u.id}: {u.name}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="text-xs font-mono mb-2" style={{ color: colors.text.muted }}>
            invoices:
          </div>
          <div className="space-y-1">
            {state.invoices.length === 0 ? (
              <div className="text-xs" style={{ color: colors.text.muted }}>
                (empty)
              </div>
            ) : (
              state.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="px-2 py-1 rounded text-sm font-mono"
                  style={{
                    background: inv.userId ? colors.glow.warning + '10' : colors.glow.critical + '10',
                    color: inv.userId ? colors.glow.warning : colors.glow.critical,
                  }}
                >
                  {inv.number} (user_id: {inv.userId || 'NULL'})
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer"
          style={{
            background: colors.glow.critical + '20',
            color: colors.glow.critical,
            border: `1px solid ${colors.glow.critical}40`,
          }}
          onClick={deleteUser}
          disabled={state.users.length === 0}
        >
          DELETE FROM users WHERE id = 'u1'
        </button>
        <button
          className="px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer"
          style={{
            background: colors.text.muted + '20',
            color: colors.text.muted,
            border: `1px solid ${colors.text.muted}40`,
          }}
          onClick={reset}
        >
          Reset
        </button>
      </div>

      {state.message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded font-mono text-sm"
          style={{
            background: state.message.includes('ERROR') ? colors.glow.critical + '10' : colors.glow.healthy + '10',
            color: state.message.includes('ERROR') ? colors.glow.critical : colors.glow.healthy,
          }}
        >
          {state.message}
        </motion.div>
      )}
    </div>
  );
}

export function ConstraintDefense() {
  const [activeConstraint, setActiveConstraint] = useState<ConstraintType>('not_null');
  const constraint = constraints[activeConstraint];

  return (
    <div className="w-full">
      {/* Constraint tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(constraints) as ConstraintType[]).map((type) => (
          <button
            key={type}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background: activeConstraint === type ? colors.glow.healthy + '20' : 'transparent',
              color: activeConstraint === type ? colors.glow.healthy : colors.text.muted,
              border: `1px solid ${activeConstraint === type ? colors.glow.healthy : colors.text.muted}40`,
            }}
            onClick={() => setActiveConstraint(type)}
          >
            {constraints[type].name}
          </button>
        ))}
      </div>

      {/* Constraint info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeConstraint}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="p-6 rounded-xl mb-4"
            style={{
              background: colors.oceanLight,
              border: `1px solid ${colors.glow.healthy}30`,
            }}
          >
            <h4 className="text-xl font-semibold mb-2" style={{ color: colors.glow.healthy }}>
              {constraint.name}
            </h4>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              {constraint.description}
            </p>

            <pre
              className="text-sm font-mono p-3 rounded mb-4 overflow-x-auto"
              style={{ background: colors.oceanDark, color: colors.text.primary }}
            >
              {constraint.example}
            </pre>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded" style={{ background: colors.glow.critical + '10' }}>
                <div className="text-xs font-mono mb-1" style={{ color: colors.glow.critical }}>
                  WITHOUT CONSTRAINT
                </div>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  {constraint.withoutConstraint}
                </p>
              </div>
              <div className="p-3 rounded" style={{ background: colors.glow.healthy + '10' }}>
                <div className="text-xs font-mono mb-1" style={{ color: colors.glow.healthy }}>
                  WITH CONSTRAINT
                </div>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  {constraint.withConstraint}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive demos */}
          {activeConstraint === 'not_null' && <NotNullDemo />}
          {activeConstraint === 'check' && <CheckDemo />}
          {activeConstraint === 'unique' && <UniqueDemo />}
          {activeConstraint === 'foreign_key' && <ForeignKeyDemo />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
