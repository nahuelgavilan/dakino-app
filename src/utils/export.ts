import type { Purchase } from '@/types/models';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const exportToCSV = (purchases: Purchase[], filename: string = 'dakino-compras') => {
  // CSV headers
  const headers = [
    'Fecha',
    'Producto',
    'Categoría',
    'Tipo',
    'Cantidad',
    'Precio Unitario',
    'Total',
    'Notas',
  ];

  // Convert purchases to CSV rows
  const rows = purchases.map((purchase) => {
    return [
      format(new Date(purchase.purchase_date), 'dd/MM/yyyy', { locale: es }),
      purchase.product_name,
      purchase.category?.name || 'Sin categoría',
      purchase.unit_type === 'unit' ? 'Unidad' : 'Peso/Granel',
      purchase.unit_type === 'unit'
        ? `${purchase.quantity} unidades`
        : `${purchase.weight} kg`,
      purchase.unit_type === 'unit'
        ? `$${purchase.unit_price?.toFixed(2)}`
        : `$${purchase.price_per_unit?.toFixed(2)}/kg`,
      `$${purchase.total_price.toFixed(2)}`,
      purchase.notes || '',
    ];
  });

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  // Add BOM for Excel compatibility with UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Download file
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (purchases: Purchase[], filename: string = 'dakino-compras') => {
  // Prepare data with clean structure
  const data = purchases.map((purchase) => ({
    fecha: format(new Date(purchase.purchase_date), 'dd/MM/yyyy', { locale: es }),
    producto: purchase.product_name,
    categoria: purchase.category?.name || null,
    tipo: purchase.unit_type,
    cantidad: purchase.unit_type === 'unit' ? purchase.quantity : purchase.weight,
    unidad: purchase.unit_type === 'unit' ? 'unidades' : 'kg',
    precioUnitario: purchase.unit_type === 'unit' ? purchase.unit_price : purchase.price_per_unit,
    precioTotal: purchase.total_price,
    notas: purchase.notes || null,
    fechaCreacion: purchase.created_at,
  }));

  const jsonContent = JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      totalPurchases: purchases.length,
      totalAmount: purchases.reduce((sum, p) => sum + p.total_price, 0),
      purchases: data,
    },
    null,
    2
  );

  const blob = new Blob([jsonContent], { type: 'application/json' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = async (purchases: Purchase[], filename: string = 'dakino-compras') => {
  // For Excel export, we'll use CSV with Excel-compatible formatting
  // In a real app, you might want to use a library like xlsx for better Excel support
  exportToCSV(purchases, filename);
};
