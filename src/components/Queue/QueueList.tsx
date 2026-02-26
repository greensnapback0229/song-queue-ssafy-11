'use client';

import { QueueItem } from '@/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

interface QueueListProps {
  items: QueueItem[];
  onDelete: (id: number) => void;
  onReorder?: (newItems: QueueItem[]) => void;
  isAdmin?: boolean;
}

export default function QueueList({ items, onDelete, onReorder, isAdmin }: QueueListProps) {
  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder || !isAdmin) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    onReorder(newItems);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-12 text-center border border-gray-100 dark:border-white/5 transition-colors duration-300">
        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <p className="text-gray-400 dark:text-gray-400 font-bold text-lg transition-colors duration-300">큐가 비어있습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden border border-gray-100 dark:border-white/5 transition-colors duration-300">
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="queue">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="divide-y divide-gray-50 dark:divide-white/5"
            >
              {items.map((item, index) => (
                <Draggable 
                  key={item.id} 
                  draggableId={item.id.toString()} 
                  index={index}
                  isDragDisabled={!isAdmin}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`group relative p-6 transition-colors duration-300 ${
                        snapshot.isDragging 
                        ? 'bg-blue-50/50 dark:bg-toss-blue/10 scale-[1.02] shadow-xl z-50' 
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        {/* Drag Handle & Number */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {isAdmin && (
                            <div 
                              {...provided.dragHandleProps}
                              className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing p-1 -ml-2"
                            >
                              <GripVertical size={20} />
                            </div>
                          )}
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                            index === 0 
                            ? 'bg-toss-blue text-white shadow-lg shadow-toss-blue/20' 
                            : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                        </div>

                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-xl font-bold text-foreground leading-none transition-colors duration-300">
                              {item.name}
                            </h3>
                            {index === 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-toss-blue uppercase tracking-wider ring-1 ring-inset ring-blue-600/10 dark:ring-blue-400/20 transition-all">
                                NEXT
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors duration-300">
                            {item.reason}
                          </p>
                        </div>

                        {/* 삭제 버튼 */}
                        <button
                          onClick={() => onDelete(item.id)}
                          className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center"
                          aria-label="삭제"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
