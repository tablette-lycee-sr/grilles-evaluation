function activateLoadedGrid(title){document.getElementById("pageTitle").textContent=title;document.querySelector(".app").classList.add("grid-loaded");initializePartNav()}
function initializeAssignment(){
  const today=new Date(),date=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
  assignment={id:createStudentId(),name:"",evaluationType:grid.typeDevoir||"",date,period:"",maxScore:20,comment:""};
  const form=document.getElementById("assignmentForm");
  for(const [name,value] of Object.entries(assignment)){const field=form.elements.namedItem(name);if(field)field.value=value}
  document.getElementById("assignmentEmptyState").hidden=true;
  document.getElementById("assignmentDetails").hidden=false;
  renderAssignmentGrid();
}
function resetAssignment(){
  grid=structuredClone(DEFAULT_GRID);config=structuredClone(DEFAULT_CONFIG);partLayout=PART_LAYOUT;levels=Object.fromEntries(grid.niveaux.map(level=>[level.id,level]));
  resetChoices();assignment={};studentCorrections={};activeCorrectionStudentId=null;
  for(const details of Object.values(assignmentStudentDetails))delete details.note;
  document.querySelector(".app").classList.remove("grid-loaded");
  document.getElementById("pageTitle").textContent="";partNavEl.replaceChildren();contentEl.replaceChildren();
  document.getElementById("studentName").textContent="";document.getElementById("finalGrade").value="";document.getElementById("finalScore").textContent="—/20";
  document.getElementById("assignmentForm").reset();document.getElementById("assignmentGridTree").replaceChildren();
  document.getElementById("assignmentEmptyState").hidden=false;document.getElementById("assignmentDetails").hidden=true;
  setStatus("");setActiveView("devoir");
}
function renderAssignmentGrid(){
  const tree=document.getElementById("assignmentGridTree"),roots=grid.elements||[];tree.replaceChildren();
  const mappedIds=new Set(partLayout.flatMap(part=>part.categories.filter(category=>category.nodeId).map(category=>category.nodeId)));
  for(const part of partLayout){
    const section=document.createElement("section");section.className="assignment-part";
    const title=document.createElement("h3");title.className="assignment-part-title";title.textContent=part.title;section.appendChild(title);
    for(const category of part.categories){
      const node=category.nodeId?roots.find(root=>root.id===category.nodeId):null;
      if(node)section.appendChild(renderAssignmentNode(node,1));
      else if(!category.nodeId){const placeholder=document.createElement("div");placeholder.className="assignment-node depth-1";const categoryTitle=document.createElement("div");categoryTitle.className="assignment-node-title";categoryTitle.textContent=category.title;placeholder.appendChild(categoryTitle);placeholder.appendChild(document.createElement("span"));section.appendChild(placeholder)}
    }
    if(part.id===partLayout[0]?.id){
      for(const node of roots.filter(root=>!mappedIds.has(root.id)))section.appendChild(renderAssignmentNode(node,1));
    }
    tree.appendChild(section);
  }
}
function renderAssignmentNode(node,depth){
  const fragment=document.createDocumentFragment(),row=document.createElement("div");
  row.className=`assignment-node depth-${Math.min(depth,4)}`;
  row.classList.toggle("has-children",Boolean(node.enfants?.length));
  const title=document.createElement("div");title.className="assignment-node-title";title.textContent=node.titre;row.appendChild(title);
  const isCategory=Object.hasOwn(config.coefficientsCategories,node.id);
  const coefficientKey=isCategory?"coefficientsCategories":isLeaf(node)&&Object.hasOwn(config.ponderations,node.id)?"ponderations":null;
  if(coefficientKey){
    row.classList.toggle("has-category-coefficient",isCategory);
    row.classList.toggle("has-capacity-coefficient",coefficientKey==="ponderations");
    const control=document.createElement("label");control.className="coefficient-control";if(coefficientKey==="ponderations")control.classList.add("capacity-coefficient-control");control.textContent="Coeff.";
    const input=document.createElement("input");input.className="coefficient-input";input.type="number";input.min="0.01";input.step="0.25";input.value=config[coefficientKey][node.id];input.setAttribute("aria-label",`${isCategory?"Coefficient de catégorie, appliqué à la note globale":"Coefficient de capacité, appliqué à sa catégorie"} : ${node.titre}`);
    input.addEventListener("change",()=>{const value=Number(input.value);if(!Number.isFinite(value)||value<=0){input.value=config[coefficientKey][node.id];return}config[coefficientKey][node.id]=value;updateFinalScore()});
    control.appendChild(input);row.appendChild(control);
  }else row.appendChild(document.createElement("span"));
  fragment.appendChild(row);
  for(const child of node.enfants||[])fragment.appendChild(renderAssignmentNode(child,depth+1));
  return fragment;
}
function createStudentId(){return globalThis.crypto?.randomUUID?.()||`eleve-${Date.now()}-${Math.random().toString(36).slice(2)}`}
function studentFieldValue(student,field){
  if(field==="pap")return student.pap?"Oui":"Non";
  if(Object.hasOwn(student,field))return student[field]||"";
  return assignmentStudentDetails[student.id]?.[field]||"";
}
function capitalizeStudentFirstNames(value){
  return value.replace(/(^|[\s'’\-])(\p{Ll})/gu,(_,separator,letter)=>separator+letter.toLocaleUpperCase("fr-FR"));
}
function matchesStudentFilter(student,field,filter){
  const value=String(studentFieldValue(student,field));
  return filter===EMPTY_STUDENT_FILTER?value.trim()==="":value.toLocaleLowerCase().includes(filter.toLocaleLowerCase());
}
function refreshStudentTableForField(field){if(studentSort.field===field||Object.hasOwn(studentFilters,field))renderStudentTable()}
function renderStudentGroupTitle(){
  const title=document.getElementById("studentGroupTitle");title.replaceChildren();
  if(!activeStudentGroup)return;
  const button=document.createElement("button");button.type="button";button.className="student-group-name-button";button.textContent=activeStudentGroup.name||"Nom du groupe";button.title="Renommer le groupe";button.setAttribute("aria-label",`Renommer le groupe ${activeStudentGroup.name||"sans nom"}`);
  button.addEventListener("click",()=>{
    const group=activeStudentGroup,input=document.createElement("input");input.type="text";input.className="student-group-name-input";input.value=group.name;input.setAttribute("aria-label","Nom du groupe d’élèves");title.replaceChildren(input);input.focus();input.select();
    let finished=false;
    const finish=(commit,restoreFocus)=>{
      if(finished||!input.isConnected)return;finished=true;
      if(activeStudentGroup===group&&commit){const name=input.value.trim();if(name)group.name=name}
      renderStudentGroupTitle();if(restoreFocus)title.querySelector("button")?.focus();
      if(commit&&activeStudentGroup===group)saveWorkspace();
    };
    input.addEventListener("blur",()=>finish(true,false));
    input.addEventListener("keydown",event=>{
      if(event.key==="Enter"||event.key==="Escape"){event.preventDefault();event.stopPropagation();finish(event.key==="Enter",true)}
    });
  });
  title.append(button);
}
function renderStudentTable(){
  const body=document.getElementById("studentTableBody"),allStudents=activeStudentGroup?.students||[];body.replaceChildren();
  document.getElementById("studentGroupCount").textContent=`(${allStudents.length} ${allStudents.length===1?"élève":"élèves"})`;
  let visibleStudents=allStudents.filter(student=>Object.entries(studentFilters).every(([field,filter])=>matchesStudentFilter(student,field,filter)));
  if(studentSort.field)visibleStudents.sort((first,second)=>String(studentFieldValue(first,studentSort.field)).localeCompare(String(studentFieldValue(second,studentSort.field)),"fr",{numeric:true,sensitivity:"base"})*studentSort.direction);
  document.querySelectorAll("[data-student-header]").forEach(header=>{
    const field=header.dataset.studentHeader,menuButton=header.querySelector("[data-column-menu]");
    header.setAttribute("aria-sort",studentSort.field===field?(studentSort.direction===1?"ascending":"descending"):"none");
    if(menuButton){
      const filterActive=Object.hasOwn(studentFilters,field);
      menuButton.setAttribute("aria-expanded",String(menuButton===studentColumnMenuButton));
      menuButton.setAttribute("aria-pressed",String(filterActive));
      menuButton.dataset.filterActive=String(filterActive);
    }
  });
  document.getElementById("studentPapFilter").checked=studentFilters.pap==="oui";
  const selectAll=document.getElementById("selectAllStudents"),selectedVisibleCount=visibleStudents.filter(student=>selectedStudentIds.has(student.id)).length;
  selectAll.checked=visibleStudents.length>0&&selectedVisibleCount===visibleStudents.length;
  selectAll.indeterminate=selectedVisibleCount>0&&selectedVisibleCount<visibleStudents.length;
  document.getElementById("deleteSelectedStudents").disabled=selectedStudentIds.size===0;
  const tableStatus=document.getElementById("studentTableStatus"),activeFilterCount=Object.keys(studentFilters).length;
  tableStatus.hidden=activeFilterCount===0;
  tableStatus.textContent=activeFilterCount?`${visibleStudents.length} élève(s) affiché(s) sur ${allStudents.length}.`:"";
  for(const student of visibleStudents){
    const row=document.createElement("tr");row.dataset.studentId=student.id;
    const selectionCell=document.createElement("td"),selectionCheckbox=document.createElement("input");
    selectionCheckbox.type="checkbox";selectionCheckbox.className="student-selection-checkbox";selectionCheckbox.checked=selectedStudentIds.has(student.id);selectionCheckbox.setAttribute("aria-label",`Sélectionner ${student.prenom} ${student.nom}`);
    selectionCheckbox.addEventListener("change",()=>{if(selectionCheckbox.checked)selectedStudentIds.add(student.id);else selectedStudentIds.delete(student.id);renderStudentTable()});
    selectionCell.append(selectionCheckbox);row.append(selectionCell);
    for(const [field,label] of [["nom","Nom"],["prenom","Prénom"],["classe","Classe"]]){
      const cell=document.createElement("td"),input=document.createElement("input");input.type="text";input.value=student[field]||"";if(field==="classe")input.maxLength=10;input.setAttribute("aria-label",`${label} de ${student.prenom} ${student.nom}`);
      input.addEventListener("input",()=>{
        if(field==="nom"){
          const cursor=input.selectionStart,upperPrefix=input.value.slice(0,cursor).toLocaleUpperCase("fr-FR"),upperValue=input.value.toLocaleUpperCase("fr-FR");
          if(input.value!==upperValue){input.value=upperValue;input.setSelectionRange(upperPrefix.length,upperPrefix.length)}
        }else if(field==="prenom"){
          const cursor=input.selectionStart,capitalized=capitalizeStudentFirstNames(input.value);
          if(input.value!==capitalized){const nextCursor=capitalizeStudentFirstNames(input.value.slice(0,cursor)).length;input.value=capitalized;input.setSelectionRange(nextCursor,nextCursor)}
        }
        student[field]=input.value;
      });input.addEventListener("change",()=>refreshStudentTableForField(field));
      cell.append(input);row.append(cell);
    }
    const papCell=document.createElement("td"),papInput=document.createElement("input");papInput.type="checkbox";papInput.className="student-pap-value";papInput.checked=Boolean(student.pap);papInput.setAttribute("aria-label",`PAP pour ${student.prenom} ${student.nom}`);papInput.addEventListener("change",()=>{student.pap=papInput.checked;refreshStudentTableForField("pap")});papCell.append(papInput);row.append(papCell);
    const details=assignmentStudentDetails[student.id]||(assignmentStudentDetails[student.id]={sousGroupe:"",sujet:"",remarque:""});
    for(const [field,label] of [["sousGroupe","Sous-groupe"],["sujet","Sujet"],["remarque","Remarque"]]){
      const cell=document.createElement("td"),input=document.createElement("input");input.type="text";input.value=details[field]||"";input.setAttribute("aria-label",`${label} pour ${student.prenom} ${student.nom}`);
      if(field==="sousGroupe"){
        input.classList.add("student-group-input");input.setAttribute("aria-haspopup","true");input.setAttribute("aria-expanded","false");
        input.addEventListener("focus",()=>openStudentGroupPalette(input,details));input.addEventListener("click",()=>openStudentGroupPalette(input,details));
      }
      input.addEventListener("input",()=>{details[field]=input.value;if(field==="sousGroupe")updateStudentGroupColors()});input.addEventListener("change",()=>refreshStudentTableForField(field));cell.append(input);row.append(cell);
    }
    body.append(row);
  }
  updateStudentGroupColors();
}
function createStudentGroupGrid(onChoose,disabled=false,forSelection=false){
  const groupGrid=document.createElement("div");groupGrid.className="student-group-grid";groupGrid.setAttribute("aria-label",forSelection?"Sous-groupe pour les élèves sélectionnés":"Sous-groupe de l'élève");
  for(const row of TROMBI_GROUP_ROWS)for(const [value,color] of row){
    const groupButton=document.createElement("button");groupButton.type="button";groupButton.textContent=value;groupButton.style.backgroundColor=color;groupButton.disabled=disabled;
    groupButton.setAttribute("aria-label",value?`Attribuer ${value}${forSelection?" à la sélection":""}`:forSelection?"Effacer le sous-groupe de la sélection":"Effacer le sous-groupe");
    if(value==="OUI"||value==="NON")groupButton.classList.add("student-group-grid-wide");
    groupButton.addEventListener("click",()=>onChoose(value));groupGrid.append(groupButton);
  }
  return groupGrid;
}
function showStudentColumnMenu(anchor,focusInput){
  const menu=document.getElementById("studentColumnMenu"),anchorRect=anchor.getBoundingClientRect();menu.hidden=false;studentColumnMenuButton=anchor;anchor.setAttribute("aria-expanded","true");
  const menuRect=menu.getBoundingClientRect(),left=Math.max(8,Math.min(anchorRect.left,window.innerWidth-menuRect.width-8));
  const below=anchorRect.bottom+2,top=below+menuRect.height<=window.innerHeight-8?below:Math.max(8,anchorRect.top-menuRect.height-2);
  menu.style.left=`${left}px`;menu.style.top=`${top}px`;focusInput?.focus();
}
function openStudentGroupPalette(input,details){
  if(studentColumnMenuButton===input)return;
  closeStudentColumnMenu();
  const menu=document.getElementById("studentColumnMenu");menu.replaceChildren();menu.setAttribute("aria-label",input.getAttribute("aria-label"));
  menu.append(createStudentGroupGrid(value=>{details.sousGroupe=value;closeStudentColumnMenu();renderStudentTable()}));
  showStudentColumnMenu(input);
}
function openStudentColumnMenu(button){
  if(studentColumnMenuButton===button){closeStudentColumnMenu();return}
  closeStudentColumnMenu();
  const field=button.dataset.columnMenu,header=button.closest("th"),label=header.querySelector(".student-header-label").textContent;
  const menu=document.getElementById("studentColumnMenu");menu.replaceChildren();menu.setAttribute("aria-label",`Actions pour ${label}`);
  const heading=document.createElement("p");heading.className="student-column-menu-heading";heading.textContent=label;menu.append(heading);
  const addAction=(icon,title,callback)=>{
    const action=document.createElement("button");action.type="button";action.className="student-column-action";
    const image=document.createElement("span");image.className=`menu-icon icone-${icon}`;image.setAttribute("aria-hidden","true");
    const copy=document.createElement("span");copy.className="student-column-action-copy";
    const strong=document.createElement("span");strong.textContent=title;copy.append(strong);action.append(image,copy);
    action.addEventListener("click",callback);menu.append(action);return action;
  };
  if(field!=="pap"){
    addAction("sort", "Trier par ordre croissant",()=>{studentSort={field,direction:1};closeStudentColumnMenu();renderStudentTable()});
    addAction("sort", "Trier par ordre décroissant",()=>{studentSort={field,direction:-1};closeStudentColumnMenu();renderStudentTable()});
    menu.querySelectorAll(".student-column-action .menu-icon")[1].style.transform="rotate(180deg)";
    const divider=document.createElement("div");divider.className="student-column-menu-divider";menu.append(divider);
  }
  const filter=document.createElement("label");filter.className="student-column-filter";filter.textContent="Filtrer cette colonne";
  const input=document.createElement("input");input.type="search";input.autocomplete="off";input.placeholder=field==="pap"?"Oui ou Non":"Saisir une valeur";input.value=studentFilters[field]===EMPTY_STUDENT_FILTER?"":studentFilters[field]||"";
  filter.append(input);menu.append(filter);
  const filterActions=document.createElement("div");filterActions.className="student-column-filter-actions";
  const clear=document.createElement("button");clear.type="button";clear.className="secondary";clear.textContent="Effacer";clear.disabled=!Object.hasOwn(studentFilters,field);
  clear.addEventListener("click",()=>{delete studentFilters[field];closeStudentColumnMenu();renderStudentTable()});
  const apply=document.createElement("button");apply.type="button";apply.textContent="Appliquer";
  apply.addEventListener("click",()=>{const value=input.value.trim();studentFilters[field]=value||EMPTY_STUDENT_FILTER;closeStudentColumnMenu();renderStudentTable()});
  input.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();apply.click()}});
  filterActions.append(clear,apply);menu.append(filterActions);
  if(field==="classe"){
    const classDivider=document.createElement("div");classDivider.className="student-column-menu-divider";menu.append(classDivider);
    const assignClassAction=addAction("school", `Attribuer une classe aux élèves sélectionnés (${selectedStudentIds.size})`,()=>{closeStudentColumnMenu();openStudentClassDialog()});
    assignClassAction.disabled=selectedStudentIds.size===0;
  }else if(["sousGroupe","sujet","remarque"].includes(field)){
    const bulkDivider=document.createElement("div");bulkDivider.className="student-column-menu-divider";menu.append(bulkDivider);
    const applyBulkValue=value=>{
      for(const student of activeStudentGroup?.students||[]){
        if(!selectedStudentIds.has(student.id))continue;
        const details=assignmentStudentDetails[student.id]||(assignmentStudentDetails[student.id]={sousGroupe:"",sujet:"",remarque:""});
        details[field]=value;
      }
      closeStudentColumnMenu();renderStudentTable();
    };
    if(field==="sousGroupe"){
      const bulkLabel=document.createElement("div");bulkLabel.className="student-column-filter";bulkLabel.textContent=`Valeur commune pour la sélection (${selectedStudentIds.size})`;menu.append(bulkLabel);
      menu.append(createStudentGroupGrid(applyBulkValue,selectedStudentIds.size===0,true));
    }else{
      const bulkLabel=document.createElement("label");bulkLabel.className="student-column-filter";bulkLabel.textContent="Valeur commune pour la sélection";
      const bulkInput=document.createElement("input");bulkInput.type="text";bulkInput.autocomplete="off";bulkInput.placeholder="Saisir le texte";bulkInput.setAttribute("aria-label",`Valeur à appliquer à la colonne ${label} pour les élèves sélectionnés`);
      bulkLabel.append(bulkInput);menu.append(bulkLabel);
      const bulkActions=document.createElement("div");bulkActions.className="student-column-filter-actions";
      const bulkApply=document.createElement("button");bulkApply.type="button";bulkApply.textContent=`Appliquer à la sélection (${selectedStudentIds.size})`;bulkApply.disabled=selectedStudentIds.size===0;
      bulkApply.addEventListener("click",()=>applyBulkValue(bulkInput.value.trim()));
      bulkInput.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();bulkApply.click()}});
      bulkActions.append(bulkApply);menu.append(bulkActions);
    }
  }
  showStudentColumnMenu(button,input);
}
function addStudentRow(student={}){
  if(!activeStudentGroup)return;
  const newStudent={id:createStudentId(),nom:student.nom||"",prenom:student.prenom||"",classe:student.classe||"",pap:Boolean(student.pap)};
  activeStudentGroup.students.push(newStudent);assignmentStudentDetails[newStudent.id]={sousGroupe:"",sujet:"",remarque:""};renderStudentTable();
  const newStudentRow=[...document.getElementById("studentTableBody").rows].find(row=>row.dataset.studentId===newStudent.id);
  newStudentRow?.querySelector("input[type='text']")?.focus();
}
async function openStudentClassDialog(){
  const selectedStudents=activeStudentGroup?.students.filter(student=>selectedStudentIds.has(student.id))||[];
  if(!selectedStudents.length){
    const status=document.getElementById("studentImportStatus");status.hidden=false;status.textContent="Sélectionnez au moins un élève avant d’attribuer une classe.";return;
  }
  const status=document.getElementById("studentClassStatus"),select=document.getElementById("studentClassSelect"),applyButton=document.getElementById("applyStudentClass");
  status.textContent="Chargement du catalogue…";select.replaceChildren();applyButton.disabled=true;
  try{
    const response=await fetch(new URL("catalogue-des-classes.csv",document.baseURI),{cache:"no-cache"});
    if(!response.ok)throw new Error(`réponse HTTP ${response.status}.`);
    const rows=parseCsv(await response.text(),["classe"]),classes=[...new Set(rows.map(row=>row.classe.trim()).filter(Boolean))];
    if(!classes.length)throw new Error("le catalogue ne contient aucune classe.");
    const placeholder=document.createElement("option");placeholder.value="";placeholder.textContent="Sélectionner une classe…";placeholder.disabled=true;placeholder.selected=true;select.append(placeholder);
    for(const name of classes){const option=document.createElement("option");option.value=name;option.textContent=name;select.append(option)}
    status.textContent=`${classes.length} classes disponibles. Le choix sera appliqué à ${selectedStudents.length} élève(s) sélectionné(s).`;
    document.getElementById("studentClassDialog").showModal();
  }catch(error){
    const importStatus=document.getElementById("studentImportStatus");importStatus.hidden=false;importStatus.textContent=`Catalogue des classes indisponible : ${error.message}`;
  }
}
function parseStudentCsv(text){
  const lines=String(text).replace(/^\uFEFF/,"").split(/\r\n|\n|\r/),students=[];
  for(const line of lines){
    const nameCell=line.split(";",1)[0].trim();
    if(!nameCell||/^\d+\s+élèves?\b/i.test(nameCell)||/^moyenne\b/i.test(nameCell))continue;
    const firstNameToken=[...nameCell.matchAll(/\S+/gu)].find(token=>/\p{Ll}/u.test(token[0]));
    if(!firstNameToken)continue;
    const nom=nameCell.slice(0,firstNameToken.index).trim().replace(/\s+/g," ");
    const prenom=nameCell.slice(firstNameToken.index).trim().replace(/\s+/g," ");
    if(!nom||!prenom||!/[\p{Lu}]/u.test(nom)||/[\p{Ll}]/u.test(nom))continue;
    students.push({nom,prenom,classe:"",pap:false});
  }
  if(!students.length)throw new Error("aucun élève avec un nom ou un prénom n’a été trouvé.");
  return students;
}
function serializeStudentGroupCsv(group){
  const escape=value=>`"${String(value??"").replace(/"/g,'""')}"`;
  const rows=[["Nom","Prénom","Classe","PAP"],...group.students.map(student=>[student.nom,student.prenom,student.classe,student.pap?"Oui":"Non"])];
  return `\uFEFF${rows.map(row=>row.map(escape).join(";")).join("\r\n")}\r\n`;
}
function parseStudentGroupCsv(text){
  const rows=parseCsv(text,["Nom","Prénom","Classe","PAP"],true);
  return rows.map((row,index)=>{
    const pap=normalizeTrombiPhotoName(row.PAP);
    if(!["oui","non","true","false","1","0",""].includes(pap))throw new Error(`valeur PAP invalide à la ligne ${index+2} : « ${row.PAP} ».`);
    return{nom:row.Nom,prenom:row.Prénom,classe:row.Classe,pap:["oui","true","1"].includes(pap)};
  });
}
