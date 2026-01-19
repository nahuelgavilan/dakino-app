import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  Check,
  AlertCircle,
  ChevronRight,
  Trash2,
  ArrowLeft,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ocrService, type MatchedOCRItem, type ProcessedOCRResult } from '@/services/ocr.service';
import { productService } from '@/services/product.service';
import { storeService } from '@/services/store.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/router/routes';
import type { Product, Store } from '@/types/models';

type ScanState = 'idle' | 'capturing' | 'preview' | 'processing' | 'results' | 'error';

export const TicketScannerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { error: showError } = useToast();

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<ProcessedOCRResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load products and stores for matching
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [productsData, storesData] = await Promise.all([
        productService.getProducts(user.id),
        storeService.getStores(user.id)
      ]);
      setProducts(productsData);
      setStores(storesData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setScanState('capturing');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      showError('No se pudo acceder a la cámara');
      setScanState('idle');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setImagePreview(dataUrl);
    setImageBase64(dataUrl.split(',')[1]);

    stopCamera();
    setScanState('preview');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona una imagen');
      return;
    }

    try {
      const base64 = await ocrService.imageToBase64(file);
      setImageBase64(base64);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);

      setScanState('preview');
    } catch (err) {
      showError('Error al procesar la imagen');
    }
  };

  const processImage = async () => {
    if (!imageBase64) return;

    setScanState('processing');
    setErrorMessage('');

    try {
      const result = await ocrService.scanTicket(imageBase64);
      const processedResult = ocrService.processOCRResult(result, products);

      setOcrResult(processedResult);
      // Select all items by default
      setSelectedItems(new Set(processedResult.items.map((_, i) => i)));
      setScanState('results');
    } catch (err) {
      console.error('OCR error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error al analizar el ticket');
      setScanState('error');
    }
  };

  const toggleItemSelection = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const removeItem = (index: number) => {
    if (!ocrResult) return;
    const newItems = ocrResult.items.filter((_, i) => i !== index);
    setOcrResult({ ...ocrResult, items: newItems });

    // Update selection indices
    const newSelected = new Set<number>();
    selectedItems.forEach(i => {
      if (i < index) newSelected.add(i);
      else if (i > index) newSelected.add(i - 1);
    });
    setSelectedItems(newSelected);
  };

  const continueToForm = () => {
    if (!ocrResult) return;

    const selectedItemsData = ocrResult.items
      .filter((_, i) => selectedItems.has(i))
      .map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total,
        matchedProduct: item.matchedProduct
      }));

    // Find matching store
    const matchedStore = ocrResult.store_name
      ? stores.find(s =>
          s.name.toLowerCase().includes(ocrResult.store_name!.toLowerCase()) ||
          ocrResult.store_name!.toLowerCase().includes(s.name.toLowerCase())
        )
      : null;

    navigate(ROUTES.APP.PURCHASES_NEW, {
      state: {
        ocrData: {
          items: selectedItemsData,
          purchaseDate: ocrResult.date,
          storeName: ocrResult.store_name,
          storeId: matchedStore?.id,
          total: ocrResult.total
        }
      }
    });
  };

  const reset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setOcrResult(null);
    setSelectedItems(new Set());
    setErrorMessage('');
    setScanState('idle');
  };

  const getConfidenceColor = (confidence: MatchedOCRItem['confidence']) => {
    switch (confidence) {
      case 'exact': return 'text-green-600 bg-green-50';
      case 'partial': return 'text-amber-600 bg-amber-50';
      case 'none': return 'text-neutral-500 bg-neutral-50';
    }
  };

  const getConfidenceLabel = (confidence: MatchedOCRItem['confidence']) => {
    switch (confidence) {
      case 'exact': return 'Encontrado';
      case 'partial': return 'Similar';
      case 'none': return 'Nuevo';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/20 to-primary-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white pt-12 pb-6">
        <div className="max-w-lg mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Sparkles size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black">Escanear Ticket</h1>
              <p className="text-purple-100 text-sm">Usa IA para extraer tus compras</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Idle State - Choose Input Method */}
        {scanState === 'idle' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                Elige cómo capturar el ticket
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 hover:shadow-lg transition-all active:scale-95"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Camera size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-neutral-900 dark:text-white">Cámara</p>
                    <p className="text-xs text-neutral-500">Tomar foto</p>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-lg transition-all active:scale-95"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <ImageIcon size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-neutral-900 dark:text-white">Galería</p>
                    <p className="text-xs text-neutral-500">Subir imagen</p>
                  </div>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Consejo:</strong> Asegúrate de que el ticket esté bien iluminado y sea legible para mejores resultados.
              </p>
            </div>
          </div>
        )}

        {/* Camera Capture */}
        {scanState === 'capturing' && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-3xl overflow-hidden aspect-[3/4]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-white/30 rounded-3xl pointer-events-none" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { stopCamera(); setScanState('idle'); }}
                className="flex-1 py-4 bg-neutral-200 dark:bg-neutral-700 rounded-2xl font-bold text-neutral-700 dark:text-neutral-300"
              >
                Cancelar
              </button>
              <button
                onClick={capturePhoto}
                className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-white shadow-lg"
              >
                Capturar
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {scanState === 'preview' && imagePreview && (
          <div className="space-y-4">
            <div className="relative bg-neutral-100 dark:bg-neutral-800 rounded-3xl overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-[60vh] object-contain"
              />
              <button
                onClick={reset}
                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-4 bg-neutral-200 dark:bg-neutral-700 rounded-2xl font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                Otra foto
              </button>
              <button
                onClick={processImage}
                className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                Analizar
              </button>
            </div>
          </div>
        )}

        {/* Processing */}
        {scanState === 'processing' && (
          <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
              <Loader2 size={40} className="text-violet-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              Analizando ticket...
            </h2>
            <p className="text-neutral-500">
              Extrayendo productos y precios con IA
            </p>
          </div>
        )}

        {/* Error */}
        {scanState === 'error' && (
          <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle size={40} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              Error al analizar
            </h2>
            <p className="text-neutral-500 mb-6">
              {errorMessage || 'No se pudo procesar el ticket. Intenta con otra imagen.'}
            </p>
            <button
              onClick={reset}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-white"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Results */}
        {scanState === 'results' && ocrResult && (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Resultados del Escaneo
                </h2>
                <button
                  onClick={reset}
                  className="text-sm text-violet-600 font-medium hover:text-violet-700"
                >
                  Escanear otro
                </button>
              </div>

              {/* Store & Date */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {ocrResult.store_name && (
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl">
                    <p className="text-xs text-neutral-500 mb-1">Tienda</p>
                    <p className="font-bold text-neutral-900 dark:text-white truncate">
                      {ocrResult.store_name}
                    </p>
                  </div>
                )}
                {ocrResult.date && (
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl">
                    <p className="text-xs text-neutral-500 mb-1">Fecha</p>
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {ocrResult.date}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl">
                <div>
                  <p className="text-xs text-neutral-500">Productos encontrados</p>
                  <p className="text-2xl font-black text-violet-600">
                    {ocrResult.items.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">Total del ticket</p>
                  <p className="text-2xl font-black text-neutral-900 dark:text-white">
                    ${ocrResult.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neutral-900 dark:text-white">
                    Productos ({selectedItems.size} seleccionados)
                  </h3>
                  <button
                    onClick={() => {
                      if (selectedItems.size === ocrResult.items.length) {
                        setSelectedItems(new Set());
                      } else {
                        setSelectedItems(new Set(ocrResult.items.map((_, i) => i)));
                      }
                    }}
                    className="text-sm text-violet-600 font-medium"
                  >
                    {selectedItems.size === ocrResult.items.length ? 'Deseleccionar' : 'Seleccionar'} todos
                  </button>
                </div>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-700 max-h-[40vh] overflow-y-auto">
                {ocrResult.items.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 transition-colors ${
                      selectedItems.has(index)
                        ? 'bg-violet-50/50 dark:bg-violet-900/10'
                        : 'bg-white dark:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleItemSelection(index)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          selectedItems.has(index)
                            ? 'bg-violet-500 border-violet-500 text-white'
                            : 'border-neutral-300 dark:border-neutral-600'
                        }`}
                      >
                        {selectedItems.has(index) && <Check size={14} />}
                      </button>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-neutral-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getConfidenceColor(item.confidence)}`}>
                                {getConfidenceLabel(item.confidence)}
                              </span>
                              {item.matchedProduct && (
                                <span className="text-xs text-neutral-500 truncate">
                                  → {item.matchedProduct.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-neutral-500">
                            {item.quantity} × ${item.unit_price.toFixed(2)}
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white">
                            = ${item.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={continueToForm}
              disabled={selectedItems.size === 0}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar con {selectedItems.size} productos
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
