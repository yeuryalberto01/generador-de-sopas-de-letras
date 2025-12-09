"""
GPU Manager - Detección y gestión de recursos GPU para el Template Engine.
Soporta NVIDIA CUDA (PyTorch) con fallback a CPU.
"""

import logging
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

@dataclass
class GPUInfo:
    """Información de una GPU detectada."""
    index: int
    name: str
    total_memory_gb: float
    free_memory_gb: float
    used_memory_gb: float
    temperature: Optional[float] = None
    utilization: Optional[float] = None
    is_cuda_available: bool = False
    cuda_version: Optional[str] = None
    compute_capability: Optional[str] = None


@dataclass
class SystemGPUStatus:
    """Estado completo del sistema GPU."""
    has_nvidia: bool
    has_cuda: bool
    cuda_version: Optional[str]
    pytorch_version: Optional[str]
    gpus: List[GPUInfo]
    recommended_device: str  # 'cuda:0', 'cuda:1', or 'cpu'
    can_run_ml: bool
    min_vram_required_gb: float = 4.0


class GPUManager:
    """Gestor de recursos GPU para operaciones ML."""
    
    def __init__(self):
        self._torch_available = False
        self._cuda_available = False
        self._device = None
        self._initialize()
    
    def _initialize(self):
        """Inicializa y detecta GPUs disponibles."""
        try:
            import torch
            self._torch_available = True
            self._cuda_available = torch.cuda.is_available()
            
            if self._cuda_available:
                self._device = torch.device("cuda:0")
                logger.info(f"CUDA disponible: {torch.cuda.get_device_name(0)}")
            else:
                self._device = torch.device("cpu")
                logger.info("CUDA no disponible, usando CPU")
                
        except ImportError:
            logger.warning("PyTorch no instalado. Instalar con: pip install torch torchvision")
            self._device = None
    
    def get_device(self):
        """Retorna el dispositivo PyTorch recomendado."""
        return self._device
    
    def get_status(self) -> SystemGPUStatus:
        """Obtiene el estado completo del sistema GPU."""
        gpus: List[GPUInfo] = []
        cuda_version = None
        pytorch_version = None
        
        if self._torch_available:
            import torch
            pytorch_version = torch.__version__
            
            if self._cuda_available:
                cuda_version = torch.version.cuda
                
                # Obtener info de cada GPU NVIDIA
                for i in range(torch.cuda.device_count()):
                    props = torch.cuda.get_device_properties(i)
                    total_mem = props.total_memory / (1024**3)  # GB
                    
                    # Memoria actual (requiere estar en el dispositivo)
                    try:
                        torch.cuda.set_device(i)
                        free_mem = torch.cuda.mem_get_info(i)[0] / (1024**3)
                        used_mem = total_mem - free_mem
                    except:
                        free_mem = total_mem
                        used_mem = 0
                    
                    gpu_info = GPUInfo(
                        index=i,
                        name=props.name,
                        total_memory_gb=round(total_mem, 2),
                        free_memory_gb=round(free_mem, 2),
                        used_memory_gb=round(used_mem, 2),
                        is_cuda_available=True,
                        cuda_version=cuda_version,
                        compute_capability=f"{props.major}.{props.minor}"
                    )
                    gpus.append(gpu_info)
        
        # Determinar mejor dispositivo
        recommended = "cpu"
        can_run_ml = False
        
        if gpus:
            # Buscar GPU con suficiente VRAM (mínimo 4GB)
            for gpu in gpus:
                if gpu.free_memory_gb >= 4.0:
                    recommended = f"cuda:{gpu.index}"
                    can_run_ml = True
                    break
        
        return SystemGPUStatus(
            has_nvidia=len(gpus) > 0,
            has_cuda=self._cuda_available,
            cuda_version=cuda_version,
            pytorch_version=pytorch_version,
            gpus=gpus,
            recommended_device=recommended,
            can_run_ml=can_run_ml
        )
    
    def allocate_memory(self, size_gb: float) -> bool:
        """
        Verifica si hay suficiente memoria GPU disponible.
        
        Args:
            size_gb: Cantidad de memoria requerida en GB
            
        Returns:
            True si hay suficiente memoria disponible
        """
        if not self._cuda_available:
            return False
            
        status = self.get_status()
        for gpu in status.gpus:
            if gpu.free_memory_gb >= size_gb:
                return True
        return False
    
    def clear_cache(self):
        """Libera memoria GPU no utilizada."""
        if self._torch_available and self._cuda_available:
            import torch
            torch.cuda.empty_cache()
            logger.info("Cache GPU liberado")


# Singleton global
_gpu_manager: Optional[GPUManager] = None

def get_gpu_manager() -> GPUManager:
    """Obtiene la instancia del gestor GPU."""
    global _gpu_manager
    if _gpu_manager is None:
        _gpu_manager = GPUManager()
    return _gpu_manager


def get_gpu_status_dict() -> Dict[str, Any]:
    """Obtiene el estado GPU como diccionario para API."""
    manager = get_gpu_manager()
    status = manager.get_status()
    
    return {
        "has_nvidia": status.has_nvidia,
        "has_cuda": status.has_cuda,
        "cuda_version": status.cuda_version,
        "pytorch_version": status.pytorch_version,
        "recommended_device": status.recommended_device,
        "can_run_ml": status.can_run_ml,
        "gpus": [
            {
                "index": gpu.index,
                "name": gpu.name,
                "total_memory_gb": gpu.total_memory_gb,
                "free_memory_gb": gpu.free_memory_gb,
                "used_memory_gb": gpu.used_memory_gb,
                "compute_capability": gpu.compute_capability
            }
            for gpu in status.gpus
        ]
    }
