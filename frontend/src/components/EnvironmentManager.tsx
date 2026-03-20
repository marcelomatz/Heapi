import { useState, useEffect } from 'react';
import { createEnvironment, updateEnvironment, deleteEnvironment } from '../api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, X, FolderOpen, Globe } from "lucide-react";
import ConfirmDialog from './ConfirmDialog';
import type { Environment } from '../types';

interface EnvironmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  environments: Environment[];
  onRefresh: () => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}

interface TableVariable {
  key: string;
  value: string;
}

const EnvironmentManager = ({ isOpen, onClose, environments, onRefresh, onSelect, selectedId }: EnvironmentManagerProps) => {
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "json">("table");
  const [tableVariables, setTableVariables] = useState<TableVariable[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (editingEnv) {
      try {
        const obj = JSON.parse(editingEnv.variables || "{}");
        const pairs = Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
        setTableVariables(pairs.length > 0 ? pairs : [{ key: "", value: "" }]);
      } catch (e) {
        setTableVariables([{ key: "", value: "" }]);
      }
    }
  }, [editingEnv?.ID]);

  const handleCreate = async () => {
    if (newName.trim()) {
      await createEnvironment(newName);
      setNewName("");
      setIsCreating(false);
      onRefresh();
    }
  };

  const syncToJSON = (pairs: TableVariable[]) => {
    const obj: Record<string, string> = {};
    pairs.forEach(p => {
      if (p.key.trim()) {
        obj[p.key.trim()] = p.value;
      }
    });
    return JSON.stringify(obj, null, 2);
  };

  const handleTableChange = (index: number, field: keyof TableVariable, value: string) => {
    const newPairs = [...tableVariables];
    newPairs[index][field] = value;

    if (index === newPairs.length - 1 && value.trim() !== "") {
      newPairs.push({ key: "", value: "" });
    }

    setTableVariables(newPairs);
    if (editingEnv) {
      setEditingEnv({ ...editingEnv, variables: syncToJSON(newPairs) });
    }
  };

  const removeRow = (index: number) => {
    const newPairs = tableVariables.filter((_, i) => i !== index);
    const finalPairs = newPairs.length > 0 ? newPairs : [{ key: "", value: "" }];
    setTableVariables(finalPairs);
    if (editingEnv) {
      setEditingEnv({ ...editingEnv, variables: syncToJSON(finalPairs) });
    }
  };

  const handleUpdate = async (env: Environment) => {
    await updateEnvironment(env.ID, env.name, env.variables);
    onRefresh();
    setEditingEnv(null);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async (id: string) => {
    await deleteEnvironment(id);
    onRefresh();
    if (selectedId === id) onSelect(null);
    if (editingEnv?.ID === id) setEditingEnv(null);
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-4xl w-full h-[85vh] p-0 flex flex-col overflow-hidden gap-0 bg-card rounded-2xl border-border/40 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/50 flex flex-row items-center justify-between shrink-0 m-0 space-y-0 bg-bg-secondary/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Plus className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-black tracking-tight">Environments</DialogTitle>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="h-6 px-3 tracking-[0.1em] text-[9px] font-black uppercase bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all rounded-md"
            >
              Add New
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-64 border-r border-border/50 p-4 overflow-y-auto space-y-1.5 bg-bg-secondary/30">
            {isCreating && (
              <div className="mb-4 p-3 rounded-xl bg-background border border-primary/20 shadow-lg animate-in slide-in-from-top-2 duration-300">
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                  placeholder="Environment name..."
                  className="w-full text-xs h-9 bg-muted/20 border-border/50 focus-visible:border-primary/50 px-3"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider">Cancel</Button>
                  <Button size="sm" onClick={handleCreate} className="h-7 px-3 text-[10px] font-black uppercase tracking-wider shadow-md shadow-primary/10">Create</Button>
                </div>
              </div>
            )}
            {environments.map(env => (
              <div
                key={env.ID}
                className={`group flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all border ${editingEnv?.ID === env.ID ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' : 'hover:bg-white/5 border-transparent hover:border-border/30'}`}
                onClick={() => setEditingEnv(env)}
              >
                <div className="flex items-center gap-3 truncate">
                   <div className={`w-1.5 h-1.5 rounded-full ${editingEnv?.ID === env.ID ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
                   <span className="text-xs truncate font-bold tracking-tight">{env.name}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(env.ID); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all">
                  <X size={14} />
                </button>
              </div>
            ))}
            {environments.length === 0 && !isCreating && (
              <div className="text-center py-12 flex flex-col items-center gap-3">
                 <div className="p-4 rounded-full bg-muted/10 border border-border/20 text-muted-foreground/20">
                    <FolderOpen size={32} />
                 </div>
                 <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">No environments</div>
              </div>
            )}
          </aside>

          <main className="flex-1 p-8 overflow-y-auto flex flex-col bg-background/20">
            {editingEnv ? (
              <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
                <div className="flex items-end justify-between gap-6 pb-6 border-b border-border/40">
                  <div className="space-y-2.5 flex-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Environment Identity</label>
                    <Input
                      value={editingEnv.name}
                      onChange={(e) => setEditingEnv({ ...editingEnv as Environment, name: e.target.value })}
                      className="max-w-md h-11 text-base font-bold bg-background/50 border-border/50 focus-visible:border-primary/50"
                      placeholder="e.g. Production"
                    />
                  </div>
                  <div className="flex bg-bg-secondary p-1 rounded-xl border border-border shadow-inner">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'table' ? 'bg-background text-primary shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Table
                    </button>
                    <button
                      onClick={() => setViewMode('json')}
                      className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'json' ? 'bg-background text-primary shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      JSON
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  <div className="flex items-center justify-between ml-1">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Variable Context</label>
                  </div>
                  
                  {viewMode === 'table' ? (
                    <div className="overflow-hidden flex-1 border border-border/50 rounded-2xl bg-background/40 backdrop-blur-sm shadow-inner flex flex-col">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <Table>
                          <TableHeader className="bg-bg-secondary/50 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent border-b border-border/50">
                              <TableHead className="h-10 text-[10px] font-black uppercase tracking-[0.15em] pl-6">Variable Key</TableHead>
                              <TableHead className="h-10 text-[10px] font-black uppercase tracking-[0.15em]">Assigned Value</TableHead>
                              <TableHead className="h-10 w-16"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableVariables.map((p, i) => (
                              <TableRow key={i} className="group border-b border-border/30 last:border-0 hover:bg-white/5 transition-colors">
                                <TableCell className="p-1 pl-6">
                                  <Input
                                    placeholder="e.g. API_URL"
                                    value={p.key}
                                    onChange={(e) => handleTableChange(i, "key", e.target.value)}
                                    className="h-9 text-xs bg-transparent border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 font-mono font-bold"
                                  />
                                </TableCell>
                                <TableCell className="p-1">
                                  <Input
                                    placeholder="Value..."
                                    value={p.value}
                                    onChange={(e) => handleTableChange(i, "value", e.target.value)}
                                    className="h-9 text-xs bg-transparent border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 font-medium text-foreground/80"
                                  />
                                </TableCell>
                                <TableCell className="p-1 pr-6 text-right">
                                  <button
                                    onClick={() => removeRow(i)}
                                    className="p-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                  >
                                    <X size={14} />
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      value={editingEnv.variables}
                      onChange={(e) => setEditingEnv({ ...editingEnv as Environment, variables: e.target.value })}
                      className="w-full flex-1 bg-background/40 border-border/50 font-mono text-xs p-6 leading-relaxed resize-none rounded-2xl shadow-inner focus-visible:border-primary/50"
                      placeholder='{"baseUrl": "https://api.prod.com", "apiKey": "secret_value"}'
                    />
                  )}
                </div>

                <div className="pt-8 flex justify-end gap-3 border-t border-border/40">
                  <button
                    onClick={() => setEditingEnv(null)}
                    className="px-6 font-bold text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Discard
                  </button>
                  <Button
                    onClick={() => handleUpdate(editingEnv)}
                    size="lg"
                    className="px-8 font-black text-[10px] tracking-[0.2em] uppercase shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all rounded-xl h-12"
                  >
                    Update Environment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 gap-6 animate-in fade-in zoom-in-95 duration-700">
                <div className="relative">
                  <div className="absolute inset-0 blur-3xl opacity-20 bg-primary rounded-full scale-150" />
                  <div className="relative p-8 rounded-3xl bg-bg-secondary/50 border border-border/30 shadow-2xl">
                    <Globe className="w-16 h-16" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                   <p className="text-sm font-black uppercase tracking-[0.3em] text-foreground/40">Environment Configuration</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Select an identity from the sidebar to begin</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </DialogContent>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && confirmDelete(deleteId)}
        title="Delete Environment?"
        description="Are you sure you want to delete this environment? This will remove all its variables."
      />
    </Dialog>
  );
};

export default EnvironmentManager;
