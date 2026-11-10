(function(){
'use strict';
var body=document.body;if(!body)return;
var script=document.currentScript;
var root=new URL('.',script&&script.src?script.src:location.href).pathname;
var path=location.pathname,app=path.indexOf('/juegos/')!==-1?'juegos':path.indexOf('/ayukcal/')!==-1?'ayukcal':'herramientas';
body.classList.add('ams-shared');body.setAttribute('data-ams-app',app);
var bar=document.createElement('div');bar.className='ams-shared-bar';bar.setAttribute('role','navigation');bar.setAttribute('aria-label','Navegación Avila Mora Soluciones');
var brand=document.createElement('a');brand.className='ams-shared-brand';brand.href=root;brand.setAttribute('aria-label','Avila Mora Soluciones, página principal');
var logo=document.createElement('img');logo.src=root+'img/AMS.webp?v=1';logo.alt='';logo.width=32;logo.height=32;
var brandName=document.createElement('span');brandName.textContent='Avila Mora Soluciones';brand.appendChild(logo);brand.appendChild(brandName);
var links=document.createElement('div');links.className='ams-shared-links';
[['Inicio',root],['Juegos',root+'juegos/'],['AyuKcal',root+'ayukcal/'],['Herramientas',root+'herramientas/']].forEach(function(item){var a=document.createElement('a');a.href=item[1];a.textContent=item[0];if(item[0].toLowerCase()===app)a.setAttribute('aria-current','page');links.appendChild(a);});
var theme=document.createElement('button');theme.type='button';theme.className='ams-shared-theme';theme.setAttribute('aria-label','Cambiar tema claro u oscuro');theme.title='Cambiar tema claro u oscuro';theme.textContent='◐';
function syncTheme(){var light=body.classList.contains('light-theme')||document.documentElement.getAttribute('data-theme')==='light';theme.textContent=light?'☾':'☼';theme.setAttribute('aria-label',light?'Cambiar a tema oscuro':'Cambiar a tema claro');theme.title=light?'Cambiar a tema oscuro':'Cambiar a tema claro';}
theme.addEventListener('click',function(){
 if(app==='juegos'){var b=document.querySelector('[data-theme-toggle]');if(b)b.click();return;}
 if(app==='ayukcal'){if(typeof window.toggleTheme==='function')window.toggleTheme();return;}
 var light=body.classList.contains('light-theme');
 var b=document.getElementById(light?'themeDarkBtn':'themeLightBtn');if(b)b.click();
 syncTheme();
});
new MutationObserver(syncTheme).observe(body,{attributes:true,attributeFilter:['class','data-theme']});
new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
document.addEventListener('DOMContentLoaded',syncTheme,{once:true});syncTheme();
links.appendChild(theme);bar.appendChild(brand);bar.appendChild(links);body.insertBefore(bar,body.firstChild);
})();