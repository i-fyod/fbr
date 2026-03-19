import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { setTokens } from "../auth/storage";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from || "/products";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tokens = await api.login({ email, password });
      setTokens(tokens);
      navigate(backTo);
    } catch (err) {
      const msg = err?.response?.data?.error;
      alert(msg ? `Ошибка: ${msg}` : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel auth">
      <h1 className="auth__title">Вход</h1>
      <form className="auth__form" onSubmit={onSubmit}>
        <label className="auth__label">
          Email
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="auth__label">
          Пароль
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn btn--primary" disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>

      <div className="auth__footer muted">
        Нет аккаунта? <Link to="/register">Регистрация</Link>
      </div>
    </div>
  );
}
