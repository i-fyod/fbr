import { useEffect, useState } from "react";
import { api } from "../../api";
import ProductModal from "../../components/ProductModal";
import ProductsList from "../../components/ProductsList";
import "./ProductsPage.scss";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert("Ошибка загрузки товаров");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setModalMode("edit");
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Удалить товар?");
    if (!ok) return;

    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert("Ошибка удаления товара");
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === "create") {
        const created = await api.createProduct(payload);
        setProducts((prev) => [...prev, created]);
      } else {
        const updated = await api.updateProduct(payload.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
      closeModal();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      const msg = err?.response?.data?.error;
      alert(msg ? `Ошибка: ${msg}` : "Ошибка сохранения товара");
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">Mini Shop</div>
          <div className="header__right">React + Express</div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Товары</h1>
            <button className="btn btn--primary" onClick={openCreate}>
              + Добавить
            </button>
          </div>

          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : (
            <ProductsList products={products} onEdit={openEdit} onDelete={handleDelete} />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">© {new Date().getFullYear()} Mini Shop</div>
      </footer>

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
