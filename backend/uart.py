# COMMUNICATION WITH ROBOT ARM VIA UART
import serial
import serial.tools.list_ports
import time
import threading
import queue
from robot_state import robot_state


class RobotUartController:
    def __init__(self):
        self.ser = None
        self.is_connected = False

        # 1. Tworzymy bezpieczną kolejkę na wiadomości wychodzące
        self.tx_queue = queue.Queue()

        # 2. Zmienne do kontrolowania wątku
        self.worker_thread = None
        self._stop_thread = False

    def list_serial_ports(self):
        com_ports = list(serial.tools.list_ports.comports())
        stm_port = []
        for p in com_ports:
            if "STM" in p.description:  # Szukamy portu, który zawiera "STM"
                stm_port.append(p.device)
        return stm_port

    def connect(self, com_port: str, baud_rate: int):
        if self.is_connected:
            self.disconnect()

        # Otwieramy port (Zwiększyłem timeout do 0.1s dla pewności)
        try:
            self.ser = serial.Serial(com_port, baud_rate, timeout=0.1)
            print(f"Otwarto port: {self.ser.name}")
        except Exception as e:
            print(f"Blad otwarcia portu: {e}")
            return False

        # UWAGA: Otwarcie portu często resetuje STM32.
        # Dajemy mu 2 sekundy na uruchomienie się i wysłanie "Zaczynamy!..."
        print("Czekam na uruchomienie STM32...")
        time.sleep(2)

        # Czyścimy bufory! Usuwamy to, co STM32 wysłał przy starcie,
        # żeby mieć czystą linię przed wysłaniem komend.
        self.ser.reset_input_buffer()
        self.ser.reset_output_buffer()

        # 2. Wysyłamy komendę aktywującą strumień
        print("\n--- INICJALIZACJA ---")

        try:
            self.ser.write(b"START_STREAM;")
            self.ser.flush()
            time.sleep(0.1)

            # Odczyt z zabezpieczeniem przed "krzakami" (errors='ignore')
            raw_bytes = self.ser.readline()
            odpowiedz_start = raw_bytes.decode("utf-8", errors="ignore").strip()

            # SUPER WAŻNE DEBUGOWANIE - to zobaczysz w logach Dockera:
            print(f"[DEBUG] Surowe bajty z STM32: {raw_bytes}")
            print(f"[DEBUG] Zdekodowany tekst: '{odpowiedz_start}'")

            if odpowiedz_start != "ACK_STREAM":
                print(
                    "[BŁĄD] Oczekiwano 'ACK_STREAM', a otrzymano coś innego. Przerywam."
                )
                self.ser.close()
                return False

            print("[SUKCES] Strumień danych aktywowany!")
            self.is_connected = True

            # 3. Jeśli połączyliśmy się pomyślnie, uruchamiamy wątek w tle!
            self._start_worker()

            return True

        except Exception as e:
            print(f"[KRYTYCZNY BŁĄD PODCZAS CZYTANIA]: {e}")
            if self.ser and self.ser.is_open:
                self.ser.close()
            return False

    def disconnect(self):
        if self.is_connected:
            # 1. Zatrzymujemy pętlę w tle
            self._stop_thread = True

            # 2. Czekamy ułamek sekundy, aż wątek kulturalnie się wyłączy
            if self.worker_thread:
                self.worker_thread.join(timeout=1.0)

            # 3. Zamykamy port fizycznie
            if self.ser and self.ser.is_open:
                self.ser.close()

            self.is_connected = False
            print("Port zamknięty i wątek zatrzymany.")

    def get_config(self):
        if self.ser and self.ser.is_open:
            try:
                self.ser.write(b"GET_CONFIG;")
                self.ser.flush()

                # readline() samo z siebie czeka na znak '\n',
                # więc sleep(0.1) można zostawić tylko jako mały bufor bezpieczeństwa
                time.sleep(0.1)

                raw_bytes = self.ser.readline()
                config_str = raw_bytes.decode("utf-8", errors="ignore").strip()
                print(f"[DEBUG] Otrzymana konfiguracja: '{raw_bytes}'")

                # --- ROZPOCZYNAMY PARSOWANIE ---
                # Sprawdzamy, czy ramka ma poprawny nagłówek i zakończenie
                if config_str.startswith("CFG[") and config_str.endswith("];"):
                    # Wycinamy sam środek (bez 'CFG[' i '];')
                    content = config_str[4:-2]
                    servos_data = content.split("|")

                    # Upewniamy się, że przyszło dokładnie 6 serw
                    if len(servos_data) != 6:
                        print(
                            f"[BŁĄD] Ramka zawiera {len(servos_data)} serw zamiast 6!"
                        )
                        return None

                    parsed_servos = []

                    # Przechodzimy przez każde serwo i wyciągamy parametry
                    for index, servo_str in enumerate(servos_data):
                        parts = servo_str.split(",")

                        # Sprawdzamy, czy serwo ma dokładnie 4 parametry (offset, min, max, angle)
                        if len(parts) == 4:
                            servo_dict = {
                                "id": index,
                                "offset": int(parts[0]),
                                "map_min": int(parts[1]),
                                "map_max": int(parts[2]),
                                "angle": float(parts[3]),
                            }
                            parsed_servos.append(servo_dict)
                        else:
                            print(
                                f"[BŁĄD] Uszkodzone dane w serwie {index}: {servo_str}"
                            )
                            return None

                    print("[SUKCES] Konfiguracja rozpakowana pomyślnie!")
                    return parsed_servos  # Zwracamy gotową listę obiektów!
                else:
                    print("[BŁĄD] Ramka ma nieprawidłowy format (brak 'CFG[' lub '];')")
                    return None

            except Exception as e:
                print(f"[BŁĄD PODCZAS ODCZYTU KONFIGURACJI]: {e}")
                return None
        else:
            print("[BŁĄD] Port nie jest otwarty!")
            return None

    def is_open(self):
        return self.ser is not None and self.ser.is_open

    # ==========================================================
    # SEKCJA WĄTKU (BACKGROUND WORKER)
    # ==========================================================

    def queue_command(self, command: str):
        """Używaj tej funkcji w API, żeby wysłać komendę do robota."""
        if self.is_connected:
            self.tx_queue.put(command)

    def queue_clear(self):
        """Szybkie czyszczenie kolejki (np. w przypadku awaryjnego STOP)."""
        with self.tx_queue.mutex:
            self.tx_queue.queue.clear()

    def _start_worker(self):
        """Uruchamia wątek pracownika w tle."""
        self._stop_thread = False
        # daemon=True sprawia, że wątek zamknie się sam, jeśli zamkniesz aplikację FastAPI
        self.worker_thread = threading.Thread(target=self._uart_worker, daemon=True)
        self.worker_thread.start()

    def _uart_worker(self):
        """Główna pętla wątku. Działa non-stop dopóki _stop_thread = False."""
        print("[WORKER] Wątek tła uruchomiony. Gotowy do wysyłania (50Hz).")
        LOOP_INTERVAL = 0.02  # 20 ms

        while not self._stop_thread:
            start_time = time.perf_counter()

            # 1. Najpierw sprawdzamy kolejkę na wypadek innych, pilnych komend
            # (np. awaryjny STOP, zmiana parametrów)
            if not self.tx_queue.empty():
                try:
                    command = self.tx_queue.get_nowait()
                    self.ser.write(command.encode("utf-8"))
                    self.ser.flush()
                except queue.Empty:
                    pass

            # 2. CIĄGŁE WYSYŁANIE RUCHU MANUALNEGO (HEARTBEAT)
            if robot_state["mode"] == "manual":
                # Zamienia listę ["0.0", "0", "0", "0", "0", "0", "0"]
                # na jednego stringa: "0.0,0,0,0,0,0,0"
                move_payload = ",".join(robot_state["move"])

                # Budujemy gotową ramkę dla STM32
                move_command = f"MOVE_JOINTS[{move_payload}];\n"

                try:
                    self.ser.write(move_command.encode("utf-8"))
                    self.ser.flush()
                except Exception:
                    # Celowo puste - jeśli jeden pakiet na 50 wypadnie (bo np. kabel drgnął),
                    # nie chcemy wywalać całego wątku. Za 20ms pójdzie kolejny.
                    pass

            # 3. Synchronizacja czasu - czekamy do pełnych 20ms
            elapsed = time.perf_counter() - start_time
            sleep_time = LOOP_INTERVAL - elapsed

            if sleep_time > 0:
                time.sleep(sleep_time)


# Zamiast globalnego `ser`, tworzymy jedną globalną instancję całej naszej klasy
# Dzięki temu inne pliki (np. main.py) zaimportują już gotowy, działający obiekt.
uart = RobotUartController()
