# Otoczka wypukła – aplikacja w przeglądarce

Interaktywna aplikacja webowa umożliwiająca dodawanie punktów oraz wyznaczanie i wizualizację ich **otoczki wypukłej** przy użyciu klasycznych metod geometrii obliczeniowej.

## Technologie

- **HTML5 + Canvas** – renderowanie siatki i punktów
- **Vanilla JavaScript** – logika geometrii i interakcje użytkownika
- **Tailwind CSS** – stylowanie komponentów UI

## Algorytm

Do wyznaczania otoczki wypukłej zastosowano:

- **Algorytm monotonicznego łańcucha Andrewsa** (`O(n log n)`)
- **Test orientacji** na podstawie **iloczynu wektorowego**  
  → określa, czy trzy punkty tworzą skręt w lewo, w prawo czy są współliniowe

## Funkcje

- Dodawanie punktów kliknięciem lub ręcznie (X, Y)
- Automatyczne przeliczanie otoczki wypukłej po każdej zmianie
- Możliwość usuwania punktów
- Wizualizacja otoczki wypukłej na zielono
- Siatka kartezjańska dla lepszej orientacji
- Obsługa zaznaczonego punktu
