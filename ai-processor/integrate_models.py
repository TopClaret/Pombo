"""
Script para integrar e testar múltiplos modelos pré-treinados.
Permite comparar performance de diferentes modelos.
"""

import os
import sys
from pathlib import Path
from license_plate_recognition import LicensePlateRecognizer
import json
from datetime import datetime

# Diretório de modelos
MODELS_DIR = Path(__file__).parent / "models"

def test_model_on_images(model_path: Path, images_folder: str) -> dict:
    """
    Testa um modelo específico em um conjunto de imagens.
    
    Args:
        model_path: Caminho para o modelo
        images_folder: Pasta com imagens de teste
    
    Returns:
        Dicionário com resultados do teste
    """
    if not model_path.exists():
        return {'error': f'Modelo nao encontrado: {model_path}'}
    
    # Configurar modelo
    os.environ['ULTRALYTICS_MODEL_PATH'] = str(model_path)
    
    # Criar reconhecedor
    recognizer = LicensePlateRecognizer(use_easyocr=False)
    
    if not recognizer.ultra_available:
        return {'error': 'Modelo nao foi carregado'}
    
    # Encontrar imagens
    folder = Path(images_folder)
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
    image_files = []
    for ext in image_extensions:
        image_files.extend(folder.glob(f'*{ext}'))
        image_files.extend(folder.glob(f'*{ext.upper()}'))
    
    image_files = list(set(image_files))
    
    if not image_files:
        return {'error': 'Nenhuma imagem encontrada'}
    
    # Processar imagens
    results = {
        'model': str(model_path.name),
        'total_images': len(image_files),
        'processed': 0,
        'with_plates': 0,
        'with_text': 0,
        'plates_found': []
    }
    
    for image_path in image_files:
        try:
            detections = recognizer.recognize_from_image(str(image_path))
            results['processed'] += 1
            
            if detections:
                results['with_plates'] += 1
                for det in detections:
                    if det.get('plate_number'):
                        results['with_text'] += 1
                        results['plates_found'].append({
                            'image': image_path.name,
                            'plate': det.get('plate_number'),
                            'type': det.get('plate_type'),
                            'confidence': det.get('confidence', 0.0)
                        })
        except Exception as e:
            print(f"Erro ao processar {image_path.name}: {e}")
    
    return results

def compare_models(images_folder: str):
    """
    Compara performance de múltiplos modelos.
    
    Args:
        images_folder: Pasta com imagens de teste
    """
    # Carregar configuração de modelos
    config_path = MODELS_DIR / "models_config.json"
    
    if not config_path.exists():
        print("[ERRO] Arquivo de configuracao nao encontrado.")
        print("Execute primeiro: python download_pretrained_models.py --all")
        return
    
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    print(f"\n{'='*80}")
    print(f"COMPARACAO DE MODELOS")
    print(f"{'='*80}")
    print(f"Pasta de imagens: {images_folder}")
    print(f"Total de modelos disponiveis: {len(config['models'])}")
    print(f"{'='*80}\n")
    
    results_comparison = []
    
    # Testar cada modelo disponível
    for key, model_info in config['models'].items():
        if not model_info.get('available'):
            print(f"[PULANDO] {model_info['name']} - nao baixado")
            continue
        
        print(f"\nTestando: {model_info['name']}")
        print(f"{'-'*80}")
        
        model_path = Path(model_info['path'])
        result = test_model_on_images(model_path, images_folder)
        
        if 'error' in result:
            print(f"[ERRO] {result['error']}")
            continue
        
        results_comparison.append({
            'model': model_info['name'],
            'key': key,
            'results': result
        })
        
        print(f"Imagens processadas: {result['processed']}/{result['total_images']}")
        print(f"Placas detectadas: {result['with_plates']}")
        print(f"Placas com texto: {result['with_text']}")
        if result['with_plates'] > 0:
            print(f"Taxa de sucesso: {result['with_text']/result['with_plates']*100:.1f}%")
    
    # Resumo comparativo
    print(f"\n{'='*80}")
    print(f"RESUMO COMPARATIVO")
    print(f"{'='*80}")
    print(f"{'Modelo':<40} {'Detecções':<15} {'Texto':<10} {'Taxa':<10}")
    print(f"{'-'*80}")
    
    for comp in results_comparison:
        r = comp['results']
        detections = f"{r['with_plates']}/{r['total_images']}"
        text = f"{r['with_text']}"
        rate = f"{r['with_text']/r['with_plates']*100:.1f}%" if r['with_plates'] > 0 else "0%"
        print(f"{comp['model']:<40} {detections:<15} {text:<10} {rate:<10}")
    
    print(f"{'='*80}\n")
    
    # Salvar resultados
    output_file = Path(images_folder) / "models_comparison.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'images_folder': images_folder,
            'comparison': results_comparison
        }, f, ensure_ascii=False, indent=2)
    
    print(f"Resultados salvos em: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        images_folder = sys.argv[1]
    else:
        images_folder = r"C:\Users\cpd.44\Pictures\Carros"
    
    compare_models(images_folder)

