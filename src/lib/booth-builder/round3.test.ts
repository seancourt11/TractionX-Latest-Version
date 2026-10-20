import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyBrandKit, surfaceColor } from './brandkit';
import { cameraView } from './cameras';
import { mergedDeck } from './deck-geometry';
import { BOOTH_SIZES, DOUBLE_DECK_PRESETS, COUNTER_DEPTH_MIN_MM, COUNTER_DEPTH_MAX_MM, COUNTER_HEIGHT_MIN_MM, COUNTER_HEIGHT_MAX_MM, COUNTER_MIN_MM, COUNTER_MAX_MM, COUNTER_STEP_MM } from './presets';
import { createProject, createItemFromPreset, createWallFromPreset, wallBounds, mmLabel } from './project';
import { aisleBlockedFraction, validateBoothDesign } from './rules';
const booth = () => createProject({projectName:'Round3',boothSize:'20x30',boothType:'island',widthFt:20,depthFt:30});

describe('Round 3 part A', () => {
  it('merges per material once, shares geometry and centres stair-inclusive bounds', () => {
    const scene = new THREE.Group();
    const material = new THREE.MeshStandardMaterial();
    for (const x of [-4, 1]) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 5), material); mesh.position.set(x,1.5,0); scene.add(mesh); }
    const merged = mergedDeck('test-deck', scene);
    expect(merged.parts).toHaveLength(1);
    expect(mergedDeck('test-deck', scene)).toBe(merged);
    expect(merged.center.x).toBe(-1.5);
    expect(merged.parts[0].geometry.boundingBox?.min.x).toBe(-3);
    expect(merged.parts[0].geometry.boundingBox?.max.x).toBe(3);
    expect(merged.parts[0].material).toBe(material);
  });
  it('brand pass preserves deck floor, furniture and screens', () => {
    const p=booth(); p.branding.primaryColor='#19aa66';
    for (const id of ['double_deck_5x3','cafe_table','tv_55','counter_pedestal']) p.design.objects.push(createItemFromPreset(id,p));
    const before=p.design.objects.slice(0,3).map(o=>o.type==='item'?o.finish:'');
    applyBrandKit(p);
    expect(p.design.objects.slice(0,3).map(o=>o.type==='item'?o.finish:'')).toEqual(before);
    expect(surfaceColor(p.design.objects[3],p)).toBe('#19aa66');
  });
  it('preserves white, black and wood colours for selected pedestal finishes', () => {
    const p=booth(); const o=createItemFromPreset('counter_pedestal',p);
    o.finish='white'; expect(surfaceColor(o,p)).toBe('#ededed');
    o.finish='black'; expect(surfaceColor(o,p)).toBe('#141414');
    o.finish='wood'; expect(surfaceColor(o,p)).toBe('#8a6a45');
  });
  it.each([[0,3224,3224,5704],[1,4216,4216,5704],[2,5208,5208,5704]])('uses measured frame and stair bounds for deck %s', (i,frame,width,depth) => {
    const p=booth(); const preset=DOUBLE_DECK_PRESETS[i];
    expect(preset.frameWidthMm).toBe(frame); expect(preset.frameDepthMm).toBe(5704);
    const o=createItemFromPreset(preset.id,p); o.widthMm=5870; o.depthMm=5730;
    expect(wallBounds(o).halfX*2).toBe(width); expect(wallBounds(o).halfZ*2).toBe(depth);
    o.rotationDeg=90; expect(wallBounds(o).halfX*2).toBe(depth); expect(wallBounds(o).halfZ*2).toBe(width);
  });
  it('fits plan footprint above the tallest deck at actual aspect with ten percent margin', () => {
    const v=cameraView('plan',6.096,9.144,0.6,3.88);
    const distance=v.position[1]-3.88;
    const halfHeight=distance*Math.tan(v.fov*Math.PI/360);
    expect(halfHeight).toBeGreaterThanOrEqual(9.144/2*1.1);
    expect(halfHeight*.6).toBeGreaterThanOrEqual(6.096/2*1.1);
  });
  it.each(['hero','aisle','corner'] as const)('fits all deck bounds for %s', id => {
    const v=cameraView(id,6.096,9.144,0.6,3.88);
    const camera=new THREE.PerspectiveCamera(v.fov,.6,.1,1000); camera.position.set(...v.position); camera.lookAt(...v.target); camera.updateMatrixWorld();
    for (const x of [-3.048,3.048]) for(const y of [0,3.88]) for(const z of [-4.572,4.572]) {
      const point=new THREE.Vector3(x,y,z).project(camera);
      expect(Math.abs(point.x)).toBeLessThan(1); expect(Math.abs(point.y)).toBeLessThan(1);
    }
  });
  it('offers both frontage/depth orientations without changing saved dimensions', () => {
    for(const [w,d] of [[20,30],[30,20],[20,40],[40,20],[30,40],[40,30]]) expect(BOOTH_SIZES.some(s=>s.widthFt===w&&s.depthFt===d)).toBe(true);
    const p=booth(); expect(p.project.widthMm).toBe(6096);expect(p.project.depthMm).toBe(9144);
  });
  it.each(['inline','corner','island','peninsula'] as const)('does not apply inline standards in a %s booth with a deck', type => {
    const p=booth();p.project.boothType=type;
    const wall=createWallFromPreset('10ft_side_wall',p);wall.heightMm=4402;wall.position.z=6000;
    p.design.objects.push(wall,createItemFromPreset('double_deck_5x3',p));
    const issues=validateBoothDesign(p);
    expect(issues.some(i=>i.id==='sight_lines')).toBe(false);expect(issues.some(i=>i.id==='height_ceiling')).toBe(false);
    expect(issues.some(i=>i.id===((type==='inline'||type==='corner')?'double_deck_inline':'double_deck_approval'))).toBe(true);
  });
  it('excludes open decks and their stairs from aisle blockage', () => {
    const p=booth(); const deck=createItemFromPreset('double_deck_5x5',p);deck.position.z=6500;p.design.objects.push(deck);
    expect(aisleBlockedFraction(p)).toBe(0);
  });
  it('defines counter-specific physical ranges and a 25 mm step', () => {
    expect([COUNTER_MIN_MM,COUNTER_MAX_MM]).toEqual([610,2440]);
    expect([COUNTER_DEPTH_MIN_MM,COUNTER_DEPTH_MAX_MM]).toEqual([400,900]);
    expect([COUNTER_HEIGHT_MIN_MM,COUNTER_HEIGHT_MAX_MM]).toEqual([900,1100]);
    expect(COUNTER_STEP_MM).toBe(25); expect(mmLabel(304.8)).toBe('1 ft');
  });
});
