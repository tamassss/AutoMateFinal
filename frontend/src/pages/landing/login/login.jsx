import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../../actions/auth/authActions";

import Card from "../../../components/card/card";
import Input from "../../../components/input/input";
import Button from "../../../components/button/button";

export default function Login() {
  const navigate = useNavigate();

  // Input ref
  const emailRef = useRef();
  const passwordRef = useRef();

  // Hibakezelés state
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Bejelentkezés
  async function handleLogin(e) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const email = emailRef.current.value?.trim();
    const password = passwordRef.current.value;

    // Mezők ellenőrzése
    const tempErrors = {};
    if (!email) tempErrors.email = "Az e-mail cím megadása kötelező!";
    if (!password) tempErrors.password = "A jelszó megadása kötelező!";

    if (Object.keys(tempErrors).length > 0) {
      setFieldErrors(tempErrors);
      return;
    }

    try {
      // API + navigate
      const user = await login(email, password);
      const targetPath = user?.role === "admin" ? "/admin" : "/autok";

      navigate(targetPath, {
        state: { successMessage: "Sikeres bejelentkezés" },
      });
    } catch (err) {
      setErrorMessage(err.message || "Ismeretlen hiba történt!");
    }
  }

  // Hibaüzenet törlése íráskor
  const clearError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card>
      <h3 className="mt-2 text-center">Bejelentkezés</h3>
      
      {/* Hibaüzenet */}
      {errorMessage && (
        <p className="text-center" style={{ color: "red" }}>
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleLogin}>
        <div className="px-2">
          <Input
            type="text"
            inputRef={emailRef}
            placeholder="Email cím"
            error={fieldErrors.email}
            maxLength={50}
            onChange={() => clearError("email")}
          />
        </div>

        <div className="px-2">
          <Input
            type="password"
            inputRef={passwordRef}
            placeholder="Jelszó"
            error={fieldErrors.password}
            maxLength={50}
            onChange={() => clearError("password")}
          />
        </div>

        <div className="custom-btn-div">
          <Button text="Bejelentkezés" type="submit" />
        </div>
      </form>
    </Card>
  );
}
