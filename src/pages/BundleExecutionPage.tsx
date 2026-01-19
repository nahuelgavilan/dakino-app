import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bundleService } from '@/services/bundle.service';
import { purchaseService } from '@/services/purchase.service';
import { inventoryService } from '@/services/inventory.service';
import { productService } from '@/services/product.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { DatePicker } from '@/components/common/DatePicker';
import { Button } from '@/components/common/Button';
import type { Bundle, BundleItem, StorageLocation } from '@/types/models';
import {
  X,
  Check,
  Archive,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
} from 'lucide-react';

interface ExecutionItem extends BundleItem {
  selected: boolean;
  adjustedQuantity: string;
  adjustedPrice: string;
}

export const BundleExecutionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [items, setItems] = useState<ExecutionItem[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Options
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [addToInventory, setAddToInventory] = useState(true);
  const [locationId, setLocationId] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [bundleData, locationsData] = await Promise.all([
        bundleService.getBundleById(id),
        inventoryService.getStorageLocations(),
      ]);

      if (!bundleData) {
        showError('Lista no encontrada');
        navigate('/');
        return;
      }

      setBundle(bundleData);
      setLocations(locationsData);

      // Set default location
      if (locationsData.length > 0) {
        setLocationId(locationsData[0].id);
      }

      // Convert bundle items to execution items
      const execItems: ExecutionItem[] = (bundleData.items || []).map((item) => ({
        ...item,
        selected: true,
        adjustedQuantity: item.unit_type === 'unit'
          ? (item.quantity || 1).toString()
          : (item.weight || 1).toString(),
        adjustedPrice: (item.estimated_price || 0).toString(),
      }));
      setItems(execItems);
    } catch (err) {
      console.error('Error loading bundle:', err);
      showError('Error al cargar la lista');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const current = parseFloat(item.adjustedQuantity) || 0;
        const newValue = Math.max(0, current + delta);
        return { ...item, adjustedQuantity: newValue.toString() };
      })
    );
  };

  const updateItemPrice = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, adjustedPrice: value } : item
      )
    );
  };

  const calculateTotal = (): number => {
    return items
      .filter((item) => item.selected)
      .reduce((sum, item) => {
        const qty = parseFloat(item.adjustedQuantity) || 0;
        const price = parseFloat(item.adjustedPrice) || 0;
        return sum + qty * price;
      }, 0);
  };

  const selectedCount = items.filter((i) => i.selected).length;

  const handleSubmit = async () => {
    if (!user || !bundle) return;

    const selectedItems = items.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      showError('Selecciona al menos un producto');
      return;
    }

    setSubmitting(true);

    try {
      // Create purchases and inventory items for each selected item
      for (const item of selectedItems) {
        const qty = parseFloat(item.adjustedQuantity) || 0;
        const price = parseFloat(item.adjustedPrice) || 0;
        const totalPrice = qty * price;

        // Create purchase
        const purchase = await purchaseService.createPurchase({
          user_id: user.id,
          product_id: item.product_id,
          product_name: item.product_name,
          category_id: item.category_id,
          store_id: item.store_id,
          unit_type: item.unit_type,
          quantity: item.unit_type === 'unit' ? Math.round(qty) : null,
          weight: item.unit_type === 'weight' ? qty : null,
          unit_price: item.unit_type === 'unit' ? price : null,
          price_per_unit: item.unit_type === 'weight' ? price : null,
          total_price: totalPrice,
          purchase_date: purchaseDate,
          notes: item.notes,
          image_url: null,
        });

        // Update product usage
        if (item.product_id) {
          await productService.updateProduct(item.product_id, {
            usage_count: 1, // Will be incremented by RPC in real app
            last_used_at: new Date().toISOString(),
          });
        }

        // Add to inventory if enabled
        if (addToInventory) {
          const unit = item.unit_type === 'unit' ? 'unidades' : 'kg';

          await inventoryService.addOrMergeInventoryItem({
            user_id: user.id,
            product_id: item.product_id,
            product_name: item.product_name,
            category_id: item.category_id,
            purchase_id: purchase.id,
            initial_quantity: qty,
            current_quantity: qty,
            unit: unit,
            location_id: locationId || null,
            minimum_quantity: 1,
            expiration_date: expirationDate || null,
            opened_at: null,
            notes: null,
            image_url: null,
          });
        }
      }

      // Update bundle usage count
      await bundleService.updateBundle(bundle.id, {
        usage_count: (bundle.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      });

      success(
        addToInventory
          ? `✨ ${selectedCount} productos comprados y añadidos al inventario`
          : `✨ ${selectedCount} productos registrados`
      );
      navigate('/');
    } catch (err: any) {
      console.error('Error executing bundle:', err);
      showError(err.message || 'Error al procesar la compra');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bundle) {
    return null;
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-40">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: bundle.color + '20' }}
              >
                {bundle.icon}
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                  {bundle.name}
                </h1>
                <p className="text-sm text-neutral-500">
                  {selectedCount} de {items.length} productos
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X size={24} className="text-neutral-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Items List */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm transition-all ${
                !item.selected ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleItem(index)}
                  className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all mt-1 ${
                    item.selected
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600'
                  }`}
                >
                  {item.selected && <Check size={14} strokeWidth={3} />}
                </button>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {item.unit_type === 'unit' ? 'Por unidad' : 'Por peso'}
                  </p>

                  {item.selected && (
                    <div className="mt-3 flex items-center gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                        <button
                          onClick={() => updateItemQuantity(index, -1)}
                          className="w-8 h-8 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="text"
                          value={item.adjustedQuantity}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === index ? { ...it, adjustedQuantity: e.target.value } : it
                              )
                            )
                          }
                          className="w-12 h-8 bg-transparent text-center font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
                        />
                        <button
                          onClick={() => updateItemQuantity(index, 1)}
                          className="w-8 h-8 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Price Input */}
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.adjustedPrice}
                          onChange={(e) => updateItemPrice(index, e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">
                          $
                          {(
                            (parseFloat(item.adjustedQuantity) || 0) *
                            (parseFloat(item.adjustedPrice) || 0)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Date */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm">
          <DatePicker
            label="Fecha de compra"
            value={purchaseDate}
            onChange={setPurchaseDate}
            maxDate={new Date().toISOString().split('T')[0]}
            placeholder="Seleccionar fecha"
          />
        </div>

        {/* Inventory Options */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setAddToInventory(!addToInventory)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  addToInventory
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-neutral-100 dark:bg-neutral-700'
                }`}
              >
                <Archive size={20} className={addToInventory ? 'text-amber-600' : 'text-neutral-400'} />
              </div>
              <div className="text-left">
                <p className="font-bold text-neutral-900 dark:text-neutral-100">
                  Añadir al inventario
                </p>
                <p className="text-xs text-neutral-500">Guardar en tu despensa</p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full transition-colors relative ${
                addToInventory ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  addToInventory ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </button>

          {addToInventory && (
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 space-y-4">
              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-2 flex items-center gap-1">
                  <MapPin size={14} />
                  Ubicación
                </label>
                <div className="flex gap-2 flex-wrap">
                  {locations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => setLocationId(location.id)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
                        locationId === location.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span>{location.icon}</span>
                      {location.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration Date */}
              <DatePicker
                label="Fecha de caducidad (opcional)"
                value={expirationDate}
                onChange={setExpirationDate}
                minDate={new Date().toISOString().split('T')[0]}
                placeholder="Seleccionar caducidad"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-4 safe-area-inset-bottom">
        {/* Total */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-neutral-500">Total ({selectedCount} productos)</p>
            <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
              ${total.toFixed(2)}
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-pink-500 rounded-xl flex items-center justify-center">
            <ShoppingCart size={24} className="text-white" />
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          loading={submitting}
          onClick={handleSubmit}
          disabled={selectedCount === 0}
          className="shadow-xl"
        >
          <Check size={20} className="mr-2" />
          Confirmar Compra
        </Button>
      </div>
    </div>
  );
};
