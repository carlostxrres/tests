Vamos a planear una web para practicar exámenes de oposiciones, con Supabase y el stack que hemos usado últimamente (Typescript, React, ShadCn...). Lo alojaré en Vercel.

En sample-tables, tienes varios ejemplos de tablas. De hecho, los datos de exams.json, questions.json y units.json serán tal cual así cuando empecemos la app. Los otros dos son "mock data".

La app debería ser "instalable como app en el móvil" (es decir, que Chrome te pregunte si quieres tenerla en la pantalla de inicio; creo que tiene que ver con el manifest).

## Layout

Estas pestañas abajo, con gran área de toque, bien accesibles para el pulgar:

- Temario (/syllabus)
- Preguntas (/questions)
- Tests (/tests)
- Respuestas (/submissions)
- Ajustes (/settings)

## Pages

### /syllabus

La lista de `exams` y sus `units`.

### /syllabus/:id

El detalle de un examen. Se muestra:

- El `exam.name`.
- El temario (la lista de `units` para este examen, ordenados por `unit.number`). Dentro de cada `unit`, se muestra:
  - El `unit.number`.
  - El `unit.name`.
  - La cantidad de `questions` de ese unit. Es un link a algo como `/questions?unit=:unit.id`
  - La cantidad de `submissions` de ese unit.
  - El ratio de `submissions` correctas de ese unit. En gráfico (de tarta?)

### /questions

La lista de `questions` en una [Data Table](https://ui.shadcn.com/docs/components/base/data-table).

Columnas:

- El `exam` (sortable).
- El `unit.number` y `unit.name` (sortable).
- El `question.statement`.
- Ratio de `submissions` correctas (sortable).
- Cantidad total de `submissions` con esta `question.id` (sortable).
- Fecha y hora de la última `submission` (sortable).

Con filtros:

- Un input que filtra por `exam`, `unit.name`, y `question.statement`, quizás como [ComboBox](https://ui.shadcn.com/docs/components/base/combobox).
- Resultado (si `submission.choice` fue correcto, incorrecto, o null).
- Si tiene `submissions` o no, como .

Los filtros se sincronizan con URL query params.

### /questions/:id

Detalle de la pregunta. Se muestra:

- El `exam`.
- El `unit.number` y `unit.name`.
- El `question.statement`.
- Los `question.options`. La `question.correctOption` aparece destacada.
- El `question.explanation`.
- La cantidad de `submissions` de esa question. Es un link a algo como `/submissions?question=:question.id`.
- Si tiene `submissions`, un gráfico de cómo ha ido (to do: pensar qué podemos mostrar).

### /submissions

La lista de `submissions` en una [Data Table](https://ui.shadcn.com/docs/components/base/data-table).

Con las siguientes columnas:

- El `submission.timestamp` (como fecha y hora legibles) (sortable).
- El `submission.choice`, si fue correcto o incorrecto (o null, lo que significa que el usuario no respondió).
- El `exam` (sortable).
- El `unit.number` y `unit.name` (sortable).
- El `question.statement`.
- Row actions. Es un dropdown con:
  - Link a `/submissions/:id`

Con filtros:

- Un input que filtra por `exam`, `unit.name`, y `question.statement`, quizás como [ComboBox](https://ui.shadcn.com/docs/components/base/combobox).
- Resultado (si `submission.choice` fue correcto, incorrecto, o null).
- Intervalo de tiempo del `submission.timestamp` (con un [Date Range Picker](https://ui.shadcn.com/docs/components/base/date-picker#range-picker))

Los filtros se sincronizan con URL query params.

### /submissions/:id

- El `submission.timestamp` (como fecha y hora legibles).
- El `submission.choice` fue correcto o incorrecto (o null, lo que significa que el usuario no respondió).
- El `exam`.
- El `unit.number` y `unit.name`.
- El `question.statement`.
- Los `question.options`. La `question.correctOption` aparece destacada. La `submission.choice`, también (de otra forma).
- El `question.explanation`.

### /tests y /

Estas secciones:

- "Nuevo test": lleva a `/tests/new`
- "Tests a medias": lista de tests que están a medias (donde `test.end === null`), en una [Data Table](https://ui.shadcn.com/docs/components/base/data-table) con estas columnas:
  - El `test.name`, si lo tiene
  - Cuándo se empezó (`test.start`)
  - El tipo (`test.instantFeedback`)
  - Preguntas respondidas / Preguntas totales
  - Si `test.instantFeedback`, Preguntas acertadas / Preguntas totales
  - Número de unidades (`test.units`).
  - "Continuar". Es un botón que es un link a `tests/test.id`
  - Un dropdown menu, con las siguientes opciones:
    - "Terminar" (setea `test.end` al momento actual)
    - "Reempezar" (elimina las referencias de `test.submissions` y lleva a `tests/test.id`)
    - "Duplicar" (lleva a `/tests/new?` con los query params para crear uno igual)
    - "Eliminar" (elimina el test)
- "Tests terminados": lista de tests que están terminados (donde `test.end` tiene algo), en una [Data Table](https://ui.shadcn.com/docs/components/base/data-table) con estas columnas:
  - El `test.name`, si lo tiene
  - Cuándo se empezó (`test.start`)
  - Cuándo se terminó (`test.start`)
  - El tipo (`test.instantFeedback`)
  - Preguntas respondidas / Preguntas totales
  - Preguntas acertadas / Preguntas totales
  - Número de unidades (`test.units`).
  - "Ver detalle". Es un botón que es un link a `tests/test.id?questionIndex=-1`
  - Un dropdown menu, con las siguientes opciones:
    - "Reempezar" (elimina las referencias de `test.submissions` y lleva a `tests/test.id`)
    - "Duplicar" (lleva a `/tests/new?` con los query params para crear uno igual)
    - "Eliminar" (elimina el test)

### /tests/new

Un formulario multipágina.

- Selector de exams, quizás como un [Questionnaire](/docs/components/base/questionnaire). Validación: como mínimo uno.
- Selector de unidades, de los exams escogidos (para `test.units`), quizás como un [Questionnaire](/docs/components/base/questionnaire). Validación: como mínimo una.
- Cantidad máxima de preguntas, quizás como [Slider](https://ui.shadcn.com/docs/components/base/slider). Validación: como máximo, la cantidad de preguntas disponibles para las units seleccionadas. Como mínimo, 5.
- Si se debería mostrar el resultado de una pregunta al responderla, o al final del test (para `test.instantFeedback`).
- Nombre del test (se puede dejar en blanco).
- Submit.

Con esta información, al hacer submit, se crea un Test (como los del archivo tests-example.json).

```json
{
    "id": "8add465e-67a5-478b-96be-9737bb5e53ae", // random UUID
    "start": 1789586820915, // now
    "end": null,
    "name": "My title", // From the form, or null
    "instantFeedback": true, // From the form
    "units": [ // from the form
        "df204257-d0e2-4e14-984b-8fa1625a7325",
        "d0ebfcf3-a92c-4836-aa66-3a1fdf6c50c5",
        "cabb30db-6f87-4c18-b56c-c3bf85dca1b5",
        "d3a422b0-7f92-4cdc-a710-9d3c72548784"
    ],
    "questions": [ // chosen randomly from the selected units, sorted randomly
        "84fa291c-0a0c-457f-a27f-12e6f1bdf729",
        "e3c236a2-a6e2-40a5-95c4-b8eb3b24dd5a",
        "b6602e4b-4c58-43b4-a2fa-31dbdfcf2731",
        "113fecd6-da00-4742-b24b-19b76a1a5184",
        "66572079-915e-443f-b3e4-c4d452aa6be5"
    ],
    "submissions": []
}
```

### /tests/:id

- Header (fijo arriba)
  - El `exam.name` si lo tiene, cuándo se empezó, y si el test está terminado, cuándo se terminó
  - Preguntas respondidas / Preguntas totales, y si el test está terminado o tiene `test.instantFeedback`, Preguntas acertadas / Preguntas totales
  - Lista de preguntas (como números dentro de un grid de cuadrados). Las preguntas respondidas se marcan en cierto color. La pregunta mostrada actualmente en pantalla se muestra con un poco más de altura; con un transition con bounce. Si el test está terminado o tiene `test.instantFeedback`, las preguntas respondidas se muestran en color diferente en función de si es correcta o no. Cada cuadradito es además un link para scrollear a esa pregunta, tipo `/tests/:id?questionIndex=11`.
  - "Unidades". Abre un Drawer con el listado de `exam.units`, ordenados dentro de sus `exams`.
  - Dropdown menu
    - "Salir" (un link a `/tests/`)
    - Si el test no está terminado: "Terminar y salir" (setea `test.end` al momento actual)
    - "Reempezar"
    - "Duplicar" (lleva a `/tests/new?` con los query params para crear uno igual)
    - "Eliminar" (elimina el test, tras confirmación con Dialog) 
- Zona de preguntas: cada pregunta ocupa todo el espacio vertical de la pantalla, y tiene `scroll-snap-type: y mandatory;` (o en su defecto, son un [Carousel de orientación vertical](https://ui.shadcn.com/docs/components/base/carousel#orientation)). Cada vez que el usuario cambia de pregunta, se actualiza el query param, con algo como `/tests/:id?questionIndex=11`. Cada área de pregunta es un [Questionnaire](/docs/components/base/questionnaire) con:
  - El `question.statement`.
  - "Pregunta X de Y"
  - Los `question.options`, que el usuario puede seleccionar. Si está respondida y el test está terminado o tiene `test.instantFeedback`, la pregunta correcta aparece destacada.
  - Si está respondida, la fecha y hora en que se respondió (`submission.timestamp`).
  - Si está respondida y el test está terminado o tiene `test.instantFeedback`, la zona de feedback, con:
    - `question.explanation`
    - El `exam` y `unit` de la pregunta

- Después de la última pregunta, si el test no está terminado, hay otro elemento similar a una área de pregunta (también ocupa todo el espacio y tiene scroll snap); pero en este caso no es una pregunta, sino la pantalla final con un botón para "Terminar".

### /settings

- Danger zone: resetear todos los datos (solo resetea los datos del usuario; no los de exams, units, questions, ni su usuario y contraseña)
- Log out

## Fuera de scope

Descartados por ahora:

- Algún Easter Egg con mi cara (la app es para mi novia). Lo añadiremos cuando tengamos una primera versión que funcione.
- Extensive data visualization. Lo añadiremos cuando tengamos algo de datos acumulados.
- AI features.
- Temporizador.

## Stack

### Lucide Icons

For the icons.

Use icons everywhere.

### ShadCn

Use it extensivelly. Especially, make sure you use these components:

- [Accordion](https://ui.shadcn.com/docs/components/base/accordion)
- [Alert Dialog](https://ui.shadcn.com/docs/components/base/alert-dialog)
- [Badge](https://ui.shadcn.com/docs/components/base/badge)
- [Breadcrumb](https://ui.shadcn.com/docs/components/base/breadcrumb)
- [Button](https://ui.shadcn.com/docs/components/base/button)
- [Button Group](https://ui.shadcn.com/docs/components/base/button-group)
- [Calendar](https://ui.shadcn.com/docs/components/base/calendar)
- [Card](https://ui.shadcn.com/docs/components/base/card)
- [Carousel](https://ui.shadcn.com/docs/components/base/carousel)
- [Checkbox](https://ui.shadcn.com/docs/components/base/checkbox)
- [Combobox](https://ui.shadcn.com/docs/components/base/combobox)
- [Data Table](https://ui.shadcn.com/docs/components/base/data-table)
- [Date Picker](https://ui.shadcn.com/docs/components/base/date-picker)
- [Dialog](https://ui.shadcn.com/docs/components/base/dialog)
- [Drawer](https://ui.shadcn.com/docs/components/base/drawer)
- [Dropdown Menu](https://ui.shadcn.com/docs/components/base/dropdown-menu)
- [Empty](https://ui.shadcn.com/docs/components/base/empty)
- [Field](https://ui.shadcn.com/docs/components/base/field)
- [Input](https://ui.shadcn.com/docs/components/base/input)
- [Input Group](https://ui.shadcn.com/docs/components/base/input-group)
- [Item](https://ui.shadcn.com/docs/components/base/item)
- [Label](https://ui.shadcn.com/docs/components/base/label)
- [Marker](https://ui.shadcn.com/docs/components/base/marker)
- [Popover](https://ui.shadcn.com/docs/components/base/popover)
- [Progress](https://ui.shadcn.com/docs/components/base/progress)
- [Questionnaire](https://ui.shadcn.com/docs/components/base/questionnaire)
- [Select](https://ui.shadcn.com/docs/components/base/select)
- [Separator](https://ui.shadcn.com/docs/components/base/separator)
- [Skeleton](https://ui.shadcn.com/docs/components/base/skeleton)
- [Slider](https://ui.shadcn.com/docs/components/base/slider)
- [Spinner](https://ui.shadcn.com/docs/components/base/spinner)
- [Switch](https://ui.shadcn.com/docs/components/base/switch)
- [Toast](https://ui.shadcn.com/docs/components/base/toast)

Also, add [the ShadCn Skills](https://ui.shadcn.com/docs/skills).

### Tanstack Form

Quizás para el formulario de `/tests/new` y, quizás, para lo `/tests/:id`. Tenemos que pensar si merece la pena usarlo.

Buena integración con ShadCn: https://ui.shadcn.com/docs/forms/tanstack-form

Encaja con un formulario grande con varios pasos. De hecho tiene [un ejemplo oficial específico de Multi-Step Wizard](https://tanstack.com/form/latest/docs/framework/react/examples/multi-step-wizard).

### ReCharts

For the charts we might add.

### Theming

Pensemos en un buen [tema](https://ui.shadcn.com/docs/theming).

### Typeset

Install shadcn/typeset in this project.

Typeset is a single stylesheet that styles rendered markdown: wrap the output in a `typeset` container and everything inside (headings, lists, tables, code, blockquotes, math) is styled. Everything outside is untouched.

1. Download https://ui.shadcn.com/typeset.css and save it as typeset.css next to the project's main CSS file (where Tailwind is imported). If the file already exists, replace it with the downloaded copy.

2. Import it in the main CSS file, after the Tailwind import:

@import "./typeset.css";

3. Load the fonts in the root layout and update the HTML element:

// app/layout.tsx
import { Geist, Figtree, Geist_Mono } from "next/font/google"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

<html className={`${geist.variable} ${figtree.variable} ${geistMono.variable}`}>

4. Add this preset to the main CSS file, after the typeset import. If a class named .typeset-docs already exists, update its values in place. Leave any other typeset-* presets untouched: they are separate surfaces:

.typeset-docs {
  --typeset-font-body: var(--font-geist);
  --typeset-font-heading: var(--font-figtree);
  --typeset-font-mono: var(--font-geist-mono);
  --typeset-size: 15px;
  --typeset-leading: 1.75;
  --typeset-flow: 1.25em;
}

5. Do not apply the class anywhere yet. Search the project for surfaces that render markdown or rich content: react-markdown, Streamdown, or MDX components, dangerouslySetInnerHTML with parsed markdown, prose classes, CMS content renderers. Present the candidates you find as a short list and ask the user which surface should use typeset. Then wrap only the surface they pick:

<div className="typeset typeset-docs max-w-[37em]">
  {content}
</div>

If the picked surface already has its own typography (a prose class, styled markdown components), list those styles and let the user decide what to remove before wrapping.

Notes:

- To exclude an embedded component from typeset styles, add the not-typeset class or the data-not-typeset attribute to it.
- Verify on the surface the user picked: headings, lists, tables, and code inside the container should be styled with no classes on the content itself.
- Docs: https://ui.shadcn.com/docs/typeset