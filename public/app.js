var iframe = document.querySelector('iframe')
  , holder = document.querySelector('#iframe-holder')
  , span = document.querySelector('span')
  , section = document.querySelector('section')
  , loadIndicator = document.querySelector('#load-indicator')
  , canvas = document.createElement('canvas')
  , guides = []
  , buttons;
  
section.appendChild(canvas);
  
buttons = Array.prototype.map.call(document.querySelectorAll('li'), function(li){
  li.addEventListener('click', function(e){
    e.preventDefault();
    setIframeWidth(li.textContent);
  });
  guides.push(parseInt(li.textContent));
  return li;
});
  
guides = guides.sort(function(a, b){
  if (a < b) {
    return 1;
  } else if(a > b){
    return -1;
  } else {
    return 0;
  }
});

iframe.addEventListener('load', function(){
  loadIndicator.classList.remove('loading');
  loadIndicator.classList.remove('error');
});

var setIframeWidth = function(w){
  w = parseInt(w);
  if (isNaN(w)) w = 0;
  if ( w <= 200 ) w = 200;
    
  localStorage.default_width = w;
    
  holder.style.width = w + 'px';
  span.textContent = w + 'px';
  
  buttons.forEach(function(button){
    if (parseInt(button.textContent) == w) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  });
  
  return w;
}
  
var shortcut = function(e){
  if (e.which == 87) {
    e.preventDefault();
    span.focus();
  };
};
  
var drawGuides = function(canvas){
  canvas.setAttribute('width', section.offsetWidth);
  canvas.setAttribute('height', section.offsetHeight);
  var context = canvas.getContext('2d')
    , w = canvas.width
    , h = canvas.height
    , center = w * 0.5
    , adjust = w % 2 == 0 ? -0.5 : 0.5
    , gutter = 80;
    
  context.clearRect(0, 0, w, h);
    
  context.strokeStyle = "hsla(0,0%,0%,0.1)";
  context.lineWidth = 0.5;
  guides.forEach(function(guide){
    var x = (w - guide) * 0.5;
    
    [Math.round(x) - adjust, Math.round(x + guide) - adjust].forEach(function(x){
      context.beginPath();
      context.moveTo(x,0);
      context.lineTo(x,h);
      context.stroke();
      context.closePath();
    });
      
    context.fillStyle = "hsla(0,0%,0%,0.4)";
    var label = guide + 'px';
    context.fillText(label, x + guide + 10, 12);
    context.fillText(label, x - context.measureText(label).width - 10, 12 );
      
  });
        
};
  
var Slider = function(frame, options){
  if (!options) options = {};
  options.snaps       = options.snaps || [320, 480, 728, 1024];
  options.snap_buffer = options.snap_buffer || 10;
  options.snap        = options.snap === true;

  var x = null
    , start_x = null
    , resizing = false
    , start_width
    , invert = false
    , overlay;
    
  overlay = document.createElement('div');
  overlay.style.position = "fixed";
  overlay.style.top      = "0";
  overlay.style.right    = "0";
  overlay.style.bottom   = "0";
  overlay.style.left     = "0";
    
  var leftBound = function(){
    return frame.offsetLeft;
  };
    
  var rightBound = function(){
    return frame.offsetLeft + frame.offsetWidth;
  };
    
  var detector = function(e){
    x = e.clientX;
  };
    
  var canResize = function(){
    if( x < leftBound() || x > rightBound() ){
      return true;
    } else {
      return false;
    }
  }
        
  var closestSnap = function(w){
    if (!options.snap) return w;
    var snaps = options.snaps.filter(function(snap){
      return w > snap - options.snap_buffer && w < snap + options.snap_buffer;
    });
    if ( snaps.length > 0 ) {
      return snaps[0];
    } else {
      return w;
    }
  }
    
  var resizer = function(e){
    e.preventDefault();
    x = e.clientX;
    var distance = x - start_x, w = start_width + ((invert ? -1 : 1) * distance * 2);
    setIframeWidth(closestSnap(w));
  };
    
    
  var down = function(){
    if (canResize()) {
      document.body.classList.add('resizing');
      document.body.appendChild(overlay);
      start_x = x;
      start_width = frame.offsetWidth;
      resizing = true;
      invert = x <= frame.offsetLeft;
      document.removeEventListener('mousemove', detector);
      document.addEventListener('mousemove', resizer);
    };
  };
    
  var release = function(){
    if (resizing) {
      resizing = false;
      document.body.removeChild(overlay);
      document.body.classList.remove('resizing');
      document.removeEventListener('mousemove', resizer);
      document.addEventListener('mousemove', detector);
    };
  };
    
  document.addEventListener('mousemove', detector);
  section.addEventListener('mousedown', down);
  document.body.addEventListener('mouseup', release);
    
}
  
var slider = new Slider(holder, {snaps:guides});
var loadSite = function(src){
  var p = loadIndicator.querySelector('p');
  p.textContent = "Loading";
  if (!(/^(https?:)?\/\//i).test(src)){ src= "http://" + src; };
  iframe.src = src;
  loadIndicator.classList.add('loading');
  loadIndicator.classList.remove('error');
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/supported?url=' + src);
  xhr.addEventListener('readystatechange', function(e){
    var response;
    if (xhr.status == 500) {
      p.textContent = "Host unreachable from server."
    } else {
      if (xhr.readyState == 4) {
        response = JSON.parse(xhr.responseText);
        if (response['x-frame-options'] !== false) {
          loadIndicator.classList.add('error');
          p.textContent = "Load Error: forbidden by X-Frame-Options HTTP response header."
        };
      };
    }
  });
  xhr.send("")
};
  
document.querySelector('form').addEventListener('submit', function(e){
  e.preventDefault();
  if (window.history.pushState) {
    window.history.pushState({url:this.site.value}, null, "?" + this.site.value);
  };
  loadSite(this.site.value);
});

window.addEventListener('popstate', function(e){
  if (e.state && e.state.url) {
    console.log("State", e.state);
    document.forms[0].site.value = e.state.url;
    loadSite(e.state.url)
  };
});
  
window.addEventListener('resize', function(){
  span.textContent = iframe.offsetWidth + 'px';
});
    
span.addEventListener('keydown', function(e){
  if (e.which == 13) {
    e.preventDefault();
    span.blur();
    span.textContent = setIframeWidth( span.textContent ) + 'px';
  } else if(e.which == 27) {
    span.textContent = iframe.offsetWidth + 'px';
    span.blur();
  };
});
  
span.addEventListener('focus', function(){
  var range = document.createRange();
  var sel = window.getSelection();
  range.selectNode(span.firstChild);
  sel.removeAllRanges();
  sel.addRange(range);
});

span.textContent = iframe.offsetWidth + 'px';
  
drawGuides(canvas);
window.addEventListener('resize', function(){
  drawGuides(canvas);
});
  
if (localStorage.default_width) {
  setIframeWidth(localStorage.default_width);
};

if (window.location.search.indexOf("?") == 0) {
  document.forms[0].site.value = decodeURIComponent(window.location.search.slice(1));
  loadSite(document.forms[0].site.value);
};
