# Level2 continuity and fitted DR01 outfit

User: second-plane parts disappear with camera movement; fix, replace blue DR01 hanging pennants with integrated clothing, exclusively2.

Reproduced cause: full roofs remain within native viewport but are erased by screen anchored55% clip. At cameraY-320, both210/190px caps have0visible rows through that mask although wholly onscreen. Remove the screen mask, draw low planes inside the same camera/shake transform as physical terrain, retain rate1 and fixedworldanchor. The world-space roof line keeps its original height; do not change physics or background.

Remove carrier pennant tag and native hanging-flag draw hook. Keep green/orange Saltik flags. New registered blue carrier material: fitted embroidered crimson/gold mantle over hull, closefitting side sash and fenderpanels, no hanging flags, original hardware silhouette/blue identity preserved by native alpha bake. Keep previous asset archived.

Validate red/green regression, camera raster probes before/after, continuous movement through deepest valley plus desktop/phone captures, normal/mirrored/KO blue carrier and levels1/3 preservation, full suite and review. Publish and back up existing repositories/history.
