"""
Node Switcher - Conmutador de Nodos de ComfyUI

Controla qué nodos activar/desactivar según el contexto:
- ControlNet Canny/Lineart: SIEMPRE para proteger grilla
- IP-Adapter: Solo si hay imagen de referencia
- Inpainting: Para márgenes/encabezado con máscara
- Upscaler ESRGAN: Solo al final si se requiere
"""

from enum import Enum
from typing import Optional, Dict, Any, List
from dataclasses import dataclass


class NodeType(Enum):
    """Tipos de nodos disponibles en ComfyUI"""
    CONTROLNET_CANNY = "controlnet_canny"
    CONTROLNET_LINEART = "controlnet_lineart"
    CONTROLNET_DEPTH = "controlnet_depth"
    IPADAPTER = "ipadapter"
    INPAINTING = "inpainting"
    UPSCALE_ESRGAN = "upscale_esrgan"
    UPSCALE_LANCZOS = "upscale_lanczos"


@dataclass
class NodeConfig:
    """Configuración de un nodo"""
    node_type: NodeType
    enabled: bool
    weight: float  # 0.0 - 1.0
    params: Dict[str, Any]
    
    # Modelo/archivo asociado
    model_name: Optional[str] = None


class NodeSwitcher:
    """
    Conmutador de Nodos
    
    Decide qué nodos de ComfyUI activar según el contexto de generación.
    Implementa las reglas:
    - ControlNet SIEMPRE que haya grilla
    - IP-Adapter solo si hay referencia (peso moderado)
    - Inpainting con máscara para márgenes
    - Upscaler solo al final
    """
    
    # Modelos disponibles
    MODELS = {
        NodeType.CONTROLNET_CANNY: "control_v11p_sd15_canny.pth",
        NodeType.CONTROLNET_LINEART: "control_v11p_sd15_lineart.pth",
        NodeType.CONTROLNET_DEPTH: "control_v11f1p_sd15_depth.pth",
        NodeType.IPADAPTER: "ip-adapter_sd15.safetensors",
        NodeType.UPSCALE_ESRGAN: "RealESRGAN_x4plus.pth",
    }
    
    # Pesos por defecto según modo
    DEFAULT_WEIGHTS = {
        "explorar": {
            NodeType.CONTROLNET_CANNY: 0.7,
            NodeType.CONTROLNET_LINEART: 0.7,
            NodeType.IPADAPTER: 0.4,
        },
        "producir": {
            NodeType.CONTROLNET_CANNY: 0.9,
            NodeType.CONTROLNET_LINEART: 0.9,
            NodeType.IPADAPTER: 0.3,
        }
    }
    
    def __init__(self):
        self._active_nodes: Dict[NodeType, NodeConfig] = {}
        self._mode: str = "explorar"
    
    def set_mode(self, mode: str):
        """Establece el modo de operación (explorar/producir)"""
        self._mode = mode if mode in ["explorar", "producir"] else "explorar"
    
    def configure_for_stage(
        self,
        stage: str,
        has_reference: bool = False,
        has_mask: bool = False,
        protect_grid: bool = True
    ) -> Dict[NodeType, NodeConfig]:
        """
        Configura los nodos para una etapa específica.
        
        Args:
            stage: "fondo", "grilla", "margenes", "upscale"
            has_reference: Si hay imagen de referencia para IP-Adapter
            has_mask: Si hay máscara disponible
            protect_grid: Si debe proteger la grilla con ControlNet
        
        Returns:
            Dict con configuración de cada nodo
        """
        self._active_nodes = {}
        weights = self.DEFAULT_WEIGHTS.get(self._mode, self.DEFAULT_WEIGHTS["explorar"])
        
        if stage == "fondo":
            # Fondo: IP-Adapter si hay referencia, NO ControlNet
            if has_reference:
                self._active_nodes[NodeType.IPADAPTER] = NodeConfig(
                    node_type=NodeType.IPADAPTER,
                    enabled=True,
                    weight=weights.get(NodeType.IPADAPTER, 0.4),
                    params={
                        "start_at": 0.0,
                        "end_at": 1.0,
                    },
                    model_name=self.MODELS[NodeType.IPADAPTER]
                )
        
        elif stage == "grilla":
            # Grilla: ControlNet SIEMPRE para proteger letras
            if protect_grid:
                self._active_nodes[NodeType.CONTROLNET_CANNY] = NodeConfig(
                    node_type=NodeType.CONTROLNET_CANNY,
                    enabled=True,
                    weight=weights.get(NodeType.CONTROLNET_CANNY, 0.8),
                    params={
                        "start_percent": 0.0,
                        "end_percent": 1.0,
                        "canny_low": 100,
                        "canny_high": 200,
                    },
                    model_name=self.MODELS[NodeType.CONTROLNET_CANNY]
                )
        
        elif stage == "margenes":
            # Márgenes: Inpainting con máscara
            if has_mask:
                self._active_nodes[NodeType.INPAINTING] = NodeConfig(
                    node_type=NodeType.INPAINTING,
                    enabled=True,
                    weight=1.0,
                    params={
                        "denoise": 0.7,
                        "mask_blur": 8,
                        "inpaint_full_res": False,
                    },
                    model_name=None
                )
            
            # También IP-Adapter si hay referencia
            if has_reference:
                self._active_nodes[NodeType.IPADAPTER] = NodeConfig(
                    node_type=NodeType.IPADAPTER,
                    enabled=True,
                    weight=weights.get(NodeType.IPADAPTER, 0.3),
                    params={
                        "start_at": 0.0,
                        "end_at": 0.8,
                    },
                    model_name=self.MODELS[NodeType.IPADAPTER]
                )
        
        elif stage == "upscale":
            # Upscale: ESRGAN al final
            self._active_nodes[NodeType.UPSCALE_ESRGAN] = NodeConfig(
                node_type=NodeType.UPSCALE_ESRGAN,
                enabled=True,
                weight=1.0,
                params={
                    "scale": 4,
                    "target_dpi": 300,
                },
                model_name=self.MODELS[NodeType.UPSCALE_ESRGAN]
            )
        
        return self._active_nodes
    
    def adjust_for_retry(
        self,
        issues: List[str],
        current_config: Dict[NodeType, NodeConfig]
    ) -> Dict[NodeType, NodeConfig]:
        """
        Ajusta la configuración para un reintento basado en problemas de QC.
        
        Args:
            issues: Lista de problemas detectados por QC
            current_config: Configuración actual
        
        Returns:
            Configuración ajustada
        """
        adjusted = dict(current_config)
        
        for issue in issues:
            issue_lower = issue.lower()
            
            # Grilla modificada → aumentar ControlNet
            if "grilla" in issue_lower or "letras" in issue_lower:
                if NodeType.CONTROLNET_CANNY in adjusted:
                    adjusted[NodeType.CONTROLNET_CANNY].weight = min(1.0, 
                        adjusted[NodeType.CONTROLNET_CANNY].weight + 0.15)
                    print(f"    🔧 ControlNet: {adjusted[NodeType.CONTROLNET_CANNY].weight:.2f}")
            
            # Estilo muy fuerte → reducir IP-Adapter
            if "estilo" in issue_lower or "referencia" in issue_lower:
                if NodeType.IPADAPTER in adjusted:
                    adjusted[NodeType.IPADAPTER].weight = max(0.1,
                        adjusted[NodeType.IPADAPTER].weight - 0.1)
                    print(f"    🔧 IP-Adapter: {adjusted[NodeType.IPADAPTER].weight:.2f}")
            
            # Sobrecargado → reducir denoise en inpainting
            if "sobrecarga" in issue_lower or "ruido" in issue_lower:
                if NodeType.INPAINTING in adjusted:
                    current_denoise = adjusted[NodeType.INPAINTING].params.get("denoise", 0.7)
                    adjusted[NodeType.INPAINTING].params["denoise"] = max(0.3, 
                        current_denoise - 0.1)
                    print(f"    🔧 Inpainting denoise: {adjusted[NodeType.INPAINTING].params['denoise']:.2f}")
        
        return adjusted
    
    def get_workflow_modifications(
        self,
        base_workflow: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Modifica un workflow base de ComfyUI según la configuración activa.
        
        Args:
            base_workflow: Workflow JSON de ComfyUI
        
        Returns:
            Workflow modificado
        """
        workflow = dict(base_workflow)
        
        # Por cada nodo activo, modificar el workflow
        for node_type, config in self._active_nodes.items():
            if not config.enabled:
                continue
            
            if node_type == NodeType.CONTROLNET_CANNY:
                workflow = self._add_controlnet_to_workflow(workflow, config)
            
            elif node_type == NodeType.IPADAPTER:
                workflow = self._add_ipadapter_to_workflow(workflow, config)
            
            elif node_type == NodeType.INPAINTING:
                workflow = self._configure_inpainting_in_workflow(workflow, config)
            
            elif node_type == NodeType.UPSCALE_ESRGAN:
                workflow = self._add_upscale_to_workflow(workflow, config)
        
        return workflow
    
    def _add_controlnet_to_workflow(
        self,
        workflow: Dict[str, Any],
        config: NodeConfig
    ) -> Dict[str, Any]:
        """Agrega nodos de ControlNet al workflow"""
        # TODO: Implementar modificación real del workflow
        # Por ahora retorna el workflow sin cambios
        return workflow
    
    def _add_ipadapter_to_workflow(
        self,
        workflow: Dict[str, Any],
        config: NodeConfig
    ) -> Dict[str, Any]:
        """Agrega IP-Adapter al workflow"""
        # TODO: Implementar modificación real del workflow
        return workflow
    
    def _configure_inpainting_in_workflow(
        self,
        workflow: Dict[str, Any],
        config: NodeConfig
    ) -> Dict[str, Any]:
        """Configura inpainting en el workflow"""
        # TODO: Implementar modificación real del workflow
        return workflow
    
    def _add_upscale_to_workflow(
        self,
        workflow: Dict[str, Any],
        config: NodeConfig
    ) -> Dict[str, Any]:
        """Agrega upscaler al workflow"""
        # TODO: Implementar modificación real del workflow
        return workflow
    
    def get_active_nodes_summary(self) -> str:
        """Retorna un resumen de los nodos activos"""
        if not self._active_nodes:
            return "No hay nodos activos"
        
        lines = ["🔌 Nodos activos:"]
        for node_type, config in self._active_nodes.items():
            status = "✅" if config.enabled else "❌"
            lines.append(f"  {status} {node_type.value}: weight={config.weight:.2f}")
        
        return "\n".join(lines)


# Singleton
_switcher: Optional[NodeSwitcher] = None

def get_node_switcher() -> NodeSwitcher:
    global _switcher
    if _switcher is None:
        _switcher = NodeSwitcher()
    return _switcher
