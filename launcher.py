import customtkinter as ctk
import subprocess
import sys
import os
import time
import threading
import psutil
import webbrowser
import requests
import queue
from datetime import datetime
from tkinter import messagebox

# Configuration
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("dark-blue")

BACKEND_DIR = os.path.join(os.getcwd(), "backend")
FRONTEND_DIR = os.path.join(os.getcwd(), "Creador-de-sopas-de-letras-Ultra-IA")
BACKEND_PORT = 8000
FRONTEND_PORT = 5173

# Commands
# Using shell=True for npm is often necessary on Windows, but we need to be careful with killing it.
BACKEND_CMD = [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", str(BACKEND_PORT)]
FRONTEND_CMD = ["npm", "run", "dev", "--", "--port", str(FRONTEND_PORT)] 

class LogQueue:
    def __init__(self):
        self.queue = queue.Queue()

    def write(self, source, msg):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.queue.put(f"[{timestamp}] [{source}] {msg}")

log_queue = LogQueue()

def enqueue_output(process, source):
    for line in iter(process.stdout.readline, b''):
        try:
            line_str = line.decode('utf-8').strip()
            if line_str:
                log_queue.write(source, line_str)
        except:
            pass
    process.stdout.close()

class SmartService:
    def __init__(self, name, command, cwd, port, check_url=None):
        self.name = name
        self.command = command
        self.cwd = cwd
        self.port = port
        self.check_url = check_url
        self.process = None
        self.thread = None

    def start(self):
        if self.is_running():
            log_queue.write("SYSTEM", f"{self.name} ya esta corriendo.")
            return

        if self.check_port_in_use():
            log_queue.write("SYSTEM", f"Puerto {self.port} ocupado. Intentando liberar...")
            for i in range(3): # Retry 3 times
                self.force_kill_port()
                time.sleep(1)
                if not self.check_port_in_use():
                    log_queue.write("SYSTEM", f"Puerto {self.port} liberado exitosamente.")
                    break
            
            if self.check_port_in_use():
                log_queue.write("ERROR", f"No se pudo liberar el puerto {self.port} tras 3 intentos. Algo lo bloquea.")
                return False

        try:
            log_queue.write("SYSTEM", f"Iniciando {self.name}...")
            
            # Create process with pipes for output capture
            self.process = subprocess.Popen(
                self.command,
                cwd=self.cwd,
                shell=True if "npm" in self.command[0] else False,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT, # Merge stderr into stdout
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == 'win32' else 0
            )
            
            # Start monitoring thread
            t = threading.Thread(target=enqueue_output, args=(self.process, self.name))
            t.daemon = True
            t.start()
            
            return True
        except Exception as e:
            log_queue.write("ERROR", f"Fallo al iniciar {self.name}: {e}")
            return False

    def stop(self):
        log_queue.write("SYSTEM", f"Deteniendo {self.name}...")
        
        # 1. Kill by Process Object
        if self.process:
            try:
                if sys.platform == 'win32':
                    subprocess.run(f"taskkill /F /T /PID {self.process.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    parent = psutil.Process(self.process.pid)
                    for child in parent.children(recursive=True):
                        child.kill()
                    parent.kill()
            except Exception as e:
                log_queue.write("ERROR", f"Error al matar proceso {self.name}: {e}")
            self.process = None

        # 2. Force Kill by Port (The "Nuclear Option")
        self.force_kill_port()

    def force_kill_port(self):
        """Finds any process listening on the service port and kills it using multiple methods."""
        log_queue.write("SYSTEM", f"Escaneando puerto {self.port} para liberar...")
        killed = False
        pids_to_kill = []
        
        try:
            # Method 1: psutil - Most reliable
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    for conn in proc.net_connections(kind='inet'):
                        if conn.laddr.port == self.port:
                            pid = proc.pid
                            name = proc.name()
                            log_queue.write("SYSTEM", f"Encontrado proceso {name} (PID: {pid}) en puerto {self.port}")
                            pids_to_kill.append(pid)
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
            
            # Method 2: netstat - Fallback for processes psutil can't detect
            if sys.platform == 'win32':
                try:
                    cmd = f"netstat -ano | findstr :{self.port}"
                    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    stdout, _ = process.communicate()
                    
                    if stdout:
                        output = stdout.decode(errors='ignore')
                        lines = output.strip().split('\n')
                        for line in lines:
                            parts = line.strip().split()
                            if len(parts) >= 5:
                                port_part = parts[1]
                                pid_str = parts[-1]
                                if f":{self.port}" in port_part and pid_str.isdigit():
                                    pid = int(pid_str)
                                    if pid > 0 and pid not in pids_to_kill:
                                        log_queue.write("SYSTEM", f"Netstat detectó PID {pid} en puerto {self.port}")
                                        pids_to_kill.append(pid)
                except Exception as e:
                    pass
            
            # Now kill all detected PIDs using multiple methods
            for pid in pids_to_kill:
                log_queue.write("SYSTEM", f"Terminando PID {pid}...")
                
                # Method A: taskkill /F /T (kills process tree)
                try:
                    result = subprocess.run(
                        f"taskkill /F /T /PID {pid}",
                        shell=True,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        timeout=5
                    )
                    if result.returncode == 0:
                        log_queue.write("SYSTEM", f"✅ PID {pid} terminado con taskkill")
                        killed = True
                        continue
                except Exception as e:
                    pass
                
                # Method B: PowerShell Stop-Process (more forceful)
                try:
                    result = subprocess.run(
                        f"powershell -Command \"Stop-Process -Id {pid} -Force -ErrorAction SilentlyContinue\"",
                        shell=True,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        timeout=5
                    )
                    log_queue.write("SYSTEM", f"✅ PID {pid} terminado con PowerShell")
                    killed = True
                except Exception as e:
                    pass
                
                # Method C: psutil (direct Python kill)
                try:
                    proc = psutil.Process(pid)
                    proc.kill()
                    log_queue.write("SYSTEM", f"✅ PID {pid} terminado con psutil")
                    killed = True
                except Exception as e:
                    pass
            
            if not pids_to_kill:
                log_queue.write("SYSTEM", f"No se encontraron procesos en puerto {self.port}")
            elif killed:
                log_queue.write("SYSTEM", f"✅ Puerto {self.port} liberado exitosamente")
            else:
                log_queue.write("ERROR", f"⚠️ No se pudo liberar el puerto {self.port}")

        except Exception as e:
            log_queue.write("ERROR", f"Error limpiando puerto {self.port}: {e}")

    def is_running(self):
        if self.process:
            if self.process.poll() is None:
                return True
            else:
                self.process = None
        return False

    def check_port_in_use(self):
        for conn in psutil.net_connections():
            if conn.laddr.port == self.port:
                return True
        return False

    def scan_port_status(self):
        """Returns detailed information about what process is using the port"""
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    for conn in proc.net_connections(kind='inet'):
                        if conn.laddr.port == self.port:
                            return {
                                'pid': proc.pid,
                                'name': proc.name(),
                                'cmdline': ' '.join(proc.cmdline()) if proc.cmdline() else 'N/A',
                                'status': conn.status,
                                'port': self.port
                            }
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
        except Exception as e:
            log_queue.write("ERROR", f"Error escaneando puerto {self.port}: {e}")
        return None

    def check_health(self):
        if not self.check_url:
            return self.is_running()
        try:
            requests.get(self.check_url, timeout=1)
            return True
        except:
            return False

    def get_stats(self):
        if not self.is_running():
            return 0.0, 0.0
        try:
            proc = psutil.Process(self.process.pid)
            cpu = proc.cpu_percent(interval=None)
            mem = proc.memory_info().rss
            for child in proc.children(recursive=True):
                try:
                    cpu += child.cpu_percent(interval=None)
                    mem += child.memory_info().rss
                except:
                    pass
            return cpu, mem / (1024 * 1024)
        except:
            return 0.0, 0.0

class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Sopa de Letras IA - Smart Launcher v2.0")
        self.geometry("900x600")
        
        # Grid Layout
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Services
        self.backend = SmartService("BACKEND", BACKEND_CMD, BACKEND_DIR, BACKEND_PORT, f"http://localhost:{BACKEND_PORT}/")
        self.frontend = SmartService("FRONTEND", FRONTEND_CMD, FRONTEND_DIR, FRONTEND_PORT, f"http://localhost:{FRONTEND_PORT}/")

        self.create_sidebar()
        self.create_dashboard()
        self.create_terminal()
        
        # Select Dashboard by default
        self.select_frame("dashboard")
        
        # Loops
        self.update_logs()
        self.update_stats()

    def create_sidebar(self):
        self.sidebar = ctk.CTkFrame(self, width=140, corner_radius=0)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.grid_rowconfigure(4, weight=1)

        self.logo = ctk.CTkLabel(self.sidebar, text="LAUNCHER\nv2.0", font=ctk.CTkFont(size=20, weight="bold"))
        self.logo.grid(row=0, column=0, padx=20, pady=(20, 10))

        self.btn_dash = ctk.CTkButton(self.sidebar, text="Dashboard", command=lambda: self.select_frame("dashboard"))
        self.btn_dash.grid(row=1, column=0, padx=20, pady=10)

        self.btn_term = ctk.CTkButton(self.sidebar, text="Terminal", command=lambda: self.select_frame("terminal"))
        self.btn_term.grid(row=2, column=0, padx=20, pady=10)

    def create_dashboard(self):
        self.dash_frame = ctk.CTkFrame(self, corner_radius=0, fg_color="transparent")
        self.dash_frame.grid_columnconfigure(0, weight=1)

        # Header
        self.header = ctk.CTkLabel(self.dash_frame, text="System Status", font=ctk.CTkFont(size=24, weight="bold"))
        self.header.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="w")

        # Smart Start Button
        self.smart_btn = ctk.CTkButton(self.dash_frame, text="⚡ SMART START SYSTEM", height=50, 
                                     font=ctk.CTkFont(size=16, weight="bold"),
                                     fg_color="#2CC985", hover_color="#229A65",
                                     command=self.run_smart_start)
        self.smart_btn.grid(row=1, column=0, padx=20, pady=10, sticky="ew")

        # Cards
        self.card_backend = self.create_service_card(self.dash_frame, "Backend API", "Port: 8000", self.backend, 2)
        self.card_frontend = self.create_service_card(self.dash_frame, "Frontend UI", "Port: 5173", self.frontend, 3)

        # Global Actions
        self.actions_frame = ctk.CTkFrame(self.dash_frame, fg_color="transparent")
        self.actions_frame.grid(row=4, column=0, padx=20, pady=20, sticky="ew")
        self.actions_frame.grid_columnconfigure((0, 1), weight=1)

        self.restart_btn = ctk.CTkButton(self.actions_frame, text="REINICIAR TODO 🔄", height=40,
                                       fg_color="#3498DB", hover_color="#2980B9",
                                       command=self.restart_all)
        self.restart_btn.grid(row=0, column=0, padx=(0, 10), sticky="ew")

        self.stop_all_btn = ctk.CTkButton(self.actions_frame, text="DETENER TODO 🛑", height=40,
                                        fg_color="#E74C3C", hover_color="#C0392B", 
                                        command=self.stop_all)
        self.stop_all_btn.grid(row=0, column=1, padx=(10, 10), sticky="ew")

        self.web_btn = ctk.CTkButton(self.actions_frame, text="🌐 ABRIR WEB", height=40,
                                        fg_color="#8E44AD", hover_color="#9B59B6", 
                                        command=self.open_web)
        self.web_btn.grid(row=0, column=2, padx=(0, 0), sticky="ew")

        # Diagnostic and Force Cleanup Row
        self.diag_frame = ctk.CTkFrame(self.dash_frame, fg_color="transparent")
        self.diag_frame.grid(row=5, column=0, padx=20, pady=(0, 20), sticky="ew")
        self.diag_frame.grid_columnconfigure((0, 1), weight=1)

        self.scan_btn = ctk.CTkButton(self.diag_frame, text="🔍 DIAGNOSTICAR PUERTOS", height=40,
                                       fg_color="#F39C12", hover_color="#E67E22",
                                       command=self.run_diagnostics)
        self.scan_btn.grid(row=0, column=0, padx=(0, 10), sticky="ew")

        self.force_cleanup_btn = ctk.CTkButton(self.diag_frame, text="💥 FORZAR LIMPIEZA", height=40,
                                                fg_color="#E74C3C", hover_color="#C0392B",
                                                command=self.force_cleanup_all)
        self.force_cleanup_btn.grid(row=0, column=1, padx=(10, 0), sticky="ew")

    def create_service_card(self, parent, title, subtitle, service, row):
        card = ctk.CTkFrame(parent)
        card.grid(row=row, column=0, padx=20, pady=10, sticky="ew")
        card.grid_columnconfigure(1, weight=1)

        ctk.CTkLabel(card, text=title, font=ctk.CTkFont(size=16, weight="bold")).grid(row=0, column=0, padx=15, pady=(15,0), sticky="w")
        ctk.CTkLabel(card, text=subtitle, text_color="gray").grid(row=1, column=0, padx=15, pady=(0,5), sticky="w")

        # Status Indicator
        status_lbl = ctk.CTkLabel(card, text="OFFLINE", text_color="#E74C3C", font=ctk.CTkFont(weight="bold"))
        status_lbl.grid(row=0, column=2, padx=15, pady=15, sticky="e")
        service.status_label = status_lbl

        # Stats
        stats_lbl = ctk.CTkLabel(card, text="CPU: 0% | RAM: 0MB", font=ctk.CTkFont(family="Consolas"))
        stats_lbl.grid(row=1, column=1, columnspan=2, padx=15, pady=(0,5), sticky="e")
        service.stats_label = stats_lbl

        # Individual Control Buttons
        btn_frame = ctk.CTkFrame(card, fg_color="transparent")
        btn_frame.grid(row=2, column=0, columnspan=3, padx=15, pady=(0,15), sticky="ew")
        btn_frame.grid_columnconfigure((0,1,2), weight=1)

        start_btn = ctk.CTkButton(btn_frame, text="▶️ Iniciar", height=30,
                                   fg_color="#2CC985", hover_color="#229A65",
                                   command=lambda: threading.Thread(target=service.start).start())
        start_btn.grid(row=0, column=0, padx=(0,5), sticky="ew")

        stop_btn = ctk.CTkButton(btn_frame, text="⏹️ Detener", height=30,
                                  fg_color="#E74C3C", hover_color="#C0392B",
                                  command=lambda: threading.Thread(target=service.stop).start())
        stop_btn.grid(row=0, column=1, padx=5, sticky="ew")

        kill_btn = ctk.CTkButton(btn_frame, text="💀 Forzar", height=30,
                                  fg_color="#95A5A6", hover_color="#7F8C8D",
                                  command=lambda: self.force_kill_service(service))
        kill_btn.grid(row=0, column=2, padx=(5,0), sticky="ew")

        return card

    def create_terminal(self):
        self.term_frame = ctk.CTkFrame(self, corner_radius=0, fg_color="transparent")
        self.term_frame.grid_columnconfigure(0, weight=1)
        self.term_frame.grid_rowconfigure(1, weight=1)

        ctk.CTkLabel(self.term_frame, text="Live System Logs", font=ctk.CTkFont(size=20, weight="bold")).grid(row=0, column=0, padx=20, pady=20, sticky="w")

        self.console = ctk.CTkTextbox(self.term_frame, font=ctk.CTkFont(family="Consolas", size=12), text_color="#00FF00", fg_color="black")
        self.console.grid(row=1, column=0, padx=20, pady=(0, 20), sticky="nsew")
        self.console.configure(state="disabled")

    def select_frame(self, name):
        if name == "dashboard":
            self.dash_frame.grid(row=0, column=1, sticky="nsew")
            self.term_frame.grid_forget()
        else:
            self.term_frame.grid(row=0, column=1, sticky="nsew")
            self.dash_frame.grid_forget()

    def run_smart_start(self):
        threading.Thread(target=self._smart_start_thread).start()

    def _smart_start_thread(self):
        self.after(0, lambda: self.smart_btn.configure(state="disabled", text="INICIANDO SISTEMA..."))
        self.after(0, lambda: self.restart_btn.configure(state="disabled"))
        
        # 1. Start Backend
        if not self.backend.is_running():
            log_queue.write("SYSTEM", "Iniciando Backend...")
            if self.backend.start():
                # Wait for health check
                for i in range(10):
                    log_queue.write("SYSTEM", f"Esperando Backend (Intento {i+1}/10)...")
                    if self.backend.check_health():
                        log_queue.write("SYSTEM", "Backend ONLINE y respondiendo!")
                        break
                    time.sleep(1)
            else:
                self.after(0, self.reset_buttons)
                return
        
        # 2. Start Frontend
        if not self.frontend.is_running():
            log_queue.write("SYSTEM", "Iniciando Frontend...")
            self.frontend.start()
            time.sleep(3) # Give it a moment to spin up
        
        # 3. Open Browser (MANUAL ONLY NOW)
        log_queue.write("SYSTEM", "Sistema listo. Usa el botón 'ABRIR WEB' para entrar.")
        # webbrowser.open(f"http://localhost:{FRONTEND_PORT}")
        
        self.after(0, self.reset_buttons)
        self.after(0, lambda: self.select_frame("terminal")) # Switch to terminal to show user what's happening

    def restart_all(self):
        threading.Thread(target=self._restart_thread).start()

    def _restart_thread(self):
        self.after(0, lambda: self.smart_btn.configure(state="disabled"))
        self.after(0, lambda: self.restart_btn.configure(state="disabled", text="REINICIANDO..."))
        
        log_queue.write("SYSTEM", "=== REINICIO SOLICITADO ===")
        
        # Stop everything
        self.backend.stop()
        self.frontend.stop()
        
        # Wait for ports to free up
        log_queue.write("SYSTEM", "Esperando liberacion de puertos...")
        for i in range(10):
            if not self.backend.check_port_in_use() and not self.frontend.check_port_in_use():
                break
            time.sleep(1)
            
        time.sleep(1) # Extra safety buffer
        
        # Start again
        self._smart_start_thread()

    def stop_all(self):
        threading.Thread(target=self._stop_all_thread).start()
    
    def _stop_all_thread(self):
        self.after(0, lambda: self.stop_all_btn.configure(state="disabled", text="DETENIENDO..."))
        
        log_queue.write("SYSTEM", "=== DETENIENDO SERVICIOS ===")
        
        # Stop both services
        self.backend.stop()
        self.frontend.stop()
        
        # Wait for ports to be released (up to 10 seconds)
        log_queue.write("SYSTEM", "Esperando liberación de puertos...")
        for i in range(10):
            backend_free = not self.backend.check_port_in_use()
            frontend_free = not self.frontend.check_port_in_use()
            
            if backend_free and frontend_free:
                log_queue.write("SYSTEM", "✅ Todos los puertos liberados exitosamente")
                break
            
            if not backend_free:
                log_queue.write("SYSTEM", f"Esperando backend (puerto {BACKEND_PORT})...")
            if not frontend_free:
                log_queue.write("SYSTEM", f"Esperando frontend (puerto {FRONTEND_PORT})...")
            
            time.sleep(1)
        
        # Final verification
        if self.backend.check_port_in_use() or self.frontend.check_port_in_use():
            log_queue.write("ERROR", "⚠️ Algunos puertos siguen ocupados. Usa 'FORZAR LIMPIEZA' si persiste.")
        
        self.after(0, self.reset_buttons)
        log_queue.write("SYSTEM", "Todos los servicios detenidos.")

    def reset_buttons(self):
        self.smart_btn.configure(state="normal", text="⚡ SMART START SYSTEM")
        self.restart_btn.configure(state="normal", text="REINICIAR TODO 🔄")

    def open_web(self):
        webbrowser.open(f"http://localhost:{FRONTEND_PORT}")

    def run_diagnostics(self):
        """Scan and display diagnostic information about port usage"""
        log_queue.write("SYSTEM", "=== DIAGNÓSTICO DE PUERTOS ===")
        
        for service in [self.backend, self.frontend]:
            log_queue.write("SYSTEM", f"\nEscaneando puerto {service.port} ({service.name})...")
            
            if service.check_port_in_use():
                info = service.scan_port_status()
                if info:
                    log_queue.write("SYSTEM", f"  ⚠️ PUERTO OCUPADO")
                    log_queue.write("SYSTEM", f"  PID: {info['pid']}")
                    log_queue.write("SYSTEM", f"  Proceso: {info['name']}")
                    log_queue.write("SYSTEM", f"  Comando: {info['cmdline'][:100]}..." if len(info['cmdline']) > 100 else f"  Comando: {info['cmdline']}")
                    log_queue.write("SYSTEM", f"  Estado: {info['status']}")
                else:
                    log_queue.write("SYSTEM", f"  ⚠️ PUERTO OCUPADO (no se pudo identificar proceso)")
            else:
                log_queue.write("SYSTEM", f"  ✅ Puerto {service.port} LIBRE")
        
        log_queue.write("SYSTEM", "\n=== FIN DIAGNÓSTICO ===")
        self.after(0, lambda: self.select_frame("terminal"))

    def force_cleanup_all(self):
        """Force kill all processes on the configured ports"""
        result = messagebox.askyesno(
            "Confirmación de Limpieza Forzada",
            f"Esto FORZARÁ el cierre de todos los procesos en los puertos {BACKEND_PORT} y {FRONTEND_PORT}.\n\n"
            "¿Estás seguro de continuar?"
        )
        
        if result:
            threading.Thread(target=self._force_cleanup_thread).start()

    def _force_cleanup_thread(self):
        log_queue.write("SYSTEM", "=== LIMPIEZA FORZADA INICIADA ===")
        
        # Stop services normally first
        self.backend.stop()
        self.frontend.stop()
        
        time.sleep(2)
        
        # Force kill any remaining processes
        for service in [self.backend, self.frontend]:
            log_queue.write("SYSTEM", f"Forzando limpieza de puerto {service.port}...")
            for attempt in range(3):
                service.force_kill_port()
                time.sleep(1)
                if not service.check_port_in_use():
                    log_queue.write("SYSTEM", f"✅ Puerto {service.port} liberado")
                    break
                else:
                    log_queue.write("SYSTEM", f"Intento {attempt + 1}/3: Puerto {service.port} aún ocupado...")
        
        log_queue.write("SYSTEM", "=== LIMPIEZA FORZADA COMPLETADA ===")
        log_queue.write("SYSTEM", "Ahora puedes usar SMART START para reiniciar el sistema.")
        self.after(0, self.reset_buttons)
        self.after(0, lambda: self.select_frame("terminal"))

    def force_kill_service(self, service):
        """Force kill a specific service's port"""
        result = messagebox.askyesno(
            "Confirmación de Fuerza",
            f"Esto FORZARÁ el cierre de todos los procesos en el puerto {service.port} ({service.name}).\\n\\n"
            "¿Estás seguro de continuar?"
        )
        
        if result:
            threading.Thread(target=self._force_kill_service_thread, args=(service,)).start()
    
    def _force_kill_service_thread(self, service):
        log_queue.write("SYSTEM", f"=== FORZAR LIMPIEZA: {service.name} (Puerto {service.port}) ===")
        
        # First try normal stop
        service.stop()
        time.sleep(1)
        
        # Then force kill
        for attempt in range(3):
            log_queue.write("SYSTEM", f"Intento {attempt + 1}/3...")
            service.force_kill_port()
            time.sleep(1)
            
            if not service.check_port_in_use():
                log_queue.write("SYSTEM", f"✅ {service.name} - Puerto {service.port} LIBERADO")
                break
            else:
                log_queue.write("SYSTEM", f"⚠️ Puerto {service.port} aún ocupado, reintentando...")
        
        # Final check
        if service.check_port_in_use():
            log_queue.write("ERROR", f"❌ No se pudo liberar el puerto {service.port} tras 3 intentos")
            log_queue.write("SYSTEM", "Intenta cerrar manualmente cualquier aplicación que use ese puerto")
        
        log_queue.write("SYSTEM", f"=== FIN LIMPIEZA: {service.name} ===")
        self.after(0, lambda: self.select_frame("terminal"))


    def update_logs(self):
        try:
            while True:
                msg = log_queue.queue.get_nowait()
                self.console.configure(state="normal")
                self.console.insert("end", msg + "\n")
                self.console.see("end")
                self.console.configure(state="disabled")
        except queue.Empty:
            pass
        self.after(100, self.update_logs)

    def update_stats(self):
        for service in [self.backend, self.frontend]:
            if service.is_running():
                service.status_label.configure(text="ONLINE", text_color="#2CC985")
                cpu, mem = service.get_stats()
                service.stats_label.configure(text=f"CPU: {cpu:.1f}% | RAM: {mem:.1f} MB")
            else:
                service.status_label.configure(text="OFFLINE", text_color="#E74C3C")
                service.stats_label.configure(text="CPU: 0% | RAM: 0MB")
        
        self.after(1000, self.update_stats)

    def on_close(self):
        self.stop_all()
        self.destroy()

if __name__ == "__main__":
    app = App()
    app.protocol("WM_DELETE_WINDOW", app.on_close)
    app.mainloop()
