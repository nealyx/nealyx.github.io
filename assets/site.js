const graph = document.querySelector('.ramsey-graph');
if(graph){
  const {points,edges,initialColors,findTriangles}=await import('./graph.js');
  let colors=[...initialColors];
  const controls=[...graph.querySelectorAll('[data-edge]')];
  const status=document.querySelector('.graph-status');
  const announcement=document.querySelector('#graph-announcement');
  function render(announce=false){
    const triangles=findTriangles(colors);
    const chosen=triangles[0];
    controls.forEach((el,i)=>{
      const color=colors[i]?'rust':'blue';
      el.dataset.color=color;
      el.classList.toggle('in-triangle',chosen.edges.includes(i));
      el.setAttribute('aria-pressed',String(!!colors[i]));
      el.setAttribute('aria-label',`Edge ${edges[i][0]+1} to ${edges[i][1]+1}, ${color}. Activate to change color.`);
    });
    const fill=graph.querySelector('.triangle-fill');
    fill.innerHTML='';
    const polygon=document.createElementNS('http://www.w3.org/2000/svg','polygon');
    polygon.setAttribute('points',chosen.vertices.map(i=>points[i].join(',')).join(' '));
    polygon.setAttribute('fill',chosen.color?'#a95738':'#244ad8');
    polygon.setAttribute('opacity','.07');fill.append(polygon);
    status.textContent='Inevitable.';
    if(announce)announcement.textContent=`${triangles.length} single-color triangles. Highlighted: vertices ${chosen.vertices.map(i=>i+1).join(', ')}.`;
  }
  function toggle(i){colors[i]=1-colors[i];render(true)}
  controls.forEach((el,i)=>{
    el.addEventListener('click',()=>toggle(i));
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(i)}});
  });
  document.querySelector('.reset-graph').addEventListener('click',()=>{colors=[...initialColors];render(true)});
  document.querySelector('#recolor-edge').addEventListener('click',()=>toggle(Number(document.querySelector('#edge-picker').value)));
  render();
}
const sections=[...document.querySelectorAll('main > section[id]')];
const navLinks=[...document.querySelectorAll('nav a')];
if(sections.length){
  let queued=false;
  function update(){
    let active='';
    for(const section of sections)if(section.getBoundingClientRect().top<=180)active=section.id;
    if(window.scrollY + innerHeight >= document.documentElement.scrollHeight - 4)active=sections.at(-1).id;
    navLinks.forEach(link=>{const selected=link.hash===`#${active}`;if(selected)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
    queued=false;
  }
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});
  update();
}
if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('arrived');observer.unobserve(entry.target)}}),{threshold:.3});
 document.querySelectorAll('.section-heading h2').forEach(el=>observer.observe(el));
}
