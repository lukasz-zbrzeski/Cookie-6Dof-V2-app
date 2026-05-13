import numpy as np
import roboticstoolbox as rtb
from spatialmath import SE3


class Cookie6DofRobot(rtb.DHRobot):
    def __init__(self, custom_tool_x=-0.065):  # -65 mm to -0.065 m
        # ZMIENIAMY WSZYSTKO NA METRY (/ 1000)
        BASE_OFFSET = 0.040
        a1 = 0.047
        a2 = 0.135
        a3 = 0.02955
        d1 = 0.101 + BASE_OFFSET
        d4 = 0.15425
        d6 = 0.056122

        # 2. Tworzenie listy linków w notacji MDH
        links = [
            rtb.RevoluteMDH(d=d1, a=0, alpha=0),  # Joint 1
            rtb.RevoluteMDH(d=0, a=a1, alpha=np.pi / 2),  # Joint 2
            rtb.RevoluteMDH(d=0, a=a2, alpha=0),  # Joint 3
            rtb.RevoluteMDH(d=d4, a=a3, alpha=np.pi / 2),  # Joint 4
            rtb.RevoluteMDH(d=0, a=0, alpha=-np.pi / 2),  # Joint 5
            rtb.RevoluteMDH(d=d6, a=0, alpha=np.pi / 2),  # Joint 6
        ]

        # 3. Inicjalizacja klasy nadrzędnej (DHRobot)
        super().__init__(links, name="Cookie6dof")

        # 4. Definicja TCP (Narzędzia)
        flange = SE3.Tz(0.0255)
        tool_offset = SE3.Tx(custom_tool_x)
        self.tool = flange * tool_offset

    # ==========================================
    # TWOJE CUSTOMOWE FUNKCJE
    # ==========================================

    def get_position(
        self, joint_angles: list[float], in_degrees: bool = True
    ) -> list[float]:
        """
        Oblicza kinematykę prostą dla podanych kątów.
        Zwraca płaską listę 6 wartości: [X, Y, Z, Roll, Pitch, Yaw].
        Pozycja jest w mm, a rotacja domyślnie w stopniach.
        Zakłada, że wejściowe joint_angles są podane w STOPNIACH.
        """

        # 0. Konwersja kątów wejściowych ze stopni na radiany
        # np.deg2rad poradzi sobie z całą listą na raz
        joint_angles_rad = np.deg2rad(joint_angles)

        # 1. Obliczamy pełną macierz transformacji SE3 (używając radianów!)
        pose = self.fkine(joint_angles_rad)

        # 2. Wyciągamy pozycję [X, Y, Z] (w milimetrach)
        xyz = pose.t.tolist()

        # 3. Wyciągamy orientację RPY (domyślnie zwraca radiany)
        rpy = pose.rpy()

        # 4. Konwersja z powrotem na stopnie dla orientacji (opcjonalna, ale zalecana dla UI)
        if in_degrees:
            rpy = np.rad2deg(rpy)

        rpy = rpy.tolist()

        # 5. Łączymy w jedną listę i zaokrąglamy do 2 miejsc po przecinku
        # xyz + rpy daje listę 6 elementów.
        cartesian_list = [round(val, 2) for val in (xyz + rpy)]

        return cartesian_list

    def calculate_ik_from_cartesian_jog(
        self, current_joints_deg: list[float], move_cartesian: list[str]
    ) -> tuple[list[float], list[float]]:
        """
        Liczy FK i IK na podstawie wciśniętego przycisku ruchu kartezjańskiego.
        Zwraca KROTkę (Tuple):
        1. current_cartesian - lista 6 wartości [X, Y, Z, R, P, Y] do aktualizacji interfejsu.
        2. new_joints_deg - lista 6 nowych kątów dla silników do wysłania na STM32.
        """
        # 1. Obliczamy Kinematykę Prostą (FK) z obecnych kątów
        q0 = np.deg2rad(current_joints_deg)
        current_pose = self.fkine(q0)

        # Ekstrahujemy pozycję i rotację do ładnej listy (tak samo jak w get_position)
        curr_xyz = current_pose.t.tolist()
        curr_rpy = np.rad2deg(current_pose.rpy()).tolist()
        current_cartesian = [round(val, 2) for val in (curr_xyz + curr_rpy)]

        # 2. Parsujemy prędkość z pierwszego elementu
        speed_percent = float(move_cartesian[0])

        # 3. Ustawienia kroku
        MAX_STEP_MM = 0.25
        MAX_STEP_DEG = 1.0

        step_mm = (speed_percent / 100.0) * MAX_STEP_MM
        step_rad = np.deg2rad((speed_percent / 100.0) * MAX_STEP_DEG)

        dx, dy, dz = 0.0, 0.0, 0.0
        d_roll, d_pitch, d_yaw = 0.0, 0.0, 0.0

        # 4. Sprawdzamy kierunek z tablicy GUI
        if move_cartesian[1] == "+":
            dx = step_mm
        elif move_cartesian[1] == "-":
            dx = -step_mm

        elif move_cartesian[2] == "+":
            dy = step_mm
        elif move_cartesian[2] == "-":
            dy = -step_mm

        elif move_cartesian[3] == "+":
            dz = step_mm
        elif move_cartesian[3] == "-":
            dz = -step_mm

        elif move_cartesian[4] == "+":
            d_roll = step_rad
        elif move_cartesian[4] == "-":
            d_roll = -step_rad

        elif move_cartesian[5] == "+":
            d_pitch = step_rad
        elif move_cartesian[5] == "-":
            d_pitch = -step_rad

        elif move_cartesian[6] == "+":
            d_yaw = step_rad
        elif move_cartesian[6] == "-":
            d_yaw = -step_rad

        # 5. Tworzymy macierz przesunięcia i nową pozycję docelową
        delta_pose = SE3.Trans(dx, dy, dz) * SE3.RPY(
            [d_roll, d_pitch, d_yaw], order="zyx"
        )
        target_pose = delta_pose * current_pose

        # 6. Liczymy Kinematykę Odwrotną (IK)
        sol = self.ikine_LM(target_pose, q0=q0)

        if sol.success:
            new_joints = np.rad2deg(sol.q).tolist()
            # Zwracamy obie listy!
            return current_cartesian, new_joints
        else:
            # Jeśli osobliwość/poza zasięgiem, zwracamy obecne kartezjańskie i STARE kąty (brak ruchu)
            return current_cartesian, current_joints_deg

    def update_joint_limits(self, servos_config: list[dict]):
        """
        Nadpisuje domyślne limity przegubów na podstawie konfiguracji ze sprzętu.
        """
        for i in range(6):
            # Wyciągamy fizyczne limity (np. 0 i 180)
            phys_min = servos_config[i]["map_min"]
            phys_max = servos_config[i]["map_max"]

            # Wpisujemy limity do biblioteki (w radianach)
            self.links[i].qlim = [np.deg2rad(phys_min), np.deg2rad(phys_max)]

        print("[KINEMATYKA] Zaktualizowano limity ruchów z konfiguracji sprzętowej!")

    def calculate_rrmc_from_cartesian_jog(
        self, current_joints_deg: list[float], move_cartesian: list[str]
    ) -> tuple[list[float], list[float]]:
        """
        Sterowanie oparte na Jakobianie (Resolved Rate Motion Control).
        Parsuje wektor move_cartesian i wylicza prędkości silników.
        """
        # 1. Przygotowanie danych wejściowych
        q = np.deg2rad(current_joints_deg)
        dt = 0.02  # Krok czasu dla 50Hz

        # Obliczamy aktualną pozycję (FK) dla interfejsu
        current_pose = self.fkine(q)
        curr_xyz = current_pose.t.tolist()
        curr_rpy = np.rad2deg(current_pose.rpy()).tolist()
        current_cartesian = [round(val, 2) for val in (curr_xyz + curr_rpy)]

        # 2. Definicja bazowych prędkości
        speed_percent = float(move_cartesian[0]) / 100.0
        MAX_LINEAR_VEL = 50.0  # mm/s
        MAX_ANGULAR_VEL = 0.5  # rad/s

        # 3. Budowa wektora prędkości kartezjańskiej v = [vx, vy, vz, wx, wy, wz]
        v_world = np.zeros(6)

        # Translacje (X, Y, Z)
        if move_cartesian[1] == "+":
            v_world[0] = MAX_LINEAR_VEL * speed_percent
        elif move_cartesian[1] == "-":
            v_world[0] = -MAX_LINEAR_VEL * speed_percent

        if move_cartesian[2] == "+":
            v_world[1] = MAX_LINEAR_VEL * speed_percent
        elif move_cartesian[2] == "-":
            v_world[1] = -MAX_LINEAR_VEL * speed_percent

        if move_cartesian[3] == "+":
            v_world[2] = MAX_LINEAR_VEL * speed_percent
        elif move_cartesian[3] == "-":
            v_world[2] = -MAX_LINEAR_VEL * speed_percent

        # Rotacje (Roll, Pitch, Yaw) - wokół osi świata
        if move_cartesian[4] == "+":
            v_world[3] = MAX_ANGULAR_VEL * speed_percent
        elif move_cartesian[4] == "-":
            v_world[3] = -MAX_ANGULAR_VEL * speed_percent

        if move_cartesian[5] == "+":
            v_world[4] = MAX_ANGULAR_VEL * speed_percent
        elif move_cartesian[5] == "-":
            v_world[4] = -MAX_ANGULAR_VEL * speed_percent

        if move_cartesian[6] == "+":
            v_world[5] = MAX_ANGULAR_VEL * speed_percent
        elif move_cartesian[6] == "-":
            v_world[5] = -MAX_ANGULAR_VEL * speed_percent

        # 4. Obliczanie Jakobianu i prędkości przegubów
        # jacob0 liczy Jakobian w układzie bazowym (World Frame)
        J = self.jacob0(q)

        # Pseudoinwersja Jakobianu (wykorzystujemy pinv dla stabilności przy osobliwościach)
        J_pinv = np.linalg.pinv(J)

        # q_dot to prędkości kątowe silników (rad/s)
        q_dot = J_pinv @ v_world

        # 5. Skalowanie bezpieczeństwa (nie pozwól silnikom kręcić się zbyt szybko)
        MAX_Q_DOT = 1.0  # rad/s
        max_current_q_dot = np.max(np.abs(q_dot))
        if max_current_q_dot > MAX_Q_DOT:
            q_dot = q_dot * (MAX_Q_DOT / max_current_q_dot)

        # 6. Całkowanie (wyliczanie nowej pozycji)
        q_new = q + (q_dot * dt)

        # 7. Sprawdzanie limitów sprzętowych (qlim)
        # for i in range(6):
        #     if self.links[i].qlim is not None:
        #         q_new[i] = np.clip(
        #             q_new[i], self.links[i].qlim[0], self.links[i].qlim[1]
        #         )

        # Powrót do stopni
        new_joints_deg = np.rad2deg(q_new).tolist()

        return current_cartesian, new_joints_deg


Robot6Dof = Cookie6DofRobot()
