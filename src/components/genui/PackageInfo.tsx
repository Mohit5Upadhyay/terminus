// Package Info - Component to display package.json information in a structured format
import { Package, Play, ExternalLink, AlertCircle } from "lucide-react";

interface PackageInfoProps {
    data?: Record<string, unknown>;
    path?: string;
}

export function PackageInfo({ data, path }: PackageInfoProps) {
    if (!data || typeof data !== 'object') {
        return (
            <div className="package-info">
                <div className="package-header">
                    <AlertCircle size={20} />
                    <div className="package-title">
                        <h3 className="package-name">No package data</h3>
                    </div>
                </div>
                <p className="package-description">
                    Could not load package.json data. {path ? `Path: ${path}` : ''}
                </p>
            </div>
        );
    }

    const name = (data.name as string) || 'Unknown Package';
    const version = (data.version as string) || '0.0.0';
    const description = data.description as string;
    const scripts = (data.scripts || {}) as Record<string, string>;
    const dependencies = (data.dependencies || {}) as Record<string, string>;
    const devDependencies = (data.devDependencies || {}) as Record<string, string>;
    const license = data.license as string | undefined;

    const scriptEntries = Object.entries(scripts).slice(0, 6);
    const depEntries = Object.entries(dependencies);
    const devDepEntries = Object.entries(devDependencies);

    return (
        <div className="package-info">
            <div className="package-header">
                <Package size={20} />
                <div className="package-title">
                    <h3 className="package-name">{name}</h3>
                    <span className="package-version">v{version}</span>
                </div>
                {license && <span className="package-license">{license}</span>}
            </div>

            {description && (
                <p className="package-description">{description}</p>
            )}

            {scriptEntries.length > 0 && (
                <div className="package-section">
                    <h4>Scripts</h4>
                    <div className="package-scripts">
                        {scriptEntries.map(([name, cmd]) => (
                            <div key={name} className="script-item">
                                <Play size={12} />
                                <code className="script-name">npm run {name}</code>
                                <span className="script-cmd" title={cmd}>
                                    {cmd.length > 40 ? cmd.slice(0, 40) + "..." : cmd}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="package-deps-grid">
                {depEntries.length > 0 && (
                    <div className="package-section">
                        <h4>Dependencies ({depEntries.length})</h4>
                        <div className="dep-list">
                            {depEntries.slice(0, 8).map(([name, version]) => (
                                <a
                                    key={name}
                                    className="dep-item"
                                    href={`https://www.npmjs.com/package/${name}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="dep-name">{name}</span>
                                    <span className="dep-version">{version}</span>
                                    <ExternalLink size={10} />
                                </a>
                            ))}
                            {depEntries.length > 8 && (
                                <span className="dep-more">+{depEntries.length - 8} more</span>
                            )}
                        </div>
                    </div>
                )}

                {devDepEntries.length > 0 && (
                    <div className="package-section">
                        <h4>Dev Dependencies ({devDepEntries.length})</h4>
                        <div className="dep-list">
                            {devDepEntries.slice(0, 6).map(([name, version]) => (
                                <a
                                    key={name}
                                    className="dep-item dev"
                                    href={`https://www.npmjs.com/package/${name}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="dep-name">{name}</span>
                                    <span className="dep-version">{version}</span>
                                    <ExternalLink size={10} />
                                </a>
                            ))}
                            {devDepEntries.length > 6 && (
                                <span className="dep-more">+{devDepEntries.length - 6} more</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
