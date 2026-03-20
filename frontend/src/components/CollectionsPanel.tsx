import React, { useState, useEffect } from 'react';
import {
  getCollections,
  createCollection,
  deleteCollection,
  renameCollection,
  createRequest,
  deleteRequest
} from '../api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Folder, X, ChevronRight, ChevronDown, FolderOpen } from "lucide-react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ConfirmDialog from './ConfirmDialog';
import type { Collection, Request } from '../types';
import { updateCollection, updateCollectionsOrder } from '../api';

interface CollectionsPanelProps {
  searchTerm?: string;
  onSelectRequest?: (request: Request) => void;
  selectedRequestId: string | null;
  onDeleteRequest?: (id: string) => void;
  onDeleteCollection?: (requests: Request[]) => void;
  onRefreshSidebar?: () => void;
}

interface DeleteConfirmState {
  isOpen: boolean;
  type: 'collection' | 'request' | null;
  data: any;
}

const CollectionsPanel = ({
  searchTerm = '',
  onSelectRequest,
  selectedRequestId,
  onDeleteRequest,
  onDeleteCollection,
  onRefreshSidebar
}: CollectionsPanelProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState('');
  const [addingRequestToCollectionId, setAddingRequestToCollectionId] = useState<string | null>(null);
  const [newRequestName, setNewRequestName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    type: null,
    data: null
  });

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    const data = await getCollections();
    setCollections(data);
  };

  const handleAddCollection = async () => {
    if (!newCollectionName.trim()) {
      setShowAddCollection(false);
      return;
    }
    await createCollection(newCollectionName);
    setNewCollectionName('');
    setShowAddCollection(false);
    if (onRefreshSidebar) onRefreshSidebar();
    loadCollections();
  };

  const handleRenameCollection = async (id: string) => {
    if (!editingCollectionName.trim()) {
      setEditingCollectionId(null);
      return;
    }
    await renameCollection(id, editingCollectionName);
    setEditingCollectionId(null);
    if (onRefreshSidebar) onRefreshSidebar();
    loadCollections();
  };

  const handleDeleteCollection = (e: React.MouseEvent, col: Collection) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      type: 'collection',
      data: col,
    });
  };

  const confirmDeleteCollection = async (col: Collection) => {
    await deleteCollection(col.ID);
    if (onDeleteCollection) onDeleteCollection(col.requests);
    if (onRefreshSidebar) onRefreshSidebar();
    loadCollections();
  };

  const handleAddRequest = (e: React.MouseEvent, colId: string) => {
    e.stopPropagation();
    setAddingRequestToCollectionId(colId);
    setNewRequestName('');
  };

  const handleConfirmAddRequest = async (colId: string) => {
    if (!newRequestName.trim()) {
      setAddingRequestToCollectionId(null);
      return;
    }
    const req = await createRequest(colId, newRequestName, 'GET', 'https://api.example.com');
    setAddingRequestToCollectionId(null);
    setNewRequestName('');
    if (onRefreshSidebar) onRefreshSidebar();
    loadCollections();
    if (onSelectRequest && req) {
      onSelectRequest({ ...req, collectionName: collections.find(c => c.ID === colId)?.name });
    }
  };

  const handleDeleteRequest = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      type: 'request',
      data: id,
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCollections((items) => {
        const oldIndex = items.findIndex((i) => i.ID === active.id);
        const newIndex = items.findIndex((i) => i.ID === over.id);
        const newArr = arrayMove(items, oldIndex, newIndex);
        updateCollectionsOrder(newArr.map(c => c.ID)).then(() => {
          if (onRefreshSidebar) onRefreshSidebar();
        });
        return newArr;
      });
    }
  };

  const handleToggleCollapse = async (col: Collection) => {
    const newCollapsed = !col.is_collapsed;
    setCollections(prev => prev.map(c => c.ID === col.ID ? { ...c, is_collapsed: newCollapsed } : c));
    await updateCollection(col.ID, col.name, col.color || '', col.order, newCollapsed);
  };

  const handleColorChange = async (col: Collection, color: string) => {
    setCollections(prev => prev.map(c => c.ID === col.ID ? { ...c, color } : c));
    await updateCollection(col.ID, col.name, color, col.order, col.is_collapsed);
  };

  const confirmDeleteRequest = async (id: string) => {
    await deleteRequest(id);
    if (onDeleteRequest) onDeleteRequest(id);
    if (onRefreshSidebar) onRefreshSidebar();
    loadCollections();
  };

  const COLORS = [
    { name: 'None', value: '' },
    { name: 'Indigo', value: 'indigo' },
    { name: 'Emerald', value: 'emerald' },
    { name: 'Rose', value: 'rose' },
    { name: 'Amber', value: 'amber' },
    { name: 'Cyan', value: 'cyan' },
    { name: 'Violet', value: 'violet' },
  ];

  const getColorClass = (color: string | undefined) => {
    if (!color) return 'text-muted-foreground';
    switch (color) {
      case 'indigo': return 'text-indigo-500';
      case 'emerald': return 'text-emerald-500';
      case 'rose': return 'text-rose-500';
      case 'amber': return 'text-amber-500';
      case 'cyan': return 'text-cyan-500';
      case 'violet': return 'text-violet-500';
      default: return 'text-muted-foreground';
    }
  };

  const getBgClass = (color: string | undefined) => {
    if (!color) return '';
    switch (color) {
      case 'indigo': return 'bg-indigo-500/10 border-indigo-500/20';
      case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'rose': return 'bg-rose-500/10 border-rose-500/20';
      case 'amber': return 'bg-amber-500/10 border-amber-500/20';
      case 'cyan': return 'bg-cyan-500/10 border-cyan-500/20';
      case 'violet': return 'bg-violet-500/10 border-violet-500/20';
      default: return '';
    }
  };

  const filteredCollections = collections.filter(col => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesCollection = col.name.toLowerCase().includes(lowerSearch);
    const matchesRequests = col.requests?.some(req => 
      req.name.toLowerCase().includes(lowerSearch) || 
      req.url?.toLowerCase().includes(lowerSearch)
    );
    return matchesCollection || matchesRequests;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 w-full px-0 py-2">
        <div className="space-y-0.5">
          {showAddCollection && (
            <div className="px-4 py-2">
              <Input
                className="h-8 text-[11px] bg-background shadow-sm"
                placeholder="Collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCollection();
                  if (e.key === 'Escape') setShowAddCollection(false);
                }}
                autoFocus
              />
            </div>
          )}

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={filteredCollections.map(c => c.ID)}
              strategy={verticalListSortingStrategy}
            >
              {filteredCollections.map(col => (
                <SortableCollectionItem 
                  key={col.ID} 
                  col={col} 
                  searchTerm={searchTerm}
                  selectedRequestId={selectedRequestId}
                  addingRequestToCollectionId={addingRequestToCollectionId}
                  editingCollectionId={editingCollectionId}
                  editingCollectionName={editingCollectionName}
                  newRequestName={newRequestName}
                  setEditingCollectionId={setEditingCollectionId}
                  setEditingCollectionName={setEditingCollectionName}
                  setAddingRequestToCollectionId={setAddingRequestToCollectionId}
                  setNewRequestName={setNewRequestName}
                  handleRenameCollection={handleRenameCollection}
                  handleAddRequest={handleAddRequest}
                  handleDeleteCollection={handleDeleteCollection}
                  handleConfirmAddRequest={handleConfirmAddRequest}
                  handleDeleteRequest={handleDeleteRequest}
                  handleSelectRequest={onSelectRequest}
                  handleToggleCollapse={handleToggleCollapse}
                  handleColorChange={handleColorChange}
                  getColorClass={getColorClass}
                  getBgClass={getBgClass}
                  COLORS={COLORS}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={() => {
          if (deleteConfirm.type === 'collection') {
            confirmDeleteCollection(deleteConfirm.data);
          } else {
            confirmDeleteRequest(deleteConfirm.data);
          }
        }}
        title={`Delete ${deleteConfirm.type === 'collection' ? 'Collection' : 'Request'}?`}
        description={
          deleteConfirm.type === 'collection'
            ? `Are you sure you want to delete "${deleteConfirm.data?.name}" and all its requests? This action cannot be undone.`
            : "Are you sure you want to delete this request? This action cannot be undone."
        }
      />
    </div>
  );
};

export default CollectionsPanel;

const SortableCollectionItem = ({ 
  col, 
  searchTerm,
  selectedRequestId,
  addingRequestToCollectionId,
  editingCollectionId,
  editingCollectionName,
  newRequestName,
  setEditingCollectionId,
  setEditingCollectionName,
  setAddingRequestToCollectionId,
  setNewRequestName,
  handleRenameCollection,
  handleAddRequest,
  handleDeleteCollection,
  handleConfirmAddRequest,
  handleDeleteRequest,
  handleSelectRequest,
  handleToggleCollapse,
  handleColorChange,
  getColorClass,
  getBgClass,
  COLORS
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: col.ID });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const filteredRequests = col.requests?.filter((req: any) => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return req.name.toLowerCase().includes(lowerSearch) || 
           req.url?.toLowerCase().includes(lowerSearch);
  }) || [];

  const isExpanded = !col.is_collapsed || (searchTerm && filteredRequests.length > 0);

  return (
    <div ref={setNodeRef} style={style} className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
      <div 
        className="group flex items-center justify-between px-3 py-1.5 transition-all cursor-pointer relative hover:bg-white/5"
        onClick={() => handleToggleCollapse(col)}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="shrink-0 flex items-center text-muted-foreground/50">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          <div className="shrink-0">
            {isExpanded ? (
              <FolderOpen size={14} className={col.color === 'amber' ? 'text-accent-orange' : col.color === 'emerald' ? 'text-accent-green' : 'text-accent-purple-light'} />
            ) : (
              <Folder size={14} className={col.color === 'amber' ? 'text-accent-orange' : col.color === 'emerald' ? 'text-accent-green' : 'text-accent-purple-light'} />
            )}
          </div>
          
          {editingCollectionId === col.ID ? (
            <Input
              className="h-6 flex-1 bg-background text-[11px] px-1 py-0 shadow-none border-primary/30"
              value={editingCollectionName}
              onChange={(e) => setEditingCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameCollection(col.ID);
                if (e.key === 'Escape') setEditingCollectionId(null);
              }}
              onBlur={() => handleRenameCollection(col.ID)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="truncate font-semibold text-[11px] text-muted-foreground group-hover:text-foreground"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingCollectionId(col.ID);
                setEditingCollectionName(col.name);
              }}
            >
              {col.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-primary/20 hover:text-primary rounded" onClick={(e) => { e.stopPropagation(); handleAddRequest(e, col.ID); }}>
            <Plus size={12} />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-destructive/20 hover:text-destructive rounded" onClick={(e) => { handleDeleteCollection(e, col); }}>
            <X size={12} />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-0.5">
          {addingRequestToCollectionId === col.ID && (
            <div className="pl-9 pr-3 py-1">
              <Input
                className="h-7 w-full bg-background text-[11px] px-2 shadow-none border-primary/20 rounded"
                placeholder="Request name..."
                value={newRequestName}
                onChange={(e) => setNewRequestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmAddRequest(col.ID);
                  if (e.key === 'Escape') setAddingRequestToCollectionId(null);
                }}
                onBlur={() => handleConfirmAddRequest(col.ID)}
                autoFocus
              />
            </div>
          )}
          {filteredRequests?.map((req: Request) => (
            <div
              key={req.ID}
              className={`group flex items-center justify-between pl-9 pr-3 py-1.5 cursor-pointer transition-all relative
              ${selectedRequestId === req.ID ? 'bg-primary/10 text-foreground border-r-2 border-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
              onClick={(e) => { e.stopPropagation(); handleSelectRequest && handleSelectRequest({ ...req, collectionName: col.name }); }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={`method-badge method-${req.method.toLowerCase()} text-[8px] py-0 px-1 min-w-[34px] text-center`}>
                  {req.method === 'DELETE' ? 'DEL' : req.method}
                </span>
                <span className="text-[11px] font-medium truncate">{req.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-transparent transition-all"
                onClick={(e) => { e.stopPropagation(); handleDeleteRequest(e, req.ID); }}
              >
                <X size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
