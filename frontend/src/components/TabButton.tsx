type TabButtonProps = {
    label: string;
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
};

export function TabButton({
    label,
    active,
    disabled = false,
    onClick,
                          }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`tab-button ${active ? "tab-button--active" : ""}`}
        >
            {label}
        </button>
    );
}