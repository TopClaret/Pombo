import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex; flex-direction: column; gap: 16px; padding: 16px;
`;
const Row = styled.div`
  display: flex; gap: 16px; align-items: center; flex-wrap: wrap;
`;
const VideoBox = styled.div`
  position: relative; width: 640px; height: 480px; background: #111; border-radius: 8px; overflow: hidden;
`;
const VideoEl = styled.video`
  width: 100%; height: 100%; object-fit: cover;
`;
const CanvasEl = styled.canvas`
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
`;
const Button = styled.button`
  padding: 8px 12px; border: none; border-radius: 6px; background: #2e7d32; color: #fff; cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
const Input = styled.input`
  padding: 6px 8px; border: 1px solid #ccc; border-radius: 6px; width: 100px;
`;
const Stat = styled.div`
  padding: 8px 12px; background: #f5f5f5; border-radius: 6px; font-family: monospace;
`;

const Realtime: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [fps, setFps] = useState(0);
  const [objects, setObjects] = useState(0);
  const [confThresh, setConfThresh] = useState(0.25);
  const [nmsThresh, setNmsThresh] = useState(0.45);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    offscreenCanvasRef.current = document.createElement('canvas');
    offscreenCanvasRef.current.width = 640;
    offscreenCanvasRef.current.height = 480;
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setError(`Erro ao acessar câmera: ${e.message || e.toString()}`);
    }
  };

  const loadModel = async () => {
    setError(null);
    try {
      const res = await fetch('http://localhost:8001/yolo/load', { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      setModelLoaded(true);
    } catch (e: any) {
      setError(`Modelo não carregado: ${e.message || e.toString()}`);
      setModelLoaded(false);
    }
  };

  const applyConfig = async () => {
    setError(null);
    try {
      const url = `http://localhost:8001/config/detector?conf_thresh=${confThresh}&nms_thresh=${nmsThresh}`;
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
    } catch (e: any) {
      setError(`Falha ao aplicar configuração: ${e.message || e.toString()}`);
    }
  };

  const drawDetections = (ctx: CanvasRenderingContext2D, detections: any[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.font = '12px monospace';
    detections.forEach(d => {
      const { x, y, width, height } = d.bbox;
      ctx.strokeRect(x, y, width, height);
      const label = `${d.class_name} ${(d.confidence * 100).toFixed(1)}%`;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x, y - 16, ctx.measureText(label).width + 8, 16);
      ctx.fillStyle = '#00ff88';
      ctx.fillText(label, x + 4, y - 4);
    });
  };

  const loop = async () => {
    if (!running) return;
    const t0 = performance.now();
    try {
      if (!videoRef.current || !canvasRef.current || !offscreenCanvasRef.current) return;
      const v = videoRef.current;
      const off = offscreenCanvasRef.current;
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.drawImage(v, 0, 0, off.width, off.height);
      const blob: Blob = await new Promise(resolve => off.toBlob(b => resolve(b as Blob), 'image/jpeg', 0.8));
      const form = new FormData();
      form.append('file', blob, 'frame.jpg');
      const res = await fetch('http://localhost:8001/detect/frame', { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFps(data.fps || 0);
      setObjects((data.detections || []).length);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) drawDetections(ctx, data.detections || []);
    } catch (e: any) {
      setError(`Erro na detecção: ${e.message || e.toString()}`);
    } finally {
      const dt = performance.now() - t0;
      const delay = Math.max(0, 30 - dt); // ~33ms ~ 30 FPS target
      setTimeout(loop, delay);
    }
  };

  const start = async () => {
    await startCamera();
    await loadModel();
    await applyConfig();
    setRunning(true);
    loop();
  };

  const stop = () => {
    setRunning(false);
    const stream = videoRef.current?.srcObject as MediaStream | undefined;
    stream?.getTracks().forEach(t => t.stop());
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <Container>
      <h2>Detecção em Tempo Real (YOLO ONNX)</h2>
      <Row>
        <Button onClick={start} disabled={running}>Iniciar</Button>
        <Button onClick={stop} disabled={!running} style={{ background: '#c62828' }}>Parar</Button>
        <label>Confiança: <Input type="number" step="0.01" value={confThresh} onChange={e => setConfThresh(parseFloat(e.target.value))} /></label>
        <label>NMS: <Input type="number" step="0.01" value={nmsThresh} onChange={e => setNmsThresh(parseFloat(e.target.value))} /></label>
        <Button onClick={applyConfig}>Aplicar</Button>
      </Row>
      <Row>
        <VideoBox>
          <VideoEl ref={videoRef} muted playsInline />
          <CanvasEl ref={canvasRef} width={640} height={480} />
        </VideoBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Stat>FPS: {fps.toFixed(1)}</Stat>
          <Stat>Objetos: {objects}</Stat>
          <Stat>Modelo: {modelLoaded ? 'carregado' : 'não carregado'}</Stat>
          {error && <Stat style={{ background: '#ffebee', color: '#c62828' }}>Erro: {error}</Stat>}
        </div>
      </Row>
    </Container>
  );
};

export default Realtime;