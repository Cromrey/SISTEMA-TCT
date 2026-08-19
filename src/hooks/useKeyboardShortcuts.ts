import { useEffect } from 'react';
import { getStoredShortcuts, matchesShortcut } from '../utils/shortcutsStorage';

export interface ShortcutHandlers {
  onNewProject?: () => void;
  onFocusSearch?: () => void;
  onOpenCalendar?: () => void;
  onOpenTimeline?: () => void;
  onOpenExecutive?: () => void;
  onOpenAnalytics?: () => void;
  onExportPdf?: () => void;
  onOpenRules?: () => void;
  onToggleViewList?: () => void;
  onFilterDueSoon?: () => void;
  onFilterThisWeek?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing inside an input/textarea/select UNLESS it's an Escape or global Ctrl combo
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

      const shortcuts = getStoredShortcuts();

      for (const sc of shortcuts) {
        if (!sc.enabled || !sc.keys) continue;

        if (matchesShortcut(e, sc.keys)) {
          // If inside input and not a Ctrl/Alt combo, let native typing occur
          if (isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
            continue;
          }

          e.preventDefault();
          e.stopPropagation();

          switch (sc.actionId) {
            case 'open_new_project':
              handlers.onNewProject?.();
              break;
            case 'focus_search':
              handlers.onFocusSearch?.();
              break;
            case 'open_calendar':
              handlers.onOpenCalendar?.();
              break;
            case 'open_timeline':
              handlers.onOpenTimeline?.();
              break;
            case 'open_executive':
              handlers.onOpenExecutive?.();
              break;
            case 'open_analytics':
              handlers.onOpenAnalytics?.();
              break;
            case 'export_pdf':
              handlers.onExportPdf?.();
              break;
            case 'open_rules':
              handlers.onOpenRules?.();
              break;
            case 'toggle_view_list':
              handlers.onToggleViewList?.();
              break;
            case 'filter_due_soon':
              handlers.onFilterDueSoon?.();
              break;
            case 'filter_this_week':
              handlers.onFilterThisWeek?.();
              break;
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handlers]);
}
