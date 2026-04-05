import { useRef } from "react";

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
    const incrementPressedRef = useRef(false);
    const decrementPressedRef = useRef(false);

    const handleIncrementMouseDown = () => {
        if (disabled || !editable || !onIncrementPress) {
            return;
        }

        incrementPressedRef.current = true;
        onIncrementPress();
    };

    const handleIncrementMouseUp = () => {
        if (!incrementPressedRef.current) {
            return;
        }

        incrementPressedRef.current = false;
        onIncrementRelease?.();
    };

    const handleIncrementMouseLeave = () => {
        if (!incrementPressedRef.current) {
            return;
        }

        incrementPressedRef.current = false;
        onIncrementRelease?.();
    };

    const handleDecrementMouseDown = () => {
        if (disabled || !editable || !onDecrementPress) {
            return;
        }

        decrementPressedRef.current = true;
        onDecrementPress();
    };

    const handleDecrementMouseUp = () => {
        if (!decrementPressedRef.current) {
            return;
        }

        decrementPressedRef.current = false;
        onDecrementRelease?.();
    };

    const handleDecrementMouseLeave = () => {
        if (!decrementPressedRef.current) {
            return;
        }

        decrementPressedRef.current = false;
        onDecrementRelease?.();
    };

    const handleIncrementClick = () => {
        onIncrement?.();
    };

    const handleDecrementClick = () => {
        onDecrement?.();
    };

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
                    onClick={handleIncrementClick}
                    onMouseDown={handleIncrementMouseDown}
                    onMouseUp={handleIncrementMouseUp}
                    onMouseLeave={handleIncrementMouseLeave}
                    disabled={disabled || !editable}
                    tabIndex={editable ? 0 : -1}
                >
                    +
                </button>

                <button
                    type="button"
                    className="value-field__button"
                    onClick={handleDecrementClick}
                    onMouseDown={handleDecrementMouseDown}
                    onMouseUp={handleDecrementMouseUp}
                    onMouseLeave={handleDecrementMouseLeave}
                    disabled={disabled || !editable}
                    tabIndex={editable ? 0 : -1}
                >
                    -
                </button>
            </div>
        </div>
    );
}