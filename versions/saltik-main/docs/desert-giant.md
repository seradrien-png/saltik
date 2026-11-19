# Giant lower-leg passage

`src/desert-giant.js` adds an entirely cosmetic, eight-second outbound encounter. Register `dist/assets/desert-giant-legs.png` as `desert-giant-legs` in the common image loader. The original panorama is unchanged.

Call `advanceDesertGiant(g, dt)` on the fixed simulation update. It initializes `g.desert.giant`, triggers once at player x >= 2800, and preserves that state through the C-07 visit and return. A new desert state resets it. Pause, intro, non-outbound phases, and invalid dt freeze the clock. No collision, damage, enemy, control, or audio state is touched.

Call `drawDesertGiant(context, images['desert-giant-legs'], g, {box, time})` after the panorama and before both lane actors and the skull foreground mask. `box` is the panorama's pixel rectangle `{x,y,w,h}`. `time` is accepted but ignored; only the simulation clock determines the pose. The renderer clips to this rectangle.

The transparent 1254×1254 atlas is generated artwork with separate tibia/fibula (crop 145,0,280,1190) and foot (crop 520,890,734,310). It deliberately contains no knees, thighs, pelvis, or upper body. The source file remains at `/workspace/generated_images/exec-9dd86727-3185-4816-a2ee-d0ff0de6b4ba.png`. Warm ivory/caramel highlights, orange shadows, and dense black stippling/hatching reference the existing desert bones and supplied PDF art. The image was generated as art; code only articulates its two parts.

Each shin renders at three panorama heights, exiting through the top of frame. Feet span approximately a quarter of panorama width and contact the sand around 82% of its height. Two legs alternate 1.2-second stationary ground contacts and 1.2-second eased lifted swings. The planted foot remains fixed while the other passes; ankle and shin rotations differ during swing. Contact shadows remain at ground level.

Verification: `node --test tests/desert-giant.test.js` covers trigger, single passage, reset, pause, interior preservation, invalid dt, deterministic stepping, fixed stance, alternating lifted swing, continuous landing, source anatomy crops, clipping, and draw independence from wall time.
