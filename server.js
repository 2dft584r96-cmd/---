import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const production = process.env.NODE_ENV === 'production';
const setupToken = process.env.SETUP_TOKEN || '';
if (production && (setupToken.length < 32 || process.env.COOKIE_SECURE !== '1')) {
  throw new Error('Для публичного запуска задайте SETUP_TOKEN (не менее 32 символов) и COOKIE_SECURE=1.');
}

const root = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(root, 'data', 'apex.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member');
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rooms(id INTEGER PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',kind TEXT NOT NULL DEFAULT 'channel');
CREATE TABLE IF NOT EXISTS room_members(room_id INTEGER REFERENCES rooms(id),user_id INTEGER REFERENCES users(id),PRIMARY KEY(room_id,user_id));
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY,room_id INTEGER NOT NULL REFERENCES rooms(id),user_id INTEGER NOT NULL REFERENCES users(id),body TEXT NOT NULL,parent_id INTEGER REFERENCES messages(id),created TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS reactions(message_id INTEGER REFERENCES messages(id),user_id INTEGER REFERENCES users(id),emoji TEXT,PRIMARY KEY(message_id,user_id,emoji));
CREATE TABLE IF NOT EXISTS saved(message_id INTEGER REFERENCES messages(id),user_id INTEGER REFERENCES users(id),PRIMARY KEY(message_id,user_id));
CREATE TABLE IF NOT EXISTS invites(token TEXT PRIMARY KEY,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS files(id INTEGER PRIMARY KEY,message_id INTEGER NOT NULL REFERENCES messages(id),name TEXT NOT NULL,size INTEGER NOT NULL,content BLOB NOT NULL);
CREATE TABLE IF NOT EXISTS reads(room_id INTEGER REFERENCES rooms(id),user_id INTEGER REFERENCES users(id),last_id INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(room_id,user_id));`);
const get = (sql, ...args) => db.prepare(sql).get(...args);
const all = (sql, ...args) => db.prepare(sql).all(...args);
const run = (sql, ...args) => db.prepare(sql).run(...args);
const count = () => get('SELECT count(*) n FROM users').n;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const digest = value => createHash('sha256').update(value).digest('hex');
const passwordHash = password => { const salt = randomBytes(16).toString('hex'); return salt + ':' + scryptSync(password, salt, 64).toString('hex'); };
const passwordMatches = (password, hash) => { const [salt, value] = hash.split(':'); return timingSafeEqual(Buffer.from(value, 'hex'), scryptSync(password, salt, 64)); };
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role });
function text(value, max = 4000) { if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, `Введите текст от 1 до ${max} символов.`); return value.trim(); }
function roomAccess(id, user) { const room = get("SELECT * FROM rooms WHERE id=? AND (kind='channel' OR EXISTS(SELECT 1 FROM room_members WHERE room_id=rooms.id AND user_id=?))", id, user.id); if (!room) fail(404, 'Разговор не найден.'); return room; }
function messageAccess(id, user) { const message = get('SELECT * FROM messages WHERE id=?', id); if (!message) fail(404, 'Сообщение не найдено.'); roomAccess(message.room_id, user); return message; }
function enriched(messages, user) { return messages.map(m => ({ ...m, file: get('SELECT id,name,size FROM files WHERE message_id=?', m.id) || null, reactions: all('SELECT emoji,count(*) count,max(user_id=?) mine FROM reactions WHERE message_id=? GROUP BY emoji', user.id, m.id), saved: !!get('SELECT 1 FROM saved WHERE message_id=? AND user_id=?', m.id, user.id), replies: get('SELECT count(*) n FROM messages WHERE parent_id=?', m.id).n })); }
const attempts = new Map();
function limit(req) { const key = req.socket.remoteAddress; const now = Date.now(); const value = attempts.get(key); if (!value || value.until < now) attempts.set(key, { n: 1, until: now + 60000 }); else if (++value.n > 30) fail(429, 'Слишком много попыток. Попробуйте через минуту.'); }
async function body(req, max = 16384) { const chunks=[]; let length=0; for await (const chunk of req) { length+=chunk.length; if(length>max) fail(413, 'Запрос слишком большой.'); chunks.push(chunk); } try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { fail(400, 'Не удалось прочитать запрос.'); } }
function session(res, user) { const token = randomBytes(32).toString('hex'); run('INSERT INTO sessions VALUES(?,?,?)', digest(token), user.id, Date.now() + 7 * 86400000); res.setHeader('Set-Cookie', `apex_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${process.env.COOKIE_SECURE === '1' ? '; Secure' : ''}`); }
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  const send = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    if (!path.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') fail(405, 'Метод недоступен.');
      const file = ({ '/': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css', '/logo.png': 'logo.png' })[path];
      if (!file) fail(404, 'Страница не найдена.');
      res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' })[extname(file)] });
      return res.end(req.method === 'HEAD' ? undefined : readFileSync(join(root, 'public', file)));
    }
    if (!['GET', 'POST'].includes(req.method)) fail(405, 'Метод недоступен.');
    if (req.method === 'POST' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) fail(403, 'Запрос с другого сайта запрещён.');
    if (path === '/api/health' && req.method === 'GET') return send({ ok: true });
    if (path === '/api/status' && req.method === 'GET') return send({ needsSetup: count() === 0, setupProtected: !!setupToken });
    const data = req.method === 'POST' ? await body(req, path === '/api/files' ? 14 * 1024 * 1024 : 16384) : {};
    if (['/api/setup', '/api/register', '/api/login'].includes(path) && req.method === 'POST') {
      limit(req);
      const email = text(data.email, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Укажите корректную электронную почту.');
      if (typeof data.password !== 'string' || data.password.length < 10 || data.password.length > 128) fail(400, 'Пароль должен содержать от 10 до 128 символов.');
      if (path === '/api/login') { const user = get('SELECT * FROM users WHERE email=?', email); if (!user || !passwordMatches(data.password, user.hash)) fail(401, 'Неверная почта или пароль.'); session(res, user); return send(publicUser(user)); }
      const setup = path === '/api/setup';
      if (setup && setupToken && !timingSafeEqual(Buffer.from(digest(String(data.setupToken || '')), 'hex'), Buffer.from(digest(setupToken), 'hex'))) fail(403, 'Неверный код создания пространства.');
      if (setup && count()) fail(409, 'Пространство уже создано. Войдите в аккаунт.');
      if (!setup && !get('SELECT * FROM invites WHERE token=? AND expires>?', digest(String(data.invite || '')), Date.now())) fail(403, 'Приглашение недействительно или истекло.');
      if (get('SELECT id FROM users WHERE email=?', email)) fail(409, 'Эта почта уже зарегистрирована.');
      const name = text(data.name, 80);
      const hash = passwordHash(data.password);
      db.exec('BEGIN');
      try {
        const id = Number(run('INSERT INTO users(name,email,hash,role) VALUES(?,?,?,?)', name, email, hash, setup ? 'admin' : 'member').lastInsertRowid);
        if (setup) for (const [title, description] of [['общий', 'Вся команда на одной волне. Объявления и жизнь АПЕКС-РАДИО.'], ['эфир', 'Планируем эфир, передаём смену, остаёмся на связи.'], ['редакция', 'Новости, темы и материалы для эфира.'], ['музыка', 'Плейлисты, новинки и музыкальные находки.']]) run('INSERT INTO rooms(name,description) VALUES(?,?)', title, description);
        else run('DELETE FROM invites WHERE token=?', digest(data.invite));
        db.exec('COMMIT');
        const user = get('SELECT * FROM users WHERE id=?', id); session(res, user); return send(publicUser(user), 201);
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('apex_session='))?.slice(13);
    const user = token && get('SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE token=? AND expires>?', digest(token), Date.now());
    if (!user) fail(401, 'Войдите в рабочее пространство.');
    if (path.startsWith('/api/files/') && req.method === 'GET') {
      const id = Number(path.slice('/api/files/'.length));
      const meta = get('SELECT id,message_id,name FROM files WHERE id=?', id);
      if (!meta) fail(404, 'Файл не найден.');
      messageAccess(meta.message_id, user);
      const file = get('SELECT content,size FROM files WHERE id=?', id);
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': file.size, 'Content-Disposition': `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(meta.name).replace(/'/g, '%27')}`, 'Cache-Control': 'private, no-store' });
      return res.end(Buffer.from(file.content));
    }
    if (path === '/api/files' && req.method === 'GET') {
      return send(all("SELECT f.id,f.name,f.size,m.room_id,m.created,u.name author,r.name room_name,r.kind FROM files f JOIN messages m ON m.id=f.message_id JOIN users u ON u.id=m.user_id JOIN rooms r ON r.id=m.room_id WHERE r.kind='channel' OR EXISTS(SELECT 1 FROM room_members WHERE room_id=r.id AND user_id=?) ORDER BY f.id DESC LIMIT 200", user.id));
    }
    if (path === '/api/files' && req.method === 'POST') {
      const room = Number(data.roomId); roomAccess(room, user);
      const name = text(data.name, 180).replace(/[\\/\x00-\x1f\x7f]/g, '_');
      if (typeof data.content !== 'string' || /[^A-Za-z0-9+/=]/.test(data.content)) fail(400, 'Не удалось прочитать файл.');
      const content = Buffer.from(data.content, 'base64');
      if (content.toString('base64') !== data.content) fail(400, 'Не удалось прочитать файл.');
      if (!content.length || content.length > 10 * 1024 * 1024) fail(400, 'Размер файла должен быть от 1 байта до 10 МБ.');
      db.exec('BEGIN');
      try {
        const message = Number(run('INSERT INTO messages(room_id,user_id,body) VALUES(?,?,?)', room, user.id, 'Файл: ' + name).lastInsertRowid);
        const id = Number(run('INSERT INTO files(message_id,name,size,content) VALUES(?,?,?,?)', message, name, content.length, content).lastInsertRowid);
        db.exec('COMMIT'); return send({ id, messageId: message }, 201);
      } catch(error) { db.exec('ROLLBACK'); throw error; }
    }
    if (path === '/api/logout' && req.method === 'POST') { run('DELETE FROM sessions WHERE token=?', digest(token)); res.setHeader('Set-Cookie', 'apex_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send({ ok: true }); }
    if (path === '/api/state' && req.method === 'GET') {
      const rooms = all("SELECT rooms.*,(SELECT count(*) FROM messages m WHERE m.room_id=rooms.id AND m.user_id<>? AND m.id>coalesce((SELECT last_id FROM reads WHERE room_id=rooms.id AND user_id=?),0)) unread FROM rooms WHERE kind='channel' OR EXISTS(SELECT 1 FROM room_members WHERE room_id=rooms.id AND user_id=?)", user.id, user.id, user.id).map(r => r.kind === 'dm' ? { ...r, name: get('SELECT name FROM users JOIN room_members ON users.id=room_members.user_id WHERE room_id=? AND user_id<>?', r.id, user.id)?.name || 'Личные сообщения' } : r);
      return send({ user: publicUser(user), rooms, users: all('SELECT id,name,role FROM users') });
    }
    if (path === '/api/invites' && req.method === 'POST') { if (user.role !== 'admin') fail(403, 'Приглашения создаёт администратор.'); const invite = randomBytes(24).toString('hex'); run('INSERT INTO invites VALUES(?,?)', digest(invite), Date.now() + 86400000); return send({ invite }); }
    if (path === '/api/rooms' && req.method === 'POST') {
      if (data.userId) {
        const peer = Number(data.userId); if (peer === user.id || !get('SELECT id FROM users WHERE id=?', peer)) fail(400, 'Выберите коллегу.');
        const existing = get("SELECT r.id FROM rooms r JOIN room_members a ON a.room_id=r.id JOIN room_members b ON b.room_id=r.id WHERE r.kind='dm' AND a.user_id=? AND b.user_id=?", user.id, peer);
        if (existing) return send(existing);
        db.exec('BEGIN'); try { const id = Number(run("INSERT INTO rooms(name,kind) VALUES('','dm')").lastInsertRowid); run('INSERT INTO room_members VALUES(?,?)', id, user.id); run('INSERT INTO room_members VALUES(?,?)', id, peer); db.exec('COMMIT'); return send({ id }, 201); } catch (e) { db.exec('ROLLBACK'); throw e; }
      }
      const name = text(data.name, 40).toLowerCase().replace(/\s+/g, '-');
      if (get("SELECT id FROM rooms WHERE kind='channel' AND name=?", name)) fail(409, 'Канал с таким названием уже существует.');
      const description = typeof data.description === 'string' ? data.description.trim().slice(0, 250) : '';
      return send({ id: Number(run('INSERT INTO rooms(name,description) VALUES(?,?)', name, description).lastInsertRowid) }, 201);
    }
    if (path === '/api/messages' && req.method === 'GET') {
      const room = Number(url.searchParams.get('room')); roomAccess(room, user);
      return send(enriched(all('SELECT m.*,u.name FROM messages m JOIN users u ON u.id=m.user_id WHERE room_id=? ORDER BY m.id DESC LIMIT 1000', room).reverse(), user));
    }
    if (path === '/api/messages' && req.method === 'POST') {
      const room = Number(data.roomId); roomAccess(room, user); const value = text(data.body);
      const parent = data.parentId ? Number(data.parentId) : null;
      if (parent) { const p = messageAccess(parent, user); if (p.room_id !== room || p.parent_id) fail(400, 'Выберите исходное сообщение в этом разговоре.'); }
      return send({ id: Number(run('INSERT INTO messages(room_id,user_id,body,parent_id) VALUES(?,?,?,?)', room, user.id, value, parent).lastInsertRowid) }, 201);
    }
    if (path === '/api/read' && req.method === 'POST') { const room = Number(data.roomId); roomAccess(room, user); const last = get('SELECT coalesce(max(id),0) id FROM messages WHERE room_id=?', room).id; run('INSERT INTO reads VALUES(?,?,?) ON CONFLICT(room_id,user_id) DO UPDATE SET last_id=excluded.last_id', room, user.id, last); return send({ ok: true }); }
    if (path === '/api/reactions' && req.method === 'POST') { const id = Number(data.messageId); messageAccess(id, user); if (!['👍', '❤️', '🔥', '✅', '🎙️', '😂'].includes(data.emoji)) fail(400, 'Выберите доступную реакцию.'); if (get('SELECT 1 FROM reactions WHERE message_id=? AND user_id=? AND emoji=?', id, user.id, data.emoji)) run('DELETE FROM reactions WHERE message_id=? AND user_id=? AND emoji=?', id, user.id, data.emoji); else run('INSERT INTO reactions VALUES(?,?,?)', id, user.id, data.emoji); return send({ ok: true }); }
    if (path === '/api/saved' && req.method === 'POST') { const id = Number(data.messageId); messageAccess(id, user); if (get('SELECT 1 FROM saved WHERE message_id=? AND user_id=?', id, user.id)) run('DELETE FROM saved WHERE message_id=? AND user_id=?', id, user.id); else run('INSERT INTO saved VALUES(?,?)', id, user.id); return send({ ok: true }); }
    if ((path === '/api/search' || path === '/api/saved') && req.method === 'GET') {
      const q = (url.searchParams.get('q') || '').slice(0, 200);
      const where = path === '/api/saved' ? 'EXISTS(SELECT 1 FROM saved WHERE message_id=m.id AND user_id=?)' : "instr(lower(m.body),lower(?))>0";
      // SQLite lower() is ASCII-only; filter Unicode search in JS below.
      const rows = all(`SELECT m.*,u.name,r.name room_name FROM messages m JOIN users u ON u.id=m.user_id JOIN rooms r ON r.id=m.room_id WHERE (r.kind='channel' OR EXISTS(SELECT 1 FROM room_members WHERE room_id=r.id AND user_id=?)) ${path === '/api/saved' ? 'AND ' + where : ''} ORDER BY m.id DESC`, ...[user.id, ...(path === '/api/saved' ? [user.id] : [])]);
      return send(enriched(rows.filter(m => path === '/api/saved' || m.body.toLocaleLowerCase('ru').includes(q.toLocaleLowerCase('ru'))).slice(0, 100), user));
    }
    fail(404, 'Действие не найдено.');
  } catch (error) { if (!error.status) console.error(error); send({ error: error.status ? error.message : 'Ошибка сервера. Попробуйте ещё раз.' }, error.status || 500); }
});
server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log(`АПЕКС-РАДИО: сервер запущен, порт ${server.address().port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
