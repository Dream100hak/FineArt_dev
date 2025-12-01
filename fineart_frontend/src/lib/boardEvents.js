export const BOARDS_UPDATED_EVENT = 'fineart:boards-updated';

export const notifyBoardsUpdated = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(BOARDS_UPDATED_EVENT));
};
