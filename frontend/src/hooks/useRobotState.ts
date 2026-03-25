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
                await loadState();
                await loadComPorts();
                return;
            }

            if (!selectedCom) {
                throw new Error("No device connected. Please connect a device first.");
            }

            await connectRobot(selectedCom, Number(baudRate));
            await loadState();
            await loadComPorts();
        });
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
    };
}