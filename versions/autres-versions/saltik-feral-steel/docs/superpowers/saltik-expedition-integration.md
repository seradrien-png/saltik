# Saltik expedition integration notes

Baseline: `4ca2e141bf6b32ab6c35359adf0a7a73bbfd06da`, branch `feat/saltik-melee-expedition`.

Root approved the design/plan and delegated independent world, player art/support and integration scopes. Integration owns engine, renderer, main/menu, audio, melee state and combat/loading integration tests. Root owns assets, complete review, browser checks, build and release.

## Implemented contracts

- Automatic contact strike: .08 s windup, .12 impact, .35 recovery, .70 recharge from acquisition, damage6 once to one locked target. Actual measured extended hand geometry determines acquisition and impact. Living intervening cover blocks the arm segment; dead/departed targets miss without retargeting. Only the acquired enemy's body contact receives windup grace; hostile projectiles and other enemies remain harmful.
- PLAN/turn cancel, pause freezes, lethal damage cancels. Roof weapons retain their independent controls and measured origins. Counters are `meleeSwings` and `meleeHits`.
- A surviving ground enemy receives an 18-unit forward shove, including stationary heavies, then reanchors immediately to its platform or terrain. Upper edges clamp the shove. Props and the boss remain stationary.
- Engine consumes world-authored cover, checkpoint guards and support height; renderer consumes measured `drawObstacle`. Both new 1536×1024 atlases are required and dimension-validated before deployment.
- Physical movement remains world-space. Native support pose supplies body tilt/heave and painted distal adjustment; upper slab clearance is passed to the support solver. PLAN projection stays exactly38 with unchanged scale.
- Obstacle retention, landing and supportY require at least one actual sampled wheel on the obstacle's real width. Legacy hull overhang cannot keep the Saltik hovering after all wheels leave.
- Menu names the vehicle SALTIK and its CLASSE STRIKER; deployment/tutorial use Saltik. The HUD follows six authored world scenarios, then guardian. No extra action control was added.
- Readonly snapshot includes copied lightweight enemy/obstacle records and a deep clone of player state for root's browser QA.

## Rulings recorded during integration

- Measured final ground fist reaches only about59.45 world units forward, radius7.96. A narrow cover fixture at +47 is therefore genuinely struck; its test checks damage to the cover and no damage through it. The ordinary235 boss barrier remains outside hand reach.
- Existing MIRV carrier noncollision tests place enemies inside the new legitimate melee region. Their fixture starts melee recharge for the short carrier observation, so it still isolates unchanged MIRV carrier behavior. Independent new tests prove real contact melee remains active normally.
- Active melee art takes priority over the brief native damage pose, while normal vulnerability/flicker remains, so a projectile hit cannot hide the real single-arm impact. Root approved this narrow visual ordering.
- Physical obstacle support checks the native measured wheelbase without turn-render relaxation, preventing a false fall merely because a body turn is in progress. Its floor sampler still rejects all positions beyond the real obstacle width.

## Verification

Initial integration behavior tests failed against the baseline on missing melee state/damage and missing required-atlas rejection. After implementation, targeted combat/loading/support checks passed. The obstacle overhang regression was observed failing, then passed after the real contact rule was applied. Additional checks cover airborne drone reach, acquisition recharge, clamped heavy shove and the real235 boss barrier.

Final root verification: `npm test` passed **147/147** tests; `git diff --check`, build, source/dist parity and standalone JavaScript syntax passed. Independent Sol review found no outstanding findings after the animated-foot X sampling, rigid tire/strut split and windowless crown-material corrections.

Real browser checks passed at1440×900,844×390 and667×375: all direction sectors and touch ownership, neutral hub/direct PLAN, three independent weapons and recharges, pause/portrait/blur, all first-section heights, actual native intermediate turn frames, airborne and grounded PLAN, upper-route camera framing, released turn taps and near-roof occlusion. Required player/melee/prop artwork404 and malformed responses all keep deployment disabled with visible error. Browser recharge checks observe launch frames and simulation elapsed time rather than assuming CDP calls take no time.

The final rebuilt game completed its ordinary campaign in **80.1333seconds**, with40HP,46kills and24destroyed obstacles,16MIRVs and8guided salvos; all six authored scenarios were captured and inspected, with no page errors. A separate ordinary-input approach without guns observed enemy melee windup/impact/recovery and successful damage. The packaged single-file game passed a phone-size smoke check for all three weapons and native melee, with no subresource requests or page errors.

Root owns source commit/push and publication to the existing owner-private Site. The native terminal deployment result is recorded in `/workspace/deliverables/feral-steel-publication.json` after publication; this reviewed commit does not change the audience.
