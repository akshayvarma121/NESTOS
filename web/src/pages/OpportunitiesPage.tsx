import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import CreateOpportunityPanel from '../components/CreateOpportunityPanel';
import { Plus, ExternalLink, X } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';

const STAGES = [
  { id: 'to_apply', label: 'To Apply' },
  { id: 'applied', label: 'Applied' },
  { id: 'oa', label: 'OA' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer', collapsible: true },
  { id: 'rejected', label: 'Rejected', collapsible: true },
];

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
  duration: 150,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
};

// Urgency Logic
function getUrgencyLevel(deadline?: string | null) {
  if (!deadline) return 'none';
  const hours = (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60);
  if (hours < 0) return 'none'; // Past deadline
  if (hours <= 24) return 'critical';
  if (hours <= 72) return 'warning';
  return 'none';
}

function OpportunityCard({ opp }: { opp: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opp.id,
    data: opp,
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const urgency = getUrgencyLevel(opp.deadline);
  
  let urgencyStyles = 'border-[var(--border-hairline)]';
  if (urgency === 'critical') urgencyStyles = 'bg-[var(--danger)]/10 border-[var(--danger)]';
  else if (urgency === 'warning') urgencyStyles = 'bg-[var(--warning)]/10 border-[var(--warning)]';
  
  // Base container styles
  let cardClass = `p-3 bg-[var(--bg-surface)] border rounded-lg space-y-2 cursor-grab active:cursor-grabbing select-none transition-all ${
    isDragging ? 'opacity-50 scale-105 shadow-xl z-50' : 'hover:border-[var(--text-secondary)]'
  } ${urgencyStyles}`;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cardClass}>
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-medium text-sm text-[var(--text-primary)] leading-tight">{opp.company}</h3>
        {opp.source_link && (
          <a href={opp.source_link} target="_blank" rel="noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--accent)]" onPointerDown={e => e.stopPropagation()}>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      <p className="text-xs text-[var(--text-secondary)]">{opp.role}</p>
      
      {opp.deadline && (
        <div className={`text-[10px] uppercase font-mono tracking-wide px-1.5 py-0.5 rounded inline-block ${
          urgency === 'critical' ? 'bg-[var(--danger)] text-[var(--bg-base)]' :
          urgency === 'warning' ? 'bg-[var(--warning)] text-[var(--bg-base)]' :
          'bg-[var(--bg-surface-raised)] text-[var(--text-tertiary)]'
        }`}>
          Due {new Date(opp.deadline).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ stage, items, collapsed, onToggleCollapse }: { stage: any, items: any[], collapsed: boolean, onToggleCollapse: () => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  if (collapsed) {
    return (
      <div 
        onClick={onToggleCollapse}
        className="w-12 h-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl flex flex-col items-center py-4 cursor-pointer hover:bg-[var(--bg-surface-raised)] transition-colors flex-shrink-0"
      >
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)] -rotate-90 whitespace-nowrap mt-10">
          {stage.label} ({items.length})
        </span>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col w-72 h-full bg-[var(--bg-surface)] border rounded-xl overflow-hidden flex-shrink-0 transition-colors ${
        isOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-hairline)]'
      }`}
    >
      <div className="p-3 border-b border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] flex justify-between items-center">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">{stage.label} <span className="opacity-50">({items.length})</span></h2>
        {stage.collapsible && (
          <button onClick={onToggleCollapse} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px]">
        {items.map(opp => (
          <OpportunityCard key={opp.id} opp={opp} />
        ))}
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  
  // State for collapsed columns
  const [collapsedCols, setCollapsedCols] = useState<Record<string, boolean>>({ offer: true, rejected: true });

  const fetchOpportunities = async () => {
    try {
      const data = await api.get('/opportunities');
      setOpportunities(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOpportunities(); }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleCreate = async (payload: any) => {
    await api.post('/opportunities', payload);
    await fetchOpportunities();
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveItem(e.active.data.current);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveItem(null);

    if (over && over.id && over.id !== activeItem?.stage) {
      const newStage = over.id as string;
      const id = active.id as string;

      // Optimistic update
      setOpportunities(prev => prev.map(o => o.id === id ? { ...o, stage: newStage, stage_updated_at: new Date().toISOString() } : o));

      try {
        await api.patch(`/opportunities/${id}`, { stage: newStage });
      } catch (err) {
        console.error("Failed to update stage", err);
        fetchOpportunities(); // revert
      }
    }
  };

  if (loading) return <div className="p-6 text-[var(--text-secondary)]">Loading...</div>;

  // Auto-sort logic per FR-7.3:
  // 1. Critical (<= 24h) first
  // 2. Warning (<= 72h) second
  // 3. Ascending by deadline
  // 4. Nulls last
  const sortedOpps = [...opportunities].sort((a, b) => {
    const aUrge = getUrgencyLevel(a.deadline);
    const bUrge = getUrgencyLevel(b.deadline);
    
    const rank = { critical: 0, warning: 1, none: 2 };
    if (rank[aUrge] !== rank[bUrge]) return rank[aUrge] - rank[bUrge];
    
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return (
    <div className="p-6 md:p-8 h-[calc(100vh-80px)] flex flex-col max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Opportunities</h1>
          <p className="text-[var(--text-secondary)] text-sm">Track your applications and placements.</p>
        </div>
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="bg-[var(--text-primary)] text-[var(--bg-base)] px-3 py-1.5 rounded-[4px] text-sm font-medium flex items-center gap-1.5 hover:bg-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Opportunity
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full items-start">
            {STAGES.map(stage => {
              const items = sortedOpps.filter(o => o.stage === stage.id);
              const isCollapsed = collapsedCols[stage.id];
              return (
                <KanbanColumn 
                  key={stage.id} 
                  stage={stage} 
                  items={items} 
                  collapsed={isCollapsed || false}
                  onToggleCollapse={() => setCollapsedCols(prev => ({ ...prev, [stage.id]: !isCollapsed }))}
                />
              );
            })}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeItem ? <OpportunityCard opp={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateOpportunityPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}
