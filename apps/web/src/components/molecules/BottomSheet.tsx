'use client';

import { useRef, useEffect } from 'react';
import { AnimatePresence, motion, useMotionValue, useDragControls } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils/cn';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /**
   * Snap points as fractions of viewport height: [0.5] or [0.5, 0.92].
   * First value = initial snap, last value = max expansion.
   * Default: [0.92]
   */
  snapPoints?: number[];
  showHandle?: boolean;
  className?: string;
}

const SPRING = { type: 'spring', stiffness: 400, damping: 40 } as const;
const CLOSE_VELOCITY_THRESHOLD = 400;

export function BottomSheet({
  isOpen, onClose, title, children, snapPoints = [0.92], showHandle = true, className,
}: BottomSheetProps) {
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  // Index into snapPoints; 0 = first (smallest), last = fully open
  const snapIndexRef = useRef(snapPoints.length - 1);

  // Reset snap to last (fully open) when sheet opens
  useEffect(() => {
    if (isOpen) {
      snapIndexRef.current = snapPoints.length - 1;
      y.set(0);
    }
  }, [isOpen, snapPoints.length, y]);

  function getSnapY(index: number): number {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    // snapPoints[index] = fraction of vh that the sheet OCCUPIES
    // y-offset from bottom = 0 means fully shown at max height (maxH = snapPoints[last] * vh)
    // To snap to smaller point: y = (snapPoints[last] - snapPoints[index]) * vh
    const maxFraction = snapPoints[snapPoints.length - 1];
    const targetFraction = snapPoints[index];
    return (maxFraction - targetFraction) * vh;
  }

  function handleDragEnd(_: unknown, info: { velocity: { y: number }; offset: { y: number } }) {
    const vy = info.velocity.y;
    const oy = info.offset.y;

    // Fast downward flick → close
    if (vy > CLOSE_VELOCITY_THRESHOLD) {
      onClose();
      return;
    }

    // Find nearest snap point
    const currentY = (y.get() as number);
    const vh = window.innerHeight;

    let closestIndex = snapIndexRef.current;
    let closestDist = Infinity;

    snapPoints.forEach((_, i) => {
      const snapY = getSnapY(i);
      const dist = Math.abs(currentY + oy - snapY);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });

    // If dragged below lowest snap point threshold → close
    const lowestSnapY = getSnapY(0);
    if (currentY + oy > lowestSnapY + vh * 0.1) {
      onClose();
      return;
    }

    snapIndexRef.current = closestIndex;
    y.set(getSnapY(closestIndex));
  }

  const maxHeightFraction = snapPoints[snapPoints.length - 1];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 z-40"
                onClick={onClose}
              />
            </Dialog.Overlay>

            {/* Sheet */}
            <Dialog.Content asChild forceMount>
              <motion.div
                ref={sheetRef}
                initial={{ y: '100%' }}
                animate={{ y: 0, transition: SPRING }}
                exit={{ y: '100%', transition: SPRING }}
                style={{
                  y,
                  maxHeight: `${maxHeightFraction * 100}dvh`,
                }}
                drag="y"
                dragControls={dragControls}
                dragConstraints={{ top: 0 }}
                dragElastic={0.08}
                onDragEnd={handleDragEnd}
                className={cn(
                  'fixed inset-x-0 bottom-0 z-50',
                  'glass-sheet rounded-t-[20px]',
                  'flex flex-col',
                  'pb-[var(--safe-bottom)]',
                  className,
                )}
              >
                {/* Drag handle */}
                {showHandle && (
                  <div
                    className="sheet-handle cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={(e) => dragControls.start(e)}
                  />
                )}

                {/* Header */}
                {title && (
                  <Dialog.Title className="text-base font-semibold text-center py-4 px-6 text-[var(--label-primary)] shrink-0">
                    {title}
                  </Dialog.Title>
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
