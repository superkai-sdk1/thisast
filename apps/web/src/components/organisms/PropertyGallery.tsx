'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PropertyPhoto } from '@crm/shared-types';

interface PropertyGalleryProps {
  photos: PropertyPhoto[];
  className?: string;
}

export function PropertyGallery({ photos, className }: PropertyGalleryProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  if (!photos.length) {
    return (
      <div className={cn('bg-[var(--fill-tertiary)] flex items-center justify-center rounded-[22px]', className)}>
        <span className="text-[var(--label-tertiary)] text-sm">Нет фото</span>
      </div>
    );
  }

  function paginate(dir: number) {
    setDirection(dir);
    setIndex((i) => (i + dir + photos.length) % photos.length);
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div className={cn('relative overflow-hidden rounded-[22px]', className)}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className="absolute inset-0"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80) paginate(1);
            else if (info.offset.x > 80) paginate(-1);
          }}
        >
          <Image
            src={photos[index].url}
            alt={`Фото ${index + 1}`}
            fill
            unoptimized
            className="object-cover"
            priority={index === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next */}
      {photos.length > 1 && (
        <>
          <button
            onClick={() => paginate(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50',
              )}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      <span className="absolute top-3 right-3 z-10 text-xs text-white font-medium bg-black/30 rounded-full px-2 py-0.5">
        {index + 1} / {photos.length}
      </span>
    </div>
  );
}
