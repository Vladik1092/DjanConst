import base64
import importlib.util
import io
import json
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
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '', name.strip()).lower()
    if not cleaned or cleaned.isdigit():
        return default
    if cleaned in RESERVED_NAMES or importlib.util.find_spec(cleaned) is not None:
        return f"{cleaned}_app"
    return cleaned


def extract_and_save_images(html_code, images_dir, app_name, start_counter=1):
    pattern = re.compile(r'src="data:image/(png|jpeg|jpg|gif|webp);base64,([^"]+)"')
    counter = start_counter

    def replacer(match):
        nonlocal counter
        ext = 'jpg' if match.group(1) == 'jpeg' else match.group(1)
        filename = f"image_{counter}.{ext}"
        filepath = os.path.join(images_dir, filename)
        with open(filepath, 'wb') as img_file:
            img_file.write(base64.b64decode(match.group(2)))
        counter += 1
        return f'src="{{% static \'{app_name}/images/{filename}\' %}}"'

    return pattern.sub(replacer, html_code), counter


def format_container_html(raw_html):
    if not raw_html.strip():
        return ""
    formatted = re.sub(r'</div>\s*<div class="site-element"', '</div>\n        <div class="site-element"', raw_html.strip())
    formatted = re.sub(r'(<div class="site-element"[^>]*>)\s*(<(?:h1|p|img)\b)', r'\1\n            \2', formatted)
    formatted = re.sub(r'(</(?:h1|p)>|<img[^>]*>)\s*</div>', r'\1\n        </div>', formatted)
    return f"        {formatted}"


def build_django_zip(raw_project, raw_app, pages_json):
    try:
        pages = json.loads(pages_json)
    except json.JSONDecodeError:
        pages = []

    if not pages:
        pages = [{
            'slug': 'index',
            'title': 'Home',
            'bgColor': '#ffffff',
            'fontFamily': "'Roboto', sans-serif",
            'height': 800,
            'html': ''
        }]

    project_name = sanitize_name(raw_project, 'myproject')
    app_name = sanitize_name(raw_app, 'myapp')
    if app_name == project_name:
        app_name = f"{app_name}_app"

    target_dir = tempfile.mkdtemp()
    try:
        subprocess.run([sys.executable, '-m', 'django', 'startproject', project_name, '.'], cwd=target_dir, check=True)
        subprocess.run([sys.executable, 'manage.py', 'startapp', app_name], cwd=target_dir, check=True)

        with open(os.path.join(target_dir, 'requirements.txt'), 'w', encoding='utf-8') as f:
            f.write("Django>=5.0\n")

        static_css_dir = os.path.join(target_dir, app_name, 'static', app_name, 'css')
        static_img_dir = os.path.join(target_dir, app_name, 'static', app_name, 'images')
        templates_dir = os.path.join(target_dir, app_name, 'templates')
        os.makedirs(static_css_dir, exist_ok=True)
        os.makedirs(static_img_dir, exist_ok=True)
        os.makedirs(templates_dir, exist_ok=True)

        css_blocks = ["""@import url('https://googleapis.com');

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    min-height: 100vh;
    overflow-x: auto;
}

.container {
    position: relative;
    width: 960px;
    margin: 0 auto;
}

.site-element {
    position: absolute;
}

.site-element h1,
.site-element p {
    line-height: 1.4;
    word-wrap: break-word;
}

.site-element img {
    width: 100%;
    height: auto;
    display: block;
}
"""]

        views_lines = ["from django.shortcuts import render\n\n"]
        urls_lines = [
            "from django.contrib import admin\n",
            "from django.urls import path\n",
            f"from {app_name} import views\n\n",
            "urlpatterns = [\n",
            "    path('admin/', admin.site.urls),\n"
        ]

        used_slugs = set()
        image_counter = 1

        for idx, page in enumerate(pages):
            raw_slug = page.get('slug', 'index' if idx == 0 else f'page_{idx + 1}')
            slug = sanitize_name(raw_slug, 'index' if idx == 0 else f'page_{idx + 1}')

            base_slug = slug
            suffix = 2
            while slug in used_slugs:
                slug = f"{base_slug}_{suffix}"
                suffix += 1
            used_slugs.add(slug)

            page_title = page.get('title') or slug.capitalize()
            bg_color = page.get('bgColor', '#ffffff')
            font_family = page.get('fontFamily', "'Roboto', sans-serif")
            canvas_height = page.get('height', 800)
            raw_html = page.get('html', '')

            processed_html, image_counter = extract_and_save_images(raw_html, static_img_dir, app_name, image_counter)
            pretty_html = format_container_html(processed_html)

            css_blocks.append(f"""body.page-{slug} {{
    background-color: {bg_color};
    font-family: {font_family};
}}

body.page-{slug} .container {{
    min-height: {canvas_height}px;
}}
""")

            template_filename = f"{slug}.html"
            full_html = f"""{{% load static %}}
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page_title} — {project_name}</title>
    <link rel="stylesheet" href="{{% static '{app_name}/css/style.css' %}}">
</head>
<body class="page-{slug}">
    <div class="container">
{pretty_html}
    </div>
</body>
</html>"""
            with open(os.path.join(templates_dir, template_filename), 'w', encoding='utf-8') as f:
                f.write(full_html)

            views_lines.append(f"def {slug}(request):\n    return render(request, '{template_filename}')\n\n")
            route_path = "" if idx == 0 else f"{slug}/"
            urls_lines.append(f"    path('{route_path}', views.{slug}, name='{slug}'),\n")

        urls_lines.append("]\n")

        with open(os.path.join(static_css_dir, 'style.css'), 'w', encoding='utf-8') as f:
            f.write("\n".join(css_blocks))

        settings_path = os.path.join(target_dir, project_name, 'settings.py')
        with open(settings_path, 'r', encoding='utf-8') as f:
            settings_content = f.read()
        settings_content = settings_content.replace("INSTALLED_APPS = [", f"INSTALLED_APPS = [\n    '{app_name}',")
        settings_content = settings_content.replace("ALLOWED_HOSTS = []", "ALLOWED_HOSTS = ['*']")
        with open(settings_path, 'w', encoding='utf-8') as f:
            f.write(settings_content)

        with open(os.path.join(target_dir, app_name, 'views.py'), 'w', encoding='utf-8') as f:
            f.writelines(views_lines)

        with open(os.path.join(target_dir, project_name, 'urls.py'), 'w', encoding='utf-8') as f:
            f.writelines(urls_lines)

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for root, _, files in os.walk(target_dir):
                for filename in files:
                    file_path = os.path.join(root, filename)
                    arcname = os.path.relpath(file_path, target_dir)
                    zip_file.write(file_path, arcname)

        zip_buffer.seek(0)
        return zip_buffer, f"{project_name}.zip"
    finally:
        shutil.rmtree(target_dir, ignore_errors=True)


def const(request):
    language = request.session.get('language', 'english')

    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'toggle_lang':
            language = 'russian' if language == 'english' else 'english'
            request.session['language'] = language

        elif action == 'compile':
            zip_buffer, filename = build_django_zip(
                request.POST.get('project_name', 'myproject'),
                request.POST.get('app_name', 'myapp'),
                request.POST.get('pages_data', '[]')
            )
            return FileResponse(zip_buffer, as_attachment=True, filename=filename)

    return render(request, 'constructor.html', {'language': language})
