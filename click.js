(function(){
  var id = document.currentScript && document.currentScript.getAttribute('data-target');
  if (id) {
    var el = document.querySelector('[data-pesawat="' + id + '"]');
    if (el) {
      var rect = el.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var evts = ['pointerdown','pointerup','mousedown','mouseup','click'];
      evts.forEach(function(type) {
        el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window }));
      });
      el.removeAttribute('data-pesawat');
    }
  }
  if (document.currentScript) document.currentScript.remove();
})();
