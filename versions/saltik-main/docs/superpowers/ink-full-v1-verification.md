# Full V1 Ink release — 2026-11-01

Replaces the short Ink demo with the entire original V1 mission (17800worldunits), including enemySaltik encounters, fivepressduels, boss charge/recoil/missilepod, both threepressassaults and native victory. Original V1 source/site remain preserved; no V2 companion mechanics added.

Visual/physics changes: natural complete tree replaces cropped canopy; 7native route landmarks and unique wreck/gorge/checkpoint/ruin/vegetation sections; 10bidirectional stairs share painted tread and physical support samples; original wheels articulate over treads while face/cabin stay rigid; continuous engraved stair stringers and rooted piers. Four ground repairs retained. All elevated passages have at least144units centerline clearance. Native enemySaltik side/front, enemygun/projectile anchors and aim shared with drawing; drones tilt toward groundtargets. Native guard/dodge/lock cues restored. ESQUIVE restored beside lower-right of directionalpad; DEFLECT remains center. Red circle QTEactions retained.

Verification:
- Full Node suite407/407pass,0fail (44.94s); gitdiff--checkclean.
- Deterministic fullcampaign QA traversal (armor protected to isolate progression): won after101.82s, 37kills, 635primaryshots,13MIRVs,6guided salvos,14destroyed obstacles,2Saltikduels, boss pod+hull actions both completed.
- Chromium fullcampaign browser: all7route views, fivepressduel and screenimpact, both threepressboss sequences, boss and actual victory; zeroJSerrors or failedresponses. Viewport targetchecks1280×576,851×393,667×375.
- Independent realCDPmultitouch checks667×375,851×393,1280×720: minimum44pixel targets, nooverlap/offscreen, independent move/fire/evade/deflect, dragging, release, pause and portraitclearing all pass.
- Every authored stair walked bothdirections without jumps or airborneframes; true native wheelcontacts and rigidface/cabin checks pass.
- Boundedreview identified upward dronefire and invisible enemydefense/lock cues; both corrected with regressiontests. Enemy launch origin/velocity match native painted gun/pod pixels bothfacings. Native boss cannon and pod mouths match simulation throughrecoil/raise.
- Source/art screenshot evidence outside repo: /workspace/deliverables/saltik-ink-full-qa and /workspace/deliverables/saltik-ink-v1-qa/controls.

Packaging preserves preceding Ink release and original V1. Fullrelease artifacts are under /workspace/deliverables/saltik-ink-full-v1; deployment archive includes active Ink art, audio and source modules, excluding unused original-color artwork to avoid shipping unused art. Every shipped file remains an exact committed file.
