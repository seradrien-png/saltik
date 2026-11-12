# Turns, playable BT and alternate skins implementation plan

> Execute inline, independent finalreview.
Goal: genuine BT/Gatlingturns, friendly/crouching BT16rounds, optionalreference skins across4levels.
Spec: docs/superpowers/specs/2026-11-11-turns-bt-skins-design.md
Architecture: isolatedturnsprite/skin cache modules; BT-onlystate/posture/eye presentation; preserve currentassets anddefaultStrikerturn.
## Reviewfocus
No missiles from cannonfallbackforbank2; no partialmagazine regenerationbeforeempty; no oldheldshots afterpause; turnfeet/levelscaleanchored; skinselectionmustnotleakbetweencharactersorworlds.
Task1: redtests oncapacity16/emptycycle/posture, thenBTstateengineHUD. Task2: genassetworkerturnatlases andskinmaterials (newonly), genericnamedturnrenderer withthreeviews andfootregistration, BTfriendlyeyepatch/crouch. Task3: optionalskinmenu andmission/materialcaches, browserallworlds/characters/turns/sounds, fullsuite, review/fix, exactsourcepush/publication/GitHub.
