import { ActionButton } from "./ActionButton";
import type { ServoConfigRow } from "../hooks/useRobotState";

type ConfigTabProps = {
    connected: boolean;
    isStopPressed: boolean;
    mode: "manual" | "auto";
    busy?: boolean;
    error?: string;
    rows: ServoConfigRow[];
    onUpdateRowField: (
        rowIndex: number,
        field: keyof ServoConfigRow,
        value: number
    ) => void;
    onPwmIncrement: (rowIndex: number) => void;
    onPwmDecrement: (rowIndex: number) => void;
};

export function ConfigTab({
                              connected,
                              isStopPressed,
                              mode,
                              busy = false,
                              error = "",
                              rows,
                              onUpdateRowField,
                              onPwmIncrement,
                              onPwmDecrement,
                          }: ConfigTabProps) {
    const handleConfirm = () => {
        console.log("Config rows:", rows);
    };

    return (
        <section className="config-tab">
            <div className="config-grid config-grid--header">
                <div className="config-header-cell">Offset</div>
                <div className="config-header-cell">Map min</div>
                <div className="config-header-cell">Map max</div>
                <div className="config-header-cell">Angle</div>
                <div className="config-header-cell">PWM-</div>
                <div className="config-header-cell">PWM+</div>
            </div>

            <div className="config-rows">
                {rows.map((row, rowIndex) => (
                    <div className="config-grid config-row" key={rowIndex}>
                        <input
                            className="config-cell-input"
                            type="number"
                            step="1"
                            value={row.offset}
                            onChange={(e) =>
                                onUpdateRowField(
                                    rowIndex,
                                    "offset",
                                    parseInt(e.target.value || "0", 10)
                                )
                            }
                        />

                        <input
                            className="config-cell-input"
                            type="number"
                            value={row.mapMin}
                            onChange={(e) =>
                                onUpdateRowField(rowIndex, "mapMin", Number(e.target.value))
                            }
                        />

                        <input
                            className="config-cell-input"
                            type="number"
                            value={row.mapMax}
                            onChange={(e) =>
                                onUpdateRowField(rowIndex, "mapMax", Number(e.target.value))
                            }
                        />

                        <input
                            className="config-cell-input"
                            type="number"
                            step="0.01"
                            value={row.angle}
                            onChange={(e) =>
                                onUpdateRowField(rowIndex, "angle", Number(e.target.value))
                            }
                        />

                        <ActionButton
                            label="PWM-"
                            variant="ghost"
                            onClick={() => onPwmDecrement(rowIndex)}
                        />

                        <ActionButton
                            label="PWM+"
                            variant="ghost"
                            onClick={() => onPwmIncrement(rowIndex)}
                        />
                    </div>
                ))}
            </div>

            <div className="config-footer">
                <div className="status-bar config-status-bar">
                    <span>Connected: {connected ? "Yes" : "No"}</span>
                    <span>STOP: {isStopPressed ? "Active" : "Inactive"}</span>
                    <span>Mode: {mode}</span>
                    {busy && <span>Komunikacja z API...</span>}
                    {error && <span className="status-bar__error">{error}</span>}
                </div>

                <button className="config-confirm-button" onClick={handleConfirm}>
                    Confirm
                </button>
            </div>
        </section>
    );
}