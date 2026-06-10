import { ValueField } from "./ValueField";

type ValueCardProps = {
    title: string;
    values: number[];
    editable?: boolean;
    disabled?: boolean;
    onIncrement?: (index: number) => void;
    onDecrement?: (index: number) => void;
    onIncrementPress?: (index: number) => void;
    onIncrementRelease?: (index: number) => void;
    onDecrementPress?: (index: number) => void;
    onDecrementRelease?: (index: number) => void;
};

export function ValueCard({
                              title,
                              values,
                              editable = false,
                              disabled = false,
                              onIncrement,
                              onDecrement,
                              onIncrementPress,
                              onIncrementRelease,
                              onDecrementPress,
                              onDecrementRelease,
                          }: ValueCardProps) {
    return (
        <section className="value-card">
            <div className="value-card__title">{title}</div>

            <div className="value-card__content">
                <div className="value-card__values">
                    {(values ?? []).map((value, index) => (
                        <ValueField
                            key={`${title}-${index}`}
                            value={value}
                            editable={editable}
                            disabled={disabled}
                            onIncrement={() => onIncrement?.(index)}
                            onDecrement={() => onDecrement?.(index)}
                            onIncrementPress={() => onIncrementPress?.(index)}
                            onIncrementRelease={() => onIncrementRelease?.(index)}
                            onDecrementPress={() => onDecrementPress?.(index)}
                            onDecrementRelease={() => onDecrementRelease?.(index)}
                        />
                    ))}
                </div>
                <div className="value-card__empty" />
            </div>
        </section>
    );
}