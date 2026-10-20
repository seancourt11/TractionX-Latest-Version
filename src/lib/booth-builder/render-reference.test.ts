import { describe, expect, it } from "vitest";
import { createItemFromPreset, createProject, createWallFromPreset } from "./project";
import { validateBoothDesign } from "./rules";
import { createExportGuard, renderInventory } from "./render-reference";
import { buildSummary } from "./summary";
import { wallBounds } from "./project";

const booth = () => createProject({ projectName: "Nexora", boothSize: "30x10", boothType: "inline", widthFt: 30, depthFt: 10 });

describe("Nexora render regressions", () => {
  it("flags full-depth side walls and shortens them to the back half", () => {
    const p = booth();
    p.design.objects.push(createWallFromPreset("10ft_side_wall", p));
    p.design.objects.push(createWallFromPreset("10ft_side_wall", p));
    const issue = validateBoothDesign(p).find((i) => i.id === "sight_lines");
    expect(issue).toBeDefined();
    issue?.fix?.(p);
    expect(p.design.objects).toHaveLength(2);
    for (const wall of p.design.objects) expect(wallBounds(wall).maxZ).toBeLessThanOrEqual(1524);
    expect(validateBoothDesign(p).some((i) => i.id === "sight_lines")).toBe(false);
  });
  it("allows 4 ft front walls but flags walls above 4 ft in the front half", () => {
    const p = booth();
    const wall = createWallFromPreset("10ft_side_wall", p);
    p.design.objects.push(wall);
    wall.heightMm = 1219.2;
    expect(validateBoothDesign(p).some((i) => i.id === "sight_lines")).toBe(false);
    wall.heightMm = 1220;
    expect(validateBoothDesign(p).some((i) => i.id === "sight_lines")).toBe(true);
  });
  it("caps inline back-half walls at 8 ft", () => {
    const p = booth();
    const wall = createWallFromPreset("short_return", p);
    p.design.objects.push(wall);
    wall.heightMm = 2438.4;
    expect(validateBoothDesign(p).some((i) => i.id === "height_ceiling")).toBe(false);
    wall.heightMm = 2439;
    expect(validateBoothDesign(p).some((i) => i.id === "height_ceiling")).toBe(true);
  });
  it("retains kept exceptions in the saved design summary", () => {
    const p = booth();
    p.regulations.keptIssues = [{ id: "sight_lines", title: "Tall side wall", detail: "Requires show approval" }];
    const restored = JSON.parse(JSON.stringify(p));
    expect(buildSummary(restored).find((s) => s.title === "Show rule exceptions kept for review")?.lines)
      .toEqual(["Tall side wall: Requires show approval"]);
  });
  it("still flags a tall structure at the front and moves it behind the front zone", () => {
    const p = booth();
    const storage = createItemFromPreset("storage_small", p);
    storage.position.z = p.project.depthMm - storage.depthMm / 2;
    p.design.objects.push(storage);
    const issue = validateBoothDesign(p).find((i) => i.id === "sight_lines");
    expect(issue).toBeDefined();
    issue?.fix?.(p);
    expect(validateBoothDesign(p).some((i) => i.id === "sight_lines")).toBe(false);
  });
  it("includes both cafe tables, all four stools and back-right storage with their positions", () => {
    const p = booth();
    for (const id of ["storage_small", "counter_reception", "cafe_table", "cafe_table", "stool", "stool", "stool", "stool"])
      p.design.objects.push(createItemFromPreset(id, p));
    p.design.objects[0].position = { x: 8200, z: 500 };
    const inventory = renderInventory(p);
    expect(inventory).toHaveLength(8);
    expect(inventory.filter((s) => s.includes("Café Table"))).toHaveLength(2);
    expect(inventory.filter((s) => s.includes("Bar Stool"))).toHaveLength(4);
    expect(inventory[0]).toContain("centre x=8200, z=500 mm");
  });
  it("accepts one export and rejects duplicate clicks and replays", () => {
    const guard = createExportGuard();
    expect(guard.start(0)).toBe(true);
    expect(guard.start(10)).toBe(false);
    guard.finish();
    expect(guard.start(100)).toBe(false);
    expect(guard.start(1000)).toBe(true);
  });
});