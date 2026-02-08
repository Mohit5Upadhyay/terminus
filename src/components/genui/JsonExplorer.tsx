// Json Explorer - Component to display JSON data in an interactive tree format
import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";

interface JsonExplorerProps {
    data: unknown;
    source: string;
}

interface JsonNodeProps {
    keyName?: string;
    value: unknown;
    depth: number;
    isLast: boolean;
}

function getValueType(value: unknown): string {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
}

function getValueColor(type: string): string {
    switch (type) {
        case "string":
            return "var(--terminus-green)";
        case "number":
            return "var(--terminus-cyan)";
        case "boolean":
            return "var(--terminus-yellow)";
        case "null":
            return "var(--terminus-red)";
        default:
            return "var(--terminus-fg)";
    }
}

function JsonNode({ keyName, value, depth, isLast }: JsonNodeProps) {
    const [isExpanded, setIsExpanded] = useState(depth < 2);
    const type = getValueType(value);
    const isExpandable = type === "object" || type === "array";
    const indent = depth * 16;

    const handleToggle = useCallback(() => {
        if (isExpandable) {
            setIsExpanded((prev) => !prev);
        }
    }, [isExpandable]);

    const renderValue = () => {
        if (type === "string") {
            return <span style={{ color: getValueColor(type) }}>"{value as string}"</span>;
        }
        if (type === "number" || type === "boolean") {
            return <span style={{ color: getValueColor(type) }}>{String(value)}</span>;
        }
        if (type === "null") {
            return <span style={{ color: getValueColor(type) }}>null</span>;
        }
        return null;
    };

    if (!isExpandable) {
        return (
            <div className="json-node" style={{ paddingLeft: indent }}>
                {keyName !== undefined && (
                    <span className="json-key">"{keyName}": </span>
                )}
                {renderValue()}
                {!isLast && <span className="json-comma">,</span>}
            </div>
        );
    }

    const entries = type === "array"
        ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
        : Object.entries(value as object);

    const bracket = type === "array" ? ["[", "]"] : ["{", "}"];

    return (
        <div className="json-node-expandable">
            <div
                className="json-node json-toggle"
                style={{ paddingLeft: indent }}
                onClick={handleToggle}
            >
                <span className="json-chevron">
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                {keyName !== undefined && (
                    <span className="json-key">"{keyName}": </span>
                )}
                <span className="json-bracket">{bracket[0]}</span>
                {!isExpanded && (
                    <>
                        <span className="json-ellipsis">
                            {entries.length} {type === "array" ? "items" : "keys"}
                        </span>
                        <span className="json-bracket">{bracket[1]}</span>
                        {!isLast && <span className="json-comma">,</span>}
                    </>
                )}
            </div>
            {isExpanded && (
                <>
                    {entries.map(([k, v], i) => (
                        <JsonNode
                            key={k}
                            keyName={type === "array" ? undefined : k}
                            value={v}
                            depth={depth + 1}
                            isLast={i === entries.length - 1}
                        />
                    ))}
                    <div className="json-node" style={{ paddingLeft: indent }}>
                        <span className="json-bracket">{bracket[1]}</span>
                        {!isLast && <span className="json-comma">,</span>}
                    </div>
                </>
            )}
        </div>
    );
}

export function JsonExplorer({ data, source }: JsonExplorerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="json-explorer">
            <div className="json-explorer-header">
                <span className="json-source">{source}</span>
                <button className="json-copy-btn" onClick={handleCopy}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <div className="json-tree">
                <JsonNode value={data} depth={0} isLast={true} />
            </div>
        </div>
    );
}
