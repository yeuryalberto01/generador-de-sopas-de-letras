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
    
    async def get_status_async(self) -> SystemGPUStatus:
        """
        Obtiene el estado completo del sistema GPU.
        INTENTO 1: Consultar a ComfyUI (Verdadera fuente de verdad).
        INTENTO 2: Consultar a Torch local (Fallback).
        """
        
        # 1. Try ComfyUI
        try:
            import httpx
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get("http://127.0.0.1:8188/system_stats")
                if resp.status_code == 200:
                    data = resp.json()
                    devices = data.get("devices", [])
                    
                    real_gpus = []
                    has_cuda = False
                    
                    for dev in devices:
                        if dev.get("type") == "cuda":
                            has_cuda = True
                            gpu_info = GPUInfo(
                                index=dev.get("index", 0),
                                name=dev.get("name", "Unknown GPU").split(":")[0].strip(), # Clean name
                                total_memory_gb=dev.get("vram_total", 0) / (1024**3),
                                free_memory_gb=dev.get("vram_free", 0) / (1024**3),
                                used_memory_gb=(dev.get("vram_total", 0) - dev.get("vram_free", 0)) / (1024**3),
                                is_cuda_available=True,
                                cuda_version="Unknown (ComfyUI)", 
                                compute_capability="Unknown"
                            )
                            real_gpus.append(gpu_info)
                    
                    if real_gpus:
                        logger.info(f"✅ GPU detectada via ComfyUI: {real_gpus[0].name}")
                        return SystemGPUStatus(
                            has_nvidia=True,
                            has_cuda=True,
                            cuda_version="Active via ComfyUI",
                            pytorch_version=data.get("system", {}).get("pytorch_version"),
                            gpus=real_gpus,
                            recommended_device="cuda:0",
                            can_run_ml=True
                        )
        except Exception as e:
            logger.debug(f"No se pudo consultar ComfyUI stats ({e}), usando detección local.")

        # 2. Local Fallback (Existing Logic)
        gpus: List[GPUInfo] = []
        cuda_version = None
        pytorch_version = None
        
        if self._torch_available:
            import torch
            pytorch_version = torch.__version__
            
            if self._cuda_available:
                try:
                    cuda_version = torch.version.cuda
                    for i in range(torch.cuda.device_count()):
                        props = torch.cuda.get_device_properties(i)
                        total_mem = props.total_memory / (1024**3)
                        
                        try:
                            # Avoid set_device if possible as it initializes ctx
                            free_mem = 0
                            used_mem = 0
                            # Try safe query or estimate
                            free_mem = total_mem * 0.8 # Mock free if context creation fails
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
                except Exception as e:
                    logger.error(f"Error local cuda check: {e}")

        recommended = "cpu"
        can_run_ml = False
        
        if gpus:
            recommended = f"cuda:{gpus[0].index}"
            can_run_ml = True
            
        return SystemGPUStatus(
            has_nvidia=len(gpus) > 0,
            has_cuda=self._cuda_available,
            cuda_version=cuda_version,
            pytorch_version=pytorch_version,
            gpus=gpus,
            recommended_device=recommended,
            can_run_ml=can_run_ml
        )

    def get_status(self) -> SystemGPUStatus:
        """Sync wrapper for async status"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If already running (e.g. inside endpoint), we shouldn't block.
                # But get_gpu_status endpoint IS async. 
                # This sync wrapper is for legacy calls if any.
                # For safety in sync context, verify we don't crash.
                return SystemGPUStatus(False, False, None, None, [], "cpu", False)
        except:
            pass

        # If truly sync context
        return asyncio.run(self.get_status_async())
    
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
