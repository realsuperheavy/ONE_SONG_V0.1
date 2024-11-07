import { useState, useCallback } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { useQueue } from './useQueue';

export function useQueueDragDrop(eventId: string) {
  const { queue, reorderQueue } = useQueue(eventId);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    setIsDragging(false);

    if (!result.destination) return;

    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    try {
      await reorderQueue(items.map(item => item.id));
    } catch (error) {
      // Error is handled in useQueue
      console.error('Failed to reorder queue:', error);
    }
  }, [queue, reorderQueue]);

  return {
    isDragging,
    handleDragStart,
    handleDragEnd
  };
} 