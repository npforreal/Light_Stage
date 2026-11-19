export type ShortcutCategory = 'playback' | 'navigation' | 'edit' | 'vx' | 'system' | 'layout';

export interface ShortcutDefinition {
  id: string;
  label: string;
  description: string;
  category: ShortcutCategory;
  key: string;
  code?: string;
  modifiers?: {
    ctrlOrMeta?: boolean;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  isReserved?: boolean;
  reservedFor?: string;
}

export const SYSTEM_SHORTCUTS: readonly ShortcutDefinition[] = Object.freeze([
  { id: 'go_space', label: 'Kích hoạt GO (Space)', description: 'Chạy cue đang Standby', category: 'playback', key: ' ', code: 'Space' },
  { id: 'go_enter', label: 'Kích hoạt GO (Enter)', description: 'Chạy cue đang Standby', category: 'playback', key: 'Enter', code: 'Enter' },
  { id: 'standby_next', label: 'Chuẩn bị kế tiếp (B)', description: 'Đưa cue kế tiếp vào Standby', category: 'playback', key: 'b', code: 'KeyB' },
  { id: 'hold_cue', label: 'Tạm dừng (Escape)', description: 'Tạm giữ cue đang phát', category: 'playback', key: 'Escape', code: 'Escape' },
  { id: 'next_cue', label: 'Cue kế tiếp (↓)', description: 'Di chuyển xuống cue tiếp theo', category: 'navigation', key: 'ArrowDown', code: 'ArrowDown' },
  { id: 'prev_cue', label: 'Cue trước đó (↑)', description: 'Di chuyển lên cue trước', category: 'navigation', key: 'ArrowUp', code: 'ArrowUp' },
  { id: 'open_help', label: 'Trợ giúp (?)', description: 'Mở bảng cẩm nang phím tắt', category: 'system', key: '?', code: 'Slash', modifiers: { shift: true } },
  { id: 'clear_vx_bg', label: 'Panic Xóa Nền (F1)', description: 'Tắt layer Background của VX', category: 'vx', key: 'F1', code: 'F1' },
  { id: 'clear_vx_slide', label: 'Panic Xóa Slide (F2)', description: 'Tắt layer Slide của VX', category: 'vx', key: 'F2', code: 'F2' },
  { id: 'clear_vx_overlay', label: 'Panic Xóa Overlay (F3)', description: 'Tắt layer Overlay của VX', category: 'vx', key: 'F3', code: 'F3' },
  { id: 'clear_vx_all', label: 'Panic Xóa Tất cả VX (F4)', description: 'Tắt toàn bộ layer VX', category: 'vx', key: 'F4', code: 'F4' },
  { id: 'freeze_vx', label: 'Freeze Output (Alt+F)', description: 'Đóng băng màn hình LED', category: 'vx', key: 'f', code: 'KeyF', modifiers: { alt: true } },
  { id: 'undo', label: 'Hoàn tác (Ctrl+Z)', description: 'Khôi phục thao tác trước', category: 'edit', key: 'z', code: 'KeyZ', modifiers: { ctrlOrMeta: true } },
  { id: 'redo_ctrl_y', label: 'Làm lại (Ctrl+Y)', description: 'Lấy lại thao tác vừa hoàn tác', category: 'edit', key: 'y', code: 'KeyY', modifiers: { ctrlOrMeta: true } },
  { id: 'redo_shift_z', label: 'Làm lại (Ctrl+Shift+Z)', description: 'Lấy lại thao tác vừa hoàn tác', category: 'edit', key: 'z', code: 'KeyZ', modifiers: { ctrlOrMeta: true, shift: true } },
  { id: 'save_show', label: 'Lưu dự án (Ctrl+S)', description: 'Lưu trạng thái show hiện tại', category: 'system', key: 's', code: 'KeyS', modifiers: { ctrlOrMeta: true } },
  {
    id: 'inspector_drawer',
    label: 'Inspector Drawer (I)',
    description: 'Mở/đóng Right Inspector Drawer',
    category: 'layout',
    key: 'i',
    code: 'KeyI',
    isReserved: true,
    reservedFor: 'Round 15: Right Inspector Drawer (CueInspector.tsx)',
  },
]);

/** Chuẩn hóa signature đại diện cho một tổ hợp phím để so sánh xung đột */
export function normalizeShortcutSignature(s: Pick<ShortcutDefinition, 'key' | 'modifiers'>): string {
  const parts: string[] = [];
  if (s.modifiers?.ctrlOrMeta || s.modifiers?.ctrl || s.modifiers?.meta) parts.push('CTRL');
  if (s.modifiers?.alt) parts.push('ALT');
  if (s.modifiers?.shift) parts.push('SHIFT');

  const trimmed = s.key.trim();
  const rawKey = (trimmed === '' ? 'SPACE' : trimmed).toUpperCase();
  const normalizedKey = rawKey === ' ' || rawKey === 'SPACE' ? 'SPACE' : rawKey;
  parts.push(normalizedKey);
  return parts.join('+');
}

export interface CollisionReport {
  hasCollisions: boolean;
  collisions: Array<{
    signature: string;
    shortcuts: Array<{ id: string; label: string }>;
  }>;
}

/** Quét phát hiện xung đột giữa các hành động trong hệ thống */
export function detectShortcutCollisions(shortcuts: readonly ShortcutDefinition[]): CollisionReport {
  const map = new Map<string, Array<{ id: string; label: string }>>();

  for (const item of shortcuts) {
    const sig = normalizeShortcutSignature(item);
    const existing = map.get(sig) || [];
    existing.push({ id: item.id, label: item.label });
    map.set(sig, existing);
  }

  const collisions: CollisionReport['collisions'] = [];
  for (const [signature, items] of map.entries()) {
    if (items.length > 1) {
      collisions.push({ signature, shortcuts: items });
    }
  }

  return {
    hasCollisions: collisions.length > 0,
    collisions,
  };
}

/** Bộ lọc bảo vệ: Kiểm tra xem con trỏ bàn phím có nằm trong đối tượng nhập liệu không */
export function isEditableTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;

  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'option') return true;

  // DOM standard property (true if element or ancestor is editable)
  if (el.isContentEditable) return true;

  // Traverse parent chain for contenteditable attribute or property (handles DOM & JSDOM environments)
  let curr: HTMLElement | null = el;
  while (curr) {
    if (curr.isContentEditable) return true;
    if (curr.contentEditable === 'true' || curr.contentEditable === '' || curr.contentEditable === 'plaintext-only') return true;
    const rawAttr = curr.getAttribute('contenteditable');
    if (rawAttr !== null) {
      const attr = rawAttr.toLowerCase().trim();
      if (attr === 'true' || attr === '' || attr === 'plaintext-only') return true;
    }
    if (curr.tagName.toLowerCase() === 'select') return true;
    curr = curr.parentElement;
  }

  return false;
}

export function isKeyboardProtected(e: KeyboardEvent): boolean {
  return isEditableTarget(e.target) || isEditableTarget(typeof document !== 'undefined' ? document.activeElement : null);
}
