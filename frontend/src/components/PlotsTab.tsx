import { useEffect, useMemo, useState } from "react";
import { getRecordedPositions } from "../api/robotApi";

type RecordedPosition = {
    id: number;
    joints: number[];
};

const COLORS = ["#e53935", "#1e88e5", "#43a047", "#fb8c00", "#8e24aa", "#00acc1"];

const WIDTH = 1050;
const HEIGHT = 520;
const PADDING_LEFT = 90;
const PADDING_RIGHT = 55;
const PADDING_TOP = 55;
const PADDING_BOTTOM = 95;

function createSmoothPath(points: { x: number; y: number }[]) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] ?? p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
}

export function PlotsTab() {
    const [positions, setPositions] = useState<RecordedPosition[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setError("");
                const response = await getRecordedPositions();
                setPositions(response.positions);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się pobrać danych.");
            }
        };

        load();
    }, []);

    const chartData = useMemo(() => {
        const allValues = positions.flatMap((position) => position.joints);
        const minValue = Math.min(...allValues, 0);
        const maxValue = Math.max(...allValues, 1);

        const xMin = positions[0]?.id ?? 0;
        const xMax = positions[positions.length - 1]?.id ?? 1;

        const scaleX = (id: number) => {
            if (xMax === xMin) return WIDTH / 2;
            return PADDING_LEFT + ((id - xMin) / (xMax - xMin)) * (WIDTH - PADDING_LEFT - PADDING_RIGHT);
        };

        const scaleY = (value: number) => {
            if (maxValue === minValue) return HEIGHT / 2;
            return HEIGHT - PADDING_BOTTOM - ((value - minValue) / (maxValue - minValue)) * (HEIGHT - PADDING_TOP - PADDING_BOTTOM);
        };

        const paths = Array.from({ length: 6 }, (_, jointIndex) => {
            const points = positions.map((position) => ({
                x: scaleX(position.id),
                y: scaleY(position.joints[jointIndex] ?? 0),
            }));

            return createSmoothPath(points);
        });

        const xTicks = positions.map((position) => ({
            id: position.id,
            x: scaleX(position.id),
        }));

        const yTicks = Array.from({ length: 5 }, (_, index) => {
            const value = minValue + ((maxValue - minValue) * index) / 4;

            return {
                value,
                y: scaleY(value),
            };
        });

        return {
            paths,
            minValue,
            maxValue,
            xTicks,
            yTicks,
        };
    }, [positions]);

    return (
        <section className="plots-tab">
            <div className="plots-card">
                <h2 className="plots-title">Recorded Joint Values</h2>

                {error && <div className="status-bar__error">{error}</div>}

                {positions.length === 0 ? (
                    <div className="plots-empty">Brak zapisanych pozycji w bazie.</div>
                ) : (
                    <>
                        <svg className="plots-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
                            <line x1={PADDING_LEFT} y1={HEIGHT - PADDING_BOTTOM} x2={WIDTH - PADDING_RIGHT}
                                  y2={HEIGHT - PADDING_BOTTOM}/>
                            <line x1={PADDING_LEFT} y1={PADDING_TOP} x2={PADDING_LEFT} y2={HEIGHT - PADDING_BOTTOM}/>

                            {chartData.yTicks.map((tick) => (
                                <g key={tick.value}>
                                    <line
                                        className="plots-grid-line"
                                        x1={PADDING_LEFT}
                                        y1={tick.y}
                                        x2={WIDTH - PADDING_RIGHT}
                                        y2={tick.y}
                                    />
                                    <text x={34} y={tick.y + 6}>
                                        {tick.value.toFixed(2)}
                                    </text>
                                </g>
                            ))}

                            {chartData.xTicks.map((tick) => (
                                <g key={tick.id}>
                                    <line
                                        className="plots-tick-line"
                                        x1={tick.x}
                                        y1={HEIGHT - PADDING_BOTTOM}
                                        x2={tick.x}
                                        y2={HEIGHT - PADDING_BOTTOM + 8}
                                    />
                                    <text x={tick.x - 8} y={HEIGHT - PADDING_BOTTOM + 34}>
                                        {tick.id}
                                    </text>
                                </g>
                            ))}

                            <text x={WIDTH / 2 - 55} y={HEIGHT - 22}>
                                Position number
                            </text>

                            <text
                                x={12}
                                y={HEIGHT / 2 + 45}
                                transform={`rotate(-90 12 ${HEIGHT / 2 + 45})`}
                            >
                                Joint value
                            </text>

                            {chartData.paths.map((path, index) => (
                                <path
                                    key={index}
                                    d={path}
                                    fill="none"
                                    stroke={COLORS[index]}
                                    strokeWidth="3"
                                />
                            ))}
                        </svg>

                        <div className="plots-legend">
                            {[1, 2, 3, 4, 5, 6].map((joint, index) => (
                                <span key={joint} className="plots-legend__item">
                                    <span
                                        className="plots-legend__color"
                                        style={{backgroundColor: COLORS[index]}}
                                    />
                                    Joint {joint}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}