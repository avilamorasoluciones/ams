(function(){
'use strict';
var body=document.body;if(!body)return;
var path=location.pathname,app=path.indexOf('/juegos')===0?'juegos':path.indexOf('/ayukcal')===0?'ayukcal':'herramientas';
body.classList.add('ams-shared');body.setAttribute('data-ams-app',app);
var bar=document.createElement('div');bar.className='ams-shared-bar';bar.setAttribute('role','navigation');bar.setAttribute('aria-label','Navegación Avila Mora Soluciones');
var brand=document.createElement('a');brand.className='ams-shared-brand';brand.href='../';brand.innerHTML='<img src="../img/AMS.webp?v=1" alt="" width="32" height="32"><span>Avila Mora Soluciones</span>';
var links=document.createElement('div');links.className='ams-shared-links';
[['Inicio','../'],['Juegos','../juegos/'],['AyuKcal','../ayukcal/'],['Herramientas','../herramientas/']].forEach(function(item){var a=document.createElement('a');a.href=item[1];a.textContent=item[0];if(item[0].toLowerCase()===app)a.setAttribute('aria-current','page');links.appendChild(a);});
var theme=document.createElement('button');theme.type='button';theme.className='ams-shared-theme';theme.setAttribute('aria-label','Cambiar tema');theme.title='Cambiar tema';theme.textContent='◐';
theme.addEventListener('click',function(){
 var old=body.getAttribute('data-theme'),isLight=body.classList.contains('light-theme')||old==='light';
 if(app==='juegos'){var b=document.querySelector('[data-theme-toggle]');if(b)b.click();}
 else if(app==='ayukcal'){if(typeof window.toggleTheme==='function')window.toggleTheme();}
 else {var b=document.getElementById(isLight?'themeDarkBtn':'themeLightBtn');if(b)b.click();}
});
links.appendChild(theme);bar.appendChild(brand);bar.appendChild(links);
body.insertBefore(bar,body.firstChild);
})();