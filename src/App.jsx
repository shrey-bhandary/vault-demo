import { useEffect, useMemo, useState } from 'react';

const OP_SYMBOLS = ['+', '-', 'x', '/', '^'];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem() {
  const templates = [
    () => {
      const a = randInt(2, 9);
      const b = randInt(1, 5);
      const c = randInt(2, 6);
      const d = randInt(1, 7);
      return {
        expression: `(${a} + ${b}) x ${c} - ${d}`,
        answer: (a + b) * c - d,
        correctOrder: ['+', 'x', '-'],
        tips: 'Bracket operation goes first, then multiplication, then subtraction.'
      };
    },
    () => {
      const base = randInt(2, 5);
      const power = randInt(2, 3);
      const mult = randInt(2, 6);
      const add = randInt(1, 9);
      return {
        expression: `${base} ^ ${power} + ${mult} x ${add}`,
        answer: base ** power + mult * add,
        correctOrder: ['^', 'x', '+'],
        tips: 'Order/power first, then multiplication, then addition.'
      };
    },
    () => {
      const divisor = randInt(2, 6);
      const quotient = randInt(2, 8);
      const dividend = divisor * quotient;
      const mult = randInt(2, 5);
      const sub = randInt(1, 9);
      return {
        expression: `${dividend} / ${divisor} x ${mult} - ${sub}`,
        answer: (dividend / divisor) * mult - sub,
        correctOrder: ['/', 'x', '-'],
        tips: 'Division and multiplication have equal priority: solve left to right.'
      };
    },
    () => {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      const c = randInt(2, 7);
      const d = randInt(1, 8);
      return {
        expression: `${a} + ${b} x ${c} - ${d}`,
        answer: a + b * c - d,
        correctOrder: ['x', '+', '-'],
        tips: 'Multiplication comes before addition and subtraction.'
      };
    }
  ];

  return templates[randInt(0, templates.length - 1)]();
}

function tokenizeExpression(expression) {
  return expression
    .replace(/\(/g, '( ')
    .replace(/\)/g, ' )')
    .split(/\s+/)
    .filter(Boolean);
}

function App() {
  const [problem, setProblem] = useState(null);
  const [picked, setPicked] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState('Loading puzzle lane...');
  const [feedbackType, setFeedbackType] = useState('');
  const [orderLocked, setOrderLocked] = useState(false);
  const [answerMode, setAnswerMode] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState('');

  const tokens = useMemo(() => (problem ? tokenizeExpression(problem.expression) : []), [problem]);

  function loadProblem() {
    setPicked([]);
    setOrderLocked(false);
    setAnswerMode(false);
    setFinalAnswer('');
    setFeedbackType('');

    const payload = generateProblem();
    setProblem(payload);
    setFeedback(payload.tips || 'Tap operators in BODMAS order.');
  }

  useEffect(() => {
    loadProblem();
  }, []);

  function pickOperator(symbol, index) {
    if (orderLocked) {
      return;
    }

    const id = `${symbol}-${index}`;
    if (picked.some((item) => item.id === id)) {
      return;
    }

    setPicked((prev) => [...prev, { id, symbol }]);
  }

  function checkOrder() {
    if (!problem) {
      return;
    }

    if (picked.length !== problem.correctOrder.length) {
      setFeedbackType('error');
      setFeedback('Pick all operation buses before checking.');
      return;
    }

    const pickedOrder = picked.map((item) => item.symbol);
    const isCorrect = pickedOrder.every((symbol, idx) => symbol === problem.correctOrder[idx]);

    if (!isCorrect) {
      setStreak(0);
      setFeedbackType('error');
      setFeedback(`Order is incorrect. Correct order: ${problem.correctOrder.join(' -> ')}`);
      return;
    }

    setOrderLocked(true);
    setAnswerMode(true);
    setFeedbackType('success');
    setFeedback('Great order. Now solve the final value.');
  }

  function submitAnswer() {
    if (!problem) {
      return;
    }

    const numeric = Number(finalAnswer);
    if (!Number.isFinite(numeric)) {
      setFeedbackType('error');
      setFeedback('Enter a valid number.');
      return;
    }

    const correct = Math.abs(numeric - Number(problem.answer)) < 1e-9;

    if (correct) {
      setScore((value) => value + 10);
      setStreak((value) => value + 1);
      setFeedbackType('success');
      setFeedback('Perfect! +10 points. Loading next round...');
      setTimeout(() => {
        loadProblem();
      }, 900);
      return;
    }

    setStreak(0);
    setFeedbackType('error');
    setFeedback(`Not quite. Correct answer: ${problem.answer}. Start another round.`);
  }

  function isPicked(symbol, index) {
    const id = `${symbol}-${index}`;
    return picked.some((item) => item.id === id);
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <div>
          <p className="kicker">Math Priority Playground</p>
          <h1>BODMAS Bus Jam</h1>
          <p className="subtitle">Tap operators in the correct BODMAS traffic order.</p>
        </div>
        <div className="scoreboard">
          <div className="pill">
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div className="pill">
            <span>Streak</span>
            <strong>{streak}</strong>
          </div>
          <button type="button" className="btn ghost" onClick={loadProblem}>
            New Round
          </button>
        </div>
      </header>

      <section className="board">
        <article className="expression-wrap">
          <h2>Traffic Lane</h2>
          <p className="helper">Click each operation symbol in the order it should be solved.</p>
          <div className="expression" aria-live="polite">
            {tokens.map((token, index) => {
              const isOperator = OP_SYMBOLS.includes(token);
              const pickedNow = isOperator && isPicked(token, index);

              return (
                <button
                  key={`${token}-${index}`}
                  type="button"
                  className={`token ${isOperator ? 'op' : 'num'} ${pickedNow ? 'selected done' : ''}`}
                  disabled={!isOperator || orderLocked || pickedNow}
                  onClick={() => isOperator && pickOperator(token, index)}
                >
                  {token}
                </button>
              );
            })}
          </div>
        </article>

        <aside className="controls">
          <section className="panel">
            <h3>Your picked order</h3>
            <div className="picked-order">{picked.length ? picked.map((item) => item.symbol).join(' -> ') : 'No picks yet'}</div>
            <button type="button" className="btn" onClick={checkOrder}>
              Check Order
            </button>
          </section>

          {answerMode && (
            <section className="panel">
              <h3>Final answer</h3>
              <label htmlFor="final-answer">Now solve the expression value:</label>
              <div className="answer-row">
                <input
                  id="final-answer"
                  type="number"
                  step="any"
                  value={finalAnswer}
                  onChange={(event) => setFinalAnswer(event.target.value)}
                  placeholder="Enter result"
                />
                <button type="button" className="btn" onClick={submitAnswer}>
                  Submit
                </button>
              </div>
            </section>
          )}

          <section className={`panel feedback ${feedbackType}`.trim()}>{feedback}</section>
        </aside>
      </section>

      <section className="legend">
        <h2>BODMAS Priority</h2>
        <div className="legend-grid">
          <article>
            <h3>B</h3>
            <p>Brackets first</p>
          </article>
          <article>
            <h3>O</h3>
            <p>Orders and powers</p>
          </article>
          <article>
            <h3>DM</h3>
            <p>Division and multiplication, left to right</p>
          </article>
          <article>
            <h3>AS</h3>
            <p>Addition and subtraction, left to right</p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default App;
