#!/usr/bin/env python3
"""
FastAPI endpoint para o processador AI de reconhecimento de placas veiculares
Este serviço recebe requisições do backend principal para processar arquivos
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import json
import logging
import uuid
from pathlib import Path
from typing import Dict, Any, List
import numpy as np
import cv2
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / '.env')

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fastapi.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Importar o processador de placas
from license_plate_recognition import process_media_file
from yolo_detector import YOLODetector
from ultra_detector import UltraDetector
from roboflow_client import RoboflowClient

app = FastAPI(
    title="AI Processor API",
    description="API para reconhecimento de placas veiculares",
    version="1.0.0"
)

# Configurar CORS para permitir comunicação com o backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diretórios para armazenamento temporário
UPLOAD_DIR = Path("./uploads")
RESULTS_DIR = Path("./api_results")
UPLOAD_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

# Dicionário para armazenar status das tarefas
tasks: Dict[str, Dict[str, Any]] = {}

# YOLO detector global
yolo = YOLODetector()
detector_config = {
    'onnx_path': os.getenv('PLATE_DETECTOR_ONNX_PATH', ''),
    'conf_thresh': float(os.getenv('YOLO_CONF_THRESH', '0.25')),
    'nms_thresh': float(os.getenv('YOLO_NMS_THRESH', '0.45'))
}

ultra = UltraDetector()
ultra_config = {
    'weights_path': os.getenv('ULTRALYTICS_MODEL_PATH', ''),
    'conf_thresh': float(os.getenv('ULTRA_CONF_THRESH', '0.25')),
    'iou_thresh': float(os.getenv('ULTRA_IOU_THRESH', '0.45'))
}
rf = RoboflowClient()
rf_config = {
    'api_url': os.getenv('ROBOFLOW_API_URL', ''),
    'api_key': os.getenv('ROBOFLOW_API_KEY', ''),
    'model_id': os.getenv('ROBOFLOW_MODEL_ID', '')
}

@app.on_event("startup")
def on_startup():
    path = detector_config['onnx_path']
    if path:
        res = yolo.load(path)
        yolo.set_params(detector_config['conf_thresh'], detector_config['nms_thresh'])
    upath = ultra_config['weights_path']
    if upath:
        ures = ultra.load(upath)
        ultra.set_params(ultra_config['conf_thresh'], ultra_config['iou_thresh'])
    if rf_config['api_key'] and rf_config['model_id']:
        rf.load(rf_config['api_url'], rf_config['api_key'], rf_config['model_id'])

@app.get("/")
async def root():
    """Endpoint de saúde da API"""
    return {
        "status": "online", 
        "service": "AI Plate Recognition",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Endpoint de verificação de saúde"""
    return {"status": "healthy", "message": "AI processor is running"}

@app.post("/yolo/load")
async def yolo_load(onnx_path: str = ""):
    path = onnx_path or detector_config['onnx_path']
    result = yolo.load(path)
    if not result.get('loaded'):
        raise HTTPException(status_code=503, detail=result.get('error', 'Falha ao carregar modelo'))
    return { 'status': 'ok', 'model_path': result.get('model_path') }

@app.post("/config/detector")
async def set_detector_params(conf_thresh: float = 0.25, nms_thresh: float = 0.45):
    detector_config['conf_thresh'] = conf_thresh
    detector_config['nms_thresh'] = nms_thresh
    yolo.set_params(conf_thresh, nms_thresh)
    return { 'status': 'ok', 'conf_thresh': conf_thresh, 'nms_thresh': nms_thresh }

@app.post("/ultra/load")
async def ultra_load(weights_path: str = ""):
    path = weights_path or ultra_config['weights_path']
    result = ultra.load(path)
    if not result.get('loaded'):
        raise HTTPException(status_code=503, detail=result.get('error', 'Falha ao carregar modelo'))
    return { 'status': 'ok', 'model_path': result.get('model_path') }

@app.post("/config/ultra")
async def set_ultra_params(conf_thresh: float = 0.25, iou_thresh: float = 0.45):
    ultra_config['conf_thresh'] = conf_thresh
    ultra_config['iou_thresh'] = iou_thresh
    ultra.set_params(conf_thresh, iou_thresh)
    return { 'status': 'ok', 'conf_thresh': conf_thresh, 'iou_thresh': iou_thresh }

@app.post("/roboflow/load")
async def roboflow_load(api_url: str = "", api_key: str = "", model_id: str = ""):
    if api_key:
        os.environ['ROBOFLOW_API_KEY'] = api_key
    if model_id:
        os.environ['ROBOFLOW_MODEL_ID'] = model_id
    if api_url:
        os.environ['ROBOFLOW_API_URL'] = api_url
    result = rf.load(api_url, api_key, model_id)
    if not result.get('loaded'):
        raise HTTPException(status_code=503, detail=result.get('error', 'Falha ao carregar modelo'))
    return { 'status': 'ok', 'model_id': result.get('model_id') }

@app.post("/detect/frame")
async def detect_frame(file: UploadFile = File(...)):
    try:
        content = await file.read()
        npimg = np.frombuffer(content, np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail='Imagem inválida')
        result = yolo.infer(image)
        if not result.get('success'):
            raise HTTPException(status_code=503, detail=result.get('error', 'Detector indisponível'))
        return { 'status': 'ok', 'fps': result['fps'], 'detections': result['detections'] }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na detecção de frame: {e}")
        raise HTTPException(status_code=500, detail='Erro interno na detecção')

@app.post("/process/file")
async def process_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    analysis_type: str = "plate_recognition"
):
    """
    Processa um arquivo enviado para reconhecimento de placas
    
    Args:
        file: Arquivo de imagem ou vídeo
        analysis_type: Tipo de análise (plate_recognition)
    
    Returns:
        ID da tarefa criada para acompanhamento
    """
    try:
        # Validar tipo de arquivo
        allowed_extensions = {
            '.jpg', '.jpeg', '.png', '.bmp',  # Imagens
            '.mp4', '.avi', '.mov', '.mkv'    # Vídeos
        }
        
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Formato de arquivo não suportado: {file_ext}"
            )
        
        # Gerar ID único para a tarefa
        task_id = str(uuid.uuid4())
        
        # Salvar arquivo temporariamente
        file_path = UPLOAD_DIR / f"{task_id}{file_ext}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Determinar se é vídeo
        is_video = file_ext in {'.mp4', '.avi', '.mov', '.mkv'}
        
        # Inicializar tarefa
        tasks[task_id] = {
            "status": "processing",
            "file_name": file.filename,
            "file_type": "video" if is_video else "image",
            "file_size": len(content),
            "analysis_type": analysis_type,
            "start_time": "",
            "end_time": "",
            "results": None,
            "error": None
        }
        
        # Adicionar tarefa de processamento em background
        background_tasks.add_task(
            process_file_task, 
            task_id, 
            str(file_path), 
            is_video
        )
        
        logger.info(f"Tarefa {task_id} criada para arquivo {file.filename}")
        
        return {
            "task_id": task_id,
            "status": "processing",
            "message": "Arquivo recebido e processamento iniciado"
        }
        
    except Exception as e:
        logger.error(f"Erro ao processar arquivo: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.post("/process/path")
async def process_file_path(file_path: str, analysis_type: str = "plate_recognition"):
    """
    Processa um arquivo já existente no sistema de arquivos
    
    Args:
        file_path: Caminho absoluto para o arquivo
        analysis_type: Tipo de análise
    
    Returns:
        Resultados do processamento
    """
    try:
        # Verificar se arquivo existe
        if not Path(file_path).exists():
            raise HTTPException(status_code=404, detail="Arquivo não encontrado")
        
        # Determinar se é vídeo
        file_ext = Path(file_path).suffix.lower()
        is_video = file_ext in {'.mp4', '.avi', '.mov', '.mkv'}
        
        # Processar arquivo
        result = process_media_file(file_path, is_video)
        
        # Salvar resultados
        task_id = str(uuid.uuid4())
        result_file = RESULTS_DIR / f"{task_id}.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Arquivo {file_path} processado com sucesso")
        
        return {
            "task_id": task_id,
            "status": "completed",
            "results": result,
            "result_file": str(result_file)
        }
        
    except Exception as e:
        logger.error(f"Erro ao processar caminho do arquivo: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """
    Obtém o status de uma tarefa de processamento
    
    Args:
        task_id: ID da tarefa
    
    Returns:
        Status e resultados da tarefa
    """
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    task = tasks[task_id]
    
    return {
        "task_id": task_id,
        "status": task["status"],
        "file_name": task["file_name"],
        "file_type": task["file_type"],
        "analysis_type": task["analysis_type"],
        "results": task["results"],
        "error": task["error"]
    }

@app.get("/tasks")
async def list_tasks():
    """Lista todas as tarefas de processamento"""
    return {
        "total_tasks": len(tasks),
        "tasks": [
            {
                "task_id": task_id,
                "status": task["status"],
                "file_name": task["file_name"],
                "analysis_type": task["analysis_type"]
            }
            for task_id, task in tasks.items()
        ]
    }

def process_file_task(task_id: str, file_path: str, is_video: bool):
    """
    Tarefa em background para processamento de arquivos
    """
    try:
        # Atualizar status para processando
        tasks[task_id]["status"] = "processing"
        tasks[task_id]["start_time"] = ""  # Poderia usar datetime.now()
        
        logger.info(f"Iniciando processamento da tarefa {task_id}: {file_path}")
        
        # Processar arquivo
        result = process_media_file(file_path, is_video)
        
        # Salvar resultados
        result_file = RESULTS_DIR / f"{task_id}.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        # Atualizar tarefa com resultados
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["results"] = result
        tasks[task_id]["end_time"] = ""  # Poderia usar datetime.now()
        tasks[task_id]["result_file"] = str(result_file)
        
        # Limpar arquivo temporário
        try:
            os.remove(file_path)
        except:
            pass
        
        logger.info(f"Tarefa {task_id} concluída com sucesso")
        
    except Exception as e:
        # Registrar erro
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)
        tasks[task_id]["end_time"] = ""
        
        logger.error(f"Erro na tarefa {task_id}: {e}")
        
        # Tentar limpar arquivo temporário mesmo em caso de erro
        try:
            os.remove(file_path)
        except:
            pass

if __name__ == "__main__":
    logger.info("Iniciando servidor FastAPI do processador AI")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )