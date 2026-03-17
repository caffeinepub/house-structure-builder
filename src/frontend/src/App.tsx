import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Bath,
  BedDouble,
  Car,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Home,
  Loader2,
  RotateCcw,
  Save,
  Sofa,
  Square,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { RoomType } from "./backend";
import {
  useDeletePlan,
  useGetAllPlans,
  useSavePlan,
  useUpdatePlan,
} from "./hooks/useQueries";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HouseBuilder />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface GridRoom {
  x: number;
  y: number;
  w: number;
  h: number;
  type: RoomType;
}

const GRID_COLS = 20;
const GRID_ROWS = 16;
const CELL = 40;

// ─── Room Config ─────────────────────────────────────────────────────────

const ROOM_CONFIG: Record<
  RoomType,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{
      className?: string;
      style?: React.CSSProperties;
    }>;
    shortName: string;
  }
> = {
  [RoomType.livingRoom]: {
    label: "Living Room",
    color: "oklch(0.72 0.14 55)",
    icon: Sofa,
    shortName: "Living",
  },
  [RoomType.bedroom]: {
    label: "Bedroom",
    color: "oklch(0.62 0.12 240)",
    icon: BedDouble,
    shortName: "Bed",
  },
  [RoomType.kitchen]: {
    label: "Kitchen",
    color: "oklch(0.63 0.14 145)",
    icon: UtensilsCrossed,
    shortName: "Kitchen",
  },
  [RoomType.bathroom]: {
    label: "Bathroom",
    color: "oklch(0.63 0.14 185)",
    icon: Bath,
    shortName: "Bath",
  },
  [RoomType.garage]: {
    label: "Garage",
    color: "oklch(0.50 0.04 240)",
    icon: Car,
    shortName: "Garage",
  },
};

const ROOM_PALETTE_OCIDS: Record<string, string> = {
  [RoomType.livingRoom]: "room_palette.living_room_button",
  [RoomType.bedroom]: "room_palette.bedroom_button",
  [RoomType.kitchen]: "room_palette.kitchen_button",
  [RoomType.bathroom]: "room_palette.bathroom_button",
  [RoomType.garage]: "room_palette.garage_button",
};

const TEMPLATE_OCIDS: Record<string, string> = {
  "1BHK": "templates.1bhk_button",
  "2BHK": "templates.2bhk_button",
  "3BHK": "templates.3bhk_button",
};

const TEMPLATE_ROOM_COUNT: Record<string, string> = {
  "1BHK": "4 rooms",
  "2BHK": "6 rooms",
  "3BHK": "7 rooms",
};

// ─── Templates ───────────────────────────────────────────────────────────

const TEMPLATES: Record<string, GridRoom[]> = {
  "1BHK": [
    { x: 1, y: 1, w: 5, h: 4, type: RoomType.livingRoom },
    { x: 7, y: 1, w: 4, h: 3, type: RoomType.bedroom },
    { x: 1, y: 6, w: 4, h: 3, type: RoomType.kitchen },
    { x: 6, y: 5, w: 3, h: 3, type: RoomType.bathroom },
  ],
  "2BHK": [
    { x: 1, y: 1, w: 6, h: 5, type: RoomType.livingRoom },
    { x: 8, y: 1, w: 5, h: 4, type: RoomType.bedroom },
    { x: 8, y: 6, w: 4, h: 3, type: RoomType.bedroom },
    { x: 1, y: 7, w: 5, h: 4, type: RoomType.kitchen },
    { x: 7, y: 6, w: 2, h: 3, type: RoomType.bathroom },
    { x: 14, y: 1, w: 4, h: 5, type: RoomType.garage },
  ],
  "3BHK": [
    { x: 1, y: 1, w: 7, h: 5, type: RoomType.livingRoom },
    { x: 9, y: 1, w: 5, h: 4, type: RoomType.bedroom },
    { x: 9, y: 6, w: 4, h: 4, type: RoomType.bedroom },
    { x: 14, y: 6, w: 4, h: 4, type: RoomType.bedroom },
    { x: 1, y: 7, w: 5, h: 5, type: RoomType.kitchen },
    { x: 7, y: 7, w: 3, h: 3, type: RoomType.bathroom },
    { x: 14, y: 1, w: 5, h: 5, type: RoomType.garage },
  ],
};

// ─── Room Cell key helpers ────────────────────────────────────────────────

function roomsToGrid(rooms: GridRoom[]): Map<string, GridRoom> {
  const map = new Map<string, GridRoom>();
  for (const room of rooms) {
    for (let dy = 0; dy < room.h; dy++) {
      for (let dx = 0; dx < room.w; dx++) {
        map.set(`${room.x + dx},${room.y + dy}`, room);
      }
    }
  }
  return map;
}

function roomsToBackend(rooms: GridRoom[]) {
  return rooms.map((r) => ({
    position: [BigInt(r.x), BigInt(r.y)] as [bigint, bigint],
    size: [BigInt(r.w), BigInt(r.h)] as [bigint, bigint],
    roomType: r.type,
  }));
}

function backendToRooms(
  bRooms: {
    position: [bigint, bigint];
    size: [bigint, bigint];
    roomType: RoomType;
  }[],
): GridRoom[] {
  return bRooms.map((r) => ({
    x: Number(r.position[0]),
    y: Number(r.position[1]),
    w: Number(r.size[0]),
    h: Number(r.size[1]),
    type: r.roomType,
  }));
}

const CORNER_MARKS = [
  { cx: 0, cy: 0, key: "tl" },
  { cx: GRID_COLS, cy: 0, key: "tr" },
  { cx: 0, cy: GRID_ROWS, key: "bl" },
  { cx: GRID_COLS, cy: GRID_ROWS, key: "br" },
];

// ─── Main Builder Component ─────────────────────────────────────────────

function HouseBuilder() {
  const [rooms, setRooms] = useState<GridRoom[]>([]);
  const [selectedTool, setSelectedTool] = useState<RoomType>(
    RoomType.livingRoom,
  );
  const [planName, setPlanName] = useState("My House");
  const [currentPlanId, setCurrentPlanId] = useState<bigint | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragCurrent, setDragCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const { data: savedPlans = [], isLoading: plansLoading } = useGetAllPlans();
  const saveMutation = useSavePlan();
  const updateMutation = useUpdatePlan();
  const deleteMutation = useDeletePlan();

  const gridMap = roomsToGrid(rooms);

  const totalArea = rooms.reduce((sum, r) => sum + r.w * r.h, 0);

  // ── Grid interaction ─────────────────────────────────────────────────

  const getCellCoords = useCallback(
    (e: React.MouseEvent<SVGElement> | React.MouseEvent<HTMLElement>) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / CELL);
      const y = Math.floor((e.clientY - rect.top) / CELL);
      return { x, y };
    },
    [],
  );

  const handleGridMouseDown = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      const { x, y } = getCellCoords(e);
      if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return;
      setIsDragging(true);
      setDragStart({ x, y });
      setDragCurrent({ x, y });
    },
    [getCellCoords],
  );

  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      if (!isDragging) return;
      const { x, y } = getCellCoords(e);
      const cx = Math.max(0, Math.min(GRID_COLS - 1, x));
      const cy = Math.max(0, Math.min(GRID_ROWS - 1, y));
      setDragCurrent({ x: cx, y: cy });
    },
    [isDragging, getCellCoords],
  );

  const handleGridMouseUp = useCallback(
    (_e: React.MouseEvent<SVGElement>) => {
      if (!isDragging || !dragStart || !dragCurrent) return;
      setIsDragging(false);

      const x1 = Math.min(dragStart.x, dragCurrent.x);
      const y1 = Math.min(dragStart.y, dragCurrent.y);
      const x2 = Math.max(dragStart.x, dragCurrent.x);
      const y2 = Math.max(dragStart.y, dragCurrent.y);
      const w = x2 - x1 + 1;
      const h = y2 - y1 + 1;

      if (w === 1 && h === 1) {
        const key = `${x1},${y1}`;
        const existing = gridMap.get(key);
        if (existing) {
          setRooms((prev) => prev.filter((r) => r !== existing));
          setDragStart(null);
          setDragCurrent(null);
          return;
        }
      }

      const newRoom: GridRoom = { x: x1, y: y1, w, h, type: selectedTool };
      setRooms((prev) => {
        const filtered = prev.filter(
          (r) =>
            r.x + r.w <= x1 ||
            r.x >= x1 + w ||
            r.y + r.h <= y1 ||
            r.y >= y1 + h,
        );
        return [...filtered, newRoom];
      });

      setDragStart(null);
      setDragCurrent(null);
    },
    [isDragging, dragStart, dragCurrent, gridMap, selectedTool],
  );

  // ── Drag preview ─────────────────────────────────────────────────────

  const previewRect =
    isDragging && dragStart && dragCurrent
      ? {
          x: Math.min(dragStart.x, dragCurrent.x),
          y: Math.min(dragStart.y, dragCurrent.y),
          w: Math.abs(dragCurrent.x - dragStart.x) + 1,
          h: Math.abs(dragCurrent.y - dragStart.y) + 1,
        }
      : null;

  // ── Actions ──────────────────────────────────────────────────────────

  const handleClear = () => {
    setRooms([]);
    setCurrentPlanId(null);
    setPlanName("My House");
  };

  const handleTemplate = (key: string) => {
    setRooms(TEMPLATES[key]);
    setPlanName(`${key} Layout`);
    setCurrentPlanId(null);
    toast.success(`${key} template loaded`);
  };

  const handleSave = async () => {
    if (!planName.trim()) {
      toast.error("Please enter a plan name");
      return;
    }
    try {
      const backendRooms = roomsToBackend(rooms);
      if (currentPlanId !== null) {
        await updateMutation.mutateAsync({
          id: currentPlanId,
          name: planName,
          rooms: backendRooms,
        });
        toast.success("Plan updated!");
      } else {
        const newId = await saveMutation.mutateAsync({
          name: planName,
          rooms: backendRooms,
        });
        setCurrentPlanId(newId);
        toast.success("Plan saved!");
      }
    } catch {
      toast.error("Failed to save plan");
    }
  };

  const handleLoadPlan = (plan: { id: bigint; name: string; rooms: any[] }) => {
    setRooms(backendToRooms(plan.rooms));
    setPlanName(plan.name);
    setCurrentPlanId(plan.id);
    setShowSaved(false);
    toast.success(`Loaded "${plan.name}"`);
  };

  const handleDeletePlan = async (id: bigint) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (currentPlanId === id) setCurrentPlanId(null);
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const isSaving = saveMutation.isPending || updateMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top Bar ── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <Home className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight leading-none">
                House Structure Builder
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Floor Plan Designer
              </p>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 hidden sm:block" />

          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Square className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Rooms:</span>
              <span className="text-primary font-semibold">{rooms.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Area:</span>
              <span className="text-primary font-semibold">
                {totalArea} units²
              </span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 hidden sm:block" />

          <div className="flex items-center gap-2 ml-auto">
            <Input
              data-ocid="app.plan_name_input"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Plan name..."
              className="h-8 w-40 text-xs bg-input border-border"
            />
            <Button
              data-ocid="app.save_button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || rooms.length === 0}
              className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              {currentPlanId ? "Update" : "Save"}
            </Button>
            <Button
              data-ocid="app.clear_button"
              size="sm"
              variant="outline"
              onClick={handleClear}
              className="h-8 border-border gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="w-56 border-r border-border bg-card/60 flex flex-col flex-shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* Room Palette */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">
                  Room Types
                </p>
                <div className="space-y-1">
                  {Object.entries(ROOM_CONFIG).map(([type, cfg]) => {
                    const Icon = cfg.icon;
                    const isActive = selectedTool === type;
                    return (
                      <button
                        type="button"
                        key={type}
                        data-ocid={ROOM_PALETTE_OCIDS[type]}
                        onClick={() => setSelectedTool(type as RoomType)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs transition-all ${
                          isActive
                            ? "bg-secondary border border-primary/40 text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-sm flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: cfg.color }}
                        >
                          <Icon
                            className="w-2.5 h-2.5"
                            style={{ color: "oklch(0.1 0.02 240)" }}
                          />
                        </span>
                        <span className="font-medium">{cfg.label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="rounded border border-border/60 bg-muted/30 p-2.5 text-[10px] text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground/60 mb-1">
                  How to draw
                </p>
                <p>• Select a room type</p>
                <p>• Click & drag on grid to place</p>
                <p>• Click a room to remove it</p>
              </div>

              <Separator className="bg-border" />

              {/* Templates */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">
                  Quick Templates
                </p>
                <div className="space-y-1">
                  {["1BHK", "2BHK", "3BHK"].map((key) => (
                    <button
                      type="button"
                      key={key}
                      data-ocid={TEMPLATE_OCIDS[key]}
                      onClick={() => handleTemplate(key)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all group"
                    >
                      <span className="font-medium">{key}</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 border-border group-hover:border-primary/40 transition-colors"
                      >
                        {TEMPLATE_ROOM_COUNT[key]}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Saved Plans */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowSaved((v) => !v)}
                  className="w-full flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground mb-2 font-semibold transition-colors"
                >
                  <span className="flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" />
                    Saved Plans
                    {savedPlans.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 ml-1 border-border"
                      >
                        {savedPlans.length}
                      </Badge>
                    )}
                  </span>
                  {showSaved ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                <AnimatePresence>
                  {showSaved && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {plansLoading ? (
                        <div
                          data-ocid="saved_plans.loading_state"
                          className="space-y-1.5"
                        >
                          <Skeleton className="h-8 w-full bg-muted/50" />
                          <Skeleton className="h-8 w-full bg-muted/50" />
                        </div>
                      ) : savedPlans.length === 0 ? (
                        <div
                          data-ocid="saved_plans.empty_state"
                          className="text-[10px] text-muted-foreground text-center py-3 border border-dashed border-border rounded"
                        >
                          No saved plans yet
                        </div>
                      ) : (
                        <div data-ocid="saved_plans.list" className="space-y-1">
                          {savedPlans.map((plan, idx) => (
                            <div
                              key={String(plan.id)}
                              data-ocid={`saved_plans.item.${idx + 1}`}
                              className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs group transition-colors ${
                                currentPlanId === plan.id
                                  ? "bg-primary/10 border border-primary/30"
                                  : "hover:bg-secondary/50"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleLoadPlan(plan)}
                                className="flex-1 text-left text-muted-foreground group-hover:text-foreground truncate transition-colors"
                              >
                                {plan.name}
                              </button>
                              <button
                                type="button"
                                data-ocid={`saved_plans.delete_button.${idx + 1}`}
                                onClick={() => handleDeletePlan(plan.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* ── Grid Canvas ── */}
        <main className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div className="relative">
            <div className="absolute -top-7 left-0 text-[10px] text-primary/60 font-mono tracking-widest uppercase">
              Floor Plan — {GRID_COLS}×{GRID_ROWS} Grid
            </div>

            <div
              className="relative rounded-sm"
              style={{
                border: "2px solid oklch(0.75 0.18 195 / 0.6)",
                boxShadow:
                  "0 0 0 1px oklch(0.75 0.18 195 / 0.2), 0 0 40px oklch(0.75 0.18 195 / 0.08)",
              }}
            >
              <svg
                data-ocid="grid.canvas_target"
                role="img"
                aria-label="House floor plan grid canvas"
                width={GRID_COLS * CELL}
                height={GRID_ROWS * CELL}
                className="block cursor-crosshair select-none"
                onMouseDown={handleGridMouseDown}
                onMouseMove={handleGridMouseMove}
                onMouseUp={handleGridMouseUp}
                onMouseLeave={() => {
                  if (isDragging) {
                    setIsDragging(false);
                    setDragStart(null);
                    setDragCurrent(null);
                  }
                }}
                style={{ background: "oklch(0.13 0.03 240)" }}
              >
                <title>House Floor Plan Canvas</title>
                <defs>
                  <pattern
                    id="minor-grid"
                    width={CELL}
                    height={CELL}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${CELL} 0 L 0 0 0 ${CELL}`}
                      fill="none"
                      stroke="oklch(0.28 0.06 220 / 0.5)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                  <pattern
                    id="major-grid"
                    width={CELL * 5}
                    height={CELL * 4}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${CELL * 5} 0 L 0 0 0 ${CELL * 4}`}
                      fill="none"
                      stroke="oklch(0.40 0.10 200 / 0.5)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#minor-grid)" />
                <rect width="100%" height="100%" fill="url(#major-grid)" />

                {/* Placed rooms */}
                {rooms.map((room, i) => {
                  const cfg = ROOM_CONFIG[room.type];
                  const roomKey = `room-${room.x}-${room.y}-${room.type}`;
                  return (
                    <g key={roomKey}>
                      <rect
                        x={room.x * CELL + 1}
                        y={room.y * CELL + 1}
                        width={room.w * CELL - 2}
                        height={room.h * CELL - 2}
                        fill={cfg.color}
                        fillOpacity={0.35}
                        stroke={cfg.color}
                        strokeWidth={1.5}
                        strokeOpacity={0.8}
                        rx={2}
                      />
                      <rect
                        x={room.x * CELL + 1}
                        y={room.y * CELL + 1}
                        width={room.w * CELL - 2}
                        height={room.h * CELL - 2}
                        fill="none"
                        stroke={cfg.color}
                        strokeOpacity={0.08}
                        strokeWidth={12}
                        strokeDasharray="2 6"
                        rx={2}
                      />
                      {room.w * CELL > 50 && room.h * CELL > 30 && (
                        <text
                          x={room.x * CELL + (room.w * CELL) / 2}
                          y={room.y * CELL + (room.h * CELL) / 2 + 4}
                          textAnchor="middle"
                          fill={cfg.color}
                          fillOpacity={0.95}
                          fontSize={room.w * CELL > 80 ? 11 : 9}
                          fontFamily='"General Sans", sans-serif'
                          fontWeight="600"
                          letterSpacing="0.05em"
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          {room.w * CELL > 80 ? cfg.label : cfg.shortName}
                        </text>
                      )}
                      {room.w * CELL > 50 && room.h * CELL > 50 && (
                        <text
                          x={room.x * CELL + (room.w * CELL) / 2}
                          y={room.y * CELL + (room.h * CELL) / 2 + 17}
                          textAnchor="middle"
                          fill={cfg.color}
                          fillOpacity={0.5}
                          fontSize={8}
                          fontFamily='"General Sans", sans-serif'
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          {room.w}×{room.h}
                        </text>
                      )}
                      {/* invisible: suppress unused var warning */}
                      {i >= 0 && null}
                    </g>
                  );
                })}

                {/* Drag preview */}
                {previewRect && (
                  <rect
                    x={previewRect.x * CELL + 1}
                    y={previewRect.y * CELL + 1}
                    width={previewRect.w * CELL - 2}
                    height={previewRect.h * CELL - 2}
                    fill={ROOM_CONFIG[selectedTool].color}
                    fillOpacity={0.2}
                    stroke={ROOM_CONFIG[selectedTool].color}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    strokeOpacity={0.7}
                    rx={2}
                  />
                )}

                {/* Corner marks */}
                {CORNER_MARKS.map(({ cx, cy, key }) => (
                  <g key={key}>
                    <line
                      x1={cx * CELL + (cx === 0 ? 0 : -8)}
                      y1={cy * CELL}
                      x2={cx * CELL + (cx === 0 ? 8 : 0)}
                      y2={cy * CELL}
                      stroke="oklch(0.75 0.18 195 / 0.8)"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={cx * CELL}
                      y1={cy * CELL + (cy === 0 ? 0 : -8)}
                      x2={cx * CELL}
                      y2={cy * CELL + (cy === 0 ? 8 : 0)}
                      stroke="oklch(0.75 0.18 195 / 0.8)"
                      strokeWidth="1.5"
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* Legend below grid */}
            <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-4">
              {Object.entries(ROOM_CONFIG).map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: cfg.color, opacity: 0.8 }}
                  />
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {cfg.shortName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-2 px-4 text-center">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary/60 hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
