import { EffectComposer, N8AO } from "@react-three/postprocessing";

/** Loaded only after the editing UI has settled. */
export default function IdleEffects() {
  return <EffectComposer multisampling={0} enableNormalPass={false} resolutionScale={0.5}>
    <N8AO aoRadius={0.6} intensity={1.2} distanceFalloff={0.6} quality="performance" halfRes />
  </EffectComposer>;
}
