// Дополнительные проверки к задачам ML: крайние случаи, типы, неизменность входа.
// Каждый блок заканчивается print("✓ ...") — так он считается отдельной проверкой.
(function () {
  'use strict';
  const R = String.raw;

  const X = {
    // ================= Общие задачи =================
    't-metrics': R`p, r, f = metrics([1, 1, 0], [1, 1, 0])
assert (p, r, f) == (1.0, 1.0, 1.0), "идеальные предсказания — все метрики 1"
print("✓ идеальные предсказания")
p, r, f = metrics([1, 1, 1], [0, 0, 0])
assert (p, r, f) == (0.0, 0.0, 0.0), "модель ни разу не сказала 1: precision = 0 (нет предсказаний), recall = 0"
print("✓ нет положительных предсказаний")
p, r, f = metrics([0, 0, 1, 1], [1, 1, 1, 1])
assert p == 0.5 and r == 1.0, "всё предсказали как 1: recall = 1, precision = доля единиц"
print("✓ всё — класс 1")
`,
    't-linreg-gd': R`import numpy as np
X = np.ones((4, 2)); y = X @ np.array([1., 2.]) + 0.5
w, b = gd_step(X, y, np.array([1., 2.]), 0.5, 0.1)
assert np.allclose(w, [1, 2]) and np.isclose(b, 0.5), "в точном решении градиент 0 — веса не меняются"
print("✓ в минимуме шаг нулевой")
w, b = gd_step(np.zeros((3, 2)), np.ones(3), np.zeros(2), 0.0, 0.5)
assert np.allclose(w, 0) and np.isclose(b, 1.0), "при нулевых признаках учится только b: b = 0 − 0.5·2·(0 − 1) = 1"
print("✓ градиент по b")
`,
    't-kmeans': R`import numpy as np
X = np.array([[0., 0.], [1., 0.]])
labels, c = kmeans_step(X, np.array([[0.4, 0.], [5., 5.]]))
assert list(labels) == [0, 0] and np.allclose(c[0], [0.5, 0]), "обе точки ближе к первому центру"
print("✓ все точки в одном кластере")
centers = np.array([[0., 0.], [10., 10.]]); c0 = centers.copy()
kmeans_step(np.array([[1., 1.], [9., 9.]]), centers)
assert np.array_equal(centers, c0), "исходный массив центров менять нельзя"
print("✓ центры не меняются на месте")
X = np.random.default_rng(0).normal(size=(30, 3)); C = X[:4].copy()
J0 = ((X[:, None] - C[None]) ** 2).sum(-1).min(1).sum()
lab, C1 = kmeans_step(X, C)
J1 = ((X - C1[lab]) ** 2).sum()
assert J1 <= J0 + 1e-9, "шаг k-means не увеличивает сумму квадратов расстояний"
print("✓ целевая функция не растёт")
`,
    't-cosine': R`import numpy as np
docs = np.array([[1., 0.], [0., 1.], [-1., 0.]])
assert list(top_k(np.array([1., 0.]), docs, 3)) == [0, 1, 2], "противоположный вектор — последний"
print("✓ противоположный вектор")
assert len(top_k(np.array([1., 0.]), docs, 1)) == 1, "k = 1 — один индекс"
print("✓ k = 1")
d2 = np.array([[100., 1.], [1., 0.]])
assert top_k(np.array([1., 0.]), d2, 1)[0] == 1, "длина вектора не влияет: [1, 0] точно совпадает по направлению"
print("✓ длина не важна")
`,
    't-attention': R`import numpy as np
rng = np.random.default_rng(2); Q = rng.normal(size=(4, 8)); K = rng.normal(size=(4, 8)); V = rng.normal(size=(4, 3))
out, w = attention(Q, K, V)
assert out.shape == (4, 3) and w.shape == (4, 4), "выход (n, d_v), веса (n, n)"
assert np.allclose(w.sum(1), 1), "веса каждой строки суммируются в 1"
print("✓ формы и нормировка")
out, w = attention(Q, K, V, causal=True)
assert np.allclose(out[0], V[0]), "первый токен в causal-режиме видит только себя"
print("✓ первый токен в causal")
Kc = np.zeros((4, 8)); out, w = attention(Q, Kc, V)
assert np.allclose(out, V.mean(0)), "одинаковые ключи — равные веса, выход = среднее V"
print("✓ одинаковые ключи")
`,
    't-sampling': R`import numpy as np
p = next_token_probs([2.0, 1.0, 0.5, -1.0], 1.0, 4)
e = np.exp([2.0, 1.0, 0.5, -1.0]); assert np.allclose(p, e / e.sum()), "k = размеру словаря — обычный softmax"
print("✓ k = все токены")
p = next_token_probs([0.1, 3.0, 0.2], 1.0, 1)
assert np.allclose(p, [0, 1, 0]), "k = 1 — жадный выбор"
print("✓ k = 1")
p = next_token_probs([1.0, 2.0, 3.0], 0.01, 3)
assert p[2] > 0.99, "очень низкая температура — почти детерминированный выбор максимума"
print("✓ низкая температура")
`,
    't-agent': R`calls = []
def llm(h):
    calls.append(len(h))
    return {"answer": "сразу"}
assert run_agent(llm, {}, "x") == "сразу" and calls == [1], "если модель сразу отвечает — инструменты не нужны, один вызов"
print("✓ ответ без инструментов")
seen = {}
def llm2(h):
    if len(h) == 1:
        return {"tool": "add", "args": {"a": 2, "b": 3}}
    seen["last"] = h[-1]
    return {"answer": str(h[-1]["content"])}
assert run_agent(llm2, {"add": lambda a, b: a + b}, "2+3") == "5", "результат инструмента добавляется в историю"
assert seen["last"]["role"] == "tool", "сообщение с результатом — роль tool"
print("✓ результат инструмента в истории")
`,

    // ================= Библиотеки и добавки =================
    'lib-ski-gray': R`import numpy as np
rgb = np.random.default_rng(0).integers(0, 256, (5, 7, 3)).astype(np.uint8)
r0 = rgb.copy(); g = to_gray_uint8(rgb)
assert np.array_equal(rgb, r0), "входную картинку менять нельзя"
print("✓ вход не меняется")
assert np.all(to_gray_uint8(np.zeros((2, 2, 3), np.uint8)) == 0), "чёрный остаётся чёрным"
ref = np.round(rgb @ np.array([0.2125, 0.7154, 0.0721])).astype(int)
assert np.abs(g.astype(int) - ref).max() <= 1, "на случайной картинке совпадает с формулой яркости"
print("✓ чёрный и случайная картинка")
`,
    'lib-ski-metrics': R`import numpy as np
rng = np.random.default_rng(1)
ref = rng.integers(0, 256, (40, 40)).astype(np.uint8)
a = np.clip(ref + rng.normal(0, 5, ref.shape), 0, 255).astype(np.uint8)
b = np.clip(ref + rng.normal(0, 30, ref.shape), 0, 255).astype(np.uint8)
pa, sa = quality(ref, a); pb, sb = quality(ref, b)
assert pa > pb and sa > sb, "меньше шума — выше и PSNR, и SSIM"
print("✓ монотонность по шуму")
`,
    'lib-pil-crop': R`import numpy as np
from PIL import Image
arr = np.arange(7 * 9 * 3, dtype=np.uint8).reshape(7, 9, 3)
c = center_crop_pil(Image.fromarray(arr), 4)
assert np.array_equal(np.asarray(c), arr[1:5, 2:6]), "нечётная разница размеров: отступы (W − k) // 2 и (H − k) // 2"
print("✓ нечётная разница")
g = Image.fromarray(np.zeros((10, 20), np.uint8))
c = center_crop_pil(g, 10)
assert c.size == (10, 10) and c.mode == "L", "серые картинки тоже режутся, режим не меняется"
print("✓ серая картинка")
`,
    'lib-std-json': R`import tempfile, os
import numpy as np
p = os.path.join(tempfile.mkdtemp(), "e.json")
save_preds(p, {})
assert load_preds(p) == {}, "пустой словарь сохраняется и читается"
print("✓ пустой словарь")
d = {f"{i:04d}.jpg": np.int64(i % 50) for i in range(300)}
save_preds(p, d)
assert load_preds(p) == {k: int(v) for k, v in d.items()}, "большой словарь без потерь"
print("✓ 300 записей")
`,
    'lib-np-standardize': R`import numpy as np
Z = standardize(np.array([[1.0], [3.0]]))
assert np.allclose(Z.ravel(), [-1, 1]), "столбец [1, 3]: среднее 2, std 1 → [−1, 1] (std без поправки, ddof=0)"
print("✓ ddof = 0")
`,
    'lib-np-blocks': R`import numpy as np
x = np.random.default_rng(2).integers(0, 9, (8, 8))
assert np.array_equal(to_blocks(x, 8)[0], x) and np.array_equal(to_blocks(x, 1).ravel(), x.ravel()), "b = размер картинки — один блок; b = 1 — каждый пиксель отдельно"
print("✓ крайние размеры блока")
`,
    'lib-sp-dct': R`import numpy as np
x = np.random.default_rng(1).normal(size=(8, 8)); y = np.random.default_rng(2).normal(size=(8, 8))
assert np.allclose(dct2(2 * x + 3 * y), 2 * dct2(x) + 3 * dct2(y)), "DCT линейно"
print("✓ линейность")
`,
    'lib-sp-sharpen': R`import numpy as np
img = np.random.default_rng(3).random((16, 16))
assert np.allclose(sharpen(img, 1.0, 0.0), img), "amount = 0 — картинка не меняется"
print("✓ amount = 0")
`,
    'lib-pil-tensor': R`import numpy as np
x = np.random.default_rng(0).random((3, 6, 4)).astype(np.float32)
back = pil_to_chw(chw_to_pil(x))
assert np.abs(back - x).max() <= 0.5 / 255 + 1e-6, "туда-обратно: ошибка не больше половины шага квантования"
print("✓ туда и обратно")
`,
    'lib-std-files': R`import tempfile
from pathlib import Path
d = Path(tempfile.mkdtemp())
for n in ["10.jpg", "2.jpg", "1.jpg"]:
    (d / n).write_text("x")
assert list_images(d) == ["1.jpg", "10.jpg", "2.jpg"], "сортировка строковая (как sorted по именам)"
print("✓ порядок сортировки")
`,
    'lib-plt-curves': R`fig = plot_history([1.0], [0.3])
assert len(fig.axes) == 2 and len(fig.axes[0].get_lines()) == 1, "работает и для одной эпохи"
print("✓ одна эпоха")
`,

    'lib-pd-gt': R`CSV = "filename,class_id\n" + "".join(f"{i:04d}.jpg,{i % 50}\n" for i in range(2500))
assert len(read_gt(CSV)) == 2500 and class_counts(CSV) == {c: 50 for c in range(50)}, "большая разметка: 2500 файлов, по 50 на класс"
print("✓ размер как в задании")
`,
    'lib-pd-best': R`import pandas as pd
df = pd.DataFrame({"model": ["x"], "lr": [0.1], "seed": [0], "val_acc": [0.5]})
r = best_by_model(df)
assert len(r) == 1 and r.iloc[0]["model"] == "x", "одна модель — одна строка"
print("✓ одна модель")
`,
    'lib-pd-agg': R`import pandas as pd, numpy as np
df = pd.DataFrame({"model": ["m"] * 4, "lr": [0.1, 0.1, 0.01, 0.01], "seed": [0, 1, 0, 1], "val_acc": [0.5, 0.7, 0.8, 0.8]})
s = summary(df)
assert list(s["n"]) == [2, 2] and np.isclose(s.loc[("m", 0.01), "std"], 0), "одинаковые результаты — std = 0"
print("✓ нулевой разброс")
assert s["mean"].is_monotonic_decreasing, "сортировка по mean по убыванию"
print("✓ сортировка")
`,
    'lib-pd-fill': R`import pandas as pd, numpy as np
df = pd.DataFrame({"g": ["a", "b"], "x": [np.nan, 5.0]})
r = fill_by_group(df, "g", "x")
assert np.isnan(r["x"].iloc[0]) and r["x"].iloc[1] == 5.0, "если в группе нет ни одного значения — пропуск остаётся"
print("✓ группа без значений")
`,
    'lib-sk-pipeline': R`import numpy as np
from sklearn.datasets import make_classification
X, y = make_classification(n_samples=200, n_features=6, random_state=1)
m = make_model().fit(X, y)
assert m.predict_proba(X[:3]).shape == (3, 2), "Pipeline умеет predict_proba"
print("✓ predict_proba")
`,
    'lib-sk-probe': R`import numpy as np
rng = np.random.default_rng(5)
Xtr = rng.normal(size=(60, 4)); ytr = rng.integers(0, 3, 60)
Xva = rng.normal(size=(30, 4)); yva = rng.integers(0, 3, 30)
X0 = Xtr.copy(); acc, cm = probe(Xtr, ytr, Xva, yva)
assert np.array_equal(Xtr, X0), "входные признаки не меняются"
assert 0 <= acc <= 1 and cm.shape == (3, 3), "на случайных данных — просто корректные формы и диапазон"
print("✓ случайные признаки")
`,
    'lib-sk-split': R`import numpy as np
y = np.array([0, 1, 2] * 20); X = np.arange(60).reshape(-1, 1)
Xtr, Xte, ytr, yte = split(X, y, test_size=0.5)
assert all((yte == c).sum() == 10 for c in range(3)), "три класса, половина в test — по 10 каждого"
print("✓ три класса")
`,
    'lib-ski-metrics#2': R`import numpy as np
a = np.random.default_rng(2).integers(0, 256, (16, 16)).astype(np.uint8)
p, s = quality(a, 255 - a)
assert p < 10 and s < 0.5, "инверсия картинки — очень низкие PSNR и SSIM"
print("✓ инверсия")
`,
  };

  (window.ML_TASKS || []).forEach((t) => {
    [X[t.id], X[t.id + '#2']].forEach((extra) => { if (extra) t.tests = t.tests.replace(/\s*$/, '\n') + extra; });
  });
})();
