import { Route, Routes } from "react-router";
import { RequireAuth, RequireRole } from "./auth/RequireAuth";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { MenuPage } from "./pages/MenuPage";
import { ProductPage } from "./pages/ProductPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { RegisterPage } from "./pages/RegisterPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={<MenuPage />}
        />
        <Route
          path="products/:id"
          element={<ProductPage />}
        />
        <Route
          path="login"
          element={<LoginPage />}
        />
        <Route
          path="register"
          element={<RegisterPage />}
        />
        <Route
          path="cart"
          element={
            <RequireAuth>
              <PlaceholderPage title="Cart" />
            </RequireAuth>
          }
        />
        <Route
          path="orders"
          element={
            <RequireAuth>
              <PlaceholderPage title="My orders" />
            </RequireAuth>
          }
        />
        <Route
          path="admin/orders"
          element={
            <RequireRole role="ADMIN">
              <PlaceholderPage title="Orders" />
            </RequireRole>
          }
        />
        <Route
          path="admin/menu"
          element={
            <RequireRole role="ADMIN">
              <PlaceholderPage title="Manage menu" />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
