import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

type DemoScenario = 'row_lock' | 'for_update' | 'serialization_failure';

interface Transaction {
  id: string;
  name: string;
  color: string;
  status: 'running' | 'waiting' | 'committed' | 'failed';
  steps: { text: string; status: 'pending' | 'executing' | 'done' | 'blocked' | 'failed' }[];
}

export function LockDemo() {
  const [scenario, setScenario] = useState<DemoScenario>('row_lock');
  const [isRunning, setIsRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountBalance, setAccountBalance] = useState(1000);
  const [message, setMessage] = useState('');

  const scenarios: Record<DemoScenario, { name: string; description: string }> = {
    row_lock: {
      name: 'Row-Level Lock',
      description: 'Two transactions try to UPDATE the same row. One waits.',
    },
    for_update: {
      name: 'SELECT FOR UPDATE',
      description: 'Lock a row before modifying to prevent race conditions.',
    },
    serialization_failure: {
      name: 'Serialization Failure',
      description: 'SERIALIZABLE detects conflicts and aborts one transaction.',
    },
  };

  const resetDemo = () => {
    setStep(0);
    setIsRunning(false);
    setAccountBalance(1000);
    setMessage('');

    if (scenario === 'row_lock') {
      setTransactions([
        {
          id: 'T1',
          name: 'Transaction 1',
          color: colors.glow.healthy,
          status: 'running',
          steps: [
            { text: 'BEGIN;', status: 'pending' },
            { text: 'UPDATE accounts SET balance = balance - 100 WHERE id = 1;', status: 'pending' },
            { text: '-- (holds row lock)', status: 'pending' },
            { text: 'COMMIT;', status: 'pending' },
          ],
        },
        {
          id: 'T2',
          name: 'Transaction 2',
          color: colors.glow.warning,
          status: 'running',
          steps: [
            { text: 'BEGIN;', status: 'pending' },
            { text: 'UPDATE accounts SET balance = balance - 200 WHERE id = 1;', status: 'pending' },
            { text: '-- (waiting for T1...)', status: 'pending' },
            { text: 'COMMIT;', status: 'pending' },
          ],
        },
      ]);
    } else if (scenario === 'for_update') {
      setTransactions([
        {
          id: 'T1',
          name: 'Transaction 1',
          color: colors.glow.healthy,
          status: 'running',
          steps: [
            { text: 'BEGIN;', status: 'pending' },
            { text: 'SELECT * FROM accounts WHERE id = 1 FOR UPDATE;', status: 'pending' },
            { text: '-- (lock acquired, safe to modify)', status: 'pending' },
            { text: 'UPDATE accounts SET balance = balance - 100 WHERE id = 1;', status: 'pending' },
            { text: 'COMMIT;', status: 'pending' },
          ],
        },
        {
          id: 'T2',
          name: 'Transaction 2',
          color: colors.glow.warning,
          status: 'running',
          steps: [
            { text: 'BEGIN;', status: 'pending' },
            { text: 'SELECT * FROM accounts WHERE id = 1 FOR UPDATE;', status: 'pending' },
            { text: '-- (waiting for T1 to release lock...)', status: 'pending' },
            { text: '-- (lock acquired!)', status: 'pending' },
            { text: 'UPDATE accounts SET balance = balance - 200 WHERE id = 1;', status: 'pending' },
            { text: 'COMMIT;', status: 'pending' },
          ],
        },
      ]);
    } else {
      setTransactions([
        {
          id: 'T1',
          name: 'Transaction 1 (SERIALIZABLE)',
          color: colors.glow.healthy,
          status: 'running',
          steps: [
            { text: 'BEGIN ISOLATION LEVEL SERIALIZABLE;', status: 'pending' },
            { text: 'SELECT SUM(balance) FROM accounts;', status: 'pending' },
            { text: 'INSERT INTO accounts (balance) VALUES (100);', status: 'pending' },
            { text: 'COMMIT;', status: 'pending' },
          ],
        },
        {
          id: 'T2',
          name: 'Transaction 2 (SERIALIZABLE)',
          color: colors.glow.warning,
          status: 'running',
          steps: [
            { text: 'BEGIN ISOLATION LEVEL SERIALIZABLE;', status: 'pending' },
            { text: 'SELECT SUM(balance) FROM accounts;', status: 'pending' },
            { text: 'INSERT INTO accounts (balance) VALUES (200);', status: 'pending' },
            { text: 'COMMIT; -- ERROR!', status: 'pending' },
          ],
        },
      ]);
    }
  };

  useEffect(() => {
    resetDemo();
  }, [scenario]);

  const runStep = () => {
    if (!isRunning) {
      setIsRunning(true);
      setStep(0);
    }

    setStep((s) => {
      const nextStep = s + 1;

      // Update transaction states based on scenario and step
      if (scenario === 'row_lock') {
        setTransactions((prev) => {
          const updated = [...prev];
          if (nextStep === 1) {
            updated[0].steps[0].status = 'done';
            setMessage('T1 begins transaction');
          } else if (nextStep === 2) {
            updated[0].steps[1].status = 'done';
            updated[0].steps[2].status = 'executing';
            setMessage('T1 acquires row lock on accounts.id=1');
          } else if (nextStep === 3) {
            updated[1].steps[0].status = 'done';
            setMessage('T2 begins transaction');
          } else if (nextStep === 4) {
            updated[1].steps[1].status = 'blocked';
            updated[1].steps[2].status = 'executing';
            updated[1].status = 'waiting';
            setMessage('T2 tries to UPDATE same row, BLOCKED waiting for T1');
          } else if (nextStep === 5) {
            updated[0].steps[2].status = 'done';
            updated[0].steps[3].status = 'done';
            updated[0].status = 'committed';
            setAccountBalance(900);
            setMessage('T1 commits, releases lock. Balance: $900');
          } else if (nextStep === 6) {
            updated[1].steps[1].status = 'done';
            updated[1].steps[2].status = 'done';
            updated[1].steps[3].status = 'done';
            updated[1].status = 'committed';
            setAccountBalance(700);
            setMessage('T2 unblocked, completes UPDATE, commits. Balance: $700');
          }
          return updated;
        });
      } else if (scenario === 'for_update') {
        setTransactions((prev) => {
          const updated = [...prev];
          if (nextStep === 1) {
            updated[0].steps[0].status = 'done';
            setMessage('T1 begins transaction');
          } else if (nextStep === 2) {
            updated[0].steps[1].status = 'done';
            updated[0].steps[2].status = 'executing';
            setMessage('T1 executes SELECT FOR UPDATE, acquires lock');
          } else if (nextStep === 3) {
            updated[1].steps[0].status = 'done';
            setMessage('T2 begins transaction');
          } else if (nextStep === 4) {
            updated[1].steps[1].status = 'blocked';
            updated[1].steps[2].status = 'executing';
            updated[1].status = 'waiting';
            setMessage('T2 SELECT FOR UPDATE blocked, waiting for lock');
          } else if (nextStep === 5) {
            updated[0].steps[2].status = 'done';
            updated[0].steps[3].status = 'done';
            setAccountBalance(900);
            setMessage('T1 updates balance to $900');
          } else if (nextStep === 6) {
            updated[0].steps[4].status = 'done';
            updated[0].status = 'committed';
            setMessage('T1 commits, releases lock');
          } else if (nextStep === 7) {
            updated[1].steps[1].status = 'done';
            updated[1].steps[2].status = 'done';
            updated[1].steps[3].status = 'done';
            updated[1].status = 'running';
            setMessage('T2 acquires lock, sees updated balance $900');
          } else if (nextStep === 8) {
            updated[1].steps[4].status = 'done';
            setAccountBalance(700);
            setMessage('T2 updates balance to $700');
          } else if (nextStep === 9) {
            updated[1].steps[5].status = 'done';
            updated[1].status = 'committed';
            setMessage('T2 commits. No race condition! Balance: $700');
          }
          return updated;
        });
      } else {
        setTransactions((prev) => {
          const updated = [...prev];
          if (nextStep === 1) {
            updated[0].steps[0].status = 'done';
            setMessage('T1 begins with SERIALIZABLE isolation');
          } else if (nextStep === 2) {
            updated[0].steps[1].status = 'done';
            setMessage('T1 reads SUM(balance) = $1000');
          } else if (nextStep === 3) {
            updated[1].steps[0].status = 'done';
            setMessage('T2 begins with SERIALIZABLE isolation');
          } else if (nextStep === 4) {
            updated[1].steps[1].status = 'done';
            setMessage('T2 also reads SUM(balance) = $1000 (same snapshot)');
          } else if (nextStep === 5) {
            updated[0].steps[2].status = 'done';
            setMessage('T1 inserts new row with balance=100');
          } else if (nextStep === 6) {
            updated[1].steps[2].status = 'done';
            setMessage('T2 inserts new row with balance=200');
          } else if (nextStep === 7) {
            updated[0].steps[3].status = 'done';
            updated[0].status = 'committed';
            setMessage('T1 commits successfully');
          } else if (nextStep === 8) {
            updated[1].steps[3].status = 'failed';
            updated[1].status = 'failed';
            setMessage('T2 COMMIT fails: ERROR: could not serialize access (40001)');
          }
          return updated;
        });
      }

      return nextStep;
    });
  };

  const maxSteps = scenario === 'row_lock' ? 6 : scenario === 'for_update' ? 9 : 8;

  return (
    <div className="w-full">
      {/* Scenario tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(scenarios) as DemoScenario[]).map((key) => (
          <button
            key={key}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: scenario === key ? colors.glow.healthy + '20' : 'transparent',
              color: scenario === key ? colors.glow.healthy : colors.text.muted,
              border: `1px solid ${scenario === key ? colors.glow.healthy : colors.text.muted}40`,
            }}
            onClick={() => setScenario(key)}
          >
            {scenarios[key].name}
          </button>
        ))}
      </div>

      <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
        {scenarios[scenario].description}
      </p>

      {/* Account state */}
      <div
        className="p-4 rounded-xl mb-4 flex items-center justify-between"
        style={{ background: colors.oceanDark }}
      >
        <div>
          <span className="text-xs font-mono" style={{ color: colors.text.muted }}>
            accounts WHERE id = 1
          </span>
          <div className="text-2xl font-mono" style={{ color: colors.glow.healthy }}>
            balance: ${accountBalance}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runStep}
            disabled={step >= maxSteps}
            className="px-4 py-2 rounded text-sm font-mono"
            style={{
              background: step >= maxSteps ? colors.text.muted + '20' : colors.glow.healthy + '20',
              color: step >= maxSteps ? colors.text.muted : colors.glow.healthy,
              border: `1px solid ${step >= maxSteps ? colors.text.muted : colors.glow.healthy}40`,
            }}
          >
            {step === 0 ? 'Start' : step >= maxSteps ? 'Done' : 'Next Step'}
          </button>
          <button
            onClick={resetDemo}
            className="px-4 py-2 rounded text-sm font-mono"
            style={{
              background: colors.text.muted + '20',
              color: colors.text.muted,
              border: `1px solid ${colors.text.muted}40`,
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-lg mb-4 text-sm font-mono"
            style={{
              background: colors.oceanLight,
              color: message.includes('ERROR') || message.includes('BLOCKED')
                ? colors.glow.critical
                : colors.text.secondary,
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions */}
      <div className="grid md:grid-cols-2 gap-4">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="p-4 rounded-xl"
            style={{
              background: colors.oceanLight,
              border: `1px solid ${
                tx.status === 'waiting'
                  ? colors.glow.warning
                  : tx.status === 'committed'
                  ? colors.glow.healthy
                  : tx.status === 'failed'
                  ? colors.glow.critical
                  : colors.text.muted
              }40`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-sm" style={{ color: tx.color }}>
                {tx.name}
              </span>
              <span
                className="text-xs px-2 py-1 rounded"
                style={{
                  background:
                    tx.status === 'waiting'
                      ? colors.glow.warning + '20'
                      : tx.status === 'committed'
                      ? colors.glow.healthy + '20'
                      : tx.status === 'failed'
                      ? colors.glow.critical + '20'
                      : colors.text.muted + '20',
                  color:
                    tx.status === 'waiting'
                      ? colors.glow.warning
                      : tx.status === 'committed'
                      ? colors.glow.healthy
                      : tx.status === 'failed'
                      ? colors.glow.critical
                      : colors.text.muted,
                }}
              >
                {tx.status}
              </span>
            </div>

            <div className="space-y-1 font-mono text-xs">
              {tx.steps.map((s, i) => (
                <div
                  key={i}
                  className="py-1 px-2 rounded transition-colors"
                  style={{
                    background:
                      s.status === 'executing'
                        ? tx.color + '20'
                        : s.status === 'blocked'
                        ? colors.glow.critical + '20'
                        : 'transparent',
                    color:
                      s.status === 'done'
                        ? colors.text.muted
                        : s.status === 'blocked'
                        ? colors.glow.critical
                        : s.status === 'failed'
                        ? colors.glow.critical
                        : s.status === 'executing'
                        ? tx.color
                        : colors.text.secondary,
                    opacity: s.status === 'pending' ? 0.5 : 1,
                    textDecoration: s.status === 'done' ? 'line-through' : 'none',
                  }}
                >
                  {s.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Key insight */}
      {scenario === 'serialization_failure' && step >= maxSteps && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl"
          style={{
            background: colors.glow.critical + '10',
            border: `1px solid ${colors.glow.critical}40`,
          }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: colors.glow.critical }}>
            Your app MUST handle error 40001
          </p>
          <pre
            className="text-xs font-mono p-2 rounded overflow-x-auto"
            style={{ background: colors.oceanDark, color: colors.text.secondary }}
          >
{`try {
  await db.query('COMMIT');
} catch (err) {
  if (err.code === '40001') {
    // Serialization failure - RETRY the transaction
    return retryTransaction();
  }
  throw err;
}`}
          </pre>
        </motion.div>
      )}
    </div>
  );
}
