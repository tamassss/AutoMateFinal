import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../../actions/auth/authActions";

import Input from "../../../components/input/input";
import Card from "../../../components/card/card";
import Button from "../../../components/button/button";
import SuccessModal from "../../../components/success-modal/successModal";

export default function Register() {
  const navigate = useNavigate();

  // Input ref
  const fullNameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordAgainRef = useRef();
  
  // Állapotok state
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Regisztráció
  async function handleRegister(e) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const fullName = fullNameRef.current.value?.trim();
    const email = emailRef.current.value?.trim();
    const password = passwordRef.current.value;
    const passwordAgain = passwordAgainRef.current.value;

    // Kötelező mezők ellenőrzése
    const tempErrors = {};
    if (!fullName) tempErrors.fullName = "A teljes név megadása kötelező!";
    if (!email) tempErrors.email = "Az e-mail cím megadása kötelező!";
    if (!password) tempErrors.password = "A jelszó megadása kötelező!";
    if (!passwordAgain) tempErrors.passwordAgain = "A jelszó ismétlése kötelező!";

    if (Object.keys(tempErrors).length > 0) {
      setFieldErrors(tempErrors);
      return;
    }

    // Jelszavak egyeznek-e
    if (password !== passwordAgain) {
      setFieldErrors({ passwordAgain: "A két jelszó nem egyezik!" });
      return;
    }

    try {
      // API
      await register(email, password, fullName);
      setShowSuccess(true);
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
      {/* Sikeres regisztráció alert */}
      {showSuccess && (
        <SuccessModal
          description="Sikeres regisztráció"
          onClose={() => {
            setShowSuccess(false);
            navigate("/");
          }}
        />
      )}

      <h3 className="mt-2 text-center">Regisztráció</h3>
      
      {/* Hibaüzenet */}
      {errorMessage && (
        <p className="text-center" style={{ color: "red" }}>
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleRegister}>
        <div className="px-2">
          <Input
            type="text"
            inputRef={fullNameRef}
            placeholder="Teljes név"
            error={fieldErrors.fullName}
            maxLength={30}
            onChange={() => clearError("fullName")}
          />
        </div>

        <div className="px-2">
          <Input
            type="email"
            inputRef={emailRef}
            placeholder="E-mail cím"
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

        <div className="px-2">
          <Input
            type="password"
            inputRef={passwordAgainRef}
            placeholder="Jelszó ismét"
            error={fieldErrors.passwordAgain}
            maxLength={50}
            onChange={() => clearError("passwordAgain")}
          />
        </div>
        
        <div className="custom-btn-div">
          <Button text="Regisztráció" type="submit" />
        </div>
      </form>
    </Card>
  );
}
