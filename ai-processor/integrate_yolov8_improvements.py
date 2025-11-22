"""
Script para integrar melhorias baseadas no repositório YOLOv8.
Inclui download do modelo pré-treinado e configuração.
"""

import os
import requests
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

def download_yolov8_plate_model(output_dir: str = "models") -> str:
    """
    Baixa o modelo pré-treinado de detecção de placas do repositório YOLOv8.
    
    Args:
        output_dir: Diretório onde salvar o modelo
    
    Returns:
        Caminho do modelo baixado ou None se falhar
    """
    model_url = "https://github.com/Muhammad-Zeerak-Khan/Automatic-License-Plate-Recognition-using-YOLOv8/raw/main/license_plate_detector.pt"
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    model_file = output_path / "license_plate_detector.pt"
    
    if model_file.exists():
        logger.info(f"Modelo já existe: {model_file}")
        return str(model_file)
    
    try:
        logger.info(f"Baixando modelo de {model_url}...")
        response = requests.get(model_url, stream=True, timeout=30)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(model_file, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\rProgresso: {progress:.1f}%", end='')
        
        print()  # Nova linha após progresso
        logger.info(f"Modelo baixado com sucesso: {model_file}")
        return str(model_file)
        
    except Exception as e:
        logger.error(f"Erro ao baixar modelo: {e}")
        return None


def setup_easyocr_support():
    """
    Verifica se EasyOCR está instalado e fornece instruções.
    """
    try:
        import easyocr
        logger.info("EasyOCR está instalado e pronto para uso")
        return True
    except ImportError:
        logger.warning("EasyOCR não está instalado. Para instalar: pip install easyocr")
        return False


def update_ultra_detector_with_pretrained():
    """
    Atualiza o UltraDetector para usar o modelo pré-treinado se disponível.
    """
    model_path = download_yolov8_plate_model()
    
    if model_path:
        logger.info(f"Modelo pré-treinado disponível em: {model_path}")
        logger.info("Configure a variável de ambiente:")
        logger.info(f"  ULTRALYTICS_MODEL_PATH={model_path}")
        return model_path
    else:
        logger.warning("Não foi possível baixar o modelo pré-treinado")
        return None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    print("="*80)
    print("INTEGRACAO DE MELHORIAS DO REPOSITORIO YOLOV8")
    print("="*80)
    
    # 1. Baixar modelo pré-treinado
    print("\n1. Baixando modelo pre-treinado...")
    model_path = update_ultra_detector_with_pretrained()
    
    # 2. Verificar EasyOCR
    print("\n2. Verificando suporte para EasyOCR...")
    easyocr_available = setup_easyocr_support()
    
    # 3. Resumo
    print("\n" + "="*80)
    print("RESUMO")
    print("="*80)
    if model_path:
        print(f"[OK] Modelo pre-treinado: {model_path}")
        print(f"     Configure: ULTRALYTICS_MODEL_PATH={model_path}")
    else:
        print("[AVISO] Modelo pre-treinado nao disponivel")
    
    if easyocr_available:
        print("[OK] EasyOCR disponivel")
    else:
        print("[AVISO] EasyOCR nao instalado")
        print("        Instale com: pip install easyocr")
    
    print("\nProximos passos:")
    print("1. Configure ULTRALYTICS_MODEL_PATH se o modelo foi baixado")
    print("2. Instale EasyOCR se desejar usar como alternativa ao Tesseract")
    print("3. Reinicie o sistema para aplicar as mudancas")
    print("="*80)

