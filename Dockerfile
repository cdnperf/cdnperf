FROM node:4
RUN git clone https://github.com/bebraw/cdnperf
RUN cd api && npm install
EXPOSE 8090
CMD ["node", "/api/serve.js"]
