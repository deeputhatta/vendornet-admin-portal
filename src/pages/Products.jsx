import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';

export default function Products() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingVariant, setEditingVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newProduct, setNewProduct] = useState({
    category_id: '', generic_name: '', description: '',
    hsn_code: '', search_keywords: '', synonyms: ''
  });

  const [newVariant, setNewVariant] = useState({
    brand_name: '', manufacturer: '',
    grade: '', weight_kg: '', pack_type: 'bag'
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        productsAPI.getCategories(),
        productsAPI.getProducts()
      ]);
      setCategories(catRes.data.categories);
      setProducts(prodRes.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (product) => {
    setSelectedProduct(product);
    setEditingProduct(null);
    setEditingVariant(null);
    try {
      const res = await productsAPI.getVariants(product.product_id);
      setVariants(res.data.variants);
    } catch (err) {
      console.error(err);
    }
  };

  const createProduct = async () => {
    try {
      await productsAPI.createProduct({
        ...newProduct,
        search_keywords: newProduct.search_keywords.split(',').map(k => k.trim()),
        synonyms: newProduct.synonyms.split(',').map(s => s.trim()),
        use_cases: []
      });
      setShowAddProduct(false);
      setNewProduct({ category_id: '', generic_name: '', description: '', hsn_code: '', search_keywords: '', synonyms: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create product');
    }
  };

  const startEdit = (product) => {
    setEditingProduct({
      ...product,
      search_keywords: (product.search_keywords || []).join(', '),
      synonyms: (product.synonyms || []).join(', ')
    });
    setSelectedProduct(null);
  };

  const saveEdit = async () => {
    try {
      await productsAPI.updateProduct(editingProduct.product_id, {
        generic_name: editingProduct.generic_name,
        description: editingProduct.description,
        hsn_code: editingProduct.hsn_code,
        search_keywords: editingProduct.search_keywords.split(',').map(k => k.trim()),
        synonyms: editingProduct.synonyms.split(',').map(s => s.trim()),
        category_id: editingProduct.category_id
      });
      setEditingProduct(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update product');
    }
  };

  const startEditVariant = (variant) => {
    setEditingVariant({
      ...variant,
      grade: variant.attributes?.grade || '',
      weight_kg: variant.attributes?.weight_kg || '',
      pack_type: variant.attributes?.pack_type || 'bag'
    });
  };

  const saveVariantEdit = async () => {
    try {
      await productsAPI.updateVariant(editingVariant.variant_id, {
        brand_name: editingVariant.brand_name,
        manufacturer: editingVariant.manufacturer,
        attributes: {
          grade: editingVariant.grade,
          weight_kg: parseFloat(editingVariant.weight_kg),
          pack_type: editingVariant.pack_type
        }
      });
      setEditingVariant(null);
      loadVariants(selectedProduct);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update variant');
    }
  };

  const createVariant = async () => {
    try {
      await productsAPI.createVariant(selectedProduct.product_id, {
        brand_name: newVariant.brand_name,
        manufacturer: newVariant.manufacturer,
        attributes: {
          grade: newVariant.grade,
          weight_kg: parseFloat(newVariant.weight_kg),
          pack_type: newVariant.pack_type
        }
      });
      setShowAddVariant(false);
      setNewVariant({ brand_name: '', manufacturer: '', grade: '', weight_kg: '', pack_type: 'bag' });
      loadVariants(selectedProduct);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create variant');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Products</h2>
        <button style={styles.btn} onClick={() => setShowAddProduct(!showAddProduct)}>
          {showAddProduct ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showAddProduct && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Product</h3>
          <select style={styles.input} value={newProduct.category_id}
            onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}>
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.name}</option>
            ))}
          </select>
          <input style={styles.input} placeholder="Generic name (e.g. Cement)"
            value={newProduct.generic_name}
            onChange={e => setNewProduct({ ...newProduct, generic_name: e.target.value })} />
          <input style={styles.input} placeholder="HSN Code"
            value={newProduct.hsn_code}
            onChange={e => setNewProduct({ ...newProduct, hsn_code: e.target.value })} />
          <input style={styles.input} placeholder="Search keywords (comma separated)"
            value={newProduct.search_keywords}
            onChange={e => setNewProduct({ ...newProduct, search_keywords: e.target.value })} />
          <input style={styles.input} placeholder="Tamil/Telugu synonyms (comma separated)"
            value={newProduct.synonyms}
            onChange={e => setNewProduct({ ...newProduct, synonyms: e.target.value })} />
          <textarea style={{ ...styles.input, height: 80 }} placeholder="Description"
            value={newProduct.description}
            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
          <div style={styles.formActions}>
            <button style={styles.btn} onClick={createProduct}>Save Product</button>
            <button style={styles.cancelBtn} onClick={() => setShowAddProduct(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        <div style={styles.productList}>
          <h3 style={styles.sectionTitle}>All Products ({products.length})</h3>
          {products.map(p => (
            <div
              key={p.product_id}
              style={{
                ...styles.productItem,
                background: selectedProduct?.product_id === p.product_id ? '#E6F1FB' :
                  editingProduct?.product_id === p.product_id ? '#FAEEDA' : '#fff'
              }}
              onClick={() => loadVariants(p)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={styles.productName}>{p.generic_name}</p>
                  <p style={styles.productCategory}>{p.category_name} · HSN {p.hsn_code}</p>
                </div>
                <button
                  style={styles.editBtn}
                  onClick={e => { e.stopPropagation(); startEdit(p); }}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          {editingProduct && (
            <div style={styles.formCard}>
              <h3 style={styles.formTitle}>Edit — {editingProduct.generic_name}</h3>
              <select style={styles.input} value={editingProduct.category_id}
                onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
              <input style={styles.input} placeholder="Generic name"
                value={editingProduct.generic_name}
                onChange={e => setEditingProduct({ ...editingProduct, generic_name: e.target.value })} />
              <input style={styles.input} placeholder="HSN Code"
                value={editingProduct.hsn_code || ''}
                onChange={e => setEditingProduct({ ...editingProduct, hsn_code: e.target.value })} />
              <input style={styles.input} placeholder="Search keywords (comma separated)"
                value={editingProduct.search_keywords}
                onChange={e => setEditingProduct({ ...editingProduct, search_keywords: e.target.value })} />
              <input style={styles.input} placeholder="Tamil/Telugu synonyms"
                value={editingProduct.synonyms}
                onChange={e => setEditingProduct({ ...editingProduct, synonyms: e.target.value })} />
              <textarea style={{ ...styles.input, height: 80 }} placeholder="Description"
                value={editingProduct.description || ''}
                onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
              <div style={styles.formActions}>
                <button style={styles.btn} onClick={saveEdit}>Save Changes</button>
                <button style={styles.cancelBtn} onClick={() => setEditingProduct(null)}>Cancel</button>
              </div>
            </div>
          )}

          {selectedProduct && !editingProduct && (
            <div style={styles.variantList}>
              <div style={styles.variantHeader}>
                <h3 style={styles.sectionTitle}>{selectedProduct.generic_name} — Variants</h3>
                <button style={styles.btn} onClick={() => setShowAddVariant(!showAddVariant)}>
                  {showAddVariant ? 'Cancel' : '+ Add Variant'}
                </button>
              </div>

              {showAddVariant && (
                <div style={styles.formCard}>
                  <input style={styles.input} placeholder="Brand name"
                    value={newVariant.brand_name}
                    onChange={e => setNewVariant({ ...newVariant, brand_name: e.target.value })} />
                  <input style={styles.input} placeholder="Manufacturer"
                    value={newVariant.manufacturer}
                    onChange={e => setNewVariant({ ...newVariant, manufacturer: e.target.value })} />
                  <input style={styles.input} placeholder="Grade (e.g. OPC 53)"
                    value={newVariant.grade}
                    onChange={e => setNewVariant({ ...newVariant, grade: e.target.value })} />
                  <input style={styles.input} placeholder="Weight (kg)" type="number"
                    value={newVariant.weight_kg}
                    onChange={e => setNewVariant({ ...newVariant, weight_kg: e.target.value })} />
                  <select style={styles.input} value={newVariant.pack_type}
                    onChange={e => setNewVariant({ ...newVariant, pack_type: e.target.value })}>
                    <option value="bag">Bag</option>
                    <option value="bundle">Bundle</option>
                    <option value="piece">Piece</option>
                    <option value="litre">Litre</option>
                    <option value="kg">KG</option>
                  </select>
                  <div style={styles.formActions}>
                    <button style={styles.btn} onClick={createVariant}>Save Variant</button>
                    <button style={styles.cancelBtn} onClick={() => setShowAddVariant(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {editingVariant && (
                <div style={{ ...styles.formCard, borderLeft: '3px solid #185FA5' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#185FA5' }}>Edit Variant</h4>
                  <input style={styles.input} placeholder="Brand name"
                    value={editingVariant.brand_name}
                    onChange={e => setEditingVariant({ ...editingVariant, brand_name: e.target.value })} />
                  <input style={styles.input} placeholder="Manufacturer"
                    value={editingVariant.manufacturer || ''}
                    onChange={e => setEditingVariant({ ...editingVariant, manufacturer: e.target.value })} />
                  <input style={styles.input} placeholder="Grade"
                    value={editingVariant.grade}
                    onChange={e => setEditingVariant({ ...editingVariant, grade: e.target.value })} />
                  <input style={styles.input} placeholder="Weight (kg)" type="number"
                    value={editingVariant.weight_kg}
                    onChange={e => setEditingVariant({ ...editingVariant, weight_kg: e.target.value })} />
                  <select style={styles.input} value={editingVariant.pack_type}
                    onChange={e => setEditingVariant({ ...editingVariant, pack_type: e.target.value })}>
                    <option value="bag">Bag</option>
                    <option value="bundle">Bundle</option>
                    <option value="piece">Piece</option>
                    <option value="litre">Litre</option>
                    <option value="kg">KG</option>
                  </select>
                  <div style={styles.formActions}>
                    <button style={styles.btn} onClick={saveVariantEdit}>Save Changes</button>
                    <button style={styles.cancelBtn} onClick={() => setEditingVariant(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {variants.map(v => (
                <div key={v.variant_id} style={styles.variantItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={styles.variantBrand}>{v.brand_name}</p>
                      <p style={styles.variantAttr}>
                        {Object.entries(v.attributes || {}).map(([k, val]) =>
                          `${k}: ${val}`).join(' · ')}
                      </p>
                      <p style={styles.variantMfg}>{v.manufacturer}</p>
                    </div>
                    <button style={styles.editBtn} onClick={() => startEditVariant(v)}>
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 600, color: '#333', margin: 0 },
  btn: { background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  editBtn: { background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600, flexShrink: 0 },
  cancelBtn: { background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer' },
  formCard: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  formTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 16px' },
  formActions: { display: 'flex', gap: 8, marginTop: 12 },
  input: { display: 'block', width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 },
  productList: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', alignSelf: 'start' },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#333', margin: '0 0 12px' },
  productItem: { padding: 12, borderRadius: 8, cursor: 'pointer', marginBottom: 4, transition: 'background 0.15s' },
  productName: { fontSize: 14, fontWeight: 500, color: '#333', margin: '0 0 2px' },
  productCategory: { fontSize: 11, color: '#888', margin: 0 },
  variantList: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  variantHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  variantItem: { padding: 12, borderRadius: 8, background: '#f9f9f9', marginBottom: 8 },
  variantBrand: { fontSize: 14, fontWeight: 600, color: '#185FA5', margin: '0 0 4px' },
  variantAttr: { fontSize: 12, color: '#666', margin: '0 0 2px' },
  variantMfg: { fontSize: 11, color: '#999', margin: 0 }
};