import { Route, Routes } from "react-router";
import { RequireAuth, RequireRole } from "./auth/RequireAuth";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { MenuPage } from "./pages/MenuPage";
import { ProductPage } from "./pages/ProductPage";
import { AdminMenuPage } from "./pages/AdminMenuPage";
import { AdminOrdersPage } from "./pages/AdminOrdersPage";
import { CartPage } from "./pages/CartPage";
import { OrderPage } from "./pages/OrderPage";
import { OrdersPage } from "./pages/OrdersPage";
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
              <CartPage />
            </RequireAuth>
          }
        />
        <Route
          path="orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route
          path="orders/:id"
          element={
            <RequireAuth>
              <OrderPage />
            </RequireAuth>
          }
        />
        <Route
          path="admin/orders"
          element={
            <RequireRole role="ADMIN">
              <AdminOrdersPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/menu"
          element={
            <RequireRole role="ADMIN">
              <AdminMenuPage />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
