import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../../../components/navbar/navbar";
import Input from "../../../components/input/input";
import Loading from "../../../components/loading/loading";
import SuccessModal from "../../../components/success-modal/successModal";
import { deleteAdminUser, getAdminUsers, updateAdminUser } from "../../../actions/admin/adminActions";

import "./adminPage.css";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // bejelentkezett id
  const currentUserId = Number(localStorage.getItem("user_id") || 0);
  const currentUser = users.find(function(user) {
    return user.user_id === currentUserId;
  });
  const currentIsSuperadmin = !!currentUser?.is_superadmin;

  // felhasználók betöltése
  async function loadUsers(email) {
    const searchParam = email || "";
    setLoading(true);

    try {
      const data = await getAdminUsers(searchParam);

      // Adatok normalizálása
      setUsers(
        data.map(function(user) {
          return {
            ...user,
            full_name: user.full_name || "",
            password: "",
            role: user.role || "user",
          };
        })
      );
    } catch (err) {
      setError(err.message || "Nem sikerült betölteni a listát.");
    } finally {
      setLoading(false);
    }
  }

  // betöltés
  useEffect(function() {
    loadUsers();
  }, []);

  // mezők kezelése
  function handleChange(id, field, value) {
    setUsers(function(prev) {
      return prev.map(function(user) {
        if (user.user_id === id) {
          return { ...user, [field]: value, isChanged: true };
        }
        return user;
      });
    });
  }

  // Módosítás mentése
  async function handleSave(user) {
    setError("");

    try {
      const { full_name, email, role, password } = user;
      await updateAdminUser(user.user_id, { full_name, email, role, password });

      setSuccessMessage("Sikeres módosítás.");
      loadUsers(searchEmail);
    } catch (err) {
      setError(err.message || "Hiba a mentés során.");
    }
  }

  // Törlés
  async function handleDelete(id) {
    try {
      await deleteAdminUser(id);
      setSuccessMessage("Sikeres törlés.");
      loadUsers(searchEmail);
    } catch (err) {
      setError(err.message || "Hiba a törlésnél.");
    }
  }

  return (
    <div className="admin-page">
      <Navbar />

      <div className="admin-page-content container">
        <div className="admin-header-row">
          <h1 className="admin-title">Admin felület</h1>
          <Link className="admin-home-link" to="/autok">
            Autók
          </Link>
        </div>

        {/* Keresés */}
        <form
          className="admin-search-row"
          onSubmit={function(e) {
            e.preventDefault();
            loadUsers(searchEmail);
          }}
        >
          <Input
            type="text"
            value={searchEmail}
            maxLength={50}
            onChange={function(e) {
              setSearchEmail(e.target.value);
            }}
            placeholder="Keresés email alapján..."
          />
          <button type="submit" className="admin-action-btn admin-search-btn">
            Keresés
          </button>
        </form>

        {error && <p className="admin-error">{error}</p>}

        {loading ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="table table-dark admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Név</th>
                  <th>Jelszó</th>
                  <th>Jog</th>
                  <th>Műveletek</th>
                </tr>
              </thead>

              <tbody>
                {users.map(function(user) {
                  // ellenőrzés: saját profil és admin fiók
                  const isOwnAccount = user.user_id === currentUserId;
                  const isAdminAccount = user.role === "admin";
                  const showActionButtons = !isOwnAccount && (currentIsSuperadmin || !isAdminAccount);
                  const isDisabled = !showActionButtons;

                  return (
                    <tr
                      key={user.user_id}
                      className={user.is_superadmin ? "superadmin-row" : isOwnAccount ? "admin-self-row" : ""}
                    >
                      <td>
                        <Input
                          type="email"
                          value={user.email}
                          maxLength={50}
                          onChange={function(e) {
                            handleChange(user.user_id, "email", e.target.value);
                          }}
                          disabled={isDisabled}
                        />
                      </td>
                      <td>
                        <Input
                          type="text"
                          value={user.full_name}
                          maxLength={30}
                          onChange={function(e) {
                            handleChange(user.user_id, "full_name", e.target.value);
                          }}
                          disabled={isDisabled}
                        />
                      </td>
                      <td>
                        <Input
                          type="password"
                          value={user.password}
                          maxLength={50}
                          onChange={function(e) {
                            handleChange(user.user_id, "password", e.target.value);
                          }}
                          placeholder="Új jelszó"
                          disabled={isDisabled}
                        />
                      </td>
                      <td>
                        <select
                          className="admin-cell-input admin-role-select"
                          value={user.role}
                          onChange={function(e) {
                            handleChange(user.user_id, "role", e.target.value);
                          }}
                          disabled={isDisabled}
                        >
                          <option value="user">Felhasználó</option>
                          {currentIsSuperadmin && <option value="admin">Admin</option>}
                          <option value="moderator">Moderátor</option>
                        </select>
                      </td>
                      <td className="admin-buttons-cell">
                        {showActionButtons && (
                          <>
                            <button
                              type="button"
                              className="admin-action-btn"
                              onClick={function() {
                                handleSave(user);
                              }}
                              disabled={!user.isChanged}
                            >
                              Mentés
                            </button>
                            <button
                              type="button"
                              className="admin-delete-btn"
                              onClick={function() {
                                handleDelete(user.user_id);
                              }}
                            >
                              Törlés
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {successMessage && (
        <SuccessModal 
          description={successMessage} 
          onClose={function() {
            setSuccessMessage("");
          }} 
        />
      )}
    </div>
  );
}
