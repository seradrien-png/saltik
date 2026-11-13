// Holds fit inside the unchanged slide phase. Simulation cues and painted
// motion cross this same boundary, including a large fixed-step update.
const HOLDS=Object.freeze([.16,.12,.24,.18]);
export const btFinishHold=q=>Number.isInteger(q.throwVariant)?HOLDS[q.throwVariant]??0:0;
