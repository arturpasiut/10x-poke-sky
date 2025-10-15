<user_journey_analysis>

1. Ścieżki użytkownika: eksploracja jako gość (wyszukiwarka, czat AI), próba dodania do ulubionych, przejście do logowania, rejestracja nowego konta z potwierdzeniem e-mail, logowanie istniejącego konta, odzyskiwanie hasła poprzez link resetujący, powrót do pierwotnej aktywności po zalogowaniu.
2. Główne podróże i stany: tryb niezalogowany (przeglądanie publiczne vs. akcje wymagające auth), proces logowania (formularz, walidacja, sukces/błąd), proces rejestracji (formularz, walidacja, wysyłka maila, weryfikacja), proces resetu hasła (żądanie maila, ustawienie nowego hasła), stan zalogowany (powrót do docelowej strony, zarządzanie ulubionymi, wylogowanie).
3. Punkty decyzyjne: poprawność danych logowania, wybór resetu hasła po błędzie, poprawność danych rejestracyjnych, ważność linku weryfikacyjnego w mailu, powodzenie resetu hasła (token), decyzja o wylogowaniu.
4. Cel stanów: tryb niezalogowany umożliwia dostęp do funkcji publicznych; formularze logowania/rejestracji zbierają dane i raportują błędy; stany walidacji determinują przebieg; stany wysyłki maila informują o konieczności akcji poza aplikacją; stan zalogowany przywraca użytkownika do wcześniej wybranej funkcji (np. ulubione) i umożliwia obsługę konta; wylogowanie kończy sesję i wraca do trybu gościa.
   </user_journey_analysis>

<mermaid_diagram>

```mermaid
stateDiagram-v2
  [*] --> Start
  Start --> Niezalogowany: Otwiera aplikację

  state "Tryb niezalogowany" as Niezalogowany {
    [*] --> PrzegladaniePubliczne
    PrzegladaniePubliczne --> PozostajeGościem: Korzysta z wyszukiwarki i czatu AI
    PrzegladaniePubliczne --> ProbaUlubionych: Dodaje Pokémona do ulubionych
    ProbaUlubionych --> WejscieLogowania: Wymagane logowanie
    PrzegladaniePubliczne --> WejscieLogowania: Klik „Zaloguj się”
    PrzegladaniePubliczne --> WejscieRejestracji: Klik „Zarejestruj się”
    PozostajeGościem --> [*]
  }

  WejscieLogowania --> Logowanie
  WejscieRejestracji --> Rejestracja

  state "Proces logowania" as Logowanie {
    [*] --> FormularzLogowania
    FormularzLogowania --> WalidacjaLogowania: Zatwierdza formularz
    WalidacjaLogowania --> if_login
    state if_login <<choice>>
    if_login --> BledneLogowanie: Dane niepoprawne
    if_login --> LogowanieOK: Dane poprawne
    BledneLogowanie --> FormularzLogowania: Korekta danych
    BledneLogowanie --> ResetCTA: Wybiera „Zapomniałem hasła”

    state "Odzyskiwanie hasła" as ResetHasla {
      [*] --> FormularzReset
      FormularzReset --> WalidacjaReset: Wysyła prośbę
      WalidacjaReset --> ResetPotwierdzenie: Link resetujący wysłany
      ResetPotwierdzenie --> OczekiwanieMaila: Sprawdza skrzynkę pocztową
      OczekiwanieMaila --> OtwarcieLinku: Otwiera link resetu
      OtwarcieLinku --> FormularzNoweHaslo: Ustawia nowe hasło
      FormularzNoweHaslo --> if_token
      state if_token <<choice>>
      if_token --> ResetNiepowodzenie: Token nieprawidłowy lub wygasł
      ResetNiepowodzenie --> FormularzReset: Ponawia prośbę
      if_token --> ResetSukces: Hasło zmienione
      ResetSukces --> FormularzLogowania: Powrót do logowania
    }

    LogowanieOK --> PotwierdzenieLogowania: Sesja ustanowiona
  }

  PotwierdzenieLogowania --> Zalogowany: Przekierowanie na cel (np. ulubione)

  state "Proces rejestracji" as Rejestracja {
    [*] --> FormularzRejestracji
    FormularzRejestracji --> WalidacjaRejestracji: Zatwierdza formularz
    WalidacjaRejestracji --> if_signup
    state if_signup <<choice>>
    if_signup --> BlednaRejestracja: Dane niepoprawne / konto istnieje
    if_signup --> RejestracjaWyslana: Konto utworzone
    BlednaRejestracja --> FormularzRejestracji: Korekta danych
    RejestracjaWyslana --> MailPotwierdzajacy: Wysyłka maila aktywacyjnego
    MailPotwierdzajacy --> CzekaPotwierdzenie: Użytkownik sprawdza skrzynkę
    CzekaPotwierdzenie --> if_confirm
    state if_confirm <<choice>>
    if_confirm --> PotwierdzenieUdane: Link potwierdzony
    if_confirm --> PotwierdzenieNieudane: Link wygasł/błędny
    PotwierdzenieNieudane --> CzekaPotwierdzenie: Prosi o nowy link
    PotwierdzenieUdane --> Autologowanie: Sesja zalogowana
    Autologowanie --> Zalogowany: Pierwsze logowanie po rejestracji
  }

  state "Doświadczenie zalogowanego" as Zalogowany {
    [*] --> PowrotDoAkcji: Kontynuuje przerwaną czynność
    PowrotDoAkcji --> ZarzadzanieUlubionymi: Dodaje/usuwa ulubione
    ZarzadzanieUlubionymi --> PowrotDoAkcji
    PowrotDoAkcji --> Wylogowanie: Wybiera „Wyloguj”
    Wylogowanie --> [*]
  }

  Zalogowany --> Niezalogowany: Sesja wygasła lub wylogowanie
  Niezalogowany --> [*]
```

</mermaid_diagram>
