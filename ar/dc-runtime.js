/* Minimal standalone runtime for Wilzy design prototypes (replaces the design-canvas support.js). */
(function () {
  let comp = null, root = null, tpl = null, queued = false;
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(u) { Object.assign(this.state, typeof u === 'function' ? u(this.state, this.props) : u); schedule(); }
  }
  window.DCLogic = DCLogic;
  const RX = /\{\{\s*([^}]*?)\s*\}\}/g;
  const get = (scope, expr) => {
    if (expr === 'true') return true; if (expr === 'false') return false;
    return expr.split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
  };
  const evalStr = (s, scope) => {
    const m = s.match(/^\s*\{\{\s*([^}]*?)\s*\}\}\s*$/);
    if (m) return get(scope, m[1]);
    return s.replace(RX, (_, e) => { const v = get(scope, e); return v == null ? '' : String(v); });
  };
  function build(node, scope, out) {
    if (node.nodeType === 3) { out.push(document.createTextNode(node.nodeValue.indexOf('{{') < 0 ? node.nodeValue : String(evalStr(node.nodeValue, scope) ?? ''))); return; }
    if (node.nodeType !== 1) return;
    const tag = node.localName;
    if (tag === 'sc-if') { if (evalStr(node.getAttribute('value') || '', scope)) node.childNodes.forEach((c) => build(c, scope, out)); return; }
    if (tag === 'sc-for') {
      const list = evalStr(node.getAttribute('list') || '', scope) || []; const as = node.getAttribute('as') || 'item';
      list.forEach((item, i) => { const s = Object.assign(Object.create(scope), { [as]: item, index: i }); node.childNodes.forEach((c) => build(c, s, out)); });
      return;
    }
    const el = node.namespaceURI && node.namespaceURI !== 'http://www.w3.org/1999/xhtml' ? document.createElementNS(node.namespaceURI, node.tagName) : document.createElement(node.tagName);
    el.__h = {};
    for (const a of node.attributes) {
      if (a.name.startsWith('hint-')) continue;
      if (/^on[a-z]/i.test(a.name)) { const f = evalStr(a.value, scope); if (typeof f === 'function') el.__h[a.name.slice(2).toLowerCase()] = f; continue; }
      if (a.value.indexOf('{{') < 0) { el.setAttribute(a.name, a.value); continue; }
      const v = evalStr(a.value, scope);
      if (v === false || v == null) continue;
      el.setAttribute(a.name, v === true ? '' : String(v));
    }
    const kids = []; node.childNodes.forEach((c) => build(c, scope, kids)); kids.forEach((k) => el.appendChild(k));
    out.push(el);
  }
  function syncHandlers(oldEl, newEl) {
    const prev = oldEl.__h || {}, next = newEl.__h || {};
    for (const k in prev) if (!(k in next)) oldEl['on' + k] = null;
    for (const k in next) oldEl['on' + k] = next[k];
    oldEl.__h = next;
  }
  function patch(parent, oldN, newN) {
    if (!oldN) { parent.appendChild(newN); if (newN.nodeType === 1) bindDeep(newN); return; }
    if (oldN.nodeType !== newN.nodeType || oldN.nodeName !== newN.nodeName) { parent.replaceChild(newN, oldN); if (newN.nodeType === 1) bindDeep(newN); return; }
    if (oldN.nodeType === 3) { if (oldN.nodeValue !== newN.nodeValue) oldN.nodeValue = newN.nodeValue; return; }
    for (const a of Array.from(oldN.attributes)) if (!newN.hasAttribute(a.name)) oldN.removeAttribute(a.name);
    for (const a of newN.attributes) if (oldN.getAttribute(a.name) !== a.value) oldN.setAttribute(a.name, a.value);
    syncHandlers(oldN, newN);
    const o = Array.from(oldN.childNodes), n = Array.from(newN.childNodes);
    n.forEach((c, i) => patch(oldN, o[i], c));
    for (let i = n.length; i < o.length; i++) oldN.removeChild(o[i]);
  }
  function bindDeep(el) { const h = el.__h || {}; for (const k in h) el['on' + k] = h[k]; el.childNodes.forEach((c) => c.nodeType === 1 && bindDeep(c)); }
  function render() {
    queued = false;
    const vals = comp.renderVals ? comp.renderVals() : {};
    const out = []; tpl.childNodes.forEach((c) => build(c, vals, out));
    const o = Array.from(root.childNodes);
    out.forEach((c, i) => patch(root, o[i], c));
    for (let i = out.length; i < o.length; i++) root.removeChild(o[i]);
  }
  function schedule() { if (!queued && comp) { queued = true; requestAnimationFrame(render); } }
  document.addEventListener('DOMContentLoaded', () => {
    const t = document.getElementById('dc-tpl'); const host = t ? t.content.querySelector('x-dc') : document.querySelector('x-dc');
    const helmet = host.querySelector('helmet');
    if (helmet) { Array.from(helmet.childNodes).forEach((n) => document.head.appendChild(n)); helmet.remove(); }
    tpl = document.createElement('div'); Array.from(host.childNodes).forEach((n) => tpl.appendChild(n));
    root = document.createElement('div'); root.id = 'app'; if (t) t.replaceWith(root); else host.replaceWith(root);
    const sc = document.querySelector('script[type="text/x-dc"]');
    let props = {}; try { props = JSON.parse(sc.getAttribute('data-props') || '{}'); } catch (e) {}
    const Component = new Function('DCLogic', sc.textContent + '\nreturn Component;')(DCLogic);
    comp = new Component(props);
    render();
    if (comp.componentDidMount) comp.componentDidMount();
    window.addEventListener('pagehide', () => comp.componentWillUnmount && comp.componentWillUnmount());
  });
})();
