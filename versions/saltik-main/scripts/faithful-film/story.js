// The role is part of the storyboard, not inferred from color or screen side.
export const FILM_CAST=Object.freeze([
 {id:'striker',name:'STRIKER',role:'free',appearance:'base'},
 {id:'gatling',name:'GATLING',role:'free',appearance:'base'},
 {id:'bt',name:'BT',role:'captive',appearance:'base'},
 {id:'gold',name:'STRIKER NOIR & OR',role:'captive',appearance:'base'},
 {id:'longrange',name:'LONGRANGE',role:'captive',appearance:'base'},
 {id:'dr01',name:'DR-01',role:'captive',appearance:'base'}
]);
export const FILM_CUTS=Object.freeze([0,4,8,12,16.5,21,29.5,36]);
export function filmScene(time){const t=Math.max(0,Math.min(36,time));let index=FILM_CUTS.findIndex((a,i)=>i<7&&t>=a&&t<FILM_CUTS[i+1]);if(index<0)index=6;const age=t-FILM_CUTS[index];return{index,age,progress:Math.min(1,age/(FILM_CUTS[index+1]-FILM_CUTS[index]))};}
