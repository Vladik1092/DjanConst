document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace');
    const addButtons = document.querySelectorAll('.add-tag-btn');
    const dialog = document.getElementById('django-compiller');
    const openModalBtn = document.getElementById('open-compile-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const compileForm = document.getElementById('compile-form');
    const htmlInput = document.getElementById('html-content-input');

    // Элементы панели настроек страницы
    const pageBgInput = document.getElementById('page-bg-color');
    const pageFontSelect = document.getElementById('page-font-family');
    const extendCanvasBtn = document.getElementById('extend-canvas-btn');
    const hiddenBgInput = document.getElementById('hidden-bg-color');
    const hiddenFontInput = document.getElementById('hidden-font-family');
    const hiddenCanvasHeight = document.getElementById('hidden-canvas-height');

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

    let selectedWrapper = null;
    let elementCounter = 0;
    let extraManualHeight = 0;

    // 1. Настройка фона, шрифта и ручного удлинения страницы
    pageBgInput.addEventListener('input', (e) => {
        workspace.style.backgroundColor = e.target.value;
        hiddenBgInput.value = e.target.value;
    });

    pageFontSelect.addEventListener('change', (e) => {
        workspace.style.fontFamily = e.target.value;
        hiddenFontInput.value = e.target.value;
    });

    if (extendCanvasBtn) {
        extendCanvasBtn.addEventListener('click', () => {
            extraManualHeight += 300;
            updateWorkspaceHeight();
        });
    }

    // 2. Вспомогательная функция перевода RGB в HEX
    function rgbToHex(rgb) {
        if (!rgb || rgb.startsWith('#')) return rgb || '#000000';
        const match = rgb.match(/\d+/g);
        if (!match) return '#000000';
        return '#' + match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    }

    // Автоматически расширяем холст вниз по мере роста контента
    function updateWorkspaceHeight() {
        let maxBottom = 800 + extraManualHeight;
        workspace.querySelectorAll('.draggable-item').forEach(item => {
            const bottom = item.offsetTop + item.offsetHeight + 150;
            if (bottom > maxBottom) maxBottom = bottom;
        });
        workspace.style.height = `${maxBottom}px`;
        hiddenCanvasHeight.value = maxBottom;
    }

    // 3. Выделение элемента на холсте
    function selectWrapper(wrapper) {
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

    // 4. Логика свободного перетаскивания (Drag-and-Drop)
    function makeDraggable(wrapper, handle, isImage) {
        let isDragging = false;
        let startMouseX = 0;
        let startMouseY = 0;
        let startLeft = 0;
        let startTop = 0;

        const onMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectWrapper(wrapper);

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

            const maxLeft = workspace.clientWidth - wrapper.offsetWidth;
            const newLeft = Math.max(0, Math.min(maxLeft, startLeft + dx));
            const newTop = Math.max(0, startTop + dy);

            wrapper.style.left = `${newLeft}px`;
            wrapper.style.top = `${newTop}px`;

            elPosX.value = newLeft;
            elPosY.value = newTop;
            updateWorkspaceHeight();
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

    // 5. Универсальная функция создания элемента на холсте
    function createCanvasElement(tagName, options = {}) {
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
            innerEl.addEventListener('load', updateWorkspaceHeight);
        } else {
            innerEl.textContent = options.text || (tagName === 'h1' ? 'Введите заголовок...' : 'Введите текст...');
            innerEl.contentEditable = true;
            innerEl.style.outline = 'none';
            wrapper.style.width = `${options.width || (tagName === 'h1' ? 500 : 400)}px`;

            if (options.fontSize) innerEl.style.fontSize = `${options.fontSize}px`;
            if (options.color) innerEl.style.color = options.color;
            if (options.textAlign) innerEl.style.textAlign = options.textAlign;

            innerEl.addEventListener('input', updateWorkspaceHeight);
        }

        wrapper.appendChild(innerEl);

        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            selectWrapper(wrapper);
        });

        makeDraggable(wrapper, handle, tagName === 'img');
        workspace.appendChild(wrapper);
        updateWorkspaceHeight();

        return { wrapper, innerEl };
    }

    // Вычисляет свободную Y-координату ниже всех текущих блоков на холсте
    function getNextSectionTop() {
        let maxBottom = 40;
        workspace.querySelectorAll('.draggable-item').forEach(item => {
            const bottom = item.offsetTop + item.offsetHeight + 50;
            if (bottom > maxBottom) maxBottom = bottom;
        });
        return maxBottom;
    }

    // Одиночные элементы (H1, P, IMG)
    addButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tagName = button.getAttribute('data-tag');
            const { wrapper, innerEl } = createCanvasElement(tagName);
            selectWrapper(wrapper);
            if (tagName !== 'img') innerEl.focus();
        });
    });

    // Готовые стилизованные блоки (пресеты)
    document.querySelectorAll('.preset-btn').forEach(button => {
        button.addEventListener('click', () => {
            const preset = button.getAttribute('data-preset');
            const startY = getNextSectionTop();

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
                selectWrapper(imgBlock.wrapper);

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
                selectWrapper(titleBlock.wrapper);

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
                selectWrapper(heroTitle.wrapper);
            }
        });
    });

    // Снятие выделения при клике на пустое место холста
    workspace.addEventListener('click', () => {
        if (selectedWrapper) {
            selectedWrapper.classList.remove('selected-element');
            selectedWrapper = null;
        }
        noSelectionHint.classList.remove('hidden');
        positionControls.classList.add('hidden');
        textControls.classList.add('hidden');
        imageControls.classList.add('hidden');
        deleteBtn.classList.add('hidden');
    });

    // 6. Точный ввод координат X и Y вручную
    elPosX.addEventListener('input', (e) => {
        if (selectedWrapper) {
            const val = Math.max(0, Math.min(workspace.clientWidth - selectedWrapper.offsetWidth, parseInt(e.target.value) || 0));
            selectedWrapper.style.left = `${val}px`;
        }
    });

    elPosY.addEventListener('input', (e) => {
        if (selectedWrapper) {
            const val = Math.max(0, parseInt(e.target.value) || 0);
            selectedWrapper.style.top = `${val}px`;
            updateWorkspaceHeight();
        }
    });

    // 7. Изменение стилей выбранного текста
    elTextColor.addEventListener('input', (e) => {
        if (selectedWrapper) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
            if (innerEl.tagName !== 'IMG') innerEl.style.color = e.target.value;
        }
    });

    elFontSize.addEventListener('input', (e) => {
        if (selectedWrapper) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
            if (innerEl.tagName !== 'IMG') {
                innerEl.style.fontSize = `${e.target.value}px`;
                updateWorkspaceHeight();
            }
        }
    });

    elTextWidth.addEventListener('input', (e) => {
        if (selectedWrapper) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
            if (innerEl.tagName !== 'IMG') {
                selectedWrapper.style.width = `${e.target.value}px`;
                updateWorkspaceHeight();
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

    // 8. Изменение и загрузка картинок
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
        if (selectedWrapper) {
            const innerEl = selectedWrapper.querySelector('.editable-content');
            if (innerEl.tagName === 'IMG') {
                selectedWrapper.style.width = `${e.target.value}px`;
                updateWorkspaceHeight();
            }
        }
    });

    // 9. Удаление элемента
    deleteBtn.addEventListener('click', () => {
        if (selectedWrapper) {
            selectedWrapper.remove();
            selectedWrapper = null;
            noSelectionHint.classList.remove('hidden');
            positionControls.classList.add('hidden');
            textControls.classList.add('hidden');
            imageControls.classList.add('hidden');
            deleteBtn.classList.add('hidden');
            updateWorkspaceHeight();
        }
    });

    // 10. Управление модальным окном компиляции
    openModalBtn.addEventListener('click', () => {
        updateWorkspaceHeight();
        dialog.showModal();
    });

    closeModalBtn.addEventListener('click', () => dialog.close());

    // 11. Очистка и сбор HTML перед отправкой на сервер
    compileForm.addEventListener('submit', () => {
        const clone = workspace.cloneNode(true);

        clone.querySelectorAll('.drag-handle').forEach(handle => handle.remove());

        clone.querySelectorAll('.draggable-item').forEach(wrapper => {
            wrapper.className = 'site-element';
        });

        clone.querySelectorAll('.editable-content').forEach(el => {
            el.removeAttribute('contenteditable');
            el.classList.remove('editable-content');
            if (el.style.outline === 'none') {
                el.style.outline = '';
            }
        });

        htmlInput.value = clone.innerHTML.trim();
        dialog.close();
    });
});
