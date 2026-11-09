// Each native cutout is registered once in world space. Atlas rectangles are
// sampled directly by Canvas so all transparent engraved edges stay intact.
export const INK_BRIDGE=Object.freeze({x:400,y:100,w:1592.8,h:632});
export const INK_OBSERVATORY=Object.freeze({x:3500,y:15,w:1383.72,h:691.86});
export const INK_LANDMARK_ASSETS=Object.freeze([
  {name:'ink-campaign-atlas',file:'ink-campaign-atlas.png'},
  {name:'ink-approach-atlas',file:'ink-approach-atlas.png'},
  {name:'ink-checkpoint',file:'ink-checkpoint.png'}
]);

export const INK_WORLD_ART=Object.freeze({
  bridge:{asset:'ink-bridge',routeId:'ledge-0',bounds:INK_BRIDGE,replaceCanopy:true},
  observatory:{asset:'ink-observatory',routeId:'ledge-1',bounds:INK_OBSERVATORY},
  wreck:{asset:'ink-approach-atlas',routeId:'wreck-perch',source:{x:950,y:548,w:824,h:339},bounds:{x:5110,y:297,w:1071.2,h:440.7}},
  gorge:{asset:'ink-campaign-atlas',routeId:'ledge-2',source:{x:1010,y:0,w:1011,h:385},bounds:{x:6900,y:140,w:1314.3,h:500.5},groundFeet:true},
  checkpoint:{asset:'ink-checkpoint',routeId:'ledge-3',bounds:{x:9360,y:-55,w:2082.15,h:832.65}},
  checkpointTurn:{asset:'ink-checkpoint',routeId:'checkpoint-turn',bounds:{x:9360,y:-55,w:2082.15,h:832.65},shared:true},
  roof:{asset:'ink-checkpoint',routeId:'bridge-3',bounds:{x:9360,y:-55,w:2082.15,h:832.65},shared:true},
  breach:{asset:'ink-approach-atlas',routeId:'ledge-5',source:{x:900,y:0,w:874,h:546},bounds:{x:14980,y:-160,w:1311,h:819}},
  breachLanding:{asset:'ink-approach-atlas',routeId:'breach-landing',source:{x:900,y:0,w:874,h:546},bounds:{x:14980,y:-160,w:1311,h:819},shared:true},
  treeTransition:{asset:'ink-approach-atlas',source:{x:0,y:0,w:900,h:546},bounds:{x:-220,y:-90,w:1120,h:679.47},decoration:true},
  wreckHulk:{asset:'ink-campaign-atlas',source:{x:0,y:0,w:1010,h:386},bounds:{x:2550,y:150,w:1212,h:463.2},decoration:true},
  creek:{asset:'ink-approach-atlas',source:{x:0,y:548,w:950,h:339},bounds:{x:8450,y:390,w:950,h:339},decoration:true,grounded:true},
  escarpment:{asset:'ink-campaign-atlas',source:{x:1010,y:386,w:1011,h:392},bounds:{x:12200,y:80,w:1718.7,h:666.4},decoration:true,grounded:true},
  summitRoots:{asset:'ink-approach-atlas',source:{x:0,y:548,w:950,h:339},bounds:{x:14050,y:315,w:855,h:305.1},decoration:true,grounded:true}
});

export function inkLandmarkArt(images){
  return Object.fromEntries(Object.entries(INK_WORLD_ART).map(([name,definition])=>[name,{
    ...definition,image:images[definition.asset],clip:'none'
  }]));
}
