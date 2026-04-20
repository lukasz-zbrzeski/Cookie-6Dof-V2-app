import numpy as np
import roboticstoolbox as rtb
from spatialmath import SE3


class Cookie6DofRobot(rtb.DHRobot):
    def __init__(self, custom_tool_x=-65.0):
        # 1. Definicja stałych parametrów fizycznych
        BASE_OFFSET = 40.0
        a1 = 47.0
        a2 = 135.0
        a3 = 29.55
        d1 = 101.0 + BASE_OFFSET
        d4 = 154.25
        d6 = 56.122

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
        flange = SE3.Tz(25.5)
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


Robot6Dof = Cookie6DofRobot()
