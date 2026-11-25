let workspaceDatabase=null,workspaceStorageReady=false,workspaceWritePending=null,workspaceWriting=false,workspaceRevision=0;
function showStorageWarning(message){const warning=document.getElementById("storageWarning");warning.textContent=message;warning.hidden=!message}
function openWorkspaceDatabase(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open("grilles-evaluation",1);
    request.onupgradeneeded=()=>request.result.createObjectStore("workspace");
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(new Error("Base de données bloquée par un autre onglet."));
  });
}
function readWorkspace(database){
  return new Promise((resolve,reject)=>{
    const transaction=database.transaction("workspace","readonly"),request=transaction.objectStore("workspace").get("current");
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);transaction.onabort=()=>reject(transaction.error);
  });
}
function writeWorkspace(database,snapshot,expectedRevision){
  return new Promise((resolve,reject)=>{
    const transaction=database.transaction("workspace","readwrite"),store=transaction.objectStore("workspace"),request=store.get("current");let conflict=false;
    request.onsuccess=()=>{
      if((request.result?.revision||0)!==expectedRevision){conflict=true;transaction.abort();return}
      store.put({...snapshot,revision:expectedRevision+1},"current");
    };
    transaction.oncomplete=()=>resolve(expectedRevision+1);
    transaction.onabort=()=>reject(conflict?new Error("workspace-conflict"):transaction.error||new Error("Sauvegarde annulée."));
    transaction.onerror=()=>reject(transaction.error);
  });
}
function workspaceSnapshot(){
  captureActiveCorrection();
  return structuredClone({version:1,gridLoaded:correctionApp.classList.contains("grid-loaded"),grid,config,partLayout,assignment,activeStudentGroup,assignmentStudentDetails,studentCorrections,activeCorrectionStudentId,correctionInteractionMode,
    currentCorrection:{manualChoices,manualCategoryPercent,categoryEvaluations,leafChoices,bonusChoices,methodStates:snapshotMethodStates(),studentName:document.getElementById("studentName").textContent,note:document.getElementById("finalGrade").value}});
}
async function saveWorkspace(){
  if(!workspaceStorageReady||!workspaceDatabase)return;
  try{workspaceWritePending=workspaceSnapshot()}catch(error){showStorageWarning("La sauvegarde locale a échoué. Les modifications restent uniquement en mémoire.");return}
  if(workspaceWriting)return;
  workspaceWriting=true;
  while(workspaceWritePending){
    const snapshot=workspaceWritePending;workspaceWritePending=null;
    try{workspaceRevision=await writeWorkspace(workspaceDatabase,snapshot,workspaceRevision);showStorageWarning("")}
    catch(error){
      workspaceWritePending=workspaceWritePending||snapshot;
      if(error.message==="workspace-conflict"){workspaceStorageReady=false;showStorageWarning("Un autre onglet a modifié les données enregistrées. Les changements de cet onglet ne sont plus sauvegardés ; ne le fermez pas sans les avoir relevés.")}
      else showStorageWarning("La sauvegarde locale a échoué. Les modifications restent uniquement en mémoire ; vérifiez l'espace disponible et les paramètres du navigateur.");
      break;
    }
  }
  workspaceWriting=false;
}
function restoreWorkspace(snapshot){
  if(!snapshot||snapshot.version!==1)throw new Error("Format de sauvegarde inconnu.");
  grid=snapshot.grid;config=snapshot.config;partLayout=snapshot.partLayout;assignment=snapshot.assignment||{};activeStudentGroup=snapshot.activeStudentGroup||null;
  assignmentStudentDetails=snapshot.assignmentStudentDetails||{};studentCorrections=snapshot.studentCorrections||{};activeCorrectionStudentId=snapshot.activeCorrectionStudentId||null;
  correctionInteractionMode=snapshot.correctionInteractionMode==="popup"?"popup":"complete";
  correctionModeMenu.querySelector(`input[value="${correctionInteractionMode}"]`).checked=true;
  const correction=snapshot.currentCorrection||{};manualChoices=correction.manualChoices||{};manualCategoryPercent=correction.manualCategoryPercent||{};categoryEvaluations=correction.categoryEvaluations||{};leafChoices=correction.leafChoices||{};bonusChoices=correction.bonusChoices||{};methodStates=correction.methodStates||{};
  levels=Object.fromEntries(grid.niveaux.map(level=>[level.id,level]));
  document.getElementById("studentName").textContent=correction.studentName||"";document.getElementById("finalGrade").value=correction.note||"";
  if(snapshot.gridLoaded){
    activateLoadedGrid(grid.titre);const form=document.getElementById("assignmentForm");
    for(const [name,value] of Object.entries(assignment)){const field=form.elements.namedItem(name);if(field)field.value=value}
    renderAssignmentGrid();render();
  }
  if(activeStudentGroup){renderStudentGroupTitle();renderStudentTable()}
  setActiveView("devoir");
}
async function initializeWorkspaceStorage(){
  document.body.inert=true;
  try{
    workspaceDatabase=await openWorkspaceDatabase();
    const snapshot=await readWorkspace(workspaceDatabase);if(snapshot){workspaceRevision=snapshot.revision||0;restoreWorkspace(snapshot)}
    workspaceStorageReady=true;
  }catch(error){showStorageWarning("La sauvegarde locale est indisponible ou illisible. Les modifications restent uniquement en mémoire ; ne fermez pas cette page sans avoir résolu le problème.")}
  finally{document.body.inert=false}
}
