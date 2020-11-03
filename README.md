# music.loc
Этот сайт позволяет слушать музыку, искать музыку и сохранять музыку.
Все аудио треки парсятся с сайта https://zaycev.net/

Данный сайт предоставляет удобный аудиоплеер, который имеет все необходимые функции современного аудиоплеера

# Техническая реализация
Данный сайт представляет собой SPA приложение и написан он на PHP 7 + MySQL с применением JavaScript на клиентской части.
Песни парсятся с помощью PHP библиотеки simpleHTMLDOM.
Также имеются авторизация/регистрации с применением PHP сессий и cookies.
В базе данных используются полиморфные связи так как в будущем планируется расширение функционала.
Благодаря технологии AJAX сайт работает без перезагрузок
