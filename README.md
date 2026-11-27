# DjanConst

**A visual website builder that compiles your layout directly into a ready-to-run Django project!**  
**Визуальный конструктор сайтов, который компилирует ваш макет в готовый Django-проект!**

<img width="1919" height="941" alt="Снимок экрана 2026-11-26 104453" src="https://github.com/user-attachments/assets/04bdb517-2a14-450c-86e0-ffa5351312b2" />


---

## 🇬🇧 English

### About the Project
**DjanConst** speeds up the initial prototyping phase for Django developers. Instead of manually setting up `startproject`, `startapp`, `INSTALLED_APPS`, `templates`, and `static` folders every time, you can visually assemble your layout on a canvas and download a clean, structured `.zip` archive with a single click.

### ✨ Key Features
- **Freeform Drag-and-Drop Canvas:** Place headings (`H1`), paragraphs (`P`), and images (`IMG`) anywhere on the workspace with exact `X / Y` coordinate preservation.
- **Ready-to-Use Section Presets:** Insert balanced layouts (`Text + Image`, `Image + Text`, `Hero Block`) in one click.
- **Live Styling & Customization:** Change page background color, global fonts (Google Fonts), text colors, font sizes, alignment, and block widths in real time.
- **Automatic Static Files Handling:** Local images uploaded from your PC are automatically decoded and saved into `static/<app_name>/images/`, with `{% load static %}` and `{% static '...' %}` tags injected into the HTML.
- **One-Click Django Compilation:** Generates `manage.py`, `settings.py`, `urls.py`, `views.py`, `requirements.txt`, `templates/index.html`, and `static/<app_name>/css/style.css`.
- **Bilingual Interface:** Switch between English and Russian right inside the editor.

### 🛠 Tech Stack
- **Backend:** Python 3.11.9, Django 5+
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Containerization:** Docker & Docker Compose

### 📦 Generated Project Structure
```text
myproject/
├── manage.py
├── requirements.txt
├── myproject/
│   ├── settings.py      # The app is already registered in INSTALLED_APPS
│   └── urls.py          # The index route is already configured
└── myapp/
    ├── views.py
    ├── templates/
    │   └── index.html   # Includes {% load static %} and style.css
    └── static/
        └── myapp/
            ├── css/
            │   └── style.css
            └── images/  # All user-uploaded images
```

### 🚀 Quick Start

#### Option 1: Run via Docker (No Python or Django installation required)
1. Clone the repository:
   ```bash
   git clone https://github.com/Vladik1092/DjanConst.git
   cd DjanConst
   ```
2. Create an `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Build and start the container:
   ```bash
   docker compose up --build
   ```
4. Open `http://127.0.0.1:8000` in your browser.

#### Option 2: Local Setup (Python 3.11+)
1. Clone the repository and create a virtual environment:
   ```bash
   git clone https://github.com/Vladik1092/DjanConst.git
   cd DjanConst
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   # Linux/macOS: source .venv/bin/activate
   ```
2. Install dependencies and copy `.env.example` to `.env`:
   ```bash
   pip install -r requirements.txt
   cp .env.example .env
   ```
3. Run the development server:
   ```bash
   python manage.py runserver
   ```

### 🗺 Roadmap
- [ ] Add link buttons (`<a>`) with customizable colors and border radius
- [ ] Layer management (`z-index`) to place text over images
- [ ] Snap-to-Grid alignment for precise block positioning
- [ ] Multi-page project support

---

## 🇷🇺 Русский

### О проекте
**DjanConst** ускоряет начальный этап прототипирования для Django-разработчиков. Вместо ручной настройки `startproject`, `startapp`, `INSTALLED_APPS`, папок `templates` и `static` каждый раз, вы собираете макет визуально на холсте и в один клик скачиваете чистый, структурированный `.zip`-архив.

### ✨ Основные возможности
- **Свободное перетаскивание (Drag-and-Drop):** Размещайте заголовки (`H1`), текст (`P`) и картинки (`IMG`) в любой точке холста с сохранением точных координат `X / Y`.
- **Готовые секции-пресеты:** Добавляйте сбалансированные блоки («Текст + Фото», «Фото + Текст», «Hero-блок») одним нажатием.
- **Гибкая настройка стилей:** Изменяйте цвет фона сайта, глобальные шрифты (Google Fonts), цвет и размер текста, выравнивание и ширину блоков в реальном времени.
- **Автоматическая работа со статикой:** Загруженные с ПК картинки автоматически декодируются и сохраняются в папку `static/<app_name>/images/`, а в HTML подставляются теги `{% load static %}` и `{% static '...' %}`.
- **Компиляция в Django за 1 клик:** Генерирует `manage.py`, `settings.py`, `urls.py`, `views.py`, `requirements.txt`, `templates/index.html` и `static/<app_name>/css/style.css`.
- **Двуязычный интерфейс:** Переключайтесь между английским и русским языками прямо внутри редактора.

### 🛠 Стек технологий
- **Backend:** Python 3.11.9, Django 5+
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Контейнеризация:** Docker и Docker Compose

### 📦 Структура сгенерированного проекта
```text
myproject/
├── manage.py
├── requirements.txt
├── myproject/
│   ├── settings.py      # Приложение уже зарегистрировано в INSTALLED_APPS
│   └── urls.py          # Маршрут на главную страницу уже настроен
└── myapp/
    ├── views.py
    ├── templates/
    │   └── index.html   # Подключен {% load static %} и style.css
    └── static/
        └── myapp/
            ├── css/
            │   └── style.css
            └── images/  # Все загруженные пользователем изображения
```

### 🚀 Быстрый запуск

#### Вариант 1: Через Docker (не требует установки Python и Django)
1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/Vladik1092/DjanConst.git
   cd DjanConst
   ```
2. Создайте файл `.env` из шаблона:
   ```bash
   cp .env.example .env
   ```
3. Соберите и запустите контейнер:
   ```bash
   docker compose up --build
   ```
4. Откройте в браузере: `http://127.0.0.1:8000`

#### Вариант 2: Локальный запуск (Python 3.11+)
1. Клонируйте репозиторий и создайте виртуальное окружение:
   ```bash
   git clone https://github.com/Vladik1092/DjanConst.git
   cd DjanConst
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   # Linux/macOS: source .venv/bin/activate
   ```
2. Установите зависимости и скопируйте `.env.example` в `.env`:
   ```bash
   pip install -r requirements.txt
   cp .env.example .env
   ```
3. Запустите сервер разработки:
   ```bash
   python manage.py runserver
   ```

### 🗺 Планы развития
- [ ] Добавление кнопок-ссылок (`<a>`) с настройкой цвета и скругления
- [ ] Управление слоями (`z-index`) для наложения текста поверх изображений
- [ ] Сетка-привязка (Snap-to-Grid) для идеального выравнивания блоков
- [ ] Поддержка многостраничных проектов
