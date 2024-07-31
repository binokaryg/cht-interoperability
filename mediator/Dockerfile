FROM node:18-alpine

WORKDIR /app

COPY . /app

RUN npm install

RUN npm run build

EXPOSE 9229

CMD ["npm", "run", "watch"]

EXPOSE 6000
