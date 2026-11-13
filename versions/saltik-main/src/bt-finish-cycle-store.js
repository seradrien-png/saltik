const KEY='saltik-bt-finish-next';
const normalize=value=>Number.isInteger(value)&&value>=0&&value<4?value:0;

// Resolve browser storage inside the guard: private browsing can throw even
// when merely reading the localStorage property.
export function readBTFinishCycle(storage){
 try{
  const target=storage===undefined?globalThis.localStorage:storage;
  return normalize(Number(target?.getItem(KEY)));
 }catch{return 0;}
}

export function saveBTFinishCycle(next,storage){
 try{
  const target=storage===undefined?globalThis.localStorage:storage;
  if(!target)return false;
  target.setItem(KEY,String(normalize(next)));return true;
 }catch{return false;}
}
