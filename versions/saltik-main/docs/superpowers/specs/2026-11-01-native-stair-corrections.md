# Ink native-step corrections

User requests faithful supplied enemySaltik (two tall raised launcher struts), fixed foreground vegetation even when occluding player, walkable actual illustrated stairs without a second overlaid staircase, and gravity/descent where a visible upper way ends.

Evidence: two draw-time proximity skips remove foreground leaves (ink-world and ink-landmarks). Existing synthetic stair entries do not trace native stair pixels; checkpoint is a two-flight switchback, not a single monotonic run. Existing final upper contour connects turbine to building despite visible intervening void. Replace supports with finite native-aligned platforms/landings and native tread entries, not hidden bridged spans. Keep original V1 and prior release saved. No unrelated gameplay or control changes.

Ownership: path agent owns native layout/support/step painter; enemy agent owns replacement native atlas geometry and dependent tiny-hand encounter patches; root owns fixed foliage, integration, regression/browserverification and existing public Site publication. Preserve launch origin/direction alignment, guard/lock cues, smallhands and fullcampaign encounters. Verify actual native stair ascent/descent/diagonal inputs and real fall at path edge, fixed draw output for movingplayer, and updated enemy mouth/pod pixels in bothfacings.
