FROM node:18 

WORKDIR /excalidraw-room

COPY package.json yarn.lock ./
RUN yarn

COPY tsconfig.json ./
COPY . .

RUN yarn build

EXPOSE 3101
CMD ["yarn", "start:dev"]
