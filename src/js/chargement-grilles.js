function applyLoadedGrid(loaded,fileName){
  grid=loaded.grid;config=loaded.config;partLayout=loaded.partLayout;levels=Object.fromEntries(grid.niveaux.map(level=>[level.id,level]));
  studentCorrections={};activeCorrectionStudentId=null;document.getElementById("studentName").textContent="";document.getElementById("finalGrade").value="";
  assignmentStudentDetails={};
  activateLoadedGrid(grid.titre);resetChoices();render();initializeAssignment();setStatus(`Grille « ${fileName} » chargée. Les choix précédents ont été réinitialisés.`);
  saveWorkspace();
}
function applyCsvText(text,fileName){applyLoadedGrid(gridFromCsv(text,fileName),fileName)}
async function loadRepositoryGrid(entry,button){
  button.disabled=true;const modalStatus=document.getElementById("gridCatalogStatus");modalStatus.hidden=false;modalStatus.textContent=`Chargement de la grille « ${entry.titre} »…`;
  try{
    const url=new URL(entry.fichier,document.baseURI);
    if(url.origin!==location.origin)throw new Error("le fichier doit être hébergé sur le même site.");
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok)throw new Error(`réponse HTTP ${response.status}.`);
    const text=await response.text();
    if(entry.fichier.toLowerCase().endsWith(".json"))applyLoadedGrid(gridFromJson(text),entry.fichier);
    else applyCsvText(text,entry.fichier);
    document.getElementById("gridCatalogDialog").close();setActiveView("devoir");
  }catch(error){modalStatus.textContent=`Impossible de charger « ${entry.titre} » : ${error.message}`}
  finally{button.disabled=false}
}
async function loadGridCatalog(){
  const catalogEl=document.getElementById("gridModalCatalog");
  try{
    const response=await fetch(new URL("grilles.json",document.baseURI),{cache:"no-cache"});
    if(!response.ok)throw new Error(`réponse HTTP ${response.status}.`);
    const catalog=await response.json();
    const entries=catalog.grilles||[];
    if(!entries.length)throw new Error("aucune grille n'est disponible.");
    const buttons=entries.map(entry=>{
      if(!entry||typeof entry.titre!=="string"||typeof entry.fichier!=="string"||!/\.(csv|json)$/i.test(entry.fichier))throw new Error("une entrée du catalogue est invalide.");
      const button=document.createElement("button");button.type="button";button.className="grid-modal-choice";
      const title=document.createElement("span");title.textContent=entry.titre;
      const detail=document.createElement("small");detail.textContent=entry.fichier.toLowerCase().endsWith(".json")?"Grille à méthodes multiples":"Grille CSV";
      const copy=document.createElement("span");copy.append(title,detail);button.append(copy);
      const icon=document.createElement("span");icon.className="menu-icon icone-check";icon.setAttribute("aria-hidden","true");button.append(icon);
      button.addEventListener("click",()=>loadRepositoryGrid(entry,button));return button;
    });
    catalogEl.replaceChildren(...buttons);
  }catch(error){catalogEl.textContent="Catalogue indisponible.";const modalStatus=document.getElementById("gridCatalogStatus");modalStatus.hidden=false;modalStatus.textContent=`Impossible de charger le catalogue des grilles : ${error.message}`}
}
