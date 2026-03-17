import { AlertTriangle } from "lucide-react";

type PlaceholderTabProps = {
    title: string;
    description: string;
};

export function PlaceholderTab({ title, description }: PlaceholderTabProps) {
    return (
        <div className="placeholder-tab">
            <div>
                <div className="placeholder-tab__icon">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="placeholder-tab__title">{title}</h2>
                <p className="placeholder-tab__description">{description}</p>
            </div>
        </div>
    );
}