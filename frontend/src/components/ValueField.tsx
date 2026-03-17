type ValueFieldProps = {
    value: number;
    editable?: boolean;
    onIncrement?: () => void;
    onDecrement?: () => void;
};

const formatFloat = (value: number) => value.toFixed(2);

export function ValueField({
                               value,
                               editable = false,
                               onIncrement,
                               onDecrement,
                           }: ValueFieldProps) {
    return (
        <div className="value-field-row">
            <div className="value-field">{formatFloat(value)}</div>

            {editable && (
                <div className="value-field__actions">
                    <button
                        type="button"
                        className="value-field__button"
                        onClick={onIncrement}
                    >
                        +
                    </button>
                    <button
                        type="button"
                        className="value-field__button"
                        onClick={onDecrement}
                    >
                        -
                    </button>
                </div>
            )}
        </div>
    );
}