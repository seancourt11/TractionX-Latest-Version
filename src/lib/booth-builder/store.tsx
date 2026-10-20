import { replaceEqualDeep } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { BoothObject, BoothProject, ItemObject, WallObject } from "./types";
import { isWall, uid, wallWidthMm, wallBounds } from "./project";
import { nearestFreePosition, setObjectLevel } from "./levels";
import { toast } from "sonner";
import { brandNewObject } from "./brandkit";

/**
 * Editor state for the booth builder.
 *
 * One undo stack, one selected object, and the project JSON. Everything the
 * editor does goes through `commit()` so every change is undoable — which is
 * what lets an AI request later be treated as a single transaction.
 */

type Ctx = {
  project: BoothProject;
  selectedId: string | null;
  select: (id: string | null) => void;
  commit: (label: string, fn: (draft: BoothProject) => void) => void;
  /** Silent update used while dragging; folded into the last commit. */
  live: (fn: (draft: BoothProject) => void) => void;
  addObject: (obj: BoothObject, label?: string) => void;
  /** Add several objects at once (for example a boardroom set). */
  addObjects: (objs: BoothObject[], label?: string) => void;
  /** Which level newly added objects go on. */
  placementLevel: "ground" | "upper";
  setPlacementLevel: (l: "ground" | "upper") => void;
  updateWall: (id: string, patch: Partial<WallObject> & Partial<ItemObject>, label?: string) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  groupSelected: (ids: string[]) => void;
  undo: () => void;
  canUndo: boolean;
  lastAction: string | null;
  reset: () => void;
};

const BuilderContext = createContext<Ctx | null>(null);

const clone = (p: BoothProject): BoothProject =>
  typeof structuredClone === "function" ? structuredClone(p) : (JSON.parse(JSON.stringify(p)) as BoothProject);

export function BuilderProvider({
  initial,
  onExit,
  children,
}: {
  initial: BoothProject;
  onExit?: () => void;
  children: ReactNode;
}) {
  const [project, setProject] = useState<BoothProject>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [placementLevel, setPlacementLevel] = useState<"ground" | "upper">("ground");
  const history = useRef<BoothProject[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const commit = useCallback((label: string, fn: (draft: BoothProject) => void) => {
    setProject((current) => {
      history.current = [...history.current.slice(-49), clone(current)];
      const draft = clone(current);
      fn(draft);
      return replaceEqualDeep(current, draft);
    });
    setCanUndo(true);
    setLastAction(label);
  }, []);

  const live = useCallback((fn: (draft: BoothProject) => void) => {
    setProject((current) => {
      const draft = clone(current);
      fn(draft);
      return replaceEqualDeep(current, draft);
    });
  }, []);

  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (!prev) return;
    setProject(prev);
    setCanUndo(history.current.length > 0);
    setLastAction("Undid last change");
  }, []);

  const addObject = useCallback(
    (obj: BoothObject, label?: string) => {
      commit(label ?? `Added ${obj.name}`, (d) => {
        const next = structuredClone(obj);
        if (!(next.type === "item" && ["double_deck", "stair", "hanging"].includes(next.kind))) setObjectLevel(d, next, placementLevel);
        const position = nearestFreePosition(d, next);
        if (!position) { toast.error("No free space for this item on the selected level."); return; }
        next.position = position;
        d.design.objects.push(next);
        // A booth that's already branded dresses new structures automatically.
        brandNewObject(d, obj.id);
      });
      setSelectedId(obj.id);
    },
    [commit, placementLevel],
  );

  const addObjects = useCallback(
    (objs: BoothObject[], label?: string) => {
      if (!objs.length) return;
      commit(label ?? `Added ${objs.length} objects`, (d) => {
        const bounds = objs.map(wallBounds);
        const minX = Math.min(...bounds.map(b=>b.minX)), maxX=Math.max(...bounds.map(b=>b.maxX));
        const minZ = Math.min(...bounds.map(b=>b.minZ)), maxZ=Math.max(...bounds.map(b=>b.maxZ));
        const anchor=objs[0];
        const proxy: ItemObject={...anchor,type:"item",kind:"furniture",sizing:"fixed",finish:"white",widthMm:maxX-minX,depthMm:maxZ-minZ,heightMm:750,rotationDeg:0,position:{x:(minX+maxX)/2,z:(minZ+maxZ)/2}};
        const spot=nearestFreePosition(d,proxy);
        if(!spot){toast.error("No free space for the complete boardroom set. Try a smaller table.");return;}
        for (const obj of objs) {
          obj.position={x:obj.position.x+spot.x-proxy.position.x,z:obj.position.z+spot.z-proxy.position.z};
          d.design.objects.push(obj);
          brandNewObject(d, obj.id);
        }
      });
      setSelectedId(objs[0].id);
    },
    [commit],
  );

  const updateWall = useCallback(
    (id: string, patch: Partial<WallObject> & Partial<ItemObject>, label?: string) => {
      commit(label ?? "Updated wall", (d) => {
        const target = d.design.objects.find((o) => o.id === id);
        if (!target) return;
        const old = {position:{...target.position},rotationDeg:target.rotationDeg};
        Object.assign(target, patch);
        if (patch.level) setObjectLevel(d,target,patch.level,patch.deckId);
        if(target.groupId && (patch.position || patch.rotationDeg !== undefined)) {
          const angle=((patch.rotationDeg??old.rotationDeg)-old.rotationDeg)*Math.PI/180;
          for(const other of d.design.objects) {
            if(other.id===target.id||other.groupId!==target.groupId)continue;
            const x=other.position.x-old.position.x,z=other.position.z-old.position.z;
            other.position={x:target.position.x+Math.cos(angle)*x+Math.sin(angle)*z,z:target.position.z-Math.sin(angle)*x+Math.cos(angle)*z};
            other.rotationDeg=(other.rotationDeg+angle*180/Math.PI+360)%360;
          }
        }
        if (target?.groupId && (patch.heightMm || patch.edgeColor || patch.graphicType)) {
          for (const o of d.design.objects) {
            if (o.groupId === target.groupId) Object.assign(o, patch);
          }
        }
      });
    },
    [commit],
  );

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    let newId = "";
    commit("Duplicated object", (d) => {
      const src = d.design.objects.find((o) => o.id === selectedId);
      if (!src) return;
      const copy = clone({ design: { objects: [src] } } as unknown as BoothProject) as unknown as {
        design: { objects: BoothObject[] };
      };
      const next = copy.design.objects[0];
      next.id = uid(next.type);
      next.groupId = undefined;
      if (isWall(next)) next.sections = next.sections.map((s) => ({ ...s, id: uid("wall_section") }));
      const free = nearestFreePosition(d,next,{x:src.position.x+300,z:src.position.z+300});
      if(!free){toast.error("No free space for a duplicate.");return;}
      next.position = free;
      newId = next.id;
      d.design.objects.push(next);
    });
    if (newId) setSelectedId(newId);
  }, [commit, selectedId]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    commit("Deleted object", (d) => {
      d.design.objects = d.design.objects.filter((o) => o.id !== selectedId);
    });
    setSelectedId(null);
  }, [commit, selectedId]);

  const groupSelected = useCallback(
    (ids: string[]) => {
      if (ids.length < 2) return;
      const gid = uid("group");
      commit("Grouped walls", (d) => {
        for (const o of d.design.objects) if (ids.includes(o.id)) o.groupId = gid;
      });
    },
    [commit],
  );

  const reset = useCallback(() => {
    history.current = [];
    setCanUndo(false);
    setSelectedId(null);
    onExit?.();
  }, [onExit]);

  const value = useMemo<Ctx>(
    () => ({
      project,
      selectedId,
      select: setSelectedId,
      commit,
      live,
      addObject,
      addObjects,
      placementLevel,
      setPlacementLevel,
      updateWall,
      duplicateSelected,
      deleteSelected,
      groupSelected,
      undo,
      canUndo,
      lastAction,
      reset,
    }),
    [
      project,
      selectedId,
      commit,
      live,
      addObject,
      addObjects,
      placementLevel,
      setPlacementLevel,
      updateWall,
      duplicateSelected,
      deleteSelected,
      groupSelected,
      undo,
      canUndo,
      lastAction,
      reset,
    ],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder(): Ctx {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used inside BuilderProvider");
  return ctx;
}

/** Total linear wall run in the booth, used in the summary strip. */
export function totalWallRunMm(project: BoothProject): number {
  return project.design.objects.filter(isWall).reduce((sum, o) => sum + wallWidthMm(o), 0);
}
