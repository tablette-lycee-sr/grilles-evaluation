function methodState(node,states=methodStates){return states[node.id]||{}}
function timerSeconds(state){return Math.max(0,Number(state.elapsedMs||0)+(state.startedAt?Date.now()-state.startedAt:0))/1000}
function timerPercentage(node,seconds){
  const points=node.courbe?.points||[];if(!points.length)return null;
  if(seconds<=points[0].secondes)return points[0].pourcentage;
  for(let index=1;index<points.length;index++){
    const previous=points[index-1],next=points[index];
    if(seconds<=next.secondes){
      const width=next.secondes-previous.secondes,position=(seconds-previous.secondes)/width;
      if(node.courbe?.interpolation!=="lisse")return previous.pourcentage+(next.pourcentage-previous.pourcentage)*position;
      const slopes=points.slice(1).map((point,offset)=>(point.pourcentage-points[offset].pourcentage)/(point.secondes-points[offset].secondes));
      const tangent=pointIndex=>{
        if(pointIndex===0)return slopes[0];if(pointIndex===points.length-1)return slopes[slopes.length-1];
        const left=slopes[pointIndex-1],right=slopes[pointIndex];if(left*right<=0)return 0;
        const leftWidth=points[pointIndex].secondes-points[pointIndex-1].secondes,rightWidth=points[pointIndex+1].secondes-points[pointIndex].secondes;
        const first=2*rightWidth+leftWidth,second=rightWidth+2*leftWidth;return(first+second)/(first/left+second/right);
      };
      const square=position*position,cube=square*position;
      const value=(2*cube-3*square+1)*previous.pourcentage+(cube-2*square+position)*width*tangent(index-1)+(-2*cube+3*square)*next.pourcentage+(cube-square)*width*tangent(index);
      return Math.max(0,Math.min(100,value));
    }
  }
  return points[points.length-1].pourcentage;
}
function methodCalculation(node,choices=leafChoices,states=methodStates,evaluations=categoryEvaluations){
  const state=methodState(node,states),ids=node.niveaux||[],thresholds=node.seuilsPourcentage||{};let percentage=null,count=0,total=0,level=null;
  if(node.methode==="capacites"){
    const leaves=descendantsLeaves(node),scored=leaves.filter(leaf=>Object.hasOwn(node.valeursNiveaux||{},choices[leaf.id]));
    total=leaves.length;count=scored.length;
    if(count)percentage=scored.reduce((sum,leaf)=>sum+node.valeursNiveaux[choices[leaf.id]]*getWeight(leaf),0)/scored.reduce((sum,leaf)=>sum+getWeight(leaf),0);
  }else if(node.methode==="bareme"){
    const criteria=node.criteres||[],scored=criteria.filter(item=>Object.hasOwn(state.scores||{},item.id));total=criteria.length;count=scored.length;
    if(count)percentage=100*scored.reduce((sum,item)=>sum+Number(state.scores[item.id]),0)/scored.reduce((sum,item)=>sum+Number(item.pointsMaximum),0);
  }else if(node.methode==="distribution"){
    count=ids.reduce((sum,id)=>sum+(Number(state.counts?.[id])||0),0);total=count;
    if(count)percentage=ids.reduce((sum,id)=>sum+(Number(state.counts?.[id])||0)*Number(node.valeursNiveaux[id]),0)/count;
  }else if(node.methode==="compteur"){
    const value=Number(state.count)||0;count=1;total=1;percentage=Math.min(100,100*value/Number(node.seuilsOccurrences.A));
    level=ids[0];for(const id of ids.slice(1))if(value>=Number(node.seuilsOccurrences[id]))level=id;
  }else if(node.methode==="minuteur"){
    if(state.startedAt||state.recorded||evaluations[node.id]?.warning){
      const seconds=timerSeconds(state),limits=node.seuilsSecondes;percentage=timerPercentage(node,seconds);count=1;total=1;
      if(seconds<limits.naTropCourt||seconds>=limits.naTropLong)level="NA";
      else if(seconds>=limits.entreeA&&seconds<=limits.sortieA)level="A";
      else if(ids.includes("ECA-"))level=seconds<limits.entreeA?(seconds<node.separationsECASecondes.tropCourt?"ECA-":"ECA+"):(seconds<=node.separationsECASecondes.tropLong?"ECA+":"ECA-");
      else level="ECA";
    }else total=1;
  }
  if(percentage!==null&&!level&&ids.length){level=ids[0];for(const id of ids.slice(1))if(percentage>=Number(thresholds[id]))level=id}
  return{level,mean:percentage===null?null:percentage/50,percentage,count,total,partial:total>0&&count<total};
}
