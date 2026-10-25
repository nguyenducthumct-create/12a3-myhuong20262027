const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const NAMES=["Hồ Thị Lan Anh", "Lương Ngọc Anh", "Võ Đặng Quang Anh", "Huỳnh Văn Cường", "Huỳnh Lê Duy", "Đỗ Lý Thành Đạt", "Phạm Anh Hiều", "Phạm Trần Phúc Hưng", "Nguyễn Thanh Hương", "Triệu Hồ Ngọc Hương", "Phan Nguyễn Kha", "Huỳnh Trường Khánh", "Lâm Minh Khiêm", "Nguyễn Quốc Kiệt", "Nguyễn Thị Nhã Kỳ", "Nguyễn Thị Cẩm Loan", "Trần Ngọc Ly", "Lâm Thị Trúc Mai", "Thái Quang Minh", "Trầm Kim Ngân", "Trương Thị Kim Ngân", "Lưu Tấn Nghĩa", "Phan Ánh Ngọc", "Phạm Thanh Nhã", "Hồ Thanh Nhàn", "Phạm Văn Nhanh", "Phạm Huỳnh Nguyệt Như", "Trần Thị Huỳnh Như", "Võ Huỳnh Như", "Tô Bá Quí", "Trịnh Kiến Quốc", "Nguyễn Thị Thúy Quyên", "Lê Thái Thành", "Lê Thị Thu Thảo", "Mai Quốc Thiên", "Trần Hoài Thương", "Bùi Hoàng Tiến", "Phan Thị Huyền Trân", "Trần Anh Trọng", "Bùi Quan Tường", "Âu Tấn Vũ", "Phan Thị Thúy Vy"];
const BDAY=["07/09", "01/05", "11/02", "22/02", "31/10", "15/02", "29/08", "30/07", "14/02", "09/07", "08/09", "15/02", "12/11", "23/08", "24/10", "15/05", "31/05", "23/10", "26/02", "05/12", "29/10", "03/01", "19/04", "15/02", "05/07", "09/02", "09/02", "14/02", "05/11", "11/02", "12/10", "14/11", "26/07", "14/06", "25/12", "10/10", "13/10", "27/02", "05/10", "29/09", "07/05", "11/03"];
// Mã đăng nhập của giáo viên (admin): nên đặt bằng biến môi trường ADMIN_CODE
const ADMIN_CODE=process.env.ADMIN_CODE||'ndthummh82';
const DBF=path.join(process.env.DATA_DIR||__dirname,'data.json');
let D={roles:{},tos:{},gen:{},av:{},total:{},tok:{},reports:[],rem:{},wishes:[],his:[],used:[]};
try{D=Object.assign(D,JSON.parse(fs.readFileSync(DBF,'utf8')))}catch(e){}
const save=()=>{try{fs.writeFileSync(DBF,JSON.stringify(D))}catch(e){}};
const bank=require('./bank.js');
const WORDS="con mèo,con voi,cái nón lá,xe đạp,ngôi nhà,cây dừa,máy bay,quả chuối,cái ô,mặt trời,con cá,bánh chưng,cái quạt,con rồng,cầu vồng,bàn học,đồng hồ,điện thoại,hoa sen,thuyền buồm,con gà,cái giường,ngôi sao,trái tim,xe máy,con rùa,cây bút,quyển sách".split(',');
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/\s+/g,' ').trim();
const strip=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]/g,'');
const codeOf=i=>strip(NAMES[i].split(' ').pop())+BDAY[i].replace('/','');
const vn=()=>{const d=new Date(Date.now()+7*3600e3);return{key:('0'+d.getUTCDate()).slice(-2)+'/'+('0'+(d.getUTCMonth()+1)).slice(-2),y:d.getUTCFullYear()}};
const tk=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const ROLES={lt:'Lớp trưởng',lphp:'Lớp phó học tập',lppt:'Lớp phó lao động + Phong trào',pvn:'Phó văn nghệ',tq:'Thủ quỹ',tt:'Tổ trưởng'};
const MUC=['lt','lphp','lppt','pvn','tq','t1','t2','t3','t4'];
for(const i in D.roles)if(D.roles[i]==='cntt')delete D.roles[i];
if(!D.seeded){D.seeded=1;D.roles={26:'lt',38:'lphp',0:'tq',37:'tt',34:'tt',29:'lppt',17:'pvn',19:'tt',11:'tt'};D.tos={37:1,34:2,11:3,19:4};save()}
const server=http.createServer((q,r)=>{if(q.url==='/'||q.url.startsWith('/?')){r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(fs.readFileSync(path.join(__dirname,'index.html')))}else if(q.url==='/favicon.ico'){r.writeHead(204);r.end()}else{r.writeHead(404);r.end()}});
const wss=new WebSocketServer({server});
const stu=()=>[...wss.clients].filter(w=>w.readyState===1&&w.u!==undefined&&w.u!=='admin');
const to=(w,m)=>w.readyState===1&&w.send(JSON.stringify(m));
const bc=m=>wss.clients.forEach(w=>w.u!==undefined&&to(w,m));
const topOf=sc=>Object.entries(sc).map(([i,s])=>({n:NAMES[i],s,av:D.av[i]})).sort((a,b)=>b.s-a.s).slice(0,10);
const board=()=>Object.entries(D.total).map(([i,s])=>({n:NAMES[i],to:D.tos[i]||0,s,av:D.av[i]})).sort((a,b)=>b.s-a.s).slice(0,15);
let G=null;
function endGame(x){if(!G)return;clearTimeout(G.tm);clearInterval(G.iv);for(const i in G.sc)D.total[i]=(D.total[i]||0)+G.sc[i];save();bc(Object.assign({t:'end',g:G.type,top:topOf(G.sc)},x));G=null;bc({t:'board',b:board()})}
function parseQ(t){const a=String(t||'').split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(p=>p.length>=6&&[1,2,3,4].includes(+p[5])).map(p=>[p[0],p[1],p[2],p[3],p[4],+p[5]]);return a}
function pick(n){let all=bank.map((q,i)=>i),pool=all.filter(i=>!D.used.includes(i)).sort(()=>Math.random()-.5);
 if(pool.length<n){const t=pool;D.used=[];pool=t.concat(all.filter(i=>!t.includes(i)).sort(()=>Math.random()-.5)).slice(0,n)}else pool=pool.slice(0,n);
 D.used=D.used.concat(pool);save();return pool.map(i=>bank[i])}
const sendBank=()=>wss.clients.forEach(w=>w.u==='admin'&&to(w,{t:'bank',left:bank.length-D.used.length,total:bank.length}));
const online=()=>bc({t:'on',l:stu().map(w=>({n:NAMES[w.u],av:D.av[w.u]}))});
function quiz(qs,sec){G={type:'quiz',qs,sec,k:-1,sc:{}};nextQ()}
function nextQ(){G.k++;if(G.k>=G.qs.length)return endGame();const q=G.qs[G.k],ix=[1,2,3,4].sort(()=>Math.random()-.5);G.cc=ix.indexOf(q[5])+1;G.ans={};G.rv=false;G.t0=Date.now();bc({t:'q',k:G.k,n:G.qs.length,q:q[0],o:ix.map(k=>q[k]),sec:G.sec});G.tm=setTimeout(revealQ,G.sec*1000+300)}
function revealQ(){if(G.rv)return;G.rv=true;clearTimeout(G.tm);const gain={};for(const i in G.ans){const a=G.ans[i];if(a.c===G.cc){const p=Math.round(500+500*(1-a.ms/(G.sec*1000)));gain[i]=p;G.sc[i]=(G.sc[i]||0)+p}}bc({t:'qr',ans:G.cc,gain,top:topOf(G.sc)});G.tm=setTimeout(nextQ,4500)}
function tap(){G={type:'tap',sc:{},team:{},run:false};bc({t:'tap',ph:'count'});G.tm=setTimeout(()=>{G.run=true;bc({t:'tap',ph:'go',sec:15});G.iv=setInterval(()=>bc({t:'tapS',team:G.team}),400);G.tm=setTimeout(tapEnd,15000)},3000)}
function tapEnd(){G.run=false;clearInterval(G.iv);let win=0,mx=-1;for(const t in G.team)if(G.team[t]>mx){mx=G.team[t];win=t}for(const i in G.sc)if(D.tos[i]==win)G.sc[i]+=200;endGame({team:G.team,win})}
function draw(){const ids=stu().map(w=>w.u).sort(()=>Math.random()-.5).slice(0,8);if(ids.length<2)return bc({t:'note',m:'Cần ít nhất 2 bạn đang online'});G={type:'draw',sc:{},order:ids,r:-1};nextRound()}
function nextRound(){G.r++;if(G.r>=G.order.length)return endGame();G.d=G.order[G.r];G.w=WORDS[Math.random()*WORDS.length|0];G.got={};G.rv=false;G.t0=Date.now();wss.clients.forEach(x=>x.u!==undefined&&to(x,{t:'d',d:G.d,dn:NAMES[G.d],r:G.r+1,n:G.order.length,sec:60,len:G.w.length,word:x.u===G.d?G.w:null}));G.tm=setTimeout(roundEnd,60000)}
function roundEnd(){if(G.rv)return;G.rv=true;clearTimeout(G.tm);bc({t:'dr',word:G.w,top:topOf(G.sc)});G.tm=setTimeout(nextRound,4500)}

const holder=k=>{let f=null;for(const i in D.roles){const r=D.roles[i];if(r===k)f=+i;else if(r==='tt'&&/^t[1-4]$/.test(k)&&D.tos[i]==k[1])f=+i}return f};
const label=i=>{const r=D.roles[i],t=D.tos[i];return r==='tt'?'Tổ trưởng tổ '+t:r?ROLES[r]:(t?'Thành viên tổ '+t:'Học sinh')};
const whoName=u=>u==='admin'?'Giáo viên chủ nhiệm':NAMES[u];
function logH(u,a,d){D.his.push({ts:Date.now(),who:whoName(u),a:a,d:d});if(D.his.length>2000)D.his.splice(0,D.his.length-2000);save();wss.clients.forEach(w=>w.u==='admin'&&to(w,{t:'h1',h:D.his[D.his.length-1]}))}
const pushRoster=()=>bc({t:'roster',roles:D.roles,tos:D.tos,gen:D.gen,av:D.av});
const pushReports=()=>bc({t:'reports',list:D.reports,rem:D.rem});
const wishesFor=u=>{const k=vn();return D.wishes.filter(x=>(x.y===k.y&&BDAY[x.to]===k.key)||x.to===u)};
function auth(w,i,k){w.u=i;to(w,{t:'auth',i:i,n:i==='admin'?'':NAMES[i],adm:i==='admin',token:k});
 to(w,{t:'roster',roles:D.roles,tos:D.tos,gen:D.gen,av:D.av});to(w,{t:'reports',list:D.reports,rem:D.rem});to(w,{t:'wishes',l:wishesFor(i)});to(w,{t:'board',b:board()});
 if(i==='admin'){to(w,{t:'hist',l:D.his});sendBank()}
 if(G)to(w,{t:'busy',g:G.type});online()}
wss.on('connection',w=>{
 w.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch(e){return}
 if(w.u===undefined){
  if(m.t==='login'||m.t==='admin'){if((w.bad=(w.bad||0)+1)>10)return w.close()}
  if(m.t==='login'){const i=+m.i;if(!(i>=0&&i<NAMES.length)||strip(m.code)!==codeOf(i))return to(w,{t:'err',m:'Mã chưa đúng. Hãy hỏi giáo viên mã của bạn nhé.'});const k=tk();D.tok[k]=i;save();return auth(w,i,k)}
  if(m.t==='admin'){if(String(m.code||'').trim()!==ADMIN_CODE)return to(w,{t:'err',m:'Mã giáo viên chưa đúng.'});const k=tk();D.tok[k]='admin';save();return auth(w,'admin',k)}
  if(m.t==='resume'&&D.tok[m.token]!==undefined)return auth(w,D.tok[m.token],m.token);
  return to(w,{t:'relogin'})}
 const u=w.u,adm=u==='admin';
 if(m.t==='av'&&!adm){const n=+m.n;if(n>=0&&n<300){D.av[u]=n;save();pushRoster();online()}return}
 if(m.t==='to'){const i=+m.i;if(!(i>=0&&i<NAMES.length))return;const t=[1,2,3,4].includes(+m.to)?+m.to:0;
  const mine=(!adm&&D.roles[u]==='tt')?D.tos[u]:null;
  if(!(adm||i===u||(mine&&(t===+mine||(t===0&&D.tos[i]==mine)))))return;
  if(t)D.tos[i]=t;else delete D.tos[i];if(D.roles[i]==='tt')delete D.roles[i];
  logH(u,'Đổi tổ',NAMES[i]+' → '+(t?'tổ '+t:'chưa xếp tổ'));save();return pushRoster()}
 if(m.t==='role'&&adm){const i=+m.i,r=['lt','lphp','lppt','pvn','tq','tt',''].includes(m.role)?m.role:null;if(r===null||!(i>=0&&i<NAMES.length))return;
  if(r==='tt'&&!D.tos[i])return to(w,{t:'note',m:'Hãy xếp tổ cho bạn này trước khi chọn tổ trưởng'});
  if(r){for(const k in D.roles){if(k==i)continue;if(r!=='tt'&&D.roles[k]===r)delete D.roles[k];if(r==='tt'&&D.roles[k]==='tt'&&D.tos[k]==D.tos[i])delete D.roles[k]}D.roles[i]=r}else delete D.roles[i];
  logH(u,'Phân công',NAMES[i]+' → '+(r?(r==='tt'?'tổ trưởng tổ '+D.tos[i]:ROLES[r]):'học sinh thường'));save();return pushRoster()}
 if(m.t==='gen'&&adm){const i=+m.i;if(!(i>=0&&i<NAMES.length)||!['','m','f','x'].includes(m.g))return;if(m.g)D.gen[i]=m.g;else delete D.gen[i];logH(u,'Đổi giới tính',NAMES[i]);save();return pushRoster()}
 if(m.t==='report'){const k=m.mk;if(!MUC.includes(k))return;const h=holder(k);
  if(h===null)return to(w,{t:'note',m:'Mục này chưa có người giữ'});
  if(!adm&&h!==u)return to(w,{t:'note',m:'Chỉ người giữ mục này mới viết được'});
  const f=['f1','f2','f3','f4'].map(x=>String(m[x]||'').slice(0,2000)),tuan=+m.tuan;
  if(!(tuan>=1&&tuan<=60)||!f.join('').trim())return to(w,{t:'note',m:'Hãy nhập tuần và nội dung báo cáo'});
  const id='r'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  D.reports.push({id:id,tuan:tuan,ngay:String(m.ngay||'').slice(0,10),mk:k,dv:label(h),ten:NAMES[h],ai:h,f1:f[0],f2:f[1],f3:f[2],f4:f[3],ts:Date.now()});
  if(adm&&m.nx)D.rem[id]=String(m.nx).slice(0,1000);
  logH(u,'Thêm báo cáo','Tuần '+tuan+' — '+NAMES[h]+' ('+label(h)+')');save();to(w,{t:'note',m:'Đã lưu báo cáo ✅'});return pushReports()}
 if(m.t==='delrep'&&adm){const r=D.reports.find(x=>x.id===m.id);if(!r)return;D.reports=D.reports.filter(x=>x.id!==m.id);delete D.rem[m.id];logH(u,'Xóa báo cáo','Tuần '+r.tuan+' — '+r.ten);save();return pushReports()}
 if(m.t==='remark'&&adm){const r=D.reports.find(x=>x.id===m.id);if(!r)return;const t=String(m.text||'').trim().slice(0,1000);if(t)D.rem[m.id]=t;else delete D.rem[m.id];logH(u,'Nhận xét GVCN','Tuần '+r.tuan+' — '+r.ten);save();return pushReports()}
 if(m.t==='flower'&&!adm){const k=vn(),t=+m.to;
  if(!(t>=0&&t<NAMES.length)||BDAY[t]!==k.key)return to(w,{t:'note',m:'Chỉ gửi hoa đúng ngày sinh nhật của bạn ấy nhé 🌸'});
  if(D.wishes.filter(x=>x.to===t&&x.from===u&&x.y===k.y).length>=30)return to(w,{t:'note',m:'Bạn gửi nhiều rồi, để dành cho bạn khác nhé 💐'});
  const x={id:'w'+Date.now().toString(36)+Math.random().toString(36).slice(2,4),to:t,from:u,e:String(m.e||'🌸').slice(0,8),text:String(m.text||'').slice(0,120),ts:Date.now(),y:k.y};
  D.wishes.push(x);save();return bc({t:'wish',w:x})}
 if(u==='admin'){
  if(m.t==='stop')return endGame();
  if(m.t==='resetbank'){D.used=[];save();return sendBank()}
  if(m.t==='start'&&!G){if(m.g==='quiz'){let qs=parseQ(m.qs);if(!qs.length)qs=pick(Math.min(30,Math.max(3,+m.n||10)));quiz(qs,Math.min(60,Math.max(5,+m.sec||15)));sendBank()}else if(m.g==='tap')tap();else if(m.g==='draw')draw()}
  return}
 if(!G)return;
 if(G.type==='quiz'&&m.t==='ans'&&!G.rv&&!G.ans[u]&&[1,2,3,4].includes(+m.c)){const ms=Date.now()-G.t0;if(ms<=G.sec*1000+300){G.ans[u]={c:+m.c,ms:Math.min(ms,G.sec*1000)};if(Object.keys(G.ans).length>=stu().length)revealQ()}}
 else if(G.type==='tap'&&m.t==='tap'&&G.run){const s=Date.now()/1000|0;if(w.ts!==s){w.ts=s;w.tn=0}if(++w.tn>14)return;G.sc[u]=(G.sc[u]||0)+1;const t=D.tos[u]||0;G.team[t]=(G.team[t]||0)+1}
 else if(G.type==='draw'){
  if(u===G.d&&(m.t==='stroke'||m.t==='clear'))return stu().forEach(x=>x!==w&&to(x,m));
  if(m.t==='guess'&&u!==G.d&&!G.got[u]&&!G.rv){const g=String(m.x||'').slice(0,40);
   if(norm(g)===norm(G.w)){const p=Math.max(100,Math.round(500*(1-(Date.now()-G.t0)/60000)));G.got[u]=p;G.sc[u]=(G.sc[u]||0)+p;G.sc[G.d]=(G.sc[G.d]||0)+80;bc({t:'g',n:NAMES[u],ok:1});if(Object.keys(G.got).length>=stu().length-1)roundEnd()}
   else bc({t:'g',n:NAMES[u],x:g})}}
 });
 w.on('close',()=>{online();if(G&&G.type==='draw'&&w.u===G.d&&!G.rv)roundEnd()})});
server.listen(process.env.PORT||3000,()=>console.log('Chạy tại http://localhost:'+(process.env.PORT||3000)+' | đăng nhập giáo viên bằng mã ADMIN_CODE'));
