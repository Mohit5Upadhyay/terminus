import { Loader2 } from "lucide-react";

interface LoadingStateProps {
    message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
    return (
        <div className="genui-loading">
            <Loader2 size={16} className="spin" />
            <span>{message}</span>
        </div>
    );
}
