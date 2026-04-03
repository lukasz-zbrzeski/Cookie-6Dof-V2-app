import { useCallback, useEffect, useState } from "react";
import {
    connectRobot,
    decrementCartesian,
    decrementJoint,
    disconnectRobot,
    getRobotState,
    incrementCartesian,
    incrementJoint,
    nextPosition,
    pauseMotion,
    playMotion,
    prevPosition,
    recordPosition,
    resetRobot,
    resumeMotion,
    scanComPorts,
    setRobotMode,
    stopRobot,
} from "../api/robotApi";

export type RobotMode = "manual" | "auto";

export type ServoConfigRow = {
    offset: number;
    mapMin: number;
    mapMax: number;
    angle: number;
    pwm: number;
};

const CONFIG_ROWS_STORAGE_KEY = "robot_config_rows";

const createDefaultConfigRows = (): ServoConfigRow[] =>
    Array.from({ length: 6 }, () => ({
        offset: 0,
        mapMin: 0,
        mapMax: 0,
        angle: 0,
        pwm: 0,
    }));

const loadConfigRowsFromStorage = (): ServoConfigRow[] => {
    try {
        const raw = localStorage.getItem(CONFIG_ROWS_STORAGE_KEY);

        if (!raw) {
            return createDefaultConfigRows();
        }

        const parsed = JSON.parse(raw) as ServoConfigRow[];

        if (!Array.isArray(parsed) || parsed.length !== 6) {
            return createDefaultConfigRows();
        }

        return parsed.map((row) => ({
            offset: Math.trunc(Number(row.offset ?? 0)),
            mapMin: Number(row.mapMin ?? 0),
            mapMax: Number(row.mapMax ?? 0),
            angle: Number(row.angle ?? 0),
            pwm: Number(row.pwm ?? 0),
        }));
    } catch {
        return createDefaultConfigRows();
    }
};

const saveConfigRowsToStorage = (rows: ServoConfigRow[]) => {
    localStorage.setItem(CONFIG_ROWS_STORAGE_KEY, JSON.stringify(rows));
};

const clearConfigRowsFromStorage = () => {
    localStorage.removeItem(CONFIG_ROWS_STORAGE_KEY);
};

export function useRobotState() {
    const [joints, setJoints] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [cartesian, setCartesian] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [connected, setConnected] = useState(false);
    const [isStopPressed, setIsStopPressed] = useState(false);
    const [mode, setMode] = useState<RobotMode>("manual");
    const [selectedCom, setSelectedCom] = useState("");
    const [baudRate, setBaudRate] = useState("115200");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [availableComPorts, setAvailableComPorts] = useState<string[]>([]);
    const [configRows, setConfigRows] = useState<ServoConfigRow[]>(() =>
        loadConfigRowsFromStorage()
    );

    const loadComPorts = useCallback(async () => {
        try {
            const response = await scanComPorts();
            const ports = response.com_ports ?? [];
            setAvailableComPorts(ports);

            setSelectedCom((prev) => {
                if (ports.length === 0) {
                    return "";
                }

                if (prev && ports.includes(prev)) {
                    return prev;
                }

                return ports[0];
            });
        } catch (err) {
            setAvailableComPorts([]);
            setSelectedCom("");
            setError(err instanceof Error ? err.message : "Failed to scan COM ports.");
        }
    }, []);

    const loadState = useCallback(async () => {
        try {
            setError("");
            const state = await getRobotState();

            setJoints(state.joints);
            setCartesian(state.cartesian);
            setConnected(state.connected);
            setIsStopPressed(state.stopped);
            setMode(state.mode);
            setBaudRate(state.baud_rate ? String(state.baud_rate) : "115200");

            setSelectedCom((prev) => {
                if (state.com_port) {
                    return state.com_port;
                }
                return prev;
            });

            if (!state.connected) {
                setConfigRows(createDefaultConfigRows());
                clearConfigRowsFromStorage();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Nie udało się pobrać stanu robota.");
        }
    }, []);

    useEffect(() => {
        const initialize = async () => {
            await loadComPorts();
            await loadState();
        };

        initialize();
    }, [loadComPorts, loadState]);

    useEffect(() => {
        if (connected) {
            saveConfigRowsToStorage(configRows);
        }
    }, [configRows, connected]);

    const withBusy = async (callback: () => Promise<void>) => {
        try {
            setBusy(true);
            setError("");
            await callback();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Wystąpił błąd komunikacji z API.");
        } finally {
            setBusy(false);
        }
    };

    const handleConnectToggle = async () => {
        await withBusy(async () => {
            if (connected) {
                await disconnectRobot();
                setConfigRows(createDefaultConfigRows());
                clearConfigRowsFromStorage();
                await loadState();
                await loadComPorts();
                return;
            }

            if (!selectedCom) {
                throw new Error("No device connected. Please connect a device first.");
            }

            const response = await connectRobot(selectedCom, Number(baudRate));

            const nextConfigRows: ServoConfigRow[] = Array.from({ length: 6 }, (_, index) => ({
                offset: Math.trunc(response.servos_offset?.[index] ?? 0),
                mapMin: Number(response.servos_map_min?.[index] ?? 0),
                mapMax: Number(response.servos_map_max?.[index] ?? 0),
                angle: Number(response.servos_curr_angle?.[index] ?? 0),
                pwm: 0,
            }));

            setConfigRows(nextConfigRows);
            saveConfigRowsToStorage(nextConfigRows);

            await loadState();
            await loadComPorts();
        });
    };

    const updateConfigRowField = (
        rowIndex: number,
        field: keyof ServoConfigRow,
        value: number
    ) => {
        setConfigRows((prev) =>
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

    const handleConfigPwmIncrement = (rowIndex: number) => {
        setConfigRows((prev) =>
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

    const handleConfigPwmDecrement = (rowIndex: number) => {
        setConfigRows((prev) =>
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

    const handleStop = async () => {
        await withBusy(async () => {
            await stopRobot();
            await loadState();
        });
    };

    const handleReset = async () => {
        await withBusy(async () => {
            await resetRobot();
            await loadState();
        });
    };

    const handleToggleMode = async () => {
        await withBusy(async () => {
            const nextMode: RobotMode = mode === "manual" ? "auto" : "manual";
            await setRobotMode(nextMode);
            await loadState();
        });
    };

    const handleIncrementJoint = async (index: number) => {
        await withBusy(async () => {
            const response = await incrementJoint(index);
            setJoints(response.values);
        });
    };

    const handleDecrementJoint = async (index: number) => {
        await withBusy(async () => {
            const response = await decrementJoint(index);
            setJoints(response.values);
        });
    };

    const handleIncrementCartesian = async (index: number) => {
        await withBusy(async () => {
            const response = await incrementCartesian(index);
            setCartesian(response.values);
        });
    };

    const handleDecrementCartesian = async (index: number) => {
        await withBusy(async () => {
            const response = await decrementCartesian(index);
            setCartesian(response.values);
        });
    };

    const handleRecord = async () => {
        await withBusy(async () => {
            await recordPosition();
        });
    };

    const handleResume = async () => {
        await withBusy(async () => {
            await resumeMotion();
        });
    };

    const handlePlay = async () => {
        await withBusy(async () => {
            await playMotion();
        });
    };

    const handlePrevPosition = async () => {
        await withBusy(async () => {
            await prevPosition();
        });
    };

    const handlePause = async () => {
        await withBusy(async () => {
            await pauseMotion();
        });
    };

    const handleNextPosition = async () => {
        await withBusy(async () => {
            await nextPosition();
        });
    };

    return {
        joints,
        cartesian,
        connected,
        isStopPressed,
        mode,
        selectedCom,
        baudRate,
        busy,
        error,
        availableComPorts,
        configRows,
        setSelectedCom,
        setBaudRate,
        loadState,
        loadComPorts,
        handleConnectToggle,
        handleStop,
        handleReset,
        handleToggleMode,
        handleIncrementJoint,
        handleDecrementJoint,
        handleIncrementCartesian,
        handleDecrementCartesian,
        handleRecord,
        handleResume,
        handlePlay,
        handlePrevPosition,
        handlePause,
        handleNextPosition,
        updateConfigRowField,
        handleConfigPwmIncrement,
        handleConfigPwmDecrement,
    };
}