
(function () {
  'use strict';
  var D = window.STUDY_DATA;
  var S = (window.Study = {});

  S.top12 = D.top12.slice();
  S.allMakes = Object.keys(D.makes);
  S.debug = /[?&]debug=1/.test(location.search);

  S.esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  S.models = function (make) {
    return (D.makes[make] || []).map(function (m) { return m[0]; });
  };
  S.years = function (make, model) {
    var row = (D.makes[make] || []).filter(function (m) { return m[0] === model; })[0];
    if (!row) return [];
    var out = [];
    row[1].split(',').forEach(function (part) {
      var ab = part.split('-').map(Number);
      var hi = ab[0], lo = ab.length > 1 ? ab[1] : ab[0];
      for (var y = hi; y >= lo; y--) out.push(y);
    });
    return out;
  };
  S.common = function (make) {
    var all = S.models(make);
    if (all.length <= 12) return null;
    var pick = D.common[make] || all.slice(0, 12);
    return all.filter(function (m) { return pick.indexOf(m) !== -1; });
  };

  S.norm = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); };

  var NICKNAMES = { chevy: 'Chevrolet', vw: 'Volkswagen', beemer: 'BMW', bimmer: 'BMW', caddy: 'Cadillac' };
  S.search = function (names, typed, nicknames) {
    var q = S.norm(typed);
    if (!q) return null;
    var starts = [], contains = [];
    names.forEach(function (n) {
      var k = S.norm(n);
      if (k.indexOf(q) === 0) starts.push(n);
      else if (k.indexOf(q) !== -1) contains.push(n);
    });
    var out = starts.concat(contains);
    if (nicknames && NICKNAMES[q] && out.indexOf(NICKNAMES[q]) === -1 && names.indexOf(NICKNAMES[q]) !== -1) out.unshift(NICKNAMES[q]);
    return out;
  };

  
  var blank = function () { return { step: 'vehicles', vehicles: null, make: null, model: null, year: null }; };
  S.state = blank();

  S.setMake = function (make) {
    if (S.state.make !== make) { S.state.model = null; S.state.year = null; }
    S.state.make = make;
  };
  S.setModel = function (model) {
    if (S.state.model !== model) S.state.year = null;
    S.state.model = model;
  };
  S.carText = function () {
    var s = S.state;
    return [s.year, s.make, s.model].filter(function (x) { return x !== null; }).join(' ');
  };

  
  var t0 = Date.now();
  S.logs = [];
  S.log = function (what, detail) {
    S.logs.push({ s: Math.round((Date.now() - t0) / 100) / 10, at: S.state.step, what: what, detail: detail === undefined ? '' : String(detail) });
  };
  S.debugBlock = function () {
    if (!S.debug) return '';
    var lines = S.logs.map(function (l) { return l.s + 's  [' + l.at + ']  ' + l.what + (l.detail ? ': ' + l.detail : ''); });
    return '<pre style="margin:24px 0 0;padding:12px;background:#F4F7F9;border-radius:4px;font:12px/18px monospace;text-align:left;white-space:pre-wrap;color:#2C303C">' +
      S.esc('Answers: vehicles=' + S.state.vehicles + ', make=' + S.state.make + ', model=' + S.state.model + ', year=' + S.state.year + '\n\n' + lines.join('\n')) + '</pre>';
  };

  
  var render = function () {};
  var idx = 0;
  var trail = ['vehicles'];
  var snap = function () {
    return { study: true, idx: idx, step: S.state.step, vehicles: S.state.vehicles, make: S.state.make, model: S.state.model, year: S.state.year };
  };

  S.start = function (renderFn) {
    render = renderFn;
    try { history.scrollRestoration = 'manual'; } catch (e) {  }
    history.replaceState(snap(), '');
    window.addEventListener('popstate', function (e) {
      var st = e.state;
      if (!st || !st.study) return;
      idx = st.idx;
      S.state.step = st.step;
      var needsMake = st.step === 'model' || st.step === 'year';
      if ((needsMake && !S.state.make) || (st.step === 'year' && !S.state.model)) {
        ['vehicles', 'make', 'model', 'year'].forEach(function (k) { S.state[k] = st[k]; });
      }
      S.log('browser back or forward', 'now at ' + st.step);
      render('pop');
    });
    S.log('opened', document.title);
    render('init');
  };

  S.go = function (step, how) {
    S.state.step = step;
    idx += 1;
    trail.length = idx;
    trail[idx] = step;
    history.pushState(snap(), '');
    S.log('to ' + step, how);
    render('go');
  };
  S.back = function (step, how) {
    S.log('back control', how);
    S.go(step, 'back');
  };

  S.restart = function () {
    var fresh = blank();
    Object.keys(fresh).forEach(function (k) { S.state[k] = fresh[k]; });
    S.log('start again');
    S.go('vehicles', 'start again');
  };

  S.END_TITLE = 'That is the end of this part.';
  S.END_LINES = ['Please go back to the UserTesting instructions and continue with the next step.', 'Nothing you entered here was saved or sent.'];
  S.END_AGAIN = 'Start this part again';
})();
