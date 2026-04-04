type ValueFieldProps = {
    value: number;
    editable?: boolean;
    disabled?: boolean;
    onIncrement?: () => void;
    onDecrement?: () => void;
    onIncrementPress?: () => void;
    onIncrementRelease?: () => void;
    onDecrementPress?: () => void;
    onDecrementRelease?: () => void;
};

const formatFloat = (value: number) => value.toFixed(2);

export function ValueField({
                               value,
                               editable = false,
                               disabled = false,
                               onIncrement,
                               onDecrement,
                               onIncrementPress,
                               onIncrementRelease,
                               onDecrementPress,
                               onDecrementRelease,
                           }: ValueFieldProps) {
    return (
        <div className="value-field-row">
            <div className="value-field">{formatFloat(value)}</div>

            <div
                className={`value-field__actions ${
                    !editable ? "value-field__actions--hidden" : ""
                }`}
            >
                <button
                    type="button"
                    className="value-field__button"
                    onClick={onIncrement}
                    onMouseDown={onIncrementPress}
                    onMouseUp={onIncrementRelease}
                    onMouseLeave={onIncrementRelease}
                    onTouchStart={onIncrementPress}
                    onTouchEnd={onIncrementRelease}
                    disabled={disabled || !editable}
                    tabIndex={editable ? 0 : -1}
                >
                    +
                </button>

                <button
                    type="button"
                    className="value-field__button"
                    onClick={onDecrement}
                    onMouseDown={onDecrementPress}
                    onMouseUp={onDecrementRelease}
                    onMouseLeave={onDecrementRelease}
                    onTouchStart={onDecrementPress}
                    onTouchEnd={onDecrementRelease}
                    disabled={disabled || !editable}
                    tabIndex={editable ? 0 : -1}
                >
                    -
                </button>
            </div>
        </div>
    );
}