(() => {
  "use strict";

  const editor = document.getElementById("gridEditorDialog");
  const formDialog = document.getElementById("gridEditorFormDialog");
  const form = document.getElementById("gridEditorForm");
  const fields = document.getElementById("gridEditorFormFields");
  const tree = document.getElementById("gridEditorTree");
  const status = document.getElementById("gridEditorStatus");
  const formStatus = document.getElementById("gridEditorFormStatus");
  const methods = {capacites:"Capacités",bareme:"Barème",distribution:"Distribution",compteur:"Compteur",minuteur:"Minuteur",bonus:"Bonus"};
  const methodIcons = {capacites:"target",bareme:"rule",distribution:"leaderboard",compteur:"add_circle",minuteur:"hourglass_empty",bonus:"star"};
  let draft = null, dirty = false, formValue = null, formTarget = null, dragging = null;

  function identifier(prefix) {
    const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${value}`;
  }
  function newGrid() {
    const date = new Date();
    const created = [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
    return {versionFormat:1,id:identifier("grille"),titre:"Nouvelle grille",metadonnees:{version:"1.0.0",dateCreation:created,auteur:null,langue:"fr",etiquettes:[],description:""},parametres:{noteMaximum:20,plafondBonus:3,decimalesNote:2,decimalesPourcentage:2},parties:[]};
  }
  function newCapability() {return {id:identifier("capacite"),titre:"Nouvelle capacité",poids:1,aideNotation:"",commentaires:{NA:[],ECA:[],A:[]}}}
  function newCriterion() {return {id:identifier("critere"),titre:"Nouveau critère",pointsMaximum:1,pas:0.25,aideNotation:""}}
  function newCategory(method="capacites") {
    const node={id:identifier("categorie"),titre:"Nouvelle catégorie",methode:method,evaluee:true,informationsFonctionnement:""};
    if(method==="bonus")return {...node,pointsMaximum:2,pas:0.25,commentairesValorisation:[]};
    Object.assign(node,{priseEnCompte:"obligatoire",coefficient:1,niveaux:["NA","ECA","A"],commentaires:{niveaux:{NA:[],ECA:[],A:[]},attention:[],depasse:[]}});
    if(method==="capacites")Object.assign(node,{valeursNiveaux:{NA:0,ECA:50,A:100},seuilsPourcentage:{ECA:25,A:75},capacites:[newCapability()],sousCategories:[]});
    if(method==="bareme")Object.assign(node,{seuilsPourcentage:{ECA:25,A:75},criteres:[newCriterion()]});
    if(method==="distribution")Object.assign(node,{valeursNiveaux:{NA:0,ECA:50,A:100},seuilsPourcentage:{ECA:25,A:75}});
    if(method==="compteur")node.seuilsOccurrences={ECA:2,A:4,D:6};
    if(method==="minuteur")Object.assign(node,{dureeCibleSecondes:300,seuilsSecondes:{naTropCourt:120,entreeA:240,sortieA:360,naTropLong:480},courbe:{origine:"automatique",interpolation:"lineaire",points:[{secondes:0,pourcentage:0},{secondes:10,pourcentage:5},{secondes:120,pourcentage:33},{secondes:240,pourcentage:100},{secondes:360,pourcentage:100},{secondes:480,pourcentage:33},{secondes:590,pourcentage:5},{secondes:600,pourcentage:0}]}});
    return node;
  }
  function children(entry) {
    if(entry.kind==="root")return draft.parties.map(node=>({kind:"partie",node}));
    if(entry.kind==="partie")return (entry.node.categories||[]).map(node=>({kind:"categorie",node}));
    if(entry.kind==="sousCategorie")return (entry.node.capacites||[]).map(node=>({kind:"capacite",node}));
    if(entry.kind!=="categorie")return [];
    if(entry.node.methode==="bareme")return (entry.node.criteres||[]).map(node=>({kind:"critere",node}));
    if(entry.node.methode!=="capacites")return [];
    const items=[...(entry.node.capacites||[]).map(node=>({kind:"capacite",node})),...(entry.node.sousCategories||[]).map(node=>({kind:"sousCategorie",node}))];
    const order=entry.node.ordreEnfants||[],positions=new Map(order.map((id,index)=>[id,index]));
    return items.sort((first,second)=>(positions.get(first.node.id)??order.length)-(positions.get(second.node.id)??order.length));
  }
  function entries() {
    const result=[];
    function visit(parent,depth){for(const entry of children(parent)){entry.parent=parent;entry.depth=depth;result.push(entry);visit(entry,depth+1)}}
    visit({kind:"root",node:draft},1);return result;
  }
  function find(id) {return entries().find(entry=>entry.node.id===id)}
  function accepts(parent,kind) {
    if(parent.kind==="root")return kind==="partie";
    if(parent.kind==="partie")return kind==="categorie";
    if(parent.kind==="sousCategorie")return kind==="capacite";
    if(parent.kind!=="categorie")return false;
    return parent.node.methode==="capacites"?["capacite","sousCategorie"].includes(kind):parent.node.methode==="bareme"&&kind==="critere";
  }
  function replaceChildren(parent,items) {
    if(parent.kind==="root")draft.parties=items.map(item=>item.node);
    else if(parent.kind==="partie")parent.node.categories=items.map(item=>item.node);
    else if(parent.kind==="sousCategorie")parent.node.capacites=items.map(item=>item.node);
    else if(parent.kind==="categorie"&&parent.node.methode==="bareme")parent.node.criteres=items.map(item=>item.node);
    else if(parent.kind==="categorie"&&parent.node.methode==="capacites"){
      parent.node.capacites=items.filter(item=>item.kind==="capacite").map(item=>item.node);
      parent.node.sousCategories=items.filter(item=>item.kind==="sousCategorie").map(item=>item.node);
      parent.node.ordreEnfants=items.map(item=>item.node.id);
    }
  }
  function contains(entry,id) {return entry.node.id===id||children(entry).some(child=>contains(child,id))}
  function move(id,targetId,position) {
    const source=find(id),target=find(targetId);if(!source||!target||source.node.id===target.node.id||contains(source,targetId))return false;
    const destination=position==="inside"?target:target.parent;
    if(!accepts(destination,source.kind))return false;
    if(source.kind==="capacite"){
      const currentCategory=categoryFor(source),nextCategory=destination.kind==="categorie"?destination.node:categoryFor(destination);
      if(currentCategory&&nextCategory&&JSON.stringify(currentCategory.niveaux)!==JSON.stringify(nextCategory.niveaux)&&!window.confirm("Les niveaux de la catégorie de destination sont différents. Les commentaires de la capacité seront conservés, mais certains ne seront pas affichés. Continuer ?"))return false;
    }
    const oldParent=source.parent,oldItems=children(oldParent).filter(item=>item.node.id!==id);
    replaceChildren(oldParent,oldItems);
    const next=children(destination),index=position==="inside"?next.length:next.findIndex(item=>item.node.id===targetId)+(position==="after"?1:0);
    if(index<0){replaceChildren(oldParent,[...oldItems,{kind:source.kind,node:source.node}]);return false}
    next.splice(index,0,{kind:source.kind,node:source.node});replaceChildren(destination,next);dirty=true;renderTree();return true;
  }
  function announce(message) {status.hidden=!message;status.textContent=message}
  function iconButton(icon,label,action) {
    const button=document.createElement("button");button.type="button";button.className="grid-editor-icon";button.title=label;button.setAttribute("aria-label",label);
    const symbol=document.createElement("span");symbol.className="menu-icon";symbol.style.setProperty("--icon",`url('icones/${icon}.svg')`);symbol.setAttribute("aria-hidden","true");button.appendChild(symbol);
    button.addEventListener("click",action);return button;
  }
  function removeEntry(entry) {
    if(!window.confirm(`Supprimer « ${entry.node.titre} » et tous ses éléments ?`))return;
    replaceChildren(entry.parent,children(entry.parent).filter(item=>item.node.id!==entry.node.id));dirty=true;renderTree();
  }
  function addChild(entry,kind) {
    const node=kind==="categorie"?newCategory():kind==="sousCategorie"?{id:identifier("sous-categorie"),titre:"Nouvelle sous-catégorie",capacites:[]}:kind==="critere"?newCriterion():newCapability();
    const items=children(entry);items.push({kind,node});replaceChildren(entry,items);dirty=true;renderTree();openEntryForm(node.id);
  }
  function keyboardMove(entry,key) {
    const siblings=children(entry.parent),index=siblings.findIndex(item=>item.node.id===entry.node.id);
    if(key==="ArrowUp"&&index>0)return move(entry.node.id,siblings[index-1].node.id,"before");
    if(key==="ArrowDown"&&index<siblings.length-1)return move(entry.node.id,siblings[index+1].node.id,"after");
    if(key==="ArrowRight"&&index>0)return move(entry.node.id,siblings[index-1].node.id,"inside");
    if(key==="ArrowLeft"&&entry.parent.kind!=="root")return move(entry.node.id,entry.parent.node.id,"after");
    return false;
  }
  function beginDrag(event,entry,handle) {
    if(event.button!==0)return;event.preventDefault();handle.setPointerCapture(event.pointerId);
    dragging={id:entry.node.id,x:event.clientX,y:event.clientY,target:null,position:null,moved:false};
    handle.addEventListener("pointermove",dragMove);handle.addEventListener("pointerup",finishDrag,{once:true});handle.addEventListener("pointercancel",finishDrag,{once:true});
  }
  function dragMove(event) {
    if(!dragging)return;
    if(Math.hypot(event.clientX-dragging.x,event.clientY-dragging.y)<5&&!dragging.moved)return;
    dragging.moved=true;dragging.target=null;dragging.position=null;tree.querySelectorAll(".drop-before,.drop-after,.drop-inside").forEach(row=>row.classList.remove("drop-before","drop-after","drop-inside"));
    const pane=tree.closest(".grid-editor-content"),paneBounds=pane.getBoundingClientRect();
    if(event.clientY<paneBounds.top+30)pane.scrollTop-=12;else if(event.clientY>paneBounds.bottom-30)pane.scrollTop+=12;
    const row=document.elementFromPoint(event.clientX,event.clientY)?.closest(".grid-editor-row");if(!row||!tree.contains(row))return;
    const source=find(dragging.id),target=find(row.dataset.id);if(!source||!target||contains(source,target.node.id))return;
    const bounds=row.getBoundingClientRect(),inside=event.clientX>bounds.left+Math.min(110,bounds.width*.35)&&accepts(target,source.kind);
    const position=inside?"inside":event.clientY<bounds.top+bounds.height/2?"before":"after",parent=inside?target:target.parent;
    if(!accepts(parent,source.kind)){dragging.target=null;return}
    dragging.target=target.node.id;dragging.position=position;row.classList.add(`drop-${position}`);
  }
  function finishDrag(event) {
    const handle=event.currentTarget;handle.removeEventListener("pointermove",dragMove);handle.removeEventListener("pointerup",finishDrag);handle.removeEventListener("pointercancel",finishDrag);tree.querySelectorAll(".drop-before,.drop-after,.drop-inside").forEach(row=>row.classList.remove("drop-before","drop-after","drop-inside"));
    if(event.type==="pointerup"&&dragging?.moved&&dragging.target){if(!move(dragging.id,dragging.target,dragging.position))announce("Ce déplacement n'est pas compatible avec la structure de la grille.");else announce("Élément déplacé.")}
    else if(event.type==="pointerup"&&dragging?.moved)announce("Ce déplacement n'est pas compatible avec la structure de la grille.");
    dragging=null;
  }
  function renderTree() {
    document.getElementById("gridEditorTitle").textContent=draft.titre;
    tree.replaceChildren();const all=entries();
    if(!all.length){const empty=document.createElement("p");empty.className="grid-editor-empty";empty.textContent="Aucune partie";tree.appendChild(empty);return}
    for(const entry of all){
      const row=document.createElement("div");row.className=`grid-editor-row grid-editor-${entry.kind}`;row.dataset.id=entry.node.id;row.style.setProperty("--tree-depth",entry.depth-1);
      const handle=iconButton("dehaze",`Déplacer ${entry.node.titre} (Alt et flèches au clavier)`,()=>{});handle.classList.add("grid-editor-handle");handle.setAttribute("aria-keyshortcuts","Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight");handle.addEventListener("pointerdown",event=>beginDrag(event,entry,handle));handle.addEventListener("keydown",event=>{if(!event.altKey||!event.key.startsWith("Arrow"))return;event.preventDefault();if(keyboardMove(entry,event.key)){announce("Élément déplacé.");tree.querySelector(`[data-id="${CSS.escape(entry.node.id)}"] .grid-editor-handle`)?.focus()}else announce("Déplacement impossible à cet emplacement.")});row.appendChild(handle);
      row.appendChild(iconButton("edit",`Modifier ${entry.node.titre}`,()=>openEntryForm(entry.node.id)));
      const label=document.createElement("span");label.className="grid-editor-node-title";label.textContent=entry.node.titre;row.appendChild(label);
      const kind=document.createElement("span");kind.className="grid-editor-node-kind";kind.textContent=entry.kind==="categorie"?methods[entry.node.methode]:{partie:"Partie",sousCategorie:"Sous-catégorie",capacite:"Capacité",critere:"Critère"}[entry.kind];row.appendChild(kind);
      const actions=document.createElement("div");actions.className="grid-editor-row-actions";
      if(entry.kind==="partie")actions.appendChild(iconButton("add_circle",`Ajouter une catégorie à ${entry.node.titre}`,()=>addChild(entry,"categorie")));
      if(entry.kind==="categorie"&&entry.node.methode==="capacites"){
        actions.appendChild(iconButton("add_circle",`Ajouter une capacité à ${entry.node.titre}`,()=>addChild(entry,"capacite")));
        actions.appendChild(iconButton("stacks",`Ajouter une sous-catégorie à ${entry.node.titre}`,()=>addChild(entry,"sousCategorie")));
      }
      if(entry.kind==="categorie"&&entry.node.methode==="bareme")actions.appendChild(iconButton("add_circle",`Ajouter un critère à ${entry.node.titre}`,()=>addChild(entry,"critere")));
      if(entry.kind==="sousCategorie")actions.appendChild(iconButton("add_circle",`Ajouter une capacité à ${entry.node.titre}`,()=>addChild(entry,"capacite")));
      actions.appendChild(iconButton("delete",`Supprimer ${entry.node.titre}`,()=>removeEntry(entry)));row.appendChild(actions);tree.appendChild(row);
    }
  }
  function inputField(label,value,change,options={}) {
    const wrap=document.createElement("label");wrap.className="grid-editor-field";const name=document.createElement("span");name.textContent=label;wrap.appendChild(name);
    const input=options.multiline?document.createElement("textarea"):document.createElement("input");
    if(!options.multiline)input.type=options.type||"text";input.value=value??"";if(options.required)input.required=true;
    for(const key of ["min","max","step"])if(options[key]!==undefined)input[key]=String(options[key]);
    input.addEventListener(options.event||"input",()=>{if(input.type==="number"&&input.value==="")return;change(input.type==="number"?Number(input.value):input.value)});wrap.appendChild(input);return wrap;
  }
  function selectField(label,value,options,change) {
    const wrap=document.createElement("label");wrap.className="grid-editor-field";const name=document.createElement("span");name.textContent=label;wrap.appendChild(name);
    const select=document.createElement("select");for(const [id,title] of options){const option=document.createElement("option");option.value=id;option.textContent=title;select.appendChild(option)}
    select.value=value;select.addEventListener("change",()=>change(select.value,select));wrap.appendChild(select);return wrap;
  }
  function section(title) {
    const group=document.createElement("fieldset");group.className="grid-editor-fieldset";const legend=document.createElement("legend");legend.textContent=title;group.appendChild(legend);fields.appendChild(group);return group;
  }
  function commentList(parent,title,items,limit=Infinity) {
    const group=document.createElement("div");group.className="grid-editor-comment-group";const heading=document.createElement("span");heading.textContent=title;group.appendChild(heading);
    const list=document.createElement("div");list.className="grid-editor-comments";group.appendChild(list);
    function renderComments(){
      list.replaceChildren();for(const [index,item] of items.entries()){
        const row=document.createElement("div");row.className="grid-editor-comment-row";const input=document.createElement("input");input.type="text";input.required=true;input.value=item.texte||"";input.setAttribute("aria-label",`${title}, commentaire ${index+1}`);input.addEventListener("input",()=>{item.texte=input.value});row.appendChild(input);
        row.appendChild(iconButton("delete",`Supprimer le commentaire ${index+1} de ${title}`,()=>{items.splice(index,1);renderComments()}));list.appendChild(row);
      }
      add.disabled=items.length>=limit;
    }
    const add=iconButton("add_circle",`Ajouter un commentaire pour ${title}`,()=>{items.push({id:identifier("commentaire"),texte:""});renderComments();list.lastElementChild?.querySelector("input")?.focus()});group.appendChild(add);renderComments();parent.appendChild(group);
  }
  function renderLevelComments(target,levels) {
    const details=document.createElement("details");details.className="grid-editor-comment-details";const summary=document.createElement("summary");summary.textContent="Commentaires par niveau";details.appendChild(summary);
    for(const level of levels){target[level]=target[level]||[];commentList(details,level,target[level])}fields.appendChild(details);
  }
  function setLevels(node,mode) {
    const next=mode==="4"?["NA","ECA-","ECA+","A"]:["NA","ECA","A"];
    node.niveaux=next;
    if(node.valeursNiveaux)node.valeursNiveaux=mode==="4"?{NA:node.valeursNiveaux.NA??0,"ECA-":33,"ECA+":67,A:node.valeursNiveaux.A??100}:{NA:node.valeursNiveaux.NA??0,ECA:50,A:node.valeursNiveaux.A??100};
    if(node.seuilsPourcentage)node.seuilsPourcentage=mode==="4"?{"ECA-":17,"ECA+":50,A:83}:{ECA:25,A:75};
    if(node.seuilsOccurrences)node.seuilsOccurrences=mode==="4"?{"ECA-":2,"ECA+":3,A:4,D:6}:{ECA:2,A:4,D:6};
    if(node.methode==="minuteur"&&mode==="4")node.separationsECASecondes={tropCourt:(node.seuilsSecondes.naTropCourt+node.seuilsSecondes.entreeA)/2,tropLong:(node.seuilsSecondes.sortieA+node.seuilsSecondes.naTropLong)/2};
    if(node.methode==="minuteur"&&mode==="3")delete node.separationsECASecondes;
    const current=node.commentaires?.niveaux||{};node.commentaires=node.commentaires||{};node.commentaires.niveaux=Object.fromEntries(next.map(id=>[id,current[id]||[]]));
  }
  function categoryFor(entry) {
    let parent=entry.parent;while(parent&&parent.kind!=="categorie"){if(parent.kind==="root")return null;parent=find(parent.node.id)?.parent}return parent?.node||null;
  }
  function automaticCurve(node) {
    const limits=node.seuilsSecondes,short=limits.naTropCourt,start=limits.entreeA,end=limits.sortieA,long=limits.naTropLong;
    const points=[{secondes:0,pourcentage:0},{secondes:short/12,pourcentage:5},{secondes:short,pourcentage:33},{secondes:start,pourcentage:100}];
    if(end!==start)points.push({secondes:end,pourcentage:100});
    points.push({secondes:long,pourcentage:33},{secondes:long+(long-end)*11/12,pourcentage:5},{secondes:long+(long-end),pourcentage:0});
    return {origine:"automatique",interpolation:"lineaire",points};
  }
  function durationField(label,value,change) {
    const wrap=document.createElement("label");wrap.className="grid-editor-field";const name=document.createElement("span");name.textContent=label;wrap.appendChild(name);
    const format=value=>{const hundredths=Math.round(value*100),minutes=Math.floor(hundredths/6000),seconds=(hundredths%6000)/100;return `${minutes}:${seconds.toFixed(2).padStart(5,"0").replace(/\.00$/,"").replace(/(\.\d)0$/, "$1")}`};
    const input=document.createElement("input");input.type="text";input.inputMode="decimal";input.required=true;input.pattern="[0-9]+:[0-5][0-9]([.,][0-9]{1,2})?";
    input.value=format(value);input.setAttribute("aria-label",`${label}, minutes et secondes`);
    input.addEventListener("change",()=>{if(!input.checkValidity())return;const [minutes,seconds]=input.value.replace(",",".").split(":").map(Number);change(minutes*60+seconds,input,format)});wrap.appendChild(input);return wrap;
  }
  function renderTimerFields(node) {
    const group=section("Durées (minutes:secondes)"),limits=node.seuilsSecondes;
    group.appendChild(durationField("Durée cible",node.dureeCibleSecondes,value=>{node.dureeCibleSecondes=value}));
    for(const [key,label] of [["naTropCourt","Limite NA trop court"],["entreeA","Début de la zone A"],["sortieA","Fin de la zone A"],["naTropLong","Limite NA trop long"]]){
      group.appendChild(durationField(label,limits[key],(value,input,format)=>{
        if(value===limits[key])return;
        if(node.courbe?.origine==="personnalisee"&&!window.confirm("Modifier ce seuil remplacera la courbe personnalisée par une nouvelle courbe automatique. Continuer ?")){input.value=format(limits[key]);return}
        const previous={...limits},separations=node.separationsECASecondes;
        limits[key]=value;
        if(0<limits.naTropCourt&&limits.naTropCourt<limits.entreeA&&limits.entreeA<=limits.sortieA&&limits.sortieA<limits.naTropLong){
          node.courbe=automaticCurve(node);
          if(node.niveaux.includes("ECA-")){
            if(!separations)node.separationsECASecondes={tropCourt:(limits.naTropCourt+limits.entreeA)/2,tropLong:(limits.sortieA+limits.naTropLong)/2};
            else{if(separations.tropCourt===(previous.naTropCourt+previous.entreeA)/2)separations.tropCourt=(limits.naTropCourt+limits.entreeA)/2;if(separations.tropLong===(previous.sortieA+previous.naTropLong)/2)separations.tropLong=(limits.sortieA+limits.naTropLong)/2}
          }
        }
        renderForm();
      }));
    }
    if(node.niveaux.includes("ECA-")){
      node.separationsECASecondes=node.separationsECASecondes||{tropCourt:(limits.naTropCourt+limits.entreeA)/2,tropLong:(limits.sortieA+limits.naTropLong)/2};
      for(const [key,label] of [["tropCourt","Séparation ECA− / ECA+ trop court"],["tropLong","Séparation ECA+ / ECA− trop long"]])group.appendChild(durationField(label,node.separationsECASecondes[key],value=>{node.separationsECASecondes[key]=value}));
    }
    if(node.courbe?.points?.length)renderCurveEditor(node);
  }
  function renderCurveEditor(node) {
    const group=section("Courbe de notation"),namespace="http://www.w3.org/2000/svg",chart=document.createElementNS(namespace,"svg");
    chart.classList.add("grid-editor-curve");chart.setAttribute("viewBox","0 0 600 220");chart.setAttribute("preserveAspectRatio","none");chart.setAttribute("role","group");chart.setAttribute("aria-label","Courbe de notation du minuteur");group.appendChild(chart);
    const pointList=document.createElement("div");pointList.className="grid-editor-curve-points";group.appendChild(pointList);
    const make=(tag,attributes)=>{const element=document.createElementNS(namespace,tag);for(const [key,value] of Object.entries(attributes))element.setAttribute(key,String(value));return element};
    const fixed=point=>point.secondes===0||point.secondes===node.seuilsSecondes.entreeA||point.secondes===node.seuilsSecondes.sortieA;
    function updatePoint(index,seconds,percentage){
      const points=node.courbe.points,point=points[index];if(fixed(point))return;
      const previous=points[index-1],next=points[index+1];
      const minTime=previous?previous.secondes+0.01:0,maxTime=next?next.secondes-0.01:Math.max(point.secondes,seconds);
      const lower=point.secondes<node.seuilsSecondes.entreeA?(previous?.pourcentage??0):(next?.pourcentage??0);
      const upper=point.secondes<node.seuilsSecondes.entreeA?(next?.pourcentage??100):(previous?.pourcentage??100);
      point.secondes=Math.round(Math.max(minTime,Math.min(maxTime,seconds))*100)/100;point.pourcentage=Math.round(Math.max(lower,Math.min(upper,percentage))*100)/100;
      node.courbe.origine="personnalisee";node.courbe.interpolation="lisse";draw();
    }
    function draw(){
      chart.replaceChildren();pointList.replaceChildren();const points=node.courbe.points,maxTime=points[points.length-1].secondes||1,x=value=>38+value/maxTime*532,y=value=>165-value*1.45;
      chart.append(make("line",{x1:38,y1:165,x2:570,y2:165,stroke:"#9ca1a6"}),make("line",{x1:38,y1:20,x2:38,y2:165,stroke:"#9ca1a6"}));
      for(const value of [0,50,100]){const text=make("text",{x:32,y:y(value)+4,"text-anchor":"end",fill:"#c5c9cc","font-size":11});text.textContent=`${value} %`;chart.appendChild(text)}
      const label=make("text",{x:570,y:190,"text-anchor":"end",fill:"#c5c9cc","font-size":11});label.textContent=`${formatDuration(maxTime)}`;chart.appendChild(label);
      const samples=[];for(let index=0;index<=120;index++){const seconds=maxTime*index/120;samples.push(`${x(seconds)},${y(timerPercentage(node,seconds))}`)}
      chart.appendChild(make("polyline",{points:samples.join(" "),fill:"none",stroke:"#74c5e8","stroke-width":3}));
      for(const [index,point] of points.entries()){
        const handle=make("circle",{cx:x(point.secondes),cy:y(point.pourcentage),r:fixed(point)?5:7,fill:fixed(point)?"#aeb4b9":"#fff",stroke:"#1c2024","stroke-width":2});
        const title=make("title",{});title.textContent=`${formatDuration(point.secondes)} : ${point.pourcentage} %`;handle.appendChild(title);
        if(!fixed(point)){
          handle.classList.add("grid-editor-curve-handle");handle.setAttribute("data-curve-index",String(index));handle.setAttribute("tabindex","0");handle.setAttribute("role","slider");handle.setAttribute("aria-label",`Point ${index+1} de la courbe`);handle.setAttribute("aria-valuemin","0");handle.setAttribute("aria-valuemax","100");handle.setAttribute("aria-valuenow",String(point.pourcentage));handle.setAttribute("aria-valuetext",`${formatDuration(point.secondes)}, ${point.pourcentage} %`);
          handle.addEventListener("pointerdown",event=>{
            event.preventDefault();const bounds=chart.getBoundingClientRect(),initialMax=node.courbe.points[node.courbe.points.length-1].secondes||1;
            function onMove(moveEvent){const chartX=(moveEvent.clientX-bounds.left)/bounds.width*600,chartY=(moveEvent.clientY-bounds.top)/bounds.height*220;updatePoint(index,(chartX-38)/532*initialMax,(165-chartY)/1.45)}
            function onUp(){document.removeEventListener("pointermove",onMove);document.removeEventListener("pointerup",onUp);document.removeEventListener("pointercancel",onUp)}
            document.addEventListener("pointermove",onMove);document.addEventListener("pointerup",onUp);document.addEventListener("pointercancel",onUp);
          });
          handle.addEventListener("keydown",event=>{const direction={ArrowUp:[0,1],ArrowDown:[0,-1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[event.key];if(!direction)return;event.preventDefault();updatePoint(index,point.secondes+direction[0],point.pourcentage+direction[1]);chart.querySelector(`[data-curve-index="${index}"]`)?.focus()});
        }
        chart.appendChild(handle);
        if(!fixed(point)){
          const row=document.createElement("div");row.className="grid-editor-curve-point";
          row.appendChild(inputField(`Point ${index+1} : secondes`,point.secondes,value=>{updatePoint(index,value,point.pourcentage)},{type:"number",min:0,step:"any",required:true,event:"change"}));
          row.appendChild(inputField("Pourcentage",point.pourcentage,value=>{updatePoint(index,point.secondes,value)},{type:"number",min:0,max:100,step:"any",required:true,event:"change"}));
          if(index<points.length-1)row.appendChild(iconButton("delete",`Supprimer le point ${index+1}`,()=>{points.splice(index,1);node.courbe.origine="personnalisee";node.courbe.interpolation="lisse";draw()}));pointList.appendChild(row);
        }
      }
    }
    group.appendChild(iconButton("add_circle","Ajouter un point à la courbe",()=>{
      const points=node.courbe.points;let best=-1,width=0;
      for(let index=0;index<points.length-1;index++){const first=points[index],second=points[index+1],gap=second.secondes-first.secondes;if(gap>width&&!(first.secondes>=node.seuilsSecondes.entreeA&&second.secondes<=node.seuilsSecondes.sortieA)){best=index;width=gap}}
      if(best<0||width<=0.02)return;const seconds=(points[best].secondes+points[best+1].secondes)/2,percentage=timerPercentage(node,seconds);points.splice(best+1,0,{secondes,pourcentage:percentage});node.courbe.origine="personnalisee";node.courbe.interpolation="lisse";draw();
    }));draw();
  }
  function renderCategoryFields(node) {
    fields.appendChild(selectField("Méthode",node.methode,Object.entries(methods),(value,select)=>{
      if(value===node.methode)return;
      if(!window.confirm("Changer de méthode remplace les paramètres et éléments propres à cette catégorie. Continuer ?")){select.value=node.methode;return}
      if(value==="minuteur"&&entries().some(entry=>entry.kind==="categorie"&&entry.node.methode==="minuteur"&&entry.node.id!==node.id)){select.value=node.methode;formStatus.hidden=false;formStatus.textContent="Une grille ne peut contenir qu'un seul minuteur.";return}
      const replacement=newCategory(value);replacement.id=node.id;replacement.titre=node.titre;replacement.evaluee=node.evaluee;replacement.informationsFonctionnement=node.informationsFonctionnement||"";
      if(value!=="bonus"){replacement.coefficient=node.coefficient||1;replacement.priseEnCompte=node.priseEnCompte||"obligatoire"}
      formValue=replacement;renderForm();
    }));
    const enabled=document.createElement("label");enabled.className="grid-editor-checkbox";const checkbox=document.createElement("input");checkbox.type="checkbox";checkbox.checked=node.evaluee!==false;checkbox.addEventListener("change",()=>{node.evaluee=checkbox.checked});enabled.append(checkbox,document.createTextNode("Évaluée par défaut"));fields.appendChild(enabled);
    if(node.methode!=="bonus"){
      fields.appendChild(selectField("Prise en compte",node.priseEnCompte,[["obligatoire","Obligatoire"],["facultative","Facultative"]],value=>{node.priseEnCompte=value}));
      fields.appendChild(inputField("Coefficient",node.coefficient,value=>{node.coefficient=value},{type:"number",min:0.000001,step:"any",required:true}));
      fields.appendChild(selectField("Niveaux",node.niveaux.length===4?"4":"3",[["3","NA / ECA / A"],["4","NA / ECA− / ECA+ / A"]],(value,select)=>{
        if((value==="4")=== (node.niveaux.length===4))return;
        if(!window.confirm("Changer les niveaux réinitialise leurs valeurs et les commentaires des niveaux supprimés. Continuer ?")){select.value=node.niveaux.length===4?"4":"3";return}
        setLevels(node,value);renderForm();
      }));
    }else{
      fields.appendChild(inputField("Points maximum",node.pointsMaximum,value=>{node.pointsMaximum=value},{type:"number",min:0.000001,step:"any",required:true}));
      fields.appendChild(inputField("Pas du bonus",node.pas,value=>{node.pas=value},{type:"number",min:0.000001,step:"any",required:true}));
    }
    fields.appendChild(inputField("Informations sur la méthode",node.informationsFonctionnement,value=>{node.informationsFonctionnement=value},{multiline:true}));
    if(["capacites","distribution"].includes(node.methode)){
      const values=section("Valeurs de notation (%)");
      for(const level of node.niveaux)values.appendChild(inputField(level,node.valeursNiveaux[level],value=>{
        const old={...node.valeursNiveaux};node.valeursNiveaux[level]=value;
        for(let index=1;index<node.niveaux.length;index++){
          const previous=node.niveaux[index-1],current=node.niveaux[index],midpoint=(first,second)=>{const value=(first+second)/2;return value%1===0.5&&index>node.niveaux.length/2?Math.floor(value):Math.round(value)},oldDefault=midpoint(old[previous],old[current]);
          if(node.seuilsPourcentage[current]===oldDefault){node.seuilsPourcentage[current]=midpoint(node.valeursNiveaux[previous],node.valeursNiveaux[current]);const input=fields.querySelector(`[data-threshold="${CSS.escape(current)}"]`);if(input)input.value=node.seuilsPourcentage[current]}
        }
      },{type:"number",min:0,max:100,step:"any",required:true}));
    }
    if(["capacites","distribution","bareme"].includes(node.methode)){
      const thresholds=section("Seuils de niveau (%)");
      for(const level of node.niveaux.slice(1)){const field=inputField(`À partir de ${level}`,node.seuilsPourcentage[level],value=>{node.seuilsPourcentage[level]=value},{type:"number",min:0,max:100,step:1,required:true});field.querySelector("input").dataset.threshold=level;thresholds.appendChild(field)}
    }
    if(node.methode==="compteur"){
      const thresholds=section("Seuils du compteur");for(const level of [...node.niveaux.slice(1),"D"])thresholds.appendChild(inputField(`À partir de ${level}`,node.seuilsOccurrences[level],value=>{node.seuilsOccurrences[level]=value},{type:"number",min:1,step:1,required:true}));
    }
    if(node.methode==="minuteur")renderTimerFields(node);
    if(node.methode!=="bonus"){
      node.commentaires=node.commentaires||{niveaux:{},attention:[],depasse:[]};node.commentaires.niveaux=node.commentaires.niveaux||{};renderLevelComments(node.commentaires.niveaux,node.niveaux);
      const flags=document.createElement("details");flags.className="grid-editor-comment-details";const summary=document.createElement("summary");summary.textContent="Attention et Dépassé";flags.appendChild(summary);
      node.commentaires.attention=node.commentaires.attention||[];commentList(flags,"Attention",node.commentaires.attention,node.methode==="minuteur"?1:Infinity);
      if(node.methode!=="minuteur"){node.commentaires.depasse=node.commentaires.depasse||[];commentList(flags,"Dépassé",node.commentaires.depasse)}fields.appendChild(flags);
    }else{node.commentairesValorisation=node.commentairesValorisation||[];const comments=section("Commentaires de valorisation");commentList(comments,"Bonus",node.commentairesValorisation)}
  }
  function openEntryForm(id) {
    const entry=find(id);if(!entry)return;formTarget={kind:entry.kind,id,categoryId:categoryFor(entry)?.id};formValue=structuredClone(entry.node);renderForm();formDialog.showModal();
  }
  function renderForm() {
    fields.replaceChildren();formStatus.hidden=true;formStatus.textContent="";
    document.getElementById("gridEditorFormHeading").textContent=formTarget.kind==="metadata"?"Informations de la grille":`Modifier : ${formValue.titre}`;
    fields.appendChild(inputField("Nom",formValue.titre,value=>{formValue.titre=value},{required:true}));
    if(formTarget.kind==="metadata"){
      const metadata=formValue.metadonnees||(formValue.metadonnees={}),parameters=formValue.parametres||(formValue.parametres={noteMaximum:20,plafondBonus:3,decimalesNote:2,decimalesPourcentage:2});
      fields.appendChild(inputField("Version",metadata.version,value=>{metadata.version=value}));
      fields.appendChild(inputField("Date de création",metadata.dateCreation,value=>{metadata.dateCreation=value},{type:"date"}));
      fields.appendChild(inputField("Auteur",metadata.auteur,value=>{metadata.auteur=value||null}));
      fields.appendChild(inputField("Langue",metadata.langue,value=>{metadata.langue=value}));
      fields.appendChild(inputField("Étiquettes",(metadata.etiquettes||[]).join(", "),value=>{metadata.etiquettes=value.split(",").map(item=>item.trim()).filter(Boolean)}));
      fields.appendChild(inputField("Description",metadata.description,value=>{metadata.description=value},{multiline:true}));
      fields.appendChild(inputField("Plafond global des bonus",parameters.plafondBonus,value=>{parameters.plafondBonus=value},{type:"number",min:0,step:"any",required:true}));
    }
    if(formTarget.kind==="categorie")renderCategoryFields(formValue);
    if(formTarget.kind==="capacite")fields.appendChild(inputField("Poids",formValue.poids,value=>{formValue.poids=value},{type:"number",min:0.000001,step:"any",required:true}));
    if(formTarget.kind==="critere"){
      fields.appendChild(inputField("Points maximum",formValue.pointsMaximum,value=>{formValue.pointsMaximum=value},{type:"number",min:0.000001,step:"any",required:true}));
      fields.appendChild(inputField("Pas des boutons",formValue.pas,value=>{formValue.pas=value},{type:"number",min:0.000001,step:"any",required:true}));
    }
    if(formTarget.kind==="capacite"||formTarget.kind==="critere")fields.appendChild(inputField("Aide à la notation",formValue.aideNotation,value=>{formValue.aideNotation=value},{multiline:true}));
    if(formTarget.kind==="capacite"){
      const category=find(formTarget.categoryId)?.node;formValue.commentaires=formValue.commentaires||{};renderLevelComments(formValue.commentaires,category?.niveaux||["NA","ECA","A"]);
    }
  }
  function closeEditor() {if(dirty&&!window.confirm("Fermer l'éditeur ? La grille reste disponible dans cette session, mais n'est pas encore exportée."))return;editor.close()}
  document.getElementById("createGridEditorBtn").addEventListener("click",()=>{if(!draft)draft=newGrid();announce("");renderTree();editor.showModal()});
  document.getElementById("gridEditorClose").addEventListener("click",closeEditor);
  editor.addEventListener("cancel",event=>{event.preventDefault();closeEditor()});
  document.getElementById("gridEditorAddPart").addEventListener("click",()=>{const node={id:identifier("partie"),titre:"Nouvelle partie",categories:[]};draft.parties.push(node);dirty=true;renderTree();openEntryForm(node.id)});
  document.getElementById("gridEditorMetadata").addEventListener("click",()=>{formTarget={kind:"metadata"};formValue=structuredClone(draft);renderForm();formDialog.showModal()});
  document.getElementById("gridEditorFormCancel").addEventListener("click",()=>formDialog.close());
  form.addEventListener("invalid",event=>{const details=event.target.closest("details");if(details)details.open=true},true);
  form.addEventListener("submit",event=>{
    event.preventDefault();if(!form.reportValidity())return;
    if(formTarget.kind==="categorie"){
      try{gridFromJson(JSON.stringify({versionFormat:1,id:identifier("validation"),titre:"Validation",parametres:{plafondBonus:3},parties:[{id:identifier("partie-validation"),titre:"Validation",categories:[formValue]}]}))}
      catch(error){formStatus.hidden=false;formStatus.textContent=error.message;return}
    }
    if(formTarget.kind==="metadata")draft=formValue;
    else{const entry=find(formTarget.id);if(!entry)return;const items=children(entry.parent);const index=items.findIndex(item=>item.node.id===formTarget.id);items[index]={kind:entry.kind,node:formValue};replaceChildren(entry.parent,items)}
    dirty=true;formDialog.close();renderTree();
  });
  document.getElementById("gridEditorImport").addEventListener("click",()=>document.getElementById("gridEditorImportInput").click());
  document.getElementById("gridEditorImportInput").addEventListener("change",async event=>{
    const file=event.target.files?.[0];event.target.value="";if(!file)return;
    try{const text=await file.text();gridFromJson(text);const next=JSON.parse(text);if(dirty&&!window.confirm("Remplacer la grille en cours de création ?"))return;draft=next;dirty=false;announce("");renderTree()}
    catch(error){announce(`Impossible d'ouvrir la grille : ${error.message}`)}
  });
  document.getElementById("gridEditorExport").addEventListener("click",()=>{
    try{
      const text=JSON.stringify(draft,null,2)+"\n";gridFromJson(text);
      let basename=draft.titre.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g,"_").replace(/[. ]+$/g,"")||"grille";
      if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(basename))basename=`_${basename}`;
      const filename=basename+".json";
      const url=URL.createObjectURL(new Blob([text],{type:"application/json;charset=utf-8"})),link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),60000);dirty=false;announce("Grille exportée.");
    }catch(error){announce(`Export impossible : ${error.message}`)}
  });
  window.addEventListener("beforeunload",event=>{if(dirty){event.preventDefault();event.returnValue=""}});
})();