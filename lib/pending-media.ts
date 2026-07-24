export interface PendingMedia {
  mediaId: string;
  mediaUrl: string;
  contentText: string;
  eventType: 'receipt' | 'voice_transcript' | 'note' | 'inspection' | 'payment';
  category: string;
  parsedData?: Record<string, unknown>;
  isForwarded?: boolean;
}

const pendingMediaMap = new Map<string, PendingMedia>();

export function storePendingMedia(item: PendingMedia): void {
  pendingMediaMap.set(item.mediaId, item);
}

export function getPendingMedia(mediaId: string): PendingMedia | undefined {
  return pendingMediaMap.get(mediaId);
}

export function deletePendingMedia(mediaId: string): void {
  pendingMediaMap.delete(mediaId);
}
