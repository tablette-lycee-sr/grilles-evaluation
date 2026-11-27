const DEVOIR_TYPE="devoir-grilles-evaluation";
function devoirNomAllège(value){
  return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60);
}
function devoirFileName(){
  const today=new Date(),date=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
  const groupe=devoirNomAllège(activeStudentGroup?.name)||"sans-groupe",titre=devoirNomAllège(assignment?.name||grid?.titre)||"sans-titre";
  return `DEVOIR_${date}_${groupe}_${titre}.devoir.json`;
}
function serializeDevoir(){
  return JSON.stringify({type:DEVOIR_TYPE,dateEnregistrement:new Date().toISOString(),...workspaceSnapshot()});
}
function parseDevoir(text){
  let fichier;try{fichier=JSON.parse(text)}catch(error){throw new Error("fichier illisible, JSON attendu.")}
  if(fichier?.type!==DEVOIR_TYPE)throw new Error("ce fichier n'est pas un devoir de l'application.");
  if(fichier.version===1)return fichier;
  throw new Error(Number(fichier.version)>1?"fichier d'une version plus récente, mettez l'application à jour.":"format de sauvegarde inconnu.");
}
let pendingDevoirImport=null;
function restaurerDevoir(snapshot){
  try{restoreWorkspace(snapshot)}catch(error){setStatus(`Impossible d'ouvrir le devoir : ${error.message}`,"error");return}
  saveWorkspace();
  const titre=assignment?.name||grid?.titre||"";
  setStatus(`Devoir « ${titre} » restauré. Le trombinoscope reprend les photos après avoir relu le dossier d'images.`);
}
async function ouvrirDevoir(fichier){
  let snapshot;try{snapshot=parseDevoir(await fichier.text())}catch(error){setStatus(`Impossible d'ouvrir le devoir : ${error.message}`,"error");return}
  if(document.querySelector(".app").classList.contains("grid-loaded")){
    pendingDevoirImport=snapshot;
    document.getElementById("openDevoirMessage").textContent="Le devoir du fichier remplacera l'espace de travail actif (grille, devoir, élèves et corrections). Cette action est irréversible.";
    document.getElementById("openDevoirDialog").showModal();document.getElementById("cancelOpenDevoir").focus();return;
  }
  restaurerDevoir(snapshot);
}
function enregistrerDevoir(){
  if(!document.querySelector(".app").classList.contains("grid-loaded")){setStatus("Créez d'abord un devoir et choisissez une grille de correction.","error");return}
  let contenu;try{contenu=serializeDevoir()}catch(error){setStatus(`Impossible d'enregistrer le devoir : ${error.message}`,"error");return}
  const blob=new Blob([contenu],{type:"application/json"}),url=URL.createObjectURL(blob),lien=document.createElement("a");
  lien.href=url;lien.download=devoirFileName();
  document.body.appendChild(lien);lien.click();lien.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  setStatus(`Devoir enregistré dans le fichier « ${lien.download} ». Conservez-le dans un emplacement adapté aux données personnelles.`);
}
