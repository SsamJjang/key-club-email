(function () {
  'use strict';

  var B = KC.blocks, TEMPLATES = KC.templates;
  var STORE = 'kc-email-editor-v1';
  var $ = function (id) { return document.getElementById(id); };
  var doc = $('doc'), subject = $('subject'), desk = $('desk');

  // ---------------------------------------------------------------- state
  var state = load() || { current: 'announcement', docs: {} };
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)); } catch (e) { return null; }
  }
  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    $('saved').textContent = 'Saving…';
    saveTimer = setTimeout(function () {
      state.docs[state.current] = { html: doc.innerHTML, subject: subject.value };
      try {
        localStorage.setItem(STORE, JSON.stringify(state));
        $('saved').textContent = 'All changes saved';
      } catch (e) {
        $('saved').textContent = 'Not saved (too many big images)';
      }
    }, 400);
  }

  function openTemplate(key, fresh) {
    state.current = key;
    var saved = !fresh && state.docs[key];
    doc.innerHTML = saved ? saved.html : TEMPLATES[key].build();
    subject.value = saved ? saved.subject : TEMPLATES[key].subject;
    $('template').value = key;
    normalize();
    history.reset();
    deselectImage();
    hideBlockBar();
    save();
  }

  // ---------------------------------------------------------------- undo
  var history = {
    stack: [], i: -1, timer: null,
    reset: function () { this.stack = [doc.innerHTML]; this.i = 0; },
    soon: function () {
      var self = this; clearTimeout(this.timer);
      this.timer = setTimeout(function () { self.commit(); }, 350);
    },
    commit: function () {
      clearTimeout(this.timer);
      var html = doc.innerHTML;
      if (html === this.stack[this.i]) return;
      this.stack = this.stack.slice(0, this.i + 1);
      this.stack.push(html);
      if (this.stack.length > 200) this.stack.shift();
      this.i = this.stack.length - 1;
    },
    go: function (d) {
      this.commit();
      var j = this.i + d;
      if (j < 0 || j >= this.stack.length) return;
      this.i = j;
      doc.innerHTML = this.stack[j];
      deselectImage(); hideBlockBar(); save();
    },
  };

  // ---------------------------------------------------------------- helpers
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function rows() { return doc.querySelector('[data-card] > tbody'); }
  function changed() { normalize(); history.commit(); save(); }

  // Renumber list badges and even out tiles after anything structural.
  function normalize() {
    doc.querySelectorAll('[data-list]').forEach(function (list) {
      var n = 0;
      list.querySelectorAll('[data-badge]').forEach(function (b) {
        n++; b.textContent = n < 10 ? '0' + n : String(n);
      });
    });
    doc.querySelectorAll('[data-tiles] tr').forEach(function (tr) {
      var tiles = Array.prototype.filter.call(tr.children, function (c) { return c.matches('[data-block]'); });
      var w = (100 / tiles.length).toFixed(2) + '%';
      tiles.forEach(function (td, i) {
        td.setAttribute('width', w);
        td.style.background = i % 2 ? KC.colors.NAVY2 : KC.colors.NAVY;
        td.style.borderRight = i === tiles.length - 1 ? '' : '2px solid #ffffff';
      });
    });
  }

  // ---------------------------------------------------------------- selection
  var savedRange = null;
  document.addEventListener('selectionchange', function () {
    var sel = window.getSelection();
    if (sel.rangeCount && doc.contains(sel.anchorNode)) {
      savedRange = sel.getRangeAt(0).cloneRange();
      refreshToolbar();
    }
  });
  function restoreRange() {
    if (!savedRange) return false;
    doc.focus({ preventScroll: true });
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(savedRange);
    return true;
  }
  function selectionEl() {
    if (!savedRange) return null;
    var n = savedRange.startContainer;
    return n.nodeType === 1 ? n : n.parentElement;
  }

  // ---------------------------------------------------------------- toolbar
  var toolbar = $('toolbar');
  // Keep the text selection when clicking toolbar buttons.
  toolbar.addEventListener('mousedown', function (e) {
    if (e.target.closest('button')) e.preventDefault();
  });
  document.querySelectorAll('.menu').forEach(function (m) {
    m.addEventListener('mousedown', function (e) { e.preventDefault(); });
  });

  function exec(cmd, val) {
    restoreRange();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(cmd, false, val == null ? null : val);
    changed();
    refreshToolbar();
  }

  toolbar.querySelectorAll('[data-cmd]').forEach(function (b) {
    b.addEventListener('click', function () {
      var c = b.dataset.cmd;
      if (c === 'undo') return history.go(-1);
      if (c === 'redo') return history.go(1);
      exec(c);
    });
  });

  function refreshToolbar() {
    ['bold', 'italic', 'underline', 'strikeThrough', 'justifyLeft', 'justifyCenter', 'justifyRight',
      'insertUnorderedList', 'insertOrderedList'].forEach(function (c) {
      var b = toolbar.querySelector('[data-cmd="' + c + '"]');
      var on = false;
      try { on = document.queryCommandState(c); } catch (e) {}
      if (b) b.classList.toggle('on', on);
    });
    var el = selectionEl();
    if (el && document.activeElement !== $('fontSize')) {
      $('fontSize').value = Math.round(parseFloat(getComputedStyle(el).fontSize));
    }
  }

  // Font size in px: let the browser wrap the selection, then swap its <font> for a span.
  function setFontSize(px) {
    px = Math.max(8, Math.min(96, Math.round(px)));
    if (!restoreRange()) return;
    if (window.getSelection().isCollapsed) { toast('Select some text first'); return; }
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, '7');
    doc.querySelectorAll('font[size="7"]').forEach(function (f) {
      var s = document.createElement('span');
      s.style.fontSize = px + 'px';
      s.style.lineHeight = '1.3';
      while (f.firstChild) s.appendChild(f.firstChild);
      s.querySelectorAll('[style]').forEach(function (c) { c.style.fontSize = ''; });
      f.parentNode.replaceChild(s, f);
    });
    $('fontSize').value = px;
    changed();
  }
  toolbar.querySelectorAll('[data-size]').forEach(function (b) {
    b.addEventListener('click', function () {
      var cur = parseFloat($('fontSize').value) || 16;
      setFontSize(cur + (b.dataset.size > 0 ? 2 : -2));
    });
  });
  $('fontSize').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); setFontSize(parseFloat(this.value) || 16); }
  });
  $('fontSize').addEventListener('change', function () { setFontSize(parseFloat(this.value) || 16); });

  $('foreColor').addEventListener('input', function () {
    $('foreSwatch').style.background = this.value; exec('foreColor', this.value);
  });
  $('backColor').addEventListener('input', function () {
    $('backSwatch').style.background = this.value; exec('hiliteColor', this.value);
  });

  // Key Club palette
  var PALETTE = [['Navy', '#063b70'], ['Blue', '#0a4a87'], ['Gold', '#f4c400'], ['Ink', '#102b45'],
    ['Body', '#445c70'], ['Grey', '#71869a'], ['Red', '#d6453a'], ['White', '#ffffff']];
  var pal = $('palette');
  pal.innerHTML = '<div class="lbl">Text color</div>' +
    PALETTE.map(function (c) {
      return '<button class="chip" data-fore="' + c[1] + '" title="' + c[0] + '" style="background:' + c[1] + '"></button>';
    }).join('') +
    '<div class="lbl">Highlight</div>' +
    [['Yellow', '#fff3a0'], ['Gold', '#f4c400'], ['Light blue', '#dbe9f7'], ['Pink', '#ffd9d4']].map(function (c) {
      return '<button class="chip" data-back="' + c[1] + '" title="' + c[0] + '" style="background:' + c[1] + '"></button>';
    }).join('') +
    '<button class="chip" data-back="transparent" title="No highlight" style="background:linear-gradient(135deg,#fff 45%,#d6453a 45% 55%,#fff 55%)"></button>';
  pal.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.fore) exec('foreColor', b.dataset.fore);
    if (b.dataset.back) exec('hiliteColor', b.dataset.back);
    pal.hidden = true;
  });

  // Menus
  function menu(btnId, menuId) {
    $(btnId).addEventListener('click', function (e) {
      e.stopPropagation();
      var m = $(menuId), was = m.hidden;
      document.querySelectorAll('.menu').forEach(function (x) { x.hidden = true; });
      m.hidden = !was;
    });
  }
  menu('paletteBtn', 'palette'); menu('insertBtn', 'insertMenu'); menu('exportBtn', 'exportMenu');
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.menu-wrap')) document.querySelectorAll('.menu').forEach(function (x) { x.hidden = true; });
  });

  // Links
  function editLink() {
    var el = selectionEl();
    var a = el && el.closest('a');
    var url = prompt(a ? 'Edit link (empty to remove):' : 'Link to:', a ? a.getAttribute('href') : 'https://');
    if (url === null) return;
    url = url.trim();
    if (a) {
      if (!url) { var p = a.parentNode; while (a.firstChild) p.insertBefore(a.firstChild, a); p.removeChild(a); }
      else a.setAttribute('href', url);
      changed(); return;
    }
    if (!url) return;
    restoreRange();
    if (window.getSelection().isCollapsed) {
      document.execCommand('insertHTML', false, '<a href="' + url.replace(/"/g, '&quot;') + '">' +
        url.replace(/</g, '&lt;') + '</a>');
    } else {
      document.execCommand('createLink', false, url);
    }
    changed();
  }
  $('linkBtn').addEventListener('click', editLink);

  // ---------------------------------------------------------------- insert sections
  function currentTopBlock() {
    var el = selectionEl();
    var body = rows();
    while (el && el !== doc) {
      if (el.parentElement === body && el.matches('[data-block]')) return el;
      el = el.parentElement;
    }
    return null;
  }
  function insertSection(html) {
    history.commit();
    var body = rows();
    var tmp = document.createElement('tbody');
    tmp.innerHTML = html;
    var tr = tmp.firstElementChild;
    var at = currentTopBlock();
    var name = at && at.dataset.block;
    if (!at || name === 'Footer' || name === 'Gold bar') {
      var foot = body.querySelector(':scope > [data-block="Footer"]');
      var before = foot && foot.previousElementSibling && foot.previousElementSibling.dataset.block === 'Spacer'
        ? foot.previousElementSibling : foot;
      body.insertBefore(tr, before || null);
    } else {
      body.insertBefore(tr, at.nextElementSibling);
    }
    changed();
    tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    // Put the caret in the new section
    var target = tr.querySelector('p, div:not([contenteditable="false"]), a');
    if (target) {
      var r = document.createRange(); r.selectNodeContents(target);
      var s = window.getSelection(); doc.focus({ preventScroll: true }); s.removeAllRanges(); s.addRange(r);
    }
    return tr;
  }

  var INSERTS = {
    text: function () { return B.text(); },
    heading: function () { return B.heading(); },
    label: function () { return B.label(); },
    tiles: function () { return B.tiles(); },
    list: function () { return B.list(); },
    details: function () {
      return B.list([B.detail('LABEL', 'Value'), B.detail('LABEL', 'Value'), B.detail('LABEL', 'Value')]);
    },
    callout: function () { return B.callout(); },
    button: function () {
      var label = prompt('Button text:', 'SIGN UP'); if (label === null) return null;
      var href = prompt('Button link:', 'https://'); if (href === null) return null;
      return B.button(label.replace(/</g, '&lt;'), href.replace(/"/g, '&quot;'));
    },
    divider: function () { return B.divider(); },
    spacer: function () { return B.spacer(); },
  };
  $('insertMenu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-insert]'); if (!b) return;
    $('insertMenu').hidden = true;
    var kind = b.dataset.insert;
    if (kind === 'image') { pickImages('block'); return; }
    var html = INSERTS[kind](); if (html) insertSection(html);
  });

  // ---------------------------------------------------------------- images
  var pickMode = 'caret', replaceTarget = null;
  function pickImages(mode) { pickMode = mode; $('imageFile').value = ''; $('imageFile').click(); }
  $('imageBtn').addEventListener('click', function () {
    pickImages(savedRange && doc.contains(savedRange.startContainer) ? 'caret' : 'block');
  });
  $('imageFile').addEventListener('change', function () {
    var files = Array.prototype.slice.call(this.files);
    if (pickMode === 'replace' && replaceTarget && files[0]) {
      shrink(files[0]).then(function (src) { replaceTarget.src = src; changed(); });
      return;
    }
    insertImages(files, pickMode);
  });

  // Big photos get scaled down so the email (and the clipboard) stays light.
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var data = reader.result;
        if (/gif|svg/.test(file.type) || file.size < 250000) return resolve(data);
        var img = new Image();
        img.onload = function () {
          var max = 1400, w = img.naturalWidth, h = img.naturalHeight;
          var k = Math.min(1, max / w);
          var c = document.createElement('canvas');
          c.width = Math.round(w * k); c.height = Math.round(h * k);
          var ctx = c.getContext('2d');
          var png = file.type === 'image/png';
          if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
          ctx.drawImage(img, 0, 0, c.width, c.height);
          var out = png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85);
          if (png && out.length > data.length) out = data;
          resolve(out);
        };
        img.onerror = reject;
        img.src = data;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function contentWidth(el) {
    var box = el.closest('td, p, div') || doc;
    var cs = getComputedStyle(box);
    return Math.max(80, box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
  }

  function insertImages(files, mode) {
    files = files.filter(function (f) { return /^image\//.test(f.type); });
    if (!files.length) return;
    Promise.all(files.map(shrink)).then(function (srcs) {
      srcs.forEach(function (src) {
        var probe = new Image();
        probe.onload = function () {
          if (mode === 'block' || !restoreRange()) {
            var w = Math.min(probe.naturalWidth, 668);
            insertSection(B.image(src, w));
            return;
          }
          var el = selectionEl() || doc;
          var w2 = Math.min(probe.naturalWidth, Math.round(contentWidth(el)));
          document.execCommand('insertHTML', false,
            '<img src="' + src + '" width="' + w2 + '" alt="" style="display:block;width:' + w2 +
            'px;max-width:100%;height:auto;border:0;margin:12px 0;">');
          changed();
        };
        probe.src = src;
      });
    }).catch(function () { toast('Could not read that image'); });
  }

  doc.addEventListener('paste', function (e) {
    var files = Array.prototype.slice.call((e.clipboardData && e.clipboardData.files) || []);
    if (files.some(function (f) { return /^image\//.test(f.type); })) {
      e.preventDefault(); insertImages(files, 'caret');
    }
  });
  desk.addEventListener('dragover', function (e) {
    if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') > -1) {
      e.preventDefault(); desk.classList.add('drop');
    }
  });
  desk.addEventListener('dragleave', function (e) { if (e.target === desk) desk.classList.remove('drop'); });
  desk.addEventListener('drop', function (e) {
    desk.classList.remove('drop');
    var files = Array.prototype.slice.call((e.dataTransfer && e.dataTransfer.files) || []);
    if (!files.length) return;
    e.preventDefault();
    var r = document.caretRangeFromPoint && document.caretRangeFromPoint(e.clientX, e.clientY);
    if (r && doc.contains(r.startContainer)) { savedRange = r; insertImages(files, 'caret'); }
    else insertImages(files, 'block');
  });

  // Image toolbar
  var selImg = null, imgBar = $('imgBar');
  function placeImgBar() {
    if (!selImg) return;
    var r = selImg.getBoundingClientRect();
    imgBar.style.left = Math.max(8, r.left) + 'px';
    imgBar.style.top = Math.max(8, r.top - 40) + 'px';
  }
  function selectImage(img) {
    deselectImage();
    selImg = img; img.classList.add('sel');
    var locked = !!img.closest('[contenteditable="false"]');
    imgBar.querySelectorAll('[data-img]').forEach(function (b) {
      b.hidden = locked && b.dataset.img !== 'replace';
    });
    imgBar.querySelectorAll('.sep').forEach(function (s) { s.hidden = locked; });
    imgBar.hidden = false; placeImgBar();
  }
  function deselectImage() {
    if (selImg) { selImg.classList.remove('sel'); if (!selImg.className) selImg.removeAttribute('class'); }
    selImg = null; imgBar.hidden = true;
  }
  doc.addEventListener('click', function (e) {
    if (e.target.tagName === 'IMG') selectImage(e.target); else deselectImage();
  });
  imgBar.addEventListener('mousedown', function (e) { e.preventDefault(); });
  imgBar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-img]'); if (!b || !selImg) return;
    var act = b.dataset.img, img = selImg;
    history.commit();
    if (/^\d+$/.test(act)) {
      var w = Math.round(contentWidth(img) * act / 100);
      img.setAttribute('width', w); img.removeAttribute('height');
      img.style.width = w + 'px'; img.style.height = 'auto'; img.style.maxWidth = '100%';
    } else if (act === 'left') {
      img.style.display = 'block'; img.style.marginLeft = '0'; img.style.marginRight = 'auto';
    } else if (act === 'center') {
      img.style.display = 'block'; img.style.marginLeft = 'auto'; img.style.marginRight = 'auto';
    } else if (act === 'replace') {
      replaceTarget = img; pickImages('replace'); return;
    } else if (act === 'link') {
      var a = img.closest('a');
      var url = prompt('Image links to (empty to remove):', a ? a.getAttribute('href') : 'https://');
      if (url === null) return;
      url = url.trim();
      if (a && !url) { a.parentNode.insertBefore(img, a); a.remove(); }
      else if (a) a.setAttribute('href', url);
      else if (url) { a = document.createElement('a'); a.href = url; img.parentNode.insertBefore(a, img); a.appendChild(img); }
    } else if (act === 'remove') {
      var block = img.closest('[data-block="Image"]');
      deselectImage();
      if (block && block.querySelectorAll('img').length === 1 && !block.textContent.trim()) block.remove();
      else (img.parentElement.tagName === 'A' ? img.parentElement : img).remove();
    }
    changed(); placeImgBar();
  });

  // ---------------------------------------------------------------- section hover controls
  var blockBar = $('blockBar'), hoverBlock = null, overBar = false;
  function showBlockBar(block) {
    if (hoverBlock && hoverBlock !== block) hoverBlock.classList.remove('hover');
    hoverBlock = block;
    block.classList.add('hover');
    $('blockName').textContent = block.dataset.block;
    blockBar.hidden = false;
    placeBlockBar();
  }
  function placeBlockBar() {
    if (!hoverBlock) return;
    var r = hoverBlock.getBoundingClientRect();
    var bw = blockBar.offsetWidth;
    var page = $('page').getBoundingClientRect();
    var left = page.right + 8;
    if (left + bw > window.innerWidth - 4) left = r.right - bw - 4;
    blockBar.style.left = left + 'px';
    blockBar.style.top = Math.max(r.top, desk.getBoundingClientRect().top + 4) + 'px';
  }
  function hideBlockBar() {
    if (hoverBlock) { hoverBlock.classList.remove('hover'); if (!hoverBlock.className) hoverBlock.removeAttribute('class'); }
    hoverBlock = null; blockBar.hidden = true;
  }
  doc.addEventListener('mousemove', function (e) {
    var b = e.target.closest('[data-block]');
    if (b && b !== hoverBlock) showBlockBar(b);
  });
  desk.addEventListener('mousemove', function (e) {
    if (!overBar && !doc.contains(e.target) && hoverBlock) {
      // Leave it up while the pointer travels across the gap to the bar.
      var r = blockBar.getBoundingClientRect();
      if (e.clientX < r.left - 40 || e.clientY < r.top - 30 || e.clientY > r.bottom + 30) hideBlockBar();
    }
  });
  blockBar.addEventListener('mouseenter', function () { overBar = true; });
  blockBar.addEventListener('mouseleave', function () { overBar = false; });
  blockBar.addEventListener('mousedown', function (e) { e.preventDefault(); });

  function sibling(el, dir) {
    var s = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    while (s && !s.matches('[data-block]')) s = dir < 0 ? s.previousElementSibling : s.nextElementSibling;
    return s;
  }
  blockBar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-block-act]'); if (!b || !hoverBlock) return;
    history.commit();
    var el = hoverBlock, act = b.dataset.blockAct;
    if (act === 'up') { var p = sibling(el, -1); if (p) el.parentNode.insertBefore(el, p); }
    if (act === 'down') { var n = sibling(el, 1); if (n) el.parentNode.insertBefore(n, el); }
    if (act === 'dup') {
      var c = el.cloneNode(true); c.classList.remove('hover'); if (!c.className) c.removeAttribute('class');
      el.parentNode.insertBefore(c, el.nextSibling);
      deselectImage();
    }
    if (act === 'del') {
      var parentSection = el.parentElement.closest('[data-block]');
      hideBlockBar(); deselectImage();
      el.remove();
      // An empty list or tile row takes its section with it.
      if (parentSection && !parentSection.querySelector('[data-block]')) parentSection.remove();
      changed(); return;
    }
    changed(); placeBlockBar();
  });

  desk.addEventListener('scroll', function () { placeBlockBar(); placeImgBar(); });
  window.addEventListener('resize', function () { placeBlockBar(); placeImgBar(); });

  // ---------------------------------------------------------------- typing
  doc.addEventListener('input', function () { history.soon(); save(); });
  subject.addEventListener('input', save);
  doc.addEventListener('beforeinput', function (e) {
    if (e.inputType === 'historyUndo') { e.preventDefault(); history.go(-1); }
    if (e.inputType === 'historyRedo') { e.preventDefault(); history.go(1); }
  });
  document.addEventListener('keydown', function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    var k = e.key.toLowerCase();
    if (k === 'z' && document.activeElement === doc) { e.preventDefault(); history.go(e.shiftKey ? 1 : -1); }
    else if (k === 'y' && document.activeElement === doc) { e.preventDefault(); history.go(1); }
    else if (k === 'k' && document.activeElement === doc) { e.preventDefault(); editLink(); }
    else if (k === 's') { e.preventDefault(); save(); toast('Saved in this browser'); }
  });

  // ---------------------------------------------------------------- export
  var CLEAN_ATTRS = ['contenteditable', 'data-block', 'data-badge', 'data-list', 'data-tiles', 'data-card', 'spellcheck'];
  function exportCard() {
    var wrap = document.createElement('div');
    wrap.innerHTML = doc.innerHTML;
    CLEAN_ATTRS.forEach(function (a) {
      wrap.querySelectorAll('[' + a + ']').forEach(function (el) { el.removeAttribute(a); });
    });
    wrap.querySelectorAll('[class]').forEach(function (el) { el.removeAttribute('class'); });
    return wrap.innerHTML;
  }
  function emailHTML() {
    return '<div style="margin:0;padding:0;background:#e8edf2;font-family:Arial,Helvetica,sans-serif;color:#102b45;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e8edf2;">' +
      '<tr><td align="center" style="padding:28px 10px 40px;">' + exportCard() +
      '</td></tr></table></div>';
  }
  function emailText() {
    var tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;left:-99999px;top:0;width:760px;';
    tmp.innerHTML = exportCard();
    document.body.appendChild(tmp);
    var t = tmp.innerText.replace(/\n{3,}/g, '\n\n').trim();
    tmp.remove();
    return t;
  }

  function copyRich(html, text) {
    // A copy event lets us hand Gmail the exact HTML (no browser sanitising).
    var ok = false;
    function onCopy(e) {
      e.clipboardData.setData('text/html', html);
      e.clipboardData.setData('text/plain', text);
      e.preventDefault(); ok = true;
    }
    document.addEventListener('copy', onCopy);
    try { document.execCommand('copy'); } catch (err) {}
    document.removeEventListener('copy', onCopy);
    if (ok) return Promise.resolve();
    if (navigator.clipboard && window.ClipboardItem) {
      return navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      })]);
    }
    return Promise.reject(new Error('no clipboard'));
  }

  function copyEmail() {
    deselectImage(); hideBlockBar();
    copyRich(emailHTML(), emailText())
      .then(function () { toast('Copied! Open Gmail → Compose → Ctrl+V'); })
      .catch(function () { toast('Copy failed. Try Download .html instead.'); });
  }
  function copySubject() {
    copyRich(subject.value.replace(/</g, '&lt;'), subject.value)
      .then(function () { toast('Subject copied'); });
  }
  function downloadHTML() {
    var title = (subject.value || 'Key Club email').replace(/</g, '&lt;');
    var file = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + title + '</title>\n</head>\n' +
      '<body style="margin:0;padding:0;">\n' + emailHTML() + '\n</body>\n</html>\n';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([file], { type: 'text/html' }));
    a.download = (subject.value || 'key-club-email').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 60) + '.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  $('copy').addEventListener('click', copyEmail);
  $('exportMenu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-export]'); if (!b) return;
    $('exportMenu').hidden = true;
    var x = b.dataset.export;
    if (x === 'copy') copyEmail();
    if (x === 'subject') copySubject();
    if (x === 'html') downloadHTML();
    if (x === 'reset' && confirm('Throw away your changes to "' + TEMPLATES[state.current].name + '" and start over?')) {
      openTemplate(state.current, true);
      toast('Back to the original template');
    }
  });

  // ---------------------------------------------------------------- boot
  var sel = $('template');
  Object.keys(TEMPLATES).forEach(function (k) {
    var o = document.createElement('option'); o.value = k; o.textContent = 'Template: ' + TEMPLATES[k].name;
    sel.appendChild(o);
  });
  sel.addEventListener('change', function () {
    state.docs[state.current] = { html: doc.innerHTML, subject: subject.value };
    openTemplate(sel.value);
  });
  openTemplate(TEMPLATES[state.current] ? state.current : 'announcement');
})();
