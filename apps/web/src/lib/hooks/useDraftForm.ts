'use client';

import { useEffect, useRef, useState } from 'react';
import { saveDraft, getDraft, deleteDraft, type DraftType } from '@/lib/offline/drafts';

/**
 * Persists form state to IndexedDB while the user is offline or mid-fill.
 * Call `clearDraft()` after successful server submission.
 */
export function useDraftForm<T extends object>(
  type: DraftType,
  draftId: string,
  initial: T,
) {
  const [values, setValues] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft on mount
  useEffect(() => {
    getDraft<T>(draftId).then(draft => {
      if (draft && !draft.synced) {
        setValues(draft.data);
      }
      setRestored(true);
    }).catch(() => setRestored(true));
  }, [draftId]);

  // Debounced auto-save whenever values change (after restoration)
  useEffect(() => {
    if (!restored) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraft(type, values, draftId).catch(() => {/* ignore write errors */});
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [values, restored, type, draftId]);

  function clearDraft() {
    deleteDraft(draftId).catch(() => {});
  }

  return { values, setValues, restored, clearDraft };
}
