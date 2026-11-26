import base64
import importlib.util
import io
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from django.http import FileResponse
from django.shortcuts import render

RESERVED_NAMES = {'django', 'test', 'tests', 'site', 'admin', 'manage', 'settings', 'urls', 'views'}


def sanitize_name(name, default):
    """Очищает имя проекта/приложения и защищает от конфликта с модулями Python/Django."""
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '', name.strip()).lower()
    if not cleaned or cleaned[0].isdigit():
        return default
    if cleaned in RESERVED_NAMES or importlib.util.find_spec(cleaned) is not None:
        return f"{cleaned}_app"
    return cleaned


def extract_and_save_images(html_code, images_dir, app_name):
    """Находит base64-картинки в HTML, сохраняет их в static и заменяет src на {% static %}."""
    pattern = re.compile(r'src="data:image/(png|jpeg|jpg|gif|webp);base64,([^"]+)"')
    counter = 1

    def replacer(match):
        nonlocal counter
        ext = match.group(1)
        if ext == 'jpeg':
            ext = 'jpg'
        b64_data = match.group(2)
        filename = f"image_{counter}.{ext}"
        filepath = os.path.join(images_dir, filename)

        with open(filepath, 'wb') as img_file:
            img_file.write(base64.b64decode(b64_data))

        counter += 1
        return f'src="{{% static \'{app_name}/images/{filename}\' %}}"'

    return pattern.sub(replacer, html_code)


def const(request):
    language = request.session.get('language', 'english')

    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'toggle_lang':
            language = 'russian' if language == 'english' else 'english'
            request.session['language'] = language

        elif action == 'compile':
            raw_project = request.POST.get('project_name', 'myproject')
            raw_app = request.POST.get('app_name', 'myapp')
            html_code = request.POST.get('html_code', '')
            bg_color = request.POST.get('bg_color', '#ffffff')
            font_family = request.POST.get('font_family', "'Roboto', sans-serif")
            canvas_height = request.POST.get('canvas_height', '800')

            project_name = sanitize_name(raw_project, 'myproject')
            app_name = sanitize_name(raw_app, 'myapp')
            if app_name == project_name:
                app_name = f"{app_name}_app"

            target_dir = tempfile.mkdtemp()

            try:
                # 1. Создаем Django-проект и приложение
                subprocess.run(
                    [sys.executable, '-m', 'django', 'startproject', project_name, '.'],
                    cwd=target_dir,
                    check=True
                )
                subprocess.run(
                    [sys.executable, 'manage.py', 'startapp', app_name],
                    cwd=target_dir,
                    check=True
                )

                # 2. Создаем requirements.txt
                with open(os.path.join(target_dir, 'requirements.txt'), 'w', encoding='utf-8') as file:
                    file.write("Django>=5.0\n")

                # 3. Создаем папки static/<app_name>/css и static/<app_name>/images
                static_css_dir = os.path.join(target_dir, app_name, 'static', app_name, 'css')
                static_img_dir = os.path.join(target_dir, app_name, 'static', app_name, 'images')
                os.makedirs(static_css_dir, exist_ok=True)
                os.makedirs(static_img_dir, exist_ok=True)

                # 4. Сохраняем загруженные пользователем картинки в static и заменяем пути в HTML
                processed_html = extract_and_save_images(html_code, static_img_dir, app_name)

                # 5. Генерируем style.css
                css_content = f"""@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;700&display=swap');

                * {{
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }}

                body {{
                    background-color: {bg_color};
                    font-family: {font_family};
                    min-height: 100vh;
                    overflow-x: auto;
                }}

                .container {{
                    position: relative;
                    width: 960px;
                    min-height: {canvas_height}px;
                    margin: 0 auto;
                }}

                .site-element {{
                    position: absolute;
                }}

                .site-element h1,
                .site-element p {{
                    line-height: 1.4;
                    word-wrap: break-word;
                }}

                .site-element img {{
                    width: 100%;
                    height: auto;
                    display: block;
                }}
                """
                with open(os.path.join(static_css_dir, 'style.css'), 'w', encoding='utf-8') as file:
                    file.write(css_content)

                # 6. Создаем templates/index.html с {% load static %}
                templates_dir = os.path.join(target_dir, app_name, 'templates')
                os.makedirs(templates_dir, exist_ok=True)
                full_html = f"""{{% load static %}}
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{project_name}</title>
    <link rel="stylesheet" href="{{% static '{app_name}/css/style.css' %}}">
</head>
<body>
    <div class="container">
{processed_html}
    </div>
</body>
</html>"""
                with open(os.path.join(templates_dir, 'index.html'), 'w', encoding='utf-8') as file:
                    file.write(full_html)

                # 7. Регистрируем приложение в settings.py
                settings_path = os.path.join(target_dir, project_name, 'settings.py')
                with open(settings_path, 'r', encoding='utf-8') as file:
                    settings_content = file.read()
                settings_content = settings_content.replace(
                    "INSTALLED_APPS = [",
                    f"INSTALLED_APPS = [\n    '{app_name}',"
                )
                with open(settings_path, 'w', encoding='utf-8') as file:
                    file.write(settings_content)

                # 8. Настраиваем views.py
                views_path = os.path.join(target_dir, app_name, 'views.py')
                with open(views_path, 'w', encoding='utf-8') as file:
                    file.write(
                        "from django.shortcuts import render\n\n"
                        "def index(request):\n"
                        "    return render(request, 'index.html')\n"
                    )

                # 9. Настраиваем urls.py
                urls_path = os.path.join(target_dir, project_name, 'urls.py')
                with open(urls_path, 'w', encoding='utf-8') as file:
                    file.write(
                        "from django.contrib import admin\n"
                        "from django.urls import path\n"
                        f"from {app_name} import views\n\n"
                        "urlpatterns = [\n"
                        "    path('admin/', admin.site.urls),\n"
                        "    path('', views.index, name='index'),\n"
                        "]\n"
                    )

                # 10. Упаковываем в ZIP
                zip_buffer = io.BytesIO()
                with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                    for root, _, files in os.walk(target_dir):
                        for filename in files:
                            file_path = os.path.join(root, filename)
                            arcname = os.path.relpath(file_path, target_dir)
                            zip_file.write(file_path, arcname)

                zip_buffer.seek(0)

                return FileResponse(
                    zip_buffer,
                    as_attachment=True,
                    filename=f"{project_name}.zip"
                )
            finally:
                shutil.rmtree(target_dir, ignore_errors=True)

    return render(request, 'constructor.html', {'language': language})
