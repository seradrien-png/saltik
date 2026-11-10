# Playable Gatling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task-by-task.

**Goal:** Faithful selectable Gatling in all3missions with independent combat and level skins.
**Architecture:** Conditional player variant with isolated combat module; dedicated native sprite rig, native geometry weapon mounts, existingStriker path unchanged. Menu persists variant, HUD and audio expose thermal state.
**Tech Stack:** JS modules, Canvas2D, WebAudio, node:test.
**Spec:** docs/superpowers/specs/2026-11-10-gatling-design.md

## Global Constraints
- Two Gatling,8rocket pod,no mortar; snow palette from reference; level-specific embellishment.
- Highcadence, movementlock, recoil after2s, overheat5s/cooldown5s, unguided chaotic forward rockets.
- Striker unchanged, all3levels independently playable, selection survives resets/transitions; pause freezes state.
- Preserve original projects/history, publish and back up only after verification.

## Review Focus
- Hold through cooldown, release beforeoverheat, pause/death/duel input release.
- Mirror/aim/muzzle alignment and actual barrel rotation/heat.
- Rockets terrain/directdamage/splash without homing or MIRV behavior.
- Phone title/control layout and cross-level character retention.
- Boss/duel/carrier states never swap to Striker/mortar.

### Task1: Combat integration
Files src/engine.js, new src/gatling-combat.js, tests/gatling-combat.test.js only. Interface player.character='gatling', player.gatling={firing,heat,sustained,cooldown,spin,rocketFlash,rocketIndex}, pose.gatlingMuzzles[2], pose.rocketMuzzles[8]. Add option createGame({character}) defaultStriker. Conditional earlybranch updatePlayerWeapons, conditional movement lock/recoil preserving collision/gravity. Exact numbers in spec. [ ] Redtests; [ ] implement; [ ] focused+existingengine regressions; [ ] report+commit; [ ] task review.

### Task2: Native artwork/rig
Files new src/gatling-art.js, src/ink-saltik.js drawbranch, src/ink-scene.js weapongeometry selection, src/ink-renderer.js material sets, src/ink-encounters.js and carrier-shutdown-art.js interactionbranches ifneeded; assets3skins. Use canonical faithful sprite, measured gun/pod points, rotating barrelfaces and redheat/smoke, wheel/support animation. Keep defaultpath exact. [ ] generate3skins; [ ] rig+nativeprojectile mounts; [ ] testgeometry+specialinteractionstates; [ ] review.

### Task3: Selection, feedback and release
Files src/main.js,index.html,style.css,src/audio.js. Select Striker/Gatling before start; persistcharacter onchoose/start/restart/next; update cooldownlabel/heatHUD/rocketlabel/hidehoming forGatling. Distbuildpreservesassets. [ ] UI/audio; [ ] fullsuite; [ ] browserdesktop+phone/heat/recoil/rockets/3levels; [ ] broadreview; [ ] sourcecommit/push/save/deploy/publicbytecheck/GitHubsnapshot verifyall editions.
