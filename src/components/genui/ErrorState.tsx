import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function ErrorState({ title, message, action }: ErrorStateProps) {
    return (
        <div className="genui-error">
            <AlertCircle size={16} />
            <div className="error-content">
                <strong>{title}</strong>
                <p>{message}</p>
                {action && (
                    <button onClick={action.onClick} className="error-action">
                        {action.label}
                    </button>
                )}
            </div>
        </div>
    );
}
