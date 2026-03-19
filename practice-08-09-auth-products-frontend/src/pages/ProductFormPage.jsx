import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

export default function ProductFormPage({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isEdit) return;
      try {
        setLoading(true);
        const p = await api.getProductById(id);
        if (cancelled) return;
        setTitle(p.title);
        setCategory(p.category);
        setDescription(p.description);
        setPrice(String(p.price));
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
  }, [id, isEdit]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const numPrice = Number(price);
    if (!title.trim()) return alert("Введите title");
    if (!category.trim()) return alert("Введите category");
    if (!description.trim()) return alert("Введите description");
    if (!Number.isFinite(numPrice) || numPrice < 0) return alert("Введите корректную цену");

    const payload = {
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      price: numPrice,
    };

    try {
      if (isEdit) {
        const updated = await api.updateProduct(id, payload);
        navigate(`/products/${updated.id}`);
      } else {
        const created = await api.createProduct(payload);
        navigate(`/products/${created.id}`);
      }
    } catch (err) {
      const msg = err?.response?.data?.error;
      alert(msg ? `Ошибка: ${msg}` : "Ошибка сохранения");
    }
  };

  if (loading) return <div className="panel pad muted">Загрузка...</div>;

  return (
    <div className="panel pad">
      <h1 style={{ marginTop: 0 }}>{isEdit ? "Редактировать" : "Создать"} товар</h1>
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          Title
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          Category
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label className="field">
          Description
          <textarea className="textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="field">
          Price
          <input className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>

        <div className="actions">
          <Link className="btn" to={isEdit ? `/products/${id}` : "/products"}>
            Отмена
          </Link>
          <button className="btn btn--primary" type="submit">
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
