# Modelos Pré-treinados Disponíveis

## Resumo

Este documento lista todos os modelos pré-treinados disponíveis para download e uso no sistema de reconhecimento de placas.

## Como Baixar Modelos

```bash
# Baixar todos os modelos disponíveis
python download_pretrained_models.py --all

# Baixar um modelo específico
python download_pretrained_models.py yolov8_license_plate

# Forçar download (mesmo se já existir)
python download_pretrained_models.py yolov8_license_plate --force
```

## Modelos Disponíveis

### 1. YOLOv8 License Plate Detector
- **Chave**: `yolov8_license_plate`
- **Arquivo**: `license_plate_detector.pt`
- **Descrição**: Modelo YOLOv8 pré-treinado especificamente para detecção de placas
- **Fonte**: GitHub - Muhammad-Zeerak-Khan
- **Tipo**: Detecção de placas
- **Recomendado**: ✅ Sim (específico para placas)

### 2. YOLOv8 Nano (COCO)
- **Chave**: `yolov8n`
- **Arquivo**: `yolov8n.pt`
- **Descrição**: Modelo YOLOv8 Nano pré-treinado no COCO (pode detectar veículos)
- **Fonte**: Ultralytics
- **Tipo**: Detecção geral (inclui veículos)
- **Tamanho**: ~6MB
- **Velocidade**: Muito rápida
- **Precisão**: Boa

### 3. YOLOv8 Small (COCO)
- **Chave**: `yolov8s`
- **Arquivo**: `yolov8s.pt`
- **Descrição**: Modelo YOLOv8 Small pré-treinado no COCO
- **Fonte**: Ultralytics
- **Tipo**: Detecção geral
- **Tamanho**: ~22MB
- **Velocidade**: Rápida
- **Precisão**: Muito boa

### 4. YOLOv8 Medium (COCO)
- **Chave**: `yolov8m`
- **Arquivo**: `yolov8m.pt`
- **Descrição**: Modelo YOLOv8 Medium pré-treinado no COCO
- **Fonte**: Ultralytics
- **Tipo**: Detecção geral
- **Tamanho**: ~52MB
- **Velocidade**: Média
- **Precisão**: Excelente

### 5. YOLOv8 Large (COCO)
- **Chave**: `yolov8l`
- **Arquivo**: `yolov8l.pt`
- **Descrição**: Modelo YOLOv8 Large pré-treinado no COCO
- **Fonte**: Ultralytics
- **Tipo**: Detecção geral
- **Tamanho**: ~87MB
- **Velocidade**: Lenta
- **Precisão**: Muito excelente

### 6. YOLOv8 XLarge (COCO)
- **Chave**: `yolov8x`
- **Arquivo**: `yolov8x.pt`
- **Descrição**: Modelo YOLOv8 XLarge pré-treinado no COCO
- **Fonte**: Ultralytics
- **Tipo**: Detecção geral
- **Tamanho**: ~136MB
- **Velocidade**: Muito lenta
- **Precisão**: Máxima

## Comparação de Modelos

| Modelo | Tamanho | Velocidade | Precisão | Uso Recomendado |
|--------|---------|------------|----------|-----------------|
| license_plate_detector.pt | ~50MB | Média | Excelente | ✅ Detecção de placas |
| yolov8n.pt | ~6MB | Muito rápida | Boa | Detecção geral rápida |
| yolov8s.pt | ~22MB | Rápida | Muito boa | Detecção geral balanceada |
| yolov8m.pt | ~52MB | Média | Excelente | Detecção geral precisa |
| yolov8l.pt | ~87MB | Lenta | Muito excelente | Detecção geral muito precisa |
| yolov8x.pt | ~136MB | Muito lenta | Máxima | Detecção geral máxima precisão |

## Como Usar

### Configuração via Variável de Ambiente

```bash
# Windows PowerShell
$env:ULTRALYTICS_MODEL_PATH="C:\Users\cpd.44\Desktop\Pombo\ai-processor\models\license_plate_detector.pt"

# Windows CMD
set ULTRALYTICS_MODEL_PATH=C:\Users\cpd.44\Desktop\Pombo\ai-processor\models\license_plate_detector.pt

# Linux/Mac
export ULTRALYTICS_MODEL_PATH=./models/license_plate_detector.pt
```

### Uso no Código

```python
from license_plate_recognition import LicensePlateRecognizer

# O modelo será carregado automaticamente se ULTRALYTICS_MODEL_PATH estiver configurado
recognizer = LicensePlateRecognizer()

# Ou configurar manualmente
import os
os.environ['ULTRALYTICS_MODEL_PATH'] = './models/license_plate_detector.pt'
recognizer = LicensePlateRecognizer()
```

## Comparar Modelos

Para comparar a performance de diferentes modelos:

```bash
python integrate_models.py "C:\Users\cpd.44\Pictures\Carros"
```

Isso testará todos os modelos disponíveis e gerará um relatório comparativo.

## Recomendações

1. **Para detecção de placas**: Use `license_plate_detector.pt` (específico para placas)
2. **Para detecção de veículos primeiro**: Use `yolov8n.pt` ou `yolov8s.pt` (mais rápidos)
3. **Para máxima precisão**: Use `yolov8m.pt` ou `yolov8l.pt` (mais precisos, mas mais lentos)
4. **Para sistemas com recursos limitados**: Use `yolov8n.pt` (menor tamanho)

## Estrutura de Arquivos

```
ai-processor/
├── models/
│   ├── license_plate_detector.pt
│   ├── yolov8n.pt
│   ├── yolov8s.pt
│   ├── yolov8m.pt
│   ├── yolov8l.pt
│   ├── yolov8x.pt
│   └── models_config.json
├── download_pretrained_models.py
└── integrate_models.py
```

## Notas

- Os modelos YOLOv8 do COCO podem detectar veículos, mas não são específicos para placas
- O modelo `license_plate_detector.pt` é o mais recomendado para detecção direta de placas
- Modelos maiores geralmente têm melhor precisão, mas são mais lentos
- Todos os modelos são compatíveis com Ultralytics YOLO

