document.addEventListener('DOMContentLoaded', () => {
    const pagesStack = document.getElementById('pages-stack');
    const addPageBtn = document.getElementById('add-page-btn');
    const addButtons = document.querySelectorAll('.add-tag-btn');
    const dialog = document.getElementById('django-compiller');
    const openModalBtn = document.getElementById('open-compile-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const compileForm = document.getElementById('compile-form');
    const pagesDataInput = document.getElementById('pages-data-input');

    // Элементы панели настроек активной страницы
    const activePageBadge = document.getElementById('active-page-badge');
    const pageSlugInput = document.getElementById('page-slug-input');
    const pageBgInput = document.getElementById('page-bg-color');
    const pageFontSelect = document.getElementById('page-font-family');
    const extendCanvasBtn = document.getElementById('extend-canvas-btn');
    const deletePageBtn = document.getElementById('delete-page-btn');

    // Элементы панели настроек выбранного блока
    const noSelectionHint = document.getElementById('no-selection-hint');
    const positionControls = document.getElementById('position-controls');
    const textControls = document.getElementById('text-controls');
    const imageControls = document.getElementById('image-controls');
    const deleteBtn = document.getElementById('delete-element-btn');

    const elPosX = document.getElementById('el-pos-x');
    const elPosY = document.getElementById('el-pos-y');

    const elTextColor = document.getElementById('el-text-color');
    const elFontSize = document.getElementById('el-font-size');
    const elTextWidth = document.getElementById('el-text-width');
    const elTextAlign = document.getElementById('el-text-align');

    const elImgUpload = document.getElementById('el-img-upload');
    const elImgUrl = document.getElementById('el-img-url');
    const elImgWidth = document.getElementById('el-img-width');

    let pages = [];
    let activePage = null;
    let selectedWrapper = null;
    let elementCounter = 0;

    // Вспомогательная функция перевода RGB в HEX
    function rgbToHex(rgb) {
        if (!rgb || rgb.startsWith('#')) return rgb || '#000000';
        const match = rgb.match(/\d+/g);
        if (!match) return '#000000';
        return '#' + match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    }

    // Снятие выделения с текущего элемента
    function clearElementSelection() {
        if (selectedWrapper) {
            selectedWrapper.classList.remove('selected-element');
            selectedWrapper = null;
        }
        noSelectionHint.classList.remove('hidden');
        positionControls.classList.add('hidden');
        textControls.classList.add('hidden');
        imageControls.classList.add('hidden');
        deleteBtn.classList.add('hidden');
    }

    // Пересчёт высоты конкретной страницы
    function updatePageHeight(pageObj) {
        let maxBottom = 800 + pageObj.extraHeight;
        pageObj.workspaceEl.querySelectorAll('.draggable-item').forEach(item => {
            const bottom = item.offsetTop + item.offsetHeight + 150;
            if (bottom > maxBottom) maxBottom = bottom;
        });
        pageObj.height = maxBottom;
        pageObj.workspaceEl.style.height = `${maxBottom}px`;
    }

    // Обновление шапок и нумерации всех страниц
    function refreshPageHeaders() {
        pages.forEach((p, idx) => {
            const routeText = idx === 0 ? '/ (Главная)' : `/${p.slug}/`;
            p.headerTitleEl.textContent = `Страница ${idx + 1} — ${p.slug}`;
            p.headerRouteEl.textContent = `URL: ${routeText}`;
        });

        if (activePage) {
            const activeIdx = pages.indexOf(activePage);
            activePageBadge.textContent = `Page ${activeIdx + 1}`;
            if (pages.length > 1 && activeIdx > 0) {
                deletePageBtn.classList.remove('hidden');
            } else {
                deletePageBtn.classList.add('hidden');
            }
        }
    }

    // Выбор активной страницы и загрузка её настроек в правую панель
    function setActivePage(pageObj) {
        if (activePage && activePage !== pageObj) {
            activePage.blockEl.classList.remove('active-page');
            clearElementSelection();
        }
        activePage = pageObj;
        activePage.blockEl.classList.add('active-page');

        pageSlugInput.value = activePage.slug;
        pageBgInput.value = activePage.bgColor;
        pageFontSelect.value = activePage.fontFamily;

        refreshPageHeaders();
    }

    // Создание новой страницы (листа)
    function createPage(customSlug = null) {
        const pageNum = pages.length + 1;
        const slug = customSlug || (pageNum === 1 ? 'index' : `page${pageNum}`);

        const blockEl = document.createElement('div');
        blockEl.className = 'page-block';

        const headerBar = document.createElement('div');
        headerBar.className = 'page-header-bar';

        const headerTitleEl = document.createElement('span');
        const headerRouteEl = document.createElement('span');
        headerBar.appendChild(headerTitleEl);
        headerBar.appendChild(headerRouteEl);

        const workspaceEl = document.createElement('div');
        workspaceEl.className = 'workspace';
        workspaceEl.style.backgroundColor = '#ffffff';
        workspaceEl.style.fontFamily = "'Roboto', sans-serif";
        workspaceEl.style.height = '800px';

        blockEl.appendChild(headerBar);
        blockEl.appendChild(workspaceEl);
        pagesStack.appendChild(blockEl);

        const pageObj = {
            slug: slug,
            bgColor: '#ffffff',
            fontFamily: "'Roboto', sans-serif",
            height: 800,
            extraHeight: 0,
            blockEl,
            workspaceEl,
            headerTitleEl,
            headerRouteEl
        };

        pages.push(pageObj);

        headerBar.addEventListener('click', () => setActivePage(pageObj));
        workspaceEl.addEventListener('click', () => {
            setActivePage(pageObj);
            clearElementSelection();
        });

        setActivePage(pageObj);
        return pageObj;
    }

    // Кнопка добавления новой страницы (+ Add Page)
    addPageBtn.addEventListener('click', () => {
        const newPage = createPage();
        newPage.blockEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Настройки активной страницы в правой панели
    pageSlugInput.addEventListener('input', (e) => {
        if (!activePage) return;
        const cleaned = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        activePage.slug = cleaned || 'page';
        refreshPageHeaders();
    });

    pageBgInput.addEventListener('input', (e) => {
        if (!activePage) return;
        activePage.bgColor = e.target.value;
        activePage.workspaceEl.style.backgroundColor = e.target.value;
    });

    pageFontSelect.addEventListener('change', (e) => {
        if (!activePage) return;
        activePage.fontFamily = e.target.value;
        activePage.workspaceEl.style.fontFamily = e.target.value;
    });

    extendCanvasBtn.addEventListener('click', () => {
        if (!activePage) return;
        activePage.extraHeight += 300;
        updatePageHeight(activePage);
    });

    deletePageBtn.addEventListener('click', () => {
        if (!activePage || pages.length <= 1) return;
        const idx = pages.indexOf(activePage);
        activePage.blockEl.remove();
        pages.splice(idx, 1);
        clearElementSelection();
        setActivePage(pages[Math.max(0, idx - 1)]);
    });

    // Выделение элемента на холсте
    function selectWrapper(wrapper, pageObj) {
        if (activePage !== pageObj) {
            setActivePage(pageObj);
        }
        if (selectedWrapper) {
            selectedWrapper.classList.remove('selected-element');
        }
        selectedWrapper = wrapper;
        selectedWrapper.classList.add('selected-element');

        noSelectionHint.classList.add('hidden');
        positionControls.classList.remove('hidden');
        deleteBtn.classList.remove('hidden');

        elPosX.value = parseInt(wrapper.style.left) || 0;
        elPosY.value = parseInt(wrapper.style.top) || 0;

        const innerEl = wrapper.querySelector('.editable-content');

        if (innerEl.tagName === 'IMG') {
            textControls.classList.add('hidden');
            imageControls.classList.remove('hidden');
            elImgUrl.value = innerEl.src.startsWith('data:') ? '' : innerEl.src;
            elImgWidth.value = parseInt(wrapper.style.width) || 300;
            elImgUpload.value = '';
        } else {
            imageControls.classList.add('hidden');
            textControls.classList.remove('hidden');
            const computed = window.getComputedStyle(innerEl);
            elTextColor.value = rgbToHex(innerEl.style.color || computed.color);
            elFontSize.value = parseInt(innerEl.style.fontSize || computed.fontSize);
            elTextWidth.value = parseInt(wrapper.style.width) || 400;
            elTextAlign.value = innerEl.style.textAlign || 'left';
        }
    }

    // Логика свободного перетаскивания (Drag-and-Drop) в пределах листа
    function makeDraggable(wrapper, handle, isImage, pageObj) {
        let isDragging = false;
        let startMouseX = 0;
        let startMouseY = 0;
        let startLeft = 0;
        let startTop = 0;

        const onMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectWrapper(wrapper, pageObj);

            isDragging = true;
            startMouseX = e.clientX;
            startMouseY = e.clientY;
            startLeft = parseInt(wrapper.style.left) || 0;
            startTop = parseInt(wrapper.style.top) || 0;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startMouseX;
            const dy = e.clientY - startMouseY;

            const maxLeft = pageObj.workspaceEl.clientWidth - wrapper.offsetWidth;
            const newLeft = Math.max(0, Math.min(maxLeft, startLeft + dx));
            const newTop = Math.max(0, startTop + dy);

            wrapper.style.left = `${newLeft}px`;
            wrapper.style.top = `${newTop}px`;

            elPosX.value = newLeft;
            elPosY.value = newTop;
            updatePageHeight(pageObj);
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        handle.addEventListener('mousedown', onMouseDown);
        if (isImage) {
            wrapper.addEventListener('mousedown', onMouseDown);
        }
    }

    // Универсальная функция создания элемента на активной странице
    function createCanvasElement(tagName, options = {}) {
        const targetPage = activePage || pages[0];
        const wrapper = document.createElement('div');
        wrapper.className = 'draggable-item';

        const defaultOffset = (elementCounter % 8) * 30 + 40;
        wrapper.style.left = `${options.left !== undefined ? options.left : defaultOffset}px`;
        wrapper.style.top = `${options.top !== undefined ? options.top : defaultOffset}px`;
        elementCounter++;

        const handle = document.createElement('div');
        handle.className = 'drag-handle';
        handle.textContent = '⠿';
        handle.title = 'Перетащить элемент';
        wrapper.appendChild(handle);

        const innerEl = document.createElement(tagName);
        innerEl.className = 'editable-content';

        if (tagName === 'img') {
            innerEl.src = options.src || 'https://placehold.co';
            innerEl.alt = 'Site image';
            wrapper.style.width = `${options.width || 300}px`;
            innerEl.addEventListener('load', () => updatePageHeight(targetPage));
        } else {
            innerEl.textContent = options.text || (tagName === 'h1' ? 'Введите заголовок...' : 'Введите текст...');
            innerEl.contentEditable = true;
            innerEl.style.outline = 'none';
            wrapper.style.width = `${options.width || (tagName === 'h1' ? 500 : 400)}px`;

            if (options.fontSize) innerEl.style.fontSize = `${options.fontSize}px`;
            if (options.color) innerEl.style.color = options.color;
            if (options.textAlign) innerEl.style.textAlign = options.textAlign;

            innerEl.addEventListener('input', () => updatePageHeight(targetPage));
        }

        wrapper.appendChild(innerEl);

        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            selectWrapper(wrapper, targetPage);
        });

        makeDraggable(wrapper, handle, tagName === 'img', targetPage);
        targetPage.workspaceEl.appendChild(wrapper);
        updatePageHeight(targetPage);

        return { wrapper, innerEl, pageObj: targetPage };
    }

    // Свободная Y-координата на активной странице
    function getNextSectionTop(pageObj) {
        let maxBottom = 40;
        pageObj.workspaceEl.querySelectorAll('.draggable-item').forEach(item => {
            const bottom = item.offsetTop + item.offsetHeight + 50;
            if (bottom > maxBottom) maxBottom = bottom;
        });
        return maxBottom;
    }

    // Одиночные элементы (H1, P, IMG)
    addButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tagName = button.getAttribute('data-tag');
            const { wrapper, innerEl, pageObj } = createCanvasElement(tagName);
            selectWrapper(wrapper, pageObj);
            if (tagName !== 'img') innerEl.focus();
        });
    });

    // Готовые стилизованные блоки (пресеты)
    document.querySelectorAll('.preset-btn').forEach(button => {
        button.addEventListener('click', () => {
            const preset = button.getAttribute('data-preset');
            const targetPage = activePage || pages[0];
            const startY = getNextSectionTop(targetPage);

            if (preset === 'text-left-img-right') {
                createCanvasElement('h1', {
                    left: 40,
                    top: startY + 20,
                    width: 440,
                    fontSize: 34,
                    color: '#0f172a',
                    text: 'Заголовок вашего проекта'
                });
                createCanvasElement('p', {
                    left: 40,
                    top: startY + 115,
                    width: 440,
                    fontSize: 16,
                    color: '#475569',
                    text: 'Здесь можно подробно рассказать о продукте, идее или услуге. Нажмите на любой текст, чтобы отредактировать его, или перетащите блок за ручку.'
                });
                const imgBlock = createCanvasElement('img', {
                    left: 520,
                    top: startY,
                    width: 400,
                    src: 'https://placehold.co'
                });
                selectWrapper(imgBlock.wrapper, targetPage);

            } else if (preset === 'img-left-text-right') {
                createCanvasElement('img', {
                    left: 40,
                    top: startY,
                    width: 400,
                    src: 'https://placehold.co'
                });
                const titleBlock = createCanvasElement('h1', {
                    left: 480,
                    top: startY + 20,
                    width: 440,
                    fontSize: 34,
                    color: '#0f172a',
                    text: 'Ключевое преимущество'
                });
                createCanvasElement('p', {
                    left: 480,
                    top: startY + 115,
                    width: 440,
                    fontSize: 16,
                    color: '#475569',
                    text: 'Чередование картинки слева и текста справа делает страницу визуально сбалансированной и удобной для чтения.'
                });
                selectWrapper(titleBlock.wrapper, targetPage);

            } else if (preset === 'hero-center') {
                const heroTitle = createCanvasElement('h1', {
                    left: 130,
                    top: startY + 20,
                    width: 700,
                    fontSize: 44,
                    color: '#0f172a',
                    textAlign: 'center',
                    text: 'Создайте свой сайт за пару минут'
                });
                createCanvasElement('p', {
                    left: 180,
                    top: startY + 135,
                    width: 600,
                    fontSize: 18,
                    color: '#64748b',
                    textAlign: 'center',
                    text: 'Готовый Django-проект с чистой статикой, шрифтами и вашими изображениями в одном архиве.'
                });
                selectWrapper(heroTitle.wrapper, targetPage);
            }
        });
    });

    // Точный ввод координат X и Y вручную
    elPosX.addEventListener('input', (e) => {
        if (selectedWrapper && activePage) {
            const val = Math.max(0, Math.min(activePage.workspaceEl.clientWidth - selectedWrapper.offsetWidth, parseInt(e.target.value) || 0));
            selectedWrapper.style.left = `${val}px`;
        }
    });

    elPosY.addEventListener('input', (e) => {
        if (selectedWrapper && activePage) {
            const val = Math.max(0, parseInt(e.target.value) || 0);
            selectedWrapper.style.top = `${val}px`;
            updatePageHeight(activePage);
        }
    });

    // Изменение стилей выбранного текста
    elTextColor.addEventListener('input', (e) => {
        if (selectedWrapper) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
            if (innerEl.tagName !== 'IMG') innerEl.style.color = e.target.value;
        }
    });

    elFontSize.addEventListener('input', (e) => {
        if (selectedWrapper && activePage) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
            if (innerEl.tagName !== 'IMG') {
                innerEl.style.fontSize = `${e.target.value}px`;
                updatePageHeight(activePage);
            }
        }
    });

    elTextWidth.addEventListener('input', (e) => {
        if (selectedWrapper && activePage) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
            if (innerEl.tagName !== 'IMG') {
                selectedWrapper.style.width = `${e.target.value}px`;
                updatePageHeight(activePage);
            }
        }
    });

    elTextAlign.addEventListener('change', (e) => {
        if (selectedWrapper) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
            if (innerEl.tagName !== 'IMG') {
                innerEl.style.textAlign = e.target.value;
            }
        }
    });

    // Изменение и загрузка картинок
    elImgUrl.addEventListener('input', (e) => {
        if (selectedWrapper && e.target.value.trim()) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
            if (innerEl.tagName === 'IMG') {
                innerEl.src = e.target.value.trim();
            }
        }
    });

    elImgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && selectedWrapper) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
 if (innerEl.tagName === 'IMG') {
                const reader = new FileReader();
                reader.onload = (event) => {
                    innerEl.src = event.target.result;
                    elImgUrl.value = '';
                };
                reader.readAsDataURL(file);
            }
        }
    });

    elImgWidth.addEventListener('input', (e) => {
        if (selectedWrapper && activePage) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
            if (innerEl.tagName === 'IMG') {
                selectedWrapper.style.width = `${e.target.value}px`;
                updatePageHeight(activePage);
            }
        }
    });

    // Удаление элемента
    deleteBtn.addEventListener('click', () => {
        if (selectedWrapper && activePage) {
            selectedWrapper.remove();
            clearElementSelection();
            updatePageHeight(activePage);
        }
    });

    // Управление модальным окном компиляции
    openModalBtn.addEventListener('click', () => {
        pages.forEach(p => updatePageHeight(p));
        dialog.showModal();
    });

    closeModalBtn.addEventListener('click', () => dialog.close());

    // Очистка и сбор JSON всех страниц перед отправкой на сервер
     compileForm.addEventListener('submit', () => {
        const compiledPages = pages.map((p, idx) => {
            const clone = p.workspaceEl.cloneNode(true);

            clone.querySelectorAll('.drag-handle').forEach(handle => handle.remove());

            clone.querySelectorAll('.draggable-item').forEach(wrapper => {
                wrapper.className = 'site-element';
            });

            clone.querySelectorAll('.editable-content').forEach(el => {
                el.removeAttribute('contenteditable');
                el.classList.remove('editable-content');
                if (el.classList.length === 0) {
                    el.removeAttribute('class');
                }
                if (el.style.outline === 'none') {
                    el.style.outline = '';
                }
                if (!el.getAttribute('style') || el.getAttribute('style').trim() === '') {
                    el.removeAttribute('style');
                }
            });

            const safeSlug = p.slug || (idx === 0 ? 'index' : `page${idx + 1}`);

            return {
                slug: safeSlug,
                title: safeSlug,
                bgColor: p.bgColor,
                fontFamily: p.fontFamily,
                height: p.height,
                html: clone.innerHTML.trim()
            };
        });

        pagesDataInput.value = JSON.stringify(compiledPages);
        dialog.close();
    });

    // Инициализируем первую страницу при загрузке
    createPage('index');
});