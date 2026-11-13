"""Помощник для страницы «Работа»: ищет новые вакансии по кнопке на сайте и сам раз в день.

Запуск:  python3 tools/job-helper.py            (слушает только этот компьютер: 127.0.0.1:8766)
         python3 tools/job-helper.py --scan     (один раз проверить и выйти)

Что умеет — и только это:
  * читать ПУБЛИЧНЫЕ страницы Telegram-каналов (t.me/s/<канал>) — то, что видно любому без входа;
  * читать поиск вакансий Хабр Карьеры;
  * скачать PDF со списком компаний по адресу из private/job-helper.json (если он там указан).
Другие адреса он не открывает. Ни в какие аккаунты не входит, ничего не отправляет от твоего имени.
Отвечает только сайту «Рабочий кабинет» (проверка Origin) и только с этого компьютера.
Найденное хранит в папке private/ (её нет на GitHub).
"""
import json
import os
import re
import html
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = 1
PORT = 8766
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIVATE = os.path.join(HERE, 'private')
STATE_FILE = os.path.join(PRIVATE, 'job-helper-state.json')   # что искать (присылает сайт)
FEED_FILE = os.path.join(PRIVATE, 'job-feed.json')            # что нашлось
CONFIG_FILE = os.path.join(PRIVATE, 'job-helper.json')        # личные настройки (адрес списка компаний)

ALLOWED_ORIGINS = re.compile(r'^(https://an3chka\.github\.io|http://(127\.0\.0\.1|localhost|\[::1\])(:\d+)?)$')
CHANNEL_RE = re.compile(r'^[A-Za-z0-9_]{3,64}$')
UA = 'Mozilla/5.0 (X11; Linux x86_64) kabinet-job-helper/1'
KEEP_DAYS = 30
DAILY_EVERY = 20 * 3600

lock = threading.Lock()


# ---------- файлы ----------

def read_json(path, default):
    try:
        with open(path, encoding='utf-8') as fh:
            return json.load(fh)
    except Exception:
        return default


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False)
    os.replace(tmp, path)


# ---------- загрузка (только разрешённые адреса) ----------

def fetch(url, allowed_hosts):
    host = urllib.parse.urlsplit(url).hostname or ''
    if urllib.parse.urlsplit(url).scheme != 'https' or host not in allowed_hosts:
        raise ValueError('адрес не из списка разрешённых: ' + host)
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'ru,en;q=0.8'})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def strip_tags(s):
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'<[^>]+>', '', s)
    return html.unescape(s).replace('\xa0', ' ').strip()


def telegram(channel):
    """Последние посты публичного канала из веб-версии t.me/s/<канал>."""
    page = fetch('https://t.me/s/' + channel, {'t.me'}).decode('utf-8', 'replace')
    items = []
    for block in re.split(r'(?=<div class="tgme_widget_message_wrap)', page)[1:]:
        post = re.search(r'data-post="([^"]+)"', block)
        text = re.search(r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', block, re.S)
        when = re.search(r'<time[^>]*datetime="([^"]+)"', block)
        if not post or not text:
            continue
        body = strip_tags(text.group(1))
        title = next((ln.strip(' *-—•') for ln in body.split('\n') if len(ln.strip(' *-—•')) > 3), body[:80])
        items.append({
            'id': 'tg:' + post.group(1), 'source': '@' + channel, 'url': 'https://t.me/' + post.group(1),
            'date': when.group(1) if when else '', 'title': title[:140], 'text': body[:2000],
        })
    return items


def habr(query, qid):
    q = urllib.parse.urlencode({'sort': 'date', 'type': 'all', 'currency': 'RUR', 'page': 1, 'q': query, 'qid': qid})
    data = json.loads(fetch('https://career.habr.com/api/frontend/vacancies?' + q, {'career.habr.com'}))
    items = []
    for v in data.get('list', []):
        locs = [x.get('title', '') for x in (v.get('locations') or [])]
        skills = [x.get('title', '') for x in (v.get('skills') or [])]
        divisions = [x.get('title', '') for x in (v.get('divisions') or [])]
        items.append({
            'id': 'habr:' + str(v.get('id')), 'source': 'Хабр Карьера', 'url': 'https://career.habr.com' + (v.get('href') or ''),
            'date': (v.get('publishedDate') or {}).get('date', ''), 'title': v.get('title', ''),
            'company': (v.get('company') or {}).get('title', ''),
            'text': ' · '.join(x for x in [', '.join(divisions), ', '.join(skills), ', '.join(locs),
                                            'удалённо' if v.get('remoteWork') else '', (v.get('salary') or {}).get('formatted', '')] if x),
            'remote': bool(v.get('remoteWork')), 'locations': locs, 'level': v.get('qualification') or '',
            'salary': (v.get('salary') or {}).get('formatted', ''),
        })
    return items


# ---------- поиск ----------

def scan(prefs=None):
    """Проходит по каналам и запросам, складывает новое в private/job-feed.json."""
    with lock:
        state = read_json(STATE_FILE, {})
        if prefs:
            state = {'channels': prefs.get('channels', []), 'habr': prefs.get('habr', [])}
            write_json(STATE_FILE, state)
        channels = [c.lstrip('@') for c in state.get('channels', []) if CHANNEL_RE.match(c.lstrip('@'))][:40]
        queries = [q for q in state.get('habr', []) if isinstance(q, str) and 0 < len(q) <= 60][:6]
        found, errors = [], []
        for ch in channels:
            try:
                found += telegram(ch)
            except Exception as e:
                errors.append('@' + ch + ': ' + str(e)[:120])
            time.sleep(0.4)
        for q in queries:
            for qid in (1, 3):   # 1 — стажёр, 3 — младший (junior)
                try:
                    found += habr(q, qid)
                except Exception as e:
                    errors.append('Хабр «' + q + '»: ' + str(e)[:120])
                time.sleep(0.4)
        feed = read_json(FEED_FILE, {'items': []})
        known = {x['id']: x for x in feed.get('items', [])}
        now = time.time()
        for it in found:
            it.setdefault('found', now)
            if it['id'] in known:
                it['found'] = known[it['id']].get('found', now)
            known[it['id']] = it
        cutoff = now - KEEP_DAYS * 86400
        items = sorted((x for x in known.values() if x.get('found', now) >= cutoff), key=lambda x: x.get('date', ''), reverse=True)[:800]
        feed = {'items': items, 'lastScan': now, 'errors': errors}
        write_json(FEED_FILE, feed)
        return feed


def partners():
    """Список компаний из PDF (адрес — в private/job-helper.json, ключ partnersUrl)."""
    url = read_json(CONFIG_FILE, {}).get('partnersUrl')
    if not url:
        raise ValueError('в private/job-helper.json нет адреса partnersUrl')
    if not shutil.which('pdftotext'):
        raise ValueError('нужна программа pdftotext (пакет poppler-utils)')
    host = urllib.parse.urlsplit(url).hostname
    data = fetch(url, {host})
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, 'list.pdf')
        with open(path, 'wb') as fh:
            fh.write(data)
        text = subprocess.run(['pdftotext', '-layout', path, '-'], capture_output=True, text=True, check=True).stdout
    return parse_partners(text)


def nice(s):
    return ' '.join(w if len(w.strip('«»"')) <= 3 else w.title() for w in s.split())


def parse_partners(text):
    """Разбирает таблицу «№ Название компании» в несколько колонок. Заголовки групп берутся из самого PDF."""
    out, heads, last_group = [], {}, ''
    for page in text.split('\f'):
        heads = {}   # заголовки колонок — свои на каждой странице; колонка без заголовка берёт первый заголовок страницы
        cols, had_rows, last_name, lines = None, {}, {}, page.split('\n')
        head_at = next((i for i, ln in enumerate(lines) if 'Название компании' in ln), None)
        if head_at is None:
            continue
        cols = [m.start() for m in re.finditer('№', lines[head_at])]
        # заголовки колонок стоят над строкой «№ Название компании»: берём их, начиная с первой строки в несколько колонок
        before = lines[:head_at]
        first = next((i for i, ln in enumerate(before) if len(re.findall(r'\S+(?:\s\S+)*', ln)) > 1), len(before))
        for line in before[first:] + lines[head_at + 1:]:
            if not line.strip():
                continue
            chunks, num = [], None   # куски, разделённые 2+ пробелами; номер склеиваем с названием
            for m in re.finditer(r'\S+(?:\s\S+)*', line):
                if re.fullmatch(r'\d+', m.group(0)):
                    num = (m.group(0), m.start())
                    continue
                chunks.append((num[0] + ' ' + m.group(0), num[1]) if num else (m.group(0), m.start()))
                num = None
            for chunk, pos in chunks:
                col = max([i for i, c in enumerate(cols) if pos >= c - 4] or [0])
                row = re.match(r'^(\d+)\s+(.+)$', chunk)
                if row:
                    group = heads.get(col) or next(iter(heads.values()), '') or last_group
                    had_rows[col] = True
                    last_group = group
                    name = row.group(2).strip()
                    out.append({'name': name, 'group': group})
                    last_name[col] = out[-1]
                elif chunk.upper() == chunk and re.search('[А-ЯA-Z]{3}', chunk):
                    words = chunk.split()
                    if had_rows.get(col) or len(words) > 1:
                        heads[col] = nice(chunk)
                        had_rows[col] = False
                    else:
                        heads[col] = (heads.get(col, '') + ' ' + nice(chunk)).strip()
                elif col in last_name and chunk[:1].isupper() and len(chunk) < 40 and not chunk.endswith('!'):
                    last_name[col]['name'] += ' ' + chunk
    seen, res = set(), []
    for p in out:
        key = (p['name'], p['group'])
        if key not in seen:
            seen.add(key)
            res.append(p)
    return res


# ---------- раз в день ----------

def daily_loop():
    while True:
        feed = read_json(FEED_FILE, {})
        if read_json(STATE_FILE, {}).get('channels') and time.time() - feed.get('lastScan', 0) > DAILY_EVERY:
            try:
                scan()
            except Exception as e:
                print('Ежедневная проверка не удалась:', e, file=sys.stderr)
        time.sleep(1800)


# ---------- сервер ----------

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def origin_ok(self):
        origin = self.headers.get('Origin', '')
        return origin if ALLOWED_ORIGINS.match(origin) else None

    def send(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        origin = self.origin_ok()
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        origin = self.origin_ok()
        self.send_response(204 if origin else 403)
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Access-Control-Allow-Methods', 'GET, POST')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Access-Control-Allow-Private-Network', 'true')
            self.send_header('Vary', 'Origin')
        self.end_headers()

    def guard(self):
        if self.client_address[0] not in ('127.0.0.1', '::1') or not self.origin_ok():
            self.send(403, {'error': 'доступ только для сайта «Рабочий кабинет» на этом компьютере'})
            return False
        return True

    def do_GET(self):
        if not self.guard():
            return
        path = urllib.parse.urlsplit(self.path).path
        try:
            if path == '/ping':
                feed = read_json(FEED_FILE, {})
                self.send(200, {'ok': True, 'version': VERSION, 'lastScan': feed.get('lastScan', 0),
                                'partners': bool(read_json(CONFIG_FILE, {}).get('partnersUrl'))})
            elif path == '/feed':
                self.send(200, read_json(FEED_FILE, {'items': []}))
            elif path == '/partners':
                self.send(200, {'items': partners()})
            else:
                self.send(404, {'error': 'нет такого'})
        except Exception as e:
            self.send(500, {'error': str(e)[:300]})

    def do_POST(self):
        if not self.guard():
            return
        try:
            n = min(int(self.headers.get('Content-Length') or 0), 100000)
            prefs = json.loads(self.rfile.read(n) or b'{}')
            if urllib.parse.urlsplit(self.path).path != '/scan':
                return self.send(404, {'error': 'нет такого'})
            self.send(200, scan(prefs))
        except Exception as e:
            self.send(500, {'error': str(e)[:300]})


def main():
    if '--scan' in sys.argv:
        feed = scan()
        print('Найдено записей:', len(feed['items']), '; ошибок:', len(feed['errors']))
        return
    threading.Thread(target=daily_loop, daemon=True).start()
    server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print('Помощник для вакансий работает: http://127.0.0.1:%d (Ctrl+C — остановить)' % PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
