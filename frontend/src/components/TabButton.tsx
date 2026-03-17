type TabButtonProps = {
    label: string;
    active: boolean;
    onClick: () => void;
};

export function TabButton({ label, active, onClick }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`tab-button ${active ? "tab-button--active" : ""}`}
        >
            {label}
        </button>
    );
}