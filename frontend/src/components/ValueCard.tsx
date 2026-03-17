import { ValueField } from "./ValueField";

type ValueCardProps = {
    title: string;
    values: number[];
    editable?: boolean;
    onIncrement?: (index: number) => void;
    onDecrement?: (index: number) => void;
};

export function ValueCard({
                              title,
                              values,
                              editable = false,
                              onIncrement,
                              onDecrement,
                          }: ValueCardProps) {
    return (
        <section className="value-card">
            <div className="value-card__title">{title}</div>

            <div className="value-card__content">
                <div className="value-card__values">
                    {values.map((value, index) => (
                        <ValueField
                            key={`${title}-${index}`}
                            value={value}
                            editable={editable}
                            onIncrement={() => onIncrement?.(index)}
                            onDecrement={() => onDecrement?.(index)}
                        />
                    ))}
                </div>
                <div className="value-card__empty" />
            </div>
        </section>
    );
}