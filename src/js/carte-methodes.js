function renderMethodCategory(node,categoryOnly=false){
  const state=methodStates[node.id]||(methodStates[node.id]={}),isBonus=node.methode==="bonus",calculation=isBonus?null:methodCalculation(node);
  const evaluated=(state.evaluee??node.evaluee)!==false,levelCount=isBonus?0:node.niveaux.length;
  const section=methodEl("section",`method-category method-${node.methode}${levelCount===4?" method-n4":""}${evaluated?"":" method-hors-note"}`);section.dataset.methodNode=node.id;
  const card=methodEl("div",`carte carte--${METHOD_CARD[node.methode]}`);section.appendChild(card);
  const title=methodEl("h2","titre"),titleText=methodEl("span","titre-texte",node.titre);titleText.title=node.titre;title.append(methodIcon(METHOD_ICONS[node.methode]),titleText);card.appendChild(title);
  /* colonne de gauche : coefficient (bouton évaluée / non évaluée) et aide */
  const optional=node.priseEnCompte==="facultative",kind=isBonus?"Bonus":optional?"Catégorie facultative":"Coefficient de catégorie";
  const noteTitle=`${kind} : ${evaluated?"évaluée":"non notée (NN)"} — cliquer pour ${evaluated?"ne plus la noter":"la noter de nouveau"}`;
  const noteValue=isBonus?"+":optional?`(${getCategoryCoefficient(node)})`:String(getCategoryCoefficient(node));
  const note=methodBt(`note${isBonus&&evaluated?" note--plus":""}${(optional&&!isBonus)||!evaluated?" note--pointille":""}${evaluated?"":" note--exclue"}`,()=>{state.evaluee=!evaluated;render()},noteTitle,evaluated?noteValue:"NN");
  note.setAttribute("aria-pressed",String(evaluated));
  const help=methodBt("aide",()=>openMethodInfo(node),`Informations sur ${node.titre}`);help.appendChild(methodIcon("info"));
  const left=methodEl("div","gauche");left.append(note,help);card.appendChild(left);
  const afterCard=[];
  if(isBonus){
    /* Gris = 0 (une seule position, au centre) ; les points se répartissent ensuite du trait gris/bleu foncé jusqu'au bout de la jauge. */
    const stops=methodGaugeStops(node),zero=stops[0],maximum=Number(node.pointsMaximum),step=Number(node.pas)||.25,count=Math.max(1,Math.round(maximum/step));
    const gauge=methodEl("div","jauge jauge--bleu");gauge.style.setProperty("--degrade",methodGradient(methodGaugeColors(node),stops));
    const slider=methodEl("input","method-slider");slider.type="range";slider.min="0";slider.max=String(count);slider.step="1";slider.setAttribute("aria-label",`Points bonus pour ${node.titre}`);
    const cursor=methodEl("i","curseur"),output=methodEl("output","valeur-texte");
    const positionOf=index=>index<=0?zero/2:zero+(100-zero)*index/count;
    const place=()=>{
      const value=Number(state.bonus)||0,index=Math.min(count,Math.max(0,Math.round(value/step)));
      cursor.style.setProperty("--valeur",`${positionOf(index)}%`);cursor.classList.toggle("curseur--plein",index>0);
      output.textContent=`+${value.toLocaleString("fr-FR")}`;output.classList.toggle("valeur-texte--zero",index===0);
      slider.value=String(index);slider.setAttribute("aria-valuetext",`${value.toLocaleString("fr-FR")} point${value>1?"s":""} de bonus`);
    };
    const setIndex=index=>{const clamped=Math.min(count,Math.max(0,index));state.bonus=Number((clamped*step).toFixed(4));place();updateFinalScore()};
    const fromPointer=event=>{const bounds=gauge.getBoundingClientRect(),position=100*(event.clientX-bounds.left)/bounds.width;setIndex(position<zero?0:Math.round((position-zero)/(100-zero)*count))};
    let dragging=false;
    gauge.addEventListener("pointerdown",event=>{if(event.button>0)return;dragging=true;gauge.setPointerCapture(event.pointerId);fromPointer(event)});
    gauge.addEventListener("pointermove",event=>{if(dragging)fromPointer(event)});
    gauge.addEventListener("pointerup",()=>{dragging=false});gauge.addEventListener("pointercancel",()=>{dragging=false});
    slider.addEventListener("input",()=>setIndex(Number(slider.value)));
    gauge.append(slider,cursor,output);place();card.appendChild(gauge);
    const options=node.commentairesValorisation||[],chosen=options.find(item=>item.id===state.bonusComment);
    const field=methodCommentField({options,selectedId:state.bonusComment||"",custom:Object.hasOwn(state,"bonusText"),text:Object.hasOwn(state,"bonusText")?state.bonusText:(chosen?.texte||""),label:`Commentaire de bonus pour ${node.titre}`,
      onSelect:id=>{state.bonusComment=id;delete state.bonusText;render()},onText:value=>{state.bonusText=value}});
    field.classList.add("champ--niveau");card.appendChild(field);
    return section;
  }
  /* rangée de boutons : avertissement, niveaux, dépassé */
  const selected=Object.hasOwn(manualChoices,node.id)?manualChoices[node.id]:calculation.level,row=methodEl("div","boutons");
  const warning=Boolean(categoryEvaluations[node.id]?.warning),alert=methodBt(`alerte${warning?" alerte--erreur":""}`,()=>toggleCategoryEvaluation(node.id,"warning"),"Avertissement","!");alert.setAttribute("aria-pressed",String(warning));row.appendChild(alert);
  for(const id of node.niveaux){
    const distribution=node.methode==="distribution";
    const action=()=>{
      if(distribution){state.counts=state.counts||{};state.counts[id]=Math.max(0,(Number(state.counts[id])||0)+(state.decrement?-1:1))}
      else if(manualChoices[node.id]===id)delete manualChoices[node.id];else manualChoices[node.id]=id;
      render();
    };
    const button=methodBt(`bouton${distribution?` bouton--violet bouton--plus${state.decrement?" bouton--moins":""}`:""}`,action,`${node.titre} : ${id}`,id);
    button.dataset.methodLevel=id;button.style.setProperty("--couleur-niveau",METHOD_LEVEL_COLOR[id]||"var(--gris)");button.setAttribute("aria-pressed",String(selected===id));row.appendChild(button);
  }
  if(node.depasseAutorise!==false){
    const exceeded=Boolean(categoryEvaluations[node.id]?.exceeded),suggested=node.methode==="compteur"&&(Number(state.count)||0)>=Number(node.seuilsOccurrences.D)&&!exceeded;
    const circle=methodBt(`rond${exceeded?" rond--bleu":""}${suggested?" rond--anneau":""}`,()=>toggleCategoryEvaluation(node.id,"exceeded"),"Dépassé","D");circle.setAttribute("aria-pressed",String(exceeded));row.appendChild(circle);
  }else{const slot=methodEl("span","rond rond--vide");slot.setAttribute("aria-hidden","true");row.appendChild(slot)}
  card.appendChild(row);
  /* jauge : segments aux seuils, curseur (calculé, manuel ou fantôme) et curseur natif invisible pour la saisie */
  const stops=methodGaugeStops(node),timerWarning=node.methode==="minuteur"&&categoryEvaluations[node.id]?.warning;
  const gauge=methodEl("div",`jauge${node.methode==="minuteur"?" jauge--u":""}${node.methode==="compteur"||timerWarning?" jauge--lecture":""}`);gauge.style.setProperty("--degrade",methodGradient(methodGaugeColors(node),stops));
  if(node.methode==="minuteur")gauge.append(methodEl("i","piste haut"),methodEl("i","piste bas"),methodEl("i","retour-u"));
  const slider=methodEl("input","method-slider");slider.type="range";slider.min="0";slider.max=node.methode==="minuteur"?"1000":"100";slider.step="1";slider.setAttribute("aria-label",node.methode==="minuteur"?`Position de la durée pour ${node.titre}`:`Pourcentage retenu pour ${node.titre}`);
  slider.title="Déplacer pour ajuster ; cliquer sur le curseur déplacé ou appuyer sur Échap pour revenir au calcul";
  const ghost=methodEl("i","curseur curseur--fantome");ghost.hidden=true;ghost.setAttribute("aria-hidden","true");
  const main=methodEl("i","curseur curseur--principal");main.setAttribute("aria-hidden","true");
  gauge.append(slider,ghost,main);
  if(node.methode==="distribution"){
    const widths=[stops[0],...stops.slice(1).map((value,index)=>value-stops[index]),100-stops.at(-1)],counts=methodEl("div","repartition");
    counts.style.gridTemplateColumns=widths.map(width=>`${width}fr`).join(" ");
    node.niveaux.forEach(id=>counts.appendChild(methodEl("span",METHOD_COUNT_COLOR[id],String(state.counts?.[id]||0))));gauge.appendChild(counts);
  }
  if(node.methode==="compteur"){slider.disabled=true;slider.title="Pourcentage calculé à partir du nombre d’occurrences"}
  else if(timerWarning){slider.disabled=true;slider.title="L’absence de prise de parole est retenue à 0 %."}
  else if(node.methode==="minuteur"){
    /* glisser le long du fer à cheval : la position sur le chemin donne une durée, puis un pourcentage par la courbe */
    const geometry=methodTimerGeometry(node);
    const apply=position=>{const seconds=methodPathToTimer(geometry,position);methodState(node).manualSeconds=seconds;manualCategoryPercent[node.id]=timerPercentage(node,seconds)??0;refreshMethodDisplay(node);updateFinalScore()};
    const fromPointer=event=>{const bounds=gauge.getBoundingClientRect(),unit=bounds.height/20;apply(methodTimerNearest(geometry,(event.clientX-bounds.left)/unit,(event.clientY-bounds.top)/unit))};
    const resetManual=()=>{delete manualCategoryPercent[node.id];delete methodState(node).manualSeconds;render()};
    let drag=null;
    gauge.addEventListener("pointerdown",event=>{
      if(event.button>0)return;
      const bounds=main.getBoundingClientRect(),near=Math.hypot(event.clientX-(bounds.left+bounds.width/2),event.clientY-(bounds.top+bounds.height/2))<bounds.width/2+4;
      drag={x:event.clientX,y:event.clientY,moved:false,reset:near&&Object.hasOwn(manualCategoryPercent,node.id)};
      gauge.setPointerCapture(event.pointerId);if(!drag.reset)fromPointer(event);
    });
    gauge.addEventListener("pointermove",event=>{if(!drag)return;if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>3)drag.moved=true;if(drag.moved||!drag.reset)fromPointer(event)});
    gauge.addEventListener("pointerup",()=>{const wasReset=drag?.reset&&!drag.moved;drag=null;if(wasReset)resetManual()});
    gauge.addEventListener("pointercancel",()=>{drag=null});
    slider.addEventListener("input",()=>apply(Number(slider.value)/1000*geometry.total));
    slider.addEventListener("keydown",event=>{if(event.key==="Escape"&&Object.hasOwn(manualCategoryPercent,node.id))resetManual()});
  }
  else{
    slider.addEventListener("input",()=>{manualCategoryPercent[node.id]=Number(slider.value);refreshMethodDisplay(node);updateFinalScore()});
    let start=null;
    slider.addEventListener("pointerdown",event=>{const bounds=main.getBoundingClientRect();start={x:event.clientX,onThumb:Math.abs(event.clientX-(bounds.left+bounds.width/2))<bounds.width/2+4,manual:Object.hasOwn(manualCategoryPercent,node.id)}});
    slider.addEventListener("pointerup",event=>{if(start?.manual&&start.onThumb&&Math.abs(event.clientX-start.x)<4){delete manualCategoryPercent[node.id];render()}start=null});
    slider.addEventListener("keydown",event=>{if(event.key==="Escape"&&Object.hasOwn(manualCategoryPercent,node.id)){delete manualCategoryPercent[node.id];render()}});
  }
  const percentage=methodEl("output","method-percentage vh");gauge.appendChild(percentage);card.appendChild(gauge);
  /* bloc de droite propre à chaque méthode */
  const details=renderMethodDetails(node,calculation,categoryOnly);
  if(node.methode==="capacites"||node.methode==="bareme"){
    const toggle=methodBt("capacite",()=>{details.open=!details.open;toggle.setAttribute("aria-expanded",String(details.open))},`Afficher ou masquer ${node.methode==="capacites"?"les capacités":"les critères"} de ${node.titre}`);
    toggle.setAttribute("aria-expanded",String(details.open));
    toggle.append(methodEl("div","ratio",`${calculation.count}/${calculation.total}`),methodEl("div","libelle",node.methode==="capacites"?"capacités":"critères"),methodEl("i","fleche-bas"));card.appendChild(toggle);
  }
  if(node.methode==="distribution"){
    const toggle=methodBt(`bascule${state.decrement?" moins":""}`,()=>{state.decrement=!state.decrement;render()},state.decrement?"Passer à l’incrémentation":"Passer à la décrémentation");
    toggle.setAttribute("aria-pressed",String(Boolean(state.decrement)));toggle.append(methodEl("i","pastille"),methodEl("b","moitie plus","+"),methodEl("b","moitie tiret","−"));card.appendChild(toggle);
  }
  if(node.methode==="compteur"){
    const right=methodEl("div","droite");
    right.appendChild(methodBt("compteur",()=>{state.count=(Number(state.count)||0)+1;render()},`Ajouter une occurrence à ${node.titre}`,String(Number(state.count)||0)));
    right.appendChild(methodBt("delta",()=>{const before=Number(state.count)||0;state.count=Math.max(0,before-1);if(state.count<before&&state.count<Number(node.seuilsOccurrences.D)&&categoryEvaluations[node.id]?.exceeded){categoryEvaluations[node.id].exceeded=false;categoryEvaluations[node.id].activeMotifKind=""}render()},`Retirer une occurrence de ${node.titre}`,"−1"));
    card.appendChild(right);
  }
  if(node.methode==="minuteur"){
    const running=Boolean(state.startedAt),pill=methodBt("pilule",()=>{if(state.startedAt){state.elapsedMs=timerSeconds(state)*1000;delete state.startedAt}else{if(categoryEvaluations[node.id]?.warning)delete categoryEvaluations[node.id];state.recorded=true;state.startedAt=Date.now()}render()},running?"Mettre le minuteur en pause":"Démarrer le minuteur");
    pill.append(methodIcon(running?"timer_pause":"timer_play"),methodEl("span","method-duration",formatDuration(timerSeconds(state))));card.appendChild(pill);
    const back=methodEl("div","retour"),target=methodEl("div","duree",formatTarget(node.dureeCibleSecondes));target.title=`Durée cible : ${formatDuration(node.dureeCibleSecondes)}`;
    const reset=methodBt("raz",()=>{if(!window.confirm("Réinitialiser la durée enregistrée ?"))return;delete state.startedAt;state.elapsedMs=0;state.recorded=false;delete categoryEvaluations[node.id];render()},"Réinitialiser le minuteur","0");reset.appendChild(methodIcon("restart_alt"));
    back.append(target,reset);card.appendChild(back);
  }
  /* dans la boîte : commentaire de niveau (texte éditable), motif d'avertissement / de dépassement ; sous la boîte : détail rattaché */
  const comment=methodLevelCommentField(node,node,selected);if(comment){comment.classList.add("champ--niveau");card.appendChild(comment)}
  section.dataset.commentLevel=selected||"";
  if(timerWarning){const text=methodEl("p","method-warning-comment",node.commentMotifs?.find(item=>item.kind==="PROBLEME")?.label||"");card.appendChild(text)}
  else{const extra=renderCategoryEvaluationControls(node);if(extra){const wrap=methodChamp(extra.querySelector("select"));wrap.classList.add("champ--motif");card.appendChild(wrap)}}
  if(details)section.appendChild(details);
  updateMethodGauge(section,node);
  return section;
}
function refreshMethodDisplay(node){
  if(node.methode==="bonus")return;
  for(const section of document.querySelectorAll("[data-method-node]"))if(section.dataset.methodNode===node.id){
    const duration=section.querySelector(".method-duration");if(duration)duration.textContent=formatDuration(timerSeconds(methodState(node)));
    const selected=updateMethodGauge(section,node);
    if(section.dataset.commentLevel!==(selected||"")){
      const old=section.querySelector(".champ--niveau"),comment=methodLevelCommentField(node,node,selected);
      if(comment)comment.classList.add("champ--niveau");
      if(old&&comment)old.replaceWith(comment);else if(old)old.remove();else if(comment)section.querySelector(".carte").appendChild(comment);
      section.dataset.commentLevel=selected||"";
    }
  }
}
function renderCategory(category,node=null,categoryOnly=false){
  if(node?.methode)return renderMethodCategory(node,categoryOnly);
  const section=document.createElement("section");section.className="section";
  const head=document.createElement("div");head.className="section-head category-head";
  const headingRow=document.createElement("div");headingRow.className="category-heading-row";
  const heading=document.createElement("h2");heading.textContent=node?.titre||category.title||"Catégorie";headingRow.appendChild(heading);
  if(node&&!isLeaf(node)){
    const calculation=calculate(node),effective=effectiveLevel(node),origin=chosenOrigin(node);
    const categoryControls=document.createElement("div");categoryControls.className="category-controls";
    const controls=document.createElement("div");controls.className="category-levels";
    for(const level of grid.niveaux){
      const button=makeLevelButton(node,level,effective,origin,calculation.level);
      button.classList.add("category-level-btn");button.setAttribute("aria-label",`${level.id} ${level.libelle}`);
      button.querySelector(".full")?.remove();controls.appendChild(button);
    }
    categoryControls.appendChild(controls);
    const slider=document.createElement("input");slider.type="range";slider.className="category-score-slider";slider.min="0";slider.max="100";slider.step="1";
    const colors={NA:"#e45b60",ECA:"#e8c64a",A:"#49bd7b"};
    for(const id of Object.keys(colors))colors[id]=grid.niveaux.find(level=>level.id===id)?.couleur||colors[id];
    const stops=categorySliderStops();
    slider.style.setProperty("--na-color",colors.NA);slider.style.setProperty("--eca-color",colors.ECA);slider.style.setProperty("--a-color",colors.A);
    slider.style.setProperty("--na-stop",`${stops.na}%`);slider.style.setProperty("--eca-stop",`${stops.eca}%`);
    slider.setAttribute("aria-label",`Pourcentage des capacités pondérées pour ${node.titre}`);
    const metrics=document.createElement("div");metrics.className="category-metrics";
    const percentage=getCategoryPercentage(node);
    const mean=document.createElement("span");mean.className="pill category-percentage";metrics.appendChild(mean);
    const coefficient=document.createElement("span");coefficient.className="pill";coefficient.textContent=`Coeff. catégorie : ${getCategoryCoefficient(node)}`;metrics.appendChild(coefficient);
    const updateSliderDisplay=()=>{
      const value=getCategoryPercentage(node),manual=Object.hasOwn(manualCategoryPercent,node.id);
      slider.value=String(value??0);slider.classList.toggle("manual",manual);
      slider.setAttribute("aria-valuetext",value===null?"Aucune capacité évaluée":`${value.toFixed(1).replace(".",",")} %, ${manual?"saisie manuelle":"calcul automatique"}`);
      mean.textContent=`Capacités pondérées : ${value===null?"—":`${value.toFixed(1).replace(".",",")} %`}`;
    };
    let pointerStart=null;
    const touchDragThreshold=4;
    slider.addEventListener("pointerdown",event=>{
      const bounds=slider.getBoundingClientRect(),value=Number(slider.value);
      const thumbX=bounds.left+7+(bounds.width-14)*value/100;
      pointerStart={x:event.clientX,y:event.clientY,value,pointerType:event.pointerType,manual:Object.hasOwn(manualCategoryPercent,node.id),manualValue:manualCategoryPercent[node.id],onThumb:Math.abs(event.clientX-thumbX)<=9};
    });
    slider.addEventListener("input",()=>{manualCategoryPercent[node.id]=Number(slider.value);updateSliderDisplay();updateFinalScore()});
    slider.addEventListener("pointerup",event=>{
      const start=pointerStart;pointerStart=null;
      const distance=start?Math.hypot(event.clientX-start.x,event.clientY-start.y):Infinity;
      if(start&&start.pointerType!=="mouse"&&distance<=touchDragThreshold){
        slider.value=String(start.value);
        if(start.manual&&!start.onThumb)manualCategoryPercent[node.id]=start.manualValue;
        else delete manualCategoryPercent[node.id];
        updateSliderDisplay();updateFinalScore();
      }else if(start?.manual&&start.onThumb&&distance<=3&&Number(slider.value)===start.value){
        delete manualCategoryPercent[node.id];updateSliderDisplay();updateFinalScore();
      }
    });
    slider.addEventListener("pointercancel",event=>{
      const start=pointerStart;pointerStart=null;
      if(start&&start.pointerType!=="mouse"&&Math.hypot(event.clientX-start.x,event.clientY-start.y)<=touchDragThreshold){
        slider.value=String(start.value);
        if(start.manual&&!start.onThumb)manualCategoryPercent[node.id]=start.manualValue;
        else delete manualCategoryPercent[node.id];
        updateSliderDisplay();updateFinalScore();
      }
    });
    slider.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&Object.hasOwn(manualCategoryPercent,node.id)){
        event.preventDefault();delete manualCategoryPercent[node.id];updateSliderDisplay();updateFinalScore();
      }
    });
    updateSliderDisplay();
    const flagRow=document.createElement("div");flagRow.className="category-flag-row";
    flagRow.appendChild(makeCategoryFlagButton(node,"warning"));
    if(node.depasseAutorise!==false)flagRow.appendChild(makeCategoryFlagButton(node,"exceeded"));
    categoryControls.append(slider,flagRow);headingRow.appendChild(categoryControls);
    const comment=document.createElement("div");comment.className="category-comment empty";
    const commentLevel=effective||calculation.level;
    const commentText=commentLevel&&node.commentaires?.[commentLevel];
    if(commentText){comment.classList.remove("empty");comment.textContent=commentText}
    head.appendChild(headingRow);
    const extraControls=renderCategoryEvaluationControls(node);if(extraControls)head.appendChild(extraControls);
    head.appendChild(metrics);head.appendChild(comment);
  }else{
    head.appendChild(headingRow);
    if(!node){const description=document.createElement("p");description.className="small";description.textContent=category.description;head.appendChild(description)}
  }
  section.appendChild(head);
  if(node&&!categoryOnly)section.appendChild(renderNode(node,0,!isLeaf(node)));
  else if(!node){const placeholder=document.createElement("div");placeholder.className="category-placeholder small";placeholder.textContent=category.description;section.appendChild(placeholder)}
  return section;
}
