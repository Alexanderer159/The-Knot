import { useState } from "react";
import { Package, Plus, Minus, Check, Trash2, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSupplies, type Supply, type SupplyCategory } from "@/hooks/useSupplies";
import { categoryColors } from "@/lib/supplies";

const allCategories: SupplyCategory[] = ["Water", "Food", "Medicine", "Energy", "Tools", "Communications"];

function sliderColor(percent: number) {
  if (percent >= 100) return "bg-safe";
  if (percent >= 50) return "bg-primary";
  return "bg-warning";
}

export default function Insumos() {
  const { supplies, loading, addSupply, updateSupply, adjustHave, removeSupply } = useSupplies();
  const [filter, setFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNeedValue, setEditNeedValue] = useState("");
  const [editHaveId, setEditHaveId] = useState<string | null>(null);
  const [editHaveValue, setEditHaveValue] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<SupplyCategory>("Tools");
  const [newNeed, setNewNeed] = useState("1");
  const [newUnit, setNewUnit] = useState("uds");

  // All "have" changes route through adjustHave as a delta, so concurrent
  // offline edits from different people compose correctly instead of
  // one overwriting the other when both come back online.
  const increment = (item: Supply) => adjustHave(item.id, 1);
  const decrement = (item: Supply) => adjustHave(item.id, -1);
  const setHave = (item: Supply, newValue: number) => {
    const clamped = Math.max(0, Math.min(newValue, item.need));
    adjustHave(item.id, clamped - item.have);
  };

  const toggleAcquired = (item: Supply) => {
    const nowAcquired = !item.acquired;
    updateSupply(item.id, { acquired: nowAcquired, have: nowAcquired ? item.need : item.have });
  };

  const startEditNeed = (item: Supply) => {
    setEditingId(item.id);
    setEditNeedValue(item.need.toString());
  };

  const saveEditNeed = (item: Supply) => {
    const val = parseInt(editNeedValue);
    if (val > 0) {
      updateSupply(item.id, { need: val, have: Math.min(item.have, val) });
    }
    setEditingId(null);
  };

  const startEditHave = (item: Supply) => {
    setEditHaveId(item.id);
    setEditHaveValue(item.have.toString());
  };

  const saveEditHave = (item: Supply) => {
    const val = parseInt(editHaveValue);
    if (!isNaN(val)) {
      setHave(item, val);
    }
    setEditHaveId(null);
  };

  const handleAddItem = async () => {
    if (!newName.trim()) return;
    await addSupply({
      name: newName.trim(),
      category: newCategory,
      need: parseInt(newNeed) || 1,
      unit: newUnit,
    });
    setNewName("");
    setNewNeed("1");
    setShowAdd(false);
  };

  const categories = ["all", ...Array.from(new Set(supplies.map(s => s.category)))];
  const filtered = filter === "all" ? supplies : supplies.filter(s => s.category === filter);

  const totalItems = supplies.length;
  const completedItems = supplies.filter(s => s.have >= s.need).length;
  const overallPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const pendingCount = totalItems - completedItems;

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Loading supplies...</p>;
  }

  return (
    <div className="space-y-5">
      {/* Header Stats */}
      <section className="space-y-3">
        <Card className="">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-7 w-7 text-primary" />
                <span className="font-heading font-bold text-lg">{overallPercent}% COMPLETE</span>
              </div>
              <Badge className="bg-secondary text-white">{pendingCount} pending</Badge>
            </div>
            <Progress value={overallPercent} className="h-2" />
            <div className="flex justify-between text-xs text-foreground">
              <span>{completedItems} of {totalItems} items covered</span>
              <span>{supplies.filter(s => s.have < s.need).reduce((acc, s) => acc + (s.need - s.have), 0)} units needed</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Category Filter */}
      <div className="grid grid-cols-2 gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={cn("shrink-0 rounded-md font-semibold p-2 transition-all", filter === cat ? "bg-primary text-black font-semibold" : "bg-secondary/70")}>
            {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>

      {/* Supply List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No supplies yet, add your first one below.</p>
        )}
        {filtered.map(item => {
          const percent = item.need > 0 ? Math.round((item.have / item.need) * 100) : 0;
          const missing = item.need - item.have;
          const isComplete = item.have >= item.need;

          return (
            <Card key={item.id} className="transition-all">
              <CardContent className="py-3 px-4 space-y-2">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleAcquired(item)} className={cn("shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                    item.acquired ? "bg-safe border-safe" : isComplete ? "border-safe" : "")}>
                    {item.acquired && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">

                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-heading font-semibold", item.acquired && "text-muted-foreground")}>
                          {item.name}
                        </span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
                          categoryColors[item.category] || "bg-secondary text-secondary-foreground"
                        )}>
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 ">
                        {editHaveId === item.id ? (
                          <input
                            type="number"
                            value={editHaveValue}
                            onChange={e => setEditHaveValue(e.target.value)}
                            onBlur={() => saveEditHave(item)}
                            onKeyDown={e => e.key === "Enter" && saveEditHave(item)}
                            className="w-10 h-5 text-xs font-mono bg-secondary rounded px-1 text-foreground"
                            autoFocus
                          />
                        ) : (
                          <button onClick={() => startEditHave(item)} className={cn(
                            "text-xs font-mono hover:text-primary transition-colors",
                            isComplete ? "text-primary" : missing > 0 ? "text-warning" : "text-muted-foreground"
                          )}>
                            {item.have}
                          </button>
                        )}

                        <span className="text-xs font-mono text-muted-foreground">/</span>

                        {editingId === item.id ? (
                          <input
                            type="number"
                            value={editNeedValue}
                            onChange={e => setEditNeedValue(e.target.value)}
                            onBlur={() => saveEditNeed(item)}
                            onKeyDown={e => e.key === "Enter" && saveEditNeed(item)}
                            className="w-10 h-5 text-xs font-mono bg-secondary rounded px-1 text-foreground"
                            autoFocus
                          />
                        ) : (
                          <button onClick={() => startEditNeed(item)} className="text-xs font-mono text-muted-foreground hover:text-primary transition-all">
                            {item.need}
                          </button>
                        )}

                        <span className="text-xs font-mono text-muted-foreground">{item.unit}</span>
                        <Pencil className="h-2.5 w-2.5 text-muted-foreground ml-0.5" />
                      </div>
                    </div>

                    {/* Slider replaces the old per-item progress bar, color reflects fill level */}
                    <Slider
                      value={[item.have]}
                      max={item.need}
                      step={1}
                      onValueChange={([val]) => setHave(item, val)}
                      className="py-1 mt-2"
                      rangeClassName={sliderColor(percent)}
                    />

                    {missing > 0 && !item.acquired ? (
                      <span className="text-[10px] text-warning">
                        {missing} {item.unit} missing
                      </span>
                    ) : (
                      <span className="text-[10px] text-safe">
                        Complete
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => decrement(item)} className="h-7 w-7 rounded bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => increment(item)} className="h-7 w-7 rounded bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => removeSupply(item.id)} className="h-7 w-7 rounded bg-secondary flex items-center justify-center hover:bg-critical/20 text-muted-foreground hover:text-critical transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Item */}
      {showAdd ? (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-center">ADD SUPPLY</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Supply name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-secondary" />
            <div className="grid grid-cols-3 gap-2">
              <select value={newCategory} onChange={e => setNewCategory(e.target.value as SupplyCategory)}
                className="rounded-md bg-secondary p-2 text-sm text-foreground">
                {allCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Input placeholder="Qty" type="number" value={newNeed} onChange={e => setNewNeed(e.target.value)} className="bg-secondary" />
              <Input placeholder="Unit" value={newUnit} onChange={e => setNewUnit(e.target.value)} className="bg-secondary" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddItem} className="flex-1 font-bold">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
              <Button onClick={() => setShowAdd(false)} className="flex-1 bg-secondary text-white font-bold" >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Add supply
        </Button>
      )}
    </div>
  );
}