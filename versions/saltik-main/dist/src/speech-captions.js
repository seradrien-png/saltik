// Captions follow decoded speech starts, rather than earlier queued game events.
export const VOICE_CAPTIONS=Object.freeze({
 ready:{text:'Limule and Regalec, ready!',tone:'amber'},
 'target-lock':{text:'Target lock!',tone:'teal'},
 'saltik-detected':{text:'Saltik detected!',tone:'amber'},
 'grab-him':{text:'Grab him!',tone:'coral'},
 goodbye:{text:'Goodbye!',tone:'teal'},
 'saltik-dont-kill-saltik':{text:"Saltik don't kill Saltik.",tone:'teal'},
 victory:{text:'Victory!',tone:'amber'}
});
export function createSpeechCaptions(element,{now=()=>performance.now()}={}){
 const speaker=element.querySelector('[data-speaker]'),text=element.querySelector('[data-line]');let until=0;
 function clear(){until=0;element.hidden=true;}
 function show(id,duration=0){const line=VOICE_CAPTIONS[id];if(!line){clear();return;}speaker.textContent='SALTIK';text.textContent=line.text;element.dataset.tone=line.tone;element.dataset.line=id;element.hidden=false;until=now()+Math.max(2200,(duration+.45)*1000);}
 function update(view){if(!['playing','won','dead'].includes(view)||now()>=until)clear();}
 return {show,clear,update};
}
