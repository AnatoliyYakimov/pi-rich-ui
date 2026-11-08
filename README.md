# Pi Rich UI 0.4 — нативный inline ANSI

XML/JSX-подобные блоки **внутри обычных ответов Pi**: Rich Table, числовой и текстовый Diff,
Sequence, Tree, Timeline, адаптивная компоновка и Braille-графики. Без браузера, PNG,
fullscreen, сетевых запросов и дополнительных runtime-зависимостей помимо Pi.

Модель задаёт данные и семантику, рендерер — компоновку и цвета активной темы Pi.
Это ограниченный декларативный XML, **не React/JavaScript runtime**. Кнопок, мыши,
раскрытия по клику и локальных слайдеров в этой версии нет.

## Установка / обновление с 0.3

Сохраните локальные изменения расширения перед обновлением. Архив содержит папку `pi-rich-ui`:

```bash
mkdir -p ~/.pi/agent/extensions
unzip -o pi-rich-ui-v0.4.zip -d ~/.pi/agent/extensions
```

В Pi:

```text
/reload
/rich-ui demo
/rich-ui status
```

Демонстрации без обращения к модели:

```text
/rich-ui table
/rich-ui diff
/rich-ui sequence
/rich-ui tree
/rich-ui timeline
/rich-ui layout
/rich-ui charts
/rich-ui palette
/rich-ui prompt
```

Каждая демонстрация добавляет display-only запись истории. Не подключайте ту же копию
одновременно через каталог extensions и `pi -e`. `npm install` не нужен. Старые графические
зависимости от 0.2 не используются. `PI_RICH_UI_RENDER=auto/image` приводит к ANSI с уведомлением.

Требуется Pi с `registerMarkdownTransformer()`. Node.js — согласно требованиям вашего Pi
(в текущем upstream — >=22.19.0). В этой среде unit-тесты выполнялись на Node 22.16.0;
**настоящий Pi здесь не установлен**, его terminal/session-поведение не проверено.

## Важная граница интеграции

Публичный Markdown transformer возвращает **строку**, не компонент. Для вывода без оболочки
code fence используется обратимый runtime-адаптер внутреннего `Markdown.renderToken`.
Файлы Pi не модифицируются; при несовместимости адаптера включается текстовый fallback.
Это зависимость от внутреннего API, а **не обещание совместимости с любой версией Pi**.

```bash
cd ~/.pi/agent/extensions/pi-rich-ui
npm run test:host
# Либо передать путь к настоящему pi-tui вашей установки:
npm run test:host -- /path/to/pi-tui/dist/index.js
```

Проверка использует тот же модуль Pi, а не устанавливает собственную вторую копию.
Подробнее: [интеграция](docs/INTEGRATION.md), [результат host-проверки здесь](docs/HOST-TEST.txt).

## Синтаксис

В ответах модели блоки идут **на отдельных строках вне code fence**. В документации они
показаны как код намеренно. Старые теги 0.3 поддерживаются. Добавлены составные имена
`Table.Row`, `Table.Cell`, `Sequence.Step`, `Tree.Item`, `Timeline.Step`, `Chart.Rule`.
`Row` остаётся layout-компонентом и не заменяет `Table.Row`.

```xml
<Row>
  <Metric label="RPS · пример" value={600} tone="info"/>
  <Diff label="p99 · пример" before={600} after={120} unit="ms" good="down"/>
</Row>
```

Атрибуты: строки, числа, boolean; допустимы `value={8}`, `tone="success"`, `stats`.
Выражения `{a+b}`, массивы, обработчики событий, HTML/CSS и загрузка внешних ресурсов
запрещены. В тексте экранируйте `&lt;`, `&amp;`; для кавычек в атрибутах — `&quot;`.
Открывающий/закрывающий теги должны совпадать по регистру и полному имени.

## Rich Table

Короткая форма:

```xml
<Table headers="Service,RPS">
  <Tr values="API,600"/>
  <Tr values="Orders,450"/>
</Table>
```

Расширенная:

```xml
<Table title="Пример нагрузки">
  <Table.Column label="Сервис" minWidth={14}/>
  <Table.Column label="p99" unit="ms" warnAbove={100} errorAbove={200}/>
  <Table.Column label="Загрузка" format="percent" bar max={1}/>
  <Table.Row>
    <Table.Cell>Orders</Table.Cell>
    <Table.Cell value={180}/>
    <Table.Cell value={0.74} tone="warning"/>
  </Table.Row>
</Table>
```

Числовые колонки выравниваются вправо; доступны `align="left|center|right"`, `digits`,
`unit`, `format="number|percent"`, `group={false}`, `minWidth`, `maxWidth`.
В процентах `0.25` означает `25%`. `value` задаёт форматируемое числовое значение;
обычный текст ячейки, например `001`, сохраняется как текст, без удаления ведущих нулей.

Пороги `warnAbove/errorAbove/warnBelow/errorBelow` сравниваются строго (`>`/`<`).
Ошибка важнее предупреждения. Пороговое состояние имеет и цвет, и маркер `!`/`✗`.
Приоритет цвета: cell → row → порог → column → контейнер. Явный цвет cell/row
заменяет пороговую подсветку и её маркер. Это намеренный override, не автоматическая оценка.

В ячейки можно вкладывать Badge, Span/Icon, Sparkline и другие блоки. Мини-бары включаются
через `bar` с `min/max`; выход за диапазон явно помечается. `separators` добавляет линии
между строками. В узком окне таблица переходит в записи «колонка: значение»; можно
принудительно выбрать `layout="stacked"`. `headers`/`values` разделяются запятыми или `|`;
это **не CSV**. Для значений с разделителями используйте явные ячейки.

`Tr/Th/Td` совместимы с 0.3; алиасы: `Table.Row/Table.Head/Table.Cell`, `Column/Table.Column`.
До 12 колонок и 100 строк, с учётом общего лимита узлов. Лишние ячейки сверх объявленной
схемы отклоняются, недостающие отображаются как `—`.

## Diff

Для метрик:

```xml
<Diff label="p99 · пример" before={600} after={120} unit="ms" good="down"/>
```

Показываются before → after, абсолютная разница и процент `Δ / |before| × 100`.
При нулевой базе процент — `n/a`; при overflow также `n/a` с пояснением.
По умолчанию `good="neutral"`: рост не считается успехом. `good="up|down"` задаёт
желаемое направление и текст improved/regressed. Числовой вывод Diff округляется до
трёх десятичных знаков; для точных исходных дробных значений используйте таблицу.

Для конфигураций и кода:

```xml
<Diff title="Пример изменения" context={2}>
  <Before>workers: 8
retries: 3</Before>
  <After>workers: 12
retries: 3
idempotency: required</After>
</Diff>
```

Детерминированный построчный LCS, номера строк, сохранение отступов, маркеры `−/+` и
сворачивание далёкого неизменённого контекста с явным счётчиком. До 160 строк на сторону.
`mode="auto"` использует split от 88 колонок, иначе unified. `mode="split"` разрешает
split от 60, ниже всё равно unified. `mode="unified"` всегда одноколоночный.
`beforeLabel/afterLabel` меняют подписи. Before/After содержат только буквальный текст;
XML внутри него экранируется. Одна внешняя layout-пустая строка удаляется.

## Sequence

```xml
<Sequence actors="API,DB,Relay,Kafka">
  <Step from="API" to="DB" label="Запись + outbox"/>
  <Step from="DB" to="API" label="Commit" kind="return" tone="success"/>
  <Step from="Relay" to="DB" label="Чтение outbox"/>
  <Step from="Relay" to="Kafka" label="Publish" kind="async" tone="purple"/>
  <Note over="Relay,Kafka">Повторная доставка возможна.</Note>
</Sequence>
```

Lifelines, стрелки в обе стороны, self-call при `from=to`, возвраты пунктиром,
заметки и номера сообщений. Узкое окно → хронологический список с точными endpoints.
`layout="list"` включает его явно. До 8 участников и 64 сообщений/заметок.

Вместо `actors` можно задать `<Actor id="db" label="PostgreSQL"/>`. Смешивать формы нельзя.
Без объявлений участники берутся из from/to в порядке первого появления. При явном списке
неизвестный endpoint — ошибка, а не новый придуманный узел. Note принимает `over="A,B"`.
Это объясняющая схема, не полный UML: activation bars, alt/loop/par в 0.4 отсутствуют.

## Tree и Timeline

```xml
<Tree label="Пример модулей">
  <Item label="domain"><Item label="Order.kt"/></Item>
  <Item label="infra" tone="purple">
    <Item label="OutboxRelay.kt" detail="Фоновая доставка"/>
  </Item>
</Tree>

<Timeline title="Пример этапов">
  <Step label="Подготовить" status="done"/>
  <Step label="Проверить" status="active" detail="Сравнение результатов"/>
  <Step label="Переключить" status="blocked" detail="Нужно согласование"/>
</Timeline>
```

Tree переносит подписи, сохраняет ветки и detail. `icon`, `tone`, `bold` задаются узлу.
`collapsed` — **статическое** сворачивание, с количеством скрытых потомков, не интерактивность.
При глубокой вложенности в узком окне отступ заменяется аннотацией глубины `…N`.
Алиасы: Item/Tree.Item/Tree.Node/Node внутри Tree.

Timeline автоматически меняет горизонтальный вид на вертикальный. `direction="TB"`
всегда вертикальный. Step поддерживает `label`, `detail`, `date/time`, дочерние Text и др.
Статусы: done, active, pending, blocked, error, skipped; отображаются символом, словом и цветом.
Без status рендерер не приписывает этапу состояние. До 40 этапов.
Подписи данных берутся из XML; служебные обозначения (например, `[done]`, `improved`) пока английские.

## Адаптивная компоновка

`Row` учитывает intrinsic/min/ideal размеры содержимого: короткий Badge не обязан получать
половину экрана. При нехватке места элементы переносятся **группами**, а не обязательно по одному.
`wrap={false}` сохраняет старое поведение: если весь ряд не помещается, он становится колонкой.
`minWidth/maxWidth/flex` задаются детям; `flex={0}` не распределяет оставшееся место сверх ideal.
`width` — предпочтение, не жёсткая ширина. `align="start|center|end"`,
`valign="stretch|top|center|bottom"`, `gap`, `rowGap` управляют выравниванием.

Grid: `cols/columns` 1–6, стабильные ширины колонок, `minWidth`, `gap`, `rowGap`.
Последняя неполная строка не растягивает карточку на весь экран.
`<GridItem span={2}>...</GridItem>` занимает несколько треков; span уменьшается при resize.
Соседние непосредственные Card/Box растягиваются до одинаковой высоты. Обёрнутые в GridItem
карточки внутри себя не растягиваются автоматически по высоте соседей.

`density="compact|normal|spacious"` на контейнере наследуется вложенными компонентами и
меняет стандартные отступы/интервалы. Явные padding/gap имеют приоритет.

## Braille-графики

```xml
<Chart label="Задержка · пример" unit="ms" height={5}
       x="0,1,2,5,9" nice stats>
  <Series label="p50" values="12,18,null,20,16" tone="cyan"/>
  <Series label="p99" values="30,48,35,52,40" tone="purple"/>
  <Rule value={50} label="SLO" tone="warning"/>
</Chart>
```

Chart и Sparkline используют Braille 2×4 точки на ячейку. До 4 серий × 512 сэмплов;
конечные значения в пределах ±1e15. `null/_` разрывает линию. Пустые CSV-поля отклоняются.
По умолчанию ось X — индекс: короткая серия не растягивается до длины длинной.
`x` задаёт общие строго возрастающие числовые координаты; их число равно максимальной
длине серии. Timestamp-строки не разбираются, но можно передавать числовое время/смещение.
`start/end` меняют только подписи краёв оси.

`nice` округляет автоматические границы шкалы, но не заданные min/max.
`zero={false}` исключает обязательный ноль из автоматического диапазона.
`zeroLine={false}` отдельно выключает нулевую линию. `grid={false}` скрывает сетку.
`interpolate="linear|step"` — на Chart или Series; `stroke="dash"` — на Series.
Никаких сглаживающих сплайнов или экстраполяции через пропуски.

До 4 `<Rule value label tone>`: пороги с легендой, не расширяющие диапазон автоматически.
Порог за границами подписывается как outside scale. `stats` показывает min/max/last
наблюдаемых значений (не обрезанных до min/max), компактно округляя их подписи.
`last` — последнее не-null наблюдение, не обязательно последний индекс.
При пересечении серий в одной терминальной ячейке используется нейтральный цвет с `+ overlap`.
Пороги и нулевая линия — фоновый слой: точки данных в той же ячейке имеют приоритет.

`layout="stacked"` разделяет серии, сохраняя общую шкалу; NO_COLOR делает это автоматически.
На узком экране сохраняются подписи всех серий, диапазон, пороги и включённая статистика.
На минимальной высоте несколько уровней могут попасть в одну символьную строку — это ограничение
сетки, а не изменение данных. Точные значения лучше дублировать таблицей или метрикой.

## Цвета, прежние компоненты и настройки

Роли: `success/error/warning/info/accent/purple/cyan/muted/text/dim/border`.
Алиасы: `green/red/yellow/blue/gray`, а также positive/negative/orange/violet/teal и др.
`tone` важнее `color`. Роли разрешаются через тему Pi; это не гарантированные RGB.
Фон терминала не перерисовывается. Unicode-иконки встроены, Nerd Fonts не требуются.

Прежние компоненты сохранены: UI, Box/Card, Row/Col/Grid/GridItem, Text/Title/Caption,
Span, Icon, Badge, Divider, Spacer, Metric, Progress, Flow/Step, Graph/Node/Edge,
Bars/Bar, Chart/Series, Sparkline, Table/Tr/Th/Td, List/Item, Code.

```bash
PI_RICH_UI_RENDER=ansi pi    # default
PI_RICH_UI_RENDER=text pi    # public hook + plain code fence, без native adapter
PI_RICH_UI_PROMPT=0 pi       # без инъекции инструкции
NO_COLOR=1 pi               # без цветов/bold, но Unicode/Braille остаются
```

`PI_RICH_UI_COLORS=16|256|truecolor|none|auto` управляет fallback-палитрой/CLI-превью;
активная тема Pi имеет приоритет, кроме none. NO_COLOR (даже пустой) и TERM=dumb отключают
SGR-стили. Для Braille нужен шрифт с соответствующими символами.

## Системный промпт, история и безопасность

`lib/prompt.mjs`: **1851 символ**, каталог тегов и шесть небольших примеров. Это число символов,
не оценка токенов: она зависит от модели. `before_agent_start` добавляет инструкцию один раз
в promptGuidelines или, для старого API, дополняет systemPrompt. Новое сообщение истории
не создаётся. В non-TUI режиме инъекция отключена.

Исходный XML сохраняется в ответе/истории, трансформация display-only. Обрабатывается
assistant, но не user/thinking. Обычный Markdown и fenced-примеры сохраняются.
Незавершённый streaming-блок временно показывает Rendering visual…; готовый рендерится целиком.
При resize/восстановлении истории используется исходный XML. HTML export не получает этот рендерер.

Парсер не использует eval/Function/DOM. OSC/CSI/control/bidi-команды из текстовых данных удаляются.
Нет работы с сетью, shell или файловыми путями из XML. Лимиты: 24 000 символов на блок,
300 XML-узлов, глубина 20, ширина до 240 колонок, высота 400 строк; превышение высоты помечается.
На очень узком терминале или слишком большом документе полное содержимое может не поместиться:
разбивайте его на несколько блоков. Невалидный блок остаётся исходным текстом/fenced XML;
он не исправляется автоматически и не исполняется.

## Проверка и материалы

```bash
npm test
npm run check
npm run preview -- --width 96
npm run preview -- --file examples/sequence.xml --width 80
npm run preview -- --file examples/table.xml --plain --width 40
npm run bench
npm run test:host
# Только после просмотра намеренных изменений:
npm run snapshots:update
```

В архиве есть исходники, примеры каждого компонента, unit/integration doubles, 24 golden
snapshots (40/80/120), width-sweep 1–160, проверки Unicode/ANSI, стриминга, валидации,
наследования темы, промпта и жизненного цикла адаптера.

`docs/TEST-RESULTS.txt` — фактический протокол этой сборки, `docs/CHECK-RESULTS.txt` — синтаксис,
`docs/BENCHMARK.json` — синтетический замер, **не** задержки настоящего Pi.
`docs/preview-*.txt` — вывод без цветов; `docs/preview-*.ansi` можно просмотреть через `cat`.
[Галерея](docs/GALLERY.md), [изменения](CHANGELOG.md).

Первичные источники интеграции, сверены 2026-11-08:
- https://pi.dev/docs/latest/extensions
- https://pi.dev/docs/latest/themes
- https://raw.githubusercontent.com/earendil-works/pi/main/packages/tui/src/components/markdown.ts
- https://raw.githubusercontent.com/earendil-works/pi/main/packages/tui/package.json

Зависимости и шрифты в архив не включены. Локальные тесты не заменяют host-проверку
на вашей установленной версии Pi.
