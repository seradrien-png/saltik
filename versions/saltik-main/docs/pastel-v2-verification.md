# Matin Doré V2 verification

Separate Site and fresh source repository; Encre V1 remains at commit 44110aa2dd80e668b2b9fd15aa6635ad9da6cef2, public saved version 4.

- 428 Node tests pass, no failures. Final boss palette-only adjustment additionally checked by 24 boss/art/rider tests.
- Full campaign simulation reaches victory at 106.07 seconds, with three duels and both boss actions completed.
- Browser campaign: nine routes, five-press enemy duel, both three-press boss actions, victory; no page errors or failed resources. Viewports 1280×576, 851×393, 667×375.
- Real multitouch checks pass at 667×375, 851×393 and 1280×720, including independent held inputs, release and pause.
- Eleven recolored native atlases retain every alpha byte, original geometry and detail; materials baked once at load, two workers, ImageBitmap when available and Canvas fallback verified.
- Native V1 art and selected input/world/stair/pose/audio modules verified byte-identical by preservation fixtures.
- New Bastion native pod/hatch states calibrated to projectile mouths and QTE hands. The V2 pod has a lower integrated muzzle. Its own mounted-rider volley preserves the outward fan; other hostile missiles still damage the rider.
- Source/dist parity and archive/commit byte identity checked during packaging. The inherited font license retains its upstream CRLF formatting.

Evidence: /workspace/deliverables/saltik-pastel-qa and /workspace/deliverables/saltik-pastel-boss-qa. Browser emulation does not replace testing on physical iOS/Android devices.
