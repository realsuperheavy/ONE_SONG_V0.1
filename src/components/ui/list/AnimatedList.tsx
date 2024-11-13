'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useDebouncedCallback } from 'use-debounce';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface AnimatedListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function AnimatedList<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  className
}: AnimatedListProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const reorderTimeoutRef = useRef<NodeJS.Timeout>();

  const handleReorder = useDebouncedCallback(
    (newOrder: T[]) => {
      onReorder(newOrder);
      analyticsService.trackEvent('list_reordered', {
        itemCount: newOrder.length
      });
    },
    500
  );

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    },
    drag: {
      scale: 1.02,
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={handleReorder}
      className={className}
      as={motion.div}
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {items.map((item) => (
          <Reorder.Item
            key={keyExtractor(item)}
            value={item}
            as={motion.div}
            variants={itemVariants}
            dragListener
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            whileDrag="drag"
            layoutId={keyExtractor(item)}
          >
            {renderItem(item)}
          </Reorder.Item>
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
} 