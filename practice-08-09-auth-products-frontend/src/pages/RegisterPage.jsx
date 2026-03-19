import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.register({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
      });
      alert("Пользователь создан. Теперь войдите.");
      navigate("/login");
    } catch (err) {
      const msg = err?.response?.data?.error;
      alert(msg ? `Ошибка: ${msg}` : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel auth">
      <h1 className="auth__title">Регистрация</h1>
      <form className="auth__form" onSubmit={onSubmit}>
        <label className="auth__label">
          Email
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <div className="auth__row">
          <label className="auth__label">
            Имя
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="auth__label">
            Фамилия
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
        </div>
        <label className="auth__label">
          Пароль
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <button className="btn btn--primary" disabled={loading}>
          {loading ? "Создаём..." : "Создать аккаунт"}
        </button>
      </form>

      <div className="auth__footer muted">
        Уже есть аккаунт? <Link to="/login">Вход</Link>
      </div>
    </div>
  );
}
