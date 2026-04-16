# coreapp/management/commands/sqlops.py
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
import argparse
import datetime
import decimal
import sys

# Helper utilities
def dictfetchall(cursor):
    "Return all rows from a cursor as a dict"
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

# --- SQL operations (SELECT / INSERT / UPDATE / DELETE) for multiple tables ---
# All queries use parameterized arguments (%s) to avoid SQL injection.

# 1) FELHASZNALO (users)
def select_users(limit=100):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT felhasznalo_id, email, nev, szerep
            FROM felhasznalo
            ORDER BY felhasznalo_id ASC
            LIMIT %s
        """, [limit])
        return dictfetchall(cursor)

def insert_user(email, jelszo_hash, nev=None, szerep='user'):
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO felhasznalo (email, jelszo_hash, nev, szerep)
                VALUES (%s, %s, %s, %s)
            """, [email, jelszo_hash, nev, szerep])
            # get last insert id (MySQL)
            cursor.execute("SELECT LAST_INSERT_ID()")
            return cursor.fetchone()[0]

def update_user(felhasznalo_id, email=None, jelszo_hash=None, nev=None, szerep=None):
    allowed = {}
    if email is not None: allowed['email'] = email
    if jelszo_hash is not None: allowed['jelszo_hash'] = jelszo_hash
    if nev is not None: allowed['nev'] = nev
    if szerep is not None: allowed['szerep'] = szerep

    if not allowed:
        raise ValueError("Nincs megadva módosítandó mező")

    set_parts = []
    params = []
    for k, v in allowed.items():
        set_parts.append(f"{k} = %s")
        params.append(v)
    params.append(felhasznalo_id)

    sql = f"UPDATE felhasznalo SET {', '.join(set_parts)} WHERE felhasznalo_id = %s"
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.rowcount  # number of rows updated

def delete_user(felhasznalo_id):
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM felhasznalo WHERE felhasznalo_id = %s", [felhasznalo_id])
            return cursor.rowcount

# 2) Example of SELECT with JOINs: list autos with marka and modell
def select_autos(limit=100):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT a.auto_id, a.rendszam, m.nev as marka_nev, mo.modellnev, a.gyartasi_ev, ut.megnevezes as uzemanyag
            FROM auto a
            JOIN marka m ON a.marka_id = m.marka_id
            JOIN modell mo ON a.modell_id = mo.modell_id
            JOIN uzemanyag_tipus ut ON a.uzemanyag_tipus_id = ut.uzemanyag_tipus_id
            ORDER BY a.auto_id ASC
            LIMIT %s
        """, [limit])
        return dictfetchall(cursor)

# 3) Insert a fuel record (tankolas)
def insert_tankolas(felhasznalo_id, auto_id, benzinkut_id, datum, liter, ar_per_liter):
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO tankolas (felhasznalo_id, auto_id, benzinkut_id, datum, liter, ar_per_liter)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, [felhasznalo_id, auto_id, benzinkut_id, datum, decimal.Decimal(liter), decimal.Decimal(ar_per_liter)])
            cursor.execute("SELECT LAST_INSERT_ID()")
            return cursor.fetchone()[0]

# 4) Generic utility for running arbitrary SELECT (read-only)
def run_select(sql, params=None):
    params = params or []
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        return dictfetchall(cursor)

# --- Command line integration ---
class Command(BaseCommand):
    help = "Run raw SQL operations against the 'automate' MySQL DB. Actions: select_users, insert_user, update_user, delete_user, select_autos, insert_tankolas, run_select"

    def add_arguments(self, parser: argparse.ArgumentParser):
        parser.add_argument("--action", required=True, help="Végrehajtandó művelet (lásd help)")
        # common user args
        parser.add_argument("--email", help="email for insert/update user")
        parser.add_argument("--password_hash", help="jelszo_hash for insert/update user")
        parser.add_argument("--nev", help="nev for insert user")
        parser.add_argument("--szerep", help="szerep for insert/update user (admin,user)")
        parser.add_argument("--id", type=int, help="id of the felhasznalo for update/delete")
        parser.add_argument("--limit", type=int, default=100, help="limit for selects")
        # tankolas args
        parser.add_argument("--felhasznalo_id", type=int)
        parser.add_argument("--auto_id", type=int)
        parser.add_argument("--benzinkut_id", type=int)
        parser.add_argument("--datum", help="datetime for tankolas in ISO format, e.g. '2025-12-05 10:00:00'")
        parser.add_argument("--liter", type=float)
        parser.add_argument("--ar_per_liter", type=float)
        # run_select
        parser.add_argument("--sql", help="arbitrary SELECT SQL (read-only allowed). Use --params as comma-separated values")
        parser.add_argument("--params", help="comma-separated params for --sql")

    def handle(self, *args, **options):
        action = options.get("action")
        try:
            if action == "select_users":
                rows = select_users(limit=options.get("limit") or 100)
                self.stdout.write(str(rows))

            elif action == "insert_user":
                email = options.get("email")
                jelszo_hash = options.get("password_hash")
                if not email or not jelszo_hash:
                    raise CommandError("Az insert_user művelethez szükséges: --email és --password_hash")
                fel_id = insert_user(email, jelszo_hash, nev=options.get("nev"), szerep=options.get("szerep") or "user")
                self.stdout.write(f"Inserted felhasznalo_id={fel_id}")

            elif action == "update_user":
                fid = options.get("id")
                if not fid:
                    raise CommandError("Az update_user művelethez szükséges: --id")
                changed = update_user(fid, email=options.get("email"), jelszo_hash=options.get("password_hash"), nev=options.get("nev"), szerep=options.get("szerep"))
                self.stdout.write(f"Updated rows: {changed}")

            elif action == "delete_user":
                fid = options.get("id")
                if not fid:
                    raise CommandError("A delete_user művelethez szükséges: --id")
                deleted = delete_user(fid)
                self.stdout.write(f"Deleted rows: {deleted}")

            elif action == "select_autos":
                rows = select_autos(limit=options.get("limit") or 100)
                self.stdout.write(str(rows))

            elif action == "insert_tankolas":
                for_field_ok = all([options.get("felhasznalo_id"), options.get("auto_id"), options.get("benzinkut_id"), options.get("datum"), options.get("liter"), options.get("ar_per_liter")])
                if not for_field_ok:
                    raise CommandError("Az insert_tankolas művelethez szükséges: --felhasznalo_id --auto_id --benzinkut_id --datum --liter --ar_per_liter")
                # parse datum
                try:
                    datum = datetime.datetime.fromisoformat(options.get("datum"))
                except Exception as e:
                    raise CommandError(f"Érvénytelen datum: {e}")
                tid = insert_tankolas(options.get("felhasznalo_id"), options.get("auto_id"), options.get("benzinkut_id"), datum, options.get("liter"), options.get("ar_per_liter"))
                self.stdout.write(f"Inserted tankolas_id={tid}")

            elif action == "run_select":
                sql = options.get("sql")
                if not sql:
                    raise CommandError("A run_select művelethez szükséges: --sql (csak olvasható SELECT)")
                if not sql.strip().lower().startswith("select"):
                    raise CommandError("A run_select műveletben csak SELECT olvasási lekérdezés engedélyezett")
                params = []
                if options.get("params"):
                    params = [p.strip() for p in options.get("params").split(",")]
                rows = run_select(sql, params)
                self.stdout.write(str(rows))

            else:
                raise CommandError(f"Ismeretlen művelet: {action}")

        except Exception as e:
            raise CommandError(str(e))

