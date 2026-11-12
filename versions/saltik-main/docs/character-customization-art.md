# Optional skins and native turn art

User references: beige Limule&Régalec Gatling, gold/turquoise Dragon Striker. Two original skinboards remain authority. New registered paint maps were generated using native baked sprites, composed through original alpha/ink, without replacing original anatomy.

New assets: bt-turn.png and gatling-turn.png,2172×724RGBA, three separately illustrated724pxcells. Character-turns.js stores measured footanchors/heights; character-turn-sockets.js stores actual pixel-measured cap centers/radii, preserves currentammunition. BT body/eye and crouch remain conditional to playable BT only. Striker original turn atlas unchanged.

Dragon maps: dragon-striker-material.png1422×1106, dragon-turn-material.png2172×724. Limule maps: limule-gatling-material.png1536×1024, limule-gatling-turn-material.png2172×724. Generated from userboard extraction /workspace/skin-art-v33/reference-skins.png and native exports /workspace/turns-v33/. Base maps registered over exact templates; source alpha/ink retain geometry.

Four mission finishes are baked and cached on demand rather than allocating every variant at startup. Lunar surface engraving, diamond velvet quilting and lower-plate desert dust preserve the reference palette and alpha. Cosmetic selection is validated and stored percharacter. No original asset file was edited.

Classic mission turns use four additional registered maps: bt-turn-lunar-material.png, bt-turn-velvet-material.png, gatling-turn-lunar-material.png, gatling-turn-velvet-material.png. All2172×724, generated from native3viewtemplates and exactexistingmissionmaterials. Nativealpha/ink/eyes remain authoritative; costumes no longer revert to basepalette in intermediate views. Decoded materialimages are released after their registeredtemplates are baked. BT crouch duringturns separates cabin/struts/wheels, keeps wheelpixelsplanted; guidedmissile origins read the same measuredturnapertures, includingcrouchheight.
