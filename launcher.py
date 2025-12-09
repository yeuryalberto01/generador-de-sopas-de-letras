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
    "primary": "#2CC985",      # Green
    "secondary": "#3498DB",    # Blue
    "danger": "#E74C3C",       # Red
    "warning": "#F39C12",      # Orange
    "info": "#9B59B6",         # Purple
    "success": "#27AE60",      # Dark Green
    "text_primary": "#FFFFFF", # White
    "text_secondary": "#B0B0B0", # Gray
    "bg_dark": "#1a1a1a",      # Dark background
    "bg_card": "#2d2d2d",      # Card background
    "bg_hoover": "#3d3d3d"     # Hover state
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
        
        # Bindings
        self.protocol("WM_DELETE_WINDOW", self.on_close)

    def create_ui(self):
        """Construir la interfaz gráfica"""
        # TabView Principal
        self.tabview = ctk.CTkTabview(self, corner_radius=15)
        self.tabview.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        
        self.tab_dashboard = self.tabview.add("📊 Dashboard")
        self.tab_terminal = self.tabview.add("📟 Terminal")
        self.tab_monitoring = self.tabview.add("📈 Monitoreo Detallado")
        
        # === TAB 1: DASHBOARD ===
        self.create_dashboard_tab()
        
        # === TAB 2: TERMINAL ===
        self.create_terminal_tab()
        
        # === TAB 3: MONITOREO ===
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
        
        # Panel de Salud del Sistema
        self.create_system_health_panel(self.tab_dashboard)

    def create_service_card(self, parent, title, subtitle, service, column):
        """Crea una tarjeta de servicio moderna"""
        card = ctk.CTkFrame(parent, corner_radius=15, fg_color=COLORS["bg_card"])
        card.grid(row=0, column=column, sticky="nsew", padx=10, pady=10)
        
        # Header
        header = ctk.CTkFrame(card, fg_color="transparent")
        header.pack(fill="x", padx=15, pady=15)
        
        # LED y Título
        led_canvas = ctk.CTkCanvas(header, width=15, height=15, bg=COLORS["bg_card"], highlightthickness=0)
        led_circle = led_canvas.create_oval(2, 2, 13, 13, fill=COLORS["danger"], outline="")
        led_canvas.pack(side="left", padx=(0, 10))
        
        # Guardar referencias en objeto servicio para actualización fácil
        service.led_canvas = led_canvas
        service.led_circle = led_circle
        
        titles = ctk.CTkFrame(header, fg_color="transparent")
        titles.pack(side="left")
        ctk.CTkLabel(titles, text=title, font=("Arial", 16, "bold")).pack(anchor="w")
        ctk.CTkLabel(titles, text=subtitle, font=("Arial", 12), text_color="gray").pack(anchor="w")
        
        # info puerto
        ctk.CTkLabel(header, text=f"Port: {service.port}", font=("Mono", 11), text_color=COLORS["secondary"]).pack(side="right")

        # Contenido (Métricas)
        content = ctk.CTkFrame(card, fg_color="transparent")
        content.pack(fill="both", expand=True, padx=15, pady=5)
        
        # CPU
        ctk.CTkLabel(content, text="CPU Usage", font=("Arial", 11)).pack(anchor="w")
        service.cpu_progress = ctk.CTkProgressBar(content, height=10, progress_color=COLORS["primary"])
        service.cpu_progress.pack(fill="x", pady=(0, 5))
        service.cpu_progress.set(0)
        
        # RAM
        ctk.CTkLabel(content, text="RAM Usage", font=("Arial", 11)).pack(anchor="w", pady=(5,0))
        service.ram_progress = ctk.CTkProgressBar(content, height=10, progress_color=COLORS["info"])
        service.ram_progress.pack(fill="x", pady=(0, 5))
        service.ram_progress.set(0)
        
        # Valores numéricos
        stats_line = ctk.CTkFrame(content, fg_color="transparent")
        stats_line.pack(fill="x", pady=5)
        service.cpu_value = ctk.CTkLabel(stats_line, text="0%", font=("Mono", 10))
        service.cpu_value.pack(side="left")
        service.ram_value = ctk.CTkLabel(stats_line, text="0 MB", font=("Mono", 10))
        service.ram_value.pack(side="right")
        
        service.uptime_label = ctk.CTkLabel(content, text="Uptime: --", font=("Arial", 11, "italic"), text_color="gray")
        service.uptime_label.pack(pady=5)

        # Botones de Acción (Footer)
        footer = ctk.CTkFrame(card, fg_color="transparent")
        footer.pack(fill="x", padx=15, pady=15, side="bottom")
        
        ctk.CTkButton(
            footer, text="▶ Start", width=60, height=25, fg_color=COLORS["success"],
            command=lambda: self.safe_start_service(service)
        ).pack(side="left", padx=2)
        
        ctk.CTkButton(
            footer, text="⏹ Stop", width=60, height=25, fg_color=COLORS["danger"],
            command=lambda: self.safe_stop_service(service)
        ).pack(side="left", padx=2)
        
        ctk.CTkButton(
            footer, text="⚡ Kill", width=50, height=25, fg_color="#555",
            command=lambda: self.force_kill_service(service)
        ).pack(side="right")

    def create_gpu_panel(self, parent):
        """Crea el panel de GPU Boost"""
        frame = ctk.CTkFrame(parent, fg_color=COLORS["bg_card"], corner_radius=10)
        frame.grid(row=3, column=0, sticky="ew", padx=10, pady=5)
        
        header = ctk.CTkFrame(frame, fg_color="transparent")
        header.pack(fill="x", padx=10, pady=5)
        
        ctk.CTkLabel(header, text="🎮 GPU Boost (ComfyUI)", font=("Arial", 14, "bold")).pack(side="left")
        
        self.gpu_status_label = ctk.CTkLabel(header, text="OFFLINE", font=("Arial", 12, "bold"), text_color="gray")
        self.gpu_status_label.pack(side="right")
        
        # Controles
        controls = ctk.CTkFrame(frame, fg_color="transparent")
        controls.pack(fill="x", padx=10, pady=5)
        
        self.gpu_toggle = ctk.CTkSwitch(
            controls, text="Habilitar Aceleración", 
            command=self.toggle_gpu_boost,
            onvalue="on", offvalue="off"
        )
        self.gpu_toggle.pack(side="left")
        
        self.open_comfy_btn = ctk.CTkButton(
            controls, text="Abrir Editor Nodos", width=100, height=25,
            state="disabled",
            command=lambda: webbrowser.open(f"http://localhost:8188")
        )
        self.open_comfy_btn.pack(side="right")

    def create_system_health_panel(self, parent):
        """Crea el panel de monitoreo de salud del sistema"""
        frame = ctk.CTkFrame(parent, fg_color=COLORS["bg_card"], corner_radius=10)
        frame.grid(row=3, column=1, sticky="ew", padx=10, pady=5)
        
        header = ctk.CTkFrame(frame, fg_color="transparent")
        header.pack(fill="x", padx=10, pady=5)
        
        ctk.CTkLabel(header, text="🏥 Salud del Sistema", font=("Arial", 14, "bold")).pack(side="left")
        self.health_label = ctk.CTkLabel(header, text="✅ NORMAL", font=("Arial", 12, "bold"), text_color=COLORS["success"])
        self.health_label.pack(side="right")
        
        content = ctk.CTkFrame(frame, fg_color="transparent")
        content.pack(fill="x", padx=10, pady=5)
        
        # CPU Global
        row1 = ctk.CTkFrame(content, fg_color="transparent")
        row1.pack(fill="x")
        ctk.CTkLabel(row1, text="CPU Global:", width=80, anchor="w").pack(side="left")
        self.sys_cpu_bar = ctk.CTkProgressBar(row1, height=8)
        self.sys_cpu_bar.pack(side="left", fill="x", expand=True, padx=5)
        self.sys_cpu_val = ctk.CTkLabel(row1, text="0%", width=40)
        self.sys_cpu_val.pack(side="right")
        
        # RAM Global
        row2 = ctk.CTkFrame(content, fg_color="transparent")
        row2.pack(fill="x")
        ctk.CTkLabel(row2, text="RAM Global:", width=80, anchor="w").pack(side="left")
        self.sys_ram_bar = ctk.CTkProgressBar(row2, height=8)
        self.sys_ram_bar.pack(side="left", fill="x", expand=True, padx=5)
        self.sys_ram_val = ctk.CTkLabel(row2, text="0%", width=40)
        self.sys_ram_val.pack(side="right")

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
            
            # LED Update
            color = COLORS["success"] if service.is_running() else COLORS["danger"]
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
            
            # Uptime
            if stats.uptime_seconds > 0:
                mins, secs = divmod(stats.uptime_seconds, 60)
                hours, mins = divmod(mins, 60)
                service.uptime_label.configure(text=f"Uptime: {int(hours)}h {int(mins)}m {int(secs)}s")
            else:
                service.uptime_label.configure(text="Uptime: --")
                
        self.after(1000, self.update_stats)

    @profile
    def update_system_health(self):
        """Actualiza monitoreo global del sistema"""
        if self._shutdown: return
        
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

    def safe_start_service(self, service):
        can_start, msg = resource_manager.can_start_service(service.name)
        if can_start:
            threading.Thread(target=service.start, daemon=True).start()
        else:
            messagebox.showwarning("Recursos Insuficientes", msg)

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
