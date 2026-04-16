import { useState } from "react";
import Button from "../../components/button/button";
import LabeledInput from "../../components/labeledInput/labeledInput";
import Modal from "../../components/modal/modal";
import SuccessModal from "../../components/success-modal/successModal";
import { limitTextLength } from "../../actions/shared/inputValidation";
import { updateProfileSettings } from "../../actions/auth/authActions";

export default function Settings({ onClose, onSaved }) {
  // jelszó1
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");

  // adatok ls-ből
  const [fullName, setFullName] = useState(function() {
    const savedName = localStorage.getItem("full_name") || "";
    return savedName.trim();
  });

  const [email, setEmail] = useState(function() {
    const savedEmail = localStorage.getItem("email") || "";
    return savedEmail.trim();
  });

  const [password, setPassword] = useState(function() {
    return localStorage.getItem("password") || "";
  });

  // hiba + töltés
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // mentés
  async function handleSave(event) {
    event.preventDefault();
    setErrorMessage("");

    // jelszó ellenőrzése
    if (!isUnlocked) {
      if (!unlockPassword) {
        setFieldErrors({ unlockPassword: "A jelszó megadása kötelező!" });
        return;
      }

      const savedPassword = localStorage.getItem("password") || "";
      if (unlockPassword !== savedPassword) {
        setFieldErrors({ unlockPassword: "Hibás jelszó!" });
        return;
      }

      setFieldErrors({});
      setIsUnlocked(true);
      return;
    }

    // adatok validálása és mentése
    const tempErrors = {};
    if (!fullName.trim()) tempErrors.fullName = "A teljes név megadása kötelező!";
    if (!email.trim()) tempErrors.email = "Az e-mail cím megadása kötelező!";
    if (!password) tempErrors.password = "A jelszó megadása kötelező!";

    if (Object.keys(tempErrors).length > 0) {
      setFieldErrors(tempErrors);
      return;
    }

    try {
      setIsSaving(true);
      await updateProfileSettings({
        fullName: fullName.trim(),
        email: email.trim(),
        password: password,
      });
      onSaved?.();
      onClose?.();
    } catch (err) {
      setErrorMessage(err.message || "Nem sikerült menteni a beállításokat.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
    <Modal
      title="Beállítások"
      onClose={onClose}
      columns={1}
      onSubmit={handleSave}
      footer={
        <Button 
          text={isUnlocked ? (isSaving ? "Mentés..." : "Megváltoztatás") : "Tovább"} 
          type="submit" 
        />
      }
    >
      {/* Jelszó megadása */}
      {!isUnlocked ? (
        <>
          <p className="m-0">Add meg a jelszót a folytatáshoz.</p>
          <LabeledInput
            label="Jelszó"
            type="password"
            value={unlockPassword}
            maxLength={50}
            onChange={function(e) {
              setUnlockPassword(limitTextLength(e.target.value, 50));
              if (fieldErrors.unlockPassword) {
                setFieldErrors(function(prev) {
                  return { ...prev, unlockPassword: "" };
                });
              }
            }}
            error={fieldErrors.unlockPassword}
          />
        </>
      ) : (
        /* Szerkesztés */
        <>
          <LabeledInput
            label="Teljes név"
            value={fullName}
            maxLength={30}
            onChange={function(e) {
              setFullName(limitTextLength(e.target.value, 30));
              if (fieldErrors.fullName) {
                setFieldErrors(function(prev) {
                  return { ...prev, fullName: "" };
                });
              }
            }}
            error={fieldErrors.fullName}
          />
          <LabeledInput
            label="E-mail cím"
            type="email"
            value={email}
            maxLength={50}
            onChange={function(e) {
              setEmail(limitTextLength(e.target.value, 50));
              if (fieldErrors.email) {
                setFieldErrors(function(prev) {
                  return { ...prev, email: "" };
                });
              }
            }}
            error={fieldErrors.email}
          />
          <LabeledInput
            label="Jelszó"
            type="text"
            value={password}
            maxLength={50}
            onChange={function(e) {
              setPassword(limitTextLength(e.target.value, 50));
              if (fieldErrors.password) {
                setFieldErrors(function(prev) {
                  return { ...prev, password: "" };
                });
              }
            }}
            error={fieldErrors.password}
          />
        </>
      )}
      {errorMessage && <p className="text-danger m-0">{errorMessage}</p>}
    </Modal>

    {showSuccess && (
      <SuccessModal
        description="Sikeres módosítás"
        onClose={function() {
          setShowSuccess(false);
          onClose?.();
        }}
      />
    )}
    </>
  );
}
