const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY or SUPABASE_SECRET_KEY.');
  process.exit(1);
}
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'N1kmeL';
const emailFor = username => username.toLowerCase() + '@users.n1kmel.invalid';

async function supabase(pathname, method='GET', body, token=SUPABASE_SECRET_KEY, key=SUPABASE_SECRET_KEY) {
  const response = await fetch(SUPABASE_URL + pathname, {
    method,
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { message: raw }; }
  if (!response.ok) {
    const error = new Error(data?.msg || data?.message || data?.error_description || data?.hint || 'Ошибка базы данных Supabase.');
    error.status = response.status;
    throw error;
  }
  return data;
}
async function authRequest(pathname, body) {
  const response = await fetch(SUPABASE_URL + '/auth/v1/' + pathname, {
    method: 'POST',
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const e = new Error(data.msg || data.message || data.error_description || 'Не удалось выполнить вход.');
    e.status = response.status;
    throw e;
  }
  return data;
}
async function getProfile(id) {
  const rows = await supabase('/rest/v1/profiles?id=eq.' + encodeURIComponent(id) + '&select=id,username,role,banned,created_at');
  return rows?.[0] || null;
}
async function ensureAdmin() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('Set ADMIN_PASSWORD in Render environment settings.');
  const email = emailFor(ADMIN_USERNAME);
  let userId = null;
  try {
    const created = await supabase('/auth/v1/admin/users', 'POST', {
      email, password, email_confirm: true,
      user_metadata: { username: ADMIN_USERNAME }
    });
    userId = created.user?.id || created.id;
  } catch (err) {
    // If the reserved admin already exists, sign in to obtain its stable Auth user ID.
    try {
      const existing = await authRequest('token?grant_type=password', { email, password });
      userId = existing.user?.id;
    } catch {
      throw new Error('Admin account already exists but ADMIN_PASSWORD does not match. Reset that user password in Supabase, then update ADMIN_PASSWORD in Render.');
    }
  }
  if (!userId) throw new Error('Could not initialize admin user.');
  await supabase('/rest/v1/profiles?on_conflict=id', 'POST', {
    id: userId, username: ADMIN_USERNAME, role: 'admin', banned: false
  });
}
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '20kb' }));
app.use(session({
  name: 'n1kmel.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(48).toString('hex'),
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(express.static(__dirname));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const safeUser = p => ({ id:p.id, username:p.username, role:p.role, banned:!!p.banned });

async function current(req,res,next) {
  try {
    if (!req.session.userId) return res.status(401).json({error:'Сначала войди в аккаунт.'});
    const profile = await getProfile(req.session.userId);
    if (!profile || profile.banned) {
      req.session.destroy(()=>{});
      return res.status(403).json({error:'Аккаунт заблокирован или не найден.'});
    }
    req.user = profile;
    next();
  } catch (e) { next(e); }
}
function admin(req,res,next) {
  if (req.user.role !== 'admin') return res.status(403).json({error:'Недостаточно прав.'});
  next();
}
function handleError(res, err) {
  console.error('API error:', err.message);
  const status = err.status && err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({error: status === 500 ? 'Ошибка сервера или базы данных. Проверь настройки Supabase.' : err.message});
}
app.get('/api/health', (req,res)=>res.json({ok:true, database:'supabase'}));

app.post('/api/register', authLimiter, async (req,res)=>{
  const username = String(req.body.username||'').trim();
  const password = String(req.body.password||'');
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({error:'Логин: 3–20 символов, латинские буквы, цифры или _.'});
  if (password.length < 8 || password.length > 72) return res.status(400).json({error:'Пароль должен содержать от 8 до 72 символов.'});
  if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) return res.status(409).json({error:'Этот логин зарезервирован.'});
  try {
    const auth = await authRequest('signup', {
      email: emailFor(username), password,
      data: { username }
    });
    if (!auth.access_token || !auth.user?.id) {
      return res.status(409).json({error:'Регистрация создана, но Supabase требует подтверждение почты. Отключи Confirm email в настройках Auth и попробуй снова.'});
    }
    const profile = await supabase('/rest/v1/profiles', 'POST', {
      id: auth.user.id, username, role: 'user', banned: false
    });
    req.session.userId = auth.user.id;
    res.status(201).json({user:safeUser(profile[0])});
  } catch(e) {
    if (e.status === 409 || e.status === 422) return res.status(409).json({error:'Такой логин уже занят.'});
    handleError(res,e);
  }
});
app.post('/api/login', authLimiter, async (req,res)=>{
  const username = String(req.body.username||'').trim();
  const password = String(req.body.password||'');
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(401).json({error:'Неверный логин или пароль.'});
  try {
    const auth = await authRequest('token?grant_type=password', {email:emailFor(username),password});
    const profile = await getProfile(auth.user.id);
    if (!profile) return res.status(403).json({error:'Профиль не найден. Обратись к администратору.'});
    if (profile.banned) return res.status(403).json({error:'Этот аккаунт заблокирован.'});
    req.session.userId = profile.id;
    res.json({user:safeUser(profile)});
  } catch(e) {
    if (e.status === 400 || e.status === 401) return res.status(401).json({error:'Неверный логин или пароль.'});
    handleError(res,e);
  }
});
app.post('/api/logout',(req,res)=>req.session.destroy(()=>{res.clearCookie('n1kmel.sid');res.json({ok:true});}));
app.get('/api/me',current,(req,res)=>res.json({user:safeUser(req.user)}));

app.get('/api/reviews',async(req,res)=>{
  try {
    const rows = await supabase('/rest/v1/reviews?select=id,rating,body,created_at,profiles!inner(username,banned)&status=eq.approved&profiles.banned=eq.false&order=id.desc&limit=100');
    res.json({reviews:rows.map(r=>({id:r.id,rating:r.rating,body:r.body,created_at:r.created_at,username:r.profiles.username}))});
  } catch(e) { handleError(res,e); }
});
app.post('/api/reviews',current,writeLimiter,async(req,res)=>{
  const body=String(req.body.body||'').trim(), rating=Number(req.body.rating);
  if(!Number.isInteger(rating)||rating<1||rating>5||body.length<8||body.length>500)return res.status(400).json({error:'Проверь оценку и текст отзыва (8–500 символов).'});
  try {
    await supabase('/rest/v1/reviews','POST',{user_id:req.user.id,rating,body});
    res.status(201).json({status:'pending',message:'Отзыв отправлен на проверку администратору.'});
  } catch(e) { handleError(res,e); }
});
app.post('/api/tickets',current,writeLimiter,async(req,res)=>{
  const place=String(req.body.place||'').trim(), contact=String(req.body.contact||'').trim(), details=String(req.body.details||'').trim();
  if(place.length<2||place.length>100||contact.length<2||contact.length>80||details.length<10||details.length>1000)return res.status(400).json({error:'Заполни все поля. Описание — от 10 до 1000 символов.'});
  try {
    const rows=await supabase('/rest/v1/tickets','POST',{user_id:req.user.id,place,contact,details});
    res.status(201).json({id:rows[0]?.id,status:'pending',message:'Заявка сохранена. Её рассмотрит поддержка.'});
  } catch(e) { handleError(res,e); }
});
app.get('/api/my/tickets',current,async(req,res)=>{
  try { const rows=await supabase('/rest/v1/tickets?user_id=eq.'+encodeURIComponent(req.user.id)+'&select=id,place,contact,details,status,reply,created_at,updated_at&order=id.desc'); res.json({tickets:rows}); }
  catch(e){handleError(res,e);}
});
app.get('/api/my/reviews',current,async(req,res)=>{
  try { const rows=await supabase('/rest/v1/reviews?user_id=eq.'+encodeURIComponent(req.user.id)+'&select=id,rating,body,status,created_at&order=id.desc'); res.json({reviews:rows}); }
  catch(e){handleError(res,e);}
});
app.get('/api/admin/overview',current,admin,async(req,res)=>{
  try {
    const [users,reviews,tickets]=await Promise.all([
      supabase('/rest/v1/profiles?select=id,username,role,banned,created_at&order=created_at.desc'),
      supabase('/rest/v1/reviews?select=id,rating,body,status,created_at,profiles!inner(username)&order=id.desc'),
      supabase('/rest/v1/tickets?select=id,place,contact,details,status,reply,created_at,profiles!inner(username)&order=id.desc')
    ]);
    res.json({
      users,
      reviews:reviews.map(r=>({...r,username:r.profiles.username})),
      tickets:tickets.map(t=>({...t,username:t.profiles.username}))
    });
  } catch(e){handleError(res,e);}
});
app.patch('/api/admin/reviews/:id',current,admin,async(req,res)=>{
  const status=String(req.body.status||'');
  if(!['approved','rejected'].includes(status))return res.status(400).json({error:'Некорректный статус.'});
  try { await supabase('/rest/v1/reviews?id=eq.'+encodeURIComponent(req.params.id),'PATCH',{status}); res.json({ok:true}); }
  catch(e){handleError(res,e);}
});
app.delete('/api/admin/reviews/:id',current,admin,async(req,res)=>{
  try { await supabase('/rest/v1/reviews?id=eq.'+encodeURIComponent(req.params.id),'DELETE'); res.json({ok:true}); }
  catch(e){handleError(res,e);}
});
app.patch('/api/admin/users/:id/ban',current,admin,async(req,res)=>{
  const banned=req.body.banned===true, id=req.params.id;
  if(id===req.user.id)return res.status(400).json({error:'Нельзя заблокировать собственный аккаунт.'});
  try {
    const target=await supabase('/rest/v1/profiles?id=eq.'+encodeURIComponent(id)+'&select=role');
    if(!target.length||target[0].role==='admin')return res.status(404).json({error:'Игрок не найден или это администратор.'});
    await supabase('/rest/v1/profiles?id=eq.'+encodeURIComponent(id),'PATCH',{banned});
    res.json({ok:true});
  } catch(e){handleError(res,e);}
});
app.patch('/api/admin/tickets/:id',current,admin,async(req,res)=>{
  const status=String(req.body.status||''), reply=String(req.body.reply||'').trim();
  if(!['pending','accepted','rejected','answered'].includes(status)||reply.length>1000)return res.status(400).json({error:'Проверь статус и ответ.'});
  try { await supabase('/rest/v1/tickets?id=eq.'+encodeURIComponent(req.params.id),'PATCH',{status,reply}); res.json({ok:true}); }
  catch(e){handleError(res,e);}
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
ensureAdmin().then(()=>app.listen(PORT,()=>console.log('N1kmeL site listening on '+PORT))).catch(err=>{console.error('Admin initialization failed:',err.message);process.exit(1);});
