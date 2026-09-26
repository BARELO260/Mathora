# CalcPro — Calculadora científica con derivadas, integrales y gráficas

Proyecto Android nativo (Kotlin + Jetpack Compose + Material 3), listo para abrir
en Android Studio.

## Qué incluye

- **Calculadora básica**: suma, resta, multiplicación, división, porcentaje.
- **Calculadora científica**: sin, cos, tan, ln, log, raíz, potencias, factorial, π, e, abs, exp.
- **Cálculo simbólico**:
  - Derivadas: motor propio que aplica reglas de suma, producto, cociente, cadena,
    potencia general, trigonométricas, exponenciales y logarítmicas, con
    simplificación automática del resultado.
  - Integrales: antiderivada simbólica para los patrones más comunes (potencias,
    sumas, múltiplos constantes, sin/cos/exp, 1/x) y, cuando no hay forma elemental
    simple, integración numérica (Simpson compuesto) para integrales definidas.
- **Graficador**: dibuja f(x) sobre un plano cartesiano con cuadrícula adaptativa,
  pan (arrastrar) y zoom (pellizcar), usando Canvas de Compose.
- **UI moderna**: Material You (color dinámico en Android 12+), modo claro/oscuro
  automático, navegación inferior entre los 4 modos.

## Estructura

```
app/src/main/java/com/calcpro/app/
  MainActivity.kt
  math/              -> Expr.kt, ExpressionParser.kt, Evaluator.kt,
                         Differentiator.kt, Integrator.kt  (motor matemático)
  ui/theme/          -> Color.kt, Type.kt, Theme.kt
  ui/components/     -> CalculatorButton.kt
  ui/screens/        -> BasicCalculatorScreen.kt, ScientificCalculatorScreen.kt,
                         CalculusScreen.kt, GraphScreen.kt
  ui/MainScreen.kt
  viewmodel/         -> CalculatorViewModel.kt
```

## Cómo compilarlo

1. Instala **Android Studio** (versión Koala/2024.1 o más reciente): https://developer.android.com/studio
2. Abre la carpeta `CalcPro` como proyecto ("Open" → selecciona la carpeta raíz).
3. Deja que Gradle sincronice (descargará automáticamente el SDK/dependencias la
   primera vez; necesitas conexión a internet).
4. Conecta un dispositivo o usa un emulador y pulsa **Run ▶**.

No se necesita ningún paso adicional: el proyecto ya usa Compose + Material 3 y
las versiones de Gradle/Kotlin/AGP indicadas son estables a la fecha.

## Cómo publicarlo en Google Play

1. **Cambia el `applicationId`** en `app/build.gradle.kts` por uno único tuyo
   (ej. `com.tuempresa.calcpro`) — no puede coincidir con otra app publicada.
2. **Genera un ícono real**: reemplaza `ic_launcher_foreground.xml` y el color en
   `colors.xml`, o usa Android Studio → botón derecho en `res` → New → Image Asset
   para generar un set de íconos completo a partir de un PNG/logo tuyo.
3. **Firma la app**: Android Studio → menú *Build* → *Generate Signed Bundle / APK*
   → elige **Android App Bundle (.aab)** → crea un nuevo keystore (guárdalo bien,
   lo necesitarás para todas las actualizaciones futuras) → build en modo *release*.
4. **Crea una cuenta de desarrollador** en Google Play Console
   (https://play.google.com/console) — tiene un pago único de registro (25 USD).
5. **Crea la ficha de la app**: título, descripción, capturas de pantalla (puedes
   tomarlas ejecutando la app en un emulador), ícono de 512x512, gráfico de
   funciones de 1024x500, categoría (Herramientas/Educación), política de
   privacidad (obligatoria aunque la app no recolecte datos — puedes alojar un
   texto simple en cualquier página web o Google Sites).
6. **Sube el .aab** generado en el paso 3 a una pista (Internal testing primero es
   recomendable), completa el cuestionario de clasificación de contenido y de
   seguridad de datos, y envía a revisión.
7. La revisión de Google suele tardar de horas a pocos días para apps nuevas.

## Extensiones sugeridas (no incluidas todavía)

- Historial persistente (Room/DataStore) — ya existe `history` en el ViewModel,
  solo falta guardarlo en disco.
- Modo "resolver ecuaciones" (encontrar raíces, ej. bisección/Newton-Raphson).
- Conversor de unidades.
- Más de una función graficada a la vez, con colores distintos.
- Tests unitarios para `Differentiator` e `Integrator` (recomendado antes de
  publicar, para verificar casos límite).
