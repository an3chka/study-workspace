"""Собирает конспекты из Obsidian-папки «ИИ» в data/notes.json для раздела ML → «Конспекты».

Запуск:  python3 tools/build-notes.py "/путь/к/obsidian/anya/ИИ"

Личное не публикуется: планы, карьера, речь, рассказ о своём проекте исключены целиком;
у остальных убираются теги (frontmatter), пометки о приоритетах для конкретной компании и вставки картинок.
"""
import json
import os
import re
import sys

EXCLUDE = [
    'Развитие/Как построить карьеру.md',
    'Развитие/Подготовка к собесу/00 Главная/',
    'Развитие/Подготовка к собесу/03 Практический опыт ML и DL/',
    'УАИНС/Проект уаинс/',
]
COMPANY = re.compile(r'Т[-‑‐]?Банк\w*|Тинькофф\w*|t-bank', re.I)


def clean_title(t):
    t = re.sub(r'\s*[—-]\s*минимум\s+(для\s+)?Т[-‑]?Банк\w*', ' — минимум', t)
    t = re.sub(r'\s*[—-]\s*Т[-‑]?Банк\w*', '', t)
    t = re.sub(r'\s+для\s+Т[-‑]?Банк\w*', '', t)
    t = re.sub(r'\s+Т[-‑]?Банк\w*', '', t)
    return t.strip()


def group_of(rel):
    d = os.path.dirname(rel)
    d = d.replace('Развитие/Подготовка к собесу', 'Подготовка к собесу')
    return d


def clean_body(md):
    md = re.sub(r'\A---\n.*?\n---\n', '', md, flags=re.S)           # frontmatter с тегами
    out, skip = [], False
    for line in md.split('\n'):
        if skip:
            if line.startswith('>'):
                continue
            skip = False
        if re.match(r'^>\s*\[!\w+\][^\n]*', line) and COMPANY.search(line):
            skip = True                                                # весь callout про приоритеты компании
            continue
        out.append(line)
    md = '\n'.join(out)
    md = re.sub(r'!\[\[[^\]]+\]\]', '', md)                           # картинки из вложений Obsidian
    # ссылки [[Цель|текст]] — чистим названия так же, как заголовки заметок
    md = re.sub(r'\[\[([^\]|#]+)((?:#[^\]|]*)?)(\|[^\]]*)?\]\]',
                lambda m: '[[' + clean_title(m.group(1)) + m.group(2) + (m.group(3) or '') + ']]', md)
    md = '\n'.join(l for l in md.split('\n') if not COMPANY.search(l))
    md = md.replace('Аня', 'Алиса')
    md = re.sub(r'\n{3,}', '\n\n', md)
    return md.strip() + '\n'


def main(src, dst):
    notes = []
    for dirpath, _, files in os.walk(src):
        for f in files:
            if not f.endswith('.md'):
                continue
            full = os.path.join(dirpath, f)
            rel = os.path.relpath(full, src)
            if any(rel == e or rel.startswith(e) for e in EXCLUDE):
                continue
            with open(full, encoding='utf-8') as fh:
                md = fh.read()
            notes.append({'t': clean_title(f[:-3]), 'g': group_of(rel), 'md': clean_body(md)})
    notes.sort(key=lambda n: (n['g'], n['t']))
    for i, n in enumerate(notes):
        n['id'] = 'n%d' % i
    leftovers = [n['t'] for n in notes if COMPANY.search(n['md']) or COMPANY.search(n['t'])]
    assert not leftovers, leftovers
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with open(dst, 'w', encoding='utf-8') as fh:
        json.dump({'notes': notes}, fh, ensure_ascii=False, separators=(',', ':'))
    print(len(notes), 'заметок,', sum(len(n['md'].split()) for n in notes), 'слов →', dst)


if __name__ == '__main__':
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    main(sys.argv[1], os.path.join(here, 'data', 'notes.json'))
