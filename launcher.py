"""
Launcher v4.0 - Modern GUI with CustomTkinter
Reconstruido y optimizado para estabilidad y rendimiento.
Incluye integración completa con GPU Boost, ComfyUI y System Health Monitoring.
"""

import customtkinter as ctk
import threading
import time
import webbrowser
import requests
import json
import logging
import functools
from datetime import datetime
from pathlib import Path
from tkinter import messagebox
from collections import deque
from plyer import notification
from launcher_core import LauncherCore, log_queue, LogLevel, resource_manager, SmartDoctor

# === Configuración Global ===
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

# Paleta de Colores Moderna
COLORS = {
    "primary": "#00E676",      # Bright Green (High energy)
    "secondary": "#2979FF",    # Bright Blue
    "danger": "#FF1744",       # Bright Red
    "warning": "#FFC400",      # Amber
    "info": "#D500F9",         # Bright Purple
    "success": "#00C853",      # Darker Green for text
    "text_primary": "#FAFAFA", # Almost White
    "text_secondary": "#B0BEC5", # Blue Grey
    "bg_dark": "#121212",      # Material Dark
    "bg_card": "#1E1E1E",      # Slightly lighter card
    "bg_hover": "#2C2C2C",     # Hover state
    "border": "#333333",       # Subtle borders
    "accent_glow": "#00E676"   # For active states
}

# === Performance Profiler ===
class PerformanceProfiler:
    """Sistema de bitácora de rendimiento ligero"""
    def __init__(self):
        self.stats = {}
    
    def log_timing(self, func_name: str, elapsed_ms: float):
        if func_name not in self.stats:
            self.stats[func_name] = {"count": 0, "total_ms": 0, "max_ms": 0}
        
        s = self.stats[func_name]
        s["count"] += 1
        s["total_ms"] += elapsed_ms
        s["max_ms"] = max(s["max_ms"], elapsed_ms)

profiler = PerformanceProfiler()

def profile(func):
    """Decorador para medir tiempo de ejecución de funciones UI"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        elapsed_ms = (end - start) * 1000
        profiler.log_timing(func.__name__, elapsed_ms)
        return result
    return wrapper

# === Aplicación Principal ===
class ModernLauncherApp(ctk.CTk):
    """Launcher Moderno con Tabs, Monitoreo y GPU Boost"""
    
    def __init__(self):
        super().__init__()
        
        # Configuración de Ventana
        self.title("🚀 Sopa de Letras IA - Smart Launcher v4.0")
        self.geometry("1200x850")
        self.minsize(1000, 700)
        
        # Inicializar Core
        self.launcher = LauncherCore()
        self.doctor = SmartDoctor()
        
        # Estado
        self._shutdown = False
        self.auto_scroll = True
        self.notifications_enabled = True
        self.current_alerts = []
        self.api_metrics = []
        
        # Configuración de UI
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        # Crear UI
        self.create_ui()
        
        # Iniciar updates escalonados (Throttling para estabilidad)
        self.after(500, self.update_logs)          # Logs: Rápido (500ms)
        self.after(1000, self.update_stats)        # Stats Servicios: Medio (1s)
        self.after(2000, self.update_system_health) # Salud Sistema: Lento (2s)
        self.after(3000, self.update_graphs)       # Gráficos: Muy Lento (3s)
        self.after(1500, self.detect_running_gpu_service) # Auto-detect GPU Wait
        
        # Bindings
        self.protocol("WM_DELETE_WINDOW", self.on_close)

    def create_ui(self):
        """Construir la interfaz gráfica"""
        # TabView Principal
        self.tabview = ctk.CTkTabview(self, corner_radius=15)
        self.tabview.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        
        self.tab_dashboard = self.tabview.add("📊 Dashboard")
        self.tab_terminal = self.tabview.add("📟 Terminal")
        self.tab_config = self.tabview.add("⚙️ Configuración")
        self.tab_monitoring = self.tabview.add("📈 Monitoreo")
        
        # === TAB 1: DASHBOARD ===
        self.create_dashboard_tab()
        
        # === TAB 2: TERMINAL ===
        self.create_terminal_tab()

        # === TAB 3: CONFIGURATION ===
        self.create_config_tab()

        # === TAB 4: MONITORING ===
        self.create_monitoring_tab()

    # --------------------------------------------------------------------------
    # DASHBOARD UI
    # --------------------------------------------------------------------------
    def create_dashboard_tab(self):
        self.tab_dashboard.grid_columnconfigure((0, 1), weight=1)
        
        # Header / Banner de Alertas
        self.alert_banner_frame = ctk.CTkFrame(self.tab_dashboard, fg_color="transparent", height=0)
        self.alert_banner_frame.grid(row=0, column=0, columnspan=2, sticky="ew", padx=10, pady=(0, 10))
        
        # Panel de Control Principal
        control_panel = ctk.CTkFrame(self.tab_dashboard, corner_radius=15, fg_color=COLORS["bg_card"])
        control_panel.grid(row=1, column=0, columnspan=2, sticky="ew", padx=10, pady=10)
        
        # Título
        ctk.CTkLabel(
            control_panel, 
            text="Panel de Control", 
            font=ctk.CTkFont(size=20, weight="bold")
        ).pack(side="left", padx=20, pady=15)
        
        # Botones Principales
        self.smart_btn = ctk.CTkButton(
            control_panel,
            text="⚡ SMART START SYSTEM",
            font=ctk.CTkFont(size=14, weight="bold"),
            fg_color=COLORS["primary"],
            hover_color="#219160",
            height=40,
            command=self.run_smart_start
        )
        self.smart_btn.pack(side="right", padx=15, pady=15)
        
        self.stop_all_btn = ctk.CTkButton(
            control_panel,
            text="🛑 DETENER TODO",
            fg_color=COLORS["danger"],
            hover_color="#c0392b",
            height=40,
            command=self.stop_all
        )
        self.stop_all_btn.pack(side="right", padx=5)

        self.web_btn = ctk.CTkButton(
            control_panel,
            text="🌐 Abrir App Web",
            fg_color=COLORS["secondary"],
            height=40,
            command=self.open_web
        )
        self.web_btn.pack(side="right", padx=5)

        # Contenedor de Tarjetas de Servicio
        cards_frame = ctk.CTkFrame(self.tab_dashboard, fg_color="transparent")
        cards_frame.grid(row=2, column=0, columnspan=2, sticky="nsew", padx=5, pady=5)
        cards_frame.grid_columnconfigure((0, 1), weight=1)
        
        # Tarjeta Backend
        self.create_service_card(cards_frame, "Backend API", "FastAPI • Python", self.launcher.backend, 0)
        
        # Tarjeta Frontend
        self.create_service_card(cards_frame, "Frontend App", "Vite • React", self.launcher.frontend, 1)

        # Panel de GPU Boost
        self.create_gpu_panel(self.tab_dashboard)
        
        # Panel de API Gateway (Diagnostic)
        self.create_api_panel(self.tab_dashboard)
        
        # Panel de Salud del Sistema
        self.create_system_health_panel(self.tab_dashboard)

    def create_service_card(self, parent, title, subtitle, service, column):
        """Crea una tarjeta de servicio moderna con indicador de estado visual"""
        # Contenedor principal con borde para indicar estado
        card = ctk.CTkFrame(parent, corner_radius=15, fg_color=COLORS["bg_card"], border_width=2, border_color=COLORS["border"])
        card.grid(row=0, column=column, sticky="nsew", padx=10, pady=10)
        
        # Guardar referencia al card frame para cambiar el borde dinámicamente
        service.card_frame = card
        
        # Header
        header = ctk.CTkFrame(card, fg_color="transparent")
        header.pack(fill="x", padx=20, pady=(20, 10))
        
        # Status Indicator (LED style but bigger)
        led_canvas = ctk.CTkCanvas(header, width=12, height=12, bg=COLORS["bg_card"], highlightthickness=0)
        led_circle = led_canvas.create_oval(0, 0, 12, 12, fill=COLORS["border"], outline="")
        led_canvas.pack(side="left", padx=(0, 15))
        
        service.led_canvas = led_canvas
        service.led_circle = led_circle
        
        titles = ctk.CTkFrame(header, fg_color="transparent")
        titles.pack(side="left", fill="x", expand=True)
        
        ctk.CTkLabel(titles, text=title, font=("Segoe UI", 18, "bold"), text_color=COLORS["text_primary"]).pack(anchor="w")
        ctk.CTkLabel(titles, text=subtitle, font=("Segoe UI", 12), text_color=COLORS["text_secondary"]).pack(anchor="w")
        
        # Port pill
        port_frame = ctk.CTkFrame(header, fg_color=COLORS["bg_dark"], corner_radius=10)
        port_frame.pack(side="right", padx=5)
        ctk.CTkLabel(port_frame, text=f":{service.port}", font=("Consolas", 12, "bold"), text_color=COLORS["secondary"]).pack(padx=10, pady=2)

        # Contenido (Métricas)
        content = ctk.CTkFrame(card, fg_color="transparent")
        content.pack(fill="both", expand=True, padx=20, pady=10)
        
        # CPU Row
        cpu_row = ctk.CTkFrame(content, fg_color="transparent")
        cpu_row.pack(fill="x", pady=(0, 8))
        ctk.CTkLabel(cpu_row, text="CPU", font=("Segoe UI", 11, "bold"), width=40, anchor="w", text_color=COLORS["text_secondary"]).pack(side="left")
        service.cpu_progress = ctk.CTkProgressBar(cpu_row, height=6, progress_color=COLORS["primary"])
        service.cpu_progress.pack(side="left", fill="x", expand=True, padx=10)
        service.cpu_value = ctk.CTkLabel(cpu_row, text="0%", font=("Consolas", 11), width=40, anchor="e")
        service.cpu_value.pack(side="right")
        service.cpu_progress.set(0)
        
        # RAM Row
        ram_row = ctk.CTkFrame(content, fg_color="transparent")
        ram_row.pack(fill="x")
        ctk.CTkLabel(ram_row, text="RAM", font=("Segoe UI", 11, "bold"), width=40, anchor="w", text_color=COLORS["text_secondary"]).pack(side="left")
        service.ram_progress = ctk.CTkProgressBar(ram_row, height=6, progress_color=COLORS["info"])
        service.ram_progress.pack(side="left", fill="x", expand=True, padx=10)
        service.ram_value = ctk.CTkLabel(ram_row, text="0 MB", font=("Consolas", 11), width=40, anchor="e")
        service.ram_value.pack(side="right")
        service.ram_progress.set(0)
        
        service.uptime_label = ctk.CTkLabel(content, text="• Offline", font=("Segoe UI", 11), text_color=COLORS["text_secondary"])
        service.uptime_label.pack(pady=(15, 0), anchor="w")

        # Botones de Acción (Footer)
        footer = ctk.CTkFrame(card, fg_color="transparent")
        footer.pack(fill="x", padx=20, pady=20, side="bottom")
        
        start_btn = ctk.CTkButton(
            footer, text="INICIAR", width=90, height=32,
            fg_color=COLORS["bg_dark"], hover_color="#111", 
            border_width=1, border_color=COLORS["success"], text_color=COLORS["success"],
            font=("Segoe UI", 12, "bold"),
            command=lambda: self.safe_start_service(service)
        )
        start_btn.pack(side="left", padx=(0, 5))
        
        restart_btn = ctk.CTkButton(
            footer, text="REINICIAR", width=90, height=32,
            fg_color=COLORS["bg_dark"], hover_color=COLORS["info"],
            border_width=1, border_color=COLORS["info"], text_color=COLORS["text_primary"],
            font=("Segoe UI", 12, "bold"),
            command=lambda: self.safe_restart_service(service)
        )
        restart_btn.pack(side="left", padx=(0, 5))
        
        stop_btn = ctk.CTkButton(
            footer, text="DETENER", width=90, height=32,
            fg_color=COLORS["bg_dark"], hover_color="#111",
            border_width=1, border_color=COLORS["danger"], text_color=COLORS["danger"],
             font=("Segoe UI", 12, "bold"),
            command=lambda: self.safe_stop_service(service)
        )
        stop_btn.pack(side="left")
        
        # Icon button for kill
        kill_btn = ctk.CTkButton(
            footer, text="☠", width=32, height=32, fg_color=COLORS["bg_dark"], hover_color=COLORS["danger"],
            command=lambda: self.force_kill_service(service)
        )
        kill_btn.pack(side="right")

    def create_gpu_panel(self, parent):
        """Crea el panel de GPU Boost con diseño destacado"""
        # Frame principal con borde dinámico
        self.gpu_frame = ctk.CTkFrame(parent, fg_color=COLORS["bg_card"], corner_radius=15, border_width=2, border_color=COLORS["border"])
        self.gpu_frame.grid(row=3, column=0, sticky="ew", padx=10, pady=10)
        
        inner = ctk.CTkFrame(self.gpu_frame, fg_color="transparent")
        inner.pack(padx=20, pady=15, fill="x")
        
        # Left: Icon & Text
        left_box = ctk.CTkFrame(inner, fg_color="transparent")
        left_box.pack(side="left")
        
        ctk.CTkLabel(left_box, text="🚀 GPU BOOST", font=("Segoe UI", 16, "bold"), text_color=COLORS["primary"]).pack(anchor="w")
        ctk.CTkLabel(left_box, text="ComfyUI Node Engine", font=("Segoe UI", 12), text_color=COLORS["text_secondary"]).pack(anchor="w")

        # Center: Status Pill
        self.gpu_status_pill = ctk.CTkLabel(
            inner, text="OFFLINE", 
            font=("Segoe UI", 11, "bold"), 
            text_color=COLORS["text_secondary"],
            fg_color=COLORS["bg_dark"],
            corner_radius=8,
            width=100, height=24
        )
        self.gpu_status_pill.pack(side="left", padx=20)
        self.gpu_status_label = self.gpu_status_pill # Alias for compatibility

        # Right: Controls
        right_box = ctk.CTkFrame(inner, fg_color="transparent")
        right_box.pack(side="right")
        
        self.open_comfy_btn = ctk.CTkButton(
            right_box, text="Abrir Editor ↗", width=110, height=30,
            fg_color=COLORS["bg_dark"], text_color=COLORS["text_primary"],
            state="disabled", border_width=1, border_color=COLORS["border"],
            command=lambda: webbrowser.open(f"http://localhost:8188")
        )
        self.open_comfy_btn.pack(side="right", padx=(10, 0))
        
        self.gpu_toggle = ctk.CTkSwitch(
            right_box, text="", width=40, height=20,
            progress_color=COLORS["primary"],
            command=self.toggle_gpu_boost,
            onvalue="on", offvalue="off"
        )
        self.gpu_toggle.pack(side="right")


    def create_system_health_panel(self, parent):
        """Crea el panel de monitoreo de salud del sistema"""
        frame = ctk.CTkFrame(parent, fg_color=COLORS["bg_card"], corner_radius=15, border_width=1, border_color=COLORS["border"])
        frame.grid(row=3, column=1, sticky="nsew", padx=10, pady=10)
        
        header = ctk.CTkFrame(frame, fg_color="transparent")
        header.pack(fill="x", padx=15, pady=15)
        
        ctk.CTkLabel(header, text="🏥 Salud de Sistema", font=("Segoe UI", 14, "bold")).pack(side="left")
        self.health_label = ctk.CTkLabel(header, text="ANALIZANDO...", font=("Segoe UI", 11, "bold"), text_color="gray")
        self.health_label.pack(side="right")
        
        content = ctk.CTkFrame(frame, fg_color="transparent")
        content.pack(fill="both", expand=True, padx=15, pady=5)
        
        # Helper para barras
        def create_sys_bar(label, color):
            row = ctk.CTkFrame(content, fg_color="transparent")
            row.pack(fill="x", pady=4)
            ctk.CTkLabel(row, text=label, width=60, anchor="w", font=("Segoe UI", 11), text_color=COLORS["text_secondary"]).pack(side="left")
            bar = ctk.CTkProgressBar(row, height=8, progress_color=color)
            bar.pack(side="left", fill="x", expand=True, padx=10)
            val = ctk.CTkLabel(row, text="0%", width=35, font=("Consolas", 11))
            val.pack(side="right")
            return bar, val
            
        self.sys_cpu_bar, self.sys_cpu_val = create_sys_bar("CPU", COLORS["primary"])
        self.sys_ram_bar, self.sys_ram_val = create_sys_bar("RAM", COLORS["secondary"])

        # Neural Memory Status (Footer)
        footer = ctk.CTkFrame(frame, fg_color="transparent")
        footer.pack(fill="x", padx=15, pady=10, side="bottom")
        
        ctk.CTkLabel(footer, text="Neural Brain:", font=("Segoe UI", 11, "bold"), text_color=COLORS["text_secondary"]).pack(side="left", padx=(0,5))
        self.brain_status_label = ctk.CTkLabel(footer, text="Checking...", font=("Segoe UI", 11))
        self.brain_status_label.pack(side="left")


    def create_api_panel(self, parent):
        """Crea el panel de diagnóstico de APIs"""
        frame = ctk.CTkFrame(parent, fg_color=COLORS["bg_card"], corner_radius=10)
        frame.grid(row=3, column=1, sticky="ew", padx=10, pady=5)
        
        header = ctk.CTkFrame(frame, fg_color="transparent")
        header.pack(fill="x", padx=10, pady=5)
        
        ctk.CTkLabel(header, text="📡 API Gateway", font=("Arial", 14, "bold")).pack(side="left")
        self.api_status_label = ctk.CTkLabel(header, text="IDLE", font=("Arial", 12, "bold"), text_color="gray")
        self.api_status_label.pack(side="right")
        
        # Info Grid
        info = ctk.CTkFrame(frame, fg_color="transparent")
        info.pack(fill="x", padx=10, pady=5)
        
        # Provider
        ctk.CTkLabel(info, text="Provider:", font=("Arial", 11, "bold")).grid(row=0, column=0, sticky="w", padx=5)
        self.api_provider_val = ctk.CTkLabel(info, text="--", font=("Mono", 11), text_color=COLORS["secondary"])
        self.api_provider_val.grid(row=0, column=1, sticky="w")
        
        # Endpoint
        ctk.CTkLabel(info, text="Last Call:", font=("Arial", 11, "bold")).grid(row=0, column=2, sticky="w", padx=(15, 5))
        self.api_endpoint_val = ctk.CTkLabel(info, text="--", font=("Mono", 11))
        self.api_endpoint_val.grid(row=0, column=3, sticky="w")
        
        # Latency
        ctk.CTkLabel(info, text="Latency:", font=("Arial", 11, "bold")).grid(row=0, column=4, sticky="w", padx=(15, 5))
        self.api_latency_val = ctk.CTkLabel(info, text="-- ms", font=("Mono", 11))
        self.api_latency_val.grid(row=0, column=5, sticky="w")

    def parse_api_log(self, log_line: str):
        """Parsea logs de tráfico API"""
        # Formato esperado: API_TRAFFIC: icon [PROVIDER] endpoint | duration | json
        try:
            if "API_TRAFFIC:" in log_line:
                clean_line = log_line.split("API_TRAFFIC:", 1)[1].strip()
                # Remove icon
                parts = clean_line.split("|")
                if len(parts) >= 3:
                    # Parse Provider
                    header = parts[0].strip() # 🟢 [GEMINI] /generate
                    status_icon = header[0]
                    provider_info = header[2:].strip()
                    provider = provider_info.split("]")[0].replace("[", "")
                    endpoint = provider_info.split("]")[1].strip()
                    
                    duration = parts[1].strip()
                    
                    # Update UI
                    self.api_status_label.configure(
                        text="ACTIVE ⚡" if status_icon == "🟢" else "ERROR ❌",
                        text_color=COLORS["success"] if status_icon == "🟢" else COLORS["danger"]
                    )
                    self.api_provider_val.configure(text=provider)
                    self.api_endpoint_val.configure(text=endpoint)
                    self.api_latency_val.configure(text=duration)
                    
                    # Reset status after 3 seconds
                    self.after(3000, lambda: self.api_status_label.configure(text="IDLE", text_color="gray"))
        except Exception:
            pass

    # --------------------------------------------------------------------------
    # TERMINAL UI
    # --------------------------------------------------------------------------
    def create_terminal_tab(self):
        self.tab_terminal.grid_columnconfigure(0, weight=1)
        self.tab_terminal.grid_rowconfigure(0, weight=1)
        
        # Consola
        self.console = ctk.CTkTextbox(
            self.tab_terminal, 
            font=("Consolas", 12),
            text_color="#e0e0e0",
            fg_color="#1e1e1e",
            activate_scrollbars=True
        )
        self.console.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)
        self.console.configure(state="disabled")
        
        # Controles Terminal
        controls = ctk.CTkFrame(self.tab_terminal)
        controls.grid(row=1, column=0, sticky="ew", padx=5, pady=5)
        
        self.autoscroll_var = ctk.BooleanVar(value=True)
        ctk.CTkCheckBox(
            controls, text="Auto-scroll", 
            variable=self.autoscroll_var,
            command=lambda: setattr(self, 'auto_scroll', self.autoscroll_var.get())
        ).pack(side="left", padx=10)
        
        ctk.CTkButton(
            controls, text="Limpiar Consola", 
            fg_color="#555", width=100,
            command=self.clear_logs
        ).pack(side="right", padx=10)

    # --------------------------------------------------------------------------
    # CONFIGURATION TAB
    # --------------------------------------------------------------------------
    def create_config_tab(self):
        from launcher_core import SettingsManager
        self.settings = SettingsManager()

        self.tab_config.grid_columnconfigure(0, weight=1)
        
        # Container
        container = ctk.CTkFrame(self.tab_config, fg_color="transparent")
        container.pack(fill="both", expand=True, padx=20, pady=20)
        
        ctk.CTkLabel(container, text="Configuración del Sistema", font=("Arial", 20, "bold")).pack(anchor="w", pady=(0, 20))

        # --- API Configuration ---
        api_frame = ctk.CTkFrame(container, fg_color=COLORS["bg_card"], corner_radius=10)
        api_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(api_frame, text="🔑 Google Gemini API Key", font=("Arial", 14, "bold")).pack(anchor="w", padx=15, pady=(15, 5))
        
        self.api_key_entry = ctk.CTkEntry(api_frame, width=400, placeholder_text="AIzaSy...")
        self.api_key_entry.pack(fill="x", padx=15, pady=5)
        current_key = self.settings.get("GEMINI_API_KEY") or self.settings.get("VITE_GEMINI_API_KEY")
        if current_key:
            self.api_key_entry.insert(0, current_key)

        ctk.CTkLabel(api_frame, text="Necesaria para diseño y lógica de IA", font=("Arial", 11), text_color="gray").pack(anchor="w", padx=15, pady=(0, 15))

        # --- Brain Configuration ---
        brain_frame = ctk.CTkFrame(container, fg_color=COLORS["bg_card"], corner_radius=10)
        brain_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(brain_frame, text="🧠 Neural Memory Path (Training Data)", font=("Arial", 14, "bold")).pack(anchor="w", padx=15, pady=(15, 5))
        
        path_row = ctk.CTkFrame(brain_frame, fg_color="transparent")
        path_row.pack(fill="x", padx=15, pady=5)
        
        self.brain_path_entry = ctk.CTkEntry(path_row, placeholder_text="C:/Users/.../AI_Brain")
        self.brain_path_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        current_path = self.settings.get("TRAINING_PATH", "")
        if current_path:
            self.brain_path_entry.insert(0, current_path)
            
        def browse_path():
            try:
                from tkinter import filedialog
                path = filedialog.askdirectory()
                if path:
                    self.brain_path_entry.delete(0, "end")
                    self.brain_path_entry.insert(0, path)
            except:
                pass

        ctk.CTkButton(path_row, text="Browse", width=80, command=browse_path, fg_color=COLORS["secondary"]).pack(side="right")
        
        ctk.CTkLabel(brain_frame, text="Carpeta donde se guardará el aprendizaje de la IA (RAG)", font=("Arial", 11), text_color="gray").pack(anchor="w", padx=15, pady=(0, 15))

        # --- ComfyUI Configuration ---
        comfy_frame = ctk.CTkFrame(container, fg_color=COLORS["bg_card"], corner_radius=10)
        comfy_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(comfy_frame, text="🎨 ComfyUI Path (Optional)", font=("Arial", 14, "bold")).pack(anchor="w", padx=15, pady=(15, 5))
        
        comfy_row = ctk.CTkFrame(comfy_frame, fg_color="transparent")
        comfy_row.pack(fill="x", padx=15, pady=5)
        
        self.comfy_path_entry = ctk.CTkEntry(comfy_row, placeholder_text=r"C:\Useers\...\ComfyUI_windows_portable\ComfyUI")
        self.comfy_path_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        
        current_comfy = self.settings.get("COMFYUI_PATH", "")
        if current_comfy:
            self.comfy_path_entry.insert(0, current_comfy)
        
        def browse_comfy():
            try:
                from tkinter import filedialog
                path = filedialog.askdirectory()
                if path:
                    self.comfy_path_entry.delete(0, "end")
                    self.comfy_path_entry.insert(0, path)
            except:
                pass

        ctk.CTkButton(comfy_row, text="Browse", width=80, command=browse_comfy, fg_color=COLORS["secondary"]).pack(side="right")
        
        ctk.CTkLabel(comfy_frame, text="Ruta a la carpeta base de ComfyUI (donde está run_nvidia_gpu.bat o ComfyUI.exe)", font=("Arial", 11), text_color="gray").pack(anchor="w", padx=15, pady=(0, 15))

        # --- Save Button ---
        ctk.CTkButton(
            container, 
            text="💾 Guardar Cambios", 
            fg_color=COLORS["primary"], 
            font=("Arial", 14, "bold"),
            height=40,
            command=self.save_settings
        ).pack(pady=20)

    def save_settings(self):
        new_key = self.api_key_entry.get().strip()
        new_path = self.brain_path_entry.get().strip()
        
        if new_key:
            self.settings.set("GEMINI_API_KEY", new_key)
            self.settings.set("VITE_GEMINI_API_KEY", new_key) # Duplicate just in case
        
        if new_path:
            self.settings.set("TRAINING_PATH", new_path)

        new_comfy = self.comfy_path_entry.get().strip()
        if new_comfy:
            self.settings.set("COMFYUI_PATH", new_comfy)
        else:
            # If empty, maybe clear it? For now let's just ignore or set empty
            # self.settings.set("COMFYUI_PATH", "")
            pass
            
        messagebox.showinfo("Configuración", "Ajustes guardados correctamente. \nReinicia los servicios para aplicar cambios.")

    # --------------------------------------------------------------------------
    # MONITORING TAB (Simplified)
    # --------------------------------------------------------------------------
    def create_monitoring_tab(self):
        ctk.CTkLabel(self.tab_monitoring, text="Gráficos de Rendimiento", font=("Arial", 20)).pack(pady=20)
        # Nota: Aquí podríamos poner gráficos más detallados si se requiere en el futuro.
        # Por ahora solo un placeholder para evitar imports de matplotlib
        ctk.CTkLabel(
            self.tab_monitoring, 
            text="El monitoreo detallado está disponible en el Dashboard.",
            text_color="gray"
        ).pack()

    # --------------------------------------------------------------------------
    # UPDATE LOOPS (OPTIMIZED)
    # --------------------------------------------------------------------------
    @profile
    def update_logs(self):
        """Lee logs de la cola y actualiza la terminal"""
        if self._shutdown: return
        
        try:
            updates = []
            while not log_queue.queue.empty():
                try:
                    entry = log_queue.queue.get_nowait()
                    
                    # Parse for API Panel
                    if "message" in entry:
                        self.parse_api_log(entry["message"])
                        
                    formatted = log_queue.get_formatted(entry)
                    updates.append(formatted)
                    # Limit processing per frame to avoid lag
                    if len(updates) > 50: break
                except:
                    break
            
            if updates:
                self.console.configure(state="normal")
                self.console.insert("end", "\n".join(updates) + "\n")
                if self.auto_scroll:
                    self.console.see("end")
                self.console.configure(state="disabled")
                
        except Exception:
            pass
            
        self.after(500, self.update_logs)

    @profile
    def update_stats(self):
        """Actualiza estadísticas de los servicios"""
        if self._shutdown: return
        
        for service in [self.launcher.backend, self.launcher.frontend]:
            # Use cached stats from service logic
            stats = service.get_stats()
            
            # LED & Border Update
            if service.is_running():
                color = COLORS["success"]
                service.card_frame.configure(border_color=COLORS["success"])
                service.uptime_label.configure(text=f"• RUNNING ({stats.uptime_seconds}s)", text_color=COLORS["success"])
            else:
                color = COLORS["danger"]
                service.card_frame.configure(border_color=COLORS["border"]) # Reset border when off
                service.uptime_label.configure(text="• OFFLINE", text_color=COLORS["text_secondary"])

            service.led_canvas.itemconfig(service.led_circle, fill=color)
            
            # CPU Update
            cpu_val = min(stats.cpu_percent, 100)
            service.cpu_progress.set(cpu_val / 100)
            service.cpu_value.configure(text=f"{cpu_val:.0f}%")
            service.cpu_progress.configure(
                progress_color=COLORS["danger"] if cpu_val > 80 else COLORS["warning"] if cpu_val > 50 else COLORS["primary"]
            )
            
            # RAM Update
            ram_val = stats.memory_mb
            limit = resource_manager.SERVICE_RAM_LIMITS.get(service.name.lower(), 500)
            service.ram_progress.set(min(ram_val / limit, 1.0))
            service.ram_value.configure(text=f"{ram_val:.0f} MB")
            
            # Uptime (Formatted better inside logic if needed, but simple string above is fine)
                
        self.after(1000, self.update_stats)

    @profile
    def update_system_health(self):
        """Actualiza monitoreo global del sistema"""
        if self._shutdown: return
        
        # Safety check: UI might not be ready
        if not hasattr(self, 'brain_status_label') or not hasattr(self, 'sys_cpu_bar'):
             self.after(2000, self.update_system_health)
             return

        status = resource_manager.get_system_status()
        
        # Actualizar barras globales
        cpu_pct = status.get("cpu_percent", 0)
        self.sys_cpu_bar.set(cpu_pct / 100)
        self.sys_cpu_val.configure(text=f"{cpu_pct:.1f}%")
        self.sys_cpu_bar.configure(
            progress_color=COLORS["danger"] if cpu_pct > 85 else COLORS["success"]
        )
        
        ram_pct = status.get("ram_percent", 0)
        self.sys_ram_bar.set(ram_pct / 100)
        self.sys_ram_val.configure(text=f"{ram_pct:.1f}%")
        
        # Etiqueta de Salud
        summary = resource_manager.get_health_summary()
        self.health_label.configure(text=summary, text_color=COLORS["warning"] if "⚠️" in summary else COLORS["success"])
        
        # Check Brain Status using SettingsManager (lazy init if not present)
        if not hasattr(self, 'settings'):
            from launcher_core import SettingsManager
            self.settings = SettingsManager()
            
        brain_path = self.settings.get("TRAINING_PATH")
        if brain_path and os.path.exists(brain_path):
             self.brain_status_label.configure(text="CONNECTED 🧠", text_color=COLORS["success"])
        elif brain_path:
             self.brain_status_label.configure(text="NOT FOUND ❌", text_color=COLORS["danger"])
        else:
             self.brain_status_label.configure(text="NOT CONFIGURED ⚠️", text_color=COLORS["warning"])

        self.after(2000, self.update_system_health)

    @profile
    def update_graphs(self):
        """Placeholder para actualizaciones más lentas"""
        if self._shutdown: return
        # Aquí irían actualizaciones de gráficos históricos si los restablecemos
        self.after(3000, self.update_graphs)

    # --------------------------------------------------------------------------
    # LOGIC & ACTIONS
    # --------------------------------------------------------------------------
    def run_smart_start(self):
        threading.Thread(target=self._smart_start_thread, daemon=True).start()
    
    def _smart_start_thread(self):
        self.smart_btn.configure(state="disabled", text="⚡ INICIANDO...")
        try:
            self.launcher.smart_start_all()
        finally:
            self.smart_btn.configure(state="normal", text="⚡ SMART START SYSTEM")

    def stop_all(self):
        threading.Thread(target=self.launcher.stop_all, daemon=True).start()

    def open_web(self):
        webbrowser.open("http://localhost:5173")

    def toggle_gpu_boost(self):
        """Activar/Desactivar ComfyUI"""
        if self.gpu_toggle.get() == "on":
            self.gpu_status_label.configure(text="INICIANDO...", text_color=COLORS["warning"])
            
            def start_task():
                success = self.launcher.start_gpu_boost()
                if success:
                    self.gpu_status_label.configure(text="ONLINE ✅", text_color=COLORS["success"])
                    self.open_comfy_btn.configure(state="normal")
                else:
                    self.gpu_toggle.deselect()
                    self.gpu_status_label.configure(text="ERROR ❌", text_color=COLORS["danger"])
            
            threading.Thread(target=start_task, daemon=True).start()
        else:
            self.launcher.stop_gpu_boost()
            self.gpu_status_label.configure(text="OFFLINE", text_color="gray")
            self.open_comfy_btn.configure(state="disabled")

    def detect_running_gpu_service(self):
        """Detección automática robusta de ComfyUI (incluso instancias externas)"""
        def _check():
            log_queue.write(LogLevel.DEBUG, "🔍 Buscando ComfyUI en puerto 8188...", "GPU_DETECT")
            
            found = False
            # 1. Verificar usando objeto configurado (si existe)
            if self.launcher.comfyui and self.launcher.comfyui.check_port_in_use():
                if self.launcher.comfyui.check_health():
                    found = True
            
            # 2. Si falla, verificar directamente por HTTP (fallback)
            if not found:
                try:
                    response = requests.get("http://localhost:8188/system_stats", timeout=2)
                    if response.status_code == 200:
                        found = True
                except:
                    pass

            if found:
                self.after(0, self._enable_gpu_ui_auto)
            else:
                log_queue.write(LogLevel.DEBUG, "❌ ComfyUI no detectado al inicio.", "GPU_DETECT")

        threading.Thread(target=_check, daemon=True).start()

    def _enable_gpu_ui_auto(self):
        """Activa la UI visualmente si se detecta el servicio corriendo"""
        if self.gpu_toggle.get() == "off":
            self.gpu_toggle.select()
        
        # Update Visuals
        self.gpu_status_pill.configure(text="ONLINE (Auto)", text_color=COLORS["primary"], fg_color=COLORS["bg_hover"])
        self.gpu_frame.configure(border_color=COLORS["primary"]) # Visual Glow
        self.open_comfy_btn.configure(state="normal", border_color=COLORS["primary"], fg_color=COLORS["bg_hover"])
        
        # Opcional: Notificar en logs
        log_queue.write(LogLevel.INFO, "ComfyUI detectado automáticamente. Aceleración activada.", "SYSTEM")



    def safe_start_service(self, service):
        can_start, msg = resource_manager.can_start_service(service.name)
        if can_start:
            threading.Thread(target=service.start, daemon=True).start()
        else:
            messagebox.showwarning("Recursos Insuficientes", msg)

    def safe_restart_service(self, service):
        """Reinicia un servicio de forma segura"""
        def _restart():
            log_queue.write(LogLevel.INFO, f"🔄 Reiniciando {service.name}...", service.name)
            service.stop()
            time.sleep(2) # Give it a moment to release ports fully
            self.safe_start_service(service)
            
        if messagebox.askyesno("Reiniciar", f"¿Reiniciar {service.name}?"):
            threading.Thread(target=_restart, daemon=True).start()

    def safe_stop_service(self, service):
        service.stop()

    def force_kill_service(self, service):
        if messagebox.askyesno("Confirmar", f"¿Matar procesos en puerto {service.port}?"):
            service.force_kill_port()

    def clear_logs(self):
        self.console.configure(state="normal")
        self.console.delete("1.0", "end")
        self.console.configure(state="disabled")

    def on_close(self):
        """Cierre limpio"""
        if messagebox.askyesno("Salir", "¿Detener servicios y salir?"):
            self._shutdown = True
            threading.Thread(target=self.launcher.stop_all, daemon=True).start()
            self.after(1000, self.destroy)
            self.after(1500, lambda: self.quit())

# === Entry Point ===
if __name__ == "__main__":
    app = ModernLauncherApp()
    app.mainloop()
