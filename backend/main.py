import os


from robot_state import (
    ConnectRequest, 
    JointsUpdateRequest, 
    CartesianUpdateRequest, 
    ModeRequest, 
    RobotStateResponse, 
    robot_state
)
import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import uart as uart

# 8000 - default FastAPI port
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://robotuser:robotpass@db:5432/robotdb",
)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")

app = FastAPI(title="Robot Arm API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_index(index: int) -> None:
    if index < 0 or index > 5:
        raise HTTPException(status_code=400, detail="Index musi być z zakresu 0-5.")


def round2(value: float) -> float:
    return round(value, 2)


def print_message(command: str, payload: dict | None = None) -> None:
    print("UART COMMAND:", command, payload)


def save_current_joints_to_db(joints: list[float]) -> int:
    if len(joints) != 6:
        raise ValueError("Do zapisu wymagane jest dokładnie 6 joint values.")

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO recorded_positions (
                    joint_1, joint_2, joint_3,
                    joint_4, joint_5, joint_6
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    joints[0],
                    joints[1],
                    joints[2],
                    joints[3],
                    joints[4],
                    joints[5],
                ),
            )
            inserted_id = cur.fetchone()[0]
        conn.commit()

    return inserted_id


@app.get("/")
async def root():
    return {"message": "Robot Arm API is running"}


@app.get("/robot/state", response_model=RobotStateResponse)
async def get_robot_state():
    return robot_state


@app.get("/robot/scan_com_ports")
async def scan_com_ports():
    # Scanning COM port  
    return {"com_ports": uart.list_serial_ports()}


@app.post("/robot/connect")
async def connect_robot(data: ConnectRequest):
    print(f"Rozpoczynam próbę połączenia na porcie {data.com_port}...")
    
    if uart.connect(data.com_port, data.baud_rate):
    # if uart.connect('/dev/ttyACM0', 115200):  #TODO: Replace with actual com_port and baud_rate from data
        robot_state["connected"] = True
        robot_state["com_port"] = data.com_port    
        robot_state["baud_rate"] = data.baud_rate   
        print_message(
            "connect",
            {"com_port": data.com_port, "baud_rate": data.baud_rate},
        )

        robot_config = uart.get_config()
        if robot_config is None:    
            raise HTTPException(status_code=400, detail="Nie można odczytać konfiguracji robota. Sprawdź połączenie i konfigurację STM32.")
        else:
            return {
                "message": "Połączono z robotem.",
                "connected": True,
                "com_port": data.com_port,
                "baud_rate": data.baud_rate,
                # TODO add info from servos_config, change to 6 values
                "servos_offset": [servo["offset"] for servo in robot_config],
                "servos_map_min": [servo["map_min"] for servo in robot_config],
                "servos_map_max": [servo["map_max"] for servo in robot_config],
                "servos_curr_angle": [servo["angle"] for servo in robot_config],
            }
    else:
        raise HTTPException(status_code=400,
            detail="Nie można połączyć się z robotem. Sprawdź połączenie i konfigurację STM32.")
    

@app.post("/robot/disconnect")
async def disconnect_robot():
    uart.disconnect()
    robot_state["connected"] = False
    robot_state["com_port"] = None
    robot_state["baud_rate"] = None

    print_message("disconnect")

    return {
        "message": "Disconnected from robot.",
        "connected": False,
    }


@app.post("/robot/stop")
async def stop_robot():
    robot_state["stopped"] = True
    print_message("stop")
    return {"message": "Robot zatrzymany.", "stopped": True}


@app.post("/robot/reset")
async def reset_robot():
    robot_state["stopped"] = False
    print_message("reset")
    return {"message": "Reset wykonany.", "stopped": False}


@app.post("/robot/mode")
async def set_mode(data: ModeRequest):
    robot_state["mode"] = data.mode
    print_message("mode", {"mode": data.mode})
    return {"message": "Tryb zmieniony.", "mode": data.mode}


@app.get("/robot/joints")
async def get_joints():
    return {"values": robot_state["joints"]}


@app.put("/robot/joints")
async def set_joints(data: JointsUpdateRequest):
    robot_state["joints"] = [round2(v) for v in data.values]
    print_message("set_joints", {"values": robot_state["joints"]})
    return {"message": "Wartości joints zaktualizowane.", "values": robot_state["joints"]}


@app.patch("/robot/joints/{index}/increment")
async def increment_joint(index: int):
    ensure_index(index)
    robot_state["joints"][index] = round2(robot_state["joints"][index] + 0.1)
    print_message("increment_joint", {"index": index, "value": robot_state["joints"][index]})
    return {"values": robot_state["joints"]}


@app.patch("/robot/joints/{index}/decrement")
async def decrement_joint(index: int):
    ensure_index(index)
    robot_state["joints"][index] = round2(robot_state["joints"][index] - 0.1)
    print_message("decrement_joint", {"index": index, "value": robot_state["joints"][index]})
    return {"values": robot_state["joints"]}


@app.get("/robot/cartesian")
async def get_cartesian():
    return {"values": robot_state["cartesian"]}


@app.put("/robot/cartesian")
async def set_cartesian(data: CartesianUpdateRequest):
    robot_state["cartesian"] = [round2(v) for v in data.values]
    print_message("set_cartesian", {"values": robot_state["cartesian"]})
    return {"message": "Wartości cartesian zaktualizowane.", "values": robot_state["cartesian"]}


@app.patch("/robot/cartesian/{index}/increment")
async def increment_cartesian(index: int):
    ensure_index(index)
    robot_state["cartesian"][index] = round2(robot_state["cartesian"][index] + 0.1)
    print_message("increment_cartesian", {"index": index, "value": robot_state["cartesian"][index]})
    return {"values": robot_state["cartesian"]}


@app.patch("/robot/cartesian/{index}/decrement")
async def decrement_cartesian(index: int):
    ensure_index(index)
    robot_state["cartesian"][index] = round2(robot_state["cartesian"][index] - 0.1)
    print_message("decrement_cartesian", {"index": index, "value": robot_state["cartesian"][index]})
    return {"values": robot_state["cartesian"]}


@app.post("/robot/record")
async def record_position():
    print_message("record")
    record_id = save_current_joints_to_db(robot_state["joints"])
    return {
        "message": "Pozycja zapisana.",
        "record_id": record_id,
        "values": robot_state["joints"],
    }


@app.post("/robot/play")
async def play_motion():
    print_message("play")
    return {"message": "Odtwarzanie uruchomione."}


@app.post("/robot/pause")
async def pause_motion():
    print_message("pause")
    return {"message": "Odtwarzanie wstrzymane."}


@app.post("/robot/resume")
async def resume_motion():
    print_message("resume")
    return {"message": "Odtwarzanie wznowione."}


@app.post("/robot/prev-position")
async def prev_position():
    print_message("prev_position")
    return {"message": "Przejście do poprzedniej pozycji."}


@app.post("/robot/next-position")
async def next_position():
    print_message("next_position")
    return {"message": "Przejście do następnej pozycji."}