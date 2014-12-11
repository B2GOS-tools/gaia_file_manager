;'use strict';(function(window){var gL10nData={};var gLanguage='';var gMacros={};var gReadyState='loading';var gNestedProps=['style','dataset'];var gDefaultLocale='en-US';var gAsyncResourceLoading=true;var gDEBUG=1;function consoleLog(message){if(gDEBUG>=2){console.log('[l10n] '+message);}};function consoleWarn(message){if(gDEBUG){console.warn('[l10n] '+message);}};function consoleWarn_missingKeys(untranslatedElements,lang){var len=untranslatedElements.length;if(!len||!gDEBUG){return;}
var missingIDs=[];for(var i=0;i<len;i++){var l10nId=untranslatedElements[i].getAttribute('data-l10n-id');if(missingIDs.indexOf(l10nId)<0){missingIDs.push(l10nId);}}
console.warn('[l10n] '+
missingIDs.length+' missing key(s) for ['+lang+']: '+
missingIDs.join(', '));}
function getL10nResourceLinks(){return document.querySelectorAll('link[type="application/l10n"]');}
function getL10nDictionary(lang){var getInlineDict=function(locale){var sel='script[type="application/l10n"][lang="'+locale+'"]';return document.querySelector(sel);};var script=getInlineDict(lang)||getInlineDict(gDefaultLocale);return script?JSON.parse(script.innerHTML):null;}
function getTranslatableChildren(element){return element?element.querySelectorAll('*[data-l10n-id]'):[];}
function getL10nAttributes(element){if(!element){return{};}
var l10nId=element.getAttribute('data-l10n-id');var l10nArgs=element.getAttribute('data-l10n-args');var args={};if(l10nArgs){try{args=JSON.parse(l10nArgs);}catch(e){consoleWarn('could not parse arguments for #'+l10nId);}}
return{id:l10nId,args:args};}
function setTextContent(element,text){if(!element.firstElementChild){element.textContent=text;return;}
var found=false;var reNotBlank=/\S/;for(var child=element.firstChild;child;child=child.nextSibling){if(child.nodeType===3&&reNotBlank.test(child.nodeValue)){if(found){child.nodeValue='';}else{child.nodeValue=text;found=true;}}}
if(!found){element.insertBefore(document.createTextNode(text),element.firstChild);}}
function fireL10nReadyEvent(){var evtObject=document.createEvent('Event');evtObject.initEvent('localized',false,false);evtObject.language=gLanguage;window.dispatchEvent(evtObject);}
function parseResource(href,lang,successCallback,failureCallback){var baseURL=href.replace(/\/[^\/]*$/,'/');function evalString(text){if(text.lastIndexOf('\\')<0){return text;}
return text.replace(/\\\\/g,'\\').replace(/\\n/g,'\n').replace(/\\r/g,'\r').replace(/\\t/g,'\t').replace(/\\b/g,'\b').replace(/\\f/g,'\f').replace(/\\{/g,'{').replace(/\\}/g,'}').replace(/\\"/g,'"').replace(/\\'/g,"'");}
function parseProperties(text){var dictionary=[];var reBlank=/^\s*|\s*$/;var reComment=/^\s*#|^\s*$/;var reSection=/^\s*\[(.*)\]\s*$/;var reImport=/^\s*@import\s+url\((.*)\)\s*$/i;var reSplit=/^([^=\s]*)\s*=\s*(.+)$/;var reUnicode=/\\u([0-9a-fA-F]{1,4})/g;var reMultiline=/[^\\]\\$/;function parseRawLines(rawText,extendedSyntax){var entries=rawText.replace(reBlank,'').split(/[\r\n]+/);var currentLang='*';var genericLang=lang.replace(/-[a-z]+$/i,'');var skipLang=false;var match='';for(var i=0;i<entries.length;i++){var line=entries[i];if(reComment.test(line)){continue;}
while(reMultiline.test(line)&&i<entries.length){line=line.slice(0,line.length-1)+
entries[++i].replace(reBlank,'');}
if(extendedSyntax){if(reSection.test(line)){match=reSection.exec(line);currentLang=match[1];skipLang=(currentLang!=='*')&&(currentLang!==lang)&&(currentLang!==genericLang);continue;}else if(skipLang){continue;}
if(reImport.test(line)){match=reImport.exec(line);loadImport(baseURL+match[1]);}}
var tmp=line.match(reSplit);if(tmp&&tmp.length==3){var val=tmp[2].replace(reUnicode,function(match,token){return unescape('%u'+'0000'.slice(token.length)+token);});dictionary[tmp[1]]=evalString(val);}}}
function loadImport(url){loadResource(url,function(content){parseRawLines(content,false);},null,false);}
parseRawLines(text,true);return dictionary;}
function loadResource(url,onSuccess,onFailure,asynchronous){onSuccess=onSuccess||function _onSuccess(data){};onFailure=onFailure||function _onFailure(){consoleWarn(url+' not found.');};var xhr=new XMLHttpRequest();xhr.open('GET',url,asynchronous);if(xhr.overrideMimeType){xhr.overrideMimeType('text/plain; charset=utf-8');}
xhr.onreadystatechange=function(){if(xhr.readyState==4){if(xhr.status==200||xhr.status===0){onSuccess(xhr.responseText);}else{onFailure();}}};xhr.onerror=onFailure;xhr.ontimeout=onFailure;try{xhr.send(null);}catch(e){onFailure();}}
loadResource(href,function(response){if(/\.json$/.test(href)){gL10nData=JSON.parse(response);}else{var data=parseProperties(response);for(var key in data){var id,prop,nestedProp,index=key.lastIndexOf('.');if(index>0){id=key.slice(0,index);prop=key.slice(index+1);index=id.lastIndexOf('.');if(index>0){nestedProp=id.substr(index+1);if(gNestedProps.indexOf(nestedProp)>-1){id=id.substr(0,index);prop=nestedProp+'.'+prop;}}}else{index=key.lastIndexOf('[');if(index>0){id=key.slice(0,index);prop='_'+key.slice(index);}else{id=key;prop='_';}}
if(!gL10nData[id]){gL10nData[id]={};}
gL10nData[id][prop]=data[key];}}
if(successCallback){successCallback();}},failureCallback,gAsyncResourceLoading);};function loadLocale(lang,translationRequired){clear();gReadyState='loading';gLanguage=lang;var untranslatedElements=[];var inlineDict=getL10nDictionary(lang);if(inlineDict){gL10nData=inlineDict;if(translationRequired){untranslatedElements=translateFragment();}}
function finish(){if(translationRequired){if(!inlineDict){untranslatedElements=translateFragment();}else if(untranslatedElements.length){untranslatedElements=translateElements(untranslatedElements);}}
gReadyState='complete';fireL10nReadyEvent(lang);consoleWarn_missingKeys(untranslatedElements,lang);}
function l10nResourceLink(link){var re=/\{\{\s*locale\s*\}\}/;var parse=function(locale,onload,onerror){var href=unescape(link.href).replace(re,locale);parseResource(href,locale,onload,function notFound(){consoleWarn(href+' not found.');onerror();});};this.load=function(locale,onload,onerror){onerror=onerror||function(){};parse(locale,onload,function parseFallbackLocale(){if(re.test(unescape(link.href))&&gDefaultLocale!=locale){consoleLog('Trying the fallback locale: '+gDefaultLocale);parse(gDefaultLocale,onload,onerror);}else{onerror();}});};}
var resourceLinks=getL10nResourceLinks();var resourceCount=resourceLinks.length;if(!resourceCount){consoleLog('no resource to load, early way out');translationRequired=false;finish();}else{var onResourceCallback=function(){if(--resourceCount<=0){finish();}};for(var i=0,l=resourceCount;i<l;i++){var resource=new l10nResourceLink(resourceLinks[i]);resource.load(lang,onResourceCallback,onResourceCallback);}}}
function clear(){gL10nData={};gLanguage='';}
var kPluralForms=['zero','one','two','few','many','other'];function getPluralRules(lang){var locales2rules={'af':3,'ak':4,'am':4,'ar':1,'asa':3,'az':0,'be':11,'bem':3,'bez':3,'bg':3,'bh':4,'bm':0,'bn':3,'bo':0,'br':20,'brx':3,'bs':11,'ca':3,'cgg':3,'chr':3,'cs':12,'cy':17,'da':3,'de':3,'dv':3,'dz':0,'ee':3,'el':3,'en':3,'eo':3,'es':3,'et':3,'eu':3,'fa':0,'ff':5,'fi':3,'fil':4,'fo':3,'fr':5,'fur':3,'fy':3,'ga':8,'gd':24,'gl':3,'gsw':3,'gu':3,'guw':4,'gv':23,'ha':3,'haw':3,'he':2,'hi':4,'hr':11,'hu':0,'id':0,'ig':0,'ii':0,'is':3,'it':3,'iu':7,'ja':0,'jmc':3,'jv':0,'ka':0,'kab':5,'kaj':3,'kcg':3,'kde':0,'kea':0,'kk':3,'kl':3,'km':0,'kn':0,'ko':0,'ksb':3,'ksh':21,'ku':3,'kw':7,'lag':18,'lb':3,'lg':3,'ln':4,'lo':0,'lt':10,'lv':6,'mas':3,'mg':4,'mk':16,'ml':3,'mn':3,'mo':9,'mr':3,'ms':0,'mt':15,'my':0,'nah':3,'naq':7,'nb':3,'nd':3,'ne':3,'nl':3,'nn':3,'no':3,'nr':3,'nso':4,'ny':3,'nyn':3,'om':3,'or':3,'pa':3,'pap':3,'pl':13,'ps':3,'pt':3,'rm':3,'ro':9,'rof':3,'ru':11,'rwk':3,'sah':0,'saq':3,'se':7,'seh':3,'ses':0,'sg':0,'sh':11,'shi':19,'sk':12,'sl':14,'sma':7,'smi':7,'smj':7,'smn':7,'sms':7,'sn':3,'so':3,'sq':3,'sr':11,'ss':3,'ssy':3,'st':3,'sv':3,'sw':3,'syr':3,'ta':3,'te':3,'teo':3,'th':0,'ti':4,'tig':3,'tk':3,'tl':4,'tn':3,'to':0,'tr':0,'ts':3,'tzm':22,'uk':11,'ur':3,'ve':3,'vi':0,'vun':3,'wa':4,'wae':3,'wo':0,'xh':3,'xog':3,'yo':0,'zh':0,'zu':3};function isIn(n,list){return list.indexOf(n)!==-1;}
function isBetween(n,start,end){return start<=n&&n<=end;}
var pluralRules={'0':function(n){return'other';},'1':function(n){if((isBetween((n%100),3,10)))
return'few';if(n===0)
return'zero';if((isBetween((n%100),11,99)))
return'many';if(n==2)
return'two';if(n==1)
return'one';return'other';},'2':function(n){if(n!==0&&(n%10)===0)
return'many';if(n==2)
return'two';if(n==1)
return'one';return'other';},'3':function(n){if(n==1)
return'one';return'other';},'4':function(n){if((isBetween(n,0,1)))
return'one';return'other';},'5':function(n){if((isBetween(n,0,2))&&n!=2)
return'one';return'other';},'6':function(n){if(n===0)
return'zero';if((n%10)==1&&(n%100)!=11)
return'one';return'other';},'7':function(n){if(n==2)
return'two';if(n==1)
return'one';return'other';},'8':function(n){if((isBetween(n,3,6)))
return'few';if((isBetween(n,7,10)))
return'many';if(n==2)
return'two';if(n==1)
return'one';return'other';},'9':function(n){if(n===0||n!=1&&(isBetween((n%100),1,19)))
return'few';if(n==1)
return'one';return'other';},'10':function(n){if((isBetween((n%10),2,9))&&!(isBetween((n%100),11,19)))
return'few';if((n%10)==1&&!(isBetween((n%100),11,19)))
return'one';return'other';},'11':function(n){if((isBetween((n%10),2,4))&&!(isBetween((n%100),12,14)))
return'few';if((n%10)===0||(isBetween((n%10),5,9))||(isBetween((n%100),11,14)))
return'many';if((n%10)==1&&(n%100)!=11)
return'one';return'other';},'12':function(n){if((isBetween(n,2,4)))
return'few';if(n==1)
return'one';return'other';},'13':function(n){if((isBetween((n%10),2,4))&&!(isBetween((n%100),12,14)))
return'few';if(n!=1&&(isBetween((n%10),0,1))||(isBetween((n%10),5,9))||(isBetween((n%100),12,14)))
return'many';if(n==1)
return'one';return'other';},'14':function(n){if((isBetween((n%100),3,4)))
return'few';if((n%100)==2)
return'two';if((n%100)==1)
return'one';return'other';},'15':function(n){if(n===0||(isBetween((n%100),2,10)))
return'few';if((isBetween((n%100),11,19)))
return'many';if(n==1)
return'one';return'other';},'16':function(n){if((n%10)==1&&n!=11)
return'one';return'other';},'17':function(n){if(n==3)
return'few';if(n===0)
return'zero';if(n==6)
return'many';if(n==2)
return'two';if(n==1)
return'one';return'other';},'18':function(n){if(n===0)
return'zero';if((isBetween(n,0,2))&&n!==0&&n!=2)
return'one';return'other';},'19':function(n){if((isBetween(n,2,10)))
return'few';if((isBetween(n,0,1)))
return'one';return'other';},'20':function(n){if((isBetween((n%10),3,4)||((n%10)==9))&&!(isBetween((n%100),10,19)||isBetween((n%100),70,79)||isBetween((n%100),90,99)))
return'few';if((n%1000000)===0&&n!==0)
return'many';if((n%10)==2&&!isIn((n%100),[12,72,92]))
return'two';if((n%10)==1&&!isIn((n%100),[11,71,91]))
return'one';return'other';},'21':function(n){if(n===0)
return'zero';if(n==1)
return'one';return'other';},'22':function(n){if((isBetween(n,0,1))||(isBetween(n,11,99)))
return'one';return'other';},'23':function(n){if((isBetween((n%10),1,2))||(n%20)===0)
return'one';return'other';},'24':function(n){if((isBetween(n,3,10)||isBetween(n,13,19)))
return'few';if(isIn(n,[2,12]))
return'two';if(isIn(n,[1,11]))
return'one';return'other';}};var index=locales2rules[lang.replace(/-.*$/,'')];if(!(index in pluralRules)){consoleWarn('plural form unknown for ['+lang+']');return function(){return'other';};}
return pluralRules[index];}
gMacros.plural=function(str,param,key,prop){var n=parseFloat(param);if(isNaN(n)){return str;}
var data=gL10nData[key];if(!data){return str;}
if(!gMacros._pluralRules){gMacros._pluralRules=getPluralRules(gLanguage);}
var index='['+gMacros._pluralRules(n)+']';if(n===0&&(prop+'[zero]')in data){str=data[prop+'[zero]'];}else if(n==1&&(prop+'[one]')in data){str=data[prop+'[one]'];}else if(n==2&&(prop+'[two]')in data){str=data[prop+'[two]'];}else if((prop+index)in data){str=data[prop+index];}else if((prop+'[other]')in data){str=data[prop+'[other]'];}
return str;};var reArgs=/\{\{\s*(.+?)\s*\}\}/;var reIndex=/\{\[\s*([a-zA-Z]+)\(([a-zA-Z]+)\)\s*\]\}/;function getL10nData(key,args){var data=gL10nData[key];if(!data){return null;}
var rv={};for(var prop in data){var str=data[prop];str=substIndexes(str,args,key,prop);str=substArguments(str,args,key);rv[prop]=str;}
return rv;}
function getL10nArgs(str){var args=[];var match=reArgs.exec(str);while(match&&match.length>=2){args.push({name:match[1],subst:match[0]});str=str.substr(match.index+match[0].length);match=reArgs.exec(str);}
return args;}
function getSubDictionary(fragment){if(!fragment){return JSON.parse(JSON.stringify(gL10nData));}
var dict={};var elements=getTranslatableChildren(fragment);function checkGlobalArguments(str){var match=getL10nArgs(str);for(var i=0;i<match.length;i++){var arg=match[i].name;if(arg in gL10nData){dict[arg]=gL10nData[arg];}}}
for(var i=0,l=elements.length;i<l;i++){var id=getL10nAttributes(elements[i]).id;var data=gL10nData[id];if(!id||!data){continue;}
dict[id]=data;for(var prop in data){var str=data[prop];checkGlobalArguments(str);if(reIndex.test(str)){for(var j=0;j<kPluralForms.length;j++){var key=id+'['+kPluralForms[j]+']';if(key in gL10nData){dict[key]=gL10nData[key];checkGlobalArguments(gL10nData[key]);}}}}}
return dict;}
function substIndexes(str,args,key,prop){var reMatch=reIndex.exec(str);if(!reMatch||!reMatch.length){return str;}
var macroName=reMatch[1];var paramName=reMatch[2];var param;if(args&&paramName in args){param=args[paramName];}else if(paramName in gL10nData){param=gL10nData[paramName];}
if(macroName in gMacros){var macro=gMacros[macroName];str=macro(str,param,key,prop);}
return str;}
function substArguments(str,args,key){var match=getL10nArgs(str);for(var i=0;i<match.length;i++){var sub,arg=match[i].name;if(args&&arg in args){sub=args[arg];}else if(arg in gL10nData){sub=gL10nData[arg]['_'];}else{consoleLog('argument {{'+arg+'}} for #'+key+' is undefined.');return str;}
str=str.replace(match[i].subst,sub);}
return str;}
function translateElement(element){var l10n=getL10nAttributes(element);if(!l10n.id){return true;}
var data=getL10nData(l10n.id,l10n.args);if(!data){return false;}
for(var k in data){if(k==='_'){setTextContent(element,data._);}else{var idx=k.lastIndexOf('.');var nestedProp=k.substr(0,idx);if(gNestedProps.indexOf(nestedProp)>-1){element[nestedProp][k.substr(idx+1)]=data[k];}else if(k==='ariaLabel'){element.setAttribute('aria-label',data[k]);}else{element[k]=data[k];}}}
return true;}
function translateElements(elements){var untranslated=[];for(var i=0,l=elements.length;i<l;i++){if(!translateElement(elements[i])){untranslated.push(elements[i]);}}
return untranslated;}
function translateFragment(element){element=element||document.documentElement;var untranslated=translateElements(getTranslatableChildren(element));if(!translateElement(element)){untranslated.push(element);}
return untranslated;}
function localizeElement(element,id,args){if(!element){return;}
if(!id){element.removeAttribute('data-l10n-id');element.removeAttribute('data-l10n-args');setTextContent(element,'');return;}
element.setAttribute('data-l10n-id',id);if(args&&typeof args==='object'){element.setAttribute('data-l10n-args',JSON.stringify(args));}else{element.removeAttribute('data-l10n-args');}
if(gReadyState==='complete'){translateElement(element);}}
function l10nStartup(){gDefaultLocale=document.documentElement.lang||gDefaultLocale;gReadyState='interactive';consoleLog('loading ['+navigator.language+'] resources, '+
(gAsyncResourceLoading?'asynchronously.':'synchronously.'));var translationRequired=(document.documentElement.lang!==navigator.language);loadLocale(navigator.language,translationRequired);}
if(typeof(document)!=='undefined'){if(document.readyState==='complete'||document.readyState==='interactive'){window.setTimeout(l10nStartup);}else{document.addEventListener('DOMContentLoaded',l10nStartup);}}
if('mozSettings'in navigator&&navigator.mozSettings){navigator.mozSettings.addObserver('language.current',function(event){loadLocale(event.settingValue,true);});}
navigator.mozL10n={get:function l10n_get(key,args){var data=getL10nData(key,args);if(!data){consoleWarn('#'+key+' is undefined.');return'';}else{return data._;}},get language(){return{get code(){return gLanguage;},set code(lang){loadLocale(lang,true);},get direction(){var rtlList=['ar','he','fa','ps','ur'];return(rtlList.indexOf(gLanguage)>=0)?'rtl':'ltr';}};},translate:translateFragment,localize:localizeElement,getDictionary:getSubDictionary,get readyState(){return gReadyState;},ready:function l10n_ready(callback){if(!callback){return;}
if(gReadyState=='complete'){window.setTimeout(callback);}else{window.addEventListener('localized',callback);}}};consoleLog('library loaded.');})(this);;'use strict';navigator.mozL10n.DateTimeFormat=function(locales,options){var _=navigator.mozL10n.get;function localeFormat(d,format){var tokens=format.match(/(%E.|%O.|%.)/g);for(var i=0;tokens&&i<tokens.length;i++){var value='';switch(tokens[i]){case'%a':value=_('weekday-'+d.getDay()+'-short');break;case'%A':value=_('weekday-'+d.getDay()+'-long');break;case'%b':case'%h':value=_('month-'+d.getMonth()+'-short');break;case'%B':value=_('month-'+d.getMonth()+'-long');break;case'%Eb':value=_('month-'+d.getMonth()+'-genitive');break;case'%I':value=d.getHours()%12||12;break;case'%e':value=d.getDate();break;case'%p':value=d.getHours()<12?'AM':'PM';break;case'%c':case'%x':case'%X':var tmp=_('dateTimeFormat_'+tokens[i]);if(tmp&&!(/(%c|%x|%X)/).test(tmp)){value=localeFormat(d,tmp);}
break;}
format=format.replace(tokens[i],value||d.toLocaleFormat(tokens[i]));}
return format;}
function relativeParts(seconds){seconds=Math.abs(seconds);var descriptors={};var units=['years',86400*365,'months',86400*30,'weeks',86400*7,'days',86400,'hours',3600,'minutes',60];if(seconds<60){return{minutes:Math.round(seconds/60)};}
for(var i=0,uLen=units.length;i<uLen;i+=2){var value=units[i+1];if(seconds>=value){descriptors[units[i]]=Math.floor(seconds/value);seconds-=descriptors[units[i]]*value;}}
return descriptors;}
function prettyDate(time,useCompactFormat,maxDiff){maxDiff=maxDiff||86400*10;switch(time.constructor){case String:time=parseInt(time);break;case Date:time=time.getTime();break;}
var secDiff=(Date.now()-time)/1000;if(isNaN(secDiff)){return _('incorrectDate');}
if(secDiff>maxDiff){return localeFormat(new Date(time),'%x');}
var f=useCompactFormat?'-short':'-long';var parts=relativeParts(secDiff);var affix=secDiff>=0?'-ago':'-until';for(var i in parts){return _(i+affix+f,{value:parts[i]});}}
return{localeDateString:function localeDateString(d){return localeFormat(d,'%x');},localeTimeString:function localeTimeString(d){return localeFormat(d,'%X');},localeString:function localeString(d){return localeFormat(d,'%c');},localeFormat:localeFormat,fromNow:prettyDate,relativeParts:relativeParts};};;'use strict';var LazyLoader=(function(){function LazyLoader(){this._loaded={};this._isLoading={};}
LazyLoader.prototype={_js:function(file,callback){var script=document.createElement('script');script.src=file;script.async=false;script.addEventListener('load',callback);document.head.appendChild(script);this._isLoading[file]=script;},_css:function(file,callback){var style=document.createElement('link');style.type='text/css';style.rel='stylesheet';style.href=file;document.head.appendChild(style);callback();},_html:function(domNode,callback){if(domNode.getAttribute('is')){this.load(['/shared/js/html_imports.js'],function(){HtmlImports.populate(callback);}.bind(this));return;}
for(var i=0;i<domNode.childNodes.length;i++){if(domNode.childNodes[i].nodeType==document.COMMENT_NODE){domNode.innerHTML=domNode.childNodes[i].nodeValue;break;}}
callback();},load:function(files,callback){if(!Array.isArray(files))
files=[files];var loadsRemaining=files.length,self=this;function perFileCallback(file){if(self._isLoading[file])
delete self._isLoading[file];self._loaded[file]=true;if(--loadsRemaining===0){if(callback)
callback();}}
for(var i=0;i<files.length;i++){var file=files[i];if(this._loaded[file]){perFileCallback(file);}else if(this._isLoading[file]){this._isLoading[file].addEventListener('load',perFileCallback.bind(null,file));}else{var method,idx;if(typeof file==='string'){method=file.match(/\.([^.]+)$/)[1];idx=file;}else{method='html';idx=file.id;}
this['_'+method](file,perFileCallback.bind(null,idx));}}}};return new LazyLoader();}());;'use strict';function monitorChildVisibility(container,scrollmargin,scrolldelta,onscreenCallback,offscreenCallback)
{var firstOnscreen=null,lastOnscreen=null;var firstNotifiedOnscreen=null,lastNotifiedOnscreen=null;var pendingCallbacks=null;var lastScrollTop=-1;container.addEventListener('scroll',scrollHandler);window.addEventListener('resize',resizeHandler);var observer=new MutationObserver(mutationHandler);observer.observe(container,{childList:true});adjustBounds();callCallbacks();return{stop:function stop(){container.removeEventListener('scroll',scrollHandler);window.removeEventListener('resize',resizeHandler);observer.disconnect();}};function resizeHandler(){if(container.clientHeight===0){return;}
adjustBounds();callCallbacks();}
function mutationHandler(mutations){if(container.clientHeight===0){return;}
if(pendingCallbacks)
callCallbacks();for(var i=0;i<mutations.length;i++){var mutation=mutations[i];if(mutation.addedNodes){for(var j=0;j<mutation.addedNodes.length;j++){var child=mutation.addedNodes[j];if(child.nodeType===Node.ELEMENT_NODE)
childAdded(child);}}
if(mutation.removedNodes){for(var j=0;j<mutation.removedNodes.length;j++){var child=mutation.removedNodes[j];if(child.nodeType===Node.ELEMENT_NODE)
childRemoved(child,mutation.previousSibling,mutation.nextSibling);}}}}
function childAdded(child){if(lastOnscreen&&after(child,lastOnscreen)&&child.offsetTop>container.clientHeight+scrollmargin)
return;if(!firstOnscreen||after(child,firstOnscreen)){try{onscreenCallback(child);}
catch(e){console.warn('monitorChildVisiblity: Exception in onscreenCallback:',e,e.stack);}}
adjustBounds();callCallbacks();}
function childRemoved(child,previous,next){if(container.firstElementChild===null){firstOnscreen=lastOnscreen=null;firstNotifiedOnscreen=lastNotifiedOnscreen=null;}
else{if(previous!==null&&after(previous,lastOnscreen))
return;if(child===firstOnscreen){firstOnscreen=firstNotifiedOnscreen=next||previous;}
if(child===lastOnscreen){lastOnscreen=lastNotifiedOnscreen=previous||next;}
adjustBounds();}
callCallbacks();}
function scrollHandler(){if(container.clientHeight===0){return;}
var scrollTop=container.scrollTop;if(Math.abs(scrollTop-lastScrollTop)<scrolldelta){return;}
lastScrollTop=scrollTop;adjustBounds();if(scrolldelta>1){callCallbacks();}else{deferCallbacks();}}
function before(a,b){return!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);}
function after(a,b){return!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_PRECEDING);}
function adjustBounds(){if(container.firstElementChild===null){firstOnscreen=lastOnscreen=null;return;}
var scrollTop=container.scrollTop;var screenTop=scrollTop-scrollmargin;var screenBottom=scrollTop+container.clientHeight+scrollmargin;var BEFORE=-1,ON=0,AFTER=1;function position(child){var childTop=child.offsetTop;var childBottom=childTop+child.offsetHeight;if(childBottom<screenTop)
return BEFORE;if(childTop>screenBottom)
return AFTER;return ON;}
if(!firstOnscreen)
firstOnscreen=container.firstElementChild;var toppos=position(firstOnscreen);if(toppos===ON){var prev=firstOnscreen.previousElementSibling;while(prev&&position(prev)===ON){firstOnscreen=prev;prev=prev.previousElementSibling;}}
else if(toppos===BEFORE){var e=firstOnscreen.nextElementSibling;while(e&&position(e)!==ON){e=e.nextElementSibling;}
firstOnscreen=e;}
else{lastOnscreen=firstOnscreen.previousElementSibling;while(lastOnscreen&&position(lastOnscreen)!==ON)
lastOnscreen=lastOnscreen.previousElementSibling;firstOnscreen=lastOnscreen;prev=firstOnscreen.previousElementSibling;while(prev&&position(prev)===ON){firstOnscreen=prev;prev=prev.previousElementSibling;}
return;}
if(lastOnscreen===null)
lastOnscreen=firstOnscreen;var bottompos=position(lastOnscreen);if(bottompos===ON){var next=lastOnscreen.nextElementSibling;while(next&&position(next)===ON){lastOnscreen=next;next=next.nextElementSibling;}}
else if(bottompos===AFTER){lastOnscreen=lastOnscreen.previousElementSibling;while(position(lastOnscreen)!==ON)
lastOnscreen=lastOnscreen.previousElementSibling;}
else{firstOnscreen=lastOnscreen.nextElementSibling;while(firstOnscreen&&position(firstOnscreen)!==ON){firstOnscreen=firstOnscreen.nextElementSibling;}
lastOnscreen=firstOnscreen;var next=lastOnscreen.nextElementSibling;while(next&&position(next)===ON){lastOnscreen=next;next=next.nextElementSibling;}}}
function deferCallbacks(){if(pendingCallbacks){clearTimeout(pendingCallbacks);}
pendingCallbacks=setTimeout(callCallbacks,0);}
function callCallbacks(){if(pendingCallbacks){clearTimeout(pendingCallbacks);pendingCallbacks=null;}
function onscreen(from,to){var e=from;while(e&&e!==to){try{onscreenCallback(e);}
catch(ex){console.warn('monitorChildVisibility: Exception in onscreenCallback:',ex,ex.stack);}
e=e.nextElementSibling;}}
function offscreen(from,to){var e=from;while(e&&e!==to){try{offscreenCallback(e);}
catch(ex){console.warn('monitorChildVisibility: '+'Exception in offscreenCallback:',ex,ex.stack);}
e=e.nextElementSibling;}}
if(firstOnscreen===firstNotifiedOnscreen&&lastOnscreen===lastNotifiedOnscreen)
return;if(firstNotifiedOnscreen===null){onscreen(firstOnscreen,lastOnscreen.nextElementSibling);}
else if(firstOnscreen===null){}
else if(before(lastOnscreen,firstNotifiedOnscreen)||after(firstOnscreen,lastNotifiedOnscreen)){onscreen(firstOnscreen,lastOnscreen.nextElementSibling);offscreen(firstNotifiedOnscreen,lastNotifiedOnscreen.nextElementSibling);}
else{if(before(firstOnscreen,firstNotifiedOnscreen)){onscreen(firstOnscreen,firstNotifiedOnscreen);}
if(after(lastOnscreen,lastNotifiedOnscreen)){onscreen(lastNotifiedOnscreen.nextElementSibling,lastOnscreen.nextElementSibling);}
if(after(firstOnscreen,firstNotifiedOnscreen)){offscreen(firstNotifiedOnscreen,firstOnscreen);}
if(before(lastOnscreen,lastNotifiedOnscreen)){offscreen(lastOnscreen.nextElementSibling,lastNotifiedOnscreen.nextElementSibling);}}
firstNotifiedOnscreen=firstOnscreen;lastNotifiedOnscreen=lastOnscreen;}};'use strict';this.asyncStorage=(function(){var DBNAME='asyncStorage';var DBVERSION=1;var STORENAME='keyvaluepairs';var db=null;function withStore(type,f){if(db){f(db.transaction(STORENAME,type).objectStore(STORENAME));}else{var openreq=indexedDB.open(DBNAME,DBVERSION);openreq.onerror=function withStoreOnError(){console.error("asyncStorage: can't open database:",openreq.error.name);};openreq.onupgradeneeded=function withStoreOnUpgradeNeeded(){openreq.result.createObjectStore(STORENAME);};openreq.onsuccess=function withStoreOnSuccess(){db=openreq.result;f(db.transaction(STORENAME,type).objectStore(STORENAME));};}}
function getItem(key,callback){withStore('readonly',function getItemBody(store){var req=store.get(key);req.onsuccess=function getItemOnSuccess(){var value=req.result;if(value===undefined)
value=null;callback(value);};req.onerror=function getItemOnError(){console.error('Error in asyncStorage.getItem(): ',req.error.name);};});}
function setItem(key,value,callback){withStore('readwrite',function setItemBody(store){var req=store.put(value,key);if(callback){req.onsuccess=function setItemOnSuccess(){callback();};}
req.onerror=function setItemOnError(){console.error('Error in asyncStorage.setItem(): ',req.error.name);};});}
function removeItem(key,callback){withStore('readwrite',function removeItemBody(store){var req=store.delete(key);if(callback){req.onsuccess=function removeItemOnSuccess(){callback();};}
req.onerror=function removeItemOnError(){console.error('Error in asyncStorage.removeItem(): ',req.error.name);};});}
function clear(callback){withStore('readwrite',function clearBody(store){var req=store.clear();if(callback){req.onsuccess=function clearOnSuccess(){callback();};}
req.onerror=function clearOnError(){console.error('Error in asyncStorage.clear(): ',req.error.name);};});}
function length(callback){withStore('readonly',function lengthBody(store){var req=store.count();req.onsuccess=function lengthOnSuccess(){callback(req.result);};req.onerror=function lengthOnError(){console.error('Error in asyncStorage.length(): ',req.error.name);};});}
function key(n,callback){if(n<0){callback(null);return;}
withStore('readonly',function keyBody(store){var advanced=false;var req=store.openCursor();req.onsuccess=function keyOnSuccess(){var cursor=req.result;if(!cursor){callback(null);return;}
if(n===0){callback(cursor.key);}else{if(!advanced){advanced=true;cursor.advance(n);}else{callback(cursor.key);}}};req.onerror=function keyOnError(){console.error('Error in asyncStorage.key(): ',req.error.name);};});}
return{getItem:getItem,setItem:setItem,removeItem:removeItem,clear:clear,length:length,key:key};}());;'use strict';function getVideoRotation(blob,rotationCallback){function MP4Parser(blob,handlers){BlobView.get(blob,0,Math.min(1024,blob.size),function(data,error){if(data.byteLength<=8||data.getASCIIText(4,4)!=='ftyp'){handlers.errorHandler('not an MP4 file');return;}
parseAtom(data);});function parseAtom(data){var offset=data.sliceOffset+data.viewOffset;var size=data.readUnsignedInt();var type=data.readASCIIText(4);var contentOffset=8;if(size===0){size=blob.size-offset;}
else if(size===1){size=data.readUnsignedInt()*4294967296+data.readUnsignedInt();contentOffset=16;}
var handler=handlers[type]||handlers.defaultHandler;if(typeof handler==='function'){data.getMore(data.sliceOffset+data.viewOffset,size,function(atom){var rv=handler(atom);if(rv!=='done'){parseAtomAt(data,offset+size);}});}
else if(handler==='children'){var skip=(type==='meta')?4:0;parseAtomAt(data,offset+contentOffset+skip);}
else if(handler==='skip'||!handler){parseAtomAt(data,offset+size);}
else if(handler==='done'){return;}}
function parseAtomAt(data,offset){if(offset>=blob.size){if(handlers.eofHandler)
handlers.eofHandler();return;}
else{data.getMore(offset,16,parseAtom);}}}
MP4Parser(blob,{errorHandler:function(msg){rotationCallback(msg);},eofHandler:function(){rotationCallback(null);},defaultHandler:'skip',moov:'children',trak:'children',tkhd:function(data){data.advance(48);var a=data.readUnsignedInt();var b=data.readUnsignedInt();data.advance(4);var c=data.readUnsignedInt();var d=data.readUnsignedInt();if(a===0&&d===0){if(b===0x00010000&&c===0xFFFF0000)
rotationCallback(90);else if(b===0xFFFF0000&&c===0x00010000)
rotationCallback(270);else
rotationCallback('unexpected rotation matrix');}
else if(b===0&&c===0){if(a===0x00010000&&d===0x00010000)
rotationCallback(0);else if(a===0xFFFF0000&&d===0xFFFF0000)
rotationCallback(180);else
rotationCallback('unexpected rotation matrix');}
else{rotationCallback('unexpected rotation matrix');}
return'done';}});};'use strict';var CustomDialog=(function(){var screen=null;var dialog=null;var header=null;var message=null;var yes=null;var no=null;var lastRemove=null;return{hide:function dialog_hide(){if(screen===null)
return;document.body.removeChild(screen);screen=null;dialog=null;header=null;message=null;yes=null;no=null;},show:function dialog_show(title,msg,cancel,confirm){if(screen===null){screen=document.createElement('form');screen.setAttribute('role','dialog');screen.setAttribute('data-type','confirm');screen.id='dialog-screen';dialog=document.createElement('section');screen.appendChild(dialog);var decorateWithOptions=function cd_decorateWithOptions(type,options,elm,dialog){if('string'===typeof options){elm.textContent=options;return elm;}
var text=options[type];var icon=options.icon;elm.textContent=text;if(icon&&''!==icon){var iconImg=new Image();iconImg.src=icon;iconImg.classList.add('custom-dialog-'+type+'-icon');elm.insertBefore(iconImg,elm.firstChild);}
return elm;};header=document.createElement('h1');header.id='dialog-title';if(title&&title!=''){header=decorateWithOptions('title',title,header,dialog);}
dialog.appendChild(header);message=document.createElement('p');message.id='dialog-message';message=decorateWithOptions('message',msg,message,dialog);dialog.appendChild(message);var menu=document.createElement('menu');menu.dataset['items']=1;no=document.createElement('button');no.type='button';var noText=document.createTextNode(cancel.title);no.appendChild(noText);no.id='dialog-no';no.addEventListener('click',clickHandler);menu.appendChild(no);if(confirm){menu.dataset['items']=2;yes=document.createElement('button');yes.type='button';var yesText=document.createTextNode(confirm.title);yes.appendChild(yesText);yes.id='dialog-yes';yes.className=confirm.recommend?'recommend':'danger';yes.addEventListener('click',clickHandler);menu.appendChild(yes);}
else{no.classList.add('full');}
screen.appendChild(menu);document.body.appendChild(screen);}
screen.classList.add('visible');function clickHandler(evt){screen.classList.remove('visible');if(evt.target===yes&&confirm.callback){confirm.callback();}else if(evt.target===no&&cancel.callback){cancel.callback();}}},adjustZIndex:function adjustZIndex(){var self=this;if(screen===null)
return;screen.classList.add('volume-warning');window.clearTimeout(lastRemove);lastRemove=window.setTimeout(function(){if(screen===null)
return;screen.classList.remove('volume-warning');self.hide();},3000);}};}());;'use strict';var Normalizer={initAsciiNormalizer:function normalizer_init(){var equivalentChars={'a':'áăǎâäȧạȁàảȃāąåḁⱥãǽǣæ','A':'ÁĂǍÂÄȦẠȀÀẢȂĀĄÅḀȺÃǼǢÆ','b':'ḃḅɓḇƀƃ','B':'ḂḄƁḆɃƂ','c':'ćčçĉċƈȼ','C':'ĆČÇĈĊƇȻ','d':'ďḑḓḋḍɗḏđƌð','D':'ĎḐḒḊḌƊḎĐƋ','e':'éĕěȩêḙëėẹȅèẻȇēę','E':'ÉĔĚȨÊḘËĖẸȄÈẺȆĒĘ','f':'ḟƒ','F':'ḞƑ','g':'ǵğǧģĝġɠḡǥ','G':'ǴĞǦĢĜĠƓḠǤ','h':'ḫȟḩĥⱨḧḣḥħ','H':'ḪȞḨĤⱧḦḢḤĦ','i':'íĭǐîïịȉìỉȋīįɨĩḭı','I':'ÍĬǏÎÏỊȈÌỈȊĪĮƗĨḬ','j':'ĵɉ','J':'ĴɈ','k':'ḱǩķⱪꝃḳƙḵꝁ','K':'ḰǨĶⱩꝂḲƘḴꝀ','l':'ĺƚľļḽḷⱡꝉḻŀɫł','L':'ĹȽĽĻḼḶⱠꝈḺĿⱢŁ','m':'ḿṁṃɱ','M':'ḾṀṂⱮ','n':'ńňņṋṅṇǹɲṉƞñ','N':'ŃŇŅṊṄṆǸƝṈȠÑ','o':'óŏǒôöȯọőȍòỏơȏꝋꝍōǫøõœ','O':'ÓŎǑÔÖȮỌŐȌÒỎƠȎꝊꝌŌǪØÕŒ','p':'ṕṗꝓƥᵽꝑ','P':'ṔṖꝒƤⱣꝐ','q':'ꝗ','Q':'Ꝗ','r':'ŕřŗṙṛȑȓṟɍɽ','R':'ŔŘŖṘṚȐȒṞɌⱤ','s':'śšşŝșṡṣß$','S':'ŚŠŞŜȘṠṢ','t':'ťţṱțⱦṫṭƭṯʈŧ','T':'ŤŢṰȚȾṪṬƬṮƮŦ','u':'úŭǔûṷüṳụűȕùủưȗūųůũṵ','U':'ÚŬǓÛṶÜṲỤŰȔÙỦƯȖŪŲŮŨṴ','v':'ṿʋṽ','V':'ṾƲṼ','w':'ẃŵẅẇẉẁⱳ','W':'ẂŴẄẆẈẀⱲ','x':'ẍẋ','X':'ẌẊ','y':'ýŷÿẏỵỳƴỷỿȳɏỹ','Y':'ÝŶŸẎỴỲƳỶỾȲɎỸ','z':'źžẑⱬżẓȥẕƶ','Z':'ŹŽẐⱫŻẒȤẔƵ'};this._toAsciiForm={};for(var letter in equivalentChars){var accentedForms=equivalentChars[letter];for(var i=accentedForms.length-1;i>=0;i--)
this._toAsciiForm[accentedForms[i]]=letter;}},toAscii:function normalizer_toAscii(str){if(!str||typeof str!='string')
return'';if(!this._toAsciiForm)
Normalizer.initAsciiNormalizer();var result='';for(var i=0,len=str.length;i<len;i++)
result+=this._toAsciiForm[str.charAt(i)]||str.charAt(i);return result;},escapeHTML:function normalizer_escapeHTML(str,escapeQuotes){if(Array.isArray(str)){return Normalizer.escapeHTML(str.join(' '),escapeQuotes);}
if(!str||typeof str!='string')
return'';var escaped=str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');if(escapeQuotes)
return escaped.replace(/"/g,'&quot;').replace(/'/g,'&#x27;');return escaped;},escapeRegExp:function normalizer_escapeRegExp(str){return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,'\\$&');}};;'use strict';function enumerateAll(storages,dir,options){var storageIndex=0;var ds_cursor=null;var cursor={continue:function cursor_continue(){ds_cursor.continue();}};function enumerateNextStorage(){ds_cursor=storages[storageIndex].enumerate(dir,options||{});ds_cursor.onsuccess=onsuccess;ds_cursor.onerror=onerror;};function onsuccess(e){cursor.result=e.target.result;if(!cursor.result){storageIndex++;if(storageIndex<storages.length){enumerateNextStorage();return;}}
if(cursor.onsuccess){try{cursor.onsuccess(e);}catch(err){console.warn('enumerateAll onsuccess threw',err);}}};function onerror(e){cursor.error=e.target.error;if(cursor.onerror){try{cursor.onerror(e);}catch(err){console.warn('enumerateAll onerror threw',err);}}};enumerateNextStorage();return cursor;};'use strict';var MediaUtils={_:navigator.mozL10n.get,formatDate:function(timestamp){if(!timestamp||timestamp===undefined||isNaN(timestamp)){return;}
var dtf=new navigator.mozL10n.DateTimeFormat();return dtf.localeFormat(new Date(timestamp),this._('dateTimeFormat_%x'));},formatSize:function(size){if(!size||size===undefined||isNaN(size)){return;}
var units=['B','KB','MB','GB','TB','PB','EB','ZB','YB'];var i=0;while(size>=1024&&i<units.length){size/=1024;++i;}
var sizeString=size.toFixed((size<1024*1024)?0:1);var sizeDecimal=parseFloat(sizeString);return sizeDecimal+' '+this._('byteUnit-'+units[i]);},formatDuration:function(duration){function padLeft(num,length){var r=String(num);while(r.length<length){r='0'+r;}
return r;}
var minutes=Math.floor(duration/60);var seconds=Math.floor(duration%60);if(minutes<60){return padLeft(minutes,2)+':'+padLeft(seconds,2);}
var hours=Math.floor(minutes/60);minutes=Math.floor(minutes%60);return hours+':'+padLeft(minutes,2)+':'+padLeft(seconds,2);},populateMediaInfo:function(data){for(var id in data){if(data.hasOwnProperty(id)){var element=document.getElementById(id);if(element)
element.textContent=data[id];}}},binarySearch:function(array,element,comparator,from,to){if(comparator===undefined)
comparator=function(a,b){return a-b;};if(from===undefined)
return MediaUtils.binarySearch(array,element,comparator,0,array.length);if(from===to)
return from;var mid=Math.floor((from+to)/2);var result=comparator(element,array[mid]);if(result<0)
return MediaUtils.binarySearch(array,element,comparator,from,mid);else
return MediaUtils.binarySearch(array,element,comparator,mid+1,to);}};;'use strict';var BlobView=(function(){function fail(msg){throw Error(msg);}
function BlobView(blob,sliceOffset,sliceLength,slice,viewOffset,viewLength,littleEndian)
{this.blob=blob;this.sliceOffset=sliceOffset;this.sliceLength=sliceLength;this.slice=slice;this.viewOffset=viewOffset;this.viewLength=viewLength;this.littleEndian=littleEndian;this.view=new DataView(slice,viewOffset,viewLength);this.buffer=slice;this.byteLength=viewLength;this.byteOffset=viewOffset;this.index=0;}
BlobView.get=function(blob,offset,length,callback,littleEndian){if(offset<0)
fail('negative offset');if(length<0)
fail('negative length');if(offset>blob.size)
fail('offset larger than blob size');if(mediaChanged&&!renameScan){dump('lxp:: mediaChanged = '+mediaChanged);callback(null,null);return;}
if(offset+length>blob.size)
length=blob.size-offset;var slice=blob.slice(offset,offset+length);var reader=new FileReader();reader.readAsArrayBuffer(slice);reader.onloadend=function(){var result=null;if(reader.result){result=new BlobView(blob,offset,length,reader.result,0,length,littleEndian||false);}
callback(result,reader.error);};};BlobView.prototype={constructor:BlobView,getMore:function(offset,length,callback){if(offset>=this.sliceOffset&&offset+length<=this.sliceOffset+this.sliceLength){callback(new BlobView(this.blob,this.sliceOffset,this.sliceLength,this.slice,offset-this.sliceOffset,length,this.littleEndian));}
else{BlobView.get(this.blob,offset,length,callback,this.littleEndian);}},littleEndian:function(){this.littleEndian=true;},bigEndian:function(){this.littleEndian=false;},getUint8:function(offset){return this.view.getUint8(offset);},getInt8:function(offset){return this.view.getInt8(offset);},getUint16:function(offset,le){return this.view.getUint16(offset,le!==undefined?le:this.littleEndian);},getInt16:function(offset,le){return this.view.getInt16(offset,le!==undefined?le:this.littleEndian);},getUint32:function(offset,le){return this.view.getUint32(offset,le!==undefined?le:this.littleEndian);},getInt32:function(offset,le){return this.view.getInt32(offset,le!==undefined?le:this.littleEndian);},getFloat32:function(offset,le){return this.view.getFloat32(offset,le!==undefined?le:this.littleEndian);},getFloat64:function(offset,le){return this.view.getFloat64(offset,le!==undefined?le:this.littleEndian);},readByte:function(){return this.view.getInt8(this.index++);},readUnsignedByte:function(){return this.view.getUint8(this.index++);},readShort:function(le){var val=this.view.getInt16(this.index,le!==undefined?le:this.littleEndian);this.index+=2;return val;},readUnsignedShort:function(le){var val=this.view.getUint16(this.index,le!==undefined?le:this.littleEndian);this.index+=2;return val;},readInt:function(le){var val=this.view.getInt32(this.index,le!==undefined?le:this.littleEndian);this.index+=4;return val;},readUnsignedInt:function(le){var val=this.view.getUint32(this.index,le!==undefined?le:this.littleEndian);this.index+=4;return val;},readFloat:function(le){var val=this.view.getFloat32(this.index,le!==undefined?le:this.littleEndian);this.index+=4;return val;},readDouble:function(le){var val=this.view.getFloat64(this.index,le!==undefined?le:this.littleEndian);this.index+=8;return val;},tell:function(){return this.index;},seek:function(index){if(index<0)
fail('negative index');if(index>=this.byteLength)
fail('index greater than buffer size');this.index=index;},advance:function(n){var index=this.index+n;if(index<0)
fail('advance past beginning of buffer');if(index>this.byteLength)
fail('advance past end of buffer');this.index=index;},getUnsignedByteArray:function(offset,n){return new Uint8Array(this.buffer,offset+this.viewOffset,n);},readUnsignedByteArray:function(n){var val=new Uint8Array(this.buffer,this.index+this.viewOffset,n);this.index+=n;return val;},getBit:function(offset,bit){var byte=this.view.getUint8(offset);return(byte&(1<<bit))!==0;},getUint24:function(offset,le){var b1,b2,b3;if(le!==undefined?le:this.littleEndian){b1=this.view.getUint8(offset);b2=this.view.getUint8(offset+1);b3=this.view.getUint8(offset+2);}
else{b3=this.view.getUint8(offset);b2=this.view.getUint8(offset+1);b1=this.view.getUint8(offset+2);}
return(b3<<16)+(b2<<8)+b1;},readUint24:function(le){var value=this.getUint24(this.index,le);this.index+=3;return value;},getASCIIText:function(offset,len){var bytes=new Uint8Array(this.buffer,offset+this.viewOffset,len);return String.fromCharCode.apply(String,bytes);},readASCIIText:function(len){var bytes=new Uint8Array(this.buffer,this.index+this.viewOffset,len);this.index+=len;return String.fromCharCode.apply(String,bytes);},getUTF8Text:function(offset,len){function fail(){throw new Error('Illegal UTF-8');}
var pos=offset;var end=offset+len;var charcode;var s='';var b1,b2,b3,b4;while(pos<end){var b1=this.view.getUint8(pos);if(b1<128){s+=String.fromCharCode(b1);pos+=1;}
else if(b1<194){fail();}
else if(b1<224){if(pos+1>=end)
fail();b2=this.view.getUint8(pos+1);if(b2<128||b2>191)
fail();charcode=((b1&0x1f)<<6)+(b2&0x3f);s+=String.fromCharCode(charcode);pos+=2;}
else if(b1<240){if(pos+2>=end)
fail();b2=this.view.getUint8(pos+1);if(b2<128||b2>191)
fail();b3=this.view.getUint8(pos+2);if(b3<128||b3>191)
fail();charcode=((b1&0x0f)<<12)+((b2&0x3f)<<6)+(b3&0x3f);s+=String.fromCharCode(charcode);pos+=3;}
else if(b1<245){if(pos+3>=end)
fail();b2=this.view.getUint8(pos+1);if(b2<128||b2>191)
fail();b3=this.view.getUint8(pos+2);if(b3<128||b3>191)
fail();b4=this.view.getUint8(pos+3);if(b4<128||b4>191)
fail();charcode=((b1&0x07)<<18)+
((b2&0x3f)<<12)+
((b3&0x3f)<<6)+
(b4&0x3f);charcode-=0x10000;s+=String.fromCharCode(0xd800+((charcode&0x0FFC00)>>>10));s+=String.fromCharCode(0xdc00+(charcode&0x0003FF));pos+=4;}
else{fail();}}
return s;},readUTF8Text:function(len){try{return this.getUTF8Text(this.index,len);}
finally{this.index+=len;}},getID3Uint28BE:function(offset){var b1=this.view.getUint8(offset)&0x7f;var b2=this.view.getUint8(offset+1)&0x7f;var b3=this.view.getUint8(offset+2)&0x7f;var b4=this.view.getUint8(offset+3)&0x7f;return(b1<<21)|(b2<<14)|(b3<<7)|b4;},readID3Uint28BE:function(){var value=this.getID3Uint28BE(this.index);this.index+=4;return value;},readNullTerminatedLatin1Text:function(size){var s='';for(var i=0;i<size;i++){var charcode=this.view.getUint8(this.index+i);if(charcode===0){i++;break;}
s+=String.fromCharCode(charcode);}
this.index+=i;return s;},readNullTerminatedUTF8Text:function(size){for(var len=0;len<size;len++){if(this.view.getUint8(this.index+len)===0)
break;}
var s=this.readUTF8Text(len);if(len<size)
this.advance(1);return s;},readNullTerminatedUTF16Text:function(size,le){if(le==null){var BOM=this.readUnsignedShort();size-=2;if(BOM===0xFEFF)
le=false;else
le=true;}
var s='';for(var i=0;i<size;i+=2){var charcode=this.getUint16(this.index+i,le);if(charcode===0){i+=2;break;}
s+=String.fromCharCode(charcode);}
this.index+=i;return s;}};return{get:BlobView.get};}());;'use strict';var Volume=function(name,external,externalIndex,storages){console.log('lxp:: new  name = '+name+'--> external = '+external);this.name=name;this.external=external;this.externalIndex=externalIndex;this.storages=storages;this.sizeElement=null;};Volume.prototype.createView=function volume_createView(listRoot){var _=navigator.mozL10n.get;var li=document.createElement('li');if(this.external){li.id='sdcard-'+this.externalIndex;}else{li.id='internal-sdcard';}
var a=document.createElement('a');if(this.external){a.id='option-sdcard-'+this.externalIndex;a.dataset.action='sdcard-'+this.externalIndex;}else{a.id='option-internal-sdcard';a.dataset.action='internal-sdcard';}
a.href='#sdcardList';var img=document.createElement('img');if(this.external){img.src='style/images/SD.png';}else{img.src='style/images/USB.png';}
a.appendChild(img);var span1=document.createElement('span');if(this.external){span1.id='sdcard-'+this.externalIndex+'-name';span1.dataset.l10nId='sdcard-'+this.externalIndex+'-name';span1.textContent=_('sdcard-'+this.externalIndex+'-name');console.log('lxp:: new span1.dataset.l10nId = '+span1.dataset.l10nId);}else{span1.id='internal-sdcard-name';span1.dataset.l10nId='internal-sdcard-name';span1.textContent=_('internal-sdcard-name');console.log('lxp:: new span1.dataset.l10nId = '+span1.dataset.l10nId);}
a.appendChild(span1);this.sizeElement=document.createElement('span');if(this.external){this.sizeElement.id='sdcard-'+this.externalIndex+'-size';this.sizeElement.dataset.l10nId='sdcard-'+this.externalIndex+'-size';}else{this.sizeElement.id='internal-sdcard-size';this.sizeElement.dataset.l10nId='internal-sdcard-size';}
a.appendChild(this.sizeElement);li.appendChild(a);listRoot.appendChild(li);};Volume.prototype.updateStorageInfo=function volume_updateStorageInfo(){if(this.sizeElement.parentNode.parentNode.classList.contains('hidden')){this.sizeElement.parentNode.parentNode.classList.remove('hidden');}
var self=this;this.getSpace(function(usedSpace,freeSpace){var element=self.sizeElement;DeviceStorageHelper.showFormatedSize(element,'storageSize',usedSpace,freeSpace);});};Volume.prototype.getSpace=function volume_getStats(callback){var self=this;this.storages.freeSpace().onsuccess=function(e){var freeSpace=e.target.result;self.storages.usedSpace().onsuccess=function(e){var usedSpace=e.target.result;if(callback)
callback(usedSpace,freeSpace);};};};Volume.prototype.updateInfo=function volume_updateInfo(callback){var self=this;var availreq=this.storages.available();availreq.onsuccess=function availSuccess(evt){var state=evt.target.result;switch(state){case'shared':break;case'unavailable':console.log('lxp:: unavailable name = '+self.name);self.setInfoUnavailable();if(currentView==='option-sdcard-0'){window.location.hash='#root';}
break;case'available':console.log('lxp:: available name = '+self.name);self.updateStorageInfo();break;}
if(callback)
callback(state);};};Volume.prototype.setInfoUnavailable=function volume_setInfoUnavailable(){this.sizeElement.parentNode.parentNode.classList.add('hidden');};var MediaStorage={init:function ms_init(){this._volumeList=this.initAllVolumeObjects();volumeList=this._volumeList;this.documentStorageListener=false;this.updateListeners();document.addEventListener('visibilitychange',this);window.addEventListener('localized',this);this.updateInfo();},initAllVolumeObjects:function ms_initAllVolumeObjects(){var volumes={};var totalVolumes=0;var storages=navigator.getDeviceStorages('extrasdcard');storages.forEach(function(storage){var name=storage.storageName;if(!volumes.hasOwnProperty(name)){volumes[name]={};totalVolumes++;}
volumes[name]=storage;});var volumeList=[];var externalIndex=0;var volumeListRootElement=document.querySelector('#storage > article > ul');for(var name in volumes){var volume;if(totalVolumes>1&&name==='sdcard'){volume=new Volume(name,false,0,volumes[name]);}else{volume=new Volume(name,true,externalIndex++,volumes[name]);}
volume.createView(volumeListRootElement);volumeList.push(volume);}
return volumeList;},handleEvent:function ms_handleEvent(evt){switch(evt.type){case'localized':case'change':this.updateInfo();break;case'visibilitychange':this.updateListeners(this.updateInfo.bind(this));break;}},updateListeners:function ms_updateListeners(callback){var self=this;if(document.hidden){if(this.documentStorageListener){this._volumeList.forEach(function(volume){var volumeStorage=volume.storages;volumeStorage.removeEventListener('change',self);});this.documentStorageListener=false;}}else{if(!this.documentStorageListener){this._volumeList.forEach(function(volume){var volumeStorage=volume.storages;volumeStorage.addEventListener('change',self);});this.documentStorageListener=true;}
if(callback)
callback();}},updateInfo:function ms_updateInfo(){var self=this;this._volumeList.forEach(function(volume){volume.updateInfo();});}};function updateInfo(volumeList){var storageListElement=document.querySelectorAll('#storage > article > ul li');if(!storageListElement||storageListElement==null){return;}
volumeList.forEach(function(volume){volume.updateInfo();});if($('fresh-button').classList.contains('freshing')){setTimeout(function(){console.log('lxp:: update fresh-button');for(var i=0;i<storageListElement.length;i++){storageListElement[i].classList.remove('disabled');}
$('fresh-button').classList.remove('freshing');},1000);}}
function getInternalStorage(volumeList){for(var i=0,len=volumeList.length;i<len;i++){if(len>1&&volumeList[i].name==='sdcard'){return volumeList[i].storages;}}}
function getSdcard(volumeList){for(var i=0,len=volumeList.length;i<len;i++){if(len>1&&volumeList[i].name==='sdcard'){console.log('lxp:: this is internal storage');continue;}else{return volumeList[i].storages;}}}
function getInternalStorageName(volumeList){var _=navigator.mozL10n.get;for(var i=0,len=volumeList.length;i<len;i++){if(len>1&&volumeList[i].name==='sdcard'){return _('internal-sdcard-name');}}
return'';}
function getSdcardName(volumeList){var _=navigator.mozL10n.get;for(var i=0,len=volumeList.length;i<len;i++){if(len>1&&volumeList[i].name==='sdcard'){console.log('lxp:: this is internal storage');continue;}else{return _('sdcard-0-name');}}
return'';};'use strict';var MediaDB=(function(){function MediaDB(mediaType,metadataParser,options){this.mediaType=mediaType;this.metadataParser=metadataParser;if(!options)
options={};this.indexes=options.indexes||[];this.version=options.version||1;this.mimeTypes=options.mimeTypes;this.autoscan=(options.autoscan!==undefined)?options.autoscan:true;this.state=MediaDB.OPENING;this.scanning=false;this.parsingBigFiles=false;this.updateRecord=options.updateRecord;if(options.excludeFilter&&(options.excludeFilter instanceof RegExp)){this.clientExcludeFilter=options.excludeFilter;}
this.batchHoldTime=options.batchHoldTime||100;this.batchSize=options.batchSize||0;this.dbname='MediaDB/'+this.mediaType+'/';var media=this;this.details={eventListeners:{},pendingInsertions:[],pendingDeletions:[],whenDoneProcessing:[],pendingCreateNotifications:[],pendingDeleteNotifications:[],pendingNotificationTimer:null,newestFileModTime:0};if(!this.metadataParser){this.metadataParser=function(file,callback){setTimeout(function(){callback({});},0);};}
var dbVersion=(0xFFFF&this.version)<<16|(0xFFFF&MediaDB.VERSION);var openRequest=indexedDB.open(this.dbname,dbVersion);openRequest.onerror=function(e){console.error('MediaDB():',openRequest.error.name);};openRequest.onblocked=function(e){console.error('indexedDB.open() is blocked in MediaDB()');};openRequest.onupgradeneeded=function(e){var db=openRequest.result;var transaction=e.target.transaction;var oldVersion=e.oldVersion;var oldDbVersion=0xFFFF&oldVersion;var oldClientVersion=0xFFFF&(oldVersion>>16);if(oldClientVersion===0){oldDbVersion=2;oldClientVersion=oldVersion/oldDbVersion;}
if(0==db.objectStoreNames.length){createObjectStores(db);}else{handleUpgrade(db,transaction,oldDbVersion,oldClientVersion);}};openRequest.onsuccess=function(e){media.db=openRequest.result;media.db.onerror=function(event){console.error('MediaDB: ',event.target.error&&event.target.error.name);};var cursorRequest=media.db.transaction('files','readonly').objectStore('files').index('date').openCursor(null,'prev');cursorRequest.onerror=function(){console.error('MediaDB initialization error',cursorRequest.error);};cursorRequest.onsuccess=function(){var cursor=cursorRequest.result;if(cursor){media.details.newestFileModTime=cursor.value.date;}
else{media.details.newestFileModTime=0;}
initDeviceStorage();};};function createObjectStores(db){var filestore=db.createObjectStore('files',{keyPath:'name'});filestore.createIndex('date','date');media.indexes.forEach(function(indexName){if(indexName==='name'||indexName==='date')
return;filestore.createIndex(indexName,indexName);});}
function enumerateOldFiles(store,callback){var openCursorReq=store.openCursor();openCursorReq.onsuccess=function(){var cursor=openCursorReq.result;if(cursor){callback(cursor.value);cursor.continue();}};}
function handleUpgrade(db,trans,oldDbVersion,oldClientVersion){media.state=MediaDB.UPGRADING;var evtDetail={'oldMediaDBVersion':oldDbVersion,'oldClientVersion':oldClientVersion,'newMediaDBVersion':MediaDB.VERSION,'newClientVersion':media.version};dispatchEvent(media,'upgrading',evtDetail);var store=trans.objectStore('files');if(media.version!=oldClientVersion){upgradeIndexesChanges(store);}
var clientUpgradeNeeded=(media.version!=oldClientVersion)&&media.updateRecord;if((2!=oldDbVersion||3!=MediaDB.VERSION)&&!clientUpgradeNeeded){return;}
enumerateOldFiles(store,function doUpgrade(dbfile){if(2==oldDbVersion&&3==MediaDB.VERSION){upgradeDBVer2to3(store,dbfile);}
if(clientUpgradeNeeded){handleClientUpgrade(store,dbfile,oldClientVersion);}});}
function upgradeIndexesChanges(store){var dbIndexes=store.indexNames;var clientIndexes=media.indexes;var clientIndex;for(var i=0;i<dbIndexes.length;i++){if('name'===dbIndexes[i]||'date'===dbIndexes[i]){continue;}
if(clientIndexes.indexOf(dbIndexes[i])<0){store.deleteIndex(dbIndexes[i]);}}
for(i=0;i<clientIndexes.length;i++){if(!dbIndexes.contains(clientIndexes[i])){store.createIndex(clientIndexes[i],clientIndexes[i]);}}}
function upgradeDBVer2to3(store,dbfile){if(dbfile.name[0]==='/'){return;}
store.delete(dbfile.name);dbfile.name='/sdcard/'+dbfile.name;store.add(dbfile);}
function handleClientUpgrade(store,dbfile,oldClientVersion){try{dbfile.metadata=media.updateRecord(dbfile,oldClientVersion,media.version);store.put(dbfile);}catch(ex){console.warn('client app updates record, '+dbfile.name+', failed: '+ex.message);}}
function initDeviceStorage(){var details=media.details;details.storages=navigator.getDeviceStorages(mediaType);details.availability={};getStorageAvailability();function getStorageAvailability(){var next=0;getNextAvailability();function getNextAvailability(){if(next>=details.storages.length){setupHandlers();return;}
var s=details.storages[next++];var name=s.storageName;var req=s.available();req.onsuccess=function(e){details.availability[name]=req.result;getNextAvailability();};req.onerror=function(e){details.availability[name]='unavailable';getNextAvailability();};}}
function setupHandlers(){for(var i=0;i<details.storages.length;i++)
details.storages[i].addEventListener('change',changeHandler);details.dsEventListener=changeHandler;sendInitialEvent();}
function sendInitialEvent(){var state=getState(details.availability);changeState(media,state);if(media.autoscan)
scan(media);}
function getState(availability){var n=0;var a=0;var u=0;var s=0;for(var name in availability){n++;switch(availability[name]){case'available':a++;break;case'unavailable':u++;break;case'shared':s++;break;}}
if(s>0)
return MediaDB.UNMOUNTED;if(u===n)
return MediaDB.NOCARD;return MediaDB.READY;}
function changeHandler(e){switch(e.reason){case'modified':case'deleted':setTimeout(function(){fileChangeHandler.bind(this);},3000);return;case'available':case'unavailable':case'shared':volumeChangeHandler(e);return;default:return;}}
function volumeChangeHandler(e){var storageName=e.target.storageName;if(details.availability[storageName]===e.reason)
return;var oldState=media.state;details.availability[storageName]=e.reason;var newState=getState(details.availability);if(newState!==oldState){changeState(media,newState);if(newState===MediaDB.READY){if(media.autoscan)
scan(media);}
else{endscan(media);}}
else if(newState===MediaDB.READY){if(e.reason==='available'){dispatchEvent(media,'ready');if(media.autoscan)
scan(media);}
else if(e.reason==='unavailable'){dispatchEvent(media,'cardremoved');deleteAllFiles(storageName);}}}
function fileChangeHandler(e){var filename=e.path;if(ignoreName(media,filename))
return;if(e.reason==='modified')
insertRecord(media,filename);else
deleteRecord(media,filename);}
function deleteAllFiles(storageName){var storagePrefix=storageName?'/'+storageName+'/':'';var store=media.db.transaction('files').objectStore('files');var cursorRequest=store.openCursor();cursorRequest.onsuccess=function(){var cursor=cursorRequest.result;if(cursor){if(cursor.value.name.startsWith(storagePrefix)){deleteRecord(media,cursor.value.name);}
cursor.continue();}};}}}
MediaDB.prototype={close:function close(){this.db.close();for(var i=0;i<this.details.storages.length;i++){var s=this.details.storages[i];s.removeEventListener('change',this.details.dsEventListener);}
changeState(this,MediaDB.CLOSED);},addEventListener:function addEventListener(type,listener){if(!this.details.eventListeners.hasOwnProperty(type))
this.details.eventListeners[type]=[];var listeners=this.details.eventListeners[type];if(listeners.indexOf(listener)!==-1)
return;listeners.push(listener);},removeEventListener:function removeEventListener(type,listener){if(!this.details.eventListeners.hasOwnProperty(type))
return;var listeners=this.details.eventListeners[type];var position=listeners.indexOf(listener);if(position===-1)
return;listeners.splice(position,1);},getFile:function getFile(filename,callback,errback){if(this.state!==MediaDB.READY)
throw Error('MediaDB is not ready. State: '+this.state);var storage=navigator.getDeviceStorage(this.mediaType);var getRequest=storage.get(filename);getRequest.onsuccess=function(){callback(getRequest.result);};getRequest.onerror=function(){var errmsg=getRequest.error&&getRequest.error.name;if(errback)
errback(errmsg);else
console.error('MediaDB.getFile:',errmsg);};},deleteFile:function deleteFile(filename){if(this.state!==MediaDB.READY)
throw Error('MediaDB is not ready. State: '+this.state);var storage=navigator.getDeviceStorage(this.mediaType);storage.delete(filename).onerror=function(e){console.error('MediaDB.deleteFile(): Failed to delete',filename,'from DeviceStorage:',e.target.error);};},addFile:function addFile(filename,file){if(this.state!==MediaDB.READY)
throw Error('MediaDB is not ready. State: '+this.state);var media=this;var storage=navigator.getDeviceStorage(media.mediaType);var deletereq=storage.delete(filename);deletereq.onsuccess=deletereq.onerror=save;function save(){var request=storage.addNamed(file,filename);request.onerror=function(){console.error('MediaDB: Failed to store',filename,'in DeviceStorage:',request.error);};}},updateMetadata:function(filename,metadata,callback){if(this.state===MediaDB.OPENING)
throw Error('MediaDB is not ready. State: '+this.state);var media=this;var read=media.db.transaction('files','readonly').objectStore('files').get(filename);read.onerror=function(){console.error('MediaDB.updateMetadata called with unknown filename');};read.onsuccess=function(){var fileinfo=read.result;Object.keys(metadata).forEach(function(key){fileinfo.metadata[key]=metadata[key];});var write=media.db.transaction('files','readwrite').objectStore('files').put(fileinfo);write.onerror=function(){console.error('MediaDB.updateMetadata: database write failed',write.error&&write.error.name);};if(callback){write.onsuccess=function(){callback();};}};},count:function(key,range,callback){if(this.state!==MediaDB.READY)
throw Error('MediaDB is not ready. State: '+this.state);if(arguments.length===1){callback=key;range=undefined;key=undefined;}
else if(arguments.length===2){callback=range;range=key;key=undefined;}
var store=this.db.transaction('files').objectStore('files');if(key&&key!=='name')
store=store.index(key);var countRequest=store.count(range||null);countRequest.onerror=function(){console.error('MediaDB.count() failed with',countRequest.error);};countRequest.onsuccess=function(e){callback(e.target.result);};},enumerate:function enumerate(key,range,direction,callback){console.log('lxp:: mediadb enumerate key = '+key);if(this.state!==MediaDB.READY)
throw Error('MediaDB is not ready. State: '+this.state);var handle={state:'enumerating'};if(arguments.length===1){callback=key;key=undefined;}
else if(arguments.length===2){callback=range;range=undefined;}
else if(arguments.length===3){callback=direction;direction=undefined;}
var store=this.db.transaction('files').objectStore('files');if(key&&key!=='name')
store=store.index(key);var cursorRequest=store.openCursor(range||null,direction||'next');cursorRequest.onerror=function(){console.error('MediaDB.enumerate() failed with',cursorRequest.error);handle.state='error';};cursorRequest.onsuccess=function(){if(handle.state==='cancelling'){handle.state='cancelled';return;}
var cursor=cursorRequest.result;if(cursor){try{callback(cursor.value);}
catch(e){console.warn('MediaDB.enumerate(): callback threw',e,e.stack);}
cursor.continue();}
else{handle.state='complete';callback(null);}};return handle;},advancedEnumerate:function(key,range,direction,index,callback){if(this.state!==MediaDB.READY)
throw Error('MediaDB is not ready. State: '+this.state);var handle={state:'enumerating'};var store=this.db.transaction('files').objectStore('files');if(key&&key!=='name')
store=store.index(key);var cursorRequest=store.openCursor(range||null,direction||'next');var isTarget=false;cursorRequest.onerror=function(){console.error('MediaDB.enumerate() failed with',cursorRequest.error);handle.state='error';};cursorRequest.onsuccess=function(){if(handle.state==='cancelling'){handle.state='cancelled';return;}
var cursor=cursorRequest.result;if(cursor){try{if(!cursor.value.fail&&isTarget){callback(cursor.value);cursor.continue();}
else{cursor.advance(index-1);isTarget=true;}}
catch(e){console.warn('MediaDB.enumerate(): callback threw',e,e.stack);}}
else{handle.state='complete';callback(null);}};return handle;},enumerateAll:function enumerateAll(key,range,direction,callback){var batch=[];if(arguments.length===1){callback=key;key=undefined;}
else if(arguments.length===2){callback=range;range=undefined;}
else if(arguments.length===3){callback=direction;direction=undefined;}
return this.enumerate(key,range,direction,function(fileinfo){if(fileinfo!==null)
batch.push(fileinfo);else
callback(batch);});},cancelEnumeration:function cancelEnumeration(handle){console.log('lxp:: cancelEnumeration handle = '+handle.state);if(handle.state==='enumerating')
handle.state='cancelling';},getAll:function getAll(callback){if(this.state!==MediaDB.READY)
throw Error('MediaDB is not ready. State: '+this.state);var store=this.db.transaction('files').objectStore('files');var request=store.mozGetAll();request.onerror=function(){console.error('MediaDB.getAll() failed with',request.error);};request.onsuccess=function(){var all=request.result;var good=all.filter(function(fileinfo){return!fileinfo.fail;});callback(good);};},scan:function(){scan(this);},freeSpace:function freeSpace(callback){if(this.state!==MediaDB.READY)
throw Error('MediaDB is not ready. State: '+this.state);var storage=navigator.getDeviceStorage(this.mediaType);var freereq=storage.freeSpace();freereq.onsuccess=function(){callback(freereq.result);};}};MediaDB.VERSION=3;MediaDB.OPENING='opening';MediaDB.UPGRADING='upgrading';MediaDB.READY='ready';MediaDB.NOCARD='nocard';MediaDB.UNMOUNTED='unmounted';MediaDB.CLOSED='closed';function ignore(media,file){if(ignoreName(media,file.name))
return true;if(media.mimeTypes&&media.mimeTypes.indexOf(file.type)===-1)
return true;return false;}
function ignoreName(media,filename){if(media.clientExcludeFilter&&media.clientExcludeFilter.test(filename)){return true;}else{var path=filename.substring(0,filename.lastIndexOf('/')+1);return(path[0]==='.'||path.indexOf('/.')!==-1);}}
function scan(media){media.scanning=true;dispatchEvent(media,'scanstart');quickScan(media.details.newestFileModTime);function quickScan(timestamp){var cursor;if(timestamp>0){media.details.firstscan=false;cursor=enumerateAll(media.details.storages,'',{since:new Date(timestamp+1)});}
else{media.details.firstscan=true;media.details.records=[];cursor=enumerateAll(media.details.storages,'');}
cursor.onsuccess=function(){if(!media.scanning)
return;var file=cursor.result;if(file){if(!ignore(media,file))
insertRecord(media,file);cursor.continue();}
else{whenDoneProcessing(media,function(){sendNotifications(media);if(media.details.firstscan){endscan(media);}
else{fullScan();}});}};cursor.onerror=function(){console.warning('Error while scanning',cursor.error);endscan(media);};}
function fullScan(){if(media.state!==MediaDB.READY){endscan(media);return;}
var dsfiles=[];var cursor=enumerateAll(media.details.storages,'');cursor.onsuccess=function(){if(!media.scanning)
return;var file=cursor.result;if(file){if(!ignore(media,file)){dsfiles.push(file);}
cursor.continue();}
else{getDBFiles();}};cursor.onerror=function(){console.warning('Error while scanning',cursor.error);endscan(media);};function getDBFiles(){var store=media.db.transaction('files').objectStore('files');var getAllRequest=store.mozGetAll();getAllRequest.onsuccess=function(){if(!media.scanning)
return;var dbfiles=getAllRequest.result;compareLists(dbfiles,dsfiles);};}
function compareLists(dbfiles,dsfiles){dsfiles.sort(function(a,b){if(a.name<b.name)
return-1;else
return 1;});var dsindex=0,dbindex=0;while(true){var dsfile;if(dsindex<dsfiles.length)
dsfile=dsfiles[dsindex];else
dsfile=null;var dbfile;if(dbindex<dbfiles.length)
dbfile=dbfiles[dbindex];else
dbfile=null;if(dsfile===null&&dbfile===null)
break;if(dbfile===null){insertRecord(media,dsfile);dsindex++;continue;}
if(dsfile===null){deleteRecord(media,dbfile.name);dbindex++;continue;}
if(dsfile.name===dbfile.name){var lastModified=dsfile.lastModifiedDate;if((lastModified&&lastModified.getTime()!==dbfile.date)||dsfile.size!==dbfile.size){deleteRecord(media,dbfile.name);insertRecord(media,dsfile);}
dsindex++;dbindex++;continue;}
if(dsfile.name<dbfile.name){insertRecord(media,dsfile);dsindex++;continue;}
if(dsfile.name>dbfile.name){deleteRecord(media,dbfile.name);dbindex++;continue;}
console.error('Assertion failed');}
insertRecord(media,null);}}}
function endscan(media){if(media.scanning){media.scanning=false;media.parsingBigFiles=false;dispatchEvent(media,'scanend');}}
function insertRecord(media,fileOrName){var details=media.details;details.pendingInsertions.push(fileOrName);if(details.processingQueue)
return;processQueue(media);}
function deleteRecord(media,filename){var details=media.details;details.pendingDeletions.push(filename);if(details.processingQueue)
return;processQueue(media);}
function whenDoneProcessing(media,f){var details=media.details;if(details.processingQueue)
details.whenDoneProcessing.push(f);else
f();}
function processQueue(media){var details=media.details;details.processingQueue=true;next();function next(){if(details.pendingDeletions.length>0){deleteFiles();}
else if(details.pendingInsertions.length>0){insertFile(details.pendingInsertions.shift());}
else{details.processingQueue=false;if(details.whenDoneProcessing.length>0){var functions=details.whenDoneProcessing;details.whenDoneProcessing=[];functions.forEach(function(f){f();});}}}
function deleteFiles(){var transaction=media.db.transaction('files','readwrite');var store=transaction.objectStore('files');deleteNextFile();function deleteNextFile(){if(details.pendingDeletions.length===0){next();return;}
var filename=details.pendingDeletions.shift();var getRequest=store.get(filename);getRequest.onerror=function(event){console.warn('MediaDB: Get unknown file in deleteRecord:',filename,getRequest.error);deleteNextFile();};getRequest.onsuccess=function(event){var fileinfo=getRequest.result;if(fileinfo&&fileinfo.metadata&&fileinfo.metadata.preview&&fileinfo.metadata.preview.filename){var pictures=navigator.getDeviceStorage('pictures');pictures.delete(fileinfo.metadata.preview.filename);}
var request=store.delete(filename);request.onerror=function(){console.warn('MediaDB: Unknown file in deleteRecord:',filename,getreq.error);deleteNextFile();};request.onsuccess=function(){queueDeleteNotification(media,filename);deleteNextFile();};};}}
function insertFile(f){if(f===null){sendNotifications(media);endscan(media);next();return;}
if(typeof f==='string'){var storage=navigator.getDeviceStorage(media.mediaType);var getreq=storage.get(f);getreq.onerror=function(){console.warn('MediaDB: Unknown file in insertRecord:',f,getreq.error);next();};getreq.onsuccess=function(){if(media.mimeTypes&&ignore(media,getreq.result))
next();else
parseMetadata(getreq.result,f);};}
else{parseMetadata(f,f.name);}}
function parseMetadata(file,filename){if(!file.lastModifiedDate){console.warn('MediaDB: parseMetadata: no lastModifiedDate for',filename,'using Date.now() until #793955 is fixed');}
var index=filename.lastIndexOf('/');var pureName=filename.substring(index+1);var fileinfo={pureName:pureName,name:filename,type:file.type,size:file.size,date:file.lastModifiedDate?file.lastModifiedDate.getTime():Date.now()};if(fileinfo.date>details.newestFileModTime)
details.newestFileModTime=fileinfo.date;media.metadataParser(file,gotMetadata,metadataError,parsingBigFile);function parsingBigFile(){media.parsingBigFiles=true;}
function metadataError(e){console.warn('MediaDB: error parsing metadata for',filename,':',e);fileinfo.fail=true;storeRecord(fileinfo);}
function gotMetadata(metadata){fileinfo.metadata=metadata;storeRecord(fileinfo);if(!media.scanning){media.parsingBigFiles=false;}}}
function storeRecord(fileinfo){if(media.mediaType=='music'&&fileinfo.fail!=undefined&&fileinfo.fail==true){console.log('lxp:: storeRecord music fileinfo = '+
JSON.stringify(fileinfo));next();return;}
if(media.mediaType=='videos'&&fileinfo.metadata.isVideo==false){console.log('lxp:: storeRecord videos fileinfo = '+
JSON.stringify(fileinfo));next();return;}
if(media.details.firstscan){media.details.records.push(fileinfo);queueCreateNotification(media,fileinfo);next();}
else{var transaction=media.db.transaction('files','readwrite');var store=transaction.objectStore('files');var request=store.add(fileinfo);request.onsuccess=function(){queueCreateNotification(media,fileinfo);next();};request.onerror=function(event){if(request.error.name==='ConstraintError'){event.stopPropagation();event.preventDefault();var putrequest=store.put(fileinfo);putrequest.onsuccess=function(){queueDeleteNotification(media,fileinfo.name);queueCreateNotification(media,fileinfo);next();};putrequest.onerror=function(){console.error('MediaDB: unexpected ConstraintError','in insertRecord for file:',fileinfo.name);next();};}
else{console.error('MediaDB: unexpected error in insertRecord:',request.error,'for file:',fileinfo.name);next();}};}}}
function queueCreateNotification(media,fileinfo){var creates=media.details.pendingCreateNotifications;creates.push(fileinfo);if(media.batchSize&&creates.length>=media.batchSize)
sendNotifications(media);else
resetNotificationTimer(media);}
function queueDeleteNotification(media,filename){var deletes=media.details.pendingDeleteNotifications;deletes.push(filename);if(media.batchSize&&deletes.length>=media.batchSize)
sendNotifications(media);else
resetNotificationTimer(media);}
function resetNotificationTimer(media){var details=media.details;if(details.pendingNotificationTimer)
clearTimeout(details.pendingNotificationTimer);details.pendingNotificationTimer=setTimeout(function(){sendNotifications(media);},media.batchHoldTime);}
function sendNotifications(media){var details=media.details;if(details.pendingNotificationTimer){clearTimeout(details.pendingNotificationTimer);details.pendingNotificationTimer=null;}
if(details.pendingDeleteNotifications.length>0){var deletions=details.pendingDeleteNotifications;details.pendingDeleteNotifications=[];dispatchEvent(media,'deleted',deletions);}
if(details.pendingCreateNotifications.length>0){if(details.firstscan&&details.records.length>0){var transaction=media.db.transaction('files','readwrite');var store=transaction.objectStore('files');for(var i=0;i<details.records.length;i++)
store.add(details.records[i]);details.records.length=0;}
var creations=details.pendingCreateNotifications;details.pendingCreateNotifications=[];dispatchEvent(media,'created',creations);}}
function dispatchEvent(media,type,detail){var handler=media['on'+type];var listeners=media.details.eventListeners[type];if(!handler&&(!listeners||listeners.length==0))
return;var event={type:type,target:media,currentTarget:media,timestamp:Date.now(),detail:detail};if(typeof handler==='function'){try{handler.call(media,event);}
catch(e){console.warn('MediaDB: ','on'+type,'event handler threw',e,e.stack);}}
if(!listeners)
return;for(var i=0;i<listeners.length;i++){try{var listener=listeners[i];if(typeof listener==='function'){listener.call(media,event);}
else{listener.handleEvent(event);}}
catch(e){console.warn('MediaDB: ',type,'event listener threw',e,e.stack);}}}
function changeState(media,state){if(media.state!==state){media.state=state;if(state===MediaDB.READY)
dispatchEvent(media,'ready');else
dispatchEvent(media,'unavailable',state);}}
return MediaDB;}());;function $(id){return document.getElementById(id);}
function openDialog(dialogID,onSubmit,onReset){if('#'+dialogID==document.location.hash)
return;var origin=document.location.hash;var dialog=document.getElementById(dialogID);var submit=dialog.querySelector('[type=submit]');if(submit){submit.onclick=function onsubmit(){if(onSubmit)
(onSubmit.bind(dialog))();document.location.hash=origin;};}
var reset=dialog.querySelector('[type=reset]');if(reset){reset.onclick=function onreset(){if(onReset)
(onReset.bind(dialog))();document.location.hash=origin;};}
document.location.hash=dialogID;}
Date.prototype.Format=function(fmt){var o={'M+':this.getMonth()+1,'d+':this.getDate(),'h+':this.getHours(),'m+':this.getMinutes(),'s+':this.getSeconds(),'q+':Math.floor((this.getMonth()+3)/3),'S':this.getMilliseconds()};if(/(y+)/.test(fmt))
fmt=fmt.replace(RegExp.$1,(this.getFullYear()+'').substr(4-RegExp.$1.length));for(var k in o)
if(new RegExp('('+k+')').test(fmt))
fmt=fmt.replace(RegExp.$1,(RegExp.$1.length==1)?(o[k]):(('00'+o[k]).substr((''+o[k]).length)));return fmt;};function formatSize(size){if(size===undefined||isNaN(size)){return;}
var fixedDigits=(size<1024*1024)?0:1;var sizeInfo=FileSizeFormatter.getReadableFileSize(size,fixedDigits);return sizeInfo.size+' '+sizeInfo.unit;}
var localize=navigator.mozL10n.localize;var FileSizeFormatter=(function FileSizeFormatter(fixed){function getReadableFileSize(size,digits){if(size===undefined)
return{};var units=['B','KB','MB','GB','TB','PB','EB','ZB','YB'];var i=0;while(size>=1024){size/=1024;++i;}
var sizeString=size.toFixed(digits||0);var sizeDecimal=parseFloat(sizeString);return{size:sizeDecimal.toString(),unit:units[i]};}
return{getReadableFileSize:getReadableFileSize};})();var DeviceStorageHelper=(function DeviceStorageHelper(){function getStat(storage,callback){if(!storage){console.error('Storage is invalid');return;}
storage.freeSpace().onsuccess=function(e){var freeSpace=e.target.result;storage.usedSpace().onsuccess=function(e){var usedSpace=e.target.result;callback(usedSpace,freeSpace);};};}
function getFreeSpace(storage,callback){if(!storage){console.error('Storage is invalid');return;}
storage.freeSpace().onsuccess=function(e){var freeSpace=e.target.result;callback(freeSpace);};}
function getTotalSpace(storage,callback){if(!storage){console.error('Storage is invalid');return;}
storage.freeSpace().onsuccess=function(e){var freeSpace=e.target.result;storage.usedSpace().onsuccess=function(e){var usedSpace=e.target.result;var totalSpace=usedSpace+freeSpace;callback(totalSpace);};};}
function showFormatedSize(element,l10nId,usedSpace,freeSpace){if(usedSpace===undefined||isNaN(usedSpace)||freeSpace===undefined||isNaN(freeSpace)){element.textContent='';return;}
var totalSpace=usedSpace+freeSpace;if(totalSpace===0){element.parentNode.parentNode.classList.add('hidden');}
var freefixedDigits=(freeSpace<1024*1024)?0:1;var freeSizeInfo=FileSizeFormatter.getReadableFileSize(freeSpace,freefixedDigits);var totalfixedDigits=(totalSpace<1024*1024)?0:1;var totalSizeInfo=FileSizeFormatter.getReadableFileSize(totalSpace,totalfixedDigits);var _=navigator.mozL10n.get;element.textContent=_(l10nId,{size:freeSizeInfo.size,unit:_('byteUnit-'+freeSizeInfo.unit),totalsize:totalSizeInfo.size,totalunit:_('byteUnit-'+totalSizeInfo.unit)});}
return{getStat:getStat,getFreeSpace:getFreeSpace,getTotalSpace:getTotalSpace,showFormatedSize:showFormatedSize};})();function nameCheck(name){if(name.indexOf('\\')!==-1){return false;}
var reg=new RegExp('[*:/?<>\"|\\x5c]','g');if(reg.test(name)){return false;}
return true;}
function countCharacters(newName){if(!newName){return 0;}
var totalCount=0,code,len=newName.length;for(var i=0;i<len;i++){code=newName.charCodeAt(i);if(code>=0x0&&code<=0x7f){totalCount++;}else if(code<=0x7ff){totalCount+=2;}else if(code<=0xffff){totalCount+=3;}}
console.log('lxp:: File Manager totalCount = '+totalCount);return totalCount;};'use strict';const Classify=(function(){var loader=LazyLoader;var PAGE_SIZE=6;function allScanEnd(firstScan){if(firstScan){if(!photodbFirstScan&&!musicdbFirstScan&&!videodbFirstScan&&!bluetoothdbFirstScan){if($('fresh-button').classList.contains('freshing')){$('fresh-button').classList.remove('freshing');}}}else if(!photodbScan&&!musicdbScan&&!videodbScan&&!bluetoothdbScan){if($('fresh-button').classList.contains('freshing')){$('fresh-button').classList.remove('freshing');}}
if(!photodbScan&&!musicdbScan&&!videodbScan&&!bluetoothdbScan&&!photodbFirstScan&&!musicdbFirstScan&&!videodbFirstScan&&!bluetoothdbFirstScan){if(mediaChanged){freshMainPage();}}}
function initPictureDB(){photodb=new MediaDB('pictures',metadataParserPicture,{indexes:['pureName'],version:2,autoscan:false,batchHoldTime:2000,batchSize:PAGE_SIZE});var loaded=false;function metadataParserPicture(file,onsuccess,onerror){if(loaded){metadataParser(file,onsuccess,onerror);return;}
loader.load('js/picture_metadata_scripts.js',function(){loaded=true;metadataParser(file,onsuccess,onerror);});}
photodb.onupgrading=function(){showOverlay('upgrade');};photodb.onunavailable=function(event){var why=event.detail;if(why===MediaDB.NOCARD)
showOverlay('nocard');else if(why===MediaDB.UNMOUNTED)
showOverlay('pluggedin');};photodb.onready=function(){if(currentOverlay==='nocard'||currentOverlay==='pluggedin')
showOverlay(null);showOverlay(null);photodb.scan();};photodb.onscanstart=function onscanstart(){dump('lxp:: performance picture start time '+performance.now());};photodb.onscanend=function onscanend(){dump('lxp:: performance picture end time '+performance.now());scanningBigImages=false;if(photodbFirstScan===true){photodbFirstScan=false;$('picture').classList.remove('disabled');allScanEnd(true);console.log('lxp:: photodbFirstScan = '+photodbFirstScan);}
if(photodbScan===true){photodbScan=false;$('picture').classList.remove('disabled');allScanEnd(false);}
if(renameScan===true){renameScan=false;hideSpinner();removeDisabled();}
countdb(photodb);};photodb.oncardremoved=function oncardremoved(){};photodb.oncreated=function(event){event.detail.forEach(pictureFileCreated);if(photodbFirstScan===false)
countdb(photodb);};photodb.ondeleted=function(event){event.detail.forEach(pictureFileDeleted);if(photodbFirstScan===false)
countdb(photodb);};}
function pictureFileCreated(fileinfo){debug('pictureFile created filename = '+fileinfo.name);if(photodbFirstScan===true)
return;if(currentView!=='option-picture'){console.log('lxp:: option-picture currentView = '+currentView);return;}
var insertPosition;if(currentOverlay==='empty')
showOverlay(null);if(sortType==='date'){if(files.length===0||fileinfo.date>files[0].date){insertPosition=0;}}else if(sortType==='name'){if(files.length===0||SequenceList.compareFileByName(fileinfo,files[0])<=0){insertPosition=0;}}
if(insertPosition!==0){var thumbnailElts=classifyLists.querySelectorAll('.thumbnail');if(thumbnailElts.length===0)
classifyLists.appendChild(thumbnail);else{if(sortType==='date'){insertPosition=binarysearch(files,fileinfo,compareFilesByDate);}else if(sortType==='name'){insertPosition=binarysearch(files,fileinfo,SequenceList.compareFileByName);}}}
debug('pictureFile created insertPosition = '+insertPosition);files.splice(insertPosition,0,fileinfo);var thumbnail=createListElement('picture',fileinfo,insertPosition);var thumbnailElts=classifyLists.querySelectorAll('.thumbnail');if(thumbnailElts.length===0)
classifyLists.appendChild(thumbnail);else
classifyLists.insertBefore(thumbnail,thumbnailElts[insertPosition]);for(var i=insertPosition;i<thumbnailElts.length;i++){thumbnailElts[i].dataset.index=i+1;}
if(renameScan===true){renameScan=false;hideSpinner();removeDisabled();}
if(files.length>0){removeDisabled();}}
function pictureFileDeleted(filename){debug('pictureFile Deleted filename = '+filename);if(photodbFirstScan===true)
return;if(currentView!=='option-picture'){console.log('lxp:: option-picture currentView = '+currentView);return;}
for(var n=0;n<files.length;n++){if(files[n].name===filename)
break;}
if(n>=files.length)
return;var fileinfo=files[n];if(fileinfo&&fileinfo.metadata&&fileinfo.metadata.preview&&fileinfo.metadata.preview.filename){var pictures=navigator.getDeviceStorage('pictures');pictures.delete(fileinfo.metadata.preview.filename);}
files.splice(n,1)[0];var thumbnailElts=classifyLists.querySelectorAll('.thumbnail');URL.revokeObjectURL(thumbnailElts[n].querySelector('img').src.slice(5,-2));classifyLists.removeChild(thumbnailElts[n]);for(var i=n+1;i<thumbnailElts.length;i++){thumbnailElts[i].dataset.index=i-1;}
if(files.length===0){if(renameScan===true){renameScan=false;hideSpinner();removeDisabled();}
addDisabled();if(window.location.hash==='#edit-form'){cancelEditMode();}
var _=navigator.mozL10n.get;var msg=_('no-picture-file');setTimeout(function(){alert(msg);},0);}}
function initMusicDB(){debug('music init');musicdb=new MediaDB('music',metadataParserMusic,{indexes:['pureName','metadata.album','metadata.artist','metadata.title','metadata.rated','metadata.played','date'],autoscan:false,batchSize:1,version:2});function metadataParserMusic(file,onsuccess,onerror){debug('music parser');LazyLoader.load('js/music_metadata_scripts.js',function(){parseAudioMetadata(file,onsuccess,onerror);});}
musicdb.onupgrading=function(){showOverlay('upgrade');};musicdb.onunavailable=function(event){debug('musicdb onunavailable event.detail = '+event.detail);var why=event.detail;if(why===MediaDB.NOCARD)
showOverlay('nocard');else if(why===MediaDB.UNMOUNTED)
showOverlay('pluggedin');};musicdb.onready=function(){if(currentOverlay==='nocard'||currentOverlay==='pluggedin')
showOverlay(null);showOverlay(null);musicdb.scan();};musicdb.onscanstart=function onscanstart(){dump('lxp:: performance music start time '+performance.now());};musicdb.onscanend=function onscanend(){dump('lxp:: performance music end time '+performance.now());if(musicdbFirstScan===true){if(!videodb){console.log('lxp:: init video');videodbFirstScan=true;Classify.initVideoDB();}
musicdbFirstScan=false;$('music').classList.remove('disabled');allScanEnd(true);console.log('lxp:: musicdbFirstScan = '+musicdbFirstScan);}
if(musicdbScan===true){if(videodb&&!videodbFirstScan){videodbScan=true;videodb.scan();}
musicdbScan=false;$('music').classList.remove('disabled');allScanEnd(false);}
if(renameScan===true){renameScan=false;hideSpinner();removeDisabled();}
countdb(musicdb);};musicdb.oncreated=function(event){event.detail.forEach(musicFileCreated);if(musicdbFirstScan===false)
countdb(musicdb);};musicdb.ondeleted=function(event){event.detail.forEach(musicFileDeleted);if(musicdbFirstScan===false)
countdb(musicdb);};}
function musicFileCreated(fileinfo){debug('musicFile created filename = '+fileinfo.name);if(musicdbFirstScan===true)
return;if(currentView!=='option-music'){console.log('lxp:: option-music currentView = '+currentView);return;}
var insertPosition;if(currentOverlay==='empty')
showOverlay(null);if(sortType==='date'){if(files.length===0||fileinfo.date>files[0].date){insertPosition=0;}}else if(sortType==='name'){if(files.length===0||SequenceList.compareFileByName(fileinfo,files[0])<=0){insertPosition=0;}}
if(insertPosition!==0){var thumbnailElts=classifyLists.querySelectorAll('.music');if(thumbnailElts.length===0)
classifyLists.appendChild(thumbnail);else{if(sortType==='date'){insertPosition=binarysearch(files,fileinfo,compareFilesByDate);}else if(sortType==='name'){insertPosition=binarysearch(files,fileinfo,SequenceList.compareFileByName);}}}
files.splice(insertPosition,0,fileinfo);var thumbnail=createListElement('music',fileinfo,insertPosition);var thumbnailElts=classifyLists.querySelectorAll('.music');if(thumbnailElts.length===0)
classifyLists.appendChild(thumbnail);else
classifyLists.insertBefore(thumbnail,thumbnailElts[insertPosition]);for(var i=insertPosition;i<thumbnailElts.length;i++){thumbnailElts[i].dataset.index=i+1;}
if(renameScan===true){renameScan=false;hideSpinner();removeDisabled();}
if(files.length>0){removeDisabled();}}
function musicFileDeleted(filename){debug('musicFile deleted filename = '+filename);if(musicdbFirstScan===true)
return;if(currentView!=='option-music'){console.log('lxp:: option-music currentView = '+currentView);return;}
for(var n=0;n<files.length;n++){if(files[n].name===filename)
break;}
if(n>=files.length)
return;files.splice(n,1)[0];var thumbnailElts=classifyLists.querySelectorAll('.music');classifyLists.removeChild(thumbnailElts[n]);for(var i=n+1;i<thumbnailElts.length;i++){thumbnailElts[i].dataset.index=i-1;}
if(files.length===0){if(renameScan===true){renameScan=false;hideSpinner();removeDisabled();}
addDisabled();if(window.location.hash==='#edit-form'){cancelEditMode();}
var _=navigator.mozL10n.get;var msg=_('no-music-file');setTimeout(function(){alert(msg);},0);}}
function initVideoDB(){videodb=new MediaDB('videos',metaDataParserVideo,{excludeFilter:/DCIM\/\d{3}MZLLA\/\.VID_\d{4}\.3gp$/,indexes:['pureName'],autoscan:false,version:2});videodb.onupgrading=function(){showOverlay('upgrade');};videodb.onunavailable=function(event){var why=event.detail;if(why===MediaDB.NOCARD)
showOverlay('nocard');else if(why===MediaDB.UNMOUNTED)
showOverlay('pluggedin');};videodb.oncardremoved=function(){};videodb.onready=function(){if(currentOverlay==='nocard'||currentOverlay==='pluggedin')
showOverlay(null);showOverlay(null);videodb.scan();};videodb.onscanstart=function(){dump('lxp:: performance video start time '+performance.now());};videodb.onscanend=function(){dump('lxp:: performance video end time '+performance.now());if(videodbFirstScan===true){if(!photodb){console.log('lxp:: init picture');photodbFirstScan=true;Classify.initPictureDB();}
videodbFirstScan=false;$('video').classList.remove('disabled');allScanEnd(true);console.log('lxp:: videodbFirstScan = '+videodbFirstScan);}
countdb(videodb);if(videodbScan===true){if(photodb&&!photodbFirstScan){photodbScan=true;photodb.scan();}
videodbScan=false;$('video').classList.remove('disabled');allScanEnd(false);}
if(renameScan===true){renameScan=false;hideSpinner();removeDisabled();}};videodb.oncreated=function(event){event.detail.forEach(videoFilecreated);if(videodbFirstScan===false)
countdb(videodb);};videodb.ondeleted=function(event){event.detail.forEach(videoFileDeleted);if(videodbFirstScan===false)
countdb(videodb);};}
function videoFilecreated(fileinfo){debug('videocreated filename = '+fileinfo.name);if(videodbFirstScan===true){return;}
if(currentView!=='option-video'){console.log('lxp:: option-video currentView = '+currentView);return;}
var insertPosition;if(currentOverlay==='empty')
showOverlay(null);if(sortType==='date'){if(files.length===0||fileinfo.date>files[0].date){insertPosition=0;}}else if(sortType==='name'){if(files.length===0||SequenceList.compareFileByName(fileinfo,files[0])<=0){insertPosition=0;}}
if(insertPosition!==0){var thumbnailElts=classifyLists.querySelectorAll('.video');if(thumbnailElts.length===0)
classifyLists.appendChild(thumbnail);else{if(sortType==='date'){insertPosition=binarysearch(files,fileinfo,compareFilesByDate);}else if(sortType==='name'){insertPosition=binarysearch(files,fileinfo,SequenceList.compareFileByName);}}}
files.splice(insertPosition,0,fileinfo);var thumbnail=createListElement('video',fileinfo,insertPosition);var thumbnailElts=classifyLists.querySelectorAll('.video');if(thumbnailElts.length===0)
classifyLists.appendChild(thumbnail);else
classifyLists.insertBefore(thumbnail,thumbnailElts[insertPosition]);for(var i=insertPosition;i<thumbnailElts.length;i++){thumbnailElts[i].dataset.index=i+1;}
if(renameScan===true){renameScan=false;hideSpinner();removeDisabled();}
if(files.length>0){removeDisabled();}}
function videoFileDeleted(filename){debug('videoFileDeleted filename = '+filename);if(videodbFirstScan===true){return;}
if(currentView!=='option-video'){console.log('lxp:: option-video currentView = '+currentView);return;}
for(var n=0;n<files.length;n++){if(files[n].name===filename)
break;}
if(n>=files.length)
return;files.splice(n,1)[0];var thumbnailElts=classifyLists.querySelectorAll('.video');URL.revokeObjectURL(thumbnailElts[n].querySelector('img').src.slice(5,-2));classifyLists.removeChild(thumbnailElts[n]);for(var i=n+1;i<thumbnailElts.length;i++){thumbnailElts[i].dataset.index=i-1;}
if(files.length===0){if(renameScan===true){renameScan=false;hideSpinner();}
addDisabled();if(window.location.hash==='#edit-form'){cancelEditMode();}
var _=navigator.mozL10n.get;var msg=_('no-video-file');setTimeout(function(){alert(msg);},0);}}
function initBluetooth(){showSpinner();addDisabled();bluetoothenumerated=enumerateBluetooth();}
function enumerateBluetooth(){var _=navigator.mozL10n.get;var batch=[];var batchsize=PAGE_SIZE;var listFragment=document.createDocumentFragment();files=[];var handle={state:'enumerating'};var bluetoothdb=navigator.getDeviceStorage('extrasdcard');var cursor=bluetoothdb.enumerate('Download/Bluetooth');cursor.onerror=function(){console.error('bluetooth.enumerate() failed with',cursor.error);handle.state='error';hideSpinner();addDisabled();alert(_('no-bluetooth-file'));};cursor.onsuccess=function(){viewReleaseEvents();if(handle.state==='cancelling'){handle.state='cancelled';return;}
var fileinfo=cursor.result;if(fileinfo){if(fileinfo.size!=0xffffffff-1){try{batch.push(fileinfo);if(batch.length>=batchsize){flush();batchsize*=2;}}
catch(e){console.warn('bluetooth.enumerate(): callback threw',e);}}
cursor.continue();}else{console.log('lxp:: enumerateBluetooth bluetooth done'+'fileinfo = '+fileinfo);handle.state='complete';done();if(sortType==='date'){bluetoothDatesort(files);cleanUI();for(var i=0;i<files.length;i++){var item=createListElement('bluetooth',files[i],i);listFragment.appendChild(item);}
classifyLists.appendChild(listFragment);listFragment.innerHTML='';}
$('sort').addEventListener('change',handleSort);hideSpinner();removeDisabled();viewAttachEvents();if(files.length===0){addDisabled();}}};function flush(){batch.forEach(thumb);batch.length=0;}
function thumb(fileinfo){files.push(fileinfo);}
function done(){console.log('lxp:: bluetooth done');flush();if(files.length===0){var _=navigator.mozL10n.get;var msg=_('no-bluetooth-file');alert(msg);}
console.log('lxp:: bluetooth done after flush');}
return handle;}
function cancelBluetoothEnumeration(handle){console.log('lxp:: cancelEnumeration handle = '+handle.state);if(handle.state==='enumerating')
handle.state='cancelling';}
function bluetoothFilecreated(fileinfo){debug('videocreated filename = '+fileinfo.name);if(currentView!=='option-bluetooth'){console.log('lxp:: option-bluetooth currentView = '+currentView);return;}
var insertPosition;if(currentOverlay==='empty')
showOverlay(null);if(sortType==='date'){if(files.length===0||getUTCTime(fileinfo.lastModifiedDate)>getUTCTime(files[0].lastModifiedDate)){insertPosition=0;}}else if(sortType==='name'){if(files.length===0||SequenceList.compareFileByName(fileinfo,files[0])<=0){insertPosition=0;}}
if(insertPosition!==0){var thumbnailElts=classifyLists.querySelectorAll('.bluetooth');if(thumbnailElts.length===0)
classifyLists.appendChild(thumbnail);else{if(sortType==='date'){insertPosition=binarysearch(files,fileinfo,bluetoothCompareFilesByDate);}else if(sortType==='name'){insertPosition=binarysearch(files,fileinfo,SequenceList.compareFileByName);}}}
files.splice(insertPosition,0,fileinfo);var thumbnail=createListElement('bluetooth',fileinfo,insertPosition);var thumbnailElts=classifyLists.querySelectorAll('.bluetooth');if(thumbnailElts.length===0)
classifyLists.appendChild(thumbnail);else
classifyLists.insertBefore(thumbnail,thumbnailElts[insertPosition]);for(var i=insertPosition;i<thumbnailElts.length;i++){thumbnailElts[i].dataset.index=i+1;}
if(renameScan===true){renameScan=false;hideSpinner();removeDisabled();}
if(files.length>0){removeDisabled();}}
function blueToothFileDeleted(filename){debug('blueToothFileDeleted filename = '+filename);if(currentView!=='option-bluetooth'){console.log('lxp:: option-bluetooth currentView = '+currentView);return;}
for(var n=0;n<files.length;n++){if(files[n].name===filename)
break;}
if(n>=files.length)
return;files.splice(n,1)[0];var thumbnailElts=classifyLists.querySelectorAll('.bluetooth');classifyLists.removeChild(thumbnailElts[n]);for(var i=n+1;i<thumbnailElts.length;i++){thumbnailElts[i].dataset.index=i-1;}
if(files.length===0){if(renameScan===true){renameScan=false;hideSpinner();}
addDisabled();if(window.location.hash==='#edit-form'){cancelEditMode();}
var _=navigator.mozL10n.get;var msg=_('no-bluetooth-file');setTimeout(function(){alert(msg);},0);}}
function countdb(mediadb,callback){mediadb.count('date',null,function(num){if(mediadb===photodb){var fileNum=$('picture-num');navigator.mozL10n.localize(fileNum,'picture-num',{n:num});if(callback)
callback(num);}
if(mediadb===musicdb){var fileNum=$('music-num');navigator.mozL10n.localize(fileNum,'music-num',{n:num});if(callback)
callback(num);}
if(mediadb===videodb){var fileNum=$('video-num');navigator.mozL10n.localize(fileNum,'video-num',{n:num});if(callback)
callback(num);}});}
function countBluetooth(){if(bluetoothdbFirstScan===true||bluetoothdbScan===true){$('bluetooth').classList.add('disabled');}
var fileCount=0;var bluetoothdb=navigator.getDeviceStorage('extrasdcard');var cursor=bluetoothdb.enumerate('Download/Bluetooth');cursor.onsuccess=function(){var fileinfo=cursor.result;if(fileinfo){if(fileinfo.size!=0xffffffff-1){fileCount=fileCount+1;}
cursor.continue();}else{var fileNum=$('bluetooth-num');navigator.mozL10n.localize(fileNum,'bluetooth-num',{n:fileCount});if(bluetoothdbFirstScan===true){bluetoothdbFirstScan=false;$('bluetooth').classList.remove('disabled');allScanEnd(true);console.log('lxp:: bluetoothdbFirstScan = '+bluetoothdbFirstScan);}
if(bluetoothdbScan===true){bluetoothdbScan=false;$('bluetooth').classList.remove('disabled');allScanEnd(false);}}};cursor.onerror=function(){console.log('Error count bluetooth files number '+cursor.error+'\n');var fileNum=$('bluetooth-num');navigator.mozL10n.localize(fileNum,'bluetooth-num',{n:fileCount});if(bluetoothdbFirstScan===true){bluetoothdbFirstScan=false;$('bluetooth').classList.remove('disabled');allScanEnd(true);}
if(bluetoothdbScan===true){bluetoothdbScan=false;$('bluetooth').classList.remove('disabled');allScanEnd(false);}};}
function showFileLists(dbType,type,order){showSpinner();addDisabled();viewReleaseEvents();console.log('lxp:: showFileLists dbType = '+
dbType+'\n'+'type = '+type+'\n'+'order = '+order);files=[];switch(dbType){case'picture':db=photodb;break;case'music':db=musicdb;break;case'video':db=videodb;break;}
var batch=[];var batchsize=PAGE_SIZE;enumerated=db.enumerate(type,null,order,function(fileinfo){if(fileinfo){batch.push(fileinfo);if(batch.length>=batchsize){flush();batchsize*=2;}}
else{done();viewAttachEvents();if(files.length===0){addDisabled();}}});function flush(){batch.forEach(thumb);batch.length=0;}
function thumb(fileinfo){files.push(fileinfo);var item=createListElement(dbType,fileinfo,files.length-1);classifyLists.appendChild(item);}
function done(){flush();if(files.length===0){var _=navigator.mozL10n.get;switch(dbType){case'picture':var msg=_('no-picture-file');break;case'music':var msg=_('no-music-file');break;case'video':var msg=_('no-video-file');break;}
alert(msg);}
console.log('lxp:: done enumerated.state = '+enumerated.state);hideSpinner();removeDisabled();$('sort').addEventListener('change',handleSort);}
console.log('lxp:: enumerated.state = '+enumerated.state);}
function createListElement(option,data,num,highlight){var li=document.createElement('li');li.dataset.index=num;li.classList.add('file-list');var fileinfo=data;switch(option){case'picture':li.classList.add('thumbnail');if(fileinfo.metadata&&fileinfo.metadata.thumbnail){var url=URL.createObjectURL(fileinfo.metadata.thumbnail);}else{var url='style/images/photo.png';}
break;case'music':li.classList.add('music');var url='style/images/music.png';break;case'video':li.classList.add('video');if(fileinfo.metadata&&fileinfo.metadata.poster){var url=URL.createObjectURL(fileinfo.metadata.poster);}else{var url='style/images/video.png';}
break;case'bluetooth':li.classList.add('bluetooth');var url='style/images/bluetooth.png';break;}
var index=fileinfo.name.lastIndexOf('/');var fileName=fileinfo.name.substring(index+1);if(option==='bluetooth'){var fileDate=new Date(fileinfo.lastModifiedDate).Format('yyyy-MM-dd hh:mm:ss');}else{var fileDate=new Date(fileinfo.date).Format('yyyy-MM-dd hh:mm:ss');}
var entry='<label class="pack-checkbox mycheckbox">'+'<input type="checkbox">'+'<span></span> '+'</label> '+'<a href="#" >'+'<img class="picture" src='+url+'></img>'+'<p class="primary-info">'+fileName+'</p>'+'<p class="secondary-info">'+'<span class="file-date">'+fileDate+' | '+'</span>'+'<span class="file-size">'+formatSize(fileinfo.size)+' </span>'+'</p> '+'</a>';li.innerHTML=entry;return li;}
function handleDateSort(){console.log('lxp:: handleDateSort');function beginSort(callback){showSpinner();addDisabled();if(callback){setTimeout(callback,100);}}
function callback(){cleanUI();var len=files.length;console.log('lxp:: currentView = '+currentView+' files.len = '+len);switch(currentView){case'option-picture':var type='picture';datesort(files);break;case'option-music':var type='music';datesort(files);break;case'option-video':var type='video';datesort(files);break;case'option-bluetooth':var type='bluetooth';bluetoothDatesort(files);break;}
for(var i=0;i<len;i++){var item=createListElement(type,files[i],i);classifyLists.appendChild(item);}
hideSpinner();removeDisabled();}
beginSort(callback);}
function binarysearch(array,element,comparator,from,to){if(comparator===undefined)
comparator=function(a,b){if(a<b)
return-1;if(a>b)
return 1;return 0;};if(from===undefined)
return binarysearch(array,element,comparator,0,array.length);if(from===to)
return from;var mid=Math.floor((from+to)/2);var result=comparator(element,array[mid]);if(result<0)
return binarysearch(array,element,comparator,from,mid);else
return binarysearch(array,element,comparator,mid+1,to);}
function datesort(array){console.log('lxp:: datesort');if(array==null)
return;array.sort(compareFilesByDate);}
function bluetoothDatesort(array){if(array==null)
return;array.sort(bluetoothCompareFilesByDate);}
function getUTCTime(date){return date.getTime();}
function handleNameSort(){function beginSort(callback){showSpinner();addDisabled();if(callback){setTimeout(callback,100);}}
function callback(){cleanUI();var len=files.length;if(len){SequenceList.pinyinSort(files);}
switch(currentView){case'option-picture':var type='picture';break;case'option-music':var type='music';break;case'option-video':var type='video';break;case'option-bluetooth':var type='bluetooth';break;}
for(var i=0;i<len;i++){var item=createListElement(type,files[i],i);classifyLists.appendChild(item);}
hideSpinner();removeDisabled();}
beginSort(callback);}
function compareFilesByDate(a,b){if(a.date<b.date)
return 1;else if(a.date>b.date)
return-1;return 0;}
function bluetoothCompareFilesByDate(a,b){if(a.lastModifiedDate.getTime()<b.lastModifiedDate.getTime())
return 1;else if(a.lastModifiedDate.getTime()>b.lastModifiedDate.getTime())
return-1;return 0;}
function handleClick(e){if(window.location.hash==='#edit-form'){return;}
var contextmenuItem=document.getElementById('contextmenuItem');if(!ctxTriggered&&contextmenuItem){if(e.target===contextmenuItem.parentNode){e.target.removeChild(contextmenuItem);e.target.style.height='6rem';}}else{handleOpenFile(files[e.target.dataset.index]);}}
function handleOpenFile(fileinfo){console.log('lxp:: handleOpenFile fileinfo = '+JSON.stringify(fileinfo));var _=navigator.mozL10n.get;if(!ctxTriggered){var type=fileinfo.type;var fileName=fileinfo.name;var storage=navigator.getDeviceStorage('sdcard');var getreq=storage.get(fileName);getreq.onerror=function(){var msg='failed to get file:'+
fileName+getreq.error.name+
getreq.error.name;console.log(msg);};getreq.onsuccess=function(){var file=getreq.result;if(window.location.hash!='#edit'){var a=new MozActivity({name:'open',data:{'type':type,filename:fileName,blob:file}});a.onsuccess=function onOpenSuccess(){console.log('open success');};a.onerror=function onOpenError(){if(this.error.name!='ActivityCanceled'){console.warn('open failed!');alert(_('open-error'));}};}};}else{ctxTriggered=false;}}
function handleContextMenu(evt){if(window.location.hash==='#edit-form'){return;}
var contextmenuItem=document.getElementById('contextmenuItem');if(!contextmenuItem){ctxTriggered=true;evt.target.style.height='12rem';var item=document.createElement('menu');item.id='contextmenuItem';var gotoBtn=document.createElement('button');gotoBtn.id='folder';gotoBtn.dataset.l10nId='folder';navigator.mozL10n.localize(gotoBtn,'folder');var renameBtn=document.createElement('button');renameBtn.id='rename';renameBtn.dataset.l10nId='rename';navigator.mozL10n.localize(renameBtn,'rename');var profileBtn=document.createElement('button');profileBtn.id='details';profileBtn.dataset.l10nId='details';navigator.mozL10n.localize(profileBtn,'details');item.appendChild(gotoBtn);item.appendChild(renameBtn);item.appendChild(profileBtn);evt.target.appendChild(item);var fileinfo=files[evt.target.dataset.index];handleContextmenuEvent(fileinfo);}}
function handleContextmenuEvent(fileinfo){debug('handleContextmenu fileinfo.name = '+fileinfo.name);$('details').onclick=function(e){console.log('details fileinfo.name = '+fileinfo.name);fileDetails(fileinfo);};$('rename').onclick=function(e){console.log('details fileinfo.name = '+fileinfo.name);fileRename(fileinfo);};$('folder').onclick=function(e){FileScan.goToFolder(fileinfo.name);};}
return{initPictureDB:initPictureDB,initMusicDB:initMusicDB,initVideoDB:initVideoDB,initBluetooth:initBluetooth,showFileLists:showFileLists,createListElement:createListElement,countdb:countdb,countBluetooth:countBluetooth,cancelBluetoothEnumeration:cancelBluetoothEnumeration,handleContextMenu:handleContextMenu,handleClick:handleClick,handleDateSort:handleDateSort,handleNameSort:handleNameSort,bluetoothFilecreated:bluetoothFilecreated,blueToothFileDeleted:blueToothFileDeleted,pictureFileDeleted:pictureFileDeleted,musicFileDeleted:musicFileDeleted,videoFileDeleted:videoFileDeleted,handleOpenFile:handleOpenFile};})();function showSpinner(){if($('spinner-overlay').classList.contains('hidden')){$('spinner-overlay').classList.remove('hidden');}}
function hideSpinner(){if(!$('spinner-overlay').classList.contains('hidden')){$('spinner-overlay').classList.add('hidden');}}
function addDisabled(){if(!$('icon-edit').classList.contains('disabled')){$('icon-edit').classList.add('disabled');}
if(!$('fileSort').classList.contains('disabled')){$('fileSort').classList.add('disabled');}}
function removeDisabled(){if($('icon-edit').classList.contains('disabled')){$('icon-edit').classList.remove('disabled');}
if($('fileSort').classList.contains('disabled')){$('fileSort').classList.remove('disabled');}}
function viewAttachEvents(){console.log('lxp:: viewAttachEvents');classifyLists.addEventListener('click',Classify.handleClick);classifyLists.addEventListener('contextmenu',Classify.handleContextMenu);}
function viewReleaseEvents(){console.log('lxp:: viewReleaseEvents');classifyLists.removeEventListener('click',Classify.handleClick);classifyLists.removeEventListener('contextmenu',Classify.handleContextMenu);};'use strict';var Uni2pinyin=(function(){var spell=[];var isIniting=false;var init=function(callback){if(isIniting){return;}
isIniting=true;read('/js/Uni2Pinyin.txt',function(content){var lines=content.split('",');for(var i=0;i<lines.length;i++){spell[i]=lines[i].toString().substring(lines[i].indexOf('"')+1);}
isIniting=false;if(callback){callback(spell);}});};var read=function xhrFileSystemStorage_read(name,callback){var content='';function doCallback(){if(callback){callback(content);}}
try{var xhr=new XMLHttpRequest();xhr.open('GET',name,true);xhr.responseType='text';xhr.overrideMimeType('text/plain; charset=UTF-8');xhr.onreadystatechange=function xhrReadystatechange(ev){if(xhr.readyState!==XMLHttpRequest.DONE){return;}
if(xhr.status==200||xhr.status==304){content=xhr.responseText;}else{console.log('XhrFileSystemStorage failed to load file.'+'Error Code:'+xhr.status);}
doCallback();};xhr.send(null);}catch(ex){doCallback();}};return{'init':init};})();;SequenceList=(function(){var spell=null;function init(){spell=null;if(spell==null){Uni2pinyin.init(function(ret){spell=ret;});}};function initsort(callback){if(callback)
callback;}
var isCnWord=function(str){if(str!=null){for(var i=0;i<str.length;i++){if((str.charCodeAt(i)==0x3007)||((str.charCodeAt(i)>0x4E00)&&(str.charCodeAt(i)<0x9FA5))){return true;}}}
return false;};var trim=function(str,allspc){if(allspc){return str.replace(/(^\s*)|(\s*$)|(\s+)/g,'');}
return str.replace(/(^\s*)|(\s*$)/g,'').replace(/\s+/g,0x01);};var cnWordToPinyin=function cnWordToPinyin(str,search){if(str){var pStr='';for(var i=0;i<str.length;i++){if(!isCnWord(str.charAt(i))){pStr+=str.charAt(i).toLowerCase();}else{pStr+=pinyin(str.charAt(i));}
if(!search){pStr+='560578';}}
return pStr;}
return'';};var pinyin=function pinyin(char){if(char.charCodeAt(0)==0x3007){return'ling';}
if((char.charCodeAt(0)>0x9FA5)||(char.charCodeAt(0)<0x4E00)){return'';}
var index=char.charCodeAt(0)-0x4E00;if(spell){var str='';str=spell[index];return trim(str,true);}
return'';};function pinyinSort(array){console.log('lxp:: pinyinSort');if(array==null)
return;array.sort(compareFileByName);}
function transferToPinyin(fileinfo,callback){var path=fileinfo.name;var aName=path.substring(path.lastIndexOf('/')+1);var cName;var tName=trim(aName);var cNameOrig=tName;if(isCnWord(aName)){cName=cnWordToPinyin(tName);}else{cName=tName;}
dump('lx:  ------> transfer cName = '+cName+'\n');var cNameCN=cName;if(callback)
callback(cNameCN,cNameOrig);}
function compareFileByName(a,b){var aNameCN,aNameOrig;var bNameCN,bNameOrig;transferToPinyin(a,function(name,nameorig){aNameCN=name.toLowerCase();aNameOrig=nameorig;});transferToPinyin(b,function(name,nameorig){bNameCN=name.toLowerCase();bNameOrig=nameorig;});debug('lx:aNameCN '+aNameCN+' bNameCN '+bNameCN);if(aNameCN.localeCompare(bNameCN)>0){return 1;}else if(aNameCN.localeCompare(bNameCN)<0){return-1;}else if(aNameOrig.localeCompare(bNameOrig)>0){return 1;}else if(aNameOrig.localeCompare(bNameOrig)<0){return-1;}else{return a.name.localeCompare(b.name);}}
return{'init':init,'pinyinSort':pinyinSort,'compareFileByName':compareFileByName};})();;var Modal_dialog=(function(){var _=navigator.mozL10n.get;var promptForm;var inputElement;var confirmButton;var cancelButton;var returnValue;function showDialog(detail){dump('lx: showDialog '+'\n');var message=detail.message||'';var content=detail.content||'';promptForm.classList.remove('hidden');promptForm.style.zIndex=225;promptForm.focus();var promptMessage=promptForm.querySelector('.modal-dialog-prompt-message');promptMessage.innerHTML=_(content);promptMessage.setAttribute('data-l10n-id',content);promptForm.querySelector('.modal-dialog-prompt-input').value=message;confirmButton.textContent=_('ok');cancelButton.textContent=_('cancel');}
function prompt(detail,callback){returnValue=null;promptForm=document.getElementById('modal-dialog-prompt');inputElement=promptForm.querySelector('.modal-dialog-prompt-input');confirmButton=document.getElementById('modal-dialog-prompt-ok');cancelButton=document.getElementById('modal-dialog-prompt-cancel');confirmButton.onclick=confirmHandler;cancelButton.onclick=cancelHandler;function cancelHandler(clickEvt){clickEvt.preventDefault();returnValue=null;inputElement.blur();promptForm.classList.add('hidden');callback(returnValue);}
function confirmHandler(clickEvt){clickEvt.preventDefault();returnValue=inputElement.value;promptForm.classList.add('hidden');callback(returnValue);}
showDialog(detail);}
return{prompt:prompt};}());;function debug(msg){dump('lx:handleGesture '+msg+'\n');}
var HandleGesture=(function(){var windowWidth=window.innerWidth;var windowHeight=window.innerHeight;var panningThreshold=window.innerWidth/4,tapThreshold=10;var kPageTransitionDuration=300;var startEvent,isPanning=false,startX,currentX,deltaX,startY,currentY,deltaY,removePanHandler;insertButtonMode={};var limits={left:0,right:0};var startPoint={};var isTouch='ontouchstart'in window;var touchstart=isTouch?'touchstart':'mousedown';var touchmove=isTouch?'touchmove':'mousemove';var touchend=isTouch?'touchend':'mouseup';debug(' isTouch '+isTouch+' \n ');var getX=(function getXWrapper(){return isTouch?function(e){return e.touches[0].pageX;}:function(e){return e.pageX;};})();var getY=(function getYWrapper(){return isTouch?function(e){return e.touches[0].pageY;}:function(e){return e.pageY;};})();var touchStartTimestamp=0;var touchEndTimestamp=0;var getDeltaX;var getDeltaY;function initVarible(){insertButtonMode={};touchStartTimestamp=0;touchEndTimestamp=0;limits={left:0,right:0};}
function initPanningPrediction(){debug(' initPanningPrediction ');var cPrediction={'enabled':true,'lookahead':16};if(!isTouch||!cPrediction.enabled){getDeltaX=function getDeltaX(evt){return currentX-startX;};getDeltaY=function getDeltaX(evt){return currentY-startY;};return;}
var lookahead,lastPredictionX,x0,t0,x1,t1=0;var lookahead,lastPredictionY,y0,yt0,y1,yt1=0;getDeltaX=function getDeltaX(evt){var dx,dt,velocity,adjustment,prediction,deltaP;if(t1<touchStartTimestamp){x0=startX;t0=touchStartTimestamp;lastPredictionX=null;lookahead=cPrediction.lookahead;}else{x0=x1;t0=t1;}
if(lookahead===0){return currentX-startX;}
x1=currentX;t1=evt.timeStamp;dx=x1-x0;dt=t1-t0;velocity=dx/dt;adjustment=velocity*lookahead;prediction=Math.round(x1+adjustment-startX);if(prediction>=windowWidth){prediction=windowWidth-1;}
else if(prediction<=-windowWidth){prediction=-windowWidth+1;}
if(lastPredictionX!==null){deltaP=prediction-lastPredictionX;if((deltaP>0&&dx<0)||(deltaP<0&&dx>0)){lookahead=lookahead>>1;startX+=deltaP;prediction=lastPredictionX;}}
lastPredictionX=prediction;return prediction;};getDeltaY=function getDeltaX(evt){var dy,dt,velocity,adjustment,prediction,deltaP;if(yt1<touchStartTimestamp){y0=startY;yt0=touchStartTimestamp;lastPredictionY=null;lookahead=cPrediction.lookahead;}else{y0=y1;yt0=yt1;}
if(lookahead===0){return currentY-startY;}
y1=currentY;yt1=evt.timeStamp;dy=y1-y0;dt=yt1-yt0;velocity=dy/dt;adjustment=velocity*lookahead;prediction=Math.round(y1+adjustment-startY);if(prediction>=windowHeight){prediction=windowHeight-1;}
else if(prediction<=-windowHeight){prediction=-windowHeight+1;}
if(lastPredictionY!==null){deltaP=prediction-lastPredictionY;if((deltaP>0&&dy<0)||(deltaP<0&&dy>0)){lookahead=lookahead>>1;startY+=deltaP;prediction=lastPredictionY;}}
lastPredictionY=prediction;return prediction;};}
function init(){dump('lx: gesture init ');initVarible();setDirCtrl();initPanningPrediction();}
function handleEvent(evt){dump('lx:handlegesture evt.type'+evt.type+'\n');switch(evt.type){case touchstart:evt.stopPropagation();touchStartTimestamp=evt.timeStamp;startEvent=isTouch?evt.touches[0]:evt;deltaX=0;deltaY=0;startPoint.X=startEvent.pageX;startPoint.Y=startEvent.pageY;console.log('lx:touchstart '+startPoint.X+', '+startPoint.Y+'\n');attachEvents();isPanning=false;break;case touchmove:if(evt.preventPanning===true){return;}
startX=startEvent.pageX;currentX=getX(evt);if(currentX===startX)
return;startY=startEvent.pageY;currentY=getY(evt);deltaX=getDeltaX(evt);deltaY=getDeltaY(evt);if(deltaX===0)
return;document.body.dataset.transitioning='true';window.removeEventListener(touchmove,handleEvent);var pan=function(e){currentX=getX(e);deltaX=getDeltaX(e);currentY=getY(e);deltaY=getDeltaY(e);if(!isPanning&&Math.abs(deltaX)>=tapThreshold){isPanning=true;}};removePanHandler=function removePanHandler(e){touchEndTimestamp=e?e.timeStamp:Number.MAX_VALUE;window.removeEventListener(touchend,removePanHandler,true);sdcardLists.removeEventListener(touchmove,pan,true);onTouchEnd(deltaX,deltaY,e);};sdcardLists.addEventListener(touchmove,pan,true);window.addEventListener(touchend,removePanHandler,true);window.removeEventListener(touchend,handleEvent);break;case touchend:releaseEvents();break;case'contextmenu':console.log('lx:contextmenu process \n');if(isPanning){evt.stopImmediatePropagation();return;}
console.log('lx:contextmenu process 111 \n');break;}}
function onTouchEnd(deltaX,deltaY,evt){dump('lx:onTouchEnd x = '+deltaX+'--- lx:onTouchEnd y = '+deltaY);if(((Math.abs(deltaX)>panningThreshold)&&Math.abs(deltaY)<60)||(Math.abs(deltaX)>tapThreshold&&touchEndTimestamp-touchStartTimestamp<kPageTransitionDuration&&Math.abs(deltaY)<60)){var forward=dirCtrl.goesForward(deltaX);if(forward){if(window.location.hash!='#sdcard-edit-form'){dump('lx:onTouchEnd move-left \n');hideDirectory();}}else if(!forward){if(window.location.hash!='#sdcard-edit-form'){dump('lx: onTouchEnd move-right \n');displayDirectory();}}}else if(Math.abs(deltaX)>0||Math.abs(deltaY)>0){dump('lx:maybe scroll \n');}
delete document.body.dataset.transitioning;}
function displayDirectory(){window.location.hash='#folder-directory';$('folder-directory').style.display='block';$('folder-directory').style.zIndex=1;sdcardPage.dataset.move='right-move';$('sdcard-back').classList.add('disabled');sdcardAddDisable();}
function hideDirectory(){$('folder-directory').style.display='none';$('folder-directory').style.zIndex=-1;sdcardPage.dataset.move='left-move';window.location.hash='#sdcardList';if($('sdcard-back').classList.contains('disabled'))
$('sdcard-back').classList.remove('disabled');sdcardRemoveDisable();}
function attachEvents(){window.addEventListener(touchmove,handleEvent);window.addEventListener(touchend,handleEvent);}
function releaseEvents(){window.removeEventListener(touchmove,handleEvent);window.removeEventListener(touchend,handleEvent);}
function endReleaseEvent(){sdcardLists.removeEventListener(touchstart,handleEvent);}
var dirCtrl={};function setDirCtrl(){debug(' setDirCtrl ');function goesLeft(x){return(x>0);}
function goesRight(x){return(x<0);}
function limitLeft(x){return(x<limits.left);}
function limitRight(x){return(x>limits.right);}
var rtl=(document.documentElement.dir=='rtl');dump('lx: rtl '+rtl);dirCtrl.offsetPrev=rtl?-1:1;dirCtrl.offsetNext=rtl?1:-1;dirCtrl.limitPrev=rtl?limitRight:limitLeft;dirCtrl.limitNext=rtl?limitLeft:limitRight;dirCtrl.translatePrev=rtl?'translateX(100%)':'translateX(-100%)';dirCtrl.translateNext=rtl?'translateX(-100%)':'translateX(100%)';dirCtrl.goesForward=rtl?goesLeft:goesRight;}
return{releaseEvents:releaseEvents,endReleaseEvent:endReleaseEvent,handleEvent:handleEvent,init:init};})();;var sdcardFiles=[];var sdcardOrderType='name';var foldSize=4294967294;var copyOrCutSeleted=[];var copyOrCutRecord=[];var FileScan=(function(){var lastpath='';var foldername='';var PAGE_SIZE=15;var folderContainer;var listFragment;var _storage=null;var foldercount=0;var hasfile=true;var destFilePath='';var enumerateHandle={};var countHandle={};var deleteSuccess=0;var deleteError=0;var flagCopy=false;var flagCut=false;var pasteMenu;var sdcardBackButton;var folderArray=[];var fileArray=[];function backButtonClick(){var _=navigator.mozL10n.get;cancelEnumeration(enumerateHandle);cancelEnumeration(countHandle);debug('backButtonClick lastpath '+lastpath+'\n');if(lastpath==''){sdcardLists.removeEventListener('click',clickFolder);sdcardLists.removeEventListener('contextmenu',pressFile);sdcardLists.removeEventListener('touchstart',HandleGesture.handleEvent);sdcardPage.dataset.move='';window.location.hash='#storage';sdcardBackButton.href='#root';updateInfo(volumeList);}else{sdcardBackButton.href='#sdcardList';var index=lastpath.lastIndexOf('/');lastpath=lastpath.substring(0,index);debug('back lastpath '+lastpath);if(lastpath==='/sdcard'||lastpath==='/external_sdcard'){if(volumeList.length>1&&lastpath==='/sdcard'){var storageName=getInternalStorageName(volumeList);sdcardHeader.textContent=storageName;}else{var storageName=getSdcardName(volumeList);sdcardHeader.textContent=storageName;}
lastpath='';foldername='';enumerateHandle=enumeratefolder('');}else{var filename=lastpath.substring(lastpath.lastIndexOf('/')+1);sdcardHeader.textContent=filename;var fIndex=foldername.lastIndexOf('/');foldername=foldername.substring(0,fIndex);debug('back foldername '+foldername);enumerateHandle=enumeratefolder(foldername);}}}
function init(storage,path){debug('lx:: initFileList ');initVarible();$('sdcard-sort').removeEventListener('change',sdcardOderChange);$('sdcard-sort').options[1].selected=true;HandleGesture.init();_storage=storage;folderContainer=document.querySelector('#folder-directory > ul');listFragment=document.createDocumentFragment();if(path===undefined)
enumerateHandle=enumeratefolder('');else
enumerateHandle=enumeratefolder(path);sdcardListOperate();editOperate();}
function sdcardListOperate(){sdcardBackButton.onclick=backButtonClick;folderContainer.onclick=clickFolderName;$('sdcard-sort').onchange=sdcardOderChange;$('sdcard-add-file').onclick=addNewFile;$('sdcard-refresh').onclick=function(){refreshFile(lastpath);};$('sdcard-editCheckbox').onclick=clickFolder;}
function initVarible(){sdcardFiles=[];folderArray=[];fileArray=[];lastpath='';foldername='';PAGE_SIZE=15;folderContainer=null;listFragment;_storage=null;foldercount=0;destFilePath='';sdcardOrderType='name';enumerateHandle={};countHandle={};deleteSuccess=0;deleteError=0;pasteMenu=$('paste-menu');sdcardBackButton=$('sdcard-back');}
function clickFolder(evt){if(window.location.hash=='#sdcard-edit-form'){debug('evt.type = '+evt.type+'   window.location.hash = '+
window.location.hash);console.log('lx:: evt.target = '+evt.target.nodeName);console.log('lx:className '+evt.target.parentNode.className);if(evt.target.type&&evt.target.type==='checkbox'&&evt.target.parentNode.classList.contains('edit-checkbox')){if(!checkIfSelectedAll(sdcardView)){selectedAllFiles=true;selectAll(sdcardView,'sdcard-selectedFileNum');}else{selectedAllFiles=false;deselectAll(sdcardView,'sdcard-selectedFileNum');}}
if(evt.target.type&&evt.target.type==='checkbox'){checkInputs(sdcardView,'sdcard-selectedFileNum');}
return;}
console.log('lx:clickFolder ---> '+evt.target+'\n');var input=evt.target;var type=input.type||input.dataset.type;console.log('lx:sdcardLists target '+input+' type '+type+'\n');switch(type){case'filelist':debug('press Flag '+ctxTriggered);var insertDiv=document.getElementById('insert-div');if(!ctxTriggered){if(insertDiv){editItemHidden('insert-div');sdcardLists.addEventListener('touchstart',HandleGesture.handleEvent);return;}
clickItem(evt);}else{ctxTriggered=false;}
break;default:break;}}
function clickItem(evt){var fdIndex=evt.target.dataset.index;console.log('lx:-->click  '+fdIndex+'\n');if(fdIndex){var fileinfo=sdcardFiles[fdIndex];var filePath=fileinfo.name;var filename=filePath.substring(filePath.lastIndexOf('/')+1);if(fileinfo.size===foldSize){sdcardHeader.textContent=filename;lastpath=filePath;foldername=filePath.substring(lastpath.indexOf('/',1)+1);debug(' file.name = '+foldername+' is directory'+' lastpath '+lastpath);enumerateHandle=enumeratefolder(foldername);}
else{debug(' file.name = '+filename+' is not directory'+' lastpath '+lastpath);Classify.handleOpenFile(fileinfo);}}}
function pressFile(evt){console.log('lx:press File +++++++++ '+window.location.hash);if(window.location.hash==='#sdcard-edit-form'){return;}
var insertDiv=document.getElementById('insert-div');var fdIndex=evt.target.dataset.index;console.log('lx:press file fdIndex '+fdIndex);if(!insertDiv&&fdIndex){ctxTriggered=true;sdcardLists.removeEventListener('touchstart',HandleGesture.handleEvent);var fileinfo=sdcardFiles[fdIndex];var items=sdcardLists.querySelectorAll('.file-item');var item=items[fdIndex];item.classList.add('insert-item');item.style.height='11rem';var div=document.createElement('div');div.setAttribute('id','insert-div');var renameBtn=document.createElement('button');renameBtn.setAttribute('id','rename-button');renameBtn.classList.add('insert-button');renameBtn.dataset.l10nId='rename';navigator.mozL10n.localize(renameBtn,'rename');var detailBtn=document.createElement('button');detailBtn.setAttribute('id','detail-button');detailBtn.classList.add('insert-button');detailBtn.dataset.l10nId='details';navigator.mozL10n.localize(detailBtn,'details');div.appendChild(renameBtn);div.appendChild(detailBtn);item.appendChild(div);renameBtn.onclick=function(){renameFile(fileinfo);};detailBtn.onclick=function(){fileDetails(fileinfo);};debug(' pressFile ');}}
function enumeratefolder(dir){console.log('lx:---->enumeratefolder dir  '+dir+'\n');var handle={state:'enumerating'};sdcardLists.removeEventListener('click',clickFolder);sdcardLists.removeEventListener('contextmenu',pressFile);sdcardAddDisable();sdcardLists.innerHTML='';sdcardShowSpinner();hasfile=true;var batchFiles=[];var batchsize=PAGE_SIZE;var cursor=_storage.enumerate(dir);sdcardFiles=[];folderArray=[];fileArray=[];cursor.onsuccess=function(){if(handle.state==='cancelling'){debug('  handle.state    '+handle.state);handle.state='cancelled';return;}
var fileinfo=cursor.result;if(fileinfo){if(isFolderCheck(fileinfo)){folderArray.push(fileinfo);}else{fileArray.push(fileinfo);}
batchFiles.push(fileinfo);if(batchFiles.length>=batchsize){flush();batchsize*=2;}
cursor.continue();}else{handle.state='complete';debug(' enumerate finished \n');done();if(sdcardOrderType==='date'||sdcardOrderType==='name'){sdcardLists.innerHTML='';if(sdcardOrderType==='date'){datesort(folderArray);datesort(fileArray);sdcardFiles=folderArray.concat(fileArray);}else if(sdcardOrderType==='name'){SequenceList.pinyinSort(folderArray);SequenceList.pinyinSort(fileArray);sdcardFiles=folderArray.concat(fileArray);}
var len=sdcardFiles.length;for(var i=0;i<len;i++){var fileinfo=sdcardFiles[i];var item=loadFile(fileinfo,i);listFragment.appendChild(item);}
sdcardLists.appendChild(listFragment);listFragment.innerHTML='';}
sdcardHideSpinner();dump('lx:++++++++ hash '+window.location.hash+'\n');if(window.location.hash==='#sdcardList'){sdcardRemoveDisable();}
sdcardLists.addEventListener('contextmenu',pressFile);sdcardLists.addEventListener('click',clickFolder);SequenceList.init();insertFolder(dir);fileCount();}};cursor.onerror=function(){console.log('lx: Error while scanning '+cursor.error+'\n');};function flush(){batchFiles.forEach(thumb);sdcardLists.appendChild(listFragment);listFragment.innerHTML='';batchFiles.length=0;batchFiles=[];}
function thumb(fileinfo){sdcardFiles.push(fileinfo);if(sdcardFiles.length>0&&sdcardOrderType==='default'){var item=loadFile(fileinfo,sdcardFiles.length-1);listFragment.appendChild(item);}}
function done(){flush();if(sdcardFiles.length===0){sdcardHideSpinner();}}
return handle;}
function cancelEnumeration(handle){if(handle.state==='enumerating')
handle.state='cancelling';}
function datesort(array){console.log('lxp:: datesort');if(array==null)
return;array.sort(compareFilesByDate);}
function enumerateCount(dir,callback){var handle={state:'enumerating'};var cursor=_storage.enumerate(dir);var mycount=0;foldercount=0;cursor.onsuccess=function(){if(handle.state==='cancelling'){debug('enumerateCount  handle.state    '+handle.state);handle.state='cancelled';return;}
var fileinfo=cursor.result;if(fileinfo){mycount++;cursor.continue();}else{handle.state='complete';foldercount=mycount;if(callback){callback(foldercount);}}};return handle;}
function fileCount(){var items=sdcardLists.querySelectorAll('.file-item');var len=items.length;for(var i=0;i<len;i++){fileItemCount(items[i]);}}
function fileItemCount(item){var filePath=item.dataset.path;var findex=item.dataset.index;var fileinfo=sdcardFiles[findex];if(fileinfo.size===foldSize){var foldernail='style/images/folder.png';item.querySelector('img').src=foldernail;var enumeratePath=filePath.substring(filePath.indexOf('/',1)+1);countHandle=enumerateCount(enumeratePath,function(fileSize){item.querySelector('.file-size').textContent=fileSize;});}else{var fileType=sdcardFiles[findex].type;var pictureTypes={'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/bmp':'bmp','image/vnd.wap.wbmp':'wbmp'};var musicTypes={'audio/mpeg':'mp3','audio/mp4':'m4a','audio/ogg':'ogg','audio/webm':'webm','audio/3gpp':'3gp','audio/amr':'amr','audio/aac':'aac','audio/x-wav':'wav'};var videoTypes={'video/mp4':'mp4','video/mpeg':'mpg','video/ogg':'ogg','video/webm':'webm','video/3gpp':'3gp'};if(fileType in pictureTypes){var filenail='style/images/photo.png';item.querySelector('img').src=filenail;}else if(fileType in musicTypes){var filenail='style/images/music.png';item.querySelector('img').src=filenail;}else if(fileType in videoTypes){var filenail='style/images/video.png';item.querySelector('img').src=filenail;}else{var filenail='style/images/file.png';item.querySelector('img').src=filenail;}}}
function isFolderCheck(fileinfo){if(fileinfo.size===undefined||isNaN(fileinfo.size)){return;}
if(fileinfo.size===foldSize){return true;}else{return false;}}
function loadFile(fileinfo,filenum,highlight){var content='';var li=document.createElement('li');li.classList.add('file-item');li.dataset.index=filenum;li.dataset.type='filelist';var fileinfo=fileinfo;li.dataset.path=fileinfo.name;var filePath=fileinfo.name;var filename=filePath.substring(filePath.lastIndexOf('/')+1);li.dataset.name=filename;if(isFolderCheck(fileinfo)===true){li.dataset.isFolder='true';}else{li.dataset.isFolder='false';}
content=CreateFileEntry(fileinfo);li.innerHTML=content;return li;}
function CreateFileEntry(fileinfo){var filePathOrName=fileinfo.name;var filename=filePathOrName.substring(filePathOrName.lastIndexOf('/')+1);var fileDate=new Date(fileinfo.lastModifiedDate).Format('yyyy-MM-dd hh:mm:ss');var fileSize=0;if(fileinfo.size!==foldSize){fileSize=formatSize(fileinfo.size);}
var entry='<label class="pack-checkbox mycheckbox">'+'<input type="checkbox">'+'<span data-type="span"></span> '+'</label> '+'<a href="#" >'+'<img class="picture" >'+'</img>'+'<p class="primary-info">'+filename+'</p>'+'<p class="secondary-info">'+'<span class="modify-time">'+fileDate+' | '+'</span>'+'<span class="file-size">'+fileSize+' </span>'+'</p> '+'</a>';return entry;}
function insertBeforeItem(result){console.log('lxp:: insertBeforeItem result'+result);var insertPosition=0;if(sdcardOrderType==='date'){debug('=========== dateOrder \n');if(isFolderCheck(result)){insertPosition=binarySearchPosition(folderArray,result,compareFilesByDate);folderArray.splice(insertPosition,0,result);}else{insertPosition=binarySearchPosition(fileArray,result,compareFilesByDate);folderArray.splice(insertPosition,0,result);insertPosition=folderArray.length+insertPosition;}}else if(sdcardOrderType==='name'){debug(' =========== nameOrder \n');if(isFolderCheck(result)){insertPosition=binarySearchPosition(folderArray,result,SequenceList.compareFileByName);folderArray.splice(insertPosition,0,result);}else{insertPosition=binarySearchPosition(fileArray,result,SequenceList.compareFileByName);fileArray.splice(insertPosition,0,result);insertPosition=folderArray.length+insertPosition;}}
console.log('lx: position '+insertPosition);sdcardFiles=folderArray.concat(fileArray);var items=sdcardLists.querySelectorAll('.file-item');debug('insert folder path '+lastpath+' result.name'+result.name);var item=loadFile(result,insertPosition);if(sdcardLists.hasChildNodes()){sdcardLists.insertBefore(item,items[insertPosition]);}else{sdcardLists.appendChild(item);}
var len=items.length;for(var i=insertPosition;i<len;i++){items[i].dataset.index=i+1;}
return item;}
function compareFilesByDate(a,b){if(a.lastModifiedDate.getTime()<b.lastModifiedDate.getTime())
return 1;else if(a.lastModifiedDate.getTime()>b.lastModifiedDate.getTime())
return-1;return 0;}
function binarySearchPosition(array,element,comparator,from,to){if(comparator===undefined)
comparator=function(a,b){if(a<b)
return-1;if(a>b)
return 1;return 0;};if(from===undefined)
return binarySearchPosition(array,element,comparator,0,array.length);if(from===to)
return from;var mid=Math.floor((from+to)/2);var result=comparator(element,array[mid]);debug(' compare Files result  '+result);if(result<0)
return binarySearchPosition(array,element,comparator,from,mid);else
return binarySearchPosition(array,element,comparator,mid+1,to);}
function sameFileCheck(nameEntered){var _=navigator.mozL10n.get;for(var i=0,len=sdcardFiles.length;i<len;i++){var filepath=sdcardFiles[i].name;var filename=filepath.substring(filepath.lastIndexOf('/')+1);debug('  fielname  '+filename+'\n');if(filename===nameEntered){alert('"'+filename+'" '+_('same-name'));return true;}}
return false;}
function addNewFile(){var _=navigator.mozL10n.get;var inputname='';var detail={};detail.message=inputname;detail.content='input-new-folder-name';Modal_dialog.prompt(detail,addNewFileOperate);function addNewFileOperate(nameEntered){if(!nameEntered||nameEntered==='')
return;debug('  nameEntered   '+nameEntered+'sdcardFiles.length '+
sdcardFiles.length+'\n');if(sameFileCheck(nameEntered)){return;}
createFolder(nameEntered);}
function createFolder(inputname){var addpath;console.log('lx:createFolder input name '+inputname+'\n');if(inputname==''){alert(_('input-name-message'));return;}
if(!nameCheck(inputname)){alert(_('invalid-name'));return;}
debug(' create new folder '+lastpath);if(lastpath==''){addpath=inputname;}
else{addpath=foldername+'/'+inputname;}
debug(' add folder path  '+addpath+'\n');var createRequest=_storage.createDirectory(addpath);createRequest.onsuccess=function(){var getRequest=_storage.get(createRequest.result);getRequest.onsuccess=function(){var fileinfo=getRequest.result;var item=insertBeforeItem(fileinfo);fileItemCount(item);};};createRequest.onerror=function(){console.error('Add new folder error, '+createRequest.error);alert(_('add-folder-error-message'));};}}
function dateOrderFile(){datesort(folderArray);datesort(fileArray);sdcardFiles=folderArray.concat(fileArray);var len=sdcardFiles.length;sdcardShowSpinner();for(var i=0;i<len;i++){sdcardLists.innerHTML='';listFragment.innerHtml='';var fileinfo=sdcardFiles[i];var item=loadFile(fileinfo,i);listFragment.appendChild(item);}
sdcardLists.appendChild(listFragment);sdcardHideSpinner();fileCount();}
function nameOrderFile(){SequenceList.pinyinSort(folderArray);SequenceList.pinyinSort(fileArray);sdcardFiles=folderArray.concat(fileArray);var len=sdcardFiles.length;sdcardShowSpinner();for(var i=0;i<len;i++){sdcardLists.innerHTML='';listFragment.innerHTML='';var fileinfo=sdcardFiles[i];var item=loadFile(fileinfo,i);listFragment.appendChild(item);}
sdcardLists.appendChild(listFragment);sdcardHideSpinner();fileCount();}
function sdcardOderChange(evt){var select=evt.target;debug(' sdcardOderChange'+select.value);sdcardOrderType=select.value;switch(sdcardOrderType){case'date':dateOrderFile();break;case'name':nameOrderFile();break;default:break;}}
function refreshFile(refPath){debug('lx:sdcard-refreash lastpath'+refPath);var refreshpath=refPath;if(lastpath.indexOf('/')!=-1){refreshpath=refPath.substring(refPath.indexOf('/',1)+1);}
debug('lx:sdcard-refreash refreshpath'+refreshpath);enumerateHandle=enumeratefolder(refreshpath);}
function editOperate(){$('cut').onclick=function(){var _=navigator.mozL10n.get;if(srcFilePath.length===0){alert(_('no-file-to-cut'));return;}
var len=fileSelected.length;debug('lx: cut '+len+' currentView '+currentView);if(len>0&&(currentView=='option-internal-sdcard'||currentView=='option-sdcard-0')){sdcardShowSpinner();flagCopy=false;flagCut=true;copyOrCutRecord=[];copyOrCutSeleted.map(function(fileinfo){copyOrCutRecord.push(fileinfo);});cancelEditMode();showPasteMenu();pasteOperate();sdcardHideSpinner();}};$('copy').onclick=function(){console.log('lxp:: paste copy click');var _=navigator.mozL10n.get;if(srcFilePath.length===0){alert(_('no-file-to-copy'));return;}
var len=fileSelected.length;debug('lx: copy '+len+' currentView '+currentView);if(len>0&&(currentView=='option-internal-sdcard'||currentView=='option-sdcard-0')){sdcardShowSpinner();flagCopy=true;flagCut=false;copyOrCutRecord=[];copyOrCutSeleted.map(function(fileinfo){copyOrCutRecord.push(fileinfo);});cancelEditMode();showPasteMenu();pasteOperate();sdcardHideSpinner();}};$('sdcard-share').onclick=fileShare;$('sdcard-delete').onclick=function(){var _=navigator.mozL10n.get;if(srcFilePath.length===0){var deleteMsg=_('no-file-to-delete');alert(deleteMsg);return;}
var confirmMsg=_('delete-confirm',{n:srcFilePath.length});if(confirm(confirmMsg)){deleteFile();}};}
function showPasteMenu(){if(pasteMenu.classList.contains('hidden')){pasteMenu.classList.remove('hidden');}}
function renameFile(fileinfo){var _=navigator.mozL10n.get;var filepath=fileinfo.name;var filename=filepath.substring(filepath.lastIndexOf('/')+1);var detail={};detail.message=filename;detail.content='change-name';Modal_dialog.prompt(detail,renameOperate);function renameOperate(nameEntered){dump('lx: renameFile nameEntered '+nameEntered+'\n');if(!nameEntered||nameEntered===''||filename==''){if(nameEntered===''){alert(_('input-new-name-message'));}
return;}
debug(' rename  nameEntered   '+nameEntered+'\n');if(sameFileCheck(nameEntered)){return;}
if(!nameCheck(nameEntered)){alert(_('invalid-name'));return;}
if(countCharacters(nameEntered)>255){alert(filename+' '+_('rename-error'));return;}
var sdcarddb=_storage;var destpath=filepath.substring(0,filepath.lastIndexOf('/')+1)+nameEntered;if(!mediaChanged)
mediaChanged=true;var renamerequest=sdcarddb.moveTo(filepath,destpath);renamerequest.onsuccess=function(){var result=renamerequest.result;deleteItem(result);var getRequest=_storage.get(destpath);getRequest.onsuccess=function(){var item=insertBeforeItem(getRequest.result);fileItemCount(item);refreshFile(lastpath);};sdcardLists.addEventListener('touchstart',HandleGesture.handleEvent);};renamerequest.onerror=function(){console.error('Rename error'+renamerequest.error+'\n');alert(filename+' '+_('rename-error'));};}}
function deleteFile(){sdcardShowSpinner();var _=navigator.mozL10n.get;deleteSuccess=0;deleteError=0;srcFilePath.forEach(function(filepath){deleteItemFile(filepath);});}
function deleteItemFile(filepath){var _=navigator.mozL10n.get;var deletepath=filepath.substring(filepath.indexOf('/',1)+1);debug('lx: delete  '+deletepath);var storage=_storage;if(!mediaChanged)
mediaChanged=true;var delRequest=storage.delete(deletepath);delRequest.onsuccess=function(){debug('delete file');deleteItem(filepath);deleteSuccess++;if((deleteSuccess+deleteError)===srcFilePath.length){sdcardHideSpinner();clearEditArray();deselectAll(sdcardView,'sdcard-selectedFileNum');if(sdcardFiles.length===0){window.history.go(-1);}}};delRequest.onerror=function(evt){function errorCallback(){alert(filepath+' '+_('delete-error'));deleteError++;if((deleteSuccess+deleteError)===srcFilePath.length){sdcardHideSpinner();clearEditArray();deselectAll(sdcardView,'sdcard-selectedFileNum');if(sdcardFiles.length===0){window.history.go(-1);}}}
setTimeout(errorCallback,0);};}
function deleteItem(filepath){debug('deleteItem filepath '+filepath+'\n');for(var n=0;n<sdcardFiles.length;n++){if(sdcardFiles[n].name===filepath)
break;}
if(n>=sdcardFiles.length)
return;if(sdcardFiles[n].size===foldSize){folderArray.splice(n,1);}else{fileArray.splice(n-folderArray.length,1);}
sdcardFiles.splice(n,1);var items=sdcardLists.querySelectorAll('.file-item');sdcardLists.removeChild(items[n]);var len=items.length;for(var i=n+1;i<len;i++){items[i].dataset.index=i-1;}}
function pasteOperate(){var _=navigator.mozL10n.get;$('paste').onclick=function(){console.log('lxp:: paste click');sdcardShowSpinner();pasteMenu.classList.add('disabled');sdcardBackButton.classList.add('disabled');if(lastpath==''){destFilePath='/'+_storage.storageName+'/';}else{destFilePath=lastpath+'/';}
debug('paste file path  '+lastpath);var countSuccess=0;var countError=0;var totalCount=0;function afterCopyOrCut(){copyOrCutRecord=[];sdcardHideSpinner();sdcardBackButton.classList.remove('disabled');pasteMenu.classList.remove('disabled');pasteMenu.classList.add('hidden');clearEditArray();if(flagCopy){flagCopy=false;}
if(flagCut){flagCut=false;}}
debug('paste  copyOrCutRecord length'+copyOrCutRecord.length);debug('paste destFilePath '+destFilePath);for(var i=0;i<copyOrCutRecord.length;i++){var srcPath=copyOrCutRecord[i].name;if(destFilePath.indexOf(srcPath+'/')===-1&&flagCopy){break;}
if(destFilePath.indexOf(srcPath+'/')!==-1){alert(_('the-same-folder'));afterCopyOrCut();break;}
var srcLocation=srcPath.substring(0,srcPath.lastIndexOf('/')+1);console.log('paste srcLocation '+srcLocation);if(srcLocation===destFilePath&&flagCut){alert(_('cut-in-the-same-folder'));afterCopyOrCut();break;}}
var _cpuWakeLock=navigator.requestWakeLock('cpu');copyOrCutRecord.forEach(function(fileinfo){var srcPath=fileinfo.name;console.log('lxp:: paste forEach srcPath = '+srcPath);var srcfilename=srcPath.substring(srcPath.lastIndexOf('/')+1);var srcfile=srcPath.substring(0,srcPath.lastIndexOf('/')+1);if(flagCopy){debug('-------> copy srcfile '+srcfile+' destFilePath  '+
destFilePath+'\n');var copyrequest=_storage.copyTo(srcPath,destFilePath);copyrequest.onsuccess=function(){function successCallback(){countSuccess++;totalCount=countSuccess+countError;if(totalCount==copyOrCutRecord.length){destFilePath='';afterCopyOrCut();console.log('lxp:: paste lastpath = '+lastpath);refreshFile(lastpath);if(!mediaChanged)
mediaChanged=true;if(_cpuWakeLock){_cpuWakeLock.unlock();_cpuWakeLock=null;}}}
successCallback();};copyrequest.onerror=function(){function errorCallback(){alert(srcfilename+' '+_('copy-error'));countError++;totalCount=countSuccess+countError;if(totalCount==copyOrCutRecord.length){destFilePath='';afterCopyOrCut();console.log('lxp:: paste lastpath = '+lastpath);refreshFile(lastpath);if(_cpuWakeLock){_cpuWakeLock.unlock();_cpuWakeLock=null;}}}
setTimeout(errorCallback,0);};}else if(flagCut){debug('-------> cut srcfile '+srcfile+' destFilePath  '+
destFilePath+'\n');if(!mediaChanged)
mediaChanged=true;var cutrequest=_storage.moveTo(srcPath,destFilePath);cutrequest.onsuccess=function(){function successCallback(){countSuccess++;totalCount=countSuccess+countError;if(totalCount==copyOrCutRecord.length){destFilePath='';afterCopyOrCut();console.log('lxp:: paste lastpath = '+lastpath);refreshFile(lastpath);if(_cpuWakeLock){_cpuWakeLock.unlock();_cpuWakeLock=null;}}}
successCallback();};cutrequest.onerror=function(){function errorCallback(){alert(srcfilename+' '+_('cut-error'));countError++;totalCount=countSuccess+countError;if(totalCount==copyOrCutRecord.length){destFilePath='';afterCopyOrCut();console.log('lxp:: paste lastpath = '+lastpath);refreshFile(lastpath);if(_cpuWakeLock){_cpuWakeLock.unlock();_cpuWakeLock=null;}}}
setTimeout(errorCallback,0);};}});};$('cancel').onclick=function(){copyOrCutRecord=[];clearEditArray();flagCopy=false;flagCut=false;pasteMenu.classList.add('hidden');};}
function userSelectedFile(num){copyOrCutSeleted.push(sdcardFiles[num]);var filePath=sdcardFiles[num].name;srcFilePath.push(filePath);}
function insertFolder(dir){dump(' lx:======= insertFolder dir  '+dir);var fragElement=document.createDocumentFragment();folderContainer.innerHTML='';dir='/'+_storage.storageName+'/'+dir;dump(' lx:after insertFolder dir  '+dir);if(dir==('/'+_storage.storageName+'/')){var item=insertFolderEntry('/'+_storage.storageName,'/'+_storage.storageName);folderContainer.appendChild(item);}else{var index=0;var start=1;while((start=lastpath.indexOf('/',start))!=-1){var folder=lastpath.substring(index,start);var path=lastpath.substring(0,start);index=start;console.log('lx:insert folder '+folder+'  path  '+path+'\n');var item=insertFolderEntry(folder,path);fragElement.appendChild(item);start++;}
var folder=lastpath.substring(lastpath.lastIndexOf('/'));var item=insertFolderEntry(folder,lastpath);fragElement.appendChild(item);folderContainer.appendChild(fragElement);}}
function insertFolderEntry(folder,path){var item=document.createElement('li');item.dataset.path=path;if(folder===path){if(volumeList.length>1&&folder==='/sdcard'){folder='/'+getInternalStorageName(volumeList);}else{folder='/'+getSdcardName(volumeList);}}
item.innerHTML='<a class="folder-link">'+'<img class="picture" src="style/images/folder.png">'+'</img>'+'<span class="folderName">'+folder+'</span>'+'</a>';return item;}
function clickFolderName(evt){var _=navigator.mozL10n.get;var target=evt.target;dump('lx: clickFolderName target '+evt.target);dump('lx: folderName path '+target.dataset.path);var path=target.dataset.path;if(path==('/'+_storage.storageName)){lastpath='';if(volumeList.length>1&&_storage.storageName==='sdcard'){var storageName=getInternalStorageName(volumeList);sdcardHeader.textContent=storageName;}else{var storageName=getSdcardName(volumeList);sdcardHeader.textContent=storageName;}
enumeratefolder('');}else{var filename=path.substring(path.lastIndexOf('/')+1);sdcardHeader.textContent=filename;lastpath=path;path=path.substring(path.indexOf('/',1)+1);dump('lx: click enumeratefolder path '+path+'\n');enumeratefolder(path);}
console.log('lx: clickFolderName lastpath '+lastpath+'\n');}
function goToFolder(path){debug('lx:----> path '+path);var _=navigator.mozL10n.get;window.location.hash='#sdcardList';var storageName=path.substring(1,path.indexOf('/',1));console.log('lxp:: storageName = '+storageName);var directory=path.substring(0,path.lastIndexOf('/'));if(volumeList.length>1&&storageName==='sdcard'){currentView='option-internal-sdcard';var storage=getInternalStorage(volumeList);}else{currentView='option-sdcard-0';var storage=getSdcard(volumeList);}
if(directory==='/sdcard'||directory==='/external_sdcard'){var location='';if(volumeList.length>1&&storageName==='sdcard'){var storageName=getInternalStorageName(volumeList);sdcardHeader.textContent=storageName;}else{var storageName=getSdcardName(volumeList);sdcardHeader.textContent=storageName;}}else{var index=path.lastIndexOf('/');var index2=path.indexOf('/',1);var location=path.substring(index2+1,index);var filename=directory.substring(directory.lastIndexOf('/')+1);sdcardHeader.textContent=filename;}
init(storage,location);if(directory!=='/sdcard'&&directory!=='/external_sdcard'){lastpath=path.substring(0,path.lastIndexOf('/'));foldername=lastpath.substring(lastpath.indexOf('/',1)+1);}}
return{userSelectedFile:userSelectedFile,pasteOperate:pasteOperate,showPasteMenu:showPasteMenu,enumerateCount:enumerateCount,clickFolder:clickFolder,goToFolder:goToFolder,dateOrderFile:dateOrderFile,nameOrderFile:nameOrderFile,loadFile:loadFile,fileCount:fileCount,flagCopy:flagCopy,flagCut:flagCut,init:init};}());function sdcardShowSpinner(){if($('sdcard-spinner-overlay').classList.contains('hidden')){$('sdcard-spinner-overlay').classList.remove('hidden');}}
function sdcardHideSpinner(){if(!$('sdcard-spinner-overlay').classList.contains('hidden')){$('sdcard-spinner-overlay').classList.add('hidden');}}
function sdcardAddDisable(){if(!$('sdcard-fileSort').classList.contains('disabled')){$('sdcard-fileSort').classList.add('disabled');}
if(!$('sdcard-addFile').classList.contains('disabled')){$('sdcard-addFile').classList.add('disabled');}
if(!$('sdcard-refresh').classList.contains('disabled')){$('sdcard-refresh').classList.add('disabled');}
if(!$('sdcard-icon-edit').classList.contains('disabled')){$('sdcard-icon-edit').classList.add('disabled');}}
function sdcardRemoveDisable(){if($('sdcard-fileSort').classList.contains('disabled')){$('sdcard-fileSort').classList.remove('disabled');}
if($('sdcard-addFile').classList.contains('disabled')){$('sdcard-addFile').classList.remove('disabled');}
if($('sdcard-refresh').classList.contains('disabled')){$('sdcard-refresh').classList.remove('disabled');}
if($('sdcard-icon-edit').classList.contains('disabled')){$('sdcard-icon-edit').classList.remove('disabled');}};'use strict';var DEBUG=false;var CONFIG_MAX_IMAGE_PIXEL_SIZE=5242880;var CONFIG_MAX_SNAPSHOT_PIXEL_SIZE=5242880;var CONFIG_REQUIRED_EXIF_PREVIEW_WIDTH=0;var CONFIG_REQUIRED_EXIF_PREVIEW_HEIGHT=0;var CONFIG_MAX_GIF_IMAGE_FILE_SIZE=2097152;var CONFIG_MAX_GIF_IMAGE_PIXEL_SIZE=1048576;var volumeList=[];var photodb;var musicdb;var videodb;var db;var enumerated={};var bluetoothenumerated={};var photodbFirstScan=false;var musicdbFirstScan=false;var videodbFirstScan=false;var bluetoothdbFirstScan=false;var photodbScan=false;var musicdbScan=false;var videodbScan=false;var bluetoothdbScan=false;var scanningBigImages=false;var files=[];var sortType='date';var classifyHeader=$('classify-title');var sdcardHeader=$('sdcard-title');var fresh=$('fresh');var rootPage=document.querySelector('#root');var backButton=$('file-back');var listPage=document.querySelector('#fileListView');var currentView='';var classifyLists=document.querySelector('#fileListView > ul');var sdcardPage=document.getElementById('sdcardList');var sdcardLists=document.querySelector('#sdcardList > ul');var sdcardView=sdcardLists;var cancelButton=document.getElementById('cancel-button');var editForm=document.getElementById('edit-form');var classifyShareBtn=document.getElementById('classify-share');var classifyDeleteBtn=document.getElementById('classify-delete');var fileSelected=[];var srcFilePath=[];var selectedFileNamesToBlobs={};var selectedAllFiles=false;var ctxTriggered=false;var currentOverlay;var mediaChanged=false;function showOverlay(id){currentOverlay=id;if(id===null){document.getElementById('overlay').classList.add('hidden');return;}
var title,text;if(id==='nocard'){title=navigator.mozL10n.get('nocard2-title');text=navigator.mozL10n.get('nocard2-text');}else{title=navigator.mozL10n.get(id+'-title');text=navigator.mozL10n.get(id+'-text');}
var titleElement=document.getElementById('overlay-title');var textElement=document.getElementById('overlay-text');titleElement.textContent=title;titleElement.dataset.l10nId=id+'-title';textElement.textContent=text;textElement.dataset.l10nId=id+'-text';document.getElementById('overlay').classList.remove('hidden');}
$('overlay').addEventListener('click',function dummyHandler(){});function editItemHidden(id){var insertEle=document.getElementById(id);if(insertEle&&insertEle.parentNode){insertEle.parentNode.style.height='6rem';insertEle.parentNode.removeChild(insertEle);}}
document.addEventListener('visibilitychange',function visibilityChange(){if(!document.mozHidden&&(window.location.hash=='#root'||window.location.hash=='#classify'||window.location.hash=='#storage')){freshMainPage();}});navigator.mozL10n.ready(function startupLocale(){dump('filemanager:: navigator.mozL10n.ready');if(volumeList.length===0){MediaStorage.init();}});window.addEventListener('localized',function localized(){dump('filemanager:: localized');document.documentElement.lang=navigator.mozL10n.language.code;document.documentElement.dir=navigator.mozL10n.language.direction;});window.addEventListener('load',function startup(evt){dump('filemanager:: load');window.removeEventListener('load',startup);function initDBOrUpdateInfo(){if(!musicdb){console.log('lxp:: init music');musicdbFirstScan=true;if(!$('fresh-button').classList.contains('freshing'))
$('fresh-button').classList.add('freshing');$('picture').classList.add('disabled');$('music').classList.add('disabled');$('video').classList.add('disabled');Classify.initMusicDB();}}
initDBOrUpdateInfo();bluetoothdbFirstScan=true;Classify.countBluetooth();SequenceList.init();pageSwitch.init('#root');fresh.addEventListener('click',freshMainPage);backButton.onclick=cancelEnumerate;initEdit();window.addEventListener('hashchange',showPanel);switch(window.location.hash){case'#root':break;case'':document.location.hash='root';break;default:document.getElementById('root').classList.remove('current');showPanel();break;}});var oldHash=window.location.hash||'#root';function showPanel(){debug('showPanel  window.location.hash ='+window.location.hash);if(window.location.hash==='#classify'){$('classify').classList.remove('hidden');$('storage').classList.add('hidden');$('classify-filter').setAttribute('aria-selected','true');$('storage-filter').setAttribute('aria-selected','false');currentPage=0;$('classify').style.transform='translateX(0px)';rootPage.dataset.type='classify';if(mediaChanged&&!photodbScan&&!musicdbScan&&!videodbScan&&!bluetoothdbScan&&!photodbFirstScan&&!musicdbFirstScan&&!videodbFirstScan&&!bluetoothdbFirstScan){freshMainPage();}
return;}
if(window.location.hash==='#storage'){$('classify').classList.add('hidden');$('storage').classList.remove('hidden');$('classify-filter').setAttribute('aria-selected','false');$('storage-filter').setAttribute('aria-selected','true');currentPage=1;$('storage').style.transform='translateX(0px)';rootPage.dataset.type='storage';return;}
if(window.location.hash=='#edit-form'){if(cancelButton&&cancelButton.classList.contains('disabled')){cancelButton.classList.remove('disabled');}
if(!$('sort-filter').classList.contains('hidden')){$('sort-filter').classList.add('hidden');}
if($('edit-select').classList.contains('hidden')){$('edit-select').classList.remove('hidden');}
listPage.classList.toggle('edit');checkInputs(classifyLists,'selectedFileNum');editItemHidden('contextmenuItem');oldHash=window.location.hash;return;}
if(window.location.hash=='#sdcard-edit-form'){if(sdcardCancelButton&&sdcardCancelButton.classList.contains('disabled')){sdcardCancelButton.classList.remove('disabled');}
selectedAllFiles=false;deselectAll(sdcardView,'sdcard-selectedFileNum');if(!$('sdcard-sort-filter').classList.contains('hidden')){$('sdcard-sort-filter').classList.add('hidden');}
if($('sdcard-edit-select').classList.contains('hidden')){$('sdcard-edit-select').classList.remove('hidden');}
sdcardPage.classList.toggle('edit');sdcardLists.removeEventListener('touchstart',HandleGesture.handleEvent);checkInputs(sdcardView,'sdcard-selectedFileNum');editItemHidden('insert-div');console.log('showpanel remove Touchstart');oldHash=window.location.hash;console.log('lxp:: sdcard-edit-form oldHash = '+oldHash);return;}
if(window.location.hash=='#root'){currentView='';}
if(window.location.hash==='#fileListView'){selectedAllFiles=false;deselectAll(classifyLists,'selectedFileNum');$('editCheckbox').querySelector('input').checked=false;if($('sort-filter').classList.contains('hidden')){$('sort-filter').classList.remove('hidden');}
if(!$('edit-select').classList.contains('hidden')){$('edit-select').classList.add('hidden');}
if(oldHash==='#edit-form'){listPage.classList.remove('edit');oldHash=window.location.hash;return;}}
if(window.location.hash==='#sdcardList'){$('sdcard-editCheckbox').querySelector('input').checked=false;if($('sdcard-sort-filter').classList.contains('hidden')){$('sdcard-sort-filter').classList.remove('hidden');}
if(!$('sdcard-edit-select').classList.contains('hidden')){$('sdcard-edit-select').classList.add('hidden');}
sdcardLists.addEventListener('touchstart',HandleGesture.handleEvent);if(oldHash==='#sdcard-edit-form'){sdcardPage.classList.remove('edit');oldHash=window.location.hash;console.log('lxp:: sdcardList oldHash = '+oldHash);return;}}
var hash=window.location.hash;var oldPanel=document.querySelector(oldHash);var newPanel=document.querySelector(hash);oldPanel.className=newPanel.className?'':'previous';newPanel.className='current';oldHash=hash;if((window.scrollX!==0)||(window.scrollY!==0)){window.scrollTo(0,0);}
window.addEventListener('transitionend',function paintWait(){window.removeEventListener('transitionend',paintWait);});}
function tap(evt){console.log('tap evt.target.id = '+evt.target.id);var _=navigator.mozL10n.get;function reset(){$('sort').removeEventListener('change',handleSort);$('sort').options[0].selected=true;sortType='date';cleanUI();}
switch(evt.target.id){case'option-picture':currentView='option-picture';navigator.mozL10n.localize(classifyHeader,'classify-picture');reset();console.log('init Picture DB');Classify.showFileLists('picture','date','prev');break;case'option-music':currentView='option-music';navigator.mozL10n.localize(classifyHeader,'classify-music');reset();console.log('init Music DB');Classify.showFileLists('music','date','prev');break;case'option-video':currentView='option-video';navigator.mozL10n.localize(classifyHeader,'classify-video');reset();console.log('init Video DB');Classify.showFileLists('video','date','prev');break;case'option-bluetooth':currentView='option-bluetooth';navigator.mozL10n.localize(classifyHeader,'classify-bluetooth');reset();console.log('init bluetooth');Classify.initBluetooth();break;case'option-internal-sdcard':currentView='option-internal-sdcard';var storage=getInternalStorage(volumeList);var storageName=getInternalStorageName(volumeList);if(storageName!==''){sdcardHeader.textContent=storageName;$('folder-storage-name').textContent=storageName;}
console.log('fileSelected.length = '+fileSelected.length);if(fileSelected.length>0&&(FileScan.flagCopy||FileScan.flagCut)){FileScan.showPasteMenu();FileScan.pasteOperate();}
console.log('init optionSDcard');FileScan.init(storage);break;case'option-sdcard-0':currentView='option-sdcard-0';var storage=getSdcard(volumeList);var storageName=getSdcardName(volumeList);if(storageName!==''){sdcardHeader.textContent=storageName;$('folder-storage-name').textContent=storageName;}
console.log('fileSelected.length = '+fileSelected.length);if(fileSelected.length>0&&(FileScan.flagCopy||FileScan.flagCut)){FileScan.showPasteMenu();FileScan.pasteOperate();}
console.log('init optionSDcard');FileScan.init(storage);break;default:console.log('lxp:: default');break;}}
function cancelEnumerate(){debug('cancelEnumerate currentView = '+currentView);if(enumerated.state&&enumerated.state==='enumerating'){db.cancelEnumeration(enumerated);}
if(bluetoothenumerated.state&&bluetoothenumerated.state==='enumerating'){console.log('bluetoothenumerated.state = '+bluetoothenumerated.state);Classify.cancelBluetoothEnumeration(bluetoothenumerated);}
if(mediaChanged&&!photodbScan&&!musicdbScan&&!videodbScan&&!bluetoothdbScan&&!photodbFirstScan&&!musicdbFirstScan&&!videodbFirstScan&&!bluetoothdbFirstScan){freshMainPage();}}
function freshMainPage(){debug('freshMainPage fresh');if($('fresh-button').classList.contains('freshing'))
return;if(!$('fresh-button').classList.contains('freshing'))
$('fresh-button').classList.add('freshing');if(rootPage.dataset.type==='storage'){console.log('lxp:: freshMainPage fresh rootPage.dataset.type = '+
rootPage.dataset.type);updateInfo(volumeList);}else{mediaChanged=false;bluetoothdbScan=true;Classify.countBluetooth();if(musicdb&&!musicdbFirstScan){$('picture').classList.add('disabled');$('music').classList.add('disabled');$('video').classList.add('disabled');musicdbScan=true;musicdb.scan();}}}
function cleanUI(){console.log('lxp:: cleanUI');if(classifyLists.firstChild!==null){classifyLists.innerHTML='';}}
var sdcardCancelButton=document.getElementById('sdcard-cancel');var editForm=document.getElementById('edit-form');var sdcardForm=document.getElementById('sdcard-edit-form');var selectedAllFiles=false;function initEdit(){cancelButton.onclick=cancelEditMode;sdcardCancelButton.onclick=cancelEditMode;classifyLists.addEventListener('click',editHandleEvent);$('editCheckbox').addEventListener('click',editHandleEvent);classifyShareBtn.onclick=fileShare;classifyDeleteBtn.onclick=fileDelete;editForm.addEventListener('submit',editHandleEvent);}
function editHandleEvent(evt){debug('evt.type = '+evt.type+'   window.location.hash = '+
window.location.hash);switch(evt.type){case'click':console.log('lxp:: editHandleEvent click');if(window.location.hash!='#edit-form'){return;}
if(evt.target.type&&evt.target.type==='checkbox'&&evt.target.parentNode.classList.contains('edit-checkbox')){if(!checkIfSelectedAll(classifyLists)){selectedAllFiles=true;selectAll(classifyLists,'selectedFileNum');}else{selectedAllFiles=false;deselectAll(classifyLists,'selectedFileNum');}
break;}
if(evt.target.type&&evt.target.type==='checkbox'){checkInputs(classifyLists,'selectedFileNum');}
break;case'submit':evt.preventDefault();return false;break;default:return;}}
function selectAll(view,selectedNum){debug('selectAll view '+view);var selectAllInput=view.parentNode.querySelector('.select-deselect-all');if(selectAllInput&&selectAllInput.classList.contains('disabled')){return;}
if(selectAllInput){selectAllInput.classList.add('disabled');}
var inputs=view.querySelectorAll('input[type="checkbox"]:not(:checked)');for(var i=0;i<inputs.length;i++){inputs[i].checked=true;chooseItem(inputs[i]);}
checkInputs(view,selectedNum);}
function deselectAll(view,selectedNum){debug('deselectAll view '+view);var selectAllInput=view.parentNode.querySelector('.select-deselect-all');if(selectAllInput&&selectAllInput.classList.contains('disabled')){return;}
if(selectAllInput){selectAllInput.classList.add('disabled');}
var inputs=view.querySelectorAll('input[type="checkbox"]:checked');for(var i=0;i<inputs.length;i++){inputs[i].checked=false;chooseItem(inputs[i]);}
checkInputs(view,selectedNum);}
function cancelEditMode(e){if(checkSelected){return;}
if(e&&e.target==cancelButton){if(cancelButton.classList.contains('disabled')){return;}
cancelButton.classList.add('disabled');}
if(e&&e.target==sdcardCancelButton){if(sdcardCancelButton.classList.contains('disabled')){return;}
sdcardCancelButton.classList.add('disabled');}
window.history.go(-1);}
function chooseItem(target){if(!target.checked){target.parentNode.classList.remove('selected');}else{target.parentNode.classList.add('selected');}}
function checkIfSelectedAll(view){var selected=view.querySelectorAll('input[type="checkbox"]:checked');var allInputs=view.querySelectorAll('input[type="checkbox"]');if(selected.length===allInputs.length){return true;}
return false;}
var checkSelected=false;function checkInputs(view,selectedNum){checkSelected=true;var selected=view.querySelectorAll('input[type="checkbox"]:checked');var allInputs=view.querySelectorAll('input[type="checkbox"]');if(selected.length===allInputs.length){if(view==sdcardView){$('sdcard-editCheckbox').querySelector('input').checked=true;}
if(view==classifyLists){$('editCheckbox').querySelector('input').checked=true;}}else{if(view==sdcardView){$('sdcard-editCheckbox').querySelector('input').checked=false;}
if(view==classifyLists){$('editCheckbox').querySelector('input').checked=false;}}
if(selected.length>0){navigator.mozL10n.localize($(selectedNum),'selected',{n:selected.length});}else{navigator.mozL10n.localize($(selectedNum),'no-selected');}
clearEditArray();var flag='false';for(var i=0;i<selected.length;i++){debug('checkInputs '+selected.length+' selected[i].parentNode.dataset.index = '+
selected[i].parentNode.parentNode.dataset.index);fileSelected.push(selected[i]);var num=selected[i].parentNode.parentNode.dataset.index;if(currentView==='option-internal-sdcard'||currentView==='option-sdcard-0'){if(selected[i].parentNode.parentNode.dataset.isFolder=='true'){flag='true';}
FileScan.userSelectedFile(num);}else{var fileName=files[num].name;srcFilePath.push(fileName);}}
if(flag=='true'){$('sdcard-share').classList.add('disabled');}else{if($('sdcard-share').classList.contains('disabled')){$('sdcard-share').classList.remove('disabled');}}
var selectAllInput=view.parentNode.querySelector('.select-deselect-all');if(selectAllInput&&selectAllInput.classList.contains('disabled')){selectAllInput.classList.remove('disabled');}
checkSelected=false;debug('checkInputs fileSelected.length = '+fileSelected.length);}
function fileShare(){var _=navigator.mozL10n.get;if(srcFilePath.length===0){var shareMsg=_('no-file-to-share');alert(shareMsg);return;}
if(JSON.stringify(selectedFileNamesToBlobs)!=='{}'){reallyShare();return;}
if(window.location.hash==='#edit-form'){if(srcFilePath.length>50){showSpinner();}}
if(window.location.hash==='#sdcard-edit-form'){if(srcFilePath.length>50){sdcardShowSpinner();}}
var getFileNum=0;srcFilePath.forEach(function(filename){getFile(filename,function(file){selectedFileNamesToBlobs[filename]=file;if(getFileNum===srcFilePath.length){reallyShare();}},function(){if(getFileNum===srcFilePath.length){reallyShare();}});});function getFile(filename,callback,errback){console.log('lxp:: filename = '+filename);var storage=navigator.getDeviceStorage('extrasdcard');var getRequest=storage.get(filename);getRequest.onsuccess=function(){getFileNum++;callback(getRequest.result);};getRequest.onerror=function(){getFileNum++;var errmsg=getRequest.error&&getRequest.error.name;if(errback)
errback(errmsg);else
console.error('MediaDB.getFile:',errmsg);};}
function reallyShare(){var blobs=srcFilePath.map(function(name){return selectedFileNamesToBlobs[name];});share(blobs);if(window.location.hash==='#edit-form'){hideSpinner();}
if(window.location.hash==='#sdcard-edit-form'){sdcardHideSpinner();}}}
function share(blobs){debug('files share blobs.length = '+blobs.length);var _=navigator.mozL10n.get;if(blobs.length===0){var shareMsg=_('no-file-to-share');alert(shareMsg);return;}
var names=[],types=[],fullpaths=[];blobs.forEach(function(blob){debug('blobs.forEach '+blob.name);var name=blob.name;fullpaths.push(name);name=name.substring(name.lastIndexOf('/')+1);names.push(name);var type=blob.type;debug('files share type = '+type);if(type)
type=type.substring(0,type.indexOf('/'));types.push(type);debug('types files share type = '+type);});var type;if(types.length===1||types.every(function(t){return t===types[0];})){type=types[0]+'/*';}else{type='multipart/mixed';}
var a=new MozActivity({name:'share',data:{type:type,number:blobs.length,blobs:blobs,filenames:names,filepaths:fullpaths}});a.onsuccess=function(e){console.log('share success!');if(currentView==='option-internal-sdcard'||currentView==='option-sdcard-0'){deselectAll(sdcardView,'sdcard-selectedFileNum');}else{deselectAll(classifyLists,'selectedFileNum');}};a.onerror=function(e){console.log('share error!');if(a.error.name==='NO_PROVIDER'){var errorMsg=_('share-noprovider');alert(errorMsg);}
else{console.warn('share activity error:',a.error.name);}};}
function fileDelete(){var _=navigator.mozL10n.get;if(srcFilePath.length===0){var deleteMsg=_('no-file-to-delete');alert(deleteMsg);return;}
var confirmMsg=_('delete-confirm',{n:srcFilePath.length});if(confirm(confirmMsg)){showSpinner();var deleteSuccess=0;var deleteError=0;var storage=navigator.getDeviceStorage('extrasdcard');srcFilePath.forEach(function(filename){var request=storage.delete(filename);request.onerror=function(e){function errorCallbcak(){console.error('bluetoothdb.deleteFile(): Failed to delete',filename,'from DeviceStorage:',e.target.error);var name=filename.substring(filename.lastIndexOf('/')+1);alert(name+' '+_('delete-error'));deleteError++;if((deleteSuccess+deleteError)===srcFilePath.length){hideSpinner();clearEditArray();deselectAll(classifyLists,'selectedFileNum');}}
setTimeout(errorCallbcak,0);};request.onsuccess=function(e){deleteSuccess++;switch(currentView){case'option-picture':Classify.pictureFileDeleted(filename);break;case'option-music':Classify.musicFileDeleted(filename);break;case'option-video':Classify.videoFileDeleted(filename);break;case'option-bluetooth':Classify.blueToothFileDeleted(filename);break;}
if(!mediaChanged)
mediaChanged=true;console.log('fileDelete: success from DeviceStorage');if((deleteSuccess+deleteError)===srcFilePath.length){hideSpinner();clearEditArray();deselectAll(classifyLists,'selectedFileNum');}};});}}
function fileDetails(fileinfo){var _=navigator.mozL10n.get;var data={};console.log('lxp:: fileDetails fileinfo = '+JSON.stringify(fileinfo));var index=fileinfo.name.lastIndexOf('/');var index2=fileinfo.name.indexOf('/',1);var fileName=fileinfo.name.substring(index+1);var location=fileinfo.name.substring(0,index+1);var dlElement=document.querySelector('#detail-view dl');if(volumeList.length>1&&location.indexOf('/sdcard/')===0){var storageName=getInternalStorageName(volumeList);location=location.replace(/sdcard/,storageName);}else if(location.indexOf('/sdcard/')===0){var storageName=getSdcardName(volumeList);location=location.replace(/sdcard/,storageName);}else if(location.indexOf('/external_sdcard/')===0){var storageName=getSdcardName(volumeList);location=location.replace(/external_sdcard/,storageName);}
if(fileinfo.size&&fileinfo.size==0xffffffff-1){var filepath=fileinfo.name.substring(index2+1);console.log('lxp:: fileDetails filePath '+filepath);FileScan.enumerateCount(filepath,function(fileCount){var fileLabel=$('file-label');fileLabel.setAttribute('data-l10n-id','files-count-label');fileLabel.textContent=_('files-count-label');$('detail-view').classList.remove('hidden');$('detail-view').style.zIndex=225;data={'detail-location':location,'detail-name':fileName,'detail-count':fileCount};MediaUtils.populateMediaInfo(data);});}else if(fileinfo.size&&fileinfo.size!=0xffffffff-1){var fileLabel=$('file-label');fileLabel.setAttribute('data-l10n-id','file-size-label');fileLabel.textContent=_('file-size-label');$('detail-view').classList.remove('hidden');$('detail-view').style.zIndex=225;data={'detail-location':location,'detail-name':fileName,'detail-count':formatSize(fileinfo.size)};MediaUtils.populateMediaInfo(data);}else if(fileinfo.size===0){var fileLabel=$('file-label');fileLabel.setAttribute('data-l10n-id','file-size-label');fileLabel.textContent=_('file-size-label');$('detail-view').classList.remove('hidden');$('detail-view').style.zIndex=225;data={'detail-location':location,'detail-name':fileName,'detail-count':formatSize(fileinfo.size)};MediaUtils.populateMediaInfo(data);}else{alert(_('unknown-details'));}}
$('detail-close-button').onclick=function hideFileInformation(){$('detail-view').classList.add('hidden');};var renameScan=false;function fileRename(fileinfo){console.log('lxp:: fileRename');var _=navigator.mozL10n.get;var srcPath=fileinfo.name;var myName=fileinfo.name.substring(fileinfo.name.lastIndexOf('/')+1);var destPath=fileinfo.name.substring(0,fileinfo.name.lastIndexOf('/')+1);var detail={};detail.message=myName;detail.content='change-name';Modal_dialog.prompt(detail,fileRenameOperate);function fileRenameOperate(nameEntered){if(!nameEntered||nameEntered===''||nameEntered===myName){if(nameEntered===''){alert(_('input-new-name-message'));}
return;}
var newName=nameEntered;if(!nameCheck(newName)){alert(_('invalid-name'));return;}
console.log('rename newName = '+newName+'  destPath = '+destPath);if(countCharacters(nameEntered)>255){alert(myName+' '+_('rename-error'));return;}
var renamedb=navigator.getDeviceStorage('extrasdcard');var request=renamedb.moveTo(srcPath,destPath+newName);request.onsuccess=function(){console.log('rename success');if(!mediaChanged)
mediaChanged=true;var result=request.result;for(var i=0 in result){console.log('rename:: result.'+i+' = '+result[i]);}
renameScan=true;showSpinner();addDisabled();switch(currentView){case'option-picture':photodb.scan();break;case'option-music':musicdb.scan();break;case'option-video':videodb.scan();break;case'option-bluetooth':Classify.blueToothFileDeleted(fileinfo.name);var getRequest=renamedb.get(destPath+newName);getRequest.onsuccess=function(){Classify.bluetoothFilecreated(getRequest.result);};getRequest.onerror=function(){var errmsg=getRequest.error&&getRequest.error.name;console.error('lxp:: bluetooth file rename  getFile: ',errmsg);alert(myName+' '+_('delete-error'));};break;}};request.onerror=function(){console.error('Rename error'+request.error+'\n');alert(myName+' '+_('rename-error'));};}}
function clearEditArray(){fileSelected=[];srcFilePath=[];copyOrCutSeleted=[];selectedFileNamesToBlobs={};}
function handleSort(event){debug('handleSort event.target.type = '+event.target.type);var input=event.target;var type=input.dataset.type||input.type;var key=input.name;if(!key||event.type!='change')
return;var value;switch(type){case'select-one':value=input.value;sortType=value;console.log('lxp:: select-one value = '+value);break;}
if(sortType==='date'){console.log('lxp:: handleSort date sortType = '+sortType);Classify.handleDateSort();}else if(sortType==='name'){console.log('lxp:: handleSort name sortType = '+sortType);Classify.handleNameSort();}}
function debug(s){if(DEBUG){console.log('File Manager :: '+s+'\n');}};var THUMBNAIL_WIDTH=60;var THUMBNAIL_HEIGHT=60;function metaDataParserVideo(videofile,callback){var previewPlayer=document.createElement('video');var metadata={};if(!previewPlayer.canPlayType(videofile.type)){console.log('lxp:: !previewPlayer.canPlayType videofile.type = '+
videofile.type);metadata.isVideo=false;callback(metadata);return;}
var url=URL.createObjectURL(videofile);previewPlayer.preload='metadata';previewPlayer.src=url;previewPlayer.style.width=THUMBNAIL_WIDTH+'px';previewPlayer.style.height=THUMBNAIL_HEIGHT+'px';previewPlayer.onerror=function(e){console.error("Can't play video",videofile.name,e);metadata.isVideo=false;unload();callback(metadata);};previewPlayer.onloadedmetadata=function(){if(!previewPlayer.videoWidth){metadata.isVideo=false;unload();callback(metadata);console.log('lxp:: videofile.name = '+videofile.name);console.log('lxp:: metadata.isVideo = '+metadata.isVideo);return;}
metadata.isVideo=true;var index=videofile.name.lastIndexOf('/');var fileName=videofile.name.substring(index+1);metadata.title=fileName;console.log('lxp:: metadata.title = '+metadata.title);console.log('lxp:: metadata.isVideo = '+metadata.isVideo);metadata.duration=previewPlayer.duration;metadata.width=previewPlayer.videoWidth;metadata.height=previewPlayer.videoHeight;if(/.3gp$/.test(videofile.name)){getVideoRotation(videofile,function(rotation){if(typeof rotation==='number')
metadata.rotation=rotation;else if(typeof rotation==='string')
console.warn('Video rotation:',rotation);createThumbnail();});}else{metadata.rotation=0;createThumbnail();}};function createThumbnail(){previewPlayer.currentTime=Math.min(5,previewPlayer.duration/10);var failed=false;var timeout=setTimeout(fail,10000);previewPlayer.onerror=fail;function fail(){console.warn('Seek failed while creating thumbnail for ',videofile.name,'. Ignoring corrupt file.');failed=true;clearTimeout(timeout);previewPlayer.onerror=null;metadata.isVideo=false;unload();callback(metadata);}
previewPlayer.onseeked=function(){if(failed)
return;clearTimeout(timeout);captureFrame(previewPlayer,metadata,function(poster){if(poster===null){fail();}
else{metadata.poster=poster;unload();callback(metadata);}});};}
function unload(){URL.revokeObjectURL(previewPlayer.src);previewPlayer.removeAttribute('src');previewPlayer.load();}
function readFromMetadata(lowerCaseKey){var tags=previewPlayer.mozGetMetadata();for(var key in tags){if(key.toLowerCase()===lowerCaseKey){return tags[key];}}
return;}}
function captureFrame(player,metadata,callback){try{var canvas=document.createElement('canvas');var ctx=canvas.getContext('2d');canvas.width=THUMBNAIL_WIDTH;canvas.height=THUMBNAIL_HEIGHT;var vw=player.videoWidth,vh=player.videoHeight;var tw,th;switch(metadata.rotation){case 90:ctx.translate(THUMBNAIL_WIDTH,0);ctx.rotate(Math.PI/2);tw=THUMBNAIL_HEIGHT;th=THUMBNAIL_WIDTH;break;case 180:ctx.translate(THUMBNAIL_WIDTH,THUMBNAIL_HEIGHT);ctx.rotate(Math.PI);tw=THUMBNAIL_WIDTH;th=THUMBNAIL_HEIGHT;break;case 270:ctx.translate(0,THUMBNAIL_HEIGHT);ctx.rotate(-Math.PI/2);tw=THUMBNAIL_HEIGHT;th=THUMBNAIL_WIDTH;break;default:tw=THUMBNAIL_WIDTH;th=THUMBNAIL_HEIGHT;break;}
var scale=Math.min(tw/vw,th/vh),w=scale*vw,h=scale*vh,x=(tw-w)/2/scale,y=(th-h)/2/scale;ctx.scale(scale,scale);ctx.drawImage(player,x,y);canvas.toBlob(callback,'image/jpeg');}
catch(e){console.error('Exception in captureFrame:',e,e.stack);callback(null);}};'use strict';'use strict';var currentPage=0;var pageSwitch=(function(){var container;var windowWidth=window.innerWidth;var thresholdForPanning=window.innerWidth/4;var thresholdForTapping=10;var kPageTransitionDuration=300;var pages=[];var limits={left:0,right:0};var startEvent,isPanning=false;var isTouch='ontouchstart'in window;var touchstart=isTouch?'touchstart':'mousedown';var touchmove=isTouch?'touchmove':'mousemove';var touchend=isTouch?'touchend':'mouseup';var getX=(function getXWrapper(){return isTouch?function(e){return e.touches[0].pageX;}:function(e){return e.pageX;};})();function handleEvent(evt){switch(evt.type){case touchstart:debug('lxp:: touchstart');evt.stopPropagation();touchStartTimestamp=evt.timeStamp;startEvent=isTouch?evt.touches[0]:evt;debug('lxp:: pageX = '+startEvent.pageX+' pageY = '+startEvent.pageY);attachEvents();break;case touchmove:if(evt.preventPanning===true){return;}
var deltaX=getX(evt)-startEvent.pageX;if(!isPanning){if(Math.abs(deltaX)<thresholdForTapping){return;}else{isPanning=true;document.body.dataset.transitioning='true';debug(' ispanning = true');}}
window.removeEventListener(touchmove,handleEvent);togglePagesVisibility(currentPage-1,currentPage+1);debug(' togglePagesVisibility');var index=currentPage;var previous=index?pages[index-1].style:{};previous.transition='';previous.transform='translateX('+(-windowWidth)+'px)';var current=pages[index].style;current.transition='';current.transform='';var next=index<pages.length-1?pages[index+1].style:{};next.transition='';next.transform='translateX('+windowWidth+'px)';var translate='translateX($px)';var startX=startEvent.pageX;var forward=deltaX>0;debug(' ok start');var refresh;if(index===0){refresh=function(e){if(deltaX<=0){next.transform=translate.replace('$',windowWidth+deltaX);current.transform=translate.replace('$',deltaX);}};}else if(index===pages.length-1){refresh=function(e){if(deltaX>=0){previous.transform=translate.replace('$',-windowWidth+deltaX);current.transform=translate.replace('$',deltaX);}
else{return;}};}else{refresh=function(e){if(deltaX>=0){previous.transform=translate.replace('$',-windowWidth+deltaX);if(!forward){forward=true;next.transform=translate.replace('$',windowWidth);}}else{next.transform=translate.replace('$',windowWidth+deltaX);if(forward){forward=false;previous.transform=translate.replace('$',-windowWidth);}}
current.transform=translate.replace('$',deltaX);};}
var pan=function(e){debug(' pan');deltaX=getX(e)-startX;window.mozRequestAnimationFrame(refresh);};var pageContainer=pages[index];pageContainer.addEventListener(touchmove,pan,true);var removePanHandler=function removePanHandler(e){touchEndTimestamp=e?e.timeStamp:Number.MAX_VALUE;window.removeEventListener(touchend,removePanHandler,true);pageContainer.removeEventListener(touchmove,pan,true);isPanning=false;window.mozRequestAnimationFrame(function panTouchEnd(){onTouchEnd(deltaX,e);});};window.addEventListener(touchend,removePanHandler,true);window.removeEventListener(touchend,handleEvent);break;case touchend:releaseEvents();if(!isPanning&&evt.target.href&&currentView===''){tap(evt);}
isPanning=false;break;}}
function onTouchEnd(deltaX,evt){debug(' onTouchEnd');var page=currentPage;if(Math.abs(deltaX)>thresholdForPanning||(Math.abs(deltaX)>thresholdForTapping&&touchEndTimestamp-touchStartTimestamp<kPageTransitionDuration)){var forward=dirCtrl.goesForward(deltaX);if(forward&&currentPage<pages.length-1){page=page+1;}else if(!forward&&currentPage>=1){page=page-1;}}else if(!isPanning&&evt){releaseEvents();}
goToPage(page);}
function attachEvents(){window.addEventListener(touchmove,handleEvent);window.addEventListener(touchend,handleEvent);}
function releaseEvents(){window.removeEventListener(touchmove,handleEvent);window.removeEventListener(touchend,handleEvent);}
function togglePagesVisibility(start,end){for(var i=0;i<pages.length;i++){var pagediv=pages[i];if(i<start||i>end){pagediv.classList.add('hidden');}else{pagediv.classList.remove('hidden');}}}
var touchStartTimestamp=0;var touchEndTimestamp=0;var lastGoingPageTimestamp=0;function goToPage(index,callback){window.removeEventListener('hashchange',showPanel);if(index<0||index>=pages.length)
return;var delay=touchEndTimestamp-lastGoingPageTimestamp||kPageTransitionDuration;lastGoingPageTimestamp+=delay;var duration=delay<kPageTransitionDuration?delay:kPageTransitionDuration;var goToPageCallback=function(){if(callback){callback();}
togglePagesVisibility(index,index);previousPage.style.transform='translateX(0px)';previousPage.addEventListener('transitionend',function transitionEnd(e){previousPage.removeEventListener('transitionend',transitionEnd);debug('lxp:: goToPageCallback previousPage transitionend');delete document.body.dataset.transitioning;window.addEventListener('hashchange',showPanel);window.location.hash='#'+pages[index].id;debug('lxp:: goToPageCallback window.location.hash = '+
window.location.hash);});};var previousPage=pages[currentPage];var newPage=pages[index];if(index>=currentPage){var forward=1;var start=currentPage;var end=index;}else{var forward=-1;var start=index;var end=currentPage;}
togglePagesVisibility(start,end);currentPage=index;if(previousPage==newPage){goToPageCallback();newPage.style.transition='all '+kPageTransitionDuration+'ms ease';newPage.style.transform='translateX(0px)';return;}
newPage.getBoundingClientRect();previousPage.style.transition='all '+
kPageTransitionDuration+'ms ease';previousPage.style.transform='translateX('+
(-forward*windowWidth)+'px)';newPage.style.transition='all '+kPageTransitionDuration+'ms ease';newPage.style.transform='translateX(0px)';container.addEventListener('transitionend',function transitionEnd(e){container.removeEventListener('transitionend',transitionEnd);goToPageCallback();});}
function goToNextPage(callback){document.body.dataset.transitioning='true';goToPage(currentPage+1,callback);}
function goToPreviousPage(callback){document.body.dataset.transitioning='true';goToPage(currentPage-1,callback);}
var dirCtrl={};function setDirCtrl(){function goesLeft(x){return(x>0);}
function goesRight(x){return(x<0);}
function limitLeft(x){return(x<limits.left);}
function limitRight(x){return(x>limits.right);}
var rtl=(document.documentElement.dir=='rtl');dirCtrl.offsetPrev=rtl?-1:1;dirCtrl.offsetNext=rtl?1:-1;dirCtrl.limitPrev=rtl?limitRight:limitLeft;dirCtrl.limitNext=rtl?limitLeft:limitRight;dirCtrl.translatePrev=rtl?'translateX(100%)':'translateX(-100%)';dirCtrl.translateNext=rtl?'translateX(-100%)':'translateX(100%)';dirCtrl.goesForward=rtl?goesLeft:goesRight;}
function initUI(selector){container=document.querySelector(selector);var page1=document.getElementById('classify');pages.push(page1);var page2=document.getElementById('storage');pages.push(page2);page1.addEventListener(touchstart,handleEvent,true);page2.addEventListener(touchstart,handleEvent,true);limits.left=container.offsetWidth*0.05;limits.right=container.offsetWidth*0.95;setDirCtrl();}
return{init:function gm_init(gridSelector){initUI(gridSelector);},goToPage:goToPage,goToPreviousPage:goToPreviousPage,goToNextPage:goToNextPage,dirCtrl:dirCtrl};})();