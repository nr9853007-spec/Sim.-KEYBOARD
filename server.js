const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = process.env.DATABASE_PATH || path.join(os.tmpdir(), 'n1kmel-site.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user',
 banned INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reviews (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
 rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), body TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tickets (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
 place TEXT NOT NULL, contact TEXT NOT NULL, details TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending', reply TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

async function ensureAdmin() {
 const username = process.env.ADMIN_USERNAME || 'N1kmeL';
 const password = process.env.ADMIN_PASSWORD;
 if (!password) {
   console.warn('ADMIN_PASSWORD is not set. Set it in the hosting environment before using the admin account.');
   return;
 }
 const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
 const hash = await bcrypt.hash(password, 12);
 if (existing) db.prepare("UPDATE users SET password_hash=?, role='admin', banned=0 WHERE id=?").run(hash, existing.id);
 else db.prepare("INSERT INTO users(username,password_hash,role) VALUES(?,?,'admin')").run(username, hash);
}
const adminReady = ensureAdmin();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '20kb' }));
app.use(session({
 store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.dirname(dbPath) }),
 secret: process.env.SESSION_SECRET || require('crypto').randomBytes(48).toString('hex'),
 resave: false, saveUninitialized: false,
 cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(express.static(__dirname));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const safeUser = u => ({ id:u.id, username:u.username, role:u.role, banned:!!u.banned });
function current(req,res,next) {
 if (!req.session.userId) return res.status(401).json({error:'Сначала войди в аккаунт.'});
 const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.session.userId);
 if (!user || user.banned) { req.session.destroy(()=>{}); return res.status(403).json({error:'Аккаунт заблокирован или не найден.'}); }
 req.user = user; next();
}
function admin(req,res,next) {
 if (req.user.role !== 'admin') return res.status(403).json({error:'Недостаточно прав.'});
 next();
}
app.get('/api/health', (req,res)=>res.json({ok:true}));
app.post('/api/register', authLimiter, async (req,res)=>{
 const username = String(req.body.username||'').trim();
 const password = String(req.body.password||'');
 if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({error:'Логин: 3–20 символов, латинские буквы, цифры или _.'});
 if (password.length < 8 || password.length > 72) return res.status(400).json({error:'Пароль должен содержать от 8 до 72 символов.'});
 if (username.toLowerCase() === (process.env.ADMIN_USERNAME||'N1kmeL').toLowerCase()) return res.status(409).json({error:'Этот логин зарезервирован.'});
 try {
  const hash = await bcrypt.hash(password,12);
  const result = db.prepare('INSERT INTO users(username,password_hash) VALUES(?,?)').run(username,hash);
  req.session.userId = result.lastInsertRowid;
  res.status(201).json({user:safeUser(db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid))});
 } catch(e) { res.status(409).json({error:'Такой логин уже занят.'}); }
});
app.post('/api/login', authLimiter, async (req,res)=>{
 const username=String(req.body.username||'').trim(), password=String(req.body.password||'');
 const user=db.prepare('SELECT * FROM users WHERE username=?').get(username);
 if (!user || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({error:'Неверный логин или пароль.'});
 if (user.banned) return res.status(403).json({error:'Этот аккаунт заблокирован.'});
 req.session.userId=user.id; res.json({user:safeUser(user)});
});
app.post('/api/logout',(req,res)=>req.session.destroy(()=>{res.clearCookie('connect.sid');res.json({ok:true});}));
app.get('/api/me',current,(req,res)=>res.json({user:safeUser(req.user)}));

app.get('/api/reviews',(req,res)=>{
 const rows=db.prepare("SELECT r.id,r.rating,r.body,r.created_at,u.username FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.status='approved' AND u.banned=0 ORDER BY r.id DESC LIMIT 100").all();
 res.json({reviews:rows});
});
app.post('/api/reviews',current,writeLimiter,(req,res)=>{
 const body=String(req.body.body||'').trim(), rating=Number(req.body.rating);
 if (!Number.isInteger(rating)||rating<1||rating>5||body.length<8||body.length>500) return res.status(400).json({error:'Проверь оценку и текст отзыва (8–500 символов).'});
 const result=db.prepare("INSERT INTO reviews(user_id,rating,body) VALUES(?,?,?)").run(req.user.id,rating,body);
 res.status(201).json({id:result.lastInsertRowid,status:'pending',message:'Отзыв отправлен на проверку администратору.'});
});
app.post('/api/tickets',current,writeLimiter,(req,res)=>{
 const place=String(req.body.place||'').trim(), contact=String(req.body.contact||'').trim(), details=String(req.body.details||'').trim();
 if(place.length<2||place.length>100||contact.length<2||contact.length>80||details.length<10||details.length>1000) return res.status(400).json({error:'Заполни все поля. Описание — от 10 до 1000 символов.'});
 const result=db.prepare('INSERT INTO tickets(user_id,place,contact,details) VALUES(?,?,?,?)').run(req.user.id,place,contact,details);
 res.status(201).json({id:result.lastInsertRowid,status:'pending',message:'Заявка сохранена. Её рассмотрит поддержка.'});
});
app.get('/api/my/tickets',current,(req,res)=>res.json({tickets:db.prepare('SELECT id,place,contact,details,status,reply,created_at,updated_at FROM tickets WHERE user_id=? ORDER BY id DESC').all(req.user.id)}));
app.get('/api/my/reviews',current,(req,res)=>res.json({reviews:db.prepare('SELECT id,rating,body,status,created_at FROM reviews WHERE user_id=? ORDER BY id DESC').all(req.user.id)}));

app.get('/api/admin/overview',current,admin,(req,res)=>{
 res.json({
  users:db.prepare('SELECT id,username,role,banned,created_at FROM users ORDER BY id DESC').all(),
  reviews:db.prepare('SELECT r.id,r.rating,r.body,r.status,r.created_at,u.username FROM reviews r JOIN users u ON u.id=r.user_id ORDER BY r.id DESC').all(),
  tickets:db.prepare('SELECT t.id,t.place,t.contact,t.details,t.status,t.reply,t.created_at,u.username FROM tickets t JOIN users u ON u.id=t.user_id ORDER BY t.id DESC').all()
 });
});
app.patch('/api/admin/reviews/:id',current,admin,(req,res)=>{
 const status=String(req.body.status||'');
 if(!['approved','rejected'].includes(status)) return res.status(400).json({error:'Некорректный статус.'});
 const result=db.prepare('UPDATE reviews SET status=? WHERE id=?').run(status,Number(req.params.id));
 if(!result.changes)return res.status(404).json({error:'Отзыв не найден.'});
 res.json({ok:true});
});
app.delete('/api/admin/reviews/:id',current,admin,(req,res)=>{
 const result=db.prepare('DELETE FROM reviews WHERE id=?').run(Number(req.params.id));
 if(!result.changes)return res.status(404).json({error:'Отзыв не найден.'});
 res.json({ok:true});
});
app.patch('/api/admin/users/:id/ban',current,admin,(req,res)=>{
 const banned=req.body.banned===true?1:0, id=Number(req.params.id);
 if(id===req.user.id)return res.status(400).json({error:'Нельзя заблокировать собственный аккаунт.'});
 const result=db.prepare("UPDATE users SET banned=? WHERE id=? AND role!='admin'").run(banned,id);
 if(!result.changes)return res.status(404).json({error:'Игрок не найден или это администратор.'});
 res.json({ok:true});
});
app.patch('/api/admin/tickets/:id',current,admin,(req,res)=>{
 const status=String(req.body.status||''), reply=String(req.body.reply||'').trim();
 if(!['pending','accepted','rejected','answered'].includes(status)||reply.length>1000)return res.status(400).json({error:'Проверь статус и ответ.'});
 const result=db.prepare('UPDATE tickets SET status=?,reply=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status,reply,Number(req.params.id));
 if(!result.changes)return res.status(404).json({error:'Заявка не найдена.'});
 res.json({ok:true});
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
adminReady.then(()=>app.listen(PORT,()=>console.log('N1kmeL site listening on '+PORT))).catch(err => { console.error('Admin initialization failed', err); process.exit(1); });
