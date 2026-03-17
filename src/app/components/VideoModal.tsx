import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Eye } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  title: string;
  viewCount?: string;
}

export function VideoModal({ isOpen, onClose, videoId, title, viewCount }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="p-0 bg-black border-none [&>button[data-slot]]:hidden [&>.absolute]:hidden"
        style={{
          maxWidth: 'min(1280px, 95vw)',
          width: 'min(1280px, 95vw)',
        }}
        aria-describedby={undefined}
      >
        {/* 접근성을 위한 숨김 타이틀 */}
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* 상단 바 — 민주당 블루 */}
        {title && (
          <div
            className="flex items-center justify-between px-4"
            style={{ background: '#002BFF', height: 40 }}
          >
            <span className="text-white text-sm truncate" style={{ fontWeight: 600 }}>
              {title}
            </span>
            {viewCount && (
              <span className="flex items-center gap-1 text-white/80 text-xs shrink-0 ml-3">
                <Eye size={13} />
                <span>조회수 {viewCount}</span>
              </span>
            )}
          </div>
        )}

        {/* 영상 */}
        <div
          className="relative w-full"
          style={{ paddingTop: 'min(56.25%, calc(90vh - 80px))' }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        {/* 하단 바 — 민주당 블루 (상단과 동일 높이) */}
        <div style={{ background: '#002BFF', height: 40 }} />
      </DialogContent>
    </Dialog>
  );
}