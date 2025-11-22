#!/usr/bin/env python3
"""
Processador AI para análise de placas veiculares
Integração com o backend principal
"""

import os
import sys
import json
import logging
from typing import Dict, Any
from pathlib import Path

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from license_plate_recognition import process_media_file

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_processor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def load_config() -> Dict[str, Any]:
    """Carrega configurações do arquivo config.json"""
    config_path = Path(__file__).parent / 'config.json'
    
    if config_path.exists():
        with open(config_path, 'r') as f:
            return json.load(f)
    else:
        # Configuração padrão
        return {
            "input_dir": "./input",
            "output_dir": "./output",
            "processed_dir": "./processed",
            "supported_formats": {
                "images": [".jpg", ".jpeg", ".png", ".bmp"],
                "videos": [".mp4", ".avi", ".mov", ".mkv"]
            },
            "processing": {
                "video_frame_interval": 30,
                "min_confidence": 0.6,
                "max_processing_time": 300  # 5 minutos
            }
        }

def ensure_directories(config: Dict[str, Any]) -> None:
    """Garante que os diretórios necessários existam"""
    directories = [
        config['input_dir'],
        config['output_dir'], 
        config['processed_dir']
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)

def process_file(file_path: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """Processa um único arquivo"""
    try:
        file_ext = Path(file_path).suffix.lower()
        
        # Determinar se é imagem ou vídeo
        is_video = file_ext in config['supported_formats']['videos']
        
        if not is_video and file_ext not in config['supported_formats']['images']:
            logger.warning(f"Formato não suportado: {file_path}")
            return None
        
        logger.info(f"Processando arquivo: {file_path}")
        
        # Processar o arquivo
        result = process_media_file(file_path, is_video)
        
        # Adicionar informações adicionais
        result['file_type'] = 'video' if is_video else 'image'
        result['file_name'] = Path(file_path).name
        result['file_size'] = os.path.getsize(file_path)
        
        logger.info(f"Processamento concluído: {result['total_detections']} detecções")
        
        return result
        
    except Exception as e:
        logger.error(f"Erro ao processar {file_path}: {e}")
        return {
            'error': str(e),
            'file_path': file_path,
            'success': False
        }

def save_results(results: Dict[str, Any], config: Dict[str, Any]) -> str:
    """Salva os resultados em JSON"""
    try:
        output_dir = Path(config['output_dir'])
        file_name = Path(results['file_path']).stem + '_results.json'
        output_path = output_dir / file_name
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Resultados salvos em: {output_path}")
        return str(output_path)
        
    except Exception as e:
        logger.error(f"Erro ao salvar resultados: {e}")
        raise

def move_processed_file(file_path: str, config: Dict[str, Any]) -> None:
    """Move o arquivo processado para o diretório processed"""
    try:
        processed_dir = Path(config['processed_dir'])
        file_name = Path(file_path).name
        destination = processed_dir / file_name
        
        os.rename(file_path, destination)
        logger.info(f"Arquivo movido para: {destination}")
        
    except Exception as e:
        logger.error(f"Erro ao mover arquivo: {e}")
        raise

def main():
    """Função principal do processador AI"""
    try:
        # Carregar configurações
        config = load_config()
        ensure_directories(config)
        
        logger.info("Iniciando processador AI de placas veiculares")
        
        # Verificar arquivos na pasta de input
        input_dir = Path(config['input_dir'])
        files_to_process = []
        
        # Coletar arquivos suportados
        for ext in (config['supported_formats']['images'] + 
                   config['supported_formats']['videos']):
            files_to_process.extend(input_dir.glob(f"*{ext}"))
        
        if not files_to_process:
            logger.info("Nenhum arquivo para processar")
            return
        
        logger.info(f"Encontrados {len(files_to_process)} arquivos para processar")
        
        # Processar cada arquivo
        all_results = []
        
        for file_path in files_to_process:
            try:
                # Processar arquivo
                result = process_file(str(file_path), config)
                
                if result and 'error' not in result:
                    # Salvar resultados
                    result_file = save_results(result, config)
                    result['result_file'] = result_file
                    
                    # Mover arquivo processado
                    move_processed_file(str(file_path), config)
                    
                    all_results.append(result)
                    
                    logger.info(f"Arquivo {file_path.name} processado com sucesso")
                
            except Exception as e:
                logger.error(f"Falha no processamento de {file_path}: {e}")
                continue
        
        # Gerar relatório consolidado
        if all_results:
            generate_summary_report(all_results, config)
        
        logger.info("Processamento concluído")
        
    except KeyboardInterrupt:
        logger.info("Processamento interrompido pelo usuário")
    except Exception as e:
        logger.error(f"Erro fatal no processador: {e}")
        sys.exit(1)

def generate_summary_report(results: list, config: Dict[str, Any]) -> None:
    """Gera um relatório resumido do processamento"""
    try:
        summary = {
            'total_files_processed': len(results),
            'total_detections': sum(r['total_detections'] for r in results),
            'unique_vehicles': len(set(
                plate 
                for r in results 
                for det in r.get('all_detections', []) 
                for plate in [det['plate_number']]
            )),
            'repeated_vehicles': {},
            'files_by_type': {
                'images': len([r for r in results if r['file_type'] == 'image']),
                'videos': len([r for r in results if r['file_type'] == 'video'])
            },
            'processing_details': results
        }
        
        # Contar veículos repetidos entre diferentes arquivos
        vehicle_occurrences = {}
        for result in results:
            for detection in result.get('all_detections', []):
                plate = detection['plate_number']
                if plate not in vehicle_occurrences:
                    vehicle_occurrences[plate] = []
                vehicle_occurrences[plate].append({
                    'file': result['file_name'],
                    'timestamp': detection.get('timestamp'),
                    'frame': detection.get('frame_number')
                })
        
        summary['repeated_vehicles'] = {
            plate: occurrences 
            for plate, occurrences in vehicle_occurrences.items()
            if len(occurrences) > 1
        }
        
        # Salvar relatório
        report_path = Path(config['output_dir']) / 'processing_summary.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Relatório resumido salvo em: {report_path}")
        
        # Log do resumo
        logger.info(f"=== RESUMO DO PROCESSAMENTO ===")
        logger.info(f"Arquivos processados: {summary['total_files_processed']}")
        logger.info(f"Total de detecções: {summary['total_detections']}")
        logger.info(f"Veículos únicos: {summary['unique_vehicles']}")
        logger.info(f"Veículos repetidos: {len(summary['repeated_vehicles'])}")
        
        for plate, occurrences in summary['repeated_vehicles'].items():
            files = list(set(occ['file'] for occ in occurrences))
            logger.info(f"  - {plate}: aparece em {len(files)} arquivos diferentes")
        
    except Exception as e:
        logger.error(f"Erro ao gerar relatório: {e}")

if __name__ == "__main__":
    main()