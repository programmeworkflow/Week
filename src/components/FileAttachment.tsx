import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProjectAttachment } from "@/lib/mock-data";
import { Paperclip, Download, Trash2, FileText, Image, File } from "lucide-react";

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return <Image className="w-4 h-4 text-primary" />;
  if (type.includes("pdf") || type.includes("word") || type.includes("document")) return <FileText className="w-4 h-4 text-primary" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface FileAttachmentButtonProps {
  onAttach: (attachment: Omit<ProjectAttachment, "id">) => void;
  userId: string;
  compact?: boolean;
}

export const FileAttachmentButton = ({ onAttach, userId, compact }: FileAttachmentButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      onAttach({
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
      });
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv" />
      {compact ? (
        <Button size="icon" variant="outline" onClick={() => inputRef.current?.click()} className="shrink-0 rounded-xl" title="Anexar arquivo">
          <Paperclip className="w-4 h-4" />
        </Button>
      ) : (
        <Button variant="outline" onClick={() => inputRef.current?.click()} className="gap-2 text-sm rounded-xl">
          <Paperclip className="w-4 h-4" /> Anexar arquivo
        </Button>
      )}
    </>
  );
};

interface FileAttachmentListProps {
  attachments: ProjectAttachment[];
  onRemove?: (id: string) => void;
  compact?: boolean;
}

export const FileAttachmentList = ({ attachments, onRemove, compact }: FileAttachmentListProps) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {attachments.map((att) => (
        <div key={att.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50 group">
          {getFileIcon(att.type)}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{att.name}</p>
            <p className="text-[10px] text-muted-foreground">{formatSize(att.size)}</p>
          </div>
          <a href={att.url} download={att.name} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded">
              <Download className="w-3 h-3" />
            </Button>
          </a>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={() => onRemove(att.id)} className="h-6 w-6 rounded opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
