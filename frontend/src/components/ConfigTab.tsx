import { useState } from "react";
import { ActionButton } from "./ActionButton";

type ConfigRow = {
    offset: number;
    mapMin: number;
    mapMax: number;
    angle: number;
    pwm: number;
};

type ConfigTabProps = {
    connected: boolean;
    isStopPressed: boolean;
    mode: "manual" | "auto";
    busy?: boolean;
    error?: string;
};

const createInitialRows = (): ConfigRow[] =>
    Array.from({ length: 6 }, () => ({
        offset: 0,
        mapMin: 0,
        mapMax: 100,
        angle: 0,
        pwm: 0,
    }));

export function ConfigTab({
                              connected,
                              isStopPressed,
                              mode,
                              busy = false,
                              error = "",
                          }: ConfigTabProps) {
    const [rows, setRows] = useState<ConfigRow[]>(createInitialRows());

    const updateRowField = (
        rowIndex: number,
        field: keyof Omit<ConfigRow, "pwm">,
        value: number
    ) => {
        setRows((prev) =>
            prev.map((row, index) =>
                index === rowIndex
                    ? {
                        ...row,
                        [field]: field === "offset" ? Math.trunc(value) : value,
                    }
                    : row
            )
        );
    };

    const handlePwmIncrement = (rowIndex: number) => {
        setRows((prev) =>
            prev.map((row, index) =>
                index === rowIndex
                    ? {
                        ...row,
                        pwm: row.pwm + 1,
                    }
                    : row
            )
        );
    };

    const handlePwmDecrement = (rowIndex: number) => {
        setRows((prev) =>
            prev.map((row, index) =>
                index === rowIndex
                    ? {
                        ...row,
                        pwm: Math.max(row.pwm - 1, 0),
                    }
                    : row
            )
        );
    };

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
                                updateRowField(
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
                                updateRowField(rowIndex, "mapMin", Number(e.target.value))
                            }
                        />

                        <input
                            className="config-cell-input"
                            type="number"
                            value={row.mapMax}
                            onChange={(e) =>
                                updateRowField(rowIndex, "mapMax", Number(e.target.value))
                            }
                        />

                        <input
                            className="config-cell-input"
                            type="number"
                            step="0.01"
                            value={row.angle}
                            onChange={(e) =>
                                updateRowField(rowIndex, "angle", Number(e.target.value))
                            }
                        />

                        <ActionButton
                            label="PWM-"
                            variant="ghost"
                            onClick={() => handlePwmDecrement(rowIndex)}
                        />

                        <ActionButton
                            label="PWM+"
                            variant="ghost"
                            onClick={() => handlePwmIncrement(rowIndex)}
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