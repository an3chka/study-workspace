// ML → «Библиотеки»: самые нужные для учёбы и собеседований.
// Для каждой: зачем, разделы с кодом (Markdown), шпаргалка, ловушки, вопросы, тест «что выведет код» и задачи.
(function () {
  'use strict';
  const R = String.raw;

  window.ML_LIBS = [
    // ======================================================================
    {
      id: 'numpy', name: 'NumPy', used: 'основа всего', icon: 'grid',
      why: 'Основа всего: картинки, матрицы, вычисления без циклов. На NumPy построены pandas, scikit-learn, SciPy, а тензоры PyTorch устроены так же.',
      notes: ['01 ndarray, dtype и shape', '02 Axis и broadcasting', '03 Индексация, view, strides и векторизация', '04 ufunc, линейная алгебра и random', '05 NumPy для ML и типичные ошибки'],
      sections: [
        R`## Массив: shape, dtype, оси
` + '```python' + R`
import numpy as np
img = np.zeros((480, 640, 3), dtype=np.uint8)   # картинка H×W×3
img.shape, img.dtype, img.ndim                  # (480, 640, 3), uint8, 3
x = np.arange(6).reshape(2, 3)                  # [[0 1 2] [3 4 5]]
x.astype(np.float32) / 255                      # смена типа — новый массив
` + '```' + R`
**dtype решает многое.** uint8 хранит 0..255 и переполняется по кругу: ` + '`np.uint8(200) + np.uint8(100)` → `44`' + R`. Поэтому перед арифметикой картинки приводят к float, а в конце — ` + '`np.clip(...)`' + R` и обратно в uint8.`,
        R`## Индексация: срез — это окно, маска — копия
` + '```python' + R`
a = np.arange(10)
v = a[2:5]          # view: общая память с a
v[0] = 100          # a[2] тоже стал 100!
c = a[[1, 3]]       # fancy-индексация — копия
m = a[a > 4]        # маска — копия
np.shares_memory(a, v)   # True
img[:, ::-1]        # отражение — тоже view (с отрицательным шагом)
` + '```' + R`
Срезы, ` + '`reshape`, `transpose`' + R` возвращают view — быстро и без копирования, но изменение view меняет исходник. Нужна независимая копия — ` + '`.copy()`.',
        R`## Оси и broadcasting
Операция по оси «съедает» эту ось: у массива (N, C, H, W) ` + '`x.mean(axis=(2, 3))`' + R` даёт (N, C) — это Global Average Pooling. ` + '`keepdims=True`' + R` оставляет ось размером 1, чтобы результат можно было вычесть обратно.

**Правило broadcasting:** формы выравниваются по правому краю; оси совпадают, если равны или одна из них 1 (она «растягивается»).
` + '```python' + R`
img (H, W, 3)  -  mean (3,)          -> по каналам последней оси
x (3, H, W)    -  mean[:, None, None] -> по каналам первой оси
A (N, 1, D)    -  B (1, M, D)         -> (N, M, D): все пары без циклов
` + '```',
        R`## Векторизация вместо циклов
Цикл по пикселям в Python в сотни раз медленнее операции над массивом. Полезные приёмы:
` + '```python' + R`
np.where(mask, a, b)                 # выбор поэлементно
np.add.at(cm, (y_true, y_pred), 1)   # счётчики с повторами индексов
d = ((A[:, None] - B[None]) ** 2).sum(-1)   # попарные расстояния
np.argsort(scores)[::-1][:k]         # top-k
X @ W                                # матричное умножение
np.linalg.norm(x, axis=1)            # нормы строк
U, S, Vt = np.linalg.svd(X, full_matrices=False)
` + '```',
        R`## Случайность, которая повторяется
` + '```python' + R`
rng = np.random.default_rng(0)       # новый API, свой генератор
rng.normal(size=(3, 4)); rng.integers(0, 10, 5); rng.permutation(10)
` + '```' + R`
Один seed — одинаковые результаты: важно для разбиений train/val и сравнения экспериментов.`,
      ],
      cheats: [
        ['np.zeros((H, W, 3), np.uint8)', 'пустая картинка'],
        ['x.reshape(N, -1)', '«-1» — посчитай сама'],
        ['x.transpose(2, 0, 1)', 'HWC → CHW'],
        ['x[None] / x[:, None]', 'добавить ось'],
        ['x.mean(axis=0, keepdims=True)', 'среднее по столбцам, форма (1, D)'],
        ['np.clip(x, 0, 255).astype(np.uint8)', 'обратно в картинку'],
        ['np.isclose(a, b) / np.allclose', 'сравнение float'],
        ['np.argmax(logits, axis=1)', 'предсказанный класс'],
        ['np.concatenate / np.stack', 'склеить по оси / новая ось'],
        ['np.unique(y, return_counts=True)', 'классы и их количество'],
        ['np.pad(img, 1, mode="edge")', 'дополнить края'],
        ['np.lib.stride_tricks.sliding_window_view', 'окна без копирования'],
      ],
      pitfalls: [
        'Переполнение uint8: складывай и усредняй во float.',
        'View меняет исходник: `b = a[1:]; b[0] = 9` портит `a`.',
        'Формы (n,) и (n, 1) — разные: `(n,) - (n, 1)` даёт матрицу (n, n).',
        '`if arr == other:` — ошибка «truth value is ambiguous», нужно `np.array_equal` или `.all()`.',
        'Сравнение float через `==` — используй `np.isclose`.',
        'Broadcasting по «не той» оси молча даёт неверный ответ на квадратных картинках.',
      ],
      interview: [
        ['Объясни правила broadcasting.', 'Формы выравниваются по правому краю; две оси совместимы, если равны или одна из них равна 1 (тогда она растягивается без копирования). Недостающие слева оси считаются равными 1. Пример: (N, 1, D) и (M, D) → (N, M, D).'],
        ['Чем view отличается от копии? Когда numpy создаёт каждую?', 'View использует ту же память (срезы, reshape, transpose, `[:, ::-1]`), копия — свою (fancy-индексация списком, булева маска, `.copy()`, большинство арифметики). Изменение view меняет исходный массив. Проверить: `np.shares_memory`.'],
        ['Почему векторизованный код на numpy быстрее цикла?', 'Цикл выполняется в C над непрерывной памятью без интерпретатора Python на каждой итерации, без упаковки чисел в объекты, с использованием SIMD и BLAS для линейной алгебры.'],
        ['Чем отличаются `*`, `@` и `np.dot`?', '`*` — поэлементное умножение с broadcasting; `@` (`np.matmul`) — матричное, для >2D работает батчами по ведущим осям; `np.dot` — для 2D то же, что `@`, но для многомерных — другая (сумма по последней оси первого и предпоследней второго), поэтому в новом коде предпочитают `@`.'],
      ],
      quiz: [
        { question: 'Какая форма у `np.ones((3, 1)) + np.ones(4)`?', options: ['(3, 4)', '(3, 1)', '(4,)', 'ошибка'], answer: 0, explain: '(3, 1) и (4,) → (3, 1) и (1, 4) → (3, 4).' },
        { question: 'Что вернёт `np.arange(6).reshape(2, 3)[:, 1]`?', options: ['[1, 4]', '[3, 4, 5]', '[[1], [4]]', '[0, 1, 2]'], answer: 0, explain: 'Все строки, столбец 1: элементы 1 и 4. Результат одномерный.' },
        { question: '`a = np.array([200], np.uint8); a + 100` → ?', options: ['[300]', '[44]', '[255]', 'ошибка'], answer: 1, explain: 'uint8 переполняется по модулю 256: 300 − 256 = 44.' },
        { question: '`a = np.arange(5); b = a[1:3]; b[0] = 9`. Чему равно `a`?', options: ['[0, 1, 2, 3, 4]', '[0, 9, 2, 3, 4]', '[9, 1, 2, 3, 4]', '[0, 1, 9, 3, 4]'], answer: 1, explain: 'Срез — view: b[0] — это a[1].' },
        { question: 'x имеет форму (5, 3). Какая форма у `x.mean(axis=0)`?', options: ['(5,)', '(3,)', '(1, 3)', '()'], answer: 1, explain: 'Ось 0 «съедается»: остаётся (3,). С keepdims=True было бы (1, 3).' },
      ],
    },
    // ======================================================================
    {
      id: 'pytorch', name: 'PyTorch', used: 'нейросети', icon: 'zap', local: true,
      why: 'Нейросети: тензоры, автоматические градиенты, слои, оптимизаторы, загрузка данных. Главный инструмент для нейросетей и почти всех DL-собеседований.',
      notes: ['01 Tensors, shapes и autograd', '02 nn.Module, loss и optimizer', '03 Train loop, validation и DataLoader', '04 BatchNorm, scheduler и mixed precision', '05 Checkpoint, воспроизводимость и диагностика'],
      sections: [
        R`## Тензоры — это numpy с градиентами и GPU
` + '```python' + R`
import torch
x = torch.zeros(2, 3)                    # float32 по умолчанию
t = torch.from_numpy(arr)                # общая память с numpy-массивом
t.float(), t.long(), t.to("cuda")        # тип и устройство
x.shape, x.dtype, x.device
x.view(2, -1)     # как reshape, но только для непрерывной памяти
x.permute(2, 0, 1)   # переставить оси (HWC → CHW)
x.unsqueeze(0)       # добавить ось батча: (C,H,W) → (1,C,H,W)
x.argmax(dim=1)      # dim — то же, что axis в numpy
` + '```' + R`
Broadcasting и индексация — как в NumPy. После ` + '`permute`' + R` память «непрерывной» быть перестаёт: ` + '`view`' + R` упадёт, нужен ` + '`reshape`' + R` или ` + '`.contiguous()`' + R`.`,
        R`## Autograd: градиенты сами
` + '```python' + R`
w = torch.tensor([2.0], requires_grad=True)
loss = (w * 3 - 1) ** 2
loss.backward()          # заполняет w.grad
w.grad                   # tensor([30.]) = 2·(3w−1)·3
with torch.no_grad():    # без графа: оценка, обновление весов вручную
    w -= 0.1 * w.grad
w.grad.zero_()           # градиенты накапливаются — обнуляем
` + '```' + R`
` + '`.detach()`' + R` отрывает тензор от графа, ` + '`.item()`' + R` достаёт число из тензора-скаляра (для логов), ` + '`.numpy()`' + R` работает только без градиента и на CPU.`,
        R`## nn.Module, loss, optimizer
` + '```python' + R`
from torch import nn
model = nn.Sequential(nn.Flatten(), nn.Linear(784, 128), nn.ReLU(), nn.Linear(128, 10))
loss_fn = nn.CrossEntropyLoss()          # ждёт ЛОГИТЫ и метки long
opt = torch.optim.AdamW(model.parameters(), lr=1e-3)

model.train()
for x, y in loader:
    loss = loss_fn(model(x), y)
    opt.zero_grad(); loss.backward(); opt.step()

model.eval()
with torch.no_grad():
    pred = model(x).argmax(1)
` + '```' + R`
` + '`train()/eval()`' + R` переключают поведение Dropout и BatchNorm, ` + '`no_grad()`' + R` выключает построение графа — это разные вещи, нужны обе.`,
        R`## Данные: Dataset и DataLoader
` + '```python' + R`
class Images(torch.utils.data.Dataset):
    def __len__(self): ...
    def __getitem__(self, i): return image_tensor, label
loader = torch.utils.data.DataLoader(ds, batch_size=32, shuffle=True, num_workers=0)
` + '```' + R`
DataLoader сам собирает батч: тензоры складываются по новой оси 0, числа-метки превращаются в тензор long.`,
        R`## Сохранить и загрузить
` + '```python' + R`
torch.save(model.state_dict(), "model.pt")              # только веса
model = build_model(pretrained=False)                    # та же архитектура
model.load_state_dict(torch.load("model.pt", map_location="cpu"))
model.eval()
` + '```' + R`
Сохраняют ` + '`state_dict`' + R`, а не модель целиком: так файл не зависит от кода класса. Ключи словаря — пути к параметрам (` + '`0.3.weight`' + R`), поэтому архитектура при загрузке должна совпадать.`,
      ],
      cheats: [
        ['torch.manual_seed(0)', 'воспроизводимость'],
        ['x.permute(0, 3, 1, 2)', 'NHWC → NCHW'],
        ['x.unsqueeze(0) / x.squeeze(0)', 'добавить / убрать ось'],
        ['logits.argmax(1)', 'классы'],
        ['logits.softmax(1)', 'вероятности'],
        ['(pred == y).float().mean().item()', 'accuracy числом'],
        ['sum(p.numel() for p in m.parameters() if p.requires_grad)', 'обучаемые параметры'],
        ['for p in m.parameters(): p.requires_grad = False', 'заморозить'],
        ['torch.flip(x, dims=[3])', 'отражение по ширине'],
        ['torch.load(path, map_location="cpu")', 'загрузка без GPU'],
        ['nn.utils.clip_grad_norm_(m.parameters(), 1.0)', 'обрезать градиенты'],
        ['torch.inference_mode()', 'быстрее no_grad для предсказаний'],
      ],
      pitfalls: [
        'Softmax перед CrossEntropyLoss — лишний: лосс сам делает log_softmax.',
        'Метки должны быть `long` (целые номера классов), не float и не one-hot.',
        'Забытый `opt.zero_grad()` — градиенты копятся между батчами.',
        'Забытый `model.eval()` — Dropout и BatchNorm ведут себя как на обучении.',
        '`loss` без `.item()` в списке для логов — тянет за собой весь граф и память.',
        '`view` после `permute` падает: используй `reshape`.',
      ],
      interview: [
        ['Что делает loss.backward() и куда кладёт результат?', 'Проходит граф вычислений от loss назад по правилу цепочки и прибавляет градиенты к полю `.grad` каждого листового тензора с `requires_grad=True`. Именно прибавляет — поэтому перед новым шагом их обнуляют.'],
        ['Чем model.eval() отличается от torch.no_grad()?', '`eval()` меняет поведение слоёв: Dropout выключается, BatchNorm берёт накопленные статистики. `no_grad()` выключает построение графа автодифференцирования — экономит память и время. На валидации нужны оба.'],
        ['Почему CrossEntropyLoss принимает логиты, а не вероятности?', 'Внутри он считает log_softmax численно устойчивым способом (с вычитанием максимума). Если подать вероятности, будет двойной softmax и неверные градиенты; если считать log(softmax) отдельно — риск log(0).'],
        ['view и reshape — в чём разница?', '`view` не копирует данные и требует непрерывной памяти; `reshape` возвращает view, если можно, иначе копию. После `permute`/`transpose` память не непрерывна — `view` упадёт.'],
      ],
      quiz: [
        { question: 'x имеет форму (8, 224, 224, 3). Что даст `x.permute(0, 3, 1, 2).shape`?', options: ['(8, 3, 224, 224)', '(3, 8, 224, 224)', '(8, 224, 3, 224)', '(224, 224, 8, 3)'], answer: 0, explain: 'Новый порядок осей: 0, 3, 1, 2 → N, C, H, W.' },
        { question: 'Логиты формы (32, 50). Какая форма у `logits.argmax(1)`?', options: ['(32,)', '(50,)', '(32, 1)', '()'], answer: 0, explain: 'По оси классов — по одному номеру на пример.' },
        { question: '`w = torch.tensor(1., requires_grad=True); (w * w).backward(); (w * w).backward(); w.grad` → ?', options: ['2', '4', '1', 'ошибка'], answer: 1, explain: 'Градиенты накапливаются: 2 + 2 = 4.' },
        { question: 'Какой тип меток нужен для nn.CrossEntropyLoss в классификации?', options: ['torch.long', 'torch.float32', 'torch.bool', 'one-hot float'], answer: 0, explain: 'Номера классов типа long (есть вариант с вероятностями классов, но стандарт — long).' },
        { question: 'Что выключает `torch.no_grad()`?', options: ['Dropout', 'BatchNorm', 'построение графа градиентов', 'оптимизатор'], answer: 2, explain: 'Слои переключает `model.eval()`.' },
      ],
    },
    // ======================================================================
    {
      id: 'torchvision', name: 'torchvision', used: 'дообучение моделей', icon: 'image', local: true,
      why: 'Готовые модели с весами ImageNet, преобразования картинок и датасеты. На нём удобно строить дообучение (fine-tuning) предобученных моделей.',
      notes: ['04 BatchNorm, scheduler и mixed precision'],
      sections: [
        R`## Модели и веса
` + '```python' + R`
import torchvision
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights
m = mobilenet_v2(weights=MobileNet_V2_Weights.IMAGENET1K_V2)   # или weights="DEFAULT"
m = mobilenet_v2(weights=None)            # та же архитектура без скачивания весов
m.features        # свёрточная часть (19 блоков)
m.classifier      # Dropout + Linear(1280, 1000)
weights = MobileNet_V2_Weights.DEFAULT
preprocess = weights.transforms()         # правильные resize/crop/normalize для этих весов
` + '```' + R`
У разных архитектур голова называется по-разному: ` + '`classifier`' + R` (MobileNet, EfficientNet, ConvNeXt), ` + '`fc`' + R` (ResNet), ` + '`heads`' + R` (ViT). Число входов головы: ` + '`m.classifier[-1].in_features`' + R` или ` + '`m.fc.in_features`' + R`.`,
        R`## Преобразования
` + '```python' + R`
from torchvision import transforms as T
train_tf = T.Compose([
    T.RandomResizedCrop(224, scale=(0.6, 1.0)),
    T.RandomHorizontalFlip(),
    T.ColorJitter(0.2, 0.2, 0.2),
    T.ToTensor(),                     # PIL (H,W,C) uint8 → (C,H,W) float [0,1]
    T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
eval_tf = T.Compose([T.Resize(256), T.CenterCrop(224), T.ToTensor(), T.Normalize(...)])
` + '```' + R`
` + '`Resize(256)`' + R` с одним числом — меньшая сторона 256, пропорции сохраняются; ` + '`Resize((256, 256))`' + R` — ровно квадрат (искажает). Случайные преобразования — только для обучения.`,
        R`## Датасеты и утилиты
` + '```python' + R`
ds = torchvision.datasets.ImageFolder("data/train", transform=train_tf)  # папки = классы
ds.classes, ds.class_to_idx
grid = torchvision.utils.make_grid(batch[:16], nrow=4, normalize=True)  # картинка-сетка для просмотра
` + '```',
      ],
      cheats: [
        ['weights="DEFAULT"', 'лучшие доступные веса'],
        ['weights=None', 'без скачивания (тест без интернета)'],
        ['weights.transforms()', 'препроцессинг под веса'],
        ['m.features / m.classifier', 'части MobileNet'],
        ['nn.Sequential(*list(resnet.children())[:-2])', 'backbone ResNet без головы'],
        ['T.Resize(256) + T.CenterCrop(224)', 'eval-препроцессинг'],
        ['T.RandomResizedCrop(224)', 'сильная аугментация масштаба'],
        ['T.RandomErasing()', 'после ToTensor'],
        ['ImageFolder(root)', 'датасет из папок-классов'],
      ],
      pitfalls: [
        '`RandomErasing` работает с тензором — ставь после `ToTensor`.',
        'Нормализация должна совпадать с той, на которой учили веса (ImageNet mean/std).',
        'Без интернета веса не скачаются: создавай модель с `weights=None` и загружай свои веса через `load_state_dict`.',
        '`Resize((h, w))` с кортежем искажает пропорции.',
      ],
      interview: [
        ['Как заменить голову у предобученной модели на свою задачу?', 'Узнать число входов последнего слоя (`in_features`), заменить слой на `nn.Linear(in_features, n_classes)` (у MobileNet — `classifier[-1]`, у ResNet — `fc`). Остальное — заморозить целиком или частично и дообучать с маленьким LR.'],
        ['Почему eval-преобразования делают Resize(256) + CenterCrop(224), а не сразу Resize(224)?', 'Так повторяется протокол, на котором обучали и оценивали ImageNet-модели: объект в центре занимает привычную долю кадра, пропорции не искажаются. Resize((224, 224)) исказил бы форму.'],
      ],
      quiz: [
        { question: 'Что делает `T.ToTensor()` с PIL-картинкой 300×200 (ширина×высота) RGB?', options: ['тензор (3, 200, 300) в [0, 1]', 'тензор (300, 200, 3) в [0, 255]', 'тензор (3, 300, 200) в [0, 1]', 'numpy (200, 300, 3)'], answer: 0, explain: 'PIL size = (W, H); ToTensor даёт (C, H, W) float в [0, 1].' },
        { question: 'Картинка 400×300 (W×H). Какой размер после `T.Resize(256)`?', options: ['341×256', '256×256', '256×192', '400×300'], answer: 0, explain: 'Меньшая сторона (высота 300) → 256, ширина 400·256/300 ≈ 341.' },
        { question: 'Как в MobileNetV2 называется свёрточная часть без головы?', options: ['m.features', 'm.backbone', 'm.fc', 'm.layers'], answer: 0, explain: 'features — 19 блоков, classifier — голова.' },
      ],
    },
    // ======================================================================
    {
      id: 'pillow', name: 'Pillow (PIL)', used: 'картинки', icon: 'image',
      why: 'Чтение, сохранение и простые преобразования картинок. Через Pillow картинки попадают в torchvision-преобразования.',
      notes: [],
      sections: [
        R`## Открыть, посмотреть, превратить в массив
` + '```python' + R`
from PIL import Image
import numpy as np
img = Image.open("bird.jpg")        # ленивое чтение: пиксели загрузятся при обращении
img.size, img.mode                  # (W, H) — ширина первой!, "RGB" / "L" / "RGBA" / "P"
img = img.convert("RGB")            # привести к 3 каналам (серые и PNG с прозрачностью бывают)
arr = np.asarray(img)               # (H, W, 3) uint8 — высота первой!
back = Image.fromarray(arr.astype(np.uint8))
` + '```' + R`
**Главная путаница:** у Pillow ` + '`size = (ширина, высота)`' + R`, у numpy ` + '`shape = (высота, ширина, каналы)`' + R`.`,
        R`## Преобразования
` + '```python' + R`
img.resize((w, h), Image.BILINEAR)     # ровно этот размер
img.thumbnail((256, 256))              # уменьшить на месте, сохраняя пропорции
img.crop((left, top, right, bottom))   # правая и нижняя граница не включаются
img.transpose(Image.FLIP_LEFT_RIGHT)
from PIL import ImageOps
img = ImageOps.exif_transpose(img)     # повернуть по EXIF (фото с телефона)
img.save("out.png")
` + '```' + R`
` + '`.convert("RGB")`' + R` в ` + '`Dataset.__getitem__`' + R` — не мелочь: без него чёрно-белая картинка даст 1 канал, PNG с прозрачностью — 4, и батч не соберётся.`,
      ],
      cheats: [
        ['Image.open(p).convert("RGB")', 'безопасное чтение'],
        ['img.size → (W, H)', 'ширина первой'],
        ['np.asarray(img) → (H, W, C)', 'в numpy'],
        ['Image.fromarray(arr)', 'из numpy (uint8!)'],
        ['img.crop((l, t, r, b))', 'вырезать'],
        ['img.resize((w, h))', 'точный размер'],
        ['img.thumbnail((m, m))', 'вписать с пропорциями'],
        ['ImageOps.exif_transpose(img)', 'учесть поворот камеры'],
      ],
      pitfalls: [
        '`img.size` — (W, H), а `arr.shape` — (H, W, C).',
        '`Image.fromarray` с float-массивом создаёт режим «F», а не картинку RGB: сначала `clip` и `astype(np.uint8)`.',
        'Без `.convert("RGB")` встречаются картинки с 1 или 4 каналами.',
        '`thumbnail` меняет картинку на месте и ничего не возвращает.',
      ],
      interview: [
        ['Почему в Dataset картинку приводят к RGB?', 'В датасетах встречаются серые (режим L, 1 канал), палитровые (P) и с прозрачностью (RGBA, 4 канала). Модель ждёт ровно 3 канала, а DataLoader не соберёт батч из тензоров разной формы.'],
      ],
      quiz: [
        { question: 'Картинка 640×480 (ширина×высота). Какая форма у `np.asarray(img)` для RGB?', options: ['(480, 640, 3)', '(640, 480, 3)', '(3, 480, 640)', '(3, 640, 480)'], answer: 0, explain: 'numpy: высота, ширина, каналы.' },
        { question: 'Что вернёт `img.crop((10, 20, 110, 70)).size`?', options: ['(100, 50)', '(50, 100)', '(110, 70)', '(101, 51)'], answer: 0, explain: 'Ширина 110 − 10 = 100, высота 70 − 20 = 50; правая и нижняя граница не включаются.' },
      ],
    },
    // ======================================================================
    {
      id: 'matplotlib', name: 'matplotlib', used: 'графики', icon: 'chart',
      why: 'Графики обучения, картинки, гистограммы. Без визуализации трудно понять, что модель видит и как учится.',
      notes: ['01 Matplotlib — фигура, оси и базовые графики', '02 Seaborn — статистические графики', '03 Визуализация EDA и диагностики ML'],
      sections: [
        R`## Figure и Axes
` + '```python' + R`
import matplotlib.pyplot as plt
fig, axes = plt.subplots(1, 2, figsize=(10, 4))   # фигура и массив осей
axes[0].plot(train_loss, label="train"); axes[0].plot(val_loss, label="val")
axes[0].set_title("Loss"); axes[0].set_xlabel("эпоха"); axes[0].legend()
axes[1].plot(val_acc); axes[1].set_title("Accuracy")
fig.tight_layout(); fig.savefig("curves.png", dpi=150)
` + '```' + R`
Объектный стиль (` + '`fig, ax`' + R`) понятнее, чем ` + '`plt.plot`' + R` подряд: всегда видно, на какой график рисуешь.`,
        R`## Картинки
` + '```python' + R`
ax.imshow(img)                          # uint8 0..255 или float 0..1
ax.imshow(gray, cmap="gray", vmin=0, vmax=255)
ax.axis("off")
ax.imshow(x.permute(1, 2, 0).numpy())   # тензор (C,H,W) → (H,W,C)
` + '```' + R`
Нормализованный тензор (с отрицательными значениями) нужно «разнормализовать»: ` + '`x * std + mean`' + R`, иначе imshow обрежет значения и цвета будут странными.`,
      ],
      cheats: [
        ['fig, ax = plt.subplots()', 'один график'],
        ['fig, axes = plt.subplots(r, c)', 'сетка'],
        ['ax.plot(x, y, label=...)', 'линия'],
        ['ax.hist(values, bins=30)', 'гистограмма'],
        ['ax.imshow(img, cmap="gray")', 'картинка'],
        ['ax.set_title / set_xlabel / legend', 'подписи'],
        ['fig.tight_layout()', 'без наложений'],
        ['fig.savefig("a.png", dpi=150)', 'сохранить'],
      ],
      pitfalls: [
        'Серая картинка без `cmap="gray"` рисуется в зелёно-фиолетовой палитре viridis.',
        'Без `vmin/vmax` imshow растягивает контраст по min/max картинки.',
        'Тензор (C, H, W) нужно переставить в (H, W, C).',
      ],
      interview: [
        ['Какие графики ты смотришь во время обучения?', 'Train и val loss, val-метрику и learning rate по эпохам; при проблемах — гистограммы градиентов/активаций, примеры ошибок модели и матрицу ошибок.'],
      ],
      quiz: [
        { question: 'Как правильно показать тензор x формы (3, H, W)?', options: ['ax.imshow(x.permute(1, 2, 0).numpy())', 'ax.imshow(x)', 'ax.imshow(x.T)', 'ax.imshow(x.reshape(H, W, 3))'], answer: 0, explain: 'reshape перемешает пиксели, а .T перевернёт оси в порядок (W, H, C).' },
      ],
    },
    // ======================================================================
    {
      id: 'scipy', name: 'SciPy', used: 'научные вычисления', icon: 'sparkles',
      why: 'Научные вычисления поверх NumPy: фильтры изображений, DCT/FFT, оптимизация, статистика.',
      notes: ['03 Матстатистика — минимум', '04 Проверка гипотез — минимум'],
      sections: [
        R`## Изображения: scipy.ndimage
` + '```python' + R`
from scipy import ndimage
ndimage.gaussian_filter(img, sigma=2)     # размытие
ndimage.median_filter(img, size=3)        # убирает шум «соль и перец»
ndimage.convolve(img, kernel, mode="reflect")
ndimage.zoom(img, 0.5, order=1)           # масштаб с билинейной интерполяцией
ndimage.shift(img, (dy, dx), order=0)
ndimage.sobel(img, axis=0)                # градиент по вертикали
` + '```',
        R`## DCT и FFT (основа JPEG-сжатия)
` + '```python' + R`
from scipy.fft import dct, idct
def dct2(b):  return dct(dct(b, axis=0, norm="ortho"), axis=1, norm="ortho")
def idct2(c): return idct(idct(c, axis=0, norm="ortho"), axis=1, norm="ortho")
` + '```' + R`
С ` + '`norm="ortho"`' + R` преобразование ортонормированное: обратное — транспонированное, энергия сохраняется (сумма квадратов до и после одинакова).`,
        R`## Оптимизация и статистика
` + '```python' + R`
from scipy.optimize import minimize
res = minimize(lambda w: ((X @ w - y) ** 2).mean(), x0=np.zeros(d))
from scipy import stats
stats.ttest_ind(a, b)        # сравнить средние двух выборок
` + '```',
      ],
      cheats: [
        ['ndimage.gaussian_filter(img, s)', 'размытие'],
        ['ndimage.median_filter(img, 3)', 'медиана — против импульсного шума'],
        ['ndimage.convolve(img, k)', 'свёртка (с переворотом ядра)'],
        ['ndimage.correlate(img, k)', 'корреляция (как свёртка в нейросетях)'],
        ['dct(x, norm="ortho")', 'ортонормированное DCT'],
        ['scipy.optimize.minimize', 'численная минимизация'],
        ['scipy.stats.ttest_ind', 't-тест'],
      ],
      pitfalls: [
        '`ndimage.convolve` переворачивает ядро, а «свёртка» в нейросетях — это корреляция (`ndimage.correlate`).',
        'Для цветной картинки фильтр по умолчанию смешает и каналы: задавай `sigma=(s, s, 0)`.',
        'Без `norm="ortho"` DCT не сохраняет энергию и обратное нужно масштабировать.',
      ],
      interview: [
        ['Чем медианный фильтр отличается от гауссова?', 'Гауссов — линейное усреднение с весами: размывает и шум, и границы. Медианный — нелинейный: берёт медиану окна, поэтому убирает импульсный шум («соль и перец») и лучше сохраняет резкие границы.'],
      ],
      quiz: [
        { question: 'Какой фильтр лучше против шума «соль и перец»?', options: ['медианный', 'гауссов', 'Собеля', 'лапласиан'], answer: 0, explain: 'Медиана игнорирует редкие выбросы.' },
      ],
    },
    // ======================================================================
    {
      id: 'skimage', name: 'scikit-image', used: 'обработка изображений', icon: 'image',
      why: 'Обработка изображений: цветовые пространства, ресайз, фильтры, метрики качества (PSNR, SSIM), детекторы границ.',
      notes: [],
      sections: [
        R`## Типы данных — главное правило
scikit-image ждёт float в ` + '`[0, 1]`' + R` или uint8 в ` + '`[0, 255]`' + R`, и многие функции возвращают float:
` + '```python' + R`
from skimage import img_as_float, img_as_ubyte, color, transform
f = img_as_float(img_uint8)         # 0..255 → 0..1
small = transform.resize(img, (128, 128), anti_aliasing=True)   # float 0..1!
gray = color.rgb2gray(rgb)           # float 0..1, веса 0.2125 R + 0.7154 G + 0.0721 B
u8 = img_as_ubyte(gray)              # обратно 0..255
` + '```',
        R`## Метрики качества и фильтры
` + '```python' + R`
from skimage.metrics import peak_signal_noise_ratio, structural_similarity
peak_signal_noise_ratio(ref, test, data_range=255)
structural_similarity(ref, test, data_range=255)          # серые
structural_similarity(a, b, channel_axis=-1, data_range=255)  # цветные
from skimage import filters, feature
filters.sobel(gray); feature.canny(gray, sigma=2)
` + '```' + R`
SSIM сравнивает локальную яркость, контраст и структуру — ближе к восприятию, чем PSNR.`,
      ],
      cheats: [
        ['img_as_float / img_as_ubyte', 'перевод типов со шкалой'],
        ['color.rgb2gray(rgb)', 'в оттенки серого'],
        ['color.rgb2ycbcr(rgb)', 'YCbCr (JPEG)'],
        ['transform.resize(img, (h, w))', 'ресайз (вернёт float)'],
        ['transform.rescale(img, 0.5, channel_axis=-1)', 'масштаб'],
        ['metrics.peak_signal_noise_ratio', 'PSNR'],
        ['metrics.structural_similarity', 'SSIM'],
        ['feature.canny(gray)', 'границы'],
      ],
      pitfalls: [
        '`transform.resize` возвращает float 0..1 — если сравнить с uint8-картинкой, получится ерунда; используй `preserve_range=True` или `img_as_ubyte`.',
        'Для PSNR/SSIM указывай `data_range`, иначе он угадывается по типу.',
      ],
      interview: [
        ['Почему SSIM часто лучше PSNR?', 'PSNR смотрит только на среднеквадратичную ошибку по пикселям. SSIM сравнивает локальные средние, дисперсии и ковариацию окон — то есть структуру. Небольшой сдвиг яркости сильно портит PSNR, но почти не меняет SSIM; размытие наоборот заметно по SSIM.'],
      ],
      quiz: [
        { question: 'Что вернёт `transform.resize(img_uint8, (64, 64))`?', options: ['float в [0, 1]', 'uint8 в [0, 255]', 'float в [0, 255]', 'зависит от размера'], answer: 0, explain: 'По умолчанию результат приводится к float 0..1 (если не задать preserve_range=True).' },
      ],
    },
    // ======================================================================
    {
      id: 'pandas', name: 'pandas', used: 'нужен на собеседованиях', icon: 'list',
      why: 'Таблицы: разметка, логи экспериментов, табличные данные. Почти на каждом ML-собеседовании есть задача на pandas.',
      notes: ['01 Series, DataFrame, Index и выбор данных', '02 Пропуски, дубликаты и сортировка', '03 GroupBy, merge и concat', '04 Reshape, даты, rolling и строки', '05 Производительность, EDA и feature engineering'],
      sections: [
        R`## DataFrame и выбор данных
` + '```python' + R`
import pandas as pd
df = pd.read_csv("labels.csv")      # filename, class_id — разметка картинок
df.head(); df.shape; df.dtypes; df.describe()
df["class_id"]                      # столбец (Series)
df.loc[df["class_id"] == 3, "filename"]   # строки по условию, столбец по имени
df.iloc[:5, 0]                      # по номерам
df["class_id"].value_counts()       # сколько картинок в каждом классе
dict(zip(df["filename"], df["class_id"]))   # обратно в словарь, как train_gt
` + '```' + R`
` + '`loc`' + R` — по меткам (и условиям), ` + '`iloc`' + R` — по позициям. Цепочка ` + '`df[mask]["col"] = ...`' + R` пишет в копию — используй ` + '`df.loc[mask, "col"] = ...`.',
        R`## GroupBy: «разбей — посчитай — собери»
` + '```python' + R`
log = pd.DataFrame({"model": [...], "lr": [...], "seed": [...], "val_acc": [...]})
log.groupby("model")["val_acc"].mean()
log.groupby(["model", "lr"])["val_acc"].agg(["mean", "std"]).sort_values("mean", ascending=False)
log.loc[log.groupby("model")["val_acc"].idxmax()]      # лучшая строка в каждой группе
log["rank"] = log.groupby("model")["val_acc"].rank(ascending=False)   # transform-подобное: та же длина
` + '```' + R`
` + '`agg`' + R` сворачивает группу в одно значение, ` + '`transform`' + R` возвращает значение для каждой строки (удобно для заполнения пропусков средним по группе).`,
        R`## Пропуски, объединение
` + '```python' + R`
df.isna().sum()
df["x"] = df["x"].fillna(df.groupby("g")["x"].transform("median"))
df.dropna(subset=["label"])
pd.merge(images, labels, on="filename", how="left")   # как JOIN в SQL
pd.concat([df1, df2], ignore_index=True)
` + '```',
      ],
      cheats: [
        ['pd.read_csv(path)', 'прочитать CSV'],
        ['df.loc[mask, "col"]', 'строки по условию'],
        ['df["c"].value_counts()', 'частоты'],
        ['df.groupby("g")["x"].agg(["mean", "std"])', 'статистики по группам'],
        ['df.groupby("g")["x"].transform("mean")', 'значение группы в каждой строке'],
        ['df.sort_values("x", ascending=False)', 'сортировка'],
        ['pd.merge(a, b, on="k", how="left")', 'объединение'],
        ['df.isna().sum()', 'пропуски по столбцам'],
        ['df.reset_index(drop=True)', 'сбросить индекс'],
        ['df.to_dict("records")', 'в список словарей'],
      ],
      pitfalls: [
        'Цепочка присваиваний `df[mask]["c"] = v` — SettingWithCopyWarning и изменения могут потеряться.',
        '`apply` с Python-функцией по строкам медленный — сначала ищи векторную операцию.',
        'После фильтрации и `groupby` индекс «дырявый» — `reset_index(drop=True)`.',
        '`merge` с дубликатами ключей размножает строки — проверяй размер до и после.',
      ],
      interview: [
        ['Чем отличаются loc и iloc?', '`loc` выбирает по меткам индекса и названиям столбцов (и по булевым маскам), срез включает правую границу. `iloc` — по целым позициям, срез без правой границы, как в Python.'],
        ['Чем agg отличается от transform в groupby?', '`agg` возвращает по одному значению на группу (размер = число групп). `transform` возвращает результат той же длины, что и исходный DataFrame, — значение группы приписывается каждой её строке.'],
        ['Как найти в каждой группе строку с максимальным значением?', '`df.loc[df.groupby("g")["x"].idxmax()]` или отсортировать по x по убыванию и взять `groupby("g").head(1)`.'],
      ],
      quiz: [
        { question: '`df` из 10 строк, 3 группы. Какая длина у `df.groupby("g")["x"].transform("mean")`?', options: ['10', '3', '1', '13'], answer: 0, explain: 'transform сохраняет длину исходной таблицы.' },
        { question: '`df.loc[0:2]` при индексе 0..9 вернёт сколько строк?', options: ['3', '2', '0', 'ошибка'], answer: 0, explain: 'loc включает правую границу (0, 1, 2), iloc[0:2] — две строки.' },
      ],
    },
    // ======================================================================
    {
      id: 'sklearn', name: 'scikit-learn', used: 'нужен на собеседованиях', icon: 'target',
      why: 'Классический ML: модели, препроцессинг, кросс-валидация, метрики. Единый интерфейс fit / predict / transform.',
      notes: ['01 Estimator, Transformer и Pipeline', '02 Scaling, CV, метрики и threshold', '03 Tuning, baseline и custom transformer', '04 Дисбаланс, калибровка и feature selection', '05 Сохранение, воспроизводимость и ошибки'],
      sections: [
        R`## Единый интерфейс
` + '```python' + R`
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
model.fit(X_train, y_train)
model.predict(X_val); model.predict_proba(X_val)[:, 1]
` + '```' + R`
**Estimator** учится (` + '`fit`' + R`) и предсказывает, **transformer** учится и преобразует (` + '`fit` / `transform`' + R`). **Pipeline** склеивает их, чтобы scaler учился только на train — защита от утечки.`,
        R`## Разбиения и кросс-валидация
` + '```python' + R`
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
X_tr, X_va, y_tr, y_va = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
cv = StratifiedKFold(5, shuffle=True, random_state=0)
cross_val_score(model, X, y, cv=cv, scoring="accuracy").mean()
` + '```' + R`
` + '`stratify=y`' + R` — та же доля классов в обеих частях (стратифицированное разбиение по классам).`,
        R`## Подбор гиперпараметров и метрики
` + '```python' + R`
from sklearn.model_selection import GridSearchCV
gs = GridSearchCV(model, {"logisticregression__C": [0.1, 1, 10]}, cv=cv).fit(X, y)
gs.best_params_, gs.best_score_
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
print(classification_report(y_va, model.predict(X_va)))
roc_auc_score(y_va, model.predict_proba(X_va)[:, 1])     # по вероятностям, не по классам
` + '```' + R`
Совет для DL: эмбеддинги из предобученной сети + LogisticRegression — быстрый и сильный baseline (linear probe).`,
      ],
      cheats: [
        ['make_pipeline(StandardScaler(), Model())', 'без утечки'],
        ['train_test_split(..., stratify=y)', 'стратифицированно'],
        ['StratifiedKFold(5, shuffle=True, random_state=0)', 'CV'],
        ['cross_val_score(m, X, y, cv=cv)', 'оценка'],
        ['GridSearchCV(m, grid, cv=cv)', 'подбор'],
        ['classification_report(y, p)', 'precision/recall/F1 по классам'],
        ['confusion_matrix(y, p)', 'матрица ошибок'],
        ['roc_auc_score(y, proba)', 'AUC по вероятностям'],
        ['joblib.dump(model, "m.joblib")', 'сохранить'],
      ],
      pitfalls: [
        '`fit` scaler на всех данных до разбиения — утечка; клади его в Pipeline.',
        '`roc_auc_score` по предсказанным классам вместо вероятностей занижает и искажает AUC.',
        'LogisticRegression без масштабирования признаков сходится плохо (ConvergenceWarning).',
        'Параметры шагов Pipeline в GridSearch: `имяшага__параметр`.',
      ],
      interview: [
        ['Зачем нужен Pipeline?', 'Чтобы все шаги, которые учатся на данных (масштабирование, кодирование, отбор признаков), обучались только на train-части — в том числе внутри каждого фолда кросс-валидации. Иначе утечка и завышенная оценка. Плюс один объект для fit/predict/сохранения.'],
        ['Чем fit_transform отличается от transform и где ошибаются?', '`fit_transform` учит параметры (например, среднее и std) и сразу преобразует — только на train. На val/test — только `transform` с параметрами train. Ошибка — вызвать fit_transform на test.'],
      ],
      quiz: [
        { question: 'Что передавать в roc_auc_score для бинарной задачи?', options: ['вероятности класса 1', 'предсказанные классы', 'логиты обоих классов', 'accuracy'], answer: 0, explain: 'AUC оценивает ранжирование, ему нужны непрерывные скоры.' },
        { question: 'Как обратиться к параметру C логистической регрессии внутри make_pipeline в GridSearchCV?', options: ['logisticregression__C', 'C', 'model.C', 'logisticregression.C'], answer: 0, explain: 'Имя шага (по умолчанию — имя класса в нижнем регистре) + двойное подчёркивание.' },
      ],
    },
    // ======================================================================
    {
      id: 'stdlib', name: 'Файлы и данные: os, pathlib, json, pickle', used: 'все задания', icon: 'note',
      why: 'Стандартная библиотека Python, которая нужна почти в любом проекте: пути, списки файлов, чтение разметки и сохранение результатов.',
      notes: ['07 Стандартная библиотека для задач', '04 Копирование, исключения и context manager'],
      sections: [
        R`## Пути: pathlib
` + '```python' + R`
from pathlib import Path
root = Path(__file__).parent              # папка рядом со скриптом
img_dir = root / "data" / "train" / "images"
p = img_dir / "0001.jpg"
p.name, p.stem, p.suffix, p.exists()      # "0001.jpg", "0001", ".jpg", True
files = sorted(img_dir.glob("*.jpg"))     # sorted — порядок файлов в ОС не гарантирован!
(root / "out").mkdir(parents=True, exist_ok=True)
` + '```' + R`
` + '`os.listdir`' + R` и ` + '`glob`' + R` возвращают файлы в произвольном порядке — без ` + '`sorted`' + R` результаты на разных машинах могут отличаться.`,
        R`## JSON и pickle
` + '```python' + R`
import json
with open("result.json", "w", encoding="utf-8") as f:
    json.dump({k: int(v) for k, v in preds.items()}, f, ensure_ascii=False, indent=2)
data = json.load(open("result.json", encoding="utf-8"))
import pickle
pickle.dump(obj, open("obj.pkl", "wb")); obj = pickle.load(open("obj.pkl", "rb"))
` + '```' + R`
JSON понимает только dict, list, str, int, float, bool, None: ` + '`np.int64`' + R` и массивы нужно превратить в обычные типы (` + '`int(v)`, `arr.tolist()`' + R`). Pickle сохраняет что угодно, но открывать pickle из недоверенного источника опасно — он может выполнить код.`,
        R`## Полезное: collections, random, time
` + '```python' + R`
from collections import Counter, defaultdict
Counter(train_gt.values()).most_common(3)   # самые частые классы
groups = defaultdict(list); groups[c].append(name)
import random; rng = random.Random(42); rng.shuffle(files)   # свой генератор с seed
import time; t0 = time.perf_counter(); ...; print(time.perf_counter() - t0)
` + '```',
      ],
      cheats: [
        ['Path(__file__).parent', 'папка скрипта'],
        ['sorted(p.glob("*.jpg"))', 'файлы по маске'],
        ['p.stem / p.suffix', 'имя без расширения / расширение'],
        ['mkdir(parents=True, exist_ok=True)', 'создать папку'],
        ['json.dump(d, f, ensure_ascii=False)', 'сохранить с кириллицей'],
        ['int(np_value)', 'numpy-число → JSON'],
        ['Counter(xs).most_common(k)', 'частоты'],
        ['defaultdict(list)', 'группировка'],
        ['time.perf_counter()', 'замер времени'],
      ],
      pitfalls: [
        'Порядок `os.listdir`/`glob` не определён — сортируй.',
        '`json.dump` падает на `np.int64`, `np.float32`, массивах.',
        'Открывая текст, указывай `encoding="utf-8"` — на Windows по умолчанию другая кодировка.',
        'Пути через `+` и `"/"` ломаются между ОС — используй `Path` или `os.path.join`.',
      ],
      interview: [
        ['Чем json отличается от pickle и когда что использовать?', 'JSON — текстовый, переносимый между языками, только базовые типы; безопасен для чтения. Pickle — бинарный формат Python для любых объектов, но привязан к версиям классов и небезопасен для недоверенных файлов. Для результатов и конфигов — JSON, для внутренних кэшей — pickle.'],
      ],
      quiz: [
        { question: '`Path("data/0001.jpg").stem` → ?', options: ['"0001"', '"0001.jpg"', '".jpg"', '"data"'], answer: 0, explain: 'stem — имя без расширения, name — с расширением, suffix — расширение.' },
        { question: 'Что будет с `json.dumps({"a": np.int64(3)})`?', options: ['TypeError', '{"a": 3}', '{"a": "3"}', '{"a": 3.0}'], answer: 0, explain: 'numpy-числа не сериализуются стандартным json: нужен int(...).' },
      ],
    },
    // ======================================================================
    {
      id: 'pytest', name: 'pytest', used: 'проверка кода', icon: 'check',
      why: 'Стандарт тестирования в Python. Умение писать свои тесты экономит часы отладки и ценится на собеседованиях.',
      notes: [],
      sections: [
        R`## Тест — это функция с assert
` + '```python' + R`
# test_split.py
from my_module import split_data

def test_no_leak():
    gt = {f"{c}_{i}.jpg": c for c in range(5) for i in range(10)}
    tr, va = split_data(gt, 0.2, seed=1)
    assert not set(tr) & set(va), "файл и в train, и в val"
` + '```' + R`
Запуск: ` + '`pytest -q`' + R` (все тесты), ` + '`pytest -x`' + R` (стоп на первой ошибке), ` + '`pytest -k leak`' + R` (по имени), ` + '`pytest -s`' + R` (показывать print).`,
        R`## approx, raises, parametrize, fixtures
` + '```python' + R`
import pytest
def test_mean():
    assert sum([0.1] * 3) == pytest.approx(0.3)      # float с допуском
def test_empty_raises():
    with pytest.raises(ValueError):
        normalize_scores([])
@pytest.mark.parametrize("h, w, exp", [(300, 400, (256, 341)), (400, 300, (341, 256))])
def test_resize_shape(h, w, exp):
    assert resize_shape(h, w, 256) == exp
def test_save(tmp_path):                             # fixture: временная папка
    save_results(tmp_path / "r.json", {"a.jpg": 1})
    assert (tmp_path / "r.json").exists()
` + '```',
      ],
      cheats: [
        ['pytest -q / -x / -k name / -s', 'запуск'],
        ['pytest.approx(x, rel=1e-6)', 'сравнение float'],
        ['with pytest.raises(ValueError):', 'ожидаем ошибку'],
        ['@pytest.mark.parametrize', 'один тест — много случаев'],
        ['tmp_path', 'временная папка'],
        ['assert cond, "сообщение"', 'понятная ошибка'],
      ],
      pitfalls: [
        'Файл и функции должны начинаться с `test_`, иначе pytest их не найдёт.',
        'Сравнивать float через `==` — используй `pytest.approx` или `np.allclose`.',
        'Тест, который ничего не проверяет (нет assert), всегда «проходит».',
      ],
      interview: [
        ['Как тестировать ML-код, если результат случайный?', 'Фиксировать seed; проверять инварианты (формы, диапазоны, суммы вероятностей = 1, отсутствие утечки), а не точные числа; маленькие детерминированные примеры с известным ответом; переобучение на крошечном датасете как smoke-тест.'],
      ],
      quiz: [
        { question: 'Как проверить, что функция бросает ValueError?', options: ['with pytest.raises(ValueError): f()', 'assert f() == ValueError', 'try/except без assert', 'assert raises(f)'], answer: 0, explain: 'Контекстный менеджер pytest.raises.' },
      ],
    },
    // ======================================================================
    {
      id: 'lightning', name: 'Lightning', used: 'советуют в курсе', icon: 'zap', local: true,
      why: 'Убирает шаблонный код цикла обучения: логирование, валидация, чекпоинты, устройства. Его часто рекомендуют в курсах по глубокому обучению.',
      notes: [],
      sections: [
        R`## LightningModule
` + '```python' + R`
import lightning as L
class Module(L.LightningModule):
    def __init__(self, model, lr=1e-3):
        super().__init__(); self.model = model; self.lr = lr
        self.loss_fn = torch.nn.CrossEntropyLoss()
    def training_step(self, batch, batch_idx):
        x, y = batch; loss = self.loss_fn(self.model(x), y)
        self.log("train_loss", loss, prog_bar=True); return loss
    def validation_step(self, batch, batch_idx):
        x, y = batch; acc = (self.model(x).argmax(1) == y).float().mean()
        self.log("val_acc", acc, prog_bar=True)
    def configure_optimizers(self):
        return torch.optim.AdamW(self.parameters(), lr=self.lr)
` + '```' + R`
` + '`zero_grad`, `backward`, `step`, `model.train()/eval()`, `no_grad`' + R` на валидации Lightning делает сам.`,
        R`## Trainer
` + '```python' + R`
trainer = L.Trainer(max_epochs=15, accelerator="cpu", logger=False, enable_checkpointing=False)
trainer.fit(module, train_loader, val_loader)
L.Trainer(fast_dev_run=True)                 # прогнать 1 батч train/val — проверка, что всё работает
L.Trainer(max_epochs=1, limit_train_batches=2)   # быстрый прогон: проверить, что всё запускается
from lightning.pytorch.callbacks import EarlyStopping, ModelCheckpoint
` + '```' + R`
Если запись файлов запрещена (например, в автоматической проверке): ` + '`logger=False, enable_checkpointing=False`' + R`.`,
      ],
      cheats: [
        ['training_step → return loss', 'шаг обучения'],
        ['self.log("val_acc", acc, prog_bar=True)', 'метрика'],
        ['configure_optimizers', 'оптимизатор (+ scheduler)'],
        ['Trainer(fast_dev_run=True)', 'быстрая проверка'],
        ['limit_train_batches=2', 'несколько батчей'],
        ['logger=False, enable_checkpointing=False', 'без записи файлов'],
        ['EarlyStopping(monitor="val_acc", mode="max")', 'ранняя остановка'],
      ],
      pitfalls: [
        'По умолчанию Trainer пишет логи и чекпоинты на диск — в тестовой системе это ошибка.',
        'Возвращай из `training_step` именно loss, иначе шага оптимизации не будет.',
        'Сохраняй `module.model.state_dict()`, если предсказания делает обычная модель без Lightning.',
      ],
      interview: [
        ['Что Lightning делает за тебя, а что остаётся тебе?', 'Цикл по эпохам и батчам, zero_grad/backward/step, переключение train/eval, no_grad на валидации, перенос на устройство, логирование, чекпоинты, распределённое обучение. Тебе остаются модель, лосс, шаги train/val и оптимизатор.'],
      ],
      quiz: [
        { question: 'Какой флаг Trainer прогоняет один батч обучения и валидации для проверки кода?', options: ['fast_dev_run=True', 'max_epochs=0', 'limit_val_batches=0', 'overfit_batches=1'], answer: 0, explain: 'overfit_batches — другое: многократно учит на одних и тех же батчах.' },
      ],
    },
  ];

  // ---------------- Задачи по библиотекам (запускаются в браузере, пакеты грузятся сами) ----------------
  const T = [
    {
      id: 'lib-np-dist', lib: 'numpy', level: 2, title: 'Попарные расстояния без циклов',
      desc: 'Реализуй `pairwise_dist(A, B)`: A — (N, D), B — (M, D). Верни матрицу (N, M) евклидовых расстояний **без циклов**, через broadcasting. Мелкие отрицательные числа от погрешности под корнем обрежь до 0.',
      starter: R`import numpy as np

def pairwise_dist(A, B):
    ...
`,
      tests: R`import numpy as np
A = np.array([[0., 0.], [3., 4.]]); B = np.array([[0., 0.], [0., 4.], [3., 0.]])
d = pairwise_dist(A, B)
assert d.shape == (2, 3), f"форма должна быть (N, M) = (2, 3), получили {d.shape}"
assert np.allclose(d, [[0, 4, 3], [5, 3, 4]]), f"значения неверные:\n{d}"
print("✓ маленький пример")
rng = np.random.default_rng(0); A = rng.normal(size=(7, 5)); B = rng.normal(size=(4, 5))
ref = np.array([[np.linalg.norm(a - b) for b in B] for a in A])
assert np.allclose(pairwise_dist(A, B), ref), "не совпало с прямым подсчётом"
print("✓ случайные данные")
X = rng.normal(size=(6, 3)) * 1e3
D = pairwise_dist(X, X)
assert np.allclose(np.diag(D), 0, atol=1e-6) and not np.isnan(D).any(), "на диагонали нули и никаких NaN (обрежь отрицательные под корнем)"
print("✓ сама с собой")
assert pairwise_dist(np.ones((1, 1)), np.zeros((3, 1))).shape == (1, 3), "D = 1 и N = 1 тоже работают"
print("✓ крайние формы")
import re
assert not re.search(r"\bfor\b|\bwhile\b", re.sub(r"#.*", "", USER_SOURCE)), "без циклов — только операции над массивами"
print("✓ без циклов")
`,
      hint: '`((A[:, None, :] - B[None, :, :]) ** 2).sum(-1)` — форма (N, M); затем `np.sqrt(np.maximum(..., 0))`.',
      solution: R`import numpy as np

def pairwise_dist(A, B):
    d2 = ((A[:, None, :] - B[None, :, :]) ** 2).sum(-1)
    return np.sqrt(np.maximum(d2, 0))
`,
    },
    {
      id: 'lib-np-onehot', lib: 'numpy', level: 1, title: 'One-hot и обратно',
      desc: 'Реализуй `one_hot(y, K)` → матрица (N, K) из float 0/1 и `from_one_hot(Y)` → номера классов (N,). Без циклов.',
      starter: R`import numpy as np

def one_hot(y, K):
    ...

def from_one_hot(Y):
    ...
`,
      tests: R`import numpy as np
Y = one_hot(np.array([2, 0, 1]), 3)
assert Y.shape == (3, 3) and np.array_equal(Y, [[0, 0, 1], [1, 0, 0], [0, 1, 0]]), f"one_hot неверный:\n{Y}"
print("✓ one_hot")
assert Y.dtype.kind == "f", "тип — float (так удобнее для лоссов)"
print("✓ тип float")
y = np.random.default_rng(0).integers(0, 10, 50)
assert np.array_equal(from_one_hot(one_hot(y, 10)), y), "from_one_hot(one_hot(y)) должен вернуть y"
print("✓ туда и обратно")
assert one_hot(np.array([0]), 5).shape == (1, 5) and one_hot(np.array([], int), 4).shape == (0, 4), "крайние случаи: один элемент и пустой массив"
print("✓ крайние случаи")
`,
      hint: '`np.eye(K)[y]` — строки единичной матрицы; обратно — `Y.argmax(1)`.',
      solution: R`import numpy as np

def one_hot(y, K):
    return np.eye(K)[np.asarray(y, int)]

def from_one_hot(Y):
    return Y.argmax(1)
`,
    },
    {
      id: 'lib-np-standardize', lib: 'numpy', level: 1, title: 'Стандартизация признаков',
      desc: 'Реализуй `standardize(X)`: для каждого **столбца** вычесть среднее и поделить на стандартное отклонение. У постоянных столбцов (std = 0) результат — нули, а не NaN. Вход не менять.',
      starter: R`import numpy as np

def standardize(X):
    ...
`,
      tests: R`import numpy as np
X = np.random.default_rng(0).normal(5, 3, size=(100, 4))
Z = standardize(X)
assert np.allclose(Z.mean(0), 0) and np.allclose(Z.std(0), 1), "у каждого столбца среднее 0 и std 1"
print("✓ среднее 0, std 1 по столбцам")
C = np.column_stack([np.ones(5), np.arange(5.)])
Z = standardize(C)
assert not np.isnan(Z).any() and np.allclose(Z[:, 0], 0), "постоянный столбец → нули, без NaN"
print("✓ постоянный столбец")
X0 = X.copy(); standardize(X)
assert np.array_equal(X, X0), "входной массив менять нельзя"
print("✓ вход не меняется")
`,
      hint: '`mu = X.mean(0)`, `sd = X.std(0)`; где `sd == 0` — подставь 1: `np.where(sd == 0, 1, sd)`.',
      solution: R`import numpy as np

def standardize(X):
    mu = X.mean(0); sd = X.std(0)
    return (X - mu) / np.where(sd == 0, 1, sd)
`,
    },
    {
      id: 'lib-np-blocks', lib: 'numpy', level: 3, title: 'Блоки 8×8 через reshape (как в JPEG)',
      desc: 'Реализуй `to_blocks(img, b)`: картинку (H, W), где H и W делятся на b, разрежь на неперекрывающиеся блоки b×b **без циклов** → массив (H/b · W/b, b, b) по строкам блоков (слева направо, сверху вниз). И обратную `from_blocks(blocks, H, W)`.',
      starter: R`import numpy as np

def to_blocks(img, b):
    ...

def from_blocks(blocks, H, W):
    ...
`,
      tests: R`import numpy as np
img = np.arange(4 * 6).reshape(4, 6)
bl = to_blocks(img, 2)
assert bl.shape == (6, 2, 2), f"форма (H/b · W/b, b, b) = (6, 2, 2), получили {bl.shape}"
assert np.array_equal(bl[0], [[0, 1], [6, 7]]) and np.array_equal(bl[1], [[2, 3], [8, 9]]) and np.array_equal(bl[3], [[12, 13], [18, 19]]), "порядок блоков: по строкам, слева направо"
print("✓ форма и порядок")
x = np.random.default_rng(0).integers(0, 255, (16, 24))
assert np.array_equal(from_blocks(to_blocks(x, 8), 16, 24), x), "from_blocks(to_blocks(x)) == x"
print("✓ туда и обратно")
import re
assert not re.search(r"\bfor\b|\bwhile\b", re.sub(r"#.*", "", USER_SOURCE)), "без циклов: reshape + transpose"
print("✓ без циклов")
`,
      hint: '`img.reshape(H//b, b, W//b, b).transpose(0, 2, 1, 3).reshape(-1, b, b)`. Обратно — в обратном порядке.',
      solution: R`import numpy as np

def to_blocks(img, b):
    H, W = img.shape
    return img.reshape(H // b, b, W // b, b).transpose(0, 2, 1, 3).reshape(-1, b, b)

def from_blocks(blocks, H, W):
    b = blocks.shape[1]
    return blocks.reshape(H // b, W // b, b, b).transpose(0, 2, 1, 3).reshape(H, W)
`,
    },
    {
      id: 'lib-pd-gt', lib: 'pandas', level: 1, title: 'Разметка из CSV',
      desc: 'Файл разметки картинок — CSV со столбцами `filename,class_id`. Реализуй `read_gt(text)` → словарь «имя → класс» (int) через `pd.read_csv(io.StringIO(text))` и `class_counts(text)` → словарь «класс → число картинок», отсортированный по классу.',
      starter: R`import io
import pandas as pd

def read_gt(text):
    ...

def class_counts(text):
    ...
`,
      tests: R`CSV = "filename,class_id\n0001.jpg,3\n0002.jpg,0\n0003.jpg,3\n0004.jpg,1\n"
gt = read_gt(CSV)
assert gt == {"0001.jpg": 3, "0002.jpg": 0, "0003.jpg": 3, "0004.jpg": 1}, f"получили {gt}"
assert all(type(v) is int for v in gt.values()), "значения — обычные int (не numpy.int64)"
print("✓ read_gt")
c = class_counts(CSV)
assert c == {0: 1, 1: 1, 3: 2} and list(c) == [0, 1, 3], f"ждали {{0: 1, 1: 1, 3: 2}} по порядку классов, получили {c}"
print("✓ class_counts")
assert read_gt("filename,class_id\n") == {}, "пустая разметка — пустой словарь"
print("✓ пустой файл")
`,
      hint: '`df = pd.read_csv(io.StringIO(text))`; словарь: `{f: int(c) for f, c in zip(df.filename, df.class_id)}`; счётчики: `df.class_id.value_counts().sort_index()`.',
      solution: R`import io
import pandas as pd

def read_gt(text):
    df = pd.read_csv(io.StringIO(text))
    return {str(f): int(c) for f, c in zip(df["filename"], df["class_id"])}

def class_counts(text):
    s = pd.read_csv(io.StringIO(text))["class_id"].value_counts().sort_index()
    return {int(k): int(v) for k, v in s.items()}
`,
    },
    {
      id: 'lib-pd-best', lib: 'pandas', level: 2, title: 'Журнал экспериментов: лучшее по модели',
      desc: 'Дан DataFrame экспериментов со столбцами `model, lr, seed, val_acc`. Реализуй `best_by_model(df)` → DataFrame с лучшей строкой (максимум val_acc) для каждой модели, столбцы `model, lr, val_acc`, отсортированный по val_acc по убыванию, индекс 0, 1, 2…',
      starter: R`import pandas as pd

def best_by_model(df):
    ...
`,
      tests: R`import pandas as pd
df = pd.DataFrame({
    "model": ["mnv2", "mnv2", "effb0", "effb0", "r50"],
    "lr": [1e-3, 3e-4, 1e-3, 3e-4, 1e-4],
    "seed": [0, 0, 0, 0, 0],
    "val_acc": [0.86, 0.89, 0.91, 0.90, 0.88]})
r = best_by_model(df)
assert list(r.columns) == ["model", "lr", "val_acc"], f"столбцы: {list(r.columns)}"
assert list(r["model"]) == ["effb0", "mnv2", "r50"], f"порядок по val_acc: {list(r['model'])}"
assert list(r["lr"]) == [1e-3, 3e-4, 1e-4], "lr лучшей строки каждой модели"
print("✓ лучшая строка каждой модели")
assert list(r.index) == [0, 1, 2], "индекс сброшен: 0, 1, 2"
print("✓ индекс")
d0 = df.copy(); best_by_model(df)
assert df.equals(d0), "входной DataFrame менять нельзя"
print("✓ вход не меняется")
`,
      hint: '`df.loc[df.groupby("model")["val_acc"].idxmax(), ["model", "lr", "val_acc"]]`, потом `sort_values(..., ascending=False).reset_index(drop=True)`.',
      solution: R`import pandas as pd

def best_by_model(df):
    best = df.loc[df.groupby("model")["val_acc"].idxmax(), ["model", "lr", "val_acc"]]
    return best.sort_values("val_acc", ascending=False).reset_index(drop=True)
`,
    },
    {
      id: 'lib-pd-agg', lib: 'pandas', level: 2, title: 'Среднее и разброс по сидам',
      desc: 'Один эксперимент запускали с разными seed. Реализуй `summary(df)` → DataFrame с индексом (model, lr) и столбцами `mean`, `std`, `n` (число запусков) для val_acc, отсортированный по mean по убыванию. Так честно сравнивают настройки: одна удачная попытка ничего не значит.',
      starter: R`import pandas as pd

def summary(df):
    ...
`,
      tests: R`import pandas as pd, numpy as np
df = pd.DataFrame({"model": ["a"] * 3 + ["b"] * 3 + ["a"] * 2, "lr": [1e-3] * 3 + [1e-3] * 3 + [1e-4] * 2,
                   "seed": [0, 1, 2, 0, 1, 2, 0, 1], "val_acc": [0.80, 0.82, 0.84, 0.86, 0.85, 0.87, 0.90, 0.70]})
s = summary(df)
assert list(s.columns) == ["mean", "std", "n"], f"столбцы: {list(s.columns)}"
assert s.index.names == ["model", "lr"], f"индекс (model, lr): {s.index.names}"
print("✓ структура")
assert s.index[0] == ("b", 1e-3) and np.isclose(s["mean"].iloc[0], 0.86), "первая строка — лучшее среднее: b, 1e-3, 0.86"
assert np.isclose(s.loc[("a", 1e-4), "std"], np.std([0.9, 0.7], ddof=1)) and s.loc[("a", 1e-4), "n"] == 2, "std выборочный (как в pandas по умолчанию), n — число запусков"
print("✓ значения")
`,
      hint: '`df.groupby(["model", "lr"])["val_acc"].agg(mean="mean", std="std", n="count").sort_values("mean", ascending=False)`.',
      solution: R`import pandas as pd

def summary(df):
    return df.groupby(["model", "lr"])["val_acc"].agg(mean="mean", std="std", n="count").sort_values("mean", ascending=False)
`,
    },
    {
      id: 'lib-pd-fill', lib: 'pandas', level: 2, title: 'Пропуски — медианой по группе',
      desc: 'Реализуй `fill_by_group(df, group, col)`: заполни пропуски в столбце `col` медианой этого столбца **внутри своей группы** (`transform`). Вернуть новый DataFrame, исходный не менять.',
      starter: R`import pandas as pd

def fill_by_group(df, group, col):
    ...
`,
      tests: R`import pandas as pd, numpy as np
df = pd.DataFrame({"g": ["a", "a", "a", "b", "b"], "x": [1.0, np.nan, 3.0, 10.0, np.nan]})
r = fill_by_group(df, "g", "x")
assert list(r["x"]) == [1.0, 2.0, 3.0, 10.0, 10.0], f"получили {list(r['x'])}"
print("✓ медиана своей группы")
assert df["x"].isna().sum() == 2, "исходный DataFrame не должен измениться"
print("✓ вход не меняется")
assert len(r) == len(df) and list(r.columns) == ["g", "x"], "строки и столбцы на месте"
print("✓ форма")
`,
      hint: '`out = df.copy(); out[col] = out[col].fillna(out.groupby(group)[col].transform("median"))`.',
      solution: R`import pandas as pd

def fill_by_group(df, group, col):
    out = df.copy()
    out[col] = out[col].fillna(out.groupby(group)[col].transform("median"))
    return out
`,
    },
    {
      id: 'lib-sk-pipeline', lib: 'sklearn', level: 2, title: 'Pipeline и кросс-валидация',
      desc: 'Реализуй `make_model()` → Pipeline из StandardScaler и LogisticRegression(max_iter=1000), и `cv_score(model, X, y)` → средняя accuracy по `StratifiedKFold(5, shuffle=True, random_state=0)`.',
      starter: R`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score

def make_model():
    ...

def cv_score(model, X, y):
    ...
`,
      tests: R`from sklearn.datasets import make_classification
from sklearn.pipeline import Pipeline
X, y = make_classification(n_samples=300, n_features=10, n_informative=5, random_state=0)
X[:, 0] *= 1000
m = make_model()
assert isinstance(m, Pipeline), "make_model должна вернуть Pipeline"
names = [type(s).__name__ for _, s in m.steps]
assert names == ["StandardScaler", "LogisticRegression"], f"шаги: {names}"
print("✓ Pipeline")
s = cv_score(m, X, y)
assert 0.8 <= s <= 1.0, f"accuracy {s:.3f} — подозрительно низко"
print(f"✓ качество: {s:.3f}")
assert abs(cv_score(make_model(), X, y) - s) < 1e-12, "с random_state=0 результат должен повторяться"
print("✓ воспроизводимость")
`,
      hint: '`make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))`; `cross_val_score(model, X, y, cv=StratifiedKFold(5, shuffle=True, random_state=0)).mean()`.',
      solution: R`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score

def make_model():
    return make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))

def cv_score(model, X, y):
    cv = StratifiedKFold(5, shuffle=True, random_state=0)
    return float(cross_val_score(model, X, y, cv=cv, scoring="accuracy").mean())
`,
    },
    {
      id: 'lib-sk-probe', lib: 'sklearn', level: 2, title: 'Linear probe на эмбеддингах',
      desc: 'Быстрый baseline для дообучения: признаки после GAP уже посчитаны, классифицируем их логистической регрессией. Реализуй `probe(Xtr, ytr, Xva, yva)` → `(accuracy на val, матрица ошибок)` через sklearn (`accuracy_score`, `confusion_matrix`). Признаки масштабируй (Pipeline), scaler учи только на train.',
      starter: R`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix

def probe(Xtr, ytr, Xva, yva):
    ...
`,
      tests: R`import numpy as np
rng = np.random.default_rng(0); K, D = 5, 32
C = rng.normal(size=(K, D))
def make(n):
    y = rng.integers(0, K, n); return C[y] + rng.normal(size=(n, D)) * 0.8, y
Xtr, ytr = make(400); Xva, yva = make(200)
acc, cm = probe(Xtr, ytr, Xva, yva)
assert isinstance(acc, float) and 0.9 <= acc <= 1, f"accuracy {acc} — ждали ≥ 0.9"
print(f"✓ accuracy {acc:.3f}")
assert cm.shape == (K, K) and cm.sum() == 200, "матрица ошибок K×K, сумма = размер val"
assert np.isclose(np.trace(cm) / cm.sum(), acc), "диагональ матрицы / сумма = accuracy"
print("✓ матрица ошибок")
`,
      hint: '`m = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000)).fit(Xtr, ytr)`; `p = m.predict(Xva)`.',
      solution: R`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix

def probe(Xtr, ytr, Xva, yva):
    m = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000)).fit(Xtr, ytr)
    p = m.predict(Xva)
    return float(accuracy_score(yva, p)), confusion_matrix(yva, p)
`,
    },
    {
      id: 'lib-sk-split', lib: 'sklearn', level: 1, title: 'train_test_split со стратификацией',
      desc: 'Реализуй `split(X, y, test_size=0.2, seed=0)` через `train_test_split` так, чтобы доля каждого класса в train и test совпадала. Верни `(X_tr, X_te, y_tr, y_te)`.',
      starter: R`from sklearn.model_selection import train_test_split

def split(X, y, test_size=0.2, seed=0):
    ...
`,
      tests: R`import numpy as np
y = np.array([0] * 90 + [1] * 10); X = np.arange(100).reshape(-1, 1)
Xtr, Xte, ytr, yte = split(X, y)
assert len(yte) == 20 and (yte == 1).sum() == 2, f"в test 20 объектов и ровно 2 редкого класса (10%), получили {(yte == 1).sum()}"
print("✓ доля редкого класса сохраняется")
assert not set(Xtr.ravel()) & set(Xte.ravel()), "объекты не повторяются в train и test"
print("✓ без утечки")
a = split(X, y, seed=3)[3]; b = split(X, y, seed=3)[3]
assert np.array_equal(a, b), "с одним seed разбиение повторяется"
print("✓ воспроизводимость")
`,
      hint: '`train_test_split(X, y, test_size=test_size, stratify=y, random_state=seed)`.',
      solution: R`from sklearn.model_selection import train_test_split

def split(X, y, test_size=0.2, seed=0):
    return train_test_split(X, y, test_size=test_size, stratify=y, random_state=seed)
`,
    },
    {
      id: 'lib-sp-dct', lib: 'scipy', level: 2, title: 'Двумерное DCT для блока 8×8',
      desc: 'Реализуй `dct2(block)` и `idct2(coef)` через `scipy.fft.dct/idct` с `norm="ortho"` по обеим осям — так, как в JPEG-сжатии.',
      starter: R`import numpy as np
from scipy.fft import dct, idct

def dct2(block):
    ...

def idct2(coef):
    ...
`,
      tests: R`import numpy as np
x = np.random.default_rng(0).normal(size=(8, 8))
assert np.allclose(idct2(dct2(x)), x), "idct2(dct2(x)) должен вернуть x"
print("✓ обратимость")
assert np.isclose((dct2(x) ** 2).sum(), (x ** 2).sum()), "ортонормированное DCT сохраняет энергию (сумму квадратов)"
print("✓ энергия сохраняется")
c = dct2(np.full((8, 8), 5.0))
assert np.isclose(c[0, 0], 40) and np.allclose(c.ravel()[1:], 0), "постоянный блок — только DC-коэффициент (5·8 = 40)"
print("✓ постоянный блок")
`,
      hint: '`dct(dct(b, axis=0, norm="ortho"), axis=1, norm="ortho")`, обратное — так же с `idct`.',
      solution: R`import numpy as np
from scipy.fft import dct, idct

def dct2(block):
    return dct(dct(block, axis=0, norm="ortho"), axis=1, norm="ortho")

def idct2(coef):
    return idct(idct(coef, axis=0, norm="ortho"), axis=1, norm="ortho")
`,
    },
    {
      id: 'lib-sp-sharpen', lib: 'scipy', level: 2, title: 'Нерезкое маскирование (unsharp mask)',
      desc: 'Реализуй `sharpen(img, sigma=1.0, amount=1.0)` для серой картинки float в [0, 1]: `img + amount · (img − gaussian_filter(img, sigma))`, результат обрезать в [0, 1]. Вход не менять.',
      starter: R`import numpy as np
from scipy import ndimage

def sharpen(img, sigma=1.0, amount=1.0):
    ...
`,
      tests: R`import numpy as np
from scipy import ndimage
flat = np.full((10, 10), 0.4)
assert np.allclose(sharpen(flat), 0.4), "однородная картинка не меняется"
print("✓ однородная картинка")
img = np.zeros((20, 20)); img[:, 10:] = 1.0
s = sharpen(img, 1.0, 2.0)
assert s.min() >= 0 and s.max() <= 1, "значения обрезаны в [0, 1]"
assert np.allclose(s, np.clip(img + 2.0 * (img - ndimage.gaussian_filter(img, 1.0)), 0, 1)), "формула img + amount·(img − blur)"
print("✓ формула и обрезка")
i0 = img.copy(); sharpen(img)
assert np.array_equal(img, i0), "вход не меняется"
print("✓ вход не меняется")
`,
      hint: '`blur = ndimage.gaussian_filter(img, sigma)`; `np.clip(img + amount * (img - blur), 0, 1)`.',
      solution: R`import numpy as np
from scipy import ndimage

def sharpen(img, sigma=1.0, amount=1.0):
    blur = ndimage.gaussian_filter(img, sigma)
    return np.clip(img + amount * (img - blur), 0, 1)
`,
    },
    {
      id: 'lib-ski-gray', lib: 'skimage', level: 1, title: 'RGB → серый uint8',
      desc: 'Реализуй `to_gray_uint8(rgb)` для uint8-картинки (H, W, 3): `skimage.color.rgb2gray` (вернёт float 0..1) и обратно в uint8 через `img_as_ubyte`.',
      starter: R`import numpy as np
from skimage import color, img_as_ubyte

def to_gray_uint8(rgb):
    ...
`,
      tests: R`import numpy as np
w = np.full((2, 3, 3), 255, np.uint8)
g = to_gray_uint8(w)
assert g.shape == (2, 3) and g.dtype == np.uint8, f"форма (H, W) и тип uint8, получили {g.shape}, {g.dtype}"
assert np.all(g == 255), "белый остаётся белым (255)"
print("✓ форма, тип, белый")
px = np.zeros((1, 1, 3), np.uint8); px[0, 0, 1] = 255
assert abs(int(to_gray_uint8(px)[0, 0]) - round(0.7154 * 255)) <= 1, "зелёный даёт ~0.7154 яркости (веса 0.2125, 0.7154, 0.0721)"
print("✓ веса каналов")
`,
      hint: '`img_as_ubyte(color.rgb2gray(rgb))`.',
      solution: R`import numpy as np
from skimage import color, img_as_ubyte

def to_gray_uint8(rgb):
    return img_as_ubyte(color.rgb2gray(rgb))
`,
    },
    {
      id: 'lib-ski-metrics', lib: 'skimage', level: 1, title: 'PSNR и SSIM из коробки',
      desc: 'Реализуй `quality(ref, test)` для серых uint8-картинок → `(psnr, ssim)` через `skimage.metrics` с `data_range=255`.',
      starter: R`from skimage.metrics import peak_signal_noise_ratio, structural_similarity

def quality(ref, test):
    ...
`,
      tests: R`import numpy as np
rng = np.random.default_rng(0)
ref = rng.integers(0, 256, (32, 32)).astype(np.uint8)
p, s = quality(ref, ref)
assert np.isinf(p) and np.isclose(s, 1.0), "одинаковые картинки: PSNR = inf, SSIM = 1"
print("✓ одинаковые картинки")
noisy = np.clip(ref + rng.normal(0, 20, ref.shape), 0, 255).astype(np.uint8)
p2, s2 = quality(ref, noisy)
mse = np.mean((ref.astype(float) - noisy) ** 2)
assert np.isclose(p2, 10 * np.log10(255 ** 2 / mse)), "PSNR с data_range=255"
assert 0 < s2 < 1, "шум уменьшает SSIM"
print("✓ шум")
`,
      hint: '`peak_signal_noise_ratio(ref, test, data_range=255)`, `structural_similarity(ref, test, data_range=255)`.',
      solution: R`from skimage.metrics import peak_signal_noise_ratio, structural_similarity

def quality(ref, test):
    return peak_signal_noise_ratio(ref, test, data_range=255), structural_similarity(ref, test, data_range=255)
`,
    },
    {
      id: 'lib-pil-tensor', lib: 'pillow', level: 2, title: 'PIL ↔ тензор (свой ToTensor)',
      desc: 'Реализуй `pil_to_chw(img)`: любая PIL-картинка → RGB → numpy float32 (3, H, W) в [0, 1]. И обратную `chw_to_pil(x)`: обрезать в [0, 1], умножить на 255, округлить, uint8, PIL RGB.',
      starter: R`import numpy as np
from PIL import Image

def pil_to_chw(img):
    ...

def chw_to_pil(x):
    ...
`,
      tests: R`import numpy as np
from PIL import Image
img = Image.new("RGB", (5, 3), (255, 0, 51))
x = pil_to_chw(img)
assert x.shape == (3, 3, 5), f"PIL size (W=5, H=3) → (3, H, W) = (3, 3, 5), получили {x.shape}"
assert x.dtype == np.float32 and np.allclose(x[:, 0, 0], [1, 0, 0.2]), "float32 в [0, 1], каналы R, G, B"
print("✓ форма, тип, каналы")
gray = Image.new("L", (4, 4), 128); rgba = Image.new("RGBA", (4, 4), (10, 20, 30, 0))
assert pil_to_chw(gray).shape == (3, 4, 4) and pil_to_chw(rgba).shape == (3, 4, 4), "серые и RGBA приводятся к 3 каналам"
print("✓ L и RGBA → RGB")
back = chw_to_pil(x)
assert back.size == (5, 3) and back.mode == "RGB" and back.getpixel((0, 0)) == (255, 0, 51), "обратно в ту же картинку"
assert chw_to_pil(np.full((3, 2, 2), 1.7, np.float32)).getpixel((0, 0)) == (255, 255, 255), "значения > 1 обрезаются"
print("✓ обратно в PIL")
`,
      hint: '`np.asarray(img.convert("RGB"), dtype=np.float32).transpose(2, 0, 1) / 255`; обратно: `Image.fromarray(np.round(np.clip(x, 0, 1) * 255).astype(np.uint8).transpose(1, 2, 0))`.',
      solution: R`import numpy as np
from PIL import Image

def pil_to_chw(img):
    return (np.asarray(img.convert("RGB"), dtype=np.float32) / 255).transpose(2, 0, 1)

def chw_to_pil(x):
    a = np.round(np.clip(x, 0, 1) * 255).astype(np.uint8).transpose(1, 2, 0)
    return Image.fromarray(a, "RGB")
`,
    },
    {
      id: 'lib-pil-crop', lib: 'pillow', level: 1, title: 'CenterCrop средствами Pillow',
      desc: 'Реализуй `center_crop_pil(img, k)` через `img.crop((left, top, right, bottom))`. Отступы как в numpy-версии: `(W − k) // 2` и `(H − k) // 2`. Помни: `img.size` — это (W, H).',
      starter: R`from PIL import Image

def center_crop_pil(img, k):
    ...
`,
      tests: R`import numpy as np
from PIL import Image
arr = np.arange(6 * 8 * 3, dtype=np.uint8).reshape(6, 8, 3)
img = Image.fromarray(arr)
c = center_crop_pil(img, 4)
assert c.size == (4, 4), f"размер (4, 4), получили {c.size}"
assert np.array_equal(np.asarray(c), arr[1:5, 2:6]), "вырезан не центр — проверь порядок (left, top, right, bottom)"
print("✓ центр")
assert center_crop_pil(img, 6).size == (6, 6), "k равно меньшей стороне"
print("✓ k = высота")
`,
      hint: '`W, H = img.size`; `l, t = (W - k) // 2, (H - k) // 2`; `img.crop((l, t, l + k, t + k))`.',
      solution: R`from PIL import Image

def center_crop_pil(img, k):
    W, H = img.size
    l, t = (W - k) // 2, (H - k) // 2
    return img.crop((l, t, l + k, t + k))
`,
    },
    {
      id: 'lib-std-files', lib: 'stdlib', level: 1, title: 'Список картинок в папке',
      desc: 'Реализуй `list_images(folder)` через `pathlib`: **отсортированный** список имён файлов (не путей) с расширениями .jpg, .jpeg, .png в любом регистре. Папки и другие файлы пропустить.',
      starter: R`from pathlib import Path

def list_images(folder):
    ...
`,
      tests: R`import tempfile
from pathlib import Path
d = Path(tempfile.mkdtemp())
for n in ["b.jpg", "a.PNG", "c.jpeg", "notes.txt", ".hidden", "z.Jpg"]:
    (d / n).write_text("x")
(d / "sub.jpg").mkdir()
r = list_images(d)
assert r == ["a.PNG", "b.jpg", "c.jpeg", "z.Jpg"], f"получили {r}"
print("✓ фильтр и сортировка")
assert all(isinstance(x, str) for x in r), "имена — строки, не Path"
assert list_images(str(d)) == r, "путь можно передать строкой"
print("✓ типы")
assert list_images(Path(tempfile.mkdtemp())) == [], "пустая папка — пустой список"
print("✓ пустая папка")
`,
      hint: '`sorted(p.name for p in Path(folder).iterdir() if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png"})`.',
      solution: R`from pathlib import Path

def list_images(folder):
    exts = {".jpg", ".jpeg", ".png"}
    return sorted(p.name for p in Path(folder).iterdir() if p.is_file() and p.suffix.lower() in exts)
`,
    },
    {
      id: 'lib-std-json', lib: 'stdlib', level: 1, title: 'Сохранить предсказания в JSON',
      desc: 'Реализуй `save_preds(path, preds)` — словарь «имя → класс», где классы могут быть `np.int64`: сохранить в JSON (UTF-8, ключи по алфавиту) и `load_preds(path)` → тот же словарь с обычными int.',
      starter: R`import json

def save_preds(path, preds):
    ...

def load_preds(path):
    ...
`,
      tests: R`import json, tempfile, os
import numpy as np
p = os.path.join(tempfile.mkdtemp(), "preds.json")
save_preds(p, {"b.jpg": np.int64(3), "a.jpg": 1, "кот.jpg": np.int32(7)})
d = load_preds(p)
assert d == {"a.jpg": 1, "b.jpg": 3, "кот.jpg": 7} and all(type(v) is int for v in d.values()), f"получили {d}"
print("✓ numpy-числа сохраняются")
raw = open(p, encoding="utf-8").read()
assert "кот" in raw, "кириллица в файле читается (ensure_ascii=False)"
assert raw.index("a.jpg") < raw.index("b.jpg"), "ключи по алфавиту (sort_keys=True)"
print("✓ кириллица и порядок ключей")
`,
      hint: '`json.dump({k: int(v) for k, v in preds.items()}, f, ensure_ascii=False, sort_keys=True)`; открывай файл с `encoding="utf-8"`.',
      solution: R`import json

def save_preds(path, preds):
    with open(path, "w", encoding="utf-8") as f:
        json.dump({str(k): int(v) for k, v in preds.items()}, f, ensure_ascii=False, sort_keys=True, indent=2)

def load_preds(path):
    with open(path, encoding="utf-8") as f:
        return {k: int(v) for k, v in json.load(f).items()}
`,
    },
    {
      id: 'lib-pytest', lib: 'pytest', level: 2, title: 'Напиши тесты, которые ловят баги',
      desc: 'Функция `normalize_scores(xs)` должна вернуть список, который в сумме даёт 1 (каждое число делится на сумму), и бросать `ValueError` для пустого списка и если сумма равна 0. Напиши **свои тесты** — функции `test_...` с `assert`, `pytest.approx` и `pytest.raises`. Проверка запустит их на правильной реализации (все должны пройти) и на трёх сломанных (каждую должен поймать хотя бы один твой тест).',
      starter: R`import pytest

def normalize_scores(xs):
    if not xs or sum(xs) == 0:
        raise ValueError("пустой список или сумма 0")
    s = sum(xs)
    return [x / s for x in xs]

# твои тесты:
def test_sum_is_one():
    ...
`,
      tests: R`import pytest
tests = {k: v for k, v in list(globals().items()) if k.startswith("test_") and callable(v)}
assert len(tests) >= 2, f"напиши хотя бы 2 теста (функции test_...), сейчас {len(tests)}"
print("✓ тесты найдены: " + ", ".join(sorted(tests)))
def good(xs):
    if not xs or sum(xs) == 0: raise ValueError
    s = sum(xs); return [x / s for x in xs]
def bad_no_check(xs):
    s = sum(xs) or 1; return [x / s for x in xs]
def bad_wrong_div(xs):
    if not xs or sum(xs) == 0: raise ValueError
    return [x / len(xs) for x in xs]
def bad_zero_ok(xs):
    if not xs: raise ValueError
    s = sum(xs) or 1; return [x / s for x in xs]
def run_all(impl):
    g = globals(); old = g.get("normalize_scores"); g["normalize_scores"] = impl
    failed = []
    try:
        for name, fn in tests.items():
            fn.__globals__["normalize_scores"] = impl
            try: fn()
            except BaseException: failed.append(name)
    finally:
        for fn in tests.values(): fn.__globals__["normalize_scores"] = good
    return failed
f = run_all(good)
assert not f, f"на правильной реализации упали тесты: {f}"
print("✓ правильная реализация проходит все твои тесты")
assert run_all(bad_wrong_div), "баг «делим на длину, а не на сумму» не пойман — проверь, что сумма равна 1 (pytest.approx)"
print("✓ пойман баг: деление не на сумму")
assert run_all(bad_no_check), "баг «нет ValueError для пустого списка» не пойман — используй pytest.raises"
print("✓ пойман баг: нет проверки пустого списка")
assert run_all(bad_zero_ok), "баг «нет ValueError при сумме 0» не пойман"
print("✓ пойман баг: сумма 0")
`,
      hint: '`assert sum(normalize_scores([1, 2, 3])) == pytest.approx(1)`; `with pytest.raises(ValueError): normalize_scores([])` и то же для `[0, 0]`. Можно проверить и конкретные значения: `[1, 3]` → `[0.25, 0.75]`.',
      solution: R`import pytest

def normalize_scores(xs):
    if not xs or sum(xs) == 0:
        raise ValueError("пустой список или сумма 0")
    s = sum(xs)
    return [x / s for x in xs]

def test_sum_is_one():
    assert sum(normalize_scores([1, 2, 3])) == pytest.approx(1)

def test_values():
    assert normalize_scores([1, 3]) == pytest.approx([0.25, 0.75])

def test_empty_raises():
    with pytest.raises(ValueError):
        normalize_scores([])

def test_zero_sum_raises():
    with pytest.raises(ValueError):
        normalize_scores([0, 0])
`,
    },
    {
      id: 'lib-plt-curves', lib: 'matplotlib', level: 1, title: 'Кривые обучения',
      desc: 'Реализуй `plot_history(train_loss, val_acc)` → фигура matplotlib с двумя графиками рядом: слева линия train loss с заголовком "Loss", справа val accuracy с заголовком "Accuracy"; подпись оси X у обоих — "эпоха". Верни `fig`.',
      starter: R`import matplotlib
matplotlib.use("Agg")          # рисуем без окна
import matplotlib.pyplot as plt

def plot_history(train_loss, val_acc):
    ...
`,
      tests: R`import numpy as np
fig = plot_history([2.0, 1.2, 0.8], [0.5, 0.7, 0.8])
axes = fig.axes
assert len(axes) == 2, f"нужны 2 графика, а их {len(axes)}"
assert [a.get_title() for a in axes] == ["Loss", "Accuracy"], f"заголовки: {[a.get_title() for a in axes]}"
print("✓ два графика с заголовками")
assert all(a.get_xlabel() == "эпоха" for a in axes), "подпись оси X — «эпоха»"
print("✓ подписи осей")
y0 = axes[0].get_lines()[0].get_ydata(); y1 = axes[1].get_lines()[0].get_ydata()
assert np.allclose(y0, [2.0, 1.2, 0.8]) and np.allclose(y1, [0.5, 0.7, 0.8]), "данные на графиках"
print("✓ данные")
`,
      hint: '`fig, (a, b) = plt.subplots(1, 2, figsize=(10, 4))`; `a.plot(train_loss); a.set_title("Loss"); a.set_xlabel("эпоха")`.',
      solution: R`import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def plot_history(train_loss, val_acc):
    fig, (a, b) = plt.subplots(1, 2, figsize=(10, 4))
    a.plot(train_loss); a.set_title("Loss"); a.set_xlabel("эпоха")
    b.plot(val_acc); b.set_title("Accuracy"); b.set_xlabel("эпоха")
    fig.tight_layout()
    return fig
`,
    },
    {
      id: 'lib-plt-grid', lib: 'matplotlib', level: 2, title: 'Сетка картинок с подписями',
      desc: 'Реализуй `show_grid(images, labels, ncols)`: сетка subplots с `ceil(n / ncols)` строк; в каждой ячейке — `imshow` картинки и заголовок с меткой, оси выключены; лишние ячейки (если картинок меньше) скрыть (`ax.axis("off")` без картинки). Верни `fig`. Так удобно смотреть ошибки модели.',
      starter: R`import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def show_grid(images, labels, ncols):
    ...
`,
      tests: R`import numpy as np
imgs = [np.full((4, 4), i * 30, np.uint8) for i in range(5)]
fig = show_grid(imgs, [f"класс {i}" for i in range(5)], 3)
axes = fig.axes
assert len(axes) == 6, f"5 картинок по 3 в ряд — сетка 2×3 = 6 ячеек, а их {len(axes)}"
print("✓ размер сетки")
with_img = [a for a in axes if a.get_images()]
assert len(with_img) == 5, "картинки ровно в 5 ячейках"
assert [a.get_title() for a in with_img] == [f"класс {i}" for i in range(5)], "заголовки по порядку"
print("✓ картинки и подписи")
assert all(not a.axison for a in axes), "оси выключены у всех ячеек (и у пустой)"
print("✓ оси выключены")
assert len(show_grid(imgs[:1], ["x"], 4).axes) == 4, "одна картинка, 4 в ряд — одна строка из 4 ячеек"
print("✓ одна строка")
`,
      hint: '`rows = math.ceil(len(images) / ncols)`; `fig, axes = plt.subplots(rows, ncols, squeeze=False)`; пройди по `axes.ravel()`.',
      solution: R`import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def show_grid(images, labels, ncols):
    rows = math.ceil(len(images) / ncols)
    fig, axes = plt.subplots(rows, ncols, figsize=(3 * ncols, 3 * rows), squeeze=False)
    for i, ax in enumerate(axes.ravel()):
        if i < len(images):
            ax.imshow(images[i], cmap="gray")
            ax.set_title(labels[i])
        ax.axis("off")
    return fig
`,
    },
    // ---------- PyTorch: запускать у себя ----------
    {
      id: 'lib-torch-basics', lib: 'pytorch', local: true, level: 2, title: 'Тензоры: формы, accuracy, параметры',
      desc: 'Набор маленьких функций на PyTorch с проверками в конце файла — запусти у себя `python torch_basics.py`. Если всё верно, напечатается «всё верно».',
      check: [
        'to_batch: список HWC uint8-массивов → тензор float (N, 3, H, W) в [0, 1]',
        'accuracy: доля совпадений argmax логитов с метками, обычное float число',
        'count_params: только обучаемые параметры (requires_grad)',
        'freeze_all_but_head: заморожено всё, кроме последнего слоя',
      ],
      starter: R`import numpy as np
import torch
from torch import nn

def to_batch(images):
    # список numpy (H, W, 3) uint8 -> torch.float32 (N, 3, H, W) в [0, 1]
    ...

def accuracy(logits, y):
    ...

def count_params(model):
    ...

def freeze_all_but_head(model):
    # model — nn.Sequential, голова — последний слой
    ...

if __name__ == "__main__":
    imgs = [np.full((4, 5, 3), 255, np.uint8), np.zeros((4, 5, 3), np.uint8)]
    b = to_batch(imgs)
    assert b.shape == (2, 3, 4, 5) and b.dtype == torch.float32 and b.max() == 1
    assert accuracy(torch.tensor([[2., 1.], [0., 3.], [1., 0.]]), torch.tensor([0, 1, 1])) == 2 / 3
    m = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 3))
    assert count_params(m) == 4 * 8 + 8 + 8 * 3 + 3
    freeze_all_but_head(m)
    assert count_params(m) == 8 * 3 + 3
    print("всё верно")
`,
      hint: '`torch.from_numpy(np.stack(images)).permute(0, 3, 1, 2).float() / 255`; accuracy: `(logits.argmax(1) == y).float().mean().item()`.',
      solution: R`import numpy as np
import torch
from torch import nn

def to_batch(images):
    return torch.from_numpy(np.stack(images)).permute(0, 3, 1, 2).float() / 255

def accuracy(logits, y):
    return (logits.argmax(1) == y).float().mean().item()

def count_params(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)

def freeze_all_but_head(model):
    for p in model.parameters():
        p.requires_grad = False
    for p in model[-1].parameters():
        p.requires_grad = True

if __name__ == "__main__":
    imgs = [np.full((4, 5, 3), 255, np.uint8), np.zeros((4, 5, 3), np.uint8)]
    b = to_batch(imgs)
    assert b.shape == (2, 3, 4, 5) and b.dtype == torch.float32 and b.max() == 1
    assert abs(accuracy(torch.tensor([[2., 1.], [0., 3.], [1., 0.]]), torch.tensor([0, 1, 1])) - 2 / 3) < 1e-6
    m = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 3))
    assert count_params(m) == 4 * 8 + 8 + 8 * 3 + 3
    freeze_all_but_head(m)
    assert count_params(m) == 8 * 3 + 3
    print("всё верно")
`,
    },
    {
      id: 'lib-torch-autograd', lib: 'pytorch', local: true, level: 2, title: 'Autograd против ручного градиента',
      desc: 'Посчитай градиент MSE линейной модели двумя способами: вручную по формуле и через autograd — и убедись, что они совпадают. Потом обучи эту модель 200 шагами SGD через `torch.optim`.',
      check: [
        'manual_grad совпадает с w.grad после backward (torch.allclose)',
        'Перед каждым шагом обучения градиенты обнуляются',
        'Итоговые веса близки к настоящим (true_w)',
      ],
      starter: R`import torch

torch.manual_seed(0)
X = torch.randn(100, 3); true_w = torch.tensor([2.0, -1.0, 0.5]); y = X @ true_w

def manual_grad(w):
    # градиент mean((X @ w - y) ** 2) по w
    ...

def autograd_grad(w):
    ...

def train(steps=200, lr=0.1):
    ...

if __name__ == "__main__":
    w = torch.randn(3)
    assert torch.allclose(manual_grad(w), autograd_grad(w), atol=1e-5)
    assert torch.allclose(train(), true_w, atol=1e-3)
    print("всё верно")
`,
      hint: 'Вручную: `2 / n * X.T @ (X @ w - y)`. Autograd: `w = w.clone().requires_grad_(True); loss.backward(); return w.grad`.',
      solution: R`import torch

torch.manual_seed(0)
X = torch.randn(100, 3); true_w = torch.tensor([2.0, -1.0, 0.5]); y = X @ true_w

def manual_grad(w):
    return 2 / len(y) * X.T @ (X @ w - y)

def autograd_grad(w):
    w = w.clone().requires_grad_(True)
    ((X @ w - y) ** 2).mean().backward()
    return w.grad

def train(steps=200, lr=0.1):
    w = torch.zeros(3, requires_grad=True)
    opt = torch.optim.SGD([w], lr=lr)
    for _ in range(steps):
        opt.zero_grad()
        ((X @ w - y) ** 2).mean().backward()
        opt.step()
    return w.detach()

if __name__ == "__main__":
    w = torch.randn(3)
    assert torch.allclose(manual_grad(w), autograd_grad(w), atol=1e-5)
    assert torch.allclose(train(), true_w, atol=1e-3)
    print("всё верно")
`,
    },
  ];

  T.forEach((t) => { t.module = 'lib'; t.topic = t.topic || ''; });
  window.ML_TASKS = (window.ML_TASKS || []).concat(T);
})();
