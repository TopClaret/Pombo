"""
Script para buscar e baixar modelos pré-treinados de reconhecimento de placas.
Integra modelos de múltiplas fontes para melhorar a precisão.
"""

import os
import requests
from pathlib import Path
import logging
from typing import Dict, List, Optional
import json

logger = logging.getLogger(__name__)

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Diretório para modelos
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

# Lista de modelos pré-treinados disponíveis
PRETRAINED_MODELS = {
    "yolov8_license_plate": {
        "name": "YOLOv8 License Plate Detector",
        "url": "https://github.com/Muhammad-Zeerak-Khan/Automatic-License-Plate-Recognition-using-YOLOv8/raw/main/license_plate_detector.pt",
        "filename": "license_plate_detector.pt",
        "description": "Modelo YOLOv8 pré-treinado para detecção de placas",
        "source": "GitHub - Muhammad-Zeerak-Khan",
        "type": "detection"
    },
    "yolov8n": {
        "name": "YOLOv8 Nano (COCO)",
        "url": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt",
        "filename": "yolov8n.pt",
        "description": "Modelo YOLOv8 Nano pré-treinado no COCO (pode detectar veículos)",
        "source": "Ultralytics",
        "type": "detection"
    },
    "yolov8s": {
        "name": "YOLOv8 Small (COCO)",
        "url": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8s.pt",
        "filename": "yolov8s.pt",
        "description": "Modelo YOLOv8 Small pré-treinado no COCO",
        "source": "Ultralytics",
        "type": "detection"
    },
    "yolov8m": {
        "name": "YOLOv8 Medium (COCO)",
        "url": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8m.pt",
        "filename": "yolov8m.pt",
        "description": "Modelo YOLOv8 Medium pré-treinado no COCO",
        "source": "Ultralytics",
        "type": "detection"
    },
    "yolov8l": {
        "name": "YOLOv8 Large (COCO)",
        "url": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8l.pt",
        "filename": "yolov8l.pt",
        "description": "Modelo YOLOv8 Large pré-treinado no COCO (maior precisão)",
        "source": "Ultralytics",
        "type": "detection"
    },
    "yolov8x": {
        "name": "YOLOv8 XLarge (COCO)",
        "url": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8x.pt",
        "filename": "yolov8x.pt",
        "description": "Modelo YOLOv8 XLarge pré-treinado no COCO (máxima precisão)",
        "source": "Ultralytics",
        "type": "detection"
    }
}

def download_file(url: str, output_path: Path, description: str = "") -> bool:
    """
    Baixa um arquivo de uma URL.
    
    Args:
        url: URL do arquivo
        output_path: Caminho onde salvar o arquivo
        description: Descrição do arquivo para logging
    
    Returns:
        True se o download foi bem-sucedido, False caso contrário
    """
    try:
        logger.info(f"Baixando {description}...")
        logger.info(f"URL: {url}")
        
        response = requests.get(url, stream=True, timeout=60)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\rProgresso: {progress:.1f}% ({downloaded}/{total_size} bytes)", end='')
        
        print()  # Nova linha após progresso
        logger.info(f"Download concluido: {output_path}")
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Erro ao baixar {description}: {e}")
        return False
    except Exception as e:
        logger.error(f"Erro inesperado ao baixar {description}: {e}")
        return False

def download_model(model_key: str, force: bool = False) -> Optional[Path]:
    """
    Baixa um modelo pré-treinado específico.
    
    Args:
        model_key: Chave do modelo em PRETRAINED_MODELS
        force: Se True, baixa novamente mesmo se já existir
    
    Returns:
        Caminho do modelo baixado ou None se falhar
    """
    if model_key not in PRETRAINED_MODELS:
        logger.error(f"Modelo '{model_key}' nao encontrado")
        return None
    
    model_info = PRETRAINED_MODELS[model_key]
    output_path = MODELS_DIR / model_info['filename']
    
    # Verificar se já existe
    if output_path.exists() and not force:
        logger.info(f"Modelo ja existe: {output_path}")
        return output_path
    
    # Baixar modelo
    success = download_file(
        model_info['url'],
        output_path,
        f"{model_info['name']} ({model_info['source']})"
    )
    
    if success:
        return output_path
    else:
        # Tentar remover arquivo parcial se existir
        if output_path.exists():
            try:
                output_path.unlink()
            except:
                pass
        return None

def list_available_models() -> List[Dict]:
    """
    Lista todos os modelos disponíveis.
    
    Returns:
        Lista de informações sobre modelos disponíveis
    """
    models = []
    for key, info in PRETRAINED_MODELS.items():
        model_path = MODELS_DIR / info['filename']
        models.append({
            'key': key,
            'name': info['name'],
            'description': info['description'],
            'source': info['source'],
            'type': info['type'],
            'filename': info['filename'],
            'downloaded': model_path.exists(),
            'path': str(model_path) if model_path.exists() else None
        })
    return models

def download_all_models(force: bool = False) -> Dict[str, bool]:
    """
    Baixa todos os modelos disponíveis.
    
    Args:
        force: Se True, baixa novamente mesmo se já existirem
    
    Returns:
        Dicionário com status de download de cada modelo
    """
    results = {}
    
    print(f"\n{'='*80}")
    print(f"BAIXANDO MODELOS PRE-TREINADOS")
    print(f"{'='*80}")
    print(f"Total de modelos disponiveis: {len(PRETRAINED_MODELS)}")
    print(f"Diretorio de destino: {MODELS_DIR}")
    print(f"{'='*80}\n")
    
    for key in PRETRAINED_MODELS.keys():
        print(f"\n[{list(PRETRAINED_MODELS.keys()).index(key) + 1}/{len(PRETRAINED_MODELS)}] {PRETRAINED_MODELS[key]['name']}")
        result = download_model(key, force=force)
        results[key] = result is not None
    
    return results

def create_models_config() -> Path:
    """
    Cria arquivo de configuração com informações dos modelos.
    
    Returns:
        Caminho do arquivo de configuração criado
    """
    config = {
        'models_dir': str(MODELS_DIR),
        'models': {}
    }
    
    for key, info in PRETRAINED_MODELS.items():
        model_path = MODELS_DIR / info['filename']
        config['models'][key] = {
            'name': info['name'],
            'description': info['description'],
            'source': info['source'],
            'type': info['type'],
            'filename': info['filename'],
            'path': str(model_path) if model_path.exists() else None,
            'available': model_path.exists()
        }
    
    config_path = MODELS_DIR / "models_config.json"
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Configuracao salva em: {config_path}")
    return config_path

def main():
    """Função principal."""
    import sys
    
    print(f"\n{'='*80}")
    print(f"GERENCIADOR DE MODELOS PRE-TREINADOS")
    print(f"{'='*80}\n")
    
    # Listar modelos disponíveis
    models = list_available_models()
    
    print("Modelos disponiveis:")
    print(f"{'-'*80}")
    for model in models:
        status = "[BAIXADO]" if model['downloaded'] else "[NAO BAIXADO]"
        print(f"{status} {model['key']}: {model['name']}")
        print(f"         {model['description']}")
        print(f"         Fonte: {model['source']}")
        if model['downloaded']:
            print(f"         Caminho: {model['path']}")
        print()
    
    # Verificar argumentos
    if len(sys.argv) > 1:
        if sys.argv[1] == "--all":
            # Baixar todos os modelos
            results = download_all_models(force=False)
            
            print(f"\n{'='*80}")
            print(f"RESUMO DOS DOWNLOADS")
            print(f"{'='*80}")
            for key, success in results.items():
                status = "[OK]" if success else "[ERRO]"
                print(f"{status} {PRETRAINED_MODELS[key]['name']}")
            print(f"{'='*80}\n")
            
        elif sys.argv[1] in PRETRAINED_MODELS:
            # Baixar modelo específico
            model_key = sys.argv[1]
            force = "--force" in sys.argv
            result = download_model(model_key, force=force)
            
            if result:
                print(f"\n[OK] Modelo baixado com sucesso: {result}")
            else:
                print(f"\n[ERRO] Falha ao baixar modelo: {model_key}")
        else:
            print(f"\n[ERRO] Modelo '{sys.argv[1]}' nao encontrado")
            print(f"Modelos disponiveis: {', '.join(PRETRAINED_MODELS.keys())}")
    else:
        print("\nUso:")
        print("  python download_pretrained_models.py --all          # Baixar todos os modelos")
        print("  python download_pretrained_models.py <model_key>    # Baixar modelo especifico")
        print("  python download_pretrained_models.py <model_key> --force  # Forcar download")
        print(f"\nModelos disponiveis: {', '.join(PRETRAINED_MODELS.keys())}")
    
    # Criar arquivo de configuração
    create_models_config()
    
    print(f"\n{'='*80}")
    print(f"CONFIGURACAO PARA USO")
    print(f"{'='*80}")
    print("Para usar um modelo, configure a variavel de ambiente:")
    print("  ULTRALYTICS_MODEL_PATH=<caminho_do_modelo>")
    print(f"\nExemplo:")
    print(f"  export ULTRALYTICS_MODEL_PATH={MODELS_DIR}/license_plate_detector.pt")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()

