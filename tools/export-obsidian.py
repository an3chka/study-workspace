"""Экспорт тем раздела ML в Obsidian: углублённые заметки с формулами, вопросами (ответ спрятан) и тестом.

Запуск:  python3 tools/export-obsidian.py "/путь/к/obsidian/anya/ИИ" "/путь/к/obsidian/anya/ИИ — углублённое"

Первый путь — исходная папка с конспектами (только читается: нужна, чтобы ссылки [[...]] вели на настоящие имена файлов).
Второй — куда писать новые заметки. Существующие файлы с теми же именами перезаписываются, другие не трогаются.
Личные файлы из private/ по умолчанию НЕ выгружаются (хранилище Obsidian может синхронизироваться);
добавь флаг --with-private, только если папка назначения точно не уходит в облако.
"""
import importlib.util
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DUMP_JS = r"""
const vm = require('vm'), fs = require('fs');
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['ml-theory1.js', 'ml-theory2.js', 'ml-deep.js', 'ml-tasks.js', 'ml-libs.js'])
  vm.runInContext(fs.readFileSync('js/content/' + f, 'utf8'), ctx);
// личные файлы (папка private/) — только если явно попросили: python3 tools/export-obsidian.py SRC DST --with-private
if (process.env.WITH_PRIVATE === '1') for (const f of fs.readdirSync('private').filter((x) => x.endsWith('.js')))
  vm.runInContext(fs.readFileSync('private/' + f, 'utf8'), ctx);
const w = ctx.window;
process.stdout.write(JSON.stringify({ topics: w.ML_TOPICS, modules: w.ML_MODULES, map: w.ML_NOTE_MAP, tasks: w.ML_TASKS, track: w.ML_TRACK || null }));
"""

FOLDERS = {'basics': '01 Основы ML', 'dl': '02 Глубокое обучение', 'cv': '03 Компьютерное зрение', 'llm': '04 LLM и агенты'}


def load_build_notes():
    spec = importlib.util.spec_from_file_location('build_notes', os.path.join(HERE, 'tools', 'build-notes.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def safe(name):
    return re.sub(r'[\\/:*?"<>|#^\[\]]', ' ', name).replace('  ', ' ').strip()


def quote(text):
    return '\n'.join('> ' + line if line else '>' for line in text.split('\n'))


def topic_md(t, modules, original, topic_files):
    mod = dict((m[0], m[1]) for m in modules).get(t['module'], t['module'])
    out = ['---', 'tags:', '  - area/ml', '  - source/kabinet', '  - topic/' + t['id'], '---', '', '# ' + t['title'], '']
    out += ['> [!info] Навигация', '> **Карта:** [[00 Карта — углублённое ML]]  ', '> **Модуль:** ' + mod +
            ('  \n> **Курс:** ' + t['course'] if t.get('course') else ''), '']
    out += ['> [!abstract] Кратко', '> ' + t.get('summary', ''), '']
    out += ['## Теория', '']
    for p in t['theory']:
        out += [p, '']
    if t.get('formulas'):
        out += ['## Формулы', '']
        for f in t['formulas']:
            out += ['$$', f, '$$', '']
    if t.get('key'):
        out += ['## Главное запомнить', ''] + ['- ' + k for k in t['key']] + ['']
    notes = [original.get(n) for n in (t.get('notes') or [])]
    notes = [n for n in notes if n]
    if notes:
        out += ['## Мои конспекты по теме', ''] + ['- [[' + n + ']]' for n in notes] + ['']
    if t.get('interview'):
        out += ['## Вопросы с собеседований', '', '*Сначала ответь сама — вслух или письменно, потом раскрой ответ.*', '']
        for q, a in t['interview']:
            out += ['> [!question]- ' + q.replace('\n', ' '), quote(a), '']
    if t.get('quiz'):
        out += ['## Тест для самопроверки', '']
        for i, q in enumerate(t['quiz'], 1):
            out += ['**' + str(i) + '. ' + q['question'] + '**', '']
            out += ['- ' + 'абвгде'[k] + ') ' + o for k, o in enumerate(q['options'])]
            ans = 'абвгде'[q['answer']] + ') ' + q['options'][q['answer']]
            out += ['', '> [!success]- Ответ', quote(ans + (' — ' + q['explain'] if q.get('explain') else '')), '']
    tasks = [x for x in topic_files.get('tasks', []) if x.get('topic') == t['id'] and x.get('module') != 'track']
    if tasks:
        out += ['## Практика', '', 'Задачи с автотестами — на сайте, раздел ML → «Практика с кодом»:', ''] + ['- ' + x['title'] for x in tasks] + ['']
    return '\n'.join(out).rstrip() + '\n'


def track_md(hw, tasks):
    out = ['---', 'tags:', '  - area/ml', '  - source/kabinet', '---', '', '# ' + hw['title'] + ' — по шагам', '',
           '> [!info] Навигация', '> **Карта:** [[00 Карта — углублённое ML]]  ', '',
           '> [!abstract] Как работать', '> ' + hw['intro'], '>', '> Задачи с автотестами и песочницей — на сайте, раздел ML → «Практика с кодом». Здесь — условия, подсказки и решения для повторения.', '',
           '> [!tip] Как экспериментировать', quote('\n'.join('- ' + x for x in hw['tips'])), '']
    for n, name, sub in hw['stages']:
        out += ['## Часть ' + str(n) + '. ' + name, '', '*' + sub + '*', '']
        for i, t in enumerate([x for x in tasks if x.get('stage') == n], 1):
            out += ['### ' + str(n) + '.' + str(i) + ' ' + t['title'] + (' · PyTorch, у себя' if t.get('local') else ''), '', t['desc'], '']
            if t.get('check'):
                out += ['Чек-лист:', ''] + ['- [ ] ' + c for c in t['check']] + ['']
            out += ['> [!tip]- Подсказка', quote(t['hint']), '']
            out += ['> [!example]- Решение', quote('```python\n' + t['solution'].rstrip() + '\n```'), '']
    return '\n'.join(out).rstrip() + '\n'


def main(src, dst):
    bn = load_build_notes()
    original = {}
    for dirpath, _, files in os.walk(src):
        for f in files:
            if f.endswith('.md'):
                original[bn.clean_title(f[:-3])] = f[:-3]
    env = dict(os.environ, WITH_PRIVATE='1' if '--with-private' in sys.argv else '0')
    data = json.loads(subprocess.run(['node', '-e', DUMP_JS], cwd=HERE, capture_output=True, text=True, check=True, env=env).stdout)
    topics, modules = data['topics'], data['modules']
    os.makedirs(dst, exist_ok=True)
    written = []
    for t in topics:
        t['notes'] = data['map'].get(t['id'], [])
        folder = os.path.join(dst, FOLDERS.get(t['module'], 'Другое'))
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, safe(t['title']) + '.md')
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(topic_md(t, modules, original, data))
        written.append((t, os.path.relpath(path, dst)))
    track = data.get('track')
    track_name = safe(track['title'] + ' — по шагам') if track else None
    if track:
        with open(os.path.join(dst, FOLDERS['dl'], track_name + '.md'), 'w', encoding='utf-8') as fh:
            fh.write(track_md(track, [x for x in data['tasks'] if x.get('module') == 'track']))
    lines = ['---', 'tags:', '  - area/ml', '  - source/kabinet', '  - type/map', '---', '', '# 00 Карта — углублённое ML', '',
             '> [!abstract] Что это', '> Углублённые заметки по темам из «Рабочего кабинета»: теория с выводами, формулы, главное, вопросы с собеседований (ответ спрятан) и тест. '
             'В каждой — ссылки на твои исходные конспекты. Исходные заметки в папке «ИИ» не менялись.', '']
    for m in modules:
        lines += ['## ' + m[1], '', '*' + m[2] + '*', '']
        for t, rel in written:
            if t['module'] == m[0]:
                lines.append('- [[' + safe(t['title']) + ']] — ' + t.get('summary', '') + ' · вопросов: ' + str(len(t.get('interview') or [])))
        if m[0] == 'dl' and track_name:
            lines.append('- [[' + track_name + ']] — ' + str(len([x for x in data['tasks'] if x.get('module') == 'track'])) + ' шагов')
        lines.append('')
    with open(os.path.join(dst, '00 Карта — углублённое ML.md'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))
    qs = sum(len(t.get('interview') or []) for t in topics)
    print(len(written) + 1 + (1 if track_name else 0), 'заметок,', qs, 'вопросов →', dst)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])  # флаг --with-private читается из sys.argv
