"""
Script para testar imagens com OCR melhorado (EasyOCR + pré-processamento otimizado).
"""

import os
import sys
from pathlib import Path
from datetime import datetime
from license_plate_recognition import LicensePlateRecognizer

# Configurar caminho do modelo pré-treinado
model_path = Path(__file__).parent / "models" / "license_plate_detector.pt"
if model_path.exists():
    os.environ['ULTRALYTICS_MODEL_PATH'] = str(model_path)
    print(f"Modelo configurado: {model_path}")
else:
    print(f"[AVISO] Modelo nao encontrado em: {model_path}")

# Habilitar EasyOCR
os.environ['USE_EASYOCR'] = 'true'

def test_images_improved_ocr(folder_path: str):
    """
    Testa imagens com OCR melhorado (EasyOCR + pré-processamento otimizado).
    """
    # Criar reconhecedor com EasyOCR habilitado
    print("Inicializando reconhecedor com EasyOCR...")
    recognizer = LicensePlateRecognizer(use_easyocr=True)
    
    # Verificar se o modelo foi carregado
    if recognizer.ultra_available:
        print(f"[OK] Modelo Ultralytics carregado!")
    else:
        print(f"[AVISO] Modelo Ultralytics nao foi carregado")
    
    # Verificar EasyOCR
    if recognizer.easyocr_available:
        print(f"[OK] EasyOCR disponivel e pronto!")
    else:
        print(f"[AVISO] EasyOCR nao disponivel")
    
    # Obter caminho da pasta
    folder = Path(folder_path)
    
    if not folder.exists():
        print(f"[ERRO] Pasta nao encontrada: {folder_path}")
        return
    
    # Extensões de imagem suportadas
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
    
    # Encontrar todas as imagens
    image_files = []
    for ext in image_extensions:
        image_files.extend(folder.glob(f'*{ext}'))
        image_files.extend(folder.glob(f'*{ext.upper()}'))
    
    # Remover duplicatas
    image_files = list(set(image_files))
    
    if not image_files:
        print(f"[ERRO] Nenhuma imagem encontrada na pasta: {folder_path}")
        return
    
    print(f"\n{'='*80}")
    print(f"TESTE COM OCR MELHORADO (EasyOCR + Pre-processamento Otimizado)")
    print(f"{'='*80}")
    print(f"Pasta: {folder_path}")
    print(f"Total de imagens encontradas: {len(image_files)}")
    print(f"Modelo Ultralytics: {'Disponivel' if recognizer.ultra_available else 'Indisponivel'}")
    print(f"EasyOCR: {'Disponivel' if recognizer.easyocr_available else 'Indisponivel'}")
    print(f"Inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}\n")
    
    # Resultados
    results_summary = {
        'total_images': len(image_files),
        'processed': 0,
        'with_plates': 0,
        'with_text': 0,
        'without_plates': 0,
        'errors': 0,
        'plates_found': [],
        'details': []
    }
    
    # Processar cada imagem
    for idx, image_path in enumerate(image_files, 1):
        print(f"\n[{idx}/{len(image_files)}] Processando: {image_path.name}")
        print(f"{'-'*80}")
        
        try:
            # Reconhecer placas
            results = recognizer.recognize_from_image(str(image_path))
            
            results_summary['processed'] += 1
            
            if results:
                results_summary['with_plates'] += 1
                print(f"[OK] Placa(s) detectada(s): {len(results)}")
                
                for i, result in enumerate(results, 1):
                    plate_num = result.get('plate_number', 'N/A')
                    plate_type = result.get('plate_type', 'N/A')
                    confidence = result.get('confidence', 0.0)
                    bbox = result.get('bbox', {})
                    vehicle_color = result.get('vehicle_color', 'N/A')
                    
                    if plate_num and plate_num != 'N/A':
                        results_summary['with_text'] += 1
                    
                    print(f"  Placa {i}:")
                    print(f"    Numero: {plate_num if plate_num else 'Nao reconhecido'}")
                    print(f"    Tipo: {plate_type if plate_type else 'N/A'}")
                    print(f"    Confianca: {confidence:.2%}")
                    print(f"    BBox: x={bbox.get('x', 0)}, y={bbox.get('y', 0)}, "
                          f"w={bbox.get('width', 0)}, h={bbox.get('height', 0)}")
                    print(f"    Cor do veiculo: {vehicle_color} "
                          f"({result.get('vehicle_color_confidence', 0.0):.2%})")
                    
                    # Adicionar aos resultados
                    results_summary['plates_found'].append({
                        'image': image_path.name,
                        'plate_number': plate_num,
                        'plate_type': plate_type,
                        'confidence': confidence,
                        'bbox': bbox,
                        'vehicle_color': vehicle_color
                    })
                    
                    results_summary['details'].append({
                        'image': str(image_path),
                        'result': result
                    })
            else:
                results_summary['without_plates'] += 1
                print(f"[AVISO] Nenhuma placa detectada")
                
        except Exception as e:
            results_summary['errors'] += 1
            print(f"[ERRO] Erro ao processar: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Resumo final
    print(f"\n{'='*80}")
    print(f"RESUMO DOS RESULTADOS")
    print(f"{'='*80}")
    print(f"Total de imagens: {results_summary['total_images']}")
    print(f"Processadas com sucesso: {results_summary['processed']}")
    print(f"Com placas detectadas: {results_summary['with_plates']}")
    print(f"Com texto reconhecido: {results_summary['with_text']}")
    print(f"Sem placas detectadas: {results_summary['without_plates']}")
    print(f"Erros: {results_summary['errors']}")
    print(f"Total de placas encontradas: {len(results_summary['plates_found'])}")
    print(f"Taxa de sucesso (texto): {results_summary['with_text']}/{results_summary['with_plates']} "
          f"({results_summary['with_text']/results_summary['with_plates']*100 if results_summary['with_plates'] > 0 else 0:.1f}%)")
    print(f"Fim: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}\n")
    
    # Listar todas as placas encontradas
    if results_summary['plates_found']:
        print(f"PLACAS ENCONTRADAS:")
        print(f"{'-'*80}")
        for plate_info in results_summary['plates_found']:
            plate_num = plate_info['plate_number'] if plate_info['plate_number'] else 'Nao reconhecido'
            plate_type = plate_info['plate_type'] if plate_info['plate_type'] else 'N/A'
            print(f"  {plate_num} ({plate_type}) - {plate_info['image']} "
                  f"[Confianca: {plate_info['confidence']:.2%}]")
        print()
    
    # Salvar resultados em JSON
    import json
    output_file = folder / "recognition_results_improved.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results_summary, f, ensure_ascii=False, indent=2)
    
    print(f"Resultados salvos em: {output_file}")
    
    return results_summary


if __name__ == "__main__":
    # Caminho da pasta de imagens
    if len(sys.argv) > 1:
        folder_path = sys.argv[1]
    else:
        folder_path = r"C:\Users\cpd.44\Pictures\Carros"
    
    test_images_improved_ocr(folder_path)

