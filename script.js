//ФИО
const nameRegex = /^[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?(?:\s[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?){1,2}$/;
//телефон
const phoneRegex = /^(?:(?:\+7|8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\+996[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{3})$/;
//почта
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
//поля
const fields = [
    { id: "fio",   regex: nameRegex,  error: "Введите ФИО с заглавных букв, например: Хасанова Руфина Равильевна" },
    { id: "phone", regex: phoneRegex, error: "Формат: +996 123 456 789 или +996 123 45 67 89" },
    { id: "email", regex: emailRegex, error: "Введите почту в формате example@example.com" }
];
//проверка одного поля
function validateField(field) {
    const input = document.getElementById(field.id);
    const errorBox = document.getElementById(field.id + "-error");
    const ok = field.regex.test(input.value.trim());

    input.classList.toggle("invalid", !ok);
    input.classList.toggle("valid", ok);
    errorBox.textContent = ok ? "" : field.error;
    return ok;
}
const form = document.getElementById("register-form");
if (form) {
    //проверка прямо во время ввода
    fields.forEach(function (field) {
        document.getElementById(field.id).addEventListener("input", function () {
            validateField(field);
        });
    });
    //проверка при отправке формы
    form.addEventListener("submit", function (event) {
        event.preventDefault(); //не перезагружаем страницу
        const result = document.getElementById("form-result");
        //проверка всех полей
        const allOk = fields.map(validateField).every(Boolean);
        if (allOk) {
            result.textContent = "Готово! Добро пожаловать в Школу Монстров, " +
                                 document.getElementById("fio").value.trim() + "!";
            result.className = "form-result success";
            form.reset();
            fields.forEach(function (f) {
                document.getElementById(f.id).classList.remove("valid");
            });
        } else {
            result.textContent = "Исправьте поля, отмеченные красным.";
            result.className = "form-result fail";
            //неверные поля "трясутся"
            document.querySelectorAll('.reg-form input.invalid').forEach(function (input) {
                input.classList.remove('shake');
                void input.offsetWidth; //перезапуск анимации
                input.classList.add('shake');
            });
        }
    });
}

const DATA_URL = 'data.json';
const charGrid = document.getElementById('char-grid');
const detailSection = document.getElementById('detail-section');
const detailCard = document.getElementById('detail-card');
const closeBtn = document.getElementById('close-btn');

let charactersData = [];
let currentId = null; //id персонажа, открытого в модальном окне

//загрузка данных из JSON
async function loadCharacters() {
    if (!charGrid) return; //на других страницах списка нет
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

        charactersData = await response.json();
        renderCharactersList(charactersData);
    } catch (error) {
        console.error('Ошибка JSON', error);
        charGrid.innerHTML = '<p style="color: #ff6b6b;">Не удалось загрузить данные. Откройте сайт через Live Server.</p>';
    }
}
//список карточек
function renderCharactersList(characters) {
    charGrid.innerHTML = '';
    characters.forEach(character => {
        const card = document.createElement('div');
        card.className = `char-card ${character.cardClass}`;
        card.innerHTML = `
            <div class="char-img-stub"><img src="${character.image}" alt="${character.name}"></div>
            <h3>${character.name}</h3>
            <p>${character.title}</p>
            <button class="btn-more">Узнать больше</button>
        `;
        card.addEventListener('click', () => showCharacterDetail(character.id));
        charGrid.appendChild(card);
    });
    initCardTilt();   //анимация карточек мышкой
    initReveal();     //анимация появления
}
//модальное окно
//с какой стороны "влетает" карточка при листании стрелками
function showCharacterDetail(characterId, direction) {
    const character = charactersData.find(c => c.id === characterId);
    if (!character) return;
    currentId = characterId;

    const specsList = Object.entries(character.specs)
        .map(([key, value]) => `<li><strong>${key}: </strong>${value}</li>`)
        .join('');

    const slideClass = direction ? ' slide-' + direction : '';

    detailCard.innerHTML = `
        <div class="detail-layout ${character.cardClass}${slideClass}">
            <h2>${character.name}</h2>
            <img src="${character.image}" alt="${character.name}" class="detail-img">
            <p class="detail-title">${character.title}</p>
            <p class="detail-desc">${character.description}</p>
            <div class="detail-specs">
                <strong>О персонаже</strong>
                <ul>${specsList}</ul>
            </div>
            <button class="btn-fav">В избранное</button>
            <p class="modal-hint">← → листать персонажей, Esc — закрыть</p>
        </div>
    `;

    //кнопка "В избранное"
    const favBtn = detailCard.querySelector('.btn-fav');
    favBtn.addEventListener('click', () => addToFavorites(character.name, favBtn));

    detailSection.classList.remove('closing');
    detailSection.classList.remove('hidden'); //модалка (CSS-анимация открытия запускается сама)
}

//закрытие модального окна с анимацией
function closeModal() {
    if (!detailSection || detailSection.classList.contains('hidden')) return;
    detailSection.classList.add('closing');
    setTimeout(() => {
        detailSection.classList.add('hidden');
        detailSection.classList.remove('closing');
    }, 250); //столько же длится анимация закрытия в CSS
}

if (detailSection && closeBtn) {
    closeBtn.addEventListener('click', closeModal);
    detailSection.addEventListener('click', (e) => {
        if (e.target === detailSection) closeModal();
    });
}

//3D-наклон карточки за курсором
function initCardTilt() {
    document.querySelectorAll('.char-card').forEach(card => {
        if (card.dataset.tilt) return; //чтобы не навешивать дважды
        card.dataset.tilt = '1';

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.1s ease-out, box-shadow 0.3s';
        });
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;  //от -0.5 до 0.5
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform =
                `perspective(600px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) translateY(-6px) scale(1.03)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transition = '';   //возвращаем плавность из CSS
            card.style.transform = '';    //карточка возвращается на место
        });
    });
}

//"взрыв" сердечек и летучих мышей по кнопке "В избранное"
function addToFavorites(name, button) {
    button.textContent = 'Добавлено ♥';
    button.classList.add('added');

    const symbols = ['♥', '🦇', '♥', '🦇', '⚡', '♥', '🦇', '⚡'];
    symbols.forEach((symbol, i) => {
        const particle = document.createElement('span');
        particle.className = 'burst';
        particle.textContent = symbol;
        const angle = (Math.PI * 2 * i) / symbols.length;
        const distance = 60 + Math.random() * 30;
        particle.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
        button.appendChild(particle);
        setTimeout(() => particle.remove(), 900);
    });
}

//Esc закрывает окно, стрелки листают персонажей
document.addEventListener('keydown', (e) => {
    if (!detailSection || detailSection.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
        closeModal();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const index = charactersData.findIndex(c => c.id === currentId);
        if (index === -1) return;
        const step = e.key === 'ArrowRight' ? 1 : -1;
        const next = (index + step + charactersData.length) % charactersData.length;
        showCharacterDetail(charactersData[next].id, step === 1 ? 'right' : 'left');
    }
});

//плавное появление блоков + полоса прокрутки сверху
const progressBar = document.createElement('div');
progressBar.id = 'scroll-progress';
document.body.appendChild(progressBar);

//помечаем элементы, которые будут "выезжать" при прокрутке
function initReveal() {
    const items = document.querySelectorAll(
        '.char-card, main h2, .timeline-item, .video-item, .side-box, .news-banner, .rules-list li'
    );
    let delay = 0;
    items.forEach(el => {
        if (el.classList.contains('reveal')) return;
        el.classList.add('reveal');
        el.dataset.delay = (delay % 4) * 90; //небольшая задержка для эффекта "лесенкой"
        delay++;
    });
    checkReveal();
}
function checkReveal() {
    const limit = window.innerHeight * 0.92;
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        if (el.getBoundingClientRect().top < limit) {
            el.style.transitionDelay = (el.dataset.delay || 0) + 'ms';
            el.classList.add('visible');
            //убираем задержку, чтобы она не мешала hover-эффектам
            setTimeout(() => { el.style.transitionDelay = ''; }, 900);
        }
    });
}
window.addEventListener('scroll', () => {
    checkReveal();
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
});

document.addEventListener('DOMContentLoaded', () => {
    loadCharacters();
    initCardTilt(); //для статичных карточек (index.html, pets.html)
    initReveal();
});
