import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import subprocess
import threading
import sys
import os
import time
import signal
import webbrowser

# Configuration
BACKEND_DIR = os.path.join(os.getcwd(), "backend")
FRONTEND_DIR = os.path.join(os.getcwd(), "Creador-de-sopas-de-letras-Ultra-IA")
BACKEND_PORT = 8000
FRONTEND_PORT = 3001

class LauncherApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sopa de Letras IA - Launcher")
        self.root.geometry("600x500")
        self.root.configure(bg="#f0f2f5")

        # Process Handles
        self.backend_process = None
        self.frontend_process = None
        self.is_running = False

        # UI Setup
        self.setup_ui()
        
        # Handle Close
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def setup_ui(self):
        # Styles
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TFrame", background="#f0f2f5")
        style.configure("TLabel", background="#f0f2f5", font=("Segoe UI", 10))
        style.configure("Header.TLabel", font=("Segoe UI", 16, "bold"), foreground="#1a73e8")
        style.configure("Status.TLabel", font=("Segoe UI", 10, "bold"))
        
        # Main Container
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Header
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 20))
        ttk.Label(header_frame, text="Sopa de Letras IA", style="Header.TLabel").pack(side=tk.LEFT)
        
        # Status Section
        status_frame = ttk.LabelFrame(main_frame, text="Estado del Sistema", padding="10")
        status_frame.pack(fill=tk.X, pady=(0, 20))

        self.backend_status_var = tk.StringVar(value="Backend: Detenido")
        self.frontend_status_var = tk.StringVar(value="Frontend: Detenido")
        
        self.lbl_backend_status = ttk.Label(status_frame, textvariable=self.backend_status_var, foreground="red", style="Status.TLabel")
        self.lbl_backend_status.pack(anchor=tk.W, pady=2)
        
        self.lbl_frontend_status = ttk.Label(status_frame, textvariable=self.frontend_status_var, foreground="red", style="Status.TLabel")
        self.lbl_frontend_status.pack(anchor=tk.W, pady=2)

        # Controls Section
        controls_frame = ttk.Frame(main_frame)
        controls_frame.pack(fill=tk.X, pady=(0, 20))

        self.btn_start = ttk.Button(controls_frame, text="Iniciar Todo", command=self.start_all, width=15)
        self.btn_start.pack(side=tk.LEFT, padx=(0, 10))

        self.btn_stop = ttk.Button(controls_frame, text="Detener Todo", command=self.stop_all, state=tk.DISABLED, width=15)
        self.btn_stop.pack(side=tk.LEFT, padx=(0, 10))

        self.btn_open = ttk.Button(controls_frame, text="Abrir en Navegador", command=self.open_browser, state=tk.DISABLED, width=20)
        self.btn_open.pack(side=tk.LEFT, padx=(0, 10))

        # Console Output
        console_frame = ttk.LabelFrame(main_frame, text="Consola", padding="5")
        console_frame.pack(fill=tk.BOTH, expand=True)

        self.console_text = scrolledtext.ScrolledText(console_frame, height=10, state='disabled', font=("Consolas", 9), bg="#1e1e1e", fg="#d4d4d4")
        self.console_text.pack(fill=tk.BOTH, expand=True)

    def log(self, message, tag=None):
        self.console_text.config(state='normal')
        self.console_text.insert(tk.END, f"{message}\n", tag)
        self.console_text.see(tk.END)
        self.console_text.config(state='disabled')

    def update_status(self, running):
        self.is_running = running
        if running:
            self.backend_status_var.set("Backend: Ejecutando (Puerto 8000)")
            self.lbl_backend_status.config(foreground="green")
            self.frontend_status_var.set("Frontend: Ejecutando (Puerto 3001)")
            self.lbl_frontend_status.config(foreground="green")
            self.btn_start.config(state=tk.DISABLED)
            self.btn_stop.config(state=tk.NORMAL)
            self.btn_open.config(state=tk.NORMAL)
        else:
            self.backend_status_var.set("Backend: Detenido")
            self.lbl_backend_status.config(foreground="red")
            self.frontend_status_var.set("Frontend: Detenido")
            self.lbl_frontend_status.config(foreground="red")
            self.btn_start.config(state=tk.NORMAL)
            self.btn_stop.config(state=tk.DISABLED)
            self.btn_open.config(state=tk.DISABLED)

    def kill_process_on_port(self, port):
        try:
            # Find PID using netstat
            cmd = f"netstat -ano | findstr :{port}"
            result = subprocess.check_output(cmd, shell=True).decode()
            lines = result.strip().split('\n')
            for line in lines:
                parts = line.split()
                if len(parts) > 4:
                    pid = parts[-1]
                    self.log(f"Matando proceso en puerto {port} (PID: {pid})...")
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except subprocess.CalledProcessError:
            pass # No process found
        except Exception as e:
            self.log(f"Error al liberar puerto {port}: {e}")

    def start_all(self):
        self.log("Iniciando servicios...")
        
        # 1. Cleanup ports first
        self.kill_process_on_port(BACKEND_PORT)
        self.kill_process_on_port(FRONTEND_PORT)

        # 2. Start Backend
        def run_backend():
            venv_python = os.path.join(os.getcwd(), ".venv", "Scripts", "python.exe")
            if not os.path.exists(venv_python):
                venv_python = "python" # Fallback
            
            self.log(f"Iniciando Backend con: {venv_python}")
            try:
                self.backend_process = subprocess.Popen(
                    [venv_python, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", str(BACKEND_PORT)],
                    cwd=BACKEND_DIR,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                self.read_output(self.backend_process, "[BACKEND]")
            except Exception as e:
                self.log(f"Error iniciando Backend: {e}")

        # 3. Start Frontend
        def run_frontend():
            self.log("Iniciando Frontend...")
            try:
                self.frontend_process = subprocess.Popen(
                    ["npm", "run", "dev", "--", "--port", str(FRONTEND_PORT)],
                    cwd=FRONTEND_DIR,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    shell=True, # Needed for npm on Windows
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                self.read_output(self.frontend_process, "[FRONTEND]")
            except Exception as e:
                self.log(f"Error iniciando Frontend: {e}")

        threading.Thread(target=run_backend, daemon=True).start()
        threading.Thread(target=run_frontend, daemon=True).start()
        
        self.update_status(True)
        self.log("Servicios iniciados correctamente.")

    def read_output(self, process, prefix):
        def reader():
            while True:
                line = process.stdout.readline()
                if not line:
                    break
                # Filter out some noise if needed, or just log everything
                self.root.after(0, self.log, f"{prefix} {line.strip()}")
        threading.Thread(target=reader, daemon=True).start()

    def stop_all(self):
        self.log("Deteniendo servicios...")
        
        if self.backend_process:
            self.backend_process.terminate()
        
        if self.frontend_process:
            # npm spawns children, so we need taskkill to be sure
            self.kill_process_on_port(FRONTEND_PORT)
        
        # Force kill ports to be safe
        self.kill_process_on_port(BACKEND_PORT)
        self.kill_process_on_port(FRONTEND_PORT)
        
        self.backend_process = None
        self.frontend_process = None
        
        self.update_status(False)
        self.log("Servicios detenidos.")

    def open_browser(self):
        url = f"http://localhost:{FRONTEND_PORT}"
        self.log(f"Abriendo {url}...")
        webbrowser.open(url)

    def on_close(self):
        if self.is_running:
            if messagebox.askokcancel("Salir", "Los servicios siguen corriendo. ¿Deseas detenerlos y salir?"):
                self.stop_all()
                self.root.destroy()
        else:
            self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = LauncherApp(root)
    root.mainloop()
