import { Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { MenuPage } from "./pages/MenuPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={<MenuPage />}
        />
        <Route
          path="login"
          element={<PlaceholderPage title="Iniciar sesión" />}
        />
        <Route
          path="register"
          element={<PlaceholderPage title="Registro" />}
        />
        <Route
          path="cart"
          element={<PlaceholderPage title="Carrito" />}
        />
        <Route
          path="orders"
          element={<PlaceholderPage title="Mis pedidos" />}
        />
        <Route
          path="admin/orders"
          element={<PlaceholderPage title="Pedidos" />}
        />
        <Route
          path="admin/menu"
          element={<PlaceholderPage title="Administrar menú" />}
        />
      </Route>
    </Routes>
  );
}

export default App;
