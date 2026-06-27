# Бриф для Claude: собрать **IPA** из репозитория `Gallery-for-Iphone`

> Это задание для Claude (лучше всего — **Claude Code**, запущенный в папке локального клона репозитория). Цель — превратить React/Vite **веб-приложение** в **нативное iOS-приложение, из которого собирается устанавливаемый файл `.ipa`**. Не PWA, не «ярлык на экран» — именно нативная обёртка, дающая IPA.

---

## 0. Роль и правила выполнения

Ты — Claude с доступом к терминалу и файловой системе в локальном клоне `LevIvaaa/Gallery-for-Iphone`.

- Выполняй шаги из **§4** по порядку, проверяя результат каждого шага (раздел «Проверка»).
- Шаги из **§5 НЕ выполняй** — это ручные действия человека (регистрация в сервисах, облачная сборка, установка на телефон). Ты их только подготавливаешь кодом и в конце напоминаешь человеку.
- Если команда или имя пакета в установленной версии отличается — сверься с `--help` и адаптируй, не выдумывай.
- В конце — коммит и пуш, затем краткий отчёт человеку: что сделано и что осталось вручную.

---

## 1. Контекст: что уже есть в репозитории

- Стек: **React 18 + TypeScript + Vite**. Приложение — копия «Фото» iOS в стиле Liquid Glass (сетка, просмотр, поиск, альбомы, избранное).
- `npm run build` проходит, результат в `dist/`.
- Есть автодеплой на **GitHub Pages** (`.github/workflows/deploy.yml`), поэтому в `vite.config.ts` стоит `base: "/Gallery-for-Iphone/"`.
- Нативной обёртки (Capacitor, папки `ios/`) **нет**. Иконка приложения не подключена. Облачной iOS-сборки нет.

---

## 2. Выбранный подход (лучший вариант) и обоснование

**Capacitor → неподписанный IPA на Codemagic → установка через Sideloadly (бесплатный Apple ID).**

- **Capacitor** оборачивает уже готовую веб-сборку (`dist/`) в нативный iOS-проект Xcode. Переиспользуется **100% существующего React-кода** — ничего переписывать. (Альтернативы React Native/Flutter потребовали бы переписать приложение целиком; для готового Vite-проекта Capacitor оптимален.)
- **Codemagic** компилирует iOS-проект на облачном Mac (бесплатный тариф ~500 минут/мес), поэтому физический Mac не нужен.
- Сборку делаем **неподписанной**, а подпись ставит **Sideloadly** бесплатным Apple ID уже при установке. Это даёт настоящий установленный IPA **без оплаты $99/год**. Ограничения бесплатной подписи: приложение живёт 7 дней (с автопродлением), одновременно до 3 приложений.

Это даёт именно нативное приложение и `.ipa`, а не веб-версию.

---

## 3. Разделение ролей: ты (Claude) и человек

**Делаешь ты (всё автоматизируемое, готовишь готовый к сборке коммит):**
интеграция Capacitor, фикс base-пути, генерация папки `ios/`, иконка, `codemagic.yaml`, `.gitignore`, README, коммит и пуш.

**Чего ты НЕ можешь и НЕ делаешь** (это опиши человеку, см. §5):
регистрация в Codemagic, вход с Apple ID, запуск облачной сборки и скачивание IPA, установка через Sideloadly с физического iPhone, подключённого к Windows-ПК. Ты не запускаешь macOS и не имеешь доступа к телефону человека.

---

## 4. Шаги для Claude

**Параметры по умолчанию** (человек может изменить до запуска сборки):

| Параметр | Значение по умолчанию |
|---|---|
| `APP_NAME` | `Галерея` |
| `APP_ID` (bundle id) | `com.levivaaa.gallery` |
| Иконка | концепт «Закат», исходник SVG в Приложении A |

### Шаг 1. Установить Capacitor

```bash
npm i @capacitor/core @capacitor/ios
npm i -D @capacitor/cli @capacitor/assets
```

**Проверка:** пакеты появились в `package.json`; `npx cap --version` отвечает.

### Шаг 2. Инициализировать Capacitor (webDir = dist)

```bash
npx cap init "Галерея" com.levivaaa.gallery --web-dir dist
```

Должен появиться `capacitor.config.ts` (или `.json`) с `appId`, `appName`, `webDir: "dist"`.
**Почему:** Capacitor должен брать собранную веб-папку Vite (`dist`).
**Проверка:** в конфиге `webDir` равен `dist` (если другое — поправь).

### Шаг 3. Починить base-путь (критично!)

**Проблема:** `base: "/Gallery-for-Iphone/"` корректен для GitHub Pages, но **ломает пути к ассетам внутри нативного приложения** (там всё грузится от корня `/`) — будет белый экран. Pages-сборку при этом ломать нельзя.

**Решение** — отдельный скрипт сборки для натива, переопределяющий base через CLI-флаг (без правки конфига и без `cross-env`). Добавь в `package.json` в `scripts`:

```json
"build:ios": "tsc -b && vite build --base=/"
```

**Почему:** `--base=/` перекрывает `base` из конфига только для нативной сборки; обычный `npm run build` (деплой на Pages) остаётся прежним.
**Проверка:** `npm run build:ios` проходит; в `dist/index.html` пути к ассетам начинаются с `/assets/...`, а **не** с `/Gallery-for-Iphone/assets/...`.

### Шаг 4. Собрать веб и добавить платформу iOS

```bash
npm run build:ios
npx cap add ios
npx cap sync ios
```

Появится папка `ios/App/` с `App.xcworkspace` и `App.xcodeproj`. `cap sync` копирует `dist/` в `ios/App/App/public/` и подтягивает нативные зависимости.
**Проверка:** существует `ios/App/App.xcworkspace`; в `ios/App/App/public/` лежит `index.html`.

### Шаг 5. Иконка приложения

1. Срендери исходник из **Приложения A** в `assets/icon.png` размером **1024×1024** (через `sharp` / `resvg-js` / ImageMagick — что доступно). Пример на Node + sharp:
   ```bash
   npm i -D sharp
   node -e "require('sharp')('assets/icon.svg').resize(1024,1024).png().toFile('assets/icon.png').then(()=>console.log('ok'))"
   ```
   Если ни одного раст-конвертера нет — создай `assets/icon.svg` из Приложения A, оставь `assets/icon.png` как TODO и попроси человека экспортировать SVG → PNG 1024×1024.
2. Сгенерируй iOS-набор иконок:
   ```bash
   npx capacitor-assets generate --ios
   ```
   (если имя команды отличается — проверь `npx @capacitor/assets --help`)

**Проверка:** в `ios/App/App/Assets.xcassets/AppIcon.appiconset/` появились png-иконки.

### Шаг 6. `codemagic.yaml` — неподписанный IPA

Создай в корне репозитория файл `codemagic.yaml`:

```yaml
workflows:
  ios-unsigned:
    name: Gallery iOS (unsigned IPA)
    max_build_duration: 60
    instance_type: mac_mini_m2
    environment:
      node: 20
      xcode: latest
      cocoapods: default
    scripts:
      - name: Install JS deps
        script: npm ci
      - name: Build web (Capacitor base=/)
        script: npm run build:ios
      - name: Capacitor sync iOS
        script: npx cap sync ios
      - name: CocoaPods
        script: |
          cd ios/App
          pod install
      - name: Build unsigned .app
        script: |
          xcodebuild \
            -workspace ios/App/App.xcworkspace \
            -scheme App \
            -configuration Release \
            -sdk iphoneos \
            -derivedDataPath build \
            CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO
      - name: Package unsigned IPA
        script: |
          cd "$CM_BUILD_DIR"
          mkdir -p Payload
          cp -R build/Build/Products/Release-iphoneos/App.app Payload/App.app
          zip -r Gallery-unsigned.ipa Payload
    artifacts:
      - Gallery-unsigned.ipa
      - /tmp/xcodebuild_logs/*.log
```

**Почему:** собираем `.app` без подписи (флаги `CODE_SIGNING_*=NO`) и упаковываем вручную в `Payload/…/.ipa` — подпись потом поставит Sideloadly. У Capacitor по умолчанию `scheme = App`, workspace `ios/App/App.xcworkspace`.

### Шаг 7. `.gitignore` — закоммитить `ios/`, но без артефактов

Добавь в `.gitignore`:

```gitignore
# Capacitor / iOS
ios/App/Pods/
ios/App/App/public/
DerivedData/
*.ipa
```

(`build/` и `dist/` уже игнорируются.) Папку `ios/` **нужно закоммитить** — без `Pods/` и `public/`, они регенерируются на Codemagic через `pod install` и `npx cap sync`.
**Проверка:** `git status` показывает `ios/App/App.xcodeproj`, `Podfile` и т.п., но **не** показывает `Pods/`, `public/`, `*.ipa`.

### Шаг 8. README

Добавь раздел «Сборка IPA»: кратко опиши схему (Capacitor + Codemagic неподписанный + Sideloadly) и команды локальной пересборки веб-части перед сборкой:

```bash
npm run build:ios && npx cap sync ios
```

### Шаг 9. Проверка и коммит

- `npm run build:ios` — без ошибок.
- `npx cap sync ios` — без ошибок.
- Локально на Windows Xcode-сборку проверить нельзя (нужен macOS) — она пройдёт на Codemagic; так и отметь в отчёте.
- Закоммить и запушь:
  ```bash
  git add -A
  git commit -m "feat: Capacitor iOS wrapper + Codemagic unsigned IPA build"
  git push
  ```
- Сообщи человеку, что дальше — §5.

---

## 5. Ручные шаги человека (вне Claude)

### A. Codemagic — собрать IPA в облаке
1. Зарегистрироваться на **codemagic.io**, подключить GitHub-репозиторий `Gallery-for-Iphone`.
2. Codemagic подхватит `codemagic.yaml` → запустить workflow **`ios-unsigned`** вручную (Start new build).
3. Через ~5–10 минут скачать артефакт **`Gallery-unsigned.ipa`** из результатов сборки.

### B. Sideloadly (Windows) — подписать и установить
**Подготовка Windows:**
- Поставить **веб-версии** iTunes и iCloud с сайта Apple (**не** из Microsoft Store; если стоят из Store — удалить и поставить обычные установщики).
- Для установки по Wi-Fi может понадобиться служба **Apple Bonjour**.

**Установка:**
1. Скачать Sideloadly с **sideloadly.io**.
2. Подключить iPhone по USB, на телефоне нажать «Доверять».
3. Перетащить `Gallery-unsigned.ipa` в Sideloadly, вписать свой Apple ID, нажать **Start**, ввести пароль (и код 2FA).
4. На iPhone: **Настройки → Основные → VPN и управление устройством → нажать свой Apple ID → «Доверять»**.
5. iOS 16+: **Настройки → Конфиденциальность и безопасность → Режим разработчика → включить**.

**Ограничения бесплатного Apple ID:** приложение живёт 7 дней (Sideloadly переподписывает автоматически, если ПК в той же сети), одновременно до 3 приложений.

---

## 6. Критерии готовности (чеклист)

- [ ] Capacitor установлен, `capacitor.config.*` c `webDir: dist`
- [ ] Скрипт `build:ios` с `--base=/`; в нативной сборке пути ассетов идут от корня
- [ ] Папка `ios/App/` сгенерирована и закоммичена (без `Pods/` и `public/`)
- [ ] Иконка 1024 сконвертирована, `AppIcon.appiconset` заполнен
- [ ] `codemagic.yaml` собирает неподписанный IPA (`Gallery-unsigned.ipa` в артефактах)
- [ ] Изменения запушены
- [ ] (Человек) Codemagic собрал IPA
- [ ] (Человек) Sideloadly установил приложение, иконка на домашнем экране

---

## 7. Подводные камни

- **base-путь** — самая частая ошибка: белый экран в приложении = ассеты не нашлись. Нативную часть собирать только через `build:ios` (`--base=/`).
- **Подпись на Codemagic**: если `xcodebuild` падает на code signing — это решают флаги `CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO` (уже в `codemagic.yaml`).
- **scheme/workspace**: у Capacitor по умолчанию scheme `App`, workspace `ios/App/App.xcworkspace` — если переименовывалось, подставить актуальные.
- **pod install** обязателен до `xcodebuild` (его делает workflow).
- **bundle id**: если Sideloadly ругается, что id занят — сменить `APP_ID` или поменять bundle id прямо в Sideloadly при установке.
- **7 дней**: бесплатная подпись истекает; держать ПК с Sideloadly в той же сети для автопродления либо переустанавливать.

---

## Приложение A. Иконка «Закат» (исходник SVG, 1024×1024)

> Срендерить в `assets/icon.png` 1024×1024 — **полный квадрат, без скругления** (iOS скруглит сам). При желании человек заменит на другой концепт.

```svg
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFD08A"/>
      <stop offset="0.55" stop-color="#FF9166"/>
      <stop offset="1" stop-color="#FF5F6D"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFF8E6"/>
      <stop offset="1" stop-color="#FFE39E"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#sky)"/>
  <circle cx="690" cy="350" r="148" fill="url(#sun)"/>
  <path d="M0 1024 L300 560 L600 1024 Z" fill="#FFFFFF" opacity="0.5"/>
  <path d="M470 1024 L800 500 L1024 900 L1024 1024 Z" fill="#FFFFFF" opacity="0.5"/>
  <path d="M-40 1024 L360 650 L640 1024 Z" fill="#FFFFFF" opacity="0.92"/>
  <path d="M520 1024 L860 600 L1064 1024 Z" fill="#FFFFFF" opacity="0.82"/>
</svg>
```
