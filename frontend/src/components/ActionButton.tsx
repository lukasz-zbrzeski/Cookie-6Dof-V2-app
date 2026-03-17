type ActionButtonProps = {
    label: string;
    variant?: "default" | "danger" | "ghost";
    circle?: boolean;
    pressed?: boolean;
    disabled?: boolean;
    onClick?: () => void;
};

export function ActionButton({
                                 label,
                                 variant = "default",
                                 circle = false,
                                 pressed = false,
                                 disabled = false,
                                 onClick,
                             }: ActionButtonProps) {
    const className = [
        "action-button",
        `action-button--${variant}`,
        circle ? "action-button--circle" : "",
        pressed ? "action-button--pressed" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button className={className} onClick={onClick} disabled={disabled}>
            {label}
        </button>
    );
}