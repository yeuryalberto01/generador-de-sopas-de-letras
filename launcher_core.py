"""
Launcher Core - Business Logic Layer
Módulo central que contiene toda la lógica de negocio del launcher,
independiente de la interfaz (CustomTkinter o API REST).
"""

import subprocess
import sys
import os
import time
import threading
import psutil
import requests
import queue
from datetime import datetime
from typing import Optional, Dict, List, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum

# Configuration
BACKEND_DIR = os.path.join(os.getcwd(), "backend")
FRONTEND_DIR = os.path.join(os.getcwd(), "Creador-de-sopas-de-letras-Ultra-IA")
BACKEND_PORT = 8000
FRONTEND_PORT = 5173
COMFYUI_PORT = 8188

BACKEND_CMD = [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", str(BACKEND_PORT)]
FRONTEND_CMD = ["npm", "run", "dev", "--", "--port", str(FRONTEND_PORT)]

# ComfyUI Configuration (Default)
DEFAULT_COMFYUI_DIR = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "ComfyUI")



class LogLevel(Enum):
    """Log levels with colors"""
    DEBUG = ("DEBUG", "\033[36m")     # Cyan
    INFO = ("INFO", "\033[32m")       # Green
    WARNING = ("WARNING", "\033[33m") # Yellow
    ERROR = ("ERROR", "\033[31m")     # Red
    SYSTEM = ("SYSTEM", "\033[35m")   # Magenta


@dataclass
class ServiceStats:
    """Service statistics snapshot"""
    cpu_percent: float = 0.0
    memory_mb: float = 0.0
    uptime_seconds: int = 0
    is_healthy: bool = False
    last_error: Optional[str] = None
    timestamp: float = field(default_factory=time.time)


class LogQueue:
    """Thread-safe log queue with levels"""
    def __init__(self):
        self.queue = queue.Queue()
        self.history: List[Dict[str, Any]] = []
        self.max_history = 1000
        
        # Setup File Logging
        self.log_dir = os.path.join(os.getcwd(), "logs")
        os.makedirs(self.log_dir, exist_ok=True)
        self.log_file = os.path.join(self.log_dir, f"launcher_{datetime.now().strftime('%Y%m%d')}.log")
    
    def write(self, level: LogLevel, message: str, source: str = "SYSTEM"):
        """Write a log message with level"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = {
            "timestamp": timestamp,
            "level": level.value[0],
            "source": source,
            "message": message,
            "color": level.value[1]
        }
        
        # Add to queue and history
        self.queue.put(log_entry)
        self.history.append(log_entry)
        
        # Trim history if too long
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]
            
        # Write to file immediately (for crash safety)
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(f"[{timestamp}] [{level.value[0]}] [{source}] {message}\n")
        except Exception:
            pass
    
    def get_formatted(self, entry: Dict[str, Any]) -> str:
        """Format log entry as string"""
        return f"[{entry['timestamp']}] [{entry['level']}] [{entry['source']}] {entry['message']}"
    
    def get_recent(self, count: int = 50) -> List[Dict[str, Any]]:
        """Get recent log entries"""
        return self.history[-count:]


# Global log queue
log_queue = LogQueue()


def enqueue_output(process, source):
    """Read process output and send to log queue"""
    for line in iter(process.stdout.readline, b''):
        try:
            line_str = line.decode('utf-8').strip()
            if line_str:
                # Heuristic for log level
                level = LogLevel.INFO
                lower = line_str.lower()
                if "error" in lower or "exception" in lower or "failed" in lower:
                     level = LogLevel.ERROR
                elif "warning" in lower:
                     level = LogLevel.WARNING
                
                log_queue.write(level, line_str, source)
        except:
            pass
    process.stdout.close()


class SmartService:
    """Smart service manager with caching and optimized health checks"""
    
    def __init__(self, name: str, command: List[str], cwd: str, port: int, check_url: Optional[str] = None):
        self.name = name
        self.command = command
        self.cwd = cwd
        self.port = port
        self.check_url = check_url
        self.process: Optional[subprocess.Popen] = None
        self.thread: Optional[threading.Thread] = None
        self.start_time: Optional[float] = None
        
        # Stats caching - increased TTL for better performance
        self._stats_cache: Optional[ServiceStats] = None
        self._stats_cache_ttl = 2.0  # 2 second TTL (was 1s)
        self._stats_lock = threading.Lock()
    
    def start(self) -> bool:
        """Start the service"""
        if self.is_running():
            log_queue.write(LogLevel.WARNING, f"{self.name} ya está corriendo.", self.name)
            return True
        
        if self.check_port_in_use():
            log_queue.write(LogLevel.WARNING, f"Puerto {self.port} ocupado. Iniciando protocolo limpieza...", self.name)
            self.force_kill_port()
            
            if self.check_port_in_use():
                log_queue.write(LogLevel.ERROR, f"ABORTADO: El puerto {self.port} sigue bloqueado tras intentos de limpieza.", self.name)
                return False
        
        try:
            log_queue.write(LogLevel.INFO, f"Iniciando {self.name}...", self.name)
            
            # Prepare Environment Variables
            env_vars = os.environ.copy()
            env_vars["BACKEND_PORT"] = str(BACKEND_PORT)
            env_vars["FRONTEND_PORT"] = str(FRONTEND_PORT)
            env_vars["COMFYUI_PORT"] = str(COMFYUI_PORT)
            env_vars["COMFYUI_HOST"] = "localhost" # Explicit localhost to avoid 127.0.0.1 issues
            
            # Additional Sync for ComfyUI
            if "COMFYUI_PATH" in self.command[0] or self.name == "COMFYUI":
                pass # Comfy handles its own config usually

            self.process = subprocess.Popen(
                self.command,
                cwd=self.cwd,
                env=env_vars, # Inject sync vars
                shell=True if "npm" in self.command[0] else False,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == 'win32' else 0
            )
            
            self.start_time = time.time()
            
            # Start monitoring thread
            t = threading.Thread(target=enqueue_output, args=(self.process, self.name))
            t.daemon = True
            t.start()
            
            # Initial Stability Check (0.5s)
            time.sleep(1)
            if self.process.poll() is not None:
                 rc = self.process.returncode
                 log_queue.write(LogLevel.ERROR, f"CRITICAL: El proceso finalizó inmediatamente (Código {rc}). Revise los logs.", self.name)
                 return False
            
            # Wait for Service Ready (Smart Health Check)
            if self.check_url:
                log_queue.write(LogLevel.INFO, f"Esperando respuesta de {self.name}...", self.name)
                ready = False
                for i in range(15): # Wait up to 15 seconds
                    if self.check_health():
                        ready = True
                        break
                    time.sleep(1)
                
                if ready:
                     log_queue.write(LogLevel.INFO, f"✅ {self.name} está ONLINE y respondiendo.", self.name)
                else:
                     log_queue.write(LogLevel.WARNING, f"⚠️ {self.name} inició, pero no responde al Health Check (Timeout).", self.name)

            log_queue.write(LogLevel.INFO, f"{self.name} iniciado correctamente con PID {self.process.pid}", self.name)
            return True
        except Exception as e:
            log_queue.write(LogLevel.ERROR, f"Fallo al iniciar {self.name}: {e}", self.name)
            return False
    
    def stop(self):
        """Stop the service"""
        log_queue.write(LogLevel.INFO, f"Deteniendo {self.name}...", self.name)
        
        if self.process:
            try:
                if sys.platform == 'win32':
                    subprocess.run(f"taskkill /F /T /PID {self.process.pid}", 
                                 shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    parent = psutil.Process(self.process.pid)
                    for child in parent.children(recursive=True):
                        child.kill()
                    parent.kill()
            except Exception as e:
                log_queue.write(LogLevel.ERROR, f"Error al matar proceso {self.name}: {e}", self.name)
            self.process = None
            self.start_time = None
        
        self.force_kill_port()
        self._invalidate_cache()
    
    def force_kill_port(self):
        """Force kill any process on the service port with verification (Windows Optimized)"""
        log_queue.write(LogLevel.DEBUG, f"Escaneando puerto {self.port} para liberar...", self.name)
        killed = False
        
        # Try up to 3 times to clear the port
        for attempt in range(3):
            if not self.check_port_in_use():
                if attempt > 0:
                     log_queue.write(LogLevel.INFO, f"✅ Puerto {self.port} verificado libre.", self.name)
                return

            pids_to_kill = set()
            
            # Method 1: Netstat (Windows Native - Most Reliable)
            if sys.platform == 'win32':
                try:
                    # Run netstat to find PID listening on port
                    cmd = f"netstat -ano | findstr :{self.port}"
                    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    stdout, _ = process.communicate()
                    
                    if stdout:
                        for line in stdout.decode(errors='ignore').strip().split('\n'):
                            parts = line.strip().split()
                            # Line format: TCP    0.0.0.0:8000    0.0.0.0:0    LISTENING    1234
                            if len(parts) >= 5 and f":{self.port}" in parts[1]:
                                try:
                                    pid = int(parts[-1])
                                    if pid > 0:
                                        pids_to_kill.add(pid)
                                        log_queue.write(LogLevel.DEBUG, f"Detectado PID {pid} usando puerto {self.port}", self.name)
                                except ValueError:
                                    pass
                except Exception as e:
                    log_queue.write(LogLevel.WARNING, f"Fallo al leer netstat: {e}", self.name)

            # Method 2: Psutil (Cross-platform backup)
            try:
                for proc in psutil.process_iter(['pid', 'name']):
                    try:
                        for conn in proc.net_connections(kind='inet'):
                            if conn.laddr.port == self.port:
                                pids_to_kill.add(proc.pid)
                    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                        pass
            except Exception:
                pass

            if not pids_to_kill:
                 # Last Resort: If we know the likely process name, try to kill by name if port is still stuck
                 # Only do this on last attempt
                 if attempt == 2:
                     if "uvicorn" in self.command[2] or "python" in self.command[0]:
                         log_queue.write(LogLevel.WARNING, "Puerto bloqueado sin PID visible. Intentando matar procesos python/uvicorn huérfanos...", self.name)
                         subprocess.run("taskkill /F /IM uvicorn.exe", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                         subprocess.run("taskkill /F /IM python.exe", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                     
                 time.sleep(1)
                 continue

            # Kill detected PIDs
            for pid in pids_to_kill:
                log_queue.write(LogLevel.INFO, f"Terminando PID {pid} (Intento {attempt+1})...", self.name)
                try:
                    if sys.platform == 'win32':
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    else:
                        os.kill(pid, 9)
                    killed = True
                except Exception as e:
                    log_queue.write(LogLevel.WARNING, f"Error matando PID {pid}: {e}", self.name)
            
            # Wait for release
            time.sleep(2)
        
        # Final check
        if self.check_port_in_use():
             log_queue.write(LogLevel.ERROR, f"❌ NO se pudo liberar el puerto {self.port}. El sistema puede requerir permisos de administrador.", self.name)
        elif killed:
             log_queue.write(LogLevel.INFO, f"✅ Puerto {self.port} liberado exitosamente.", self.name)
    
    def is_running(self) -> bool:
        """Check if service is running"""
        if self.process:
            if self.process.poll() is None:
                return True
            else:
                self.process = None
                self.start_time = None
        return False
    
    def check_port_in_use(self) -> bool:
        """Check if port is in use"""
        for conn in psutil.net_connections():
            if conn.laddr.port == self.port:
                return True
        return False
        
    def scan_port_status(self) -> Optional[Dict[str, Any]]:
        """Scan process using the port"""
        try:
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    for conn in proc.net_connections(kind='inet'):
                        if conn.laddr.port == self.port:
                            return {
                                "pid": proc.pid,
                                "name": proc.name()
                            }
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                     continue
        except Exception:
             pass
        return None
    
    def check_health(self) -> bool:
        """Check service health with timeout"""
        if not self.check_url:
            return self.is_running()
        try:
            response = requests.get(self.check_url, timeout=0.5)
            return response.status_code == 200
        except:
            return False
    
    def get_stats(self) -> ServiceStats:
        """Get service statistics with caching"""
        with self._stats_lock:
            # Return cached stats if still valid
            if self._stats_cache and (time.time() - self._stats_cache.timestamp) < self._stats_cache_ttl:
                return self._stats_cache
            
            # Compute fresh stats
            stats = ServiceStats()
            
            if not self.is_running():
                self._stats_cache = stats
                return stats
            
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
                
                stats.cpu_percent = cpu
                stats.memory_mb = mem / (1024 * 1024)
                stats.uptime_seconds = int(time.time() - self.start_time) if self.start_time else 0
                stats.is_healthy = self.check_health()
                
            except Exception as e:
                stats.last_error = str(e)
            
            self._stats_cache = stats
            return stats
    
    def _invalidate_cache(self):
        """Invalidate stats cache"""
        with self._stats_lock:
            self._stats_cache = None



class AlertLevel(Enum):
    INFO = "INFO"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

@dataclass
class Alert:
    level: AlertLevel
    title: str
    message: str
    action_label: Optional[str] = None
    action_command: Optional[str] = None
    timestamp: float = field(default_factory=time.time)

class SmartDoctor:
    """System Health Analyzer"""
    
    def __init__(self):
        pass
    
    def analyze(self, metrics: List[Dict[str, Any]]) -> List[Alert]:
        alerts = []
        
        if not metrics:
            return []

        # Rule 1: Consecutive Failures (Critical)
        # Check if the last 3 requests were failures
        if len(metrics) >= 3:
            last_3 = metrics[:3]
            if all(m['status'] != 'SUCCESS' for m in last_3):
                 alerts.append(Alert(
                     AlertLevel.CRITICAL,
                     "Inestabilidad de Backend",
                     "3 fallos consecutivos detectados. Se recomienda reiniciar.",
                     "Reiniciar Todo",
                     "restart_all"
                 ))

        # Rule 2: Auth Error (High)
        # Check last 5 requests for 401 code
        for m in metrics[:5]:
            code = m.get('details', {}).get('code')
            if code == 401:
                alerts.append(Alert(
                    AlertLevel.HIGH,
                    "Error de Autenticación",
                    "Tu API Key es inválida o expiró. Verifica .env.local",
                    None,
                    None
                ))
                break
            # Check for 500 error specifically
            if code == 500:
                 alerts.append(Alert(
                    AlertLevel.HIGH,
                    "Error Interno (500)",
                    "Fallo crítico en servidor. Revisa los logs.",
                    "Ver Logs",
                    "show_logs"
                ))
                 break

        # Rule 3: High Latency (Medium)
        # Calculate average latency of recent successful calls
        successes = [m for m in metrics if m['status'] == 'SUCCESS'][:5]
        if successes:
            avg_lat = sum(m['duration_ms'] for m in successes) / len(successes)
            if avg_lat > 12000: # > 12 seconds
                 alerts.append(Alert(
                    AlertLevel.MEDIUM,
                    "Latencia Alta",
                    f"Respuesta lenta ({avg_lat/1000:.1f}s). Puede ser la red o el modelo.",
                    None,
                    None
                 ))

        return alerts


class ResourceManager:
    """
    Gestor inteligente de recursos del sistema.
    Monitorea y controla el uso de CPU, RAM y GPU para evitar desestabilización.
    """
    
    # Límites de recursos (configurables)
    CPU_WARNING_THRESHOLD = 70.0      # % de CPU del sistema
    CPU_CRITICAL_THRESHOLD = 85.0     # % de CPU crítico
    RAM_WARNING_THRESHOLD = 75.0      # % de RAM del sistema
    RAM_CRITICAL_THRESHOLD = 90.0     # % de RAM crítico
    VRAM_WARNING_THRESHOLD = 80.0     # % de VRAM de GPU
    VRAM_CRITICAL_THRESHOLD = 95.0    # % de VRAM crítico
    
    # Límites por servicio (en MB de RAM)
    SERVICE_RAM_LIMITS = {
        "backend": 500,      # Backend FastAPI
        "frontend": 400,     # Frontend Vite/Node
        "comfyui": 1500      # ComfyUI con modelos
    }
    
    def __init__(self):
        self._lock = threading.Lock()
        self._status_cache = None
        self._cache_time = 0
        self._cache_ttl = 2.0  # Cache por 2 segundos
        self._alerts = []
        self._throttle_active = False
    
    def get_system_status(self) -> Dict[str, Any]:
        """Obtiene estado actual del sistema con caching"""
        with self._lock:
            now = time.time()
            if self._status_cache and (now - self._cache_time) < self._cache_ttl:
                return self._status_cache
            
            try:
                cpu_percent = psutil.cpu_percent(interval=None)
                ram = psutil.virtual_memory()
                
                status = {
                    "cpu_percent": cpu_percent,
                    "ram_percent": ram.percent,
                    "ram_used_gb": ram.used / (1024**3),
                    "ram_total_gb": ram.total / (1024**3),
                    "ram_available_gb": ram.available / (1024**3),
                    "cpu_cores": psutil.cpu_count(),
                    "is_healthy": True,
                    "alerts": [],
                    "throttle_recommended": False
                }
                
                # Evaluar alertas
                if cpu_percent >= self.CPU_CRITICAL_THRESHOLD:
                    status["alerts"].append({
                        "level": "CRITICAL",
                        "type": "CPU",
                        "message": f"CPU al {cpu_percent:.0f}%! Reduciendo carga..."
                    })
                    status["is_healthy"] = False
                    status["throttle_recommended"] = True
                elif cpu_percent >= self.CPU_WARNING_THRESHOLD:
                    status["alerts"].append({
                        "level": "WARNING",
                        "type": "CPU",
                        "message": f"CPU elevado: {cpu_percent:.0f}%"
                    })
                
                if ram.percent >= self.RAM_CRITICAL_THRESHOLD:
                    status["alerts"].append({
                        "level": "CRITICAL",
                        "type": "RAM",
                        "message": f"RAM al {ram.percent:.0f}%! Liberando memoria..."
                    })
                    status["is_healthy"] = False
                    status["throttle_recommended"] = True
                elif ram.percent >= self.RAM_WARNING_THRESHOLD:
                    status["alerts"].append({
                        "level": "WARNING",
                        "type": "RAM",
                        "message": f"RAM elevada: {ram.percent:.0f}%"
                    })
                
                self._status_cache = status
                self._cache_time = now
                self._alerts = status["alerts"]
                
                return status
                
            except Exception as e:
                return {
                    "cpu_percent": 0,
                    "ram_percent": 0,
                    "is_healthy": False,
                    "error": str(e)
                }
    
    def should_throttle(self) -> bool:
        """Determina si se debe aplicar throttling"""
        status = self.get_system_status()
        return status.get("throttle_recommended", False)
    
    def get_recommended_action(self) -> Optional[str]:
        """Sugiere acción basada en el estado del sistema"""
        status = self.get_system_status()
        
        if not status.get("is_healthy", True):
            if status["ram_percent"] >= self.RAM_CRITICAL_THRESHOLD:
                return "REDUCE_SERVICES"  # Detener servicios no críticos
            elif status["cpu_percent"] >= self.CPU_CRITICAL_THRESHOLD:
                return "SLOW_DOWN"  # Reducir frecuencia de updates
        
        return None
    
    def can_start_service(self, service_name: str) -> Tuple[bool, str]:
        """Verifica si hay recursos suficientes para iniciar un servicio"""
        status = self.get_system_status()
        
        # Si ya estamos en estado crítico, no permitir
        if status.get("throttle_recommended"):
            return False, "Sistema en estado crítico. Libera recursos primero."
        
        # Verificar RAM disponible
        required_mb = self.SERVICE_RAM_LIMITS.get(service_name.lower(), 200)
        available_mb = status.get("ram_available_gb", 0) * 1024
        
        if available_mb < required_mb * 1.5:  # 50% de margen
            return False, f"RAM insuficiente. Necesita ~{required_mb}MB, disponible: {available_mb:.0f}MB"
        
        return True, "OK"
    
    def get_health_summary(self) -> str:
        """Resumen de salud del sistema para UI"""
        status = self.get_system_status()
        
        if status.get("throttle_recommended"):
            return "⚠️ CRÍTICO - Reduciendo carga"
        elif len(status.get("alerts", [])) > 0:
            return "⚡ ADVERTENCIA - Recursos elevados"
        else:
            return "✅ SALUDABLE"
    
    def get_service_priority(self) -> List[str]:
        """Orden de prioridad de servicios (último = menos prioritario)"""
        return ["backend", "frontend", "comfyui"]
    
    def optimize_for_gpu_task(self) -> None:
        """Prepara el sistema para tareas GPU intensivas"""
        # Sugerencia: reducir frecuencia de updates mientras GPU está ocupada
        self._throttle_active = True
        log_queue.write(LogLevel.INFO, "Sistema optimizado para tarea GPU")
    
    def restore_normal_mode(self) -> None:
        """Restaura modo normal después de tarea GPU"""
        self._throttle_active = False
        log_queue.write(LogLevel.INFO, "Modo normal restaurado")


# Instancia global del resource manager
resource_manager = ResourceManager()



# === Settings Management ===
class SettingsManager:
    """Manejo de configuración y variables de entorno (.env)"""
    def __init__(self, env_path="backend/.env"):
        self.env_path = env_path
        self.cache = {}
        self.load()

    def load(self):
        """Carga variables del archivo .env"""
        if os.path.exists(self.env_path):
            with open(self.env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if "=" in line and not line.strip().startswith("#"):
                        key, val = line.strip().split("=", 1)
                        self.cache[key.strip()] = val.strip().strip('"').strip("'")

    def get(self, key, default=None):
        return self.cache.get(key, os.environ.get(key, default))

    def set(self, key, value):
        """Establece una variable y actualiza el archivo .env"""
        self.cache[key] = value
        # Update .env file preserving comments and structure
        lines = []
        if os.path.exists(self.env_path):
            with open(self.env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
        
        found = False
        new_lines = []
        for line in lines:
            if line.strip().startswith(f"{key}="):
                new_lines.append(f"{key}={value}\n")
                found = True
            else:
                new_lines.append(line)
        
        if not found:
            if new_lines and not new_lines[-1].endswith("\n"):
                new_lines.append("\n")
            new_lines.append(f"{key}={value}\n")
            
        with open(self.env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)

# === Dependency Checker ===
class DependencyChecker:
    """Verifica dependencias críticas"""
    REQUIRED_PACKAGES = [
        "fastapi", "uvicorn", "jinja2", "python-multipart", "google-genai", "requests", "psutil", "aiohttp"
    ]

    @staticmethod
    def check_all() -> List[str]:
        missing = []
        import importlib.util
        for pkg in DependencyChecker.REQUIRED_PACKAGES:
            # Map package name to import name if different
            import_name = pkg.replace("-", "_")
            if pkg == "python-multipart": import_name = "multipart" # approximate check
            
            if not importlib.util.find_spec(import_name):
                # Try simple import for some edge cases
                try:
                    __import__(import_name)
                except ImportError:
                    missing.append(pkg)
        return missing

    @staticmethod
    def install_packages(packages: List[str]) -> bool:
        if not packages: return True
        log_queue.write(LogLevel.SYSTEM, f"Instalando dependencias faltantes: {', '.join(packages)}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + packages)
            log_queue.write(LogLevel.INFO, "Dependencias instaladas correctamente.")
            return True
        except subprocess.CalledProcessError as e:
            log_queue.write(LogLevel.ERROR, f"Fallo al instalar dependencias: {e}")
            return False

class LauncherCore:
    """Core launcher business logic"""
    
    def __init__(self):
        # Auto-Repair Dependencies
        missing = DependencyChecker.check_all()
        if missing:
             DependencyChecker.install_packages(missing)

        self.backend = SmartService("BACKEND", BACKEND_CMD, BACKEND_DIR, BACKEND_PORT, f"http://localhost:{BACKEND_PORT}/")
        self.frontend = SmartService("FRONTEND", FRONTEND_CMD, FRONTEND_DIR, FRONTEND_PORT, f"http://localhost:{FRONTEND_PORT}/")
        
        # ComfyUI - Optional service for GPU Boost
        self.settings = SettingsManager()
        self.comfyui = None
        
        # Determine ComfyUI Path
        custom_path = self.settings.get("COMFYUI_PATH")
        base_dir = custom_path if custom_path and os.path.exists(custom_path) else DEFAULT_COMFYUI_DIR
        
        # Detect executable (Priority: run_nvidia_gpu.bat > ComfyUI.exe)
        exe_path = os.path.join(base_dir, "ComfyUI.exe")
        bat_path = os.path.join(base_dir, "run_nvidia_gpu.bat")
        
        cmd = None
        if os.path.exists(bat_path):
            cmd = [bat_path]
        elif os.path.exists(exe_path):
            cmd = [exe_path]
            
        if cmd:
            self.comfyui = SmartService(
                "COMFYUI", 
                cmd, 
                base_dir, 
                COMFYUI_PORT, 
                f"http://localhost:{COMFYUI_PORT}/system_stats"
            )
            # Log successful detection
            log_queue.write(LogLevel.DEBUG, f"ComfyUI detectado en: {base_dir}")
        else:
            log_queue.write(LogLevel.WARNING, f"No se encontró ComfyUI en: {base_dir}")
        
        self.services = {
            "backend": self.backend,
            "frontend": self.frontend
        }
        
        if self.comfyui:
            self.services["comfyui"] = self.comfyui
    
    def is_comfyui_available(self) -> bool:
        """Check if ComfyUI is configured and available"""
        return self.comfyui is not None
    
    def start_gpu_boost(self) -> bool:
        """Start ComfyUI for GPU Boost mode"""
        if not self.comfyui:
            log_queue.write(LogLevel.WARNING, "ComfyUI no está configurado")
            return False
        
        # Verificar si ComfyUI ya está corriendo (externamente o por nosotros)
        if self.comfyui.check_port_in_use():
            log_queue.write(LogLevel.INFO, "⚠️ Puerto 8188 ocupado. Verificando si es ComfyUI...", "COMFYUI")
            
            # Verificación INTELIGENTE: ¿Es realmente ComfyUI respondiendo?
            if self.comfyui.check_health():
                log_queue.write(LogLevel.INFO, "✅ ComfyUI detectado ONLINE (Instancia Externa). Conectando...", "COMFYUI")
                # Importante: Marcar process como "externo" o similar si quisiéramos no matarlo al cerrar,
                # pero por ahora lo tratamos como "corriendo" para que la UI se actualice.
                return True
            else:
                log_queue.write(LogLevel.WARNING, "❌ Puerto 8188 ocupado por proceso desconocido o ComfyUI colgado.", "COMFYUI")
                log_queue.write(LogLevel.WARNING, "Intentando liberar puerto para reinicio limpio...", "COMFYUI")
                # Si no responde health check, asumimos zombie y tratamos de liberar
                self.comfyui.force_kill_port()
        
        return self.comfyui.start()
    
    def stop_gpu_boost(self) -> bool:
        """Stop ComfyUI"""
        if self.comfyui and self.comfyui.is_running():
            return self.comfyui.stop()
        return True
    
    def get_service(self, name: str) -> Optional[SmartService]:
        """Get service by name"""
        return self.services.get(name.lower())
    
    def start_service(self, name: str) -> bool:
        """Start a specific service"""
        service = self.get_service(name)
        if not service:
            log_queue.write(LogLevel.ERROR, f"Servicio desconocido: {name}")
            return False
        return service.start()
    
    def stop_service(self, name: str) -> bool:
        """Stop a specific service"""
        service = self.get_service(name)
        if not service:
            log_queue.write(LogLevel.ERROR, f"Servicio desconocido: {name}")
            return False
        service.stop()
        return True
    
    def restart_service(self, name: str) -> bool:
        """Restart a specific service"""
        service = self.get_service(name)
        if not service:
            log_queue.write(LogLevel.ERROR, f"Servicio desconocido: {name}")
            return False
        
        log_queue.write(LogLevel.INFO, f"Reiniciando {name}...", name.upper())
        service.stop()
        time.sleep(2)
        return service.start()
    
    def smart_start_all(self) -> bool:
        """Smart start all services in order"""
        log_queue.write(LogLevel.SYSTEM, "=== SMART START SYSTEM ===")
        
        # Start Backend first
        if not self.backend.is_running():
            log_queue.write(LogLevel.INFO, "Iniciando Backend...", "BACKEND")
            if self.backend.start():
                # Wait for health check
                backend_healthy = False
                for i in range(15):
                    log_queue.write(LogLevel.DEBUG, f"Esperando Backend (Intento {i+1}/15)...", "BACKEND")
                    if self.backend.check_health():
                        log_queue.write(LogLevel.INFO, "Backend ONLINE y respondiendo!", "BACKEND")
                        backend_healthy = True
                        break
                    time.sleep(1)
                
                if not backend_healthy:
                    log_queue.write(LogLevel.ERROR, "Backend inició pero no responde. Abortando inicio.", "BACKEND")
                    self.backend.stop()
                    return False
            else:
                return False
        
        # Start Frontend
        if not self.frontend.is_running():
            log_queue.write(LogLevel.INFO, "Iniciando Frontend...", "FRONTEND")
            self.frontend.start()
            time.sleep(3)
        
        log_queue.write(LogLevel.SYSTEM, "✅ Sistema listo!")
        return True
    
    def stop_all(self):
        """Stop all services"""
        log_queue.write(LogLevel.SYSTEM, "=== DETENIENDO SERVICIOS ===")
        self.backend.stop()
        self.frontend.stop()
        
        # Wait for ports to be released
        log_queue.write(LogLevel.INFO, "Esperando liberación de puertos...")
        for i in range(10):
            backend_free = not self.backend.check_port_in_use()
            frontend_free = not self.frontend.check_port_in_use()
            
            if backend_free and frontend_free:
                log_queue.write(LogLevel.INFO, "✅ Todos los puertos liberados")
                break
            time.sleep(1)
        
        log_queue.write(LogLevel.SYSTEM, "Todos los servicios detenidos.")
    
    def get_status(self) -> Dict[str, Any]:
        """Get status of all services"""
        return {
            "backend": {
                "running": self.backend.is_running(),
                "port": self.backend.port,
                "stats": self.backend.get_stats().__dict__
            },
            "frontend": {
                "running": self.frontend.is_running(),
                "port": self.frontend.port,
                "stats": self.frontend.get_stats().__dict__
            }
        }
