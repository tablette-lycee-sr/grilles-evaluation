function formatDuration(seconds){const minutes=Math.floor(seconds/60),remaining=Math.floor(seconds%60);return `${minutes}′${String(remaining).padStart(2,"0")}″`}
/* ---- Rendu des catégories par méthode (mise en page des schémas d'évaluation) ---- */
const METHOD_CARD={capacites:"a",bareme:"a",distribution:"d",compteur:"c",minuteur:"m",bonus:"b"};
const METHOD_ICONS={capacites:"target",bareme:"rule",distribution:"leaderboard",compteur:"add_circle",minuteur:"hourglass_empty",bonus:"star"};
const METHOD_LEVEL_COLOR={NA:"var(--rouge)","ECA-":"var(--orange)",ECA:"var(--jaune)","ECA+":"var(--jaune)",A:"var(--vert)"};
const METHOD_SEGMENT={NA:"var(--jauge-rouge)","ECA-":"var(--jauge-orange)",ECA:"var(--jauge-jaune)","ECA+":"var(--jauge-jaune)",A:"var(--jauge-vert)"};
const METHOD_COUNT_COLOR={NA:"rouge","ECA-":"orange",ECA:"jaune","ECA+":"jaune",A:"vert"};
function methodEl(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element}
function methodBt(className,action,title,text){const button=methodEl("button",`bt ${className}`,text);button.type="button";button.title=title;button.setAttribute("aria-label",title);button.addEventListener("click",action);return button}
function methodIcon(name,className=""){const symbol=methodEl("span",`menu-icon ${className}`.trim());symbol.style.setProperty("--icon",`url('icones/${name}.svg')`);symbol.setAttribute("aria-hidden","true");return symbol}
function methodChamp(select){const wrap=methodEl("div","champ"),arrow=methodEl("span","deroulant");arrow.setAttribute("aria-hidden","true");arrow.appendChild(methodEl("i","fleche-bas"));wrap.append(select,arrow);return wrap}
function methodCommentField({options,selectedId,custom,text,label,onSelect,onText}){
  const wrap=methodEl("div","champ"),area=methodEl("textarea","champ-texte");
  area.rows=1;area.value=text;area.placeholder="Aucun commentaire";area.spellcheck=true;area.setAttribute("aria-label",label);
  const fit=()=>{if(!area.scrollHeight)return;area.style.height="auto";area.style.height=`${area.scrollHeight}px`};
  area.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();area.blur()}});
  wrap.appendChild(area);
  let select=null;
  if(options?.length){
    const arrow=methodEl("span","deroulant");arrow.appendChild(methodEl("i","fleche-bas"));
    select=methodEl("select","champ-liste");select.setAttribute("aria-label",`Choisir un commentaire prédéfini : ${label}`);
    const none=methodEl("option","","Aucun commentaire");none.value="";select.appendChild(none);
    for(const item of options){const option=methodEl("option","",item.texte);option.value=item.id;select.appendChild(option)}
    select.value=selectedId??"";if(custom)select.selectedIndex=-1;
    select.addEventListener("change",()=>onSelect(select.value));arrow.appendChild(select);wrap.appendChild(arrow);
  }
  area.addEventListener("input",()=>{onText(area.value);if(select)select.selectedIndex=-1;fit()});
  requestAnimationFrame(fit);
  return wrap;
}
function methodLevelCommentField(node,owner,levelId){
  if(!levelId)return null;
  const state=methodStates[node.id]||(methodStates[node.id]={}),options=owner.commentairesNiveaux?.[levelId]||[],key=`${owner.id}:${levelId}`;
  const custom=Object.hasOwn(state.commentTexts||{},key);
  if(!options.length&&!custom)return null;
  const selected=Object.hasOwn(state.commentSelections||{},key)?state.commentSelections[key]:(options[0]?.id??"");
  const text=custom?state.commentTexts[key]:(options.find(item=>item.id===selected)?.texte||"");
  const field=methodCommentField({options,selectedId:selected,custom,text,label:`Commentaire ${levelId} pour ${owner.titre}`,
    onSelect:id=>{state.commentSelections={...state.commentSelections,[key]:id};if(state.commentTexts)delete state.commentTexts[key];render()},
    onText:value=>{state.commentTexts={...state.commentTexts,[key]:value}}});
  return field;
}
function methodPercentText(value){return `${value.toFixed(2).replace(".",",")} %`}
function formatTarget(seconds){const minutes=Math.floor(seconds/60),rest=Math.round(seconds%60);return rest?`${minutes}′${String(rest).padStart(2,"0")}″`:`${minutes}′`}
function methodLerp(value,from,to,start,end){return to===from?end:start+(end-start)*Math.min(1,Math.max(0,(value-from)/(to-from)))}
/* Positions (en %) des séparations de la jauge : seuils de pourcentage, seuils du compteur rapportés au seuil A, repères fixes pour le minuteur et le bonus. */
function methodGaugeStops(node){
  if(node.methode==="minuteur")return[33.5,72.5];
  if(node.methode==="bonus")return[30,66];
  if(node.methode==="compteur"){
    const occurrences=node.seuilsOccurrences||{},top=Number(occurrences.A)||1,stops=[];
    node.niveaux.slice(1).forEach((id,index)=>{const value=Math.min(92,100*Number(occurrences[id])/top);stops.push(Math.min(96,Math.max(value,index?stops[index-1]+4:0)))});
    return stops;
  }
  return node.niveaux.slice(1).map(id=>Number(node.seuilsPourcentage?.[id]));
}
function methodGaugeColors(node){
  if(node.methode==="bonus")return["var(--jauge-neutre)","var(--jauge-bleu-fonce)","var(--bleu)"];
  if(node.methode==="minuteur")return[METHOD_SEGMENT.NA,METHOD_SEGMENT.ECA,METHOD_SEGMENT.A];
  return node.niveaux.map(id=>METHOD_SEGMENT[id]);
}
function methodGradient(colors,stops){
  const parts=[];
  colors.forEach((color,index)=>{
    if(index===colors.length-1)parts.push(`${color} 0`);
    else parts.push(`${color} 0 calc(${stops[index]}% - var(--demi))`,`#000 0 calc(${stops[index]}% + var(--demi))`);
  });
  return `linear-gradient(90deg,${parts.join(",")})`;
}
/* Jauge en U du minuteur : le curseur suit un chemin en fer à cheval (unités --u, repère local de la jauge).
   Piste haute de gauche à droite (trop court → plateau A), virage vert, piste basse de droite à gauche (plateau A → trop long). */
function methodTimerGeometry(node){
  const width=node.niveaux.length===4?157:117,L=width-10,R=7,arc=Math.PI*R,[f1,f2]=methodGaugeStops(node).map(value=>value/100);
  const limits=node.seuilsSecondes,target=Number(node.dureeCibleSecondes);
  const last=Math.max(Number(node.courbe?.points?.at(-1)?.secondes)||limits.naTropLong*1.5,limits.naTropLong+1);
  const anchors=[[0,0],[limits.naTropCourt,f1*L],[limits.entreeA,f2*L],[target,L+arc/2],[limits.sortieA,L+arc+(L-f2*L)],[limits.naTropLong,L+arc+(L-f1*L)],[last,2*L+arc]];
  return{L,R,arc,total:2*L+arc,anchors};
}
function methodTimerToPath(geometry,seconds){
  const anchors=geometry.anchors;
  if(seconds<=anchors[0][0])return anchors[0][1];
  for(let index=1;index<anchors.length;index++)if(seconds<=anchors[index][0])return methodLerp(seconds,anchors[index-1][0],anchors[index][0],anchors[index-1][1],anchors[index][1]);
  return geometry.total;
}
function methodPathToTimer(geometry,position){
  const anchors=geometry.anchors;
  if(position<=anchors[0][1])return anchors[0][0];
  for(let index=1;index<anchors.length;index++)if(position<=anchors[index][1])return methodLerp(position,anchors[index-1][1],anchors[index][1],anchors[index-1][0],anchors[index][0]);
  return anchors.at(-1)[0];
}
function methodTimerPoint(geometry,position){
  const s=Math.min(geometry.total,Math.max(0,position));
  if(s<=geometry.L)return{x:s,y:3};
  if(s<=geometry.L+geometry.arc){const angle=(s-geometry.L)/geometry.R;return{x:geometry.L+geometry.R*Math.sin(angle),y:10-geometry.R*Math.cos(angle)}}
  return{x:geometry.L-(s-geometry.L-geometry.arc),y:17};
}
/* point du chemin le plus proche d'une position (en unités --u) : piste haute, virage ou piste basse */
function methodTimerNearest(geometry,x,y){
  const clampedX=Math.min(geometry.L,Math.max(0,x)),candidates=[];
  candidates.push({d:(x-clampedX)**2+(y-3)**2,s:clampedX});
  candidates.push({d:(x-clampedX)**2+(y-17)**2,s:geometry.L+geometry.arc+(geometry.L-clampedX)});
  const angle=Math.min(Math.PI,Math.max(0,Math.atan2(x-geometry.L,-(y-10))));
  const arcX=geometry.L+geometry.R*Math.sin(angle),arcY=10-geometry.R*Math.cos(angle);
  candidates.push({d:(x-arcX)**2+(y-arcY)**2,s:geometry.L+geometry.R*angle});
  return candidates.reduce((best,item)=>item.d<best.d?item:best).s;
}
/* durée correspondant à un pourcentage manuel ancien (sans durée mémorisée) : recherche sur la montée de la courbe */
function methodSecondsForPercent(node,percent){
  const limits=node.seuilsSecondes;if(percent>=100)return Number(node.dureeCibleSecondes);
  let low=0,high=limits.entreeA;
  for(let step=0;step<30;step++){const middle=(low+high)/2;if((timerPercentage(node,middle)??0)<percent)low=middle;else high=middle}
  return(low+high)/2;
}
function updateMethodGauge(section,node){
  const calculation=methodCalculation(node),retained=getCategoryPercentage(node),manual=Object.hasOwn(manualCategoryPercent,node.id),timer=node.methode==="minuteur";
  const state=methodState(node),seconds=timer?timerSeconds(state):0;
  const gauge=section.querySelector(".jauge"),main=gauge.querySelector(".curseur--principal"),ghost=gauge.querySelector(".curseur--fantome"),slider=gauge.querySelector(".method-slider");
  const geometry=timer?methodTimerGeometry(node):null;
  const place=(element,value)=>{
    if(timer){const point=methodTimerPoint(geometry,value);element.style.setProperty("--cx",point.x.toFixed(2));element.style.setProperty("--cy",point.y.toFixed(2))}
    else element.style.setProperty("--valeur",`${Math.min(100,Math.max(0,value))}%`);
  };
  const auto=calculation.percentage===null?null:timer?methodTimerToPath(geometry,seconds):calculation.percentage;
  let manualPosition=null;
  if(manual&&retained!==null)manualPosition=timer?methodTimerToPath(geometry,typeof state.manualSeconds==="number"?state.manualSeconds:methodSecondsForPercent(node,retained)):retained;
  if(manualPosition!==null){place(main,manualPosition);main.classList.add("curseur--plein");main.classList.remove("curseur--vide")}
  else{place(main,auto??0);main.classList.remove("curseur--plein");main.classList.toggle("curseur--vide",auto===null)}
  ghost.hidden=!(manualPosition!==null&&auto!==null);if(!ghost.hidden)place(ghost,auto);
  slider.classList.toggle("manual",manual);
  const shown=manualPosition??auto??0;
  if(!(manual&&document.activeElement===slider))slider.value=String(timer?Math.round(1000*shown/geometry.total):Math.round(shown));
  const autoText=calculation.percentage===null?"indisponible":methodPercentText(calculation.percentage);
  const valueText=retained===null?"Aucun résultat":`${methodPercentText(retained)}${manual?`, choix manuel, calcul automatique ${autoText}`:", calcul automatique"}`;
  slider.setAttribute("aria-valuetext",valueText);gauge.title=retained===null?"Aucun résultat":`${methodPercentText(retained)}${manual&&auto!==null?` (calcul automatique : ${autoText})`:""}`;
  const output=section.querySelector(".method-percentage");if(output)output.textContent=retained===null?"—":methodPercentText(retained);
  const selected=Object.hasOwn(manualChoices,node.id)?manualChoices[node.id]:calculation.level;
  for(const button of section.querySelectorAll(".boutons [data-method-level]")){
    const id=button.dataset.methodLevel;
    button.classList.toggle("bouton--anneau",id===calculation.level);
    button.classList.toggle("bouton--actif",node.methode!=="distribution"&&Object.hasOwn(manualChoices,node.id)&&manualChoices[node.id]===id);
    button.setAttribute("aria-pressed",String(selected===id));
  }
  return selected;
}
/* ---- Fenêtre d'information d'une méthode (remplace l'alerte du navigateur) ---- */
const METHOD_NAMES={capacites:"Capacités",bareme:"Barème",distribution:"Distribution",compteur:"Compteur",minuteur:"Minuteur",bonus:"Bonus"};
const METHOD_EXPLANATIONS={
  capacites:["Chaque capacité reçoit un niveau. Le niveau de la catégorie est calculé à partir de la valeur de chaque niveau choisi, en tenant compte du poids des capacités.","Le pourcentage obtenu est comparé aux seuils pour déterminer le niveau de la catégorie. Vous pouvez imposer un niveau ou déplacer le curseur : le calcul automatique reste affiché (curseur fantôme, anneau coloré)."],
  bareme:["Attribuez des points à chaque critère. Le pourcentage est le total des points obtenus rapporté au total des points possibles, sur les critères renseignés.","Ce pourcentage est comparé aux seuils pour déterminer le niveau de la catégorie. Vous pouvez imposer un niveau ou déplacer le curseur."],
  distribution:["Comptez les observations (par exemple les arguments) pour chaque niveau avec les boutons +. Le bouton + / − bascule entre ajout et retrait.","Le pourcentage est la moyenne des valeurs des niveaux, pondérée par le nombre d’observations ; il détermine le niveau de la catégorie."],
  compteur:["Comptez les occurrences observées (prises de parole, par exemple) avec le bouton +, et retirez-en une avec −1.","Le niveau dépend du nombre d’occurrences atteint ; le pourcentage est calculé par rapport au seuil du niveau le plus haut. Le « D » (Dépassé) se propose à partir de son seuil."],
  minuteur:["Chronométrez l’intervention avec le bouton de démarrage ou de pause. La durée est rapprochée de la durée cible.","Le pourcentage vient de la courbe de la grille, et le niveau des seuils de durée. Sur la jauge en U, la poignée va de « trop court » à « trop long » en passant par la durée cible (virage vert) : vous pouvez la déplacer pour imposer une valeur."],
  bonus:["Attribuez des points supplémentaires pour une qualité particulière.","Tant que la poignée reste dans la partie grise, le bonus vaut 0 ; les points commencent à partir du trait entre le gris et le bleu foncé."]
};
function methodInfoNumber(value){return Number(value).toLocaleString("fr-FR",{maximumFractionDigits:2})}
function methodLevelRange(node,id,index){
  const ids=node.niveaux,next=ids[index+1],last=index===ids.length-1;
  if(node.methode==="compteur"){
    const occurrences=node.seuilsOccurrences||{};
    if(index===0)return `moins de ${occurrences[next]} occurrence${occurrences[next]>1?"s":""}`;
    return last?`${occurrences[id]} occurrence${occurrences[id]>1?"s":""} et plus`:`de ${occurrences[id]} à ${Number(occurrences[next])-1} occurrences`;
  }
  if(node.methode==="minuteur"){
    const limits=node.seuilsSecondes,separations=node.separationsECASecondes||{},f=formatTarget,fourLevels=ids.includes("ECA-");
    if(id==="NA")return `moins de ${f(limits.naTropCourt)} ou ${f(limits.naTropLong)} et plus`;
    if(id==="A")return `de ${f(limits.entreeA)} à ${f(limits.sortieA)}`;
    if(id==="ECA-")return `de ${f(limits.naTropCourt)} à ${f(separations.tropCourt)}, ou de ${f(separations.tropLong)} à ${f(limits.naTropLong)}`;
    if(id==="ECA+")return `de ${f(separations.tropCourt)} à ${f(limits.entreeA)}, ou de ${f(limits.sortieA)} à ${f(separations.tropLong)}`;
    return fourLevels?"":`de ${f(limits.naTropCourt)} à ${f(limits.entreeA)}, ou de ${f(limits.sortieA)} à ${f(limits.naTropLong)}`;
  }
  const thresholds=node.seuilsPourcentage||{};
  if(index===0)return `moins de ${methodInfoNumber(thresholds[next])} %`;
  return last?`${methodInfoNumber(thresholds[id])} % et plus`:`de ${methodInfoNumber(thresholds[id])} % à moins de ${methodInfoNumber(thresholds[next])} %`;
}
function methodInfoDialog(){
  let dialog=document.getElementById("methodInfoDialog");if(dialog)return dialog;
  dialog=methodEl("dialog","method-info-dialog");dialog.id="methodInfoDialog";dialog.setAttribute("aria-labelledby","methodInfoTitle");
  dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close()});
  /* la fenêtre de correction se ferme sur un clic ou Échap en dehors d'elle : on les garde ici */
  dialog.addEventListener("pointerdown",event=>event.stopPropagation());
  dialog.addEventListener("keydown",event=>{if(event.key==="Escape")event.stopPropagation()});
  document.body.appendChild(dialog);return dialog;
}
function openMethodInfo(node){
  const dialog=methodInfoDialog();dialog.replaceChildren();
  const head=methodEl("div","mi-head"),titles=methodEl("div","mi-titles"),title=methodEl("h2","mi-title",node.titre);title.id="methodInfoTitle";
  titles.append(title,methodEl("p","mi-sub",`Méthode ${METHOD_NAMES[node.methode]||node.methode}`));
  const icon=methodEl("span","mi-icon");icon.appendChild(methodIcon(METHOD_ICONS[node.methode]));
  const close=methodEl("button","mi-close");close.type="button";close.setAttribute("aria-label","Fermer");close.title="Fermer";close.appendChild(methodIcon("close"));close.addEventListener("click",()=>dialog.close());
  head.append(icon,titles,close);
  const body=methodEl("div","mi-body");
  const section=(label,...content)=>{const block=methodEl("section","mi-section");block.appendChild(methodEl("h3","",label));block.append(...content);body.appendChild(block);return block};
  if(node.informationsFonctionnement)section("Consigne de la grille",methodEl("p","mi-lead",node.informationsFonctionnement));
  const facts=[node.methode==="bonus"?`Jusqu’à ${methodInfoNumber(node.pointsMaximum)} point${Number(node.pointsMaximum)>1?"s":""} de bonus, par pas de ${methodInfoNumber(node.pas||.25)}`:`Coefficient ${getCategoryCoefficient(node)} · ${node.priseEnCompte==="facultative"?"prise en compte facultative":"prise en compte obligatoire"}`];
  if(node.methode==="minuteur")facts.push(`Durée cible : ${formatDuration(node.dureeCibleSecondes)}`);
  const explanation=(METHOD_EXPLANATIONS[node.methode]||[]).map(text=>methodEl("p","",text));
  const list=methodEl("ul","mi-facts");for(const fact of facts)list.appendChild(methodEl("li","",fact));
  section("Fonctionnement",...explanation,list);
  if(node.methode!=="bonus"){
    const levelsBlock=methodEl("div","mi-levels");
    node.niveaux.forEach((id,index)=>{
      const row=methodEl("div","mi-level"),badge=methodEl("span","mi-badge",id);badge.style.setProperty("--couleur-niveau",METHOD_LEVEL_COLOR[id]||"var(--gris)");
      const text=methodEl("div","mi-level-text"),name=methodEl("strong","",levels[id]?.libelle||id);text.appendChild(name);
      const range=methodLevelRange(node,id,index);if(range)text.appendChild(methodEl("div","mi-range",range));
      if((node.methode==="capacites"||node.methode==="distribution")&&node.valeursNiveaux?.[id]!==undefined)text.appendChild(methodEl("div","mi-range",`Valeur retenue dans le calcul : ${methodInfoNumber(node.valeursNiveaux[id])} %`));
      const comments=node.commentairesNiveaux?.[id]||[];
      if(comments.length){const items=methodEl("ul","mi-comments");for(const item of comments)items.appendChild(methodEl("li","",item.texte));text.appendChild(items)}
      row.append(badge,text);levelsBlock.appendChild(row);
    });
    section("Niveaux et commentaires associés",levelsBlock);
  }
  const motifs=[["PROBLEME","Attention","!"],["VALORISATION","Dépassé","D"]];
  const motifBlocks=motifs.map(([kind,label])=>[label,(node.commentMotifs||[]).filter(item=>item.kind===kind)]).filter(([,items])=>items.length);
  if(motifBlocks.length){
    const wrap=methodEl("div","mi-levels");
    for(const [label,items] of motifBlocks){const row=methodEl("div","mi-level"),badge=methodEl("span",`mi-badge mi-badge--${label==="Attention"?"alerte":"depasse"}`,label==="Attention"?"!":"D");const text=methodEl("div","mi-level-text");text.appendChild(methodEl("strong","",label));const ul=methodEl("ul","mi-comments");for(const item of items)ul.appendChild(methodEl("li","",item.label));text.appendChild(ul);row.append(badge,text);wrap.appendChild(row)}
    section("Avertissement et dépassement",wrap);
  }
  if(node.methode==="capacites"){
    const items=methodEl("ul","mi-facts");
    for(const capacity of descendantsLeaves(node)){const li=methodEl("li","");li.append(methodEl("strong","",capacity.titre),document.createTextNode(` — poids ${getWeight(capacity)}${capacity.aideNotation?` · ${capacity.aideNotation}`:""}`));items.appendChild(li)}
    if(items.children.length)section("Capacités évaluées",items);
  }
  if(node.methode==="bareme"){
    const items=methodEl("ul","mi-facts");
    for(const criterion of node.criteres||[]){const li=methodEl("li","");li.append(methodEl("strong","",criterion.titre),document.createTextNode(` — ${methodInfoNumber(criterion.pointsMaximum)} point${Number(criterion.pointsMaximum)>1?"s":""}${criterion.aideNotation?` · ${criterion.aideNotation}`:""}`));items.appendChild(li)}
    if(items.children.length)section("Critères évalués",items);
  }
  dialog.append(head,body);dialog.showModal();body.scrollTop=0;
}
