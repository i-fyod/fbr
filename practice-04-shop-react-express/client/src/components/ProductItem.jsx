export default function ProductItem({ product, onEdit, onDelete }) {
  return (
    <div className="productCard">
      <div className="productCard__top">
        <div className="productCard__title">{product.name}</div>
        <div className="productCard__category">{product.category}</div>
      </div>

      <div className="productCard__desc">{product.description}</div>

      <div className="productCard__meta">
        <div>
          <span className="productCard__label">Цена:</span> {product.price} руб.
        </div>
        <div>
          <span className="productCard__label">На складе:</span> {product.stock}
        </div>
        {product.rating !== undefined && product.rating !== null ? (
          <div>
            <span className="productCard__label">Рейтинг:</span> {product.rating}
          </div>
        ) : null}
      </div>

      <div className="productCard__actions">
        <button className="btn" onClick={() => onEdit(product)}>
          Редактировать
        </button>
        <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}
