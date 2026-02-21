---
name: production-build
description: Zapewnia ścisłą synchronizację całego kodu z folderem 'dist'. Stosuj tę umiejętność zawsze podczas pisania kodu, naprawiania błędów, tworzenia skryptów PHP lub uruchamiania buildów.
---

# Protokół Budowania i Wdrożenia Produkcyjnego

**KLUCZOWA ZASADA:** Użytkownik wdraża TYLKO zawartość folderu `dist`. Jeśli plik istnieje w `public`, `src` lub `api`, ale nie ma go w `dist`, to dla użytkownika on nie istnieje.

## Kiedy stosować tę logikę
- Za każdym razem, gdy modyfikujesz pliki PHP.
- Za każdym razem, gdy zmieniasz kod React/JS/TS.
- Za każdym razem, gdy tworzysz nową funkcję lub naprawiasz błąd.
- Przed potwierdzeniem, że zadanie jest "zrobione".

## Kroki Wykonania

### 1. Dla Zmian Frontendowych (React/Vite/Webpack)
Po modyfikacji komponentów lub stylów:
1. Uruchom polecenie budowania (np. `npm run build`).
2. Zweryfikuj, czy pliki wynikowe (index.html, assets) w `dist/` zostały zaktualizowane.

### 2. Dla Backendu/Plików Statycznych (PHP, Konfiguracje, Uploady)
Ponieważ narzędzia budujące często czyszczą folder `dist` lub ignorują pliki inne niż JS:
1. **NATYCHMIAST** po utworzeniu lub modyfikacji pliku PHP w `public/` lub `api/`, musisz skopiować go do odpowiedniej ścieżki w `dist/`.
   - *Przykład:* Jeśli edytujesz `public/api/login.php`, musisz upewnić się, że `dist/api/login.php` jest identyczny.
2. Zapewnij zgodność struktury: Struktura folderów wewnątrz `dist/` musi odzwierciedlać wymaganą strukturę produkcyjną.

## Lista Kontrolna Weryfikacji
Przed udzieleniem odpowiedzi użytkownikowi, zadaj sobie pytania:
- [ ] Czy uruchomiłem skrypt budowania?
- [ ] Czy nowy skrypt PHP został skopiowany do `dist`?
- [ ] Czy plik `.htaccess` znajduje się w `dist`?
- [ ] Jeśli zmodyfikowałem `config.php`, czy zmiana jest odzwierciedlona w `dist`?

**Odmowa Zakończenia:** Nie oznaczaj zadania jako zakończone, dopóki folder `dist` nie będzie w pełni zsynchronizowany i gotowy do przesłania.
