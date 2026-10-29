// ===== Dán toàn bộ đoạn này vào Google Apps Script của file Google Sheet =====
// Cách làm: mở Google Sheet > Tiện ích mở rộng > Apps Script > xóa code cũ > dán code này > Lưu.
// Sau đó: Triển khai > Tùy chọn triển khai mới > Loại: Ứng dụng web
//         Thực thi với tư cách: Tôi | Người có quyền truy cập: Bất kỳ ai > Triển khai > Cho phép quyền.
// Copy "URL ứng dụng web" dán vào biến SHEETS_URL trên Render.

const KEY = 'DOI-MA-NAY';   // Tự đặt một mã bí mật, và đặt GIỐNG HỆT vào biến SHEETS_KEY trên Render

const CFG = {
  report: { name: 'Báo cáo', head: ['ID', 'Tuần', 'Ngày', 'Mục', 'Người báo cáo', 'Nội dung báo cáo', 'Nhận xét GVCN', 'Thời gian gửi'] },
  box:    { name: 'Góp ý',   head: ['ID', 'Thời gian', 'Người gửi', 'Nội dung'] },
  his:    { name: 'Lịch sử', head: ['ID', 'Thời gian', 'Người thực hiện', 'Hoạt động', 'Nội dung'] }
};

function sheet_(k) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), c = CFG[k];
  let s = ss.getSheetByName(c.name);
  if (!s) s = ss.insertSheet(c.name);
  if (s.getLastRow() === 0) {
    s.appendRow(c.head);
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, c.head.length).setFontWeight('bold').setBackground('#ffe0ee');
  }
  return s;
}

// Chống chèn công thức từ nội dung học sinh gõ
function safe_(v) {
  v = (v === null || v === undefined) ? '' : String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function arr_(k, r) {
  if (k === 'report') return [r.id, r.tuan, safe_(r.ngay), safe_(r.muc), safe_(r.ten), safe_(r.nd), safe_(r.nx), r.ts];
  if (k === 'his') return [r.id, r.ts, safe_(r.ten), safe_(r.hd), safe_(r.nd)];
  return [r.id, r.ts, safe_(r.ten), safe_(r.nd)];
}

function findRow_(s, id) {
  const last = s.getLastRow();
  if (last < 2) return 0;
  const ids = s.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

function upsert_(k, r) {
  const s = sheet_(k), a = arr_(k, r), at = findRow_(s, r.id);
  if (at) s.getRange(at, 1, 1, a.length).setValues([a]);
  else s.appendRow(a);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.key !== KEY) return out_({ ok: false, err: 'sai ma' });
    if (d.kind === 'report') upsert_('report', d.row);
    else if (d.kind === 'box') upsert_('box', d.row);
    else if (d.kind === 'his') upsert_('his', d.row);
    else if (d.kind === 'state') saveState_(d.data);
    else if (d.kind === 'delreport') { const s = sheet_('report'), at = findRow_(s, d.id); if (at) s.deleteRow(at); }
    else if (d.kind === 'bulk') {
      (d.reports || []).forEach(function (r) { upsert_('report', r); });
      (d.box || []).forEach(function (r) { upsert_('box', r); });
      (d.his || []).forEach(function (r) { upsert_('his', r); });
    }
    return out_({ ok: true });
  } finally { lock.releaseLock(); }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// ===== Sao lưu / khôi phục toàn bộ dữ liệu web (tổ, phân công, điểm, đăng nhập...) =====
// Lưu vào trang tính 'Dữ liệu', mỗi ô một đoạn (ô Google Sheet tối đa 50.000 ký tự). ĐỪNG xóa trang tính này.
function saveState_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName('Dữ liệu');
  if (!s) s = ss.insertSheet('Dữ liệu');
  data = String(data || '');
  const parts = [];
  for (let i = 0; i < data.length; i += 40000) parts.push([data.substr(i, 40000)]);
  if (!parts.length) return;
  s.clearContents();
  s.getRange(1, 1, parts.length, 1).setNumberFormat('@').setValues(parts);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.key !== KEY) return out_({ ok: false, err: 'sai ma' });
  if (p.action === 'state') {
    const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dữ liệu');
    if (!s || s.getLastRow() === 0) return out_({ ok: true, data: '' });
    const data = s.getRange(1, 1, s.getLastRow(), 1).getValues().map(function (r) { return r[0]; }).join('');
    return out_({ ok: true, data: data });
  }
  return out_({ ok: true });
}
