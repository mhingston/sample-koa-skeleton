FROM node:8
RUN apt-get update && apt-get install -y nano
RUN rm -r /var/cache/apt /var/lib/apt/lists
WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . .
RUN chown -R node:node /usr/src/app
EXPOSE 3000
ENV TINI_VERSION v0.16.1
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
USER node
ENTRYPOINT ["/tini", "--"]
CMD ["node", "app.js"]
