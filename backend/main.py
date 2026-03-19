import os
from typing import Literal

import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


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


class ConnectRequest(BaseModel):
    com_port: str = Field(..., examples=["COM3"])
    baud_rate: int = Field(..., gt=0, examples=[115200])


class JointsUpdateRequest(BaseModel):
    values: list[float]

    def model_post_init(self, __context):
        if len(self.values) != 6:
            raise ValueError("Joints muszą mieć dokładnie 6 wartości.")


class CartesianUpdateRequest(BaseModel):
    values: list[float]

    def model_post_init(self, __context):
        if len(self.values) != 6:
            raise ValueError("Cartesian muszą mieć dokładnie 6 wartości.")


class ModeRequest(BaseModel):
    mode: Literal["manual", "auto"]


class RobotStateResponse(BaseModel):
    connected: bool
    stopped: bool
    mode: Literal["manual", "auto"]
    com_port: str | None
    baud_rate: int | None
    joints: list[float]
    cartesian: list[float]


robot_state = {
    "connected": False,
    "stopped": False,
    "mode": "manual",
    "com_port": None,
    "baud_rate": None,
    "joints": [1.15, 1.52, 1.89, 2.26, 2.63, 3.00],
    "cartesian": [2.05, 2.42, 2.79, 3.16, 3.53, 3.90],
}


def ensure_index(index: int) -> None:
    if index < 0 or index > 5:
        raise HTTPException(status_code=400, detail="Index musi być z zakresu 0-5.")


def round2(value: float) -> float:
    return round(value, 2)


def send_uart_command(command: str, payload: dict | None = None) -> None:
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


@app.post("/robot/connect")
async def connect_robot(data: ConnectRequest):
    robot_state["connected"] = True
    robot_state["com_port"] = data.com_port
    robot_state["baud_rate"] = data.baud_rate

    send_uart_command(
        "connect",
        {"com_port": data.com_port, "baud_rate": data.baud_rate},
    )

    return {
        "message": "Połączono z robotem.",
        "connected": True,
        "com_port": data.com_port,
        "baud_rate": data.baud_rate,
    }


@app.post("/robot/stop")
async def stop_robot():
    robot_state["stopped"] = True
    send_uart_command("stop")
    return {"message": "Robot zatrzymany.", "stopped": True}


@app.post("/robot/reset")
async def reset_robot():
    robot_state["stopped"] = False
    send_uart_command("reset")
    return {"message": "Reset wykonany.", "stopped": False}


@app.post("/robot/mode")
async def set_mode(data: ModeRequest):
    robot_state["mode"] = data.mode
    send_uart_command("mode", {"mode": data.mode})
    return {"message": "Tryb zmieniony.", "mode": data.mode}


@app.get("/robot/joints")
async def get_joints():
    return {"values": robot_state["joints"]}


@app.put("/robot/joints")
async def set_joints(data: JointsUpdateRequest):
    robot_state["joints"] = [round2(v) for v in data.values]
    send_uart_command("set_joints", {"values": robot_state["joints"]})
    return {"message": "Wartości joints zaktualizowane.", "values": robot_state["joints"]}


@app.patch("/robot/joints/{index}/increment")
async def increment_joint(index: int):
    ensure_index(index)
    robot_state["joints"][index] = round2(robot_state["joints"][index] + 0.1)
    send_uart_command("increment_joint", {"index": index, "value": robot_state["joints"][index]})
    return {"values": robot_state["joints"]}


@app.patch("/robot/joints/{index}/decrement")
async def decrement_joint(index: int):
    ensure_index(index)
    robot_state["joints"][index] = round2(robot_state["joints"][index] - 0.1)
    send_uart_command("decrement_joint", {"index": index, "value": robot_state["joints"][index]})
    return {"values": robot_state["joints"]}


@app.get("/robot/cartesian")
async def get_cartesian():
    return {"values": robot_state["cartesian"]}


@app.put("/robot/cartesian")
async def set_cartesian(data: CartesianUpdateRequest):
    robot_state["cartesian"] = [round2(v) for v in data.values]
    send_uart_command("set_cartesian", {"values": robot_state["cartesian"]})
    return {"message": "Wartości cartesian zaktualizowane.", "values": robot_state["cartesian"]}


@app.patch("/robot/cartesian/{index}/increment")
async def increment_cartesian(index: int):
    ensure_index(index)
    robot_state["cartesian"][index] = round2(robot_state["cartesian"][index] + 0.1)
    send_uart_command("increment_cartesian", {"index": index, "value": robot_state["cartesian"][index]})
    return {"values": robot_state["cartesian"]}


@app.patch("/robot/cartesian/{index}/decrement")
async def decrement_cartesian(index: int):
    ensure_index(index)
    robot_state["cartesian"][index] = round2(robot_state["cartesian"][index] - 0.1)
    send_uart_command("decrement_cartesian", {"index": index, "value": robot_state["cartesian"][index]})
    return {"values": robot_state["cartesian"]}


@app.post("/robot/record")
async def record_position():
    send_uart_command("record")
    record_id = save_current_joints_to_db(robot_state["joints"])
    return {
        "message": "Pozycja zapisana.",
        "record_id": record_id,
        "values": robot_state["joints"],
    }


@app.post("/robot/play")
async def play_motion():
    send_uart_command("play")
    return {"message": "Odtwarzanie uruchomione."}


@app.post("/robot/pause")
async def pause_motion():
    send_uart_command("pause")
    return {"message": "Odtwarzanie wstrzymane."}


@app.post("/robot/resume")
async def resume_motion():
    send_uart_command("resume")
    return {"message": "Odtwarzanie wznowione."}


@app.post("/robot/prev-position")
async def prev_position():
    send_uart_command("prev_position")
    return {"message": "Przejście do poprzedniej pozycji."}


@app.post("/robot/next-position")
async def next_position():
    send_uart_command("next_position")
    return {"message": "Przejście do następnej pozycji."}