/* ===== wishlist.js (simple + complete) ===== */
(function(){
    const WL_KEY = 'wishlist';
  
    function read(){ try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); } catch { return []; } }
    function save(list){ localStorage.setItem(WL_KEY, JSON.stringify(list || [])); refreshHearts(); }
  
    function toast(msg){
      let t = document.getElementById('wlToast');
      if(!t){
        t = document.createElement('div');
        t.id = 'wlToast';
        Object.assign(t.style, {
          position:'fixed', left:'50%', bottom:'26px', transform:'translateX(-50%)',
          background:'#2b1f1a', color:'#fff', padding:'10px 14px', borderRadius:'10px',
          boxShadow:'0 8px 20px rgba(0,0,0,.2)', zIndex:'2000', fontWeight:'800',
          letterSpacing:'.02em', opacity:'0', transition:'opacity .2s'
        });
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.style.opacity = '1';
      clearTimeout(t._h);
      t._h = setTimeout(()=>{ t.style.opacity='0'; }, 1400);
    }
  
    function has(baseName, size=null){
      return read().some(x => (x.baseName||x.name) === baseName && (x.size||null) === (size||null));
    }
  
    function add(item){
      if(!item || !item.name) return;
      const baseName = item.baseName || item.name;
      const size = item.size || null;
      const qty = Math.max(1, parseInt(item.quantity)||1);
  
      const list = read();
      const i = list.findIndex(x => (x.baseName||x.name) === baseName && (x.size||null) === size);
      if(i > -1){
        list[i].quantity = (parseInt(list[i].quantity)||1) + qty;
        toast('Already in wishlist — quantity updated');
      }else{
        list.push({
          baseName,
          name: size ? `${baseName} (Size: ${size})` : baseName,
          img: item.img,
          price: item.price,
          desc: item.desc || '',
          category: (item.category||'').toLowerCase(),
          size,
          quantity: qty
        });
        toast('Added to wishlist');
      }
      save(list);
    }
  
    function remove(baseName, size=null){
      const keep = read().filter(x => (x.baseName||x.name) !== baseName || (x.size||null) !== (size||null));
      save(keep);
      toast('Removed from wishlist');
    }
  
    function refreshHearts(){
      document.querySelectorAll('[data-wl]').forEach(btn=>{
        const name = btn.dataset.name || '';
        const size = btn.dataset.size || null;
        if(name && has(name, size)){
          btn.classList.add('wl-active');
          btn.setAttribute('aria-pressed', 'true');
          btn.title = 'In wishlist';
        }else{
          btn.classList.remove('wl-active');
          btn.setAttribute('aria-pressed', 'false');
          btn.title = 'Add to wishlist';
        }
      });
    }
  
    // Click any [data-wl] to toggle
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-wl]');
      if(!btn) return;
      e.preventDefault();
  
      const name = btn.dataset.name;
      const size = btn.dataset.size || null;
  
      if(!name){ toast('Missing product data'); return; }
  
      if(has(name, size)){
        remove(name, size);
      }else{
        // all needed data must be on the element
        add({
          name,
          baseName: name,
          img: btn.dataset.img,
          price: btn.dataset.price,
          desc: btn.dataset.desc || '',
          category: btn.dataset.category || '',
          size,
          quantity: Math.max(1, parseInt(btn.dataset.quantity)||1)
        });
      }
      refreshHearts();
    });
  
    document.addEventListener('DOMContentLoaded', refreshHearts);
  
    // Expose minimal API
    window.Wishlist = { add, remove, has, list: read, refreshHearts };
  })();
  