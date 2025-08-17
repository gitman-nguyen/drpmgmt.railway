# Giai đoạn 1: Build ứng dụng React
FROM node:16 as build
WORKDIR /usr/src/app

# Sao chép package.json của client trước để tận dụng cache
COPY client/package*.json ./client/ 
RUN cd client && npm install

# Sao chép toàn bộ source code của client
COPY client/ ./client/ 
RUN cd client && npm run build

# Giai đoạn 2: Build server Node.js
FROM node:16
WORKDIR /usr/src/app

# Sao chép package.json của server trước
COPY server/package*.json ./ 
RUN npm install

# Sao chép source code của server
COPY server/ . 

# Sao chép các file đã build từ giai đoạn 1
COPY --from=build /usr/src/app/client/build ./client/build

EXPOSE 3001
CMD [ "node", "server.js" ]
