FROM node:4
RUN git clone https://github.com/bebraw/cdnperf
RUN cd cdnperf && npm install && npm run build
EXPOSE 8090
CMD ["node", "/cdnperf/serve.js"]
