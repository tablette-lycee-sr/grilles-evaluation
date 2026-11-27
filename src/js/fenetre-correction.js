function getCorrectionTrombiCategories(){
  const categories=[],coefficients=config.coefficientsCategories||{},roots=grid.elements||[];
  const mappedIds=new Set(partLayout.flatMap(part=>part.categories.filter(category=>category.nodeId).map(category=>category.nodeId)));
  const visit=(nodes,partIndex)=>{
    for(const node of nodes||[]){
      if(Object.hasOwn(coefficients,node.id)||node.methode==="bonus")categories.push({node,partIndex});
      visit(node.enfants,partIndex);
    }
  };
  for(const [partIndex,part] of partLayout.entries()){
    const nodes=part.categories.map(category=>roots.find(root=>root.id===category.nodeId)).filter(Boolean);
    if(partIndex===0)nodes.push(...roots.filter(root=>!mappedIds.has(root.id)));
    visit(nodes,partIndex);
  }
  return categories;
}
function normalizeTrombiPhotoName(value){
  return value.normalize("NFD").replace(/\p{Diacritic}/gu,"").trim().replace(/\s+/g," ").toLocaleLowerCase("fr-FR");
}
function trombiPhotoKey(student){
  const name=[student.nom,student.prenom].filter(Boolean).join(" ");
  return name?normalizeTrombiPhotoName(name):"";
}
function getStudentTrombiPhotoCount(){
  return (activeStudentGroup?.students||[]).filter(student=>trombiPhotoUrls.has(trombiPhotoKey(student))).length;
}
const TROMBI_GROUP_ROWS=[
  [["","#999999"],["A","#A3B68D"],["B","#9B879E"],["C","#BEB597"],["D","#88A5A4"],["E","#B29B85"]],
  [["1","#A3B68D"],["2","#9B879E"],["3","#BEB597"],["4","#88A5A4"],["5","#B29B85"],["6","#728AA9"]],
  [["7","#AC7D7D"],["8","#E1DAC0"],["9","#C3B3C4"],["10","#C8B2A0"],["11","#BAD1D0"],["12","#BEB597"]],
  [["1A","#A3B68D"],["2A","#9B879E"],["3A","#B29B85"],["4A","#AC7D7D"],["OUI","#728AA9"]],
  [["1B","#BEB597"],["2B","#88A5A4"],["3B","#728AA9"],["4B","#D1DFB9"],["NON","#AC7D7D"]]
];
const TROMBI_GROUP_COLORS=new Map(TROMBI_GROUP_ROWS.flat().filter(([label])=>label).map(([label,color])=>[normalizeTrombiPhotoName(label),color]));
const TROMBI_CUSTOM_GROUP_COLORS=["#D8C1AF","#D1C0AD","#C9BBAA","#D2C7B5","#C9C5AD","#BEC6B0","#B9C8BB","#B2C7C2","#B5C5C9","#B6C3CC","#C2C1C7","#CABEC5"];
function getTrombiGroupColorMap(students){
  const groups=[...new Set(students.map(student=>assignmentStudentDetails[student.id]?.sousGroupe?.trim()).filter(Boolean).map(normalizeTrombiPhotoName))].sort((first,second)=>first.localeCompare(second,"fr",{sensitivity:"base"}));
  let customIndex=0;
  return new Map(groups.map(group=>[group,TROMBI_GROUP_COLORS.get(group)||TROMBI_CUSTOM_GROUP_COLORS[customIndex++%TROMBI_CUSTOM_GROUP_COLORS.length]]));
}
function updateStudentGroupColors(){
  const colors=getTrombiGroupColorMap(activeStudentGroup?.students||[]);
  document.querySelectorAll(".student-group-input").forEach(input=>{
    const color=colors.get(normalizeTrombiPhotoName(input.value));
    input.style.backgroundColor=color||"";input.style.color=color?"#111":"";
  });
}
function parseTrombiNote(note){
  const noteText=String(note??"").trim();
  if(!noteText||/^[\s\-–—−]+$/u.test(noteText))return null;
  const scoreText=noteText.replace(/\s*\/\s*20\s*$/,"" ).replace(",",".").trim();
  if(!scoreText)return null;
  const score=Number(scoreText);
  return Number.isFinite(score)&&score>=0&&score<=20?score:null;
}
function getTrombiNoteColor(note){
  const score=parseTrombiNote(note);
  if(score===null)return "#b9b9b9";
  if(score<7)return "#A33B40";
  if(score<12)return "#8A7000";
  if(score<18)return "#286B43";
  return "#276B9B";
}
function createTrombiPortrait(student,fullBleed=false){
  const photoUrl=student&&trombiPhotoUrls.get(trombiPhotoKey(student));
  if(photoUrl){
    const photo=document.createElement("img");photo.className="correction-trombi-portrait";photo.src=photoUrl;photo.alt=`Portrait de ${[student.nom,student.prenom].filter(Boolean).join(" ")}`;photo.loading="lazy";photo.draggable=false;return photo;
  }
  const namespace="http://www.w3.org/2000/svg",portrait=document.createElementNS(namespace,"svg");
  const width=fullBleed?100:72,height=fullBleed?130:88;
  portrait.setAttribute("viewBox",`0 0 ${width} ${height}`);portrait.setAttribute("aria-hidden","true");portrait.classList.add("correction-trombi-portrait");
  const background=document.createElementNS(namespace,"rect");background.setAttribute("width",String(width));background.setAttribute("height",String(height));if(!fullBleed)background.setAttribute("rx","6");background.setAttribute("fill","#34373b");
  const head=document.createElementNS(namespace,"circle");head.setAttribute("cx",fullBleed?"50":"36");head.setAttribute("cy",fullBleed?"42":"28");head.setAttribute("r",fullBleed?"20":"13");head.setAttribute("fill","#aeb3b9");
  const shoulders=document.createElementNS(namespace,"path");shoulders.setAttribute("d",fullBleed?"M7 130c2-33 19-51 43-51s41 18 43 51z":"M10 88c1-20 10-31 26-31s25 11 26 31z");shoulders.setAttribute("fill","#777d85");
  portrait.append(background,shoulders,head);return portrait;
}
function createTrombiLevelScale(selected=null,node=null,correction=null){
  const scale=document.createElement("div");scale.className="correction-trombi-level-scale";scale.setAttribute("aria-label",selected?`Niveau ${selected}`:"Aucun niveau saisi");
  if(node?.methode==="bonus"){const marker=document.createElement("span");marker.textContent=`+${Number(correction?.methodStates?.[node.id]?.bonus||0).toLocaleString("fr-FR")}`;scale.style.gridTemplateColumns="1fr";scale.append(marker);return scale}
  const scaleLevels=node?.niveaux?[...node.niveaux,...(node.depasseAutorise===false?[]:["D"])]:["NA","ECA","A","D"];scale.style.gridTemplateColumns=`repeat(${scaleLevels.length}, minmax(0, 1fr))`;
  for(const level of scaleLevels){const marker=document.createElement("span");marker.textContent=level;if(level===selected){marker.classList.add("selected");marker.dataset.level=level;if(level.startsWith("ECA"))marker.style.setProperty("--trombi-level-color","var(--yellow)")}scale.append(marker)}
  return scale;
}
function compareTrombiStudentNames(first,second){
  return first.nom.localeCompare(second.nom,"fr",{numeric:true,sensitivity:"base"})||first.prenom.localeCompare(second.prenom,"fr",{numeric:true,sensitivity:"base"});
}
function getSortedTrombiStudents(students){
  return students.slice().sort((first,second)=>{
    if(correctionTrombiSort==="name-asc")return compareTrombiStudentNames(first,second);
    if(correctionTrombiSort==="note"){
      const firstNote=parseTrombiNote(assignmentStudentDetails[first.id]?.note),secondNote=parseTrombiNote(assignmentStudentDetails[second.id]?.note);
      if(firstNote===null||secondNote===null)return Number(firstNote===null)-Number(secondNote===null)||compareTrombiStudentNames(first,second);
      return secondNote-firstNote||compareTrombiStudentNames(first,second);
    }
    const firstValue=String(studentFieldValue(first,correctionTrombiSort)).trim(),secondValue=String(studentFieldValue(second,correctionTrombiSort)).trim();
    if(!firstValue||!secondValue)return Number(!firstValue)-Number(!secondValue)||compareTrombiStudentNames(first,second);
    return firstValue.localeCompare(secondValue,"fr",{numeric:true,sensitivity:"base"})||compareTrombiStudentNames(first,second);
  });
}
function createTrombiCardHeader(student,number,groupColors){
  const header=document.createElement("div");header.className="correction-trombi-card-header";
  const cardNumber=document.createElement("span");cardNumber.className="correction-trombi-card-number";cardNumber.textContent=String(number);cardNumber.setAttribute("aria-label",`Élève numéro ${number} dans l’ordre alphabétique`);
  const note=assignmentStudentDetails[student.id]?.note,noteLabel=note===null||note===undefined||note===""?"—":String(note);
  const cardNote=document.createElement("span");cardNote.className="correction-trombi-card-note";cardNote.textContent=noteLabel;cardNote.style.backgroundColor=getTrombiNoteColor(note);cardNote.setAttribute("aria-label",`Note : ${noteLabel}`);
  const papBadge=document.createElement("span");papBadge.className="correction-trombi-card-pap";papBadge.textContent=student.pap?"!":"";papBadge.setAttribute("aria-label",student.pap?"PAP":"Pas de PAP");
  const groupName=assignmentStudentDetails[student.id]?.sousGroupe?.trim()||"";
  const groupBadge=document.createElement("span");groupBadge.className="correction-trombi-card-group";groupBadge.textContent=groupName||"—";groupBadge.style.backgroundColor=groupName?groupColors.get(normalizeTrombiPhotoName(groupName)):"var(--trombi-card-gray)";groupBadge.setAttribute("aria-label",groupName?`Groupe ${groupName}`:"Aucun groupe");
  header.append(cardNumber,cardNote,papBadge,groupBadge);return header;
}
function createTrombiCardPhoto(student){
  const portrait=createTrombiPortrait(student,true);portrait.classList.add("correction-trombi-card-portrait");
  const button=document.createElement("button");button.type="button";button.className="correction-trombi-card-photo correction-trombi-photo-button";button.dataset.studentId=student.id;button.setAttribute("aria-label",`Corriger ${[student.nom,student.prenom].filter(Boolean).join(" ")}`);button.addEventListener("click",()=>openStudentCorrection(student));button.append(portrait);return button;
}
function createTrombiCardName(student){
  const name=document.createElement("strong");name.className="correction-trombi-card-name";name.textContent=[student.nom,student.prenom].filter(Boolean).join(" ")||"Élève sans nom";return name;
}
function renderCorrectionPopupCategories(){
  const container=document.getElementById("correctionPopupCategories"),scrollTop=container.scrollTop;
  const focused=container.contains(document.activeElement)?document.activeElement:null;
  const focusedCategory=focused?.closest("[data-popup-category]")?.dataset.popupCategory,focusedLabel=focused?.getAttribute("aria-label");
  container.replaceChildren();
  for(const {node} of getCorrectionTrombiCategories()){
    const section=renderCategory({title:node.titre},node,true);section.dataset.popupCategory=node.id;container.append(section);
  }
  if(!container.children.length){const empty=document.createElement("p");empty.textContent="Aucune catégorie évaluable dans cette grille.";container.append(empty)}
  container.scrollTop=scrollTop;
  if(focusedCategory&&focusedLabel){
    const section=[...container.querySelectorAll("[data-popup-category]")].find(item=>item.dataset.popupCategory===focusedCategory);
    [...(section?.querySelectorAll("[aria-label]")||[])].find(item=>item.getAttribute("aria-label")===focusedLabel)?.focus({preventScroll:true});
  }
}
function openCorrectionPopup(student){
  const dialog=document.getElementById("correctionPopup"),identity=document.getElementById("correctionPopupStudent"),details=assignmentStudentDetails[student.id]||{};
  identity.replaceChildren();const photo=document.createElement("div");photo.className="correction-popup-photo";photo.append(createTrombiPortrait(student,true));identity.append(photo);
  const list=document.createElement("dl");
  for(const [label,value] of [["Classe",student.classe],["Sous-groupe",details.sousGroupe],["Sujet",details.sujet],["PAP",student.pap?"Oui":"Non"]]){
    const term=document.createElement("dt"),description=document.createElement("dd");term.textContent=label;description.textContent=value||"—";list.append(term,description);
  }
  identity.append(list);document.getElementById("correctionPopupName").textContent=[student.nom,student.prenom].filter(Boolean).join(" ")||"Élève sans nom";
  document.getElementById("correctionPopupRemark").value=details.remarque||"";renderCorrectionPopupCategories();dialog.show();
}
function renderCorrectionTrombi(){
  const criteria=document.getElementById("correctionTrombiCriteria"),track=document.getElementById("correctionTrombiTrack");
  const empty=document.getElementById("correctionTrombiEmpty"),matrix=document.getElementById("correctionTrombiMatrix"),cards=document.getElementById("correctionTrombiCards");
  const students=activeStudentGroup?.students||[];
  const categories=getCorrectionTrombiCategories(),criterionLabels=[...categories.map(category=>category.node.titre),"Sujet"];
  document.getElementById("correctionTrombiHeading").textContent=activeStudentGroup?.name||"";
  document.getElementById("correctionTrombiSummary").textContent=activeStudentGroup?`${students.length} ${students.length===1?"élève":"élèves"}`:"";
  empty.hidden=students.length>0;matrix.hidden=students.length===0||correctionTrombiMode==="full";cards.hidden=students.length===0||correctionTrombiMode!=="full";
  document.getElementById("correctionTrombiView").dataset.layout=correctionTrombiMode;
  updateCorrectionTrombiToggle();
  cards.replaceChildren();criteria.replaceChildren();track.replaceChildren();
  if(!activeStudentGroup)empty.querySelector("p").textContent="Aucun groupe d’élèves actif. Ouvrez l’onglet Élèves pour créer ou charger un groupe.";
  else empty.querySelector("p").textContent="Ce groupe ne contient aucun élève.";
  criteria.style.setProperty("--trombi-criterion-count",String(criterionLabels.length));
  track.style.setProperty("--trombi-criterion-count",String(criterionLabels.length));
  const criterionHeading=document.createElement("div");criterionHeading.className="correction-trombi-criterion-heading";criterionHeading.textContent="Critères";criteria.append(criterionHeading);
  for(const [index,label] of criterionLabels.entries()){
    const criterion=document.createElement("div");criterion.className="correction-trombi-criterion";criterion.textContent=label;criterion.title=label;
    if(index>0&&index<categories.length&&categories[index].partIndex!==categories[index-1].partIndex)criterion.classList.add("correction-trombi-part-start");
    criteria.append(criterion);
  }
  const alphabeticalStudents=students.slice().sort(compareTrombiStudentNames),studentNumbers=new Map(alphabeticalStudents.map((student,index)=>[student.id,index+1]));
  const sortedStudents=getSortedTrombiStudents(students);
  const groupColors=getTrombiGroupColorMap(alphabeticalStudents);
  const cardsPerRow=window.matchMedia("(max-width: 600px)").matches?3:9;let cardRow=null;
  for(const [index,student] of sortedStudents.entries()){
    if(index%cardsPerRow===0){cardRow=document.createElement("div");cardRow.className="correction-trombi-card-row";cardRow.setAttribute("role","presentation");cards.append(cardRow)}
    const card=document.createElement("article");card.className="correction-trombi-card";card.setAttribute("role","listitem");
    card.append(createTrombiCardHeader(student,studentNumbers.get(student.id),groupColors),createTrombiCardPhoto(student),createTrombiCardName(student));cardRow.append(card);
  }
  for(const student of sortedStudents){
    const column=document.createElement("article");column.className="correction-trombi-row-card";column.setAttribute("role","listitem");
    const header=document.createElement("div");header.className="correction-trombi-student-header";
    const metadata=document.createElement("span");metadata.className="correction-trombi-student-metadata";metadata.textContent=student.classe||"Classe non renseignée";
    header.append(createTrombiCardHeader(student,studentNumbers.get(student.id),groupColors),createTrombiCardPhoto(student),createTrombiCardName(student),metadata);
    const details=assignmentStudentDetails[student.id]||{};
    column.append(header);
    const correction=studentCorrections[student.id];
    for(const [index,{node:category,partIndex}] of categories.entries()){
      const selected=correction?.categoryEvaluations?.[category.id]?.exceeded?"D":correction?printCategoryLevel(category,correction):null;
      const scale=createTrombiLevelScale(selected,category,correction);
      if(index>0&&partIndex!==categories[index-1].partIndex)scale.classList.add("correction-trombi-part-start");
      column.append(scale);
    }
    for(const value of [details.sujet]){
      const cell=document.createElement("div");cell.className="correction-trombi-row-value";cell.textContent=value===null||value===undefined||value===""?"—":String(value);column.append(cell);
    }
    track.append(column);
  }
}
function updateCorrectionTrombiToggle(){
  const button=document.getElementById("toggleCorrectionTrombiLayout"),icon=button.querySelector(".menu-icon"),isFullPage=correctionTrombiMode==="full";
  const targetMode=isFullPage?"en rang":"en pleine page";
  button.title=`Afficher ${targetMode}`;button.setAttribute("aria-label",`Passer à l’affichage ${targetMode}`);button.setAttribute("aria-pressed",String(isFullPage));
  icon.classList.toggle("icone-view-list",isFullPage);icon.classList.toggle("icone-grid-view",!isFullPage);
  const returnButton=document.getElementById("showCorrectionTrombi"),returnMode=isFullPage?"en pleine page":"en rang";
  returnButton.title=`Revenir au trombinoscope ${returnMode}`;returnButton.setAttribute("aria-label",returnButton.title);
  const retourIcon=returnButton.querySelector(".menu-icon");retourIcon.classList.toggle("icone-grid-view",isFullPage);retourIcon.classList.toggle("icone-view-list",!isFullPage);
}
function closeStudentColumnMenu(){
  document.getElementById("studentColumnMenu").hidden=true;
  studentColumnMenuButton?.setAttribute("aria-expanded","false");studentColumnMenuButton=null;
}
