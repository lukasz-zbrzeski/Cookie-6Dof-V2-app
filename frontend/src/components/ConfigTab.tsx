import { useMemo, useState } from "react";
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

type ServoOption = "J1" | "J2" | "J3" | "J4" | "J5" | "J6" | "Tool";
type ConfigViewMode = "basic" | "advanced";

const SERVO_OPTIONS: ServoOption[] = ["J1", "J2", "J3", "J4", "J5", "J6", "Tool"];

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const round2 = (value: number) => Number(value.toFixed(2));

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
    const [configMode, setConfigMode] = useState<ConfigViewMode>("basic");
    const [selectedServo, setSelectedServo] = useState<ServoOption>("J1");
    const [direction, setDirection] = useState<0 | 1>(0);

    const selectedIndex = useMemo(() => {
        if (selectedServo === "Tool") {
            return -1;
        }

        return SERVO_OPTIONS.indexOf(selectedServo);
    }, [selectedServo]);

    const selectedRow: ServoConfigRow = useMemo(() => {
        if (selectedIndex < 0 || selectedIndex >= rows.length) {
            return {
                offset: 0,
                mapMin: 350,
                mapMax: 2600,
                angle: 45,
                pwm: 600,
            };
        }

        return rows[selectedIndex];
    }, [rows, selectedIndex]);

    const angleDeg = clamp(Number(selectedRow.angle || 0), 0, 180);

    const pwmValue = useMemo(() => {
        if (selectedIndex < 0 || selectedIndex >= rows.length) {
            return 1500;
        }

        if (selectedRow.pwm && selectedRow.pwm > 0) {
            return Math.round(selectedRow.pwm);
        }

        const minUs = Number(selectedRow.mapMin || 350);
        const maxUs = Number(selectedRow.mapMax || 2600);
        const interpolated = minUs + ((maxUs - minUs) * angleDeg) / 180;

        return Math.round(interpolated);
    }, [selectedIndex, selectedRow, angleDeg]);

    const zeroDegUs = Math.round(Number(selectedRow.mapMin || 350));
    const centerUs = 1500;
    const oneEightyDegUs = Math.round(Number(selectedRow.mapMax || 2600));

    const controlsDisabled = !connected || isStopPressed;
    const isToolSelected = selectedServo === "Tool";
    const servoActionDisabled = controlsDisabled || isToolSelected;

    const handleAngleChange = (nextAngle: number) => {
        if (selectedIndex < 0 || selectedIndex >= rows.length) {
            return;
        }

        onUpdateRowField(selectedIndex, "angle", round2(clamp(nextAngle, 0, 180)));
    };

    const handleSetPresetAngle = (nextAngle: number) => {
        handleAngleChange(nextAngle);
    };

    const handleSave = () => {
        console.log("SAVE config for:", selectedServo, selectedRow);
    };

    const handleHome = () => {
        handleSetPresetAngle(0);
    };

    const handleRevert = () => {
        console.log("REVERT config for:", selectedServo);
    };

    const handleChangeDirection = () => {
        setDirection((prev) => (prev === 0 ? 1 : 0));
    };

    const needleStyle = {
        transform: `translateX(-50%) rotate(${angleDeg - 90}deg)`,
    };

    return (
        <section className="config-tab">
            <div className="config-topbar">
                <button
                    type="button"
                    className="config-mode-toggle"
                    onClick={() =>
                        setConfigMode((prev) =>
                            prev === "basic" ? "advanced" : "basic"
                        )
                    }
                    disabled={controlsDisabled}
                >
                    {configMode === "basic"
                        ? "Change to Advanced Config"
                        : "Change to Basic Config"}
                </button>

                <div className="config-servo-picker">
                    <span className="config-servo-picker__label">Servo number</span>
                    <select
                        className="config-servo-picker__select"
                        value={selectedServo}
                        onChange={(e) =>
                            setSelectedServo(e.target.value as ServoOption)
                        }
                        disabled={controlsDisabled}
                    >
                        {SERVO_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="config-main-layout">
                <div className="config-test-card">
                    <div className="config-test-card__title">TEST</div>

                    <div className="config-test-card__buttons">
                        <ActionButton
                            label="Go 0deg"
                            variant="ghost"
                            onClick={() => handleSetPresetAngle(0)}
                            disabled={servoActionDisabled}
                        />
                        <ActionButton
                            label="Go 90deg"
                            variant="ghost"
                            onClick={() => handleSetPresetAngle(90)}
                            disabled={servoActionDisabled}
                        />
                        <ActionButton
                            label="Go 180deg"
                            variant="ghost"
                            onClick={() => handleSetPresetAngle(180)}
                            disabled={servoActionDisabled}
                        />
                        <button
                            type="button"
                            className="config-save-button"
                            onClick={handleSave}
                            disabled={servoActionDisabled}
                        >
                            SAVE
                        </button>
                    </div>

                    <div className="config-servo-status">
                        {busy ? "Serwo jedzie" : "Serwo stoi"}
                    </div>
                </div>

                <div className="servo-panel">
                    <div className="servo-panel__gauge-zone">
                        <ActionButton
                            label="Center 1500µs"
                            variant="ghost"
                            onClick={() => handleSetPresetAngle(90)}
                            disabled={servoActionDisabled}
                        />

                        <div className="servo-panel__gauge-row">
                            <div className="servo-panel__side servo-panel__side--left">
                                <div className="servo-panel__micro-value">{zeroDegUs}</div>
                                <ActionButton
                                    label="Set 0deg"
                                    variant="ghost"
                                    onClick={() => handleSetPresetAngle(0)}
                                    disabled={servoActionDisabled}
                                />
                            </div>

                            <div className="servo-gauge">
                                <div className="servo-gauge__tick servo-gauge__tick--0"/>
                                <div className="servo-gauge__tick servo-gauge__tick--45"/>
                                <div className="servo-gauge__tick servo-gauge__tick--90"/>
                                <div className="servo-gauge__tick servo-gauge__tick--135"/>
                                <div className="servo-gauge__tick servo-gauge__tick--180"/>

                                <div className="servo-gauge__body">
                                    <div className="servo-gauge__pivot"/>
                                    <div className="servo-gauge__label">Servo</div>
                                </div>

                                <div className="servo-gauge__needle" style={needleStyle}/>
                                <div className="servo-gauge__hub"/>
                            </div>

                            <div className="servo-panel__side servo-panel__side--right">
                                <div className="servo-panel__micro-value">{oneEightyDegUs}</div>
                                <ActionButton
                                    label="Set 180deg"
                                    variant="ghost"
                                    onClick={() => handleSetPresetAngle(180)}
                                    disabled={servoActionDisabled}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="servo-panel__controls">
                        <div className="servo-panel__left-values">
                            <div className="servo-panel__field">
                                <div className="servo-panel__field-label">PWM Value [us]:</div>
                                <div className="servo-panel__field-controls">
                                    <div className="config-value-box">{pwmValue}</div>
                                    <button
                                        type="button"
                                        className="config-small-button"
                                        onClick={() =>
                                            selectedIndex >= 0 && onPwmIncrement(selectedIndex)
                                        }
                                        disabled={servoActionDisabled}
                                    >
                                        +
                                    </button>
                                    <button
                                        type="button"
                                        className="config-small-button"
                                        onClick={() =>
                                            selectedIndex >= 0 && onPwmDecrement(selectedIndex)
                                        }
                                        disabled={servoActionDisabled}
                                    >
                                        -
                                    </button>
                                </div>
                            </div>

                            <div className="servo-panel__field">
                                <div className="servo-panel__field-label">ANGLE value [deg]:</div>
                                <div className="config-value-box config-value-box--angle">
                                    {round2(angleDeg)}
                                </div>
                            </div>
                        </div>

                        <div className="servo-panel__right-values">
                            <button
                                type="button"
                                className="config-dir-button config-dir-button--wide"
                                onClick={handleChangeDirection}
                                disabled={servoActionDisabled}
                            >
                                Change direction ({direction})
                            </button>

                            <div className="config-right-actions">
                                <ActionButton
                                    label="HOME"
                                    variant="ghost"
                                    onClick={handleHome}
                                    disabled={servoActionDisabled}
                                />
                                <ActionButton
                                    label="REVERT"
                                    variant="ghost"
                                    onClick={handleRevert}
                                    disabled={servoActionDisabled}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="config-footer">
                <div className="status-bar config-status-bar">
                    <span>Connected: {connected ? "Yes" : "No"}</span>
                    <span>STOP: {isStopPressed ? "Active" : "Inactive"}</span>
                    <span>Mode: {mode}</span>
                    {busy && <span>Komunikacja z API...</span>}
                    {error && <span className="status-bar__error">{error}</span>}
                </div>
            </div>
        </section>
    );
}