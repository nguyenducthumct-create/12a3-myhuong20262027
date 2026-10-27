const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const NAMES=["Hồ Thị Lan Anh", "Lương Ngọc Anh", "Võ Đặng Quang Anh", "Huỳnh Văn Cường", "Huỳnh Lê Duy", "Đỗ Lý Thành Đạt", "Phạm Anh Hiều", "Phạm Trần Phúc Hưng", "Nguyễn Thanh Hương", "Triệu Hồ Ngọc Hương", "Phan Nguyễn Kha", "Huỳnh Trường Khánh", "Lâm Minh Khiêm", "Nguyễn Quốc Kiệt", "Nguyễn Thị Nhã Kỳ", "Nguyễn Thị Cẩm Loan", "Trần Ngọc Ly", "Lâm Thị Trúc Mai", "Thái Quang Minh", "Trầm Kim Ngân", "Trương Thị Kim Ngân", "Lưu Tấn Nghĩa", "Phan Ánh Ngọc", "Phạm Thanh Nhã", "Hồ Thanh Nhàn", "Phạm Văn Nhanh", "Phạm Huỳnh Nguyệt Như", "Trần Thị Huỳnh Như", "Võ Huỳnh Như", "Tô Bá Quí", "Trịnh Kiến Quốc", "Nguyễn Thị Thúy Quyên", "Lê Thái Thành", "Lê Thị Thu Thảo", "Mai Quốc Thiên", "Trần Hoài Thương", "Bùi Hoàng Tiến", "Phan Thị Huyền Trân", "Trần Anh Trọng", "Bùi Quan Tường", "Âu Tấn Vũ", "Phan Thị Thúy Vy"];
const BDAY=["07/09", "01/05", "11/02", "22/02", "31/10", "15/02", "29/08", "30/07", "14/02", "09/07", "08/09", "15/02", "12/11", "23/08", "24/10", "15/05", "31/05", "23/10", "26/02", "05/12", "29/10", "03/01", "19/04", "15/02", "05/07", "09/02", "09/02", "14/02", "05/11", "11/02", "12/10", "14/11", "26/07", "14/06", "25/12", "10/10", "13/10", "27/02", "05/10", "29/09", "07/05", "11/03"];
// Mã đăng nhập của giáo viên (admin): nên đặt bằng biến môi trường ADMIN_CODE
const ADMIN_CODE=process.env.ADMIN_CODE||'ndthummh82';
const DBF=path.join(process.env.DATA_DIR||__dirname,'data.json');
let D={roles:{},tos:{},gen:{},av:{},total:{},tok:{},reports:[],rem:{},wishes:[],his:[],used:[],box:[],extra:[]};
try{D=Object.assign(D,JSON.parse(fs.readFileSync(DBF,'utf8')))}catch(e){}
const save=()=>{try{fs.writeFileSync(DBF,JSON.stringify(D))}catch(e){}};
const bank=require('./bank.js');
D.used=(D.used||[]).map(x=>typeof x==='number'?(bank[x]&&bank[x][0]):x).filter(x=>typeof x==='string');D.extra=D.extra||[];D.box=D.box||[];
const strip=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]/g,'');
const codeOf=i=>strip(NAMES[i].split(' ').pop())+BDAY[i].replace('/','');
const vn=()=>{const d=new Date(Date.now()+7*3600e3);return{key:('0'+d.getUTCDate()).slice(-2)+'/'+('0'+(d.getUTCMonth()+1)).slice(-2),y:d.getUTCFullYear()}};
const tk=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const ROLES={lt:'Lớp trưởng',lphp:'Lớp phó học tập',lppt:'Lớp phó lao động',pvn:'Phó văn nghệ - Phong trào',tq:'Thủ quỹ',tt:'Tổ trưởng'};
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
function endGame(x){if(!G)return;clearTimeout(G.tm);clearInterval(G.iv);for(const i in G.sc)D.total[i]=(D.total[i]||0)+G.sc[i];save();bc(Object.assign({t:'end',g:G.type,win3:topOf(G.sc).filter(r=>r.s>0).slice(0,3)},x));wss.clients.forEach(c=>{c.rd=false});online();G=null;bc({t:'board',b:board()})}
function parseQ(t){const a=String(t||'').split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(p=>p.length>=6&&[1,2,3,4].includes(+p[5])).map(p=>[p[0],p[1],p[2],p[3],p[4],+p[5]]);return a}
const allBank=()=>bank.concat(D.extra);
// Câu đã hỏi (D.used) bị loại khỏi kho, không bao giờ hỏi lại trừ khi giáo viên bấm 'Làm mới kho'
function pick(n){return allBank().filter(q=>!D.used.includes(q[0])).sort(()=>Math.random()-.5).slice(0,n)}
const sendBank=()=>{const a=allBank(),left=a.filter(q=>!D.used.includes(q[0])).length;wss.clients.forEach(w=>w.u==='admin'&&to(w,{t:'bank',left:left,total:a.length}))};
const online=()=>bc({t:'on',l:stu().map(w=>({i:w.u,n:NAMES[w.u],av:D.av[w.u],r:!!w.rd}))});
function quiz(qs,sec,fb){G={type:'quiz',qs,sec,fb,k:-1,sc:{}};nextQ()}
function nextQ(){G.k++;if(G.k>=G.qs.length)return endGame();const q=G.qs[G.k];if(G.fb&&!D.used.includes(q[0])){D.used.push(q[0]);save();sendBank()}const ix=[1,2,3,4].sort(()=>Math.random()-.5);G.cc=ix.indexOf(q[5])+1;G.ans={};G.rv=false;G.t0=Date.now();bc({t:'q',k:G.k,n:G.qs.length,q:q[0],o:ix.map(k=>q[k]),sec:G.sec});G.tm=setTimeout(revealQ,G.sec*1000+300)}
function revealQ(){if(G.rv)return;G.rv=true;clearTimeout(G.tm);const gain={};for(const i in G.ans){const a=G.ans[i];if(a.c===G.cc){const p=Math.round(500+500*(1-a.ms/(G.sec*1000)));gain[i]=p;G.sc[i]=(G.sc[i]||0)+p}}bc({t:'qr',ans:G.cc,gain,top:topOf(G.sc)});G.tm=setTimeout(nextQ,4500)}
function tap(){G={type:'tap',sc:{},team:{},run:false};bc({t:'tap',ph:'count'});G.tm=setTimeout(()=>{G.run=true;bc({t:'tap',ph:'go',sec:15});G.iv=setInterval(()=>bc({t:'tapS',team:G.team}),400);G.tm=setTimeout(tapEnd,15000)},3000)}
function tapEnd(){G.run=false;clearInterval(G.iv);let win=0,mx=-1;for(const t in G.team)if(G.team[t]>mx){mx=G.team[t];win=t}for(const i in G.sc)if(D.tos[i]==win)G.sc[i]+=200;endGame({team:G.team,win})}

const holder=k=>{let f=null;for(const i in D.roles){const r=D.roles[i];if(r===k)f=+i;else if(r==='tt'&&/^t[1-4]$/.test(k)&&D.tos[i]==k[1])f=+i}return f};
const label=i=>{const r=D.roles[i],t=D.tos[i];return r==='tt'?'Tổ trưởng tổ '+t:r?ROLES[r]:(t?'Thành viên tổ '+t:'Học sinh')};
const whoName=u=>u==='admin'?'Giáo viên chủ nhiệm':NAMES[u];
function logH(u,a,d){D.his.push({ts:Date.now(),who:whoName(u),a:a,d:d});if(D.his.length>2000)D.his.splice(0,D.his.length-2000);save();wss.clients.forEach(w=>w.u==='admin'&&to(w,{t:'h1',h:D.his[D.his.length-1]}))}
const pushRoster=()=>bc({t:'roster',roles:D.roles,tos:D.tos,gen:D.gen,av:D.av});
const pushReports=()=>bc({t:'reports',list:D.reports,rem:D.rem});
const boxView=x=>({id:x.id,ts:x.ts,anon:x.from===null,name:x.from===null?null:NAMES[x.from],text:x.text,rd:!!x.rd});
const sgl={};
// ---- Đồng bộ Google Sheet (tùy chọn): đặt SHEETS_URL và SHEETS_KEY trên Render ----
const SHEETS_URL=process.env.SHEETS_URL||'',SHEETS_KEY=process.env.SHEETS_KEY||'';
const vnTime=t=>new Date(t).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
const LEG=['Nề nếp, chuyên cần','Học tập','Phong trào','Ý kiến, đề xuất, ghi chú'];
const FORMS={tq:['Các khoản thu','Các khoản chi','Số dư quỹ hiện tại','Ghi chú'],lphp:['Tình hình học tập'],lppt:['Tình hình trực nhật'],pvn:['Tình hình tham gia phong trào','Các hoạt động sắp tới']};
const repRow=r=>{const L=(r.v===2&&FORMS[r.mk])||LEG;return{id:r.id,tuan:r.tuan,ngay:r.ngay||'',muc:r.dv,ten:r.ten,nd:[r.f1,r.f2,r.f3,r.f4].map((v,i)=>L[i]&&v?L[i]+': '+v:'').filter(Boolean).join('\n'),nx:D.rem[r.id]||'',ts:vnTime(r.ts)}};
const boxRow=x=>({id:x.id,ts:vnTime(x.ts),ten:x.from===null?'Ẩn danh':NAMES[x.from],nd:x.text});
async function pushSheet(o){if(!SHEETS_URL||typeof fetch!=='function')return false;
 try{const r=await fetch(SHEETS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({key:SHEETS_KEY},o)),redirect:'follow',signal:AbortSignal.timeout(30000)});
  return /"ok"\s*:\s*true/.test(await r.text())}catch(e){return false}}
const wishesFor=u=>{const k=vn();return D.wishes.filter(x=>(x.y===k.y&&BDAY[x.to]===k.key)||x.to===u)};
function auth(w,i,k){w.u=i;w.tk=k;to(w,{t:'auth',i:i,n:i==='admin'?'':NAMES[i],adm:i==='admin',token:k});
 to(w,{t:'roster',roles:D.roles,tos:D.tos,gen:D.gen,av:D.av});to(w,{t:'reports',list:D.reports,rem:D.rem});to(w,{t:'wishes',l:wishesFor(i)});to(w,{t:'board',b:board()});
 if(i==='admin'){to(w,{t:'cfg',sheets:!!SHEETS_URL});to(w,{t:'hist',l:D.his});to(w,{t:'box',l:D.box.map(boxView)});sendBank()}
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
  D.reports.push({id:id,tuan:tuan,ngay:String(m.ngay||'').slice(0,10),mk:k,dv:label(h),ten:NAMES[h],ai:h,v:2,f1:f[0],f2:f[1],f3:f[2],f4:f[3],ts:Date.now()});
  if(adm&&m.nx)D.rem[id]=String(m.nx).slice(0,1000);
  pushSheet({kind:'report',row:repRow(D.reports[D.reports.length-1])});
  logH(u,'Thêm báo cáo','Tuần '+tuan+' — '+NAMES[h]+' ('+label(h)+')');save();to(w,{t:'note',m:'Đã lưu báo cáo ✅'});return pushReports()}
 if(m.t==='delrep'&&adm){const r=D.reports.find(x=>x.id===m.id);if(!r)return;D.reports=D.reports.filter(x=>x.id!==m.id);delete D.rem[m.id];logH(u,'Xóa báo cáo','Tuần '+r.tuan+' — '+r.ten);save();pushSheet({kind:'delreport',id:r.id});return pushReports()}
 if(m.t==='remark'&&adm){const r=D.reports.find(x=>x.id===m.id);if(!r)return;const t=String(m.text||'').trim().slice(0,1000);if(t)D.rem[m.id]=t;else delete D.rem[m.id];logH(u,'Nhận xét GVCN','Tuần '+r.tuan+' — '+r.ten);save();pushSheet({kind:'report',row:repRow(r)});return pushReports()}
 if(m.t==='flower'&&!adm){const k=vn(),t=+m.to;
  if(!(t>=0&&t<NAMES.length)||BDAY[t]!==k.key)return to(w,{t:'note',m:'Chỉ gửi hoa đúng ngày sinh nhật của bạn ấy nhé 🌸'});
  if(D.wishes.filter(x=>x.to===t&&x.from===u&&x.y===k.y).length>=30)return to(w,{t:'note',m:'Bạn gửi nhiều rồi, để dành cho bạn khác nhé 💐'});
  const x={id:'w'+Date.now().toString(36)+Math.random().toString(36).slice(2,4),to:t,from:u,e:String(m.e||'🌸').slice(0,8),text:String(m.text||'').slice(0,120),ts:Date.now(),y:k.y};
  D.wishes.push(x);save();return bc({t:'wish',w:x})}
 if(m.t==='ready'&&!adm){w.rd=!!m.v;return online()}
 if(m.t==='suggest'&&!adm){const t=String(m.text||'').trim().slice(0,1000);
  if(t.length<3)return to(w,{t:'note',m:'Hãy viết nội dung góp ý nhé'});
  const now=Date.now(),a=(sgl[u]=(sgl[u]||[]).filter(x=>now-x<3600e3));
  if(a.length>=5)return to(w,{t:'note',m:'Bạn đã gửi nhiều góp ý trong 1 giờ qua, hãy thử lại sau nhé'});
  a.push(now);
  const x={id:'b'+now.toString(36)+Math.random().toString(36).slice(2,5),ts:now,from:m.anon?null:u,text:t,rd:false};
  D.box.push(x);if(D.box.length>1000)D.box.splice(0,D.box.length-1000);save();pushSheet({kind:'box',row:boxRow(x)});
  wss.clients.forEach(a2=>a2.u==='admin'&&to(a2,{t:'box1',x:boxView(x)}));
  return to(w,{t:'boxok'})}
 if(u==='admin'){
  if(m.t==='sheetsync'){if(!SHEETS_URL)return to(w,{t:'note',m:'Chưa cài SHEETS_URL trên server (xem README)'});
   to(w,{t:'note',m:'Đang gửi lên Google Sheet…'});
   pushSheet({kind:'bulk',reports:D.reports.map(repRow),box:D.box.map(boxRow)}).then(ok=>to(w,{t:'note',m:ok?'Đã đồng bộ '+D.reports.length+' báo cáo và '+D.box.length+' góp ý lên Google Sheet ✅':'Gửi lên Google Sheet chưa được, hãy kiểm tra lại link và mã'}));return}
  if(m.t==='backup'){const c=Object.assign({},D);delete c.tok;return to(w,{t:'backup',d:JSON.stringify(c)})}
  if(m.t==='restore'){let x;try{x=JSON.parse(m.data)}catch(e){return to(w,{t:'note',m:'File không hợp lệ'})}
   if(!x||typeof x!=='object'||!Array.isArray(x.reports)||!x.roles||typeof x.roles!=='object')return to(w,{t:'note',m:'File này không phải bản sao lưu của web lớp'});
   const tok=D.tok;D=Object.assign({roles:{},tos:{},gen:{},av:{},total:{},tok:{},reports:[],rem:{},wishes:[],his:[],used:[],box:[],extra:[],seeded:1},x,{tok});
   D.used=D.used.filter(y=>typeof y==='string');D.extra=D.extra||[];D.box=D.box||[];
   logH(u,'Khôi phục dữ liệu','Từ file sao lưu');save();
   wss.clients.forEach(c=>{if(c.u!==undefined&&c.tk)auth(c,c.u,c.tk)});
   return to(w,{t:'note',m:'Đã khôi phục dữ liệu ✅'})}
  if(m.t==='boxread'){const x=D.box.find(y=>y.id===m.id);if(x){x.rd=true;save();wss.clients.forEach(a2=>a2.u==='admin'&&to(a2,{t:'box',l:D.box.map(boxView)}))}return}
  if(m.t==='boxdel'){D.box=D.box.filter(y=>y.id!==m.id);save();wss.clients.forEach(a2=>a2.u==='admin'&&to(a2,{t:'box',l:D.box.map(boxView)}));return}
  if(m.t==='addbank'){const a=parseQ(m.qs);if(!a.length)return to(w,{t:'note',m:'Chưa có câu nào đúng định dạng: Câu hỏi|A|B|C|D|số đáp án đúng'});
   const have=new Set(allBank().map(q=>q[0]));let n=0;a.forEach(q=>{if(!have.has(q[0])){have.add(q[0]);D.extra.push(q);n++}});save();sendBank();
   return to(w,{t:'note',m:'Đã thêm '+n+' câu mới vào kho'+(a.length>n?' ('+(a.length-n)+' câu trùng, bỏ qua)':'')})}
  if(m.t==='stop')return endGame();
  if(m.t==='resetbank'){D.used=[];save();return sendBank()}
  if(m.t==='start'&&!G){if(m.g==='quiz'){let qs=parseQ(m.qs),fb=false;
    if(!qs.length){const n=Math.min(30,Math.max(3,+m.n||10));qs=pick(n);fb=true;
     if(!qs.length)return to(w,{t:'note',m:'Kho đã hết câu chưa hỏi. Hãy thêm câu mới hoặc bấm "Làm mới kho"'});
     if(qs.length<n)to(w,{t:'note',m:'Kho chỉ còn '+qs.length+' câu chưa hỏi, sẽ chơi hết số câu này'})}
    quiz(qs,Math.min(60,Math.max(5,+m.sec||15)),fb);sendBank()}else if(m.g==='tap')tap()}
  return}
 if(!G)return;
 if(G.type==='quiz'&&m.t==='ans'&&!G.rv&&!G.ans[u]&&[1,2,3,4].includes(+m.c)){const ms=Date.now()-G.t0;if(ms<=G.sec*1000+300){G.ans[u]={c:+m.c,ms:Math.min(ms,G.sec*1000)};if(Object.keys(G.ans).length>=stu().length)revealQ()}}
 else if(G.type==='tap'&&m.t==='tap'&&G.run){const s=Date.now()/1000|0;if(w.ts!==s){w.ts=s;w.tn=0}if(++w.tn>14)return;G.sc[u]=(G.sc[u]||0)+1;const t=D.tos[u]||0;G.team[t]=(G.team[t]||0)+1}
 });
 w.on('close',()=>{online()})});
server.listen(process.env.PORT||3000,()=>console.log('Chạy tại http://localhost:'+(process.env.PORT||3000)+' | đăng nhập giáo viên bằng mã ADMIN_CODE'));
