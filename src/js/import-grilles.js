function detectCsvDelimiter(text){
  const firstLine=text.split(/\r\n|\n|\r/,1)[0]||"";let quoted=false,commas=0,semicolons=0;
  for(let index=0;index<firstLine.length;index++){
    const character=firstLine[index];
    if(character==='"'){
      if(quoted&&firstLine[index+1]==='"'){index++;continue}
      quoted=!quoted;
    }else if(!quoted&&character===",")commas++;
    else if(!quoted&&character===";")semicolons++;
  }
  return semicolons>commas?";":",";
}
function parseCsv(text,requiredHeaders=["type","partie","categorie","sous_categorie","id","titre","evaluable","commentaire_NA","commentaire_ECA","commentaire_A","ponderation","parametre","valeur","coefficient_categorie"],allowEmpty=false){
  const source=text.replace(/^\uFEFF/,"");const delimiter=detectCsvDelimiter(source);const rows=[];
  let row=[],field="",quoted=false;
  for(let index=0;index<source.length;index++){
    const character=source[index];
    if(quoted){
      if(character==='"'){
        if(source[index+1]==='"'){field+='"';index++}
        else quoted=false;
      }else field+=character;
    }else if(character==='"'&&field.length===0)quoted=true;
    else if(character===delimiter){row.push(field);field=""}
    else if(character==="\n"||character==="\r"){
      if(character==="\r"&&source[index+1]==="\n")index++;
      row.push(field);if(row.some(value=>value.trim()!==""))rows.push(row);row=[];field="";
    }else field+=character;
  }
  if(quoted)throw new Error("un guillemet CSV n'est pas refermé.");
  if(field.length||row.length){row.push(field);if(row.some(value=>value.trim()!==""))rows.push(row)}
  if(!rows.length||(!allowEmpty&&rows.length<2))throw new Error("le fichier ne contient aucune donnée.");
  const headers=rows.shift().map(value=>value.trim());
  if(new Set(headers).size!==headers.length)throw new Error("les noms de colonnes doivent être uniques.");
  const missing=requiredHeaders.filter(header=>!headers.includes(header));
  if(missing.length)throw new Error(`colonnes manquantes : ${missing.join(", ")}.`);
  return rows.map((values,index)=>{
    if(values.length>headers.length)throw new Error(`la ligne ${index+2} contient trop de colonnes.`);
    return Object.fromEntries(headers.map((header,column)=>[header,(values[column]||"").trim()]));
  });
}
function csvNumber(value,label){
  const number=Number(String(value).trim().replace(",","."));
  if(!Number.isFinite(number))throw new Error(`${label} doit être un nombre.`);
  return number;
}
function gridFromCsv(text,fileName){
  const records=parseCsv(text);const partRows=[],capacityRows=[],categoryRows=[],motiveRows=[],parameterRows=[];
  for(const record of records){
    const type=String(record.type||"").trim().toLowerCase();
    if(type==="partie")partRows.push(record);
    else if(type==="capacite")capacityRows.push(record);
    else if(type==="categorie")categoryRows.push(record);
    else if(type==="motif")motiveRows.push(record);
    else if(type==="parametre")parameterRows.push(record);
    else throw new Error(`type de ligne inconnu : « ${record.type} ».`);
  }
  if(!capacityRows.length)throw new Error("aucune ligne de capacité n'a été trouvée.");
  let nextGroupId=0;const nextGroup=title=>({id:`__csv_node_${++nextGroupId}`,titre:title,evaluable:false,enfants:[]});
  const elements=[],parts=new Map(),categories=new Map(),subcategories=new Map(),capacityIds=new Set();
  const config=structuredClone(DEFAULT_CONFIG);config.ponderations={};config.coefficientsCategories={};
  const categoryDefinitions=new Map(),categoryDefinitionsById=new Map(),categoryIds=new Set();
  const partDefinitions=new Map();
  for(const row of partRows){
    const id=String(row.partie||"").trim(),title=String(row.titre||"").trim();
    if(!id||!title||partDefinitions.has(id))throw new Error(`définition de partie invalide ou répétée : « ${id} ».`);
    partDefinitions.set(id,{id:String(row.id||id).trim(),title});
    parts.set(id,{id:String(row.id||`csv-part-${parts.size+1}`).trim(),title,categories:[]});
  }
  for(const row of categoryRows){
    const partId=String(row.partie||"").trim(),categoryKey=String(row.categorie||"").trim(),categoryTitle=String(row.titre||"").trim(),id=String(row.id||"").trim();
    if(!partId||!categoryKey||!categoryTitle||!id||id.startsWith("__csv_node_")||categoryIds.has(id))throw new Error(`définition de catégorie invalide ou identifiant répété : « ${id} ».`);
    const key=JSON.stringify([partId,categoryKey]);
    if(categoryDefinitions.has(key))throw new Error(`la catégorie « ${categoryTitle} » est définie plusieurs fois.`);
    const coefficient=row.coefficient_categorie?csvNumber(row.coefficient_categorie,`Le coefficient de la catégorie « ${categoryTitle} »`):null;
    if(coefficient!==null&&coefficient<=0)throw new Error(`le coefficient de la catégorie « ${categoryTitle} » doit être supérieur à zéro.`);
    const comments={NA:row.commentaire_NA||"",ECA:row.commentaire_ECA||"",A:row.commentaire_A||"",D:row.commentaire_D||""};
    const allowed=value=>value===""||value===undefined?true:["true","1","oui","vrai"].includes(String(value).trim().toLowerCase());
    categoryIds.add(id);
    const definition={id,key,partId,categoryKey,categoryTitle,coefficient,comments,warningAllowed:allowed(row.avertissement_autorise),exceededAllowed:allowed(row.depasse_autorise)};
    categoryDefinitions.set(key,definition);categoryDefinitionsById.set(id,definition);
  }
  for(const row of capacityRows){
    const partId=String(row.partie||"").trim(),categoryKey=String(row.categorie||"").trim();
    const definition=row.categorie_id?categoryDefinitionsById.get(row.categorie_id):categoryDefinitions.get(JSON.stringify([partId,categoryKey]));
    if(row.categorie_id&&!definition)throw new Error(`identifiant de catégorie inconnu : « ${row.categorie_id} ».`);
    const partTitle=partDefinitions.get(partId)?.title||definition?.partTitle||partId,categoryTitle=definition?.categoryTitle||categoryKey,subcategoryTitle=row.sous_categorie==="_"?"":row.sous_categorie,capacityId=row.id,title=row.titre;
    if(!partTitle||!categoryTitle||!capacityId||!title)throw new Error("chaque capacité doit renseigner partie, catégorie, id et titre.");
    if(capacityId.startsWith("__csv_node_")||capacityIds.has(capacityId))throw new Error(`identifiant de capacité invalide ou répété : « ${capacityId} ».`);
    const evaluable=row.evaluable.toLowerCase();
    if(!["true","1","oui","vrai"].includes(evaluable))throw new Error(`la capacité « ${title} » doit être évaluable.`);
    const weight=csvNumber(row.ponderation,`La pondération de « ${title} »`);
    if(weight<=0)throw new Error(`la pondération de « ${title} » doit être supérieure à zéro.`);
    capacityIds.add(capacityId);
    let part=parts.get(partId);
    if(!part){part={id:`csv-part-${parts.size+1}`,title:partTitle,categories:[]};parts.set(partId,part)}
    const key=definition?.key||JSON.stringify([partId,categoryKey]);
    let category=categories.get(key);
    if(!category){
      category=nextGroup(categoryTitle);category.commentMotifs=[];category.commentaires=definition?.comments||{};
      category.avertissementAutorise=definition?.warningAllowed??true;category.depasseAutorise=definition?.exceededAllowed??true;
      if(definition){category.id=definition.id;if(definition.coefficient!==null)config.coefficientsCategories[category.id]=definition.coefficient}
      categories.set(key,category);elements.push(category);part.categories.push({nodeId:category.id,title:categoryTitle});
    }
    if(row.coefficient_categorie){
      const coefficient=csvNumber(row.coefficient_categorie,`Le coefficient de la catégorie « ${categoryTitle} »`);
      if(coefficient<=0)throw new Error(`le coefficient de la catégorie « ${categoryTitle} » doit être supérieur à zéro.`);
      const previous=config.coefficientsCategories[category.id];
      if(previous!==undefined&&previous!==coefficient)throw new Error(`le coefficient de la catégorie « ${categoryTitle} » doit être identique sur toutes ses lignes renseignées.`);
      config.coefficientsCategories[category.id]=coefficient;
    }
    let parent=category;
    if(subcategoryTitle){
      const subcategoryKey=JSON.stringify([partTitle,categoryTitle,subcategoryTitle]);
      let subcategory=subcategories.get(subcategoryKey);
      if(!subcategory){subcategory=nextGroup(subcategoryTitle);subcategories.set(subcategoryKey,subcategory);category.enfants.push(subcategory)}
      parent=subcategory;
    }
    parent.enfants.push({id:capacityId,titre:title,evaluable:true,commentaires:{NA:row.commentaire_NA,ECA:row.commentaire_ECA,A:row.commentaire_A,D:row.commentaire_D}});
    config.ponderations[capacityId]=weight;
  }
  for(const [key,definition] of categoryDefinitions){
    if(!categories.has(key))throw new Error(`la catégorie définie « ${definition.id} » ne contient aucune capacité.`);
    if(capacityIds.has(definition.id))throw new Error(`l’identifiant de catégorie « ${definition.id} » est déjà utilisé par une capacité.`);
  }
  const categoriesById=new Map([...categories.values()].map(category=>[category.id,category])),seenMotives=new Set();
  for(const row of motiveRows){
    const category=categoriesById.get(row.categorie_id),id=row.id,label=row.titre,kind=String(row.sous_categorie||"").trim().toUpperCase();
    if(!category||!id||!label)throw new Error(`motif de catégorie invalide : « ${id} ».`);
    const key=JSON.stringify([category.id,id]);
    if(seenMotives.has(key))throw new Error(`le motif « ${id} » est répété pour la catégorie « ${category.titre} ».`);
    seenMotives.add(key);category.commentMotifs.push({id,label,kind});
  }
  for(const category of categories.values())if(!Object.hasOwn(config.coefficientsCategories,category.id))throw new Error(`la catégorie « ${category.titre} » doit indiquer un coefficient_categorie.`);
  const requiredParameters=["seuil.NA_max_exclusif","seuil.ECA_max_exclusif","seuil.A_max_exclusif","bonus.plafond_total","bonus.pas_saisie","typeDevoir","niveauDevoir"];
  const metadata={typeDevoir:"",niveauDevoir:""};
  const seenParameters=new Set();
  for(const row of parameterRows){
    const key=row.parametre;
    if(!requiredParameters.includes(key)||seenParameters.has(key))throw new Error(`paramètre inconnu ou répété : « ${key} ».`);
    if(key==="typeDevoir"||key==="niveauDevoir"){
      if(!row.valeur)throw new Error(`le paramètre « ${key} » ne peut pas être vide.`);
      metadata[key]=row.valeur;
    }else{
      const value=csvNumber(row.valeur,`Le paramètre « ${key} »`);const [section,name]=key.split(".");
      if(section==="seuil")config.seuils[name]=value;
      else config.bonus[name]=value;
    }
    seenParameters.add(key);
  }
  const missingParameters=requiredParameters.filter(key=>!seenParameters.has(key));
  if(missingParameters.length)throw new Error(`paramètres manquants : ${missingParameters.join(", ")}.`);
  const id=`csv-${fileName.replace(/\.csv$/i,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`;
  const grid={...structuredClone(DEFAULT_GRID),id,titre:`${metadata.typeDevoir} — ${metadata.niveauDevoir}`,typeDevoir:metadata.typeDevoir,niveauDevoir:metadata.niveauDevoir,elements};
  config.grille=id;
  return{grid,config,partLayout:[...parts.values()]};
}
function gridFromJson(text){
  const source=JSON.parse(text),methods=new Set(["capacites","bareme","distribution","compteur","minuteur","bonus"]),ids=new Set();
  if(source.versionFormat!==1||!source.id||!source.titre||!Array.isArray(source.parties)||!source.parties.length)throw new Error("format de grille JSON invalide ou non pris en charge.");
  const config=structuredClone(DEFAULT_CONFIG);config.ponderations={};config.coefficientsCategories={};config.bonus.plafond_total=Number(source.parametres?.plafondBonus??3);
  if(!Number.isFinite(config.bonus.plafond_total)||config.bonus.plafond_total<0)throw new Error("plafond de bonus invalide.");
  const elements=[],partLayout=[],seenId=(id,label)=>{if(typeof id!=="string"||!id.trim()||ids.has(id))throw new Error(`identifiant invalide ou répété pour ${label} : « ${id||""} ».`);ids.add(id)};
  const levelDefinitions={NA:{id:"NA",libelle:"Non acquis",valeur:0,couleur:"#e45b60"},"ECA-":{id:"ECA-",libelle:"En cours d'acquisition −",valeur:.66,couleur:"#e8c64a"},ECA:{id:"ECA",libelle:"En cours d'acquisition",valeur:1,couleur:"#e8c64a"},"ECA+":{id:"ECA+",libelle:"En cours d'acquisition +",valeur:1.34,couleur:"#e8c64a"},A:{id:"A",libelle:"Acquis",valeur:2,couleur:"#49bd7b"}};
  const firstComments=comments=>Object.fromEntries(Object.entries(comments||{}).map(([id,items])=>[id,Array.isArray(items)?items[0]?.texte||"":String(items||"")]));
  const validateComments=(items,label)=>{if(!Array.isArray(items))throw new Error(`liste de commentaires invalide : « ${label} ».`);const commentIds=new Set();for(const item of items){if(typeof item?.id!=="string"||!item.id.trim()||commentIds.has(item.id)||typeof item.texte!=="string"||!item.texte.trim())throw new Error(`commentaire invalide ou répété : « ${label} ».`);commentIds.add(item.id)}};
  const capacity=item=>{seenId(item.id,"la capacité");if(!item.titre||!Number.isFinite(Number(item.poids))||Number(item.poids)<=0)throw new Error(`capacité invalide : « ${item.id} ».`);for(const [level,items] of Object.entries(item.commentaires||{}))validateComments(items,`${item.id} : ${level}`);config.ponderations[item.id]=Number(item.poids);return{...item,evaluable:true,commentairesNiveaux:item.commentaires||{},commentaires:firstComments(item.commentaires)}};
  for(const part of source.parties){
    seenId(part.id,"la partie");if(!part.titre||!Array.isArray(part.categories))throw new Error("partie JSON invalide.");
    const layout={id:part.id,title:part.titre,categories:[]};partLayout.push(layout);
    for(const category of part.categories){
      seenId(category.id,"la catégorie");if(!category.titre||!methods.has(category.methode))throw new Error(`catégorie JSON invalide : « ${category.id} ».`);
      if(typeof category.evaluee!=="boolean")throw new Error(`statut d'évaluation invalide : « ${category.id} ».`);
      const children=(category.capacites||[]).map(capacity);
      for(const group of category.sousCategories||[]){seenId(group.id,"la sous-catégorie");if(!group.titre||!Array.isArray(group.capacites))throw new Error(`sous-catégorie invalide : « ${group.id} ».`);children.push({...group,evaluable:false,enfants:group.capacites.map(capacity)})}
      if(category.ordreEnfants!==undefined){
        if(!Array.isArray(category.ordreEnfants)||category.ordreEnfants.length!==children.length||new Set(category.ordreEnfants).size!==children.length||category.ordreEnfants.some(id=>!children.some(child=>child.id===id)))throw new Error(`ordre des éléments invalide : « ${category.id} ».`);
        const order=new Map(category.ordreEnfants.map((id,index)=>[id,index]));children.sort((first,second)=>order.get(first.id)-order.get(second.id));
      }
      if(category.methode!=="bonus"){
        const coefficient=Number(category.coefficient);if(!Number.isFinite(coefficient)||coefficient<=0)throw new Error(`coefficient invalide : « ${category.id} ».`);
        config.coefficientsCategories[category.id]=coefficient;
        if(!["NA,ECA,A","NA,ECA-,ECA+,A"].includes((category.niveaux||[]).join(",")))throw new Error(`niveaux invalides : « ${category.id} ».`);
        if(!["obligatoire","facultative"].includes(category.priseEnCompte))throw new Error(`prise en compte invalide : « ${category.id} ».`);
      }
      if(category.methode==="capacites"&&!children.some(child=>Array.isArray(child.enfants)?child.enfants.length>0:true))throw new Error(`aucune capacité : « ${category.id} ».`);
      if(["capacites","distribution"].includes(category.methode)){
        const values=category.niveaux.map(id=>Number(category.valeursNiveaux?.[id]));
        if(values.some((value,index)=>!Number.isFinite(value)||value<0||value>100||(index>0&&value<values[index-1])))throw new Error(`valeurs de niveau invalides : « ${category.id} ».`);
      }
      if(["capacites","bareme","distribution"].includes(category.methode)){
        const thresholds=category.niveaux.slice(1).map(id=>Number(category.seuilsPourcentage?.[id]));
        if(thresholds.some((value,index)=>!Number.isInteger(value)||value<0||value>100||(index>0&&value<=thresholds[index-1])))throw new Error(`seuils de niveau invalides : « ${category.id} ».`);
      }
      if(category.methode==="bareme"){
        if(!Array.isArray(category.criteres)||!category.criteres.length)throw new Error(`aucun critère : « ${category.id} ».`);
        for(const criterion of category.criteres){seenId(criterion.id,"le critère");const maximum=Number(criterion.pointsMaximum),step=Number(criterion.pas);if(!criterion.titre||!Number.isFinite(maximum)||maximum<=0||!Number.isFinite(step)||step<=0)throw new Error(`critère invalide : « ${criterion.id} ».`)}
      }
      if(category.methode==="compteur"){
        const thresholds=[...category.niveaux.slice(1),"D"].map(id=>Number(category.seuilsOccurrences?.[id]));
        if(thresholds.some((value,index)=>!Number.isInteger(value)||value<=0||(index>0&&value<=thresholds[index-1])))throw new Error(`seuils du compteur invalides : « ${category.id} ».`);
      }
      if(category.methode==="minuteur"){
        if(elements.some(item=>item.methode==="minuteur"))throw new Error("une grille ne peut contenir qu'un minuteur.");
        const limits=category.seuilsSecondes||{},target=Number(category.dureeCibleSecondes),short=Number(limits.naTropCourt),start=Number(limits.entreeA),end=Number(limits.sortieA),long=Number(limits.naTropLong),points=category.courbe?.points;
        if(![target,short,start,end,long].every(Number.isFinite)||!(0<short&&short<start&&start<=target&&target<=end&&end<long)||!Array.isArray(points)||points.length<2)throw new Error(`paramètres du minuteur invalides : « ${category.id} ».`);
        if(category.niveaux.includes("ECA-")&&!(short<Number(category.separationsECASecondes?.tropCourt)&&Number(category.separationsECASecondes?.tropCourt)<start&&end<Number(category.separationsECASecondes?.tropLong)&&Number(category.separationsECASecondes?.tropLong)<long))throw new Error(`séparations ECA du minuteur invalides : « ${category.id} ».`);
        if(points.some((point,index)=>!Number.isFinite(point.secondes)||!Number.isFinite(point.pourcentage)||point.pourcentage<0||point.pourcentage>100||(index>0&&point.secondes<=points[index-1].secondes)))throw new Error(`courbe du minuteur invalide : « ${category.id} ».`);
        if(!["lineaire","lisse"].includes(category.courbe.interpolation)||points[0].secondes!==0||points[0].pourcentage!==0||!points.some(point=>point.secondes===start&&point.pourcentage===100)||!points.some(point=>point.secondes===end&&point.pourcentage===100)||points.some((point,index)=>point.secondes>=start&&point.secondes<=end&&point.pourcentage!==100||index>0&&point.secondes<=start&&point.pourcentage<points[index-1].pourcentage||index>0&&points[index-1].secondes>=end&&point.pourcentage>points[index-1].pourcentage))throw new Error(`progression de la courbe invalide : « ${category.id} ».`);
      }
      if(category.methode==="bonus"&&(!Number.isFinite(Number(category.pointsMaximum))||Number(category.pointsMaximum)<=0||!Number.isFinite(Number(category.pas))||Number(category.pas)<=0)){
        throw new Error(`paramètres du bonus invalides : « ${category.id} ».`);
      }
      const comments=category.commentaires||{};
      for(const [level,items] of Object.entries(comments.niveaux||{}))validateComments(items,`${category.id} : ${level}`);
      if(comments.attention!==undefined)validateComments(comments.attention,`${category.id} : Attention`);
      if(comments.depasse!==undefined)validateComments(comments.depasse,`${category.id} : Dépassé`);
      if(category.commentairesValorisation!==undefined)validateComments(category.commentairesValorisation,`${category.id} : Bonus`);
      const commentMotifs=[...(comments.attention||[]).map(item=>({id:item.id,label:item.texte,kind:"PROBLEME"})),...(comments.depasse||[]).map(item=>({id:item.id,label:item.texte,kind:"VALORISATION"}))];
      const node={...category,evaluable:false,enfants:children,commentairesNiveaux:comments.niveaux||{},commentaires:firstComments(comments.niveaux),commentMotifs,depasseAutorise:category.methode!=="minuteur"};
      elements.push(node);layout.categories.push({nodeId:node.id,title:node.titre});
    }
  }
  if(!elements.length)throw new Error("la grille ne contient aucune catégorie.");
  return{grid:{...source,niveaux:Object.values(levelDefinitions),elements,typeDevoir:source.titre,niveauDevoir:source.metadonnees?.niveau||""},config,partLayout};
}
