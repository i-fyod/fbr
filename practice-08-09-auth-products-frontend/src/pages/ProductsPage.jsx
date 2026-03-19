import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await api.listProducts();
        if (!cancelled) setProducts(data);
      } catch (err) {
        const msg = err?.response?.data?.error;
        alert(msg ? `Ошибка: ${msg}` : "Ошибка загрузки");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>Товары</h1>
        <Link className="btn btn--primary" to="/products/new">
          + Создать
        </Link>
      </div>

      {loading ? (
        <div className="panel pad muted">Загрузка...</div>
      ) : products.length ? (
        <div className="grid">
          {products.map((p) => (
            <Link key={p.id} className="card" to={`/products/${p.id}`}>
              <div className="card__top">
                <div className="card__title">{p.title}</div>
                <div className="muted">{p.category}</div>
              </div>
              <div className="card__desc muted">{p.description}</div>
              <div className="card__price">{p.price} руб.</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel pad muted">Товаров нет</div>
      )}
    </div>
  );
}
