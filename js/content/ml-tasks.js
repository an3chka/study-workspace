// Практика по ML: задачи на Python + numpy с автотестами. Запускаются в браузере (Pyodide).
// Формат: id, module, topic (связь с темой), title, level (1–3), desc, starter, tests, hint, solution.
// В тестах доступны функции из решения; каждый пройденный блок печатает «✓ …».
(function () {
  'use strict';

  window.ML_TASKS = [
    // ---------- Основы ----------
    {
      id: 't-metrics', module: 'basics', topic: 'metrics-cls', level: 1, title: 'Precision, recall, F1 своими руками',
      desc: 'Реализуй `metrics(y_true, y_pred)` для бинарной классификации (метки 0/1). Верни кортеж `(precision, recall, f1)`. Если знаменатель равен 0 — возвращай 0.0.',
      starter: 'import numpy as np\n\ndef metrics(y_true, y_pred):\n    y_true = np.asarray(y_true)\n    y_pred = np.asarray(y_pred)\n    # TP, FP, FN\n    ...\n    return precision, recall, f1\n',
      tests: 'import numpy as np\np, r, f = metrics([1,0,1,1,0,1], [1,1,1,0,0,0])\nassert np.isclose(p, 2/3), f"precision: ждали 0.667, получили {p}"\nassert np.isclose(r, 0.5), f"recall: ждали 0.5, получили {r}"\nassert np.isclose(f, 2*(2/3)*0.5/((2/3)+0.5)), f"f1 неверный: {f}"\nprint("✓ обычный случай")\np, r, f = metrics([0,0,0], [0,0,0])\nassert (p, r, f) == (0.0, 0.0, 0.0), "при нулевых знаменателях верни 0.0"\nprint("✓ нет положительных")\n',
      hint: 'TP = ((y_true == 1) & (y_pred == 1)).sum(). Аналогично FP и FN.',
      solution: 'import numpy as np\n\ndef metrics(y_true, y_pred):\n    y_true = np.asarray(y_true); y_pred = np.asarray(y_pred)\n    tp = int(((y_true == 1) & (y_pred == 1)).sum())\n    fp = int(((y_true == 0) & (y_pred == 1)).sum())\n    fn = int(((y_true == 1) & (y_pred == 0)).sum())\n    precision = tp / (tp + fp) if tp + fp else 0.0\n    recall = tp / (tp + fn) if tp + fn else 0.0\n    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0\n    return precision, recall, f1\n',
    },
    {
      id: 't-linreg-gd', module: 'basics', topic: 'gradient-descent', level: 2, title: 'Шаг градиентного спуска для линейной регрессии',
      desc: 'Модель `y_hat = X @ w + b`, лосс MSE = mean((y_hat − y)²). Реализуй `gd_step(X, y, w, b, lr)`, который возвращает новые `(w, b)` после одного шага градиентного спуска.',
      starter: 'import numpy as np\n\ndef gd_step(X, y, w, b, lr):\n    n = len(y)\n    y_hat = X @ w + b\n    # градиенты MSE по w и b\n    ...\n    return w_new, b_new\n',
      tests: 'import numpy as np\nrng = np.random.default_rng(0)\nX = rng.normal(size=(50, 3)); true_w = np.array([2., -1., 0.5]); y = X @ true_w + 3\nw = np.zeros(3); b = 0.0\nw1, b1 = gd_step(X, y, w, b, 0.1)\nerr = X @ w + b - y\nassert np.allclose(w1, w - 0.1 * 2 / 50 * X.T @ err), "градиент по w неверный"\nassert np.isclose(b1, b - 0.1 * 2 * err.mean()), "градиент по b неверный"\nprint("✓ один шаг")\nfor _ in range(500): w, b = gd_step(X, y, w, b, 0.1)\nassert np.allclose(w, true_w, atol=1e-3) and abs(b - 3) < 1e-3, f"не сошлось: w={w}, b={b}"\nprint("✓ сходится к правильным весам")\n',
      hint: 'dL/dw = (2/n) · Xᵀ(y_hat − y), dL/db = (2/n) · Σ(y_hat − y).',
      solution: 'import numpy as np\n\ndef gd_step(X, y, w, b, lr):\n    n = len(y)\n    err = X @ w + b - y\n    dw = 2 / n * X.T @ err\n    db = 2 * err.mean()\n    return w - lr * dw, b - lr * db\n',
    },
    {
      id: 't-kmeans', module: 'basics', topic: 'unsupervised', level: 2, title: 'Один шаг k-means',
      desc: 'Реализуй `kmeans_step(X, centers)`: (1) присвой каждой точке номер ближайшего центра, (2) пересчитай центры как средние своих точек (если у центра нет точек — оставь его прежним). Верни `(labels, new_centers)`.',
      starter: 'import numpy as np\n\ndef kmeans_step(X, centers):\n    # расстояния (n, k) без циклов: используй broadcasting\n    ...\n    return labels, new_centers\n',
      tests: 'import numpy as np\nX = np.array([[0,0],[0,1],[10,10],[10,11]], float)\nlabels, c = kmeans_step(X, np.array([[0,0],[10,10]], float))\nassert list(labels) == [0,0,1,1], f"метки: {labels}"\nassert np.allclose(c, [[0,0.5],[10,10.5]]), f"центры: {c}"\nprint("✓ присвоение и пересчёт")\nlabels, c = kmeans_step(X, np.array([[0,0],[10,10],[100,100]], float))\nassert np.allclose(c[2], [100,100]), "пустой кластер должен остаться на месте"\nprint("✓ пустой кластер")\n',
      hint: 'd = ((X[:, None, :] - centers[None, :, :]) ** 2).sum(-1); labels = d.argmin(1).',
      solution: 'import numpy as np\n\ndef kmeans_step(X, centers):\n    d = ((X[:, None, :] - centers[None, :, :]) ** 2).sum(-1)\n    labels = d.argmin(1)\n    new_centers = centers.copy().astype(float)\n    for k in range(len(centers)):\n        pts = X[labels == k]\n        if len(pts):\n            new_centers[k] = pts.mean(0)\n    return labels, new_centers\n',
    },



    // ---------- LLM и агенты ----------
    {
      id: 't-cosine', module: 'llm', topic: 'tokens-embeddings', level: 1, title: 'Семантический поиск по эмбеддингам',
      desc: 'Реализуй `top_k(query, docs, k)`: query — вектор (d,), docs — матрица (n, d). Верни индексы k документов с наибольшим косинусным сходством, от самого похожего.',
      starter: 'import numpy as np\n\ndef top_k(query, docs, k):\n    ...\n',
      tests: 'import numpy as np\ndocs = np.array([[1, 0], [0, 1], [1, 1], [-1, 0]], float)\nassert list(top_k(np.array([2., 0.]), docs, 2)) == [0, 2], f"получили {top_k(np.array([2., 0.]), docs, 2)}"\nprint("✓ порядок по сходству")\nassert list(top_k(np.array([0., 5.]), docs * 10, 1)) == [1], "косинус не должен зависеть от длины векторов"\nprint("✓ нормировка")\n',
      hint: 'sims = docs @ query / (norm(docs, axis=1) * norm(query)); np.argsort(-sims)[:k].',
      solution: 'import numpy as np\n\ndef top_k(query, docs, k):\n    sims = docs @ query / (np.linalg.norm(docs, axis=1) * np.linalg.norm(query))\n    return np.argsort(-sims)[:k]\n',
    },
    {
      id: 't-attention', module: 'llm', topic: 'attention', level: 3, title: 'Scaled dot-product attention с маской',
      desc: 'Реализуй `attention(Q, K, V, causal=False)` для одной головы: Q, K, V — (n, d). Веса = softmax(QKᵀ/√d), выход = веса·V. При causal=True токен i не должен смотреть на токены j > i. Верни `(out, weights)`.',
      starter: 'import numpy as np\n\ndef attention(Q, K, V, causal=False):\n    d = Q.shape[-1]\n    scores = Q @ K.T / np.sqrt(d)\n    ...\n    return out, weights\n',
      tests: 'import numpy as np\nrng = np.random.default_rng(6); n, d = 4, 8\nQ, K, V = rng.normal(size=(3, n, d))\nout, w = attention(Q, K, V)\nassert np.allclose(w.sum(1), 1), "веса в каждой строке должны суммироваться в 1"\nassert out.shape == (n, d) and np.allclose(out, w @ V), "выход = веса @ V"\nprint("✓ обычное внимание")\nout, w = attention(Q, K, V, causal=True)\nassert np.allclose(np.triu(w, 1), 0), "в causal-режиме веса выше диагонали = 0"\nassert np.allclose(w[0], [1, 0, 0, 0]), "первый токен видит только себя"\nprint("✓ causal-маска")\n',
      hint: 'Для маски: scores[np.triu(np.ones((n, n)), 1).astype(bool)] = -np.inf, затем устойчивый softmax по строкам.',
      solution: 'import numpy as np\n\ndef attention(Q, K, V, causal=False):\n    d = Q.shape[-1]\n    scores = Q @ K.T / np.sqrt(d)\n    if causal:\n        n = scores.shape[0]\n        scores = np.where(np.triu(np.ones((n, n)), 1).astype(bool), -np.inf, scores)\n    scores = scores - scores.max(1, keepdims=True)\n    w = np.exp(scores); w /= w.sum(1, keepdims=True)\n    return w @ V, w\n',
    },
    {
      id: 't-sampling', module: 'llm', topic: 'attention', level: 2, title: 'Temperature и top-k при генерации',
      desc: 'Реализуй `next_token_probs(logits, temperature, k)`: оставь только k наибольших логитов (остальные — вероятность 0), раздели на temperature и примени softmax. Верни вектор вероятностей той же длины.',
      starter: 'import numpy as np\n\ndef next_token_probs(logits, temperature, k):\n    logits = np.asarray(logits, float)\n    ...\n',
      tests: 'import numpy as np\np = next_token_probs([2., 1., 0.5, -1.], 1.0, 2)\nassert np.isclose(p.sum(), 1) and p[2] == 0 and p[3] == 0, "вне top-k вероятность должна быть 0"\nassert np.isclose(p[0], np.exp(2) / (np.exp(2) + np.exp(1))), "неверные вероятности"\nprint("✓ top-k")\ncold = next_token_probs([2., 1.], 0.1, 2); hot = next_token_probs([2., 1.], 10., 2)\nassert cold[0] > 0.99 and abs(hot[0] - 0.5) < 0.05, "низкая T — острее, высокая — площе"\nprint("✓ temperature")\n',
      hint: 'idx = np.argsort(logits)[-k:]; masked = np.full_like(logits, -np.inf); masked[idx] = logits[idx] / temperature; затем softmax.',
      solution: 'import numpy as np\n\ndef next_token_probs(logits, temperature, k):\n    logits = np.asarray(logits, float)\n    idx = np.argsort(logits)[-k:]\n    z = np.full_like(logits, -np.inf)\n    z[idx] = logits[idx] / temperature\n    z = z - z[idx].max()\n    e = np.where(np.isinf(z), 0, np.exp(z))\n    return e / e.sum()\n',
    },
    {
      id: 't-agent', module: 'llm', topic: 'agents', level: 2, title: 'Мини-агент: цикл с инструментами',
      desc: 'Реализуй `run_agent(llm, tools, task, max_steps=5)`. `llm(history)` возвращает либо `{"tool": имя, "args": {...}}`, либо `{"answer": текст}`. Если это вызов инструмента — выполни `tools[имя](**args)`, добавь в history запись `{"role": "tool", "content": результат}` и продолжи. Если ответ — верни его. Если шаги кончились — верни "Не успел". Неизвестный инструмент → добавь в history `{"role": "tool", "content": "error: unknown tool"}`.',
      starter: 'def run_agent(llm, tools, task, max_steps=5):\n    history = [{"role": "user", "content": task}]\n    for step in range(max_steps):\n        msg = llm(history)\n        ...\n    return "Не успел"\n',
      tests: 'def fake_llm(history):\n    tool_msgs = [m for m in history if m["role"] == "tool"]\n    if not tool_msgs:\n        return {"tool": "add", "args": {"a": 2, "b": 3}}\n    return {"answer": f"Ответ: {tool_msgs[-1][\'content\']}"}\nassert run_agent(fake_llm, {"add": lambda a, b: a + b}, "2+3?") == "Ответ: 5", "агент должен вызвать инструмент и вернуть ответ"\nprint("✓ вызов инструмента")\nlooping = lambda h: {"tool": "add", "args": {"a": 1, "b": 1}}\nassert run_agent(looping, {"add": lambda a, b: a + b}, "x", max_steps=3) == "Не успел", "нужен лимит шагов"\nprint("✓ лимит шагов")\nseen = []\ndef bad_llm(history):\n    seen.append(history[-1]["content"])\n    return {"tool": "nope", "args": {}} if len(seen) == 1 else {"answer": "ok"}\nassert run_agent(bad_llm, {}, "x") == "ok" and seen[1] == "error: unknown tool", "неизвестный инструмент — ошибка в history"\nprint("✓ неизвестный инструмент")\n',
      hint: 'if "answer" in msg: return msg["answer"]; иначе name = msg["tool"]; result = tools[name](**msg["args"]) if name in tools else "error: unknown tool"; history.append(...).',
      solution: 'def run_agent(llm, tools, task, max_steps=5):\n    history = [{"role": "user", "content": task}]\n    for step in range(max_steps):\n        msg = llm(history)\n        if "answer" in msg:\n            return msg["answer"]\n        name = msg.get("tool")\n        if name in tools:\n            result = tools[name](**msg.get("args", {}))\n        else:\n            result = "error: unknown tool"\n        history.append({"role": "tool", "content": result})\n    return "Не успел"\n',
    },
  ];
})();
