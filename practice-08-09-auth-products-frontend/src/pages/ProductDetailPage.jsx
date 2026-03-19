import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await api.getProductById(id);
        if (!cancelled) setProduct(data);
      } catch (err) {
        const msg = err?.response?.data?.error;
        alert(msg ? `Ошибка: ${msg}` : "Ошибка загрузки товара");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onDelete = async () => {
    const ok = window.confirm("Удалить товар?");
    if (!ok) return;
    try {
      await api.deleteProduct(id);
      navigate("/products");
    } catch (err) {
      const msg = err?.response?.data?.error;
      alert(msg ? `Ошибка: ${msg}` : "Ошибка удаления");
    }
  };

  if (loading) return <div className="panel pad muted">Загрузка...</div>;
  if (!product) return <div className="panel pad muted">Не найдено</div>;

  return (
    <div className="panel pad">
      <div className="detailTop">
        <div>
          <h1 className="detailTitle">{product.title}</h1>
          <div className="muted">{product.category}</div>
        </div>
        <div className="detailActions">
          <Link className="btn" to={`/products/${id}/edit`}>
            Редактировать
          </Link>
          <button className="btn btn--danger" onClick={onDelete}>
            Удалить
          </button>
        </div>
      </div>

      <p className="muted" style={{ marginTop: 10 }}>
        {product.description}
      </p>
      <div className="detailPrice">{product.price} руб.</div>

      <div style={{ marginTop: 14 }}>
        <Link to="/products" className="muted">
          ← Назад к списку
        </Link>
      </div>
    </div>
  );
}
