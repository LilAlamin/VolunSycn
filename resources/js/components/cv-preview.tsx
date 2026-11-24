import {
    AlertCircle,
    Download,
    ExternalLink,
    FileText,
    Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type CvPreviewProps = {
    url: string;
    filename?: string | null;
};

const getExtension = (filename?: string | null): string => {
    if (!filename) return '';
    const parts = filename.toLowerCase().split('.');
    return parts.length > 1 ? (parts.pop() ?? '') : '';
};

const buildDocxSrcDoc = (bodyHtml: string): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 28px 32px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
    font-size: 13.5px;
    line-height: 1.65;
    color: #18181b;
    background: #ffffff;
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }
  h1, h2, h3, h4 {
    color: #09090b;
    margin: 1.1em 0 0.45em;
    line-height: 1.3;
  }
  h1 { font-size: 1.45em; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px; }
  h2 { font-size: 1.2em; }
  h3 { font-size: 1.05em; }
  p { margin: 0 0 0.7em; }
  ul, ol { margin: 0.3em 0 0.8em; padding-left: 1.4em; }
  li { margin-bottom: 0.25em; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.9em 0;
    font-size: 12.5px;
  }
  th, td {
    border: 1px solid #d4d4d8;
    padding: 6px 9px;
    text-align: left;
    vertical-align: top;
  }
  th { background: #f4f4f5; font-weight: 600; }
  img { max-width: 100%; height: auto; }
  a { color: #0f766e; }
</style>
</head>
<body>${bodyHtml || '<p style="color:#71717a;">(Document appears to be empty)</p>'}</body>
</html>`;

export function CvPreview({ url, filename }: CvPreviewProps) {
    const ext = getExtension(filename);
    const isPdf = ext === 'pdf';
    const isDocx = ext === 'docx';

    const [docxHtml, setDocxHtml] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isDocx) {
            setDocxHtml(null);
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);
        setDocxHtml(null);

        (async () => {
            try {
                const res = await fetch(url, { credentials: 'same-origin' });
                if (!res.ok) {
                    throw new Error(`Failed to fetch CV (${res.status})`);
                }
                const arrayBuffer = await res.arrayBuffer();
                const mammoth = await import('mammoth');
                const result = await mammoth.convertToHtml({ arrayBuffer });
                if (!cancelled) {
                    setDocxHtml(buildDocxSrcDoc(result.value));
                }
            } catch {
                if (!cancelled) {
                    setError(
                        'Unable to render DOCX preview in browser. You can still download the file directly.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [url, isDocx]);

    const fileTypeLabel = ext ? ext.toUpperCase() : 'FILE';

    return (
        <div className="flex h-full min-h-[380px] min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
            {/* Toolbar */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <FileText className="size-4 shrink-0 text-primary" />
                    <span
                        className="truncate text-xs font-medium text-foreground"
                        title={filename || 'Applicant CV'}
                    >
                        {filename || 'Applicant CV'}
                    </span>
                    <Badge
                        variant="outline"
                        className="shrink-0 px-1.5 py-0 font-mono text-[10px]"
                    >
                        {fileTypeLabel}
                    </Badge>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    {isPdf && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            asChild
                        >
                            <a href={url} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-1 size-3.5" />
                                Open
                            </a>
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        asChild
                    >
                        <a href={`${url}?download=1`} title="Download CV">
                            <Download className="mr-1 size-3.5" />
                            Download
                        </a>
                    </Button>
                </div>
            </div>

            {/* Preview Viewport */}
            <div className="relative flex min-h-0 flex-1 flex-col bg-muted/30">
                {isPdf ? (
                    <iframe
                        src={url}
                        title={filename || 'PDF CV Preview'}
                        className="h-full min-h-[420px] w-full flex-1 border-0 bg-white"
                    />
                ) : isDocx ? (
                    loading ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
                            <Loader2 className="size-5 animate-spin text-primary" />
                            <span>Rendering DOCX preview...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                            <AlertCircle className="size-8 text-muted-foreground" />
                            <p className="max-w-xs text-xs text-muted-foreground">
                                {error}
                            </p>
                            <Button size="sm" asChild>
                                <a href={`${url}?download=1`}>
                                    <Download className="mr-1.5 size-3.5" />
                                    Download CV
                                </a>
                            </Button>
                        </div>
                    ) : docxHtml ? (
                        <iframe
                            srcDoc={docxHtml}
                            sandbox=""
                            title={filename || 'DOCX CV Preview'}
                            className="h-full min-h-[420px] w-full flex-1 border-0 bg-white"
                        />
                    ) : null
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                        <FileText className="size-9 text-muted-foreground/70" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                                In-browser preview unavailable for .
                                {ext || 'file'}
                            </p>
                            <p className="max-w-xs text-xs text-muted-foreground">
                                Download the file to inspect this CV locally.
                                PDF and DOCX files support live inline preview.
                            </p>
                        </div>
                        <Button size="sm" asChild>
                            <a href={`${url}?download=1`}>
                                <Download className="mr-1.5 size-3.5" />
                                Download CV
                            </a>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

