import { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [rating, setRating] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(initialProduct?.name ?? "");
    setCategory(initialProduct?.category ?? "");
    setDescription(initialProduct?.description ?? "");
    setPrice(initialProduct?.price != null ? String(initialProduct.price) : "");
    setStock(initialProduct?.stock != null ? String(initialProduct.stock) : "");
    setRating(initialProduct?.rating != null ? String(initialProduct.rating) : "");
    setImage(initialProduct?.image ?? "");
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === "edit" ? "Редактирование товара" : "Создание товара";

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedRating = rating.trim() === "" ? undefined : Number(rating);
    const trimmedImage = image.trim();

    if (!trimmedName) return alert("Введите название");
    if (!trimmedCategory) return alert("Введите категорию");
    if (!trimmedDescription) return alert("Введите описание");
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return alert("Введите корректную цену (>= 0)");
    if (!Number.isInteger(parsedStock) || parsedStock < 0) return alert("Введите корректное количество (целое >= 0)");
    if (parsedRating !== undefined && (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 5)) {
      return alert("Введите рейтинг 0-5 или оставьте пустым");
    }

    const payload = {
      id: initialProduct?.id,
      name: trimmedName,
      category: trimmedCategory,
      description: trimmedDescription,
      price: parsedPrice,
      stock: parsedStock,
      ...(parsedRating !== undefined ? { rating: parsedRating } : {}),
      ...(trimmedImage ? { image: trimmedImage } : {}),
    };

    onSubmit(payload);
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Кофе" autoFocus />
          </label>
          <label className="label">
            Категория
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Например, Напитки" />
          </label>
          <label className="label">
            Описание
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Короткое описание" rows={3} />
          </label>
          <div className="row">
            <label className="label">
              Цена
              <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="Например, 1290" />
            </label>
            <label className="label">
              На складе
              <input className="input" value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" placeholder="Например, 10" />
            </label>
          </div>
          <div className="row">
            <label className="label">
              Рейтинг (0-5)
              <input className="input" value={rating} onChange={(e) => setRating(e.target.value)} inputMode="decimal" placeholder="опционально" />
            </label>
            <label className="label">
              Фото (URL)
              <input className="input" value={image} onChange={(e) => setImage(e.target.value)} placeholder="опционально" />
            </label>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === "edit" ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
