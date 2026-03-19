import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api";
import { clearTokens, getTokens } from "../auth/storage";

export default function Layout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const authed = Boolean(getTokens().accessToken);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      if (!authed) {
        setEmail(null);
        return;
      }
      try {
        const me = await api.me();
        if (!cancelled) setEmail(me.email);
      } catch {
        if (!cancelled) setEmail(null);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [authed]);

  const onLogout = () => {
    clearTokens();
    setEmail(null);
    navigate("/login");
  };

  return (
    <>
      <header className="topbar">
        <div className="container topbar__inner">
          <Link to="/products" className="brand">
            Auth Products
          </Link>
          <nav className="nav">
            {authed ? (
              <>
                <span className="muted">{email ? email : ""}</span>
                <button className="btn" onClick={onLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link className="btn" to="/login">
                  Вход
                </Link>
                <Link className="btn btn--primary" to="/register">
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
