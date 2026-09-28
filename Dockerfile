# ---------- Этап 1: сборка ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Сначала копируем только манифесты — так кэш слоёв работает эффективнее
COPY package*.json ./

# Устанавливаем зависимости (npm ci быстрее и надёжнее для CI)
RUN npm ci

# Копируем весь исходный код
COPY . .

# Собираем проект (Vite положит результат в /app/dist)
RUN npm run build


# ---------- Этап 2: раздача статики ----------
FROM nginx:1.27-alpine AS runner

# Удаляем дефолтный конфиг nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем наш конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Забираем собранные файлы из первого этапа
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]