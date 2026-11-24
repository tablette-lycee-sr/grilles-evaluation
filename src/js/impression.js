function makePrintLevelTable(levelId){
  const track=document.createElement("div");track.className="print-level-track";track.setAttribute("aria-label","Niveau obtenu : "+(levelId||"non évalué"));
  for(const id of ["NA","ECA","A","D"]){
    const cell=document.createElement("span");cell.className="print-level-cell";
    if(id!=="D"&&id===levelId){const cross=document.createElement("strong");cross.className="print-level-cross";cross.textContent="X";cell.appendChild(cross)}
    else if(id!=="D"){const dot=document.createElement("span");dot.className="print-level-dot";dot.setAttribute("aria-hidden","true");cell.appendChild(dot)}
    track.appendChild(cell);
  }
  return track;
}
function makePrintFace(levelId){
  const namespace="http://www.w3.org/2000/svg",face=document.createElementNS(namespace,"svg");
  face.setAttribute("viewBox","0 0 100 100");face.setAttribute("role","img");face.setAttribute("aria-label",`Niveau ${levelId}`);face.classList.add("print-level-mark");
  if(levelId==="D")face.classList.add("print-level-d");
  const add=(tag,attributes)=>{const shape=document.createElementNS(namespace,tag);for(const [name,value] of Object.entries(attributes))shape.setAttribute(name,value);face.appendChild(shape)};
  const outline={fill:"none",stroke:"#111","stroke-width":"2.5"};
  add("circle",{...outline,cx:"50",cy:"50",r:"44"});
  add("circle",{...outline,cx:"30",cy:"39",r:"8"});add("circle",{...outline,cx:"70",cy:"39",r:"8"});
  if(levelId==="D")add("path",{d:"M20 64 C28 91 72 91 80 64 C64 55 36 55 20 64 Z",fill:"#fff",stroke:"#111","stroke-width":"2.5","stroke-linejoin":"round"});
  else if(levelId==="NA")add("path",{...outline,d:"M20 76 C34 57 66 57 80 76","stroke-linecap":"round"});
  else if(levelId==="ECA")add("path",{...outline,d:"M20 70 H80","stroke-linecap":"round"});
  else if(levelId==="A")add("path",{...outline,d:"M20 63 C34 86 66 86 80 63","stroke-linecap":"round"});
  else add("path",{...outline,d:"M20 63 C34 86 66 86 80 63","stroke-linecap":"round"});
  return face;
}
function makePrintFaceTrack(){
  const track=document.createElement("div");track.className="print-level-track";
  for(const id of ["NA","ECA","A","D"]){const cell=document.createElement("span");cell.className="print-level-cell";cell.appendChild(makePrintFace(id));track.appendChild(cell)}
  return track;
}
function makePrintWarning(){
  const namespace="http://www.w3.org/2000/svg",warning=document.createElementNS(namespace,"svg");warning.setAttribute("viewBox","0 0 100 100");warning.setAttribute("role","img");warning.setAttribute("aria-label","Attention : dysfonctionnement grave");warning.classList.add("print-warning-mark","print-category-warning");
  const triangle=document.createElementNS(namespace,"path");triangle.classList.add("print-warning-triangle");triangle.setAttribute("d","M50 7 Q54 7 56 12 L94 82 Q98 90 89 92 H11 Q2 90 6 82 L44 12 Q46 7 50 7 Z");triangle.setAttribute("fill","#111");triangle.setAttribute("stroke","#111");triangle.setAttribute("stroke-width","5");triangle.setAttribute("stroke-linejoin","round");triangle.style.setProperty("fill","#111","important");triangle.style.setProperty("stroke","#111","important");warning.appendChild(triangle);
  const exclamation=document.createElementNS(namespace,"path");exclamation.classList.add("print-warning-exclamation");exclamation.setAttribute("d","M50 29 V62");exclamation.setAttribute("stroke","#fff");exclamation.setAttribute("stroke-width","12");exclamation.setAttribute("stroke-linecap","round");exclamation.style.setProperty("stroke","#fff","important");warning.appendChild(exclamation);
  const dot=document.createElementNS(namespace,"circle");dot.classList.add("print-warning-dot");dot.setAttribute("cx","50");dot.setAttribute("cy","77");dot.setAttribute("r","5");dot.setAttribute("fill","#fff");dot.style.setProperty("fill","#fff","important");warning.appendChild(dot);return warning;
}
function makePrintCategoryLevels(selected,showBonus=false){
  const levelsEl=document.createElement("div");levelsEl.className="print-level-track print-category-levels";
  const dSelected=showBonus||selected==="D";
  for(const id of ["NA","ECA","A","D"]){const cell=document.createElement("span");cell.className="print-level-cell";const level=document.createElement("span");level.className="print-category-level";if(id==="D"){level.classList.add("d-level");if(dSelected)level.classList.add("visible")}if(dSelected?id==="D":selected===id)level.classList.add("active");level.textContent=id;cell.appendChild(level);levelsEl.appendChild(cell)}
  return levelsEl;
}
function printCategoryLevel(node,correction=null){
  const choices=correction?.manualChoices||manualChoices;
  if(Object.hasOwn(choices,node.id))return choices[node.id];
  if(node.methode)return node.methode==="bonus"?null:methodCalculation(node,correction?.leafChoices||leafChoices,correction?.methodStates||methodStates,correction?.categoryEvaluations||categoryEvaluations).level;
  const percentage=correction?getCategoryPercentage(node,correction.leafChoices||{},correction.manualCategoryPercent||{}):getCategoryPercentage(node);if(percentage===null)return null;
  const mean=percentage/50,thresholds=config.seuils||{};
  if(mean<Number(thresholds.NA_max_exclusif??0.5))return"NA";
  if(mean<Number(thresholds.ECA_max_exclusif??1.5))return"ECA";
  return"A";
}
function renderPrintCapacity(node){
  const row=document.createElement("div");row.className="print-capacity-row";
  const copy=document.createElement("div");copy.className="print-capacity-copy";
  const levelId=leafChoices[node.id],level=levels[levelId];
  const bullet=document.createElement("span");bullet.className="print-capacity-bullet";bullet.setAttribute("aria-hidden","true");copy.appendChild(bullet);
  if(!level)copy.classList.add("unassessed");
  const text=document.createElement("div");text.className="print-capacity-text";
  const title=document.createElement("span");title.className="print-capacity-title";title.textContent=node.titre;text.appendChild(title);
  const comment=document.createElement("span");comment.className="print-capacity-comment";
  const comments=level?(node.commentaires?.[levelId]?[node.commentaires[levelId]]:[]):["Non évaluée"];
  comment.textContent=comments.length?` : ${comments.join(" ; ")}`:"";
  text.appendChild(comment);copy.appendChild(text);row.append(copy,makePrintLevelTable(level?levelId:null));return row;
}
function renderPrintChildren(node){
  const fragment=document.createDocumentFragment();
  for(const child of node.enfants||[]){
    if(isLeaf(child)){fragment.appendChild(renderPrintCapacity(child));continue}
    const subcategory=document.createElement("section");subcategory.className="print-subcategory";
    const heading=document.createElement("h4");heading.className="print-subcategory-title";heading.textContent=child.titre;subcategory.appendChild(heading);
    subcategory.appendChild(renderPrintChildren(child));fragment.appendChild(subcategory);
  }
  return fragment;
}
function selectedMethodComment(node,owner,level){
  const options=owner.commentairesNiveaux?.[level]||[],selections=methodState(node).commentSelections||{},key=`${owner.id}:${level}`;
  if(Object.hasOwn(methodState(node).commentTexts||{},key))return methodState(node).commentTexts[key];
  const selected=Object.hasOwn(selections,key)?selections[key]:options[0]?.id;
  return options.find(item=>item.id===selected)?.texte||"";
}
function renderPrintMethod(node){
  const section=document.createElement("section");section.className="print-category print-method";
  const state=methodState(node),evaluation=categoryEvaluations[node.id]||{},heading=document.createElement("h3");heading.className="print-category-heading";
  const selected=node.methode==="bonus"?null:effectiveLevel(node),percentage=node.methode==="bonus"?null:getCategoryPercentage(node),statut=categoryStatut(node);
  const summary=document.createElement("span");summary.textContent=statut==="ne"?"NE":node.methode==="bonus"?`+${Number(state.bonus||0).toLocaleString("fr-FR")} pt`:`${selected||"Non évaluée"} · ${percentage===null?"—":`${percentage.toFixed(2).replace(".",",")} %`}`;
  const title=document.createElement("span");title.textContent=node.titre;heading.append(title,summary);section.appendChild(heading);
  if(statut==="ne")return section;
  const addLine=text=>{if(!text)return;const line=document.createElement("div");line.className="print-method-line";line.textContent=text;section.appendChild(line)};
  if(statut==="nn")addLine("Évaluée mais non notée (NN)");
  const comment=selected&&selectedMethodComment(node,node,selected);if(comment)addLine(comment);
  for(const [key,kind] of [["warning","PROBLEME"],["exceeded","VALORISATION"]])if(evaluation[key]){
    const motif=(node.commentMotifs||[]).find(item=>item.kind===kind&&item.id===(evaluation.motifIds?.[key]||evaluation.motifId));
    addLine(`${key==="warning"?"Attention":"Dépassé"}${motif?` : ${motif.label}`:""}`);
  }
  if(node.methode==="capacites")for(const capacity of descendantsLeaves(node)){
    const level=leafChoices[capacity.id],text=level&&selectedMethodComment(node,capacity,level);
    addLine(`${capacity.titre} : ${level||"Non évaluée"}${text?` — ${text}`:""}`);
  }
  if(node.methode==="bareme")for(const criterion of node.criteres||[]){const value=Object.hasOwn(state.scores||{},criterion.id)?String(state.scores[criterion.id]).replace(".",","):"—";addLine(`${criterion.titre} : ${value} / ${criterion.pointsMaximum}`)}
  if(node.methode==="distribution")addLine(node.niveaux.map(id=>`${id} : ${Number(state.counts?.[id])||0}`).join(" · "));
  if(node.methode==="compteur")addLine(`Nombre : ${Number(state.count)||0}`);
  if(node.methode==="minuteur")addLine(`Durée : ${state.recorded||state.startedAt?formatDuration(timerSeconds(state)):"—"} / ${formatDuration(node.dureeCibleSecondes)}`);
  if(node.methode==="bonus"){const item=(node.commentairesValorisation||[]).find(option=>option.id===state.bonusComment);addLine(Object.hasOwn(state,"bonusText")?state.bonusText:item?.texte)}
  return section;
}
function renderPrintReport(){
  const report=document.getElementById("printReport");report.replaceChildren();
  const header=document.createElement("div");header.className="print-header";
  const top=document.createElement("div");top.className="print-header-top";
  const student=document.createElement("div");student.className="print-header-name";student.textContent=`Élève : ${document.getElementById("studentName").textContent.trim()||"—"}`;
  const grade=document.createElement("span");grade.className="print-header-grade";const gradeValue=document.getElementById("finalGrade").value.trim();grade.textContent=gradeValue?`Note : ${gradeValue}`:`Note proposée : ${document.getElementById("finalScore").textContent||"—"}`;
  top.append(student,grade);header.appendChild(top);
  const bottom=document.createElement("div");bottom.className="print-header-bottom";
  const details=document.createElement("div");details.className="print-header-details";
  const type=document.createElement("span");type.textContent=grid.typeDevoir||grid.titre||"—";
  const level=document.createElement("span");level.textContent=grid.niveauDevoir||"—";
  details.append(type,level);bottom.append(details,makePrintFaceTrack());header.appendChild(bottom);
  report.appendChild(header);
  const roots=grid.elements||[],mappedIds=new Set(partLayout.flatMap(part=>part.categories.filter(category=>category.nodeId).map(category=>category.nodeId)));
  for(const part of partLayout){
    const categories=part.categories.map(category=>roots.find(root=>root.id===category.nodeId)).filter(Boolean);
    if(part.id===partLayout[0].id)categories.push(...roots.filter(root=>!mappedIds.has(root.id)));
    if(!categories.length)continue;
    const section=document.createElement("section");section.className="print-part";
    const title=document.createElement("h2");title.className="print-part-title";title.textContent=part.title;section.appendChild(title);
    for(const node of categories){
      if(node.methode){section.appendChild(renderPrintMethod(node));continue}
      const category=document.createElement("section");category.className="print-category";
      const heading=document.createElement("h3");heading.className="print-category-heading";
      const label=document.createElement("span");label.className="print-category-label";
      const name=document.createElement("span");name.textContent=node.titre;
      const comment=document.createElement("span");comment.className="print-category-comment";comment.setAttribute("aria-label","Emplacement du commentaire de catégorie");
      const evaluation=categoryEvaluations[node.id]||{},selectedMotif=(node.commentMotifs||[]).find(motif=>motif.id===evaluation.motifId);
      if(selectedMotif)comment.textContent=selectedMotif.label;
      label.append(name);
      if(evaluation.warning)label.appendChild(makePrintWarning());
      label.appendChild(comment);
      heading.append(label,makePrintCategoryLevels(printCategoryLevel(node),Boolean(evaluation.exceeded)));category.appendChild(heading);
      category.appendChild(renderPrintChildren(node));section.appendChild(category);
    }
    report.appendChild(section);
  }
  const legend=document.createElement("div");legend.className="print-legend";
  for(const [id,label] of [["NA","Non Acquis"],["ECA","En Cours d’Acquisition"],["A","Acquis"],["D","Dépassé"]]){
    const item=document.createElement("span");item.className="print-legend-item";item.textContent=`${id} : ${label}`;legend.appendChild(item);
  }
  report.appendChild(legend);
}
