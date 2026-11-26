function loadStudentCorrection(student){
  if(activeCorrectionStudentId!==student.id){
    pauseMethodTimers();captureActiveCorrection();activeCorrectionStudentId=student.id;
    const correction=structuredClone(studentCorrections[student.id]||{});
    manualChoices=correction.manualChoices||{};manualCategoryPercent=correction.manualCategoryPercent||{};categoryEvaluations=correction.categoryEvaluations||{};
    leafChoices=correction.leafChoices||{};bonusChoices=correction.bonusChoices||{};methodStates=correction.methodStates||{};
    document.getElementById("finalGrade").value=correction.note||"";
  }
  document.getElementById("studentName").textContent=[student.nom,student.prenom].filter(Boolean).join(" ");
  updateCorrectionStudentNavigation();
}
function openStudentCorrection(student){
  if(!document.querySelector(".app").classList.contains("grid-loaded")){
    setStatus("Créez d'abord un devoir et choisissez une grille de correction.","error");return;
  }
  if(!document.getElementById("correctionTrombiView").hidden)correctionStudentOrder=getSortedTrombiStudents(activeStudentGroup?.students||[]).map(item=>item.id);
  loadStudentCorrection(student);
  if(correctionInteractionMode==="popup"&&!document.getElementById("correctionTrombiView").hidden){openCorrectionPopup(student);return}
  document.getElementById("correctionTrombiView").hidden=true;document.querySelector(".app").classList.remove("trombi-view");render();
}
function updateCorrectionStudentNavigation(){
  const students=activeStudentGroup?.students||[],studentIds=new Set(students.map(student=>student.id));
  correctionStudentOrder=correctionStudentOrder.filter(id=>studentIds.has(id));
  if(!correctionStudentOrder.includes(activeCorrectionStudentId))correctionStudentOrder=getSortedTrombiStudents(students).map(student=>student.id);
  const index=correctionStudentOrder.indexOf(activeCorrectionStudentId);
  document.getElementById("previousCorrectionStudent").disabled=index<=0;
  document.getElementById("nextCorrectionStudent").disabled=index<0||index>=correctionStudentOrder.length-1;
  const photoButton=document.getElementById("showCorrectionStudentInfo"),student=students.find(item=>item.id===activeCorrectionStudentId);
  photoButton.disabled=!student;photoButton.replaceChildren();
  if(student)photoButton.append(createTrombiPortrait(student,true));
  else{const icon=document.createElement("span");icon.className="menu-icon";icon.style.setProperty("--icon","url('icones/portrait.svg')");icon.setAttribute("aria-hidden","true");photoButton.append(icon)}
}
function navigateCorrectionStudent(direction){
  updateCorrectionStudentNavigation();
  const index=correctionStudentOrder.indexOf(activeCorrectionStudentId),id=correctionStudentOrder[index+direction];
  const student=activeStudentGroup?.students.find(item=>item.id===id);
  if(student)openStudentCorrection(student);
}
