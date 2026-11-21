// Reuse the one media element owned by createAudio: no second music instance.
export function selectLevelMusic(level,media=document.getElementById('game-music')){
 const track=level===1?{src:'./audio/forest-loop.ogg',volume:.32}:
  level===3?{src:'./audio/saltik_velours_01_mecanique.mp3',volume:.40}:
  level===5?{src:'./audio/saltik_sable_rouge_v2.ogg',volume:.40}:null;
 if(!media)return false;
 if(!track){media.pause();return false;}
 media.loop=true;media.volume=track.volume;
 if(media.getAttribute('src')!==track.src){
  media.pause();media.src=track.src;media.load();
 }
 // Starting, pausing, muting and resuming remain with the existing audio bus.
 return true;
}
