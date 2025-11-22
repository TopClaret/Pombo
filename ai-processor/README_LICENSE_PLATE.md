# Sistema de Reconhecimento de Placas Veiculares

## Visão Geral

Este sistema implementa um reconhecedor completo de placas veiculares brasileiras com suporte para os formatos Mercosul e antigo. O sistema utiliza técnicas avançadas de processamento de imagem, OCR (Optical Character Recognition) e validação para garantir alta precisão na leitura de placas.

## Características Principais

### 1. Pré-processamento Avançado de Imagens

O sistema utiliza múltiplas técnicas de pré-processamento para melhorar a qualidade da imagem antes do OCR:

- **Binarização Adaptativa**: Adapta-se a diferentes condições de iluminação
- **Equalização CLAHE**: Melhora o contraste local
- **Filtragem de Ruído**: Remove ruídos usando filtros bilaterais e medianos
- **Operações Morfológicas**: Fecha buracos e remove ruídos pequenos
- **Múltiplas Estratégias**: Tenta diferentes métodos e seleciona o melhor resultado

### 2. OCR Otimizado

O sistema de OCR utiliza múltiplas estratégias:

- **Múltiplos Modos PSM**: Testa diferentes modos de segmentação de página
- **Whitelist de Caracteres**: Limita reconhecimento apenas a caracteres válidos
- **Correção de Erros**: Corrige erros comuns de OCR baseado em padrões conhecidos
- **Múltiplas Tentativas**: Tenta diferentes combinações de pré-processamento e configurações

### 3. Validação de Formatos Brasileiros

O sistema valida placas de acordo com os padrões brasileiros:

#### Formato Mercosul
- Padrão: `ABC1D23`
- Estrutura: 3 letras + 1 dígito + 1 letra + 2 dígitos
- Exemplos válidos: `ABC1D23`, `XYZ9A45`, `DEF2B78`

#### Formato Antigo
- Padrão: `ABC1234`
- Estrutura: 3 letras + 4 dígitos
- Exemplos válidos: `ABC1234`, `XYZ9876`, `DEF5678`

### 4. Detecção de Placas

O sistema utiliza uma cascata de métodos de detecção:

1. **Ultralytics** (se disponível): Modelo de deep learning mais preciso
2. **Roboflow** (se disponível): API de detecção em nuvem
3. **YOLO** (se disponível): Detecção via modelo ONNX
4. **Contornos Tradicionais**: Detecção baseada em processamento de imagem
5. **MSER**: Detecção de regiões estáveis

### 5. Tratamento de Erros

O sistema implementa tratamento robusto de erros:

- Validação de entrada (arquivos, dimensões, formatos)
- Tratamento de exceções em todos os métodos
- Logging detalhado para debugging
- Fallbacks para métodos alternativos
- Validação de resultados antes de retornar

## Instalação

### Requisitos

- Python 3.8+
- OpenCV 4.8+
- Tesseract OCR
- NumPy
- Pytesseract

### Dependências

```bash
pip install opencv-python numpy pytesseract pillow
```

### Instalação do Tesseract OCR

#### Windows
1. Baixar instalador de: https://github.com/UB-Mannheim/tesseract/wiki
2. Instalar em `C:\Program Files\Tesseract-OCR`
3. Adicionar ao PATH ou configurar variável `TESSERACT_CMD`

#### Linux
```bash
sudo apt-get install tesseract-ocr
```

#### macOS
```bash
brew install tesseract
```

## Uso

### Exemplo Básico

```python
from license_plate_recognition import LicensePlateRecognizer

# Criar instância do reconhecedor
recognizer = LicensePlateRecognizer()

# Processar imagem
results = recognizer.recognize_from_image("placa.jpg")

# Processar resultados
for result in results:
    print(f"Placa: {result['plate_number']}")
    print(f"Tipo: {result['plate_type']}")
    print(f"Confiança: {result['confidence']}")
    print(f"Cor do veículo: {result['vehicle_color']}")
```

### Processamento de Vídeo

```python
# Processar vídeo
results = recognizer.recognize_from_video("video.mp4", frame_interval=30)

for result in results:
    print(f"Frame: {result['frame_number']}")
    print(f"Placa: {result['plate_number']}")
    print(f"Timestamp: {result['timestamp']}s")
```

### Função Helper

```python
from license_plate_recognition import process_media_file

# Processar arquivo (imagem ou vídeo)
result = process_media_file("arquivo.jpg", is_video=False)

print(f"Total de detecções: {result['total_detections']}")
print(f"Veículos únicos: {result['unique_vehicles']}")
```

## Estrutura de Dados de Retorno

### Resultado de Reconhecimento

```python
{
    'plate_number': str,          # Número da placa reconhecido (ex: "ABC1D23")
    'plate_type': str,            # Tipo: "mercosul" ou "antigo"
    'bbox': {                     # Bounding box da placa
        'x': int,
        'y': int,
        'width': int,
        'height': int
    },
    'confidence': float,          # Confiança (0.0 a 1.0)
    'image_path': str,            # Caminho da imagem processada
    'vehicle_color': str,         # Cor detectada do veículo
    'vehicle_color_confidence': float,  # Confiança da cor
    'vehicle_model': str          # Modelo (se disponível)
}
```

## Configuração

### Variáveis de Ambiente

```bash
# Caminho do Tesseract OCR
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

# Modelos de detecção (opcionais)
PLATE_DETECTOR_ONNX_PATH=path/to/model.onnx
ULTRALYTICS_MODEL_PATH=path/to/model.pt
ROBOFLOW_API_KEY=your_api_key
ROBOFLOW_MODEL_ID=your_model_id
ROBOFLOW_API_URL=https://detect.roboflow.com
```

## Testes

Execute os testes unitários:

```bash
python test_license_plate_recognition.py
```

Os testes validam:
- Pré-processamento de imagens
- Limpeza e formatação de texto
- Validação de formatos de placas
- Correção de erros de OCR
- Detecção de placas
- Mesclagem de caixas
- Identificação de veículos repetidos

## Melhorias Implementadas

### Versão 2.0.0

1. **Pré-processamento Melhorado**
   - Múltiplas técnicas de pré-processamento
   - CLAHE para equalização de histograma
   - Filtros adaptativos para diferentes condições

2. **OCR Otimizado**
   - Múltiplas tentativas com diferentes configurações
   - Correção automática de erros comuns
   - Seleção do melhor resultado baseado em confiança

3. **Validação Robusta**
   - Validação estrutural além de regex
   - Identificação automática do tipo de placa
   - Suporte a espaços e hífens

4. **Tratamento de Erros**
   - Validação de entrada em todos os métodos
   - Logging detalhado
   - Fallbacks para métodos alternativos

5. **Testes Unitários**
   - Cobertura completa de funcionalidades
   - Testes de casos extremos
   - Validação de formatos

## Limitações Conhecidas

1. **Qualidade da Imagem**: Imagens muito borradas ou com baixa resolução podem ter precisão reduzida
2. **Ângulo da Placa**: Placas muito inclinadas podem ser difíceis de reconhecer
3. **Iluminação**: Condições de iluminação extremas podem afetar a precisão
4. **Oclusão**: Placas parcialmente cobertas podem não ser reconhecidas

## Troubleshooting

### Erro: "Tesseract not found"
- Verifique se o Tesseract está instalado
- Configure a variável `TESSERACT_CMD` com o caminho correto

### Baixa Precisão
- Verifique a qualidade da imagem de entrada
- Ajuste os parâmetros de pré-processamento
- Use modelos de detecção mais precisos (Ultralytics/YOLO)

### Nenhuma Placa Detectada
- Verifique se a imagem contém uma placa visível
- Tente diferentes métodos de detecção
- Ajuste os parâmetros de detecção de contornos

## Contribuindo

Para melhorar o sistema:

1. Adicione novos métodos de pré-processamento
2. Melhore a correção de erros de OCR
3. Adicione suporte para novos formatos de placas
4. Otimize a performance do processamento

## Licença

Este código faz parte do sistema Pombo.

## Suporte

Para questões e suporte, consulte a documentação principal do projeto.

