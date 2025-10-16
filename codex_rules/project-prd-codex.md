# PRD: 10x-poke-sky

## 1. Zwięzły opis projektu i jego celów

Projekt 10x-poke-sky to nowoczesna aplikacja webowa umożliwiająca poszerzanie swojej wiedzy na temat świata pokemonów, poprzez przeglądanie listy pokemonów z każdej generacji, wyszukiwanie pokemonów, podglądanie ich statystyk. Aplikacja zapewnia intuicyjny interfejs, a także mechanizm który na podstawie opisu potrafi rozpoznać pokemona. Głównym celem jest skonsolidowanie wiedzy o świecie pokemonów w jednym miejscu wraz z innowacyjnymi mechanizmami, takimi jak rozpoznawanie pokemonów za pomocą AI, które w szybszy sposób pozwolą poznać użytkownikowi wszystkie tajniki z uniwersum Pokemon.

## 2. Jasno zdefiniowany problem użytkownika

- **Problem pamięciowy**: Pasjonaci świata Pokemon mają trudność z zapamiętaniem wszystkich pokemonów (obecnie ponad 1000) wraz z ich typami, statystykami i ruchami.

- **Problem wyszukiwania**: Brak narzędzi, które rozpoznają pokemona na podstawie cząstkowych informacji o wyglądzie (np. "niebieski pokemon z ogonem w kształcie wody"), gdy użytkownik nie zna nazwy, generacji lub regionu.

- **Problem rozproszenia informacji**: Użytkownicy muszą korzystać z wielu źródeł (wiki, bazy danych, fora), aby znaleźć kompletne informacje o pokemonie.

## 3. Wymagania funkcjonalne

- Wyszukiwarka pokemon pozwalająca znaleźć pokemona za pomocą jego nazwy oraz innych parametrów.
- Mechanizm dodawania/usuwania ulubionych pokemonów, zapewniający szybki dostęp do wybranych jednostek.
- Możliwość podglądu szczegółowych informacji na temat wybranego pokemona.
- Mechanizm konwersacji w oknie czatu zintegrowany z API AI, pomagający rozpoznać pokemona na podstawie opisu użytkownika.
- Kolekcje ruchów pokemon, umożliwiające sortowanie po typie, regionie, mocy.
- Logowanie i autoryzacja użytkowników.

## 4. Granice projektu

- Zaawansowane funkcje wyszukiwania nie są uwzględnione w MVP.
- Grupowanie pokemonów, według typów, regionów czy ewolucji nie będzie dostępne.
- Konwersacje z Chatem AI nie będą mogły wychodzić poza świat Pokemon.
- Rozbudowane funkcje społeczne wykraczają poza obecny zakres funkcjonalności.

## 5. Precyzyjne user stories

### US-001: Wyszukiwanie pokemonów

- **Tytuł**: Wyszukiwanie pokemona po nazwie i parametrach
- **Opis**: Jako użytkownik chcę wyszukać pokemona po jego nazwie lub innych parametrach (typ, generacja, region), aby szybko znaleźć interesujące mnie informacje.
- **Kryteria akceptacji**:
  - Użytkownik widzi pole wyszukiwarki na stronie głównej.
  - Użytkownik może wpisać nazwę pokemona lub użyć filtrów (typ, generacja, region).
  - System wyświetla listę pokemonów spełniających kryteria wyszukiwania.
  - Użytkownik może kliknąć na pokemona z listy, aby zobaczyć szczegółowe informacje.
  - System wyświetla komunikat gdy brak wyników wyszukiwania z sugestią użycia czatu AI.

### US-002: Szczegółowe informacje o pokemonie

- **Tytuł**: Podgląd szczegółowych statystyk pokemona
- **Opis**: Jako użytkownik chcę zobaczyć szczegółowe informacje o wybranym pokemonie (statystyki, typ, ewolucje, ruchy), aby poznać jego możliwości i charakterystykę.
- **Kryteria akceptacji**:
  - Użytkownik widzi stronę szczegółową pokemona zawierającą: obraz, nazwę, typ/typy, podstawowe statystyki (HP, atak, obrona, etc.).
  - System wyświetla informacje o ewolucjach pokemona (jeśli istnieją).
  - System wyświetla listę dostępnych ruchów pokemona.
  - Użytkownik może powrócić do listy wyszukiwania lub strony głównej.

### US-003: Ulubione pokemony

- **Tytuł**: Zarządzanie ulubionymi pokemonami
- **Opis**: Jako zalogowany użytkownik chcę dodawać i usuwać pokemony z listy ulubionych, aby mieć szybki dostęp do moich ulubionych jednostek.
- **Kryteria akceptacji**:
  - Użytkownik widzi przycisk "Dodaj do ulubionych" na stronie szczegółowej pokemona.
  - Użytkownik może dodać pokemona do ulubionych jednym kliknięciem.
  - Użytkownik może usunąć pokemona z listy ulubionych.
  - Użytkownik widzi dedykowaną zakładkę/stronę z listą swoich ulubionych pokemonów.
  - Funkcjonalność ulubionych nie jest dostępna bez logowania się do systemu (US-005).

### US-004: Rozpoznawanie pokemona przez AI

- **Tytuł**: Rozpoznawanie pokemona na podstawie opisu
- **Opis**: Jako użytkownik chcę opisać pokemona w czacie AI (wygląd, kolory, cechy charakterystyczne), aby system pomógł mi zidentyfikować pokemona, którego nazwy nie pamiętam.
- **Kryteria akceptacji**:
  - Użytkownik widzi przycisk/zakładkę uruchamiającą czat AI.
  - Użytkownik może opisać pokemona w języku naturalnym.
  - System AI analizuje opis i sugeruje najbardziej pasujące pokemony.
  - System wyświetla listę sugerowanych pokemonów z miniaturkami i krótkimi opisami.
  - Użytkownik może kliknąć na sugerowanego pokemona, aby zobaczyć szczegółowe informacje.
  - Czat AI nie odpowiada na pytania niezwiązane ze światem Pokemon.

### US-005: Bezpieczny dostęp i uwierzytelnianie

- **Tytuł**: Bezpieczny dostęp
- **Opis**: Jako użytkownik chcę mieć możliwość rejestracji i logowania się do systemu w sposób zapewniający bezpieczeństwo moich danych.
- **Kryteria akceptacji**:
  - Logowanie i rejestracja odbywają się na dedykowanych stronach.
  - Logowanie wymaga podania adresu email i hasła.
  - Rejestracja wymaga podania adresu email, hasła i potwierdzenia hasła.
  - Użytkownik MOŻE korzystać z wyszukiwania pokemonów i czatu AI bez logowania się do systemu (US-001, US-004).
  - Użytkownik NIE MOŻE korzystać z funkcji ulubionych pokemonów bez logowania się do systemu (US-003).
  - Użytkownik może logować się do systemu poprzez przycisk w prawym górnym rogu.
  - Użytkownik może się wylogować z systemu poprzez przycisk w prawym górnym rogu.
  - Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub).
  - Użytkownik może zainicjować proces odzyskiwania hasła poprzez link "Zapomniałem hasła".
  - System wysyła link do resetowania hasła na zarejestrowany adres email.
  - Hasła są przechowywane w formie zahashowanej (np. bcrypt).

### US-006: Przeglądanie ruchów pokemonów

- **Tytuł**: Kolekcje ruchów pokemon
- **Opis**: Jako użytkownik chcę przeglądać listę ruchów pokemonów z możliwością sortowania i filtrowania (po typie, regionie, mocy), aby poznać dostępne ataki i ich charakterystyki.
- **Kryteria akceptacji**:
  - Użytkownik widzi dedykowaną zakładkę/stronę z listą ruchów.
  - Użytkownik może sortować ruchy według: typu, regionu, mocy.
  - System wyświetla podstawowe informacje o każdym ruchu (nazwa, typ, moc, dokładność).
- **Nice to have** (poza MVP):
  - Użytkownik może kliknąć na ruch, aby zobaczyć szczegółowy opis i listę pokemonów, które mogą się go nauczyć.

## 6. Metryki sukcesu

- Liczba aktywnych użytkowników i wzrost bazy użytkowników korzystających z aplikacji.
- Średni czas spędzony w aplikacji oraz liczba wyświetlonych stron szczegółowych pokemonów.
- Wskaźnik adopcji funkcji czatu AI do rozpoznawania pokemonów oraz skuteczność rozpoznawania (% trafnych sugestii).
- Liczba dodanych ulubionych pokemonów oraz częstotliwość korzystania z tej funkcji przez zalogowanych użytkowników.
- Pozytywne opinie użytkowników dotyczące intuicyjności interfejsu i użyteczności aplikacji (NPS, opinie w sklepach aplikacji, feedback).
- Wskaźnik konwersji z użytkowników niezalogowanych na zalogowanych (rejestracja po korzystaniu z podstawowych funkcji).

## 7. Wymagania niefunkcjonalne

- **Performance**: Czas ładowania strony głównej < 2s, wyszukiwanie < 1s
- **Responsywność**: Aplikacja działa na desktop, tablet i mobile
- **Dostępność**: Podstawowe wsparcie dla screen readerów (WCAG 2.1 poziom AA)
- **API**: Integracja z PokeAPI (https://pokeapi.co/) jako źródło danych o pokemonach
- **AI**: Integracja z OpenAI API lub Claude API dla funkcji rozpoznawania pokemonów
- **Bezpieczeństwo**: Szyfrowanie połączeń (HTTPS), bezpieczne przechowywanie haseł (bcrypt), ochrona przed podstawowymi atakami (SQL injection, XSS)
