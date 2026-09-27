# Mathora

Calculadora matemática en español con interfaz móvil y plataforma Android nativa basada en Capacitor.

## Desarrollo web

Requiere Node.js 20 o posterior.

```sh
npm ci
npm run start
npm run test
npm run build
```

La PWA puede instalarse desde un navegador Android compatible servida por HTTPS. La interfaz y los motores matemáticos se precargan para que los cálculos también estén disponibles offline. El historial, tema y memoria se guardan en el dispositivo; las expresiones no se envían a un servicio externo.

## Proyecto Android

`android/` contiene el proyecto nativo con ID `com.mathora.calculator`, orientación vertical, `minSdk 24`, `compileSdk 36` y `targetSdk 36`. Se configura con Capacitor 8 y no declara permisos de aplicación.

Requisitos locales: Android Studio, JDK 21 y Android SDK Platform 36. En Android Studio selecciona ese JDK como **Gradle JDK**.

```sh
npm ci
npm run android:sync
npm run android:compile
npm run android:open
```

Para publicar, usa **Build > Generate Signed Bundle / APK > Android App Bundle** en Android Studio y firma el bundle con una clave de carga propia o la clave de carga que configures en Play Console. Para generar un bundle firmado por línea de comandos, define `MATHORA_UPLOAD_STORE_FILE`, `MATHORA_UPLOAD_STORE_PASSWORD`, `MATHORA_UPLOAD_KEY_ALIAS` y `MATHORA_UPLOAD_KEY_PASSWORD`. El repositorio no guarda contraseñas ni claves.

El proyecto apunta a API 36 para cumplir el requisito de Google Play vigente desde el 31 de agosto de 2026. Antes de subirlo, confirma que el ID de aplicación esté disponible para tu cuenta, completa la ficha y las declaraciones de Play Console, y sube el AAB firmado.

## Funciones y alcance

- Operaciones aritméticas, notación científica, raíces, potencias, factoriales, números complejos, trigonometría directa e inversa, funciones hiperbólicas, `log`, `log10`, `ln`, exponenciales, MCD y MCM. Grados/radianes configurables.
- Historial local reutilizable, memoria, entrada de texto y copiar/pegar.
- Gráficas de varias funciones con desplazamiento, zoom y coordenadas.
- Álgebra y cálculo para ecuaciones, sistemas, desigualdades polinómicas de una variable, derivadas parciales, integrales, límites, simplificación, factorización, expansión, sumatorias finitas y raíces numéricas por intervalo.
- Herramientas para porcentajes, fracciones/decimales, regla de tres, probabilidad simple, estadísticas, combinatoria, conversión de bases 2–36, áreas y perímetros planos, áreas superficiales y volúmenes de sólidos, y trigonometría de triángulos rectángulos; determinantes y productos matriciales de hasta 10 × 10; suma, resta, productos punto y vectorial, magnitud y ángulo entre vectores; conversiones de longitud, masa, tiempo, volumen y temperatura.

El motor de álgebra simbólica es Nerdamer; no garantiza una solución cerrada para toda expresión, sistema, integral o límite. Las desigualdades admiten polinomios de una variable y las sumatorias tienen un límite de 10 001 términos. El solucionador numérico de raíces requiere un intervalo donde la función cruce cero. Cuando un cálculo no es compatible, Mathora muestra el error en vez de inventar una respuesta.

Consulta `PLAY_RELEASE_CHECKLIST.md` para los pasos pendientes de la publicación. La política de privacidad incluida en `public/privacy-policy.html` es un borrador y requiere el nombre legal y correo de contacto antes de publicarse.
