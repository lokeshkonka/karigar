'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  DragDropContext, Droppable, Draggable, DropResult
} from '@hello-pangea/dnd';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, AlertTriangle, Plus } from 'lucide-react';

const INITIAL_COLUMNS = {
  waiting: { id: 'waiting', title: 'WAITING', color: 'bg-electricYellow' },
  diagnosed: { id: 'diagnosed', title: 'DIAGNOSED', color: 'bg-cream' },
  inprogress: { id: 'inprogress', title: 'IN PROGRESS', color: 'bg-blue' },
  quality: { id: 'quality', title: 'QUALITY CHECK', color: 'bg-orange' },
  ready: { id: 'ready', title: 'READY', color: 'bg-green' },
  delivered: { id: 'delivered', title: 'DELIVERED', color: 'bg-gray-200' },
};

const INITIAL_DATA = {
  columns: INITIAL_COLUMNS,
  columnOrder: ['waiting', 'diagnosed', 'inprogress', 'quality', 'ready', 'delivered'],
  tasksData: {} as Record<string, any>,
  columnsTasks: {
    waiting: [] as string[],
    diagnosed: [] as string[],
    inprogress: [] as string[],
    quality: [] as string[],
    ready: [] as string[],
    delivered: [] as string[],
  } as Record<string, string[]>
};

export default function KanbanPage() {
  const [data, setData] = useState(INITIAL_DATA);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    fetchMechanics();
    fetchWorkOrders();
  }, []);

  async function fetchMechanics() {
    const { data: staff } = await supabase.from('staff_profiles').select('id, name');
    setMechanics(staff || []);
  }

  async function fetchWorkOrders() {
    setLoading(true);
    const { data: woData, error } = await supabase
      .from('work_orders')
      .select(`
        id, status, type, created_at, priority, notes, assigned_mechanic_id,
        vehicles ( plate ),
        customers ( name )
      `)
      .order('created_at', { ascending: false });

    if (!error && woData) {
      const newTasksData: Record<string, any> = {};
      const newColumnsTasks: Record<string, string[]> = {
        waiting: [],
        diagnosed: [],
        inprogress: [],
        quality: [],
        ready: [],
        delivered: [],
      };

      woData.forEach((job: any) => {
        const id = job.id;
        const status = (job.status || 'waiting').toLowerCase();
        
        newTasksData[id] = {
          id: id,
          plate: Array.isArray(job.vehicles) ? job.vehicles[0]?.plate : job.vehicles?.plate || 'Unknown',
          customer: Array.isArray(job.customers) ? job.customers[0]?.name : job.customers?.name || job.customer_name || 'Walk-In',
          type: job.type || 'Service',
          priority: job.priority || 'normal',
          time: new Date(job.created_at).toLocaleDateString(),
          assigned: job.assigned_mechanic_id,
          overdue: false
        };

        if (newColumnsTasks[status]) {
          newColumnsTasks[status].push(id);
        } else {
          newColumnsTasks['waiting'].push(id);
        }
      });

      setData({
        columns: INITIAL_COLUMNS,
        columnOrder: ['waiting', 'diagnosed', 'inprogress', 'quality', 'ready', 'delivered'],
        tasksData: newTasksData,
        columnsTasks: newColumnsTasks
      });
    }
    setLoading(false);
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumnList = Array.from(data.columnsTasks[source.droppableId as keyof typeof data.columnsTasks]);
    const finishColumnList = Array.from(data.columnsTasks[destination.droppableId as keyof typeof data.columnsTasks]);

    if (source.droppableId === destination.droppableId) {
      startColumnList.splice(source.index, 1);
      startColumnList.splice(destination.index, 0, draggableId);
      setData({
        ...data,
        columnsTasks: {
          ...data.columnsTasks,
          [source.droppableId]: startColumnList,
        }
      });
      return;
    }

    startColumnList.splice(source.index, 1);
    finishColumnList.splice(destination.index, 0, draggableId);

    setData({
      ...data,
      columnsTasks: {
        ...data.columnsTasks,
        [source.droppableId]: startColumnList,
        [destination.droppableId]: finishColumnList,
      }
    });

    supabase
      .from('work_orders')
      .update({ status: destination.droppableId.toUpperCase() })
      .eq('id', draggableId)
      .then(({ error }) => {
        if (error) {
          toast.error('Database Sync Failed');
        } else {
          toast.success(`Moved to ${destination.droppableId.toUpperCase()}`);
        }
      });
  };

  const handleAssignMechanic = async (jobId: string, mechanicId: string) => {
    const val = mechanicId === 'unassigned' ? null : mechanicId;
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      tasksData: {
        ...prev.tasksData,
        [jobId]: { ...prev.tasksData[jobId], assigned: val }
      }
    }));

    const { error } = await supabase.from('work_orders').update({ assigned_mechanic_id: val }).eq('id', jobId);
    if (error) {
      toast.error('Failed to assign mechanic');
      fetchWorkOrders(); // revert
    } else {
      toast.success(val ? 'Mechanic assigned successfully' : 'Mechanic unassigned');
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b-4 border-[#1a1a1a] pb-4 mb-6 shrink-0">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-[#1a1a1a]">
            Work Orders
          </h1>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={18} strokeWidth={3} />
          New Order
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 snap-x snap-mandatory">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-max px-4">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId as keyof typeof data.columns];
              const tasks = data.columnsTasks[columnId as keyof typeof data.columnsTasks].map(taskId => data.tasksData[taskId as keyof typeof data.tasksData]);

              return (
                <div key={column.id} className="flex flex-col w-[85vw] md:w-[320px] shrink-0 snap-center">
                  <div className={`p-3 border-neo shadow-neo mb-4 flex justify-between items-center ${column.color}`}>
                    <h2 className="font-black tracking-wider uppercase text-sm">{column.title}</h2>
                    <span className="bg-white/50 px-2 py-0.5 font-bold text-xs border-neo-sm">
                      {tasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-2 min-h-[200px] border-dashed border-2 transition-colors ${snapshot.isDraggingOver ? 'border-[#1a1a1a] bg-black/5' : 'border-transparent'}`}
                      >
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-4 select-none ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}`}
                                style={{ ...provided.draggableProps.style }}
                              >
                                <Card className={`p-4 cursor-grab active:cursor-grabbing ${task.overdue ? 'border-red shadow-[0_0_15px_rgba(226,75,74,0.5)] animate-pulse' : ''} ${snapshot.isDragging ? 'shadow-neo-lg' : 'shadow-neo'}`}>
                                  <div className="flex justify-between items-start mb-3">
                                    <span className="bg-[#1a1a1a] text-white px-2 py-1 text-xs font-black tracking-wider">
                                      {task.id.split('-')[0]}...
                                    </span>
                                    {task.priority === 'urgent' && <Badge className="bg-orange text-white">URGENT</Badge>}
                                    {task.priority === 'critical' && <Badge className="bg-red text-white">CRITICAL</Badge>}
                                  </div>
                                  
                                  <div className="bg-electricYellow px-3 py-1.5 inline-block font-mono text-lg font-black tracking-widest border-neo-sm mb-3">
                                    {task.plate}
                                  </div>
                                  
                                  <p className="font-bold text-sm mb-1 line-clamp-1">{task.customer}</p>
                                  <Badge className="bg-blue text-white mb-3 block w-fit">{task.type}</Badge>

                                  <div className="mb-4">
                                    <select 
                                      className="w-full text-xs font-bold p-1 border-2 border-[#1a1a1a] bg-cream outline-none focus:ring-2 focus:ring-electricYellow cursor-pointer"
                                      value={task.assigned || 'unassigned'}
                                      onChange={(e) => handleAssignMechanic(task.id, e.target.value)}
                                    >
                                      <option value="unassigned">Unassigned (Click to assign)</option>
                                      {mechanics.map(m => (
                                        <option key={m.id} value={m.id}>Tech: {m.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-gray-300 text-xs font-bold text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Clock size={14} />
                                      {task.time}
                                    </span>
                                    {task.overdue && (
                                      <span className="text-red flex items-center gap-1">
                                        <AlertTriangle size={14} /> OVERDUE
                                      </span>
                                    )}
                                  </div>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
