import { useCallback, useEffect, useMemo, useState } from "react";
import { routes, storageKeys } from "../lib/constants.js";
import { getDefaultApiBaseUrl } from "../lib/formatters.js";

export function useAuth() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(getDefaultApiBaseUrl());
  const [loginStatus, setLoginStatus] = useState("Gunakan akun internal yang punya akses role sesuai kebutuhan.");

  useEffect(() => {
    const storedToken = localStorage.getItem(storageKeys.token) || "";
    const storedApiBaseUrl = localStorage.getItem(storageKeys.apiBaseUrl) || getDefaultApiBaseUrl();
    const storedUser = localStorage.getItem(storageKeys.user);

    setToken(storedToken);
    setApiBaseUrl(storedApiBaseUrl);
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  const hasPermission = useCallback(
    (permission) => {
      return Boolean(user?.permissions?.includes(permission));
    },
    [user],
  );

  const routeAllowed = useCallback(
    (routeKey) => {
      const route = routes.find((item) => item.key === routeKey);
      if (!route) {
        return false;
      }
      if (routeKey === "settings") {
        return user?.role?.code === "admin" || hasPermission("settings.general.read");
      }
      if (!route.permissions.length) {
        return true;
      }
      return route.permissions.some((permission) => hasPermission(permission));
    },
    [hasPermission, user],
  );

  const defaultRouteForUser = useCallback(() => {
    return routes.find((route) => routeAllowed(route.key))?.key || "dashboard";
  }, [routeAllowed]);

  const allowedRoutes = useMemo(() => {
    return routes.filter((route) => routeAllowed(route.key));
  }, [routeAllowed]);

  const apiFetch = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Request failed");
      }
      return body.data;
    },
    [apiBaseUrl, token],
  );

  const apiFetchRaw = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });
      if (!response.ok) {
        throw new Error(response.statusText || "Request failed");
      }
      return response;
    },
    [apiBaseUrl, token],
  );

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    localStorage.removeItem(storageKeys.token);
    localStorage.removeItem(storageKeys.user);
  }, []);

  const handleLogin = useCallback(
    async (event) => {
      event.preventDefault();
      const result = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: event.currentTarget.username.value.trim(),
          password: event.currentTarget.password.value,
        }),
      }).then((response) => response.json().then((body) => ({ ok: response.ok, body })));

      if (!result.ok || !result.body.success) {
        throw new Error(result.body.message || "Login gagal");
      }

      setToken(result.body.data.token);
      setUser(result.body.data.user);
      localStorage.setItem(storageKeys.token, result.body.data.token);
      localStorage.setItem(storageKeys.apiBaseUrl, apiBaseUrl);
      localStorage.setItem(storageKeys.user, JSON.stringify(result.body.data.user));
      setLoginStatus(`Login berhasil sebagai ${result.body.data.user.fullName}`);
      return result.body.data.user;
    },
    [apiBaseUrl],
  );

  return {
    token,
    user,
    apiBaseUrl,
    loginStatus,
    allowedRoutes,
    setApiBaseUrl,
    setLoginStatus,
    setUser,
    hasPermission,
    routeAllowed,
    defaultRouteForUser,
    apiFetch,
    apiFetchRaw,
    handleLogin,
    logout,
  };
}
