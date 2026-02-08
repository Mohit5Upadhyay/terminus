// File Viewer - Component to display file content 
import { Copy, Check, FileText, Pencil, Save, XCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { fs } from "@/lib/ipc";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

export interface FileViewerProps {
    path: string;
    content: string;
    isJson?: boolean;
    data?: any;
}

const EDITABLE_EXTENSIONS = new Set([
    'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'htm',
    'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env', 'sh',
    'bash', 'zsh', 'fish', 'py', 'rb', 'rs', 'go', 'java', 'c', 'cpp',
    'h', 'hpp', 'cs', 'swift', 'kt', 'dart', 'lua', 'sql', 'graphql',
    'svelte', 'vue', 'astro', 'prisma', 'dockerfile', 'makefile',
    'gitignore', 'editorconfig', 'prettierrc', 'eslintrc',
]);

function isEditable(filePath: string): boolean {
    const filename = filePath.split('/').pop()?.toLowerCase() || '';
    if (EDITABLE_EXTENSIONS.has(filename)) return true;
    const ext = filename.split('.').pop() || '';
    return EDITABLE_EXTENSIONS.has(ext);
}


export function FileViewer({ path, content, isJson, data }: FileViewerProps) {
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus textarea when entering edit mode
    useEffect(() => {
        if (editing && textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            textareaRef.current.setSelectionRange(
                textareaRef.current.value.length,
                textareaRef.current.value.length
            );
        }
    }, [editing]);

    // Safety checks for undefined props
    if (!path || !content) {
        return (
            <div className="file-viewer">
                <div className="file-viewer-header">
                    <div className="file-info">
                        <FileText size={16} className="file-icon" />
                        <span className="filename">Error</span>
                    </div>
                </div>
                <div className="file-content">
                    <pre className="code-block">
                        <code>Error: Missing required props (path or content)</code>
                    </pre>
                </div>
            </div>
        );
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(editing ? editContent : content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEdit = () => {
        setEditContent(content);
        setEditing(true);
        setSaveStatus('idle');
        setErrorMsg('');
    };

    const handleCancel = () => {
        setEditing(false);
        setEditContent(content);
        setSaveStatus('idle');
        setErrorMsg('');
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus('idle');
        setErrorMsg('');
        try {
            await fs.writeFile(path, editContent);
            setSaveStatus('saved');
            setEditing(false);
            // Update the displayed content by forcing re-render
            // The parent should ideally refetch, but we update local state
            setTimeout(() => setSaveStatus('idle'), 2500);
        } catch (err) {
            setSaveStatus('error');
            setErrorMsg((err as Error).message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    // Handle Cmd/Ctrl+S to save
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            handleCancel();
        }
        // Tab key inserts spaces
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newValue = editContent.substring(0, start) + '  ' + editContent.substring(end);
                setEditContent(newValue);
                // Restore cursor position
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 2;
                }, 0);
            }
        }
    };

    // Determine language for syntax highlighting
    const getLanguage = () => {
        if (isJson || path.endsWith('.json')) return 'json';
        if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
        if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
        if (path.endsWith('.py')) return 'python';
        if (path.endsWith('.css')) return 'css';
        if (path.endsWith('.html')) return 'html';
        if (path.endsWith('.md')) return 'markdown';
        if (path.endsWith('.sh') || path.endsWith('.bash')) return 'bash';
        return 'plaintext';
    };

    const displayContent = isJson && data
        ? JSON.stringify(data, null, 2)
        : (saveStatus === 'saved' ? editContent : content);

    const language = getLanguage();

    let highlightedCode = displayContent;
    try {
        if (language !== 'plaintext') {
            highlightedCode = hljs.highlight(displayContent, { language }).value;
        }
    } catch (e) {
        console.warn('Syntax highlighting failed:', e);
    }

    const filename = path.split('/').pop() || path;
    const canEdit = isEditable(path);

    return (
        <div className={`file-viewer ${editing ? 'editing' : ''}`}>
            {/* Header */}
            <div className="file-viewer-header">
                <div className="file-info">
                    <FileText size={16} className="file-icon" />
                    <span className="filename">{filename}</span>
                    <span className="filepath">{path}</span>
                </div>
                <div className="file-actions">
                    {editing ? (
                        <>
                            <button
                                className="save-btn"
                                onClick={handleSave}
                                disabled={saving}
                                title="Save (⌘S)"
                            >
                                <Save size={14} />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                className="cancel-btn"
                                onClick={handleCancel}
                                title="Cancel (Esc)"
                            >
                                <XCircle size={14} />
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            {canEdit && (
                                <button
                                    className="edit-btn"
                                    onClick={handleEdit}
                                    title="Edit file"
                                >
                                    <Pencil size={14} />
                                    Edit
                                </button>
                            )}
                            <button
                                className="copy-btn"
                                onClick={handleCopy}
                                title="Copy to clipboard"
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Save status banner */}
            {saveStatus === 'saved' && (
                <div className="file-save-banner success">
                    <Check size={14} />
                    File saved successfully
                </div>
            )}
            {saveStatus === 'error' && (
                <div className="file-save-banner error">
                    <XCircle size={14} />
                    {errorMsg || 'Failed to save file'}
                </div>
            )}

            {/* Content */}
            <div className="file-content">
                {editing ? (
                    <textarea
                        ref={textareaRef}
                        className="file-editor"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        spellCheck={false}
                    />
                ) : (
                    <pre className="code-block">
                        <code
                            className={`hljs language-${language}`}
                            dangerouslySetInnerHTML={{ __html: highlightedCode }}
                        />
                    </pre>
                )}
            </div>

            <div className="file-footer">
                <span className="file-type">{language.toUpperCase()}</span>
                {editing && <span className="file-editing-indicator">EDITING</span>}
                <span className="file-size">{(editing ? editContent : displayContent).length} characters</span>
                <span className="file-lines">{(editing ? editContent : displayContent).split('\n').length} lines</span>
                {editing && <span className="file-shortcut">⌘S Save · Esc Cancel · Tab Indent</span>}
            </div>
        </div>
    );
}
